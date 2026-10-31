/* Run: node tests/intervals.test.cjs -- no external dependencies. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const text=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
function part(start,end){const a=text.indexOf(start),b=text.indexOf(end,a);assert(a>=0&&b>a,'extract '+start);return text.slice(a,b);}
const fixtureStart='2026-10-29T00:00:00Z';
const st={field:'apcp3h',hour:6,seq:1,ref:{init_time:fixtureStart,id:new Date(fixtureStart).toISOString()},sources:new Map()};
const valid=(ref,h)=>new Date(Date.parse(ref.init_time)+h*3600000);
const pad3=h=>String(h).padStart(3,'0');
const ctx={st,valid,pad3,cycleKey:t=>new Date(t).toISOString(),fmt:t=>new Date(t).toISOString(),console,Float32Array,Math,Date,JSON,Number};
vm.createContext(ctx);
// Evaluates only the pure accumulation helpers and selection function, not
// window/MapLibre, so this runs on any WCOSS2-friendly workstation with Node.
vm.runInContext(part('function choose(p,hourOverride=st.hour)','// A background forecast prefetch'),ctx);
vm.runInContext(part('// Virtual accumulation fields are derived from existing validated Zarr data.','async function chunk(src,ds,v,h,onProgress=()=>{},opts={})'),ctx);
ctx.FIELDS={apcp1h:{label:'1-hour precipitation',unit:'in'},apcp3h:{label:'3-hour precipitation',unit:'in'},apcp6h:{label:'6-hour precipitation',unit:'in'},apcp:{label:'Accumulated precipitation',unit:'in'}};
vm.runInContext(part('function fieldInfo(v,requested=st.field,sourceModel=\'\')','// A raw Zarr chunk'),ctx);
vm.runInContext(part('async function alignedDisplayForAnalysis(panel,token)','async function updateDifferenceMap(token)'),ctx);
for(const [key,n] of [['apcp1h',1],['apcp3h',3],['apcp6h',6]])assert.equal(ctx.precipitationAccumulationHours(key),n);
for(const [key,n] of [['snow1h',1],['snow3h',3],['snow6h',6],['snow24h',24]])assert.equal(ctx.snowAccumulationHours(key),n);
assert.equal(ctx.snowAccumulationHours('apcp3h'),0);
for(const n of [1,3,6]){
 assert.equal(ctx.fieldInfo({name:'apcp',attrs:{probability_matched_mean:true}},`apcp${n}h`,'refs_mean').label,`PMM ${n}-hour precipitation`);
 assert.equal(ctx.fieldInfo({name:'apcp',attrs:{}},`apcp${n}h`,'refs_mean').label,`${n}-hour precipitation · legacy ensemble mean`);
}
const ds={id:'rrfs_20261029_00',init_time:fixtureStart,model:'rrfs',grid:{k:1},variables:[
 {name:'apcp',available_hours:Array.from({length:25},(_,i)=>i),shape:[25,1,3]},
 {name:'asnow',available_hours:Array.from({length:25},(_,i)=>i),shape:[25,1,3]}
]};
const model={datasets:[ds]};const analysis={datasets:[]};st.sources.set('rrfs',model);st.sources.set('analysis',analysis);
const p={cfg:{source:'rrfs',run:'selected',timeMode:'forecast'}};
async function run(){
 const raw={apcp:{0:[0,0,0],1:[1,2,3],2:[2,4,6],3:[4,7,10],4:[7,10,15],5:[9,12,19],6:[12,17,25]},asnow:{0:[0,0,0],1:[.1,.2,.3],2:[.2,.5,.6],3:[.4,.8,1],4:[.7,1,1.5],5:[.9,1.2,1.9],6:[1.2,1.7,2.5]}};
 ctx.getDisplayData=async (src,ds,v,h)=>new Float32Array(raw[v.name][h]||[h,h,h]);
 for(const [field,h,prev] of [['apcp1h',6,5],['apcp3h',6,3],['apcp6h',6,0],['snow1h',6,5],['snow3h',6,3],['snow6h',6,0]]){
  st.field=field;st.hour=h;
  const chosen=ctx.choose(p);assert.equal(chosen.v.name,field.startsWith('apcp')?'apcp':'asnow',field);
  const result=await ctx.getPanelDisplayData(p,ds,chosen.v,h,{},()=>{},1);
  const expected=raw[chosen.v.name][6].map((x,i)=>x-raw[chosen.v.name][prev][i]);
  for(let i=0;i<3;i++)assert(Math.abs(result[i]-expected[i])<1e-5,field+' cell '+i);
  st.hour=Number(field.match(/\d+/)[0])-1;
  assert.match(ctx.choose(p).error,/requires F|needs F/i,'must not make a partial interval '+field);
 }
 // Model fields are not restricted to synoptic-hour analyses; 6h snowfall
 // at F007 is valid if F001/F007 total exist.
 st.field='snow6h';st.hour=7;
 assert.equal(ctx.choose(p).h,7);
 // Missing predecessor forecast chunk must block the interval.
 const saved=ds.variables[0].available_hours;
 ds.variables[0].available_hours=saved.filter(h=>h!==3);
 st.field='apcp3h';st.hour=6;
 assert.match(ctx.choose(p).error,/F003/);
 ds.variables[0].available_hours=saved;
 // Build exact valid-hour MRMS sample catalog.
 for(let h=1;h<=8;h++){
  const stamp=valid(st.ref,h).toISOString();
  analysis.datasets.push({init_time:stamp,product:'mrms_apcp',grid:{k:1},variables:[{name:'apcp',available_hours:[0],shape:[1,1,3]}],i:h});
 }
 st.field='apcp3h';st.hour=6;
 const a={cfg:{source:'analysis',timeMode:'analysis'}};
 let chosen=ctx.choose(a);assert.equal(chosen.ds.product,'mrms_apcp');
 ctx.getDisplayData=async(src,record)=>new Float32Array([record.i,record.i+1,record.i+2]);
 const arr=await ctx.getPanelDisplayData(a,chosen.ds,chosen.v,0,{},()=>{},1);
 assert.deepEqual(Array.from(arr),[4+5+6,5+6+7,6+7+8]);
 st.field='apcp6h';st.hour=6;
 chosen=ctx.choose(a);assert.equal(chosen.ds.product,'mrms_apcp');
 const six=await ctx.getPanelDisplayData(a,chosen.ds,chosen.v,0,{},()=>{},1);
 assert.deepEqual(Array.from(six),[21,27,33]);
 analysis.datasets.splice(1,1); // F002 missing
 assert.match(ctx.choose(a).error,/missing hourly QPE/);
 st.field='snow1h';assert.match(ctx.choose(a).error,/No independent 1-hour snowfall analysis/);
 st.field='snow3h';assert.match(ctx.choose(a).error,/No independent 3-hour snowfall analysis/);
 // NOHRSC availability is restricted by actual valid times; model fields are not.
 const aSnow={cfg:{source:'analysis',timeMode:'analysis'}};
 analysis.datasets.push({init_time:valid(st.ref,6).toISOString(),product:'nohrsc_6h',variables:[{name:'snow6h',available_hours:[0],shape:[1,1,3]}]});
 st.field='snow6h';st.hour=6;assert.equal(ctx.choose(aSnow).ds.product,'nohrsc_6h');
 st.hour=7;assert.match(ctx.choose(aSnow).error,/valid only/);
 // Missing mask and physically questionable decreases are not turned positive.
 // Aligned difference samples must sum the same hourly valid-time QPEs.
 st.alignedSource={datasets:[]};st.difference={token:9};st.field='apcp3h';st.hour=6;
 ctx.requireAlignedRecord=async (product,when,field)=>{
  assert.equal(product,'mrms_apcp');assert.equal(field,'apcp');
  const h=Math.round((Date.parse(when)-Date.parse(st.ref.init_time))/3600000);
  return {src:{},ds:{grid:{k:1},hour:h},v:{name:'apcp'},hour:h};
 };
 ctx.getDisplayData=async(src,ds)=>new Float32Array([ds.hour,ds.hour+1]);
 const aligned=await ctx.alignedDisplayForAnalysis({ds:{product:'mrms_apcp'}},9);
 assert.deepEqual(Array.from(aligned.data),[15,18]);
 st.field='apcp6h';const aligned6=await ctx.alignedDisplayForAnalysis({ds:{product:'mrms_apcp'}},9);
 assert.deepEqual(Array.from(aligned6.data),[21,27]);
 const diff=ctx.differenceAccumulations(new Float32Array([3,2,NaN,-1e10]),new Float32Array([1,3,1,-1e10]));
 assert.equal(diff[0],2);assert(Number.isNaN(diff[1]));assert(Number.isNaN(diff[2]));assert(Number.isNaN(diff[3]));
 console.log('PASS: interval mapping, PMM/legacy titles, source matching, MRMS completeness, model 1/3/6-h, aligned difference sums, NOHRSC hours and invalid-data checks');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
