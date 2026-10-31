'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const js=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const cut=(start,end)=>{const a=js.indexOf(start),b=js.indexOf(end,a);assert(a>=0&&b>a,start);return js.slice(a,b);};
const start='2026-10-26T00:00:00.000Z';
const st={field:'refc_ptype',hour:12,seq:1,ref:{init_time:start,id:start},difference:{token:1}};
const cx=vm.createContext({st,Math,Number,JSON,Date,Float32Array,Error,console,
 valid:(r,h)=>new Date(Date.parse(r.init_time)+h*3600000),cycleKey:t=>new Date(t).toISOString(),
 fmt:t=>new Date(t).toISOString(),pad3:n=>String(n).padStart(3,'0')});
vm.runInContext(js.slice(0,js.indexOf('const PTYPE_LABELS=')),cx);
vm.runInContext(cut('function timelineVariables(){','function syncUI(){'),cx);
vm.runInContext(cut('function choose(p,hourOverride=st.hour)','// A background forecast prefetch'),cx);
vm.runInContext(cut('// Virtual accumulation fields are derived from existing validated Zarr data.','async function chunk(src,ds,v,h,onProgress=()=>{},opts={})'),cx);
const varr=(name,hours)=>({name,shape:[85,2,3],available_hours:hours});
const ref={model:'rrfs',init_time:start,id:'rrfs_case',variables:[varr('refc',[12,13,14]),varr('ptype',[12,14]),varr('asnow',[24,48,72])]};
st.ref.entries=[{ds:ref}];st.sources=new Map([['rrfs',{datasets:[ref]}],['analysis',{datasets:[]}]]);
assert.deepEqual(Array.from(vm.runInContext('availableHours()',cx)),[12,14], 'reflectivity/Ptype overlap only');
assert.equal(vm.runInContext('choose({cfg:{source:"rrfs",run:"selected"}},12).v.name',cx),'refc');
st.field='snow24h';assert.deepEqual(Array.from(vm.runInContext('availableHours()',cx)),[24,48,72]);
const cases=st.sources.get('analysis').datasets;
function snow(hour,value){const valid=new Date(Date.parse(start)+hour*3600000).toISOString();
 const ds={product:'nohrsc_6h',init_time:valid,grid:{g:1},variables:[{...varr('snow6h',[0]),shape:[1,2,3]}],value};cases.push(ds);return ds;}
const s6=snow(6,1),s12=snow(12,2),s0=snow(0,100);
st.field='asnow';st.hour=12;
const panel={cfg:{source:'analysis',timeMode:'analysis'}};
cx.panel=panel;let selected=vm.runInContext('choose(panel)',cx);
assert.equal(selected.ds,s12);
assert.equal(selected.v.name,'snow6h');cx.selected=selected;
cx.getDisplayData=async(_,ds)=>new Float32Array(6).fill(ds.value);
(async()=>{
 const result=await vm.runInContext('getPanelDisplayData(panel,selected.ds,selected.v,0,{},()=>{},1)',cx);
 assert.deepEqual(Array.from(result),Array(6).fill(3),'exclude F000 pre-cycle snowfall');
 cases.splice(cases.indexOf(s6),1);
 const missing=vm.runInContext('choose(panel).error',cx);
 assert.match(missing,/missing 6-hour analyses/i);
 st.hour=0;assert.match(vm.runInContext('choose(panel).error',cx),/F006/);
 console.log('PASS virtual reflectivity hours + 24h forecast hours + strict six-hour NOHRSC running total');
})().catch(err=>{console.error(err);process.exitCode=1;});
