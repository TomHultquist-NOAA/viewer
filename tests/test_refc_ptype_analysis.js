#!/usr/bin/env node
// Standalone tests for analysis selection and cache-safe prefetch planning.
// No browser, network, or dependencies are required.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const body=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
function extract(from,to){
 const first=body.indexOf(from),last=body.indexOf(to,first+from.length);
 assert(first>=0&&last>first,`Missing source function marker ${from}`);
 return body.slice(first,last);
}
const vars={};
const F=()=>({});
const helpers={
 nativeGfsDifferenceFallback:()=>null,panelSelectedField:p=>p.cfg.field||'refc_ptype',
 DIFFERENCE_BLOCKED_FIELDS:new Set(['refc_ptype']),differenceFieldLabel:x=>x,
 FIELDS:{refc_ptype:{label:'Reflectivity with Ptype'},ptype:{label:'Precipitation type'}},
 fmt:x=>String(x),
 valid:(ref,h)=>new Date(Date.parse(ref.init_time)+h*3600000),
 cycleKey:t=>new Date(t).toISOString(),
 precipitationAccumulationHours:()=>0,snowAccumulationHours:()=>0,gfsSnowSpec:()=>null,
 nativeAnalysisPtypeVariable:(ds,h)=>ds.variables.find(x=>x.name==='ptype'&&x.available_hours.includes(h))||null,
 nativeNohrscSnowField:F,gfsObservedRecords:F,isGfsV16:()=>true,
 gfsSnowSource:F,gfsUsesSweChange:()=>false,
 pad3:n=>String(n).padStart(3,'0'),
 preferNativeGefsGrid:(data,ds)=>ds,
};
const selected=extract('function choose(p,hourOverride=st.hour)', '// Select an on-demand native-grid GFS difference');
const prefetch=extract('function prefetchContextKey()', 'function schedulePrefetch()');
const factory=new Function('ctx', 'const { '+Object.keys(helpers).join(',')+',st,touchGraphicsDevice,marineSurfaceWindAvailable,windComponentNames,heightVariableName,prefetchMode,nohrsc6hRecord,nohrsc24hRecord,precipitationSourcePlan,accumulationGridKey,stale} = ctx;\n'+selected+'\n'+prefetch+'\nreturn {choose,prefetchCandidates};');
const ds=(name,time,fields)=>({id:name+'-'+time,product:name,model:name,init_time:time,path:'store_'+name+'_'+time,
 grid:{GRIB_gridType:'lambert'},variables:fields.map(field=>({name:field,available_hours:[0],shape:[1,2,2]}))});
const A='2026-11-14T00:00:00.000Z',B='2026-11-14T06:00:00.000Z';
const rap=ds('rap_pressure',B,['ptype']);
const mrms=ds('mrms_refc',B,['refc']);
const gfs=ds('gfs_v16',B,['refc','ptype']);
const st={field:'refc_ptype',hour:6,ref:{id:A,init_time:A},modelSet:'rrfs-refs',
 primary:{id:'analysis'},sources:new Map(),cfg:{display:{prefetchHours:2,prefetchBehindHours:0}},
 panels:[],cache:new Map(),compressedInflight:new Map(),inflight:new Map(),
 prefetchSeenForFocus:new Set(),prefetchAttempted:new Map(),prefetchDirection:1,chunkStore:null};
const source=(id,datasets)=>({id,datasets,url:new URL('https://example.com/data/catalog_'+id+'.json')});
st.sources.set('analysis',source('analysis',[rap,mrms]));
st.sources.set('gfs_v16',source('gfs_v16',[gfs]));
const {choose,prefetchCandidates}=factory({...helpers,st,touchGraphicsDevice:()=>true,
 marineSurfaceWindAvailable:()=>false,windComponentNames:()=>null,
 heightVariableName:()=>null,prefetchMode:()=> 'disk',nohrsc6hRecord:F,nohrsc24hRecord:F,
 precipitationSourcePlan:()=>null,accumulationGridKey:F,stale:false});
const rrfsPanel={cfg:{source:'analysis',timeMode:'analysis',field:'refc_ptype'}};
let chosen=choose(rrfsPanel);
assert.equal(chosen.ds,rap);assert.equal(chosen.v.name,'ptype');
assert.equal(rrfsPanel.analysisRadar.ds,mrms);
assert.equal(rrfsPanel.analysisCategoricalOnly,false);
assert.equal(rrfsPanel.analysisRadar.src,st.sources.get('analysis'));
// Missing MRMS -> categorical RAP without fake reflectivity.
st.sources.get('analysis').datasets=[rap];
chosen=choose(rrfsPanel);
assert.equal(chosen.ds,rap);assert.equal(rrfsPanel.analysisRadar,null);
assert.equal(rrfsPanel.analysisCategoricalOnly,true);
// RAP with real native radar (on same grid) permits full native composite.
rap.variables.push({name:'refc',available_hours:[0],shape:[1,2,2]});
chosen=choose(rrfsPanel);
assert.equal(chosen.v.name,'refc');assert.equal(rrfsPanel.analysisNativeRadar.ptype.name,'ptype');
rap.variables.pop();
// GFS F000 analysis uses the appropriate valid-time init, not the selected run.
st.modelSet='gfs-versions';
const gfsPanel={cfg:{source:'gfs_v16',timeMode:'gfs-analysis',field:'refc_ptype'}};
chosen=choose(gfsPanel);
assert.equal(chosen.ds,gfs);assert.equal(chosen.v.name,'refc');assert.equal(chosen.h,0);
assert.equal(gfsPanel.analysisRadar,null);
// With MRMS available, both model sets receive the same valid-time radar.
st.sources.get('analysis').datasets=[rap,mrms];
chosen=choose(gfsPanel);
assert.equal(gfsPanel.analysisRadar.ds,mrms);
// F003 has no GFS F000 initialization; never silently substitute F003.
assert.match(choose({cfg:gfsPanel.cfg},3).error,/F000 analysis missing/);
// Prefetching must not mutate the live panel's selected source or radar state.
st.modelSet='rrfs-refs';st.hour=0;
const live={cfg:{source:'analysis',timeMode:'analysis',field:'refc_ptype'},analysisRadar:{sentinel:1},src:{id:'original'}};
st.panels=[{cfg:{source:'gfs_v16',field:'refc_ptype'}},live];
const urls=prefetchCandidates([0,6,12],true,4).map(c=>c.url);
assert(urls.some(url=>url.includes('store_mrms_refc')),'MRMS radar must appear in the first small mobile prefetch batch');
assert(urls.some(url=>url.includes('store_rap_pressure')),'RAP Ptype must also be prefetched');
assert.deepEqual(live.analysisRadar,{sentinel:1},'Background select must not overwrite live analysis state');
assert.equal(live.src.id,'original');
// GFS F000 composite should prefetch MRMS and both GFS source fields.
st.modelSet='gfs-versions';st.panels=[{cfg:{source:'gfs_v16',field:'refc_ptype'}},gfsPanel];
const gfUrls=prefetchCandidates([0,6,12],true,5).map(c=>c.url);
assert(gfUrls.some(url=>url.includes('store_mrms_refc')));
assert(gfUrls.some(url=>url.includes('/refc/0.0.0')));
assert(gfUrls.some(url=>url.includes('/ptype/0.0.0')));
console.log('PASS: RAP/MRMS + GFS/MRMS selection, native fallbacks, F000 time matching and safe composite prefetch.');

// Exercise the actual composite branch with a geographic sampler and with
// a simulated MRMS chunk failure after the catalog has already advertised it.
(async()=>{
 const prefix=extract('async function getPanelDisplayData(p,ds,v,h,m,onProgress,seq)', ' if(p.gfsNativeCompare){');
 const blend=extract('function blendReflectivityPtype(reflectivity,ptype)', 'function basePal(m,v)');
 const cached=new Map();
 let failMrms=false;
 const ctx={
  st, touchGraphicsDevice:()=>false, FIELDS:{refc:{},ptype:{}},panelSelectedField:helpers.panelSelectedField,
  displayKey:(src,ds,v)=>src.id+':'+ds.id+':'+v.name,
  displayCacheGet:key=>cached.get(key),displayCachePut:(key,value)=>cached.set(key,value),
  getDisplayData:async(src,ds,v)=>{
   if(src.id==='analysis'&&ds.product==='mrms_refc'){
    if(failMrms)throw Error('HTTP 404: radar chunk still publishing');
    return Float32Array.from([15,25,35,45]);
   }
   if(v.name==='refc')return Float32Array.from([18,28,38,48]);
   return Float32Array.from([1,2,3,4]);
  },
  readNativePtype:async()=>Float32Array.from([1,2,3,4]),
  gridFromDataset:()=>({getGridCoords:()=>({x:[0,1],y:[0,1]}),
   transform:(x,y)=>[x,y]}),
  apgl:{RawScalarField:class{constructor(grid,values){this.values=values;}sampleField(x,y){return this.values[y*2+x];}}},
 };
 const execute=new Function('ctx','const { '+Object.keys(ctx).join(',')+' } = ctx;\n'+blend+'\n'+prefix+'\n throw Error("Unexpected field path");\n}\nreturn getPanelDisplayData;')(ctx);
 st.seq=3;
 st.modelSet='rrfs-refs';
 const panel={cfg:{source:'analysis',timeMode:'analysis',field:'refc_ptype'},src:st.sources.get('analysis')};
 const selected=choose(panel,6);
 let result=await execute(panel,selected.ds,selected.v,0,{},()=>{},3);
 assert.deepEqual(Array.from(result),[15,105,195,285]);
 // A later repaint should reuse the cached aligned composite.
 result=await execute(panel,selected.ds,selected.v,0,{},()=>{},3);
 assert.deepEqual(Array.from(result),[15,105,195,285]);
 st.modelSet='gfs-versions';
 const modelPanel={cfg:{source:'gfs_v16',timeMode:'gfs-analysis',field:'refc_ptype'},src:null};
 let model=choose(modelPanel,6);
 result=await execute(modelPanel,model.ds,model.v,0,{},()=>{},3);
 assert.deepEqual(Array.from(result),[15,105,195,285]);
 cached.clear();failMrms=true;
 model=choose(modelPanel,6);
 result=await execute(modelPanel,model.ds,model.v,0,{},()=>{},3);
 assert.deepEqual(Array.from(result),[18,108,198,288]);
 assert.equal(modelPanel.analysisRadar,null,'Fallback must disclose that MRMS was not used');
 st.modelSet='rrfs-refs';
 const rapPanel={cfg:{source:'analysis',timeMode:'analysis',field:'refc_ptype'},src:null};
 const rapModel=choose(rapPanel,6);
 result=await execute(rapPanel,rapModel.ds,rapModel.v,0,{},()=>{},3);
 assert.deepEqual(Array.from(result),[1,2,3,4]);
 assert.equal(rapPanel.analysisCategoricalOnly,true,'RAP-only cannot be painted with reflectivity palette');
 console.log('PASS: MRMS/model alignment, composite cache, and late missing-radar fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
