// FIXED, operationally oriented display palettes. Nothing auto-scales to the
// currently selected model, cycle or forecast hour.
// Irregular bins emphasize common precipitation while preserving extremes.
const RAIN_COLORS = [
 '#c8eaf4','#8ed2e8','#4dafd1','#42c3b2','#2caf78','#65c24f',
 '#a3d849','#d8e24a','#ffe04c','#ffc03c','#f59b36','#ed7433',
 '#e44840','#c6315b','#a32c88','#ae58b1','#d67bc5','#f0bfe9'
];
const SNOW_COLORS = [
 '#eef8ff','#caebf8','#9dd9ef','#70bbe4','#5095d4','#426bba',
 '#514baf','#7142ab','#9347b4','#b455b9','#ce68ba','#df83bf',
 '#ec9ac6','#d4719e','#b05191','#873571','#f5d7ec'
];
// Composite reflectivity: fixed, SPC-inspired 2.5-dBZ steps from 10 through
// 70 dBZ. Colors are sampled from the user-provided SPC reference legend.
// Values under 10 dBZ are transparent; 70+ dBZ uses the final gray.
const REFC_LEVELS=Array.from({length:25},(_,i)=>10+i*2.5);
const REFC_COLORS=[
 '#dae2f1','#b5c4e3','#90a7d6','#6a89c8',
 '#476cbb','#274fae','#254f5d','#4e764d',
 '#7e9a73','#adbf8f','#fdf384','#f0d46e',
 '#e4b559','#d99844','#cd7933','#c35c24',
 '#bb271a','#931d15','#6c1413','#933ea8',
 '#772c9b','#59198d','#828282','#b4b4b4'
];
const FIELDS = {
 refc:{label:'Composite reflectivity',unit:'dBZ',levels:REFC_LEVELS,bandColors:REFC_COLORS},
 // Wind fields are stored by WCOSS2 in m/s and displayed in knots.
 wspd10:{label:'10-m wind speed',unit:'kt',convert:'mpsToKt',levels:[0,2,5,10,15,20,25,30,35,40,45,50,55,60,70,80,90,100,120,140],bandColors:['#e6f5f3','#bde5da','#8ed5cb','#55bfbb','#269bb9','#277bc3','#375dc5','#5356b9','#7652b1','#9c4fb1','#be519f','#d35c88','#df6a6c','#e87e4e','#ee9d3d','#efbc42','#f5dd64','#fff2a0','#fffaf0']},
 gust:{label:'10-m wind gust',unit:'kt',convert:'mpsToKt',levels:[0,5,10,15,20,25,30,35,40,45,50,55,60,70,80,90,100,120,140,160],bandColors:['#e6f5f3','#bde5da','#8ed5cb','#55bfbb','#269bb9','#277bc3','#375dc5','#5356b9','#7652b1','#9c4fb1','#be519f','#d35c88','#df6a6c','#e87e4e','#ee9d3d','#efbc42','#f5dd64','#fff2a0','#fffaf0']},
 u10:{label:'10-m U wind component',unit:'kt',convert:'mpsToKt',min:-100,max:100,colors:[[0,'#3d4d9d'],[.2,'#347bbd'],[.38,'#9dcfe5'],[.5,'#f4f5f5'],[.62,'#f5c09b'],[.8,'#e47a49'],[1,'#a42f39']],fraction:true},
 v10:{label:'10-m V wind component',unit:'kt',convert:'mpsToKt',min:-100,max:100,colors:[[0,'#3d4d9d'],[.2,'#347bbd'],[.38,'#9dcfe5'],[.5,'#f4f5f5'],[.62,'#f5c09b'],[.8,'#e47a49'],[1,'#a42f39']],fraction:true},
 t2m:{label:'2-m temperature',unit:'°F',min:-40,max:110,convert:'F',colors:[[0,'#422d92'],[.2,'#3266cb'],[.35,'#71c3e2'],[.48,'#bedbb0'],[.58,'#f3e58d'],[.72,'#f59a43'],[.85,'#d44730'],[1,'#882c4d']],fraction:true},
 dpt2m:{label:'2-m dew point',unit:'°F',min:-40,max:85,convert:'F',colors:[[0,'#6e4ca0'],[.24,'#3f86bf'],[.43,'#6ec9ce'],[.58,'#b7cf74'],[.78,'#55a851'],[1,'#174a33']],fraction:true},
 t925:{label:'925-hPa temperature',unit:'°C',min:-45,max:40,convert:'C',copyColors:'t2m'},
 t850:{label:'850-hPa temperature',unit:'°C',min:-40,max:40,convert:'C',copyColors:'t2m'},
 t700:{label:'700-hPa temperature',unit:'°C',min:-45,max:30,convert:'C',copyColors:'t2m'},
 rh2m:{label:'2-m relative humidity',unit:'%',min:0,max:100,colors:[[0,'#a25b37'],[.2,'#dc9d46'],[.4,'#e7d78b'],[.6,'#a3c788'],[.8,'#42989b'],[1,'#24558a']],fraction:true},
 // PRATE input is kg m-2 s-1; the GPU sees mm/hour after the ONE conversion.
 prate:{label:'Precipitation rate',unit:'mm h⁻¹',convert:'perhour',levels:[.05,.25,.5,1,2.5,5,7.5,10,15,20,30,40,50,75,100,125,150,175,200],bandColors:RAIN_COLORS},
 // Zarr accumulation amounts are kg m-2 = mm of water; display as inches.
 apcp:{label:'Accumulated precipitation',unit:'in',convert:'mmtoin',levels:[.01,.05,.1,.25,.5,.75,1,1.5,2,3,4,5,6,8,10,12,16,20,25],bandColors:RAIN_COLORS},
 frozr:{label:'Frozen rain accumulation',unit:'in',convert:'mmtoin',levels:[.01,.03,.05,.1,.2,.3,.5,.75,1,1.5,2,3,4,5,6,8],bandColors:RAIN_COLORS},
 frzr:{label:'Freezing rain accumulation',unit:'in',convert:'mmtoin',levels:[.005,.01,.03,.05,.1,.2,.3,.5,.75,1,1.5,2,3,4,5,6],bandColors:RAIN_COLORS},
 tsnowp:{label:'Snow precipitation (liquid equivalent)',unit:'in',convert:'mmtoin',levels:[.01,.05,.1,.25,.5,.75,1,1.5,2,3,4,5,6,8,10,12],bandColors:RAIN_COLORS},
 asnow:{label:'Total snowfall',unit:'in',convert:'mtoin',levels:[.1,.5,1,2,3,4,6,8,12,16,20,24,30,36,48,60,72,96],bandColors:SNOW_COLORS},
 weasd:{label:'Snow water equivalent',unit:'in',convert:'mmtoin',levels:[.01,.05,.1,.25,.5,.75,1,1.5,2,3,4,5,6,8,10,12,16,20,25],bandColors:RAIN_COLORS},
 snod:{label:'Snow depth',unit:'in',convert:'mtoin',levels:[.1,.5,1,2,3,4,6,8,12,16,24,30,36,48,60,72,96,144],bandColors:SNOW_COLORS},
 snowc:{label:'Snow cover',unit:'%',min:0,max:100,cutoff:1,copyColors:'rh2m'},
 cpofp:{label:'Percent frozen precipitation',unit:'%',min:0,max:100,copyColors:'t2m'},
 sden:{label:'Snow density',unit:'kg m⁻³',min:50,max:500,copyColors:'rh2m'},
 csnow:{label:'Categorical snow',unit:'',category:'#65b6ff'},
 cicep:{label:'Categorical ice pellets',unit:'',category:'#ef8dd7'},
 cfrzr:{label:'Categorical freezing rain',unit:'',category:'#da5d95'},
 crain:{label:'Categorical rain',unit:'',category:'#59d37c'},
 ptype:{label:'Derived precipitation type',unit:'',ptype:true}
};
// Fixed forecaster field sequence. U/V are read for barbs, not separate menu fields.
const FIELD_ORDER = [
 'ptype','refc','csnow','cicep','cfrzr','crain',
 't2m','dpt2m','rh2m','prate','apcp','frozr','frzr','tsnowp',
 'asnow','cpofp','snowc','sden','weasd','snod',
 't925','t850','t700','wspd10','gust'
];
const PTYPE = ['#192939','#4bc86c','#55b2f0','#e75889','#b266d8','#f0c764'];
/* OMD EVU autumnplot-gl + MapLibre GL viewer. Zarr-v2 decoding stays browser-native. */
'use strict';
const $=id=>document.getElementById(id);
const el=Object.fromEntries(['fieldSelect','cycleSelect','fcstSelect','stepBackBtn','stepForwardBtn','playBtn','pauseBtn','speedDownBtn','speedUpBtn','speedValue','exportDialog','exportForm','exportCloseBtn','exportCancelBtn','exportConfirmBtn','exportBusyStatus','exportDialogTitle','exportSize169','exportSize43','resetViewBtn','copyLinkBtn','saveAllPngBtn','mapViewSelect','themeToggleBtn','mobileControlsBtn','viewerGrid','dataStatus','sharedLegend','sharedLegendTitle','sharedLegendCanvas','sharedLegendLabels'].map(x=>[x,$(x)]));
const st={geoCache:new Map(),geoInflight:new Map(),cfg:null,sources:new Map(),primary:null,cycles:[],runPinned:false,ref:null,field:null,hour:0,panels:[],theme:'dark',mode:'lambert',seq:0,active:[],columnCount:1,mapView:null,rendering:false,playing:false,syncing:false,observer:null,cache:new Map(),cacheBytes:0,displayCache:new Map(),displayCacheBytes:0,displayInflight:new Map(),inflight:new Map(),queue:[],running:0,clock:0,loopSpeedIndex:2,prefetchTimer:null,prefetchGeneration:0,prefetchActive:0,queuedFetches:new Map(),exportSelection:null,exporting:false,lastExportRatio:"16:9",lastExportFraming:"fill",hover:null,hoverRaf:0,exportRender:false,expandedPanel:null};
const q=new URLSearchParams(location.search),pad3=n=>String(n).padStart(3,'0');
const fmt=x=>{const d=new Date(x);return Number.isFinite(+d)?d.toISOString().slice(0,16).replace('T',' ')+'Z':'—'};
const valid=(ds,h)=>new Date(Date.parse(ds.init_time)+h*3600000);
const text=(s)=>document.createTextNode(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Shared links use the synchronized geographic camera, not panel pixel coordinates.
// Latitude/longitude plus zoom/bearing/pitch are sufficient for 2D and Globe.
function sharedCameraFromQuery(){
 const hasView=['lat','lon','zoom'].every(k=>q.has(k));if(!hasView)return null;
 const lat=Number(q.get('lat')),lon=Number(q.get('lon')),zoom=Number(q.get('zoom'));
 const bearing=q.has('bearing')?Number(q.get('bearing')):0;
 const pitch=q.has('pitch')?Number(q.get('pitch')):0;
 const maxZoom=Number(st.cfg?.display?.maxZoom)||12;
 if(![lat,lon,zoom,bearing,pitch].every(Number.isFinite)||
   lat< -85||lat>85||lon< -540||lon>540||zoom<0||zoom>maxZoom||
   Math.abs(bearing)>360||pitch<0||pitch>85)return null;
 return {center:[lon,lat],zoom,bearing,pitch};
}
function currentSharedCamera(){
 const master=st.hover?.master?.map;
 const map=master||st.active.find(p=>p.map)?.map;
 if(map){
  const c=map.getCenter();
  const obj={center:[Number(c.lng),Number(c.lat)],zoom:Number(map.getZoom()),
   bearing:Number(map.getBearing()),pitch:Number(map.getPitch())};
  if([obj.center[0],obj.center[1],obj.zoom,obj.bearing,obj.pitch].every(Number.isFinite))return obj;
 }
 return st.mapView;
}
function setCameraUrlParams(url,camera){
 const names=['lat','lon','zoom','bearing','pitch'];
 if(!camera||!Array.isArray(camera.center)||camera.center.length!==2){
  names.forEach(name=>url.searchParams.delete(name));return;
 }
 const [lon,lat]=camera.center;
 if(![lon,lat,camera.zoom,camera.bearing,camera.pitch].every(Number.isFinite)){
  names.forEach(name=>url.searchParams.delete(name));return;
 }
 const trim=(n,dp)=>Number(n.toFixed(dp)).toString();
 url.searchParams.set('lat',trim(lat,5));url.searchParams.set('lon',trim(lon,5));
 url.searchParams.set('zoom',trim(camera.zoom,4));
 url.searchParams.set('bearing',trim(camera.bearing,2));
 url.searchParams.set('pitch',trim(camera.pitch,2));
}
// Consistent speed steps; actual frame rate may be limited by Zarr or GPU work.
const LOOP_INTERVALS=[1700,1200,850,600,425,300,200];
function updateSpeedButtons(){
 const i=st.loopSpeedIndex,ms=LOOP_INTERVALS[i];
 el.speedValue.textContent=(850/ms).toFixed(ms===850?0:1).replace(/\.0$/,'')+'×';
 el.speedValue.title=ms+' ms target between animation frames';
 el.speedDownBtn.disabled=i===0;el.speedUpBtn.disabled=i===LOOP_INTERVALS.length-1;
}
function changeSpeed(dir){st.loopSpeedIndex=Math.max(0,Math.min(LOOP_INTERVALS.length-1,st.loopSpeedIndex+dir));updateSpeedButtons();}

async function json(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(`${url}: HTTP ${r.status}`);return r.json();}
function fieldInfo(v){const meta=FIELDS[v.name]||{label:v.attrs?.long_name||v.name,unit:v.attrs?.units||'',min:0,max:100,copyColors:'rh2m'};const colors=meta.copyColors?FIELDS[meta.copyColors].colors:meta.colors;return {...meta,colors,fraction:meta.fraction||!!meta.copyColors&&!!FIELDS[meta.copyColors].fraction};}
// A raw Zarr chunk is converted ONCE into the display units used by the GPU
// field, its color map and its hover readout. Never convert sampled GPU values.
function convert(x,m){switch(m.convert){case 'F':return(x-273.15)*1.8+32;case 'C':return x-273.15;case 'mmtoin':return x/25.4;case 'mtoin':return x*39.37007874;case 'perhour':return x*3600;case 'mpsToKt':return x*1.9438444924406;default:return x;}}
function formatReadout(x,m){
 if(!Number.isFinite(x)||x < -1e9)return '—';
 // Extra decimals for small rates/accumulations, without converting again.
 const smallUnits=m.convert==='mmtoin'||m.convert==='mtoin'||m.convert==='perhour';
 const digits=smallUnits&&Math.abs(x)<0.1?3:smallUnits&&Math.abs(x)<1?2:2;
 return x.toFixed(digits);
}
function columnCount(n){const c=st.cfg.layout?.columns??'auto';if(Number.isInteger(c)&&c>=1&&c<=5)return Math.min(n,c);return n<=3?n:n===4?2:n<=9?3:n<=16?4:5;}
function layout(){
 const n=st.panels.length,width=el.viewerGrid.clientWidth||innerWidth;
 const cols=st.expandedPanel?1:Math.min(columnCount(n),Math.max(1,Math.floor((width+1)/278)));
 // A single shared color scale frees the full plot area in every panel.
 st.verticalLegends=false;
 el.viewerGrid.style.setProperty('--cols',cols);
 el.viewerGrid.classList.remove('vertical-legends');
 st.columnCount=cols;el.viewerGrid.classList.toggle('one-panel',n===1);
 updateSharedLegend();
 // MapLibre must never resize a temporarily hidden panel to 0 x 0.
 for(const p of st.panels){if(p.map&&(!st.expandedPanel||st.expandedPanel===p))p.map.resize();}
}
function themeColors(){return st.theme==='light'?{ocean:'#d6e6ee',land:'#e8eee5',line:'#536473',minor:'#87969b',grid:'#97a6b0'}:{ocean:'#0b2238',land:'#1d3541',line:'#adc3cc',minor:'#5d7888',grid:'#3c6474'};}
function mapStyle(){
 // MapLibre must finish startup before asking its web workers to parse GeoJSON.
 // A true source-free style also makes map failures distinguishable from slow geography.
 const c=themeColors();
 return {version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':c.ocean}}]};
}
// Same visibility threshold for county lines and high-detail shorelines/borders.
// High-detail basemap is now used at every zoom; counties retain their own threshold.
function detailThreshold(){return Math.max(0,Number(st.cfg?.display?.detailMinZoom??0)||0);}
function countyThreshold(){
 const d=st.cfg?.display||{};
 return Number(d[st.mode==='globe'?'globeCountyMinZoom':'countyMinZoom']??(st.mode==='globe'?5.05:4.85));
}
function detailMaskData(){
 const ring=[[-173,4],[-43,4],[-43,82],[-173,82],[-173,4]];
 return {type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[ring]}}]};
}
function addGeographySkeleton(m){
 const c=themeColors(),empty=()=>({type:'geojson',data:{type:'FeatureCollection',features:[]}}),detail=detailThreshold();
 const line=(id,source,color,width,opacity=.9)=>({id,type:'line',source,paint:{'line-color':color,'line-width':width,'line-opacity':opacity}});
 for(const key of ['land','coast','country','states','counties','land_detail','lakes_detail','coast_detail','country_detail'])
  if(!m.getSource(key))m.addSource(key,empty());
 if(!m.getSource('detail-mask'))m.addSource('detail-mask',{type:'geojson',data:detailMaskData()});
 const layers=[
  {id:'land-fill',type:'fill',source:'land',paint:{'fill-color':c.land,'fill-opacity':1}},
  // Higher-resolution shoreline fills are enabled only after BOTH regional land
  // and lake polygons have arrived, avoiding partial/misleading basemap displays.
  {id:'land-detail-mask',type:'fill',source:'detail-mask',minzoom:24,paint:{'fill-color':c.ocean,'fill-opacity':1}},
  {id:'land-detail-fill',type:'fill',source:'land_detail',minzoom:24,paint:{'fill-color':c.land,'fill-opacity':1}},
  {id:'lakes-detail-fill',type:'fill',source:'lakes_detail',minzoom:24,paint:{'fill-color':c.ocean,'fill-opacity':1}},
  line('coast','coast',c.line,1.15),
  {...line('coast-detail','coast_detail',c.line,1.1),minzoom:detail},
  line('country','country',c.line,1.05),
  {...line('country-detail','country_detail',c.line,1.05),minzoom:detail},
  line('states','states',c.minor,.85),
  {...line('counties','counties',c.minor,.67,.78),minzoom:countyThreshold()},
 ];
 for(const layer of layers)if(!m.getLayer(layer.id))m.addLayer(layer);
}

function createPanel(cfg,i){const card=document.createElement('section');card.className='panel-card';card.dataset.panelId=cfg.id;
 const save=document.createElement('button');save.type='button';save.className='panel-save';
 save.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/></svg>';
 save.setAttribute('aria-label',`Download ${cfg.label||cfg.id} PNG`);save.title=`Save ${cfg.label||cfg.id} PNG`;save.disabled=true;
 const expand=document.createElement('button');expand.type='button';expand.className='panel-expand';
 expand.setAttribute('aria-pressed','false');expand.setAttribute('aria-label',`Expand ${cfg.label||cfg.id} panel`);
 expand.title=`Expand ${cfg.label||cfg.id} to fill plotting area`;
 expand.innerHTML=EXPAND_ICON;
 const view=document.createElement('div');view.className='panel-viewport';const snap=document.createElement('img');snap.className='map-snapshot';snap.alt='Previously rendered weather plot';snap.hidden=true;const frame=document.createElement('div');frame.className='map-frame';const lbl=document.createElement('div');lbl.className='plot-label';const title=document.createElement('strong'),sub=document.createElement('span');lbl.append(title,sub);const notice=document.createElement('div');notice.className='notice visible';const note=document.createElement('span');notice.append(note);const info=document.createElement('div');info.className='point-info';info.hidden=true;const ghost=document.createElement('div');ghost.className='sync-crosshair';ghost.hidden=true;ghost.setAttribute('aria-hidden','true');view.append(frame,snap,lbl,notice,info,ghost);if(!cfg.placeholder)view.append(save);view.append(expand);
 const ft=document.createElement('div');ft.className='panel-footer';const legendTitle=document.createElement('div');legendTitle.className='legend-title';const legendCanvas=document.createElement('canvas');legendCanvas.className='legend-canvas';const legendLabels=document.createElement('div');legendLabels.className='legend-labels';ft.append(legendTitle,legendCanvas,legendLabels);card.append(view,ft);el.viewerGrid.append(card);
 const p={cfg,i,card,view,frame,snap,title,sub,notice,note,info,ghost,save,expand,legendTitle,legendCanvas,legendLabels,wind:null,windCanvas:null,windFrameRequested:false,map:null,component:null,layer:null,rawField:null,ds:null,v:null,h:null,src:null,lastKey:null,image:null,lastSnapshot:null,grid:null,gridKey:null,status:'waiting',busy:false,geoApplied:new Set(),geoPending:new Set(),geoTimer:null,mapReady:null,activation:null,loadingStage:'',loadSince:0,stageSince:0};
 notice.style.pointerEvents='none';card.addEventListener('click',()=>{selectPanel(p);if(!p.cfg.placeholder)activate(p).catch(e=>fail(p,e));});save.addEventListener('click',e=>{e.stopPropagation();openExportDialog('panel',p,e);});
 expand.addEventListener('click',e=>{e.stopPropagation();setExpandedPanel(st.expandedPanel===p?null:p);});
 if(cfg.placeholder){p.status='missing';card.classList.add('analysis-placeholder');p.title.textContent='Analysis · verifying data';p.sub.textContent='RAP F000 / MRMS · planned';setNote(p,cfg.placeholderText||'Verifying analysis data not yet available');}
 else setNote(p,'Waiting for catalog…');return p;
}
function setNote(p,msg){p.note.textContent=msg;p.notice.classList.add('visible');}
function stage(p,label){p.loadingStage=label;p.stageSince=Date.now();setNote(p,label);}
function loadingErrorMessage(e){const msg=String(e?.message||e);if(/GPU layer|geometry worker|GPU timeout/i.test(msg))return msg+' Check the complete vendor/autumnplot-gl distribution, especially its worker .js files. Run vendor_dependencies.py again.';if(/HTTP 404/.test(msg))return msg+' Check that the full Zarr directory and chunk file were copied to the same directory as catalog.json.';if(/abort|timeout/i.test(msg))return msg+' Check browser Network tab for a slow or blocked chunk or worker.';return msg;}

function clearNote(p){p.notice.classList.remove('visible');}
// Focus one model *within the existing plotting workspace*, never the browser
// Fullscreen API. Keep every panel and its MapLibre instance alive so the
// 3x3 view and the geographic camera are restored without reloading data.
const EXPAND_ICON='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>';
const COLLAPSE_ICON='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>';
function setExpandedPanel(panel,activatePanel=true){
 if(st.expandedPanel===panel)return;
 st.expandedPanel=panel||null;
 el.viewerGrid.classList.toggle('focus-panel',!!panel);
 for(const p of st.panels){
  const focused=p===panel;
  p.card.classList.toggle('is-focused',focused);
  p.expand.setAttribute('aria-pressed',String(focused));
  p.expand.setAttribute('aria-label',focused?`Close enlarged ${p.cfg.label||p.cfg.id} panel`:`Expand ${p.cfg.label||p.cfg.id} panel`);
  p.expand.title=focused?'Return to multi-panel view':`Expand ${p.cfg.label||p.cfg.id} to fill plotting area`;
  p.expand.innerHTML=focused?COLLAPSE_ICON:EXPAND_ICON;
 }
 if(st.hover)clearSynchronizedHover();
 if(panel)selectPanel(panel);
 layout();
 // Browser layout has to settle before resizing the WebGL surface (and wind
 // overlay). Do not ask MapLibre to render a hidden, zero-width canvas.
 requestAnimationFrame(()=>{
  for(const p of st.panels){if(p.map&&(!st.expandedPanel||st.expandedPanel===p)){
   p.map.resize();scheduleWindRedraw(p);
  }}
  if(activatePanel&&panel&&!panel.cfg.placeholder&&st.expandedPanel===panel)
   activate(panel).catch(err=>fail(panel,err));
 });
}
function selectPanel(p){for(const x of st.panels)x.card.classList.toggle('selected',x===p);}
// All model catalogs participate in run discovery. The legacy RRFS catalog
// may lag new REFS/HRRR catalogs; never let it cap the cycle selector.
function cycleKey(time){const ms=Date.parse(time);return Number.isFinite(ms)?new Date(ms).toISOString():null;}
function unionCycles(sources,preferredId){
 const merged=new Map();
 for(const source of sources){
  if(source.error)continue;
  for(const ds of source.datasets){
   const key=cycleKey(ds.init_time);if(!key)continue;
   if(!merged.has(key))merged.set(key,{id:key,init_time:key,model:'',grid:null,variables:[],entries:[],sourceIds:[]});
   const c=merged.get(key);c.entries.push({source,ds});c.sourceIds.push(source.id);
  }
 }
 // Prefer the RRFS grid when available, otherwise whichever source is present.
 for(const cycle of merged.values()){
  const preferred=cycle.entries.find(item=>item.source.id===preferredId)||cycle.entries[0];
  const ds=preferred.ds;cycle.grid=ds.grid;cycle.model=ds.model;
  cycle.variables=ds.variables||[];
 }
 return [...merged.values()].sort((a,b)=>Date.parse(b.init_time)-Date.parse(a.init_time));
}
async function boot(){try{
 st.cfg=await json('config.json');st.mode=(q.get('map')||st.cfg.display?.mapProjection)==='globe'?'globe':'lambert';el.mapViewSelect.value=st.mode;
 st.mapView=sharedCameraFromQuery();
 let savedTheme=null;try{savedTheme=localStorage.getItem('omd_evu_theme');}catch(_){}
 const sharedTheme=q.get('theme');st.theme=(sharedTheme==='light'||sharedTheme==='dark'?sharedTheme:null)||savedTheme||st.cfg.theme||'dark';setTheme(st.theme,false);
 const pcfg=st.cfg.panels||[{id:'rrfs-main',source:'rrfs',label:'RRFS'}];if(!pcfg.length||pcfg.length>20||pcfg.length>(st.cfg.layout?.maxPanels||20))throw Error('Configure 1–20 panels');
 if(new Set(pcfg.map(x=>x.id)).size!==pcfg.length)throw Error('Panel IDs must be unique');el.viewerGrid.replaceChildren();st.panels=pcfg.map(createPanel);layout();selectPanel(st.panels[0]);
 const sources=st.cfg.sources?.length?st.cfg.sources:[{id:'rrfs',label:'RRFS',catalogUrl:'data/catalog.json'}];const results=await Promise.all(sources.map(async s=>{const source={...s,url:new URL(s.catalogUrl||'data/catalog.json',document.baseURI),datasets:[]};try{const cat=await json(source.url.href);if(cat.schema!=='rrfs-zarr-viewer-1'||!Array.isArray(cat.datasets))throw Error('Catalog schema mismatch');source.datasets=cat.datasets.sort((a,b)=>Date.parse(b.init_time)-Date.parse(a.init_time));}catch(e){source.error=String(e);console.warn(s.id,e);}return source;}));results.forEach(s=>st.sources.set(s.id,s));st.primary=st.sources.get(st.cfg.primarySource)||results.find(s=>s.datasets.length);
 st.cycles=unionCycles(results,st.cfg.primarySource||'rrfs');
 if(!st.cycles.length)throw Error('No model cycles found in any configured catalog');
 // Old shared URLs use dataset IDs (e.g. rrfs_20261008_0000). Accept those
 // as well as the new canonical UTC cycle key; no URL parameter -> latest.
 const wanted=q.get('run');st.runPinned=!!wanted;st.ref=st.cycles.find(c=>c.id===wanted||c.entries.some(x=>x.ds.id===wanted))||st.cycles[0];
 const names=new Set(results.flatMap(s=>s.datasets.flatMap(d=>d.variables.map(v=>v.name))));const ordered=FIELD_ORDER.filter(n=>names.has(n));el.fieldSelect.replaceChildren(...ordered.map(n=>new Option(FIELDS[n]?.label||n,n)));
 st.field=ordered.includes(q.get('field'))?q.get('field'):ordered.includes(st.cfg.defaultField)?st.cfg.defaultField:ordered[0];el.cycleSelect.replaceChildren(...st.cycles.map(c=>new Option(fmt(c.init_time),c.id)));
 const defaultDelay=Number(st.cfg?.display?.loopIntervalMs??850);
 st.loopSpeedIndex=LOOP_INTERVALS.reduce((best,ms,i)=>Math.abs(ms-defaultDelay)<Math.abs(LOOP_INTERVALS[best]-defaultDelay)?i:best,2);
 if(q.has('speed')){const idx=Number(q.get('speed'));if(Number.isInteger(idx)&&idx>=0&&idx<LOOP_INTERVALS.length)st.loopSpeedIndex=idx;}
 updateSpeedButtons();
 const h=Number(q.get('fhr')??st.cfg.defaultForecastHour??0);st.hour=Number.isInteger(h)&&h>=0?h:0;refreshHours();bind();syncUI();updateSharedLegend();
 ['fieldSelect','cycleSelect','fcstSelect','stepBackBtn','stepForwardBtn','playBtn','pauseBtn'].forEach(id=>el[id].disabled=false);el.saveAllPngBtn.disabled=false;
 if(!('DecompressionStream' in window))throw Error('Browser does not support zlib DecompressionStream');await waitLibraries();
 // No remote maps/tiles: map style and boundary layers are locally hosted.
 st.observer=new IntersectionObserver(entries=>{if(st.rendering)return;for(const e of entries)if(e.isIntersecting&&e.intersectionRatio>.04){const p=st.panels.find(p=>p.card===e.target);if(p&&!p.map&&!p.cfg.placeholder)activate(p).catch(err=>fail(p,err));}},{root:el.viewerGrid,rootMargin:'120px'});
 st.panels.filter(p=>!p.cfg.placeholder).forEach(p=>st.observer.observe(p.card));try{await activate(st.panels.find(p=>!p.cfg.placeholder));}catch(err){fail(st.panels[0],err);}updateStatus();schedulePrefetch();
 }catch(e){console.error(e);el.dataStatus.textContent='Viewer initialization failed: '+String(e);if(!st.panels.length)el.viewerGrid.textContent='Initialization failed: '+String(e);else st.panels.forEach(p=>setNote(p,'Initialization failed: '+String(e)));}}
async function waitLibraries(){
 for(let k=0;k<100;k++){
  if(window.maplibregl?.Map&&window.apgl?.RawScalarField&&window.apgl?.PlotLayer){
   if(typeof maplibregl.setWorkerUrl!=='function')throw Error('MapLibre build does not support setWorkerUrl; use vendor/maplibre-gl-csp.js');
   // Workers must be self-hosted on this site: no blob: URI required by MapLibre.
   maplibregl.setWorkerUrl(new URL('vendor/maplibre-gl-csp-worker.js',document.baseURI).href);
   if(typeof maplibregl.supported==='function'&&!maplibregl.supported())
    throw Error('MapLibre reports WebGL unavailable. See diagnostics.html for GPU/browser checks.');
   // Optional installer manifest verifies all packed worker assets are accessible.
   // A manifest is written by vendor_dependencies.py; old installs are supported.
   try{
    const r=await fetch('vendor/autumnplot-assets.json',{cache:'no-store'});
    if(r.ok){const listing=await r.json();
     if(!Array.isArray(listing.files)||!listing.files.some(n=>n!=='autumnplot-gl.js'&&n.endsWith('.js')))
      throw Error('autumnplot-gl assets manifest contains no plotting worker');
     const workerFiles=listing.files.filter(n=>n!=='autumnplot-gl.js'&&n.endsWith('.js'));
     const checks=await Promise.all(workerFiles.map(async n=>{const x=await fetch('vendor/'+n,{method:'HEAD',cache:'no-store'});return [n,x.status];}));
     const missing=checks.filter(([_,code])=>code!==200);
     if(missing.length)throw Error('Missing autumnplot-gl worker files: '+missing.map(x=>x[0]+' (HTTP '+x[1]+')').join(', '));
    }
   }catch(e){if(e instanceof TypeError||String(e).includes('HTTP 404'))console.warn('Autumnplot vendor manifest check unavailable',e);else throw e;}
   return;
  }
  await sleep(150);
 }
 throw Error('Required browser libraries missing. Run vendor_dependencies.py and upload all FOUR vendor files, including the CSP build and CSP worker. Open diagnostics.html.');
}
// Forecast-hour availability is the UNION for the selected UTC cycle and field.
// It is never restricted by the legacy RRFS catalog or one model's time range.
function timelineVariables(){
 if(!st.ref||!st.field)return [];
 return st.ref.entries.map(({ds})=>(ds.variables||[]).find(v=>v.name===st.field)).filter(Boolean);
}
function availableHours(){return [...new Set(timelineVariables().flatMap(v=>v.available_hours||[]))].sort((a,b)=>a-b);}
function refreshHours(){const vars=timelineVariables(),hours=Math.max(1,...vars.map(v=>v.shape?.[0]||0),...st.ref.entries.flatMap(({ds})=>(ds.variables||[]).map(v=>v.shape?.[0]||0)));const available=new Set(availableHours());el.fcstSelect.replaceChildren(...Array.from({length:hours},(_,i)=>new Option(`F${pad3(i)}${available.has(i)?'':' · missing'}`,i)));st.hour=Math.max(0,Math.min(hours-1,st.hour));}
function syncUI(){
 el.fieldSelect.value=st.field;el.cycleSelect.value=st.ref.id;el.fcstSelect.value=String(st.hour);el.mapViewSelect.value=st.mode;
 try{const u=new URL(location.href);
  // An automatically chosen latest cycle is NOT pinned into the address bar:
  // reloading the normal viewer URL should discover tomorrow's newest run.
  if(st.runPinned)u.searchParams.set('run',st.ref.id);else u.searchParams.delete('run');
  u.searchParams.set('field',st.field);u.searchParams.set('fhr',st.hour);u.searchParams.set('map',st.mode);
  history.replaceState(null,'',u);
 }catch(_){}
}
function shareUrl(){
 const u=new URL(location.href);
 u.searchParams.set('run',st.ref.id);u.searchParams.set('field',st.field);
 u.searchParams.set('fhr',st.hour);u.searchParams.set('map',st.mode);
 u.searchParams.set('theme',st.theme);u.searchParams.set('speed',st.loopSpeedIndex);
 setCameraUrlParams(u,currentSharedCamera());
 return u.href;
}
function bind(){el.mobileControlsBtn.onclick=()=>{const opened=el.mobileControlsBtn.getAttribute('aria-expanded')!=='true';el.mobileControlsBtn.setAttribute('aria-expanded',String(opened));el.mobileControlsBtn.title=opened?'Hide viewer controls':'Show viewer controls';el.mobileControlsBtn.innerHTML=opened?'☷ Controls <span class="collapse-indicator" aria-hidden="true">▴</span>':'☷ Controls <span class="collapse-indicator" aria-hidden="true">▾</span>';document.getElementById('viewerControls').classList.toggle('is-open',opened);requestAnimationFrame(layout);};el.fieldSelect.onchange=()=>{st.field=el.fieldSelect.value;refreshHours();syncUI();updateSharedLegend();renderAll();};el.cycleSelect.onchange=()=>{st.runPinned=true;st.ref=st.cycles.find(x=>x.id===el.cycleSelect.value)||st.ref;refreshHours();syncUI();renderAll();};el.fcstSelect.onchange=()=>{st.hour=Number(el.fcstSelect.value);syncUI();renderAll();};el.stepBackBtn.onclick=()=>step(-1);el.stepForwardBtn.onclick=()=>step(1);el.playBtn.onclick=play;el.pauseBtn.onclick=stop;el.speedDownBtn.onclick=()=>changeSpeed(-1);el.speedUpBtn.onclick=()=>changeSpeed(1);
 el.mapViewSelect.onchange=()=>{st.mode=el.mapViewSelect.value;for(const p of st.active)if(p.map)applyProjection(p.map);syncUI();};
 // A select retains keyboard focus after its menu closes. Return arrow keys
 // to forecast navigation after an actual selection (mouse or keyboard).
 for(const sel of [el.fieldSelect,el.cycleSelect,el.fcstSelect,el.mapViewSelect]){
  sel.addEventListener('change',()=>requestAnimationFrame(()=>{if(document.activeElement===sel)sel.blur();}));
 }el.resetViewBtn.onclick=()=>{st.mapView=null;for(const p of st.active)if(p.map)resetView(p.map);};el.themeToggleBtn.onclick=()=>setTheme(st.theme==='dark'?'light':'dark',true);
 el.copyLinkBtn.onclick=async()=>{try{await navigator.clipboard.writeText(shareUrl());el.copyLinkBtn.textContent='Copied';setTimeout(()=>el.copyLinkBtn.textContent='Copy link',1400);}catch(e){console.warn(e);}};
 el.saveAllPngBtn.onclick=e=>openExportDialog('all',null,e);
 el.exportCloseBtn.onclick=el.exportCancelBtn.onclick=()=>{if(!st.exporting)el.exportDialog.close();};
 el.exportDialog.addEventListener('cancel',e=>{if(st.exporting)e.preventDefault();});
 el.exportForm.addEventListener('submit',async e=>{
  e.preventDefault();if(st.exporting||!st.exportSelection)return;
  const ratio=el.exportForm.querySelector('input[name="exportRatio"]:checked')?.value||'16:9';
  const framing=el.exportForm.querySelector('input[name="exportFraming"]:checked')?.value||'fill';st.lastExportFraming=framing;
  try{localStorage.setItem('omd_evu_export_framing',framing);}catch(_){}
  st.lastExportRatio=ratio;
  try{localStorage.setItem('omd_evu_export_ratio',ratio);}catch(_){}
  st.exporting=true;el.exportConfirmBtn.disabled=true;el.exportCancelBtn.disabled=true;el.exportCloseBtn.disabled=true;
  el.exportConfirmBtn.textContent='Preparing…';el.exportBusyStatus.textContent='Rendering export at higher map resolution…';
  try{
   if(st.exportSelection.type==='all'){
    // A focused view hides the other seven/eight MapLibre canvases. Restore
    // the grid for nine-panel capture, then restore focus even on failure.
    const focused=st.expandedPanel;
    if(focused){setExpandedPanel(null,false);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}
    try{await exportAll(ratio);}
    finally{
     // Exporting a nine-panel comparison may evict the previously focused
     // map under maxActiveMaps. Re-create it if needed when focus returns.
     if(focused)setExpandedPanel(focused,!focused.map);
    }
   }else await exportPanel(st.exportSelection.panel,ratio);
   el.exportDialog.close();}
  catch(err){console.error('PNG export failed',err);el.exportBusyStatus.textContent='Export failed: '+String(err?.message||err);}
  finally{st.exporting=false;el.exportConfirmBtn.disabled=false;el.exportCancelBtn.disabled=false;el.exportCloseBtn.disabled=false;el.exportConfirmBtn.textContent='Download PNG';}
 });
 window.addEventListener('resize',layout);window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);if(e.key===' '){e.preventDefault();st.playing?stop():play();}if(e.key==='ArrowUp'||e.key==='ArrowDown'){const a=st.cycles,idx=a.indexOf(st.ref)+(e.key==='ArrowUp'?-1:1);if(a[idx]){st.runPinned=true;st.ref=a[idx];refreshHours();syncUI();renderAll();}}});}
function setTheme(theme,save){
 st.theme=theme;document.documentElement.dataset.theme=theme;
 el.themeToggleBtn.innerHTML=theme==='dark'?'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>':'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 15.3A8.5 8.5 0 0 1 8.7 3.6 8.5 8.5 0 1 0 20.4 15.3Z"/></svg>';
 el.themeToggleBtn.setAttribute('aria-label',`Switch to ${theme==='dark'?'light':'dark'} mode`);
 el.themeToggleBtn.title=`Switch to ${theme==='dark'?'light':'dark'} mode`;
 if(save)try{localStorage.setItem('omd_evu_theme',theme);}catch(e){}
 for(const p of st.active||[])scheduleWindRedraw(p);
 const c=themeColors();
 // Change paint properties IN PLACE: a full map.setStyle() destroys custom APGL layers.
 for(const p of st.active){const m=p.map;if(!m||!m.setPaintProperty)continue;
   for(const [id,property,value] of [
    ['background','background-color',c.ocean],['land-fill','fill-color',c.land],
    ['land-detail-mask','fill-color',c.ocean],['land-detail-fill','fill-color',c.land],['lakes-detail-fill','fill-color',c.ocean],
    ['coast','line-color',c.line],['coast-detail','line-color',c.line],['country','line-color',c.line],['country-detail','line-color',c.line],
    ['states','line-color',c.minor],['counties','line-color',c.minor]]){
    try{if(m.getLayer(id))m.setPaintProperty(id,property,value);}catch(err){console.warn('Theme paint update',id,err);}
   }
 }
}
// Geography is advisory: an outage or slow connection must never stop the forecast map.
async function geoData(key){
 if(st.geoCache.has(key))return st.geoCache.get(key);
 if(st.geoInflight.has(key))return st.geoInflight.get(key);
 const req=(async()=>{const res=await fetch(`data/map_${key}.geojson`);
  if(!res.ok)throw Error(`Map overlay ${key}: HTTP ${res.status}`);
  const data=await res.json();if(data.type!=='FeatureCollection')throw Error(`Invalid ${key} geography`);
  st.geoCache.set(key,data);return data;
 })();st.geoInflight.set(key,req);
 try{return await req;}finally{st.geoInflight.delete(key);}
}
async function installGeo(p,key){
 if(!p.map||p.geoApplied?.has(key)||p.geoPending?.has(key))return;
 p.geoPending??=new Set();p.geoApplied??=new Set();p.geoPending.add(key);
 const current=p.map;
 try{const data=await geoData(key);
  // A panel may have been recycled while the geography was downloading.
  if(p.map!==current)return;
  const source=current.getSource?.(key);if(source?.setData){source.setData(data);p.geoApplied.add(key);updateGeographyVisibility(p);}
 }catch(e){console.warn('Nonfatal map geography issue:',key,e);}
 finally{p.geoPending.delete(key);}
}
function updateGeographyVisibility(p){
 const m=p.map;if(!m)return;
 const detail=detailThreshold();
 // Overview lines remain in use until their more detailed replacement is present.
 for(const [overview,key] of [['coast','coast_detail'],['country','country_detail']]){
  if(m.getLayer(overview))m.setLayoutProperty(overview,'visibility',p.geoApplied.has(key)?'none':'visible');
 }
 // Switching projections changes the threshold; update both the overview
 // replacements AND the new detailed layers (whose initial minzoom is static).
 for(const id of ['coast-detail','country-detail']){
  if(m.getLayer(id))m.setLayerZoomRange(id,detail,24);
 }
 const ready=p.geoApplied.has('land_detail')&&p.geoApplied.has('lakes_detail');
 for(const id of ['land-detail-mask','land-detail-fill','lakes-detail-fill']){
  if(m.getLayer(id))m.setLayerZoomRange(id,ready?detail:24,24);
 }
 if(m.getLayer('counties'))m.setLayerZoomRange('counties',countyThreshold(),24);
}
function maybeDetailedGeography(p){
 const m=p.map,d=st.cfg?.display||{};
 if(!m||m.getZoom()<detailThreshold())return;
 if(d.showCoastlines!==false)void installGeo(p,'coast_detail');
 if(d.showCountryBoundaries!==false)void installGeo(p,'country_detail');
 if(d.showLandFill!==false){void installGeo(p,'land_detail');void installGeo(p,'lakes_detail');}
}
function maybeCounties(p){
 const m=p.map,d=st.cfg?.display||{};
 if(m&&d.showCountiesOnZoom!==false&&m.getZoom()>=countyThreshold())void installGeo(p,'counties');
}
function geographyZoom(p){updateGeographyVisibility(p);maybeCounties(p);maybeDetailedGeography(p);}
function startGeography(p){
 // Keep slow geographic downloads separate from the initial forecast field.
 p.geoTimer=setTimeout(()=>{
  if(!p.map)return;
  const d=st.cfg?.display||{};
  if(d.showCoastlines!==false)void installGeo(p,'coast');
  if(d.showStateBoundaries!==false)void installGeo(p,'states');
  if(d.showCountryBoundaries!==false)void installGeo(p,'country');
  if(d.showLandFill!==false)void installGeo(p,'land');
  geographyZoom(p);
 },700);
}

function choose(p,hourOverride=st.hour){const src=st.sources.get(p.cfg.source||st.primary.id);p.src=src;if(!src)return{error:`Unknown source ${p.cfg.source}`};if(src.error)return{error:src.error};let ds;const mode=p.cfg.run||'selected',list=src.datasets;
 if(mode==='latest')ds=list[0];else if(mode==='nearest')ds=list.slice().sort((a,b)=>Math.abs(Date.parse(a.init_time)-Date.parse(st.ref.init_time))-Math.abs(Date.parse(b.init_time)-Date.parse(st.ref.init_time)))[0];else if(mode==='selected')ds=list.find(d=>cycleKey(d.init_time)===st.ref.id);else ds=list.find(d=>d.id===mode);
 if(!ds)return{error:`No matching cycle for ${fmt(st.ref.init_time)}`};if(p.cfg.runOffset){ds=list[list.indexOf(ds)+Number(p.cfg.runOffset)];if(!ds)return{error:'Cycle offset unavailable'};}
 const name=p.cfg.field||st.field,v=ds.variables.find(x=>x.name===name);if(!v)return{error:`Field ${name} is unavailable`,ds};let h=hourOverride+Number(p.cfg.forecastHourOffset||0);if(p.cfg.timeMode==='valid')h=Math.round((valid(st.ref,hourOverride)-Date.parse(ds.init_time))/3600000)+Number(p.cfg.forecastHourOffset||0);return{ds,v,h};}
// A background forecast prefetch can be discarded when the selected cycle/hour
// changes. It is a cache-management event, not a fault in the plot renderer.
function isSupersededPrefetch(e){return /superseded background (?:forecast )?(?:fetch|prefetch)/i.test(String(e?.message||e));}
function fail(p,e){
 if(isSupersededPrefetch(e)){
  // A race with a canceled prefetch should be retried rather than displayed as
  // an alarming rendering error. Avoid spawning duplicate retries.
  p.status='loading';p.save.disabled=true;stage(p,'Loading…');updateStatus();
  if(!p._prefetchRetry){p._prefetchRetry=true;setTimeout(()=>{
   p._prefetchRetry=false;if(p.map&&!p.cfg.placeholder)void renderPanel(p,st.seq);
  },30);}
  return;
 }
 console.error(e);p.status='error';p.save.disabled=true;stage(p,'Rendering error: '+loadingErrorMessage(e));updateStatus();
}
function updateStatus(){const totals={ready:0,waiting:0,loading:0,missing:0,error:0};st.panels.forEach(p=>totals[p.status]=(totals[p.status]||0)+1);el.dataStatus.textContent=`${totals.ready} ready · ${totals.loading} loading · ${totals.waiting} queued · ${totals.missing} missing · ${totals.error} errors`;}
function makeViewBounds(){
 const zoom=st.mode==='globe'?Number(st.cfg.display?.globeInitialZoom??2.6):3.5;
 return {center:[-97.5,38.5],zoom,bearing:0,pitch:0};
}
// The flat map is Mercator, but the weather data remain on the native Lambert grid.
// Compute the model envelope from the *actual Zarr grid metadata*, not arbitrary CONUS lat/lon bounds.
const extentCache=new Map();
function dataBounds(){
 const ds=st.ref||st.primary?.datasets?.[0];if(!ds)return [[-135,18],[-60,57]];
 const key=JSON.stringify([ds.grid,ds.variables[0]?.shape]);if(extentCache.has(key))return extentCache.get(key);
 try{
  const v=ds.variables.find(x=>Array.isArray(x.shape)&&x.shape.length===3)||ds.variables[0];
  const grid=gridFromDataset(ds,v);
  const west=grid.ll_x,east=grid.ur_x,south=grid.ll_y,north=grid.ur_y;
  const n=28;let minLon=Infinity,maxLon=-Infinity,minLat=Infinity,maxLat=-Infinity;
  const check=(x,y)=>{const [lon,lat]=grid.transform(x,y,{inverse:true});if(Number.isFinite(lon)&&Number.isFinite(lat)){
    minLon=Math.min(minLon,lon);maxLon=Math.max(maxLon,lon);
    minLat=Math.min(minLat,lat);maxLat=Math.max(maxLat,lat);}};
  for(let i=0;i<=n;i++){const t=i/n;check(west+(east-west)*t,south);check(west+(east-west)*t,north);check(west,south+(north-south)*t);check(east,south+(north-south)*t);}
  if(minLon>=maxLon||minLat>=maxLat)throw Error('invalid coordinates');
  const bounds=[[minLon,minLat],[maxLon,maxLat]];extentCache.set(key,bounds);return bounds;
 }catch(e){console.warn('Could not compute model bounds from Lambert grid',e);return [[-135,18],[-60,57]];}
}
function fitDataExtent(map){
 if(!map||st.mode!=='lambert')return;
 const limits=dataBounds();
 // IMPORTANT: setMaxBounds(bounds) forces a *smaller* viewport than fitBounds()
 // on many aspect ratios. This cropped the RRFS perimeter in v7.4.
 const old=st.syncing;st.syncing=true;
 try{
  if(map.setMaxBounds)map.setMaxBounds(null);
  map.setMinZoom(0);
  map.fitBounds(limits,{
   padding:Math.max(10,Number(st.cfg.display?.dataExtentPaddingPx??40)),
   duration:0,maxZoom:7
  });
  const fitted=map.getZoom();
  // Some breathing room below the fitted extent, but not an unrestricted world view.
  // Clamp *after* fitBounds. No hard maxBounds that can undo the fit.
  const slack=Math.max(0,Number(st.cfg.display?.modelExtentZoomOutAllowance??0.7));
  const minimum=st.cfg.display?.limitFlatZoomOut===false?0:Math.max(0,fitted-slack);
  map.setMinZoom(minimum);
  map.__evuExtentFitted=true;
 }finally{st.syncing=old;}
}

function applyProjection(map){
 const globe=st.mode==='globe';
 if(map.setMaxBounds)map.setMaxBounds(null);
 map.setMinZoom(0);
 map.setProjection({type:globe?'globe':'mercator'});
 if(map.getLayer('counties'))map.setLayerZoomRange('counties',countyThreshold(),24);
 const b=makeViewBounds();map.setMaxZoom(st.cfg.display.maxZoom||12);
 map.jumpTo({...b,bearing:0,pitch:0});
 if(!globe){map.__evuExtentFitted=false;fitDataExtent(map);}
 if(map.getLayer('counties'))map.setLayerZoomRange('counties',countyThreshold(),24);
 st.mapView=null;
 for(const p of st.active)if(p.map===map)geographyZoom(p);
}
function resetView(map){applyProjection(map);}
function syncViews(source){if(st.syncing||st.exportRender||!st.cfg.display.syncMaps)return;st.syncing=true;const c=source.getCenter(),camera={center:[c.lng,c.lat],zoom:source.getZoom(),bearing:source.getBearing(),pitch:source.getPitch()};st.mapView=camera;for(const p of st.active)if(p.map&&p.map!==source)p.map.jumpTo(camera);st.syncing=false;}
// Cursor position is shared geographically, never as a pixel coordinate; each
// panel projects the location onto its own camera and samples its own field.
function clearSynchronizedHover(){
 st.hover=null;if(st.hoverRaf)cancelAnimationFrame(st.hoverRaf);st.hoverRaf=0;
 for(const p of st.panels){p.ghost.hidden=true;p.info.hidden=true;}
}
function queueSynchronizedHover(master,position){
 if(st.exportRender||st.cfg?.display?.synchronizedCursors===false)return;
 st.hover={master,lon:position.lng,lat:position.lat};
 if(!st.hoverRaf)st.hoverRaf=requestAnimationFrame(()=>{st.hoverRaf=0;paintSynchronizedHover();});
}
function paintSynchronizedHover(){
 const h=st.hover;if(!h)return;
 for(const p of st.panels){
  if(p.cfg.placeholder||!p.map){p.ghost.hidden=true;p.info.hidden=true;continue;}
  const map=p.map,canvas=map.getCanvas(),w=canvas.clientWidth||p.view.clientWidth,
    height=canvas.clientHeight||p.view.clientHeight;
  let xy;try{xy=map.project([h.lon,h.lat]);}catch(_){xy=null;}
  const visible=xy&&Number.isFinite(xy.x)&&Number.isFinite(xy.y)&&xy.x>=0&&xy.y>=0&&
    xy.x<=w&&xy.y<=height&&globeFrontVisible(map,h.lon,h.lat);
  // The native mouse pointer stays fully functional. Overlay a brighter
  // noninteractive white halo *under* it in the active panel, while other
  // panels retain subdued cyan geographic crosshairs.
  p.ghost.classList.toggle('master-crosshair',p===h.master);
  p.ghost.hidden=!visible;
  if(visible){p.ghost.style.left=xy.x+'px';p.ghost.style.top=xy.y+'px';}
  // Even when the field is missing, show the coordinates and lack of data.
  if(!visible){p.info.hidden=true;continue;}
  let reading='No data';
  if(p.rawField&&p.v){try{
    const value=Number(p.rawField.sampleField(h.lon,h.lat));
    if(Number.isFinite(value)&&value> -1e9)reading=`${formatReadout(value,fieldInfo(p.v))} ${fieldInfo(p.v).unit}`.trim();
  }catch(_){}}
  p.info.textContent=`${h.lat.toFixed(2)}°, ${h.lon.toFixed(2)}° · ${reading}`;
  p.info.hidden=false;
 }
}

function createMap(p){
 const node=document.createElement('div');node.className='map-host';
 node.style='position:absolute;inset:0;';p.frame.replaceChildren(node);
 const windCanvas=document.createElement('canvas');windCanvas.className='wind-overlay';
 windCanvas.setAttribute('aria-hidden','true');p.frame.append(windCanvas);p.windCanvas=windCanvas;
 const view=st.mapView||makeViewBounds();
 const m=new maplibregl.Map({container:node,style:mapStyle(),center:view.center,
  zoom:view.zoom,bearing:view.bearing||0,pitch:view.pitch||0,
  projection:{type:st.mode==='globe'?'globe':'mercator'},
  minZoom:0,maxZoom:st.cfg.display.maxZoom||12,
  // Keyboard arrows are reserved for forecast-hour / cycle navigation, not map panning.
  keyboard:false,
  attributionControl:false,preserveDrawingBuffer:true,fadeDuration:0});
 // Defense-in-depth for MapLibre builds that register keyboard navigation anyway.
 if(m.keyboard?.disable)m.keyboard.disable();
 p.map=m;p.geoApplied=new Set();p.geoPending=new Set();
 m.on('move',()=>{if(!st.rendering)syncViews(m);scheduleWindRedraw(p);if(st.hover&&!st.exportRender&&!st.hoverRaf)st.hoverRaf=requestAnimationFrame(()=>{st.hoverRaf=0;paintSynchronizedHover();});});
 m.on('resize',()=>scheduleWindRedraw(p));
 m.on('zoomend',()=>geographyZoom(p));
 m.on('mousemove',e=>queueSynchronizedHover(p,e.lngLat));
 m.on('mouseleave',()=>{if(st.hover?.master===p)clearSynchronizedHover();});
 m.on('error',e=>{p.lastMapError=String(e.error?.message||e.error||e);console.warn('MapLibre',p.lastMapError);});
 m.on('load',()=>{
  if(p.map!==m)return;
  try{addGeographySkeleton(m);}
  catch(e){p.lastMapError='Could not install geography layers: '+String(e);console.error(p.lastMapError);}
  updateGeographyVisibility(p);
  if(st.mode==='lambert'&&!st.mapView&&!m.__evuExtentFitted)fitDataExtent(m);
  startGeography(p);
 });
 p.view.classList.add('has-live-map');p.snap.hidden=true;return m;
}
function discardMap(p){
 if(!p.map)return;
 if(st.hover?.master===p)clearSynchronizedHover();else{p.ghost.hidden=true;p.info.hidden=true;}
 if(p.geoTimer)clearTimeout(p.geoTimer);p.geoTimer=null;
 try{const snap=p.lastSnapshot||p.map.getCanvas().toDataURL('image/png');p.snap.src=snap;p.lastSnapshot=snap;p.snap.hidden=false;}
 catch(e){console.warn('Could not retain snapshot',e);}
 p.map.remove();p.map=null;p.wind=null;p.windCanvas=null;p.windFrameRequested=false;p.component=null;p.layer=null;p.rawField=null;p.lastKey=null;p.mapReady=null;p.grid=null;p.gridKey=null;
 p.geoApplied=new Set();p.geoPending=new Set();p.frame.replaceChildren();
 p.view.classList.remove('has-live-map');st.active=st.active.filter(x=>x!==p);
}
function waitMapReady(p,m){
 return new Promise((resolve,reject)=>{
  let settled=false,deadline=null,tick=null,poll=null;
  const timeout=Math.max(30000,Number(st.cfg.display?.mapInitTimeoutSeconds||60)*1000);
  const finish=(error)=>{
   if(settled)return;settled=true;clearTimeout(tick);clearTimeout(deadline);clearInterval(poll);
   if(typeof m.off==='function')m.off('load',onLoad);
   error?reject(error):resolve();
  };
  const onLoad=()=>{if(st.mode==='lambert'&&!st.mapView&&!m.__evuExtentFitted)fitDataExtent(m);finish(null);};
  m.on('load',onLoad);
  // A load event can be lost during rapid initialization; style readiness is enough
  // to attach autumnplot-gl. Safely install geographic layer stubs if needed.
  const probe=()=>{
   if(p.map!==m)return;
   try{
    if(m.loaded?.()||m.isStyleLoaded?.()){
     if(!m.getLayer?.('coast'))addGeographySkeleton(m);
     finish(null);
    }
   }catch(e){p.lastMapError='Style readiness: '+String(e);}
  };
  poll=setInterval(probe,800);
  tick=setTimeout(()=>{
   if(p.map===m)setNote(p,'MapLibre startup delayed. Check vendor worker and WebGL with diagnostics.html…');
  },7000);
  deadline=setTimeout(()=>finish(new Error('MapLibre map did not start after '+Math.round(timeout/1000)+' s. '+
   (p.lastMapError?`Map error: ${p.lastMapError}. `:'')+
   'Check diagnostics.html; verify vendor/maplibre-gl-csp-worker.js loads, WebGL is enabled, and the site Content Security Policy allows worker-src self.')),timeout);
  probe();
 });
}
async function activate(p){
 if(!p||p.cfg.placeholder)return;
 if(p.activation)return p.activation;
 p.activation=activateInternal(p).finally(()=>{p.activation=null;});
 return p.activation;
}
async function activateInternal(p){
 if(p.map){p._used=++st.clock;if(p.mapReady)await p.mapReady;return renderPanel(p,st.seq);}
 const limit=Math.max(1,Math.min(innerWidth<=800?4:12,Number(st.cfg.display.maxActiveMaps||7)));
 if(st.active.length>=limit){
  const candidates=st.active.filter(x=>!x.busy&&x!==p).sort((a,b)=>a._used-b._used);
  if(candidates[0])discardMap(candidates[0]);else return;
 }
 p._used=++st.clock;st.active.push(p);p.status='loading';
 setNote(p,'Initializing map engine (geographic overlays load separately)…');updateStatus();
 const m=createMap(p);p.mapReady=waitMapReady(p,m);
 try{await p.mapReady;if(p.map===m)await renderPanel(p,st.seq);}
 catch(e){if(p.map===m)discardMap(p);throw e;}
 finally{if(p.map===m)p.mapReady=null;}
}
async function renderAll(){cancelQueuedPrefetches();st.seq++;st.rendering=true;const seq=st.seq;for(const p of st.panels){p.save.disabled=true;p.snap.hidden=true;p.lastSnapshot=null;if(p.cfg.placeholder){p.status='missing';continue;}if(!p.map){p.status='waiting';setNote(p,'Select or scroll to this panel to render');}}try{await Promise.all(st.active.filter(p=>p.map).map(p=>renderPanel(p,seq)));}finally{st.rendering=false;updateStatus();schedulePrefetch();}}
// Foreground fetches always take priority. At most one speculative request is
// active, leaving capacity for immediate navigation even on slow connections.
function limiter(fn,background=false,key=null){
 return new Promise((resolve,reject)=>{
  const t={fn,resolve,reject,background,key};
  st.queue.push(t);if(key)st.queuedFetches.set(key,t);pump();
 });
}
function pump(){
 const cap=Math.max(1,Math.min(6,Number(st.cfg.display.maxConcurrentFetches||3)));
 while(st.running<cap){
  let idx=st.queue.findIndex(t=>!t.background);
  if(idx<0 && st.prefetchActive<1)idx=st.queue.findIndex(t=>t.background);
  if(idx<0)return;
  const t=st.queue.splice(idx,1)[0];
  if(t.key)st.queuedFetches.delete(t.key);
  st.running++;if(t.background)st.prefetchActive++;
  Promise.resolve().then(t.fn).then(t.resolve,t.reject).finally(()=>{
   st.running--;if(t.background)st.prefetchActive--;pump();
  });
 }
}
function cancelQueuedPrefetches(){
 if(st.prefetchTimer){clearTimeout(st.prefetchTimer);st.prefetchTimer=null;}
 st.prefetchGeneration++;
 const keep=[];
 for(const task of st.queue){
  if(!task.background){keep.push(task);continue;}
  if(task.key)st.queuedFetches.delete(task.key);
  task.reject(new Error('Superseded background forecast prefetch'));
 }
 st.queue=keep;
 pump();
}
function cacheGet(k){const v=st.cache.get(k);if(v){st.cache.delete(k);st.cache.set(k,v);}return v;}
function cachePut(k,v){
 if(st.cache.has(k))st.cacheBytes-=st.cache.get(k).byteLength;
 st.cache.delete(k);st.cache.set(k,v);st.cacheBytes+=v.byteLength;
 const max=Math.max(8,Number(st.cfg.display.decodedCacheMB||96))*1024*1024;
 while(st.cacheBytes>max&&st.cache.size>1){const oldest=st.cache.keys().next().value;st.cacheBytes-=st.cache.get(oldest).byteLength;st.cache.delete(oldest);}
}
function displayKey(src,ds,v,h,m){
 const url=new URL(`${ds.path}/${v.name}/${h}.0.0`,new URL('.',src.url)).href;
 return url+'::'+(m.convert||'native');
}
function displayCacheGet(k){const v=st.displayCache.get(k);if(v){st.displayCache.delete(k);st.displayCache.set(k,v);}return v;}
function displayCachePut(k,v){
 if(st.displayCache.has(k))st.displayCacheBytes-=st.displayCache.get(k).byteLength;
 st.displayCache.delete(k);st.displayCache.set(k,v);st.displayCacheBytes+=v.byteLength;
 const max=Math.max(16,Number(st.cfg.display.displayReadyCacheMB||128))*1024*1024;
 while(st.displayCacheBytes>max&&st.displayCache.size>1){const oldest=st.displayCache.keys().next().value;st.displayCacheBytes-=st.displayCache.get(oldest).byteLength;st.displayCache.delete(oldest);}
}
async function getDisplayData(src,ds,v,h,m,onProgress){
 const k=displayKey(src,ds,v,h,m),cached=displayCacheGet(k);
 if(cached)return cached;
 if(st.displayInflight.has(k))return st.displayInflight.get(k);
 const pending=(async()=>{
  const raw=await chunk(src,ds,v,h,onProgress);
  onProgress('Preparing display values…');
  const out=processedData(raw,m,v);displayCachePut(k,out);return out;
 })();
 st.displayInflight.set(k,pending);
 try{return await pending;}finally{st.displayInflight.delete(k);}
}
async function chunk(src,ds,v,h,onProgress=()=>{},opts={}){const url=new URL(`${ds.path}/${v.name}/${h}.0.0`,new URL('.',src.url)).href,k=url;const cached=cacheGet(k);if(cached)return cached;if(st.inflight.has(k)){
  // If a forecast hour is requested while its prefetch is still queued,
  // promote the SAME request instead of making a second HTTP download.
  if(!opts.background){const queued=st.queuedFetches.get(k);if(queued&&queued.background){queued.background=false;pump();}}
  try{return await st.inflight.get(k);}
  catch(e){
   if(!opts.background&&isSupersededPrefetch(e)){
    // The background queue was canceled between scheduling and promotion.
    // Its promise is settled; request the hour again as foreground work.
    await Promise.resolve();
    return chunk(src,ds,v,h,onProgress,opts);
   }
   throw e;
  }
 }
 const task=limiter(async()=>{const [nt,ny,nx]=v.shape;if(v.chunks[0]!==1||v.chunks[1]!==ny||v.chunks[2]!==nx)throw Error('Unsupported chunking; expected [1,ny,nx]');if(v.compressor?.id!=='zlib'||!['<f4','|u1'].includes(v.dtype))throw Error('Only zlib float32/uint8 Zarr-v2 fields supported');onProgress(`Requesting ${v.name} F${pad3(h)} Zarr chunk…`);
 const controller=new AbortController();const waitMs=Math.max(30000,Number(st.cfg.display.chunkTimeoutSeconds||150)*1000);
 const timer=setTimeout(()=>controller.abort(),waitMs);
 let decoded;
 try{
  const r=await fetch(url,{signal:controller.signal});
  if(!r.ok)throw Error(`Chunk HTTP ${r.status}: ${url}`);
  const bytes=r.headers.get('content-length');
  onProgress(`Downloading ${v.name} F${pad3(h)}${bytes?' ('+(Number(bytes)/1048576).toFixed(1)+' MB compressed)':''}…`);
  if(!r.body)throw Error('This browser/server did not provide a streaming Zarr response');
  decoded=await new Response(r.body.pipeThrough(new DecompressionStream('deflate'))).arrayBuffer();
 }catch(e){if(controller.signal.aborted)throw Error(`Zarr chunk timed out after ${Math.round(waitMs/1000)} s: ${url}`);throw e;}
 finally{clearTimeout(timer);}
 onProgress(`Decompressed ${v.name} F${pad3(h)}: preparing GPU data…`);
 const expected=nx*ny*(v.dtype==='<f4'?4:1);if(decoded.byteLength!==expected)throw Error(`Decoded ${decoded.byteLength} bytes; expected ${expected}`);const ary=v.dtype==='<f4'?new Float32Array(decoded):new Uint8Array(decoded);cachePut(k,ary);return ary;},Boolean(opts.background),k);st.inflight.set(k,task);try{return await task;}finally{st.inflight.delete(k);}}
function gridFromDataset(ds,v){const g=ds.grid||{},[_,ny,nx]=v.shape;const get=(name,alt)=>Number(g['GRIB_'+name]??alt);const a=Number(st.cfg.display.earthRadiusM||6371229);const grid=apgl.LambertGrid.fromLLCornerLonLat(nx,ny,get('LoVInDegrees',-97.5),get('LaDInDegrees',38.5),[get('Latin1InDegrees',38.5),get('Latin2InDegrees',38.5)],get('longitudeOfFirstGridPointInDegrees',-122.719528),get('latitudeOfFirstGridPointInDegrees',21.138123),get('DxInMetres',3000),get('DyInMetres',3000),a,a);return grid;}
function gridForPanel(p,ds,v){
 const sig=JSON.stringify([ds.grid,v.shape[1],v.shape[2],st.cfg.display.earthRadiusM]);
 if(p.grid&&p.gridKey===sig)return p.grid;
 p.grid=gridFromDataset(ds,v);p.gridKey=sig;return p.grid;
}
// A fixed-level colormap allows nonlinear rain/snow bands: e.g. 0.1–0.25 in
// gets its own color, without sacrificing the ability to show 20+ in.
// Important: levels.length MUST equal colors.length+1 (autumnplot-gl API).
function sampledColors(colors,n){
 if(colors.length===n)return colors.slice();
 return Array.from({length:n},(_,i)=>colors[Math.round((i+.5)*colors.length/n-.5)]);
}
function pal(m,v){
 if(m.ptype)return{levels:[.5,1.5,2.5,3.5,4.5,5.5],colors:PTYPE.slice(1)};
 if(m.category)return{levels:[.5,1.5],colors:[m.category]};
 if(m.levels&&m.bandColors){
  return {levels:m.levels.slice(),colors:sampledColors(m.bandColors,m.levels.length-1),banded:true};
 }
 const stops=(m.colors||[[0,'#3165a8'],[1,'#efa53c']]).map(([x,c])=>[m.fraction?m.min+x*(m.max-m.min):x,c]).sort((a,b)=>a[0]-b[0]);
 function col(v){if(v<=stops[0][0])return stops[0][1];if(v>=stops.at(-1)[0])return stops.at(-1)[1];let i=0;while(i<stops.length-2&&v>stops[i+1][0])i++;const [x,ca]=stops[i],[y,cb]=stops[i+1],t=(v-x)/(y-x||1);const hex=h=>[1,3,5].map(j=>parseInt(h.slice(j,j+2),16));const a=hex(ca),b=hex(cb);return '#'+a.map((c,j)=>Math.round(c+(b[j]-c)*t).toString(16).padStart(2,'0')).join('');}
 const lo=Math.max(m.min,m.cutoff??m.min),hi=m.max,n=64;
 return{levels:Array.from({length:n+1},(_,i)=>lo+(hi-lo)*i/n),colors:Array.from({length:n},(_,i)=>col(lo+(hi-lo)*(i+.5)/n))};
}
function makeColormap(m,v){const o=pal(m,v);return new apgl.ColorMap(o.levels,o.colors,{underflow_color:'#00000000',overflow_color:o.colors.at(-1)});}
function processedData(raw,m,v){const out=new Float32Array(raw.length);for(let i=0;i<out.length;i++){const x=raw[i];out[i]=Number.isFinite(x)&&Math.abs(x)<1e15?convert(x,m):-1e10;}return out;}
// Conventional 10-m meteorological wind barbs (knots). The underlying vectors
// are the native UGRD/VGRD 10-m Zarr chunks; no directional approximation.
// Display density is based on map zoom, rather than source grid spacing.
function barbSpacing(zoom){
 const d=st.cfg?.display||{};
 // Sampling density is measured in screen pixels; the spacing gets tighter at
 // higher zoom while avoiding a massive draw loop on wide single-panel maps.
 const min=Math.max(16,Number(d.windBarbMinSpacingPx??22));
 // Roughly 20–30% tighter than V7.23, while retaining progressive disclosure.
 const base=zoom<3?49:zoom<4?43:zoom<5.5?37:zoom<7?32:zoom<8.5?26:22;
 return Math.max(min,base);
}
function strokeBarb(ctx){
 // The wind field spans both dark and pale colors. Dark navy ink with a fine
 // light keyline stays legible without the thick white-looking old halo.
 const ink=st.theme==='dark'?'#061624':'#142839';
 ctx.strokeStyle='rgba(240,250,255,.76)';ctx.lineWidth=2.8;ctx.stroke();
 ctx.strokeStyle=ink;ctx.lineWidth=1.65;ctx.stroke();
}
function barbGeometry(ctx,x,y,dirX,dirY,speed,shaftLength){
 // Standard NWS/SPC-style, Northern Hemisphere wind-barb geometry.
 // The shaft starts at the station (x,y) and points toward the wind's source.
 // Construct the icon in the shaft's LOCAL frame, then rotate that frame as a
 // unit. This keeps north/south/east/west barbs identical under rotation.
 const n=Math.hypot(dirX,dirY);
 if(n<1e-6)return;
 if(speed<2.5){ctx.beginPath();ctx.arc(x,y,2.7,0,2*Math.PI);strokeBarb(ctx);return;}
 const ux=dirX/n,uy=dirY/n;
 // Screen y increases downward. Rotate the upwind shaft +90 degrees in screen
 // coordinates; for a north wind this places feathers to the EAST (right).
 // Using the same local frame for all directions avoids handedness flips.
 const sx=-uy,sy=ux;
 const rounded=Math.max(0,Math.round(speed/5)*5);
 const flags=Math.floor(rounded/50);
 const full=Math.floor((rounded%50)/10);
 const half=rounded%10>=5;
 const nominal=Math.max(14,Number(shaftLength)||18);
 // Ratios follow standard weather-map notation: 50-kt pennants are triangles,
 // 10-kt feathers full length, 5-kt feathers half length.
 const spacing=nominal*.125;
 const height=nominal*.40;
 const flagWidth=nominal*.25;
 const required=2+flags*(flagWidth+spacing)+full*spacing+(half?1.5*spacing:0);
 const len=Math.max(nominal,required);
 const at=t=>[x+ux*t,y+uy*t];
 const featherTip=(t,sideLength,rake)=>[x+ux*(t+rake)+sx*sideLength,y+uy*(t+rake)+sy*sideLength];
 // Draw the full shaft once. Every speed mark begins ON the shaft, without a
 // detached gap. The outside/topmost mark starts exactly at the shaft tip.
 ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(...at(len));
 let pos=len;
 const pennants=[];
 // All 50-kt triangles nearest the OUTER tip, then full 10-kt feathers,
 // then the half (5-kt) feather closest to the station.
 for(let k=0;k<flags;k++){
  if(k>0)pos+=spacing*.5;  // conventional, tighter pennant-to-pennant spacing
  const outer=at(pos);
  const end=[x+ux*(pos-flagWidth*.5)+sx*height,y+uy*(pos-flagWidth*.5)+sy*height];
  const inner=at(pos-flagWidth);
  pennants.push([outer,end,inner]);
  pos-=flagWidth+spacing;
 }
 for(let k=0;k<full;k++){
  // The outermost full feather is ATTACHED at the shaft's upwind tip when no
  // pennant is present. Tilt slightly outward, as in conventional barb glyphs.
  ctx.moveTo(...at(pos));ctx.lineTo(...featherTip(pos,height,flagWidth*.5));
  pos-=spacing;
 }
 if(half){
  // A lone 5-kt feather is intentionally inset from the tip (standard style).
  if(flags===0&&full===0)pos-=spacing*1.5;
  ctx.moveTo(...at(pos));ctx.lineTo(...featherTip(pos,height*.5,flagWidth*.25));
 }
 strokeBarb(ctx);
 const ink=st.theme==='dark'?'#061624':'#142839';
 for(const triangle of pennants){
  ctx.beginPath();ctx.moveTo(...triangle[0]);ctx.lineTo(...triangle[1]);
  ctx.lineTo(...triangle[2]);ctx.closePath();
  ctx.fillStyle=ink;ctx.fill();
  ctx.strokeStyle='rgba(240,250,255,.76)';ctx.lineWidth=2.5;ctx.stroke();
  ctx.strokeStyle=ink;ctx.lineWidth=.9;ctx.stroke();
 }
}

function globeFrontVisible(map,lon,lat){
 if(st.mode!=='globe')return true;
 const c=map.getCenter(),rad=Math.PI/180;
 return Math.sin(lat*rad)*Math.sin(c.lat*rad)+Math.cos(lat*rad)*Math.cos(c.lat*rad)*Math.cos((lon-c.lng)*rad)>0.025;
}
// Render directly into an overlay canvas that shares MapLibre's CSS coordinate
// system; composited into PNG exports using the identical map-image transform.
function drawWindBarbs(p){
 const c=p.windCanvas,m=p.map;if(!c||!m)return;
 const w=m.getCanvas().clientWidth||p.view.clientWidth,h=m.getCanvas().clientHeight||p.view.clientHeight;
 if(!(w>0&&h>0))return;
 const dpr=Math.min(2,window.devicePixelRatio||1),cw=Math.max(1,Math.round(w*dpr)),ch=Math.max(1,Math.round(h*dpr));
 if(c.width!==cw)c.width=cw;if(c.height!==ch)c.height=ch;
 const ctx=c.getContext('2d');if(!ctx)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 if(!p.wind||st.field!=='wspd10')return;
 const {u,v}=p.wind;
 const zoom=m.getZoom(),spacing=barbSpacing(zoom),size=Number(st.cfg?.display?.windBarbSizePx??18);
 const columns=Math.ceil(w/spacing),rows=Math.ceil(h/spacing);
 const stepX=w/Math.max(1,columns),stepY=h/Math.max(1,rows);
 // The strokes use dark ink with a slim white keyline, not diffuse shadows.
 ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowBlur=0;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const x=(col+.5)*stepX,y=(row+.5)*stepY;
  let pos;try{pos=m.unproject([x,y]);}catch(_){continue;}
  const lon=pos.lng,lat=pos.lat;
  if(!Number.isFinite(lon)||!Number.isFinite(lat)||Math.abs(lat)>88||!globeFrontVisible(m,lon,lat))continue;
  let uu,vv;try{uu=Number(u.sampleField(lon,lat));vv=Number(v.sampleField(lon,lat));}catch(_){continue;}
  if(!Number.isFinite(uu)||!Number.isFinite(vv)||uu < -1e9||vv < -1e9)continue;
  const speed=Math.hypot(uu,vv);
  if(speed<2.5){barbGeometry(ctx,x,y,0,-1,speed,size);continue;}
  // Calculate compass directions from local projected east and north vectors;
  // remains correct under map rotation, Mercator, and globe projection.
  let e,n;
  try{
   const east=m.project([lon+.08/Math.max(.1,Math.cos(lat*Math.PI/180)),lat]);
   const north=m.project([lon,lat+.08]);
   e=[east.x-x,east.y-y];n=[north.x-x,north.y-y];
  }catch(_){continue;}
  const el=Math.hypot(...e),nl=Math.hypot(...n);
  if(el<1e-5||nl<1e-5)continue;
  const dx=-uu*e[0]/el-vv*n[0]/nl,dy=-uu*e[1]/el-vv*n[1]/nl;
  if(!Number.isFinite(dx+dy)||Math.hypot(dx,dy)<.00001)continue;
  barbGeometry(ctx,x,y,dx,dy,speed,size);
 }
 ctx.shadowBlur=0;
}
function scheduleWindRedraw(p){
 if(!p?.windCanvas||p.windFrameRequested)return;
 p.windFrameRequested=true;
 requestAnimationFrame(()=>{p.windFrameRequested=false;if(p.map)drawWindBarbs(p);});
}
function clearWindBarbs(p){p.wind=null;if(p.windCanvas){const ctx=p.windCanvas.getContext('2d');ctx?.clearRect(0,0,p.windCanvas.width,p.windCanvas.height);}}
async function prepareWindBarbs(p,ds,h,seq){
 if(!p.map||st.field!=='wspd10')return;
 const u=ds.variables.find(v=>v.name==='u10'),v=ds.variables.find(v=>v.name==='v10');
 if(!u||!v||!u.available_hours.includes(h)||!v.available_hours.includes(h))return;
 try{
  const [ud,vd]=await Promise.all([
   getDisplayData(p.src,ds,u,h,fieldInfo(u),()=>{}),
   getDisplayData(p.src,ds,v,h,fieldInfo(v),()=>{})
  ]);
  if(seq!==st.seq||!p.map||st.field!=='wspd10')return;
  p.wind={u:new apgl.RawScalarField(gridForPanel(p,ds,u),ud),v:new apgl.RawScalarField(gridForPanel(p,ds,v),vd)};
  scheduleWindRedraw(p);
 }catch(e){console.warn('10-m barbs unavailable for '+p.cfg.label+':',e);}
}
async function renderPanel(p,seq){if(!p.map)return;clearWindBarbs(p);const selected=choose(p);p.ds=selected.ds||null;p.v=selected.v||null;p.h=selected.h??null;p.title.textContent=`${p.cfg.label||p.cfg.id} · ${selected.v?fieldInfo(selected.v).label:(FIELDS[p.cfg.field||st.field]?.label||p.cfg.field||st.field||'No data')}`;p.sub.textContent=selected.ds&&Number.isInteger(selected.h)?`Init ${fmt(selected.ds.init_time)} · F${pad3(selected.h)} · valid ${fmt(valid(selected.ds,selected.h))}`:'Source unavailable';
 if(selected.error||!selected.v||!Number.isInteger(selected.h)||selected.h<0||selected.h>=selected.v.shape[0]||!selected.v.available_hours.includes(selected.h)){if(p.layer&&p.map?.getLayer(p.layer.id))p.map.removeLayer(p.layer.id);p.layer=null;p.component=null;p.rawField=null;p.lastKey=null;p.status='missing';p.save.disabled=true;setNote(p,selected.error||`No ${selected.v.name} for F${pad3(selected.h)}`);legend(p,null);updateStatus();return;}
 const {ds,v,h}=selected,m=fieldInfo(v);p.status='loading';p.loadSince=Date.now();p.save.disabled=true;updateStatus();p.busy=true;
 // When this hour is cached, replace its texture silently: status overlays make
 // a smooth loop appear to flash even though nothing needs downloading.
 const rawUrl=new URL(`${ds.path}/${v.name}/${h}.0.0`,new URL('.',p.src.url)).href;
 const warm=st.displayCache.has(displayKey(p.src,ds,v,h,m))||st.cache.has(rawUrl);
 clearNote(p);
 let lastProgress=`Loading ${m.label} F${pad3(h)}…`;
 let noteDelay=warm?null:setTimeout(()=>{
  noteDelay=null;
  if(seq===st.seq&&p.map&&p.status==='loading')stage(p,lastProgress);
 },250);
 try{const data=await getDisplayData(p.src,ds,v,h,m,msg=>{
  lastProgress=msg;
  if(!warm&&noteDelay===null&&seq===st.seq&&p.map&&p.status==='loading')stage(p,msg);
 });
 if(noteDelay!==null){clearTimeout(noteDelay);noteDelay=null;}
 if(seq!==st.seq||!p.map)return;
 clearNote(p);
 const grid=gridForPanel(p,ds,v),field=new apgl.RawScalarField(grid,data);const signature=JSON.stringify([v.name,v.shape,ds.grid]);
 if(p.component&&p.lastKey===signature&&typeof p.component.updateField==='function'){await p.component.updateField(field);}
 else{if(p.layer&&p.map.getLayer(p.layer.id))p.map.removeLayer(p.layer.id);const cmap=makeColormap(m,v);const klass=st.cfg.display.fieldRendering==='smooth'&&!m.category&&!m.ptype?apgl.ContourFill:apgl.Raster;const comp=new klass(field,{cmap});const layer=new apgl.PlotLayer(`evu-field-${p.i}`,comp);p.component=comp;p.layer=layer;
 // MapLibre doesn't await async custom-layer onAdd(). autumnplot-gl's onAdd()
 // depends on its *own* worker. Wait for that promise explicitly to catch missing
 // worker bundles instead of claiming the field was rendered successfully.
 let resolveReady,rejectReady;
 const layerReady=new Promise((ok,no)=>{resolveReady=ok;rejectReady=no;});
 const originalOnAdd=layer.onAdd.bind(layer);
 layer.onAdd=(map,gl)=>{
  try{const task=Promise.resolve(originalOnAdd(map,gl));task.then(resolveReady,rejectReady);return task;}
  catch(err){rejectReady(err);throw err;}
 };
 if(!warm)stage(p,`Initializing autumnplot-gl GPU layer (${m.label})…`);
 try{p.map.addLayer(layer,p.map.getLayer('coast')?'coast':undefined);}catch(e){rejectReady(e);throw e;}
 const gpuWait=Math.max(5000,Number(st.cfg.display?.gpuInitTimeoutSeconds||35)*1000);
 let deadline;
 try{await Promise.race([layerReady,new Promise((_,reject)=>{deadline=setTimeout(()=>reject(new Error('GPU layer initialization timed out after '+Math.round(gpuWait/1000)+' s: autumnplot-gl geometry worker did not respond.')),gpuWait);})]);}
 finally{clearTimeout(deadline);}
 p.lastKey=signature;}

 p.rawField=field;legend(p,m);if(st.field==='wspd10')await prepareWindBarbs(p,ds,h,seq);await waitPaint(p.map);if(seq!==st.seq||!p.map)return;p.status='ready';p.save.disabled=false;clearNote(p);if(st.hover&&!st.hoverRaf)st.hoverRaf=requestAnimationFrame(()=>{st.hoverRaf=0;paintSynchronizedHover();});// The PNG export path explicitly captures a finished render frame. Avoid stale blank snapshots here.
 }catch(e){if(seq===st.seq)fail(p,e);}finally{if(noteDelay!==null)clearTimeout(noteDelay);p.busy=false;updateStatus();}}
// Keep the legend in the same units/range as the autumnplot-gl color map.
// Legend-only categorical swatches: 0/No is unshaded in the *map* (the
// native map background remains visible); draw a black No tile in legends so
// both states are explicit. Do not add a black category to the GPU colormap.
function legendSwatches(m,palette){
 return m?.category?['#000000',m.category]:palette.colors;
}
function legendTicks(m,v){
 if(!m)return [];
 if(m.ptype)return ['Rain','Snow','FZRA','Ice','Mixed'].map((label,i)=>({label,pos:(i+.5)/5}));
 if(m.category)return [{label:'No',pos:.25},{label:'Yes',pos:.75}];
 const p=pal(m,v),lo=p.levels[0],hi=p.levels.at(-1);
 const count=Math.max(3,Math.min(15,Number(st.cfg?.display?.legendTickCount??11)||11));
 const fmtNum=(x,decimals)=>x.toFixed(decimals).replace(/(\.\d*?[1-9])0+$/,'$1').replace(/\.0+$/,'');
 if(m===FIELDS.refc||m.label==='Composite reflectivity'){
  // The SPC-style shading changes every 2.5 dBZ, but its colorbar labels
  // remain on familiar 5-dBZ values: 10, 15, 20 ... 70+.
  const total=p.colors.length;
  return Array.from({length:13},(_,i)=>({label:`${10+i*5}${i===12?'+':''}`,pos:(i*2)/total}));
 }
 if(p.banded){
  // The color bar has equal-width swatches. Labels must therefore follow bin
  // boundaries, NOT the linear interpolation used by continuous palettes.
  const n=p.colors.length,k=Math.min(count,n+1);
  const indices=[...new Set(Array.from({length:k},(_,i)=>Math.round(i*n/(k-1))))];
  return indices.map(i=>{const value=p.levels[i];const decimals=value<.01?3:value<1?2:value<10?1:0;
   return {label:fmtNum(value,decimals)+(i===n?'+':''),pos:i/n};});
 }
 const step=(hi-lo)/(count-1),decimals=step>=2?0:step>=.15?1:step>=.015?2:3;
 return Array.from({length:count},(_,i)=>({label:fmtNum(lo+i*step,decimals),pos:i/(count-1)}));
}
function legend(p,m){
 const vertical=!!st.verticalLegends&&!p.cfg.placeholder;
 const fullTitle=m?`${m.label}${m.unit?' ('+m.unit+')':''}`:'No field displayed';
 p.legendTitle.textContent=vertical&&m?(m.unit||m.label):fullTitle;
 p.legendTitle.title=fullTitle;
 const c=p.legendCanvas;
 c.width=vertical?18:640;c.height=vertical?256:16;
 const cx=c.getContext('2d');cx.clearRect(0,0,c.width,c.height);
 p.legendLabels.replaceChildren();p.legendTicks=[];
 if(!m)return;
 const palette=pal(m,p.v),colors=legendSwatches(m,palette),n=colors.length;
 colors.forEach((hex,i)=>{
  cx.fillStyle=hex;
  if(vertical){const h=c.height/n;cx.fillRect(0,c.height-(i+1)*h,c.width,Math.ceil(h+1));}
  else{const w=c.width/n;cx.fillRect(i*w,0,Math.ceil(w+1),c.height);}
 });
 const ticks=legendTicks(m,p.v);p.legendTicks=ticks;
 // Keep the browser colorbar legible even in short 3x3 plot cells. The PNG
 // export still uses the complete tick set and its own larger legend.
 let show=ticks;
 if(vertical&&ticks.length>5){
  const ids=[...new Set(Array.from({length:5},(_,i)=>Math.round(i*(ticks.length-1)/4)))];
  show=ids.map(i=>ticks[i]);
 }
 show.forEach((tick,i)=>{
  const span=document.createElement('span');span.className='legend-tick';
  span.textContent=tick.label;
  if(vertical){span.style.top=((1-tick.pos)*100)+'%';span.dataset.end=tick.pos>=.999?'top':tick.pos<=.001?'bottom':'middle';}
  else{span.style.left=(tick.pos*100)+'%';if(i%2!==0&&!m.ptype)span.dataset.odd='1';}
  p.legendLabels.append(span);
 });
}
// One fixed palette is shared by every panel: the legend must not depend on
// which model has finished downloading (or whether any model has this hour).
function sharedPalette(){
 if(!st.field)return null;
 const entries=st.ref?.entries||[];
 let v=entries.flatMap(({ds})=>ds.variables||[]).find(v=>v.name===st.field);
 if(!v)for(const src of st.sources.values()){
  v=src.datasets?.flatMap(ds=>ds.variables||[]).find(v=>v.name===st.field);
  if(v)break;
 }
 v=v||{name:st.field,attrs:{}};
 const m=fieldInfo(v);return {v,m,palette:pal(m,v),ticks:legendTicks(m,v)};
}
function visibleSharedTicks(ticks,width){
 const max=width<550?5:width<850?7:15;
 if(ticks.length<=max)return ticks;
 const ids=[...new Set(Array.from({length:max},(_,i)=>Math.round(i*(ticks.length-1)/(max-1))))];
 return ids.map(i=>ticks[i]);
}
function updateSharedLegend(){
 if(!el.sharedLegendCanvas||!el.sharedLegendLabels)return;
 const data=sharedPalette();
 const c=el.sharedLegendCanvas,ctx=c.getContext('2d');
 if(!ctx)return;
 ctx.clearRect(0,0,c.width,c.height);
 el.sharedLegendLabels.replaceChildren();
 if(!data){el.sharedLegendTitle.textContent='Field color scale';return;}
 const {m,palette,ticks}=data;
 const title=`${m.label}${m.unit?' ('+m.unit+')':''}`;
 el.sharedLegendTitle.textContent=title;el.sharedLegendTitle.title=title;
 const colors=legendSwatches(m,palette),n=colors.length;
 colors.forEach((color,i)=>{ctx.fillStyle=color;ctx.fillRect(i*c.width/n,0,Math.ceil(c.width/n+1),c.height);});
 const width=el.sharedLegend?.clientWidth||innerWidth;
 const shown=visibleSharedTicks(ticks,width);
 for(const t of shown){
  const span=document.createElement('span');span.className='shared-legend-tick';span.textContent=t.label;
  span.style.left=`${Math.max(0,Math.min(100,t.pos*100))}%`;
  if(t.pos<.001)span.dataset.end='first';else if(t.pos>.999)span.dataset.end='last';
  el.sharedLegendLabels.append(span);
 }
}
async function waitPaint(map){if(!map)return;map.triggerRepaint();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await sleep(100);}
function playbackHours(){if(!st.ref)return[];return st.cfg.loopOnlyAvailableHours?availableHours():Array.from({length:Math.max(1,...st.ref.entries.flatMap(({ds})=>(ds.variables||[]).map(v=>v.shape?.[0]||0)))},(_,i)=>i);}
function nextHour(dir=1){const hours=playbackHours();if(!hours.length)return null;const ix=hours.indexOf(st.hour),idx=(ix<0?(dir>0?-1:0):ix)+dir;return hours[(idx+hours.length)%hours.length];}
async function step(dir){const h=nextHour(dir);if(h===null)return;st.hour=h;syncUI();await renderAll();}
// Prepare the next few hours after *every* successful plot, including when
// the viewer is paused and the user advances manually. Only compressed Zarr
// chunks are downloaded/decompressed speculatively; GPU work stays foreground.
// Low-priority tasks yield to user requests and share the same LRU/inflight maps.
function schedulePrefetch(){
 if(st.prefetchTimer)clearTimeout(st.prefetchTimer);
 const d=st.cfg?.display||{};
 if(d.prefetchEnabled===false||d.prefetchNextHour===false||document.hidden||!st.ref||!st.active.length||st.rendering)return;
 const generation=st.prefetchGeneration;
 st.prefetchTimer=setTimeout(()=>{
  st.prefetchTimer=null;
  if(generation!==st.prefetchGeneration||document.hidden||st.rendering)return;
  const timeline=playbackHours();if(!timeline.length)return;
  const advance=Math.max(1,Math.min(4,Math.floor(Number(d.prefetchHours??2)||2)));
  const limit=Math.max(1,Math.min(32,Math.floor(Number(d.prefetchMaxFields??12)||12)));
  const pos=timeline.indexOf(st.hour);
  const seen=new Set(),candidates=[];
  for(let ahead=1;ahead<=advance;ahead++){
   const h=timeline[((pos<0?-1:pos)+ahead+timeline.length)%timeline.length];
   for(const p of st.active){
    if(!p.map||!p.src||p.src.error)continue;
    const selected=choose(p,h),{ds,v}=selected,fh=selected.h;
    if(!ds||!v||!Number.isInteger(fh)||fh<0||fh>=v.shape[0]||!v.available_hours.includes(fh))continue;
    const url=new URL(`${ds.path}/${v.name}/${fh}.0.0`,new URL('.',p.src.url)).href;
    if(seen.has(url)||st.cache.has(url)||st.inflight.has(url))continue;
    seen.add(url);candidates.push({src:p.src,ds,v,h:fh});
    if(candidates.length>=limit)break;
   }
   if(candidates.length>=limit)break;
  }
  // Avoid prefetch floods when multiple models (and 20 panels) are compared.
  // Cache eviction remains enforced by decodedCacheMB.
  for(const c of candidates){
   if(generation!==st.prefetchGeneration)break;
   void chunk(c.src,c.ds,c.v,c.h,()=>{},{background:true}).catch(()=>{});
  }
 },Math.max(50,Math.min(1200,Number(d.prefetchDelayMs??180)||180)));
}
async function play(){if(st.playing)return;st.playing=true;el.playBtn.classList.add('active');el.pauseBtn.classList.remove('active');
 while(st.playing){const start=Date.now();try{await step(1);}catch(err){console.error('Playback stopped',err);stop();break;}
  if(!st.playing)break;
  await sleep(Math.max(50,LOOP_INTERVALS[st.loopSpeedIndex]-(Date.now()-start)));
 }
}
function stop(){st.playing=false;el.pauseBtn.classList.add('active');el.playBtn.classList.remove('active');}
function rounded(ctx,x,y,w,h,r=11){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function clipText(ctx,s,width){s=String(s||'');while(ctx.measureText(s).width>width&&s.length>2)s=s.slice(0,-2)+'…';return s;}
function canvasPNG(c,name){return new Promise((resolve,reject)=>{
 c.toBlob(blob=>{if(!blob){reject(new Error('Canvas export failed; not enough memory?'));return;}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);resolve();
 },'image/png');
});}
// MapLibre draws its basemap and autumnplot-gl weather textures with WebGL.
// Read the finished WebGL framebuffer DURING MapLibre's render event; waiting
// several animation frames and then calling canvas.toDataURL() can yield an
// empty buffer on some browsers even when the plot is visible on screen.
function readMapFramebuffer(map){
 const src=map.getCanvas();
 // MapLibre was created with preserveDrawingBuffer:true. Its own PNG encoder
 // handles premultiplied WebGL alpha correctly; raw readPixels + ImageData can
 // introduce color shifts, especially on semi-transparent weather layers.
 try{
  const nativePNG=src.toDataURL('image/png');
  if(nativePNG && nativePNG.length>1500)return nativePNG;
 }catch(err){console.warn('Native map PNG capture unavailable; using framebuffer fallback',err);}
 const gl=src.getContext('webgl2')||src.getContext('webgl')||src.getContext('experimental-webgl');
 // Read the exact device-pixel dimensions of the GL drawing buffer.
 // Canvas CSS pixels and its drawing buffer are not always the same size.
 const w=gl?.drawingBufferWidth||src.width,h=gl?.drawingBufferHeight||src.height;
 if(!w||!h)throw Error('Map canvas has zero dimensions; resize the map before exporting.');
 if(!gl){
  // Compatible fallback for a non-WebGL map/canvas (also used by diagnostics).
  return src.toDataURL('image/png');
 }
 if(gl.isContextLost?.())throw Error('Map WebGL context is lost. Restore the map before exporting.');
 const pixels=new Uint8Array(w*h*4);
 const previousFramebuffer=gl.getParameter(gl.FRAMEBUFFER_BINDING);
 try{
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
 }finally{gl.bindFramebuffer(gl.FRAMEBUFFER,previousFramebuffer);}
 // A transparent frame is not a weather map; do not silently save an empty PNG.
 let nonblank=false;
 for(let i=3;i<pixels.length;i+=4){if(pixels[i]>0){nonblank=true;break;}}
 if(!nonblank)throw Error('WebGL returned a blank frame; retrying on the next render.');
 // WebGL readPixels() is bottom-up. Flip rows before saving to an ordinary PNG.
 const out=document.createElement('canvas');out.width=w;out.height=h;
 const cx=out.getContext('2d');if(!cx)throw Error('2D export canvas unavailable.');
 const image=cx.createImageData(w,h),stride=w*4;
 for(let row=0;row<h;row++)image.data.set(pixels.subarray((h-row-1)*stride,(h-row)*stride),row*stride);
 // Fallback pixels may be premultiplied; ImageData expects straight RGBA.
 if(gl.getContextAttributes?.()?.premultipliedAlpha){
  for(let i=0;i<image.data.length;i+=4){
   const a=image.data[i+3];
   if(a>0 && a<255){const k=255/a;for(let c=0;c<3;c++)image.data[i+c]=Math.min(255,Math.round(image.data[i+c]*k));}
  }
 }
 cx.putImageData(image,0,0);
 return out.toDataURL('image/png');
}
function captureMapFrame(map,settleFrames=1){
 return new Promise((resolve,reject)=>{
  let settled=false,tries=0,lastError=null,frames=0;
  const timer=setTimeout(()=>finish(new Error('PNG export timed out waiting for a rendered map frame.'+(lastError?' Last error: '+lastError.message:''))),12000);
  const finish=(err,png)=>{
   if(settled)return;settled=true;clearTimeout(timer);map.off('render',onRender);
   err?reject(err):resolve(png);
  };
  const onRender=()=>{
   // The single-panel capture changes the viewport and camera together.
   // The first frame(s) can contain stale geometry or stale custom layers.
   // Don't read the framebuffer until the enlarged map has been repainted.
   if(++frames<settleFrames){map.triggerRepaint();return;}
   try{const png=readMapFramebuffer(map);finish(null,png);}
   catch(err){lastError=err;if(++tries>=3)finish(new Error('Could not capture the map. '+err.message));else map.triggerRepaint();}
  };
  map.on('render',onRender);
  try{map.resize();map.triggerRepaint();}catch(err){finish(err);}
 });
}
// Render a higher-resolution *actual map frame* for PNG exports, rather than
// stretching the small on-screen canvas. The source viewport and camera stay
// unchanged; only the map's drawing-buffer pixel ratio is temporarily raised.
// One map is processed at a time and its original pixel ratio is always restored.
async function decodePNG(data){
 if(!data)return null;const img=new Image();img.src=data;await img.decode();return img;
}
async function captureMapPNG(p,targetW=0,targetH=0,framing='fill',sharpIndividual=false){
 const map=p.map,canvas=map.getCanvas(),node=map.getContainer();
 const oldStyle=node.getAttribute('style')||'';
 const oldCenter=map.getCenter(),oldZoom=map.getZoom(),oldBearing=map.getBearing(),oldPitch=map.getPitch();
 // A sharp standalone export enlarges the viewport and adds log2(scale) to
 // MapLibre zoom; that artificial zoom must NOT reveal counties that were
 // hidden in the live panel. Use the original zoom to decide county visibility.
 // This applies equally in 2D and Globe and is restored in finally on errors.
 const hideExportCounties=sharpIndividual&&oldZoom<countyThreshold()&&!!map.getLayer?.('counties');
 const originalCountyVisibility=hideExportCounties
  ? (map.getLayoutProperty?.('counties','visibility')||'visible') : null;
 const screenW=node.clientWidth||canvas.clientWidth,screenH=node.clientHeight||canvas.clientHeight;
 const expand=framing==='fit'&&screenW>0&&screenH>0&&targetW>0&&targetH>0;
 let newW=screenW,newH=screenH;
 if(expand){
  const targetAspect=targetW/targetH;
  // Reveal nearby geography when the target aspect is wider/taller.
  if(screenW/screenH<targetAspect)newW=Math.ceil(screenH*targetAspect);
  else newH=Math.ceil(screenW/targetAspect);
 }
 // Standalone PNGs are much larger than one cell in a nine-panel grid.
 // Render the MAP at presentation size rather than stretching the original
 // small framebuffer. Growing the viewport by factor k and increasing zoom
 // by log2(k) preserves the same ground footprint at higher pixel density.
 // Do not alter all-panels export: its established capture is already sharp.
 let renderScale=1;
 if(sharpIndividual&&targetW>0&&targetH>0&&newW>0&&newH>0){
  const wanted=framing==='fit'
   ? Math.min(targetW/newW,targetH/newH)
   : Math.max(targetW/newW,targetH/newH);
  const gpuBudget=Math.min(3072/newW,3072/newH,8);
  const maxZoom=typeof map.getMaxZoom==='function'?map.getMaxZoom():12;
  const zoomBudget=Math.pow(2,Math.max(0,maxZoom-oldZoom));
  renderScale=Math.max(1,Math.min(wanted,gpuBudget,zoomBudget));
  newW=Math.ceil(newW*renderScale);newH=Math.ceil(newH*renderScale);
 }
 const expanded=newW>screenW+1||newH>screenH+1;
 const exportZoom=oldZoom+Math.log2(renderScale);
 const oldRatio=typeof map.getPixelRatio==='function'?map.getPixelRatio():null;
 let changedRatio=false,windStyle=null;
 let png=null,windPNG=null;
 try{
  if(hideExportCounties)map.setLayoutProperty('counties','visibility','none');
  if(expanded){
   st.exportRender=true;
   node.style.inset='auto';node.style.position='absolute';
   node.style.left=((screenW-newW)/2)+'px';node.style.top=((screenH-newH)/2)+'px';
   node.style.width=newW+'px';node.style.height=newH+'px';
   map.resize();
   map.jumpTo({center:oldCenter,zoom:exportZoom,bearing:oldBearing,pitch:oldPitch});
   // Wind barbs use a separate canvas, which must share the temporary
   // viewport in order to remain aligned with the enlarged map projection.
   if(p.windCanvas&&sharpIndividual){
    windStyle=p.windCanvas.getAttribute('style')||'';
    p.windCanvas.style.inset='auto';p.windCanvas.style.position='absolute';
    p.windCanvas.style.left=node.style.left;p.windCanvas.style.top=node.style.top;
    p.windCanvas.style.width=newW+'px';p.windCanvas.style.height=newH+'px';
   }
  }
  const cssW=node.clientWidth||newW,cssH=node.clientHeight||newH;
  if(oldRatio!=null&&typeof map.setPixelRatio==='function'&&cssW>0&&cssH>0&&targetW>0&&targetH>0){
   const cap=Math.max(1,Math.min(5,Number(st.cfg?.display?.exportMaxPixelRatio??4)||4));
   const budget=Math.min(3072/cssW,3072/cssH);
   const desired=Math.min(cap,budget,Math.max(targetW/cssW,targetH/cssH));
   if(Number.isFinite(desired)&&desired>oldRatio+.05){map.setPixelRatio(desired);changedRatio=true;}
  }
  // Let the high-resolution vector and autumnplot custom layers settle before
  // encoding. Existing all-panels capture remains deliberately unchanged.
  png=await captureMapFrame(map,sharpIndividual?3:1);
  if(p.wind&&st.field==='wspd10'&&p.windCanvas){
   drawWindBarbs(p);windPNG=p.windCanvas.toDataURL('image/png');
  }
 }finally{
  if(changedRatio){try{map.setPixelRatio(oldRatio);}catch(err){console.warn('Could not restore pixel ratio',err);}}
  if(windStyle!==null)p.windCanvas.setAttribute('style',windStyle);
  if(expanded){
   node.setAttribute('style',oldStyle);
   try{map.resize();map.jumpTo({center:oldCenter,zoom:oldZoom,bearing:oldBearing,pitch:oldPitch});map.triggerRepaint();}
   catch(err){console.warn('Could not restore export viewport',err);}
  }
  // Restore exactly what was visible before the export, even if capture fails.
  if(hideExportCounties){
   try{map.setLayoutProperty('counties','visibility',originalCountyVisibility);map.triggerRepaint();}
   catch(err){console.warn('Could not restore county visibility after export',err);}
  }
  st.exportRender=false;
  if(p.windCanvas)scheduleWindRedraw(p);
  if(st.hover&&!st.hoverRaf)st.hoverRaf=requestAnimationFrame(()=>{st.hoverRaf=0;paintSynchronizedHover();});
 }
 return {map:await decodePNG(png),wind:await decodePNG(windPNG),png};
}
async function panelImage(p,targetW=0,targetH=0,framing='fill',sharpIndividual=false){
 if(p.map){const output=await captureMapPNG(p,targetW,targetH,framing,sharpIndividual);p.lastSnapshot=output.png;return output;}
 return {map:await decodePNG(p.lastSnapshot||null),wind:null};
}
// Draw a captured map without ever distorting geographic shapes. In particular,
// the map's framebuffer is often much wider than the old fixed PNG plot box.
// Letterbox/pillarbox only when comparing panels with different aspect ratios.
function mapDrawingRect(image,x,y,width,height,framing='fill'){
 const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
 if(!(iw>0&&ih>0&&width>0&&height>0))throw Error('Invalid map or PNG export dimensions');
 if(framing==='fit'){
  const scale=Math.min(width/iw,height/ih),dw=iw*scale,dh=ih*scale;
  return {sx:0,sy:0,sw:iw,sh:ih,dx:x+(width-dw)/2,dy:y+(height-dh)/2,dw,dh};
 }
 // Presentation-first fill: NO stretching, preserve center of the on-screen
 // view, crop only as needed to match a different slide-cell aspect ratio.
 const scale=Math.max(width/iw,height/ih),sw=width/scale,sh=height/scale;
 return {sx:(iw-sw)/2,sy:(ih-sh)/2,sw,sh,dx:x,dy:y,dw:width,dh:height};
}
function drawMapFramed(ctx,image,x,y,width,height,framing='fill'){
 const rect=mapDrawingRect(image,x,y,width,height,framing);
 ctx.drawImage(image,rect.sx,rect.sy,rect.sw,rect.sh,rect.dx,rect.dy,rect.dw,rect.dh);
 return rect;
}
function drawWindExport(ctx,windImage,mapRect,mapImage){
 if(!windImage)return;
 const iw=mapImage.naturalWidth||mapImage.width,ih=mapImage.naturalHeight||mapImage.height;
 const scaleX=windImage.naturalWidth/iw,scaleY=windImage.naturalHeight/ih;
 ctx.drawImage(windImage,mapRect.sx*scaleX,mapRect.sy*scaleY,
   mapRect.sw*scaleX,mapRect.sh*scaleY,mapRect.dx,mapRect.dy,mapRect.dw,mapRect.dh);
}
function panelMapRatio(p){
 const c=p.map?.getCanvas?.();
 if(c?.width>0&&c?.height>0)return c.width/c.height;
 const rect=p.view?.getBoundingClientRect?.();
 return rect?.width>0&&rect?.height>0?rect.width/rect.height:null;
}
async function drawExport(ctx,p,x,y,w,h,verticalLegend=false,sharedMode=false){
 if(sharedMode){
  const light=st.theme==='light',fg=light?'#1d2e42':'#eef4fa',muted=light?'#54687e':'#aebfd1';
  // Each comparison cell is entirely map: no redundant header or colorbar.
  ctx.fillStyle=light?'#d6e6ee':'#0b2238';ctx.fillRect(x,y,w,h);
  const captured=await panelImage(p,w,h,st.lastExportFraming);
  if(captured.map&&p.status==='ready'){
   const im=captured.map;
   const rect=drawMapFramed(ctx,im,x,y,w,h,st.lastExportFraming);
   drawWindExport(ctx,captured.wind,rect,im);
  }else{
   ctx.fillStyle=muted;ctx.font=`${Math.max(16,Math.min(25,w/35))}px Arial`;
   ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillText(clipText(ctx,p.note?.textContent||'Data unavailable',w-30),x+w/2,y+h/2);
  }
  // WebGL captures do not include HTML overlays. Retain the model and valid
  // time annotation IN the plotting area for exported comparison images.
  const name=String(p.title.textContent||p.cfg.label||p.cfg.id);
  const run=String(p.sub.textContent||'');
  const fontSize=Math.max(12,Math.min(19,w/47));
  ctx.font=`bold ${fontSize}px Arial`;
  const labelW=Math.min(w-12,Math.max(ctx.measureText(name).width,ctx.measureText(run).width*.86)+20);
  const lineH=fontSize*1.2,boxH=lineH*2+12;
  ctx.fillStyle=light?'rgba(255,255,255,.87)':'rgba(5,16,30,.83)';
  ctx.fillRect(x+6,y+6,labelW,boxH);
  ctx.fillStyle=fg;ctx.textAlign='left';ctx.textBaseline='top';
  ctx.fillText(clipText(ctx,name,labelW-14),x+13,y+12);
  ctx.font=`${Math.max(10,fontSize*.78)}px Arial`;ctx.fillStyle=muted;
  ctx.fillText(clipText(ctx,run,labelW-14),x+13,y+12+lineH);
  return;
 }

 const light=st.theme==='light',fg=light?'#1d2e42':'#eef4fa',muted=light?'#54687e':'#aebfd1';
 ctx.fillStyle=light?'#fff':'#101d2e';rounded(ctx,x,y,w,h,12);
 ctx.fillStyle=fg;ctx.font=`bold ${Math.max(15,Math.min(25,w/40))}px Arial`;
 ctx.textBaseline='middle';ctx.textAlign='left';
 ctx.fillText(clipText(ctx,p.title.textContent,w-36),x+18,y+23);
 ctx.font=`${Math.max(11,Math.min(15,w/70))}px Arial`;ctx.fillStyle=muted;
 ctx.fillText(clipText(ctx,p.sub.textContent,w-36),x+18,y+53);
 // In large comparison grids, a narrow vertical bar gives the map noticeably
 // more height. Individual/short-grid exports retain a horizontal colorbar.
 const side=verticalLegend?Math.max(75,Math.min(102,Math.round(w*.09))):0;
 const boxX=x+14,boxY=y+75,boxW=w-28-side,boxH=h-(verticalLegend?90:160);
 ctx.fillStyle=light?'#d6e6ee':'#0b2238';ctx.fillRect(boxX,boxY,boxW,boxH);
 const captured=await panelImage(p,boxW,boxH,st.lastExportFraming,true);
 if(captured.map&&p.status==='ready'){
  const im=captured.map;
  const rect=drawMapFramed(ctx,im,boxX,boxY,boxW,boxH,st.lastExportFraming);
  drawWindExport(ctx,captured.wind,rect,im);
 }else{
  ctx.fillStyle=muted;ctx.font='15px Arial';ctx.textBaseline='middle';
  ctx.fillText(clipText(ctx,p.note?.textContent||'Data unavailable',boxW-32),boxX+16,boxY+boxH/2);
 }
 if(p.status!=='ready')return;
 if(verticalLegend){
  const lx=boxX+boxW+13,ly=boxY+29,lw=14,lh=Math.max(20,boxH-41);
  const m=fieldInfo(p.v),palette=pal(m,p.v),colors=legendSwatches(m,palette),n=colors.length;
  ctx.fillStyle=fg;ctx.font='bold 12px Arial';ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.fillText(clipText(ctx,m.unit||m.label,side-13),lx,boxY+11);
  const ch=lh/n;
  for(let i=0;i<n;i++){ctx.fillStyle=colors[i];ctx.fillRect(lx,ly+lh-(i+1)*ch,lw,Math.ceil(ch+1));}
  ctx.strokeStyle=muted;ctx.lineWidth=1;ctx.strokeRect(lx,ly,lw,lh);
  const ticks=p.legendTicks||legendTicks(m,p.v);
  const positions=ticks.length<=5?ticks:[...new Set(Array.from({length:5},(_,i)=>Math.round(i*(ticks.length-1)/4)))].map(i=>ticks[i]);
  ctx.font='11px Arial';ctx.textAlign='left';ctx.fillStyle=muted;
  for(const tick of positions){
   const ty=ly+lh*(1-tick.pos);
   ctx.fillRect(lx+lw,ty-.5,4,1);
   ctx.textBaseline=tick.pos>=.999?'top':tick.pos<=.001?'bottom':'middle';
   ctx.fillText(tick.label,lx+lw+6,ty);
  }
  ctx.textBaseline='middle';
 }else{
  const m=fieldInfo(p.v),palette=pal(m,p.v),colors=legendSwatches(m,palette),n=colors.length;
  const fullLegend=`${m.label}${m.unit?' ('+m.unit+')':''}`;
  ctx.fillStyle=fg;ctx.font=`bold ${Math.max(12,Math.min(16,w/58))}px Arial`;
  ctx.fillText(clipText(ctx,fullLegend,w-30),x+18,y+h-69);
  // Build the export legend from palette data, never stretch the small vertical
  // browser legend canvas into a horizontal gradient.
  const bx=x+18,by=y+h-49,bw=w-36,bh=13;
  for(let i=0;i<n;i++){ctx.fillStyle=colors[i];ctx.fillRect(bx+i*bw/n,by,Math.ceil(bw/n+1),bh);}
  const ticks=p.legendTicks||legendTicks(m,p.v);ctx.fillStyle=muted;ctx.font='11px Arial';
  const shown=ticks.filter((_,i)=>ticks.length<=5||w>=850||i%2===0||i===ticks.length-1);
  for(const tick of shown){
   const tx=x+18+(w-36)*tick.pos;
   ctx.textAlign=tick.pos===0?'left':tick.pos===1?'right':'center';
   ctx.fillText(tick.label,tx,y+h-21);ctx.fillRect(tx-.5,y+h-36,1,5);
  }
  ctx.textAlign='left';
 }
}
// Both ratios are fixed, presentation-quality canvases; captured maps remain
// uniformly scaled inside them (no geographic stretching).
function exportDimensions(multi=false,ratio='16:9'){
 const d=st.cfg?.display||{},fourThree=ratio==='4:3';
 const key=multi?(fourThree?'exportAllWidth43':'exportAllWidth'):(fourThree?'exportPanelWidth43':'exportPanelWidth');
 const fallback=multi?(fourThree?2048:2560):(fourThree?1600:1920);
 const configured=Number(d[key]);
 const width=Number.isFinite(configured)&&configured>=1280&&configured<=7680?Math.round(configured/16)*16:fallback;
 return {width,height:Math.round(width*(fourThree?3/4:9/16))};
}
function openExportDialog(type,panel=null,clickEvent=null){
 if(st.exporting)return;
 st.exportSelection={type,panel};
 const multi=type==='all';
 el.exportDialogTitle.textContent=multi?'Save all panels PNG':'Save panel PNG';
 for(const [id,ratio] of [['exportSize169','16:9'],['exportSize43','4:3']]){
  const {width,height}=exportDimensions(multi,ratio);el[id].textContent=`${width.toLocaleString()} × ${height.toLocaleString()} px`;
 }
 let ratio=st.lastExportRatio;try{ratio=localStorage.getItem('omd_evu_export_ratio')||ratio;}catch(_){}
 const radio=el.exportForm.querySelector(`input[name="exportRatio"][value="${ratio==='4:3'?'4:3':'16:9'}"]`);
 radio.checked=true;let framing=st.lastExportFraming;try{framing=localStorage.getItem('omd_evu_export_framing')||framing;}catch(_){}
 el.exportForm.querySelector(`input[name="exportFraming"][value="${framing==='fit'?'fit':'fill'}"]`).checked=true;el.exportBusyStatus.textContent='';el.exportDialog.showModal();
 // Place the modal by its click origin; constrain both axes within viewport.
 // Clicking the download icon anchors to that icon; the toolbar save-all
 // button gets exactly the same behavior. Dialog keeps its modal backdrop.
 const origin=clickEvent?.currentTarget?.getBoundingClientRect?.();
 const keyboard=clickEvent?.detail===0;
 const dx=(!keyboard&&Number.isFinite(clickEvent?.clientX))?clickEvent.clientX:(origin?origin.left+origin.width/2:innerWidth/2);
 const dy=(!keyboard&&Number.isFinite(clickEvent?.clientY))?clickEvent.clientY:(origin?origin.bottom:innerHeight/2);
 const box=el.exportDialog.getBoundingClientRect(),pad=8;
 const left=Math.max(pad,Math.min(innerWidth-box.width-pad,dx-box.width/2));
 const top=Math.max(pad,Math.min(innerHeight-box.height-pad,dy+10));
 el.exportDialog.style.left=Math.round(left)+'px';
 el.exportDialog.style.top=Math.round(top)+'px';
}
async function exportPanel(p,ratio='16:9'){
 if(!p.map&&p.status!=='ready')await activate(p);
 const {width,height}=exportDimensions(false,ratio);
 const c=document.createElement('canvas');c.width=width;c.height=height;
 await drawExport(c.getContext('2d'),p,0,0,width,height);
 await canvasPNG(c,`evu_${p.src?.id||'model'}_${p.v?.name||'missing'}_${p.ds?.id||'run'}_f${pad3(p.h??0)}_${ratio.replace(':','x')}.png`);
}
function drawSharedExportLegend(ctx,x,y,w,h){
 const data=sharedPalette();if(!data)return;
 const {m,palette,ticks}=data,light=st.theme==='light';
 const fg=light?'#1d2e42':'#eef4fa',muted=light?'#54687e':'#aebfd1';
 const title=`${m.label}${m.unit?' ('+m.unit+')':''}`;
 const left=x+Math.max(4,Math.round(w*.07)),right=x+w-Math.max(4,Math.round(w*.07));
 const barW=right-left,barY=y+Math.round(h*.34),barH=Math.max(12,Math.min(23,Math.round(h*.18)));
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg;
 ctx.font=`bold ${Math.max(15,Math.min(24,w/115))}px Arial`;
 ctx.fillText(clipText(ctx,title,barW),x+w/2,y+Math.round(h*.17));
 const colors=legendSwatches(m,palette),n=colors.length;
 colors.forEach((color,i)=>{ctx.fillStyle=color;ctx.fillRect(left+i*barW/n,barY,Math.ceil(barW/n+1),barH);});
 ctx.strokeStyle=muted;ctx.lineWidth=1;ctx.strokeRect(left,barY,barW,barH);
 ctx.fillStyle=muted;ctx.font=`${Math.max(11,Math.min(17,w/160))}px Arial`;
 const shown=visibleSharedTicks(ticks,w*.9);
 for(const t of shown){
  const tx=left+barW*t.pos;
  ctx.textAlign=t.pos<.001?'left':t.pos>.999?'right':'center';
  ctx.fillRect(tx-.5,barY+barH,1,6);
  ctx.fillText(t.label,tx,barY+barH+Math.min(23,Math.round(h*.22)));
 }
 ctx.textAlign='left';
}
async function exportAll(ratio='16:9'){
 el.saveAllPngBtn.disabled=true;stop();
 const n=st.panels.length,{width:W,height:H}=exportDimensions(true,ratio);
 const cols=Math.min(n,columnCount(n)),rows=Math.ceil(n/cols);
 // One pixel between cells, one colorbar for the whole image.
 const pad=Math.max(12,Math.round(W*.006)),gap=1;
 const head=Math.max(74,Math.round(H*.047));
 const legendH=Math.max(78,Math.round(H*.064));
 const cellW=(W-2*pad-gap*(cols-1))/cols;
 const cellH=(H-head-2*pad-legendH-gap*(rows-1))/rows;
 if(cellW<100||cellH<130)throw Error('Export has too many panels for the chosen layout');
 const c=document.createElement('canvas');c.width=W;c.height=H;
 const cx=c.getContext('2d');
 cx.fillStyle=st.theme==='light'?'#e8eef5':'#09111f';cx.fillRect(0,0,W,H);
 cx.fillStyle=st.theme==='light'?'#1d2e42':'#eef4fa';
 cx.textBaseline='middle';cx.textAlign='left';
 const fieldMeta=fieldInfo({name:st.field});
 const fieldHeading=`${fieldMeta.label}${fieldMeta.unit?' ('+fieldMeta.unit+')':''}`;
 const timingHeading=`Init ${fmt(st.ref.init_time)} · F${pad3(st.hour)} · Valid ${fmt(valid(st.ref,st.hour))}`;
 // Common field and valid-time information belong in the comparison image
 // header; model names stay exclusively in the individual map panels.
 cx.font=`bold ${Math.max(27,Math.round(W/110))}px Arial`;
 cx.fillText(clipText(cx,fieldHeading,W-2*pad),pad,head*.34);
 cx.font=`${Math.max(15,Math.round(W/220))}px Arial`;
 cx.fillText(clipText(cx,timingHeading,W-2*pad),pad,head*.76);
 try{
  for(let i=0;i<n;i++){
   const p=st.panels[i];el.dataStatus.textContent=`Preparing export panel ${i+1} of ${n}…`;
   el.exportBusyStatus.textContent=`Rendering panel ${i+1} of ${n}…`;
   if(!p.map&&!p.cfg.placeholder){await activate(p);if(p.map)await waitPaint(p.map);}
   const px=pad+(i%cols)*(cellW+gap),py=head+pad+Math.floor(i/cols)*(cellH+gap);
   await drawExport(cx,p,px,py,cellW,cellH,false,true);
  }
  const legendY=head+pad+rows*cellH+(rows-1)*gap+6;
  drawSharedExportLegend(cx,pad,legendY,W-2*pad,legendH-6);
  await canvasPNG(c,`omd_evu_autumnplot_${st.ref.id.replace(/[-:.]/g,'')}_f${pad3(st.hour)}_${n}panels_${ratio.replace(':','x')}.png`);
 }finally{el.saveAllPngBtn.disabled=false;updateStatus();}
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){if(st.prefetchTimer)clearTimeout(st.prefetchTimer);st.prefetchTimer=null;}
 else if(st.cfg)schedulePrefetch();
});
window.addEventListener('DOMContentLoaded',boot);
