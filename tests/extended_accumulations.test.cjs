'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const text=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
function part(begin,end){const a=text.indexOf(begin),b=text.indexOf(end,a);assert(a>=0&&b>a,'missing '+begin);return text.slice(a,b);}
const date='2026-10-27T00:00:00.000Z';
const st={field:'snow48h',hour:48,seq:11,ref:{init_time:date,id:date},difference:{token:7}};
const ctx={st,Math,JSON,Number,Date,Float32Array,console,valid:(r,h)=>new Date(Date.parse(r.init_time)+h*3600000),cycleKey:t=>new Date(t).toISOString(),fmt:t=>new Date(t).toISOString(),pad3:n=>String(n).padStart(3,'0')};
vm.createContext(ctx);
vm.runInContext(text.slice(0,text.indexOf('const PTYPE_LABELS=')),ctx);
ctx.FIELDS=vm.runInContext('FIELDS',ctx);
vm.runInContext(part('function choose(p,hourOverride=st.hour)','// A background forecast prefetch'),ctx);
vm.runInContext(part('// Virtual accumulation fields are derived from existing validated Zarr data.','async function chunk(src,ds,v,h,onProgress=()=>{},opts={})'),ctx);
vm.runInContext(part('function fieldInfo(v,requested=st.field,sourceModel=\'\')','// A raw Zarr chunk'),ctx);
vm.runInContext(part('async function alignedDisplayForAnalysis(panel,token)','async function updateDifferenceMap(token)'),ctx);
function variable(name,hours=[0]){return {name,shape:[Math.max(...hours)+1,1,3],available_hours:hours};}
const forecast={id:'rrfs',init_time:date,model:'rrfs',grid:{GRIB_Nx:3},variables:[variable('apcp',Array.from({length:61},(_,i)=>i)),variable('asnow',Array.from({length:61},(_,i)=>i))]};
const analysis={datasets:[]};ctx.st.sources=new Map([['rrfs',{datasets:[forecast]}],['analysis',analysis]]);
const src=ctx.st.sources.get('analysis');
function addProduct(end,product,field,grid={g:1},value=1){const ds={init_time:end.toISOString(),product,grid,variables:[variable(field)],value};analysis.datasets.push(ds);return ds;}
const end=new Date(Date.parse(date)+48*3600000),prior=new Date(Date.parse(date)+24*3600000);
const now=addProduct(end,'nohrsc_24h','snow24h',{g:1},2);
const old=addProduct(prior,'nohrsc_24h','snow24h',{g:1},3);
const snowPanel={cfg:{source:'analysis',timeMode:'analysis'}};
const fPanel={cfg:{source:'rrfs',run:'selected',timeMode:'forecast'}};
async function run(){
 const menu=ctx.fieldMenuEntries();const list=Array.from(menu,x=>x.key);
 for(const group of [['apcp1h','apcp3h','apcp6h','apcp24h','apcp48h','apcp'],['snow1h','snow3h','snow6h','snow24h','snow48h','asnow']]){
   for(let i=0;i<group.length-1;i++)assert(list.indexOf(group[i])<list.indexOf(group[i+1]),'menu ordering '+group[i]);
 }
 assert(!list.includes('snow72h'));
 assert.equal(ctx.FIELDS.asnow.label,'Accumulated snowfall');
 for(const n of [24,48])assert.equal(ctx.precipitationAccumulationHours(`apcp${n}h`),n);
 assert.equal(ctx.snowAccumulationHours('snow72h'),0);
 assert.equal(ctx.fieldInfo(variable('snow24h'),'snow48h').label,'48-hour snowfall');
 ctx.getDisplayData=async (_,ds,v,h)=>new Float32Array([ds.value,ds.value,NaN]);
 let c=ctx.choose(snowPanel);assert.equal(c.ds,now);assert.equal(c.v.name,'snow24h');
 let result=await ctx.getPanelDisplayData(snowPanel,c.ds,c.v,0,ctx.FIELDS.snow48h,()=>{},11);
 assert.deepEqual(Array.from(result.slice(0,2)),[5,5]);assert(Number.isNaN(result[2]));
 // NOHRSC 48h needs an earlier 24h. Never fall back to native 48h.
 const ix=analysis.datasets.indexOf(old);analysis.datasets.splice(ix,1);
 assert.match(ctx.choose(snowPanel).error,/preceding 24-hour analysis/);
 analysis.datasets.splice(ix,0,old);
 old.grid={g:2};
 await assert.rejects(ctx.nohrsc48hTotal(snowPanel,now,now.variables[0],ctx.FIELDS.snow48h,()=>{},11),/grids differ/);
 old.grid={g:1};
 st.hour=49;assert.match(ctx.choose(snowPanel).error,/valid only/);st.hour=47;assert.match(ctx.choose(snowPanel).error,/F048/);st.hour=48;
 // Models derive 48h windows from F48 (no F0 needed), and from Fh-F(h-48).
 st.field='snow48h';st.hour=49;let f=ctx.choose(fPanel);assert.equal(f.v.name,'asnow');
 ctx.getDisplayData=async (_,ds,v,h)=>new Float32Array([h,h*2,h*3]);
 let diff=await ctx.getPanelDisplayData(fPanel,forecast,f.v,49,ctx.FIELDS.snow48h,()=>{},11);
 assert.deepEqual(Array.from(diff),[48,96,144]);
 st.field='apcp24h';f=ctx.choose(fPanel);assert.equal(f.v.name,'apcp');
 diff=await ctx.getPanelDisplayData(fPanel,forecast,f.v,49,ctx.FIELDS.apcp24h,()=>{},11);
 assert.deepEqual(Array.from(diff),[24,48,72]);
 // MRMS exact-hour windows and strict missing hour detection.
 for(let h=1;h<=49;h++)addProduct(new Date(Date.parse(date)+h*3600000),'mrms_apcp','apcp',{g:1},1);
 st.field='apcp48h';st.hour=48;
 c=ctx.choose(snowPanel);assert.equal(c.ds.product,'mrms_apcp');
 ctx.getDisplayData=async ()=>new Float32Array([1,2,3]);
 result=await ctx.getPanelDisplayData(snowPanel,c.ds,c.v,0,ctx.FIELDS.apcp48h,()=>{},11);
 assert.deepEqual(Array.from(result),[48,96,144]);
 const missing=analysis.datasets.find(x=>x.product==='mrms_apcp'&&x.init_time===new Date(Date.parse(date)+15*3600000).toISOString());
 analysis.datasets.splice(analysis.datasets.indexOf(missing),1);
 assert.match(ctx.choose(snowPanel).error,/missing hourly QPE/);
 // Derived 48h NOHRSC also works for aligned model/analysis differences.
 st.hour=48;st.field='snow48h';st.alignedSource={datasets:[]};
 ctx.requireAlignedRecord=async (product,when,field)=>{assert.equal(product,'nohrsc_24h');assert.equal(field,'snow24h');return {src:{},ds:{grid:{g:1},value:new Date(when).getTime()===end.getTime()?2:3},v:variable('snow24h')};};
 ctx.getDisplayData=async(_,ds)=>new Float32Array([ds.value,ds.value+1,ds.value+2]);
 const aligned=await ctx.alignedDisplayForAnalysis({ds:{product:'nohrsc_24h'}},7);
 assert.deepEqual(Array.from(aligned.data),[5,7,9]);
 console.log('PASS: 24/48 precipitation, 48h NOHRSC two 24h grids, missing-input/UTC checks, menu ordering, and aligned differences');
}
run().catch(err=>{console.error(err);process.exitCode=1;});
