/* OMD EVU surface-low trajectories, algorithm-version-aware.
 * Geographical line/point overlays use compact derived metadata; no additional
 * browser GRIB or Zarr field downloads, no assumptions about native grids.
 * Attribution: algorithm and source details travel with the JSON payload.
 */
(function(global){
 'use strict';
 // The host viewer passes its *actual* displayed MSLP palette, including
 // user-selected colorbar ranges and imported .pal color curves. These stops
 // provide a safe fallback for standalone consumers of featuresFromTracks().
 const FALLBACK_STOPS=[[950,'#630718'],[960,'#930d20'],[966,'#d10c21'],
  [972,'#f82d19'],[978,'#ff7b16'],[984,'#ffc52c'],[990,'#f2ed1f'],
  [996,'#b7eb08'],[1002,'#58e822'],[1008,'#10de78'],[1014,'#08d7cf'],
  [1020,'#1ea4e8'],[1026,'#2372ed'],[1032,'#363bd9'],[1038,'#6e36dc'],
  [1044,'#bc42df'],[1050,'#f3acd1']];
 function colorForPressure(value,palette){
  const pressure=numeric(value),levels=palette?.levels,colors=palette?.colors;
  if(Array.isArray(levels)&&Array.isArray(colors)&&levels.length===colors.length+1&&
      colors.length&&Number.isFinite(pressure)){
   if(pressure<=levels[0])return colors[0];
   if(pressure>=levels[levels.length-1])return colors[colors.length-1];
   let low=0,high=colors.length-1;
   while(low<=high){const mid=(low+high)>>1;
    if(pressure<levels[mid])high=mid-1;
    else if(pressure>=levels[mid+1])low=mid+1;
    else return colors[mid];
   }
   return colors[Math.max(0,Math.min(colors.length-1,low))];
  }
  if(!Number.isFinite(pressure))return '#8f9eac';
  if(pressure<=FALLBACK_STOPS[0][0])return FALLBACK_STOPS[0][1];
  if(pressure>=FALLBACK_STOPS[FALLBACK_STOPS.length-1][0])return FALLBACK_STOPS[FALLBACK_STOPS.length-1][1];
  const n=FALLBACK_STOPS.findIndex(stop=>pressure<=stop[0]);
  const [a,ca]=FALLBACK_STOPS[n-1], [b,cb]=FALLBACK_STOPS[n],ratio=(pressure-a)/(b-a);
  return '#'+[1,3,5].map(i=>Math.round(parseInt(ca.slice(i,i+2),16)*(1-ratio)+
   parseInt(cb.slice(i,i+2),16)*ratio).toString(16).padStart(2,'0')).join('');
 }
 const cache=new Map();
 const TTL=75*1000;
 const empty=()=>({type:'FeatureCollection',features:[]});
 const numeric=n=>Number.isFinite(Number(n))?Number(n):NaN;
 // Do not mix surviving experimental v1/v2 JSON with current official gettrk
 // forecast tracks. Catalogs and RZDM intentionally retain older study files.
 const OFFICIAL_ALGORITHM_PREFIX='ncep-gfdl-gettrk-';
 function isOfficialTrackPayload(payload){
  return typeof payload?.algorithm==='string'&&
   payload.algorithm.startsWith(OFFICIAL_ALGORITHM_PREFIX)&&
   payload.not_official_emc_tracker!==true;
 }
 function isDiagnosticF000Payload(payload){
  return payload?.schema==='omd-evu-f000-low-centers-1'&&
   payload?.source_kind==='analysis_f000'&&
   (payload?.source==='rap_surface'||payload?.source==='gfs_v16')&&
   Array.isArray(payload?.snapshots);
 }
 function endpoint(p){return Array.isArray(p?.points)&&p.points.length? p.points:null;}
 function haversineKm(a,b){
  const lat1=Number(a.lat)*Math.PI/180,lat2=Number(b.lat)*Math.PI/180;
  const dlat=lat2-lat1,dlon=(((Number(b.lon)-Number(a.lon)+540)%360)-180)*Math.PI/180;
  const q=Math.sin(dlat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlon/2)**2;
  return 12742*Math.atan2(Math.sqrt(Math.max(0,q)),Math.sqrt(Math.max(0,1-q)));
 }
 // These are NOT official gettrk trajectories. They are one-to-one,
 // temporally ordered associations of independent F000 synoptic low centers.
 // Never cross an unavailable F000 timestamp or interpolate future positions.
 function stitchF000Centers(payload,opts={}){
  if(!isDiagnosticF000Payload(payload))throw Error('Invalid F000 diagnostic center metadata');
  const lower=Date.parse(opts.lowerTime),upper=Date.parse(opts.upperTime);
  if(!Number.isFinite(lower)||!Number.isFinite(upper)||lower>upper)
   throw Error('Invalid F000 analysis cycle window');
  const cadence=payload.source==='gfs_v16'?6:1,stepMs=cadence*3600000;
  const all=(payload.snapshots||[]).filter(r=>Number.isFinite(Date.parse(r.time))&&
   Date.parse(r.time)>=lower&&Date.parse(r.time)<=upper)
   .sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
  const tracks=[];let next=1;let previousTime=null,seenTimes=new Set();
  for(const snapshot of all){
   const timestamp=Date.parse(snapshot.time);
   if(seenTimes.has(timestamp))continue;seenTimes.add(timestamp);
   const centers=(Array.isArray(snapshot.points)?snapshot.points:[]).filter(p=>
    Number.isFinite(Number(p.lat))&&Math.abs(Number(p.lat))<=90&&
    Number.isFinite(Number(p.lon))&&Number.isFinite(Number(p.mslp_hpa))&&
    Number(p.mslp_hpa)>880&&Number(p.mslp_hpa)<1100);
   const previous=(previousTime!==null&&timestamp-previousTime===stepMs)?
    tracks.filter(t=>Date.parse(t.points.at(-1)?.time)===previousTime):[];
   const edges=[];
   for(let i=0;i<previous.length;i++)for(let j=0;j<centers.length;j++){
    const prior=previous[i].points.at(-1),center=centers[j];
    const distance=haversineKm(prior,center),change=Math.abs(prior.mslp_hpa-center.mslp_hpa);
    if(distance<=110*cadence+65&&change<=Math.max(16,4.5*cadence))
     edges.push([distance+9*change,i,j]);
   }
   edges.sort((a,b)=>a[0]-b[0]);
   const occupiedOld=new Set(),occupiedNew=new Set();
   for(const [,i,j] of edges){
    if(occupiedOld.has(i)||occupiedNew.has(j))continue;
    occupiedOld.add(i);occupiedNew.add(j);
    previous[i].points.push({...centers[j],time:snapshot.time,forecast_hour:0});
   }
   for(let j=0;j<centers.length;j++)if(!occupiedNew.has(j))
    tracks.push({id:'f000-'+payload.source+'-'+String(next++).padStart(5,'0'),
     points:[{...centers[j],time:snapshot.time,forecast_hour:0}]});
   previousTime=timestamp;
  }
  tracks.forEach(t=>{const points=t.points;t.confirmed=points.length>1&&
   (Date.parse(points.at(-1).time)-Date.parse(points[0].time))>=86400000;});
  return {schema:payload.schema,algorithm:'evu-f000-analysis-stitch-v1',
   source_kind:'analysis_f000',source_id:payload.source,
   model:payload.source,init_time:opts.lowerTime,tracks,
   snapshot_times:[...seenTimes].sort((a,b)=>a-b).map(t=>new Date(t).toISOString()),
   cadence_hours:cadence,source_algorithm:payload.algorithm};
 }

 function normalizeLon(lon){return ((Number(lon)+180)%360+360)%360-180;}
 function validPoint(p){return Number.isFinite(numeric(p?.lat))&&Math.abs(numeric(p.lat))<=90&&Number.isFinite(numeric(p?.lon))&&Number.isFinite(numeric(p?.mslp_hpa))&&Number.isFinite(Date.parse(p?.time));}
 function withinDomain(point,bounds){
  if(!bounds)return true;
  const raw=Number(point.lon),lat=Number(point.lat);
  if(!Number.isFinite(raw)||!Number.isFinite(lat))return false;
  const lon=((raw%360)+360)%360;
  if(bounds.type==='polygon'){
   const ring=bounds.coordinates||[];
   if(ring.length<3)return false;
   // Unwrap to the polygon's first vertex so -180/+180 and 0/360 are
   // handled consistently. Native regional grids do not span 180 degrees.
   const anchor=Number(ring[0][0]);
   const unwrap=x=>anchor+(((Number(x)-anchor+540)%360+360)%360)-180;
   const x=unwrap(lon);
   let inside=false;
   for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const x1=unwrap(ring[i][0]),y1=Number(ring[i][1]);
    const x2=unwrap(ring[j][0]),y2=Number(ring[j][1]);
    if(![x1,y1,x2,y2].every(Number.isFinite))return false;
    // Include points numerically on the boundary (up to ~10 metres).
    const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;
    if(l2>0){const t=Math.max(0,Math.min(1,((x-x1)*dx+(lat-y1)*dy)/l2));
     const xx=x1+t*dx,yy=y1+t*dy;
     if(Math.hypot(x-xx,lat-yy)<0.0001)return true;}
    if((y1>lat)!==(y2>lat) && x < (x2-x1)*(lat-y1)/(y2-y1)+x1)inside=!inside;
   }
   return inside;
  }
  let west=Number(bounds.west),east=Number(bounds.east);
  const south=Number(bounds.south),north=Number(bounds.north);
  if(![west,east,south,north].every(Number.isFinite))return true;
  if(east<west)east+=360;
  if(east-west>=359.999)return lat>=south&&lat<=north;
  while(west<0){west+=360;east+=360;}
  while(west>=360){west-=360;east-=360;}
  return (lon>=west&&lon<=east || lon+360>=west&&lon+360<=east)&&lat>=south&&lat<=north;
 }
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
  if(!isOfficialTrackPayload(payload)&&payload?.algorithm!=='evu-f000-analysis-stitch-v1')return empty();
  const lower=opts.lowerTime?Date.parse(opts.lowerTime):-Infinity;
  const upper=opts.upperTime?Date.parse(opts.upperTime):Infinity;
  const sourceLabel=String(opts.label||payload?.model||payload?.source_id||'Analysis');
  const features=[];
  (payload?.tracks||[]).forEach((track,ti)=>{
   const all=endpoint(track);
   if(!all)return;
   const timed=all.filter(p=>validPoint(p)&&Date.parse(p.time)>=lower&&Date.parse(p.time)<=upper)
    .sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
   if(!timed.length)return;
   // Only show a low when the tracker still has a valid fix at the current
   // displayed time. A past fix is not evidence that the cyclone survived;
   // never extrapolate or leave a stale track on the map. Use actual UTC
   // timestamps, not forecast-hour labels (which can differ among models).
   const activeAt=Date.parse(opts.activeTime||opts.upperTime||'');
   if(!opts.showHistory&&Number.isFinite(activeAt)&&Date.parse(timed[timed.length-1].time)!==activeAt)return;
   // An official fix beyond the displayed native field envelope is not a
   // visible fix. Crucially, don't join across out-of-domain gaps, either.
   const segments=[];let current=[];
   for(const point of timed){
    if(withinDomain(point,opts.domainBounds))current.push(point);
    else if(current.length){segments.push(current);current=[];}
   }
   if(current.length)segments.push(current);
   const pts=segments.flat();
   if(!pts.length||!withinDomain(timed[timed.length-1],opts.domainBounds))return;
   // One line color for the minimum pressure *so far*, never for a future fix.
   const minPressure=Math.min(...pts.map(p=>numeric(p.mslp_hpa)));
   const color=colorForPressure(minPressure,opts.palette);
   const qualification=track.confirmed===true?'confirmed':track.confirmed===false?'candidate':'legacy';
   const minIdx=pts.reduce((i,p,j)=>numeric(p.mslp_hpa)<numeric(pts[i].mslp_hpa)?j:i,0);
   for(const segment of segments)for(const line of splitAtDateLine(segment))
    features.push({type:'Feature',geometry:{type:'LineString',coordinates:line},
     properties:{kind:'line',color,min_mslp_hpa:minPressure,track_id:track.id,source:sourceLabel,qualification}});
   for(let i=0;i<pts.length;i++){
    const pt=pts[i],edge=i===0||i===pts.length-1;
    const latest=i===pts.length-1;
    features.push({type:'Feature',geometry:{type:'Point',coordinates:[normalizeLon(pt.lon),numeric(pt.lat)]},properties:{
     kind:'point',color:colorForPressure(pt.mslp_hpa,opts.palette),track_id:track.id,
     source:sourceLabel,qualification,algorithm:String(payload?.algorithm||'unknown'),
     time:pt.time,lat:numeric(pt.lat),lon:normalizeLon(pt.lon),mslp_hpa:numeric(pt.mslp_hpa),
     edge:edge?1:0,latest:latest?1:0,minimum:i===minIdx?1:0
    }});
   }
  });
  return {type:'FeatureCollection',features};
 }
 async function fetchJson(url){
  const old=cache.get(url);if(old&&Date.now()-old.timestamp<TTL)return old.data;
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok){const e=new Error('Low-track data HTTP '+response.status+' for '+url);e.status=response.status;throw e;}
  const json=await response.json();
  if(!json||(!Array.isArray(json.tracks)&&!isDiagnosticF000Payload(json)))throw new Error('Invalid low-track product: '+url);
  cache.set(url,{timestamp:Date.now(),data:json});
  if(cache.size>70){for(const key of [...cache.keys()].slice(0,cache.size-60))cache.delete(key);}
  return json;
 }
 function layerNames(panel){return ['evu-low-lines-'+panel.i,'evu-low-markers-'+panel.i];}
 function sourceName(panel){return 'evu-low-tracks-'+panel.i;}
 function remove(panel){
  if(panel)panel.lowTracksSeq=(panel.lowTracksSeq||0)+1;
  panel?.lowTrackPopup?.remove();
  if(panel)panel.lowTrackPopup=null;
  const map=panel?.map;
  if(!map)return;
  const src=sourceName(panel);
  try{if(map.getSource(src))map.getSource(src).setData(empty());
  }catch(e){console.warn('Low-track overlay cleanup:',e);}
  panel.lowTracksReady=false;
  panel.lowTrackFeatures=[];panel.view?.classList.remove('has-low-tracks');
  if(panel.lowTrackCanvas){panel.lowTrackCanvas.style.display='none';
   const c=panel.lowTrackCanvas;c.getContext('2d')?.clearRect(0,0,c.width,c.height);}
 }
 // The contour canvas, wind barbs and city overlay are DOM canvases ABOVE
 // MapLibre's framebuffer. A second, purely visual track canvas is therefore
 // necessary to keep the path/markers above them on screen AND in exports.
 // Native MapLibre layers remain beneath for hit-testing and map interaction.
 function paintCanvas(panel){
  const map=panel?.map,canvas=panel?.lowTrackCanvas;
  if(!map||!canvas)return;
  const w=map.getCanvas().clientWidth||map.getContainer().clientWidth;
  const h=map.getCanvas().clientHeight||map.getContainer().clientHeight;
  if(!(w>0&&h>0))return;
  const mapCanvas=map.getCanvas();
  const ratio=Math.max(1,Math.min(4,Number(mapCanvas.width)/w||global.devicePixelRatio||1));
  const dw=Math.max(1,Math.round(w*ratio)),dh=Math.max(1,Math.round(h*ratio));
  if(canvas.width!==dw)canvas.width=dw;
  if(canvas.height!==dh)canvas.height=dh;
  canvas.style.width=w+'px';canvas.style.height=h+'px';
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
  const features=panel.lowTrackFeatures||[];
  if(!features.length){canvas.style.display='none';return;}
  canvas.style.display='block';
  ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
  for(const f of features){
   if(f.properties?.kind!=='line')continue;
   const coords=f.geometry?.coordinates;if(!Array.isArray(coords)||coords.length<2)continue;
   ctx.beginPath();let count=0;
   for(const coord of coords){const p=map.project(coord);
    if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
    if(!count++)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
   }
   if(count<2)continue;
   ctx.globalAlpha=.73;ctx.lineJoin='round';ctx.lineCap='round';
   ctx.lineWidth=5.2;ctx.strokeStyle='#f1f6fc';ctx.stroke();
   ctx.globalAlpha=.90;ctx.lineWidth=4.2;ctx.strokeStyle='#10212e';ctx.stroke();
   ctx.globalAlpha=f.properties.qualification==='candidate'?.78:1;
   ctx.lineWidth=2.8;ctx.strokeStyle=f.properties.color;ctx.stroke();
  }
  ctx.globalAlpha=1;
  for(const f of features){
   if(f.properties?.kind!=='point')continue;
   const p=map.project(f.geometry.coordinates);
   if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x< -12||p.x>w+12||p.y< -12||p.y>h+12)continue;
   const latest=f.properties.latest===1,edge=f.properties.edge===1;
   const r=latest?5.5:edge?4.9:3.35;
   ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);
   ctx.fillStyle=f.properties.color;ctx.fill();
   ctx.strokeStyle=latest?'#f7fbff':'#17252b';ctx.lineWidth=latest?1.6:1.25;ctx.stroke();
  }
  ctx.restore();
 }
 function requestPaint(panel){
  if(panel.lowTrackPaintPending)return;
  panel.lowTrackPaintPending=true;
  global.requestAnimationFrame(()=>{panel.lowTrackPaintPending=false;paintCanvas(panel);});
 }
 function bringToTop(map,panel){
  for(const layer of layerNames(panel))if(map.getLayer(layer))map.moveLayer(layer);
 }
 function install(panel){
  const map=panel.map,src=sourceName(panel);
  if(map.getSource(src))return;
  map.addSource(src,{type:'geojson',data:empty()});
  const [lines,markers]=layerNames(panel);
  map.addLayer({id:lines,type:'line',source:src,filter:['==',['get','kind'],'line'],
   paint:{'line-color':['get','color'],'line-width':2.8,
    'line-opacity':['case',['==',['get','qualification'],'candidate'],.72,.93]}});
  map.addLayer({id:markers,type:'circle',source:src,filter:['==',['get','kind'],'point'],
   paint:{'circle-color':['get','color'],
    'circle-radius':['case',['==',['get','latest'],1],5.5,['==',['get','edge'],1],4.9,3.35],
    'circle-stroke-color':['case',['==',['get','latest'],1],'#f7fbff','#17252b'],
    'circle-stroke-width':['case',['==',['get','latest'],1],1.6,1.25],'circle-opacity':1}});
  // No pressure-value symbols: only the colored path and circle markers.
  bringToTop(map,panel);
  if(!map.__evuLowTracksPaintBound){
   map.__evuLowTracksPaintBound=true;
   map.on('move',()=>requestPaint(panel));
   map.on('resize',()=>requestPaint(panel));
   map.on('idle',()=>requestPaint(panel));
  }
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
    const official=String(p.algorithm||'').startsWith('ncep-gfdl-gettrk-');
    const f000=String(p.algorithm||'')==='evu-f000-analysis-stitch-v1';
    const classification=f000?'F000 synoptic-center association (diagnostic; NOT official gettrk)':p.qualification==='confirmed'?
      (official?'Tracked for 24+ hours (official gettrk)':'Confirmed (24+ hours)'):
     p.qualification==='candidate'?
      (official?'Short-lived gettrk track (provisional)':'Short-lived candidate (unconfirmed)'):
      'Legacy track (unclassified)';
    panel.lowTrackPopup?.remove();
    // Marker popups are controlled by the close button, selecting another
    // marker, or changing valid time. With closeOnClick's default true, a
    // just-created popup may receive the same map click and instantly close.
    const popup=new global.maplibregl.Popup({closeButton:true,closeOnClick:false,closeOnMove:false,
      maxWidth:'260px',className:'evu-low-track-popup'})
     .setLngLat(e.lngLat).setHTML('<strong>'+safeSource+' low</strong><div>'+safeTime+
       '</div><div>'+pressure.toFixed(1)+' hPa</div><div>'+Number(p.lat).toFixed(2)+'°, '+
       Number(p.lon).toFixed(2)+'°</div><div>'+classification+'</div><small>Track '+safeTrack+'</small>').addTo(map);
    panel.lowTrackPopup=popup;
    // A CSS z-index on the MapLibre popup alone cannot escape its map-host
    // stacking context, which is *below* the contour and low-track canvases.
    // The map-host and the frame share the same pixel origin: move the popup
    // into the frame as an absolutely positioned sibling ABOVE those canvases.
    // MapLibre still owns and updates its position and removes it on close.
    const element=popup.getElement?.();
    if(element&&panel.frame)panel.frame.appendChild(element);
   });
   map.on('mouseenter',markers,()=>{map.getCanvas().style.cursor='pointer';});
   map.on('mouseleave',markers,()=>{map.getCanvas().style.cursor='';});
  }
 }
 async function show(panel, opts){
  const seq=(panel.lowTracksSeq||0)+1;panel.lowTracksSeq=seq;
  const map=panel?.map;if(!map)return {status:'pending'};
  try{
   let requests=opts.sources||[];
   if(panel.map!==map||panel.lowTracksSeq!==seq)return {status:'stale'};
   if(!requests.length){
    panel.lowTrackPopup?.remove();panel.lowTrackPopup=null;
    install(panel);
    map.getSource(sourceName(panel)).setData(empty());
    panel.lowTracksReady=true;panel.lowTrackFeatures=[];
    panel.view?.classList.remove('has-low-tracks');requestPaint(panel);
    return {status:'unavailable',points:0,
     filesRequested:0,filesLoaded:0,totalTracks:0,fixesAtValidTime:0,fixesInDomainAtValidTime:0,
     coverage:{processedCount:0,expectedCount:0,complete:false}};
   }
   const chunks=await Promise.all(requests.map(async (source,i)=>{
    try{
     const payload=await fetchJson(new URL(source.file,opts.baseUrl).href);
     if(source.kind==='analysis_f000'){
      if(!isDiagnosticF000Payload(payload)||payload.source!==source.model)
       throw Error('Unexpected diagnostic F000 source in '+source.file);
      const stitched=stitchF000Centers(payload,opts);
      return {data:featuresFromTracks(stitched,{...opts,showHistory:true,label:source.label}),
       payload:stitched,error:null,file:source.file,analysisF000:true};
     }
     if(!isOfficialTrackPayload(payload)){
      return {data:empty(),payload:null,legacy:true,file:source.file,
       algorithm:String(payload.algorithm||'unversioned'),error:null};
     }
     return {data:featuresFromTracks(payload,{...opts,label:source.label,colorOffset:i*2}),
      payload,error:null,file:source.file};
    }catch(e){return {data:empty(),payload:null,error:String(e?.message||e),httpStatus:e?.status||null,file:source.file};}
   }));
   if(panel.map!==map||panel.lowTracksSeq!==seq)return {status:'stale'};
   install(panel);
   panel.lowTrackPopup?.remove();panel.lowTrackPopup=null;
   const features=chunks.flatMap(c=>c.data.features);
   map.getSource(sourceName(panel)).setData({type:'FeatureCollection',features});
   bringToTop(map,panel);panel.lowTrackFeatures=features;
   panel.view?.classList.toggle('has-low-tracks',features.length>0);
   paintCanvas(panel);panel.lowTracksReady=true;
   const n=features.filter(f=>f.properties?.kind==='point').length;
   const activeAt=Date.parse(opts.activeTime||opts.upperTime||'');
   let totalTracks=0,fixesAtValidTime=0,fixesInDomainAtValidTime=0;
   const leadCoverage=[];
   for(const chunk of chunks){
    const payload=chunk.payload;
    if(!payload)continue;
    totalTracks+=Array.isArray(payload.tracks)?payload.tracks.length:0;
    if(Number.isInteger(opts.requestedHour)&&Array.isArray(payload.processed_hours))
     leadCoverage.push(payload.processed_hours.includes(opts.requestedHour));
    for(const track of (payload.tracks||[]))for(const pt of (track.points||[])){
     if(!validPoint(pt)||!Number.isFinite(activeAt)||Date.parse(pt.time)!==activeAt)continue;
     fixesAtValidTime++;
     if(withinDomain(pt,opts.domainBounds))fixesInDomainAtValidTime++;
    }
   }
   let currentLeadProcessed=leadCoverage.length?leadCoverage.every(Boolean):null;
   const legacy=chunks.filter(c=>c.legacy);
   const failed=chunks.filter(c=>c.error),failures=failed.map(c=>c.error);
   if(legacy.length)console.info('Archived experimental low-track products hidden:',
    legacy.map(c=>c.file+' ('+c.algorithm+')'));
   const missingOnly=failed.length>0&&failed.every(c=>c.httpStatus===404);
   let processedCount=0,expectedCount=0,complete=true;
   if(opts.analysisF000){
    const step=opts.analysisF000==='gfs_v16'?6:1;
    const lower=Date.parse(opts.lowerTime),upper=Date.parse(opts.upperTime);
    expectedCount=Number.isFinite(lower)&&Number.isFinite(upper)&&upper>=lower?
     Math.floor((upper-lower)/(step*3600000))+1:0;
    for(const chunk of chunks){
     if(!chunk.payload){complete=false;continue;}
     processedCount+=chunk.payload.snapshot_times.length;
     leadCoverage.push(chunk.payload.snapshot_times.some(t=>Date.parse(t)===upper));
    }
    complete=expectedCount>0&&processedCount>=expectedCount;
   }else for(const chunk of chunks){
    const payload=chunk.payload;
    if(!payload){complete=false;continue;}
    const processed=Array.isArray(payload.processed_hours)?payload.processed_hours:null;
    if(Number.isInteger(opts.requestedHour)){
     processedCount+=processed?processed.filter(h=>h>=0&&h<=opts.requestedHour).length:0;
     const step=Number(payload?.native_hour_step)||Number(payload?.method?.native_hour_step)||0;
     const expected=step>0&&Number.isInteger(step)?
       Array.from({length:Math.floor(opts.requestedHour/step)+1},(_,i)=>i*step):
       (Array.isArray(opts.expectedHours)&&opts.expectedHours.length?opts.expectedHours:[opts.requestedHour]);
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
   if(opts.analysisF000)currentLeadProcessed=leadCoverage.length?leadCoverage.every(Boolean):false;
   const status=legacy.length===requests.length?'legacy':
     failed.length===requests.length?(missingOnly?'unavailable':'error'):
     failed.length?'partial':!complete?'incomplete':n?
      (opts.analysisF000&&fixesAtValidTime===0?'history':'ready'):'empty';
   return {status,points:n,coverage,totalTracks,fixesAtValidTime,
    fixesInDomainAtValidTime,currentLeadProcessed,validTime:opts.upperTime,
    filesLoaded:chunks.filter(c=>c.payload).length,
    filesRequested:requests.length,errors:failures,
    legacyFiles:legacy.map(c=>c.file),
    missingFiles:failed.filter(c=>c.httpStatus===404).map(c=>c.file),
    failedFiles:failed.map(c=>c.file)};
  }catch(error){
   if(panel.map===map&&panel.lowTracksSeq===seq){
    panel.lowTrackFeatures=[];panel.view?.classList.remove('has-low-tracks');
    if(map.getSource(sourceName(panel)))map.getSource(sourceName(panel)).setData(empty());
    requestPaint(panel);
   }
   return {status:'error',error:String(error?.message||error)};
  }
 }
 global.EVULowTracks={show,remove,featuresFromTracks,isOfficialTrackPayload,stitchF000Centers,splitAtDateLine,
  withinDomain,colorForPressure,paintCanvas,requestPaint};
})(window);
