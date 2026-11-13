/* OMD EVU surface-low trajectories, algorithm-version-aware.
 * Geographical line/point overlays use compact derived metadata; no additional
 * browser GRIB or Zarr field downloads, no assumptions about native grids.
 * Attribution: algorithm and source details travel with the JSON payload.
 */
(function(global){
 'use strict';
 const COLORS=['#f8d85c','#65d6e3','#fd8c6b','#b99cf6','#85d67c','#fa88c5','#f5b85e'];
 const cache=new Map();
 const TTL=75*1000;
 const empty=()=>({type:'FeatureCollection',features:[]});
 const numeric=n=>Number.isFinite(Number(n))?Number(n):NaN;
 function endpoint(p){return Array.isArray(p?.points)&&p.points.length? p.points:null;}
 function normalizeLon(lon){return ((Number(lon)+180)%360+360)%360-180;}
 function validPoint(p){return Number.isFinite(numeric(p?.lat))&&Math.abs(numeric(p.lat))<=90&&Number.isFinite(numeric(p?.lon))&&Number.isFinite(numeric(p?.mslp_hpa))&&Number.isFinite(Date.parse(p?.time));}
 function splitAtDateLine(points){
  const segments=[];let current=[];
  for(const point of points){
   const pos=[normalizeLon(point.lon),Number(point.lat)];
   if(current.length){
    const last=current.at(-1);
    if(Math.abs(pos[0]-last[0])>180){
     const exit=last[0]>0?180:-180;
     const unwrapped=pos[0]+(exit>0?360:-360);
     const ratio=(exit-last[0])/(unwrapped-last[0]);
     const lat=last[1]+(pos[1]-last[1])*ratio;
     current.push([exit,lat]);
     if(current.length>=2)segments.push(current);
     current=[[-exit,lat]];
    }
   }
   current.push(pos);
  }
  if(current.length>=2)segments.push(current);
  return segments;
 }
 function featuresFromTracks(payload,opts={}){
  const lower=opts.lowerTime?Date.parse(opts.lowerTime):-Infinity;
  const upper=opts.upperTime?Date.parse(opts.upperTime):Infinity;
  const sourceLabel=String(opts.label||payload?.model||payload?.source_id||'Analysis');
  const features=[];
  (payload?.tracks||[]).forEach((track,ti)=>{
   const all=endpoint(track);
   if(!all)return;
   const pts=all.filter(p=>validPoint(p)&&Date.parse(p.time)>=lower&&Date.parse(p.time)<=upper)
    .sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
   if(!pts.length)return;
   const color=COLORS[(ti+Number(opts.colorOffset||0))%COLORS.length];
   const qualification=track.confirmed===true?'confirmed':track.confirmed===false?'candidate':'legacy';
   const minIdx=pts.reduce((i,p,j)=>numeric(p.mslp_hpa)<numeric(pts[i].mslp_hpa)?j:i,0);
   for(const line of splitAtDateLine(pts))features.push({type:'Feature',geometry:{type:'LineString',coordinates:line},
    properties:{kind:'line',color,track_id:track.id,source:sourceLabel,qualification}});
   for(let i=0;i<pts.length;i++){
    const pt=pts[i],time=Date.parse(pt.time),hour=+new Date(time).getUTCHours();
    const edge=i===0||i===pts.length-1,important=edge||i===minIdx;
    // Every *position* is retained; labels are selectively suggested.
    // MapLibre collision avoidance is the final arbiter at a given zoom.
    const interval=hour%6===0 && new Date(time).getUTCMinutes()===0;
    const rank=important?3:interval?1:0;
    features.push({type:'Feature',geometry:{type:'Point',coordinates:[normalizeLon(pt.lon),numeric(pt.lat)]},properties:{
     kind:'point',color,track_id:track.id,source:sourceLabel,qualification,
     time:pt.time,lat:numeric(pt.lat),lon:normalizeLon(pt.lon),mslp_hpa:numeric(pt.mslp_hpa),
     label:`${Math.round(numeric(pt.mslp_hpa))}`,label_icon:'evu-low-pressure-'+Math.round(numeric(pt.mslp_hpa)),priority:rank,
     edge:edge?1:0,minimum:i===minIdx?1:0
    }});
   }
  });
  return {type:'FeatureCollection',features};
 }
 async function gfsF000Sources(opts){
  // The analysis panel uses a sequence of independent GFSv16 F000 runs.
  // Never use GFS forecast-hour tracks as a surrogate for an analysis.
  const url=new URL('catalog.json',opts.baseUrl).href;
  const old=cache.get(url);
  let catalog;
  if(old&&Date.now()-old.timestamp<TTL)catalog=old.data;
  else{
   const response=await fetch(url,{cache:'no-store'});
   if(!response.ok)throw Error('Low-track catalog HTTP '+response.status);
   catalog=await response.json();
   if(!Array.isArray(catalog?.datasets))throw Error('Invalid low-track catalog');
   cache.set(url,{timestamp:Date.now(),data:catalog});
  }
  const lower=Date.parse(opts.lowerTime),upper=Date.parse(opts.upperTime);
  const available=(catalog.datasets||[]).filter(d=>d.model==='gfs_v16'&&
   Number.isFinite(Date.parse(d.init_time))&&Date.parse(d.init_time)>=lower&&Date.parse(d.init_time)<=upper);
  // Old catalogs may not include coverage metadata. They are still readable,
  // while new catalogs avoid fetching known-unprocessed F000 records.
  const eligible=available.filter(d=>!Array.isArray(d.processed_hours)||d.processed_hours.includes(0));
  return {sources:eligible.sort((a,b)=>Date.parse(a.init_time)-Date.parse(b.init_time))
   .map(d=>({file:d.source_id+'.json',label:'GFSv16 F000 analysis'})),
   knownCycles:available.length,processedCycles:eligible.length};
 }
 async function fetchJson(url){
  const old=cache.get(url);if(old&&Date.now()-old.timestamp<TTL)return old.data;
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok){const e=new Error('Low-track data HTTP '+response.status+' for '+url);e.status=response.status;throw e;}
  const json=await response.json();
  if(!json||!Array.isArray(json.tracks))throw new Error('Invalid low-track product: '+url);
  cache.set(url,{timestamp:Date.now(),data:json});
  if(cache.size>70){for(const key of [...cache.keys()].slice(0,cache.size-60))cache.delete(key);}
  return json;
 }
 function layerNames(panel){return ['evu-low-lines-'+panel.i,'evu-low-markers-'+panel.i,'evu-low-labels-'+panel.i,'evu-low-small-labels-'+panel.i];}
 function sourceName(panel){return 'evu-low-tracks-'+panel.i;}
 function remove(panel){
  if(panel)panel.lowTracksSeq=(panel.lowTracksSeq||0)+1;
  const map=panel?.map;
  if(!map)return;
  const src=sourceName(panel);
  try{if(map.getSource(src))map.getSource(src).setData(empty());
  }catch(e){console.warn('Low-track overlay cleanup:',e);}
  panel.lowTracksReady=false;
 }
 // Icons are generated locally. The basemap is intentionally glyph-server-free,
 // so native text-field symbols would otherwise disappear from map and exports.
 function ensurePressureIcons(map,features){
  const labels=new Set(features.filter(f=>f.properties?.kind==='point').map(f=>f.properties.label));
  for(const label of labels){
   if(!/^\d{3,4}$/.test(label))continue;
   const name='evu-low-pressure-'+label;
   if(map.hasImage(name))continue;
   const canvas=document.createElement('canvas');canvas.width=84;canvas.height=38;
   const ctx=canvas.getContext('2d');
   ctx.fillStyle='rgba(10,29,43,.92)';ctx.strokeStyle='#dfecfa';ctx.lineWidth=1.7;
   ctx.beginPath();if(ctx.roundRect)ctx.roundRect(1.2,1.2,81.6,35.6,9);else ctx.rect(1.2,1.2,81.6,35.6);
   ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 22px Arial';
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,42,19.6);
   map.addImage(name,ctx.getImageData(0,0,84,38),{pixelRatio:2});
  }
 }
 function install(panel){
  const map=panel.map,src=sourceName(panel);
  if(map.getSource(src))return;
  map.addSource(src,{type:'geojson',data:empty()});
  const [lines,markers,labels,small]=layerNames(panel);
  map.addLayer({id:lines,type:'line',source:src,filter:['==',['get','kind'],'line'],
   paint:{'line-color':['get','color'],'line-width':2.6,
    'line-opacity':['case',['==',['get','qualification'],'candidate'],.72,.93]}});
  map.addLayer({id:markers,type:'circle',source:src,filter:['==',['get','kind'],'point'],
   paint:{'circle-color':['get','color'],'circle-radius':['case',['==',['get','edge'],1],5.0,3.35],
    'circle-stroke-color':'#17252b','circle-stroke-width':1.25,'circle-opacity':1}});
  // Only important positions at overview zoom; intermediate labels unlock
  // when zoomed in. Collision checking keeps labels apart at hourly cadence.
  map.addLayer({id:labels,type:'symbol',source:src,
   filter:['all',['==',['get','kind'],'point'],['>=',['get','priority'],3]],
   layout:{'icon-image':['get','label_icon'],'icon-offset':[0,-1.45],'icon-anchor':'bottom',
    'icon-allow-overlap':false,'symbol-sort-key':['-',5,['get','priority']]}});
  map.addLayer({id:small,type:'symbol',source:src,minzoom:6.3,
   filter:['all',['==',['get','kind'],'point'],['==',['get','priority'],1]],
   layout:{'icon-image':['get','label_icon'],'icon-offset':[0,-1.25],'icon-anchor':'bottom',
    'icon-allow-overlap':false}});
  // Listener belongs to the map and survives setData but is removed with map.
  if(!map.__evuLowTracksClickBound){
   map.__evuLowTracksClickBound=true;
   map.on('click',markers,e=>{
    const f=e.features?.[0];if(!f)return;
    const p=f.properties||{};
    const pressure=Number(p.mslp_hpa);
    const safeTime=String(p.time||'').replace(/[<>&]/g,'');
    const safeSource=String(p.source||'').replace(/[<>&]/g,'');
    const safeTrack=String(p.track_id||'').replace(/[<>&]/g,'');
    const classification=p.qualification==='confirmed'?'Confirmed (24+ hours)':
     p.qualification==='candidate'?'Short-lived candidate (unconfirmed)':'Legacy track (unclassified)';
    new global.maplibregl.Popup({closeButton:true,maxWidth:'260px'})
     .setLngLat(e.lngLat).setHTML('<strong>'+safeSource+' low</strong><div>'+safeTime+
       '</div><div>'+pressure.toFixed(1)+' hPa</div><div>'+Number(p.lat).toFixed(2)+'°, '+
       Number(p.lon).toFixed(2)+'°</div><div>'+classification+'</div><small>Track '+safeTrack+'</small>').addTo(map);
   });
   map.on('mouseenter',markers,()=>{map.getCanvas().style.cursor='pointer';});
   map.on('mouseleave',markers,()=>{map.getCanvas().style.cursor='';});
  }
 }
 async function show(panel, opts){
  const seq=(panel.lowTracksSeq||0)+1;panel.lowTracksSeq=seq;
  const map=panel?.map;if(!map)return {status:'pending'};
  try{
   let requests=opts.sources||[], f000=null;
   if(opts.autoGFSF000){
    f000=await gfsF000Sources(opts);
    requests=f000.sources;
   }
   if(panel.map!==map||panel.lowTracksSeq!==seq)return {status:'stale'};
   if(!requests.length){
    install(panel);
    map.getSource(sourceName(panel)).setData(empty());
    panel.lowTracksReady=true;
    return {status:f000?.knownCycles?'incomplete':'unavailable',points:0,
     coverage:{processedCount:0,expectedCount:f000?.knownCycles||0,complete:false}};
   }
   const chunks=await Promise.all(requests.map(async (source,i)=>{
    try{
     const payload=await fetchJson(new URL(source.file,opts.baseUrl).href);
     return {data:featuresFromTracks(payload,{...opts,label:source.label,colorOffset:i*2}),
      payload,error:null,file:source.file};
    }catch(e){return {data:empty(),payload:null,error:String(e?.message||e),httpStatus:e?.status||null,file:source.file};}
   }));
   if(panel.map!==map||panel.lowTracksSeq!==seq)return {status:'stale'};
   install(panel);
   const features=chunks.flatMap(c=>c.data.features);
   ensurePressureIcons(map,features);
   map.getSource(sourceName(panel)).setData({type:'FeatureCollection',features});
   panel.lowTracksReady=true;
   const n=features.filter(f=>f.properties?.kind==='point').length;
   const failed=chunks.filter(c=>c.error),failures=failed.map(c=>c.error);
   const missingOnly=failed.length>0&&failed.every(c=>c.httpStatus===404);
   let processedCount=0,expectedCount=0,complete=true;
   if(opts.autoGFSF000){
    processedCount=chunks.filter(c=>c.payload).length;
    expectedCount=Number.isFinite(Date.parse(opts.lowerTime))&&Number.isFinite(Date.parse(opts.upperTime))?
     Math.floor((Date.parse(opts.upperTime)-Date.parse(opts.lowerTime))/(6*3600000))+1:(f000?.knownCycles||0);
    complete=processedCount>=expectedCount&&expectedCount>0;
   }else for(const chunk of chunks){
    const payload=chunk.payload;
    if(!payload){complete=false;continue;}
    const processed=Array.isArray(payload.processed_hours)?payload.processed_hours:null;
    if(Number.isInteger(opts.requestedHour)){
     processedCount+=processed?processed.filter(h=>h>=0&&h<=opts.requestedHour).length:0;
     const expected=Array.isArray(opts.expectedHours)&&opts.expectedHours.length?
       opts.expectedHours:[opts.requestedHour];
     expectedCount+=expected.length;
     // Older payloads did not report coverage; do not imply their F-hour
     // has been checked just because no centers were serialized.
     if(!processed||!expected.every(h=>processed.includes(h)))complete=false;
    }else{
     const times=Array.isArray(payload.processed_valid_times)?payload.processed_valid_times:null;
     processedCount+=times?times.filter(t=>Date.parse(t)>=Date.parse(opts.lowerTime)&&
      Date.parse(t)<=Date.parse(opts.upperTime)).length:0;
     expectedCount+=Number.isFinite(Date.parse(opts.lowerTime))&&Number.isFinite(Date.parse(opts.upperTime))?
      Math.floor((Date.parse(opts.upperTime)-Date.parse(opts.lowerTime))/3600000)+1:0;
     if(!times||processedCount<expectedCount)complete=false;
    }
   }
   const coverage={processedCount,expectedCount,complete};
   const status=failed.length===requests.length?(missingOnly?'unavailable':'error'):
     failed.length?'partial':!complete?'incomplete':n?'ready':'empty';
   return {status,points:n,coverage,filesLoaded:chunks.length-failed.length,
    filesRequested:requests.length,errors:failures,
    missingFiles:failed.filter(c=>c.httpStatus===404).map(c=>c.file),
    failedFiles:failed.map(c=>c.file)};
  }catch(error){return {status:'error',error:String(error?.message||error)};}
 }
 global.EVULowTracks={show,remove,featuresFromTracks,splitAtDateLine};
})(window);
