'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const ref='2026-10-31T00:00:00.000Z';
const st={field:'apcp3h',hour:6,seq:20,ref:{init_time:ref,id:ref},sources:new Map(),
  difference:{token:8},mrmsAccumCache:null,alignedAccumCache:null,alignedSource:{datasets:[]}};
const ctx={st,Date,Math,JSON,Number,Float32Array,console,
  valid:(r,h)=>new Date(Date.parse(r.init_time)+h*3600000),
  cycleKey:t=>new Date(t).toISOString(),fmt:t=>new Date(t).toISOString(),
  pad3:n=>String(n).padStart(3,'0')};
vm.createContext(ctx);
function section(a,b){const i=code.indexOf(a),j=code.indexOf(b,i);assert(i>=0&&j>i,'section '+a);vm.runInContext(code.slice(i,j),ctx);}
section('function choose(p,hourOverride=st.hour)','// A background forecast prefetch');
section('// Virtual accumulation fields are derived from existing validated Zarr data.','async function chunk(src,ds,v,h,onProgress=()=>{},opts={})');
section('async function alignedDisplayForAnalysis(panel,token)','async function updateDifferenceMap(token)');
const source={datasets:[],url:'https://example.test/catalog_analysis.json'};
st.sources.set('analysis',source);
const panel={cfg:{source:'analysis',timeMode:'analysis'},src:source};
const date=h=>new Date(Date.parse(ref)+h*3600000).toISOString();
function add(product,h,grid={name:product}){
 const ds={id:'analysis_'+product+'_'+h,init_time:date(h),product,grid,
           variables:[{name:'apcp',shape:[1,1,3],available_hours:[0]}]};
 source.datasets.push(ds);return ds;
}
const stage=new Map(),mrms=new Map();
for(let h=1;h<=6;h++){
 stage.set(h,add('stageiv_apcp',h));mrms.set(h,add('mrms_apcp',h));
}
ctx.FIELDS={apcp3h:{label:'3-hour precipitation'},apcp:{label:'Accumulated precipitation'}};
ctx.getDisplayData=async(src,ds)=>new Float32Array(ds.product==='stageiv_apcp'?[1,1,1]:[2,2,2]);
async function run(){
 let c=ctx.choose(panel);assert.equal(c.ds.product,'stageiv_apcp','complete Stage IV window takes precedence');
 let values=await ctx.getPanelDisplayData(panel,c.ds,c.v,0,ctx.FIELDS.apcp3h,()=>{},20);
 assert.deepEqual(Array.from(values),[3,3,3],'Stage IV sums never include MRMS values');
 const stageMissing=stage.get(5);source.datasets.splice(source.datasets.indexOf(stageMissing),1);
 c=ctx.choose(panel);assert.equal(c.ds.product,'mrms_apcp','missing Stage IV hour falls back to complete MRMS window');
 values=await ctx.getPanelDisplayData(panel,c.ds,c.v,0,ctx.FIELDS.apcp3h,()=>{},20);
 assert.deepEqual(Array.from(values),[6,6,6],'MRMS fallback is a consistent, complete interval');
 source.datasets.push(stageMissing);
 const prevGrid=stageMissing.grid;stageMissing.grid={name:'changed'};
 c=ctx.choose(panel);assert.equal(c.ds.product,'mrms_apcp','Stage IV grid mismatch is not mixed');
 stageMissing.grid=prevGrid;
 const mrmsMissing=mrms.get(4);source.datasets.splice(source.datasets.indexOf(mrmsMissing),1);
 source.datasets.splice(source.datasets.indexOf(stageMissing),1);
 c=ctx.choose(panel);assert.match(c.error,/missing hourly QPE/,'no fabricated mixed-source totals');
 source.datasets.push(stageMissing,mrmsMissing);
 st.field='apcp';st.hour=6;c=ctx.choose(panel);
 assert.equal(c.ds.product,'stageiv_apcp','running total also promotes only when fully covered');
 let requested=[];
 ctx.requireAlignedRecord=async(product,when,field)=>{
  requested.push([product,field]);return {src:source,ds:{product,grid:{g:1}},v:{name:'apcp'}};
 };
 st.field='apcp3h';
 const aligned=await ctx.alignedDisplayForAnalysis({ds:{product:'stageiv_apcp'}},8);
 assert.equal(requested.length,3);
 assert.ok(requested.every(([product,field])=>product==='stageiv_apcp'&&field==='apcp'),
  'difference-map input uses selected Stage IV only');
 assert.deepEqual(Array.from(aligned.data),[3,3,3]);
 st.field='apcp';
 requested=[];const running=await ctx.alignedDisplayForAnalysis({ds:{product:'stageiv_apcp'}},8);
 assert.equal(requested.length,7,'aligned running totals cover all six hours and the final source record');
 assert.deepEqual(Array.from(running.data),[6,6,6]);
 assert.match(code,/stageiv_apcp/);
 assert.match(code,/Stage IV/);
 console.log('PASS Stage IV priority, exact-hour fallback, grid consistency, and native/aligned difference consistency');
}
run().catch(err=>{console.error(err);process.exitCode=1;});
