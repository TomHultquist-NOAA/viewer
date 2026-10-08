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
const PTYPE = ['#192939','#4bc86c','#55b2f0','#e75889','#b266d8','#f0c764'];
/* OMD EVU autumnplot-gl + MapLibre GL viewer. Zarr-v2 decoding stays browser-native. */
'use strict';
const $=id=>document.getElementById(id);
const el=Object.fromEntries(['fieldSelect','cycleSelect','fcstSelect','validDisplay','stepBackBtn','stepForwardBtn','playBtn','pauseBtn','loopSpeedSelect','resetViewBtn','copyLinkBtn','saveAllPngBtn','mapViewSelect','themeToggleBtn','catalogBadge','viewerGrid','dataStatus'].map(x=>[x,$(x)]));
const st={geoCache:new Map(),geoInflight:new Map(),cfg:null,sources:new Map(),primary:null,ref:null,field:null,hour:0,panels:[],theme:'dark',mode:'lambert',seq:0,active:[],columnCount:1,mapView:null,rendering:false,playing:false,syncing:false,observer:null,cache:new Map(),inflight:new Map(),queue:[],running:0,clock:0};
const q=new URLSearchParams(location.search),pad3=n=>String(n).padStart(3,'0');
const fmt=x=>{const d=new Date(x);return Number.isFinite(+d)?d.toISOString().slice(0,16).replace('T',' ')+'Z':'—'};
const valid=(ds,h)=>new Date(Date.parse(ds.init_time)+h*3600000);
const text=(s)=>document.createTextNode(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function json(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(`${url}: HTTP ${r.status}`);return r.json();}
function fieldInfo(v){const meta=FIELDS[v.name]||{label:v.attrs?.long_name||v.name,unit:v.attrs?.units||'',min:0,max:100,copyColors:'rh2m'};const colors=meta.copyColors?FIELDS[meta.copyColors].colors:meta.colors;return {...meta,colors,fraction:meta.fraction||!!meta.copyColors&&!!FIELDS[meta.copyColors].fraction};}
// A raw Zarr chunk is converted ONCE into the display units used by the GPU
// field, its color map and its hover readout. Never convert sampled GPU values.
function convert(x,m){switch(m.convert){case 'F':return(x-273.15)*1.8+32;case 'C':return x-273.15;case 'mmtoin':return x/25.4;case 'mtoin':return x*39.37007874;case 'perhour':return x*3600;default:return x;}}
function formatReadout(x,m){
 if(!Number.isFinite(x)||x < -1e9)return '—';
 // Extra decimals for small rates/accumulations, without converting again.
 const smallUnits=m.convert==='mmtoin'||m.convert==='mtoin'||m.convert==='perhour';
 const digits=smallUnits&&Math.abs(x)<0.1?3:smallUnits&&Math.abs(x)<1?2:2;
 return x.toFixed(digits);
}
function columnCount(n){const c=st.cfg.layout?.columns??'auto';if(Number.isInteger(c)&&c>=1&&c<=5)return Math.min(n,c);return n<=3?n:n===4?2:n<=9?3:n<=16?4:5;}
function layout(){const n=st.panels.length,width=el.viewerGrid.clientWidth||innerWidth,cols=Math.min(columnCount(n),Math.max(1,Math.floor((width+8)/278)));el.viewerGrid.style.setProperty('--cols',cols);st.columnCount=cols;el.viewerGrid.classList.toggle('one-panel',n===1);for(const p of st.panels)if(p.map)p.map.resize();}
function themeColors(){return st.theme==='light'?{ocean:'#d6e6ee',land:'#e8eee5',line:'#536473',minor:'#87969b',grid:'#97a6b0'}:{ocean:'#0b2238',land:'#1d3541',line:'#adc3cc',minor:'#5d7888',grid:'#3c6474'};}
function mapStyle(){
 // MapLibre must finish startup before asking its web workers to parse GeoJSON.
 // A true source-free style also makes map failures distinguishable from slow geography.
 const c=themeColors();
 return {version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':c.ocean}}]};
}
// Same visibility threshold for county lines and high-detail shorelines/borders.
function detailThreshold(){return countyThreshold();}
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
 const hd=document.createElement('div');hd.className='panel-header';const name=document.createElement('strong');name.className='panel-name';name.textContent=cfg.label||cfg.id;const save=document.createElement('button');save.className='panel-save';save.textContent='Save PNG';save.disabled=true;hd.append(name,save);
 const view=document.createElement('div');view.className='panel-viewport';const snap=document.createElement('img');snap.className='map-snapshot';snap.alt='Previously rendered weather plot';snap.hidden=true;const frame=document.createElement('div');frame.className='map-frame';const lbl=document.createElement('div');lbl.className='plot-label';const title=document.createElement('strong'),sub=document.createElement('span');lbl.append(title,sub);const notice=document.createElement('div');notice.className='notice visible';const note=document.createElement('span');notice.append(note);const info=document.createElement('div');info.className='point-info';info.hidden=true;view.append(frame,snap,lbl,notice,info);
 const ft=document.createElement('div');ft.className='panel-footer';const legendTitle=document.createElement('div');legendTitle.className='legend-title';const legendCanvas=document.createElement('canvas');legendCanvas.className='legend-canvas';const legendLabels=document.createElement('div');legendLabels.className='legend-labels';ft.append(legendTitle,legendCanvas,legendLabels);card.append(hd,view,ft);el.viewerGrid.append(card);
 const p={cfg,i,card,view,frame,snap,title,sub,notice,note,info,save,legendTitle,legendCanvas,legendLabels,map:null,component:null,layer:null,rawField:null,ds:null,v:null,h:null,src:null,lastKey:null,image:null,lastSnapshot:null,status:'waiting',busy:false,geoApplied:new Set(),geoPending:new Set(),geoTimer:null,mapReady:null,activation:null,loadingStage:'',loadSince:0,stageSince:0};
 notice.style.pointerEvents='none';card.addEventListener('click',()=>{selectPanel(p);activate(p).catch(e=>fail(p,e));});save.addEventListener('click',e=>{e.stopPropagation();exportPanel(p);});setNote(p,'Waiting for catalog…');return p;
}
function setNote(p,msg){p.note.textContent=msg;p.notice.classList.add('visible');}
function stage(p,label){p.loadingStage=label;p.stageSince=Date.now();setNote(p,label);}
function loadingErrorMessage(e){const msg=String(e?.message||e);if(/GPU layer|geometry worker|GPU timeout/i.test(msg))return msg+' Check the complete vendor/autumnplot-gl distribution, especially its worker .js files. Run vendor_dependencies.py again.';if(/HTTP 404/.test(msg))return msg+' Check that the full Zarr directory and chunk file were copied to the same directory as catalog.json.';if(/abort|timeout/i.test(msg))return msg+' Check browser Network tab for a slow or blocked chunk or worker.';return msg;}

function clearNote(p){p.notice.classList.remove('visible');}
function selectPanel(p){for(const x of st.panels)x.card.classList.toggle('selected',x===p);}
async function boot(){try{
 st.cfg=await json('config.json');st.mode=(q.get('map')||st.cfg.display?.mapProjection)==='globe'?'globe':'lambert';el.mapViewSelect.value=st.mode;
 let savedTheme=null;try{savedTheme=localStorage.getItem('omd_evu_theme');}catch(_){}st.theme=savedTheme||st.cfg.theme||'dark';setTheme(st.theme,false);
 const pcfg=st.cfg.panels||[{id:'rrfs-main',source:'rrfs',label:'RRFS'}];if(!pcfg.length||pcfg.length>20||pcfg.length>(st.cfg.layout?.maxPanels||20))throw Error('Configure 1–20 panels');
 if(new Set(pcfg.map(x=>x.id)).size!==pcfg.length)throw Error('Panel IDs must be unique');el.viewerGrid.replaceChildren();st.panels=pcfg.map(createPanel);layout();selectPanel(st.panels[0]);
 const sources=st.cfg.sources?.length?st.cfg.sources:[{id:'rrfs',label:'RRFS',catalogUrl:'data/catalog.json'}];const results=await Promise.all(sources.map(async s=>{const source={...s,url:new URL(s.catalogUrl||'data/catalog.json',document.baseURI),datasets:[]};try{const cat=await json(source.url.href);if(cat.schema!=='rrfs-zarr-viewer-1'||!Array.isArray(cat.datasets))throw Error('Catalog schema mismatch');source.datasets=cat.datasets.sort((a,b)=>Date.parse(b.init_time)-Date.parse(a.init_time));}catch(e){source.error=String(e);console.warn(s.id,e);}return source;}));results.forEach(s=>st.sources.set(s.id,s));st.primary=st.sources.get(st.cfg.primarySource)||results.find(s=>s.datasets.length);
 if(!st.primary?.datasets?.length)throw Error('No RRFS datasets in the primary catalog');st.ref=st.primary.datasets.find(d=>d.id===q.get('run'))||st.primary.datasets[0];
 const names=new Set(results.flatMap(s=>s.datasets.flatMap(d=>d.variables.map(v=>v.name))));const ordered=[...Object.keys(FIELDS).filter(n=>names.has(n)),...[...names].filter(n=>!(n in FIELDS)).sort()];el.fieldSelect.replaceChildren(...ordered.map(n=>new Option(FIELDS[n]?.label||n,n)));
 st.field=names.has(q.get('field'))?q.get('field'):names.has(st.cfg.defaultField)?st.cfg.defaultField:ordered[0];el.cycleSelect.replaceChildren(...st.primary.datasets.map(ds=>new Option(`${fmt(ds.init_time)} · ${ds.model}`,ds.id)));
 const h=Number(q.get('fhr')??st.cfg.defaultForecastHour??0);st.hour=Number.isInteger(h)&&h>=0&&h<st.ref.variables[0]?.shape?.[0]?h:0;refreshHours();bind();syncUI();
 ['fieldSelect','cycleSelect','fcstSelect','stepBackBtn','stepForwardBtn','playBtn','pauseBtn'].forEach(id=>el[id].disabled=false);el.saveAllPngBtn.disabled=false;
 el.catalogBadge.textContent=`${st.panels.length} panels · ${results.filter(x=>x.datasets.length).length}/${results.length} sources`;
 if(!('DecompressionStream' in window))throw Error('Browser does not support zlib DecompressionStream');await waitLibraries();
 // No remote maps/tiles: map style and boundary layers are locally hosted.
 st.observer=new IntersectionObserver(entries=>{if(st.rendering)return;for(const e of entries)if(e.isIntersecting&&e.intersectionRatio>.04){const p=st.panels.find(p=>p.card===e.target);if(p&&!p.map)activate(p).catch(err=>fail(p,err));}},{root:el.viewerGrid,rootMargin:'120px'});
 st.panels.forEach(p=>st.observer.observe(p.card));try{await activate(st.panels[0]);}catch(err){fail(st.panels[0],err);}updateStatus();
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
function availableHours(){const ds=st.ref;if(!ds)return[];const v=ds.variables.find(x=>x.name===st.field);return v?v.available_hours:[];}
function refreshHours(){const hours=st.ref.variables.find(x=>x.name===st.field)?.shape?.[0]||85;el.fcstSelect.replaceChildren(...Array.from({length:hours},(_,i)=>new Option(`F${pad3(i)}${availableHours().includes(i)?'':' · missing'}`,i)));st.hour=Math.max(0,Math.min(hours-1,st.hour));}
function syncUI(){el.fieldSelect.value=st.field;el.cycleSelect.value=st.ref.id;el.fcstSelect.value=String(st.hour);el.validDisplay.textContent=fmt(valid(st.ref,st.hour));el.mapViewSelect.value=st.mode;try{const u=new URL(location.href);u.searchParams.set('run',st.ref.id);u.searchParams.set('field',st.field);u.searchParams.set('fhr',st.hour);u.searchParams.set('map',st.mode);history.replaceState(null,'',u);}catch(_){}}
function bind(){el.fieldSelect.onchange=()=>{st.field=el.fieldSelect.value;refreshHours();syncUI();renderAll();};el.cycleSelect.onchange=()=>{st.ref=st.primary.datasets.find(x=>x.id===el.cycleSelect.value)||st.ref;refreshHours();syncUI();renderAll();};el.fcstSelect.onchange=()=>{st.hour=Number(el.fcstSelect.value);syncUI();renderAll();};el.stepBackBtn.onclick=()=>step(-1);el.stepForwardBtn.onclick=()=>step(1);el.playBtn.onclick=play;el.pauseBtn.onclick=stop;
 el.mapViewSelect.onchange=()=>{st.mode=el.mapViewSelect.value;for(const p of st.active)if(p.map)applyProjection(p.map);syncUI();};el.resetViewBtn.onclick=()=>{st.mapView=null;for(const p of st.active)if(p.map)resetView(p.map);};el.themeToggleBtn.onclick=()=>setTheme(st.theme==='dark'?'light':'dark',true);
 el.copyLinkBtn.onclick=async()=>{try{await navigator.clipboard.writeText(location.href);el.copyLinkBtn.textContent='Copied';setTimeout(()=>el.copyLinkBtn.textContent='Copy link',1400);}catch(e){console.warn(e);}};
 el.saveAllPngBtn.onclick=exportAll;window.addEventListener('resize',layout);window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);if(e.key===' '){e.preventDefault();st.playing?stop():play();}if(e.key==='ArrowUp'||e.key==='ArrowDown'){const a=st.primary.datasets,idx=a.indexOf(st.ref)+(e.key==='ArrowUp'?-1:1);if(a[idx]){st.ref=a[idx];refreshHours();syncUI();renderAll();}}});}
function setTheme(theme,save){
 st.theme=theme;document.documentElement.dataset.theme=theme;
 el.themeToggleBtn.textContent=theme==='dark'?'☀ Light':'☾ Dark';
 el.themeToggleBtn.setAttribute('aria-label',`Switch to ${theme==='dark'?'light':'dark'} mode`);
 if(save)try{localStorage.setItem('omd_evu_theme',theme);}catch(e){}
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
  if(m.getLayer(overview))m.setLayerZoomRange(overview,0,p.geoApplied.has(key)?detail:24);
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
 if(m.getLayer('counties'))m.setLayerZoomRange('counties',detail,24);
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

function choose(p){const src=st.sources.get(p.cfg.source||st.primary.id);p.src=src;if(!src)return{error:`Unknown source ${p.cfg.source}`};if(src.error)return{error:src.error};let ds;const mode=p.cfg.run||'selected',list=src.datasets;
 if(mode==='latest')ds=list[0];else if(mode==='nearest')ds=list.slice().sort((a,b)=>Math.abs(Date.parse(a.init_time)-Date.parse(st.ref.init_time))-Math.abs(Date.parse(b.init_time)-Date.parse(st.ref.init_time)))[0];else if(mode==='selected')ds=list.find(d=>d.init_time===st.ref.init_time);else ds=list.find(d=>d.id===mode);
 if(!ds)return{error:`No matching cycle for ${fmt(st.ref.init_time)}`};if(p.cfg.runOffset){ds=list[list.indexOf(ds)+Number(p.cfg.runOffset)];if(!ds)return{error:'Cycle offset unavailable'};}
 const name=p.cfg.field||st.field,v=ds.variables.find(x=>x.name===name);if(!v)return{error:`Field ${name} is unavailable`,ds};let h=st.hour+Number(p.cfg.forecastHourOffset||0);if(p.cfg.timeMode==='valid')h=Math.round((valid(st.ref,st.hour)-Date.parse(ds.init_time))/3600000)+Number(p.cfg.forecastHourOffset||0);return{ds,v,h};}
function fail(p,e){console.error(e);p.status='error';p.save.disabled=true;stage(p,'Rendering error: '+loadingErrorMessage(e));updateStatus();}
function updateStatus(){const totals={ready:0,waiting:0,loading:0,missing:0,error:0};st.panels.forEach(p=>totals[p.status]=(totals[p.status]||0)+1);el.dataStatus.textContent=`${totals.ready} ready · ${totals.loading} loading · ${totals.waiting} queued · ${totals.missing} missing · ${totals.error} errors · ${st.active.length}/${st.cfg?.display?.maxActiveMaps||7} GPU maps active`;}
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
function syncViews(source){if(st.syncing||!st.cfg.display.syncMaps)return;st.syncing=true;const c=source.getCenter(),camera={center:[c.lng,c.lat],zoom:source.getZoom(),bearing:source.getBearing(),pitch:source.getPitch()};st.mapView=camera;for(const p of st.active)if(p.map&&p.map!==source)p.map.jumpTo(camera);st.syncing=false;}
function createMap(p){
 const node=document.createElement('div');node.className='map-host';
 node.style='position:absolute;inset:0;';p.frame.replaceChildren(node);
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
 m.on('move',()=>{if(!st.rendering)syncViews(m);});
 m.on('zoomend',()=>geographyZoom(p));
 m.on('mousemove',e=>{if(!p.rawField)return;try{
  const value=p.rawField.sampleField(e.lngLat.lng,e.lngLat.lat),x=Number(value);
  p.info.textContent=Number.isFinite(x)?`${e.lngLat.lat.toFixed(2)}°, ${e.lngLat.lng.toFixed(2)}° · ${formatReadout(x,fieldInfo(p.v))} ${fieldInfo(p.v).unit}`:'';
  p.info.hidden=!Number.isFinite(x)||x < -1e9;
 }catch(_){p.info.hidden=true;}});
 m.on('mouseleave',()=>p.info.hidden=true);
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
 if(p.geoTimer)clearTimeout(p.geoTimer);p.geoTimer=null;
 try{const snap=p.lastSnapshot||p.map.getCanvas().toDataURL('image/png');p.snap.src=snap;p.lastSnapshot=snap;p.snap.hidden=false;}
 catch(e){console.warn('Could not retain snapshot',e);}
 p.map.remove();p.map=null;p.component=null;p.layer=null;p.rawField=null;p.lastKey=null;p.mapReady=null;
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
 if(p.activation)return p.activation;
 p.activation=activateInternal(p).finally(()=>{p.activation=null;});
 return p.activation;
}
async function activateInternal(p){
 if(p.map){p._used=++st.clock;if(p.mapReady)await p.mapReady;return renderPanel(p,st.seq);}
 const limit=Math.max(1,Math.min(10,Number(st.cfg.display.maxActiveMaps||7)));
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
async function renderAll(){st.seq++;st.rendering=true;const seq=st.seq;for(const p of st.panels){p.save.disabled=true;p.snap.hidden=true;p.lastSnapshot=null;if(!p.map){p.status='waiting';setNote(p,'Select or scroll to this panel to render');}}try{await Promise.all(st.active.filter(p=>p.map).map(p=>renderPanel(p,seq)));}finally{st.rendering=false;updateStatus();}}
function limiter(fn){return new Promise((resolve,reject)=>{st.queue.push({fn,resolve,reject});pump();});}
function pump(){const cap=Math.max(1,Math.min(6,Number(st.cfg.display.maxConcurrentFetches||3)));while(st.running<cap&&st.queue.length){const t=st.queue.shift();st.running++;Promise.resolve().then(t.fn).then(t.resolve,t.reject).finally(()=>{st.running--;pump();});}}
function cacheGet(k){const v=st.cache.get(k);if(v){st.cache.delete(k);st.cache.set(k,v);}return v;}
function cachePut(k,v){st.cache.set(k,v);const max=Math.max(8,Number(st.cfg.display.decodedCacheMB||96))*1024*1024;let bytes=[...st.cache.values()].reduce((sum,x)=>sum+x.byteLength,0);while(bytes>max&&st.cache.size>1){const oldest=st.cache.keys().next().value;bytes-=st.cache.get(oldest).byteLength;st.cache.delete(oldest);}}
async function chunk(src,ds,v,h,onProgress=()=>{}){const url=new URL(`${ds.path}/${v.name}/${h}.0.0`,new URL('.',src.url)).href,k=url;const cached=cacheGet(k);if(cached)return cached;if(st.inflight.has(k))return st.inflight.get(k);const task=limiter(async()=>{const [nt,ny,nx]=v.shape;if(v.chunks[0]!==1||v.chunks[1]!==ny||v.chunks[2]!==nx)throw Error('Unsupported chunking; expected [1,ny,nx]');if(v.compressor?.id!=='zlib'||!['<f4','|u1'].includes(v.dtype))throw Error('Only zlib float32/uint8 Zarr-v2 fields supported');onProgress(`Requesting ${v.name} F${pad3(h)} Zarr chunk…`);
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
 const expected=nx*ny*(v.dtype==='<f4'?4:1);if(decoded.byteLength!==expected)throw Error(`Decoded ${decoded.byteLength} bytes; expected ${expected}`);const ary=v.dtype==='<f4'?new Float32Array(decoded):new Uint8Array(decoded);cachePut(k,ary);return ary;});st.inflight.set(k,task);try{return await task;}finally{st.inflight.delete(k);}}
function gridFromDataset(ds,v){const g=ds.grid||{},[_,ny,nx]=v.shape;const get=(name,alt)=>Number(g['GRIB_'+name]??alt);const a=Number(st.cfg.display.earthRadiusM||6371229);const grid=apgl.LambertGrid.fromLLCornerLonLat(nx,ny,get('LoVInDegrees',-97.5),get('LaDInDegrees',38.5),[get('Latin1InDegrees',38.5),get('Latin2InDegrees',38.5)],get('longitudeOfFirstGridPointInDegrees',-122.719528),get('latitudeOfFirstGridPointInDegrees',21.138123),get('DxInMetres',3000),get('DyInMetres',3000),a,a);return grid;}
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
async function renderPanel(p,seq){if(!p.map)return;const selected=choose(p);p.ds=selected.ds||null;p.v=selected.v||null;p.h=selected.h??null;p.title.textContent=`${p.cfg.label||p.cfg.id} · ${selected.v?fieldInfo(selected.v).label:'No data'}`;p.sub.textContent=selected.ds&&Number.isInteger(selected.h)?`Init ${fmt(selected.ds.init_time)} · F${pad3(selected.h)} · valid ${fmt(valid(selected.ds,selected.h))}`:'Source unavailable';
 if(selected.error||!selected.v||!Number.isInteger(selected.h)||selected.h<0||selected.h>=selected.v.shape[0]||!selected.v.available_hours.includes(selected.h)){if(p.layer&&p.map?.getLayer(p.layer.id))p.map.removeLayer(p.layer.id);p.layer=null;p.component=null;p.rawField=null;p.lastKey=null;p.status='missing';p.save.disabled=true;setNote(p,selected.error||`No ${selected.v.name} for F${pad3(selected.h)}`);legend(p,null);updateStatus();return;}
 const {ds,v,h}=selected,m=fieldInfo(v);p.status='loading';p.loadSince=Date.now();stage(p,`Loading ${m.label} F${pad3(h)}…`);p.save.disabled=true;updateStatus();p.busy=true;
 try{const raw=await chunk(p.src,ds,v,h,msg=>{if(seq===st.seq)stage(p,msg);});if(seq!==st.seq||!p.map)return;
 stage(p,`Converting ${m.label} to display units…`);
 const data=processedData(raw,m,v),grid=gridFromDataset(ds,v),field=new apgl.RawScalarField(grid,data);const signature=JSON.stringify([v.name,v.shape,ds.grid]);
 if(p.component&&p.lastKey===signature&&typeof p.component.updateField==='function'){stage(p,'Updating GPU field texture…');await p.component.updateField(field);}
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
 stage(p,`Initializing autumnplot-gl GPU layer (${m.label})…`);
 try{p.map.addLayer(layer,p.map.getLayer('coast')?'coast':undefined);}catch(e){rejectReady(e);throw e;}
 const gpuWait=Math.max(5000,Number(st.cfg.display?.gpuInitTimeoutSeconds||35)*1000);
 let deadline;
 try{await Promise.race([layerReady,new Promise((_,reject)=>{deadline=setTimeout(()=>reject(new Error('GPU layer initialization timed out after '+Math.round(gpuWait/1000)+' s: autumnplot-gl geometry worker did not respond.')),gpuWait);})]);}
 finally{clearTimeout(deadline);}
 p.lastKey=signature;}

 p.rawField=field;stage(p,`Painting ${m.label}…`);legend(p,m);await waitPaint(p.map);if(seq!==st.seq||!p.map)return;p.status='ready';p.save.disabled=false;clearNote(p);// The PNG export path explicitly captures a finished render frame. Avoid stale blank snapshots here.
 }catch(e){if(seq===st.seq)fail(p,e);}finally{p.busy=false;updateStatus();}}
// Keep the legend in the same units/range as the autumnplot-gl color map.
function legendTicks(m,v){
 if(!m)return [];
 if(m.ptype)return ['Rain','Snow','FZRA','Ice','Mixed'].map((label,i)=>({label,pos:(i+.5)/5}));
 if(m.category)return [{label:'No',pos:0},{label:'Yes',pos:1}];
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
 p.legendTitle.textContent=m?`${m.label}${m.unit?' ('+m.unit+')':''}`:'No field displayed';
 const c=p.legendCanvas,cx=c.getContext('2d');c.width=640;c.height=16;
 cx.clearRect(0,0,c.width,c.height);p.legendLabels.replaceChildren();p.legendTicks=[];
 if(!m)return;
 const palette=pal(m,p.v),n=palette.colors.length,w=c.width/n;
 palette.colors.forEach((hex,i)=>{cx.fillStyle=hex;cx.fillRect(i*w,0,Math.ceil(w+1),c.height);});
 const ticks=legendTicks(m,p.v);p.legendTicks=ticks;
 ticks.forEach((tick,i)=>{
  const span=document.createElement('span');span.className='legend-tick';
  span.textContent=tick.label;span.style.left=(tick.pos*100)+'%';
  if(i%2!==0 && !m.ptype)span.dataset.odd='1';
  p.legendLabels.append(span);
 });
}
async function waitPaint(map){if(!map)return;map.triggerRepaint();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await sleep(100);}
async function step(dir){if(!st.ref)return;const hours=st.cfg.loopOnlyAvailableHours?availableHours():Array.from({length:st.ref.variables[0].shape[0]},(_,i)=>i);if(!hours.length)return;const ix=hours.indexOf(st.hour),idx=(ix<0?(dir>0?-1:0):ix)+dir;st.hour=hours[(idx+hours.length)%hours.length];syncUI();await renderAll();}
async function play(){if(st.playing)return;st.playing=true;el.playBtn.classList.add('active');el.pauseBtn.classList.remove('active');while(st.playing){const start=Date.now();await step(1);if(st.playing)await sleep(Math.max(50,Number(el.loopSpeedSelect.value)-(Date.now()-start)));}}
function stop(){st.playing=false;el.pauseBtn.classList.add('active');el.playBtn.classList.remove('active');}
function rounded(ctx,x,y,w,h,r=11){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function clipText(ctx,s,width){s=String(s||'');while(ctx.measureText(s).width>width&&s.length>2)s=s.slice(0,-2)+'…';return s;}
function canvasPNG(c,name){c.toBlob(blob=>{if(!blob)throw Error('Canvas export failed');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);},'image/png');}
// MapLibre draws its basemap and autumnplot-gl weather textures with WebGL.
// Read the finished WebGL framebuffer DURING MapLibre's render event; waiting
// several animation frames and then calling canvas.toDataURL() can yield an
// empty buffer on some browsers even when the plot is visible on screen.
function readMapFramebuffer(map){
 const src=map.getCanvas();
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
 cx.putImageData(image,0,0);
 return out.toDataURL('image/png');
}
function captureMapPNG(map){
 return new Promise((resolve,reject)=>{
  let settled=false,tries=0,lastError=null;
  const timer=setTimeout(()=>finish(new Error('PNG export timed out waiting for a rendered map frame.'+(lastError?' Last error: '+lastError.message:''))),10000);
  const finish=(err,png)=>{
   if(settled)return;settled=true;clearTimeout(timer);map.off('render',onRender);
   err?reject(err):resolve(png);
  };
  const onRender=()=>{
   try{const png=readMapFramebuffer(map);finish(null,png);}
   catch(err){lastError=err;if(++tries>=3)finish(new Error('Could not capture the map. '+err.message));else map.triggerRepaint();}
  };
  map.on('render',onRender);
  try{map.resize();map.triggerRepaint();}catch(err){finish(err);}
 });
}
async function panelImage(p){
 if(p.map){const png=await captureMapPNG(p.map);p.lastSnapshot=png;return png;}
 return p.lastSnapshot||null;
}
// Draw a captured map without ever distorting geographic shapes. In particular,
// the map's framebuffer is often much wider than the old fixed PNG plot box.
// Letterbox/pillarbox only when comparing panels with different aspect ratios.
function drawMapContained(ctx,image,x,y,width,height){
 const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
 if(!(iw>0&&ih>0&&width>0&&height>0))throw Error('Invalid map or PNG export dimensions');
 const scale=Math.min(width/iw,height/ih);
 const drawW=iw*scale,drawH=ih*scale;
 ctx.drawImage(image,x+(width-drawW)/2,y+(height-drawH)/2,drawW,drawH);
}
function panelMapRatio(p){
 const c=p.map?.getCanvas?.();
 if(c?.width>0&&c?.height>0)return c.width/c.height;
 const rect=p.view?.getBoundingClientRect?.();
 return rect?.width>0&&rect?.height>0?rect.width/rect.height:null;
}
async function drawExport(ctx,p,x,y,w,h){const light=st.theme==='light',fg=light?'#1d2e42':'#eef4fa',muted=light?'#54687e':'#aebfd1';ctx.fillStyle=light?'#fff':'#101d2e';rounded(ctx,x,y,w,h,12);ctx.fillStyle=fg;ctx.font=`bold ${Math.max(15,Math.min(25,w/40))}px Arial`;ctx.textBaseline='middle';ctx.fillText(clipText(ctx,p.title.textContent,w-36),x+18,y+23);ctx.font=`${Math.max(11,Math.min(15,w/70))}px Arial`;ctx.fillStyle=muted;ctx.fillText(clipText(ctx,p.sub.textContent,w-36),x+18,y+53);
 const boxX=x+14,boxY=y+75,boxW=w-28,boxH=h-160;ctx.fillStyle=light?'#d6e6ee':'#0b2238';ctx.fillRect(boxX,boxY,boxW,boxH);const img=await panelImage(p);if(img){const im=new Image();im.src=img;await im.decode();drawMapContained(ctx,im,boxX,boxY,boxW,boxH);}else{ctx.fillStyle=muted;ctx.font='15px Arial';ctx.fillText(p.notice?.textContent||'No data',boxX+22,boxY+boxH/2);}
 ctx.fillStyle=fg;ctx.font=`bold ${Math.max(12,Math.min(16,w/58))}px Arial`;ctx.fillText(clipText(ctx,p.legendTitle.textContent,w-30),x+18,y+h-69);if(p.status==='ready'){ctx.drawImage(p.legendCanvas,x+18,y+h-49,w-36,13);const ticks=p.legendTicks||[];
 ctx.fillStyle=muted;ctx.font='11px Arial';
 // Export only the appropriate tick density for the output panel width.
 const shown=ticks.filter((_,i)=>ticks.length<=5||w>=850||i%2===0||i===ticks.length-1);
 for(const tick of shown){
  const tx=x+18+(w-36)*tick.pos;
  ctx.textAlign=tick.pos===0?'left':tick.pos===1?'right':'center';
  ctx.fillText(tick.label,tx,y+h-21);
  ctx.fillRect(tx-0.5,y+h-36,1,5);
 }
 ctx.textAlign='left';}}
async function exportPanel(p){try{if(!p.map&&p.status!=='ready')await activate(p);const w=1600,ratio=panelMapRatio(p)||1.65;
 // Match the PNG's plot area to the visible map's original proportions.
 // Leave 160 px for the title, initialization/valid-time and color legend.
 const h=160+Math.round((w-28)/Math.max(.35,Math.min(6,ratio)));
 const c=document.createElement('canvas');c.width=w;c.height=h;await drawExport(c.getContext('2d'),p,0,0,w,h);canvasPNG(c,`evu_${p.src?.id||'model'}_${p.v?.name||'missing'}_${p.ds?.id||'run'}_f${pad3(p.h??0)}.png`);}catch(e){console.error('PNG export failed',e);alert('PNG export failed: '+String(e));}}
async function exportAll(){el.saveAllPngBtn.disabled=true;stop();const prior=st.active.slice();const n=st.panels.length,cols=st.columnCount||columnCount(n),rows=Math.ceil(n/cols),cellW=Math.min(1100,Math.max(620,Math.floor(5200/cols))),cellH=Math.round(cellW*.72),pad=22,gap=16,head=82,W=cols*cellW+gap*(cols-1)+pad*2,H=head+rows*cellH+gap*(rows-1)+pad*2,scale=Math.min(1,11000/Math.max(W,H),Math.sqrt(36000000/(W*H)));const c=document.createElement('canvas');c.width=Math.round(W*scale);c.height=Math.round(H*scale);const cx=c.getContext('2d');cx.scale(scale,scale);cx.fillStyle=st.theme==='light'?'#e8eef5':'#09111f';cx.fillRect(0,0,W,H);cx.fillStyle=st.theme==='light'?'#1d2e42':'#eef4fa';cx.font='bold 30px Arial';cx.fillText('OMD EVU Model Viewer',pad,45);cx.font='16px Arial';cx.fillText(`${n} panels · Valid ${fmt(valid(st.ref,st.hour))} · autumnplot-gl`,pad,70);
 try{for(let i=0;i<n;i++){const p=st.panels[i];el.dataStatus.textContent=`Preparing export panel ${i+1} of ${n}…`;if(!p.map){await activate(p);await waitPaint(p.map);}const px=pad+(i%cols)*(cellW+gap),py=head+pad+Math.floor(i/cols)*(cellH+gap);await drawExport(cx,p,px,py,cellW,cellH);}canvasPNG(c,`omd_evu_autumnplot_${st.ref.id}_f${pad3(st.hour)}_${n}panels.png`);}catch(e){console.error(e);alert('PNG export failed: '+String(e));}finally{el.saveAllPngBtn.disabled=false;updateStatus();}}
window.addEventListener('DOMContentLoaded',boot);
