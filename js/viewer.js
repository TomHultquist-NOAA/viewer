// FIXED, operationally oriented display palettes. Nothing auto-scales to the
// currently selected model, cycle or forecast hour (users may manually set a range).
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
 mslp:{label:'Mean sea level pressure (MSLP)',unit:'hPa',convert:'PaToHpa',
  levels:[940,948,956,964,972,980,988,996,1004,1012,1020,1028,1036,1044,1052,1060],
  bandColors:['#572d87','#6d51a8','#637ac9','#518fc4','#59a5b7','#83bdb5','#b4d3c5','#e2e8cf','#faf4c0','#f8df91','#f5c36a','#eaa36a','#d88075','#b65e70','#8d465f']},
 refc:{label:'Composite reflectivity',unit:'dBZ',levels:REFC_LEVELS,bandColors:REFC_COLORS},
 refc_ptype:{label:'Reflectivity with precipitation type',unit:'dBZ',ptypeReflectivity:true},
 // Wind fields are stored by WCOSS2 in m/s and displayed in knots.
 wspd10:{label:'10-m wind speed',unit:'kt',convert:'mpsToKt',levels:[0,2,5,10,15,20,25,30,35,40,45,50,55,60,70,80,90,100,120,140],bandColors:['#e6f5f3','#bde5da','#8ed5cb','#55bfbb','#269bb9','#277bc3','#375dc5','#5356b9','#7652b1','#9c4fb1','#be519f','#d35c88','#df6a6c','#e87e4e','#ee9d3d','#efbc42','#f5dd64','#fff2a0','#fffaf0']},
 wspd300:{label:'300 hPa forecast',unit:'kt',convert:'mpsToKt',levels:[0,20,30,40,50,60,70,80,90,100,110,120,130,140,160,180,200],bandColors:['#e6f5f3','#bde5da','#8ed5cb','#55bfbb','#269bb9','#277bc3','#375dc5','#5356b9','#7652b1','#9c4fb1','#be519f','#d35c88','#df6a6c','#e87e4e','#ee9d3d','#efbc42']},
 gust:{label:'10-m wind gust',unit:'kt',convert:'mpsToKt',levels:[0,5,10,15,20,25,30,35,40,45,50,55,60,70,80,90,100,120,140,160],bandColors:['#e6f5f3','#bde5da','#8ed5cb','#55bfbb','#269bb9','#277bc3','#375dc5','#5356b9','#7652b1','#9c4fb1','#be519f','#d35c88','#df6a6c','#e87e4e','#ee9d3d','#efbc42','#f5dd64','#fff2a0','#fffaf0']},
 u10:{label:'10-m U wind component',unit:'kt',convert:'mpsToKt',min:-100,max:100,colors:[[0,'#3d4d9d'],[.2,'#347bbd'],[.38,'#9dcfe5'],[.5,'#f4f5f5'],[.62,'#f5c09b'],[.8,'#e47a49'],[1,'#a42f39']],fraction:true},
 v10:{label:'10-m V wind component',unit:'kt',convert:'mpsToKt',min:-100,max:100,colors:[[0,'#3d4d9d'],[.2,'#347bbd'],[.38,'#9dcfe5'],[.5,'#f4f5f5'],[.62,'#f5c09b'],[.8,'#e47a49'],[1,'#a42f39']],fraction:true},
 t2m:{label:'2-m temperature',unit:'°F',min:-40,max:110,convert:'F',colors:[[0,'#422d92'],[.2,'#3266cb'],[.35,'#71c3e2'],[.48,'#bedbb0'],[.58,'#f3e58d'],[.72,'#f59a43'],[.85,'#d44730'],[1,'#882c4d']],fraction:true},
 dpt2m:{label:'2-m dew point',unit:'°F',min:-40,max:85,convert:'F',colors:[[0,'#6e4ca0'],[.24,'#3f86bf'],[.43,'#6ec9ce'],[.58,'#b7cf74'],[.78,'#55a851'],[1,'#174a33']],fraction:true},
 t925:{label:'925 hPa forecast',unit:'°C',min:-45,max:40,convert:'C',copyColors:'t2m'},
 t850:{label:'850 hPa forecast',unit:'°C',min:-40,max:40,convert:'C',copyColors:'t2m'},
 t700:{label:'700 hPa forecast',unit:'°C',min:-45,max:30,convert:'C',copyColors:'t2m'},
 absv500:{label:'500 hPa forecast',unit:'10⁻⁵ s⁻¹',convert:'vort1e5',
  levels:[-20,-10,-5,0,5,10,15,20,25,30,35,40,50,60,75],
  bandColors:['#4965a8','#7d91bb','#b6c5d8','#e5e7ed','#eeeead','#f9d46a','#f5ab4a','#ed8039','#df5934','#cb3139','#a51a48','#86175e','#6c1773','#50236e']},

 rh2m:{label:'2-m relative humidity',unit:'%',min:0,max:100,colors:[[0,'#a25b37'],[.2,'#dc9d46'],[.4,'#e7d78b'],[.6,'#a3c788'],[.8,'#42989b'],[1,'#24558a']],fraction:true},
 // PRATE input is kg m-2 s-1; the GPU sees mm/hour after the ONE conversion.
 prate:{label:'Precipitation rate',unit:'mm h⁻¹',convert:'perhour',levels:[.05,.25,.5,1,2.5,5,7.5,10,15,20,30,40,50,75,100,125,150,175,200],bandColors:RAIN_COLORS},
 // Zarr accumulation amounts are kg m-2 = mm of water; display as inches.
 apcp1h:{label:'1-hour precipitation',unit:'in',convert:'mmtoin',levels:[.005,.01,.03,.05,.1,.2,.3,.5,.75,1,1.5,2,3,4,5,7,10,15,20],bandColors:RAIN_COLORS},
 apcp3h:{label:'3-hour precipitation',unit:'in',convert:'mmtoin',levels:[.005,.01,.03,.05,.1,.2,.3,.5,.75,1,1.5,2,3,4,5,7,10,15,20],bandColors:RAIN_COLORS},
 apcp6h:{label:'6-hour precipitation',unit:'in',convert:'mmtoin',levels:[.005,.01,.03,.05,.1,.2,.3,.5,.75,1,1.5,2,3,4,5,7,10,15,20],bandColors:RAIN_COLORS},
 apcp24h:{label:'24-hour precipitation',unit:'in',convert:'mmtoin',levels:[.01,.05,.1,.25,.5,.75,1,1.5,2,3,4,5,6,8,10,12,16,20,25],bandColors:RAIN_COLORS},
 apcp48h:{label:'48-hour precipitation',unit:'in',convert:'mmtoin',levels:[.01,.05,.1,.25,.5,.75,1,1.5,2,3,4,5,6,8,10,12,16,20,25],bandColors:RAIN_COLORS},
 apcp:{label:'Accumulated precipitation',unit:'in',convert:'mmtoin',levels:[.01,.05,.1,.25,.5,.75,1,1.5,2,3,4,5,6,8,10,12,16,20,25],bandColors:RAIN_COLORS},
 frozr:{label:'Sleet accumulation',unit:'in',convert:'mmtoin',levels:[.01,.03,.05,.1,.2,.3,.5,.75,1,1.5,2,3,4,5,6,8],bandColors:RAIN_COLORS},
 frzr:{label:'Freezing rain accumulation',unit:'in',convert:'mmtoin',levels:[.005,.01,.03,.05,.1,.2,.3,.5,.75,1,1.5,2,3,4,5,6],bandColors:RAIN_COLORS},
 tsnowp:{label:'Snow precipitation (liquid equivalent)',unit:'in',convert:'mmtoin',levels:[.01,.05,.1,.25,.5,.75,1,1.5,2,3,4,5,6,8,10,12],bandColors:RAIN_COLORS},
 asnow:{label:'Accumulated snowfall',unit:'in',convert:'mtoin',levels:[.1,.5,1,2,3,4,6,8,12,16,20,24,30,36,48,60,72,96],bandColors:SNOW_COLORS},
 weasd:{label:'Snow water equivalent',unit:'in',convert:'mmtoin',levels:[.01,.05,.1,.25,.5,.75,1,1.5,2,3,4,5,6,8,10,12,16,20,25],bandColors:RAIN_COLORS},
 snod:{label:'Snow depth',unit:'in',convert:'mtoin',levels:[.1,.5,1,2,3,4,6,8,12,16,24,30,36,48,60,72,96,144],bandColors:SNOW_COLORS},
 snowpresence:{label:'RAP snow presence (≥ 1 cm)',unit:'',category:'#70c7f0'},
 snowc:{label:'Snow cover',unit:'%',min:0,max:100,cutoff:1,copyColors:'rh2m'},
 cpofp:{label:'Percent frozen precipitation',unit:'%',min:0,max:100,copyColors:'t2m'},
 sden:{label:'Snow density',unit:'kg m⁻³',min:50,max:500,copyColors:'rh2m'},
 csnow:{label:'Categorical snow',unit:'',category:'#65b6ff'},
 cicep:{label:'Categorical ice pellets',unit:'',category:'#ef8dd7'},
 cfrzr:{label:'Categorical freezing rain',unit:'',category:'#da5d95'},
 crain:{label:'Categorical rain',unit:'',category:'#59d37c'},
 ptype:{label:'Precipitation type',unit:'',ptype:true},
 snow1h:{label:'1-hour snowfall',unit:'in',convert:'mtoin',levels:[.01,.05,.1,.25,.5,1,2,3,4,6,8,12,16,20,24,30,36],bandColors:SNOW_COLORS},
 snow3h:{label:'3-hour snowfall',unit:'in',convert:'mtoin',levels:[.01,.05,.1,.25,.5,1,2,3,4,6,8,12,16,20,24,30,36],bandColors:SNOW_COLORS},
 snow6h:{label:'6-hour snowfall',unit:'in',convert:'mtoin',levels:[.1,.5,1,2,3,4,6,8,12,16,20,24,30,36,48,60,72,96],bandColors:SNOW_COLORS},
 snow24h:{label:'24-hour snowfall',unit:'in',convert:'mtoin',levels:[.1,.5,1,2,3,4,6,8,12,16,20,24,30,36,48,60,72,96],bandColors:SNOW_COLORS},
 snow48h:{label:'48-hour snowfall',unit:'in',convert:'mtoin',levels:[.1,.5,1,2,3,4,6,8,12,16,20,24,30,36,48,60,72,96],bandColors:SNOW_COLORS},
};
for(const pressure of [925,850,700,500,300]){
 FIELDS['h'+pressure]={label:pressure+'-hPa geopotential height',unit:'gpm'};
 for(const dir of ['u','v']) FIELDS[dir+pressure]={label:pressure+'-hPa '+dir.toUpperCase()+' wind',unit:'kt',convert:'mpsToKt'};
}
for(const [key,label,unit,min,max] of [
 ['shear01','0–1 km bulk shear','kt',0,100],['shear06','0–6 km bulk shear','kt',0,140],
 ['srh01','0–1 km storm-relative helicity','m² s⁻²',-200,650],['srh03','0–3 km storm-relative helicity','m² s⁻²',-200,850],
 ['sbcape','Surface-based CAPE','J kg⁻¹',0,6000],['mlcape','Mixed-layer CAPE','J kg⁻¹',0,6000],['mucape','Most-unstable CAPE','J kg⁻¹',0,7000],
 ['mxuphl','1-hour maximum updraft helicity (2–5 km)','m² s⁻²',-200,400],
 ['mxuphl_run','Accumulated maximum updraft helicity (2–5 km)','m² s⁻²',-200,400],
 ['scp','Supercell composite parameter (effective layer)','',0,30],
 ['stp','Significant tornado parameter with CIN (effective layer)','',0,15],
 ['stp_fixed','Significant tornado parameter (fixed layer)','',0,15]])
 FIELDS[key]={label,unit,min,max,...(['sbcape','mlcape','mucape'].includes(key)?{cutoff:10}:['scp','stp','stp_fixed'].includes(key)?{cutoff:.1}:{}),...(key.startsWith('shear')?{convert:'mpsToKt'}:{}),colors:[[0,'#dae7ee'],[.18,'#b1c8d5'],[.35,'#6faf99'],[.5,'#e0d76d'],[.7,'#eda04a'],[.87,'#d65a50'],[1,'#9d3272']],fraction:true};
// Background transparency is a *display-only* choice. Keep genuinely zero
// quantities unshaded (and tiny signed values near neutral unshaded) rather
// than painting an entire domain, without hiding missing data or changing Zarr.
// Thresholds use the display units established in each field definition.
for(const [name,threshold] of Object.entries({
 wspd10:2,wspd300:2,gust:2,u10:2,v10:2,
 rh2m:1,cpofp:1,snowc:1,
 sbcape:10,mlcape:10,mucape:10,
 shear01:2,shear06:2,srh01:10,srh03:10,
 scp:.1,stp:.1,stp_fixed:.1,
 absv500:1,mxuphl:5,mxuphl_run:5
}))FIELDS[name].clearZero=threshold;
// Explicit near-zero transparent zone for hourly and run-max updraft helicity.
for(const name of ['mxuphl','mxuphl_run']){
 FIELDS[name].levels=[-200,-100,-50,-20,-5,5,10,20,40,75,125,175,250,400];
 FIELDS[name].bandColors=['#294b9c','#477cbe','#78a8cf','#adc9d5','#00000000','#e6cb79','#edab56','#e68d45','#d96238','#c53937','#a51d5c','#7a2182','#562074'];
 delete FIELDS[name].colors;
}
// Fixed forecaster field sequence. U/V are read for barbs, not separate menu fields.
const FIELD_ORDER = [
 'ptype','refc_ptype','refc','csnow','cicep','cfrzr','crain',
 'mslp','t2m','dpt2m','rh2m','prate','apcp1h','apcp3h','apcp6h','apcp24h','apcp48h','apcp','frozr','frzr','tsnowp',
 'snow1h','snow3h','snow6h','snow24h','snow48h','asnow','cpofp','snowc','sden','weasd','snod',
 't925','t850','t700','absv500','wspd300','wspd10','gust',
 'shear01','shear06','srh01','srh03','sbcape','mlcape','mucape','mxuphl','mxuphl_run','scp','stp','stp_fixed'
];
// Menu choices describe what this viewer can render; the catalogs decide what
// each model and forecast hour can actually provide. Keep the two independent.
function fieldMenuEntries(){
 return FIELD_ORDER.filter(n=>Object.prototype.hasOwnProperty.call(FIELDS,n))
  .map(n=>({key:n,label:FIELDS[n].label}));
}
// Compact two-level field navigation. The underlying field IDs, forecast
// availability, deep links, rendering, and exports are completely unchanged.
// Group definitions are deliberately independent from published catalogs so
// every supported selection is visible even before its data are backfilled.
const FIELD_GROUP_DEFS = [
 {key:'radar',label:'Radar & precip. type',fields:['refc','ptype','refc_ptype','csnow','cicep','cfrzr','crain']},
 {key:'surface',label:'Surface weather',fields:['mslp','t2m','dpt2m','rh2m','wspd10','gust']},
 {key:'precip',label:'Precipitation',fields:['prate','apcp1h','apcp3h','apcp6h','apcp24h','apcp48h','apcp']},
 {key:'snow',label:'Winter weather',fields:['snow1h','snow3h','snow6h','snow24h','snow48h','asnow','frzr','frozr','tsnowp','cpofp','weasd','snod','snowc','sden']},
 {key:'upperair',label:'Upper air',fields:['t925','t850','t700','absv500','wspd300']},
 {key:'shear',label:'Shear & helicity',fields:['shear01','shear06','srh01','srh03']},
 {key:'convective',label:'Instability & severe storms',fields:['sbcape','mlcape','mucape','mxuphl','mxuphl_run','scp','stp','stp_fixed']}
];
function fieldMenuGroups(){
 const menu=fieldMenuEntries(),byKey=new Map(menu.map(f=>[f.key,f]));
 const used=new Set();
 const groups=FIELD_GROUP_DEFS.map(def=>({
  key:def.key,label:def.label,
  fields:def.fields.filter(key=>byKey.has(key)&&!used.has(key)&&!!used.add(key)).map(key=>byKey.get(key))
 })).filter(group=>group.fields.length);
 // Future fields will remain discoverable even before they are categorized.
 const ungrouped=menu.filter(field=>!used.has(field.key));
 if(ungrouped.length)groups.push({key:'other',label:'Other fields',fields:ungrouped});
 return groups;
}
const FIELD_MENU_GROUPS=fieldMenuGroups();
function fieldGroupFor(fieldKey){return FIELD_MENU_GROUPS.find(group=>group.fields.some(field=>field.key===fieldKey));}

// Native converter classes: 0 none/unknown, 1 rain, 2 snow, 3 freezing rain,
// 4 ice pellets (sleet), 5 mixed. Use one label table for hover and legends.
const PTYPE_LABELS=['None / Unknown','Rain','Snow','Freezing Rain','Sleet','Mixed'];
const PTYPE = ['#192939','#4bc86c','#55b2f0','#e75889','#b266d8','#f0c764'];
// Public, preprocessed observation GeoJSON: no browser-side API tokens or proxy.
const PTYPE_OBS_EMPTY={type:'FeatureCollection',features:[]};
function obsValidDate(){return st.ref?new Date(Date.parse(st.ref.init_time)+st.hour*3600000):null;}
function observationHourKey(time){return time.toISOString().slice(0,13).replace(/[-T:]/g,'');}
function observationPath(time){
 const root=String(st.cfg?.ptypeObservations?.path||'data/ptype_observations/').replace(/\/?$/,'/');
 return root+observationHourKey(time)+'.json';
}
function observationVisible(){return (st.field==='ptype'||st.field==='refc_ptype')&&!!st.cfg?.ptypeObservations?.enabled;}
function observationSetCount(){
 if(!el.obsCount)return;
 if(!observationVisible()){el.obsCount.textContent='';return;}
 const data=st.obsCurrent;
 if(!data){el.obsCount.textContent='Loading…';return;}
 if(data.future){el.obsCount.textContent='Valid time in future';return;}
 if(data.missing){el.obsCount.textContent='No published reports';return;}
 const counts={synoptic:0,mping:0};
 for(const f of data.features||[]){const src=f?.properties?.source;if(counts[src]!==undefined&&st.obsEnabled[src])counts[src]++;}
 el.obsCount.textContent=`${counts.synoptic+counts.mping} reports`;
}
function filteredObservationGeoJSON(){
 if(!observationVisible()||!st.obsCurrent?.features)return PTYPE_OBS_EMPTY;
 return {type:'FeatureCollection',features:st.obsCurrent.features.filter(f=>st.obsEnabled[f?.properties?.source]===true)};
}
// Draw each mPING triangle as a small local raster icon. This does not
// depend on remote map glyphs, font downloads, image URLs or API credentials.
function mpingTriangleImage(ptype,theme){
 const size=36,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
 const ctx=canvas.getContext('2d');
 ctx.beginPath();ctx.moveTo(18,4);ctx.lineTo(32,31);ctx.lineTo(4,31);ctx.closePath();
 ctx.fillStyle=PTYPE[ptype];ctx.fill();
 ctx.lineJoin='round';ctx.strokeStyle=theme==='light'?'#152633':'#ffffff';ctx.lineWidth=2.8;ctx.stroke();
 return ctx.getImageData(0,0,size,size);
}
function refreshMpingTriangleTheme(m){
 for(let code=1;code<=5;code++){
  const name=`evu-observed-mping-${code}`,img=mpingTriangleImage(code,st.theme);
  try{if(m.hasImage(name))m.updateImage(name,img);else m.addImage(name,img,{pixelRatio:2});}
  catch(err){console.warn('mPING marker unavailable:',String(err));}
 }
}
function ensureObservationOverlay(p){
 if(!p.map)return;
 const m=p.map;
 try{
  if(!m.getSource('evu-observed-ptype'))m.addSource('evu-observed-ptype',{type:'geojson',data:PTYPE_OBS_EMPTY});
  if(!m.getLayer('evu-observed-metar')){
   const colors=['match',['get','ptype'],...PTYPE.slice(1).flatMap((c,i)=>[i+1,c]),'#999999'];
   m.addLayer({id:'evu-observed-metar',type:'circle',source:'evu-observed-ptype',
    filter:['==',['get','source'],'synoptic'],
    paint:{'circle-radius':['interpolate',['linear'],['zoom'],2,3.8,5,5.0,9,6.0],
      'circle-color':colors,'circle-stroke-color':st.theme==='light'?'#152633':'#ffffff',
      'circle-stroke-width':1.25,'circle-opacity':.94,'circle-stroke-opacity':.93}});
  }
  if(!m.getLayer('evu-observed-mping')){
   refreshMpingTriangleTheme(m);
   m.addLayer({id:'evu-observed-mping',type:'symbol',source:'evu-observed-ptype',
    filter:['==',['get','source'],'mping'],
    layout:{'icon-image':['concat','evu-observed-mping-',['to-string',['get','ptype']]],
      'icon-size':['interpolate',['linear'],['zoom'],2,.59,5,.73,9,.9],
      'icon-allow-overlap':true,'icon-ignore-placement':true}});
  }
  for(const layer of ['evu-observed-metar','evu-observed-mping']){
   if(p.obsClickInstalled?.has(layer))continue;
   if(!p.obsClickInstalled)p.obsClickInstalled=new Set();
   p.obsClickInstalled.add(layer);
   m.on('click',layer,ev=>{
    if(!observationVisible()||!ev.features?.length)return;
    const prop=ev.features[0].properties||{};
    const label=PTYPE_LABELS[Number(prop.ptype)]||'Precipitation';
    const src=prop.source==='mping'?'mPING':'METAR (Synoptic Data)';
    const time=prop.observed_time?fmt(prop.observed_time):'Unknown UTC time';
    // Text-only popup escapes untrusted station and description fields.
    new maplibregl.Popup({closeButton:true,maxWidth:'240px',className:'evu-report-popup'})
      .setLngLat(ev.lngLat).setText(`${label} · ${src}\n${prop.station||''} · ${time}`).addTo(m);
   });
   m.on('mouseenter',layer,()=>{if(m.getCanvas())m.getCanvas().style.cursor='pointer';});
   m.on('mouseleave',layer,()=>{if(m.getCanvas())m.getCanvas().style.cursor='';});
  }
 }catch(e){console.warn('Observation overlay unavailable:',String(e));}
}
function syncObservationPanel(p){
 if(!p.map)return;
 ensureObservationOverlay(p);
 const m=p.map;
 try{const src=m.getSource('evu-observed-ptype');
  if(src){src.setData(filteredObservationGeoJSON());
   for(const id of ['evu-observed-metar','evu-observed-mping']){
    if(m.getLayer(id))m.setLayoutProperty(id,'visibility',observationVisible()?'visible':'none');
   }
  }
 }catch(err){console.warn('Observation overlay update:',err);}
}
function syncAllObservationPanels(){for(const p of st.active)syncObservationPanel(p);observationSetCount();}
async function fetchObservationHour(when){
 const key=observationHourKey(when), prior=st.obsCache.get(key);
 if(prior&&Date.now()-prior.at<(prior.value?.missing?90000:600000))return prior.value;
 const future=when.getTime()+Number(st.cfg.ptypeObservations?.windowMinutes??30)*60000>Date.now();
 if(future)return {future:true,features:[]};
 const url=observationPath(when);
 try{const response=await fetch(url,{cache:'no-store'});
  if(response.status===404){const value={missing:true,features:[]};st.obsCache.set(key,{value,at:Date.now()});return value;}
  if(!response.ok)throw Error('HTTP '+response.status);
  const obj=await response.json();
  if(obj.schema!=='omd-evu-ptype-observations-1'||obj.type!=='FeatureCollection'||Date.parse(obj.valid_time)!==when.getTime())throw Error('Observation payload mismatch');
  const value={features:(obj.features||[]).filter(f=>f?.geometry?.type==='Point'&&Number.isInteger(f?.properties?.ptype)&&f.properties.ptype>=1&&f.properties.ptype<=5)};
  st.obsCache.set(key,{value,at:Date.now()});
  if(st.obsCache.size>36)st.obsCache.delete(st.obsCache.keys().next().value);
  return value;
 }catch(e){console.warn('Observation data missing or invalid:',String(e));return{missing:true,features:[]};}
}
async function refreshObservationOverlay(){
 const token=++st.obsLoadToken;
 if(!observationVisible()||!st.ref){st.obsCurrent=null;syncAllObservationPanels();return;}
 const when=obsValidDate();st.obsCurrent=null;syncAllObservationPanels();
 const data=await fetchObservationHour(when);
 if(token!==st.obsLoadToken)return;
 st.obsCurrent=data;syncAllObservationPanels();
}

// Preliminary SPC reports in 12Z–12Z files; no remote API calls in the browser.
const SPC_EMPTY={type:'FeatureCollection',features:[]};
const SPC_COLORS={tornado:'#e63737',wind:'#2e80dc',hail:'#35b86b'};
const SPC_FIELDS=new Set(['refc','refc_ptype','shear01','shear06','srh01','srh03','sbcape','mlcape','mucape','mxuphl','mxuphl_run','scp','stp','stp_fixed']);
function spcVisible(){return st.spcEnabled&&SPC_FIELDS.has(st.field);}
function spcWindow(){
 if(!st.ref)return null;
 const end=obsValidDate();
 const start=st.field==='mxuphl_run'?new Date(st.ref.init_time):new Date(end.getTime()-3600000);
 return {start,end};
}
function spcDayKeys(start,end){
 const keys=[];let day=new Date(start.getTime()-12*3600000);
 day=new Date(Date.UTC(day.getUTCFullYear(),day.getUTCMonth(),day.getUTCDate(),12));
 while(day.getTime()<=end.getTime()&&keys.length<=8){keys.push(day.toISOString().slice(2,10).replaceAll('-',''));day=new Date(day.getTime()+86400000);}
 return keys;
}
function spcJsonPath(day){return new URL(`data/spc_reports/${day}.json`,location.href).href;}
async function fetchSPCDay(day){
 const prior=st.spcCache.get(day);
 if(prior&&Date.now()-prior.at<((prior.features?.length?10:2)*60000))return prior.features;
 let features=[];
 try{
  const response=await fetch(spcJsonPath(day),{cache:'no-store'});
  if(response.ok){const obj=await response.json();
   if(obj.schema!== 'omd-evu-spc-lsr-1'||obj.spc_day!==day||obj.type!=='FeatureCollection')throw Error('SPC day mismatch');
   features=(obj.features||[]).filter(f=>f?.geometry?.type==='Point'&&SPC_COLORS[f?.properties?.type]&&Number.isFinite(Date.parse(f?.properties?.time)));
  }else if(response.status!==404)throw Error('SPC HTTP '+response.status);
 }catch(e){console.warn('SPC reports unavailable for',day,String(e));}
 st.spcCache.set(day,{features,at:Date.now()});
 if(st.spcCache.size>24)st.spcCache.delete(st.spcCache.keys().next().value);
 return features;
}
function ensureSPCOverlay(p){
 if(!p.map)return;
 const m=p.map;
 try{
  if(!m.getSource('evu-spc-lsr'))m.addSource('evu-spc-lsr',{type:'geojson',data:SPC_EMPTY});
  if(!m.getLayer('evu-spc-lsr')){
   m.addLayer({id:'evu-spc-lsr',type:'circle',source:'evu-spc-lsr',
    paint:{'circle-radius':['interpolate',['linear'],['zoom'],2,4.3,6,5.5,10,6.5],
     'circle-color':['match',['get','type'],'tornado',SPC_COLORS.tornado,'wind',SPC_COLORS.wind,'hail',SPC_COLORS.hail,'#999'],
     'circle-stroke-color':st.theme==='light'?'#172536':'#ffffff',
     'circle-stroke-width':1.3,'circle-opacity':.96}});
  }
  if(!p.spcClickInstalled){p.spcClickInstalled=true;
   m.on('click','evu-spc-lsr',event=>{
    if(!spcVisible()||!event.features?.length)return;
    const a=event.features[0].properties||{};
    const label=String(a.type||'report').toUpperCase();
    const message=`${label} · ${a.time||''}\n${a.location||''}, ${a.state||''}\nMagnitude: ${a.magnitude||'UNK'}\n${a.remarks||''}`;
    new maplibregl.Popup({maxWidth:'260px',className:'evu-report-popup'}).setLngLat(event.lngLat).setText(message).addTo(m);
   });
   m.on('mouseenter','evu-spc-lsr',()=>{if(m.getCanvas())m.getCanvas().style.cursor='pointer';});
   m.on('mouseleave','evu-spc-lsr',()=>{if(m.getCanvas())m.getCanvas().style.cursor='';});
  }
 }catch(e){console.warn('SPC overlay unavailable:',String(e));}
}
// A map may start well after the SPC fetch has completed (lazy grid panels),
// or may have its weather custom layer replaced for a different field/hour.
// Reconcile every individual panel at those transitions; never couple LSR
// visibility to the forecast model or to whichever panel initialized first.
function syncSPCPanel(p){
 if(!p?.map)return;
 const m=p.map;
 ensureSPCOverlay(p);
 try{
  const source=m.getSource('evu-spc-lsr');
  if(!source||!m.getLayer('evu-spc-lsr'))return;
  const visible=spcVisible();
  source.setData(visible?{type:'FeatureCollection',features:st.spcCurrent}:SPC_EMPTY);
  m.setLayoutProperty('evu-spc-lsr','visibility',visible?'visible':'none');
  // Plot layers can be rebuilt asynchronously after the basemap and reports
  // were first installed. Keep storm-report symbols above weather shading.
  if(visible&&typeof m.moveLayer==='function')m.moveLayer('evu-spc-lsr');
  m.triggerRepaint?.();
 }catch(e){console.warn('Could not synchronize LSR layer for panel',p.cfg?.label||p.i,String(e));}
}
function syncSPCPanels(){
 const visible=spcVisible();
 if(el.spcCount)el.spcCount.textContent=visible?`${st.spcCurrent.length} preliminary reports`:'';
 for(const p of st.active)syncSPCPanel(p);
}
async function refreshSPCReports(){
 const token=++st.spcLoadToken;
 if(!spcVisible()||!st.ref){st.spcCurrent=[];syncSPCPanels();return;}
 const range=spcWindow();if(!range||range.end.getTime()>Date.now()){st.spcCurrent=[];syncSPCPanels();return;}
 const days=spcDayKeys(range.start,range.end);
 const collections=await Promise.all(days.map(fetchSPCDay));
 if(token!==st.spcLoadToken)return;
 const seen=new Set();const combined=[];
 for(const feature of collections.flat()){
  const when=Date.parse(feature?.properties?.time);
  if(!(when>range.start.getTime()&&when<=range.end.getTime()))continue;
  const key=[feature.properties.type,feature.properties.time,...feature.geometry.coordinates,feature.properties.magnitude].join('|');
  if(!seen.has(key)){seen.add(key);combined.push(feature);}
 }
 st.spcCurrent=combined;syncSPCPanels();
}

/* OMD EVU autumnplot-gl + MapLibre GL viewer. Zarr-v2 decoding stays browser-native. */
'use strict';
const $=id=>document.getElementById(id);
const el=Object.fromEntries(['userGuideBtn','userGuideDialog','userGuideClose','userGuideDone','imageOpacity','imageOpacityLabel','spcControl','spcToggleBtn','spcCount','obsControl','obsSynoptic','obsMping','obsCount','obsAttribution','contourOption','mslp850Option','mslp850ToggleBtn','exportKindFieldset','exportGifChoice','exportGifOptions','exportGifStart','exportGifStartLabel','exportGifEnd','exportGifEndLabel','exportGifStep','exportGifDelay','exportGifQuality','exportLargeLabels','exportScroll','exportGifDelayLabel','exportGifSummary','modelSetSelect','differenceDialog','differenceDialogPair','differenceOpenBtn','differenceCancelBtn','differenceWindow','differenceMap','differenceMessage','differenceDragHandle','differenceWindowTitle','differenceWindowSubtitle','differenceCloseBtn','differenceSaveBtn','differenceSample','differenceLegendUnit','contourControl','contourToggleBtn','heightOption','heightToggleBtn','windOption','windToggleBtn','fieldMenuBtn','fieldMenuPopup','fieldMenuCategories','fieldMenuBranch','fieldMenuBack','fieldMenuBranchTitle','fieldMenuItems','fieldMenuSelected','shareLinkStatus','cycleSelect','fcstSelect','stepBackBtn','stepForwardBtn','playBtn','pauseBtn','speedDownBtn','speedUpBtn','speedValue','exportDialog','exportForm','exportCloseBtn','exportCancelBtn','exportConfirmBtn','exportBusyStatus','exportDialogTitle','exportDialogHelp','exportSize169','exportSize43','resetViewBtn','copyLinkBtn','saveAllPngBtn','mapViewSelect','themeToggleBtn','controlsPositionBtn','mobileControlsBtn','viewerGrid','dataStatus','sharedLegend','sharedLegendTitle','sharedLegendCanvas','sharedLegendLabels','legendResetBtn','legendRangePopup','legendRangeForm','legendRangeMessage','legendRangeError','legendMinSlider','legendMaxSlider','legendMinNumber','legendMaxNumber','legendRangeApplyBtn','legendRangeResetBtn','legendCancelBtn'].map(x=>[x,$(x)]));
const st={spcEnabled:false,spcCache:new Map(),spcCurrent:[],spcLoadToken:0,imageOpacity:1,overlayMSLP:true,overlayMSLP850:true,cacheStats:{network:0,disk:0,decoded:0,displayReady:0,shared:0,decodedEvicted:0,displayEvicted:0},contours:false,overlayHeight:true,overlayUpperWind:true,overlaySurfaceWind:true,difference:{selected:[],open:false,map:null,layer:null,component:null,grid:null,token:0,timer:null,resizeObserver:null,geo:null,fieldKey:null,snapshot:null,saveBusy:false,mouseSampling:false,liveCanvas:null,liveToken:0,liveTimer:null,outlineCache:null,warmKey:null,warmSerial:0},mrmsAccumCache:null,alignedAccumCache:null,alignedSource:null,geoCache:new Map(),geoInflight:new Map(),cfg:null,sources:new Map(),primary:null,cycles:[],runPinned:false,ref:null,field:null,lastFieldByGroup:new Map(),hour:0,panels:[],theme:'dark',mode:'lambert',seq:0,active:[],columnCount:1,mapView:null,mapViews:{lambert:null,globe:null},rendering:false,playing:false,syncing:false,observer:null,cache:new Map(),cacheBytes:0,displayCache:new Map(),displayCacheBytes:0,displayInflight:new Map(),inflight:new Map(),queue:[],running:0,clock:0,loopSpeedIndex:2,prefetchTimer:null,prefetchGeneration:0,prefetchActive:0,prefetchAttempted:new Map(),prefetchContext:null,prefetchBatchRunning:false,prefetchBatchToken:null,prefetchFocus:null,prefetchSeenForFocus:new Set(),prefetchCompleted:0,prefetchFailed:0,prefetchBySource:new Map(),prefetchDirection:1,lastUserActivity:Date.now(),chunkStore:null,compressedInflight:new Map(),queuedFetches:new Map(),exportSelection:null,exporting:false,lastExportRatio:"16:9",lastExportFraming:"fill",hover:null,hoverRaf:0,exportRender:false,expandedPanel:null,mapInitQueue:Promise.resolve(),mobilePressureCap:null,contextLossCount:0,obsCache:new Map(),obsCurrent:null,obsLoadToken:0,obsEnabled:{synoptic:true,mping:true},colorRanges:new Map(),legendSelection:null};
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
function fieldInfo(v,requested=st.field,sourceModel=''){
 const meta=FIELDS[requested==='refc_ptype'?'refc_ptype':(((precipitationAccumulationHours(requested)&&v.name==='apcp')||(snowAccumulationHours(requested)&&v.name==='asnow')||(requested==='snow48h'&&v.name==='snow24h'))?requested:v.name)]||{label:v.attrs?.long_name||v.name,unit:v.attrs?.units||'',min:0,max:100,copyColors:'rh2m'};
 const colors=meta.copyColors?FIELDS[meta.copyColors].colors:meta.colors;
 const meanFraction=!!(meta.category&&v.attrs?.ensemble_mean_fraction);
 // The source model is supplied for per-panel labels so existing catalogs
 // display correctly before any newer Zarr .zattrs are published.
 const isRefsMean=sourceModel==='refs_mean'||/^REFS[ -]Mean$/i.test(sourceModel);
 const isHRRR=/^hrrr$/i.test(sourceModel);
 const dominantMean=!!(v.name==='ptype'&&(v.attrs?.ensemble_dominant_type||isRefsMean));
 const matchedReflectivity=v.name==='refc'&&(isRefsMean||v.attrs?.probability_matched_mean);
 const matchedPrecip=v.name==='apcp'&&isRefsMean&&!!(v.attrs?.probability_matched_mean||v.attrs?.GRIB_product==='pmmn');
 const legacyMeanPrecip=v.name==='apcp'&&isRefsMean&&!matchedPrecip;
 const intervalHours=precipitationAccumulationHours(requested);
 const label=matchedReflectivity?'PMM composite reflectivity'
  :matchedPrecip&&intervalHours?`PMM ${intervalHours}-hour precipitation`
  :legacyMeanPrecip&&intervalHours?`${intervalHours}-hour precipitation · legacy ensemble mean`
  :matchedPrecip?'PMM accumulated precipitation'
  :legacyMeanPrecip?'Accumulated precipitation · legacy ensemble mean'
  :v.name==='ptype'&&isHRRR?'Derived precipitation type'
  :dominantMean?'Dominant ensemble precipitation type'
  :v.name==='ptype'?'Dominant precipitation type'
  :meanFraction?meta.label+' · weighted mean':meta.label;
 return {...meta,colors,fraction:meta.fraction||!!meta.copyColors&&!!FIELDS[meta.copyColors].fraction,
  ensembleMeanFraction:meanFraction,label,unit:meanFraction?'fraction':meta.unit};
}
// A raw Zarr chunk is converted ONCE into the display units used by the GPU
// field, its color map and its hover readout. Never convert sampled GPU values.
function convert(x,m){switch(m.convert){case 'F':return(x-273.15)*1.8+32;case 'C':return x-273.15;case 'mmtoin':return x/25.4;case 'mtoin':return x*39.37007874;case 'perhour':return x*3600;case 'mpsToKt':return x*1.9438444924406;case 'vort1e5':return x*1e5;case 'PaToHpa':return x/100;default:return x;}}
function formatReadout(x,m){
 if(!Number.isFinite(x)||x < -1e9)return '—';
 if(m.ptypeReflectivity){
  const code=Math.floor(x/80)+1,dbz=x-(code-1)*80;
  return code>=1&&code<=5&&dbz>=10&&dbz<80?`${PTYPE_LABELS[code]} · ${dbz.toFixed(1)} dBZ`:'—';
 }
 if(m.ptype){
  // PTYPE is categorical; reject fractional/interpolated codes rather than
  // reporting a fabricated weather type. Codes are stored as exact uint8.
  const code=Math.round(x);
  return Math.abs(x-code)<.01&&code>=0&&code<PTYPE_LABELS.length?PTYPE_LABELS[code]:'Unknown';
 }
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
 // Remember each panel's normal viewport size for matching county detail when
 // an expanded panel occupies substantially more of the plotting workspace.
 if(!st.expandedPanel)for(const p of st.panels){
  const w=p.view?.clientWidth||0,h=p.view?.clientHeight||0;
  if(w>20&&h>20)p.normalViewportSize={width:w,height:h};
 }
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
function countyThreshold(p=null){
 const d=st.cfg?.display||{};
 const base=Number(d[st.mode==='globe'?'globeCountyMinZoom':'countyMinZoom']??(st.mode==='globe'?4.30:4.25));
 // The same map zoom covers a larger geographic footprint in an expanded
 // viewport. Delay counties in proportion to its increased *map area* so
 // their perceived scale is closer to the ordinary multi-panel layout.
 // Do not change any other panel, model camera, or 2D/Globe saved zoom.
 if(!p||st.expandedPanel!==p||!p.normalViewportSize)return base;
 const w=p.view?.clientWidth||0,h=p.view?.clientHeight||0;
 const original=p.normalViewportSize;
 if(w<=0||h<=0||original.width<=0||original.height<=0)return base;
 const widthRatio=Math.max(1,w/original.width),heightRatio=Math.max(1,h/original.height);
 const extra=Math.max(0,Math.min(2,Math.log2(Math.sqrt(widthRatio*heightRatio))));
 return base+extra;
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

// When a user selects a field, cycle, or another toolbar control, the browser
// can leave keyboard focus on that control even after the pointer returns to a
// map. Arrow keys would then operate the control (or be ignored by the viewer)
// until the user clicked the plot. Return focus to document-level navigation
// as soon as a mouse/pen pointer re-enters a plotting viewport. Do not do this
// for touch, inside dialogs, or while focus stays in the controls for keyboard
// accessibility: merely hovering the map is the explicit handoff.
function restorePlotKeyboardNavigation(e){
 if(e.pointerType && e.pointerType!=='mouse' && e.pointerType!=='pen')return;
 if(el.exportDialog?.open)return;
 const focused=document.activeElement;
 if(!focused || focused===document.body)return;
 if(focused instanceof HTMLElement && focused.closest('header.toolbar, .helper')){
  focused.blur();
 }
}
function createPanel(cfg,i){const card=document.createElement('section');card.className='panel-card';card.dataset.panelId=cfg.id;
 const save=document.createElement('button');save.type='button';save.className='panel-save';
 save.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/></svg>';
 save.setAttribute('aria-label',`Download ${cfg.label||cfg.id} PNG`);save.title=`Save ${cfg.label||cfg.id} PNG`;save.disabled=true;
 const expand=document.createElement('button');expand.type='button';expand.className='panel-expand';
 expand.setAttribute('aria-pressed','false');expand.setAttribute('aria-label',`Expand ${cfg.label||cfg.id} panel`);
 expand.title=`Expand ${cfg.label||cfg.id} to fill plotting area`;
 expand.innerHTML=EXPAND_ICON;
 const view=document.createElement('div');view.className='panel-viewport';const snap=document.createElement('img');snap.className='map-snapshot';snap.alt='Previously rendered weather plot';snap.hidden=true;const frame=document.createElement('div');frame.className='map-frame';const lbl=document.createElement('div');lbl.className='plot-label';const title=document.createElement('strong'),sub=document.createElement('span'),labelMeta=document.createElement('div');labelMeta.className='plot-label-meta';labelMeta.append(title,sub);lbl.append(labelMeta);const notice=document.createElement('div');notice.className='notice visible';const note=document.createElement('span');notice.append(note);const info=document.createElement('div');info.className='point-info';info.hidden=true;const ghost=document.createElement('div');ghost.className='sync-crosshair';ghost.hidden=true;ghost.setAttribute('aria-hidden','true');view.append(frame,snap,lbl,notice,info,ghost);
 const compare=document.createElement('label');compare.className='panel-difference-selector';
 const compareCheck=document.createElement('input');compareCheck.type='checkbox';compareCheck.setAttribute('aria-label',`Select ${cfg.label||cfg.id} for difference map`);
 compare.title=`Compare ${cfg.label||cfg.id} with another panel (first selected minus second selected)`;compare.append(compareCheck);if(!cfg.placeholder){lbl.prepend(compare);view.append(save);}view.append(expand);
 const ft=document.createElement('div');ft.className='panel-footer';const legendTitle=document.createElement('div');legendTitle.className='legend-title';const legendCanvas=document.createElement('canvas');legendCanvas.className='legend-canvas';const legendLabels=document.createElement('div');legendLabels.className='legend-labels';ft.append(legendTitle,legendCanvas,legendLabels);card.append(view,ft);el.viewerGrid.append(card);
 legendCanvas.addEventListener('click',e=>{
  e.stopPropagation();
  const current=fieldInfo(p.v||{name:p.cfg.field||st.field},p.cfg.field||st.field,p.ds?.model||p.cfg.source);
  if(!p.v||!adjustableColorbar(current))return;
  const rect=legendCanvas.getBoundingClientRect();
  if(rect.width<=0||rect.height<=0)return;
  // Vertical legends grow upwards; horizontal legends grow to the right.
  const ratio=st.verticalLegends?1-(e.clientY-rect.top)/rect.height:(e.clientX-rect.left)/rect.width;
  selectLegendRangePoint({...e,currentTarget:{getBoundingClientRect:()=>({left:0,width:1})},clientX:ratio},pal(current,p.v),current);
 });
 view.addEventListener('pointerenter',restorePlotKeyboardNavigation);
 view.addEventListener('pointermove',restorePlotKeyboardNavigation,{passive:true});
 compare.addEventListener('pointerdown',e=>e.stopPropagation());compare.addEventListener('click',e=>e.stopPropagation());
 const p={contourField:null,contourCanvas:null,contourFrameRequested:false,contourRafId:null,contourRedrawTimer:null,contourCache:null,cfg,i,card,view,frame,snap,title,sub,notice,note,info,ghost,save,expand,compare,compareCheck,legendTitle,legendCanvas,legendLabels,wind:null,windCanvas:null,windFrameRequested:false,map:null,component:null,layer:null,rawField:null,ds:null,v:null,h:null,src:null,lastKey:null,image:null,lastSnapshot:null,grid:null,gridKey:null,status:'waiting',busy:false,geoApplied:new Set(),geoPending:new Set(),geoTimer:null,mapReady:null,activation:null,initializing:false,cancelMapWait:null,loadingStage:'',loadSince:0,stageSince:0};
 notice.style.pointerEvents='none';card.addEventListener('click',()=>{selectPanel(p);if(!p.cfg.placeholder)activate(p).catch(e=>fail(p,e));});save.addEventListener('click',e=>{e.stopPropagation();openExportDialog('panel',p,e);});
 expand.addEventListener('click',e=>{e.stopPropagation();setExpandedPanel(st.expandedPanel===p?null:p);});
 compareCheck.addEventListener('change',()=>setDifferenceSelection(p,compareCheck.checked));
 if(cfg.placeholder){p.status='missing';card.classList.add('analysis-placeholder');p.title.textContent='Analysis · verifying data';p.sub.textContent='RAP F000 / MRMS · planned';setNote(p,cfg.placeholderText||'Verifying analysis data not yet available');}
 else setNote(p,'Waiting for catalog…');return p;
}
function setNote(p,msg){p.note.textContent=msg;p.notice.classList.add('visible');}
function stage(p,label){p.loadingStage=label;p.stageSince=Date.now();setNote(p,label);}
function loadingErrorMessage(e){const msg=String(e?.message||e);if(/GPU layer|geometry worker|GPU timeout/i.test(msg))return msg+' Check the complete vendor/autumnplot-gl distribution, especially its worker .js files. Run vendor_dependencies.py again.';if(/HTTP 404/.test(msg))return msg+' Check that the full Zarr directory and chunk file were copied to the same directory as catalog.json.';if(/abort|timeout/i.test(msg))return msg+' Check browser Network tab for a slow or blocked chunk or worker.';return msg;}

function clearNote(p){p.notice.classList.remove('visible','error-details');
 p.notice.style.pointerEvents='none';p.notice.onclick=null;p.notice.title='';p.lastErrorDetails=null;}
// Focus one model *within the existing plotting workspace*, never the browser
// Fullscreen API. Keep every panel and its MapLibre instance alive so the
// 3x3 view and the geographic camera are restored without reloading data.
const EXPAND_ICON='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>';
const COLLAPSE_ICON='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>';
function setExpandedPanel(panel,activatePanel=true){
 if(st.expandedPanel===panel)return;
 if(panel&&!st.expandedPanel){const w=panel.view?.clientWidth||0,h=panel.view?.clientHeight||0;
  if(w>20&&h>20)panel.normalViewportSize={width:w,height:h};}
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
 // Re-apply the county zoom range after the focused panel's size changes.
 // MapLibre does not automatically reconsider a custom zoom threshold when
 // the canvas is resized without changing its numeric zoom.
 // Browser layout has to settle before resizing the WebGL surface (and wind
 // overlay). Do not ask MapLibre to render a hidden, zero-width canvas.
 requestAnimationFrame(()=>{
  for(const p of st.panels){if(p.map&&(!st.expandedPanel||st.expandedPanel===p)){
   p.map.resize();geographyZoom(p);scheduleWindRedraw(p);scheduleContourRedraw(p);
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
  if(source.error||source.id==='analysis')continue; // Valid-hour analyses are NOT forecast cycles.
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
 st.cfg=await json('config.json');
 const sets=st.cfg.modelSets||[{id:'rrfs-refs',label:'RRFS / REFS',enabled:true}];
 el.modelSetSelect.replaceChildren(...sets.map(set=>{const o=new Option(set.enabled===false?`${set.label} (coming soon)`:set.label,set.id);o.disabled=set.enabled===false;return o;}));
 el.modelSetSelect.value=st.cfg.defaultModelSet||'rrfs-refs';
 el.modelSetSelect.addEventListener('change',()=>{if(el.modelSetSelect.value!==(st.cfg.defaultModelSet||'rrfs-refs'))el.modelSetSelect.value=st.cfg.defaultModelSet||'rrfs-refs';});
 st.chunkStore=new CompressedZarrStore();void st.chunkStore.open();st.mode=(q.get('map')||st.cfg.display?.mapProjection)==='globe'?'globe':'lambert';el.mapViewSelect.value=st.mode;
 st.mapView=sharedCameraFromQuery();
 // A deep link supplies the camera for its chosen mode, but the alternate
 // projection starts independently and is remembered once it is visited.
 if(st.mapView)st.mapViews[st.mode]=st.mapView;
 let savedTheme=null;try{savedTheme=localStorage.getItem('omd_evu_theme');}catch(_){}
 const sharedTheme=q.get('theme');st.theme=(sharedTheme==='light'||sharedTheme==='dark'?sharedTheme:null)||savedTheme||st.cfg.theme||'dark';setTheme(st.theme,false);
 let savedContours='0';try{savedContours=localStorage.getItem('omd_evu_contours')||'0';}catch(_){}
 st.contours=savedContours==='1';el.contourToggleBtn.checked=st.contours;
 let savedMSLP='1';try{savedMSLP=localStorage.getItem('omd_evu_mslp_isobars')??'1';}catch(_){}
 st.overlayMSLP=savedMSLP!=='0';
 let saved850='1';try{saved850=localStorage.getItem('omd_evu_mslp_850temp')??'1';}catch(_){}
 st.overlayMSLP850=saved850!=='0';
 // Independent, persistent choices for height contours, pressure-level wind,
 // and 10-m wind; all three are enabled on first use.
 for(const [key,storage] of [['overlayHeight','omd_evu_height_overlay'],['overlayUpperWind','omd_evu_upper_wind_overlay'],['overlaySurfaceWind','omd_evu_surface_wind_overlay']]){
  let saved=null;try{saved=localStorage.getItem(storage);}catch(_){}
  st[key]=saved!=='0';
 }
 let savedControlsPosition='left';try{savedControlsPosition=localStorage.getItem('omd_evu_controls_position')||'left';}catch(_){}
 setControlsPosition(savedControlsPosition,false);
 const pcfg=st.cfg.panels||[{id:'rrfs-main',source:'rrfs',label:'RRFS'}];if(!pcfg.length||pcfg.length>20||pcfg.length>(st.cfg.layout?.maxPanels||20))throw Error('Configure 1–20 panels');
 if(new Set(pcfg.map(x=>x.id)).size!==pcfg.length)throw Error('Panel IDs must be unique');el.viewerGrid.replaceChildren();st.panels=pcfg.map(createPanel);layout();selectPanel(st.panels[0]);
 const sources=st.cfg.sources?.length?st.cfg.sources:[{id:'rrfs',label:'RRFS',catalogUrl:'data/catalog.json'}];const results=await Promise.all(sources.map(async s=>{const source={...s,url:new URL(s.catalogUrl||'data/catalog.json',document.baseURI),datasets:[]};try{const cat=await json(source.url.href);if(cat.schema!=='rrfs-zarr-viewer-1'||!Array.isArray(cat.datasets))throw Error('Catalog schema mismatch');source.catalogUpdatedAt=cat.updated_at||null;source.datasets=cat.datasets.sort((a,b)=>Date.parse(b.init_time)-Date.parse(a.init_time));}catch(e){source.error=String(e);console.warn(s.id,e);}return source;}));results.forEach(s=>st.sources.set(s.id,s));st.primary=st.sources.get(st.cfg.primarySource)||results.find(s=>s.datasets.length);
 // Separate derived analysis catalog: native analysis stays intact.
 try{const url=new URL(st.cfg.alignedAnalysisCatalogUrl||'data/catalog_aligned_analysis.json',document.baseURI);
  const reply=await fetch(url,{cache:'no-store'});if(!reply.ok)throw Error('HTTP '+reply.status);
  const cat=await reply.json();if(cat.schema!=='rrfs-zarr-viewer-1'||!Array.isArray(cat.datasets))throw Error('Invalid aligned-analysis index');
  st.alignedSource={id:'aligned_analysis',url,datasets:cat.datasets};
 }catch(err){console.info('Aligned analysis not yet published:',err);}

 st.cycles=unionCycles(results,st.cfg.primarySource||'rrfs');
 if(!st.cycles.length)throw Error('No model cycles found in any configured catalog');
 // Old shared URLs use dataset IDs (e.g. rrfs_20261008_0000). Accept those
 // as well as the new canonical UTC cycle key; no URL parameter -> latest.
 const wanted=q.get('run');st.runPinned=!!wanted;st.ref=st.cycles.find(c=>c.id===wanted||c.entries.some(x=>x.ds.id===wanted))||st.cycles[0];
 // Keep the complete, stable set of known fields selectable. The previous
 // catalog-dependent filter hid new 500-hPa and severe-weather choices until
 // their GRIB/Zarr backfill had been published, making testing impossible.
 // The field's actual per-model/per-hour availability is checked by choose(),
 // and a missing field remains an explicit missing-data panel (not a zero).
 const menu=fieldMenuEntries(),ordered=menu.map(entry=>entry.key);
 st.field=ordered.includes(q.get('field'))?q.get('field'):ordered.includes(st.cfg.defaultField)?st.cfg.defaultField:ordered[0];
 initializeFieldMenu();
 el.cycleSelect.replaceChildren(...st.cycles.map(c=>new Option(fmt(c.init_time),c.id)));
 const defaultDelay=Number(st.cfg?.display?.loopIntervalMs??850);
 st.loopSpeedIndex=LOOP_INTERVALS.reduce((best,ms,i)=>Math.abs(ms-defaultDelay)<Math.abs(LOOP_INTERVALS[best]-defaultDelay)?i:best,2);
 if(q.has('speed')){const idx=Number(q.get('speed'));if(Number.isInteger(idx)&&idx>=0&&idx<LOOP_INTERVALS.length)st.loopSpeedIndex=idx;}
 updateSpeedButtons();
 const h=Number(q.get('fhr')??st.cfg.defaultForecastHour??0);st.hour=Number.isInteger(h)&&h>=0?h:0;refreshHours();bind();syncUI();updateSharedLegend();void refreshObservationOverlay();
 ['fieldMenuBtn','fieldMenuPopup','fieldMenuCategories','fieldMenuBranch','fieldMenuBack','fieldMenuBranchTitle','fieldMenuItems','fieldMenuSelected','shareLinkStatus','cycleSelect','fcstSelect','stepBackBtn','stepForwardBtn','playBtn','pauseBtn'].forEach(id=>el[id].disabled=false);el.saveAllPngBtn.disabled=false;
 if(!('DecompressionStream' in window))throw Error('Browser does not support zlib DecompressionStream');await waitLibraries();
 // No remote maps/tiles: map style and boundary layers are locally hosted.
 // Load the first panel *before* subscribing to intersection events. On
 // mobile the document scrolls (not viewerGrid), so observe the viewport.
 // All additional map startups are queued rather than competing for WebGL
 // contexts and evicting a map whose CSP worker is still starting.
 const first=st.panels.find(p=>!p.cfg.placeholder);
 if(first)activate(first,'startup').catch(err=>fail(first,err));
 st.observer=new IntersectionObserver(entries=>{
  if(st.rendering)return;
  for(const e of entries)if(e.isIntersecting&&e.intersectionRatio>.04){
   const p=st.panels.find(p=>p.card===e.target);
   if(p&&!p.map&&!p.cfg.placeholder)activate(p,'viewport').catch(err=>fail(p,err));
  }
 },{root:innerWidth<=800?null:el.viewerGrid,rootMargin:'80px'});
 st.panels.filter(p=>!p.cfg.placeholder).forEach(p=>st.observer.observe(p.card));
 // A map request queued while scrolling might be dropped once it finally gets
 // its initialization turn. Recheck currently visible panels after scrolling
 // stops, even if IntersectionObserver does not fire a second enter event.
 let visibilityRefresh=null;
 const scanVisible=()=>{
  clearTimeout(visibilityRefresh);
  visibilityRefresh=setTimeout(()=>{
   if(st.rendering||st.exporting)return;
   for(const p of st.panels)if(!p.cfg.placeholder&&!p.map&&!p.activation&&nearViewport(p))
    activate(p,'viewport').catch(err=>fail(p,err));
  },260);
 };
 window.addEventListener('scroll',scanVisible,{passive:true});
 window.addEventListener('resize',scanVisible,{passive:true});
 updateStatus();schedulePrefetch();
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
// Accessible single-button field selector. A body-level popup avoids clipping
// when the desktop controls are oriented vertically. Groups and fields are
// constructed from the complete stable menu, independent of current catalogs.
const fieldMenuUI={open:false,activeGroup:null,hoverTimer:null};
const fieldMenuIsCompact=()=>window.matchMedia('(max-width:800px), (pointer:coarse)').matches;
function initializeFieldMenu(){
 const categories=FIELD_MENU_GROUPS.map(group=>{
  const button=document.createElement('button');button.type='button';button.className='field-menu-category';
  button.setAttribute('role','menuitem');button.setAttribute('aria-haspopup','menu');
  button.setAttribute('aria-expanded','false');button.dataset.group=group.key;
  const label=document.createElement('span');label.textContent=group.label;
  const arrow=document.createElement('span');arrow.className='field-menu-chevron';arrow.setAttribute('aria-hidden','true');arrow.textContent='›';
  button.append(label,arrow);
  button.addEventListener('click',()=>openFieldMenuBranch(group.key,true));
  button.addEventListener('pointerenter',event=>{
   if(fieldMenuUI.open&&!fieldMenuIsCompact()&&event.pointerType==='mouse'){
    clearTimeout(fieldMenuUI.hoverTimer);
    fieldMenuUI.hoverTimer=setTimeout(()=>openFieldMenuBranch(group.key,false),65);
   }
  });
  button.addEventListener('pointerleave',()=>clearTimeout(fieldMenuUI.hoverTimer));
  return button;
 });
 el.fieldMenuCategories.replaceChildren(...categories);
 el.fieldMenuBack.onclick=()=>{
  if(!fieldMenuUI.open)return;
  const currentGroup=fieldMenuUI.activeGroup;
  clearFieldMenuBranch();
  (el.fieldMenuCategories.querySelector('.field-menu-category[data-group="'+(currentGroup||fieldGroupFor(st.field)?.key||'radar')+'"]')||categories[0])?.focus();
 };
 el.fieldMenuBtn.addEventListener('click',()=>fieldMenuUI.open?closeFieldMenu():openFieldMenu());
 el.fieldMenuBtn.addEventListener('keydown',event=>{
  if(['ArrowDown','Enter',' '].includes(event.key)&&!fieldMenuUI.open){event.preventDefault();openFieldMenu();}
  else if(event.key==='Escape'&&fieldMenuUI.open){event.preventDefault();closeFieldMenu(true);}
 });
 el.fieldMenuPopup.addEventListener('keydown',onFieldMenuKeydown);
 document.addEventListener('pointerdown',event=>{
  if(fieldMenuUI.open&&!el.fieldMenuPopup.contains(event.target)&&!el.fieldMenuBtn.contains(event.target))closeFieldMenu();
 });
 document.addEventListener('focusin',event=>{
  if(fieldMenuUI.open&&!el.fieldMenuPopup.contains(event.target)&&event.target!==el.fieldMenuBtn)closeFieldMenu();
 });
 el.fieldMenuPopup.addEventListener('pointerleave',()=>clearTimeout(fieldMenuUI.hoverTimer));
 window.addEventListener('resize',()=>{if(fieldMenuUI.open)positionFieldMenu();});
 window.addEventListener('scroll',()=>{if(fieldMenuUI.open)positionFieldMenu();},true);
 const initialGroup=fieldGroupFor(st.field);if(initialGroup)st.lastFieldByGroup.set(initialGroup.key,st.field);
 syncFieldMenus();
}
function clearFieldMenuBranch(){
 fieldMenuUI.activeGroup=null;
 el.fieldMenuBranch.hidden=true;
 el.fieldMenuPopup.classList.remove('is-drilled');
 el.fieldMenuCategories.querySelectorAll('.field-menu-category').forEach(button=>{
  button.setAttribute('aria-expanded','false');button.classList.remove('is-active');
 });
}
function openFieldMenuBranch(groupKey,focusField=false){
 const group=FIELD_MENU_GROUPS.find(g=>g.key===groupKey);
 if(!group||!fieldMenuUI.open)return;
 fieldMenuUI.activeGroup=group.key;
 el.fieldMenuBranch.hidden=false;
 el.fieldMenuBranchTitle.textContent=group.label;
 el.fieldMenuBranch.setAttribute('aria-label',group.label+' fields');
 el.fieldMenuItems.replaceChildren(...group.fields.map(field=>{
  const item=document.createElement('button');item.type='button';item.className='field-menu-item';
  item.setAttribute('role','menuitemradio');item.setAttribute('aria-checked',String(field.key===st.field));
  item.dataset.field=field.key;
  const label=document.createElement('span');label.textContent=field.label;
  const check=document.createElement('span');check.className='field-menu-check';check.setAttribute('aria-hidden','true');check.textContent=field.key===st.field?'✓':'';
  item.append(label,check);
  item.addEventListener('click',()=>chooseFieldMenuField(group.key,field.key));
  return item;
 }));
 el.fieldMenuCategories.querySelectorAll('.field-menu-category').forEach(button=>{
  const active=button.dataset.group===group.key;button.setAttribute('aria-expanded',String(active));button.classList.toggle('is-active',active);
 });
 el.fieldMenuPopup.classList.toggle('is-drilled',fieldMenuIsCompact());
 positionFieldMenu();
 if(focusField){
  const recent=st.lastFieldByGroup.get(group.key);
  const choice=(recent&&group.fields.some(f=>f.key===recent)?Array.from(el.fieldMenuItems.querySelectorAll('.field-menu-item')).find(item=>item.dataset.field===recent):null)||el.fieldMenuItems.querySelector('.field-menu-item[aria-checked="true"]')||el.fieldMenuItems.querySelector('.field-menu-item');
  choice?.focus();
 }
}
function positionFieldMenu(){
 if(!fieldMenuUI.open)return;
 const compact=fieldMenuIsCompact(),r=el.fieldMenuBtn.getBoundingClientRect();
 const width=compact?Math.min(350,window.innerWidth-16):244;
 const x=Math.min(Math.max(8,r.left),window.innerWidth-width-8);
 const height=el.fieldMenuPopup.getBoundingClientRect().height||320;
 const y=Math.min(Math.max(8,r.bottom+5),Math.max(8,window.innerHeight-height-8));
 el.fieldMenuPopup.style.left=x+'px';el.fieldMenuPopup.style.top=y+'px';
 el.fieldMenuPopup.style.width=width+'px';
 const branchWidth=298;
 el.fieldMenuPopup.dataset.branchSide=x+width+branchWidth+8>window.innerWidth&&x>=branchWidth+8?'left':'right';
}
function openFieldMenu(){
 if(!FIELD_MENU_GROUPS.length)return;
 fieldMenuUI.open=true;
 el.fieldMenuPopup.hidden=false;el.fieldMenuBtn.setAttribute('aria-expanded','true');
 clearFieldMenuBranch();positionFieldMenu();
 const group=fieldGroupFor(st.field);
 const button=el.fieldMenuCategories.querySelector('.field-menu-category[data-group="'+(group?.key||'radar')+'"]')||el.fieldMenuCategories.querySelector('button');
 button?.focus();
}
function closeFieldMenu(focusButton=false){
 clearTimeout(fieldMenuUI.hoverTimer);
 fieldMenuUI.open=false;clearFieldMenuBranch();el.fieldMenuPopup.hidden=true;
 el.fieldMenuBtn.setAttribute('aria-expanded','false');
 if(focusButton)el.fieldMenuBtn.focus();
}
function chooseFieldMenuField(groupKey,fieldKey){
 if(!FIELD_MENU_GROUPS.some(g=>g.key===groupKey&&g.fields.some(f=>f.key===fieldKey)))return;
 closeLegendRangeEditor();
 st.field=fieldKey;st.lastFieldByGroup.set(groupKey,fieldKey);
 closeFieldMenu(true);refreshHours();syncUI();updateSharedLegend();renderAll();
}
function fieldMenuFocusable(){
 if(fieldMenuUI.activeGroup&&el.fieldMenuBranch&&!el.fieldMenuBranch.hidden){
  const buttons=Array.from(el.fieldMenuItems.querySelectorAll('.field-menu-item'));
  return fieldMenuIsCompact()?[el.fieldMenuBack,...buttons]:buttons;
 }
 return Array.from(el.fieldMenuCategories.querySelectorAll('.field-menu-category'));
}
function onFieldMenuKeydown(event){
 if(!fieldMenuUI.open)return;
 const key=event.key,buttons=fieldMenuFocusable();
 if(key==='Escape'){event.preventDefault();closeFieldMenu(true);return;}
 if(key==='ArrowLeft'||key==='Backspace'){
  if(fieldMenuUI.activeGroup){event.preventDefault();const group=fieldMenuUI.activeGroup;clearFieldMenuBranch();
   el.fieldMenuCategories.querySelector('.field-menu-category[data-group="'+group+'"]')?.focus();}
  return;
 }
 if(key==='ArrowRight'&&!fieldMenuUI.activeGroup){event.preventDefault();
  openFieldMenuBranch(document.activeElement?.dataset?.group||fieldGroupFor(st.field)?.key,true);return;}
 if(!['ArrowDown','ArrowUp','Home','End'].includes(key))return;
 event.preventDefault();
 if(!buttons.length)return;
 const i=buttons.indexOf(document.activeElement);
 const index=key==='Home'?0:key==='End'?buttons.length-1:key==='ArrowDown'?(i+1)%buttons.length:(i+buttons.length-1)%buttons.length;
 buttons[index].focus();
}
function syncFieldMenus(){
 const group=fieldGroupFor(st.field),field=group?.fields.find(x=>x.key===st.field);
 el.fieldMenuSelected.textContent=field?.label||FIELDS[st.field]?.label||'Choose field';
 el.fieldMenuBtn.title=(group?.label?group.label+' · ':'')+el.fieldMenuSelected.textContent;
 if(fieldMenuUI.open&&fieldMenuUI.activeGroup){
  el.fieldMenuItems.querySelectorAll('.field-menu-item').forEach(item=>{
   const selected=item.dataset.field===st.field;item.setAttribute('aria-checked',String(selected));
   item.querySelector('.field-menu-check').textContent=selected?'✓':'';
  });
 }
}
function timelineVariables(){
 if(!st.ref||!st.field)return [];
 return st.ref.entries.map(({ds})=>(ds.variables||[]).find(v=>v.name===(st.field==='refc_ptype'?'refc':snowAccumulationHours(st.field)?'asnow':precipitationAccumulationHours(st.field)?'apcp':st.field))).filter(Boolean);
}
// Virtual fields must use their actual stored inputs. In particular, there is
// no Zarr variable named refc_ptype; treating it as native made the hour menu
// say "missing" and skipped every hour when the arrow keys were pressed.
function availableHours(){
 if(!st.ref||!st.field)return [];
 const field=st.field,window=snowAccumulationHours(field)||precipitationAccumulationHours(field);
 const available=new Set();
 for(const {ds} of st.ref.entries){
  const nativeName=field==='refc_ptype'?'refc':snowAccumulationHours(field)?'asnow':precipitationAccumulationHours(field)?'apcp':field;
  const v=ds.variables?.find(x=>x.name===nativeName);
  if(!v)continue;
  const hours=new Set(v.available_hours||[]);
  const ptype=field==='refc_ptype'?ds.variables?.find(x=>x.name==='ptype'):null;
  const ptypeHours=new Set(ptype?.available_hours||[]);
  for(const h of hours){
   if(field==='refc_ptype'&&(!ptypeHours.has(h)||ptype.shape?.[1]!==v.shape?.[1]||ptype.shape?.[2]!==v.shape?.[2]))continue;
   if(window&&(h<window||(h>window&&!hours.has(h-window))))continue;
   available.add(h);
  }
 }
 return [...available].sort((a,b)=>a-b);
}
function refreshHours(){const vars=timelineVariables(),hours=Math.max(1,...vars.map(v=>v.shape?.[0]||0),...st.ref.entries.flatMap(({ds})=>(ds.variables||[]).map(v=>v.shape?.[0]||0)));const available=new Set(availableHours());el.fcstSelect.replaceChildren(...Array.from({length:hours},(_,i)=>new Option(`F${pad3(i)}${available.has(i)?'':' · missing'}`,i)));st.hour=Math.max(0,Math.min(hours-1,st.hour));}
function syncUI(){
 updateContourControl();
 syncFieldMenus();el.cycleSelect.value=st.ref.id;el.fcstSelect.value=String(st.hour);el.mapViewSelect.value=st.mode;
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
function bind(){
 bindDifferenceControls();
 bindLegendRangeControls();
 // Deliberate input, rather than passive mouse movement, reduces speculation.
 for(const type of ['pointerdown','wheel','keydown','touchstart'])document.addEventListener(type,markUserActivity,{passive:true});el.mobileControlsBtn.onclick=()=>{const opened=el.mobileControlsBtn.getAttribute('aria-expanded')!=='true';el.mobileControlsBtn.setAttribute('aria-expanded',String(opened));el.mobileControlsBtn.title=opened?'Hide viewer controls':'Show viewer controls';el.mobileControlsBtn.innerHTML=opened?'☷ Controls <span class="collapse-indicator" aria-hidden="true">▴</span>':'☷ Controls <span class="collapse-indicator" aria-hidden="true">▾</span>';document.getElementById('viewerControls').classList.toggle('is-open',opened);requestAnimationFrame(layout);};el.cycleSelect.onchange=()=>{st.runPinned=true;st.ref=st.cycles.find(x=>x.id===el.cycleSelect.value)||st.ref;refreshHours();syncUI();renderAll();};el.fcstSelect.onchange=()=>{const next=Number(el.fcstSelect.value);if(next!==st.hour)st.prefetchDirection=next<st.hour?-1:1;st.hour=next;syncUI();renderAll();};el.stepBackBtn.onclick=()=>step(-1);el.stepForwardBtn.onclick=()=>step(1);el.playBtn.onclick=play;el.pauseBtn.onclick=stop;el.speedDownBtn.onclick=()=>changeSpeed(-1);el.speedUpBtn.onclick=()=>changeSpeed(1);
 for(const [source,input] of [['synoptic',el.obsSynoptic],['mping',el.obsMping]]){
  let stored=null;try{stored=localStorage.getItem('omd_evu_obs_'+source);}catch(_){}
  st.obsEnabled[source]=stored!=='0';input.checked=st.obsEnabled[source];
  input.onchange=()=>{st.obsEnabled[source]=input.checked;
   try{localStorage.setItem('omd_evu_obs_'+source,input.checked?'1':'0');}catch(_){}
   syncAllObservationPanels();};
 }
 let opacitySaved=null;try{opacitySaved=localStorage.getItem('omd_evu_image_opacity');}catch(_){}
 st.imageOpacity=opacitySaved===null?1:Math.max(0,Math.min(1,Number(opacitySaved)||0));
 el.imageOpacity.value=String(Math.round(st.imageOpacity*100));el.imageOpacityLabel.textContent=`${Math.round(st.imageOpacity*100)}%`;
 el.imageOpacity.addEventListener('input',()=>{el.imageOpacityLabel.textContent=`${el.imageOpacity.value}%`;if(st.difference.liveCanvas)st.difference.liveCanvas.style.opacity=String(Number(el.imageOpacity.value)/100);});
 el.imageOpacity.addEventListener('change',()=>{
  st.imageOpacity=Math.max(0,Math.min(1,Number(el.imageOpacity.value)/100));
  try{localStorage.setItem('omd_evu_image_opacity',String(st.imageOpacity));}catch(_){}
  for(const p of st.panels)p.lastKey=null;void renderAll();
 });
 let spcSaved=null;try{spcSaved=localStorage.getItem('omd_evu_spc_overlay');}catch(_){}
 st.spcEnabled=spcSaved==='1';el.spcToggleBtn.checked=st.spcEnabled;
 el.spcToggleBtn.addEventListener('change',()=>{
  st.spcEnabled=el.spcToggleBtn.checked;try{localStorage.setItem('omd_evu_spc_overlay',st.spcEnabled?'1':'0');}catch(_){}
  void refreshSPCReports();
 });
 for(const id of ['userGuideClose','userGuideDone'])el[id].onclick=()=>el.userGuideDialog.close();
 el.userGuideBtn.onclick=()=>el.userGuideDialog.showModal();
 el.userGuideDialog.addEventListener('click',event=>{if(event.target===el.userGuideDialog)el.userGuideDialog.close();});
 el.mapViewSelect.onchange=()=>switchProjection(el.mapViewSelect.value);
 el.contourToggleBtn.onchange=()=>{
  const mslp=st.field==='mslp';
  if(mslp){st.overlayMSLP=el.contourToggleBtn.checked;try{localStorage.setItem('omd_evu_mslp_isobars',st.overlayMSLP?'1':'0');}catch(_){}}
  else{st.contours=el.contourToggleBtn.checked;try{localStorage.setItem('omd_evu_contours',st.contours?'1':'0');}catch(_){}}
  for(const p of st.panels){updatePanelPlotTitle(p);scheduleContourRedraw(p);}
 };
 el.mslp850ToggleBtn.onchange=()=>{
  st.overlayMSLP850=el.mslp850ToggleBtn.checked;
  try{localStorage.setItem('omd_evu_mslp_850temp',st.overlayMSLP850?'1':'0');}catch(_){}
  for(const panel of st.panels){
   if(st.overlayMSLP850&&panel.status==='ready'&&!panel.temperature850Field)void prepareMSLP850Contours(panel,panel.ds,panel.h,st.seq).then(()=>{updatePanelPlotTitle(panel);scheduleContourRedraw(panel);});
   else{updatePanelPlotTitle(panel);scheduleContourRedraw(panel);}
  }
 };
 el.heightToggleBtn.onchange=()=>{
  st.overlayHeight=el.heightToggleBtn.checked;
  try{localStorage.setItem('omd_evu_height_overlay',st.overlayHeight?'1':'0');}catch(_){}
  for(const p of st.panels){updatePanelPlotTitle(p);scheduleContourRedraw(p);}
 };
 el.windToggleBtn.onchange=()=>{
  const upper=Boolean(heightVariableName(st.field));
  const key=upper?'overlayUpperWind':'overlaySurfaceWind';
  const storage=upper?'omd_evu_upper_wind_overlay':'omd_evu_surface_wind_overlay';
  st[key]=el.windToggleBtn.checked;
  try{localStorage.setItem(storage,st[key]?'1':'0');}catch(_){}
  for(const p of st.panels){updatePanelPlotTitle(p);scheduleWindRedraw(p);}
 };
 // A select retains keyboard focus after its menu closes. Return arrow keys
 // to forecast navigation after an actual selection (mouse or keyboard).
 for(const sel of [el.cycleSelect,el.fcstSelect,el.mapViewSelect]){
  sel.addEventListener('change',()=>requestAnimationFrame(()=>{if(document.activeElement===sel)sel.blur();}));
 }el.resetViewBtn.onclick=()=>switchProjection(st.mode,{reset:true});el.themeToggleBtn.onclick=()=>setTheme(st.theme==='dark'?'light':'dark',true);el.controlsPositionBtn.onclick=()=>setControlsPosition(document.documentElement.dataset.controlsPosition==='left'?'top':'left',true);
 let shareTimer=null;
 const shareToast=$('shareLinkToast');
 function shareFeedback(kind,message){
  clearTimeout(shareTimer);
  el.copyLinkBtn.classList.toggle('is-copied',kind==='success');
  el.copyLinkBtn.title=message;
  el.copyLinkBtn.setAttribute('aria-label',message);
  el.shareLinkStatus.textContent=message;
  if(shareToast){
   shareToast.textContent=kind==='success'?'✓ '+message:message;
   shareToast.dataset.kind=kind;
   shareToast.hidden=false;
   // Position against the icon, regardless of top / left toolbar orientation.
   const btn=el.copyLinkBtn.getBoundingClientRect();
   const panel=shareToast.getBoundingClientRect();
   const x=Math.max(8,Math.min(innerWidth-panel.width-8,btn.right-panel.width));
   const below=btn.bottom+8;
   const y=below+panel.height+8<=innerHeight?below:Math.max(8,btn.top-panel.height-8);
   shareToast.style.left=Math.round(x)+'px';shareToast.style.top=Math.round(y)+'px';
  }
  shareTimer=setTimeout(()=>{
   if(shareToast)shareToast.hidden=true;
   el.copyLinkBtn.classList.remove('is-copied');
   el.copyLinkBtn.title='Copy share link';
   el.copyLinkBtn.setAttribute('aria-label','Copy share link');
   el.shareLinkStatus.textContent='';
  },kind==='success'?2400:4000);
 }
 el.copyLinkBtn.onclick=async()=>{
  const url=shareUrl();
  try{
   if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(url);
   else{ // Fallback for non-secure intranet origins without Clipboard API.
    const input=document.createElement('textarea');input.value=url;input.readOnly=true;
    input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);
    input.select();const ok=document.execCommand('copy');input.remove();
    if(!ok)throw Error('Browser copy command was not successful');
   }
   shareFeedback('success','Link copied');
  }catch(err){console.warn('Could not copy share link:',err);
   shareFeedback('error','Unable to copy link — check clipboard permissions');
  }
 };
 el.saveAllPngBtn.onclick=e=>openExportDialog('all',null,e);
 el.exportCloseBtn.onclick=el.exportCancelBtn.onclick=()=>{if(!st.exporting)el.exportDialog.close();};
 el.exportDialog.addEventListener('cancel',e=>{if(st.exporting)e.preventDefault();});
 // The GIF range and delay selectors always describe the active forecast cycle.
 el.exportForm.querySelectorAll('input[name="exportKind"]').forEach(r=>r.addEventListener('change',syncGifExportControls));
 for(const id of ['exportGifStart','exportGifEnd','exportGifStep','exportGifDelay','exportGifQuality']){
  el[id].addEventListener('input',()=>{
   if(id==='exportGifStart'||id==='exportGifEnd')st.gifCustomRange=true;
   if(id==='exportGifQuality'&&!st.gifCustomRange)resetDefaultGifRange();
   syncGifExportControls();
  });
 }
 el.exportForm.addEventListener('submit',async e=>{
  e.preventDefault();if(st.exporting||!st.exportSelection)return;
  const ratio=el.exportForm.querySelector('input[name="exportRatio"]:checked')?.value||'16:9';
  const framing=el.exportForm.querySelector('input[name="exportFraming"]:checked')?.value||'fill';st.lastExportFraming=framing;
  const kind=el.exportForm.querySelector('input[name="exportKind"]:checked')?.value||'png';
  try{localStorage.setItem('omd_evu_export_framing',framing);}catch(_){}
  st.exportLargeLabels=!!el.exportLargeLabels.checked;
  st.lastExportRatio=ratio;
  try{localStorage.setItem('omd_evu_export_ratio',ratio);}catch(_){}
  st.exporting=true;el.exportConfirmBtn.disabled=true;el.exportCancelBtn.disabled=true;el.exportCloseBtn.disabled=true;
  el.exportConfirmBtn.textContent='Preparing…';el.exportBusyStatus.textContent='Rendering export at higher map resolution…';
  try{
   if(kind==='gif'){await exportAnimationGif(st.exportSelection,ratio,framing);el.exportDialog.close();}
   else if(st.exportSelection.type==='all'){
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
   }else if(st.exportSelection.type==='difference'){
    el.exportBusyStatus.textContent='Rendering difference map and matching geographic outlines…';
    await exportDifferencePNG(ratio,framing);
   }else await exportPanel(st.exportSelection.panel,ratio);
   el.exportDialog.close();}
  catch(err){console.error('PNG export failed',err);el.exportBusyStatus.textContent='Export failed: '+String(err?.message||err);}
  finally{st.exporting=false;el.exportConfirmBtn.disabled=false;el.exportCancelBtn.disabled=false;el.exportCloseBtn.disabled=false;syncGifExportControls();}
 });
 window.addEventListener('resize',()=>{syncHelperPlacement();layout();if(st.expandedPanel&&st.expandedPanel.map)geographyZoom(st.expandedPanel);});window.addEventListener('keydown',e=>{if(el.differenceDialog.open||el.exportDialog.open)return;if(fieldMenuUI.open||document.activeElement===el.fieldMenuBtn||el.fieldMenuPopup.contains(document.activeElement))return;if(e.key==='Escape'&&st.difference.open){closeDifferenceWindow();return;}if(document.activeElement?.isContentEditable||document.activeElement?.tagName==='TEXTAREA'||(document.activeElement?.tagName==='SELECT'&&!['ArrowLeft','ArrowRight'].includes(e.key))||(document.activeElement?.tagName==='INPUT'&&!['checkbox','button'].includes(document.activeElement.type)))return;if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);if(e.key===' '){e.preventDefault();st.playing?stop():play();}if(e.key==='ArrowUp'||e.key==='ArrowDown'){const a=st.cycles,idx=a.indexOf(st.ref)+(e.key==='ArrowUp'?-1:1);if(a[idx]){st.runPinned=true;st.ref=a[idx];refreshHours();syncUI();renderAll();}}},true);}
// Keep one live helper/status strip; moving the DOM node preserves its
// status text and avoids diverging counters or duplicate live regions.
function syncHelperPlacement(){
 const helper=document.querySelector('body > .helper, header.toolbar > .helper');
 const toolbar=document.querySelector('header.toolbar');
 if(!helper||!toolbar)return;
 const sidebar=document.documentElement.dataset.controlsPosition==='left'&&window.matchMedia('(min-width:801px)').matches;
 if(sidebar){if(helper.parentElement!==toolbar)toolbar.appendChild(helper);}
 else if(helper.previousElementSibling!==toolbar||helper.parentElement!==document.body){toolbar.after(helper);}
}
const CONTROLS_LEFT_ICON='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>';
const CONTROLS_TOP_ICON='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>';
function setControlsPosition(requested,persist=false){
 const position=requested==='left'?'left':'top';
 document.documentElement.dataset.controlsPosition=position;
 syncHelperPlacement();
 // The icon shows the destination, like the dark/light theme toggle.
 el.controlsPositionBtn.innerHTML=position==='left'?CONTROLS_TOP_ICON:CONTROLS_LEFT_ICON;
 const action=position==='left'?'top':'left';
 el.controlsPositionBtn.title=`Move controls to ${action==='top'?'top':'left side'}`;
 el.controlsPositionBtn.setAttribute('aria-label',el.controlsPositionBtn.title);
 el.controlsPositionBtn.setAttribute('aria-pressed',String(position==='left'));
 if(persist){try{localStorage.setItem('omd_evu_controls_position',position);}catch(_){}}
 // Wait for CSS Grid to recalculate the plotting workspace before resizing
 // MapLibre canvases; keep all active panels/cameras intact.
 if(st.panels.length)requestAnimationFrame(()=>{
  layout();requestAnimationFrame(()=>{
   layout();for(const p of st.panels)if(p.map&&(!st.expandedPanel||st.expandedPanel===p)){scheduleWindRedraw(p);scheduleContourRedraw(p);}
  });
 });
}
function setTheme(theme,save){
 st.theme=theme;document.documentElement.dataset.theme=theme;
 el.themeToggleBtn.innerHTML=theme==='dark'?'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>':'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 15.3A8.5 8.5 0 0 1 8.7 3.6 8.5 8.5 0 1 0 20.4 15.3Z"/></svg>';
 el.themeToggleBtn.setAttribute('aria-label',`Switch to ${theme==='dark'?'light':'dark'} mode`);
 el.themeToggleBtn.title=`Switch to ${theme==='dark'?'light':'dark'} mode`;
 if(save)try{localStorage.setItem('omd_evu_theme',theme);}catch(e){}
 for(const p of st.active||[]){scheduleWindRedraw(p);scheduleContourRedraw(p);}
 const c=themeColors();
 // Change paint properties IN PLACE: a full map.setStyle() destroys custom APGL layers.
 for(const p of [...st.active,...(st.difference.open&&st.difference.map?[{map:st.difference.map}]:[])]){const m=p.map;if(!m||!m.setPaintProperty)continue;
   for(const [id,property,value] of [
    ['background','background-color',c.ocean],['land-fill','fill-color',c.land],
    ['land-detail-mask','fill-color',c.ocean],['land-detail-fill','fill-color',c.land],['lakes-detail-fill','fill-color',c.ocean],
    ['coast','line-color',c.line],['coast-detail','line-color',c.line],['country','line-color',c.line],['country-detail','line-color',c.line],
    ['states','line-color',c.minor],['counties','line-color',c.minor],
    ['evu-observed-metar','circle-stroke-color',theme==='light'?'#152633':'#ffffff'],
    ['evu-spc-lsr','circle-stroke-color',theme==='light'?'#152633':'#ffffff']]){
    try{if(m.getLayer(id))m.setPaintProperty(id,property,value);}catch(err){console.warn('Theme paint update',id,err);}
   }
   if(m.getLayer?.('evu-observed-mping'))refreshMpingTriangleTheme(m);
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
  const source=current.getSource?.(key);if(source?.setData){source.setData(data);p.geoApplied.add(key);updateGeographyVisibility(p);if(p===st.difference.geo)scheduleDifferenceLiveRender();}
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
 if(m.getLayer('counties'))m.setLayerZoomRange('counties',countyThreshold(p),24);
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
 // Warm the shared GeoJSON cache before the layer becomes visible, so county
 // lines can appear promptly once the configured threshold is crossed.
 const lead=Math.max(0,Math.min(1,Number(d.countyPreloadLeadZoom??0.35)||0));
 if(m&&d.showCountiesOnZoom!==false&&m.getZoom()>=countyThreshold(p)-lead)void installGeo(p,'counties');
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

// Report what the browser actually loaded, not just what WCOSS2/RZDM
// publication tools inspected. This is essential for stale/misrouted catalogs.
function nohrscCatalogDetail(source,product,validTime,field){
 const datasets=source?.datasets||[];
 const snow=datasets.filter(d=>d.product==='nohrsc_6h'||d.product==='nohrsc_24h');
 const exact=datasets.filter(d=>d.product===product&&cycleKey(d.init_time)===cycleKey(validTime));
 const hasField=exact.some(d=>d.variables?.some(v=>v.name===field&&v.available_hours?.includes(0)));
 const updated=source?.catalogUpdatedAt||'not supplied';
 const url=source?.url?.href||source?.url||'unknown';
 return `Browser catalog: ${snow.length} NOHRSC datasets, updated ${updated}; target ${product} at ${fmt(validTime)}: ${exact.length} record(s), usable ${field}: ${hasField?'yes':'no'}. URL: ${url}. Run nohrsc_diagnostics.html for details`;
}
function choose(p,hourOverride=st.hour){const src=st.sources.get(p.cfg.source||st.primary.id);p.src=src;if(!src)return{error:`Unknown source ${p.cfg.source}`};if(src.error)return{error:src.error};let ds;const mode=p.cfg.run||'selected',list=src.datasets;
 const field=p.cfg.field||st.field;
 const precipitationWindow=precipitationAccumulationHours(field);
 const snowWindow=snowAccumulationHours(field);
 // Verification datasets are valid-time analyses, not a forecast cycle. Match
 // exactly, and never imply that NOHRSC has an independent 1- or 3-h product.
 if(p.cfg.timeMode==='analysis'){
  if(field==='refc_ptype')return{error:'Reflectivity with precipitation type requires model reflectivity and model precipitation-type fields; no matching analysis Ptype is available',ds:null};
  if((field==='snow1h'||field==='snow3h'))return{error:`No independent ${snowWindow}-hour snowfall analysis is available (NOHRSC starts at 6 hours)`,ds:null};
  // Cycle-to-date observed snowfall is reconstructed from adjacent NOHRSC 6-h
  // analyses, not from a nonexistent native NOHRSC ASNOW product.
  const nohrscRunningSnow=field==='asnow';
  if(nohrscRunningSnow&&hourOverride<6)return{error:'NOHRSC running snowfall begins at F006 (F000 is the accumulation starting point)',ds:null};
  const vt=valid(st.ref,hourOverride);
  if(precipitationWindow && hourOverride<precipitationWindow)
   return{error:`${precipitationWindow}-hour precipitation analysis needs forecast lead F${pad3(precipitationWindow)} or later`,ds:null};
  if(snowWindow===48&&hourOverride<48)
   return{error:'48-hour snowfall analysis needs forecast lead F048 or later',ds:null};
  if((snowWindow||nohrscRunningSnow)&&(vt.getUTCHours()%6||(snowWindow>6&&vt.getUTCHours()%12)))
   return{error:`NOHRSC ${snowWindow}-hour snowfall analysis valid only at ${snowWindow===6?'00/06/12/18':'00/12'} UTC`,ds:null};
  const requested=nohrscRunningSnow?'snow6h':field==='snowc'?'snowpresence':precipitationWindow?'apcp':field==='snow48h'?'snow24h':field;
  const wanted=vt.toISOString();
  const candidates=list.filter(d=>cycleKey(d.init_time)===wanted&&d.variables?.some(v=>v.name===requested&&v.available_hours?.includes(0))&&(!precipitationWindow||d.product==='mrms_apcp')&&(!nohrscRunningSnow||d.product==='nohrsc_6h'));
  const analysisRank=d=>d.product==='urma'?0:d.product==='rtma'?1:2;
  ds=candidates.sort((a,b)=>analysisRank(a)-analysisRank(b))[0];
  if(snowWindow===48){
   if(!ds||ds.product!=='nohrsc_24h')return{error:`NOHRSC 48-hour snowfall needs 24-hour analysis ending at ${fmt(vt)}`,ds:null};
   const previous=nohrsc24hRecord(src,new Date(vt.getTime()-24*3600000));
   if(!previous)return{error:`NOHRSC 48-hour snowfall needs preceding 24-hour analysis ending at ${fmt(new Date(vt.getTime()-24*3600000))}`,ds:null};
  }
  if(nohrscRunningSnow&&ds){
   const missing=missingNohrscRunningHours(src,st.ref,hourOverride);
   if(missing.length)return{error:`NOHRSC running snowfall unavailable: ${missing.length} missing 6-hour analyses since initialization; first ${missing[0]}`,ds:null};
  }
  if(precipitationWindow&&ds){
   const missing=missingMrmsIntervalHours(src,st.ref,hourOverride,precipitationWindow);
   if(missing.length)return{error:`MRMS ${precipitationWindow}-hour precipitation unavailable: ${missing.length} missing hourly QPE input(s); first ${missing[0]}`,ds:null};
  }
  if(field==='apcp'&&ds?.product==='mrms_apcp'&&hourOverride>0){
   const missing=missingMrmsHours(src,st.ref,hourOverride);
   if(missing.length)return{error:`MRMS running total unavailable: missing ${missing.length} 1-hour QPE input(s); first ${missing[0]}`,ds:null};
  }
  if(!ds)return{error:(snowWindow||nohrscRunningSnow)?`NOHRSC ${nohrscRunningSnow?'6-hour input for running':snowWindow+'-hour'} snowfall missing from browser analysis catalog for ${fmt(wanted)}. ${nohrscCatalogDetail(src,nohrscRunningSnow||snowWindow===6?'nohrsc_6h':'nohrsc_24h',wanted,requested)}`:`Analysis unavailable for ${fmt(wanted)} (${FIELDS[field]?.label||field}); source latency or no verifier`,ds:null};
  return{ds,v:ds.variables.find(v=>v.name===requested),h:0};
 }
 if(mode==='latest')ds=list[0];else if(mode==='nearest')ds=list.slice().sort((a,b)=>Math.abs(Date.parse(a.init_time)-Date.parse(st.ref.init_time))-Math.abs(Date.parse(b.init_time)-Date.parse(st.ref.init_time)))[0];else if(mode==='selected')ds=list.find(d=>cycleKey(d.init_time)===st.ref.id);else ds=list.find(d=>d.id===mode);
 if(!ds)return{error:`No matching cycle for ${fmt(st.ref.init_time)}`};if(p.cfg.runOffset){ds=list[list.indexOf(ds)+Number(p.cfg.runOffset)];if(!ds)return{error:'Cycle offset unavailable'};}
 const storedName=field==='refc_ptype'?'refc':snowWindow?'asnow':precipitationWindow?'apcp':field;
 const v=ds.variables.find(x=>x.name===storedName);
 if(!v)return{error:`${FIELDS[field]?.label||field} not in ${ds.model||src.id} catalog (field not yet processed or not provided by model)`,ds};
 if(field==='refc_ptype'&&!ds.variables.some(x=>x.name==='ptype'))return{error:`${ds.model||src.id} lacks precipitation type required for reflectivity shading`,ds:null};
 let h=hourOverride+Number(p.cfg.forecastHourOffset||0);
 if(p.cfg.timeMode==='valid')h=Math.round((valid(st.ref,hourOverride)-Date.parse(ds.init_time))/3600000)+Number(p.cfg.forecastHourOffset||0);
 const window=snowWindow||precipitationWindow;
 if(window && (h<window || (h>window&&!v.available_hours.includes(h-window))))
  return{error:`${window}-hour ${snowWindow?'snowfall':'precipitation'} requires F${pad3(h)} and ${h>window?'F'+pad3(h-window)+' cumulative total':'a complete accumulation interval'}`,ds:null};
 return{ds,v,h};}
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
 const info=[`Panel: ${p.cfg.label||p.cfg.id}`,`Field: ${p.v?.name||st.field||'unknown'}`,
  `Dataset: ${p.ds?.id||'unknown'}`,`Grid: ${p.ds?.grid?.GRIB_gridType||'unknown'}`,
  `Dimensions: ${p.v?.shape?.join(' × ')||'unknown'}`,
  `Store: ${p.ds?.path||'unknown'}`,
  `Error: ${loadingErrorMessage(e)}`,
  e?.stack?`Stack: ${e.stack}`:null].filter(Boolean).join('\n');
 console.error('OMD EVU rendering failure\n'+info,e);
 p.status='error';p.save.disabled=true;
 p.lastErrorDetails=info;
 stage(p,'Rendering error: '+loadingErrorMessage(e)+'\nTap here to view/copy full error');
 p.notice.classList.add('error-details');p.notice.title=info;
 p.notice.style.pointerEvents='auto';
 p.notice.onclick=event=>{
  event.stopPropagation();
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(info).catch(()=>{});
  window.alert(info);
 };
 updateStatus();
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

// Capture a geographic camera rather than pixel-space center. This works in
// both MapLibre Mercator (2D) and Globe and allows the different projections
// to keep their own remembered viewpoint during the current viewer session.
function cameraFromMap(map){
 if(!map)return null;
 try{
  const c=map.getCenter();
  const camera={center:[Number(c.lng),Number(c.lat)],zoom:Number(map.getZoom()),
   bearing:Number(map.getBearing()),pitch:Number(map.getPitch())};
  if([camera.center[0],camera.center[1],camera.zoom,camera.bearing,camera.pitch].every(Number.isFinite))return camera;
 }catch(e){console.warn('Could not read map camera',e);}
 return null;
}
function applyProjection(map,camera=null){
 const globe=st.mode==='globe';
 if(map.setMaxBounds)map.setMaxBounds(null);
 map.setMinZoom(0);
 map.setProjection({type:globe?'globe':'mercator'});
 map.setMaxZoom(st.cfg.display.maxZoom||12);
 // Recompute flat-view zoom limits without leaving the camera at the fitted
 // overview. fitDataExtent() can otherwise overwrite a user's saved 2D view.
 if(!globe){map.__evuExtentFitted=false;fitDataExtent(map);}
 const target=camera||(globe?makeViewBounds():cameraFromMap(map)||makeViewBounds());
 map.jumpTo(target);
 for(const p of st.active)if(p.map===map){geographyZoom(p);scheduleWindRedraw(p);}
 return cameraFromMap(map);
}
function switchProjection(mode,{reset=false}={}){
 if(mode!=='lambert'&&mode!=='globe')return;
 if(mode===st.mode&&!reset)return;
 const outgoingMode=st.mode;
 // Snapshot BEFORE changing projection. MapLibre can clamp or recenter the
 // camera during setProjection() and during flat-view extent fitting.
 const outgoing=currentSharedCamera();
 if(mode!==outgoingMode&&outgoing)st.mapViews[outgoingMode]=outgoing;
 st.mode=mode;
 // On first visit, inherit the prior geographic location; thereafter restore
 // exactly the last viewpoint of this projection. Reset affects only this mode.
 if(reset)st.mapViews[mode]=null;
 let target=reset?null:(st.mapViews[mode]||outgoing);
 const previousSyncing=st.syncing;
 st.syncing=true;
 try{
  let firstCamera=null;
  for(const p of st.active){
   if(!p.map)continue;
   const applied=applyProjection(p.map,target||firstCamera);
   if(!firstCamera&&applied)firstCamera=applied;
  }
  // Use the actual applied camera (which may be clamped at the 2D zoom limit)
  // as the shared state for later mobile panel initialization.
  st.mapView=firstCamera||target||null;
  st.mapViews[mode]=st.mapView;
 }finally{st.syncing=previousSyncing;}
 clearSynchronizedHover();
 if(st.difference.open&&st.difference.map){
  try{st.difference.map.setProjection({type:st.mode==='globe'?'globe':'mercator'});
   st.difference.map.jumpTo(st.mapView||makeViewBounds());
   if(st.difference.geo)geographyZoom(st.difference.geo);
  }catch(e){console.warn('Difference map projection update',e);}
 }
 syncUI();
}
function syncViews(source){
 if(st.syncing||st.exportRender||!st.cfg.display.syncMaps)return;
 const camera=cameraFromMap(source);if(!camera)return;
 st.syncing=true;
 try{
  st.mapView=camera;
  st.mapViews[st.mode]=camera;
  for(const p of st.active)if(p.map&&p.map!==source)p.map.jumpTo(camera);
  if(st.difference.open&&st.difference.map)st.difference.map.jumpTo(camera);
 }finally{st.syncing=false;}
}
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
  // v7.40: never draw an animation-frame-driven overlay on top of the
  // master pointer. Its white crosshair + glow are one native CSS cursor, so
  // they cannot drift apart. Keep geographic counterparts in other panels.
  const isMaster=p===h.master;
  p.ghost.hidden=isMaster||!visible;
  if(visible&&!isMaster){p.ghost.style.left=xy.x+'px';p.ghost.style.top=xy.y+'px';}
  // Even when the field is missing, show the coordinates and lack of data.
  if(!visible){p.info.hidden=true;continue;}
  let reading='No data';
  if(p.rawField&&p.v){try{
    const value=Number(p.rawField.sampleField(h.lon,h.lat));
    if(Number.isFinite(value)&&value> -1e9){
     const meta=fieldInfo(p.v,st.field,p.ds?.model||p.cfg.source);
     reading=`${formatReadout(value,meta)} ${meta.unit}`.trim();
    }
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
 const contourCanvas=document.createElement('canvas');contourCanvas.className='contour-overlay';
 contourCanvas.setAttribute('aria-hidden','true');p.frame.append(contourCanvas);p.contourCanvas=contourCanvas;
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
 // Contours are CPU-intensive, so never resample or trace them during
 // panning, wheel zoom, touch gestures, or synced camera movements. Hiding
 // the old overlay also avoids lines drifting over the moving map.
 m.on('movestart',()=>suspendContours(p));
 m.on('move',()=>{if(!st.rendering)syncViews(m);scheduleWindRedraw(p);if(st.hover&&!st.exportRender&&!st.hoverRaf)st.hoverRaf=requestAnimationFrame(()=>{st.hoverRaf=0;paintSynchronizedHover();});});
 m.on('resize',()=>{scheduleWindRedraw(p);scheduleContourRedraw(p,140);});
 // Debounce across rapid wheel steps; stagger synchronized panels so nine
 // expensive contour passes don't block the same animation frame.
 m.on('moveend',()=>scheduleContourRedraw(p,160+p.i*35));
 m.on('zoomend',()=>geographyZoom(p));
 m.on('mousemove',e=>queueSynchronizedHover(p,e.lngLat));
 m.on('contextmenu',e=>{e.originalEvent?.preventDefault();window.EVUPointInspector?.showMenu(p,e);});
 m.on('mouseleave',()=>{if(st.hover?.master===p)clearSynchronizedHover();});
 m.on('error',e=>{p.lastMapError=String(e.error?.message||e.error||e);console.warn('MapLibre',p.lastMapError);});
 // WebGL context loss is a browser/GPU resource signal, not an arbitrary
 // panel-count threshold. Allow MapLibre to restore the canvas; only reduce
 // the phone's active-context budget if restoration does not occur promptly.
 const canvas=m.getCanvas();
 canvas?.addEventListener('webglcontextlost',e=>{
  e.preventDefault();
  if(p.map!==m)return;
  p.contextLost=true;st.contextLossCount++;
  p.status='loading';stage(p,'WebGL context interrupted; attempting recovery…');updateStatus();
  clearTimeout(p.contextLossTimer);
  p.contextLossTimer=setTimeout(()=>handlePersistentContextLoss(p,m),3000);
 });
 canvas?.addEventListener('webglcontextrestored',()=>{
  if(p.map!==m)return;
  p.contextLost=false;clearTimeout(p.contextLossTimer);p.contextLossTimer=null;
  // MapLibre rebuilds its resources on restore. Refresh the weather layer
  // afterward so an old WebGL texture never remains displayed as valid data.
  setTimeout(()=>{
   if(p.map!==m)return;
   if(p.busy){setTimeout(()=>{if(p.map===m&&!p.busy)void renderPanel(p,st.seq);},650);}
   else void renderPanel(p,st.seq);
  },180);
 });
 m.on('load',()=>{
  if(p.map!==m)return;
  try{addGeographySkeleton(m);syncObservationPanel(p);syncSPCPanel(p);}
  catch(e){p.lastMapError='Could not install geography layers: '+String(e);console.error(p.lastMapError);}
  updateGeographyVisibility(p);
  if(st.mode==='lambert'&&!st.mapView&&!m.__evuExtentFitted)fitDataExtent(m);
  startGeography(p);
 });
 p.view.classList.add('has-live-map');p.snap.hidden=true;return m;
}
function discardMap(p){
 if(!p.map)return;
 suspendContours(p); // Don't keep timers or RAF work for an evicted panel.
 clearTimeout(p.contextLossTimer);p.contextLossTimer=null;p.contextLost=false;
 // An evicted MapLibre startup must never leave waitMapReady polling until
 // the entire 90-second deadline. Normal viewport eviction intentionally
 // avoids initializing/busy maps, but cancellation is still defensive.
 if(p.cancelMapWait)p.cancelMapWait();
 if(st.hover?.master===p)clearSynchronizedHover();else{p.ghost.hidden=true;p.info.hidden=true;}
 if(p.geoTimer)clearTimeout(p.geoTimer);p.geoTimer=null;
 try{const snap=p.lastSnapshot||p.map.getCanvas().toDataURL('image/png');p.snap.src=snap;p.lastSnapshot=snap;p.snap.hidden=false;}
 catch(e){console.warn('Could not retain snapshot',e);}
 p.map.remove();p.map=null;p.wind=null;p.windCanvas=null;p.windFrameRequested=false;p.contourCanvas=null;p.contourFrameRequested=false;p.component=null;p.layer=null;p.rawField=null;p.contourField=null;p.heightField=null;p.temperature850Field=null;p.lastKey=null;p.mapReady=null;p.grid=null;p.gridKey=null;
 p.initializing=false;p.cancelMapWait=null;
 p.geoApplied=new Set();p.geoPending=new Set();p.obsClickInstalled=null;p.spcClickInstalled=false;p.frame.replaceChildren();
 p.view.classList.remove('has-live-map');st.active=st.active.filter(x=>x!==p);
}
function waitMapReady(p,m){
 return new Promise((resolve,reject)=>{
  let settled=false,deadline=null,tick=null,poll=null;
  const timeout=Math.max(30000,Number(st.cfg.display?.mapInitTimeoutSeconds||60)*1000);
  const finish=(error)=>{
   if(settled)return;settled=true;clearTimeout(tick);clearTimeout(deadline);clearInterval(poll);
   if(typeof m.off==='function')m.off('load',onLoad);
   if(p.cancelMapWait===cancel)p.cancelMapWait=null;
   error?reject(error):resolve();
  };
  const cancel=()=>finish(new Error('Map initialization was canceled'));
  p.cancelMapWait=cancel;
  const onLoad=()=>{if(p.map!==m){cancel();return;}
   if(st.mode==='lambert'&&!st.mapView&&!m.__evuExtentFitted)fitDataExtent(m);finish(null);
  };
  m.on('load',onLoad);
  const probe=()=>{
   if(p.map!==m){cancel();return;}
   try{
    // A phone may finish layout later than MapLibre startup; resizing after
    // the host has a nonzero size can unblock the initial render.
    const host=p.frame.firstElementChild;
    if(host&&host.clientWidth>4&&host.clientHeight>4&&m.getCanvas?.()?.width===0)m.resize?.();
    if(m.loaded?.()||m.isStyleLoaded?.()){
     if(!m.getLayer?.('coast'))addGeographySkeleton(m);
     finish(null);
    }
   }catch(e){p.lastMapError='Style readiness: '+String(e);}
  };
  poll=setInterval(probe,500);
  tick=setTimeout(()=>{
   if(p.map===m)setNote(p,'MapLibre is starting slowly on this device…');
  },7000);
  deadline=setTimeout(()=>finish(new Error('MapLibre map did not start after '+Math.round(timeout/1000)+' s. '+
   (p.lastMapError?`Map error: ${p.lastMapError}. `:'')+
   'Check diagnostics.html; verify vendor/maplibre-gl-csp-worker.js loads, WebGL is enabled, and worker-src self is allowed.')),timeout);
  probe();
 });
}
function nearViewport(p){
 // Offscreen queued observer work is no longer worth consuming a GPU context.
 // Mobile pages scroll the document, whereas desktop uses the plotting grid.
 const r=p.card.getBoundingClientRect(),margin=100;
 if(innerWidth<=800)return r.bottom>=-margin&&r.top<=innerHeight+margin;
 const b=el.viewerGrid.getBoundingClientRect();
 return r.bottom>=b.top-margin&&r.top<=b.bottom+margin&&r.right>=b.left&&r.left<=b.right;
}
function configuredMapCapacity(){
 // In particular, a narrow viewport is NOT evidence of a four-context limit.
 // Default to the number of genuine map panels, capped by user configuration.
 const actual=st.panels.filter(p=>!p.cfg.placeholder).length;
 const configured=Number(st.cfg?.display?.maxActiveMaps);
 return Math.max(1,Math.min(20,Number.isFinite(configured)&&configured>0?Math.floor(configured):actual));
}
function mapCapacity(){
 return Math.min(configuredMapCapacity(),st.mobilePressureCap??20);
}
function trimMapsForGpuPressure(){
 if(st.exporting)return;
 // This path only runs after an ACTUAL failed WebGL restoration on mobile.
 // Prefer releasing offscreen, idle contexts; never discard loading maps.
 let changed=false;
 while(st.active.length>mapCapacity()){
  const idle=st.active.filter(p=>p.map&&!p.initializing&&!p.busy&&!p.activation);
  if(!idle.length)break;
  idle.sort((a,b)=>Number(nearViewport(a))-Number(nearViewport(b))||Number(!a.contextLost)-Number(!b.contextLost)||a._used-b._used);
  const victim=idle[0];discardMap(victim);
  victim.status='waiting';victim.save.disabled=true;
  setNote(victim,'Map paused after GPU resource pressure. Tap or scroll here to reactivate.');
  changed=true;
 }
 if(changed)updateStatus();
 if(st.active.length>mapCapacity())setTimeout(trimMapsForGpuPressure,900);
}
function handlePersistentContextLoss(p,m){
 p.contextLossTimer=null;
 if(p.map!==m||!p.contextLost)return;
 const oldCap=mapCapacity();
 if(innerWidth<=800&&oldCap>4){
  st.mobilePressureCap=Math.max(4,oldCap-1);
  console.warn('OMD EVU: mobile WebGL context could not be restored; reducing active maps to',st.mobilePressureCap);
  trimMapsForGpuPressure();
 }
 // If this particular map has not recovered even after resources are released,
 // replace the lost context on demand rather than leave a permanently dead map.
 setTimeout(()=>{
  if(p.map!==m||!p.contextLost)return;
  if(p.initializing||p.busy||p.activation){
   p.contextLossTimer=setTimeout(()=>handlePersistentContextLoss(p,m),2000);return;
  }
  discardMap(p);p.status='waiting';p.save.disabled=true;
  setNote(p,'WebGL context was lost; tap this panel to retry.');updateStatus();
 },5000);
}
function waitMapInitTurn(p,source){
 // Only serialize the MapLibre setup. Zarr downloads and GPU plotting are
 // allowed to run while the next map initializes. This prevents a burst of
 // simultaneous CSP-worker/GPU starts on phones without slowing all downloads.
 if(innerWidth>800)return createReadyMap(p,source);
 const previous=st.mapInitQueue;
 const job=previous.catch(()=>{}).then(()=>createReadyMap(p,source));
 st.mapInitQueue=job.then(()=>{},()=>{});
 return job;
}
async function createReadyMap(p,source){
 if(p.map){if(p.mapReady)await p.mapReady;return p.map;}
 if(source==='viewport'&&!nearViewport(p))return null;
 const limit=mapCapacity();
 if(st.active.length>=limit){
  // Never evict an initializing map or a plot being decoded/rendered.
  // Prefer offscreen idle maps; only a direct click/export may displace
  // another visible map if all slots are occupied.
  const idle=st.active.filter(x=>x!==p&&!x.busy&&!x.initializing&&!x.activation);
  const pool=(source==='viewport'?idle.filter(x=>!nearViewport(x)):idle)
   .sort((a,b)=>Number(nearViewport(a))-Number(nearViewport(b))||a._used-b._used);
  if(!pool.length){
   p.status='waiting';setNote(p,source==='viewport'?'Waiting for a free mobile map slot…':'Finishing another map; tap this panel again if needed');updateStatus();
   return null;
  }
  discardMap(pool[0]);
 }
 p.initializing=true;p._used=++st.clock;st.active.push(p);p.status='loading';
 setNote(p,'Initializing map engine…');updateStatus();
 let m=null;
 try{
  // Give CSS/grid sizing a frame before constructing the WebGL surface.
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  if(source==='viewport'&&!nearViewport(p)){
   st.active=st.active.filter(x=>x!==p);p.status='waiting';return null;
  }
  m=createMap(p);p.mapReady=waitMapReady(p,m);
  await p.mapReady;
  if(p.map!==m)return null;
  // The map-ready probe can resolve before a late MapLibre load callback.
  // In either order, new REFS/analysis panels receive the currently loaded LSRs.
  syncSPCPanel(p);
  return m;
 }catch(e){
  if(p.map===m)discardMap(p);
  throw e;
 }finally{
  p.initializing=false;
  if(p.map===m)p.mapReady=null;
  if(!p.map){st.active=st.active.filter(x=>x!==p);if(p.status==='loading')p.status='waiting';}
  updateStatus();
 }
}
async function activate(p,source='direct'){
 if(!p||p.cfg.placeholder)return;
 if(p.activation)return p.activation;
 p.activation=activateInternal(p,source).finally(()=>{p.activation=null;});
 return p.activation;
}
async function activateInternal(p,source){
 let m;
 try{m=await waitMapInitTurn(p,source);}
 catch(e){if(/Map initialization was canceled/.test(String(e?.message||e)))return;throw e;}
 if(!m||p.map!==m)return;
 p._used=++st.clock;
 await renderPanel(p,st.seq);scheduleDifferenceRefresh();
}
async function renderAll(){window.EVUPointInspector?.scheduleSoundingRefresh();void refreshObservationOverlay();void refreshSPCReports();if(st.prefetchContext!==null&&st.prefetchContext!==prefetchContextKey())cancelQueuedPrefetches();st.seq++;invalidateDifferenceForViewChange();st.rendering=true;const seq=st.seq;for(const p of st.panels){p.save.disabled=true;p.snap.hidden=true;p.lastSnapshot=null;if(p.cfg.placeholder){p.status='missing';continue;}if(!p.map){p.status='waiting';setNote(p,'Select or scroll to this panel to render');}}try{await Promise.all(st.active.filter(p=>p.map).map(p=>renderPanel(p,seq)));}finally{st.rendering=false;updateStatus();schedulePrefetch();scheduleDifferenceRefresh();}}
// The compressed-byte store is optional. CacheStorage is available under HTTPS
// (or localhost), survives browser reloads, and holds many forecast hours without
// filling the decoded GPU-data caches. Missing/quota-restricted storage simply
// degrades to a bounded memory-only look-ahead.
class CompressedZarrStore {
 constructor(){this.cache=null;this.opening=null;this.disabled=false;this.entries=new Map();this.bytes=0;this.pendingWrite=Promise.resolve();this.foregroundRecentlyUsed=new Map();this.quotaFailures=0;this.adaptiveBudgetBytes=null;}
 get budget(){return Math.min(Math.max(32,Math.min(4096,Number(st.cfg?.display?.prefetchDiskCacheMB??512)))*1048576,this.adaptiveBudgetBytes??Infinity);}
 get maxItems(){return Math.max(16,Math.min(3000,Number(st.cfg?.display?.prefetchDiskMaxChunks??550)));}
 get ttlMs(){return Math.max(1,Math.min(168,Number(st.cfg?.display?.prefetchCacheTTLHours??24)))*3600000;}
 async open(){
  if(this.disabled)return null;
  if(this.cache)return this.cache;
  if(this.opening)return this.opening;
  this.opening=(async()=>{
   if(!('caches' in window)||location.protocol==='file:')return null;
   try{
    const cache=await caches.open('omd-evu-zarr-chunks-v1');
    // Size metadata are headers, so a reload does not have to read all chunks.
    const keys=await cache.keys();
    for(const request of keys){
     const response=await cache.match(request);
     if(!response)continue;
     const bytes=Math.max(0,Number(response.headers.get('x-evu-cache-bytes'))||0);
     const cachedAt=Number(response.headers.get('x-evu-cached-at'));
     if(!bytes||!cachedAt||Date.now()-cachedAt>this.ttlMs){await cache.delete(request);continue;}
     this.entries.set(request.url,bytes);this.bytes+=bytes;
    }
    this.cache=cache;return cache;
   }catch(e){console.warn('Persistent Zarr cache unavailable:',e);this.disabled=true;return null;}
  })();return this.opening;
 }
 async read(url,foreground=false){
  const cache=await this.open();if(!cache)return null;
  try{
   const response=await cache.match(url);if(!response){
    const old=this.entries.get(url)||0;this.entries.delete(url);this.foregroundRecentlyUsed.delete(url);this.bytes=Math.max(0,this.bytes-old);return null;
   }
   const cachedAt=Number(response.headers.get('x-evu-cached-at'));
   if(!cachedAt||Date.now()-cachedAt>this.ttlMs){
    await cache.delete(url);const old=this.entries.get(url)||0;
    this.foregroundRecentlyUsed.delete(url);this.entries.delete(url);this.bytes=Math.max(0,this.bytes-old);return null;
   }
   const size=this.entries.get(url);if(size){this.entries.delete(url);this.entries.set(url,size);}
   if(foreground)this.rememberForeground(url);
   return response.arrayBuffer();
  }catch(e){console.warn('Zarr cache read failed:',e);return null;}
 }
 rememberForeground(url){
  // Protect a small window of recently displayed hours from speculative
  // prefetch eviction. This is a soft preference, never an absolute pin.
  this.foregroundRecentlyUsed.delete(url);this.foregroundRecentlyUsed.set(url,Date.now());
  while(this.foregroundRecentlyUsed.size>72)this.foregroundRecentlyUsed.delete(this.foregroundRecentlyUsed.keys().next().value);
 }
 async save(url,bytes,foreground=false){
  const cache=await this.open();if(!cache||bytes.byteLength>this.budget)return false;
  // Serialize writes and eviction accounting; downloads remain concurrent.
  const saveOne=async()=>{
   const evictOne=async()=>{
    // Foreground chunks get a soft preference. Even pinned entries remain
    // evictable if every entry is recently used or browser quota is tight.
    const old=[...this.entries.keys()].find(key=>!this.foregroundRecentlyUsed.has(key))||this.entries.keys().next().value;
    if(!old)return false;
    const size=this.entries.get(old);
    await cache.delete(old);this.entries.delete(old);this.foregroundRecentlyUsed.delete(old);this.bytes-=size;
    return true;
   };
   const recentCutoff=Date.now()-10*60*1000;
   for(const [key,time] of this.foregroundRecentlyUsed){if(time<recentCutoff||!this.entries.has(key))this.foregroundRecentlyUsed.delete(key);}
   if(this.entries.has(url)){if(foreground)this.rememberForeground(url);return true;}
   for(let attempt=0;attempt<4;attempt++){
    try{
     while(this.entries.size&&(this.entries.size>=this.maxItems||this.bytes+bytes.byteLength>this.budget))await evictOne();
     if(bytes.byteLength>this.budget)return false;
     const response=new Response(bytes,{headers:{'content-type':'application/octet-stream','x-evu-cache-bytes':String(bytes.byteLength),'x-evu-cached-at':String(Date.now())}});
     await cache.put(url,response);
     this.entries.set(url,bytes.byteLength);this.bytes+=bytes.byteLength;
     if(foreground)this.rememberForeground(url);
     return true;
    }catch(e){
     const quota=e?.name==='QuotaExceededError'||/quota exceeded|not enough space|insufficient storage/i.test(String(e?.message||e));
     if(quota){
      // Browser quotas can be below our configured cache target. Shrink
      // gradually and retry without disabling persistent caching forever.
      this.quotaFailures++;
      this.adaptiveBudgetBytes=Math.max(16*1048576,Math.floor(Math.min(this.budget,Math.max(this.bytes,bytes.byteLength))*0.45));
      if(this.entries.size)await evictOne();
      if(attempt<3)continue;
      console.warn('Persistent Zarr cache quota reached; retaining available entries.');return false;
     }
     console.warn('Persistent Zarr cache write disabled:',e);this.disabled=true;return false;
    }
   }
   return false;
  };
  const job=this.pendingWrite.then(saveOne,saveOne);
  this.pendingWrite=job.then(()=>{},()=>{});
  return job;
 }
}
function prefetchMode(){
 const d=st.cfg?.display||{};
 if(d.prefetchEnabled===false||d.prefetchNextHour===false||document.hidden||navigator.connection?.saveData)return 'off';
 if(st.playing||st.rendering||st.panels?.some(p=>p.busy||p.initializing))return 'active';
 return Date.now()-st.lastUserActivity>=Math.max(250,Number(d.prefetchIdleAfterMs??1800))?'idle':'active';
}
// Avoid consuming every request slot with speculative downloads. Foreground
// navigation always moves to the front of the shared queue, including a
// prefetched chunk that is still queued rather than fetched.
function limiter(fn,background=false,key=null){
 return new Promise((resolve,reject)=>{
  const task={fn,resolve,reject,background,key};
  st.queue.push(task);if(key)st.queuedFetches.set(key,task);pump();
 });
}
function pump(){
 const d=st.cfg?.display||{};
 const cap=Math.max(2,Math.min(12,Number(d.maxConcurrentFetches||6)));
 const mode=prefetchMode();
 const desired=Math.min(Math.max(1,cap-2),Math.max(1,Number(mode==='idle'?d.prefetchIdleConcurrency??4:d.prefetchActiveConcurrency??2)));
 while(st.running<cap){
  let idx=st.queue.findIndex(t=>!t.background);
  if(idx<0&&mode!=='off'&&st.prefetchActive<desired)idx=st.queue.findIndex(t=>t.background);
  if(idx<0)return;
  const t=st.queue.splice(idx,1)[0];
  if(t.key)st.queuedFetches.delete(t.key);
  st.running++;if(t.background)st.prefetchActive++;
  Promise.resolve().then(t.fn).then(t.resolve,t.reject).finally(()=>{
   st.running--;if(t.background)st.prefetchActive--;pump();
  });
 }
}
function markUserActivity(){
 st.lastUserActivity=Date.now();
 // After a new gesture, new downloads revert to one low-priority slot.
 // Existing downloads are allowed to finish, so there is no wasted transfer.
 pump();
}
function cancelQueuedPrefetches(){
 if(st.prefetchTimer){clearTimeout(st.prefetchTimer);st.prefetchTimer=null;}
 st.prefetchGeneration++;st.prefetchBatchToken=null;st.prefetchFocus=null;st.prefetchSeenForFocus.clear();
 const keep=[];
 for(const task of st.queue){
  if(!task.background){keep.push(task);continue;}
  if(task.key)st.queuedFetches.delete(task.key);
  task.reject(new Error('Superseded background forecast prefetch'));
 }
 st.queue=keep;pump();
}
// Return *compressed* bytes; every caller (foreground/idle/background) shares
// the same network request. Only the foreground renderer decompresses them.
async function compressedChunk(url,opts={}){
 if(!st.chunkStore)st.chunkStore=new CompressedZarrStore();
 const existing=st.compressedInflight.get(url);
 if(existing){
  if(!opts.background){
   st.cacheStats.shared++;opts.onLocation?.('shared');
   void existing.then(()=>st.chunkStore?.rememberForeground(url),()=>{});
  }
  if(!opts.background){const queued=st.queuedFetches.get(url);if(queued?.background){queued.background=false;pump();}}
  return existing;
 }
 const task=limiter(async()=>{
  const cached=await st.chunkStore.read(url,!opts.background);
  if(cached){if(!opts.background)st.cacheStats.disk++;opts.onLocation?.('disk');return cached;}
  opts.onLocation?.('network');
  const attempts=2,timeout=Math.max(30000,Number(st.cfg?.display?.chunkTimeoutSeconds??150)*1000);
  let last;
  for(let attempt=0;attempt<attempts;attempt++){
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
   try{
    const response=await fetch(url,{signal:controller.signal});
    if(!response.ok){const error=Error(`Chunk HTTP ${response.status}: ${url}`);error.status=response.status;throw error;}
    const bytes=await response.arrayBuffer();
    st.cacheStats.network++;
    // Foreground plotting never waits for persistent-cache writes; background
    // prefetches do wait so the next batch starts with durable cached chunks.
    if(opts.background)await st.chunkStore.save(url,bytes,false);
    else void st.chunkStore.save(url,bytes,true);
    return bytes;
   }catch(e){last=controller.signal.aborted?Error(`Zarr chunk timed out after ${Math.round(timeout/1000)} s: ${url}`):e;
    if(attempt===attempts-1||e.status===404||e.status===403||e.status===401||e.status===400||e.status===416)throw last;
    await sleep(350*(attempt+1));
   }finally{clearTimeout(timer);}
  }
  throw last;
 },Boolean(opts.background),url);
 st.compressedInflight.set(url,task);
 try{return await task;}finally{if(st.compressedInflight.get(url)===task)st.compressedInflight.delete(url);}
}
function cacheGet(k){const v=st.cache.get(k);if(v){st.cacheStats.decoded++;st.cache.delete(k);st.cache.set(k,v);if(st.chunkStore?.entries.has(k))st.chunkStore.rememberForeground(k);}return v;}
function cachePut(k,v){
 if(st.cache.has(k))st.cacheBytes-=st.cache.get(k).byteLength;
 st.cache.delete(k);st.cache.set(k,v);st.cacheBytes+=v.byteLength;
 const max=Math.max(8,Number(st.cfg.display.decodedCacheMB||96))*1024*1024;
 while(st.cacheBytes>max&&st.cache.size>1){const oldest=st.cache.keys().next().value;st.cacheBytes-=st.cache.get(oldest).byteLength;st.cache.delete(oldest);st.cacheStats.decodedEvicted++;}
}
function displayKey(src,ds,v,h,m){
 const url=new URL(`${ds.path}/${v.name}/${h}.0.0`,new URL('.',src.url)).href;
 return url+'::'+(m.convert||'native');
}
function displayCacheGet(k){const v=st.displayCache.get(k);if(v){st.cacheStats.displayReady++;st.displayCache.delete(k);st.displayCache.set(k,v);const raw=k.split('::')[0];if(st.chunkStore?.entries.has(raw))st.chunkStore.rememberForeground(raw);}return v;}
function displayCachePut(k,v){
 if(st.displayCache.has(k))st.displayCacheBytes-=st.displayCache.get(k).byteLength;
 st.displayCache.delete(k);st.displayCache.set(k,v);st.displayCacheBytes+=v.byteLength;
 const max=Math.max(16,Number(st.cfg.display.displayReadyCacheMB||128))*1024*1024;
 while(st.displayCacheBytes>max&&st.displayCache.size>1){const oldest=st.displayCache.keys().next().value;st.displayCacheBytes-=st.displayCache.get(oldest).byteLength;st.displayCache.delete(oldest);st.cacheStats.displayEvicted++;}
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

// Virtual accumulation fields are derived from existing validated Zarr data.
// Model fields are cycle-to-date; MRMS QPE is an exact one-hour interval.
function precipitationAccumulationHours(field){const match=/^apcp(1|3|6|24|48)h$/.exec(field||'');return match?Number(match[1]):0;}
function snowAccumulationHours(field){const match=/^snow(1|3|6|24|48)h$/.exec(field||'');return match?Number(match[1]):0;}
function mrmsHourlyRecord(src,instant){
 const key=new Date(instant).toISOString();
 return src?.datasets?.find(ds=>ds.product==='mrms_apcp'&&cycleKey(ds.init_time)===key&&
   ds.variables?.some(v=>v.name==='apcp'&&v.available_hours.includes(0)));
}
// NOHRSC has native 6-h and 24-h products only. The 48-hour analysis is
// built from exactly two non-overlapping 24-hour fields, valid 24 hours apart.
function nohrsc24hRecord(src,instant){
 const key=new Date(instant).toISOString();
 return src?.datasets?.find(ds=>ds.product==='nohrsc_24h'&&cycleKey(ds.init_time)===key&&
   ds.variables?.some(v=>v.name==='snow24h'&&v.available_hours?.includes(0)));
}
function missingNohrscRunningHours(src,ref,lead){
 const missing=[];
 for(let h=6;h<=lead;h+=6){
  if(!nohrsc6hRecord(src,valid(ref,h)))missing.push(fmt(valid(ref,h)));
 }
 return missing;
}
function nohrsc6hRecord(src,instant){
 const key=new Date(instant).toISOString();
 return src?.datasets?.find(ds=>ds.product==='nohrsc_6h'&&cycleKey(ds.init_time)===key&&
   ds.variables?.some(v=>v.name==='snow6h'&&v.available_hours?.includes(0)));
}
function sumSnowAnalysisArrays(current,previous){
 if(current.length!==previous.length)throw Error('NOHRSC 24-hour snowfall grid dimensions differ');
 const out=new Float32Array(current.length);
 for(let i=0;i<out.length;i++){
  const a=current[i],b=previous[i];
  out[i]=Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>=0?a+b:NaN;
 }
 return out;
}
function checkSnowAnalysisGrids(a,b,av,bv){
 if(JSON.stringify(a.grid)!==JSON.stringify(b.grid)||
    JSON.stringify(av.shape.slice(1))!==JSON.stringify(bv.shape.slice(1)))
  throw Error('NOHRSC 48-hour snowfall unavailable: successive 24-hour grids differ');
}
async function nohrscRunningTotal(p,ds,v,m,onProgress,seq){
 // Strictly adjacent six-hour analyses, excluding the product valid at F000:
 // that one covers time BEFORE model initialization. Never substitute a
 // 24-hour rolling product or invent a partial last six-hour interval.
 const lead=st.hour;
 if(lead<6||lead%6)throw Error('NOHRSC running snowfall is available only at F006 and subsequent 6-hour leads');
 const missing=missingNohrscRunningHours(p.src,st.ref,lead);
 if(missing.length)throw Error(`NOHRSC running snowfall needs all six-hour fields; first missing ${missing[0]}`);
 const records=[];
 for(let h=6;h<=lead;h+=6){
  const record=nohrsc6hRecord(p.src,valid(st.ref,h));
  records.push([record,record.variables.find(x=>x.name==='snow6h')]);
 }
 for(const [r,rv] of records)checkSnowAnalysisGrids(ds,r,v,rv);
 let sum=null;
 for(let i=0;i<records.length;i++){
  const [r,rv]=records[i];
  onProgress(`NOHRSC running snowfall: loading ${i+1}/${records.length} six-hour periods…`);
  const data=await getDisplayData(p.src,r,rv,0,m,()=>{});
  if(seq!==st.seq)return null;
  sum=sum===null?data.slice():sumSnowAnalysisArrays(sum,data);
 }
 return sum;
}
async function nohrsc48hTotal(p,ds,v,m,onProgress,seq){
 if(ds.product!=='nohrsc_24h'||v.name!=='snow24h')
  throw Error('NOHRSC 48-hour snowfall requires a native 24-hour snowfall field');
 const at=new Date(ds.init_time);
 const priorTime=new Date(at.getTime()-24*3600000);
 const previous=nohrsc24hRecord(p.src,priorTime);
 if(!previous)throw Error(`NOHRSC 48-hour snowfall missing 24-hour analysis ending ${fmt(priorTime)}`);
 const pv=previous.variables.find(x=>x.name==='snow24h');
 checkSnowAnalysisGrids(ds,previous,v,pv);
 onProgress('NOHRSC 48-hour snowfall: loading two 24-hour analyses…');
 const current=await getDisplayData(p.src,ds,v,0,m,onProgress);
 if(seq!==st.seq)return null;
 const earlier=await getDisplayData(p.src,previous,pv,0,m,onProgress);
 if(seq!==st.seq)return null;
 return sumSnowAnalysisArrays(current,earlier);
}
function missingMrmsIntervalHours(src,ref,lead,window){
 const missing=[];
 for(let hr=Math.max(1,lead-window+1);hr<=lead;hr++){
  if(!mrmsHourlyRecord(src,valid(ref,hr)))missing.push(fmt(valid(ref,hr)));
 }
 return missing;
}
function missingMrmsHours(src,ref,lead){return missingMrmsIntervalHours(src,ref,lead,lead);}
function accumulationGridKey(ds,v){return JSON.stringify([ds.grid,v.shape.slice(1)]);}
async function mrmsWindowTotal(p,ds,v,lead,window,m,onProgress,seq){
 if(lead<window)throw Error(`Need F${pad3(window)} or later for a complete ${window}-hour MRMS accumulation`);
 const src=p.src,reference=st.ref;
 const missing=missingMrmsIntervalHours(src,reference,lead,window);
 if(missing.length)throw Error(`MRMS ${window}-hour precipitation unavailable: missing ${missing.length} hourly QPE input(s); first ${missing[0]}`);
 const n=v.shape[1]*v.shape[2],total=new Float32Array(n);
 for(let hour=lead-window+1;hour<=lead;hour++){
  if(seq!==st.seq)return null;
  const record=mrmsHourlyRecord(src,valid(reference,hour));
  const rv=record.variables.find(x=>x.name==='apcp');
  if(accumulationGridKey(record,rv)!==accumulationGridKey(ds,v))
   throw Error(`MRMS ${window}-hour total unavailable: hourly grids differ at ${fmt(record.init_time)}`);
  onProgress(`MRMS ${window}-h total: adding hour ${hour-lead+window} of ${window}…`);
  const values=await getDisplayData(src,record,rv,0,m,()=>{});
  if(seq!==st.seq)return null;
  if(values.length!==n)throw Error('MRMS hourly precipitation grid shape mismatch');
  for(let i=0;i<n;i++){
   const a=total[i],b=values[i];
   total[i]=Number.isFinite(a)&&Number.isFinite(b)&&b>=0?a+b:NaN;
  }
 }
 return total;
}
async function mrmsRunningTotal(p,ds,v,lead,m,onProgress,seq){
 const src=p.src,reference=st.ref;
 const missing=missingMrmsHours(src,reference,lead);
 if(missing.length)throw Error(`MRMS running total unavailable: ${missing.length} hourly QPE input(s) missing; first ${missing[0]}. No partial sum shown.`);
 const key=String(src.url)+'|'+reference.init_time+'|'+accumulationGridKey(ds,v);
 const previous=st.mrmsAccumCache;
 let total,from=0;
 if(previous?.key===key&&previous.upto<=lead){total=previous.data.slice();from=previous.upto;}
 else total=new Float32Array(v.shape[1]*v.shape[2]);
 if(lead===0)return total;
 for(let hour=from+1;hour<=lead;hour++){
  if(seq!==st.seq)return null;
  const record=mrmsHourlyRecord(src,valid(reference,hour));
  const rv=record.variables.find(x=>x.name==='apcp');
  if(accumulationGridKey(record,rv)!==accumulationGridKey(ds,v))
   throw Error(`MRMS running total unavailable: hourly grids differ at ${fmt(record.init_time)}`);
  onProgress(`MRMS total: adding hour ${hour} of ${lead}…`);
  const values=await getDisplayData(src,record,rv,0,m,()=>{});
  if(seq!==st.seq)return null;
  if(values.length!==total.length)throw Error('MRMS hourly precipitation grid shape mismatch');
  for(let i=0;i<total.length;i++){
   const a=total[i],b=values[i];
   total[i]=(Number.isFinite(a)&&Number.isFinite(b)&&b>=0)?a+b:NaN;
  }
 }
 st.mrmsAccumCache={key,upto:lead,data:total};
 return total;
}
// Difference of two exact cycle-to-date totals. Never fabricate a complete
// interval by summing partial forecast hours or by treating absent as zero.
function differenceAccumulations(current,previous){
 if(current.length!==previous.length)throw Error('Accumulation forecast grids differ');
 const out=new Float32Array(current.length);
 for(let i=0;i<out.length;i++){
  const a=current[i],b=previous[i];
  out[i]=Number.isFinite(a)&&Number.isFinite(b)&&a>-1e9&&b>-1e9&&a>=b-.0001?Math.max(0,a-b):NaN;
 }
 return out;
}
async function getPanelDisplayData(p,ds,v,h,m,onProgress,seq){
 const window=precipitationAccumulationHours(st.field);
 if(st.field==='asnow'&&p.cfg.timeMode==='analysis'&&ds.product==='nohrsc_6h')
  return nohrscRunningTotal(p,ds,v,m,onProgress,seq);
 if(st.field==='snow48h'&&p.cfg.timeMode==='analysis')
  return nohrsc48hTotal(p,ds,v,m,onProgress,seq);
 if(window&&p.cfg.timeMode==='analysis'&&ds.product==='mrms_apcp')
  return mrmsWindowTotal(p,ds,v,st.hour,window,m,onProgress,seq);
 if(st.field==='apcp'&&p.cfg.timeMode==='analysis'&&ds.product==='mrms_apcp')
  return mrmsRunningTotal(p,ds,v,st.hour,m,onProgress,seq);
 const current=await getDisplayData(p.src,ds,v,h,m,onProgress);
 if(st.field==='refc_ptype'){
  const pv=ds.variables.find(x=>x.name==='ptype');
  if(!pv||!pv.available_hours.includes(h))throw Error(`Ptype F${pad3(h)} unavailable for reflectivity shading`);
  if(!pv.shape||pv.shape[1]!==v.shape[1]||pv.shape[2]!==v.shape[2])throw Error('Reflectivity and Ptype must share a grid');
  onProgress('Combining reflectivity with model precipitation type…');
  const category=await getDisplayData(p.src,ds,pv,h,FIELDS.ptype,()=>{});
  return blendReflectivityPtype(current,category);
 }
 const interval=p.cfg.timeMode!=='analysis'?(snowAccumulationHours(st.field)||window):0;
 if(!interval)return current;
 if(h<interval)throw Error(`Need F${pad3(interval)} or later for a complete ${interval}-hour accumulation`);
 if(h===interval)return current; // F000 total is zero, not a necessary source chunk.
 const earlier=h-interval;
 if(!v.available_hours.includes(earlier))throw Error(`Missing F${pad3(earlier)} cumulative total`);
 onProgress(`Computing ${interval}-hour accumulation from F${pad3(earlier)} to F${pad3(h)}…`);
 const prior=await getDisplayData(p.src,ds,v,earlier,m,()=>{});
 return differenceAccumulations(current,prior);
}

async function chunk(src,ds,v,h,onProgress=()=>{},opts={}){
 const url=new URL(`${ds.path}/${v.name}/${h}.0.0`,new URL('.',src.url)).href;
 const cached=cacheGet(url);if(cached)return cached;
 if(st.inflight.has(url))return st.inflight.get(url);
 const load=(async()=>{
  const [nt,ny,nx]=v.shape;
  if(v.chunks[0]!==1||v.chunks[1]!==ny||v.chunks[2]!==nx)throw Error('Unsupported chunking; expected [1,ny,nx]');
  if(v.compressor?.id!=='zlib'||!['<f4','|u1'].includes(v.dtype))throw Error('Only zlib float32/uint8 Zarr-v2 fields supported');
  const compressed=await compressedChunk(url,{...opts,onLocation:where=>{
   if(where==='network')onProgress(`Downloading ${v.name} F${pad3(h)} Zarr chunk…`);
   else if(where==='disk')onProgress(`Restoring cached ${v.name} F${pad3(h)}…`);
   else if(where==='shared')onProgress(`Waiting for shared ${v.name} F${pad3(h)} chunk…`);
  }});
  onProgress(`Decompressing ${v.name} F${pad3(h)}…`);
  const decoded=await new Response(compressed).body.pipeThrough(new DecompressionStream('deflate'));
  const buffer=await new Response(decoded).arrayBuffer();
  const expected=nx*ny*(v.dtype==='<f4'?4:1);
  if(buffer.byteLength!==expected)throw Error(`Decoded ${buffer.byteLength} bytes; expected ${expected}`);
  const ary=v.dtype==='<f4'?new Float32Array(buffer):new Uint8Array(buffer);
  cachePut(url,ary);return ary;
 })();
 st.inflight.set(url,load);
 try{return await load;}finally{if(st.inflight.get(url)===load)st.inflight.delete(url);}
}
function gridFromDataset(ds,v){const g=ds.grid||{},[_,ny,nx]=v.shape;
 if(g.GRIB_gridType==='regular_ll'){
  if(typeof apgl.PlateCarreeGrid!=='function')throw Error('This autumnplot-gl build lacks PlateCarreeGrid for MRMS. Update vendor/autumnplot-gl.js');
  return new apgl.PlateCarreeGrid(nx,ny,Number(g.longitude_min),Number(g.latitude_min),Number(g.longitude_max),Number(g.latitude_max));
 }
 if(g.GRIB_gridType&&g.GRIB_gridType!=='lambert')throw Error('Unsupported geographic grid '+g.GRIB_gridType);
 const get=(name,alt)=>Number(g['GRIB_'+name]??alt);const a=Number(st.cfg.display.earthRadiusM||6371229);
 return apgl.LambertGrid.fromLLCornerLonLat(nx,ny,get('LoVInDegrees',-97.5),get('LaDInDegrees',38.5),[get('Latin1InDegrees',38.5),get('Latin2InDegrees',38.5)],get('longitudeOfFirstGridPointInDegrees',-122.719528),get('latitudeOfFirstGridPointInDegrees',21.138123),get('DxInMetres',3000),get('DyInMetres',3000),a,a);
}
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
// A single scalar encodes categorical Ptype + reflectivity intensity for the
// GPU without resampling two incompatible grids or smoothing across categories.
// Each type owns an 80-dBZ band: [10,80) in class 1, [90,160) in class 2, etc.
const REFC_PTYPE_SHADES=[
 ['#16482c','#40ba59','#f0d947','#e99b2d'], // rain: green -> yellow -> orange at high dBZ
 ['#163866','#3699db','#c3f3ff'], // snow, blue
 ['#62233e','#e64c83','#ffcadf'], // freezing rain, pink
 ['#3a245b','#a457d2','#edc6ff'], // ice pellets, violet
 ['#61451e','#cfa348','#fff0a1']  // mixed, yellow/amber
];
function mixHexColors(a,b,t){
 const c=n=>Math.round(parseInt(a.slice(n,n+2),16)*(1-t)+parseInt(b.slice(n,n+2),16)*t).toString(16).padStart(2,'0');
 return '#'+c(1)+c(3)+c(5);
}
function reflectivityPtypeColor(type,dbz){
 const shades=REFC_PTYPE_SHADES[type-1];
 if(!shades)return '#00000000';
 const t=Math.max(0,Math.min(1,(dbz-10)/60));
 if(type===1){
  // Reserve amber/orange for the strongest rain; no red/magenta that could
  // be confused with freezing rain. Preserve other Ptype classes exactly.
  const stops=[0,.40,.72,1],i=t<stops[1]?0:t<stops[2]?1:2;
  return mixHexColors(shades[i],shades[i+1],(t-stops[i])/(stops[i+1]-stops[i]));
 }
 return t<=.5?mixHexColors(shades[0],shades[1],t*2):mixHexColors(shades[1],shades[2],(t-.5)*2);
}
function reflectivityPtypePalette(){
 const levels=[10],colors=[];
 for(let type=1;type<=5;type++){
  const base=(type-1)*80;
  for(let dbz=10;dbz<80;dbz+=5){
   colors.push(reflectivityPtypeColor(type,Math.min(dbz+2.5,70)));
   levels.push(base+dbz+5);
  }
  // Between type classes, leave a transparent color interval rather
  // than interpolating across unrelated precipitation categories.
  if(type<5){colors.push('#00000000');levels.push(type*80+10);}
 }
 return{levels,colors,banded:true};
}
function blendReflectivityPtype(reflectivity,ptype){
 if(reflectivity.length!==ptype.length)throw Error('Reflectivity/Ptype grid size mismatch');
 const out=new Float32Array(reflectivity.length);
 for(let i=0;i<out.length;i++){
  const d=reflectivity[i],kind=ptype[i],code=Math.round(kind);
  out[i]=Number.isFinite(d)&&d>=10&&d<1e9&&Number.isFinite(kind)&&Math.abs(kind-code)<.01&&code>=1&&code<=5
   ?(code-1)*80+Math.min(d,79.9):-1e10;
 }
 return out;
}
function basePal(m,v){
 if(m.ptypeReflectivity)return reflectivityPtypePalette();
 if(m.ptype)return{levels:[.5,1.5,2.5,3.5,4.5,5.5],colors:PTYPE.slice(1)};
 if(m.category&&m.ensembleMeanFraction){
  const colors=['#14253b', '#294b67', '#477c9b', '#77b2c9',m.category];
  return{levels:[.01,.10,.25,.50,.75,1.01],colors};
 }
 if(m.category)return{levels:[.5,1.5],colors:[m.category]};
 if(m.levels&&m.bandColors){
  return {levels:m.levels.slice(),colors:sampledColors(m.bandColors,m.levels.length-1),banded:true};
 }
 const stops=(m.colors||[[0,'#3165a8'],[1,'#efa53c']]).map(([x,c])=>[m.fraction?m.min+x*(m.max-m.min):x,c]).sort((a,b)=>a[0]-b[0]);
 function col(v){if(v<=stops[0][0])return stops[0][1];if(v>=stops.at(-1)[0])return stops.at(-1)[1];let i=0;while(i<stops.length-2&&v>stops[i+1][0])i++;const [x,ca]=stops[i],[y,cb]=stops[i+1],t=(v-x)/(y-x||1);const hex=h=>[1,3,5].map(j=>parseInt(h.slice(j,j+2),16));const a=hex(ca),b=hex(cb);return '#'+a.map((c,j)=>Math.round(c+(b[j]-c)*t).toString(16).padStart(2,'0')).join('');}
 const lo=Math.max(m.min,m.cutoff??m.min),hi=m.max,n=64;
 return{levels:Array.from({length:n+1},(_,i)=>lo+(hi-lo)*i/n),colors:Array.from({length:n},(_,i)=>col(lo+(hi-lo)*(i+.5)/n))};
}
// Field-level, presentation-only color scale overrides. Palette *colors* and
// their relative stop positions are preserved; only numerical breakpoints move.
// This does not modify Zarr data, GPU sampling, or meteorological calculations.
function adjustableColorbar(m){
 return !!m&&!m.ptype&&!m.ptypeReflectivity&&!m.category;
}
function paletteRange(p){return {min:p.levels[0],max:p.levels.at(-1)};}
// Carve a narrow, truly transparent band around *physical zero*, even if
// a user stretches the colorbar range. Insert boundaries into the exact band
// colors used by autumnplot-gl; the rest of the palette remains unchanged.
// This applies equally to live GPU plots and PNG/GIF colorbar exports.
function clearZeroBand(p,threshold){
 if(!(Number.isFinite(threshold)&&threshold>0)||!p?.levels?.length||!p.colors?.length)return p;
 const levels=p.levels,colors=p.colors;
 if(levels.length!==colors.length+1)return p;
 const low=-threshold,high=threshold;
 if(levels[0]>=high||levels.at(-1)<=low)return p;
 const edges=[levels[0]],shade=[];
 for(let i=0;i<colors.length;i++){
  const a=levels[i],b=levels[i+1];
  if(!(Number.isFinite(a)&&Number.isFinite(b)&&b>a))return p;
  const cuts=[a];
  if(low>a&&low<b)cuts.push(low);
  if(high>a&&high<b)cuts.push(high);
  cuts.push(b);
  for(let j=1;j<cuts.length;j++){
   const left=cuts[j-1],right=cuts[j],mid=(left+right)/2;
   shade.push(mid>=low&&mid<high?'#00000000':colors[i]);
   edges.push(right);
  }
 }
 return {...p,levels:edges,colors:shade};
}
function pal(m,v){
 const base=basePal(m,v),selected=adjustableColorbar(m)?st.colorRanges.get(st.field):null;
 let result=base;
 if(selected){
  const {min,max}=paletteRange(base);
  if(Number.isFinite(min)&&Number.isFinite(max)&&max>min&&selected.max>selected.min){
   const scale=(selected.max-selected.min)/(max-min);
   result={...base,levels:base.levels.map((x,i)=>i===0?selected.min:i===base.levels.length-1?selected.max:selected.min+(x-min)*scale)};
  }
 }
 return clearZeroBand(result,m.clearZero);
}
// The palette mapping is independent of displayed tick labels. Numeric ranges
// are edited in a modal; no guessing min/max values from click positions.
function formatColorbarValue(value){
 return Number(value.toFixed(Math.abs(value)>=100?0:Math.abs(value)>=1?2:4)).toString();
}
function closeLegendRangeEditor(){
 if(el.legendRangePopup?.open)el.legendRangePopup.close();
 if(el.legendRangePopup)el.legendRangePopup.hidden=true;
 st.legendSelection=null;
}
function cancelLegendRangeSelection(){closeLegendRangeEditor();updateSharedLegend();}
function refreshColorbarRange(){
 for(const p of st.panels)p.lastKey=null;
 updateSharedLegend();
 void renderAll();
}
// Slider steps use meteorologically readable increments. Number boxes can
// accept finer values without constraining the range of the color map.
function colorbarSliderStep(min,max){
 const span=max-min;
 if(span>=1500)return 50;
 if(span>=150)return 5;
 if(span>=15)return .5;
 if(span>=2)return .1;
 return .01;
}
function legendEditorBounds(base,custom){
 const span=Math.max(1e-6,base.max-base.min);
 const low=Math.min(base.min,custom?.min??base.min);
 const high=Math.max(base.max,custom?.max??base.max);
 const pad=span*.5;
 const floor=base.min>=0?0:Math.floor((low-pad)/span)*span;
 return {min:Math.min(floor,low),max:Math.max(high+pad,base.max+pad)};
}
function legendEditorValues(){
 return {min:Number(el.legendMinNumber.value),max:Number(el.legendMaxNumber.value)};
}
function validateLegendEditor(){
 const values=legendEditorValues();
 const valid=el.legendMinNumber.value.trim()!==''&&el.legendMaxNumber.value.trim()!==''&&Number.isFinite(values.min)&&Number.isFinite(values.max)&&values.max>values.min;
 el.legendRangeError.hidden=valid;
 el.legendRangeApplyBtn.disabled=!valid;
 return valid;
}
function openLegendRangeEditor(m){
 if(!adjustableColorbar(m))return;
 const original=basePal(m,{name:st.field});
 const base=paletteRange(original);
 const previous=st.colorRanges.get(st.field)||base;
 const bounds=legendEditorBounds(base,previous);
 const step=colorbarSliderStep(base.min,base.max);
 for(const slider of [el.legendMinSlider,el.legendMaxSlider]){
  slider.min=String(bounds.min);slider.max=String(bounds.max);slider.step=String(step);
 }
 for(const number of [el.legendMinNumber,el.legendMaxNumber])number.step='any';
 el.legendMinSlider.value=String(previous.min);el.legendMinNumber.value=String(previous.min);
 el.legendMaxSlider.value=String(previous.max);el.legendMaxNumber.value=String(previous.max);
 el.legendRangeMessage.textContent=`${m.label} (${m.unit||'unitless'}). Default: ${formatColorbarValue(base.min)} to ${formatColorbarValue(base.max)}. Changes affect shading and exports, not data.`;
 el.legendRangePopup.dataset.field=st.field;
 validateLegendEditor();
 el.legendRangePopup.hidden=false;
 if(!el.legendRangePopup.open)el.legendRangePopup.showModal();
 el.legendMinNumber.focus();el.legendMinNumber.select();
}
function applyLegendRangeEditor(){
 if(!validateLegendEditor())return;
 if(el.legendRangePopup.dataset.field!==st.field){closeLegendRangeEditor();return;}
 const values=legendEditorValues();
 st.colorRanges.set(st.field,values);
 closeLegendRangeEditor();
 refreshColorbarRange();
}
function bindLegendRangeControls(){
 el.sharedLegendCanvas.addEventListener('click',()=>{
  const data=sharedPalette();if(data)openLegendRangeEditor(data.m);
 });
 for(const name of ['Min','Max']){
  const slider=el['legend'+name+'Slider'];
  const number=el['legend'+name+'Number'];
  slider.addEventListener('input',()=>{number.value=slider.value;validateLegendEditor();});
  number.addEventListener('input',()=>{
   if(number.value!==''&&Number.isFinite(Number(number.value))){
    const v=Number(number.value);
    if(v<Number(slider.min))slider.min=number.value;
    if(v>Number(slider.max))slider.max=number.value;
    slider.value=number.value;
   }
   validateLegendEditor();
  });
 }
 el.legendRangeForm.addEventListener('submit',e=>{e.preventDefault();applyLegendRangeEditor();});
 el.legendCancelBtn.addEventListener('click',cancelLegendRangeSelection);
 el.legendRangeResetBtn.addEventListener('click',()=>{
  if(el.legendRangePopup.dataset.field!==st.field){closeLegendRangeEditor();return;}
  st.colorRanges.delete(st.field);closeLegendRangeEditor();refreshColorbarRange();
 });
 el.legendResetBtn.addEventListener('click',()=>{
  st.colorRanges.delete(st.field);closeLegendRangeEditor();refreshColorbarRange();
 });
 el.legendRangePopup.addEventListener('close',()=>{el.legendRangePopup.hidden=true;st.legendSelection=null;});
}
function imageColorAlpha(hex,opacity){
 if(!/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/.test(hex))return hex;
 const original=hex.length===9?parseInt(hex.slice(7),16)/255:1;
 return hex.slice(0,7)+Math.round(255*opacity*original).toString(16).padStart(2,'0');
}
function makeColormap(m,v){
 const o=pal(m,v),opacity=st.imageOpacity;
 return new apgl.ColorMap(o.levels,o.colors.map(c=>imageColorAlpha(c,opacity)),
  {underflow_color:'#00000000',overflow_color:imageColorAlpha(o.colors.at(-1),opacity)});
}
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

// The overlay samples the *decoded scalar field* at projected screen points;
// rebuilding the isolines whenever MapLibre moves keeps them aligned in both
// Mercator and Globe projections. Raster shading and Zarr remain unchanged.
// Conventional field-specific isolines. Zoom controls which standard interval
// to use; viewport variability and size may coarsen it further to avoid clutter.
// All numerical values below are in the display units used by RawScalarField.
const CONTOUR_STEPS={
 mslp:[4,4,4],
 t2m:[10,5,2],dpt2m:[10,5,2],
 t925:[5,2,1],t850:[5,2,1],t700:[5,2,1],absv500:[10,5,5],wspd300:[20,10,5],
 h925:[30,30,30],h850:[30,30,30],h700:[30,30,30],h500:[60,60,60],h300:[120,120,120],
 rh2m:[20,10,5],wspd10:[10,5,2],gust:[10,5,2],
 u10:[10,5,2],v10:[10,5,2],refc:[10,5,5],prate:[10,5,2],
 cpofp:[20,10,5],snowc:[20,10,5],sden:[100,50,25],
 // Severe-weather scalars were previously excluded from the contour control.
 // Base intervals are in display units and are thinned further for small maps.
 sbcape:[1000,500,250],mlcape:[1000,500,250],mucape:[1000,500,250],
 shear01:[20,10,5],shear06:[20,10,5],srh01:[100,50,25],srh03:[100,50,25],
 mxuphl:[100,50,25],mxuphl_run:[100,50,25],
 scp:[5,2,1],stp:[2,1,.5],stp_fixed:[2,1,.5]
};
const CONTOUR_STANDARD_STEPS=[.25,.5,1,2,2.5,5,10,20,25,50,100,200,250,500,1000,2000];
const CONTOUR_PRECIP=[.01,.05,.10,.25,.5,.75,1,1.5,2,3,4,5,7,10,15,20];
const CONTOUR_PRECIP_COARSE=[.05,.10,.25,.5,1,2,3,5,10,20];
const CONTOUR_SNOW=[.5,1,2,4,6,8,12,18,24,36,48,72];
const CONTOUR_SNOW_COARSE=[1,2,4,8,12,24,36,48,72];
const NO_CONTOURS=new Set(['ptype','refc_ptype','csnow','cicep','cfrzr','crain','snowpresence']);
function contoursAvailable(field=st.field){return Boolean(field&&!NO_CONTOURS.has(field)&&
 (CONTOUR_STEPS[field]||['apcp','apcp1h','apcp3h','apcp6h','apcp24h','apcp48h','asnow','snow1h','snow3h','snow6h','snow24h','snow48h','snod','weasd','frozr','frzr','tsnowp'].includes(field)));}
function contourTier(zoom){return zoom<3.6?0:zoom<6?1:2;}
function contourInterval(field,zoom){const steps=CONTOUR_STEPS[field];return steps?steps[contourTier(zoom)]:null;}
function overlayHeightVisible(field=st.field){return Boolean(heightVariableName(field)&&st.overlayHeight);}
function overlayWindVisible(field=st.field){
 return Boolean(heightVariableName(field)?st.overlayUpperWind:field==='wspd10'&&st.overlaySurfaceWind);
}
function updateContourControl(){
 if(!el.contourControl)return;
 const linesAvailable=contoursAvailable();
 const reportsAvailable=observationVisible();
 const spcAvailable=SPC_FIELDS.has(st.field);
 el.spcControl.hidden=!spcAvailable;
 el.spcCount.hidden=!spcAvailable;
 el.spcToggleBtn.checked=st.spcEnabled;
 const heightAvailable=Boolean(heightVariableName(st.field));
 const windAvailable=Boolean(windComponentNames(st.field));
 el.contourControl.hidden=!(linesAvailable||reportsAvailable||heightAvailable||windAvailable||st.field==='mslp');
 el.heightOption.hidden=!heightAvailable;
 el.windOption.hidden=!windAvailable;
 el.contourOption.hidden=!linesAvailable;
 el.mslp850Option.hidden=st.field!=='mslp';
 el.mslp850ToggleBtn.checked=st.overlayMSLP850;
 el.obsControl.hidden=!reportsAvailable;
 el.obsCount.hidden=!reportsAvailable;
 el.obsAttribution.hidden=!reportsAvailable;
 el.heightToggleBtn.checked=st.overlayHeight;
 el.windToggleBtn.checked=heightAvailable?st.overlayUpperWind:st.overlaySurfaceWind;
 el.contourToggleBtn.checked=st.field==='mslp'?st.overlayMSLP:st.contours;
 const interval=contourInterval(st.field,st.active?.find(p=>p.map)?.map?.getZoom?.()??3);
 const m=FIELDS[st.field];
 el.contourToggleBtn.title=`Draw labeled ${m?.label||st.field} contours (${interval?`${interval} ${m?.unit||''} base interval; adapts to map scale`:'standard field thresholds; adapts to map scale'})`;
}
function suspendContours(p){
 if(!p?.contourCanvas)return;
 if(p.contourRedrawTimer!==null){clearTimeout(p.contourRedrawTimer);p.contourRedrawTimer=null;}
 if(p.contourRafId!==null){cancelAnimationFrame(p.contourRafId);p.contourRafId=null;}
 p.contourFrameRequested=false;
 p.contourCanvas.style.visibility='hidden';
}
function clearContours(p){
 suspendContours(p);
 if(p.contourCanvas){const c=p.contourCanvas;
  c.getContext('2d')?.clearRect(0,0,c.width,c.height);}
}
function contourLevels(field,minimum,maximum,zoom=3,width=400,height=250){
 if(!Number.isFinite(minimum)||!Number.isFinite(maximum)||maximum<=minimum)return [];
 const limit=Math.max(6,Math.min(20,Math.floor(Math.sqrt(width*height)/31)));
 if(['apcp','apcp1h','apcp3h','apcp6h','apcp24h','apcp48h','weasd','frozr','frzr','tsnowp','asnow','snod'].includes(field)){
  const snow=field==='asnow'||field.startsWith('snow')||field==='snod';
  const standard=snow?CONTOUR_SNOW:CONTOUR_PRECIP;
  const coarse=snow?CONTOUR_SNOW_COARSE:CONTOUR_PRECIP_COARSE;
  let levels=(zoom<3.6?coarse:standard).filter(v=>v>minimum&&v<maximum);
  if(levels.length>limit){
   // Choose actual conventional thresholds, not arbitrary interpolated values.
   const n=Math.ceil(levels.length/limit);
   levels=levels.filter((_,i)=>i%n===0);
  }
  return levels;
 }
 const base=contourInterval(field,zoom);if(!base)return [];
 // Isobars and geopotential heights must use conventional meteorological
 // increments. Scale-dependent thinning may only select INTEGER MULTIPLES of
 // the 4-hPa, 30-gpm, or 60-gpm base; never arbitrary 5/25/50-hPa/m steps.
 if(field==='mslp'||/^h(?:925|850|700|500|300)$/.test(field)){
  let step=base;
  const maxLines=Math.max(6,Math.min(20,Math.floor(Math.sqrt(width*height)/31)));
  // Preserve standard grid phase: 1000/1004-hPa and 5400/5460-gpm etc.
  for(const multiplier of [1,2,3,4,5,6,8,10,12,16,20,24,30,40,60,80,100]){
   step=base*multiplier;
   if(Math.floor(maximum/step)-Math.floor(minimum/step)<=maxLines)break;
  }
  const levels=[],start=Math.ceil((minimum+1e-8)/step)*step;
  for(let v=start;v<maximum&&levels.length<=maxLines+1;v+=step)
   if(v>minimum+1e-8)levels.push(Number(v.toFixed(5)));
  return levels;
 }
 const candidate=CONTOUR_STANDARD_STEPS.filter(x=>x>=base-1e-7);
 let increment=candidate[candidate.length-1];
 for(const step of candidate){
  increment=step;
  if(Math.floor(maximum/step)-Math.floor(minimum/step)<=limit)break;
 }
 const start=Math.ceil((minimum+1e-9)/increment)*increment,levels=[];
 for(let v=start;v<maximum&&levels.length<=limit+1;v+=increment)
  if(v>minimum+1e-8)levels.push(Number(v.toFixed(5)));
 return levels;
}

// Trace a contour through the projected viewport, with one vertex for each
// interpolated *grid edge crossing*. Nodes are keyed by the physical edge,
// allowing segments from adjacent cells to join without coordinate rounding.
// For saddle cells the bilinear cell-center sign chooses the correct pairing.
function contourPaths(values,cols,rows,dx,dy,level){
 const nodes=new Map(),pitch=cols+1;
 function join(a,b){
  if(!a||!b||a.id===b.id)return;
  for(const [v,neighbor] of [[a,b.id],[b,a.id]]){
   let node=nodes.get(v.id);
   if(!node){node={x:v.x,y:v.y,next:[]};nodes.set(v.id,node);}
   if(!node.next.includes(neighbor))node.next.push(neighbor);
  }
 }
 for(let iy=0;iy<rows;iy++)for(let ix=0;ix<cols;ix++){
  const a=iy*pitch+ix;
  const v=[values[a],values[a+1],values[a+pitch+1],values[a+pitch]];
  if(!v.every(Number.isFinite))continue;
  const low=Math.min(...v),high=Math.max(...v);
  if(low>=level||high<level)continue;
  const side=v.map(z=>z>=level),edges=[];
  for(let e=0;e<4;e++)if(side[e]!==side[(e+1)%4])edges.push(e);
  if(edges.length!==2&&edges.length!==4)continue;
  function crossing(e){
   const next=(e+1)%4;
   const t=Math.max(0,Math.min(1,(level-v[e])/(v[next]-v[e])));
   switch(e){
    case 0:return {id:`h${iy}:${ix}`,x:(ix+t)*dx,y:iy*dy};
    case 1:return {id:`v${iy}:${ix+1}`,x:(ix+1)*dx,y:(iy+t)*dy};
    case 2:return {id:`h${iy+1}:${ix}`,x:(ix+1-t)*dx,y:(iy+1)*dy};
    default:return{id:`v${iy}:${ix}`,x:ix*dx,y:(iy+1-t)*dy};
   }
  }
  if(edges.length===2){join(crossing(edges[0]),crossing(edges[1]));continue;}
  // At a bilinear saddle, isolate the corners whose sign differs from the
  // center, rather than pairing all four edges in arbitrary array order.
  const centerHigh=(v[0]+v[1]+v[2]+v[3])/4>=level;
  for(let corner=0;corner<4;corner++)if(side[corner]!==centerHigh)
   join(crossing((corner+3)%4),crossing(corner));
 }
 const paths=[],seen=new Set();
 function edgeId(a,b){return a<b?`${a}|${b}`:`${b}|${a}`;}
 function traverse(start,next){
  const points=[],first=nodes.get(start);if(!first)return;
  points.push([first.x,first.y]);
  let prev=start,cur=next;
  for(let n=0;n<=nodes.size;n++){
   const link=edgeId(prev,cur);if(seen.has(link))break;
   seen.add(link);
   const node=nodes.get(cur);if(!node)break;
   points.push([node.x,node.y]);
   const nextId=node.next.find(id=>!seen.has(edgeId(cur,id)));
   if(!nextId)break;
   prev=cur;cur=nextId;
  }
  if(points.length>=2)paths.push(points);
 }
 // Open lines first; closed loops are processed in the second pass.
 for(const [id,node] of nodes)if(node.next.length===1)
  for(const next of node.next)if(!seen.has(edgeId(id,next)))traverse(id,next);
 for(const [id,node] of nodes)for(const next of node.next)
  if(!seen.has(edgeId(id,next)))traverse(id,next);
 return paths;
}
function strokeContourPath(ctx,path){
 const n=path.length;if(n<2)return;
 ctx.moveTo(path[0][0],path[0][1]);
 if(n===2){ctx.lineTo(path[1][0],path[1][1]);return;}
 // Quadratic midpoint interpolation rounds sampled-cell corners smoothly while
 // retaining level-crossing coordinates; no expensive geographic regridding.
 for(let i=1;i<n-1;i++)ctx.quadraticCurveTo(path[i][0],path[i][1],
   (path[i][0]+path[i+1][0])/2,(path[i][1]+path[i+1][1])/2);
 ctx.lineTo(path[n-1][0],path[n-1][1]);
}
function contourLabel(level){
 return Math.abs(level)>=1?String(Number(level.toFixed(1))):String(Number(level.toFixed(3)));
}
function contourLabelPosition(path,fraction){
 let total=0;const arc=[];
 for(let i=1;i<path.length;i++){
  const [a,b]=[path[i-1],path[i]],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  arc.push(length);total+=length;
 }
 if(!total)return null;
 let remaining=total*fraction;
 for(let i=0;i<arc.length;i++){
  if(remaining>arc[i]){remaining-=arc[i];continue;}
  const a=path[i],b=path[i+1],t=arc[i]?remaining/arc[i]:0;
  const x=a[0]+t*(b[0]-a[0]),y=a[1]+t*(b[1]-a[1]);
  // Use neighboring segments when available to orient the label along the
  // local curve instead of a single very short grid-edge crossing.
  const before=path[Math.max(0,i-1)],after=path[Math.min(path.length-1,i+2)];
  let angle=Math.atan2(after[1]-before[1],after[0]-before[0]);
  if(angle>Math.PI/2)angle-=Math.PI;
  if(angle< -Math.PI/2)angle+=Math.PI;
  return {x,y,angle,total};
 }
 return null;
}
function drawContours(p,{field=p.contourField||p.rawField,key=p.cfg?.field||st.field,append=false,always=false,exportScale=1}={}){
 const canvas=p.contourCanvas,map=p.map;
 if(!canvas||!map)return;
 const w=map.getContainer().clientWidth||map.getCanvas().clientWidth;
 const h=map.getContainer().clientHeight||map.getCanvas().clientHeight;
 if(!(w>0&&h>0))return;
 const dpr=Math.min(2,devicePixelRatio||1),dw=Math.round(w*dpr),dh=Math.round(h*dpr);
 if(canvas.width!==dw)canvas.width=dw;if(canvas.height!==dh)canvas.height=dh;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);if(!append)ctx.clearRect(0,0,w,h);
 const plottedField=key;
 const heightContour=/^h(?:925|850|700|500|300)$/.test(plottedField);
 const isobarContour=plottedField==='mslp';
 const upperAirScalar=['t925','t850','t700','absv500','wspd300'].includes(plottedField);
 const dashedScalar=(upperAirScalar||plottedField==='wspd300')&&!heightContour;
 if((!st.contours&&!always)||!contoursAvailable(plottedField)||!field||p.status==='missing'||p.status==='error')return;
 const moving=Boolean(map.isMoving?.());
 // Higher screen-space sampling density at rest yields smoother curves, without
 // requiring more Zarr reads. Lower interactive density protects responsiveness.
 const spacing=Math.max(moving?19:10,Math.sqrt(w*h/12500));
 const cols=Math.max(2,Math.ceil(w/spacing)),rows=Math.max(2,Math.ceil(h/spacing));
 const dx=w/cols,dy=h/rows,pitch=cols+1;
 const values=new Float32Array(pitch*(rows+1));
 let min=Infinity,max=-Infinity;
 for(let iy=0;iy<=rows;iy++)for(let ix=0;ix<=cols;ix++){
  const x=ix*dx,y=iy*dy,i=iy*pitch+ix;
  try{
   const pos=map.unproject([x,y]);
   if(!Number.isFinite(pos.lng)||!Number.isFinite(pos.lat)||
    !globeFrontVisible(map,pos.lng,pos.lat)){values[i]=NaN;continue;}
   const v=Number(field.sampleField(pos.lng,pos.lat));
   if(!Number.isFinite(v)||v < -1e9){values[i]=NaN;continue;}
   values[i]=v;min=Math.min(min,v);max=Math.max(max,v);
  }catch(_){values[i]=NaN;}
 }
 // A gentle cross stencil limits aliasing in pixel-space isolines. It never
 // fills data gaps, changes missing-data masks, or alters the shaded grid.
 // For precipitation/reflectivity avoid filtering small extrema altogether.
 const smooth=!['refc','prate','apcp','apcp1h','apcp3h','apcp6h','apcp24h','apcp48h','weasd','frozr','frzr','tsnowp'].includes(plottedField);
 if(smooth){
  const filtered=values.slice();
  for(let iy=1;iy<rows;iy++)for(let ix=1;ix<cols;ix++){
   const i=iy*pitch+ix,c=values[i],n=values[i-pitch],s=values[i+pitch],e=values[i+1],w0=values[i-1];
   if([c,n,s,e,w0].every(Number.isFinite))filtered[i]=.82*c+.045*(n+s+e+w0);
  }
  values.set(filtered);
 }
 const levels=contourLevels(plottedField,min,max,map.getZoom?.()??3,w,h);
 if(!levels.length)return;
 const all=[];
 for(const level of levels){
  const paths=contourPaths(values,cols,rows,dx,dy,level);
  if(paths.length)all.push({level,paths});
 }
 if(!all.length)return;
 ctx.lineJoin='round';
 // Export renders the map at a much larger size than the live panel. Scale
 // the overlay strokes in *export CSS pixels*, not just the canvas bitmap;
 // otherwise compositing the contour PNG produces hairline isolines.
 const strokeScale=Number.isFinite(exportScale)?Math.max(1,Math.min(3,exportScale)):1;
 const exportContours=strokeScale>1.001;
 // Dashed lines need real clear gaps: rounded caps in a thick pale halo
 // nearly close a short dash gap once the overlay is resampled to the PNG.
 // Keep the existing live contour appearance untouched.
 ctx.lineCap=exportContours&&dashedScalar?'butt':'round';
 // Heights: dark SOLID core with a pale halo, opposite to the
 // temperature/other shaded-field contours. The optional upper-air scalar
 // isolines use matching DASHED halo + core, so their styles cannot merge.
 const lineColors=(heightContour||isobarContour)
  ? ['rgba(255,255,255,.96)','rgba(11,24,38,.96)']
  : [st.theme==='dark'?'rgba(5,17,30,.94)':'rgba(255,255,255,.95)',
     st.theme==='dark'?'rgba(251,253,255,.94)':'rgba(15,30,45,.90)'];
 const dash=dashedScalar?(exportContours?[9*strokeScale,7*strokeScale]:[6,4]):[];
 ctx.save();
 ctx.setLineDash(dash);
 for(const [width,color] of ((heightContour||isobarContour)?[[4.8,lineColors[0]],[2.1,lineColors[1]]]:[[3.2,lineColors[0]],[1.35,lineColors[1]]])){
  ctx.beginPath();ctx.lineWidth=width*strokeScale;ctx.strokeStyle=color;
  for(const {paths} of all)for(const path of paths)strokeContourPath(ctx,path);
  ctx.stroke();
 }
 ctx.restore();
 // Label connected paths, including small normal panels; never label each
 // individual marching-squares segment. Gap/halo keep numerals legible.
 const fontSize=Math.max(10,Math.min(13.5,9.8+Math.sqrt(w*h)/320)) * (exportContours?Math.min(1.35,Math.sqrt(strokeScale)):1);
 ctx.font=`600 ${fontSize.toFixed(1)}px Arial, sans-serif`;
 ctx.textAlign='center';ctx.textBaseline='middle';
 const used=[],maxLabels=Math.max(2,Math.min(16,Math.floor(w*h/34000)));
 const candidates=all.flatMap(({level,paths})=>paths.map(path=>({level,path,
  length:path.reduce((acc,pt,i)=>i?acc+Math.hypot(pt[0]-path[i-1][0],pt[1]-path[i-1][1]):acc,0)})));
 candidates.sort((a,b)=>b.length-a.length);
 for(const {level,path,length} of candidates){
  if(used.length>=maxLabels)break;
  const label=contourLabel(level),tw=ctx.measureText?.(label)?.width||label.length*fontSize*.65;
  if(length<Math.max(58,tw+38))continue;
  const positions=length>500?[.5,.22,.78]:[.5,.32,.68];
  for(const fraction of positions){
   const pt=contourLabelPosition(path,fraction);if(!pt)continue;
   const {x,y,angle}=pt;
   if(x<tw/2+8||x>w-tw/2-8||y<fontSize+7||y>h-fontSize-7)continue;
   if(used.some(v=>Math.hypot(x-v[0],y-v[1])<Math.max(84,tw+36)))continue;
   ctx.save();ctx.translate(x,y);ctx.rotate(angle);
   ctx.lineWidth=3.6*(exportContours?Math.min(1.35,Math.sqrt(strokeScale)):1);ctx.lineJoin='round';
   ctx.strokeStyle=(heightContour||isobarContour)?'rgba(255,255,255,.98)':st.theme==='dark'?'rgba(5,17,30,.98)':'rgba(255,255,255,.98)';
   ctx.strokeText(label,0,0);
   ctx.fillStyle=(heightContour||isobarContour)?'#0b1826':st.theme==='dark'?'#fff':'#102637';ctx.fillText(label,0,0);
   ctx.restore();used.push([x,y]);
   break; // One label per line before moving to the next geographic contour.
  }
 }
}
function scheduleContourRedraw(p,settleMs=0){
 if(!p?.contourCanvas||!p.map)return;
 // A new redraw replaces any older request (a rapidly repeated wheel zoom,
 // a camera sync from another panel, or a new forecast hour).
 if(p.contourRedrawTimer!==null){clearTimeout(p.contourRedrawTimer);p.contourRedrawTimer=null;}
 if(p.contourRafId!==null){cancelAnimationFrame(p.contourRafId);p.contourRafId=null;}
 p.contourFrameRequested=false;
 const plottedField=p.cfg?.field||st.field;
 const canHeight=!!(overlayHeightVisible(plottedField)&&p.heightField);
 const alwaysMSLP=plottedField==='mslp'&&st.overlayMSLP;
 const mslp850=plottedField==='mslp'&&st.overlayMSLP850&&!!p.temperature850Field;
 if((!st.contours&&!canHeight&&!alwaysMSLP&&!mslp850)||(!contoursAvailable(plottedField)&&!canHeight&&!alwaysMSLP&&!mslp850)||!p.rawField||p.status==='missing'||p.status==='error'){
  clearContours(p);return;
 }
 if(p.map.isMoving?.()){suspendContours(p);return;}
 const map=p.map;
 const afterQuiet=()=>{
  p.contourRedrawTimer=null;
  if(p.map!==map||!p.contourCanvas)return;
  if(map.isMoving?.()){suspendContours(p);return;}
  // Explicit PNG capture draws contours independently at export resolution;
  // its finally block requests the normal on-screen redraw after restoring
  // the camera, so don't compete for the main thread here.
  if(st.exportRender)return;
  p.contourFrameRequested=true;
  p.contourRafId=requestAnimationFrame(()=>{
   p.contourRafId=null;p.contourFrameRequested=false;
   if(p.map!==map||!p.contourCanvas)return;
   if(map.isMoving?.()){suspendContours(p);return;}
   if(st.exportRender)return;
   const fieldName=p.cfg?.field||st.field;
   const heightKey=heightVariableName(fieldName);
   if(overlayHeightVisible(fieldName)&&heightKey&&p.heightField){
    drawContours(p,{field:p.heightField,key:heightKey,always:true});
    if(st.contours&&contoursAvailable(fieldName))drawContours(p,{field:p.contourField||p.rawField,key:fieldName,append:true});
   }else if(fieldName==='mslp'){
    let drew=false;
    if(st.overlayMSLP){drawContours(p,{always:true});drew=true;}
    if(st.overlayMSLP850&&p.temperature850Field){drawContours(p,{field:p.temperature850Field,key:'t850',always:true,append:drew});drew=true;}
    if(!drew){clearContours(p);return;}
   }
   else if(st.contours&&contoursAvailable(fieldName))drawContours(p);
   else{clearContours(p);return;}
   // Reveal only once the fully updated contour/label overlay is complete.
   p.contourCanvas.style.visibility='visible';
  });
 };
 if(settleMs>0)p.contourRedrawTimer=setTimeout(afterQuiet,settleMs);
 else afterQuiet();
}

// Optional individual-PNG rendering overrides are expressed in the temporary
// export viewport's CSS pixels. Normal and nine-panel drawing is unchanged.
function drawWindBarbs(p,exportStyle=null){
 const c=p.windCanvas,m=p.map;if(!c||!m)return;
 const w=m.getCanvas().clientWidth||p.view.clientWidth,h=m.getCanvas().clientHeight||p.view.clientHeight;
 if(!(w>0&&h>0))return;
 const dpr=Math.min(2,window.devicePixelRatio||1),cw=Math.max(1,Math.round(w*dpr)),ch=Math.max(1,Math.round(h*dpr));
 if(c.width!==cw)c.width=cw;if(c.height!==ch)c.height=ch;
 const ctx=c.getContext('2d');if(!ctx)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 if(!p.wind||!windComponentNames(p.cfg?.field||st.field)||!overlayWindVisible(p.cfg?.field||st.field))return;
 const {u,v}=p.wind;
 const zoom=m.getZoom();
 const spacing=exportStyle?.spacingPx>0?exportStyle.spacingPx:barbSpacing(zoom);
 const size=exportStyle?.sizePx>0?exportStyle.sizePx:Number(st.cfg?.display?.windBarbSizePx??18);
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
  if(speed<2.5){paintBarb(ctx,x,y,0,-1,speed,size);continue;}
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
  paintBarb(ctx,x,y,dx,dy,speed,size);
 }
 ctx.shadowBlur=0;
}
// Keep tiny temporary-CSS glyphs legible after the output PNG is scaled.
function paintBarb(ctx,x,y,dx,dy,speed,size){
 if(size>=14){barbGeometry(ctx,x,y,dx,dy,speed,size);return;}
 ctx.save();
 ctx.translate(x,y);
 const scale=size/18;
 ctx.scale(scale,scale);
 barbGeometry(ctx,0,0,dx,dy,speed,18);
 ctx.restore();
}
function scheduleWindRedraw(p){
 if(!p?.windCanvas||p.windFrameRequested)return;
 p.windFrameRequested=true;
 requestAnimationFrame(()=>{p.windFrameRequested=false;if(p.map)drawWindBarbs(p);});
}
function clearWindBarbs(p){p.wind=null;if(p.windCanvas){const ctx=p.windCanvas.getContext('2d');ctx?.clearRect(0,0,p.windCanvas.width,p.windCanvas.height);}}
function windComponentNames(field){
 const level=field==='t925'?925:field==='t850'?850:field==='t700'?700:field==='absv500'?500:field==='wspd300'?300:0;
 return level?['u'+level,'v'+level]:field==='wspd10'?['u10','v10']:null;
}
function heightVariableName(field){return field==='t925'?'h925':field==='t850'?'h850':field==='t700'?'h700':field==='absv500'?'h500':field==='wspd300'?'h300':null;}
// Secondary MSLP overlay: temperature is selected from a compatible source
// catalog at the *same valid time*, even when analysis MSLP and RAP 850 hPa
// reside in separate aligned-analysis products.
async function prepareMSLP850Contours(p,ds,h,seq){
 if(!st.overlayMSLP850||!p.map||p.cfg?.field&&p.cfg.field!=='mslp'||st.field!=='mslp'||!ds)return;
 const candidates=[ds,...(p.src?.datasets||[]).filter(d=>d!==ds)];
 const time=cycleKey(ds.init_time);
 const matching=candidates.find(d=>cycleKey(d.init_time)===time&&
  d.variables?.some(v=>v.name==='t850'&&v.available_hours?.includes(p.cfg.timeMode==='analysis'?0:h)));
 if(!matching)return;
 const hour=p.cfg.timeMode==='analysis'?0:h;
 const v=matching.variables.find(v=>v.name==='t850'&&v.available_hours.includes(hour));
 if(!v)return;
 try{
  const values=await getDisplayData(p.src,matching,v,hour,fieldInfo(v),()=>{});
  if(seq!==st.seq||!p.map||st.field!=='mslp')return;
  p.temperature850Field=new apgl.RawScalarField(gridForPanel(p,matching,v),values);
  updatePanelPlotTitle(p);scheduleContourRedraw(p);
 }catch(e){console.warn('MSLP 850-hPa temperature overlay unavailable',e);}
}
function overlayPlotDescriptor(p){
 const field=p?.cfg?.field||st.field;
 if(field==='mslp'){
  const layers=['MSLP shading'];
  if(st.overlayMSLP&&p?.rawField)layers.push('MSLP isobars');
  if(st.overlayMSLP850&&p?.temperature850Field)layers.push('850-hPa temperature (dashed)');
  return layers.join(' + ');
 }
 const parts=[FIELDS[field]?.label||field];
 if(heightVariableName(field)&&st.overlayHeight&&p?.heightField)parts.push('height');
 if(windComponentNames(field)&&overlayWindVisible(field)&&p?.wind)parts.push('wind barbs');
 if(st.contours&&contoursAvailable(field))parts.push('shaded-field contours');
 return parts.join(' + ');
}
function updatePanelPlotTitle(p){
 if(!p?.title)return;
 p.title.textContent=panelDisplayTitle(p,overlayPlotDescriptor(p));
}
async function prepareHeightContours(p,ds,h,seq){
 const name=heightVariableName(p.cfg?.field||st.field);
 if(!name||!p.map)return;
 const v=ds.variables.find(v=>v.name===name&&v.available_hours.includes(h));
 if(!v)return;
 try{
  const values=await getDisplayData(p.src,ds,v,h,fieldInfo(v),()=>{});
  if(seq!==st.seq||!p.map)return;
  p.heightField=new apgl.RawScalarField(gridForPanel(p,ds,v),values);
  scheduleContourRedraw(p);
 }catch(e){console.warn(name+' height overlay unavailable',e);}
}
async function prepareWindBarbs(p,ds,h,seq){
 const names=windComponentNames(p.cfg?.field||st.field);
 if(!p.map||!names)return;
 const u=ds.variables.find(v=>v.name===names[0]),v=ds.variables.find(v=>v.name===names[1]);
 if(!u||!v||!u.available_hours.includes(h)||!v.available_hours.includes(h))return;
 try{
  const [ud,vd]=await Promise.all([
   getDisplayData(p.src,ds,u,h,fieldInfo(u),()=>{}),
   getDisplayData(p.src,ds,v,h,fieldInfo(v),()=>{})
  ]);
  if(seq!==st.seq||!p.map||!windComponentNames(p.cfg?.field||st.field))return;
  p.wind={u:new apgl.RawScalarField(gridForPanel(p,ds,u),ud),v:new apgl.RawScalarField(gridForPanel(p,ds,v),vd)};
  scheduleWindRedraw(p);
 }catch(e){console.warn('Wind barbs unavailable for '+p.cfg.label+':',e);}
}
// 500-hPa absolute-vorticity SHADING only. Model-specific, gentle display
// filtering improves visual comparability while preserving Zarr values,
// contour/difference computations and raw mouse sampling.
function vorticitySmoothingMeters(field,model,timeMode){
 if(field!=='absv500'||timeMode==='analysis')return 0;
 const name=String(model||'').trim().toLowerCase();
 const member=/^refs(?:[_\s-]+m0*[1-5]|[_\s-]+[1-5]|[_\s-]+member[_\s-]*0*[1-5])$/.test(name);
 if(name==='rrfs'||member)return 12000;
 if(name==='refs_mean'||/^refs[ _-]mean$/.test(name)||name==='hrrr')return 6000;
 return 0;
}
function shouldSmoothVorticity(field,model,timeMode){
 return vorticitySmoothingMeters(field,model,timeMode)>0;
}
function smoothVorticityForDisplay(data,ny,nx,grid,scaleMeters=12000){
 if(!(data instanceof Float32Array)||ny<3||nx<3||data.length!==nx*ny||scaleMeters<=0)return data;
 const dx=Math.max(1,Number(grid?.GRIB_DxInMetres||grid?.DxInMetres||3000));
 const dy=Math.max(1,Number(grid?.GRIB_DyInMetres||grid?.DyInMetres||3000));
 // Three separable box passes approximate a Gaussian; the smaller 6-km
 // radius is intentionally slight on HRRR and operational REFS Mean.
 const rx=Math.min(7,Math.max(1,Math.round(scaleMeters/dx)));
 const ry=Math.min(7,Math.max(1,Math.round(scaleMeters/dy)));
 const valid=v=>Number.isFinite(v)&&v>-1e9;
 let current=data;
 for(let pass=0;pass<3;pass++){
  const horizontal=new Float32Array(data.length);
  for(let y=0;y<ny;y++){
   const row=y*nx;let sum=0,count=0;
   for(let j=0;j<=rx&&j<nx;j++)if(valid(current[row+j])){sum+=current[row+j];count++;}
   for(let x=0;x<nx;x++){
    const idx=row+x;
    horizontal[idx]=valid(current[idx])&&count?sum/count:NaN;
    const old=x-rx,add=x+rx+1;
    if(old>=0&&valid(current[row+old])){sum-=current[row+old];count--;}
    if(add<nx&&valid(current[row+add])){sum+=current[row+add];count++;}
   }
  }
  const vertical=new Float32Array(data.length);
  for(let x=0;x<nx;x++){
   let sum=0,count=0;
   for(let j=0;j<=ry&&j<ny;j++)if(valid(horizontal[j*nx+x])){sum+=horizontal[j*nx+x];count++;}
   for(let y=0;y<ny;y++){
    const idx=y*nx+x;
    vertical[idx]=valid(horizontal[idx])&&count?sum/count:NaN;
    const old=y-ry,add=y+ry+1;
    if(old>=0&&valid(horizontal[old*nx+x])){sum-=horizontal[old*nx+x];count--;}
    if(add<ny&&valid(horizontal[add*nx+x])){sum+=horizontal[add*nx+x];count++;}
   }
  }
  current=vertical;
 }
 return current;
}
// Display-only snowfall trace and edge-artifact filtering. Missing numeric
// sentinels (including negative values and NaNs) must NOT be passed to the GPU
// as different finite negatives: interpolation against valid positive snowfall
// can otherwise paint stray colored pixels along data-coverage boundaries.
// A conservative 3x3 support check also removes isolated trace-level snow
// cells near blank areas, without touching coherent snowfall or larger values.
// The original arrays remain untouched for sampling, totals, contours,
// differences and every non-snowfall field.
function snowfallShadeData(data,field,metadata,shape){
 if(!/^snow(?:1h|3h|6h|24h|48h)$/.test(field)&&field!=='asnow')return data;
 const requested=st.colorRanges.get(field)?.min;
 const threshold=Number.isFinite(requested)?Math.max(1e-8,requested):Number(metadata?.levels?.[0]);
 if(!Number.isFinite(threshold)||threshold<=0)return data;
 const MISSING=-1e10;
 const validSnow=value=>Number.isFinite(value)&&value>=threshold*(1-1e-6);
 let shaded=null;
 for(let i=0;i<data.length;i++){
  if(!validSnow(data[i])){
   if(!shaded)shaded=data.slice();
   shaded[i]=MISSING;
  }
 }
 // Only apply the spatial check to a verified rectangular scalar grid.
 // It is intentionally limited to trace/light values near the first color
 // bin, so isolated genuine heavier snow bands are not suppressed.
 const ny=Number(shape?.[shape.length-2]),nx=Number(shape?.[shape.length-1]);
 if(Number.isInteger(nx)&&Number.isInteger(ny)&&nx>=3&&ny>=3&&nx*ny===data.length){
  const lightLimit=threshold*4;
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
   const i=y*nx+x,value=data[i];
   if(!validSnow(value)||value>=lightLimit)continue;
   let support=0,missingBorder=false;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(!dx&&!dy)continue;
    const xx=x+dx,yy=y+dy;
    if(xx<0||xx>=nx||yy<0||yy>=ny)continue;
    const neighbor=data[yy*nx+xx];
    if(validSnow(neighbor))support++;
    if(!Number.isFinite(neighbor)||neighbor<0)missingBorder=true;
   }
   // Single/double-cell islands have no spatial support. Near actual NO DATA,
   // require a little more support for *very* light snow to avoid edge flecks.
   if(support<=1||(missingBorder&&value<2*threshold&&support<4)){
    if(!shaded)shaded=data.slice();
    shaded[i]=MISSING;
   }
  }
 }
 return shaded||data;
}
function vorticityShadeData(p,ds,v,h,m,raw){
 const field=p.cfg?.field||st.field;
 const scale=Math.max(vorticitySmoothingMeters(field,p.cfg?.source,p.cfg?.timeMode),
                      vorticitySmoothingMeters(field,ds.model,p.cfg?.timeMode));
 if(!scale)return raw;
 const key=displayKey(p.src,ds,v,h,m)+'::vort-smooth-v2-'+scale;
 let smoothed=displayCacheGet(key);
 if(!smoothed){smoothed=smoothVorticityForDisplay(raw,v.shape[1],v.shape[2],ds.grid,scale);if(smoothed!==raw)displayCachePut(key,smoothed);}
 return smoothed;
}
// Analysis source belongs in the primary heading. Source/sample timestamps in
// metadata may refer to collection/processing, not forecast verification time.
function analysisDisplaySource(ds){
 const raw=String(ds?.product||ds?.model||'').trim();
 if(!raw)return 'Analysis';
 const known=/^(nohrsc|mrms|urma|rtma|rap)(?:[_-]|$)/i.exec(raw);
 return known?known[1].toUpperCase():raw.replace(/[_-]+/g,' ').toUpperCase();
}
function panelDisplayTitle(p,fieldDescription){
 if(p?.cfg?.timeMode==='analysis'){
  const source=analysisDisplaySource(p.ds);
  return source==='Analysis'?`Analysis · ${fieldDescription}`:`Analysis · ${source} · ${fieldDescription}`;
 }
 return `${String(p?.cfg?.label||p?.cfg?.id||'Panel')} · ${fieldDescription}`;
}
async function renderPanel(p,seq){if(!p.map)return;clearWindBarbs(p);clearContours(p);p.heightField=null;p.rawField=null;p.contourField=null;p.temperature850Field=null;p.diffDisplayData=null;const selected=choose(p);p.ds=selected.ds||null;p.v=selected.v||null;p.h=selected.h??null;p.title.textContent=panelDisplayTitle(p,fieldInfo(selected.v||{name:p.cfg.field||st.field},p.cfg.field||st.field,selected.ds?.model||p.cfg.source).label);p.sub.textContent=selected.ds&&Number.isInteger(selected.h)?(p.cfg.timeMode==='analysis'?`Valid ${fmt(valid(selected.ds,selected.h))}`:`Init ${fmt(selected.ds.init_time)} · F${pad3(selected.h)} · valid ${fmt(valid(selected.ds,selected.h))}`):'Source unavailable';
 if(selected.error||!selected.v||!Number.isInteger(selected.h)||selected.h<0||selected.h>=selected.v.shape[0]||!selected.v.available_hours.includes(selected.h)){if(p.layer&&p.map?.getLayer(p.layer.id))p.map.removeLayer(p.layer.id);p.layer=null;p.component=null;p.rawField=null;p.contourField=null;p.lastKey=null;p.status='missing';p.save.disabled=true;setNote(p,selected.error||`No ${selected.v.name} for F${pad3(selected.h)}`);legend(p,null);syncSPCPanel(p);updateStatus();if(st.difference.open&&st.difference.selected.includes(p))scheduleDifferenceRefresh();return;}
 const {ds,v,h}=selected,m=fieldInfo(v,st.field,ds?.model||p.cfg.source);p.status='loading';p.loadSince=Date.now();p.save.disabled=true;updateStatus();p.busy=true;
 // When this hour is cached, replace its texture silently: status overlays make
 // a smooth loop appear to flash even though nothing needs downloading.
 const rawUrl=new URL(`${ds.path}/${v.name}/${h}.0.0`,new URL('.',p.src.url)).href;
 // Show a progress overlay immediately only for genuinely uncached input.
 // A prefetch from CacheStorage may still require decoding, but usually
 // finishes quickly enough that flashing a Requesting panel is distracting.
 const derivedModel=!!(precipitationAccumulationHours(st.field)||snowAccumulationHours(st.field))&&p.cfg.timeMode!=='analysis';
 const derivedAnalysis=(st.field==='apcp'||!!precipitationAccumulationHours(st.field)||st.field==='snow48h')&&p.cfg.timeMode==='analysis';
 const rawCached=url=>st.cache.has(url)||st.chunkStore?.entries.has(url);
 const sameHourHot=st.displayCache.has(displayKey(p.src,ds,v,h,m))||st.cache.has(rawUrl);
 const priorHour=h-(snowAccumulationHours(st.field)||precipitationAccumulationHours(st.field)||1);
 const modelPriorUrl=new URL(`${ds.path}/${v.name}/${priorHour}.0.0`,new URL('.',p.src.url)).href;
 const priorCached=!derivedModel||priorHour<=0||rawCached(modelPriorUrl);
 const priorHot=!derivedModel||priorHour<=0||st.cache.has(modelPriorUrl)||st.displayCache.has(displayKey(p.src,ds,v,priorHour,m));
 const mrmsCheckpoint=st.field==='apcp'&&derivedAnalysis&&st.mrmsAccumCache?.upto===st.hour&&st.mrmsAccumCache?.key===String(p.src.url)+'|'+st.ref.init_time+'|'+accumulationGridKey(ds,v);
 const ptypeVariable=st.field==='refc_ptype'?ds.variables.find(x=>x.name==='ptype'):null;
 const ptypeUrl=ptypeVariable?new URL(`${ds.path}/ptype/${h}.0.0`,new URL('.',p.src.url)).href:null;
 const ptypeWarm=!ptypeUrl||rawCached(ptypeUrl);
 const ptypeHot=!ptypeUrl||st.cache.has(ptypeUrl)||st.displayCache.has(displayKey(p.src,ds,ptypeVariable,h,FIELDS.ptype));
 const hot=!derivedAnalysis&&sameHourHot&&priorHot&&ptypeHot;
 const diskWarm=!derivedAnalysis&&rawCached(rawUrl)&&priorCached&&ptypeWarm;
 const warm=hot||diskWarm||mrmsCheckpoint;
 clearNote(p);
 let lastProgress=warm?'Restoring locally cached data…':`Loading ${m.label} F${pad3(h)}…`;
 const progressDelay=hot||mrmsCheckpoint?0:diskWarm?1100:350;
 let noteDelay=progressDelay?setTimeout(()=>{
  noteDelay=null;
  if(seq===st.seq&&p.map&&p.status==='loading')stage(p,lastProgress);
 },progressDelay):null;
 try{const data=await getPanelDisplayData(p,ds,v,h,m,msg=>{
  lastProgress=msg;
  if(!hot&&noteDelay===null&&seq===st.seq&&p.map&&p.status==='loading')stage(p,msg);
 },seq);
 if(noteDelay!==null){clearTimeout(noteDelay);noteDelay=null;}
 if(seq!==st.seq||!p.map||!data)return;
 clearNote(p);
 const grid=gridForPanel(p,ds,v),shadeData=snowfallShadeData(vorticityShadeData(p,ds,v,h,m,data),st.field,m,v.shape);
 const field=new apgl.RawScalarField(grid,shadeData),rawField=shadeData===data?field:new apgl.RawScalarField(grid,data);
 const signature=JSON.stringify([st.field,v.name,v.shape,ds.grid]);
 if(p.component&&p.lastKey===signature&&typeof p.component.updateField==='function'){await p.component.updateField(field);}
 else{if(p.layer&&p.map.getLayer(p.layer.id))p.map.removeLayer(p.layer.id);const cmap=makeColormap(m,v);const klass=st.cfg.display.fieldRendering==='smooth'&&!m.category&&!m.ptype&&!m.ptypeReflectivity?apgl.ContourFill:apgl.Raster;const comp=new klass(field,{cmap});const layer=new apgl.PlotLayer(`evu-field-${p.i}`,comp);p.component=comp;p.layer=layer;
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

 p.rawField=rawField;p.contourField=/^snow(?:1h|3h|6h|24h|48h)$/.test(st.field)||st.field==='asnow'?rawField:field;p.diffDisplayData=data;scheduleContourRedraw(p);legend(p,m);if(windComponentNames(p.cfg?.field||st.field))await prepareWindBarbs(p,ds,h,seq);if(heightVariableName(p.cfg?.field||st.field))await prepareHeightContours(p,ds,h,seq);if(st.field==='mslp'&&st.overlayMSLP850)await prepareMSLP850Contours(p,ds,h,seq);updatePanelPlotTitle(p);await waitPaint(p.map);if(seq!==st.seq||!p.map||p.contextLost)return;
 // Refresh reports after the asynchronous autumnplot custom layer is ready.
 // All panels (including REFS and verification analyses) use the same LSRs.
 syncSPCPanel(p);
 p.status='ready';p.renderedSeq=seq;p.save.disabled=false;clearNote(p);if(st.hover&&!st.hoverRaf)st.hoverRaf=requestAnimationFrame(()=>{st.hoverRaf=0;paintSynchronizedHover();});// The PNG export path explicitly captures a finished render frame. Avoid stale blank snapshots here.
 }catch(e){if(seq===st.seq)fail(p,e);}finally{if(noteDelay!==null)clearTimeout(noteDelay);p.busy=false;updateStatus();if(st.difference.open&&st.difference.selected.includes(p))scheduleDifferenceRefresh();if(!st.rendering&&!st.panels.some(x=>x.busy))schedulePrefetch();}}
// Keep the legend in the same units/range as the autumnplot-gl color map.
// Legend-only categorical swatches: 0/No is unshaded in the *map* (the
// native map background remains visible); draw a black No tile in legends so
// both states are explicit. Do not add a black category to the GPU colormap.
function legendSwatches(m,palette){
 return m?.category&&!m.ensembleMeanFraction?['#000000',m.category]:palette.colors;
}
// Continuous ramps have numerical widths, especially at the added clear-zero
// boundaries. Preserve the original equal-bin layout for categorical/banded
// palettes, but align continuous swatches with their actual physical values.
function legendColorSpan(palette,index,count){
 const uniform=[index/count,(index+1)/count];
 if(palette?.banded||palette?.levels?.length!==count+1)return uniform;
 const lo=palette.levels[0],hi=palette.levels.at(-1);
 if(!(Number.isFinite(lo)&&Number.isFinite(hi)&&hi>lo))return uniform;
 return [(palette.levels[index]-lo)/(hi-lo),(palette.levels[index+1]-lo)/(hi-lo)];
}
function legendTicks(m,v){
 if(!m)return [];
 if(m.ptypeReflectivity)return PTYPE_LABELS.slice(1).map((label,i)=>({label,pos:((i*80)+45-10)/(400-10)}));
 if(m.ptype)return PTYPE_LABELS.slice(1).map((label,i)=>({label,pos:(i+.5)/5}));
 if(m.ensembleMeanFraction&&!st.colorRanges.get(st.field))return [0,.25,.5,.75,1].map(v=>({label:String(v),pos:v}));
 if(m.category)return [{label:'No',pos:.25},{label:'Yes',pos:.75}];
 const p=pal(m,v),lo=p.levels[0],hi=p.levels.at(-1);
 const count=Math.max(3,Math.min(15,Number(st.cfg?.display?.legendTickCount??11)||11));
 const fmtNum=(x,decimals)=>x.toFixed(decimals).replace(/(\.\d*?[1-9])0+$/,'$1').replace(/\.0+$/,'');
 if(!st.colorRanges.get(st.field)&&(m===FIELDS.refc||m.label==='Composite reflectivity'||m.label==='PMM composite reflectivity')){
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
   return {label:fmtNum(value,decimals)+(i===n&&!st.colorRanges.get(st.field)?'+':''),pos:i/n};});
 }
 if(['sbcape','mlcape','mucape'].includes(st.field)){
  // The CAPE palette starts near 10 J/kg to suppress noise. Keep familiar
  // round meteorological thresholds, not 10, 609, 1208, 1807, ...
  const step=hi-lo>6500?1000:500;
  const values=[];
  const start=Math.ceil(lo/step)*step;
  for(let x=start;x<=hi+1e-9;x+=step)values.push(x);
  if(!values.length||values[0]>lo+.00001)values.unshift(0);
  if(values.at(-1)!==hi)values.push(hi);
  return values.map(x=>({label:fmtNum(x,0),pos:Math.max(0,Math.min(1,(x-lo)/(hi-lo)))}));
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
  const [a,b]=legendColorSpan(palette,i,n);
  if(vertical){const top=Math.round((1-b)*c.height),bottom=Math.round((1-a)*c.height);cx.fillRect(0,top,c.width,bottom-top);}
  else{const left=Math.round(a*c.width),right=Math.round(b*c.width);cx.fillRect(left,0,right-left,c.height);}
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
 const wanted=snowAccumulationHours(st.field)?'asnow':precipitationAccumulationHours(st.field)?'apcp':st.field;
 let v=entries.flatMap(({ds})=>ds.variables||[]).find(v=>v.name===wanted);
 if(!v)for(const src of st.sources.values()){
  v=src.datasets?.flatMap(ds=>ds.variables||[]).find(v=>v.name===wanted);
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
 if(!data){el.sharedLegendTitle.textContent='Field color scale';el.legendResetBtn.hidden=true;el.sharedLegendCanvas.classList.remove('scale-adjustable');return;}
 const {m,palette,ticks}=data;
 const title=`${m.label}${m.unit?' ('+m.unit+')':''}`;
 const custom=adjustableColorbar(m)?st.colorRanges.get(st.field):null;
 if(el.legendRangePopup.open&&el.legendRangePopup.dataset.field!==st.field)closeLegendRangeEditor();
 el.legendResetBtn.hidden=!custom;
 el.sharedLegendCanvas.classList.toggle('scale-adjustable',adjustableColorbar(m));
 el.sharedLegendCanvas.title=adjustableColorbar(m)?'Click to edit the minimum and maximum color scale values':'Categorical legend: fixed colors';
 el.sharedLegendTitle.textContent=title+(custom?' · custom range':'');el.sharedLegendTitle.title=title;
 const colors=legendSwatches(m,palette),n=colors.length;
 colors.forEach((color,i)=>{const [a,b]=legendColorSpan(palette,i,n);const left=Math.round(a*c.width),right=Math.round(b*c.width);ctx.fillStyle=color;ctx.fillRect(left,0,right-left,c.height);});
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
async function step(dir){const h=nextHour(dir);if(h===null)return;st.prefetchDirection=dir<0?-1:1;st.hour=h;syncUI();await renderAll();}
// Adaptive, bidirectional prefetch. Keep the speculative queue alive across
// forecast-hour changes; otherwise continuous play cancels nearly every batch.
// Current-hour plot fetches always outrank background work (see pump()).
// Candidates are hour-major, so all nine data sources warm before distant leads.
function prefetchContextKey(){return `${st.ref?.id||''}|${st.field||''}|${st.panels.filter(p=>!p.cfg.placeholder).map(p=>p.cfg.source).join(',')}`;}
function prefetchOffsets(ahead,behind,dir=1){
 const out=[];const mx=Math.max(ahead,behind);
 for(let n=1;n<=mx;n++){
  if(dir<0){if(n<=behind)out.push(-n);if(n<=ahead)out.push(n);}
  else{if(n<=ahead)out.push(n);if(n<=behind)out.push(-n);}
 }
 return out;
}
function prefetchChunkUrl(src,ds,v,h){
 return new URL(`${ds.path}/${v.name}/${h}.0.0`,new URL('.',src.url)).href;
}
function prefetchCandidates(timeline,disk,batchLimit){
 const d=st.cfg?.display||{},pos=timeline.indexOf(st.hour),base=pos<0?0:pos;
 const ahead=Math.max(1,Math.floor(Number(disk?d.prefetchHours??12:d.prefetchMemoryOnlyHours??2)));
 const behind=Math.max(0,Math.floor(Number(disk?d.prefetchBehindHours??4:d.prefetchMemoryOnlyBehindHours??1)));
 const seen=new Set(),candidates=[],now=Date.now();
 // Failure cooldown is temporary: failed and evicted items are eventually retried.
 for(const [url,when] of st.prefetchAttempted)if(when<=now)st.prefetchAttempted.delete(url);
 const enqueue=(src,ds,v,h)=>{
  if(!src||!ds||!v||!Number.isInteger(h)||h<0||h>=v.shape[0]||!v.available_hours?.includes(h))return;
  const url=prefetchChunkUrl(src,ds,v,h);
  if(seen.has(url)||st.prefetchSeenForFocus.has(url)||st.compressedInflight.has(url)||st.inflight.has(url)||
    st.chunkStore?.entries.has(url)||st.cache.has(url)||
    (st.prefetchAttempted.get(url)||0)>now)return;
  seen.add(url);candidates.push({url,src,ds,v,h});
 };
 for(const offset of prefetchOffsets(ahead,behind,st.prefetchDirection)){
  // Don't wrap from F000 to F084 or vice versa solely for speculation.
  const ix=base+offset;if(ix<0||ix>=timeline.length)continue;
  const requested=timeline[ix],chosen=[];
  // Pass 1: all panels' main display chunks, including analysis, get an
  // equal opportunity before any panel's secondary chunks consume bandwidth.
  for(const p of st.panels){
   if(p.cfg.placeholder)continue;
   const choice=choose(p,requested),{ds,v,h}=choice,src=p.src;
   if(choice.error||!ds||!v)continue;
   chosen.push({p,ds,v,h,src});
   enqueue(src,ds,v,h);
  }
  // Pass 2: dependent inputs (one-hour difference, wind barbs and recent
  // MRMS sums), so future frames are actually fully renderable.
  for(const {p,ds,v,h,src} of chosen){
   const precipitation=precipitationAccumulationHours(st.field);
   if(precipitation&&p.cfg.timeMode!=='analysis'&&h>precipitation)enqueue(src,ds,v,h-precipitation);
   const snowfall=snowAccumulationHours(st.field);
   if(snowfall&&p.cfg.timeMode!=='analysis'&&h>snowfall)enqueue(src,ds,v,h-snowfall);
   const heightKey=heightVariableName(st.field);
   if(heightKey){const hv=ds.variables.find(x=>x.name===heightKey);if(hv)enqueue(src,ds,hv,h);}
   if(st.field==='refc_ptype'){const pv=ds.variables.find(x=>x.name==='ptype');if(pv)enqueue(src,ds,pv,h);}
   if(windComponentNames(st.field)){
    for(const name of windComponentNames(st.field)){
     const w=ds.variables.find(x=>x.name===name);if(w)enqueue(src,ds,w,h);
    }
   }
   if(st.field==='asnow'&&p.cfg.timeMode==='analysis'&&ds.product==='nohrsc_6h'){
    // Prefetch only a small recent window of the constituent six-hour
    // analyses; the running-total renderer fetches any earlier periods.
    for(let lead=Math.max(6,requested-18);lead<requested;lead+=6){
     if(lead%6)continue;
     const old=nohrsc6hRecord(src,valid(st.ref,lead));
     const snow=old?.variables.find(x=>x.name==='snow6h');
     if(snow)enqueue(src,old,snow,0);
    }
   }
   if(st.field==='snow48h'&&p.cfg.timeMode==='analysis'&&ds.product==='nohrsc_24h'){
    const old=nohrsc24hRecord(src,new Date(Date.parse(ds.init_time)-24*3600000));
    const snow=old?.variables.find(v=>v.name==='snow24h');
    if(old&&snow)enqueue(src,old,snow,0);
   }
   if((st.field==='apcp'||precipitationAccumulationHours(st.field))&&p.cfg.timeMode==='analysis'&&ds.product==='mrms_apcp'){
    const window=precipitationAccumulationHours(st.field);
    const last=window||Math.max(1,Math.floor(Number(d.prefetchMrmsRecentHours??3)));
    for(let t=Math.max(1,requested-last+1);t<=requested;t++){
     const record=mrmsHourlyRecord(src,valid(st.ref,t));
     const variable=record?.variables.find(x=>x.name==='apcp');
     if(record&&variable)enqueue(src,record,variable,0);
    }
   }
  }
  if(candidates.length>=batchLimit)break;
 }
 return candidates.slice(0,batchLimit);
}
function schedulePrefetch(){
 const d=st.cfg?.display||{};
 if(prefetchMode()==='off'||!st.ref||st.exporting)return;
 const context=prefetchContextKey();
 if(context!==st.prefetchContext){
  cancelQueuedPrefetches();st.prefetchContext=context;st.prefetchAttempted.clear();
  st.prefetchCompleted=0;st.prefetchFailed=0;st.prefetchBySource.clear();
 }
 // Prefetch starts before every panel finishes painting. The shared network
 // limiter reserves slots for foreground plotting and promotes matching URLs.
 const focus=`${context}|${st.hour}|${st.prefetchDirection}`;
 if(st.prefetchFocus!==focus){st.prefetchFocus=focus;st.prefetchSeenForFocus.clear();}
 if(st.prefetchTimer||st.prefetchBatchToken?.context===context)return;
 const generation=st.prefetchGeneration;
 st.prefetchTimer=setTimeout(async()=>{
  st.prefetchTimer=null;
  if(generation!==st.prefetchGeneration||prefetchMode()==='off'||!st.ref||st.exporting)return;
  const timeline=playbackHours();if(timeline.length<2)return;
  if(!st.chunkStore)st.chunkStore=new CompressedZarrStore();
  const disk=Boolean(await st.chunkStore.open());
  if(generation!==st.prefetchGeneration||prefetchMode()==='off'||st.exporting)return;
  const limit=Math.max(1,Math.min(64,Number(d.prefetchBatchSize??12)));
  const candidates=prefetchCandidates(timeline,disk,limit);
  if(!candidates.length)return;
  const token={context};st.prefetchBatchToken=token;st.prefetchBatchRunning=true;
  try{
   await Promise.allSettled(candidates.map(async c=>{
    try{
     if(disk)await compressedChunk(c.url,{background:true});
     else await chunk(c.src,c.ds,c.v,c.h,()=>{},{background:true});
     if(generation===st.prefetchGeneration){st.prefetchCompleted++;st.prefetchSeenForFocus.add(c.url);const id=c.src?.id||'unknown';st.prefetchBySource.set(id,(st.prefetchBySource.get(id)||0)+1);}
    }catch(e){
     if(generation===st.prefetchGeneration&&!isSupersededPrefetch(e)){
      st.prefetchFailed++;
      // 404s generally represent delayed/missing hours. Retry later so
      // recently published sources become eligible without a page reload.
      const backoff=e?.status===404?120000:45000;
      st.prefetchAttempted.set(c.url,Date.now()+backoff);
      console.debug('Zarr prefetch unavailable:',c.url,e);
     }
    }
   }));
  }finally{
   if(st.prefetchBatchToken===token){
    st.prefetchBatchToken=null;st.prefetchBatchRunning=false;
    if(prefetchMode()!=='off')schedulePrefetch();
   }
  }
 },Math.max(50,Math.min(2500,Number(d.prefetchDelayMs??120))));
}
// Diagnostic readout without displaying cache chatter across nine maps.
window.OMDEVUPrefetch={stats:()=>({mode:prefetchMode(),downloadsCompleted:st.prefetchCompleted,downloadsFailed:st.prefetchFailed,failedCoolingDown:st.prefetchAttempted.size,bySource:Object.fromEntries(st.prefetchBySource),direction:st.prefetchDirection<0?'backward':'forward',queued:st.queue.filter(x=>x.background).length,active:st.prefetchActive,decodedMB:Math.round(st.cacheBytes/1048576),displayReadyMB:Math.round(st.displayCacheBytes/1048576),compressedDiskMB:Math.round((st.chunkStore?.bytes||0)/1048576),diskEnabled:Boolean(st.chunkStore?.cache&&!st.chunkStore?.disabled),cacheUsage:{network:st.cacheStats.network,persistentReads:st.cacheStats.disk,decodedHits:st.cacheStats.decoded,displayReadyHits:st.cacheStats.displayReady,sharedRequests:st.cacheStats.shared,decodedEvictions:st.cacheStats.decodedEvicted,displayReadyEvictions:st.cacheStats.displayEvicted},recentlyDisplayedProtected:st.chunkStore?.foregroundRecentlyUsed.size||0,cacheQuotaRetries:st.chunkStore?.quotaFailures||0,compressedCacheBudgetMB:Math.round((st.chunkStore?.budget||0)/1048576)}),resume:()=>schedulePrefetch()};
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
async function ensureExportGeography(p,zoom){
 const map=p?.map,d=st.cfg?.display||{};if(!map)return;
 const targetZoom=Number.isFinite(zoom)?zoom:map.getZoom();
 const jobs=[];
 if(d.showCoastlines!==false){jobs.push(installGeo(p,'coast'));if(targetZoom>=detailThreshold())jobs.push(installGeo(p,'coast_detail'));}
 if(d.showStateBoundaries!==false)jobs.push(installGeo(p,'states'));
 if(d.showCountryBoundaries!==false){jobs.push(installGeo(p,'country'));if(targetZoom>=detailThreshold())jobs.push(installGeo(p,'country_detail'));}
 if(d.showLandFill!==false){jobs.push(installGeo(p,'land'));if(targetZoom>=detailThreshold()){jobs.push(installGeo(p,'land_detail'));jobs.push(installGeo(p,'lakes_detail'));}}
 if(d.showCountiesOnZoom!==false&&targetZoom>=countyThreshold(p))jobs.push(installGeo(p,'counties'));
 if(jobs.length)await Promise.all(jobs);
 updateGeographyVisibility(p);
 await waitPaint(map);
 await waitPaint(map);
}
// Individual exports temporarily enlarge the WebGL viewport to get sharp
// textures. Its artificial zoom would make normal zoom-based wind sampling
// excessively dense. Instead, express barb density and glyph size in pixels
// of the final *presentation image* (after its Fit/Fill framing transform).
// The nine-panel export deliberately continues using normal barbSpacing().
function individualExportWindStyle(viewW,viewH,targetW,targetH,framing){
 const d=st.cfg?.display||{};
 const ratioW=targetW/Math.max(1,viewW),ratioH=targetH/Math.max(1,viewH);
 const outputPerCss=framing==='fit'?Math.min(ratioW,ratioH):Math.max(ratioW,ratioH);
 const scale=Number.isFinite(outputPerCss)&&outputPerCss>0?outputPerCss:1;
 const configuredSpacing=Number(d.exportWindBarbSpacingPx);
 const configuredSize=Number(d.exportWindBarbSizePx);
 // Presentation-sized symbols, comparable in apparent density to an enlarged
 // panel rather than a 9-up screenshot blown up to fill the page.
 const targetSpacing=Number.isFinite(configuredSpacing)&&configuredSpacing>=40&&configuredSpacing<=120?configuredSpacing:60;
 const targetSize=Number.isFinite(configuredSize)&&configuredSize>=18&&configuredSize<=40?configuredSize:26;
 return {spacingPx:targetSpacing/scale,sizePx:targetSize/scale};
}
// The single-panel export expands its real CSS map viewport by renderScale
// and increases map zoom accordingly. A marker needs *approximately the same
// enlargement* to retain its apparent size relative to the weather map. The
// earlier sqrt(target dimension) adjustment left report icons much too small.
// Styles change ONLY for the export capture, and are restored in finally.
function observationMarkerAtZoom(style,zoom){
 if(typeof style==='number'&&Number.isFinite(style))return style;
 // All current observation radius and icon-size styles use linear zoom stops.
 // Keep this restricted so new/unknown expressions are not misinterpreted.
 if(!Array.isArray(style)||style[0]!=='interpolate'||
    !Array.isArray(style[1])||style[1][0]!=='linear'||
    !Array.isArray(style[2])||style[2][0]!=='zoom')return null;
 const stops=[];
 for(let i=3;i+1<style.length;i+=2){
  const x=style[i],y=style[i+1];
  if(typeof x!=='number'||!Number.isFinite(x)||typeof y!=='number'||!Number.isFinite(y))return null;
  stops.push([x,y]);
 }
 if(!stops.length)return null;
 if(zoom<=stops[0][0])return stops[0][1];
 for(let i=1;i<stops.length;i++){
  const [x,y]=stops[i], [a,b]=stops[i-1];
  if(zoom<=x)return x===a?y:b+(y-b)*(zoom-a)/(x-a);
 }
 return stops[stops.length-1][1];
}
function exportObservationMarkerScale(renderScale,oldZoom,exportZoom,original,sharpIndividual){
 const configured=Number(st.cfg?.display?.exportObservationMarkerScale??1);
 const gain=Number.isFinite(configured)?Math.max(.5,Math.min(2.5,configured)):1;
 // Single-panel output gains an additional 20% for readability. Multi-panel
 // plots do not enlarge the capture viewport and use a fixed, prominent size.
 const base=sharpIndividual?1.2*Math.max(1,renderScale):1.7;
 const before=observationMarkerAtZoom(original,oldZoom);
 const after=observationMarkerAtZoom(original,exportZoom);
 // MapLibre's symbol-size interpolations already grow with zoom; compensate
 // to maintain a predictable final size for both circles and triangles.
 const zoomCorrection=before>0&&after>0?before/after:1;
 return Math.max(.5,Math.min(12,base*gain*zoomCorrection));
}
function scaledObservationZoomSize(value,factor){
 if(typeof value==='number'&&Number.isFinite(value))return value*factor;
 // 'zoom' must stay as the input to a TOP-LEVEL interpolate/step expression.
 // Wrapping it in ['*', original, factor] is rejected by MapLibre's validator.
 if(Array.isArray(value)&&value[0]==='interpolate'&&Array.isArray(value[2])&&value[2][0]==='zoom'){
  return value.map((part,i)=>i>=4&&i%2===0&&typeof part==='number'?part*factor:part);
 }
 if(Array.isArray(value)&&value[0]==='step'&&Array.isArray(value[1])&&value[1][0]==='zoom'){
  return value.map((part,i)=>i>=2&&i%2===0&&typeof part==='number'?part*factor:part);
 }
 return null; // Unknown expressions are left untouched instead of risking invalid styles.
}
function applyExportObservationMarkerSize(map,renderScale,oldZoom,exportZoom,sharpIndividual){
 if(!observationVisible()||!map)return ()=>{};
 const changes=[];
 const restore=()=>{
  for(const {layer,kind,property,original} of changes.reverse()){
   try{if(map.getLayer(layer)){
    if(kind==='paint')map.setPaintProperty(layer,property,original);
    else map.setLayoutProperty(layer,property,original);
   }}catch(err){console.warn('Could not restore observation symbol size after export:',err);}
  }
 };
 try{
  for(const [layer,kind,property] of [
   ['evu-observed-metar','paint','circle-radius'],
   ['evu-observed-metar','paint','circle-stroke-width'],
   ['evu-observed-mping','layout','icon-size']
  ]){
   if(!map.getLayer?.(layer))continue;
   const original=kind==='paint'?map.getPaintProperty(layer,property):map.getLayoutProperty(layer,property);
   const factor=exportObservationMarkerScale(renderScale,oldZoom,exportZoom,original,sharpIndividual);
   if(!(factor>1.001))continue;
   const scaled=scaledObservationZoomSize(original,factor);
   if(scaled===null)continue;
   if(kind==='paint')map.setPaintProperty(layer,property,scaled);
   else map.setLayoutProperty(layer,property,scaled);
   changes.push({layer,kind,property,original});
  }
 }catch(err){restore();console.warn('Could not enlarge observation symbols for export:',err);}
 return restore;
}
// Individual exports paint the report symbols (METAR, mPING and SPC LSR) in
// the final presentation canvas. MapLibre's CSS zoom, viewport enlargement, framebuffer DPR and
// Fit/Fill transforms otherwise make symbol sizes unpredictable. Retain the
// geographic locations from the actual high-resolution capture camera and
// draw only the individual export overlay at a fixed OUTPUT pixel size.
// The all-panels export intentionally remains on its existing MapLibre path.
function snapshotIndividualExportObservations(map,cssWidth,cssHeight){
 if(!(cssWidth>0&&cssHeight>0)||!map?.project)return null;
 const points=[];
 // Both observation feeds and SPC LSRs must use the same high-resolution
 // capture camera. SPC reports can be enabled even if METAR/mPING is not.
 const projectReport=(feature,source,attributes)=>{
  const coords=feature?.geometry?.coordinates;
  if(!Array.isArray(coords)||coords.length<2||!Number.isFinite(coords[0])||!Number.isFinite(coords[1]))return;
  try{
   const pos=map.project([coords[0],coords[1]]);
   if(!Number.isFinite(pos.x)||!Number.isFinite(pos.y))return;
   // Normalize in capture viewport CSS pixels; map image may have a higher DPR.
   const x=pos.x/cssWidth,y=pos.y/cssHeight;
   if(x<-.05||x>1.05||y<-.05||y>1.05)return;
   points.push({x,y,source,...attributes});
  }catch(err){console.debug('Skipping unprojectable report in export:',err);}
 };
 if(observationVisible()&&st.obsCurrent?.features?.length){
  for(const feature of filteredObservationGeoJSON().features||[]){
   const source=feature?.properties?.source,ptype=Number(feature?.properties?.ptype);
   if(!['synoptic','mping'].includes(source)||!Number.isInteger(ptype)||ptype<1||ptype>5)continue;
   projectReport(feature,source,{ptype});
  }
 }
 if(spcVisible()&&st.spcCurrent?.length){
  for(const feature of st.spcCurrent){
   const type=feature?.properties?.type;
   if(!Object.hasOwn(SPC_COLORS,type))continue;
   projectReport(feature,'spc',{type});
  }
 }
 return points.length?{points,light:st.theme==='light'}:null;
}
async function captureMapPNG(p,targetW=0,targetH=0,framing='fill',sharpIndividual=false){
 const map=p.map,canvas=map.getCanvas(),node=map.getContainer();
 const oldStyle=node.getAttribute('style')||'';
 const oldCenter=map.getCenter(),oldZoom=map.getZoom(),oldBearing=map.getBearing(),oldPitch=map.getPitch();
 await ensureExportGeography(p,oldZoom);
 // A sharp standalone export enlarges the viewport and adds log2(scale) to
 // MapLibre zoom; that artificial zoom must NOT reveal counties that were
 // hidden in the live panel. Use the original zoom to decide county visibility.
 // This applies equally in 2D and Globe and is restored in finally on errors.
 const hideExportCounties=sharpIndividual&&oldZoom<countyThreshold(p)&&!!map.getLayer?.('counties');
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
 let changedRatio=false,windStyle=null,contourStyle=null;
 let restoreObservationMarkers=()=>{};
 let png=null,windPNG=null,contourPNG=null,exportObservations=null;
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
   if(p.contourCanvas&&sharpIndividual){
    contourStyle=p.contourCanvas.getAttribute('style')||'';
    p.contourCanvas.style.inset='auto';p.contourCanvas.style.position='absolute';
    p.contourCanvas.style.left=node.style.left;p.contourCanvas.style.top=node.style.top;
    p.contourCanvas.style.width=newW+'px';p.contourCanvas.style.height=newH+'px';
   }
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
  // Observation circles/triangles have their own export-only scale. Their
  // screen sizes are restored after capture, including on any export error.
  // All-panels retains the existing MapLibre symbol scaling. Individual
  // exports overlay larger symbols directly on their final composition instead.
  if(!sharpIndividual)restoreObservationMarkers=applyExportObservationMarkerSize(map,
   renderScale,oldZoom,exportZoom,false);
  // Let the high-resolution vector and autumnplot custom layers settle before
  // encoding. Existing all-panels map geometry remains deliberately unchanged.
  png=await captureMapFrame(map,sharpIndividual?3:1);
  if(sharpIndividual)exportObservations=snapshotIndividualExportObservations(map,cssW,cssH);
  const plottedField=p.cfg?.field||st.field;
  const withHeight=Boolean(overlayHeightVisible(plottedField)&&p.heightField);
  const withScalar=Boolean(st.contours&&plottedField!=='mslp'&&contoursAvailable(plottedField));
  const withMSLP=plottedField==='mslp'&&st.overlayMSLP;
  const withMSLP850=plottedField==='mslp'&&st.overlayMSLP850&&!!p.temperature850Field;
  // The final export cell can be far wider than the interactive panel.
  // Keep existing screen contour styles unchanged while ensuring published
  // PNG/GIF contour lines retain presentation-scale visibility.
  const contourExportScale=Math.max(1.12,Math.min(2.65,
   Math.sqrt(Math.max(1,(targetW||screenW)/Math.max(1,screenW)))*1.16));
  if(p.contourCanvas&&(withHeight||withScalar||withMSLP||withMSLP850)){
   if(withHeight){
    drawContours(p,{field:p.heightField,key:heightVariableName(plottedField),always:true,exportScale:contourExportScale});
    if(withScalar)drawContours(p,{field:p.contourField||p.rawField,key:plottedField,append:true,exportScale:contourExportScale});
   }else if(plottedField==='mslp'){
    if(withMSLP)drawContours(p,{always:true,exportScale:contourExportScale});
    if(withMSLP850)drawContours(p,{field:p.temperature850Field,key:'t850',always:true,append:withMSLP,exportScale:contourExportScale});
   }
   else drawContours(p,{exportScale:contourExportScale});
   contourPNG=p.contourCanvas.toDataURL('image/png');
  }
  if(p.wind&&windComponentNames(plottedField)&&overlayWindVisible(plottedField)&&p.windCanvas){
   // Match the appearance of an enlarged viewer panel; do not use the
   // export-only MapLibre zoom to choose density or unscaled glyph sizes.
   const exportBarbs=sharpIndividual
    ? individualExportWindStyle(cssW,cssH,targetW,targetH,framing)
    : null;
   drawWindBarbs(p,exportBarbs);
   windPNG=p.windCanvas.toDataURL('image/png');
  }
 }finally{
  restoreObservationMarkers();
  if(changedRatio){try{map.setPixelRatio(oldRatio);}catch(err){console.warn('Could not restore pixel ratio',err);}}
  if(windStyle!==null)p.windCanvas.setAttribute('style',windStyle);
  if(contourStyle!==null)p.contourCanvas.setAttribute('style',contourStyle);
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
  if(p.contourCanvas)scheduleContourRedraw(p);
  if(st.hover&&!st.hoverRaf)st.hoverRaf=requestAnimationFrame(()=>{st.hoverRaf=0;paintSynchronizedHover();});
 }
 return {map:await decodePNG(png),wind:await decodePNG(windPNG),contours:await decodePNG(contourPNG),observations:exportObservations,png};
}
async function panelImage(p,targetW=0,targetH=0,framing='fill',sharpIndividual=false){
 if(p.map){const output=await captureMapPNG(p,targetW,targetH,framing,sharpIndividual);p.lastSnapshot=output.png;return output;}
 return {map:await decodePNG(p.lastSnapshot||null),wind:null,contours:null};
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
// Paint reports on top of the high-resolution individual-panel map (including
// SPC LSRs) in final PNG/GIF pixels. This guarantees readable sizes whether the browser panel
// began at 300px or 1800px wide and whether Fit or Fill was selected.
function drawIndividualExportObservations(ctx,observations,mapRect,mapImage,plotWidth){
 if(!observations?.points?.length||!(plotWidth>0))return;
 const iw=mapImage.naturalWidth||mapImage.width;
 const ih=mapImage.naturalHeight||mapImage.height;
 if(!(iw>0&&ih>0))return;
 const configured=Number(st.cfg?.display?.exportObservationMarkerScale??1);
 const gain=Number.isFinite(configured)?Math.max(.5,Math.min(2.5,configured)):1;
 // At 1920px, METAR/SPC circles have ~12px radius and mPING triangles
 // are ~29px wide. At GIF resolutions, scale proportionally.
 const radius=Math.max(7,Math.min(20,plotWidth/158))*gain;
 const outline=Math.max(1.5,radius*.22);
 const stroke=observations.light?'#152633':'#ffffff';
 ctx.save();
 ctx.beginPath();ctx.rect(mapRect.dx,mapRect.dy,mapRect.dw,mapRect.dh);ctx.clip();
 // Keep the existing report types: METAR circles, mPING triangles,
 // and SPC LSR circles (red tornado / blue wind / green hail).
 for(const source of ['synoptic','mping','spc']){
  for(const report of observations.points){
   if(report.source!==source)continue;
   const col=source==='spc'?SPC_COLORS[report.type]:PTYPE[report.ptype];
   if(!col)continue;
   const px=report.x*iw,py=report.y*ih;
   const x=mapRect.dx+(px-mapRect.sx)*mapRect.dw/mapRect.sw;
   const y=mapRect.dy+(py-mapRect.sy)*mapRect.dh/mapRect.sh;
   if(!Number.isFinite(x)||!Number.isFinite(y)||
      x<mapRect.dx-radius*3||x>mapRect.dx+mapRect.dw+radius*3||
      y<mapRect.dy-radius*3||y>mapRect.dy+mapRect.dh+radius*3)continue;
   ctx.beginPath();
   if(source!=='mping')ctx.arc(x,y,radius,0,Math.PI*2);
   else{
    const r=radius*1.2;
    ctx.moveTo(x,y-r);ctx.lineTo(x+r*.98,y+r*.86);
    ctx.lineTo(x-r*.98,y+r*.86);ctx.closePath();
   }
   ctx.globalAlpha=.94;ctx.fillStyle=col;ctx.fill();
   ctx.globalAlpha=.96;ctx.lineJoin='round';ctx.lineWidth=outline;
   ctx.strokeStyle=stroke;ctx.stroke();
  }
 }
 ctx.restore();
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
   drawWindExport(ctx,captured.contours,rect,im);
  }else{
   ctx.fillStyle=muted;ctx.font=`${Math.max(16,Math.min(25,w/35))}px Arial`;
   ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillText(clipText(ctx,p.note?.textContent||'Data unavailable',w-30),x+w/2,y+h/2);
  }
  // WebGL captures do not include HTML overlays. Retain the model and valid
  // time annotation IN the plotting area for exported comparison images.
  const name=String(p.title.textContent||p.cfg.label||p.cfg.id);
  const run=String(p.sub.textContent||'');
  const fontSize=Math.max(12,Math.min(19,w/47))*(st.exportLargeLabels?1.5:1);
  ctx.font=`bold ${fontSize}px Arial`;
  const titleWidth=ctx.measureText(name).width;
  ctx.font=`${Math.max(10,fontSize*.78)}px Arial`;
  const subWidth=ctx.measureText(run).width;
  const labelW=Math.min(w-12,Math.max(titleWidth,subWidth)+20);
  const lineH=fontSize*1.2,boxH=lineH*2+12;
  ctx.fillStyle=light?'rgba(255,255,255,.87)':'rgba(5,16,30,.83)';
  ctx.fillRect(x+6,y+6,labelW,boxH);
  ctx.fillStyle=fg;ctx.textAlign='left';ctx.textBaseline='top';
  ctx.font=`bold ${fontSize}px Arial`;
  ctx.fillText(clipText(ctx,name,labelW-14),x+13,y+12);
  ctx.font=`${Math.max(10,fontSize*.78)}px Arial`;ctx.fillStyle=muted;
  ctx.fillText(clipText(ctx,run,labelW-14),x+13,y+12+lineH);
  return;
 }

 const light=st.theme==='light',fg=light?'#1d2e42':'#eef4fa',muted=light?'#54687e':'#aebfd1';
 ctx.fillStyle=light?'#fff':'#101d2e';rounded(ctx,x,y,w,h,12);
 ctx.fillStyle=fg;const largeLabels=!!st.exportLargeLabels;
 const headerTop=largeLabels?100:60;
 ctx.font=`bold ${Math.round(Math.max(15,Math.min(25,w/40))*(largeLabels?1.7:1))}px Arial`;
 ctx.textBaseline='middle';ctx.textAlign='left';
 ctx.fillText(clipText(ctx,p.title.textContent,w-36),x+18,y+(largeLabels?30:19));
 ctx.font=`${Math.round(Math.max(11,Math.min(15,w/70))*(largeLabels?1.7:1))}px Arial`;ctx.fillStyle=muted;
 ctx.fillText(clipText(ctx,p.sub.textContent,w-36),x+18,y+(largeLabels?73:43));
 // In large comparison grids, a narrow vertical bar gives the map noticeably
 // more height. Individual/short-grid exports retain a horizontal colorbar.
 const side=verticalLegend?Math.max(75,Math.min(102,Math.round(w*.09))):0;
 const boxX=x+14,boxY=y+headerTop,boxW=w-28-side,boxH=h-(verticalLegend?headerTop+14:headerTop+77);
 ctx.fillStyle=light?'#d6e6ee':'#0b2238';ctx.fillRect(boxX,boxY,boxW,boxH);
 const captured=await panelImage(p,boxW,boxH,st.lastExportFraming,true);
 if(captured.map&&p.status==='ready'){
  const im=captured.map;
  const rect=drawMapFramed(ctx,im,boxX,boxY,boxW,boxH,st.lastExportFraming);
  drawWindExport(ctx,captured.wind,rect,im);
  drawWindExport(ctx,captured.contours,rect,im);
  drawIndividualExportObservations(ctx,captured.observations,rect,im,boxW);
 }else{
  ctx.fillStyle=muted;ctx.font='15px Arial';ctx.textBaseline='middle';
  ctx.fillText(clipText(ctx,p.note?.textContent||'Data unavailable',boxW-32),boxX+16,boxY+boxH/2);
 }
 if(p.status!=='ready')return;
 if(verticalLegend){
  const lx=boxX+boxW+13,ly=boxY+29,lw=14,lh=Math.max(20,boxH-41);
  const m=fieldInfo(p.v,st.field,p.ds?.model||p.cfg.source),palette=pal(m,p.v),colors=legendSwatches(m,palette),n=colors.length;
  ctx.fillStyle=fg;ctx.font='bold 12px Arial';ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.fillText(clipText(ctx,m.unit||m.label,side-13),lx,boxY+11);
  for(let i=0;i<n;i++){const [a,b]=legendColorSpan(palette,i,n),top=Math.round(ly+lh*(1-b)),bottom=Math.round(ly+lh*(1-a));ctx.fillStyle=colors[i];ctx.fillRect(lx,top,lw,bottom-top);}
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
  const m=fieldInfo(p.v,st.field,p.ds?.model||p.cfg.source),palette=pal(m,p.v),colors=legendSwatches(m,palette),n=colors.length;
  const fullLegend=`${m.label}${m.unit?' ('+m.unit+')':''}`;
  ctx.fillStyle=fg;ctx.font=`bold ${Math.max(12,Math.min(16,w/58))}px Arial`;
  ctx.fillText(clipText(ctx,fullLegend,w-30),x+18,y+h-61);
  // Build the export legend from palette data, never stretch the small vertical
  // browser legend canvas into a horizontal gradient.
  const bx=x+18,by=y+h-42,bw=w-36,bh=13;
  for(let i=0;i<n;i++){const [a,b]=legendColorSpan(palette,i,n),left=Math.round(bx+a*bw),right=Math.round(bx+b*bw);ctx.fillStyle=colors[i];ctx.fillRect(left,by,right-left,bh);}
  const ticks=p.legendTicks||legendTicks(m,p.v);ctx.fillStyle=muted;ctx.font='11px Arial';
  const shown=ticks.filter((_,i)=>ticks.length<=5||w>=850||i%2===0||i===ticks.length-1);
  for(const tick of shown){
   const tx=x+18+(w-36)*tick.pos;
   ctx.textAlign=tick.pos===0?'left':tick.pos===1?'right':'center';
   ctx.fillText(tick.label,tx,y+h-15);ctx.fillRect(tx-.5,y+h-28,1,5);
  }
  ctx.textAlign='left';
 }
}
// Both ratios are fixed, presentation-quality canvases; captured maps remain
// uniformly scaled inside them (no geographic stretching).
// GIF export is intentionally bounded to prevent a large nine-panel animation
// from exhausting browser memory or monopolizing all WebGL map contexts.
function gifHoursInRange(start,end,step,hours){
 const supported=new Set(hours),out=[];
 for(let h=start;h<=end;h+=step)if(supported.has(h))out.push(h);
 return out;
}
function gifSelection(){
 const start=Number(el.exportGifStart.value),end=Number(el.exportGifEnd.value),step=Number(el.exportGifStep.value);
 const hours=gifHoursInRange(start,end,step,availableHours());
 const high=el.exportGifQuality?.value!=='standard';
 const maxFrames=high?19:25;
 return {start,end,step,hours,maxFrames,delay:Number(el.exportGifDelay.value)};
}
function syncGifExportControls(){
 if(!el.exportForm)return;
 const gif=el.exportForm.querySelector('input[name="exportKind"]:checked')?.value==='gif';
 el.exportGifOptions.hidden=!gif;el.exportConfirmBtn.textContent=gif?'Download animated GIF':'Download PNG';
 // Aspect-ratio size labels must describe the selected export format.
 // Previously they showed PNG dimensions even after selecting a smaller GIF.
 const multi=st.exportSelection?.type==='all';
 for(const [id,ratio] of [['exportSize169','16:9'],['exportSize43','4:3']]){
  const {width,height}=gif?gifOutputDimensions(ratio,multi):exportDimensions(multi,ratio);
  el[id].textContent=`${width.toLocaleString()} × ${height.toLocaleString()} px`;
 }
 const selection=gifSelection();
 el.exportGifStartLabel.textContent=`F${pad3(selection.start)}`;
 el.exportGifEndLabel.textContent=`F${pad3(selection.end)}`;
 el.exportGifDelayLabel.textContent=`${selection.delay} ms`;
 const valid=selection.start<=selection.end&&selection.hours.length>0&&selection.hours.length<=selection.maxFrames;
 el.exportGifSummary.textContent=selection.start>selection.end?'Start must be at or before end':
  `${selection.hours.length} frame(s) · max ${selection.maxFrames} · ${gifOutputDimensions('16:9',st.exportSelection?.type==='all').width} px wide${selection.hours.length>selection.maxFrames?' — shorten range or increase step':''}`;
 el.exportConfirmBtn.disabled=st.exporting||gif&&!valid;
}
function resetDefaultGifRange(){
 const max=Number(el.exportGifEnd.max)||0;
 el.exportGifStart.value='0';
 el.exportGifEnd.value=String(Math.min(max,el.exportGifQuality?.value==='standard'?24:18));
}
function gifOutputDimensions(ratio,multi){
 const width=el.exportGifQuality?.value==='standard'?1200:1600;
 return {width,height:Math.round(width*(ratio==='4:3'?.75:9/16))};
}
async function exportAnimationGif(selection,ratio,framing){
 if(selection.type==='difference')throw Error('Animated difference maps are not supported; use PNG.');
 if(!window.EVUGif?.Encoder)throw Error('GIF encoder unavailable. Check js/gif-export.js.');
 const opt=gifSelection();
 if(opt.start>opt.end||!opt.hours.length||opt.hours.length>opt.maxFrames)throw Error('Choose a valid GIF forecast-hour range.');
 stop();const original=st.hour,focused=st.expandedPanel;
 const {width,height}=gifOutputDimensions(ratio,selection.type==='all');
 const encoder=new window.EVUGif.Encoder(width,height);
 const scaled=document.createElement('canvas');scaled.width=width;scaled.height=height;
 const ctx=scaled.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw Error('Animated GIF export needs a 2D canvas.');
 try{
  if(selection.type==='all'&&focused){setExpandedPanel(null,false);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}
  for(let i=0;i<opt.hours.length;i++){
   const hour=opt.hours[i];st.hour=hour;syncUI();
   el.exportBusyStatus.textContent=`Rendering GIF frame ${i+1}/${opt.hours.length} · F${pad3(hour)}…`;
   await renderAll();
   const panel=selection.panel;
   if(selection.type==='panel'&&panel?.map&&panel.renderedSeq!==st.seq)await renderPanel(panel,st.seq);
   const canvas=selection.type==='all'?await exportAll(ratio,true):await exportPanel(panel,ratio,true);
   ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(canvas,0,0,width,height);
   el.exportBusyStatus.textContent=`Encoding GIF frame ${i+1}/${opt.hours.length}…`;
   encoder.addRGBA(ctx.getImageData(0,0,width,height).data,opt.delay+(i===opt.hours.length-1?500:0));
   await new Promise(resolve=>requestAnimationFrame(resolve));
  }
  const bytes=encoder.finish(),blob=new Blob([bytes],{type:'image/gif'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download=`omd_evu_${st.field}_${st.ref?.id?.replace(/[^0-9A-Za-z]/g,'')||'run'}_f${pad3(opt.hours[0])}-f${pad3(opt.hours.at(-1))}_${selection.type}.gif`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);
 }finally{
  st.hour=original;syncUI();await renderAll();
  if(selection.type==='all'&&focused)setExpandedPanel(focused,!focused.map);
 }
}
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
 el.exportDialogTitle.textContent=multi?'Save all panels':type==='difference'?'Save difference map':'Save panel';
 el.exportGifChoice.hidden=type==='difference';
 el.exportForm.querySelector('input[name="exportKind"][value="png"]').checked=true;
 el.exportGifOptions.hidden=true;
 el.exportDialogHelp.textContent=type==='difference'
  ?'Choose 16:9 or 4:3 and how the difference map fits the saved plot. Fit shows surrounding geography; Fill crops edges without stretching. The map style and visible boundary detail are preserved.'
  :'Choose PNG or GIF, an aspect ratio, and whether the map should fill the frame or fit entirely.';
 for(const [id,ratio] of [['exportSize169','16:9'],['exportSize43','4:3']]){
  const {width,height}=exportDimensions(multi,ratio);el[id].textContent=`${width.toLocaleString()} × ${height.toLocaleString()} px`;
 }
 let ratio=st.lastExportRatio;try{ratio=localStorage.getItem('omd_evu_export_ratio')||ratio;}catch(_){}
 const radio=el.exportForm.querySelector(`input[name="exportRatio"][value="${ratio==='4:3'?'4:3':'16:9'}"]`);
 radio.checked=true;let framing=st.lastExportFraming;try{framing=localStorage.getItem('omd_evu_export_framing')||framing;}catch(_){}
 el.exportForm.querySelector(`input[name="exportFraming"][value="${framing==='fit'?'fit':'fill'}"]`).checked=true;
 const gifHours=availableHours();const max=Math.max(0,...gifHours);
 el.exportGifStart.min='0';el.exportGifStart.max=String(max);
 el.exportGifEnd.min='0';el.exportGifEnd.max=String(max);
 el.exportGifDelay.value='700';el.exportGifStep.value='1';el.exportGifQuality.value='high';
 st.gifCustomRange=false;resetDefaultGifRange();
 el.exportLargeLabels.checked=false;
 syncGifExportControls();el.exportBusyStatus.textContent='';el.exportDialog.showModal();
 // No click-anchoring: GIF options change the dialog height AFTER it opens.
 // A centered, viewport-bounded modal with a scrollable body keeps actions
 // reachable even on short screens and high browser zoom levels.
 el.exportDialog.style.left='';
 el.exportDialog.style.top='';
 el.exportScroll.scrollTop=0;
}
async function exportPanel(p,ratio='16:9',returnCanvas=false){
 if(!p.map&&p.status!=='ready')await activate(p);
 const {width,height}=returnCanvas?gifOutputDimensions(ratio,false):exportDimensions(false,ratio);
 const c=document.createElement('canvas');c.width=width;c.height=height;
 await drawExport(c.getContext('2d'),p,0,0,width,height);
 if(returnCanvas)return c;
 await canvasPNG(c,`evu_${p.src?.id||'model'}_${p.v?.name||'missing'}_${p.ds?.id||'run'}_f${pad3(p.h??0)}_${ratio.replace(':','x')}.png`);
}
function drawSharedExportLegend(ctx,x,y,w,h){
 const data=sharedPalette();if(!data)return;
 const {m,palette,ticks}=data,light=st.theme==='light';
 const fg=light?'#1d2e42':'#eef4fa',muted=light?'#54687e':'#aebfd1';
 const title=`${m.label}${m.unit?' ('+m.unit+')':''}`;
 const left=x+Math.max(4,Math.round(w*.07)),right=x+w-Math.max(4,Math.round(w*.07));
 const barW=right-left,barY=y+Math.round(h*.33),barH=Math.max(12,Math.min(20,Math.round(h*.25)));
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg;
 ctx.font=`bold ${Math.max(15,Math.min(24,w/115))}px Arial`;
 ctx.fillText(clipText(ctx,title,barW),x+w/2,y+Math.round(h*.15));
 const colors=legendSwatches(m,palette),n=colors.length;
 colors.forEach((color,i)=>{const [a,b]=legendColorSpan(palette,i,n),from=Math.round(left+a*barW),to=Math.round(left+b*barW);ctx.fillStyle=color;ctx.fillRect(from,barY,to-from,barH);});
 ctx.strokeStyle=muted;ctx.lineWidth=1;ctx.strokeRect(left,barY,barW,barH);
 ctx.fillStyle=muted;ctx.font=`${Math.max(11,Math.min(17,w/160))}px Arial`;
 const shown=visibleSharedTicks(ticks,w*.9);
 for(const t of shown){
  const tx=left+barW*t.pos;
  ctx.textAlign=t.pos<.001?'left':t.pos>.999?'right':'center';
  ctx.fillRect(tx-.5,barY+barH,1,6);
  ctx.fillText(t.label,tx,barY+barH+Math.min(18,Math.round(h*.26)));
 }
 ctx.textAlign='left';
}
async function exportAll(ratio='16:9',returnCanvas=false){
 el.saveAllPngBtn.disabled=true;stop();
 const n=st.panels.length,{width:W,height:H}=returnCanvas?gifOutputDimensions(ratio,true):exportDimensions(true,ratio);
 const cols=Math.min(n,columnCount(n)),rows=Math.ceil(n/cols);
 // One pixel between cells, one colorbar for the whole image.
 const pad=Math.max(12,Math.round(W*.006)),gap=1;
 const largeLabels=!!st.exportLargeLabels;
 const head=largeLabels?Math.max(89,Math.round(H*.078)):Math.max(51,Math.round(H*.036));
 const legendH=Math.max(58,Math.round(H*.050));
 const cellW=(W-2*pad-gap*(cols-1))/cols;
 const cellH=(H-head-2*pad-legendH-gap*(rows-1))/rows;
 if(cellW<100||cellH<130)throw Error('Export has too many panels for the chosen layout');
 const c=document.createElement('canvas');c.width=W;c.height=H;
 const cx=c.getContext('2d');
 cx.fillStyle=st.theme==='light'?'#e8eef5':'#09111f';cx.fillRect(0,0,W,H);
 cx.fillStyle=st.theme==='light'?'#1d2e42':'#eef4fa';
 cx.textBaseline='middle';cx.textAlign='left';
 const fieldMeta=fieldInfo({name:st.field});
 const fieldHeading=`${st.field==='mslp'?'MSLP shading'+(st.overlayMSLP?' + MSLP isobars':'')+(st.overlayMSLP850?' + 850-hPa temperature (dashed where available)':''):fieldMeta.label}${fieldMeta.unit?' ('+fieldMeta.unit+')':''}`;
 const timingHeading=`Init ${fmt(st.ref.init_time)} · F${pad3(st.hour)} · Valid ${fmt(valid(st.ref,st.hour))}`;
 // Common field and valid-time information belong in the comparison image
 // header; model names stay exclusively in the individual map panels.
 cx.font=`bold ${Math.round(Math.max(27,W/110)*(largeLabels?1.65:1))}px Arial`;
 cx.fillText(clipText(cx,fieldHeading,W-2*pad),pad,head*.30);
 cx.font=`${Math.round(Math.max(15,W/220)*(largeLabels?1.7:1))}px Arial`;
 cx.fillText(clipText(cx,timingHeading,W-2*pad),pad,head*.72);
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
  if(returnCanvas)return c;
  await canvasPNG(c,`omd_evu_autumnplot_${st.ref.id.replace(/[-:.]/g,'')}_f${pad3(st.hour)}_${n}panels_${ratio.replace(':','x')}.png`);
 }finally{el.saveAllPngBtn.disabled=false;updateStatus();}
}

// v7.47 — Geographic A−B comparison. Selection order defines the sign.
// The two fields are sampled at identical latitude/longitude points. This
// deliberately never subtracts GRIB grid indices: those are not colocated
// between e.g. HRRR, RRFS, REFS, MRMS, and RAP.
const DIFFERENCE_BLOCKED_FIELDS=new Set(['refc_ptype','ptype','crain','csnow','cicep','cfrzr','snowpresence']);
const DIFFERENCE_COLORS=[
 '#193a85','#2459a8','#337bc1','#5b9ed2','#8dbbdc','#bbd9ea','#e0eff5','#f3f8fa',
 '#fff6f1','#fce0d9','#f7baae','#ee8e7e','#e46759','#cb453e','#ab302f','#852027'
];
// Difference shading uses a transparent neutral center rather than painting
// near-zero model/analysis agreement. Fade edges avoid a harsh blank stripe.
// The same alpha is used by the interactive difference and exported PNGs.
function differenceZeroOpacity(value,range){
 if(!(Number.isFinite(value)&&Number.isFinite(range)&&range>0))return 0;
 const neutral=range*.025,fadeEnd=range*.065,amount=Math.abs(value);
 return amount<=neutral?0:amount>=fadeEnd?1:(amount-neutral)/(fadeEnd-neutral);
}
const DIFFERENCE_LIMITS={mslp:12,t2m:15,dpt2m:15,t925:10,t850:10,t700:10,rh2m:40,
 wspd10:30,gust:40,refc:30,prate:30,apcp:3,apcp1h:1.5,apcp3h:2,apcp6h:3,apcp24h:5,apcp48h:8,snow1h:6,snow3h:12,snow6h:18,
 snod:24,asnow:24,weasd:4,frzr:2,frozr:2,tsnowp:3,
 cpofp:40,snowc:40,sden:150};
const DIFFERENCE_TICK_STEPS={mslp:4,t2m:5,dpt2m:5,t925:5,t850:5,t700:5,rh2m:10,
 wspd10:10,gust:10,refc:10,prate:10,apcp:1,apcp1h:.5,apcp3h:.5,apcp6h:1,apcp24h:2,apcp48h:3,snow1h:2,snow3h:3,snow6h:6,
 snod:6,asnow:6,weasd:1,frzr:.5,frozr:.5,tsnowp:1,
 cpofp:10,snowc:10,sden:50};
function differenceAnalysisSource(p){
 if(p?.cfg?.timeMode!=='analysis')return '';
 const source=String(p.ds?.product||p.ds?.source||'').toLowerCase();
 const known=/^(mrms|rap|rtma|urma)(?:_|$)/.exec(source);
 return known?known[1].toUpperCase():(source?source.toUpperCase():'unavailable');
}
function differenceLabel(p){
 const label=p?.cfg?.label||p?.cfg?.id||'Panel',source=differenceAnalysisSource(p);
 return source?`${label} (${source})`:label;
}
function differenceTicks(field,limit){
 const step=DIFFERENCE_TICK_STEPS[field]||Math.max(1,limit/3);
 const n=Math.round(limit/step),ticks=[];
 for(let i=-n;i<=n;i++)if(Math.abs(i*step)<=limit+1e-6)ticks.push(Number((i*step).toFixed(4)));
 if(!ticks.some(x=>x===-limit))ticks.unshift(-limit);
 if(!ticks.some(x=>x===limit))ticks.push(limit);
 return [...new Set(ticks)].sort((a,b)=>a-b);
}
function differenceNumber(x){
 if(!Number.isFinite(x))return '—';
 const nearZero=Math.abs(x)<1e-8;return nearZero?'0':String(Number(x.toFixed(3)));
}
function setDifferenceLegend(field,range,unit){
 const ticks=differenceTicks(field,range);
 const root=el.differenceWindow.querySelector('.difference-legend-ticks');
 const maxVisible=Math.max(3,Math.floor((root.clientWidth||540)/48));
 const stride=Math.max(1,Math.ceil(ticks.length/maxVisible));
 root.replaceChildren(...ticks.map((v,i)=>{
  const node=document.createElement('span');
  if(i!==0&&i!==ticks.length-1&&v!==0&&i%stride!==0)node.hidden=true;node.textContent=differenceNumber(v);
  node.style.left=((v+range)/(2*range)*100)+'%';
  node.className=Math.abs(v)<1e-7?'difference-zero-tick':'';
  return node;
 }));
 el.differenceLegendUnit.textContent=unit?`Difference (${unit})`:'Difference';
}
function differenceSampleValue(field,lng,lat){
 if(!field)return NaN;
 try{const value=field.sampleField(lng,lat);return value==null?NaN:Number(value);}catch(_){return NaN;}
}
function paintDifferenceSample(event){
 const snap=st.difference.snapshot,ui=el.differenceSample;
 if(!snap||!st.difference.open||!event?.lngLat){ui.hidden=true;return;}
 const lon=event.lngLat.lng,lat=event.lngLat.lat;
 const av=differenceSampleValue(snap.rawA,lon,lat),bv=differenceSampleValue(snap.rawB,lon,lat);
 if(!Number.isFinite(av)||!Number.isFinite(bv)||av<-1e9||bv<-1e9){
  ui.textContent=`${lat.toFixed(2)}°, ${lon.toFixed(2)}° · No overlapping data`;
 }else{
  const fmt=x=>formatReadout(x,snap.meta),unit=snap.unit?` ${snap.unit}`:'';
  ui.textContent=`${lat.toFixed(2)}°, ${lon.toFixed(2)}° · Δ ${fmt(av-bv)}${unit} · ${snap.labelA}: ${fmt(av)} · ${snap.labelB}: ${fmt(bv)}`;
 }
 ui.hidden=false;
}
function invalidateDifferenceForViewChange(){
 const diff=st.difference;if(!diff.open)return;
 diff.token++;
 if(diff.timer){clearTimeout(diff.timer);diff.timer=null;}
 diff.snapshot=null;diff.liveToken++;if(diff.liveCanvas)diff.liveCanvas.style.visibility='hidden';el.differenceSaveBtn.disabled=true;el.differenceSample.hidden=true;
 showDifferenceMessage('Waiting for matching panels at the selected forecast hour…');
}

function setDifferenceSelection(p,checked){
 const diff=st.difference;
 if(!p||p.cfg.placeholder)return;
 if(checked){
  if(diff.selected.includes(p)){p.compareCheck.checked=true;return;}
  if(diff.selected.length>=2){p.compareCheck.checked=false;return;}
  diff.selected.push(p);
 }else{
  diff.selected=diff.selected.filter(x=>x!==p);
  if(diff.open){closeDifferenceWindow();return;}
 }
 st.panels.forEach(x=>{if(x.compareCheck)x.compareCheck.checked=diff.selected.includes(x);});
 if(diff.selected.length===2&&!diff.open){
  el.differenceDialogPair.textContent=`${differenceLabel(diff.selected[0])} − ${differenceLabel(diff.selected[1])}`;
  if(DIFFERENCE_BLOCKED_FIELDS.has(st.field)){
   el.differenceDialogPair.textContent+=' · This categorical field cannot be meaningfully subtracted.';
   el.differenceOpenBtn.disabled=true;
  }else el.differenceOpenBtn.disabled=false;
  if(!el.differenceDialog.open)el.differenceDialog.showModal();
  scheduleDifferenceInputWarm();
 }
}
function bindDifferenceControls(){
 el.differenceDialog.addEventListener('close',()=>{
  if(el.differenceDialog.returnValue==='open'&&st.difference.selected.length===2){
   void openDifferenceWindow();
  }else if(!st.difference.open){
   const last=st.difference.selected.pop();if(last?.compareCheck)last.compareCheck.checked=false;
  }
 });
 el.differenceCloseBtn.addEventListener('click',closeDifferenceWindow);
 el.differenceSaveBtn.addEventListener('click',event=>{
  if(!st.difference.saveBusy&&st.difference.snapshot)openExportDialog('difference',null,event);
 });
 el.differenceDragHandle.addEventListener('pointerdown',event=>{
  if(event.button!==0||event.target.closest('button'))return;
  const win=el.differenceWindow,rect=win.getBoundingClientRect();
  const dx=event.clientX-rect.left,dy=event.clientY-rect.top;
  try{el.differenceDragHandle.setPointerCapture(event.pointerId);}catch(_){}
  const move=e=>{
   if(e.pointerId!==event.pointerId)return;
   win.style.left=Math.round(Math.max(0,Math.min(innerWidth-45,e.clientX-dx)))+'px';
   win.style.top=Math.round(Math.max(0,Math.min(innerHeight-55,e.clientY-dy)))+'px';
  };
  const finish=e=>{
   if(e.pointerId!==event.pointerId)return;
   el.differenceDragHandle.removeEventListener('pointermove',move);
   el.differenceDragHandle.removeEventListener('pointerup',finish);
   el.differenceDragHandle.removeEventListener('pointercancel',finish);
  };
  el.differenceDragHandle.addEventListener('pointermove',move);
  el.differenceDragHandle.addEventListener('pointerup',finish);
  el.differenceDragHandle.addEventListener('pointercancel',finish);
 });
}
function showDifferenceMessage(message){
 el.differenceMessage.textContent=message;el.differenceMessage.hidden=false;
}
function clearDifferenceMessage(){el.differenceMessage.hidden=true;}
async function openDifferenceWindow(){
 const diff=st.difference;if(diff.open||diff.selected.length!==2)return;
 if(DIFFERENCE_BLOCKED_FIELDS.has(st.field))return;
 diff.open=true;diff.fieldKey=null;diff.snapshot=null;el.differenceWindow.hidden=false;el.differenceSaveBtn.disabled=true;el.differenceSample.hidden=true;
 showDifferenceMessage('Initializing difference map…');
 const camera=currentSharedCamera()||makeViewBounds();
 try{
  // MapLibre must own a child of the flex-layout map region. Moving or
  // resizing the region itself during export detaches it from the floating
  // window (v0.48.2), leaving a blank view and a stalled PNG capture.
  const host=document.createElement('div');host.className='difference-map-host';
  el.differenceMap.prepend(host);
  const map=new maplibregl.Map({container:host,style:mapStyle(),
   center:camera.center,zoom:camera.zoom,bearing:camera.bearing||0,pitch:camera.pitch||0,
   projection:{type:st.mode==='globe'?'globe':'mercator'},minZoom:0,
   maxZoom:st.cfg.display.maxZoom||12,keyboard:false,attributionControl:false,preserveDrawingBuffer:true,fadeDuration:0});
  diff.map=map;map.keyboard?.disable?.();
  // The PNG raster renderer works with these exact difference values. Display
  // the same pixels above MapLibre instead of depending on a second APGL GPU
  // custom layer (which can report valid sampling but paint no shading).
  const liveCanvas=document.createElement('canvas');
  liveCanvas.className='difference-live-shading';
  liveCanvas.setAttribute('aria-hidden','true');
  el.differenceMap.append(liveCanvas);
  diff.liveCanvas=liveCanvas;liveCanvas.style.opacity=String(st.imageOpacity);diff.liveToken++;

  map.on('mousemove',paintDifferenceSample);
  map.on('mouseout',()=>{el.differenceSample.hidden=true;});
  map.on('touchstart',()=>{el.differenceSample.hidden=true;});
  if(typeof ResizeObserver==='function'){diff.resizeObserver=new ResizeObserver(()=>{if(diff.open&&diff.map)diff.map.resize();if(diff.snapshot){setDifferenceLegend(diff.snapshot.fieldKey,diff.snapshot.range,diff.snapshot.unit);scheduleDifferenceLiveRender();}});
   diff.resizeObserver.observe(el.differenceWindow);}
  await new Promise((resolve,reject)=>{
   if(map.loaded())resolve();else{map.once('load',resolve);map.once('error',e=>reject(e.error||new Error('Difference map did not load')));}
  });
  if(!diff.open||diff.map!==map)return;
  addGeographySkeleton(map);
  diff.geo={map,geoApplied:new Set(),geoPending:new Set(),geoTimer:null};
  startGeography(diff.geo);
  map.on('movestart',()=>{if(diff.liveCanvas&&!diff.saveBusy)diff.liveCanvas.style.visibility='hidden';});
  map.on('moveend',()=>{if(diff.open&&diff.geo&&!diff.saveBusy){geographyZoom(diff.geo);scheduleDifferenceLiveRender();}});
  map.on('zoomend',()=>{if(diff.open&&diff.geo&&!diff.saveBusy){geographyZoom(diff.geo);scheduleDifferenceLiveRender();}});

  scheduleDifferenceRefresh();
 }catch(e){if(!diff.map)el.differenceMap.querySelector('.difference-map-host')?.remove();showDifferenceMessage('Difference map initialization failed: '+String(e?.message||e));}
}
function closeDifferenceWindow(){
 const diff=st.difference;diff.open=false;diff.token++;diff.liveToken++;
 if(diff.liveTimer){clearTimeout(diff.liveTimer);diff.liveTimer=null;}
 if(diff.timer){clearTimeout(diff.timer);diff.timer=null;}
 if(diff.geo?.geoTimer)clearTimeout(diff.geo.geoTimer);
 diff.resizeObserver?.disconnect();diff.resizeObserver=null;
 try{diff.map?.remove();}catch(e){console.warn('Difference map cleanup',e);}
 el.differenceMap.querySelector('.difference-map-host')?.remove();
 diff.liveCanvas?.remove();diff.liveCanvas=null;diff.outlineCache=null;
 diff.warmSerial++;diff.warmKey=null;
 diff.map=null;diff.layer=null;diff.component=null;diff.componentGridKey=null;diff.grid=null;diff.geo=null;diff.fieldKey=null;diff.snapshot=null;el.differenceSample.hidden=true;el.differenceSaveBtn.disabled=true;
 el.differenceWindow.hidden=true;diff.selected=[];
 st.panels.forEach(p=>{if(p.compareCheck)p.compareCheck.checked=false;});
}
function scheduleDifferenceRefresh(){
 const diff=st.difference;if(!diff.open||!diff.map||diff.selected.length!==2)return;
 if(diff.timer)clearTimeout(diff.timer);
 const token=++diff.token;
  diff.timer=setTimeout(()=>{diff.timer=null;void updateDifferenceMap(token);},120);
}
function differenceGridConfig(map=st.difference.map){
 const g=st.cfg?.display?.differenceGrid||{};
 const west=Number(g.west??-128),east=Number(g.east??-65);
 const south=Number(g.south??21),north=Number(g.north??54);
 const capX=Math.max(80,Math.min(1600,Math.round(Number(g.nx??721))));
 const capY=Math.max(80,Math.min(1000,Math.round(Number(g.ny??379))));
 // The original 721x379 fixed grid costs over half a million native-grid
 // interpolations at *every* hour. Choose a viewport-aware grid for the live
 // 630-pixel pop-up, and grow it for manually enlarged windows. Native
 // source fields remain untouched; high-res exports sample them separately.
 const viewW=map?.getContainer()?.clientWidth||630;
 const nx=Math.min(capX,Math.max(260,Math.round(viewW*0.73)));
 const ny=Math.min(capY,Math.max(140,Math.round(nx*capY/capX)));
 if(!(west<east&&south<north))throw Error('Invalid difference-grid geographic bounds');
 return{west,east,south,north,nx,ny};
}
// All model stores share one Lambert grid. The only offline preprocessing is
// analysis-to-model regridding. No 2-D longitude/latitude sampling happens here.
function identicalDifferenceGrids(a,b){
 const x=a?.ds?.grid,y=b?.ds?.grid;
 return x&&y&&['GRIB_Nx','GRIB_Ny','GRIB_DxInMetres','GRIB_DyInMetres',
 'GRIB_LoVInDegrees','GRIB_LaDInDegrees','GRIB_Latin1InDegrees',
 'GRIB_Latin2InDegrees','GRIB_longitudeOfFirstGridPointInDegrees',
 'GRIB_latitudeOfFirstGridPointInDegrees'].every(k=>Number(x[k])===Number(y[k]));
}
function alignedRecord(product,when,field){
 const src=st.alignedSource;if(!src)return null;
 const time=cycleKey(when);
 const ds=src.datasets.find(d=>d.product===product&&cycleKey(d.init_time)===time&&
    d.variables?.some(v=>v.name===field&&v.available_hours?.includes(0)));
 const variable=ds?.variables?.find(v=>v.name===field&&v.available_hours?.includes(0));
 return variable?{src,ds,v:variable}:null;
}
async function reloadAlignedCatalog(){
 const url=st.alignedSource?.url||new URL(st.cfg.alignedAnalysisCatalogUrl||'data/catalog_aligned_analysis.json',document.baseURI);
 const response=await fetch(url,{cache:'no-store'});
 if(!response.ok)throw Error(`Aligned catalog HTTP ${response.status}`);
 const cat=await response.json();
 if(cat.schema!=='rrfs-zarr-viewer-1'||!Array.isArray(cat.datasets))throw Error('Invalid aligned-analysis catalog');
 st.alignedSource={id:'aligned_analysis',url,datasets:cat.datasets};
 return cat.datasets.length;
}
async function requireAlignedRecord(product,time,field){
 let result=alignedRecord(product,time,field);
 if(result)return result;
 try{await reloadAlignedCatalog();}catch(e){console.warn('Could not refresh aligned catalog',e);}
 result=alignedRecord(product,time,field);
 if(!result){
  const stamp=fmt(time);
  throw Error(`Aligned ${String(product).toUpperCase()} ${field} not published for ${stamp}. `+
   `The native Analysis panel may be available before this aligned file is backfilled. `+
   `Run aligned_analysis.py --products ${product} for this valid hour, publish, then reload.`);
 }
 return result;
}
// Difference-only prefetch. Main forecast fields are already warm through the
// viewer's adaptive prefetch, but model-vs-analysis differences additionally
// require *aligned* verifying analyses that the Analysis panel never displays.
// Fetch the selected hour and (if applicable) the next hour proactively once
// two panels are chosen. The two-data-item bound avoids saturating WCOSS2/RZDM
// or displacing the normal nine-panel playback working set.
function scheduleDifferenceInputWarm(){
 const diff=st.difference;
 if(diff.selected.length!==2||!st.ref||DIFFERENCE_BLOCKED_FIELDS.has(st.field))return;
 const analysis=diff.selected.find(p=>p.cfg.timeMode==='analysis');
 if(!analysis?.ds?.product)return; // No additional input for model-vs-model.
 const key=[st.ref.id,st.field,st.hour,...diff.selected.map(p=>p.cfg.id)].join('|');
 if(diff.warmKey===key)return;
 diff.warmKey=key;
 const serial=++diff.warmSerial;
 // Delay until the dialog is painted; all requests use the existing shared
 // download/decode cache, so opening the difference window reuses the results.
 setTimeout(()=>void warmDifferenceAlignedHours(analysis,key,serial),80);
}
async function warmDifferenceAlignedHours(panel,key,serial){
 const diff=st.difference;
 const stillCurrent=()=>diff.warmKey===key&&diff.warmSerial===serial&&
     diff.selected.includes(panel)&&st.ref&&key.startsWith(st.ref.id+'|');
 try{
  if(!stillCurrent())return;
  if(!st.alignedSource)await reloadAlignedCatalog();
  if(!stillCurrent())return;
  const product=panel.ds?.product;
  const windowHours=precipitationAccumulationHours(st.field);
  const field=windowHours?'apcp':st.field;
  const timeline=playbackHours();
  const index=timeline.indexOf(st.hour);
  const hours=[st.hour,...(index>=0&&index+1<timeline.length?[timeline[index+1]]:[])];
  const records=[],seen=new Set();
  const add=(hour,fieldName)=>{
   if(hour<0)return;
   const rec=alignedRecord(product,valid(st.ref,hour),fieldName);
   if(rec){const k=prefetchChunkUrl(rec.src,rec.ds,rec.v,0);
    if(!seen.has(k)){seen.add(k);records.push(rec);}}
  };
  for(const hour of hours){
   if(windowHours&&product==='mrms_apcp'){
    // Bounded recent slices; older MRMS hours are loaded on demand.
    for(let h=Math.max(1,hour-1);h<=hour;h++)add(h,'apcp');
   }else if(st.field==='apcp'&&product==='mrms_apcp'){
    for(let h=Math.max(1,hour-1);h<=hour;h++)add(h,'apcp');
   }else if(st.field==='snow48h'&&product==='nohrsc_24h'){
    add(hour,'snow24h');add(hour-24,'snow24h');
   }else add(hour,field);
   if(records.length>=4)break;
  }
  // CacheStorage background fetch shares queue priorities with the nine
  // foreground panels. It doesn't force expensive GPU-layer initialization.
  await Promise.allSettled(records.slice(0,4).map(async rec=>{
   if(!stillCurrent())return;
   const url=prefetchChunkUrl(rec.src,rec.ds,rec.v,0);
   await compressedChunk(url,{background:true});
  }));
 }catch(e){console.debug('Difference prewarm skipped:',e);}
}

async function alignedDisplayForAnalysis(panel,token){
 const product=panel.ds?.product,precipWindow=precipitationAccumulationHours(st.field),field=precipWindow?'apcp':st.field;
 const m=FIELDS[st.field];
 if(!st.alignedSource){try{await reloadAlignedCatalog();}catch(e){throw Error('Aligned analysis catalog is not available: '+String(e?.message||e));}}
 if(!product)throw Error('Cannot identify verifying analysis source.');
 if(precipWindow){
  if(product!=='mrms_apcp')throw Error(`${precipWindow}-hour precipitation requires MRMS analysis.`);
  if(st.hour<precipWindow)throw Error(`Need F${pad3(precipWindow)} for a complete ${precipWindow}-h MRMS interval.`);
  let sum=null,grid=null,recLast=null;
  for(let h=st.hour-precipWindow+1;h<=st.hour;h++){
   if(token!==st.difference.token)throw Error('Difference selection changed.');
   const rec=await requireAlignedRecord('mrms_apcp',valid(st.ref,h),'apcp');
   const vals=await getDisplayData(rec.src,rec.ds,rec.v,0,m,()=>{});
   if(sum&&JSON.stringify(rec.ds.grid)!==JSON.stringify(grid))throw Error('Aligned MRMS grids differ within accumulation interval.');
   if(!sum){sum=new Float32Array(vals);grid=rec.ds.grid;}
   else {
    if(sum.length!==vals.length)throw Error('Aligned MRMS shapes differ.');
    for(let i=0;i<sum.length;i++)sum[i]=Number.isFinite(sum[i])&&Number.isFinite(vals[i])&&sum[i]>-1e9&&vals[i]>-1e9?sum[i]+vals[i]:-1e10;
   }
   recLast=rec;
  }
  return {...recLast,data:sum,grid};
 }
 if(st.field==='apcp'){
  // Match existing MRMS cycle-to-date definition; missing hours are never zero.
  if(product!=='mrms_apcp')throw Error('Accumulated precipitation requires MRMS analysis.');
  const key=st.ref.init_time;
  let cache=st.alignedAccumCache;
  if(!cache||cache.key!==key||cache.hour>st.hour){cache={key,hour:0,data:null};}
  for(let h=cache.hour+1;h<=st.hour;h++){
   if(token!==st.difference.token)throw Error('Difference selection changed.');
   const rec=await requireAlignedRecord('mrms_apcp',valid(st.ref,h),'apcp');
   const values=await getDisplayData(rec.src,rec.ds,rec.v,0,m,()=>{});
   if(!cache.data)cache.data=new Float32Array(values);
   else for(let i=0;i<cache.data.length;i++){
    const v=values[i],old=cache.data[i];cache.data[i]=v> -1e9&&old> -1e9&&Number.isFinite(v)&&Number.isFinite(old)?old+v:-1e10;
   }
   cache.hour=h;st.alignedAccumCache=cache;
  }
  if(!cache.data)throw Error('MRMS accumulation requires at least F001.');
  const rec=await requireAlignedRecord('mrms_apcp',valid(st.ref,Math.max(1,st.hour)),'apcp');
  return {...rec,data:cache.data,grid:rec.ds.grid};
 }
 if(st.field==='snow48h'){
  if(product!=='nohrsc_24h')throw Error('48-hour snowfall requires two NOHRSC 24-hour analyses.');
  if(st.hour<48)throw Error('Need F048 or later for a complete 48-hour snowfall interval.');
  const end=valid(st.ref,st.hour),start=new Date(end.getTime()-24*3600000);
  const last=await requireAlignedRecord('nohrsc_24h',end,'snow24h');
  const earlier=await requireAlignedRecord('nohrsc_24h',start,'snow24h');
  checkSnowAnalysisGrids(last.ds,earlier.ds,last.v,earlier.v);
  const [a,b]=await Promise.all([
   getDisplayData(last.src,last.ds,last.v,0,m,()=>{}),
   getDisplayData(earlier.src,earlier.ds,earlier.v,0,m,()=>{})
  ]);
  if(token!==st.difference.token)throw Error('Difference selection changed.');
  return {...last,data:sumSnowAnalysisArrays(a,b),grid:last.ds.grid};
 }
 const rec=await requireAlignedRecord(product,valid(st.ref,st.hour),field);
 let data;try{data=await getDisplayData(rec.src,rec.ds,rec.v,0,m,()=>{});}
 catch(e){throw Error(`Could not load aligned ${product.toUpperCase()} ${field} at ${fmt(valid(st.ref,st.hour))}: ${String(e?.message||e)}. Check RZDM aligned/ permissions and catalog.`);}
 return {...rec,data,grid:rec.ds.grid};
}
async function updateDifferenceMap(token){
 const diff=st.difference;if(!diff.open||!diff.map||token!==diff.token)return;
 const [a,b]=diff.selected;const fieldKey=st.field,meta=FIELDS[fieldKey];
 el.differenceWindowTitle.textContent=`Difference · ${meta?.label||fieldKey}`;
 el.differenceWindowSubtitle.textContent=`${differenceLabel(a)} − ${differenceLabel(b)} · Init ${fmt(st.ref.init_time)} · F${pad3(st.hour)}`;
 if(DIFFERENCE_BLOCKED_FIELDS.has(fieldKey)){
  showDifferenceMessage('Categorical fields cannot be subtracted. Choose a continuous field.');return;
 }
 if(!a.map||!b.map){showDifferenceMessage('Loading selected panels…');
  for(const p of [a,b])if(!p.map&&!p.activation)void activate(p,'direct').catch(console.warn);return;}
 if([a,b].some(p=>p.busy||p.status==='loading'||p.renderedSeq!==st.seq)){
  showDifferenceMessage('Waiting for matching forecast fields…');return;
 }
 if([a,b].some(p=>p.status!=='ready'||!p.rawField||!p.diffDisplayData)){
  showDifferenceMessage('A matching field or forecast hour is unavailable for one or both selected panels.');return;
 }
 const am=fieldInfo(a.v),bm=fieldInfo(b.v);
 if(am.unit!==bm.unit||am.ensembleMeanFraction!==bm.ensembleMeanFraction){
  showDifferenceMessage('Incompatible units or statistics; difference not computed.');return;
 }
 showDifferenceMessage('Loading aligned data and subtracting grids…');
 try{
  const isAnalysis=p=>p.cfg.timeMode==='analysis';
  if(isAnalysis(a)&&isAnalysis(b))throw Error('Analysis–Analysis subtraction is not configured.');
  let arrayA=a.diffDisplayData,arrayB=b.diffDisplayData;
  let rawA=a.rawField,rawB=b.rawField;
  const model=isAnalysis(a)?b:a;
  if(isAnalysis(a)||isAnalysis(b)){
   const analysis=isAnalysis(a)?a:b;
   const aligned=await alignedDisplayForAnalysis(analysis,token);
   if(!aligned)throw Error('Aligned analysis is unavailable.');
   const v=aligned.v,ds=aligned.ds;
   // The aligned analysis has exactly the model grid dimensions and projection.
   const modelShape=model.v.shape;
   if(v.shape[1]!==modelShape[1]||v.shape[2]!==modelShape[2]||
      !['GRIB_Nx','GRIB_Ny','GRIB_DxInMetres','GRIB_DyInMetres','GRIB_LoVInDegrees',
       'GRIB_LaDInDegrees','GRIB_Latin1InDegrees','GRIB_Latin2InDegrees',
       'GRIB_longitudeOfFirstGridPointInDegrees','GRIB_latitudeOfFirstGridPointInDegrees']
        .every(k=>Number(ds.grid?.[k])===Number(model.ds.grid?.[k])))
      throw Error('Aligned analysis grid does not match selected model.');
   const alignedField=new apgl.RawScalarField(gridForPanel(model,model.ds,model.v),aligned.data);
   if(isAnalysis(a)){arrayA=aligned.data;rawA=alignedField;}
   else{arrayB=aligned.data;rawB=alignedField;}
  }else if(!identicalDifferenceGrids(a,b))throw Error('Models have different native grids; no pre-aligned comparison available.');
  if(token!==diff.token||!diff.open||st.seq!==a.renderedSeq)return;
  if(arrayA.length!==arrayB.length)throw Error('Difference array dimensions are inconsistent.');
  const range=DIFFERENCE_LIMITS[fieldKey]||Math.max(1,(am.max??100)-(am.min??0))*.25;
  const arr=new Float32Array(arrayA.length);let count=0;
  for(let i=0;i<arr.length;i++){
   const va=arrayA[i],vb=arrayB[i];
   if(Number.isFinite(va)&&Number.isFinite(vb)&&va> -1e9&&vb> -1e9){arr[i]=Math.max(-range,Math.min(range,va-vb));count++;}
   else arr[i]=-1e10;
  }
  if(!count)throw Error('No overlapping valid points for this comparison.');
  console.info('Difference native grid',fieldKey,'valid points',count,'of',arr.length);
  const grid=gridForPanel(model,model.ds,model.v);
  const field=new apgl.RawScalarField(grid,arr);
  // Rendering this via a second PlotLayer was unreliable in the floating
  // MapLibre map. The canvas renderer is the same proven path used by PNG.
  // No resampling of A or B is needed: the difference is native-grid.
  if(token!==diff.token||!diff.open)return;
  setDifferenceLegend(fieldKey,range,am.unit||'');
  diff.snapshot={fieldKey,range,unit:am.unit||'',meta:am,rawA,rawB,rawDifference:field,
   labelA:differenceLabel(a),labelB:differenceLabel(b),seq:st.seq,init:st.ref.init_time,
   hour:st.hour,valid:fmt(valid(st.ref,st.hour)),nativeAligned:true};
  await paintDifferenceLive(diff.snapshot);
  if(token!==diff.token||!diff.open)return;
  el.differenceSaveBtn.disabled=false;clearDifferenceMessage();
  // Warm the next verification hour while this rendered frame is being viewed.
  scheduleDifferenceInputWarm();
 }catch(err){if(token===diff.token){console.error('Difference render failed',err);
  showDifferenceMessage('Difference unavailable: '+String(err?.message||err));}}
}

// v0.49.2: live difference shading uses the already-working PNG raster
// renderer at viewport resolution. This deliberately avoids a secondary
// autumnplot-gl custom GPU layer that could be sampled but invisible.
function scheduleDifferenceLiveRender(delay=65){
 const diff=st.difference;
 if(!diff.open||!diff.map||!diff.snapshot||diff.saveBusy)return;
 if(diff.liveTimer)clearTimeout(diff.liveTimer);
 const expected=++diff.liveToken;
 diff.liveTimer=setTimeout(()=>{
  diff.liveTimer=null;
  if(expected!==diff.liveToken)return;
  void paintDifferenceLive(diff.snapshot).catch(err=>console.warn('Difference canvas redraw failed:',err));
 },delay);
}
function differenceGeoVisibility(map){
 const visible={};
 const geo=st.difference.geo;
 for(const [key,id] of [['coast','coast'],['coast_detail','coast-detail'],
  ['country','country'],['country_detail','country-detail'],['states','states'],['counties','counties']]){
  const layer=map.getLayer?.(id);
  visible[key]=Boolean(layer&&geo?.geoApplied?.has(key)&&
   map.getLayoutProperty(id,'visibility')!=='none'&&
   map.getZoom()>=(layer.minzoom||0));
 }
 return visible;
}
async function paintDifferenceLive(snapshot){
 const diff=st.difference,map=diff.map,canvas=diff.liveCanvas;
 if(!diff.open||!map||!canvas||!snapshot||snapshot!==diff.snapshot||diff.saveBusy)return;
 const token=++diff.liveToken;
 const bounds=map.getContainer().getBoundingClientRect();
 const width=Math.max(1,Math.round(bounds.width)),height=Math.max(1,Math.round(bounds.height));
 if(width<2||height<2)return;
 // Render only the actual visible map. Unlike the 1920px PNG, this does
 // tens of thousands of sampling calls, not millions, on normal windows.
 const raster=await differenceExportRaster(map,snapshot,width,height,{interactive:true});
 if(token!==diff.liveToken||!diff.open||snapshot!==diff.snapshot||diff.saveBusy)return;
 // Show pixels immediately; don't hold back the shading on a slow
 // GeoJSON fetch (or a high-resolution county outline redraw).
 canvas.width=width;canvas.height=height;
 canvas.getContext('2d').drawImage(raster,0,0,width,height);
 canvas.style.visibility='visible';
 const visible=differenceGeoVisibility(map);
 if(Object.values(visible).some(Boolean)){
  const center=map.getCenter();
  const key=JSON.stringify([width,height,center.lng,center.lat,map.getZoom(),map.getBearing(),map.getPitch(),st.mode,st.theme,visible]);
  let lines=diff.outlineCache?.key===key?diff.outlineCache.canvas:null;
  if(!lines){
   lines=document.createElement('canvas');lines.width=width;lines.height=height;
   await redrawDifferenceBoundaries(lines,map,{exportGeoVisible:visible});
   if(token!==diff.liveToken||!diff.open||snapshot!==diff.snapshot||diff.saveBusy)return;
   diff.outlineCache={key,canvas:lines};
  }
  canvas.getContext('2d').drawImage(lines,0,0);
 }
}

// Difference PNGs use a high-resolution MapLibre frame, not the small live
// window's framebuffer stretched to presentation size. This is the same
// temporary enlarge + camera-zoom strategy as sharp standalone panel exports.
// It preserves the geographic footprint and restores the user's view even if
// sampling, WebGL capture, or PNG encoding fails.
// Capture a map background, difference shading, and geographic boundaries at
// exactly the SAME camera and pixel dimensions. We use the live renderer's
// final outline pass above the shading; the older PNG only drew underneath it.
// Framing matches the main-panel exporter: Fill crops, Fit expands the camera
// viewport to show extra geography instead of stretching the projection.
async function captureSharpDifferenceFrame(map,snapshot,plotWidth,plotHeight,framing='fill'){
 const host=map.getContainer(),parent=host.parentElement,screen=map.getCanvas();
 const previousStyle=host.getAttribute('style');
 const camera={center:map.getCenter(),zoom:map.getZoom(),bearing:map.getBearing(),pitch:map.getPitch()};
 const width=parent.clientWidth||host.clientWidth||screen.clientWidth;
 const height=parent.clientHeight||host.clientHeight||screen.clientHeight;
 if(!(width>0&&height>0))throw Error('Difference window has no map dimensions.');
 const aspect=plotWidth/plotHeight;
 let viewW=width,viewH=height;
 if(framing==='fit'){
  if(width/height<aspect)viewW=Math.ceil(height*aspect);
  else viewH=Math.ceil(width/aspect);
 }
 const wanted=framing==='fit'
  ?Math.min(plotWidth/viewW,plotHeight/viewH)
  :Math.max(plotWidth/viewW,plotHeight/viewH);
 const maxZoom=typeof map.getMaxZoom==='function'?map.getMaxZoom():12;
 const scale=Math.max(1,Math.min(wanted,3072/viewW,3072/viewH,8,
  Math.pow(2,Math.max(0,maxZoom-camera.zoom))));
 const captureW=Math.ceil(viewW*scale),captureH=Math.ceil(viewH*scale);
 const enlarged=captureW>width+1||captureH>height+1;
 // Use the same geographic visibility as the actual on-screen difference.
 // This also prevents an artificial export zoom from introducing counties.
 const visible=differenceGeoVisibility(map);
 const layerIds=['coast','coast-detail','country','country-detail','states','counties'];
 const lineStates=[];
 const detailStates=[];
 for(const id of layerIds){
  if(map.getLayer(id))lineStates.push([id,map.getLayoutProperty(id,'visibility')||'visible']);
 }
 for(const id of ['land-detail-mask','land-detail-fill','lakes-detail-fill']){
  if(map.getLayer(id))detailStates.push([id,map.getLayoutProperty(id,'visibility')||'visible']);
 }
 const detailWasVisible=map.getZoom()>=detailThreshold();
 const preview=document.createElement('div');preview.className='difference-export-preview';
 const message=document.createElement('span');message.textContent='Preparing high-resolution PNG…';
 preview.append(message);
 let ratioBefore=null,changedRatio=false;
 try{
  // Keep the interactive popup visible while the map is temporarily enlarged.
  try{const png=readMapFramebuffer(map);if(png){const img=new Image();img.src=png;preview.prepend(img);}}catch(_){}
  parent.append(preview);
  if(enlarged){
   host.style.position='absolute';host.style.inset='auto';
   host.style.left=Math.round((width-captureW)/2)+'px';
   host.style.top=Math.round((height-captureH)/2)+'px';
   host.style.width=captureW+'px';host.style.height=captureH+'px';
   host.style.flex='none';
   map.resize();
   map.jumpTo({...camera,zoom:camera.zoom+Math.log2(scale)});
  }
  if(typeof map.getPixelRatio==='function'&&typeof map.setPixelRatio==='function'){
   ratioBefore=map.getPixelRatio();
   const maxRatio=Math.max(1,Math.min(4,Number(st.cfg?.display?.exportMaxPixelRatio??4)||4));
   const needed=Math.max(plotWidth/captureW,plotHeight/captureH);
   const budget=Math.min(3072/captureW,3072/captureH);
   const target=Math.min(maxRatio,budget,needed);
   if(Number.isFinite(target)&&target>ratioBefore+.05){map.setPixelRatio(target);changedRatio=true;}
  }
  // Freeze map details to the exact set visible when Save PNG was clicked.
  if(!detailWasVisible)for(const [id] of detailStates)map.setLayoutProperty(id,'visibility','none');
  // Never bake faint MapLibre linework underneath semi-opaque difference
  // shading. All visible outlines are instead drawn once, ON TOP, using
  // the identical colors and stroke routine as the floating live view.
  for(const [id] of lineStates)map.setLayoutProperty(id,'visibility','none');
  const png=await captureMapFrame(map,3);
  const image=await decodePNG(png);
  if(!image)throw Error('Could not decode high-resolution map background.');
  message.textContent='Rendering difference shading and outlines…';
  const overlay=await differenceExportRaster(map,snapshot,image.naturalWidth,image.naturalHeight);
  const outlines=document.createElement('canvas');
  outlines.width=image.naturalWidth;outlines.height=image.naturalHeight;
  await redrawDifferenceBoundaries(outlines,map,{exportGeoVisible:visible});
  return {image,overlay,outlines};
 }finally{
  if(changedRatio)try{map.setPixelRatio(ratioBefore);}catch(err){console.warn('Difference pixel ratio restore',err);}
  if(previousStyle===null)host.removeAttribute('style');else host.setAttribute('style',previousStyle);
  try{
   if(enlarged){map.resize();map.jumpTo(camera);}
   // Restore each original visibility property, including any hidden coast
   // overview when the detailed replacement was loaded.
   for(const [id,v] of [...detailStates,...lineStates]){
    if(map.getLayer(id))map.setLayoutProperty(id,'visibility',v);
   }
   if(st.difference.geo)geographyZoom(st.difference.geo);
   map.triggerRepaint();
  }catch(err){console.warn('Could not restore difference map after PNG export:',err);}
  preview.remove();
 }
}
async function redrawDifferenceBoundaries(canvas,map,snapshot){
 const visible=snapshot.exportGeoVisible||{};
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const w=map.getContainer().clientWidth,h=map.getContainer().clientHeight;
 if(!(w>0&&h>0))return;
 const sx=canvas.width/w,sy=canvas.height/h;
 const colors=themeColors();
 const specs=[['coast','coast',1.3],['coast_detail','coast',1.2],['country','coast',1.1],
              ['country_detail','coast',1.1],['states','minor',.95],['counties','minor',.75]];
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 for(const [id,kind,weight] of specs){
  if(!visible[id])continue;
  let data;try{data=await geoData(id);}catch(_){continue;}
  ctx.strokeStyle=kind==='minor'?colors.minor:colors.line;
  ctx.globalAlpha=kind==='minor'?.9:1;
  ctx.lineWidth=Math.max(1.2,weight*Math.min(sx,sy));
  ctx.beginPath();let segments=0;
  for(const f of data.features){
   const g=f.geometry;if(!g)continue;
   const lines=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?g.coordinates:[];
   for(const line of lines){let last=null;
    for(const coord of line){const pos=map.project(coord),px=pos.x*sx,py=pos.y*sy;
     if(!Number.isFinite(px)||!Number.isFinite(py)||
        (typeof map.isPointOnSurface==='function'&&!map.isPointOnSurface([pos.x,pos.y]))){last=null;continue;}
     if(last&&Math.hypot(px-last[0],py-last[1])<canvas.width*.45)ctx.lineTo(px,py);
     else ctx.moveTo(px,py);
     last=[px,py];
    }
    segments++;
   }
  }
  if(segments)ctx.stroke();
 }
 ctx.restore();
}
async function differenceExportRaster(map,snapshot,width,height,{interactive=false}={}){
 const field=snapshot.rawDifference,range=snapshot.range;
 if(!field||!(range>0))throw Error('Native difference field not ready.');
 const w=Math.round(width),h=Math.round(height);
 if(!(w>0&&h>0&&w*h<=8500000))throw Error('Difference export canvas is too large.');
 // Read one Lambert field, never two expensive per-pixel source transforms.
 const divisor=interactive?3:2; // Fast preview; native-resolution PNG path unchanged.
 const sampleW=Math.ceil(w/divisor),sampleH=Math.ceil(h/divisor);
 const src=map.getCanvas(),cssW=src.clientWidth||map.getContainer().clientWidth,
  cssH=src.clientHeight||map.getContainer().clientHeight;
 if(!(cssW>0&&cssH>0))throw Error('Map projection unavailable for export.');
 const c=document.createElement('canvas');c.width=sampleW;c.height=sampleH;
 const cx=c.getContext('2d');const data=cx.createImageData(sampleW,sampleH),pixels=data.data;
 const colors=DIFFERENCE_COLORS.map(hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]);
 let painted=0;
 for(let y=0;y<sampleH;y++){
  for(let x=0;x<sampleW;x++){
   const point=[(x+.5)*cssW/sampleW,(y+.5)*cssH/sampleH];
   if(typeof map.isPointOnSurface==='function'&&!map.isPointOnSurface(point))continue;
   const geo=map.unproject(point);if(!geo)continue;
   const v=differenceSampleValue(field,geo.lng,geo.lat);if(!Number.isFinite(v)||v<-1e9)continue;
   const z=Math.max(0,Math.min(1,(v+range)/(2*range)))*(colors.length-1);
   const lo=Math.floor(z),hi=Math.min(colors.length-1,lo+1),frac=z-lo,i=(y*sampleW+x)*4;
   for(let k=0;k<3;k++)pixels[i+k]=Math.round(colors[lo][k]*(1-frac)+colors[hi][k]*frac);
   pixels[i+3]=Math.round(205*st.imageOpacity*differenceZeroOpacity(v,range));painted++;
  }
  if(y%32===31)await new Promise(resolve=>requestAnimationFrame(resolve));
  if(snapshot!==st.difference.snapshot||snapshot.seq!==st.seq)throw Error('Difference changed during PNG export.');
 }
 if(!painted)throw Error('No overlapping difference data in exported map extent.');
 cx.putImageData(data,0,0);
 const full=document.createElement('canvas');full.width=w;full.height=h;
 const out=full.getContext('2d');out.imageSmoothingEnabled=true;out.imageSmoothingQuality='high';out.drawImage(c,0,0,w,h);
 return full;
}
async function exportDifferencePNG(ratio='16:9',framing='fill'){
 const diff=st.difference,snap=diff.snapshot;
 if(!diff.open||!diff.map||!snap||diff.saveBusy||snap.seq!==st.seq)
  throw Error('Difference data are not ready for export.');
 diff.saveBusy=true;el.differenceSaveBtn.disabled=true;
 try{
  const {width:W,height:H}=exportDimensions(false,ratio);
  const scale=H/1080;
  const head=Math.round(120*scale),foot=Math.round(105*scale),innerH=H-head-foot;
  if(innerH<100)throw Error('Difference export has insufficient plot height.');
  const {image,overlay,outlines}=await captureSharpDifferenceFrame(diff.map,snap,W,innerH,framing);
  if(!diff.open||snap!==diff.snapshot||snap.seq!==st.seq)
   throw Error('Difference changed while exporting. Retry with the current data.');
  const c=document.createElement('canvas');c.width=W;c.height=H;const cx=c.getContext('2d');
  const dark=st.theme!=='light',fg=dark?'#e8f0fb':'#24394e',bg=dark?'#09111f':'#f0f5fa';
  cx.fillStyle=bg;cx.fillRect(0,0,W,H);
  cx.fillStyle=fg;cx.textAlign='left';cx.textBaseline='middle';
  cx.font=`bold ${Math.round(39*scale*(st.exportLargeLabels?1.4:1))}px Arial`;
  cx.fillText(clipText(cx,`Difference · ${FIELDS[snap.fieldKey]?.label||snap.fieldKey}`,W-64),32,Math.round(43*scale));
  cx.font=`${Math.round(25*scale*(st.exportLargeLabels?1.4:1))}px Arial`;
  cx.fillText(clipText(cx,`${snap.labelA} − ${snap.labelB} · Init ${fmt(snap.init)} · F${pad3(snap.hour)} · Valid ${snap.valid}`,W-64),32,Math.round(94*scale));
  // Draw one combined map with identical framing for background, raster,
  // and bright boundaries. The shared panel helper preserves aspect ratio.
  const combined=document.createElement('canvas');
  combined.width=image.naturalWidth;combined.height=image.naturalHeight;
  const cc=combined.getContext('2d');
  cc.drawImage(image,0,0);cc.drawImage(overlay,0,0);cc.drawImage(outlines,0,0);
  drawMapFramed(cx,combined,0,head,W,innerH,framing);
  const y=H-foot+Math.round(17*scale),left=Math.round(115*W/1920),right=W-left,rampW=right-left;
  const rampH=Math.max(17,Math.round(24*scale));
  const gradient=cx.createLinearGradient(left,0,right,0);
  // Mirror the real difference raster, including its transparent zero band.
  const rgb=DIFFERENCE_COLORS.map(hex=>[1,3,5].map(k=>parseInt(hex.slice(k,k+2),16)));
  for(let i=0;i<=128;i++){
   const f=i/128,z=f*(rgb.length-1),lo=Math.floor(z),hi=Math.min(rgb.length-1,lo+1),t=z-lo;
   const c=rgb[lo].map((v,k)=>Math.round(v*(1-t)+rgb[hi][k]*t));
   gradient.addColorStop(f,`rgba(${c.join(',')},${differenceZeroOpacity((2*f-1)*snap.range,snap.range)})`);
  }
  cx.fillStyle=gradient;cx.fillRect(left,y,rampW,rampH);
  cx.strokeStyle=fg;cx.lineWidth=1;cx.strokeRect(left,y,rampW,rampH);
  cx.fillStyle=fg;cx.font=`${Math.max(14,Math.round(20*scale))}px Arial`;cx.textAlign='center';
  for(const t of differenceTicks(snap.fieldKey,snap.range)){
   const x=left+((t+snap.range)/(snap.range*2))*rampW;
   cx.fillRect(x-1,y+rampH,2,7*scale);
   cx.fillText(differenceNumber(t),x,y+rampH+Math.round(23*scale));
  }
  cx.font=`${Math.max(13,Math.round(18*scale))}px Arial`;
  cx.fillText(snap.unit?`Difference (${snap.unit})`:'Difference',W/2,H-Math.round(13*scale));
  await canvasPNG(c,`evu_difference_${snap.fieldKey}_${snap.init.replace(/\D/g,'')}_f${pad3(snap.hour)}_${ratio.replace(':','x')}_${framing}.png`);
 }catch(err){
  console.error('Difference PNG export failed',err);
  // The export dialog reports errors without covering the live map.
  throw err;
 }finally{
  diff.saveBusy=false;// Preserve the icon-only download button; updating text would remove the SVG.
  el.differenceSaveBtn.disabled=!diff.open||!diff.snapshot;
  // A paused live redraw during the export must resume after restoration.
  scheduleDifferenceLiveRender(100);
 }
}

document.addEventListener('visibilitychange',()=>{
 if(document.hidden)cancelQueuedPrefetches();
 else if(st.cfg)schedulePrefetch();
});
window.addEventListener('DOMContentLoaded',boot);
