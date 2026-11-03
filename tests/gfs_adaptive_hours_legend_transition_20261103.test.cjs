'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
function segment(start,end){const a=src.indexOf(start),b=src.indexOf(end,a);assert.ok(a>=0&&b>a,start);return src.slice(a,b);}
test('GFS hour selector uses 3-hourly increments, RRFS remains hourly',()=>{
 const script=segment('function forecastHourChoices(){','function syncUI(){');
 const st={modelSet:'gfs-versions',ref:{entries:[{ds:{variables:[{shape:[241,1,1]}]}}]},field:'mslp',hour:2};
 const opts=[];
 const el={fcstSelect:{replaceChildren(...values){opts.splice(0,opts.length,...values);}}};
 const ctx={st,el,Option:class{constructor(label,value){this.label=label;this.value=value;}},timelineVariables:()=>[{shape:[241,1,1]}],availableHours:()=>Array.from({length:81},(_,i)=>3*i),pad3:x=>String(x).padStart(3,'0')};
 vm.runInNewContext(script,ctx);
 ctx.refreshHours();assert.equal(opts.length,81);assert.equal(opts[0].value,0);assert.equal(opts[1].value,3);assert.equal(opts.at(-1).value,240);assert.equal(st.hour,3);
 st.modelSet='rrfs-refs';st.hour=2;ctx.refreshHours();assert.equal(opts[1].value,1);assert.equal(st.hour,2);
});
test('changing 700 hPa to MSLP cannot inherit stale difference panel variable',()=>{
 const script=segment('function differenceSharedPalette(){','function updateDifferenceSharedLegend(){');
 const st={modelSet:'gfs-versions',field:'mslp',panels:[{cfg:{differencePanel:true},v:{name:'t700'}}],ref:{entries:[{ds:{variables:[{name:'mslp',attrs:{}}]}}]}};
 const ctx={st,panelFieldInfo:(_p,v)=>({label:v.name+' difference',unit:'hPa'}),pal:(m,v)=>({colors:['#2044a1','#ffffff','#d42d31'],field:v.name}),legendTicks:(_m,v)=>[{label:v.name,pos:0}]};
 vm.runInNewContext(script,ctx);let result=ctx.differenceSharedPalette();
 assert.equal(result.v.name,'mslp');assert.equal(result.m.label,'mslp difference');assert.equal(result.palette.field,'mslp');
 st.field='t850';result=ctx.differenceSharedPalette();assert.equal(result.v.name,'t850','safe fallback even if catalog does not yet contain field');
 st.modelSet='rrfs-refs';assert.equal(ctx.differenceSharedPalette(),null,'only applies to GFS set');
});
test('dark-mode boundary colors consider field palette and difference panels separately',()=>{
 const script=segment('function themeColors(){','function mapStyle(){');
 const st={theme:'dark',field:'mslp'};
 const FIELDS={mslp:{bandColors:['#f6f7f1','#eeeeed','#122132']},t700:{copyColors:'t2m'},t2m:{colors:[[0,'#112034'],[.5,'#224466'],[1,'#e9edef']]}};
 const ctx={st,FIELDS};vm.runInNewContext(script,ctx);
 const mslp=ctx.liveGeographyInk();st.field='t700';const temp=ctx.liveGeographyInk();
 assert.notEqual(mslp.line,temp.line,'contrast follows selected field palette');
 const diff=ctx.liveGeographyInk({cfg:{differencePanel:true}});
 assert.ok(diff.boundaryCasing,'difference panel also has contextual outlining');
 st.theme='light';assert.equal(ctx.themeColors().ocean,'#ffffff');
});
