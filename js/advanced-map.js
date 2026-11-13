/* Optional high-resolution DEM and weather-following, wind-speed-colored tracers.
 * MapLibre owns the camera and DEM. Since v1.1.88 the forecast weather layer
 * is rendered in native terrain tiles by js/gpu-terrain-weather.js, not by the
 * historical CPU weather canvas. This module owns only DEM controls and the
 * lightweight screen-space tracer overlay, with no converter dependencies.
 */
(function(){'use strict';
 const maps=new Set(),panels=new Set(),mapPanels=new WeakMap(),terrainReady=new WeakSet(),terrainStates=new WeakMap(),terrainLOD=new WeakMap();
 const EARTH=6371000,DEG=180/Math.PI;
 let terrainPanelIds=null;
 const mapUsesTerrain=map=>terrainOn&&!globe&&(!terrainPanelIds||terrainPanelIds.has(mapPanels.get(map)?.cfg?.id));
 let terrainOn=false,tracersOn=false,globe=false,fieldOpacity=1,surfaceWeather=true,config={},theme='dark',terrainOpacity=.8,terrainExaggeration=12.0,terrainSunAngle=315,terrainReliefStrength=.75;
 let frame=0,last=0,onTerrainStatus=null;
 // Tracer work is frame-budgeted without changing the density preference.
 // On busy browsers it sheds excess CPU sampling temporarily, restoring the
 // full count as time becomes available. This is independent of input grids.
 let tracerWorkScale=1,tracerWorkAverage=0,tracerWorkFrames=0;
 let tracerStyle={color:null,colorBySpeed:true,width:1.2,density:5,speed:2.5};
 const isMobile=()=>matchMedia('(pointer: coarse)').matches||innerWidth<=800;
 // Explicit tile templates avoid a second TileJSON request, which was an
 // unnecessary failure point at installations with restricted proxy access.
 // Mapterhorn tiles are 512px WebP Terrarium; public AWS/Mapzen tiles are
 // 256px PNG Terrarium. Both provide real elevations, not flat basemap art.
 const defaultTileJSON='https://tiles.mapterhorn.com/tilejson.json';
 const providers=()=>{
  if(config.terrainLocalDEMInstalled===true)return [{name:'Local 3-D DEM',source:{type:'raster-dem',
   tiles:[String(config.terrainLocalDEMTemplate||'data/dem/{z}/{x}/{y}.png')],
   encoding:'terrarium',tileSize:256,maxzoom:Number(config.terrainLocalDEMMaxZoom)||9,
   attribution:'Locally hosted Terrarium DEM (Mapzen/AWS elevation data)'}}];
  const configured=String(config.terrainTileJSON||defaultTileJSON);
  const custom=configured!==defaultTileJSON;
  const primary=custom?{name:'Configured DEM',source:{type:'raster-dem',url:configured,
   encoding:String(config.terrainEncoding||'terrarium'),tileSize:Number(config.terrainTileSize)||512}}
   :{name:'Mapterhorn',source:{type:'raster-dem',
    tiles:['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'],encoding:'terrarium',tileSize:512,maxzoom:14}};
  const backup=(config.terrainBackupTileURL===false||config.terrainBackupEnabled===false)?null:
   {name:'AWS Mapzen',source:{type:'raster-dem',
    tiles:[String(config.terrainBackupTileURL||'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png')],
    encoding:'terrarium',tileSize:256,maxzoom:15,
    attribution:'Elevation tiles: Mapzen / AWS Public Dataset'}};
  // Respect explicitly configured local DEMs unless fallback is opted in.
  return backup&&(!custom||config.terrainBackupEnabled===true)?[primary,backup]:[primary];
 };
 const providerFor=(map)=>providers()[terrainStates.get(map)?.provider||0];
 const maplibreVersion=()=>{const ml=window.maplibregl;try{return String(ml?.getVersion?.()||ml?.version||'unknown');}catch(_){return String(ml?.version||'unknown');}};
 const nativeReliefSupported=()=>{const m=/^(\d+)\.(\d+)/.exec(maplibreVersion());return !m||Number(m[1])>5||(Number(m[1])===5&&Number(m[2])>=6);};
 const status=(kind,description)=>{try{onTerrainStatus?.(kind,description||'');}catch(e){console.warn('Terrain status handler',e);}};
 // Neutral relief lighting inspired by the FIAB California visual target.
 // Avoid the green/brown DEM pigments in fully opaque forecast pixels. The
 // DEM's natural colors remain visible only where the forecast has no data.
 // The DEM is unchanged: elevation color is a MapLibre paint expression,
 // and the light source is geographic (not tied to camera rotation).
 const terrainPaint=()=>{
  // Hillshade lights the DEM beneath the weather, NEVER the weather RGB.
  // Relief is conveyed by the actual terrain mesh at opaque field pixels.
  const factor=Math.max(0,Math.min(1,(surfaceWeather?.28:.85)*terrainReliefStrength))*terrainOpacity;
  return {
   'hillshade-exaggeration':factor,
   'hillshade-shadow-color':surfaceWeather?'rgba(0,0,0,0.012)':'rgba(0,0,0,0.08)',
   'hillshade-highlight-color':surfaceWeather?'rgba(255,255,255,0.045)':'rgba(255,255,255,0.10)',
   'hillshade-accent-color':'rgba(0,0,0,0)',
   'hillshade-illumination-anchor':'map',
   'hillshade-illumination-direction':terrainSunAngle
  };
 };
 // Elevation tint in metres: forests and valleys → foothills → sunlit
 // ochre ridges → bare rock → alpine snow, with smoothly interpolated stops.
 // Leave ocean/undersea transparent so the base map controls water color.
 const reliefPaint=()=>({
  // Terrain-only alpine palette: green foothills, sage/ochre valleys,
  // graphite bedrock and pale summit snow. Forecast colors remain separate.
  'color-relief-color':['interpolate',['linear'],['elevation'],
   -500,'rgba(0,0,0,0)',0,'rgba(0,0,0,0)',
   // Cool evergreen valleys, sage foothills, warm sunlit rock and
   // blue-gray alpine shoulders; smooth stops without hard bands.
   1,'#245d51',100,'#327966',240,'#4e957b',420,'#73ad86',
   650,'#95b68a',900,'#b0bb8c',1150,'#c0b68b',1350,'#c5ad86',
   1650,'#bb997b',1900,'#ac907e',2200,'#958b82',
   2600,'#879391',2850,'#819fa2',3150,'#99afb0',
   3500,'#bec9c8',3900,'#dce2dd',4300,'#edf0ea',
   4800,'#f8f9f4',5800,'#ffffff'],
  'color-relief-opacity':terrainOpacity
 });
 function readyIfLoaded(map){
  const state=terrainStates.get(map);if(!state||!mapUsesTerrain(map)||!state.demLoaded)return;
  // The source can emit several completed-tile events. Announce terrain
  // readiness only once per load cycle; subsequent tiles are handled by the
  // viewer's debounced DEM revision redraw.
  if(state.loaded&&terrainReady.has(map))return;
  state.loaded=true;state.failed=false;stopWatch(map);terrainReady.add(map);
  const hasColors=Boolean(map.getLayer?.('evu-terrain-colors'));
  status(hasColors?'ready':'fallback',hasColors?
   `${providerFor(map).name}: 3-D elevation mesh and colors loaded`:
   `${providerFor(map).name}: 3-D elevation loaded but color-relief unavailable in MapLibre ${maplibreVersion()}.`);
 }
 function orderTerrain(map){
  try{
   if(!mapUsesTerrain(map)||typeof map?.moveLayer!=='function')return;
   const layers=map.getStyle?.()?.layers||[];
   const weather=layers.filter(layer=>/^evu-field-|^evu-diff-/.test(layer.id))
    .map(layer=>layer.id).filter(id=>map.getLayer?.(id));
   const boundary=['coast-casing','coast','country-casing','country','states'].find(id=>map.getLayer?.(id));
   const firstWeather=weather[0]||boundary;
   if(!firstWeather)return;
   // Both DEM pigments and hillshade are basemap paints. They must finish
   // BEFORE weather, including native elevation-draped surface forecasts.
   if(map.getLayer?.('evu-terrain-colors'))map.moveLayer('evu-terrain-colors',firstWeather);
   if(map.getLayer?.('evu-terrain-shade'))map.moveLayer('evu-terrain-shade',firstWeather);
   // MapLibre terrain paints fill/line/color-relief/hillshade/raster in its
   // own draped terrain stack. Move the 2-D custom weather above every one
   // of those layers, then below nondraped observations and labels. A 3-D
   // custom layer gets painted in a different pass and can be overpainted
   // by the subsequent terrain RTT, irrespective of drawWeather depth state.
   {
    const styleLayers=map.getStyle?.()?.layers||[];
    const lastDraped=styleLayers.filter(l=>
     ['background','fill','line','raster','hillshade','color-relief'].includes(l.type)).at(-1)?.id;
    for(const id of weather){
     if(!map.getLayer?.(id))continue;
     // Find the first non-terrain observation/symbol layer after the final
     // draped layer. Those interactive overlays must remain above weather.
     const current=map.getStyle?.()?.layers||[];
     const after=current.findIndex(l=>l.id===lastDraped);
     const overlay=current.slice(Math.max(0,after+1)).find(l=>
      l.id!==id && !weather.includes(l.id) &&
      !['background','fill','line','raster','hillshade','color-relief'].includes(l.type));
     if(overlay)map.moveLayer(id,overlay.id);
     else map.moveLayer(id);
    }
   }
   // Hillshade belongs to the terrain basemap, never over forecast pixels.
   // In the native terrain RTT pass a later hillshade is alpha-composited over
   // opaque weather and washes out both RGB and precipitation gradients.
   // Always keep it BELOW the first weather layer, including surface drapes.
   map.triggerRepaint?.();
  }catch(e){console.warn('Terrain layer ordering',e);}
 }
 // MapLibre renders the DEM colors and the 3D mesh. Native GPU terrain
 // tiles are used for surface fields, while valid upper-air values are drawn
 // later in a flat, terrain-independent GPU pass. True missing/below-ground
 // pixels remain transparent to expose the real DEM underneath.
 function terrainVisibleThroughWeather(){return true;}
 function syncTerrainMesh(map){
  if(!map?.getTerrain||!map?.setTerrain)return;
  const show=mapUsesTerrain(map);
  try{
   const current=map.getTerrain();
   if(show&&!current&&map.getSource?.('evu-dem'))map.setTerrain({source:'evu-dem',exaggeration:terrainExaggeration});
   else if(!show&&current?.source==='evu-dem')map.setTerrain(null);
  }catch(error){console.warn('Terrain mesh visibility',error);}
 }
 // MapLibre deliberately decreases DEM tile detail toward the horizon at
 // pitched views. A source-specific LOD policy retains sharper DEM tiles in
 // the near/mid-distance (rather than increasing vertical exaggeration).
 // Keep a smaller tile budget in compact 6/9-panel layouts.
 function tuneTerrainLOD(map){
  if(typeof map?.setSourceTileLodParams!=='function'||!map.getSource?.('evu-dem'))return;
  const width=Number(map.getCanvas?.()?.clientWidth)||0;
  const compact=isMobile()||width<460;
  const levels=compact?2.75:2.15,ratio=compact?2.75:3.6;
  const old=terrainLOD.get(map);
  if(old?.levels===levels&&old.ratio===ratio)return;
  try{map.setSourceTileLodParams(levels,ratio,'evu-dem');terrainLOD.set(map,{levels,ratio});}
  catch(e){console.warn('DEM tile LOD tuning unavailable; retaining MapLibre default',e);}
 }
 function syncTerrainVisibility(map){
  const visible=mapUsesTerrain(map)?'visible':'none';
  // Keep both paints below opaque upper-air shading. Hillshade is ordered
  // BELOW upper-air weather so it appears only through true no-data masks,
  // including terrain-screened pressure levels, without tinting valid pixels.
  // The DEM mesh remains available under the transparent below-ground mask;
  // valid upper-air pixels are instead drawn in a separate flat GPU pass.
  for(const id of ['evu-terrain-colors','evu-terrain-shade']){
   try{if(map.getLayer?.(id))map.setLayoutProperty(id,'visibility',visible);}
   catch(error){console.warn('Terrain layer visibility',id,error);}
  }
  syncTerrainMesh(map);
 }
 function stopWatch(map){const state=terrainStates.get(map);if(state?.watchdog){clearTimeout(state.watchdog);state.watchdog=null;}}
 function clearTerrain(map){
  stopWatch(map);
  try{if(map.getTerrain?.())map.setTerrain(null);}catch(err){console.warn('Disable terrain',err);}
  for(const id of ['evu-terrain-shade','evu-terrain-colors']){
   try{if(map.getLayer?.(id))map.removeLayer(id);}catch(err){console.warn('Remove terrain layer',id,err);}
  }
  try{if(map.getSource?.('evu-dem'))map.removeSource('evu-dem');}catch(err){console.warn('Remove terrain DEM source',err);}
  terrainLOD.delete(map);terrainReady.delete(map);
  const state=terrainStates.get(map);
  if(state){state.loaded=false;state.demLoaded=false;state.failed=false;}
 }
 function activateBackup(map,reason){
  const state=terrainStates.get(map);if(!state||!mapUsesTerrain(map)||!maps.has(map))return;
  if(state.provider+1>=providers().length){
   state.failed=true;stopWatch(map);
   status('error','3-D terrain unavailable: '+String(reason||'DEM tiles failed')+'; verify data/dem/manifest.json and the local tiles.');
   return;
  }
  state.provider++;state.failed=false;state.loaded=false;state.demLoaded=false;
  status('loading',`Primary DEM unavailable; switching to ${providerFor(map).name}`);
  // Guard against a stale MapLibre source event from an earlier tile request.
  try{clearTerrain(map);terrainReady.delete(map);terrain(map,true);}catch(err){
   console.warn('Terrain fallback initialization',err);status('error',String(err));
  }
 }
 function terrain(map,on){
  if(!map)return;
  if(!terrainStates.has(map))terrainStates.set(map,{provider:0,failed:false,loaded:false,demLoaded:false,watchdog:null});
  const state=terrainStates.get(map);
  try{
   if(typeof map.getStyle!=='function'||!map.getStyle()?.layers)return;
   if(!on||globe){
    clearTerrain(map);
    if(on&&globe)status('globe','3-D terrain requires the 2D map view');
    return;
   }
   // Real DEM only. The old bundled 2-D raster fallback has been removed.
   if(config.terrainLocalDEMInstalled!==true&&config.terrainOnlineEnabled!==true){
    status('error','3-D terrain needs local DEM tiles. Run install_terrain_dem.py and publish data/dem/.');return;
   }
   if(typeof map.setTerrain!=='function'){status('error','MapLibre runtime has no 3-D terrain support');return;}
   const selected=providerFor(map);
   if(!map.getSource('evu-dem'))map.addSource('evu-dem',{
    ...selected.source,attribution:selected.source.attribution||`Elevation data: © ${selected.name}`
   });
   if(!map.getLayer('evu-terrain-colors')){
    try{
     if(!nativeReliefSupported())throw Error('MapLibre '+maplibreVersion()+' predates color-relief');
     map.addLayer({id:'evu-terrain-colors',type:'color-relief',source:'evu-dem',paint:reliefPaint()},
      map.getLayer('coast-casing')?'coast-casing':undefined);
    }catch(err){
     console.warn('Native DEM elevation coloring unavailable',err);
     status('fallback',`3-D terrain is available but color relief failed: ${String(err?.message||err)}`);
    }
   }else map.setLayoutProperty('evu-terrain-colors','visibility','visible');
   if(!map.getLayer('evu-terrain-shade'))map.addLayer({
    id:'evu-terrain-shade',type:'hillshade',source:'evu-dem',paint:terrainPaint()
   },map.getLayer('coast-casing')?'coast-casing':undefined);
   else map.setLayoutProperty('evu-terrain-shade','visibility','visible');
   orderTerrain(map);
   syncTerrainVisibility(map);
   // The terrain mesh stays active, even when masked upper-air fields render.
   syncTerrainMesh(map);
   tuneTerrainLOD(map);
   orderTerrain(map);
   if(state.loaded||terrainReady.has(map))readyIfLoaded(map);
   else {
    status('loading',`Loading ${selected.name} elevation tiles…`);
    stopWatch(map);
    state.watchdog=setTimeout(()=>{
     if(mapUsesTerrain(map)&&!state.loaded&&!state.failed&&maps.has(map))activateBackup(map,'DEM loading timed out');
    },12000);
   }
  }catch(err){
   console.warn('Optional terrain source unavailable',err);
   activateBackup(map,String(err?.message||err));
  }
 }
 function attach(map,p){
  maps.add(map);mapPanels.set(map,p||null);
  if(p){
   panels.add(p);
   const canvas=document.createElement('canvas');canvas.className='tracer-overlay';canvas.setAttribute('aria-hidden','true');
   p.frame.appendChild(canvas);p.tracerCanvas=canvas;p.tracerVectors=null;p.tracerParticles=[];
   // Recompute a robust visible-area reference AFTER a view change; do not
   // resample dozens of points on every camera animation frame.
   map.on('movestart',()=>{
    p.tracerMoving=true;clear(p);
    if(p.tracerCanvas)p.tracerCanvas.style.opacity='0';
   });
   map.on('resize',()=>{if(mapUsesTerrain(map))tuneTerrainLOD(map);});
   for(const event of ['resize','moveend'])map.on(event,()=>{
    p.tracerMoving=false;clear(p);
    if(p.tracerCanvas)p.tracerCanvas.style.opacity='1';
    if(p.tracerVectors)p.tracerReferenceSpeed=visibleWindReference(p);
   });
  }
  terrainStates.set(map,{provider:0,failed:false,loaded:false,demLoaded:false,watchdog:null});
  map.on('load',()=>terrain(map,mapUsesTerrain(map)));
  map.on('sourcedata',e=>{
   const state=terrainStates.get(map);if(!state||!mapUsesTerrain(map)||!e?.isSourceLoaded)return;
   if(e.sourceId==='evu-dem')state.demLoaded=true;
   if(e.sourceId==='evu-dem')readyIfLoaded(map);
  });
  map.on('error',e=>{
   if(!mapUsesTerrain(map))return;
   const message=String(e?.error?.message||e?.error||'');
   if(e?.sourceId==='evu-dem'||/mapterhorn|elevation-tiles-prod|data\/dem\/|evu-dem|terrain.*tile/i.test(message)){
    console.warn('Terrain tile request failed',message);
    const state=terrainStates.get(map);
    if(state&&!state.loaded&&!state.failed)activateBackup(map,message);
   }
  });
  if(map.isStyleLoaded?.())terrain(map,mapUsesTerrain(map));
  if(!frame&&tracersOn)frame=requestAnimationFrame(tick);
 }
 function detach(map,p){
  maps.delete(map);stopWatch(map);terrainStates.delete(map);terrainReady.delete(map);terrainLOD.delete(map);
  if(p){panels.delete(p);clear(p);p.tracerCanvas?.remove();p.tracerCanvas=null;p.tracerVectors=null;}
 }
 function setFieldOpacity(value,surface=true){
  const n=Number(value);fieldOpacity=Number.isFinite(n)?Math.max(0,Math.min(1,n)):.8;
  const priorSurface=surfaceWeather;surfaceWeather=surface!==false;
  if(!terrainOn||globe)return;
  // Terrain is a base map: weather pixels are independently composited above
  // it, and transparent/masked weather pixels reveal the DEM underneath.
  for(const map of maps){
   if(!mapUsesTerrain(map))continue;
   try{
    syncTerrainVisibility(map);
    if(priorSurface!==surfaceWeather){
     // Preserve strong DEM relief inside below-ground gaps, but minimize
     // surface-field pigment changes. This paints only DEM lighting; valid
     // upper-air pixels are drawn afterward in the flat custom GPU pass.
     if(map.getLayer?.('evu-terrain-shade'))for(const [key,value] of Object.entries(terrainPaint()))
      map.setPaintProperty('evu-terrain-shade',key,value);
     orderTerrain(map);
    }else map.triggerRepaint?.();
   }catch(error){console.warn('Weather/terrain compositing update',error);}
  }
 }
 function setTerrain(on,mode,selectedPanelIds=null){
  terrainOn=!!on;globe=mode==='globe';
  terrainPanelIds=selectedPanelIds?new Set(selectedPanelIds):null;
  if(!terrainOn)status('off','');
  else status(globe?'globe':'loading',globe?'3-D terrain requires 2D mode':'Loading 3-D elevation…');
  for(const map of maps)terrain(map,mapUsesTerrain(map));
 }
 function setMode(mode){globe=mode==='globe';for(const map of maps)terrain(map,mapUsesTerrain(map));}
 function setTheme(nextTheme){theme=nextTheme==='light'?'light':'dark';for(const map of maps){
  try{if(map?.getLayer?.('evu-terrain-shade'))for(const [key,value] of Object.entries(terrainPaint()))map.setPaintProperty('evu-terrain-shade',key,value);}
  catch(err){console.warn('Terrain theme update',err);}
 }}
 function setTerrainStatusListener(listener){onTerrainStatus=typeof listener==='function'?listener:null;}
 function setTerrainOpacity(value){
  const n=Number(value);terrainOpacity=Number.isFinite(n)?Math.max(0,Math.min(1,n)):1;
  for(const map of maps){
   try{if(map.getLayer?.('evu-terrain-colors'))map.setPaintProperty('evu-terrain-colors','color-relief-opacity',terrainOpacity);}
   catch(e){console.warn('Terrain color opacity',e);}
   try{if(map.getLayer?.('evu-terrain-shade')){
    map.setPaintProperty('evu-terrain-shade','hillshade-exaggeration',terrainPaint()['hillshade-exaggeration']);
   }}catch(e){console.warn('Terrain hillshade opacity',e);}
  }
 }
 // 0 is flat; 1 is true vertical scale, up to 20 for high-relief visualization.
 // Changes apply to every existing live MapLibre map without re-fetching tiles.
 function setTerrainExaggeration(value){
  const n=Number(value);
  terrainExaggeration=Number.isFinite(n)?Math.max(0,Math.min(20,n)):12.0;
  for(const map of maps){
   try{
    if(mapUsesTerrain(map)&&map.getTerrain?.()?.source==='evu-dem')
     map.setTerrain({source:'evu-dem',exaggeration:terrainExaggeration});
    if(map.getLayer?.('evu-terrain-shade'))
     map.setPaintProperty('evu-terrain-shade','hillshade-exaggeration',terrainPaint()['hillshade-exaggeration']);
   }catch(err){console.warn('Terrain exaggeration update',err);}
  }
 }
 function setTerrainLighting(style){
  const d=Number(style?.direction),s=Number(style?.strength);
  terrainSunAngle=Number.isFinite(d)?Math.max(0,Math.min(360,d)):315;
  terrainReliefStrength=Number.isFinite(s)?Math.max(0,Math.min(1,s)):.75;
  for(const map of maps){
   try{if(map.getLayer?.('evu-terrain-shade'))for(const [key,value] of Object.entries(terrainPaint()))
    map.setPaintProperty('evu-terrain-shade',key,value);}
   catch(err){console.warn('Terrain lighting update',err);}
  }
 }
 function setTracerStyle(style){
  const width=Number(style?.width),density=Number(style?.density),speed=style?.speed===undefined?2.5:Number(style?.speed),color=String(style?.color||'');
  const next={color:/^#[0-9a-f]{6}$/i.test(color)?color:null,
   colorBySpeed:style?.colorBySpeed!==false,
   width:Number.isFinite(width)?Math.max(.5,Math.min(4,width)):1.2,
   density:Number.isFinite(density)?Math.max(.5,Math.min(10,density)):5,
   speed:Number.isFinite(speed)?Math.max(.25,Math.min(5,speed)):2.5};
  // The FIAB-style canvas accumulates fading streaks. Clear only when style
  // actually changes, so a switch between fixed and speed colors is immediate
  // and never leaves old-colored streaks visible for several frames.
  const changed=Object.keys(next).some(key=>next[key]!==tracerStyle[key]);
  tracerStyle=next;
  if(changed&&typeof panels!=='undefined')for(const panel of panels)clear(panel);
 }
 // All sampled native model U/V components have units of m/s. Use knots
 // solely to define a documented, continuous visual wind-speed spectrum.
 // Unlike the previous auto-contrast option, the same wind speed now has
 // the same color regardless of the plotted scalar field, palette or theme.
 const KNOTS_PER_MPS=1.94384449244;
 const WIND_SPEED_STOPS=[
  [0,[243,247,255]], // nearly calm: ice white
  [5,[173,239,250]], // light air: pale cyan
  [12,[79,215,234]], // gentle: cyan
  [20,[89,227,154]], // moderate: mint/green
  [30,[254,232,93]], // fresh: yellow
  [45,[255,158,65]], // strong: orange
  [60,[255,70,106]], // very strong: red/pink
  [90,[206,129,255]] // extreme: magenta/lavender
 ];
 function windSpeedInk(speed){
  const knots=Math.max(0,Number(speed)||0)*KNOTS_PER_MPS;
  for(let i=1;i<WIND_SPEED_STOPS.length;i++){
   const [limit,b]=WIND_SPEED_STOPS[i], [base,a]=WIND_SPEED_STOPS[i-1];
   if(knots<=limit){const t=Math.max(0,Math.min(1,(knots-base)/(limit-base)));
    return a.map((x,j)=>Math.round(x+(b[j]-x)*t));}
  }
  return [...WIND_SPEED_STOPS[WIND_SPEED_STOPS.length-1][1]];
 }
 // The low-speed palette remains light at the center. A *thin*, low-alpha
 // neutral edge outside a wider bright core adds contrast over bright fields.
 // Never tint the tracer's core by wind speed or shaded weather palette.
 function tracerHalo(){return 'rgba(7,23,35,0.26)';}
 function tracerInk(speed){
  return tracerStyle.colorBySpeed?windSpeedInk(speed):
   (/^#[0-9a-f]{6}$/i.test(tracerStyle.color||'')?
    [1,3,5].map(i=>parseInt(tracerStyle.color.slice(i,i+2),16)):windSpeedInk(speed));
 }
 function setTracers(on){tracersOn=!!on;last=0;tracerWorkScale=1;tracerWorkAverage=0;tracerWorkFrames=0;
  if(!on){for(const p of panels)clear(p);}else if(!frame)frame=requestAnimationFrame(tick);}
 function clear(p){if(!p)return;p.tracerParticles=[];const c=p.tracerCanvas;if(c){const ctx=c.getContext('2d');ctx?.clearRect(0,0,c.width,c.height);}}
 // Camera-level speed normalization complements the absolute-knot color
 // scale.  A strong jet should LOOK faster/longer than its surroundings,
 // without racing five times faster than the same map at 850 hPa.
 function visibleWindReference(p){
  const baseline=p?.tracerLevelReferenceSpeed||12;
  if(!p?.tracerVectors||!p?.map?.unproject)return baseline;
  const w=p.map.getCanvas?.().clientWidth||0,h=p.map.getCanvas?.().clientHeight||0;
  if(w<20||h<20)return baseline;
  const speeds=[],windPair=[NaN,NaN];
  // A cheap, repeatable 7x5 viewport sample (35 U/V pairs) is calculated
  // only on new field, zoom, pan-end or resize; never per animation frame.
  for(let iy=0;iy<5;iy++)for(let ix=0;ix<7;ix++){
   try{
    const pos=p.map.unproject([(ix+.5)*w/7,(iy+.5)*h/5]);
    const fast=p.tracerVectors.fast;
    const pair=fast?fast.sample(pos.lng,pos.lat,windPair):null;
    const u=Number(pair?pair[0]:p.tracerVectors.u.sampleField(pos.lng,pos.lat));
    const v=Number(pair?pair[1]:p.tracerVectors.v.sampleField(pos.lng,pos.lat));
    const speed=Math.hypot(u,v);
    if(Number.isFinite(speed)&&speed>=.5&&speed<=140)speeds.push(speed);
   }catch(_){/* incomplete model coverage; other points are still valid */}
  }
  if(speeds.length<4)return baseline;
  speeds.sort((a,b)=>a-b);
  const localP75=speeds[Math.floor(.75*(speeds.length-1))];
  // Never make a weak wind appear as fast as a strong wind by scaling all
  // levels down to their local median; only damp unusually vigorous flows.
  return Math.min(110,Math.max(baseline,localP75));
 }
 function setVectors(p,u,v,selectedField){if(!p)return;
  const field=String(selectedField||p.cfg?.field||'').toLowerCase();
  const upper=/250|300|500|absv|^h500|^h300|^h250/.test(field),middle=/700|850|925/.test(field);
  p.tracerLevelReferenceSpeed=upper?50:middle?26:12;
  // Compute a validated O(1) native-grid U/V sampler once per new pair.
  // Incompatible/uncertain grids retain the exact existing sampleField path.
  let fast=null;
  if(u&&v&&window.EVUFastWindSampler?.build){
   try{fast=window.EVUFastWindSampler.build(u,v);}catch(error){console.warn('Fast wind sampling unavailable',error);}
  }
  p.tracerVectors=u&&v?{u,v,fast}:null;
  p.tracerReferenceSpeed=visibleWindReference(p);
  clear(p);if(tracersOn&&!frame)frame=requestAnimationFrame(tick);}
 function seed(p,w,h){
  const x=Math.random()*w,y=Math.random()*h;let pos;
  try{pos=p.map.unproject([x,y]);}catch(_){return null;}
  if(!pos||!Number.isFinite(pos.lng)||!Number.isFinite(pos.lat)||Math.abs(pos.lat)>85)return null;
  return {lon:pos.lng,lat:pos.lat,pixelX:x,pixelY:y,age:0,life:42+Math.random()*100};
 }
 function nextPosition(pt,u,v,map,delta,referenceSpeed,scalePerPixel){
  const speed=Math.hypot(u,v);
  const latRad=pt.lat/DEG,cosLat=Math.cos(latRad);
  const metersPerPixel=(Number.isFinite(scalePerPixel)?scalePerPixel:
   2*Math.PI*EARTH/(512*Math.pow(2,Math.max(0,Math.min(20,Number(map.getZoom?.()??3)))))) *Math.max(.05,cosLat);
  // Canvas pixels per frame are relative to the *wind level*, with a fixed
  // cap and 30-fps-normalized time step. Forecast level is not a physical
  // particle-altitude/time-step simulation.
  const ratio=Math.min(2.2,speed/Math.max(3,referenceSpeed||12));
  // About 21 px/s at the default 2x setting for a representative wind,
  // versus ~54 px/s previously.  Use elapsed time, not display refresh:
  // 15/30/60/120 Hz and recordings should follow the same apparent speed.
  // A saturated cap also prevents powerful jets from crossing the map.
  const targetPixels=Math.max(.015,Math.min(2.6,ratio*.78*Math.min(2.5,delta*30)*(tracerStyle.speed/2)));
  const dt=targetPixels*metersPerPixel/Math.max(.01,speed);
  return {lon:pt.lon+u*dt/(EARTH*Math.max(.09,cosLat))*DEG,
          lat:pt.lat+v*dt/EARTH*DEG};
 }
 // FIAB-inspired temporal streaks: do not redraw long historical polylines
 // every frame.  Instead fade the existing screen-space canvas by elapsed
 // time and add only THIS frame's short U/V-driven segments.  Strong winds
 // leave longer visible wakes because their endpoints advance farther each
 // frame, not because their particle glyphs inflate as the animation runs.
 // The fade remains stable at 20/24/30/60/120 Hz and in recording workflows.
 function fadeWindTrails(ctx,w,h,delta){
  const keep=Math.pow(.955,Math.min(.1,Math.max(0,delta))*30);
  ctx.globalCompositeOperation='destination-in';
  ctx.fillStyle=`rgba(0,0,0,${keep.toFixed(4)})`;
  ctx.fillRect(0,0,w,h);
  ctx.globalCompositeOperation='source-over';
 }
 // Bucket paths by actual 5-knot increments and three relative-width bands.
 // This retains speed colors/relative widths without creating thousands of
 // per-particle gradients and draw calls per panel each frame.
 function tracerBucket(buckets,speed,referenceSpeed){
  const normalized=Math.min(2.2,speed/Math.max(3,referenceSpeed||12));
  const widthBand=normalized<.65?0:normalized<1.25?1:2;
  const knotsBin=tracerStyle.colorBySpeed?Math.max(0,Math.min(20,Math.round(speed*KNOTS_PER_MPS/5))):0;
  const key=knotsBin*3+widthBand;
  let bucket=buckets.get(key);
  if(!bucket){
   bucket={speed:tracerStyle.colorBySpeed?knotsBin*5/KNOTS_PER_MPS:speed,widthBand,segments:[]};
   buckets.set(key,bucket);
  }
  return bucket;
 }
 function paintTrail(ctx,buckets){
  for(const bucket of buckets.values()){
   const points=bucket.segments;
   if(!points.length)continue;
   const [r,g,b]=tracerInk(bucket.speed);
   ctx.beginPath();
   for(let i=0;i<points.length;i+=4){ctx.moveTo(points[i],points[i+1]);ctx.lineTo(points[i+2],points[i+3]);}
   const thickness=(1.15+.29*bucket.widthBand)*tracerStyle.width;
   // One subtle outline and one speed-colored stroke per BUCKET, not per
   // particle: bounded draw calls, readable over dark/light color palettes.
   ctx.strokeStyle=tracerHalo();ctx.lineWidth=thickness+1.4;ctx.stroke();
   ctx.strokeStyle=`rgba(${r},${g},${b},0.98)`;ctx.lineWidth=thickness;ctx.stroke();
  }
 }
 function tick(now){
  frame=0;if(!tracersOn||document.hidden)return;
  const mobile=isMobile();
  // 30 fps for 1–4 panels; 24 fps for dense nine-panel comparisons. Mobile
  // keeps a 20-fps budget. dt below preserves speed when frames are skipped.
  const interval=mobile?50:panels.size>4?42:33;
  if(last&&now-last<interval){frame=requestAnimationFrame(tick);return;}
  const workStart=performance.now();
  const delta=last?Math.min(.09,Math.max(.012,(now-last)/1000)):1/30;last=now;
  const visible=[];
  for(const p of panels){
   const map=p.map,c=p.tracerCanvas,vectors=p.tracerVectors;
   if(!map||!c||!vectors||p.cfg?.differencePanel||p.status!=='ready'||p.contextLost||!p.frame?.isConnected)continue;
   // MapLibre and Three.js receive the full interaction budget while a
   // camera gesture is active. Restart the geographic streaks on moveend.
   if(map.isMoving?.()||p._evuForecastMoving){
    if(!p.tracerMoving){p.tracerMoving=true;clear(p);c.style.opacity='0';}
    continue;
   }
   // Also recover when a browser cancels a gesture without moveend.
   if(p.tracerMoving){p.tracerMoving=false;c.style.opacity='1';clear(p);}
   const rect=p.frame.getBoundingClientRect();
   if(rect.width<10||rect.height<10||!p.frame.getClientRects().length||
      rect.bottom< -20||rect.top>(window.innerHeight||1e9)+20)continue;
   const w=map.getCanvas().clientWidth||0,h=map.getCanvas().clientHeight||0;
   if(w<20||h<20)continue;
   visible.push({p,map,c,vectors,w,h});
  }
  // Bound aggregate particle cost across six/nine panels. The user's 0.5–10x
  // density increases the shared budget, while batched strokes keep drawing
  // work bounded even at the high end of the range.
  const maxTotal=Math.round((mobile?1100:3600)*(.5+Math.min(10,tracerStyle.density)*.25)*tracerWorkScale);
  const perPanelBudget=Math.max(30,Math.floor(maxTotal/Math.max(1,visible.length)));
  for(const {p,map,c,vectors,w,h} of visible){
   const dpr=Math.min(1.5,devicePixelRatio||1),cw=Math.round(w*dpr),ch=Math.round(h*dpr);
   if(c.width!==cw||c.height!==ch){c.width=cw;c.height=ch;p.tracerParticles=[];}
   const ctx=c.getContext('2d');if(!ctx)continue;
   ctx.setTransform(dpr,0,0,dpr,0,0);fadeWindTrails(ctx,w,h,delta);
   ctx.lineCap='round';ctx.lineJoin='round';
   const buckets=new Map(),windPair=[NaN,NaN];
   const zoom=Math.max(0,Math.min(20,Number(map.getZoom?.()??3)));
   const metersPerPixel=2*Math.PI*EARTH/(512*Math.pow(2,zoom));
   // Retain user-defined per-panel density where practical, then apply the
   // cross-panel aggregate budget so nine synchronized maps remain responsive.
   const base=Math.min(mobile?310:540,Math.max(mobile?55:70,Math.round(w*h/(mobile?1600:1000))));
   const density=Math.min(perPanelBudget,Math.max(12,Math.round(base*tracerStyle.density)));
   if(p.tracerParticles.length>density)p.tracerParticles.length=density;
   // Populate new/cleared panels over a few frames. Seeding thousands of
   // particles in one frame produced a noticeable hitch after terrain/pan.
   const seedLimit=Math.max(40,Math.ceil(density*.34));let seeded=0;
   while(p.tracerParticles.length<density&&seeded++<seedLimit){const s=seed(p,w,h);if(!s)break;p.tracerParticles.push(s);}
   for(let i=0;i<p.tracerParticles.length;i++){
    const pt=p.tracerParticles[i];let u,v;
    try{
     if(vectors.fast){vectors.fast.sample(pt.lon,pt.lat,windPair);u=Number(windPair[0]);v=Number(windPair[1]);}
     else {u=Number(vectors.u.sampleField(pt.lon,pt.lat));v=Number(vectors.v.sampleField(pt.lon,pt.lat));}
    }catch(_){u=NaN;}
    const speed=Math.hypot(u,v);
    if(!Number.isFinite(speed)||speed<.5||speed>140||(pt.age+=delta*30)>pt.life){p.tracerParticles[i]=seed(p,w,h)||pt;continue;}
    const next=nextPosition(pt,u,v,map,delta,p.tracerReferenceSpeed,metersPerPixel);
    // A particle ends at exactly the point where its next segment begins.
    // Between camera moves the previous projected endpoint is still valid;
    // this halves the expensive MapLibre projections per animation step.
    let ax=pt.pixelX,ay=pt.pixelY,b;
    try{
     if(!Number.isFinite(ax)||!Number.isFinite(ay)){
      const projected=map.project([pt.lon,pt.lat]);ax=projected.x;ay=projected.y;
     }
     b=map.project([next.lon,next.lat]);
    }catch(_){p.tracerParticles[i]=seed(p,w,h)||pt;continue;}
    if(!Number.isFinite(ax+ay+b.x+b.y)||next.lat>85||next.lat< -85||
       b.x< -8||b.x>w+8||b.y< -8||b.y>h+8||Math.hypot(b.x-ax,b.y-ay)>28){
      p.tracerParticles[i]=seed(p,w,h)||pt;continue;
    }
    // Current-frame segment only; the canvas carries the previous frames
    // with a time-based fade, so no stored growing polylines or per-particle
    // gradient allocations. Actual wind knots determine color; the local
    // wind distribution determines visual velocity and streak length.
    tracerBucket(buckets,speed,p.tracerReferenceSpeed).segments.push(ax,ay,b.x,b.y);
    pt.lon=next.lon;pt.lat=next.lat;pt.pixelX=b.x;pt.pixelY=b.y;
   }
   paintTrail(ctx,buckets);
  }
  // Feedback controls only the amount of optional particle drawing, never
  // the actual U/V data or wind-speed-derived colors. Recover gradually if
  // the device has headroom, so dense RRFS/REFS layouts remain interactive.
  if(visible.length){
   const elapsed=Math.max(0,performance.now()-workStart);
   tracerWorkAverage=tracerWorkAverage?tracerWorkAverage*.82+elapsed*.18:elapsed;
   if(++tracerWorkFrames%12===0){
    const budget=mobile?9:visible.length>=5?14:11;
    if(tracerWorkAverage>budget*1.15)tracerWorkScale=Math.max(.42,tracerWorkScale*.84);
    else if(tracerWorkAverage<budget*.65)tracerWorkScale=Math.min(1,tracerWorkScale+.035);
   }
  }
  frame=requestAnimationFrame(tick);
 }
 function tracerPerformance(){
  let fastGridPanels=0,fastLambertPanels=0,fastLatLonPanels=0,referenceGridPanels=0;
  for(const p of panels){if(!p.tracerVectors)continue;
   const accelerated=p.tracerVectors.fast;
   if(accelerated){fastGridPanels++;
    if(accelerated.gridType==='lcc')fastLambertPanels++;
    if(accelerated.gridType==='latlon')fastLatLonPanels++;
   }else referenceGridPanels++;}
  return {active:tracersOn,workScale:Number(tracerWorkScale.toFixed(2)),
   averageFrameWorkMs:Number(tracerWorkAverage.toFixed(1)),
   fastGridPanels,fastLambertPanels,fastLatLonPanels,referenceGridPanels};
 }
 function configure(opts){
  config=opts||{};
  // A local manifest is the installer completion marker: no DEM requests until
  // all tiles have been downloaded and the manifest is published.
  if(typeof fetch!=='function')return;
  fetch('data/dem/manifest.json',{cache:'no-store'}).then(async response=>{
   if(!response.ok)return;const metadata=await response.json();
   if(metadata.encoding!=='terrarium'||metadata.complete!==true||!Number.isInteger(metadata.max_zoom))return;
   config.terrainLocalDEMInstalled=true;config.terrainLocalDEMMaxZoom=metadata.max_zoom;
   config.terrainLocalDEMTemplate='data/dem/{z}/{x}/{y}.png';
   if(terrainOn)for(const map of maps){if(!mapUsesTerrain(map))continue;clearTerrain(map);const state=terrainStates.get(map);if(state){state.provider=0;state.loaded=false;state.demLoaded=false;state.failed=false;}terrain(map,true);}
  }).catch(()=>{});
 }
 document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden){for(const p of panels)clear(p);if(tracersOn&&!frame)frame=requestAnimationFrame(tick);}});
 window.EVUAdvancedMap={configure,attach,detach,setTerrain,setMode,setTheme,setTerrainStatusListener,
  setTracers,setTracerStyle,setTerrainOpacity,setTerrainExaggeration,setTerrainLighting,setFieldOpacity,setVectors,clear,orderTerrain,
  getTracerPerformance:tracerPerformance,isTerrainReady:map=>{
   if(!map||!terrainReady.has(map)||!mapUsesTerrain(map))return false;
   try{return map.isSourceLoaded?.('evu-dem')!==false;}catch(_){return false;}
  }};
})();
