/* OMD EVU sounding-profile adapter — Converter v1.3.0 Zarr v2.
 * Uses the native fields actually published for each model/hour. Missing native
 * levels stay missing; there is no vertical interpolation or manufactured Td.
 * Profile grids are sampled at their own reduced horizontal resolution.
 */
(()=>{
 'use strict';
 const CATALOG='data/catalog_profiles.json';
 const CATALOG_TTL=90*1000;
 const MAX_CHUNKS=12;
 let cachedCatalog=null,catalogAt=0,catalogPending=null;
 const metaCache=new Map(),chunkCache=new Map(),chunkPending=new Map();
 const good=(v)=>Number.isFinite(v)&&Math.abs(v)<1e9;
 function iso(v){const t=Date.parse(v);return Number.isFinite(t)?new Date(t).toISOString():null;}
 function chooseRecord(catalog,model,cycle,hour){
  if(!catalog||catalog.schema!=='omd-evu-sounding-profile-1'||!Array.isArray(catalog.datasets))return null;
  const c=iso(cycle),h=Number(hour);
  if(!c||!Number.isInteger(h)||h<0)return null;
  return catalog.datasets.find(d=>d.model===model&&iso(d.init_time)===c&&
   Array.isArray(d.available_hours)&&d.available_hours.includes(h)&&
   typeof d.path==='string'&&/^sounding_(rrfs|hrrr|refs_mean|refs_m00[1-5]|rap_analysis)_\d{8}_\d{4}\.zarr$/.test(d.path))||null;
 }
 async function getJSON(path){
  const r=await fetch(new URL(path,document.baseURI),{cache:'no-cache'});
  if(!r.ok)throw new Error(`Profile HTTP ${r.status}: ${path}`);
  return r.json();
 }
 async function catalog(){
  if(cachedCatalog&&Date.now()-catalogAt<CATALOG_TTL)return cachedCatalog;
  if(catalogPending)return catalogPending;
  catalogPending=getJSON(CATALOG).then(cat=>{
   if(cat.schema!=='omd-evu-sounding-profile-1'||!Array.isArray(cat.datasets))throw Error('Unrecognized sounding profile catalog');
   cachedCatalog=cat;catalogAt=Date.now();return cat;
  }).finally(()=>{catalogPending=null;});
  return catalogPending;
 }
 async function metadata(path){
  if(metaCache.has(path))return metaCache.get(path);
  const inflight=Promise.all([getJSON(`data/${path}/.zattrs`),getJSON(`data/${path}/t/.zarray`)]).then(([attrs,array])=>{
   const sh=array.shape,ch=array.chunks;
   if(!Array.isArray(sh)||sh.length!==4||!Array.isArray(ch)||ch.length!==4||
      ch[0]!==1||ch[1]!==sh[1]||ch[2]!==sh[2]||ch[3]!==sh[3]||
      array.dtype!=='<f4'||array.order!=='C'||array.compressor?.id!=='zlib'||
      attrs.grid_order!=='WE:SN'||!Array.isArray(attrs.pressure_levels_hpa)||
      attrs.pressure_levels_hpa.length!==sh[1])throw Error('Incompatible sounding-profile Zarr metadata');
   // The catalog's `grid` describes the full-resolution source. The store's
   // .zattrs contains the *strided* grid necessary for geographic sampling.
   const grid=gridFromDataset({grid:attrs},{shape:[1,sh[2],sh[3]]});
   return {attrs,shape:sh,grid,pressure:attrs.pressure_levels_hpa};
  }).catch(e=>{metaCache.delete(path);throw e;});
  metaCache.set(path,inflight);return inflight;
 }
 async function chunk(path,name,h,shape){
  const key=`data/${path}/${name}/${h}.0.0.0`;
  if(chunkCache.has(key)){
   const value=chunkCache.get(key);chunkCache.delete(key);chunkCache.set(key,value);return value;
  }
  if(chunkPending.has(key))return chunkPending.get(key);
  const job=(async()=>{
   const response=await fetch(new URL(key,document.baseURI));
   if(!response.ok)throw new Error(`Profile HTTP ${response.status}: ${key}`);
   if(typeof DecompressionStream!=='function')throw Error('Browser does not support native Zarr decompression');
   const stream=response.body.pipeThrough(new DecompressionStream('deflate'));
   const buf=await new Response(stream).arrayBuffer();
   const expected=shape[1]*shape[2]*shape[3]*4;
   if(buf.byteLength!==expected)throw Error(`Invalid profile chunk size (${buf.byteLength}; expected ${expected})`);
   const result=new Float32Array(buf);
   chunkCache.set(key,result);
   while(chunkCache.size>MAX_CHUNKS)chunkCache.delete(chunkCache.keys().next().value);
   return result;
  })();
  chunkPending.set(key,job);
  try{return await job;}finally{chunkPending.delete(key);}
 }
 async function load({model,cycle,hour,lon,lat}){
  let cat;
  try{cat=await catalog();}catch(e){
   return {status:'unavailable',reason:'Profile catalog is not published or accessible',detail:String(e)};
  }
  const ds=chooseRecord(cat,model,cycle,hour);
  if(!ds)return {status:'unavailable',reason:'No published profile for this cycle and hour'};
  const {attrs,shape,grid,pressure}=await metadata(ds.path);
  if(shape[0]<=hour)throw Error('Profile forecast hour outside stored dimensions');
  const vars=Array.isArray(ds.variables)?ds.variables.map(v=>v.name):[];
  const wanted=['t','td','u','v'].filter(v=>vars.includes(v));
  if(!wanted.includes('t'))throw Error('Temperature not present in profile catalog');
  const values=await Promise.all(wanted.map(v=>chunk(ds.path,v,hour,shape)));
  const data=Object.fromEntries(wanted.map((v,i)=>[v,values[i]]));
  const size=shape[2]*shape[3];
  const rows=pressure.map((p,i)=>{
   const row={p,t:null,td:null,u:null,v:null};
   for(const name of wanted){
    const slice=data[name].subarray(i*size,(i+1)*size);
    const sampled=Number(new apgl.RawScalarField(grid,slice).sampleField(lon,lat));
    if(!good(sampled))continue;
    if(name==='t'||name==='td'){
     if(sampled>=150&&sampled<=360)row[name]=sampled-273.15;
    }else if(sampled>=-250&&sampled<=250){row[name]=sampled;}
   }
   return row;
  }).filter(r=>Number.isFinite(r.p)&&r.p>=100&&r.p<=1050);
  const numT=rows.filter(r=>good(r.t)).length;
  const numTd=rows.filter(r=>good(r.td)).length;
  const numWind=rows.filter(r=>good(r.u)&&good(r.v)).length;
  return {status:'available',rows,model:ds.model,cycle:ds.init_time,hour,
   gridKm:Number(attrs.grid_spacing_km)||null,levels:{temperature:numT,dewpoint:numTd,wind:numWind},
   ensembleMethod:ds.ensemble_method||null};
 }
 window.EVUSoundingProfiles={load,chooseRecord};
})();
