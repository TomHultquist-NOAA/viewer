// FIXED, operationally oriented display palettes. Nothing auto-scales to the
// currently selected model, cycle or forecast hour (users may manually set a range).
// Irregular bins emphasize common precipitation while preserving extremes.
// User-requested precipitation/snow color families (November 2026).
// Band colors are shared across model sets and rendered by the same GPU,
// legend and export code paths. Explicit custom palettes still override these.
const RAIN_COLORS = ["#c7dfc0","#a1d99b","#74c476","#31a353","#006d2c","#fffa8a","#ffcc4f","#fe8d3c","#fc4e2a","#d61a1c","#ad0026","#700026","#3b0030","#4c0073","#ffdbff"];
// Geopotential heights are mapped in meteorological decametres (dm):
// the source Zarr fields remain in geopotential metres. Use a height-specific
// blue–cyan–yellow–orange palette so midlevel heights are not colored like air temperature.
const HEIGHT_COLORS = [[0,'#253b91'],[.16,'#3574bc'],[.32,'#77baca'],
 [.48,'#cde6c5'],[.61,'#f0e58b'],[.74,'#f8b962'],[.87,'#e56c52'],[1,'#983e80']];
const SNOW_COLORS = ["#bdd7e7","#6baed6","#3182bd","#005199","#002694","#ffff96","#ffc400","#ff8700","#db1400","#9e0000","#690000","#360000","#ccccff","#9f8cd8","#7c52a5"];
const RAIN_LEVELS = [0.01,0.1,0.25,0.5,1,1.5,2,3,4,6,8,10,15,20,30,60];
const RATE_LEVELS = [0.001,0.0025,0.005,0.01,0.02,0.04,0.06,0.10,0.15,0.25,0.4,0.6,1,1.5,2,3];
const MIN_DISPLAY_PRECIP_IN = 0.010; // Minimum visible accumulated precipitation (inches)
const SNOW_LEVELS = [0.1,1,2,3,4,6,8,12,18,24,30,36,48,60,72,96];
const MIN_DISPLAY_SNOW_IN = 0.1;
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
 // User-reference MSLP spectrum: deep reds at LOW pressure, through
 // orange/yellow/green/cyan, to blue/violet/pink at HIGH pressure.
 // Display-only, 128 smoothly interpolated intervals across the fixed
 // 950–1050 hPa range. The GPU and all browser/export legends share pal().
 mslp:{label:'Mean sea level pressure (MSLP)',unit:'hPa',convert:'PaToHpa',
  min:950,max:1050,paletteSamples:128,colors:[
   [950,'#630718'],[960,'#930d20'],[966,'#d10c21'],[972,'#f82d19'],[978,'#ff7b16'],
   [984,'#ffc52c'],[990,'#f2ed1f'],[996,'#b7eb08'],[1002,'#58e822'],
   [1008,'#10de78'],[1014,'#08d7cf'],[1020,'#1ea4e8'],[1026,'#2372ed'],
   [1032,'#363bd9'],[1038,'#6e36dc'],[1044,'#bc42df'],[1050,'#f3acd1']]},
 refc:{label:'Composite reflectivity',unit:'dBZ',levels:REFC_LEVELS,bandColors:REFC_COLORS},
 refc_ptype:{label:'Reflectivity with precipitation type',unit:'dBZ',ptypeReflectivity:true},
 // Converter-published native visibility (metres) and AGL ceiling (metres).
 // Use discrete aviation-relevant bins; METAR dots sample the SAME palette.
 // High-visibility and very-high-ceiling source values are deliberately
 // excluded from shading AND from any signed forecast-minus-analysis or
 // model-minus-model comparison. Strictly greater; exactly at the limit stays valid.
 vis:{label:'Visibility',unit:'mi',convert:'metersToMiles',maxValidDisplay:9,
  levels:[0,.25,.5,1,2,3,5,6,9],
  bandColors:['#84202a','#b53336','#db6137','#ed993f','#f6cc67','#f1ec90','#b6dc8d','#73c8a5']},
 ceil:{label:'Ceiling height (AGL)',unit:'ft',convert:'mtoft',maxValidDisplay:30000,
  levels:[0,200,500,1000,1500,2000,3000,5000,8000,12000,30000],
  bandColors:['#84202a','#b53336','#db6137','#ed993f','#f6cc67','#f1ec90','#b6dc8d','#73c8a5','#459bc2','#5170b3']},
 flightcat:{label:'Flight category',unit:'',flightCategory:true},
 // Wind fields are stored by WCOSS2 in m/s and displayed in knots.
 wspd10:{label:'10-m wind speed',unit:'kt',convert:'mpsToKt',levels:[0,2,5,10,15,20,25,30,35,40,45,50,55,60,70,80,90,100,120,140],bandColors:['#e6f5f3','#bde5da','#8ed5cb','#55bfbb','#269bb9','#277bc3','#375dc5','#5356b9','#7652b1','#9c4fb1','#be519f','#d35c88','#df6a6c','#e87e4e','#ee9d3d','#efbc42','#f5dd64','#fff2a0','#fffaf0']},
 wspd250:{label:'250 hPa wind speed',unit:'kt',convert:'mpsToKt',levels:[0,20,30,40,50,60,70,80,90,100,110,120,130,140,160,180,200],bandColors:['#e6f5f3','#bde5da','#8ed5cb','#55bfbb','#269bb9','#277bc3','#375dc5','#5356b9','#7652b1','#9c4fb1','#be519f','#d35c88','#df6a6c','#e87e4e','#ee9d3d','#efbc42']},
 wspd850:{label:'850 hPa wind speed',unit:'kt',convert:'mpsToKt',levels:[0,5,10,15,20,25,30,35,40,45,50,55,60,70,80,90,100,120],bandColors:['#e6f5f3','#bde5da','#8ed5cb','#55bfbb','#269bb9','#277bc3','#375dc5','#5356b9','#7652b1','#9c4fb1','#be519f','#d35c88','#df6a6c','#e87e4e','#ee9d3d','#efbc42','#f5dd64']},
 wspd300:{label:'300 hPa wind speed',unit:'kt',convert:'mpsToKt',levels:[0,20,30,40,50,60,70,80,90,100,110,120,130,140,160,180,200],bandColors:['#e6f5f3','#bde5da','#8ed5cb','#55bfbb','#269bb9','#277bc3','#375dc5','#5356b9','#7652b1','#9c4fb1','#be519f','#d35c88','#df6a6c','#e87e4e','#ee9d3d','#efbc42']},
 gust:{label:'10-m wind gust',unit:'kt',convert:'mpsToKt',levels:[0,5,10,15,20,25,30,35,40,45,50,55,60,70,80,90,100,120,140,160],bandColors:['#e6f5f3','#bde5da','#8ed5cb','#55bfbb','#269bb9','#277bc3','#375dc5','#5356b9','#7652b1','#9c4fb1','#be519f','#d35c88','#df6a6c','#e87e4e','#ee9d3d','#efbc42','#f5dd64','#fff2a0','#fffaf0']},
 u10:{label:'10-m U wind component',unit:'kt',convert:'mpsToKt',min:-100,max:100,colors:[[0,'#3d4d9d'],[.2,'#347bbd'],[.38,'#9dcfe5'],[.5,'#f4f5f5'],[.62,'#f5c09b'],[.8,'#e47a49'],[1,'#a42f39']],fraction:true},
 v10:{label:'10-m V wind component',unit:'kt',convert:'mpsToKt',min:-100,max:100,colors:[[0,'#3d4d9d'],[.2,'#347bbd'],[.38,'#9dcfe5'],[.5,'#f4f5f5'],[.62,'#f5c09b'],[.8,'#e47a49'],[1,'#a42f39']],fraction:true},
 t2m:{label:'2-m temperature',unit:'°F',min:-40,max:110,convert:'F',colors:[[0,'#422d92'],[.2,'#3266cb'],[.35,'#71c3e2'],[.48,'#bedbb0'],[.58,'#f3e58d'],[.72,'#f59a43'],[.85,'#d44730'],[1,'#882c4d']],fraction:true},
 dpt2m:{label:'2-m dew point',unit:'°F',min:-40,max:85,convert:'F',colors:[[0,'#6e4ca0'],[.24,'#3f86bf'],[.43,'#6ec9ce'],[.58,'#b7cf74'],[.78,'#55a851'],[1,'#174a33']],fraction:true},
 t1000:{label:'1000 hPa Temperature',unit:'°C',min:-45,max:40,convert:'C',copyColors:'t2m'},
 t925:{label:'925 hPa Temperature',unit:'°C',min:-45,max:40,convert:'C',copyColors:'t2m'},
 t850:{label:'850 hPa Temperature',unit:'°C',min:-40,max:40,convert:'C',copyColors:'t2m'},
 t700:{label:'700 hPa Temperature',unit:'°C',min:-45,max:30,convert:'C',copyColors:'t2m'},
 absv500:{label:'500 hPa absolute vorticity',unit:'10⁻⁵ s⁻¹',convert:'vort1e5',
  levels:[-20,-10,-5,0,5,10,15,20,25,30,35,40,50,60,75],
  bandColors:['#4965a8','#7d91bb','#b6c5d8','#e5e7ed','#eeeead','#f9d46a','#f5ab4a','#ed8039','#df5934','#cb3139','#a51a48','#86175e','#6c1773','#50236e']},

 // Native HGT is stored in geopotential metres; display shading, probes,
 // difference maps, legends, and exported images in meteorological decametres
 // (dm = 10 m in this meteorological context; the source data are unchanged).
 // These fixed envelopes include a broad seasonal/latitude range, so colors
 // remain comparable between models, cycles, forecast leads, and exports.
 h250:{label:'250 hPa geopotential height',unit:'dm',convert:'mToDm',min:940,max:1160,colors:HEIGHT_COLORS,fraction:true,heightField:true},
 h300:{label:'300 hPa geopotential height',unit:'dm',convert:'mToDm',min:830,max:1050,colors:HEIGHT_COLORS,fraction:true,heightField:true},
 h500:{label:'500 hPa geopotential height',unit:'dm',convert:'mToDm',min:450,max:620,colors:HEIGHT_COLORS,fraction:true,heightField:true},
 h700:{label:'700 hPa geopotential height',unit:'dm',convert:'mToDm',min:240,max:340,colors:HEIGHT_COLORS,fraction:true,heightField:true},
 h850:{label:'850 hPa geopotential height',unit:'dm',convert:'mToDm',min:100,max:180,colors:HEIGHT_COLORS,fraction:true,heightField:true},
 h925:{label:'925 hPa geopotential height',unit:'dm',convert:'mToDm',min:45,max:115,colors:HEIGHT_COLORS,fraction:true,heightField:true},
 h1000:{label:'1000 hPa geopotential height',unit:'dm',convert:'mToDm',min:-15,max:55,colors:HEIGHT_COLORS,fraction:true,heightField:true},
 // Optional native isobaric moisture contours (not primary shaded menu fields).
 // Physical contours use °C for dewpoint and g/kg for specific humidity.
 td700:{label:'700 hPa dewpoint',unit:'°C',convert:'C',min:-80,max:15,copyColors:'dpt2m'},
 td850:{label:'850 hPa dewpoint',unit:'°C',convert:'C',min:-70,max:30,copyColors:'dpt2m'},
 td925:{label:'925 hPa dewpoint',unit:'°C',convert:'C',min:-65,max:35,copyColors:'dpt2m'},
 q700:{label:'700 hPa specific humidity',unit:'g/kg',convert:'kgkgToGkg',min:0,max:14,copyColors:'q2m'},
 q850:{label:'850 hPa specific humidity',unit:'g/kg',convert:'kgkgToGkg',min:0,max:20,copyColors:'q2m'},
 q925:{label:'925 hPa specific humidity',unit:'g/kg',convert:'kgkgToGkg',min:0,max:24,copyColors:'q2m'},
 q2m:{label:'2-m specific humidity' ,unit:'g/kg',min:0,max:24,convert:'kgkgToGkg',colors:[[0,'#8e63b8'],[.2,'#6589c3'],[.42,'#77c8cc'],[.6,'#c5d77d'],[.8,'#6cad68'],[1,'#1e7546']],fraction:true},
 rh2m:{label:'2-m relative humidity',unit:'%',min:0,max:100,colors:[[0,'#a25b37'],[.2,'#dc9d46'],[.4,'#e7d78b'],[.6,'#a3c788'],[.8,'#42989b'],[1,'#24558a']],fraction:true},
 // PRATE input is kg m-2 s-1 (equivalent to mm/s); the GPU displays in/hr.
 // Fixed inch/hour bins track the previous physical intensity bands.
 prate:{label:'Precipitation rate',unit:'in/hr',convert:'rateToInHr',levels:RATE_LEVELS,bandColors:RAIN_COLORS},
 // Zarr accumulation amounts are kg m-2 = mm of water; display as inches.
 apcp1h:{label:'1-hour precipitation',unit:'in',convert:'mmtoin',levels:RAIN_LEVELS,bandColors:RAIN_COLORS},
 apcp3h:{label:'3-hour precipitation',unit:'in',convert:'mmtoin',levels:RAIN_LEVELS,bandColors:RAIN_COLORS},
 apcp6h:{label:'6-hour precipitation',unit:'in',convert:'mmtoin',levels:RAIN_LEVELS,bandColors:RAIN_COLORS},
 apcp24h:{label:'24-hour precipitation',unit:'in',convert:'mmtoin',levels:RAIN_LEVELS,bandColors:RAIN_COLORS},
 apcp48h:{label:'48-hour precipitation',unit:'in',convert:'mmtoin',levels:RAIN_LEVELS,bandColors:RAIN_COLORS},
 apcp:{label:'Accumulated precipitation',unit:'in',convert:'mmtoin',levels:RAIN_LEVELS,bandColors:RAIN_COLORS},
 frozr:{label:'Sleet accumulation',unit:'in',convert:'mmtoin',levels:RAIN_LEVELS,bandColors:RAIN_COLORS},
 frzr:{label:'Freezing rain accumulation',unit:'in',convert:'mmtoin',levels:RAIN_LEVELS,bandColors:RAIN_COLORS},
 tsnowp:{label:'Snow precipitation (liquid equivalent)',unit:'in',convert:'mmtoin',levels:RAIN_LEVELS,bandColors:RAIN_COLORS},
 asnow:{label:'Accumulated snowfall',unit:'in',convert:'mtoin',levels:SNOW_LEVELS,bandColors:SNOW_COLORS},
 weasd:{label:'Snow water equivalent',unit:'in',convert:'mmtoin',levels:RAIN_LEVELS,bandColors:RAIN_COLORS},
 snod:{label:'Snow depth',unit:'in',convert:'mtoin',levels:SNOW_LEVELS,bandColors:SNOW_COLORS},
 snowpresence:{label:'RAP snow presence (≥ 1 cm)',unit:'',category:'#70c7f0'},
 snowc:{label:'Snow cover',unit:'%',min:0,max:100,cutoff:1,copyColors:'rh2m'},
 cpofp:{label:'Percent frozen precipitation',unit:'%',min:0,max:100,validRange:[0,100],copyColors:'t2m'},
 sden:{label:'Snow density',unit:'kg m⁻³',min:50,max:500,copyColors:'rh2m'},
 csnow:{label:'Categorical snow',unit:'',category:'#65b6ff'},
 cicep:{label:'Categorical ice pellets',unit:'',category:'#ef8dd7'},
 cfrzr:{label:'Categorical freezing rain',unit:'',category:'#da5d95'},
 crain:{label:'Categorical rain',unit:'',category:'#59d37c'},
 ptype:{label:'Precipitation type',unit:'',ptype:true},
 snow1h:{label:'1-hour snowfall',unit:'in',convert:'mtoin',levels:SNOW_LEVELS,bandColors:SNOW_COLORS},
 snow3h:{label:'3-hour snowfall',unit:'in',convert:'mtoin',levels:SNOW_LEVELS,bandColors:SNOW_COLORS},
 snow6h:{label:'6-hour snowfall',unit:'in',convert:'mtoin',levels:SNOW_LEVELS,bandColors:SNOW_COLORS},
 snow24h:{label:'24-hour snowfall',unit:'in',convert:'mtoin',levels:SNOW_LEVELS,bandColors:SNOW_COLORS},
 snow48h:{label:'48-hour snowfall',unit:'in',convert:'mtoin',levels:SNOW_LEVELS,bandColors:SNOW_COLORS},
};
// Distinct GFS-only snowfall proxies. SWE is total snow precipitation (liquid
// equivalent, kg/m²) converted to snow depth at fixed 10:1 SLR; SNOD is an
// instantaneous state and its difference is a SIGNED net depth change.
// Neither should be confused with native ASNOW snowfall forecasts.
const GFS_SNOW_PERIODS=[3,6,24,48];
const GFS_SNOW_KEYS=new Set();
for(const method of ['slr10','depthChange']){
 for(const period of [0,...GFS_SNOW_PERIODS]){
  const suffix=period?`${period}h`:'';
  const key=`gfs_snow_${method}${suffix}`;
  const intervalName=period?`${period}-hour`:'Accumulated';
  if(method==='slr10')FIELDS[key]={...FIELDS[period&&period<=3?'snow3h':'snow24h'],
   label:`${intervalName} snowfall (adjustable SLR)`,convert:'snowSlr10ToIn',unit:'in',
   gfsSnow:{method:'slr10',period,source:'tsnowp'}};
  else FIELDS[key]={...FIELDS[period&&period<=3?'snow3h':'snow24h'],
   label:`${intervalName} snowfall (snow depth change)`,unit:'in',convert:'mtoin',min:0,levels:SNOW_LEVELS,
   gfsSnow:{method:'depthChange',period,source:'snod'}};
  GFS_SNOW_KEYS.add(key);
 }
}
// RRFS-derived snowfall methods use separate, explicitly selected native inputs.
// Snow precipitation is cumulative; WEASD and SNOD are instantaneous state fields.
const RRFS_SNOW_PERIODS=[1,3,6,24,48];
const RRFS_SNOW_KEYS=new Set();
// Place the running-total option immediately after the final (48-hour)
// period for each method, matching the GFS snowfall menu's interval order.
const RRFS_SNOW_MENU_ORDER=[
 ...RRFS_SNOW_PERIODS.map(h=>`rrfs_snow_weasd${h}h`),
 'rrfs_snow_weasd',
 ...RRFS_SNOW_PERIODS.map(h=>`rrfs_snow_depthChange${h}h`),
 'rrfs_snow_depthChange'
];
for(const [method,source,label,conversion] of [
 ['precip','tsnowp','snow precipitation','snowSlr10ToIn'],
 ['weasd','weasd','WEASD increase','snowSlr10ToIn'],
 ['depthChange','snod','snow depth change','mtoin']]){
 for(const period of [0,...RRFS_SNOW_PERIODS]){
  const key=`rrfs_snow_${method}${period?period+'h':''}`;
  const base=method==='depthChange'?FIELDS.gfs_snow_depthChange:FIELDS.snow24h;
  FIELDS[key]={...base,minimumDisplaySnowIn:true,clearBelow:MIN_DISPLAY_SNOW_IN,label:`${period?period+'-hour':'Accumulated'} snowfall (${method==='depthChange'?'snow depth change':'adjustable SLR'})`,
   convert:conversion,unit:'in',gfsSnow:{method:method==='depthChange'?'depthChange':'slr10',period,source,rrfs:true}};
  RRFS_SNOW_KEYS.add(key);
 }
}
function gfsSnowSpec(field){return FIELDS[field]?.gfsSnow||null;}
function rrfsSnowSpec(field){const spec=gfsSnowSpec(field);return spec?.rrfs?spec:null;}
function isAdjustableSnow(field){return gfsSnowSpec(field)?.method==='slr10';}
function activeSnowRatio(field){return isAdjustableSnow(field)?Math.max(5,Math.min(40,Number(st.snowRatio)||10)):10;}

// GFS accumulation display modes: both models use positive SWE change
// by default, so v17-v16 differences are a like-for-like comparison.
// Only v17 has native TSNOWP snow-precipitation accumulation.
function isGfsV16(model){
 const labels=(model&&typeof model==='object')?[model.model_id,model.model]:[model];
 return labels.some(value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'')==='gfsv16');
}
function isGfsV17(model){
 const labels=(model&&typeof model==='object')?[model.model_id,model.model]:[model];
 return labels.some(value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'')==='gfsv17');
}
function gfsUsesSweChange(field,model){const spec=gfsSnowSpec(field);return spec?.method==='slr10'&&(spec.rrfs&&field.startsWith('rrfs_snow_precip')?false:st.snowMethod!=='precip');}
function gfsSnowSource(field,model=''){
 const spec=gfsSnowSpec(field);
 if(!spec)return null;
 return spec.method==='slr10'?(spec.rrfs&&field.startsWith('rrfs_snow_precip')?'tsnowp':st.snowMethod==='precip'?'tsnowp':'weasd'):spec.source;
}
// Compatibility name for existing time-series controls (v16 may have only WEASD).
function gfsV16SweProxy(field,model){return gfsUsesSweChange(field,model)&&isGfsV16(model);}
function gfsSnowMethodLabel(field){
 if(gfsSnowSpec(field)?.method!=='slr10')return '';
 return st.snowMethod==='precip'?'Snow precipitation':'SWE increase';
}
function nativeNohrscSnowField(field){
 const spec=gfsSnowSpec(field);
 if(!spec)return null;
 if(spec.period===3)return 'snow3h';
 if(spec.period===6)return 'snow6h';
 if(spec.period===24)return 'snow24h';
 if(spec.period===48)return 'snow48h';
 if(spec.period===0)return 'asnow';
 return null;
}
function positiveSnowpackGain(now,earlier){
 if(now.length!==earlier.length)throw Error('Snowpack SWE grids differ');
 const out=new Float32Array(now.length);
 for(let i=0;i<out.length;i++){
  const a=now[i],b=earlier[i];
  out[i]=Number.isFinite(a)&&Number.isFinite(b)&&a>-1e9&&b>-1e9?Math.max(0,a-b):NaN;
 }
 return out;
}
function signedSnowChange(now,earlier){
 if(now.length!==earlier.length)throw Error('Snow depth or liquid equivalent grid dimensions differ');
 const result=new Float32Array(now.length);
 for(let i=0;i<now.length;i++){
  const a=now[i],b=earlier[i];
  result[i]=Number.isFinite(a)&&Number.isFinite(b)&&a>-1e9&&b>-1e9?a-b:NaN;
 }
 return result;
}
// Common v16/v17 wave forecasts. Fixed scales remain stable during playback.
// Directions are stored as angular fields plus east/north unit components;
// they are rendered as *arrows*, not meteorological wind barbs.
for(const [key,label,unit,min,max] of [
 ['wave_height_sig','Significant wave height','ft',0,40],
 ['wave_height_wind','Wind-wave significant height','ft',0,30],
 ['wave_height_swell1','Primary swell height','ft',0,30],
 ['wave_period_primary','Primary wave period','s',0,24],
 ['wave_period_wind','Wind-wave period','s',0,20],
 ['wave_period_swell1','Primary swell period','s',0,24]]){
 FIELDS[key]={label,unit,min,max,...(key.startsWith('wave_height_')?{convert:'mtoft'}:{}),colors:[[0,'#edf7f7'],[.16,'#a0d8e7'],[.36,'#4a9fd0'],[.56,'#3655ab'],[.76,'#8d4eb2'],[1,'#e26580']],fraction:true};
}
const MARINE_FIELDS=new Set(['wave_height_sig','wave_height_wind','wave_height_swell1',
 'wave_period_primary','wave_period_wind','wave_period_swell1']);
// Combined/locally wind-generated wave plots show ACTUAL 10-m winds by default.
// Do not associate unrelated atmospheric winds with swell-only plots.
const MARINE_WIND_FIELDS=new Set(['wave_height_sig','wave_height_wind','wave_period_primary','wave_period_wind']);
const MARINE_VECTOR_FIELDS={wave_height_sig:['wave_u_primary','wave_v_primary'],
 wave_period_primary:['wave_u_primary','wave_v_primary'],
 wave_height_wind:['wave_u_wind','wave_v_wind'],wave_period_wind:['wave_u_wind','wave_v_wind'],
 wave_height_swell1:['wave_u_swell1','wave_v_swell1'],wave_period_swell1:['wave_u_swell1','wave_v_swell1']};
for(const pressure of [1000,925,850,700,500,300,250]){
 // Do not overwrite the fixed, physical height ranges and palette above.
 if(!FIELDS['h'+pressure])throw Error('Missing geopotential-height display scale: '+pressure);
 for(const dir of ['u','v']) FIELDS[dir+pressure]={label:pressure+'-hPa '+dir.toUpperCase()+' wind',unit:'kt',convert:'mpsToKt'};
}
for(const [key,label,unit,min,max] of [
 ['shear01','0–1 km bulk shear','kt',0,60],['shear06','0–6 km bulk shear','kt',0,90],
 ['srh01','0–1 km storm-relative helicity','m² s⁻²',-200,650],['srh03','0–3 km storm-relative helicity','m² s⁻²',-200,850],
 ['sbcape','Surface-based CAPE','J kg⁻¹',0,6000],['mlcape','Mixed-layer CAPE','J kg⁻¹',0,6000],['mucape','Most-unstable CAPE','J kg⁻¹',0,7000],
 ['mxuphl','1-hour maximum updraft helicity (2–5 km)','m² s⁻²',-200,400],
 ['mxuphl_run','Accumulated maximum updraft helicity (2–5 km)','m² s⁻²',-200,400]])
 FIELDS[key]={label,unit,min,max,...(['sbcape','mlcape','mucape'].includes(key)?{cutoff:10}:{}),...(key.startsWith('shear')?{convert:'mpsToKt'}:{}),colors:[[0,'#dae7ee'],[.18,'#b1c8d5'],[.35,'#6faf99'],[.5,'#e0d76d'],[.7,'#eda04a'],[.87,'#d65a50'],[1,'#9d3272']],fraction:true};
// Highlight changes in weak/moderate CAPE without collapsing high values.
// Physical thresholds are numerical stops, not an evenly spaced index.
for(const name of ['sbcape','mlcape','mucape']){
 const max=FIELDS[name].max;
 Object.assign(FIELDS[name],{fraction:false,paletteSamples:160,
  colors:[[0,'#f4f6f4'],[10,'#dceafa'],[25,'#a8d9ed'],[50,'#6abecb'],
   [100,'#3da79c'],[200,'#67bd79'],[350,'#a9cc65'],[500,'#e0db60'],
   [750,'#f6bc50'],[1000,'#f19543'],[1500,'#e86b39'],[2000,'#d74742'],
   [3000,'#b33067'],[4500,'#802978'],[max,'#4b216e']]});
}
// Negative SRH is blue/cyan, positive SRH is yellow/orange/red-purple;
// neutral zero is pale and has its existing narrow transparent deadband.
for(const name of ['srh01','srh03']){
 const max=FIELDS[name].max;
 Object.assign(FIELDS[name],{fraction:false,paletteSamples:128,
  colors:[[-200,'#153676'],[-150,'#2c56a9'],[-100,'#4976d6'],
   [-50,'#6ab6e8'],[-15,'#c2e5f6'],[0,'#f8f8f3'],
   [25,'#f7e399'],[50,'#f5c75c'],[100,'#f7993a'],
   [200,'#e76432'],[350,'#b83b4c'],[max,'#702a6c']]});
}
FIELDS.rottrack_ml60={label:'MRMS mid-level rotation track (3–6 km AGL, 60 min)',unit:'×10⁻³ s⁻¹',min:0,max:35,levels:[0,1,2,3,4,6,8,10,13,17,22,28,35],bandColors:['#00000000','#deeff1','#b4dfd9','#8acbb8','#69b693','#9cc96b','#d4c455','#ebb04a','#ed9044','#e9713a','#d34a34','#a92c4b'],clearZero:0.5};
// Background transparency is a *display-only* choice. Keep genuinely zero
// quantities unshaded (and tiny signed values near neutral unshaded) rather
// than painting an entire domain, without hiding missing data or changing Zarr.
// Thresholds use the display units established in each field definition.
for(const [name,threshold] of Object.entries({
 wspd10:2,wspd250:2,wspd300:2,gust:2,u10:2,v10:2,
 cpofp:1,snowc:1,
 sbcape:10,mlcape:10,mucape:10,
 shear01:2,shear06:2,srh01:10,srh03:10,
 absv500:5,mxuphl:5,mxuphl_run:5
}))FIELDS[name].clearZero=threshold;
// Hide accumulated precipitation traces below 0.010 inch in all plotted panels,
// city/hover readouts and exports. Display-only; native data are unchanged.
for(const name of ['apcp','apcp1h','apcp3h','apcp6h','apcp24h','apcp48h']){
 FIELDS[name].minimumDisplayPrecipIn=true;
 FIELDS[name].clearBelow=MIN_DISPLAY_PRECIP_IN;
}
// Snowfall and snow-depth displays start at the first user-specified 0.1-inch color.
// These thresholds belong to the display metadata, never the Zarr arrays.
for(const name of ['asnow','snow1h','snow3h','snow6h','snow24h','snow48h','snod']){
 FIELDS[name].minimumDisplaySnowIn=true;
 FIELDS[name].clearBelow=MIN_DISPLAY_SNOW_IN;
}
// Explicit near-zero transparent zone for hourly and run-max updraft helicity.
for(const name of ['mxuphl','mxuphl_run']){
 FIELDS[name].levels=[-200,-100,-50,-20,-5,5,10,20,40,75,125,175,250,400];
 FIELDS[name].bandColors=['#294b9c','#477cbe','#78a8cf','#adc9d5','#00000000','#e6cb79','#edab56','#e68d45','#d96238','#c53937','#a51d5c','#7a2182','#562074'];
 delete FIELDS[name].colors;
}
// Fixed forecaster field sequence. U/V are read for barbs, not separate menu fields.
const FIELD_ORDER = [
 'ptype','refc_ptype','refc','csnow','cicep','cfrzr','crain',
 'mslp','t2m','dpt2m','q2m','rh2m','vis','ceil','flightcat','prate','apcp1h','apcp3h','apcp6h','apcp24h','apcp48h','apcp','frozr','frzr','tsnowp',
 'snow1h','snow3h','snow6h','snow24h','snow48h','asnow',
 'gfs_snow_slr103h','gfs_snow_slr106h','gfs_snow_slr1024h','gfs_snow_slr1048h','gfs_snow_slr10',
 'gfs_snow_depthChange3h','gfs_snow_depthChange6h','gfs_snow_depthChange24h','gfs_snow_depthChange48h','gfs_snow_depthChange',
 ...RRFS_SNOW_MENU_ORDER,
 // Keep TSNOWP aliases available to existing deep links without displaying
 // duplicate entries in the regional snowfall menu.
 ...[...RRFS_SNOW_KEYS].filter(key=>!RRFS_SNOW_MENU_ORDER.includes(key)),
 'cpofp','snowc','sden','weasd','snod',
 't1000','t925','t850','t700','absv500','wspd250','wspd300','wspd10','gust',
 'shear01','shear06','srh01','srh03','sbcape','mlcape','mucape','mxuphl','mxuphl_run',
 'wave_height_sig','wave_height_wind','wave_height_swell1',
 'wave_period_primary','wave_period_wind','wave_period_swell1'
];
// Menu choices describe what this viewer can render; the catalogs decide what
// each model and forecast hour can actually provide. Keep the two independent.
const UPPER_AIR_MENU_LABELS={
 mslp:'MSLP / 850 hPa Temperature',
 t2m:'2-m Temperature / MSLP',dpt2m:'2-m Dewpoint / MSLP',
 rh2m:'2-m RH / MSLP',wspd10:'10-m Wind / MSLP',gust:'10-m Gust / MSLP',
 wspd250:'250 hPa Height/Wind',wspd300:'300 hPa Height/Wind',absv500:'500 hPa Height/Vorticity',
 t700:'700 hPa Height/Temperature/Moisture',t850:'850 hPa Height/Temperature/Moisture',
 t925:'925 hPa Height/Temperature/Moisture',t1000:'1000 hPa Height/Temperature'
};
function fieldMenuEntries(){
 return FIELD_ORDER.filter(n=>Object.prototype.hasOwnProperty.call(FIELDS,n))
  .map(n=>({key:n,label:UPPER_AIR_MENU_LABELS[n]||FIELDS[n].label}));
}
// Compact two-level field navigation. The underlying field IDs, forecast
// availability, deep links, rendering, and exports are completely unchanged.
// Group definitions are deliberately independent from published catalogs so
// every supported selection is visible even before its data are backfilled.
const FIELD_GROUP_DEFS = [
 {key:'radar',label:'Radar & precip. type',fields:['refc','ptype','refc_ptype','csnow','cicep','cfrzr','crain']},
 {key:'surface',label:'Surface weather',fields:['mslp','t2m','dpt2m','q2m','rh2m','wspd10','gust']},
 {key:'aviation',label:'Aviation weather',fields:['vis','ceil','flightcat']},
 {key:'precip',label:'Precipitation',fields:['prate','apcp1h','apcp3h','apcp6h','apcp24h','apcp48h','apcp']},
 {key:'snow',label:'Winter weather',fields:['snow1h','snow3h','snow6h','snow24h','snow48h','asnow','gfs_snow_slr103h','gfs_snow_slr106h','gfs_snow_slr1024h','gfs_snow_slr1048h','gfs_snow_slr10','gfs_snow_depthChange3h','gfs_snow_depthChange6h','gfs_snow_depthChange24h','gfs_snow_depthChange48h','gfs_snow_depthChange',...RRFS_SNOW_MENU_ORDER,...RRFS_SNOW_KEYS,'frzr','frozr','tsnowp','cpofp','weasd','snod','snowc','sden']},
 {key:'marine',label:'Marine weather',fields:['wave_height_sig','wave_height_wind','wave_height_swell1','wave_period_primary','wave_period_wind','wave_period_swell1']},
 {key:'upperair',label:'Upper air',fields:['wspd250','wspd300','absv500','t700','t850','t925','t1000']},
 {key:'shear',label:'Shear & helicity',fields:['shear01','shear06','srh01','srh03']},
 {key:'convective',label:'Instability & severe storms',fields:['sbcape','mlcape','mucape','mxuphl','mxuphl_run']}
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
// Native GFS accumulation output is three-hourly; never offer 1-hour
// precipitation/snowfall accumulation fields in this model set.
// AI menu is the verified comparative field subset; missing near-surface
// moisture products are intentionally not advertised even in older catalogs.
// One shaded scalar per upper-air menu. The choice controls BOTH forecast
// image shading and any precomputed or dynamically calculated difference.
// Contour checkboxes stay independent and RRFS/REFS comparison selectors stay
// in their original positions; no checkbox belongs on difference labels.
// Explicit multi-scalar plot groups (upper air and surface). Adding a plot here enables the same shaded
// image, difference, share-link and independent contour control paths.
const UPPER_AIR_IMAGE_FIELDS=Object.freeze({
 mslp:[['mslp','MSLP'],['t850','850-hPa Temperature']],
 t2m:[['t2m','2-m Temperature'],['mslp','MSLP']],
 dpt2m:[['dpt2m','2-m Dewpoint'],['mslp','MSLP']],
 rh2m:[['rh2m','2-m Relative humidity'],['mslp','MSLP']],
 wspd10:[['wspd10','10-m Wind speed'],['mslp','MSLP']],
 gust:[['gust','10-m Wind gust'],['mslp','MSLP']],
 wspd250:[['wspd250','Wind speed'],['h250','Height']],
 wspd300:[['wspd300','Wind speed'],['h300','Height']],
 absv500:[['absv500','Vorticity'],['h500','Height']],
 t700:[['t700','Temperature'],['h700','Height'],['td700','Dewpoint'],['q700','Specific humidity']],
 t850:[['t850','Temperature'],['h850','Height'],['wspd850','Wind speed'],['td850','Dewpoint'],['q850','Specific humidity']],
 t925:[['t925','Temperature'],['h925','Height'],['td925','Dewpoint'],['q925','Specific humidity']],
 t1000:[['t1000','Temperature'],['h1000','Height']]
});
const UPPER_AIR_SCALAR_KEYS=new Set(Object.values(UPPER_AIR_IMAGE_FIELDS).flat().map(choice=>choice[0]));
const SURFACE_MSLP_IMAGE_FIELDS=new Set(['t2m','dpt2m','rh2m','wspd10','gust']);
// A field is track-overlay eligible if and only if its shaded-image menu
// includes native MSLP; the toggle is independent of the selected shading.
function lowTracksAvailableForField(field=st.field){
 return field==='mslp'||SURFACE_MSLP_IMAGE_FIELDS.has(field);
}
function surfaceMSLPContoursEnabled(){return SURFACE_MSLP_IMAGE_FIELDS.has(st.field)&&st.overlayMSLP;}
function selectedShadingField(){
 const choices=UPPER_AIR_IMAGE_FIELDS[st.field];
 const value=st.shadedFields?.get?.(st.field);
 return choices?.some(item=>item[0]===value)?value:st.field;
}
function panelSelectedField(p){return p?.cfg?.field||selectedShadingField();}
function differenceFieldLabel(field){return FIELDS[field]?.label||field;}
// The primary scalar's contours remain independently selectable when a
// different field is shaded. Height and moisture have their own checkboxes.
// This applies to every model set and every multi-shaded upper-air level.
function primaryContourKey(){return st.field;}
function shadedContourEnabled(field=selectedShadingField()){
 return st.contours&&(!UPPER_AIR_IMAGE_FIELDS[st.field]||field===primaryContourKey());
}
function contourFieldLabel(field=selectedShadingField()){
 if(UPPER_AIR_IMAGE_FIELDS[st.field]){
  if(/^t(?:1000|925|850|700)$/.test(field))return 'Temperature';
  if(/^h(?:1000|925|850|700|500|300|250)$/.test(field))return 'Height';
  if(/^td(?:700|850|925)$/.test(field))return 'Dewpoint';
  if(/^q(?:700|850|925)$/.test(field))return 'Specific humidity';
  if(/^wspd(?:250|300|850)$/.test(field))return 'Wind speed';
  if(field==='absv500')return 'Vorticity';
  if(field==='mslp')return 'MSLP';
 }
 return FIELDS[field]?.label||field;
}

function syncImageFieldChoices(){
 const fieldset=document.getElementById('imageFieldControl'),root=document.getElementById('imageFieldOptions');
 if(!fieldset||!root)return;
 const choices=UPPER_AIR_IMAGE_FIELDS[st.field];
 fieldset.hidden=!choices;
 if(!choices){root.replaceChildren();return;}
 const title=fieldset.querySelector('legend');
 if(title)title.textContent='Shaded image / difference';
 const current=selectedShadingField();
 if(root.dataset.menu!==st.field){
  root.replaceChildren(...choices.map(([key,label])=>{
   const node=document.createElement('label');node.className='shaded-field-choice';
   const radio=document.createElement('input');radio.type='radio';radio.name='imageField';radio.value=key;
   const title=document.createElement('span');title.textContent=label;
   node.append(radio,title);return node;
  }));
  root.dataset.menu=st.field;
 }
 for(const radio of root.querySelectorAll('input[type="radio"]'))radio.checked=radio.value===current;
}
const AI_REQUESTED_FIELDS=new Set(['wspd250','wspd300','wspd850','absv500','t700','t850','t925','t1000','mslp','t2m','wspd10','apcp','apcp6h','apcp24h','apcp48h']);
function fieldAllowedForModelSet(fieldKey,modelSet){
 if(fieldKey==='flightcat')return modelSet!=='ai-models';
 if(modelSet==='ai-models')return AI_REQUESTED_FIELDS.has(fieldKey);
 if(modelSet==='gfs-versions')return !['wspd250','t1000','q2m'].includes(fieldKey)&&!RRFS_SNOW_KEYS.has(fieldKey)&&!['apcp1h','snow1h','snow3h','snow6h','snow24h','snow48h','asnow','snowc','mxuphl','mxuphl_run'].includes(fieldKey);
 return !['wspd250','t1000','q2m'].includes(fieldKey)&&!GFS_SNOW_KEYS.has(fieldKey)&&!/^rrfs_snow_precip(?:\d+h)?$/.test(fieldKey);
}
function fieldGroupFor(fieldKey){return FIELD_MENU_GROUPS.find(group=>group.fields.some(field=>field.key===fieldKey));}
// Preserve the viewed meteorological field across model sets when the target
// set actually supports it. The destination retains its own default when the
// field is unsupported; stale shade or snow-method parameters never leak into
// an unrelated field. Selection comes from live state (not a possibly stale URL).
function modelSetSwitchUrl(href,targetSet,field,shading){
 const url=new URL(href);
 url.searchParams.set('set',targetSet);
 url.searchParams.delete('run');
 url.searchParams.delete('fhr');
 const supported=fieldMenuEntries().some(entry=>entry.key===field)&&fieldAllowedForModelSet(field,targetSet);
 if(!supported){
  url.searchParams.delete('field');
  url.searchParams.delete('shade');
  url.searchParams.delete('snow');
  return url;
 }
 url.searchParams.set('field',field);
 const choices=UPPER_AIR_IMAGE_FIELDS[field];
 if(shading!==field&&choices?.some(([key])=>key===shading))url.searchParams.set('shade',shading);
 else url.searchParams.delete('shade');
 if(!gfsSnowSpec(field)?.method)url.searchParams.delete('snow');
 return url;
}


// Native converter classes: 0 none/unknown, 1 rain, 2 snow, 3 freezing rain,
// 4 ice pellets (sleet), 5 mixed. Use one label table for hover and legends.
const RADAR_REPORT_FIELDS=new Set(FIELD_GROUP_DEFS.find(g=>g.key==='radar').fields);
const PTYPE_LABELS=['None / Unknown','Rain','Snow','Freezing Rain','Sleet','Mixed'];
const FLIGHT_CATEGORY_NAMES=['VLIFR','LIFR','IFR','MVFR','VFR'];
const FLIGHT_CATEGORY_COLORS=['#7a32ac','#d94bdb','#e53935','#2776da','#2aa54f'];
function flightCategoryFromMilesFeet(miles,feet){
 if(!Number.isFinite(miles)&&!Number.isFinite(feet))return null;
 let category=4;
 if(Number.isFinite(miles)&&miles>=0)category=Math.min(category,miles<.5?0:miles<1?1:miles<3?2:miles<=5?3:4);
 if(Number.isFinite(feet)&&feet>=0)category=Math.min(category,feet<200?0:feet<500?1:feet<1000?2:feet<=3000?3:4);
 return category;
}
const PTYPE = ['#192939','#209641','#51baff','#e75889','#b266d8','#f0c764'];
// Public, preprocessed observation GeoJSON: no browser-side API tokens or proxy.
const PTYPE_OBS_EMPTY={type:'FeatureCollection',features:[]};
function obsValidDate(){return st.ref?new Date(Date.parse(st.ref.init_time)+st.hour*3600000):null;}
function observationHourKey(time){return time.toISOString().slice(0,13).replace(/[-T:]/g,'');}
function observationPath(time){
 const root=String(st.cfg?.ptypeObservations?.path||'data/ptype_observations/').replace(/\/?$/,'/');
 return root+observationHourKey(time)+'.json';
}
function aviationObservationField(){return st.field==='vis'?'visibility_mi':st.field==='ceil'?'ceiling_ft_agl':st.field==='flightcat'?'flightcat':null;}

// Quantitative reports use a separate on-screen canvas, not MapLibre symbol
// fonts. The source-free basemap has no glyph endpoint, so text layers would
// silently fail on restricted/mobile browsers. Canvas stroke/fill also permits
// precise two-tone casing and deterministic PNG capture.
const AMOUNT_REPORT_EMPTY={type:'FeatureCollection',features:[]};
const AMOUNT_REPORT_ROOT='data/precip_snow_reports/';
function amountReportKind(field=st.field){
 if(/^(?:apcp(?:1h|3h|6h|24h|48h)?|tsnowp|weasd|frozr|frzr)$/.test(field))return 'precip';
 if(/^(?:snow(?:1h|3h|6h|24h|48h)|asnow|(?:gfs|rrfs)_snow_.*)$/.test(field))return 'snowfall';
 if(field==='snod'||field==='snowc')return 'depth';
 return null;
}
function amountReportTargetHours(field=st.field){
 const m=String(field).match(/(?:apcp|snow|snow_.*?)(1|3|6|24|48)h$/);
 if(m)return Number(m[1]);
 if(field==='apcp'||field==='asnow'||/^(?:gfs|rrfs)_snow_/.test(field))return Math.max(0,st.hour);
 return null;
}
function amountReportsEnabled(){return !!amountReportKind()&&(st.amountReportEnabled.cocorahs||st.amountReportEnabled.metar);}
function amountReportPath(type,date){return AMOUNT_REPORT_ROOT+type+'/'+date+'.json';}
function amountReportYMD(when){return when.toISOString().slice(0,10).replace(/-/g,'');}
async function fetchAmountReportFile(type,key){
 const id=type+':'+key,prior=st.amountReportCache.get(id);
 const now=Date.now(),date=type==='hourly'?Date.parse(key.slice(0,4)+'-'+key.slice(4,6)+'-'+key.slice(6,8)+'T'+key.slice(8,10)+':00:00Z'):
    Date.parse(key.slice(0,4)+'-'+key.slice(4,6)+'-'+key.slice(6,8)+'T12:00:00Z');
 const ttl=(Number.isFinite(date)&&now-date<3*86400000)?(prior?.missing?60000:180000):3600000;
 if(prior&&now-prior.at<ttl)return prior;
 let result={features:[],missing:true,at:now};
 try{
  const response=await fetch(amountReportPath(type,key),{cache:'no-store'});
  if(response.ok){const obj=await response.json();
   if(obj?.type!=='FeatureCollection'||obj?.schema!=='omd-evu-precip-snow-reports-1'||!Array.isArray(obj.features))
    throw Error('Unexpected observation report schema');
   result={features:obj.features.filter(f=>f?.geometry?.type==='Point'&&Array.isArray(f.geometry.coordinates)&&
     f.geometry.coordinates.length>=2&&Number.isFinite(f.geometry.coordinates[0])&&Number.isFinite(f.geometry.coordinates[1])&&
     ['metar','cocorahs'].includes(f.properties?.source)),missing:false,at:now};
  }else if(response.status!==404)throw Error('HTTP '+response.status);
 }catch(e){console.warn('Quantitative reports:',type,key,String(e));}
 st.amountReportCache.delete(id);st.amountReportCache.set(id,result);
 while(st.amountReportCache.size>38)st.amountReportCache.delete(st.amountReportCache.keys().next().value);
 return result;
}
// Only valid-hour AND matching-accumulation records belong on the selected
// forecast frame. A CoCoRaHS local wall-clock observation is not a UTC time:
// without provider-supplied UTC end-time metadata, leave it out instead of
// assigning the same daily total to many different hours.
function amountReportSelection(features,when,field=st.field){
 const kind=amountReportKind(field);if(!kind||!when)return [];
 const valueName=kind==='precip'?'precip_in':kind==='snowfall'?'snowfall_in':'snow_depth_in';
 const target=amountReportTargetHours(field),best=new Map(),valid=when.getTime();
 for(const f of features){
  const props=f.properties||{},source=props.source;
  if(!st.amountReportEnabled[source])continue;
  const value=Number(props[valueName]);
  if(props[valueName]==null||!Number.isFinite(value)||value<0||value>250)continue;
  // SNINCR is snow-depth increase, not an independently measured new-snow
  // accumulation. Do not place it on snowfall accumulation panels.
  if(kind==='snowfall'&&props.snowfall_is_depth_increase)continue;
  const observedUTC=props.end_utc||(source==='metar'?(props.sample_utc||props.last_sample_utc):null);
  const stamp=Date.parse(observedUTC||'');
  if(!Number.isFinite(stamp)||Math.abs(valid-stamp)>30*60000)continue;
  const period=Number(props.period_hours);
  if(kind!=='depth'){
   if(!(Number.isFinite(target)&&target>0&&Number.isFinite(period)&&period===target))continue;
  }
  const point=f.geometry?.coordinates;
  if(!Array.isArray(point)||point.length<2||!Number.isFinite(point[0])||!Number.isFinite(point[1]))continue;
  const score=Math.abs(valid-stamp)/60000;
  const key=source+':'+String(props.station||'')+':'+kind;
  const current=best.get(key);
  const report={point,source,value,period:Number.isFinite(period)&&period>0?period:null,props,kind,score};
  if(!current||current.score>score)best.set(key,report);
 }
 return [...best.values()].sort((a,b)=>(a.value===0)-(b.value===0)||a.score-b.score);
}
function selectedAmountReports(){
 const key=[st.field,st.ref?.id,st.hour,st.amountReportVersion||0,
   st.amountReportEnabled.cocorahs?1:0,st.amountReportEnabled.metar?1:0].join('|');
 if(st.amountReportSelectionKey!==key){st.amountReportSelectionKey=key;
  st.amountReportSelected=amountReportSelection(st.amountReports||[],obsValidDate());}
 return st.amountReportSelected||[];
}
function amountReportLabel(report){
 const {value,kind,props}=report;
 const digits=kind==='precip'?2:kind==='snowfall'?1:0;
 const trace=props[(kind==='precip'?'precip_in':'snowfall_in')+'_trace'];
 // The source and accumulation period are in the popup, not repeated on map.
 return trace?'T':value.toFixed(digits);
}
function amountReportColor(report){
 const meta=report.kind==='precip'?FIELDS.apcp24h:FIELDS.snod;
 const p=report.kind==='depth'&&st.field==='snowc'?basePal(FIELDS.snod,{name:'snod'}):
  pal(meta,{name:report.kind==='precip'?'apcp24h':'snod'});
 const value=report.value;
 const levels=p.levels||[],colors=p.colors||[];
 if(!levels.length)return '#e8f1fc';
 if(value<levels[0])return '#e4edf8';
 let i=0;while(i<colors.length-1&&value>=levels[i+1])i++;
 const color=colors[i]||'#e4edf8';
 return /^#[0-9a-f]{6}$/i.test(color)?color:'#e4edf8';
}
function drawAmountReportCanvas(p,{capture=false}={}){
 const map=p?.map,canvas=p?.amountReportCanvas;if(!map||!canvas)return false;
 const kind=amountReportKind(),visible=kind&&amountReportsEnabled()&&!p.cfg?.differencePanel;
 canvas.style.display=visible?'block':'none';
 if(!visible||p.geoMoving&&!capture)return false;
 const rect=map.getCanvas(),width=rect?.clientWidth||0,height=rect?.clientHeight||0;
 if(width<20||height<20)return false;
 const dpr=Math.min(2,Math.max(1,devicePixelRatio||1)),pxW=Math.round(width*dpr),pxH=Math.round(height*dpr);
 if(canvas.width!==pxW||canvas.height!==pxH){canvas.width=pxW;canvas.height=pxH;}
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
 const pointSize=map.getZoom()<3?11:map.getZoom()<6?12:12.5;
 ctx.font=`800 ${pointSize}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
 const occupied=new Set(),cellW=78,cellH=29;
 const maxLabels=touchGraphicsDevice()?125:320;
 const accepted=[],all=selectedAmountReports();
 const bounds=map.getBounds?.();
 for(const r of all){
  if(accepted.length>=maxLabels)break;
  if(bounds&&!bounds.contains(r.point))continue;
  const pixel=map.project(r.point);const x=pixel.x,y=pixel.y;
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<5||y<8||x>width-5||y>height-9)continue;
  const label=amountReportLabel(r),w=ctx.measureText(label).width+12,h=pointSize+7;
  const cx=Math.floor(x/cellW),cy=Math.floor(y/cellH);
  let collide=false;
  for(let iy=cy-1;iy<=cy+1&&!collide;iy++)for(let ix=cx-1;ix<=cx+1;ix++)
   if(occupied.has(ix+','+iy)){collide=true;break;}
  if(collide)continue;
  occupied.add(cx+','+cy);
  // Dark, almost opaque backing and light text maintain contrast against
  // all precipitation palettes, map outlines and terrain. A narrow source-
  // neutral accent indicates the observation is quantitative.
  const left=x-w/2,top=y-h/2;
  ctx.fillStyle='rgba(5,16,29,.90)';ctx.fillRect(left,top,w,h);
  ctx.strokeStyle='rgba(226,237,251,.88)';ctx.lineWidth=.85;ctx.strokeRect(left+.5,top+.5,w-1,h-1);
  ctx.fillStyle='#ffffff';ctx.fillText(label,x,y);
  accepted.push({...r,x,y,label});
 }
 canvas.style.visibility='visible';p.amountReportHits=accepted;
 return true;
}
function amountReportPopupText(report){
 const r=report.props||{},desc=report.kind==='precip'?'Accumulated precipitation':report.kind==='depth'?'Snow on ground':
   r.snowfall_is_depth_increase?'One-hour increase in snow depth (not new snowfall)':'New snowfall';
 return `${report.source==='cocorahs'?'CoCoRaHS':'METAR'} ${r.station||''}${r.provider?' (via '+r.provider+')':''}\n${desc}: ${report.value.toFixed(report.kind==='precip'?2:1)} in\n`+
  `Period: ${report.period||'instantaneous'}${report.period?' hours':''}\n`+
  `Report: ${r.report_date||r.sample_utc||r.end_utc||'time not specified'} ${r.report_local_time||''}\n`+
  (r.report_type||'')+((r.time_basis==='single-zone-state')?'\nUTC converted from station-state timezone':'');
}
function attachAmountReportClicks(p){
 if(p.amountReportClickBound||!p.map)return;p.amountReportClickBound=true;
 p.map.on('click',e=>{
  if(!amountReportsEnabled()||!p.amountReportHits?.length)return;
  let nearest=null,d=18*18;
  for(const r of p.amountReportHits){const distance=(r.x-e.point.x)**2+(r.y-e.point.y)**2;
   if(distance<d){nearest=r;d=distance;}}
  if(nearest){
   p.amountReportPopup?.remove();
   const popup=new maplibregl.Popup({closeButton:true,closeOnClick:false,closeOnMove:false,
     maxWidth:'270px',className:'evu-report-popup'})
     .setLngLat(nearest.point).setText(amountReportPopupText(nearest)).addTo(p.map);
   p.amountReportPopup=popup;
   // MapLibre's popup is otherwise below the independent amount-report
   // canvas. Portal it to the same frame (like low-track popups) to put the
   // report details above labels, while MapLibre maintains positioning.
   const node=popup.getElement?.();
   if(node&&p.frame)p.frame.appendChild(node);
  }
 });
}
function syncAmountReportsPanel(p){
 if(!p?.map)return;
 attachAmountReportClicks(p);
 drawAmountReportCanvas(p);
}
function syncAllAmountReports(){
 for(const p of st.active||[])syncAmountReportsPanel(p);
 if(el.amountReportsCount){
  const shown=selectedAmountReports().length;
  el.amountReportsCount.hidden=!amountReportKind()||!amountReportsEnabled();
  el.amountReportsCount.textContent=shown?`${shown.toLocaleString()} reports available (labels thin at current zoom)`:
   st.amountReportStatus||(st.amountReports?.some(f=>f?.properties?.source==='cocorahs'&&!f.properties?.end_utc)?
    'No exact-hour match (some CoCoRaHS reports lack resolved UTC times)':'No valid-hour / accumulation-period matches');
 }
}
async function refreshAmountReports(){
 const token=++st.amountReportToken;
 if(!amountReportsEnabled()||!st.ref){st.amountReports=[];st.amountReportVersion=(st.amountReportVersion||0)+1;st.amountReportStatus='';syncAllAmountReports();return;}
 const valid=obsValidDate();if(!valid||valid.getTime()>Date.now()+10*60000){
  st.amountReports=[];st.amountReportVersion=(st.amountReportVersion||0)+1;st.amountReportStatus='Observed amounts not yet available';syncAllAmountReports();return;}
 const dailyDates=[amountReportYMD(valid),amountReportYMD(new Date(valid.getTime()-86400000))];
 const hourDates=[observationHourKey(valid),observationHourKey(new Date(valid.getTime()-3600000))];
 const requests=[];
 if(st.amountReportEnabled.cocorahs)for(const day of dailyDates)requests.push(fetchAmountReportFile('daily',day));
 if(st.amountReportEnabled.metar)for(const hour of hourDates)requests.push(fetchAmountReportFile('hourly',hour));
 const result=await Promise.all(requests);
 if(token!==st.amountReportToken||obsValidDate()?.getTime()!==valid.getTime())return;
 st.amountReports=result.flatMap(x=>x.features);st.amountReportVersion=(st.amountReportVersion||0)+1;
 st.amountReportStatus=result.every(x=>x.missing)?'Observation amount files not yet published':
  st.amountReports.length?'':'No reports in published observation files';
 syncAllAmountReports();
}
function observationVisible(){return (RADAR_REPORT_FIELDS.has(st.field)||!!aviationObservationField())&&!!st.cfg?.ptypeObservations?.enabled;}
function observationSetCount(){
 if(!el.obsCount)return;
 // The counter describes selected observation layers, not all reports in
 // the published hour. Hide it altogether when neither source is enabled.
 const sourceSelected=st.obsEnabled.synoptic||(!aviationObservationField()&&st.obsEnabled.mping);
 el.obsCount.hidden=!observationVisible()||!sourceSelected;
 if(el.obsCount.hidden){el.obsCount.textContent='';return;}
 const data=st.obsCurrent;
 if(!data){el.obsCount.textContent='Loading…';return;}
 if(data.future){el.obsCount.textContent='Valid time in future';return;}
 if(data.missing){el.obsCount.textContent='No published reports';return;}
 const counts={synoptic:0,mping:0};
 for(const f of data.features||[]){const src=f?.properties?.source;if(counts[src]!==undefined&&st.obsEnabled[src]&&(!aviationObservationField()||(src==='synoptic'&&Number.isFinite(f?.properties?.[aviationObservationField()]))))counts[src]++;}
 el.obsCount.textContent=`${counts.synoptic+counts.mping} reports`;
}

function finiteObservationNumber(value){
 if(value===null||value===undefined||value==='')return null;
 const num=Number(value);return Number.isFinite(num)&&num>=0?num:null;
}
function normalizedMetarProperties(input){
 const p={...input};
 if(p.source!=='synoptic')return p;
 const mi=finiteObservationNumber(p.visibility_mi??p.visibility_miles??p.visibility_sm??p.visibility);
 const meters=finiteObservationNumber(p.visibility_m??p.visibility_meters);
 if(mi!==null||meters!==null)p.visibility_mi=mi!==null?mi:meters/1609.344;
 const ft=finiteObservationNumber(p.ceiling_ft_agl??p.ceiling_ft);
 const m=finiteObservationNumber(p.ceiling_m_agl??p.ceiling_m??p.ceiling);
 if(ft!==null||m!==null)p.ceiling_ft_agl=ft!==null?ft:m*3.28084;
 const flightcat=flightCategoryFromMilesFeet(p.visibility_mi??NaN,p.ceiling_ft_agl??NaN);
 if(flightcat!==null)p.flightcat=flightcat;
 return p;
}
function observationFieldPalette(field){
 const m=FIELDS[field],p=pal(m,{name:field});return p?.levels?.length&&p.colors?.length? p:null;
}
function aviationObservationColor(value,field){
 if(!Number.isFinite(value))return null;
 const p=observationFieldPalette(field);if(!p)return null;
 let i=0;while(i<p.colors.length-1&&value>=p.levels[i+1])i++;
 return p.colors[i];
}
function observationCircleColorExpression(){
 const key=aviationObservationField();
 if(!key)return ['match',['get','ptype'],...PTYPE.slice(1).flatMap((c,i)=>[i+1,c]),'#999999'];
 const p=observationFieldPalette(st.field);
 if(!p)return '#999999';
 const stops=[];
 for(let i=1;i<p.colors.length;i++)stops.push(p.levels[i],p.colors[i]);
 return ['step',['get',key],p.colors[0],...stops];
}
function observationCircleFilter(){
 const key=aviationObservationField();
 return key?['all',['==',['get','source'],'synoptic'],['has',key]]:['==',['get','source'],'synoptic'];
}
function observationPopupText(prop){
 const type=Number(prop.ptype),label=Number.isInteger(type)&&type>=1&&type<=5?PTYPE_LABELS[type]:null;
 const src=prop.source==='mping'?'mPING':'METAR (Synoptic Data)';
 const time=prop.observed_time?fmt(prop.observed_time):'Unknown UTC time';
 const lines=[label?`${label} · ${src}`:src,`${prop.station||''} · ${time}`];
 if(prop.source==='synoptic'){
  const vis=finiteObservationNumber(prop.visibility_mi),ceil=finiteObservationNumber(prop.ceiling_ft_agl);
  if(vis!==null)lines.push(`Visibility: ${vis.toFixed(vis<1?2:1)} mi`);
  if(ceil!==null)lines.push(`Ceiling: ${Math.round(ceil)} ft AGL`);
  const category=Number(prop.flightcat);
  if(Number.isInteger(category)&&category>=0&&category<=4&&prop.flightcat!=null)
   lines.push(`Flight category: ${FLIGHT_CATEGORY_NAMES[category]}`);
 }
 return lines.join('\n');
}
function filteredObservationGeoJSON(){
 if(!observationVisible()||!st.obsCurrent?.features)return PTYPE_OBS_EMPTY;
 return {type:'FeatureCollection',features:st.obsCurrent.features.filter(f=>st.obsEnabled[f?.properties?.source]===true&&(!aviationObservationField()?(f.properties.ptype>=1&&f.properties.ptype<=5):(f.properties.source==='synoptic'&&Number.isFinite(f.properties[aviationObservationField()]))) )};
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
   const colors=observationCircleColorExpression();
   m.addLayer({id:'evu-observed-metar',type:'circle',source:'evu-observed-ptype',
    filter:observationCircleFilter(),
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
    const popup=observationPopupText(prop);
    // Text-only popup escapes untrusted station and description fields.
    new maplibregl.Popup({closeButton:true,maxWidth:'240px',className:'evu-report-popup'})
      .setLngLat(ev.lngLat).setText(popup).addTo(m);
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
   if(m.getLayer('evu-observed-metar')){
    m.setFilter('evu-observed-metar',observationCircleFilter());
    m.setPaintProperty('evu-observed-metar','circle-color',observationCircleColorExpression());
   }
   for(const id of ['evu-observed-metar','evu-observed-mping']){
    if(m.getLayer(id)){m.setLayoutProperty(id,'visibility',observationVisible()&&(id!=='evu-observed-mping'||!aviationObservationField())?'visible':'none');if(observationVisible())m.moveLayer?.(id);}
   }
  }
 }catch(err){console.warn('Observation overlay update:',err);}
}
function syncAllObservationPanels(){for(const p of st.active)syncObservationPanel(p);observationSetCount();}
// Keep each observation overlay's small time-keyed cache bounded, including
// missing-hour records. Refresh existing keys without evicting recent hours.
// This applies the same eviction behavior to METAR/mPING, SPC LSR and GLM.
function rememberCappedObservation(cache,key,entry,limit){
 cache.delete(key);
 cache.set(key,entry);
 while(cache.size>limit)cache.delete(cache.keys().next().value);
}
async function fetchObservationHour(when){
 const key=observationHourKey(when), prior=st.obsCache.get(key);
 const ageMs=Date.now()-when.getTime();
 // Recheck recent published hours (including an incomplete rolling hour)
 // frequently. Older snapshots remain memoized to reduce network requests.
 const ttl=prior?.value?.missing?30000:ageMs<2*3600000?45000:600000;
 if(prior&&Date.now()-prior.at<ttl)return prior.value;
 const future=when.getTime()>Date.now()+60000;
 if(future)return {future:true,features:[]};
 const url=observationPath(when);
 try{const response=await fetch(url,{cache:'no-store'});
  if(response.status===404){const value={missing:true,features:[]};rememberCappedObservation(st.obsCache,key,{value,at:Date.now()},36);return value;}
  if(!response.ok)throw Error('HTTP '+response.status);
  const obj=await response.json();
  if(obj.schema!=='omd-evu-ptype-observations-1'||obj.type!=='FeatureCollection'||Date.parse(obj.valid_time)!==when.getTime())throw Error('Observation payload mismatch');
  const value={features:(obj.features||[]).filter(f=>f?.geometry?.type==='Point'&&['synoptic','mping'].includes(f?.properties?.source)&&
    ((Number.isInteger(f.properties.ptype)&&f.properties.ptype>=1&&f.properties.ptype<=5)||f.properties.source==='synoptic'))
    .map(f=>({...f,properties:normalizedMetarProperties(f.properties)}))};
  rememberCappedObservation(st.obsCache,key,{value,at:Date.now()},36);
  return value;
 }catch(e){console.warn('Observation data missing or invalid:',String(e));return{missing:true,features:[]};}
}
async function refreshObservationOverlay({preserve=false}={}){
 const token=++st.obsLoadToken;
 if(!observationVisible()||!st.ref){st.obsCurrent=null;syncAllObservationPanels();return;}
 const when=obsValidDate();
 // Periodic updates must not erase live station markers while re-fetching.
 if(!preserve){st.obsCurrent=null;syncAllObservationPanels();}
 const data=await fetchObservationHour(when);
 if(token!==st.obsLoadToken||obsValidDate()?.getTime()!==when.getTime())return;
 st.obsCurrent=data;syncAllObservationPanels();
}

// Preliminary SPC reports in 12Z–12Z files; no remote API calls in the browser.
const SPC_EMPTY={type:'FeatureCollection',features:[]};
const SPC_COLORS={tornado:'#e63737',wind:'#2e80dc',hail:'#35b86b'};
const SPC_FIELDS=new Set(['refc','refc_ptype','shear01','shear06','srh01','srh03','sbcape','mlcape','mucape','mxuphl','mxuphl_run']);
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
 rememberCappedObservation(st.spcCache,day,{features,at:Date.now()},24);
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

// Optional GOES GLM Level-2 FLASH centroids, not ground-strike locations.
// Color bins are age relative to the current forecast valid hour, NEVER now.
const LIGHTNING_EMPTY={type:'FeatureCollection',features:[]};
const LIGHTNING_COLORS=['#ed468b','#f59e0b','#36b6cd','#7d84dc']; // 0–15, 15–30, 30–45, 45–60 minutes
const LIGHTNING_FIELDS=new Set(FIELD_GROUP_DEFS.filter(group=>['radar','shear','convective'].includes(group.key)).flatMap(group=>group.fields));
function lightningVisible(){return st.lightningEnabled&&LIGHTNING_FIELDS.has(st.field)&&st.cfg?.lightning?.enabled!==false;}
function lightningColor(age){return LIGHTNING_COLORS[Math.min(3,Math.max(0,Math.floor(age/15)))];}
function lightningPath(when){
 const root=String(st.cfg?.lightning?.path||'data/lightning/').replace(/\/?$/,'/');
 return root+observationHourKey(when)+'.json';
}
function lightningFeatureData(){
 if(!lightningVisible()||!st.lightningCurrent?.features)return LIGHTNING_EMPTY;
 return {type:'FeatureCollection',features:st.lightningCurrent.features};
}
// Compact diamonds (~the original circles' size) for both live map and PNG/GIF.
// A large transparent sprite retains a generous touch target on mobile.
function drawLightningDiamond(ctx,x,y,diameter,fill,outline){
 const r=Math.max(2,diameter/2);
 ctx.save();ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);
 ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();
 ctx.globalAlpha=.96;ctx.fillStyle=fill;ctx.fill();
 ctx.globalAlpha=1;ctx.lineJoin='round';ctx.lineWidth=Math.max(1.15,diameter*.085);
 ctx.strokeStyle=outline;ctx.stroke();ctx.restore();
}
function glmDiamondImage(ageGroup,theme){
 const size=72,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
 const ctx=canvas.getContext('2d');
 drawLightningDiamond(ctx,size/2,size/2,20,LIGHTNING_COLORS[ageGroup],theme==='light'?'#152633':'#ffffff');
 return ctx.getImageData(0,0,size,size);
}
function refreshGLMDiamondTheme(m){
 for(let age=0;age<4;age++){
  const name=`evu-glm-diamond-${age}`,img=glmDiamondImage(age,st.theme);
  try{if(m.hasImage(name))m.updateImage(name,img);else m.addImage(name,img,{pixelRatio:2});}
  catch(err){console.warn('GLM diamond marker unavailable:',String(err));}
 }
}
function ensureLightningOverlay(p){
 if(!p.map)return;
 const m=p.map;
 try{
  if(!m.getSource('evu-lightning'))m.addSource('evu-lightning',{type:'geojson',data:LIGHTNING_EMPTY});
  if(!m.getLayer('evu-lightning')){
   refreshGLMDiamondTheme(m);
   m.addLayer({id:'evu-lightning',type:'symbol',source:'evu-lightning',
    layout:{'icon-image':['step',['get','age_minutes'],'evu-glm-diamond-0',15,'evu-glm-diamond-1',30,'evu-glm-diamond-2',45,'evu-glm-diamond-3'],
     'icon-size':['interpolate',['linear'],['zoom'],2,.94,6,1.10,10,1.28],
     'icon-allow-overlap':true,'icon-ignore-placement':true}});
  }
  if(!p.lightningClickInstalled){p.lightningClickInstalled=true;
   m.on('click','evu-lightning',ev=>{
    if(!lightningVisible()||!ev.features?.length)return;
    const a=ev.features[0].properties||{};
    new maplibregl.Popup({maxWidth:'245px',className:'evu-report-popup'})
     .setLngLat(ev.lngLat).setText(`GLM lightning flash\n${a.time||''}\n${Math.round(Number(a.age_minutes)||0)} min before valid hour · ${a.satellite||''}`)
     .addTo(m);
   });
   m.on('mouseenter','evu-lightning',()=>{if(m.getCanvas())m.getCanvas().style.cursor='pointer';});
   m.on('mouseleave','evu-lightning',()=>{if(m.getCanvas())m.getCanvas().style.cursor='';});
  }
 }catch(err){console.warn('Lightning layer unavailable:',String(err));}
}
function syncLightningPanel(p){
 if(!p?.map)return;
 ensureLightningOverlay(p);
 const m=p.map;
 try{
  const src=m.getSource('evu-lightning');if(!src||!m.getLayer('evu-lightning'))return;
  const visible=lightningVisible();
  src.setData(lightningFeatureData());
  m.setLayoutProperty('evu-lightning','visibility',visible?'visible':'none');
  if(visible)m.moveLayer?.('evu-lightning');
  m.triggerRepaint?.();
 }catch(err){console.warn('Lightning overlay update failed:',String(err));}
}
function syncLightningPanels(){
 if(el.lightningCount)el.lightningCount.textContent=lightningVisible()?
  (st.lightningCurrent?.future?'Future valid hour':st.lightningCurrent?.missing?'GLM data unavailable':
   st.lightningCurrent===null?'Loading GLM lightning…':`${st.lightningCurrent.features.length} GLM flashes · past 60 min`):'';
 for(const p of st.active)syncLightningPanel(p);
}
async function fetchLightningHour(when){
 const key=observationHourKey(when),prior=st.lightningCache.get(key);
 if(prior&&Date.now()-prior.at<(prior.value?.missing?90000:600000))return prior.value;
 if(when.getTime()>Date.now())return {future:true,features:[]};
 let value={missing:true,features:[]};
 try{
  const response=await fetch(lightningPath(when),{cache:'no-store'});
  if(response.ok){
   const obj=await response.json();
   if(obj.schema!=='omd-evu-glm-flashes-1'||obj.type!=='FeatureCollection'||Date.parse(obj.valid_time)!==when.getTime())throw Error('GLM hour mismatch');
   const end=when.getTime(),start=end-3600000;
   const features=(obj.features||[]).filter(f=>{
    const c=f?.geometry?.coordinates,t=Date.parse(f?.properties?.time);
    return f?.geometry?.type==='Point'&&Array.isArray(c)&&c.length>=2&&
     Number.isFinite(c[0])&&Number.isFinite(c[1])&&t>start&&t<=end;
   }).map(f=>({...f,properties:{...f.properties,age_minutes:(end-Date.parse(f.properties.time))/60000}}));
   value={features};
  }else if(response.status!==404)throw Error('HTTP '+response.status);
 }catch(err){console.warn('GLM data unavailable:',String(err));}
 rememberCappedObservation(st.lightningCache,key,{at:Date.now(),value},36);
 return value;
}
async function refreshLightningReports(){
 const token=++st.lightningLoadToken;
 if(!lightningVisible()||!st.ref){st.lightningCurrent=null;syncLightningPanels();return;}
 const when=obsValidDate();st.lightningCurrent=null;syncLightningPanels();
 const data=await fetchLightningHour(when);
 if(token!==st.lightningLoadToken)return;
 st.lightningCurrent=data;syncLightningPanels();
}

/* OMD EVU autumnplot-gl + MapLibre GL viewer. Zarr-v2 decoding stays browser-native. */
'use strict';
const $=id=>document.getElementById(id);
const el=Object.fromEntries(['viewerRefreshBtn','userGuideBtn','userGuideDialog','userGuideClose','userGuideDone','imageOpacity','imageOpacityLabel','interpolateToggleBtn','spcControl','spcToggleBtn','spcCount','lightningControl','lightningToggleBtn','lightningLegend','lightningCount','lowTracksOption','lowTracksToggleBtn','lowTracksStatus','surfaceMSLPOption','surfaceMSLPToggleBtn','surfaceWeatherOption','surfaceWeatherToggleBtn','surfaceWeatherCentersBtn','surfaceWeatherPressureBtn','surfaceWeatherFrontsBtn','surfaceWeatherTroughsBtn','surfaceWeatherDrylinesBtn','surfaceWeatherStatus','surfaceWeatherRetryBtn','obsControl','obsSynoptic','obsMping','obsCount','obsAttribution','amountReportsControl','amountReportsCocorahs','amountReportsMetar','amountReportsCount','contourOption','windSpeedOption','windSpeedToggleBtn','dewpointOption','dewpointToggleBtn','spfhOption','spfhToggleBtn','mslp850Option','mslp850ToggleBtn','exportKindFieldset','exportGifChoice','exportVideoChoice','exportVideoNotice','exportLabelFieldset','exportRatioFieldset','exportFramingFieldset','exportGifOptions','exportGifStart','exportGifStartLabel','exportGifEnd','exportGifEndLabel','exportGifStep','exportGifDelay','exportGifQuality','exportLargeLabels','exportNoLabels','exportScroll','exportGifDelayLabel','exportGifSummary','modelSetSelect','snowMethodControl','snowMethodWeasd','snowMethodPrecip','snowRatioControl','snowRatioSlider','snowRatioValue','differenceDialog','differenceDialogPair','differenceOpenBtn','differenceCancelBtn','differenceWindow','differenceMap','differenceMessage','differenceDragHandle','differenceWindowTitle','differenceWindowSubtitle','differenceCloseBtn','differenceSaveBtn','differenceSample','differenceLegendUnit','overlayStyleDialog','overlayStyleHeading','overlayStyleColor','overlayStyleLineStyleRow','overlayStyleLineStyle','overlayStyleAutoContrast','overlayStyleAutoContrastRow','overlayStyleWidth','overlayStyleWidthValue','overlayStyleDensity','overlayStyleDensityValue','overlayStyleDensityRow','overlayStyleTracerSpeed','overlayStyleTracerSpeedValue','overlayStyleTracerSpeedRow','overlayStyleClose','overlayStyleReset','overlayStyleDone','mapLayersMenuBtn','mapLayersMenuPopup','mapOutlinesToggleBtn','countiesToggleBtn','citiesToggleBtn','roadsToggleBtn','overlayStyleCityNamesRow','overlayStyleCityNames','overlayStyleCityFontRow','overlayStyleCityFont','overlayStyleCityFontValue','overlayStyleCitiesValuesRow','overlayStyleCitiesValues','citiesOption','overlayStyleOpacity','overlayStyleOpacityValue','overlayStyleOpacityRow','overlayStyleExaggeration','overlayStyleExaggerationValue','overlayStyleExaggerationRow','overlayStyleSunAngle','overlayStyleSunAngleValue','overlayStyleSunAngleRow','overlayStyleReliefStrength','overlayStyleReliefStrengthValue','overlayStyleReliefStrengthRow','geographyNotice','mapBackgroundToggleBtn','terrainToggleBtn','terrainPanelsEditBtn','terrainPanelPopup','terrainPanelChoices','terrainPanelsAllBtn','terrainPanelsNoneBtn','terrainPanelsCancelBtn','terrainPanelsDoneBtn','terrainNotice','tracersToggleBtn','tracersOption','shortcutsBtn','shortcutsDialog','shortcutsClose','shortcutsDone','terrainCredit','terrainState','terrainProviderLink','contourControl','contourToggleBtn','heightOption','heightToggleBtn','marineWindOption','marineWindToggleBtn','windOption','windToggleBtn','fieldMenuBtn','fieldMenuPopup','fieldMenuCategories','fieldMenuBranch','fieldMenuBack','fieldMenuBranchTitle','fieldMenuItems','fieldMenuSelected','shareLinkStatus','releaseUpdateNotice','releaseUpdateText','releaseUpdateBtn','releaseUpdateDismiss','cycleSelect','fcstSelect','stepBackBtn','stepForwardBtn','playBtn','pauseBtn','mobileStepBackBtn','mobilePlayPauseBtn','mobileStepForwardBtn','mobileFrameLabel','mobileFrameValidLabel','speedDownBtn','speedUpBtn','speedValue','exportDialog','exportForm','exportCloseBtn','exportCancelBtn','exportConfirmBtn','exportBusyStatus','exportDialogTitle','exportDialogHelp','exportSize169','exportSize43','resetViewBtn','copyLinkBtn','saveAllPngBtn','mapViewSelect','themeToggleBtn','controlsPositionBtn','mobileControlsBtn','viewerGrid','dataStatus','sharedLegend','sharedLegendTitle','sharedLegendCanvas','sharedLegendLabels','rotationSharedLegend','rotationSharedLegendTitle','rotationSharedLegendCanvas','rotationSharedLegendLabels','differenceSharedLegend','differenceSharedLegendTitle','differenceSharedLegendCanvas','differenceSharedLegendLabels','legendResetBtn','legendRangePopup','legendRangeForm','legendRangeMessage','legendRangeError','legendMinSlider','legendMaxSlider','legendMinNumber','legendMaxNumber','legendRangeApplyBtn','legendRangeResetBtn','legendCancelBtn','legendPalFile','legendPalName','legendPalRemoveBtn','legendPalStatus'].map(x=>[x,$(x)]));
const st={surfaceWeatherEnabled:false,surfaceWeatherSettings:{centers:true,pressure:true,fronts:true,troughs:true,drylines:true},shadedFields:new Map(),overlayWindSpeed850:false,snowMethod:'weasd',mapOutlines:true,countiesEnabled:false,citiesEnabled:false,roadsEnabled:false,roadsCatalog:null,roadsLoadPromise:null,citiesCatalog:null,citiesLoadPromise:null,mapBackground:true,terrainEnabled:false,terrainPanelIds:new Set(),terrainPanelDraft:null,tracersEnabled:false,overlayStyles:{dark:{},light:{}},mapOutlineFieldStyles:{dark:{},light:{}},lightningEnabled:false,lightningCache:new Map(),lightningCurrent:null,lightningLoadToken:0,spcEnabled:false,spcCache:new Map(),spcCurrent:[],spcLoadToken:0,imageOpacity:1,interpolate:false,lowTracksEnabled:false,overlayMSLP:true,overlayMSLP850:true,overlayDewpoint:true,overlaySpfh:false,cacheStats:{network:0,disk:0,decoded:0,displayReady:0,shared:0,decodedEvicted:0,displayEvicted:0},contours:false,overlayHeight:true,overlayUpperWind:true,overlaySurfaceWind:true,overlayNearSurfaceWind:false,overlaySevereWind:true,overlayMarineWind:true,overlayWaveDirection:false,difference:{selected:[],open:false,map:null,layer:null,component:null,grid:null,token:0,timer:null,resizeObserver:null,geo:null,fieldKey:null,snapshot:null,saveBusy:false,mouseSampling:false,liveCanvas:null,liveToken:0,liveTimer:null,outlineCache:null,warmKey:null,warmSerial:0},mrmsAccumCache:null,rotationTrackAccumCache:null,alignedAccumCache:null,alignedSource:null,geoCache:new Map(),geoInflight:new Map(),geoRetryTimers:new Map(),geoFailed:new Map(),cfg:null,sources:new Map(),primary:null,cycles:[],runPinned:false,ref:null,field:null,lastFieldByGroup:new Map(),hour:0,panels:[],theme:'dark',mode:'lambert',seq:0,active:[],columnCount:1,mapView:null,mapViews:{lambert:null,globe:null},rendering:false,playing:false,syncing:false,observer:null,cache:new Map(),cacheBytes:0,displayCache:new Map(),displayCacheBytes:0,displayInflight:new Map(),inflight:new Map(),queue:[],running:0,clock:0,loopSpeedIndex:2,prefetchTimer:null,prefetchGeneration:0,prefetchActive:0,prefetchAttempted:new Map(),prefetchContext:null,prefetchBatchRunning:false,prefetchBatchToken:null,prefetchFocus:null,prefetchSeenForFocus:new Set(),prefetchCompleted:0,prefetchFailed:0,prefetchBySource:new Map(),prefetchDirection:1,lastUserActivity:Date.now(),chunkStore:null,compressedInflight:new Map(),queuedFetches:new Map(),exportSelection:null,exporting:false,lastExportRatio:"16:9",lastExportFraming:"fill",exportNoLabels:false,hover:null,hoverRaf:0,exportRender:false,expandedPanel:null,mapInitQueue:Promise.resolve(),mobilePressureCap:null,contextLossCount:0,obsCache:new Map(),obsCurrent:null,obsLoadToken:0,obsEnabled:{synoptic:true,mping:true},amountReportEnabled:{cocorahs:true,metar:true},amountReportCache:new Map(),amountReportToken:0,amountReports:[],amountReportStatus:'',colorRanges:new Map(),customPalettes:new Map(),legendSelection:null,legendEditorMeta:null};
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
// Convert the panel camera to the floating difference map's viewport size.
// A MapLibre zoom is pixels per geographical distance: copying the numeric
// zoom into a different-sized window does not copy the geographic footprint.
function differenceReferencePanel(){
 return st.difference.selected.find(p=>p?.map)||st.active.find(p=>p?.map)||null;
}
// A numeric zoom alone cannot make both map edges match when the popup has
// a different aspect ratio. On first open, scale the window's MAP area to
// the same aspect ratio as the source panel (within its existing size limits).
// The user can resize it freely after opening; no aspect lock is imposed.
function differenceInitialMapFootprint(sourceW,sourceH,availableW,availableH){
 if(![sourceW,sourceH,availableW,availableH].every(v=>Number.isFinite(v)&&v>0))return null;
 const factor=Math.min(availableW/sourceW,availableH/sourceH);
 return {width:sourceW*factor,height:sourceH*factor};
}
function matchInitialDifferenceWindow(){
 const panel=differenceReferencePanel();
 const panelEl=panel?.map?.getContainer?.()||panel?.view;
 const sourceW=panelEl?.clientWidth||0,sourceH=panelEl?.clientHeight||0;
 const win=el.differenceWindow,map=el.differenceMap;
 const fitted=differenceInitialMapFootprint(sourceW,sourceH,map.clientWidth,map.clientHeight);
 if(!fitted)return false;
 // Preserve the header, legend, borders and any additional chrome. Only the
 // geographic map's aspect ratio is adjusted, not its styling or content.
 const frameW=Math.max(0,win.offsetWidth-map.clientWidth);
 const frameH=Math.max(0,win.offsetHeight-map.clientHeight);
 const width=fitted.width+frameW,height=fitted.height+frameH;
 // Min CSS window sizes on narrow mobile devices may prevent an exact match.
 // In that case retain responsive sizing and use the zoom fit as a fallback.
 const computed=typeof getComputedStyle==='function'?getComputedStyle(win):null;
 const minW=Number.parseFloat(computed?.minWidth)||0;
 const minH=Number.parseFloat(computed?.minHeight)||0;
 if(width+0.5<minW||height+0.5<minH)return false;
 win.style.width=width.toFixed(2)+'px';
 win.style.height=height.toFixed(2)+'px';
 return true;
}
function differenceViewportZoomAdjustment(target,reference=differenceReferencePanel()){
 const targetEl=target?.getContainer?.()||target;
 const sourceEl=reference?.map?.getContainer?.()||reference?.view;
 const dw=targetEl?.clientWidth||0,dh=targetEl?.clientHeight||0;
 const sw=sourceEl?.clientWidth||0,sh=sourceEl?.clientHeight||0;
 if(!(dw>0&&dh>0&&sw>0&&sh>0))return 0;
 // Fit the entire reference footprint. When aspect ratios differ, the
 // floating map includes modest additional geography along one dimension.
 return Math.max(-4,Math.min(4,Math.log2(Math.min(dw/sw,dh/sh))));
}
function differenceCameraForViewport(camera,target){
 if(!camera)return camera;
 const maxZoom=Number(st.cfg?.display?.maxZoom)||12;
 return {...camera,zoom:Math.max(0,Math.min(maxZoom,camera.zoom+differenceViewportZoomAdjustment(target)))};
}
// Expanding a panel increases its pixel dimensions but must not silently
// increase its geographic footprint. Match the smaller axis, allowing only
// the additional area required by a different viewport aspect ratio. The
// adjustment depends on viewport geometry, never the model or its grid.
function expandedViewportZoomAdjustment(normal,expanded){
 const sw=Number(normal?.width),sh=Number(normal?.height);
 const dw=Number(expanded?.width),dh=Number(expanded?.height);
 if(![sw,sh,dw,dh].every(v=>Number.isFinite(v)&&v>0))return 0;
 return Math.max(-4,Math.min(4,Math.log2(Math.min(dw/sw,dh/sh))));
}
function panelViewportSize(p){
 const canvas=p?.map?.getCanvas?.();
 return {width:Number(canvas?.clientWidth||p?.view?.clientWidth||0),
  height:Number(canvas?.clientHeight||p?.view?.clientHeight||0)};
}
function normalCameraFromFocused(map,camera){
 const focused=st.expandedPanel;
 if(focused?.map!==map||!camera)return camera;
 const maxZoom=Number(st.cfg?.display?.maxZoom)||12;
 return {...camera,zoom:Math.max(0,Math.min(maxZoom,camera.zoom-Number(focused._expandedZoomDelta||0)))};
}
function currentSharedCamera(){
 const master=st.expandedPanel?.map||st.hover?.master?.map;
 const map=master||st.active.find(p=>p.map)?.map;
 if(map){
  const c=map.getCenter();
  const obj={center:[Number(c.lng),Number(c.lat)],zoom:Number(map.getZoom()),
   bearing:Number(map.getBearing()),pitch:Number(map.getPitch())};
  if([obj.center[0],obj.center[1],obj.zoom,obj.bearing,obj.pitch].every(Number.isFinite))return normalCameraFromFocused(map,obj);
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
 // Respect the catalog variable for independently loaded contour overlays.
 // Previously, loading h700 while the 700-hPa temperature menu was selected
 // inherited temperature metadata, causing incorrect units and conversions.
 const isVirtualAlias=!!gfsSnowSpec(requested)||
  (precipitationAccumulationHours(requested)&&v.name==='apcp')||
  (snowAccumulationHours(requested)&&v.name==='asnow')||
  (requested==='snow48h'&&v.name==='snow24h');
 const sourceKey=requested==='refc_ptype'?'refc_ptype':isVirtualAlias?requested:v.name;
 const meta=FIELDS[sourceKey]||{label:v.attrs?.long_name||v.name,unit:v.attrs?.units||'',min:0,max:100,copyColors:'rh2m'};
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
 const label=matchedReflectivity?(requested==='refc_ptype'?'PMM composite reflectivity with Precipitation type':'PMM composite reflectivity')
  :matchedPrecip&&intervalHours?`PMM ${intervalHours}-hour precipitation`
  :legacyMeanPrecip&&intervalHours?`${intervalHours}-hour precipitation · legacy ensemble mean`
  :matchedPrecip?'PMM accumulated precipitation'
  :legacyMeanPrecip?'Accumulated precipitation · legacy ensemble mean'
  :v.name==='ptype'&&isHRRR?'Derived precipitation type'
  :dominantMean?'Ensemble dominant precipitation type'
  :v.name==='ptype'?'Dominant precipitation type'
  :v.name==='rh2m'&&isRefsMean&&v.attrs?.derivation_note?'2-m RH · derived from mean T/Td where needed'
  :meanFraction?meta.label+' · weighted mean'
  :gfsSnowSpec(requested)?.method==='slr10'?
   (gfsSnowSpec(requested).period?gfsSnowSpec(requested).period+'h ':'')+'snowfall ('+activeSnowRatio(requested)+':1) · '+gfsSnowMethodLabel(requested):meta.label;
 return {...meta,colors,fraction:meta.fraction||!!meta.copyColors&&!!FIELDS[meta.copyColors].fraction,
  ensembleMeanFraction:meanFraction,label,unit:meanFraction?'fraction':meta.unit};
}
// Fixed display-unit deadbands; independent of forecast lead and model run.
// The original signed data are never changed; only pixels near zero are masked.
const DIFFERENCE_NEUTRAL_BY_FIELD={
 wave_height_sig:1.64042,wave_height_wind:1.312336,wave_height_swell1:1.312336,
 wave_period_primary:1,wave_period_wind:1,wave_period_swell1:1,
 ceil:250,mslp:.5,t2m:.75,dpt2m:.75,t1000:.4,t925:.4,t850:.4,t700:.4,wspd850:1.2,td700:.6,td850:.6,td925:.6,q700:.12,q850:.15,q925:.2,
 h1000:.25,h925:.3,h850:.35,h700:.45,h500:.6,h300:.75,h250:.75,wspd250:2,
 rh2m:3,wspd10:2,wspd250:2,wspd300:2,gust:2,apcp:.15,apcp1h:.08,apcp3h:.12,
 apcp6h:.2,apcp24h:.35,apcp48h:.5,prate:.08,asnow:1,snod:1,
 shear01:4,shear06:5,srh01:30,srh03:40,absv500:2,
 sbcape:100,mlcape:100,mucape:100
};
function differenceNeutralThreshold(field,range){
 const value=DIFFERENCE_NEUTRAL_BY_FIELD[field];
 return Math.min(range*.45,Number.isFinite(value)?value:range*.10);
}
// Precomputed GFS comparison grids contain signed deltas, not absolute
// meteorological quantities. Give them a symmetric diverging color scale.
function panelFieldInfo(p,v){
 if(p?.cfg?.timeMode==='gfs-analysis'&&!!gfsSnowSpec(st.field)&&/^nohrsc_/.test(p?.ds?.product||'')){
  const gfs=gfsSnowSpec(st.field);
  const base=gfs?.method==='slr10'?{...FIELDS[st.field],convert:'mtoin'}:(FIELDS[v.name]||FIELDS.snow6h);
  const period=gfs?.period||0;
  return {...base,label:'NOHRSC observed '+(period?period+'-hour':'accumulated')+' snowfall'};
 }
 const requested=typeof panelSelectedField==='function'?panelSelectedField(p):(p?.cfg?.field||st.field);
 const base=p?.analysisCategoricalOnly&&requested==='refc_ptype'?fieldInfo(v,'ptype',p?.ds?.model||p?.cfg?.source):
  fieldInfo(v,requested,p?.ds?.model||p?.cfg?.source);
 if(!p?.cfg?.differencePanel)return base;
 // Do not create a fake signed palette or label for an ordinal category.
 if(DIFFERENCE_BLOCKED_FIELDS.has(requested))
  return {...base,label:base.label+' · Not applicable'};
 const ranges={wave_height_sig:26.24672,wave_height_wind:19.68504,wave_height_swell1:19.68504,
  wave_period_primary:8,wave_period_wind:8,wave_period_swell1:8,
  ceil:10000,mslp:15,t2m:15,dpt2m:15,t1000:10,t925:10,t850:10,t700:10,td700:12,td850:12,td925:12,q700:4,q850:5,q925:6,
  wspd250:30,h250:180,wspd300:30,wspd850:25,h300:180,h500:150,h700:100,h850:90,h925:70,h1000:60,
  rh2m:30,wspd10:25,wspd250:25,wspd300:25,gust:30,apcp:3,asnow:12,
  prate:1,sbcape:1200,mlcape:1200,mucape:1200,absv500:15,
  shear01:25,shear06:30,srh01:200,srh03:300};
 // Every switchable upper-air scalar uses the SAME signed range in fixed
 // GFS panels and the on-demand RRFS/REFS/AI difference window.
 const range=(UPPER_AIR_SCALAR_KEYS.has(requested)?DIFFERENCE_LIMITS[requested]:ranges[requested])||20;
 return {...base,differenceField:true,label:base.label+' difference',
  convert:base.convert==='F'?'deltaF':base.convert==='C'?'deltaC':base.convert,
  min:-range,max:range,fraction:false,ensembleMeanFraction:false,levels:undefined,bandColors:undefined,category:undefined,
  // Use chromatic, extremely pale blue/red next to physical zero rather
  // than a neutral gray center. The true near-zero band is transparent.
  colors:[[-range,'#173b8d'],[-range*.8,'#2865b5'],[-range*.6,'#418dcb'],
          [-range*.4,'#78b5de'],[-range*.22,'#add5eb'],[-range*.09,'#e3f3fa'],
          [0,'#ffffff'],[range*.09,'#feeee7'],[range*.22,'#f9c6b8'],
          [range*.4,'#ee9b86'],[range*.6,'#da6a5a'],[range*.8,'#bd3b3d'],
          [range,'#7e203a']],
  // Absolute-precipitation thresholds must NEVER be inherited by signed A-B
  // differences: clearBelow=.010 makes the entire negative half transparent.
  // Signed differences retain only their symmetric near-zero transparent band.
  minimumDisplayPrecipIn:false,minimumDisplaySnowIn:false,clearBelow:undefined,
  clearZero:differenceNeutralThreshold(requested,range),cutoff:undefined};
}
// A raw Zarr chunk is converted ONCE into the display units used by the GPU
// field, its color map and its hover readout. Never convert sampled GPU values.
function convert(x,m){switch(m.convert){case 'mtoft':return x*3.28084;case 'metersToMiles':return x/1609.344;case 'mToDm':return x/10;case 'F':return(x-273.15)*1.8+32;case 'deltaF':return x*1.8;case 'C':return x-273.15;case 'deltaC':return x;case 'mmtoin':return x/25.4;case 'snowSlr10ToIn':return activeSnowRatio(st.field)*x/25.4;case 'mtoin':return x*39.37007874;case 'rateToInHr':return x*3600/25.4;case 'mpsToKt':return x*1.9438444924406;case 'vort1e5':return x*1e5;case 'kgkgToGkg':return x*1000;case 'PaToHpa':return x/100;default:return x;}}
// Native metres arrive as Float32, so conversions near an exact inclusive
// 9-mi / 30,000-ft boundary need a sub-display-resolution rounding margin.
function exceedsDisplayLimit(x,m){
 return !m?.differenceField&&Number.isFinite(m?.maxValidDisplay)&&
  x>m.maxValidDisplay+Math.max(1e-6,m.maxValidDisplay*1e-6);
}
function formatReadout(x,m){
 if(!Number.isFinite(x)||x < -1e9)return '—';
 // Absolute aviation fields retain their native over-range categories in
 // point sampling even though their color-fill deliberately masks them.
 // Exactly at the advertised upper bin is likewise a capped category.
 if(!m?.differenceField&&Number.isFinite(m?.maxValidDisplay)&&
    x>=m.maxValidDisplay-Math.max(1e-6,m.maxValidDisplay*1e-6))
  return `${m.maxValidDisplay}+`;
 if(exceedsDisplayLimit(x,m))return '—';
 if(m?.minimumDisplayPrecipIn&&x<MIN_DISPLAY_PRECIP_IN)return '—';
 if(m?.minimumDisplaySnowIn&&x<MIN_DISPLAY_SNOW_IN)return '—';
 if(m.ptypeReflectivity){
  const code=Math.floor(x/80)+1,dbz=x-(code-1)*80;
  return code>=1&&code<=5&&dbz>=10&&dbz<80?`${PTYPE_LABELS[code]} · ${dbz.toFixed(1)} dBZ`:'—';
 }
 if(m.flightCategory){
  const code=Math.round(x);
  return Math.abs(x-code)<.01&&code>=0&&code<FLIGHT_CATEGORY_NAMES.length?FLIGHT_CATEGORY_NAMES[code]:'Unknown';
 }
 if(m.ptype){
  // PTYPE is categorical; reject fractional/interpolated codes rather than
  // reporting a fabricated weather type. Codes are stored as exact uint8.
  const code=Math.round(x);
  return Math.abs(x-code)<.01&&code>=0&&code<PTYPE_LABELS.length?PTYPE_LABELS[code]:'Unknown';
 }
 // Extra decimals for small rates/accumulations, without converting again.
 const smallUnits=m.convert==='mmtoin'||m.convert==='mtoin'||m.convert==='snowSlr10ToIn'||m.convert==='rateToInHr';
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
// Live geography uses a single clean outline stroke. Export geography retains
// its existing two-tone casing; do not modify export rendering.
const CONTOUR_STYLE_LAYERS=new Set(['dewpoint','specificHumidity','windSpeed','contours','mslpContours','height','temperature']);
const VALID_CONTOUR_LINE_STYLES=new Set(['auto','solid','dashed','dotted','dash-dot']);
const STYLE_LAYERS=['mapOutlines','counties','terrain','mapBackground','dewpoint','specificHumidity','windSpeed','contours','mslpContours','wind','waveDirection','height','temperature','tracers','cities','roads'];
// Default applies only when no theme-specific terrain opacity is saved.
const DEFAULT_TERRAIN_OPACITY=.8;
const OVERLAY_STYLE_DEFAULTS={dewpoint:'#27f0dd',specificHumidity:'#ff84fa',windSpeed:'#f1b73a',mapOutlines:'#f4f8fc',mapBackground:'#0b2238',contours:'#102536',mslpContours:'#000000',wind:'#102538',waveDirection:'#fff6d1',height:'#102536',temperature:'#ffffff',tracers:'#8fe8f6',counties:'#bfd0dd',cities:'#f5fcff',roads:'#a8b7c8'};
// Wave arrows and wind barbs have independent styling. Unlike wind barbs,
// marine arrows use a light default on dark maps and a dark default on light.
function defaultOverlayStyleColor(layer){
 if(layer==='mslpContours')return '#000000';
 if(layer==='contours')return st.theme==='dark'?'#f5faff':'#193145';
 if(layer==='waveDirection')return st.theme==='dark'?'#fff6d1':'#21364a';
 if(layer==='tracers')return st.theme==='dark'?'#8fe8f6':'#12647d';
 if(layer==='roads')return st.theme==='dark'?'#8ca5b4':'#8393a4';
 if(layer==='cities')return st.theme==='dark'?'#ffffff':'#12283a';
 if(layer==='counties')return st.theme==='dark'?'#c0d2dc':'#465d6c';
 return OVERLAY_STYLE_DEFAULTS[layer];
}
// Identical plotted fields share an outline profile across ALL model sets,
// including future sets. Do not scope user preferences to model-set names.
function outlineStyleKey(){return String(st.field||'');}
// Appearance adjustments are independent for the light and dark viewer modes.
// Geographic outlines are scoped by plotted field and theme, not model set.
function activeOverlayStyles(){return st.overlayStyles[st.theme]||{};}
function activeOutlineStyles(){return st.mapOutlineFieldStyles[st.theme]||{};}
function overlayStyle(layer){return layer==='mapOutlines'
 ?(activeOutlineStyles()[outlineStyleKey()]||{color:null,width:1,density:1})
 :(activeOverlayStyles()[layer]||{color:null,width:layer==='tracers'?1.2:1,density:layer==='tracers'?5:1,opacity:layer==='terrain'?DEFAULT_TERRAIN_OPACITY:.85,exaggeration:12.0,sunAngle:315,reliefStrength:.75,displayValue:false,showCityLabel:true,fontSize:12});}
// Density is a multiplier of the *number* of marks/levels rather than stroke
// thickness. Keep the range bounded so a dense map remains responsive.
function overlayDensity(layer){const d=Number(overlayStyle(layer).density);return Number.isFinite(d)?Math.max(.5,Math.min(layer==='tracers'?10:2,d)):(layer==='tracers'?5:1);}
function tracerAnimationSpeed(){const value=Number(overlayStyle('tracers').speed);return Number.isFinite(value)?Math.max(.25,Math.min(5,value)):2.5;}
function overlayStrokeWidth(layer,base){return base*Math.max(.5,Math.min(4,Number(overlayStyle(layer).width)||1));}
function overlayStrokeColor(layer,fallback){return /^#[0-9a-f]{6}$/i.test(overlayStyle(layer).color||'')?overlayStyle(layer).color:fallback;}
function terrainOpacity(){const value=Number(overlayStyle('terrain').opacity);return Number.isFinite(value)?Math.max(0,Math.min(1,value)):DEFAULT_TERRAIN_OPACITY;}
function terrainExaggeration(){const value=Number(overlayStyle('terrain').exaggeration);return Number.isFinite(value)?Math.max(0,Math.min(20,value)):12.0;}
function terrainSunAngle(){const v=Number(overlayStyle('terrain').sunAngle);return Number.isFinite(v)?Math.max(0,Math.min(360,v)):315;}
function terrainReliefStrength(){const v=Number(overlayStyle('terrain').reliefStrength);return Number.isFinite(v)?Math.max(0,Math.min(1,v)):.75;}
function syncTerrainAppearance(){
 window.EVUAdvancedMap?.setTerrainOpacity(terrainOpacity());
 window.EVUAdvancedMap?.setTerrainExaggeration(terrainExaggeration());
 window.EVUAdvancedMap?.setTerrainLighting?.({direction:terrainSunAngle(),strength:terrainReliefStrength()});
 // Recompute the same-hue relief over weather when the user adjusts terrain
 // sunlight/opacity. The map-view cache key includes these user settings.
 if(st.terrainEnabled)for(const p of st.active||[])if(p.mobileScalar&&terrainEnabledForPanel(p))scheduleMobileScalarRedraw(p,140+p.i*20);
}
function syncTracerAppearance(){
 const style=overlayStyle('tracers');
 const useAuto=style.autoContrast!==false&&(!style.color||style.autoContrast===true);
 window.EVUAdvancedMap?.setTracerStyle({
  color:!useAuto&&/^#[0-9a-f]{6}$/i.test(style.color||'')?style.color:null,
  colorBySpeed:useAuto,
  width:Math.max(.5,Math.min(4,Number(style.width)||1.2)),
  density:overlayDensity('tracers'),
  speed:tracerAnimationSpeed()
 });
}
function mapBackgroundPaint(){
 if(!st.mapBackground)return st.theme==='dark'?'#ffffff':'#000000';
 return overlayStrokeColor('mapBackground',themeColors().ocean);
}
function updateMapBackground(){
 const background=mapBackgroundPaint(),on=st.mapBackground;
 for(const p of [...st.active,...(st.difference.open&&st.difference.map?[{map:st.difference.map}]:[])]){
  const m=p.map;if(!m?.setPaintProperty)continue;
  for(const [id,property,value] of [['background','background-color',background],['land-fill','fill-color',on?overlayStrokeColor('mapBackground',themeColors().land):background],
    ['land-detail-mask','fill-color',background],['land-detail-fill','fill-color',on?overlayStrokeColor('mapBackground',themeColors().land):background],['lakes-detail-fill','fill-color',background]]){
   try{if(m.getLayer(id))m.setPaintProperty(id,property,value);}catch(_){}
  }
 }
}
function redrawStyledOverlays(){
 updateMapBackground();updateLiveGeography();
 // Outlines retain their own detail setting; counties use an explicit toggle.
 for(const p of st.active||[])if(p.map)geographyZoom(p);
 if(st.difference.open&&st.difference.geo?.map)geographyZoom(st.difference.geo);
 for(const p of st.panels){scheduleContourRedraw(p);scheduleWindRedraw(p);}
 syncTracerAppearance();syncTerrainAppearance();refreshAllCityLayers();
 if(st.difference.open){st.difference.outlineCache=null;scheduleDifferenceLiveRender();}
}
// Keep earlier browser preferences when upgrading, but never project a legacy
// global style into both themes. The current theme receives that style once;
// the other starts from automatic defaults until customized separately.
function validOverlayStyle(item,layer=null){
 if(!item||typeof item!=='object'||Array.isArray(item))return null;
 const width=Number(item.width),density=Number(item.density),speed=item.speed===undefined?2.5:Number(item.speed);
 return {color:/^#[0-9a-f]{6}$/i.test(item.color||'')?item.color:null,
  autoContrast:typeof item.autoContrast==='boolean'?item.autoContrast:undefined,
  lineStyle:CONTOUR_STYLE_LAYERS.has(layer)&&VALID_CONTOUR_LINE_STYLES.has(item.lineStyle)?item.lineStyle:'auto',
  width:Number.isFinite(width)?Math.max(.5,Math.min(4,width)):1.2,
  density:Number.isFinite(density)?Math.max(.5,Math.min(layer==='tracers'?10:5,density)):(layer==='tracers'?5:1),
  speed:Number.isFinite(speed)?Math.max(.25,Math.min(5,speed)):2.5,
  opacity:Number.isFinite(Number(item.opacity))?Math.max(0,Math.min(1,Number(item.opacity))):(layer==='terrain'?DEFAULT_TERRAIN_OPACITY:.85),
  exaggeration:Number.isFinite(Number(item.exaggeration))?Math.max(0,Math.min(20,Number(item.exaggeration))):12.0,
  sunAngle:item.sunAngle===undefined?315:(Number.isFinite(Number(item.sunAngle))?Math.max(0,Math.min(360,Number(item.sunAngle))):315),
  displayValue:item.displayValue===true,showCityLabel:item.showCityLabel!==false,
  fontSize:Number.isFinite(Number(item.fontSize))?Math.max(9,Math.min(28,Number(item.fontSize))):12,
  reliefStrength:item.reliefStrength===undefined?.75:(Number.isFinite(Number(item.reliefStrength))?Math.max(0,Math.min(1,Number(item.reliefStrength))):.75)};
}
function migrateCityDisplayValueDefault(){
 try{
  if(localStorage.getItem('omd_evu_cities_value_default_v2')==='1')return;
  const raw=localStorage.getItem('omd_evu_overlay_styles_by_theme');
  if(raw){const prefs=JSON.parse(raw);for(const v of Object.values(prefs||{}))if(v&&v.cities)delete v.cities.displayValue;
   localStorage.setItem('omd_evu_overlay_styles_by_theme',JSON.stringify(prefs));}
  localStorage.setItem('omd_evu_cities_value_default_v2','1');
 }catch(_){/* No storage access: unsaved default remains off. */}
}
function readOverlayPreferences(){
 migrateCityDisplayValueDefault();
 try{
  st.mapOutlines=localStorage.getItem('omd_evu_map_outlines')!=='0';
  st.mapBackground=localStorage.getItem('omd_evu_map_background')!=='0';
  st.countiesEnabled=localStorage.getItem('omd_evu_counties_enabled')==='1';
  st.citiesEnabled=localStorage.getItem('omd_evu_cities_enabled')==='1';
  st.roadsEnabled=localStorage.getItem('omd_evu_roads_enabled')==='1';
  const savedOutline=localStorage.getItem('omd_evu_outline_field_styles_by_theme');
  const savedOverlay=localStorage.getItem('omd_evu_overlay_styles_by_theme');
  const scoped=JSON.parse(savedOutline||localStorage.getItem('omd_evu_outline_field_styles')||'{}');
  const saved=JSON.parse(savedOverlay||localStorage.getItem('omd_evu_overlay_styles')||'{}');
  const outlineThemes=savedOutline?['dark','light']:[st.theme];
  const layerThemes=savedOverlay?['dark','light']:[st.theme];
  for(const theme of outlineThemes){
   const input=savedOutline?scoped?.[theme]:scoped;
   if(!input||typeof input!=='object'||Array.isArray(input))continue;
   for(const [key,item] of Object.entries(input)){
    if(!/^[-a-zA-Z0-9_|]+$/.test(key))continue;
    const clean=validOverlayStyle(item);
    if(clean)st.mapOutlineFieldStyles[theme][key]=clean;
   }
  }
  // Migrate model-set-prefixed 1.1.x presets into a shared field preset.
  // Prefer an explicitly unprefixed style; otherwise the previous RRFS style
  // wins a collision deterministically, and both model sets use it thereafter.
  for(const theme of outlineThemes){
   const styles=st.mapOutlineFieldStyles[theme];
   for(const prefix of ['rrfs-refs|','gfs-versions|']){
    for(const key of Object.keys(styles)){
     if(!key.startsWith(prefix))continue;
     const field=key.slice(prefix.length);
     if(field&&!Object.prototype.hasOwnProperty.call(styles,field))styles[field]=styles[key];
     delete styles[key];
    }
   }
  }
  for(const theme of layerThemes){
   const input=savedOverlay?saved?.[theme]:saved;
   if(!input||typeof input!=='object'||Array.isArray(input))continue;
   for(const layer of STYLE_LAYERS){
    if(layer==='mapOutlines')continue;
    const clean=validOverlayStyle(input[layer],layer);
    if(clean){
     // Density-only edits on older releases unintentionally saved the
     // default swatch as a fixed tracer color. Recover adaptive defaults.
     if(layer==='tracers'&&clean.autoContrast===undefined&&(!clean.color||
       clean.color.toLowerCase()===(theme==='dark'?'#8fe8f6':'#12647d'))){
      clean.autoContrast=true;clean.color=null;
     }
     st.overlayStyles[theme][layer]=clean;
    }
   }
  }
  // Legacy v1.2.85 accidentally saved the generic contour default swatch
  // when a user changed only isobar density. Give MSLP its own profile and
  // retain existing density/width while treating legacy automatic swatches as
  // *unset*, never as an explicit white MSLP request.
  for(const theme of ['dark','light']){
   const styles=st.overlayStyles[theme],legacy=styles?.contours;
   if(!legacy||styles.mslpContours)continue;
   const raw=String(legacy.color||'').toLowerCase();
   const defaultSwatches=['#f5faff','#193145','#102536','#000000'];
   styles.mslpContours={...legacy,color:raw&&!defaultSwatches.includes(raw)?legacy.color:null};
  }
  // Persist the upgrade atomically to separate keys, so a future theme switch
  // never reintroduces the old global style into the other theme.
  if(!savedOutline||!savedOverlay||String(savedOutline).includes('rrfs-refs|')||String(savedOutline).includes('gfs-versions|'))storeOverlayPreferences();
 }catch(err){console.warn('Overlay appearance preferences could not be read',err);}
 el.mapOutlinesToggleBtn.checked=st.mapOutlines;el.countiesToggleBtn.checked=st.countiesEnabled;el.citiesToggleBtn.checked=st.citiesEnabled;el.roadsToggleBtn.checked=st.roadsEnabled;el.mapBackgroundToggleBtn.checked=st.mapBackground;
}
function storeOverlayPreferences(){
 try{
  localStorage.setItem('omd_evu_map_outlines',st.mapOutlines?'1':'0');
  localStorage.setItem('omd_evu_map_background',st.mapBackground?'1':'0');
  localStorage.setItem('omd_evu_counties_enabled',st.countiesEnabled?'1':'0');
  localStorage.setItem('omd_evu_cities_enabled',st.citiesEnabled?'1':'0');
  localStorage.setItem('omd_evu_roads_enabled',st.roadsEnabled?'1':'0');
  localStorage.setItem('omd_evu_overlay_styles_by_theme',JSON.stringify(st.overlayStyles));
  localStorage.setItem('omd_evu_outline_field_styles_by_theme',JSON.stringify(st.mapOutlineFieldStyles));
 }catch(_){}
}
function setupOverlayStyleControls(){
 readOverlayPreferences();syncTracerAppearance();syncTerrainAppearance();
 for(const [id,key] of [['mapOutlinesToggleBtn','mapOutlines'],['mapBackgroundToggleBtn','mapBackground'],['countiesToggleBtn','countiesEnabled'],['citiesToggleBtn','citiesEnabled'],['roadsToggleBtn','roadsEnabled']])
  el[id].addEventListener('change',()=>{st[key]=el[id].checked;storeOverlayPreferences();redrawStyledOverlays();if(key==='citiesEnabled'||key==='roadsEnabled')refreshAllCityLayers();if(key==='citiesEnabled'){const credit=document.getElementById('citiesCredit');if(credit)credit.hidden=!(st.citiesEnabled&&/geonames/i.test(st.citiesSource||''));}});
 const dialog=el.overlayStyleDialog,color=el.overlayStyleColor,auto=el.overlayStyleAutoContrast,width=el.overlayStyleWidth,density=el.overlayStyleDensity,opacity=el.overlayStyleOpacity,exaggeration=el.overlayStyleExaggeration,sunAngle=el.overlayStyleSunAngle,reliefStrength=el.overlayStyleReliefStrength;
 const speedKey=document.getElementById('tracerSpeedKey'),tracerSpeed=el.overlayStyleTracerSpeed;
 const lineStyle=el.overlayStyleLineStyle;
 let active=null,colorEdited=false;
 const refresh=()=>{
  if(!active)return;
  const target=active==='mapOutlines'?activeOutlineStyles():activeOverlayStyles();
  // Keep implicit, field-dependent default ink unless Color was explicitly edited.
  const current=overlayStyle(active);
  target[active==='mapOutlines'?outlineStyleKey():active]={lineStyle:CONTOUR_STYLE_LAYERS.has(active)?lineStyle.value:'auto',color:active==='tracers'&&auto.checked?null:(colorEdited?color.value:(current.color||null)),autoContrast:active==='tracers'&&auto.checked,width:Number(width.value),density:Number(density.value),speed:active==='tracers'?Number(tracerSpeed.value):2,opacity:Number(opacity.value)/100,exaggeration:Number(exaggeration.value),sunAngle:Number(sunAngle.value),reliefStrength:Number(reliefStrength.value)/100,displayValue:active==='cities'?el.overlayStyleCitiesValues.checked:(overlayStyle(active).displayValue===true),showCityLabel:active==='cities'?el.overlayStyleCityNames.checked:(overlayStyle(active).showCityLabel!==false),fontSize:active==='cities'?Number(el.overlayStyleCityFont.value):(overlayStyle(active).fontSize||12)};
  if(active==='tracers'){color.disabled=auto.checked;speedKey.hidden=false;}
  el.overlayStyleCityFontValue.textContent=el.overlayStyleCityFont.value+' px';
  el.overlayStyleWidthValue.textContent=Number(width.value).toFixed(1)+'×';
  el.overlayStyleDensityValue.textContent=Number(density.value).toFixed(1)+'×';
  el.overlayStyleTracerSpeedValue.textContent=Number(tracerSpeed.value).toFixed(2).replace(/\.?0+$/,'')+'×';
  el.overlayStyleOpacityValue.textContent=opacity.value+'%';
  el.overlayStyleExaggerationValue.textContent=Number(exaggeration.value).toFixed(2).replace(/\.?0+$/,'')+'×';
  el.overlayStyleSunAngleValue.textContent=sunAngle.value+'°';
  el.overlayStyleReliefStrengthValue.textContent=reliefStrength.value+'%';
  storeOverlayPreferences();redrawStyledOverlays();if(active==='cities')refreshAllCityLayers();
 };
 for(const box of document.querySelectorAll('[data-style-layer]')){
  box.addEventListener('contextmenu',event=>{
   event.preventDefault();event.stopPropagation();
   if(box.dataset.styleLayer==='terrain'&&st.mode==='globe')return;
   active=box.dataset.styleLayer;
   colorEdited=false;
   const saved=overlayStyle(active);
   el.overlayStyleLineStyleRow.hidden=!CONTOUR_STYLE_LAYERS.has(active);
   lineStyle.value=VALID_CONTOUR_LINE_STYLES.has(saved.lineStyle)?saved.lineStyle:'auto';
   const defaultColor=active==='mapOutlines'?liveGeographyInk().line:
     active==='mapBackground'?mapBackgroundPaint():defaultOverlayStyleColor(active);
   color.value=saved.color||defaultColor;
   // Legacy saved default tracer ink often came from editing density, not
   // explicitly choosing a custom color. Migrate those defaults to Auto.
   const defaultInk=st.theme==='dark'?'#8fe8f6':'#12647d';
   const legacyDefault=String(saved.color||'').toLowerCase()===defaultInk;
   auto.checked=active==='tracers'&&(saved.autoContrast===true||(!saved.color&&saved.autoContrast!==false)||(saved.autoContrast===undefined&&legacyDefault));
   el.overlayStyleCitiesValuesRow.hidden=active!=='cities';
   el.overlayStyleCitiesValues.checked=saved.displayValue===true;
   el.overlayStyleCityNamesRow.hidden=active!=='cities';
   el.overlayStyleCityNames.checked=saved.showCityLabel!==false;
   el.overlayStyleCityFontRow.hidden=active!=='cities';
   el.overlayStyleCityFont.value=String(saved.fontSize||12);
   el.overlayStyleCityFontValue.textContent=el.overlayStyleCityFont.value+' px';
   el.overlayStyleAutoContrastRow.hidden=active!=='tracers';
   speedKey.hidden=active!=='tracers';
   width.value=String(saved.width|| (active==='tracers'?1.2:1));
   density.max=active==='tracers'?'10':'2';
   density.value=String(saved.density??(active==='tracers'?5:1));
   tracerSpeed.value=String(saved.speed??2.5);
   el.overlayStyleTracerSpeedRow.hidden=active!=='tracers';
   opacity.value=String(Math.round((saved.opacity??(active==='terrain'?DEFAULT_TERRAIN_OPACITY:.85))*100));
   exaggeration.value=String(saved.exaggeration??12.0);
   sunAngle.value=String(saved.sunAngle??315);
   reliefStrength.value=String(Math.round((saved.reliefStrength??.75)*100));
   el.overlayStyleWidthValue.textContent=Number(width.value).toFixed(1)+'×';
   el.overlayStyleDensityValue.textContent=Number(density.value).toFixed(1)+'×';
  el.overlayStyleTracerSpeedValue.textContent=Number(tracerSpeed.value).toFixed(2).replace(/\.?0+$/,'')+'×';
   el.overlayStyleOpacityRow.hidden=active!=='terrain'&&active!=='counties';
   el.overlayStyleExaggerationRow.hidden=active!=='terrain';
   el.overlayStyleSunAngleRow.hidden=active!=='terrain';
   el.overlayStyleReliefStrengthRow.hidden=active!=='terrain';
   el.overlayStyleOpacityRow.querySelector('label').firstChild.textContent=active==='counties'?'County opacity ':'Terrain opacity ';
   el.overlayStyleDensityRow.hidden=active==='mapBackground'||active==='terrain'||active==='counties';
   color.disabled=active==='terrain'||(active==='tracers'&&auto.checked);width.disabled=active==='terrain'||active==='cities';
   color.previousElementSibling.hidden=active==='terrain';width.previousElementSibling.hidden=active==='terrain'||active==='cities';
   color.hidden=active==='terrain';width.hidden=active==='terrain'||active==='cities';
   el.overlayStyleOpacityValue.textContent=opacity.value+'%';
  el.overlayStyleExaggerationValue.textContent=Number(exaggeration.value).toFixed(2).replace(/\.?0+$/,'')+'×';
  el.overlayStyleSunAngleValue.textContent=sunAngle.value+'°';
  el.overlayStyleReliefStrengthValue.textContent=reliefStrength.value+'%';
   el.overlayStyleHeading.textContent=box.querySelector('span')?.textContent+' appearance ('+(st.theme==='dark'?'dark':'light')+' mode)';
   if(!dialog.open)dialog.showModal();
  });
 }
 lineStyle.addEventListener('change',refresh);color.addEventListener('input',()=>{colorEdited=true;refresh();});el.overlayStyleCitiesValues.addEventListener('change',refresh);el.overlayStyleCityNames.addEventListener('change',refresh);el.overlayStyleCityFont.addEventListener('input',refresh);auto.addEventListener('change',refresh);width.addEventListener('input',refresh);density.addEventListener('input',refresh);tracerSpeed.addEventListener('input',refresh);opacity.addEventListener('input',refresh);exaggeration.addEventListener('input',refresh);sunAngle.addEventListener('input',refresh);reliefStrength.addEventListener('input',refresh);
 el.overlayStyleReset.addEventListener('click',()=>{
  if(!active)return;
  if(active==='mapOutlines')delete activeOutlineStyles()[outlineStyleKey()];
  else delete activeOverlayStyles()[active];
  colorEdited=false;
  lineStyle.value='auto';
  if(active==='cities'){el.overlayStyleCitiesValues.checked=false;el.overlayStyleCityNames.checked=true;el.overlayStyleCityFont.value='12';el.overlayStyleCityFontValue.textContent='12 px';}
  color.value=active==='mapOutlines'?liveGeographyInk().line:active==='mapBackground'?themeColors().ocean:defaultOverlayStyleColor(active);
  auto.checked=active==='tracers';color.disabled=active==='terrain'||auto.checked;speedKey.hidden=active!=='tracers';
  width.value=active==='tracers'?'1.2':'1';density.value=active==='tracers'?'5':'1';tracerSpeed.value='2.5';el.overlayStyleTracerSpeedValue.textContent='2.5×';opacity.value=active==='terrain'?String(Math.round(DEFAULT_TERRAIN_OPACITY*100)):'85';exaggeration.value='12';sunAngle.value='315';reliefStrength.value='75';el.overlayStyleSunAngleValue.textContent='315°';el.overlayStyleReliefStrengthValue.textContent='75%';el.overlayStyleOpacityValue.textContent=opacity.value+'%';el.overlayStyleExaggerationValue.textContent='12×';el.overlayStyleWidthValue.textContent='1.0×';
  el.overlayStyleDensityValue.textContent=active==='tracers'?'5.0×':'1.0×';storeOverlayPreferences();redrawStyledOverlays();
 });
 el.overlayStyleClose.onclick=()=>dialog.close();el.overlayStyleDone.onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
}
function themeColors(){return st.theme==='light'
 ?{ocean:'#ffffff',land:'#ffffff',line:'#283d4b',minor:'#465d6c',boundaryCasing:'#ffffff',grid:'#97a6b0'}
 :{ocean:'#0b2238',land:'#1d3541',line:'#e5eff3',minor:'#c0d2dc',boundaryCasing:'#0c1a28',grid:'#3c6474'};}
// Live geography on continuous fields: avoid bright white/black double-strokes.
// Intermittent fields keep the established high-contrast casing for visibility.
const INTERMITTENT_FIELDS=new Set(['refc','refc_ptype','ptype','crain','csnow','cicep','cfrzr',
 'prate','apcp','apcp1h','apcp3h','apcp6h','apcp24h','apcp48h',
 'snow1h','snow3h','snow6h','snow24h','snow48h','asnow',
 'frzr','frozr','tsnowp','weasd','snod','snowc','cpofp','mxuphl','mxuphl_run',...GFS_SNOW_KEYS]);
// Pick geographic ink with the underlying basemap as the mandatory contrast
// target. Some palettes (notably CAPE, UH, precipitation, and difference
// products) render zero/near-zero cells transparently; palette-only sampling
// previously chose dark ink over the dark basemap. A single live outline stroke
// cannot contrast against every color of a full raster, so choose reliably
// legible ink against the unshaded background first and use the palette only
// to select its hue. Export geography intentionally remains unchanged.
/* Choose geographic-outline ink from the ACTIVE color curve, not from
 * the viewer theme alone. A single unhaloed line cannot contrast with every
 * pixel of a multicolor field, so balance the real palette's median/low-end
 * contrasts against the basemap revealed by transparent data. The user\'s
 * per-field outline color always overrides this automatic choice. */
function outlineRelativeLuminance(color){
 if(typeof color!=='string'||!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color))return null;
 if(color.length===9&&parseInt(color.slice(7,9),16)<128)return null;
 const c=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255)
  .map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));
 return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
function outlineContrastRatio(a,b){return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
function selectAutomaticOutlineInk(colors,background,intermittent){
 const base=outlineRelativeLuminance(background)??.03;
 const readings=(colors||[]).filter((_,i)=>i%Math.max(1,Math.ceil(colors.length/40))===0)
  .map(outlineRelativeLuminance).filter(v=>v!==null);
 // Chromatic hues help an unhaloed boundary stand apart from broad gradients.
 // Warm/cool options are both considered, and the best contrast wins.
 const choices=['#edf9ff','#fff0ce','#a4ffe4','#f2e5ff','#ffeb8a',
                '#142736','#203b51','#35243b','#25342b','#143b45'];
 if(!readings.length)return base<.22?'#edf9ff':'#142736';
 // Transparent precipitation/snow backgrounds must retain strongly readable
 // boundaries. Continuous upper-air shading prioritizes the actual palette.
 const baseWeight=intermittent?.76:.16;
 let best=choices[0],bestScore=-Infinity;
 for(const candidate of choices){
  const lum=outlineRelativeLuminance(candidate);
  const contrasts=readings.map(v=>Math.log(outlineContrastRatio(lum,v))).sort((a,b)=>a-b);
  const q20=contrasts[Math.floor(.2*(contrasts.length-1))];
  const median=contrasts[Math.floor(.5*(contrasts.length-1))];
  const score=baseWeight*Math.log(outlineContrastRatio(lum,base))+
   (1-baseWeight)*(.25*q20+.75*median);
  if(score>bestScore){bestScore=score;best=candidate;}
 }
 return best;
}
function paletteContrastColors(p=null){
 const difference=!!p?.cfg?.differencePanel;
 const meta=FIELDS[selectedShadingField()]||{};
 let colors=difference?['#244b99','#7ca4dd','#e9f3ff','#fff0ea','#e99483','#b52332']:[];
 if(!difference){
  // Includes custom .pal imports and changed color ranges; the legend and
  // geographic-contrast calculation now use the SAME active palette.
  try{colors=pal(meta,p?.v||{name:st.field}).colors||[];}
  catch(_){colors=meta.bandColors||meta.colors?.map(stop=>Array.isArray(stop)?stop[1]:stop)||[];}
 }
 const base=st.mapBackground===false?(st.theme==='dark'?'#ffffff':'#000000'):
  (/^#[0-9a-f]{6}$/i.test(activeOverlayStyles().mapBackground?.color||'')?
   activeOverlayStyles().mapBackground.color:themeColors().ocean);
 const backgroundDark=(outlineRelativeLuminance(base)??.03)<.22;
 // Preserve the established pressure profile's conventional dark outline.
 // The restrained, light-pressure keyline is owned by updateLiveGeography.
 if(st.field==='mslp'&&!difference)return {line:'#1c3040',minor:'#294255',boundaryCasing:'#e9f2f7'};
 if(['t700','t850','t925','t1000'].includes(st.field)&&!difference)
  return {line:'#193145',minor:'#344e60',boundaryCasing:'#ecf3f7'};
 // The 500-hPa vorticity palette benefits from a deliberately distinctive
 // cyan ink in dark mode, independent of source model or zoom level.
 if(backgroundDark&&st.field==='absv500'&&!difference)return {line:'#78ffe0',minor:'#b0ffeb',boundaryCasing:'#0a2433'};
 const color=selectAutomaticOutlineInk(colors,base,INTERMITTENT_FIELDS.has(st.field)||difference&&
  colors.some(c=>/^#e9f3ff$/i.test(c))&&backgroundDark);
 const light=(outlineRelativeLuminance(color)??0)>.35;
 return {line:color,minor:light?'#c3e3ee':'#344e5e',
         boundaryCasing:light?'#102334':'#f2f7fa'};
}
function liveGeographyInk(p=null){
 const standard=themeColors(),colors=paletteContrastColors(p);
 return {...standard,...colors,casingOpacity:.87,minorCasingOpacity:.74};
}
/** Avoid invalidating MapLibre's cached terrain textures on no-op outline
 * refreshes. Color/width choices are determined once per field, but this
 * function is called for every panel refresh and forecast-hour change. */
function setGeographyPaint(map,id,name,value){
 try{if(typeof map.getPaintProperty==='function'&&map.getPaintProperty(id,name)===value)return;}
 catch(_){ /* Older test maps or a pending style transaction: apply normally. */ }
 map.setPaintProperty(id,name,value);
}
function updateLiveGeography(){
 const mainInk=liveGeographyInk(),differenceInk=st.difference.open?liveGeographyInk({cfg:{differencePanel:true}}):null;
 for(const p of [...(st.active||[]),...(st.difference.open&&st.difference.map?[{map:st.difference.map,cfg:{differencePanel:true}}]:[])]){
  const ink=p.cfg?.differencePanel?differenceInk:mainInk,m=p.map;if(!m?.setPaintProperty)continue;
  // opacity-only suppression can leave earlier line draw commands in the
  // terrain renderer; explicitly hide native line layout as well.
  const canvasOwns=!!p.geoOverlayShowing;
  const detail=outlineDetailThreshold();
  const overviewReplaced=id=>(id==='coast'||id==='country')&&
   p.geoApplied?.has?.(id+'_detail')&&m.getZoom?.()>=detail;
  for(const id of ['coast','coast-detail','country','country-detail','states','counties']){
   const visibility=canvasOwns||overviewReplaced(id)?'none':'visible';
   for(const layer of [id,id+'-casing'])try{
    if(m.getLayer?.(layer)&&m.getLayoutProperty?.(layer,'visibility')!==visibility)
     m.setLayoutProperty(layer,'visibility',visibility);
   }catch(_){ /* Style or geometry may still be loading. */ }
  }
  for(const id of ['coast','coast-detail','country','country-detail','states','counties']){
   const minor=id==='states'||id==='counties';
   try{if(m.getLayer(id)){
    const styleLayer=id==='counties'?'counties':'mapOutlines';
    setGeographyPaint(m,id,'line-color',overlayStrokeColor(styleLayer,minor?ink.minor:ink.line));
    setGeographyPaint(m,id,'line-opacity',p.geoOverlayShowing?0:(id==='counties'?(st.countiesEnabled?overlayStyle('counties').opacity??.85:0):(st.mapOutlines&&(id!=='states'||overlayDensity('mapOutlines')>=.7)?(minor?.95:.97):0)));
    setGeographyPaint(m,id,'line-width',overlayStrokeWidth(styleLayer,minor?(id==='counties'?.73:.94):(id.endsWith('detail')?1.14:1.12)));
   }}catch(_){}
   try{if(m.getLayer(id+'-casing')){
    // Outline contrast is a two-tone *default*, not a hard-coded light or
    // dark rule.  The face color is selected from the active field palette;
    // its opposite-polarity hairline keeps it legible when that palette crosses
    // the same luminance (e.g. yellow/green precipitation, cool/warm T850).
    // Respect an explicit per-field user color: never add a surprise casing.
    const customOutline=overlayStyle('mapOutlines').color;
    const automatic=!(typeof customOutline==='string'&&/^#[0-9a-f]{6}$/i.test(customOutline));
    const needsContrastKeyline=id!=='counties'&&st.mapOutlines&&automatic;
    const isMSLP=st.field==='mslp'&&!p.cfg?.differencePanel;
    const isMinor=id==='states';
    setGeographyPaint(m,id+'-casing','line-opacity',p.geoOverlayShowing?0:(needsContrastKeyline?(isMinor?.48:.68):0));
    if(needsContrastKeyline){
     setGeographyPaint(m,id+'-casing','line-color',ink.boundaryCasing);
     // 0.25–0.45 CSS-pixel outer edge: enough to survive opposing palette
     // colors without the heavy white outline/halo seen in earlier releases.
     setGeographyPaint(m,id+'-casing','line-width',overlayStrokeWidth('mapOutlines',
      isMSLP?1.90:isMinor?1.55:1.94));
    }
   }}catch(_){}
  }
 }
}
// Exactly one geographic outline owner: when the above-weather canvas is
// visible, suppress MapLibre's corresponding inner/casing lines. When the
// canvas hides for navigation, unavailable data, or terrain toggles, restore
// native lines immediately. The GeoJSON layers remain loaded for exports.
function setPanelGeographyOverlay(p,visible){
 if(!p?.map||Boolean(p.geoOverlayShowing)===Boolean(visible))return;
 p.geoOverlayShowing=Boolean(visible);
 updateLiveGeography();
}
function mapStyle(){
 // MapLibre must finish startup before asking its web workers to parse GeoJSON.
 // A true source-free style also makes map failures distinguishable from slow geography.
 const c=themeColors();
 return {version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':mapBackgroundPaint()}}]};
}
// Same visibility threshold for county lines and high-detail shorelines/borders.
// High-detail basemap is now used at every zoom; counties retain their own threshold.
function detailThreshold(){return Math.max(0,Number(st.cfg?.display?.detailMinZoom??0)||0);}
// Map-outline density changes the amount of geographic boundary detail, not
// the underlying land/water fill or the width of the lines.
function outlineDetailThreshold(){return Math.max(0,detailThreshold()+1.4*Math.log2(1/overlayDensity('mapOutlines')));}
function detailMaskData(){
 const ring=[[-173,4],[-43,4],[-43,82],[-173,82],[-173,4]];
 return {type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[ring]}}]};
}
function addGeographySkeleton(m){
 const c=liveGeographyInk(),empty=()=>({type:'geojson',data:'data/map_empty.geojson'}),detail=detailThreshold();
 const line=(id,source,color,width,opacity=.9)=>({id,type:'line',source,paint:{'line-color':color,'line-width':width,'line-opacity':opacity}});
 for(const key of ['land','coast','country','states','counties','land_detail','lakes_detail','coast_detail','country_detail'])
  if(!m.getSource(key))m.addSource(key,empty());
 if(!m.getSource('detail-mask'))m.addSource('detail-mask',{type:'geojson',data:'data/map_detail_mask.geojson'});
 const layers=[
  {id:'land-fill',type:'fill',source:'land',paint:{'fill-color':st.mapBackground!==false&&typeof overlayStrokeColor==='function'?overlayStrokeColor('mapBackground',c.land):(typeof mapBackgroundPaint==='function'?mapBackgroundPaint():c.land),'fill-opacity':1}},
  // Higher-resolution shoreline fills are enabled only after BOTH regional land
  // and lake polygons have arrived, avoiding partial/misleading basemap displays.
  {id:'land-detail-mask',type:'fill',source:'detail-mask',minzoom:24,paint:{'fill-color':(typeof mapBackgroundPaint==='function'?mapBackgroundPaint():c.ocean),'fill-opacity':1}},
  {id:'land-detail-fill',type:'fill',source:'land_detail',minzoom:24,paint:{'fill-color':st.mapBackground!==false&&typeof overlayStrokeColor==='function'?overlayStrokeColor('mapBackground',c.land):(typeof mapBackgroundPaint==='function'?mapBackgroundPaint():c.land),'fill-opacity':1}},
  {id:'lakes-detail-fill',type:'fill',source:'lakes_detail',minzoom:24,paint:{'fill-color':(typeof mapBackgroundPaint==='function'?mapBackgroundPaint():c.ocean),'fill-opacity':1}},
  // Each casing is immediately BELOW its matching inner stroke but ABOVE the
  // raster. Both layers share one GeoJSON source, camera and zoom visibility.
  line('coast-casing','coast',c.boundaryCasing,2.50,0),
  line('coast','coast',c.line,1.17,.97),
  {...line('coast-detail-casing','coast_detail',c.boundaryCasing,2.45,0),minzoom:detail},
  {...line('coast-detail','coast_detail',c.line,1.14,.97),minzoom:detail},
  line('country-casing','country',c.boundaryCasing,2.40,0),
  line('country','country',c.line,1.09,.97),
  {...line('country-detail-casing','country_detail',c.boundaryCasing,2.40,0),minzoom:detail},
  {...line('country-detail','country_detail',c.line,1.09,.97),minzoom:detail},
  line('states-casing','states',c.boundaryCasing,2.00,0),
  line('states','states',c.minor,.94,.95),
  line('counties-casing','counties',c.boundaryCasing,1.65,0),
  line('counties','counties',c.minor,.73,0),
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
 const view=document.createElement('div');view.className='panel-viewport';const scrollRail=document.createElement('button');scrollRail.type='button';scrollRail.className='panel-scroll-rail';scrollRail.setAttribute('aria-label',`Scroll to next model after ${cfg.label||cfg.id}`);scrollRail.title='Swipe vertically here to scroll between model panels, or tap for the next panel';scrollRail.textContent='↕ Scroll';const snap=document.createElement('img');snap.className='map-snapshot';snap.alt='Previously rendered weather plot';snap.hidden=true;const frame=document.createElement('div');frame.className='map-frame';const lbl=document.createElement('div');lbl.className='plot-label';const title=document.createElement('strong'),sub=document.createElement('span'),labelMeta=document.createElement('div');labelMeta.className='plot-label-meta';labelMeta.append(title,sub);lbl.append(labelMeta);const notice=document.createElement('div');notice.className='notice visible';const note=document.createElement('span');notice.append(note);const info=document.createElement('div');info.className='point-info';info.hidden=true;const ghost=document.createElement('div');ghost.className='sync-crosshair';ghost.hidden=true;ghost.setAttribute('aria-hidden','true');const terrainNumber=document.createElement('div');terrainNumber.className='terrain-panel-number';terrainNumber.textContent=String(i+1);terrainNumber.hidden=true;terrainNumber.setAttribute('aria-hidden','true');const surfaceWeatherNotice=document.createElement('div');surfaceWeatherNotice.className='surface-weather-panel-status';surfaceWeatherNotice.hidden=true;surfaceWeatherNotice.setAttribute('aria-live','off');const lowTrackNotice=document.createElement('div');lowTrackNotice.className='low-track-panel-status';lowTrackNotice.hidden=true;lowTrackNotice.setAttribute('role','status');lowTrackNotice.setAttribute('aria-live','polite');view.append(frame,snap,lbl,notice,info,ghost,scrollRail,terrainNumber,surfaceWeatherNotice,lowTrackNotice);
 const compare=document.createElement('label');compare.className='panel-difference-selector';
 const compareCheck=document.createElement('input');compareCheck.type='checkbox';compareCheck.setAttribute('aria-label',`Select ${cfg.label||cfg.id} for difference map`);
 compare.title=`Compare ${cfg.label||cfg.id} with another panel (first selected minus second selected)`;compare.append(compareCheck);if(!cfg.placeholder){lbl.prepend(compare);view.append(save);}view.append(expand);
 const ft=document.createElement('div');ft.className='panel-footer';const legendTitle=document.createElement('div');legendTitle.className='legend-title';const legendCanvas=document.createElement('canvas');legendCanvas.className='legend-canvas';const legendLabels=document.createElement('div');legendLabels.className='legend-labels';ft.append(legendTitle,legendCanvas,legendLabels);card.append(view,ft);el.viewerGrid.append(card);
 legendCanvas.addEventListener('contextmenu',e=>{
  const current=p.v?panelFieldInfo(p,p.v):null;
  if(!current||!adjustableColorbar(current))return;
  e.preventDefault();e.stopPropagation();openLegendRangeEditor(current,p.v);
 });
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
 const p={lowTrackNotice,surfaceWeatherNotice,surfaceWeatherDisplayState:{state:'idle'},terrainNumber,scrollRail,contourField:null,primaryContourField:null,mslpContourField:null,contourCanvas:null,lowTrackCanvas:null,contourFrameRequested:false,contourRafId:null,contourRedrawTimer:null,contourCache:null,cfg,i,card,view,frame,snap,title,sub,notice,note,info,ghost,save,expand,compare,compareCheck,legendTitle,legendCanvas,legendLabels,wind:null,marineWind:null,windCanvas:null,windFrameRequested:false,map:null,component:null,layer:null,rawField:null,ds:null,v:null,h:null,src:null,lastKey:null,image:null,lastSnapshot:null,grid:null,gridKey:null,status:'waiting',busy:false,geoApplied:new Set(),geoPending:new Set(),geoTimer:null,mapReady:null,activation:null,initializing:false,cancelMapWait:null,loadingStage:'',loadSince:0,stageSince:0};
 notice.style.pointerEvents='none';card.addEventListener('click',event=>{
  selectPanel(p);
  // A normal map click also bubbles to this panel card. Re-running activate()
  // on an already initialized map forces renderPanel() -> low-track setData(),
  // which dismisses a marker popup immediately after the marker opened it.
  // Interacting with the map OR its top-level popup must only select the panel;
  // a click on a waiting panel can still initialize it as before.
  if(p.map&&event.target?.closest?.('.map-frame'))return;
  if(!p.cfg.placeholder)activate(p).catch(e=>fail(p,e));
 });
 scrollRail.addEventListener('pointerdown',e=>e.stopPropagation());
 scrollRail.addEventListener('click',e=>{e.stopPropagation();const next=st.panels[p.i+1]||st.panels[0];if(next&&next!==p)next.card.scrollIntoView({behavior:'smooth',block:'start'});});
 save.addEventListener('click',e=>{e.stopPropagation();openExportDialog('panel',p,e);});
 expand.addEventListener('click',e=>{e.stopPropagation();setExpandedPanel(st.expandedPanel===p?null:p);});
 if(st.modelSet==='gfs-versions'){compareCheck.hidden=true;compare.hidden=true;}else compareCheck.addEventListener('change',()=>setDifferenceSelection(p,compareCheck.checked));
 if(cfg.placeholder){p.status='missing';card.classList.add('analysis-placeholder');p.title.textContent=cfg.label||cfg.id;p.sub.textContent=cfg.placeholderSubtitle||'Developmental dataset pending';setNote(p,cfg.placeholderText||'Source data not yet available');}
 else setNote(p,'Waiting for catalog…');return p;
}
function setNote(p,msg){p.note.textContent=msg;p.notice.classList.add('visible');}
function stage(p,label){p.loadingStage=label;p.stageSince=Date.now();setNote(p,label);}
function loadingErrorMessage(e){const msg=String(e?.message||e);if(/GPU layer|geometry worker|GPU timeout/i.test(msg))return msg+' Check the complete existing vendor/autumnplot-gl distribution, including all worker .js files and their HTTP access.';if(/HTTP 404/.test(msg))return msg+' Check that the full Zarr directory and chunk file were copied to the same directory as catalog.json.';if(/abort|timeout/i.test(msg))return msg+' Check browser Network tab for a slow or blocked chunk or worker.';return msg;}

function clearNote(p){p.notice.classList.remove('visible','error-details');
 p.notice.style.pointerEvents='none';p.notice.onclick=null;p.notice.title='';p.lastErrorDetails=null;}
// Focus one model *within the existing plotting workspace*, never the browser
// Fullscreen API. Keep every panel and its MapLibre instance alive so the
// 3x3 view and the geographic camera are restored without reloading data.
const EXPAND_ICON='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>';
const COLLAPSE_ICON='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>';
function setExpandedPanel(panel,activatePanel=true){
 if(st.expandedPanel===panel)return;
 window.EVUPanelRecorder?.focusedPanelChanged?.(panel);
 const wasFocused=st.expandedPanel;
 // Capture the map BEFORE changing its physical canvas dimensions. On
 // collapse, undo the temporary expansion zoom so all model sets return to a
 // geographically consistent, shared camera without losing user pan/tilt.
 const beforeMap=wasFocused?.map||panel?.map||null;
 const rawBefore=beforeMap?cameraFromMap(beforeMap):null;
 const canonical=beforeMap?normalCameraFromFocused(beforeMap,rawBefore):currentSharedCamera();
 if(panel&&!wasFocused){
  const oldSize=panelViewportSize(panel);
  if(oldSize.width>20&&oldSize.height>20)panel.normalViewportSize=oldSize;
 }
 st.expandedPanel=panel||null;
 st.mapView=canonical||st.mapView;
 if(canonical)st.mapViews[st.mode]=canonical;
 const transition=st._focusTransition=(st._focusTransition||0)+1;
 // A second expansion/collapse before the next frame must preserve the
 // original synchronization state, not inherit the temporary guard.
 const wasSyncing=st._focusTransitionPending?st._focusSyncBefore:st.syncing;
 st._focusSyncBefore=wasSyncing;
 st._focusTransitionPending=true;
 st.syncing=true;
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
 requestAnimationFrame(()=>{
  if(transition!==st._focusTransition)return;
  try{
   const focus=st.expandedPanel;
   for(const p of st.panels){
    if(!p.map||focus&&p!==focus)continue;
    p.map.resize();
    // In independent-map mode, enlarging one panel must not reset the
    // unrelated cameras when the grid is restored.
    const applyCamera=canonical&&(focus===p||(!focus&&(st.cfg?.display?.syncMaps!==false||wasFocused===p)));
    if(applyCamera){
     const maxZoom=Number(st.cfg?.display?.maxZoom)||12;
     const size=panelViewportSize(p);
     const delta=focus===p?expandedViewportZoomAdjustment(p.normalViewportSize,size):0;
     // Store the actual applied delta after zoom clamping so the inverse on
     // collapse is exact, including zooms near min/max limits.
     const applied=Math.max(0,Math.min(maxZoom,canonical.zoom+delta));
     p._expandedZoomDelta=focus===p?applied-canonical.zoom:0;
     p.map.jumpTo({...canonical,zoom:focus===p?applied:canonical.zoom});
    }
    geographyZoom(p);scheduleWindRedraw(p);scheduleContourRedraw(p);
   }
  }finally{st.syncing=wasSyncing;st._focusTransitionPending=false;}
  if(activatePanel&&panel&&!panel.cfg.placeholder&&st.expandedPanel===panel)
   activate(panel).catch(err=>fail(panel,err));
 });
}
function selectPanel(p){for(const x of st.panels)x.card.classList.toggle('selected',x===p);}
// All model catalogs participate in run discovery. The legacy RRFS catalog
// may lag new REFS/HRRR catalogs; never let it cap the cycle selector.
function cycleKey(time){const ms=Date.parse(time);return Number.isFinite(ms)?new Date(ms).toISOString():null;}
// Shared, declarative model-set startup. The model-specific field adapters
// remain separate: GRIB grids, accumulation cadence, and derived fields are
// deliberately NOT assumed to be interchangeable across model families.
function resolveModelSetConfig(cfg, requestedId){
 const sets=(cfg.modelSets||[]).filter(set=>set&&set.enabled!==false);
 const preferred=sets.find(set=>set.id===requestedId)||sets.find(set=>set.id===cfg.defaultModelSet)||sets[0];
 if(!preferred)throw Error('No enabled model sets configured');
 const panelKey=preferred.panelKey|| (preferred.id==='gfs-versions'?'gfsPanels':'panels');
 const panels=cfg[panelKey];
 if(!Array.isArray(panels)||!panels.length)throw Error('Model set '+preferred.id+' has no panels in '+panelKey);
 const primarySource=preferred.primarySource|| (preferred.id==='gfs-versions'?'gfs_v16':cfg.primarySource||'rrfs');
 const cycleSourceIds=Array.isArray(preferred.cycleSourceIds)&&preferred.cycleSourceIds.length?
  preferred.cycleSourceIds.slice():[primarySource];
 const sourceIds=new Set([...cycleSourceIds,primarySource,'analysis',
  ...panels.filter(panel=>!panel.placeholder).map(panel=>panel.source),
  ...(preferred.extraSourceIds||[])]);
 const knownSources=new Set((cfg.sources||[]).map(source=>source.id));
 const missing=[...sourceIds].filter(id=>!knownSources.has(id));
 if(missing.length)throw Error('Model set '+preferred.id+' refers to unknown sources: '+missing.join(', '));
 const step=Number(preferred.forecastHourStep||(preferred.id==='gfs-versions'?3:1));
 if(!Number.isInteger(step)||step<1||step>24)throw Error('Invalid forecastHourStep for '+preferred.id);
 return {...preferred,panels,primarySource,cycleSourceIds,sourceIds,forecastHourStep:step};
}
function unionCycles(sources,preferredId){
 const merged=new Map();
 for(const source of sources){
  if(source.error||source.id==='analysis')continue; // Valid-hour analyses are NOT forecast cycles.
  for(const ds of source.datasets){
   const key=cycleKey(ds.init_time);if(!key)continue;
   if(!merged.has(key))merged.set(key,{id:key,init_time:key,model:'',grid:null,variables:[],entries:[],sourceIds:[]});
   const c=merged.get(key);c.entries.push({source,ds});c.sourceIds.push(source.id);
   if(ds.is_case===true)c.is_case=true;
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
// Live inventory refresh (separate from the application-release checker).
// Only catalogs for the active model set are polled. Existing Zarr caches,
// camera, selected field, overlay preferences, and playback state are retained.
const catalogRefreshState={inFlight:null,pending:new Map(),applyTimer:null,lastChecked:0};
function catalogSignature(datasets){return JSON.stringify(datasets||[]);}
function catalogRefreshPeriod(){
 const seconds=Number(st.cfg?.display?.catalogRefreshSeconds??180);
 return seconds===0?0:Math.max(60000,Math.min(3600000,(Number.isFinite(seconds)?seconds:180)*1000));
}
async function fetchInventoryCatalog(url){
 const address=new URL(url,document.baseURI);
 // The unique URL also bypasses stale intermediate HTTP caches that ignore
 // request.cache, while retaining the exact same base catalog URL for Zarr.
 address.searchParams.set('__evu_inventory',String(Date.now()));
 const controller=typeof AbortController==='function'?new AbortController():null;
 const timeout=controller?setTimeout(()=>controller.abort(),10000):null;
 try{
  const response=await fetch(address.href,{cache:'no-store',credentials:'same-origin',...(controller?{signal:controller.signal}:{})});
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  const catalog=await response.json();
  if(catalog.schema!=='rrfs-zarr-viewer-1'||!Array.isArray(catalog.datasets))throw Error('Invalid catalog schema');
  return {datasets:catalog.datasets,updatedAt:catalog.updated_at||null};
 }finally{if(timeout!==null)clearTimeout(timeout);}
}
function catalogChangesCurrentView(id,previous,next){
 if(!st.ref)return false;
 if(id==='aligned_analysis')return !!st.difference.open;
 const reference=Date.parse(st.ref.init_time),target=reference+st.hour*3600000;
 if(id==='analysis'){
  // A running precipitation/snow total may use observations from cycle init,
  // while shorter native periods and NOHRSC can extend before the init.
  const from=reference-48*3600000;
  const related=data=>data.filter(ds=>{const t=Date.parse(ds.init_time);return t>=from&&t<=target;});
  return catalogSignature(related(previous))!==catalogSignature(related(next));
 }
 const key=cycleKey(st.ref.init_time);
 const related=data=>data.filter(ds=>cycleKey(ds.init_time)===key);
 return catalogSignature(related(previous))!==catalogSignature(related(next));
}
function rebuildCycleDropdown(){
 el.cycleSelect.replaceChildren(...st.cycles.map(c=>{
  const option=new Option(`${fmt(c.init_time)}${c.is_case?' • Case':''}`,c.id);
  if(c.is_case){option.classList.add('case-cycle');option.style.color='#d1a0ff';option.style.fontWeight='700';}
  return option;
 }));
}
function applyPendingCatalogInventory(){
 if(!catalogRefreshState.pending.size)return;
 if(st.rendering||st.exporting||st.difference.saveBusy){
  if(catalogRefreshState.applyTimer===null)
   catalogRefreshState.applyTimer=setTimeout(()=>{catalogRefreshState.applyTimer=null;applyPendingCatalogInventory();},600);
  return;
 }
 if(catalogRefreshState.applyTimer!==null){clearTimeout(catalogRefreshState.applyTimer);catalogRefreshState.applyTimer=null;}
 const updates=[...catalogRefreshState.pending.entries()];catalogRefreshState.pending.clear();
 const oldCycleId=st.ref?.id,wasLatest=oldCycleId===st.cycles[0]?.id;
 let currentViewChanged=false,cyclesChanged=false,analysisChanged=false,alignedChanged=false;
 for(const [id,cat] of updates){
  const source=id==='aligned_analysis'?st.alignedSource:st.sources.get(id);
  const oldDatasets=source?.datasets||[];
  const fingerprint=catalogSignature(cat.datasets);
  if(source&&!source.error&&source._catalogFingerprint===fingerprint)continue;
  currentViewChanged ||=catalogChangesCurrentView(id,oldDatasets,cat.datasets);
  if(id==='aligned_analysis'){
   if(!st.alignedSource)st.alignedSource={id:'aligned_analysis',url:new URL(st.cfg.alignedAnalysisCatalogUrl||'data/catalog_aligned_analysis.json',document.baseURI),datasets:[]};
   st.alignedSource.datasets=cat.datasets;st.alignedSource._catalogFingerprint=fingerprint;
   st.alignedSource.catalogUpdatedAt=cat.updatedAt;alignedChanged=true;
  }else if(source){
   source.datasets=cat.datasets.map(withVirtualWind850).sort((a,b)=>Date.parse(b.init_time)-Date.parse(a.init_time));
   source._catalogFingerprint=fingerprint;source.catalogUpdatedAt=cat.updatedAt;
   delete source.error;
   if(st.modelSetConfig.cycleSourceIds.includes(id))cyclesChanged=true;
   if(id==='analysis')analysisChanged=true;
  }
 }
 if(analysisChanged){st.mrmsAccumCache=null;st.rotationTrackAccumCache=null;st.alignedAccumCache=null;}
 if(cyclesChanged){
  const cycleSources=st.modelSetConfig.cycleSourceIds.map(id=>st.sources.get(id)).filter(Boolean);
  const nextCycles=unionCycles(cycleSources,st.cfg.primarySource||'rrfs');
  // A temporarily blank publication must not erase the working run selector.
  if(nextCycles.length){
   st.cycles=nextCycles;
   const selected=nextCycles.find(c=>c.id===oldCycleId);
   if(!st.runPinned&&wasLatest)st.ref=nextCycles[0];
   else if(selected)st.ref=selected;
   else {st.ref=nextCycles[0];st.runPinned=false;}
   if(st.ref.id!==oldCycleId)currentViewChanged=true;
   rebuildCycleDropdown();refreshHours();syncUI();
  }
 }else if(currentViewChanged){
  // Analysis changes can alter available QPE while forecast catalogs stay put.
  refreshHours();syncUI();
 }
 if(st.ref&&st.sources.has(st.cfg.primarySource))st.primary=st.sources.get(st.cfg.primarySource);
 if(el.dataStatus)el.dataStatus.title='Catalog inventory checked '+new Date().toLocaleTimeString()+'; automatically updates while this tab is open';
 if(currentViewChanged)void renderAll().catch(err=>console.warn('Catalog-triggered redraw failed',err));
 else if(alignedChanged&&st.difference.open)scheduleDifferenceRefresh();
 else schedulePrefetch();
}
async function refreshCatalogInventory({resumed=false,force=false}={}){
 if(!st.cfg||!st.ref||document.hidden||catalogRefreshPeriod()===0)return;
 if(catalogRefreshState.inFlight)return catalogRefreshState.inFlight;
 if(!force&&resumed&&Date.now()-catalogRefreshState.lastChecked<60000)return;
 catalogRefreshState.lastChecked=Date.now();
 const sources=[...st.sources.values()].filter(src=>src.url);
 const targets=sources.map(src=>({id:src.id,url:src.url}));
 // Aligned analyses are optional but should also be discovered later if the
 // publisher had not generated their catalog when the page first loaded.
 if(st.cfg.alignedAnalysisCatalogUrl)
  targets.push({id:'aligned_analysis',url:st.alignedSource?.url||new URL(st.cfg.alignedAnalysisCatalogUrl,document.baseURI)});
 catalogRefreshState.inFlight=(async()=>{
  const changes=await Promise.all(targets.map(async target=>{
   try{
    const result=await fetchInventoryCatalog(target.url);
    const source=target.id==='aligned_analysis'?st.alignedSource:st.sources.get(target.id);
    if(source&&!source.error&&source._catalogFingerprint===catalogSignature(result.datasets))return null;
    return {id:target.id,result};
   }catch(error){
    // Never replace a working catalog with a failed/partially published fetch.
    console.debug('Background catalog check skipped:',target.id,String(error));return null;
   }
  }));
  for(const item of changes)if(item)catalogRefreshState.pending.set(item.id,item.result);
  if(catalogRefreshState.pending.size)applyPendingCatalogInventory();
 })().finally(()=>{catalogRefreshState.inFlight=null;});
 return catalogRefreshState.inFlight;
}
function startCatalogAutoRefresh(){
 // The hourly observation GeoJSON is often republished as more METAR/mPING
 // reports arrive. Re-poll the current/preceding two hours even without
 // changing forecast-hour controls, including after a tab regains focus.
 const observe=()=>{
  if(document.hidden||!observationVisible()||!st.ref)return;
  const age=Date.now()-obsValidDate().getTime();
  if(age>=-60000&&age<2*3600000)void refreshObservationOverlay({preserve:true});
 };
 setInterval(observe,60000);
 window.addEventListener('focus',observe);
 const period=catalogRefreshPeriod();if(!period)return;
 catalogRefreshState.lastChecked=Date.now();
 setInterval(()=>{if(!document.hidden)void refreshCatalogInventory();},period);
 // Background tabs don't poll. Revalidate soon after the user returns, without
 // overlapping checks triggered by both visibilitychange and focus.
 window.addEventListener('focus',()=>{if(!document.hidden)void refreshCatalogInventory({resumed:true});});
}
const VIEWER_RELEASE=String(window.EVU_DOCUMENT_VERSION||'1.2.21');
// Release control is limited to the HTML/application code. It deliberately
// leaves saved localStorage preferences and forecast-data Cache Storage intact.
// The release manifest MUST be published last, after the new index and assets.
const RELEASE_CHECK_INTERVAL_MS=2*60*1000;
let releaseCheckInFlight=null;
function viewerVersionParts(version){
 const match=/^(\d+)\.(\d+)\.(\d+)$/.exec(String(version||''));
 return match?match.slice(1).map(Number):null;
}
function viewerReleaseIsNewer(version){
 const latest=viewerVersionParts(version),current=viewerVersionParts(VIEWER_RELEASE);
 if(!latest||!current)return false;
 for(let i=0;i<3;i++){if(latest[i]!==current[i])return latest[i]>current[i];}
 return false;
}
async function latestViewerRelease(){
 const early=window.EVU_EARLY_RELEASE_RESULT;
 if(early&&Date.now()-early.checkedAt<12000)return early.version;
 const controller=typeof AbortController==='function'?new AbortController():null;
 const timer=controller?setTimeout(()=>controller.abort(),2500):null;
 try{
  // A unique query URL and no-store request avoid local and most shared HTTP
  // caches. The index URL itself is refreshed separately on a new release.
  const response=await fetch(`release.json?__nocache=${Date.now()}`,{
   cache:'no-store',credentials:'same-origin',...(controller?{signal:controller.signal}:{})
  });
  if(!response.ok)return null;
  const manifest=await response.json();
  return viewerVersionParts(manifest?.version)?manifest.version:null;
 }catch(_){return null;}
 finally{if(timer!==null)clearTimeout(timer);}
}
function viewerRefreshUrl(version){
 const address=new URL(location.href);
 if(viewerVersionParts(version))address.searchParams.set('_app',version);
 // Unique navigation also works for a browser that cached index.html under
 // its normal URL. Old _fresh query tokens must never accumulate.
 address.searchParams.set('_fresh',String(Date.now()));
 return address.href;
}
const RELEASE_RELOAD_KEY='omd_evu_release_reload_target';
function reloadViewerFiles(version){
 // Hide the notice *before* navigation, so a slow network response does not
 // leave an apparently inert Load update control on top of the working map.
 if(el.releaseUpdateNotice)el.releaseUpdateNotice.hidden=true;
 if(el.releaseUpdateBtn)el.releaseUpdateBtn.disabled=true;
 if(viewerVersionParts(version))try{sessionStorage.setItem(RELEASE_RELOAD_KEY,version);}catch(_){}
 location.replace(viewerRefreshUrl(version));
}
function showViewerReleaseNotice(version,stale=false){
 if(!el.releaseUpdateNotice)return;
 const attempted=(()=>{try{return sessionStorage.getItem(RELEASE_RELOAD_KEY)===version;}catch(_){return false;}})();
 // A reverse proxy that still serves stale HTML after a forced reload is a
 // deployment problem, not another newly available release. Explain it once
 // instead of continuously offering the same update as if it had succeeded.
 el.releaseUpdateText.textContent=stale||attempted
  ?`Viewer ${version} is published but this page still serves ${VIEWER_RELEASE}. Verify the deployed assets or hard-refresh the page.`
  :`Viewer ${version} is available.`;
 el.releaseUpdateBtn.textContent=stale||attempted?'Retry update':'Load update';
 el.releaseUpdateBtn.disabled=false;
 el.releaseUpdateNotice.hidden=false;
 el.releaseUpdateBtn.onclick=()=>reloadViewerFiles(version);
}
async function checkViewerRelease({startup=false,resumed=false}={}){
 if(releaseCheckInFlight)return releaseCheckInFlight;
 releaseCheckInFlight=(async()=>{
  const version=await latestViewerRelease();
  if(!version)return false;
  if(!viewerReleaseIsNewer(version)){
   // Always clear a prior alert if the installed HTML and published release
   // now agree. This also handles pages resumed from the back/forward cache.
   if(el.releaseUpdateNotice)el.releaseUpdateNotice.hidden=true;
   if(el.releaseUpdateBtn)el.releaseUpdateBtn.disabled=false;
   try{sessionStorage.removeItem(RELEASE_RELOAD_KEY);}catch(_){}
   return false;
  }
  const address=new URL(location.href);
  // On startup or returning to the tab, load an updated version. While the
  // viewer stays in focus, preserve the working map and show an update notice.
  // The _app guard protects against stale HTML and reverse-proxy reload loops.
  if(address.searchParams.get('_app')!==version&&(startup||resumed)){
   reloadViewerFiles(version);
   return true;
  }
  showViewerReleaseNotice(version,address.searchParams.get('_app')===version);
  return false;
 })().finally(()=>{releaseCheckInFlight=null;});
 return releaseCheckInFlight;
}
// An open visible tab checks for releases and shows a noninterrupting notice.
// A tab restored from back-forward cache gets a fresh check as well.
setInterval(()=>{if(!document.hidden)void checkViewerRelease();},RELEASE_CHECK_INTERVAL_MS);
window.addEventListener('pageshow',event=>{if(event.persisted)void checkViewerRelease({resumed:true});});
window.addEventListener('focus',()=>{if(!document.hidden)void checkViewerRelease({resumed:true});});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void checkViewerRelease({resumed:true});});
const TERRAIN_PANEL_STORAGE='omd_evu_terrain_panel_ids_v1_';
function terrainEnabledForPanel(p){return !!(st.terrainEnabled&&st.mode!=='globe'&&p&&!p.cfg?.placeholder&&st.terrainPanelIds.has(p.cfg.id));}
function terrainEnabledForMap(map){return !!(st.terrainEnabled&&st.mode!=='globe'&&map?.__evuTerrainPanelId&&st.terrainPanelIds.has(map.__evuTerrainPanelId));}
function terrainPanelChoicesStored(){
 const available=st.panels.filter(p=>!p.cfg.placeholder).map(p=>p.cfg.id);
 try{const saved=JSON.parse(localStorage.getItem(TERRAIN_PANEL_STORAGE+st.modelSet));
  if(Array.isArray(saved))return new Set(saved.filter(id=>available.includes(id)));}catch(_){}
 // First use preserves the old all-panels behavior; people can choose fewer.
 return new Set(available);
}
function updateTerrainPanelNumbers(){
 const editing=!el.terrainPanelPopup.hidden;
 for(const p of st.panels){if(!p.terrainNumber)continue;
  p.terrainNumber.hidden=!editing;
  p.terrainNumber.dataset.selected=String((st.terrainPanelDraft||st.terrainPanelIds).has(p.cfg.id));
 }
 // In a clean panel-only recording, the focused panel's selector number is
 // a body-level visual aid, not a captured descendant. Keep it positioned.
 window.EVUPanelRecorder?.syncTerrainPortal?.();
}
function closeTerrainPanelPicker(){
 if(el.terrainPanelPopup.hidden)return;
 el.terrainPanelPopup.hidden=true;st.terrainPanelDraft=null;updateTerrainPanelNumbers();
 el.terrainToggleBtn.checked=st.terrainEnabled;
}
function openTerrainPanelPicker(){
 if(st.mode==='globe'){syncTerrainProjectionUI();return;}
 if(!st.panels?.length)return;
 // The map-overlay dropdown is body-positioned and otherwise obscures the
 // numbered plots while the terrain selection is being made.
 if(el.mapLayersMenuPopup&&!el.mapLayersMenuPopup.hidden){
  el.mapLayersMenuPopup.hidden=true;
  el.mapLayersMenuBtn?.setAttribute('aria-expanded','false');
 }
 st.terrainPanelDraft=new Set(st.terrainPanelIds);
 el.terrainPanelChoices.replaceChildren();
 for(const p of st.panels){if(p.cfg.placeholder)continue;
  const label=document.createElement('label');label.className='terrain-panel-choice';
  const input=document.createElement('input');input.type='checkbox';input.checked=st.terrainPanelDraft.has(p.cfg.id);
  input.dataset.panelId=p.cfg.id;input.setAttribute('aria-label',`Terrain on panel ${p.i+1}: ${p.cfg.label||p.cfg.id}`);
  const number=document.createElement('span');number.className='terrain-choice-number';number.textContent=String(p.i+1);
  const caption=document.createElement('span');caption.textContent=p.cfg.label||p.cfg.id;
  label.append(input,number,caption);el.terrainPanelChoices.append(label);
  input.addEventListener('change',()=>{if(input.checked)st.terrainPanelDraft.add(p.cfg.id);else st.terrainPanelDraft.delete(p.cfg.id);updateTerrainPanelNumbers();});
 }
 el.terrainPanelPopup.hidden=false;updateTerrainPanelNumbers();
 el.terrainPanelPopup.scrollIntoView?.({block:'nearest'});
 el.terrainPanelChoices.querySelector('input')?.focus({preventScroll:true});
}
async function redrawTerrainChanged(before,after){
 const changed=st.active.filter(p=>p.map&&(before.has(p.cfg.id)!==after.has(p.cfg.id)));
 if(!changed.length)return;
 if(st.rendering||st.active.some(p=>p.busy)){await renderAll();return;}
 const seq=++st.seq;
 invalidateDifferenceForViewChange();st.rendering=true;
 try{
  // Avoid simultaneous large DEM rebuilds on multi-panel pages. Unaffected
  // panels continue responding, preserving full native field resolution.
  for(const p of changed){if(!p.map)continue;p.save.disabled=true;await renderPanel(p,seq);}
 }finally{st.rendering=false;updateMapBackground();updateLiveGeography();updateStatus();schedulePrefetch();scheduleDifferenceRefresh();}
}
function commitTerrainPanelPicker(){
 if(st.mode==='globe'){closeTerrainPanelPicker();syncTerrainProjectionUI();return;}
 const before=st.terrainEnabled?st.terrainPanelIds:new Set();
 const after=st.terrainPanelDraft||st.terrainPanelIds;
 const modified=!st.terrainEnabled||before.size!==after.size||[...before].some(id=>!after.has(id));
 st.terrainPanelIds=new Set(after);st.terrainEnabled=st.terrainPanelIds.size>0;
 try{localStorage.setItem(TERRAIN_PANEL_STORAGE+st.modelSet,JSON.stringify([...st.terrainPanelIds]));}catch(_){}
 closeTerrainPanelPicker();
 el.terrainToggleBtn.checked=st.terrainEnabled;
 el.terrainPanelsEditBtn.hidden=!st.terrainEnabled;
 el.terrainCredit.hidden=!st.terrainEnabled;
 syncInterpolationControl();
 window.EVUAdvancedMap?.setFieldOpacity(st.imageOpacity,surfaceTerrainField(st.field));
 window.EVUAdvancedMap?.setTerrain(st.terrainEnabled,st.mode,st.terrainPanelIds);
 if(modified)void redrawTerrainChanged(before,st.terrainPanelIds);
}
function disableTerrainPanels(){
 const before=new Set(st.terrainPanelIds);
 closeTerrainPanelPicker();st.terrainEnabled=false;el.terrainToggleBtn.checked=false;
 el.terrainPanelsEditBtn.hidden=true;el.terrainCredit.hidden=true;
 if(el.terrainNotice)el.terrainNotice.hidden=true;
 syncInterpolationControl();window.EVUAdvancedMap?.setTerrain(false,st.mode,st.terrainPanelIds);
 void redrawTerrainChanged(before,new Set());
}
// MapLibre's globe projection has no supported 3-D terrain here. Keep the
// toggle visibly unavailable instead of accepting a state that cannot draw.
function syncTerrainProjectionUI(){
 const globe=st.mode==='globe';
 el.terrainToggleBtn.disabled=globe;
 el.terrainToggleBtn.checked=!globe&&st.terrainEnabled;
 el.terrainPanelsEditBtn.hidden=globe||!st.terrainEnabled;
 el.terrainCredit.hidden=globe||!st.terrainEnabled;
 const label=document.getElementById('terrainOption');
 if(label){
  label.classList.toggle('projection-unavailable',globe);
  label.title=globe?'Terrain is available in 2D map view only':'Toggle 3-D terrain; right-click for terrain opacity, vertical exaggeration and lighting';
 }
 el.terrainToggleBtn.title=globe?'Switch to 2D view to enable terrain':'3-D terrain (2D map view only)';
 if(globe){closeTerrainPanelPicker();if(el.terrainNotice)el.terrainNotice.hidden=true;}
}
function initTerrainPanelControls(){
 el.terrainPanelsAllBtn.addEventListener('click',()=>{for(const p of st.panels)if(!p.cfg.placeholder)st.terrainPanelDraft.add(p.cfg.id);for(const c of el.terrainPanelChoices.querySelectorAll('input'))c.checked=true;updateTerrainPanelNumbers();});
 el.terrainPanelsNoneBtn.addEventListener('click',()=>{st.terrainPanelDraft.clear();for(const c of el.terrainPanelChoices.querySelectorAll('input'))c.checked=false;updateTerrainPanelNumbers();});
 el.terrainPanelsDoneBtn.addEventListener('click',commitTerrainPanelPicker);
 el.terrainPanelsCancelBtn.addEventListener('click',closeTerrainPanelPicker);
 el.terrainPanelsEditBtn.addEventListener('click',openTerrainPanelPicker);
 el.terrainPanelPopup.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();closeTerrainPanelPicker();}});
}
async function boot(){try{
 if(await checkViewerRelease({startup:true}))return;
 el.releaseUpdateDismiss.addEventListener('click',()=>{el.releaseUpdateNotice.hidden=true;});
 if(el.viewerRefreshBtn)el.viewerRefreshBtn.addEventListener('click',()=>reloadViewerFiles());
 st.cfg=await json('config.json');
 const sets=st.cfg.modelSets||[{id:'rrfs-refs',label:'RRFS / REFS',enabled:true}];
 el.modelSetSelect.replaceChildren(...sets.map(set=>{const label=set.id==='ai-models'?'AI / GFS / GEFS':set.label;const o=new Option(set.enabled===false?`${label} (coming soon)`:label,set.id);o.disabled=set.enabled===false;return o;}));
 st.modelSetConfig=resolveModelSetConfig(st.cfg,q.get('set'));
 st.modelSet=st.modelSetConfig.id;
 let savedRatio=10;try{savedRatio=Number(localStorage.getItem('omd_evu_rrfs_slr'))||10;}catch(_){}st.snowRatio=Math.max(5,Math.min(40,savedRatio));
 let savedSnowMethod='weasd';try{savedSnowMethod=localStorage.getItem('omd_evu_gfs_snow_method')||'weasd';}catch(_){}
 st.snowMethod=(q.get('snow')==='precip'||(!q.has('snow')&&savedSnowMethod==='precip'))?'precip':'weasd';
 el.snowMethodWeasd.checked=st.snowMethod==='weasd';el.snowMethodPrecip.checked=st.snowMethod==='precip';
 el.modelSetSelect.value=st.modelSet;
 // All model sets use the same panel/controller/cache code. Only their
 // declarations vary; commonalities never require a second viewer instance.
 st.cfg.panels=st.modelSetConfig.panels;
 st.cfg.primarySource=st.modelSetConfig.primarySource;
 st.cfg.defaultField=st.modelSetConfig.defaultField||st.cfg.defaultField;
 st.cfg.defaultForecastHour=Number(st.modelSetConfig.defaultForecastHour??st.cfg.defaultForecastHour??0);
 el.modelSetSelect.addEventListener('change',()=>location.assign(modelSetSwitchUrl(location.href,el.modelSetSelect.value,st.field,selectedShadingField()).href));
 st.chunkStore=new CompressedZarrStore();void st.chunkStore.open();st.mode=(q.get('map')||st.cfg.display?.mapProjection)==='globe'?'globe':'lambert';el.mapViewSelect.value=st.mode;
 st.mapView=sharedCameraFromQuery();
 // A deep link supplies the camera for its chosen mode, but the alternate
 // projection starts independently and is remembered once it is visited.
 if(st.mapView)st.mapViews[st.mode]=st.mapView;
 let savedTheme=null;try{savedTheme=localStorage.getItem('omd_evu_theme');}catch(_){}
 const sharedTheme=q.get('theme');st.theme=(sharedTheme==='light'||sharedTheme==='dark'?sharedTheme:null)||savedTheme||st.cfg.theme||'dark';setTheme(st.theme,false);
 // Optional 3D and wind advection features are off on first use.
 // Preserve separate preferences without changing 2D/Globe or field defaults.
 // Terrain and wind animation start OFF on every page load, regardless of
 // previous-session enablement. Retain independent appearance preferences.
 st.terrainEnabled=false;
 st.tracersEnabled=false;
 try{localStorage.removeItem('omd_evu_terrain');localStorage.removeItem('omd_evu_wind_tracers');}catch(_){}
 window.EVUAdvancedMap?.configure(st.cfg.display||{});
 window.EVUAdvancedMap?.setTerrainStatusListener((state,detail)=>{
  if(!el.terrainState)return;
  const loaded=state==='ready'||state==='local'||state==='fallback';
  el.terrainState.textContent=state==='ready'?'3-D terrain loaded':state==='loading'?'Loading DEM…':
   state==='globe'?'2D view only':state==='fallback'?'Elevation colors unavailable':state==='error'?'Terrain unavailable':'';
  el.terrainCredit.dataset.state=state;
  el.terrainToggleBtn.title=detail||'3-D terrain: right-click to adjust opacity and vertical exaggeration';
  // Make diagnosis visible directly alongside Terrain; the footer status can
  // be below the fold on narrow/left-hand control layouts.
  if(el.terrainNotice){
   el.terrainNotice.hidden=!st.terrainEnabled||state==='off';
   el.terrainNotice.dataset.state=state;
   const prefix=state==='ready'?'3-D terrain loaded':state==='fallback'?'Colors unavailable':
    state==='loading'?'Loading elevation':state==='globe'?'2D view only':
    state==='error'?'Terrain unavailable':'';
   el.terrainNotice.textContent=prefix+(detail&&state!=='loading'?' — '+detail:'');
   el.terrainNotice.title=detail||prefix;
  }
  // On first DEM tile completion repaint the terrain-safe weather canvases;
  // otherwise they would retain unshaded pixels until the user pans.
  if(state==='ready'&&st.terrainEnabled){
   clearTimeout(st.terrainReadyRedrawTimer);
   st.terrainReadyRedrawTimer=setTimeout(()=>{
    st.terrainReadyRedrawTimer=null;
    for(const p of st.active||[])if(p.mobileScalar&&terrainEnabledForPanel(p))scheduleMobileScalarRedraw(p,40+p.i*25);
   },230);
  }
  if(el.terrainProviderLink){
   const local=state==='local',backup=/AWS Mapzen/i.test(detail||'');
   el.terrainProviderLink.textContent=local?'NCEI ETOPO1':backup?'AWS Mapzen':'Mapterhorn';
   el.terrainProviderLink.href=local?'https://www.ngdc.noaa.gov/mgg/global/':backup?'https://www.mapzen.com/blog/terrain-tile-service/':'https://mapterhorn.com/attribution/';
  }
  // Terrain opacity and Image opacity are independent; never rewrite the forecast slider.
 });
 window.EVUAdvancedMap?.setTheme(st.theme);
 window.EVUAdvancedMap?.setTerrain(st.terrainEnabled,st.mode,st.terrainPanelIds);
 window.EVUAdvancedMap?.setTracers(st.tracersEnabled);
 syncTracerAppearance();
 el.terrainToggleBtn.checked=st.terrainEnabled;el.terrainCredit.hidden=!st.terrainEnabled;
 syncTerrainProjectionUI();
 el.tracersToggleBtn.checked=st.tracersEnabled;
 let savedContours='0';try{savedContours=localStorage.getItem('omd_evu_contours')||'0';}catch(_){}
 st.contours=savedContours==='1';el.contourToggleBtn.checked=st.contours;
 try{st.overlayDewpoint=localStorage.getItem('omd_evu_dewpoint_contours')!=='0';
     st.overlaySpfh=localStorage.getItem('omd_evu_spfh_contours')==='1';
     st.overlayWindSpeed850=localStorage.getItem('omd_evu_wspd850_contours')==='1';}catch(_){}
 let savedMSLP='1';try{savedMSLP=localStorage.getItem('omd_evu_mslp_isobars')??'1';}catch(_){}
 st.overlayMSLP=savedMSLP!=='0';
 let saved850='1';try{saved850=localStorage.getItem('omd_evu_mslp_850temp')??'1';}catch(_){}
 st.overlayMSLP850=saved850!=='0';
 // v1.2.92: Surface weather must start OFF. Earlier releases defaulted ON
 // and could have stored that automatic value. Reset once on upgrade, then
 // honor explicit user choices on subsequent visits.
 st.surfaceWeatherEnabled=false;
 try{
   const defaultOffKey='omd_evu_surface_weather_default_off_v1292';
   if(localStorage.getItem(defaultOffKey)!=='1'){
     localStorage.setItem('omd_evu_surface_weather_enabled','0');
     localStorage.setItem(defaultOffKey,'1');
   }else{
     st.surfaceWeatherEnabled=localStorage.getItem('omd_evu_surface_weather_enabled')==='1';
   }
   const saved=JSON.parse(localStorage.getItem('omd_evu_surface_weather_settings')||'{}');
   for(const key of Object.keys(st.surfaceWeatherSettings))if(typeof saved[key]==='boolean')st.surfaceWeatherSettings[key]=saved[key];
 }catch(_){}
 for(const [id,key] of [['surfaceWeatherCentersBtn','centers'],['surfaceWeatherPressureBtn','pressure'],['surfaceWeatherFrontsBtn','fronts'],['surfaceWeatherTroughsBtn','troughs'],['surfaceWeatherDrylinesBtn','drylines']]){
   if(el[id])el[id].checked=st.surfaceWeatherSettings[key];
 }
 if(el.surfaceWeatherToggleBtn)el.surfaceWeatherToggleBtn.checked=st.surfaceWeatherEnabled;
 // Wind and wave directions are independent overlays. New wave plots start
 // with 10-m barbs ON and wave-direction arrows OFF; saved user changes are
 // respected. Use a new direction preference key so pre-update saved ON
 // choices cannot accidentally override the new default after deployment.
 for(const [key,storage,initial] of [
  ['overlayHeight','omd_evu_height_overlay',true],
  ['overlayUpperWind','omd_evu_upper_wind_overlay',true],
  ['overlaySurfaceWind','omd_evu_surface_wind_overlay',true],
  ['overlayNearSurfaceWind','omd_evu_2m_10m_wind_barbs_v1',false],
  ['overlaySevereWind','omd_evu_severe_wind_overlay',true],
  ['overlayMarineWind','omd_evu_marine_10m_wind_overlay',true],
  ['overlayWaveDirection','omd_evu_wave_direction_overlay_v2',false]]){
  let saved=null;try{saved=localStorage.getItem(storage);}catch(_){}
  st[key]=saved===null?initial:saved==='1';
 }
 let savedControlsPosition='left';try{savedControlsPosition=localStorage.getItem('omd_evu_controls_position')||'left';}catch(_){}
 setControlsPosition(savedControlsPosition,false);
 const pcfg=st.cfg.panels||[{id:'rrfs-main',source:'rrfs',label:'RRFS'}];if(!pcfg.length||pcfg.length>20||pcfg.length>(st.cfg.layout?.maxPanels||20))throw Error('Configure 1–20 panels');
 if(new Set(pcfg.map(x=>x.id)).size!==pcfg.length)throw Error('Panel IDs must be unique');el.viewerGrid.replaceChildren();st.panels=pcfg.map(createPanel);st.terrainPanelIds=terrainPanelChoicesStored();layout();selectPanel(st.panels[0]);
 // Avoid downloading every GFS catalog to the RRFS/REFS viewer (and vice
 // versa). All panel, analysis and forecast-cycle catalogs for this set are
 // loaded once and share the normal in-flight/decoded caches.
 const configuredSources=st.cfg.sources?.length?st.cfg.sources:[{id:'rrfs',label:'RRFS',catalogUrl:'data/catalog.json'}];
 const sources=configuredSources.filter(source=>st.modelSetConfig.sourceIds.has(source.id));
 const results=await Promise.all(sources.map(async s=>{const source={...s,url:new URL(s.catalogUrl||'data/catalog.json',document.baseURI),datasets:[]};try{const cat=await json(source.url.href);if(cat.schema!=='rrfs-zarr-viewer-1'||!Array.isArray(cat.datasets))throw Error('Catalog schema mismatch');source.catalogUpdatedAt=cat.updated_at||null;source._catalogFingerprint=catalogSignature(cat.datasets);source.datasets=cat.datasets.map(withVirtualWind850).sort((a,b)=>Date.parse(b.init_time)-Date.parse(a.init_time));}catch(e){if(s.optionalCatalog&&/HTTP 404\b/.test(String(e))){source.pending=true;console.info(s.id,'Developmental catalog pending initial publication');}else{source.error=String(e);console.warn(s.id,e);}}return source;}));results.forEach(s=>st.sources.set(s.id,s));st.primary=st.sources.get(st.cfg.primarySource)||results.find(s=>s.datasets.length);
 // Separate derived analysis catalog: native analysis stays intact.
 try{const url=new URL(st.cfg.alignedAnalysisCatalogUrl||'data/catalog_aligned_analysis.json',document.baseURI);
  const reply=await fetch(url,{cache:'no-store'});if(!reply.ok)throw Error('HTTP '+reply.status);
  const cat=await reply.json();if(cat.schema!=='rrfs-zarr-viewer-1'||!Array.isArray(cat.datasets))throw Error('Invalid aligned-analysis index');
  st.alignedSource={id:'aligned_analysis',url,datasets:cat.datasets,_catalogFingerprint:catalogSignature(cat.datasets)};
 }catch(err){console.info('Aligned analysis not yet published:',err);}

 st.cycles=unionCycles(results.filter(src=>st.modelSetConfig.cycleSourceIds.includes(src.id)),st.cfg.primarySource||'rrfs');
 if(!st.cycles.length)throw Error('No model cycles found in any configured catalog');
 // Old shared URLs use dataset IDs (e.g. rrfs_20261008_0000). Accept those
 // as well as the new canonical UTC cycle key; no URL parameter -> latest.
 const wanted=q.get('run');st.runPinned=!!wanted;
 const matchedCycle=st.cycles.find(c=>c.id===wanted||c.entries.some(x=>x.ds.id===wanted));
 // Event links must never silently fall back to the latest cycle if the
 // source expires between the browser availability check and navigation.
 // Ordinary shared links retain their established fallback behavior.
 if(wanted&&q.get('event_scene')==='1'&&!matchedCycle)
  throw Error('This experimental Weather Events forecast cycle is no longer published. Open Weather Events and choose another available scene.');
 st.ref=matchedCycle||st.cycles[0];
 // Keep the complete, stable set of known fields selectable. The previous
 // catalog-dependent filter hid new 500-hPa and severe-weather choices until
 // their GRIB/Zarr backfill had been published, making testing impossible.
 // The field's actual per-model/per-hour availability is checked by choose(),
 // and a missing field remains an explicit missing-data panel (not a zero).
 const menu=fieldMenuEntries().filter(entry=>fieldAllowedForModelSet(entry.key,st.modelSet)),ordered=menu.map(entry=>entry.key);
 // Existing bookmarks to the retired dedicated plot become a normal MSLP
 // plot with its track overlay enabled, retaining their selected cycle/hour.
 const legacyTrackLink=q.get('field')==='lowtracks';
 st.field=legacyTrackLink&&ordered.includes('mslp')?'mslp':
  ordered.includes(q.get('field'))?q.get('field'):
  ordered.includes(st.cfg.defaultField)?st.cfg.defaultField:ordered[0];
 let savedTracks=false;
 try{savedTracks=localStorage.getItem('omd_evu_low_tracks_enabled')==='1';}catch(_){}
 st.lowTracksEnabled=legacyTrackLink||
  (q.has('tracks')?q.get('tracks')==='1':savedTracks);
 if(UPPER_AIR_IMAGE_FIELDS[st.field]?.some(([key])=>key===q.get('shade')))
  st.shadedFields.set(st.field,q.get('shade'));
 initializeFieldMenu();
 rebuildCycleDropdown();
 const defaultDelay=Number(st.cfg?.display?.loopIntervalMs??850);
 st.loopSpeedIndex=LOOP_INTERVALS.reduce((best,ms,i)=>Math.abs(ms-defaultDelay)<Math.abs(LOOP_INTERVALS[best]-defaultDelay)?i:best,2);
 if(q.has('speed')){const idx=Number(q.get('speed'));if(Number.isInteger(idx)&&idx>=0&&idx<LOOP_INTERVALS.length)st.loopSpeedIndex=idx;}
 updateSpeedButtons();
 const h=Number(q.get('fhr')??st.cfg.defaultForecastHour??0);st.hour=Number.isInteger(h)&&h>=0?h:0;refreshHours();bind();syncUI();updateSharedLegend();void refreshObservationOverlay();void refreshSPCReports();void refreshLightningReports();void refreshAmountReports();
 ['fieldMenuBtn','fieldMenuPopup','fieldMenuCategories','fieldMenuBranch','fieldMenuBack','fieldMenuBranchTitle','fieldMenuItems','fieldMenuSelected','shareLinkStatus','cycleSelect','fcstSelect','stepBackBtn','stepForwardBtn','playBtn','pauseBtn'].forEach(id=>el[id].disabled=false);syncMobileFrameController();el.saveAllPngBtn.disabled=false;
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
 // Desktop: initialize the complete 3×3 workspace. Compact touch:
 // initialize only visible maps and release offscreen GPU slots on demand.
 void activateConfiguredPanels();
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
 window.addEventListener('resize',()=>{trimMapsForGpuPressure();scanVisible();},{passive:true});
 updateStatus();schedulePrefetch();startCatalogAutoRefresh();
 }catch(e){console.error(e);el.dataStatus.textContent='Viewer initialization failed: '+String(e);if(!st.panels.length)el.viewerGrid.textContent='Initialization failed: '+String(e);else st.panels.forEach(p=>setNote(p,'Initialization failed: '+String(e)));}}
// IntersectionObserver notifications can arrive during a render. Desktop
// fills all configured map slots; compact touch devices only initialize maps
// close to the viewport, never the nine offscreen contexts at startup.
async function activateConfiguredPanels(){
 const candidates=st.panels.filter(p=>!p.cfg.placeholder);
 const mobile=touchGraphicsDevice();
 const order=mobile?candidates.filter(nearViewport):
  [...candidates.filter(nearViewport),...candidates.filter(p=>!nearViewport(p))];
 for(const p of order){
  if(p.map||p.cfg.placeholder)continue;
  if(mapCapacity()<candidates.length&&!nearViewport(p))continue;
  if(st.active.length>=mapCapacity()&&!p.map)continue;
  try{await activate(p,'startup');}
  catch(e){fail(p,e);}
 }
}
async function waitLibraries(){
 for(let k=0;k<100;k++){
  if(window.maplibregl?.Map&&window.apgl?.RawScalarField&&window.apgl?.PlotLayer){
   if(typeof maplibregl.setWorkerUrl!=='function'||!window.EVU_MAPLIBRE_V6)
    throw Error('MapLibre 6 ES module runtime unavailable; install vendor-v6 with update_maplibre_vendor_v6.py.');
   // The active ES bootstrap sets the self-hosted v6 worker URL before startup.
   const runtimeVersion=String(maplibregl.getVersion?.()||maplibregl.version||'');
   // The ES-module bootstrap already verifies v6's required exports. Some
   // vendored ESM builds omit the optional `version` string entirely.
   if(runtimeVersion&&!/^6\./.test(runtimeVersion))
    console.warn('Unexpected MapLibre runtime '+runtimeVersion+'; the viewer targets MapLibre 6.');
   if(typeof maplibregl.supported==='function'&&!maplibregl.supported())
    throw Error('MapLibre reports WebGL unavailable. See renderer-diagnostics.html for GPU/browser checks.');
   // Optional installer manifest verifies all packed worker assets are accessible.
   // An optional manifest from the site-specific autumnplot installer may be present; old installs are supported.
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
 throw Error('Required MapLibre 6 or autumnplot-gl libraries missing. Install self-hosted vendor-v6 assets using update_maplibre_vendor_v6.py and retain autumnplot-gl runtime assets. See renderer-diagnostics.html.');
}
// Accessible single-button field selector. A body-level popup avoids clipping
// when the desktop controls are oriented vertically. Groups and fields are
// constructed from the complete stable menu, independent of current catalogs.
const fieldMenuUI={open:false,activeGroup:null,snowfall:false,hoverTimer:null};
const fieldMenuIsCompact=()=>window.matchMedia('(max-width:800px), (pointer:coarse)').matches;
function initializeFieldMenu(){
 const categories=FIELD_MENU_GROUPS.filter(group=>(group.key!=='marine'||st.modelSet==='gfs-versions')&&group.fields.some(f=>fieldAllowedForModelSet(f.key,st.modelSet))).map(group=>{
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
  if(currentGroup==='snow'&&fieldMenuUI.snowfall){openFieldMenuBranch('snow',true);return;}
  clearFieldMenuBranch();
  (el.fieldMenuCategories.querySelector('.field-menu-category[data-group="'+(currentGroup||fieldGroupFor(st.field)?.key||'radar')+'"]')||categories[0])?.focus();
 };
 el.fieldMenuBtn.addEventListener('click',()=>fieldMenuUI.open?closeFieldMenu():openFieldMenu());
 // Shared snow-to-liquid ratio for GFS and RRFS/REFS accumulation products.
 // Input updates the numeric readout immediately; change redraws only once
 // to avoid expensive full-GPU refreshes while dragging the slider.
 el.snowRatioSlider.addEventListener('input',()=>{
  el.snowRatioValue.textContent=Number(el.snowRatioSlider.value).toFixed(1)+':1';
 });
 el.snowRatioSlider.addEventListener('change',()=>{
  const ratio=Number(el.snowRatioSlider.value);
  if(!Number.isFinite(ratio))return;
  st.snowRatio=Math.max(5,Math.min(40,ratio));
  try{localStorage.setItem('omd_evu_rrfs_slr',String(st.snowRatio));}catch(_){}
  st.displayCache.clear();st.displayCacheBytes=0;
  for(const panel of st.panels)panel.lastKey=null;
  syncUI();void renderAll();
 });
 el.fieldMenuBtn.addEventListener('contextmenu',event=>{
  if(!isAdjustableSnow(st.field))return;
  event.preventDefault();el.snowRatioSlider?.focus();
 });

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
 fieldMenuUI.activeGroup=null;fieldMenuUI.snowfall=false;
 el.fieldMenuBranch.hidden=true;
 el.fieldMenuPopup.classList.remove('is-drilled');
 el.fieldMenuCategories.querySelectorAll('.field-menu-category').forEach(button=>{
  button.setAttribute('aria-expanded','false');button.classList.remove('is-active');
 });
}
function openFieldMenuBranch(groupKey,focusField=false,showSnowfall=false){
 const group=FIELD_MENU_GROUPS.find(g=>g.key===groupKey);
 if(!group||!fieldMenuUI.open)return;
 fieldMenuUI.activeGroup=group.key;fieldMenuUI.snowfall=groupKey==='snow'&&showSnowfall;
 el.fieldMenuBranch.hidden=false;
 el.fieldMenuBranchTitle.textContent=group.label+(fieldMenuUI.snowfall?' › Snowfall':'');
 el.fieldMenuBranch.setAttribute('aria-label',group.label+' fields');
 // The snowfall branch is nested inside Winter weather, and is reachable
 // both by mouse and touch. Existing stable field keys/deep links do not change.
 const snowfallKeys=new Set(['snow1h','snow3h','snow6h','snow24h','snow48h','asnow',...GFS_SNOW_KEYS,...RRFS_SNOW_KEYS]);
 const eligible=group.fields.filter(field=>fieldAllowedForModelSet(field.key,st.modelSet));
 const snowEntries=eligible.filter(field=>snowfallKeys.has(field.key));
 const visible=groupKey!=='snow'?eligible:fieldMenuUI.snowfall?snowEntries:eligible.filter(field=>!snowfallKeys.has(field.key));
 const extra=[];
 if(groupKey==='snow'){
  const branch=document.createElement('button');branch.type='button';branch.className='field-menu-item';branch.setAttribute('role','menuitem');
  branch.textContent=fieldMenuUI.snowfall?'‹ Back to Winter weather':'Snowfall ›';
  branch.addEventListener('click',()=>openFieldMenuBranch('snow',true,!fieldMenuUI.snowfall));
  extra.push(branch);
 }
 el.fieldMenuItems.replaceChildren(...extra,...visible.map(field=>{

  const item=document.createElement('button');item.type='button';item.className='field-menu-item';
  item.setAttribute('role','menuitemradio');item.setAttribute('aria-checked',String(field.key===st.field));
  item.dataset.field=field.key;
  const label=document.createElement('span');label.textContent=field.label;
  const check=document.createElement('span');check.className='field-menu-check';check.setAttribute('aria-hidden','true');check.textContent=field.key===st.field?'✓':'';
  item.append(label,check);
  item.addEventListener('click',()=>chooseFieldMenuField(group.key,field.key));
  item.addEventListener('contextmenu',event=>{if(!isAdjustableSnow(field.key))return;event.preventDefault();chooseFieldMenuField(group.key,field.key);el.fieldMenuBtn.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));});

  return item;
 }));
 // Changing menu levels must start at the top, not retain the scroll offset
 // of the previous Winter weather or Snowfall list.
 el.fieldMenuItems.scrollTop=0;
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
 // A long Winter Weather branch must stay inside the viewport, with its
 // items scrolling INSIDE its border instead of overflowing past Snow density.
 if(!compact){
  const branchHeight=Math.min(window.innerHeight*.76,530);
  el.fieldMenuBranch.style.top=Math.min(-1,Math.max(8-y,window.innerHeight-y-branchHeight-8))+'px';
 }else el.fieldMenuBranch.style.top='';
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
function interpolationPreferenceKey(field=st.field,modelSet=st.modelSet){
 if(modelSet!=='gfs-versions')return 'omd_evu_interpolate';
 return MARINE_FIELDS.has(field)?'omd_evu_interpolate_gfs_marine':'omd_evu_interpolate_gfs';
}
function preferredInterpolation(field=st.field,modelSet=st.modelSet){
 let saved=null;
 try{saved=localStorage.getItem(interpolationPreferenceKey(field,modelSet));}catch(_){}
 // New marine and RRFS/REFS preferences default OFF. GFS atmospheric
 // continuous fields keep their previous default ON.
 return modelSet==='gfs-versions'&&!MARINE_FIELDS.has(field)?saved!=='0':saved==='1';
}
function terrainLocksInterpolation(){return !!st.terrainEnabled&&st.mode!=='globe';}
function effectiveInterpolation(){return terrainLocksInterpolation()||st.interpolate;}
function syncInterpolationControl(){
 if(!el.interpolateToggleBtn)return;
 const locked=terrainLocksInterpolation();
 el.interpolateToggleBtn.checked=effectiveInterpolation();
 el.interpolateToggleBtn.disabled=locked;
 el.interpolateToggleBtn.title=locked?
  'Smooth interpolation is required for terrain-draped display. Disable Terrain to edit your saved interpolation preference.':
  'Toggle smooth interpolation (categorical precipitation types always stay discrete).';
}
function syncInterpolationPreference(){
 st.interpolate=preferredInterpolation();
 syncInterpolationControl();
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
  if(fieldMenuUI.activeGroup==='snow'&&fieldMenuUI.snowfall){event.preventDefault();openFieldMenuBranch('snow',true);return;}
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
 if(el.snowRatioControl){el.snowRatioControl.hidden=!isAdjustableSnow(st.field);el.snowRatioSlider.value=String(activeSnowRatio(st.field));el.snowRatioValue.textContent=activeSnowRatio(st.field).toFixed(1)+':1';}
 if(el.snowMethodControl){el.snowMethodControl.hidden=!(gfsSnowSpec(st.field)?.method==='slr10');document.getElementById('snowMethodLabel').textContent=st.modelSet==='gfs-versions'?'GFS snowfall method':'RRFS/REFS snowfall method';}
 const group=fieldGroupFor(st.field),field=group?.fields.find(x=>x.key===st.field);
 el.fieldMenuSelected.textContent=field?.label||FIELDS[st.field]?.label||'Choose field';
 el.fieldMenuBtn.title=(group?.label?group.label+' · ':'')+el.fieldMenuSelected.textContent+(isAdjustableSnow(st.field)?' · Adjust SLR using the slider below':'');
 if(fieldMenuUI.open&&fieldMenuUI.activeGroup){
  el.fieldMenuItems.querySelectorAll('.field-menu-item').forEach(item=>{
   const selected=item.dataset.field===st.field;item.setAttribute('aria-checked',String(selected));
   const check=item.querySelector('.field-menu-check');if(check)check.textContent=selected?'✓':'';
  });
 }
}
function timelineVariables(ref=st.ref){
 if(!ref||!st.field)return [];
 const image=selectedShadingField();
 return ref.entries.map(({ds})=>(ds.variables||[]).find(v=>v.name===(image==='refc_ptype'?'refc':gfsSnowSource(image,ds.model)|| (snowAccumulationHours(image)?'asnow':precipitationAccumulationHours(image)?'apcp':image)))).filter(Boolean);
}
// Virtual fields must use their actual stored inputs. In particular, there is
// no Zarr variable named refc_ptype; treating it as native made the hour menu
// say "missing" and skipped every hour when the arrow keys were pressed.
function availableHours(){
 if(!st.ref||!st.field)return [];
 const field=selectedShadingField(),snowSpec=gfsSnowSpec(field),window=snowAccumulationHours(field)||precipitationAccumulationHours(field)||snowSpec?.period||0;
 const available=new Set();
 for(const {ds} of st.ref.entries){
  const nativeName=field==='refc_ptype'?'refc':gfsSnowSource(field,ds.model)||(snowAccumulationHours(field)?'asnow':precipitationAccumulationHours(field)?'apcp':field);
  if(snowSpec?.method==='slr10'&&st.snowMethod==='precip'&&isGfsV16(ds.model))continue;
  const v=ds.variables?.find(x=>x.name===nativeName);
  if(!v)continue;
  const hours=new Set(v.available_hours||[]);
  const ptype=field==='refc_ptype'?ds.variables?.find(x=>x.name==='ptype'):null;
  const ptypeHours=new Set(ptype?.available_hours||[]);
  for(const h of hours){
   if(field==='refc_ptype'&&(!ptypeHours.has(h)||ptype.shape?.[1]!==v.shape?.[1]||ptype.shape?.[2]!==v.shape?.[2]))continue;
   if(snowSpec){
    if(!h||h<window)continue;
    if((snowSpec.method==='depthChange'||gfsUsesSweChange(field,ds.model))&&!hours.has(window?h-window:0))continue;
    if(snowSpec.method==='slr10'&&!gfsUsesSweChange(field,ds.model)&&window&&h>window&&!hours.has(h-window))continue;
   }else if(window&&(h<window||(h>window&&!hours.has(h-window))))continue;
   available.add(h);
  }
 }
 return [...available].sort((a,b)=>a-b);
}
function forecastHourChoices(ref=st.ref){
 if(!ref)return [0];
 const vars=timelineVariables(ref);
 const count=Math.max(1,...vars.map(v=>v.shape?.[0]||0),...ref.entries.flatMap(({ds})=>(ds.variables||[]).map(v=>v.shape?.[0]||0)));
 const step=st.modelSetConfig?.forecastHourStep || (st.modelSet==='gfs-versions'?3:1);
 const ceiling=Number(st.modelSetConfig?.maxForecastHour);
 const finalCount=Number.isFinite(ceiling)&&ceiling>=0?Math.min(count,ceiling+1):count;
 return Array.from({length:Math.ceil(finalCount/step)},(_,i)=>i*step);
}
function refreshHours(){
 const hours=forecastHourChoices(),available=new Set(availableHours());
 el.fcstSelect.replaceChildren(...hours.map(h=>new Option(`F${pad3(h)}${available.has(h)?'':' · missing'}`,h)));
 if(!hours.includes(st.hour))st.hour=hours.reduce((best,h)=>Math.abs(h-st.hour)<Math.abs(best-st.hour)?h:best,hours[0]);
}
// Arrow-key cycle navigation holds the *valid UTC instant*, not the lead.
// Cycle lists are sorted newest to oldest: Up selects newer, Down older.
// Scan past cycles that cannot represent this instant (e.g. a negative lead,
// an off-cadence lead, or one beyond their published forecast-hour menu).
// Never silently round the lead: that would change the time being compared.
function findCycleAtValidTime(direction){
 if(!st.ref||!st.cycles?.length)return null;
 const current=st.cycles.indexOf(st.ref);
 const validMs=Date.parse(st.ref.init_time)+Number(st.hour)*3600000;
 if(current<0||!Number.isFinite(validMs)||(direction!==-1&&direction!==1))return null;
 for(let i=current+direction;i>=0&&i<st.cycles.length;i+=direction){
  const ref=st.cycles[i],initMs=Date.parse(ref.init_time);
  if(!Number.isFinite(initMs))continue;
  const lead=(validMs-initMs)/3600000;
  if(!Number.isInteger(lead)||lead<0)continue;
  if(!forecastHourChoices(ref).includes(lead))continue;
  return {ref,hour:lead};
 }
 return null;
}
function changeCycleAtValidTime(direction){
 const selected=findCycleAtValidTime(direction);
 if(!selected)return false;
 st.runPinned=true;
 st.ref=selected.ref;
 st.hour=selected.hour;
 refreshHours();
 syncUI();
 void renderAll();
 return true;
}
function syncMobileFrameController(){
 const playButton=el.mobilePlayPauseBtn;
 if(!playButton)return;
 const enabled=Boolean(st.ref&&playbackHours().length);
 el.mobileStepBackBtn.disabled=!enabled;
 el.mobileStepForwardBtn.disabled=!enabled;
 playButton.disabled=!enabled;
 const playing=Boolean(st.playing);
 playButton.textContent=playing?'Ⅱ':'▶';
 playButton.classList.toggle('is-playing',playing);
 playButton.setAttribute('aria-pressed',String(playing));
 playButton.setAttribute('aria-label',playing?'Pause forecast animation':'Play forecast animation');
 playButton.title=playing?'Pause forecast animation':'Play forecast animation';
 el.mobileFrameLabel.textContent=enabled?'F'+pad3(st.hour):'F---';
 const initTime=Date.parse(st.ref?.init_time||'');
 const when=Number.isFinite(initTime)&&Number.isFinite(Number(st.hour))
  ?new Date(initTime+Number(st.hour)*3600000):null;
 el.mobileFrameValidLabel.textContent=when?'Valid '+when.toISOString().slice(5,16).replace('T',' ')+'Z':'Valid UTC';
}
function syncUI(){
 syncTerrainProjectionUI();
 syncImageFieldChoices();
 // A field change may cross between GFS atmospheric and marine fields.
 // Refresh the display interpolation preference before rendering the new field.
 syncInterpolationPreference();
 updateContourControl();updateLiveGeography();
 syncFieldMenus();el.cycleSelect.value=st.ref.id;el.fcstSelect.value=String(st.hour);el.mapViewSelect.value=st.mode;syncMobileFrameController();
 try{const u=new URL(location.href);
  // An automatically chosen latest cycle is NOT pinned into the address bar:
  // reloading the normal viewer URL should discover tomorrow's newest run.
  if(st.runPinned)u.searchParams.set('run',st.ref.id);else u.searchParams.delete('run');
  u.searchParams.set('field',st.field);u.searchParams.set('fhr',st.hour);u.searchParams.set('map',st.mode);
  if(st.lowTracksEnabled)u.searchParams.set('tracks','1');
  else if(u.searchParams.has('tracks'))u.searchParams.set('tracks','0');
  if(selectedShadingField()!==st.field)u.searchParams.set('shade',selectedShadingField());else u.searchParams.delete('shade');
  if(gfsSnowSpec(st.field)?.method==='slr10')u.searchParams.set('snow',st.snowMethod);else u.searchParams.delete('snow');
  history.replaceState(null,'',u);
 }catch(_){}
}
function shareUrl(){
 const u=new URL(location.href);
 u.searchParams.set('run',st.ref.id);u.searchParams.set('field',st.field);
 if(selectedShadingField()!==st.field)u.searchParams.set('shade',selectedShadingField());else u.searchParams.delete('shade');
 u.searchParams.set('fhr',st.hour);u.searchParams.set('map',st.mode);
 u.searchParams.set('tracks',st.lowTracksEnabled?'1':'0');
 if(gfsSnowSpec(st.field)?.method==='slr10')u.searchParams.set('snow',st.snowMethod);else u.searchParams.delete('snow');
 u.searchParams.set('theme',st.theme);u.searchParams.set('speed',st.loopSpeedIndex);
 setCameraUrlParams(u,currentSharedCamera());
 return u.href;
}
// Map overlays live in a body-level popup so the desktop left toolbar and
// mobile controls never clip the expanded layer list. Original DOM checkboxes
// are retained: each continues to use the existing change/contextmenu handlers.
function setupMapLayersMenu(){
 const trigger=el.mapLayersMenuBtn,popup=el.mapLayersMenuPopup;
 if(!trigger||!popup)return;
 const close=(restoreFocus=false)=>{
  popup.hidden=true;trigger.setAttribute('aria-expanded','false');
  if(restoreFocus)trigger.focus();
 };
 const position=()=>{
  if(popup.hidden)return;
  const rect=trigger.getBoundingClientRect();
  const width=Math.min(340,Math.max(220,window.innerWidth-16));
  const left=Math.max(8,Math.min(rect.left,window.innerWidth-width-8));
  popup.style.width=width+'px';popup.style.left=Math.round(left)+'px';
  // Keep all options reachable on phones or with the left-hand toolbar.
  const height=Math.min(popup.scrollHeight,window.innerHeight-16);
  popup.style.top=Math.round(rect.bottom+8+height<=window.innerHeight-8?
    rect.bottom+8:Math.max(8,rect.top-height-8))+'px';
 };
 trigger.addEventListener('click',()=>{
  if(!popup.hidden){close();return;}
  popup.hidden=false;trigger.setAttribute('aria-expanded','true');position();
 });
 document.addEventListener('pointerdown',event=>{
  if(!popup.hidden&&!popup.contains(event.target)&&!trigger.contains(event.target))close();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!popup.hidden){event.preventDefault();event.stopPropagation();close(true);}
 },true);
 // Do not close on checkbox changes or right-click styling. Support scroll
 // and window resizes while a popup is open.
 window.addEventListener('resize',position);
 document.addEventListener('scroll',position,true);
}
function bind(){
 installShiftDragSuspension();
 setupMapLayersMenu();
 bindDifferenceControls();
 bindLegendRangeControls();
 for(const input of [el.snowMethodWeasd,el.snowMethodPrecip])input.addEventListener('change',()=>{
  if(!input.checked)return;st.snowMethod=input.value==='precip'?'precip':'weasd';
  try{localStorage.setItem('omd_evu_gfs_snow_method',st.snowMethod);}catch(_){}
  closeLegendRangeEditor();refreshHours();syncUI();updateSharedLegend();void renderAll();
 });
 // Deliberate input, rather than passive mouse movement, reduces speculation.
 for(const type of ['pointerdown','wheel','keydown','touchstart'])document.addEventListener(type,markUserActivity,{passive:true});el.mobileControlsBtn.onclick=()=>{const opened=el.mobileControlsBtn.getAttribute('aria-expanded')!=='true';el.mobileControlsBtn.setAttribute('aria-expanded',String(opened));el.mobileControlsBtn.title=opened?'Hide viewer controls':'Show viewer controls';el.mobileControlsBtn.innerHTML=opened?'☷ Controls <span class="collapse-indicator" aria-hidden="true">▴</span>':'☷ Controls <span class="collapse-indicator" aria-hidden="true">▾</span>';document.getElementById('viewerControls').classList.toggle('is-open',opened);requestAnimationFrame(layout);};el.cycleSelect.onchange=()=>{st.runPinned=true;st.ref=st.cycles.find(x=>x.id===el.cycleSelect.value)||st.ref;refreshHours();syncUI();renderAll();};el.fcstSelect.onchange=()=>{const next=Number(el.fcstSelect.value);if(next!==st.hour)st.prefetchDirection=next<st.hour?-1:1;st.hour=next;syncUI();renderAll();};el.stepBackBtn.onclick=()=>step(-1);el.stepForwardBtn.onclick=()=>step(1);el.playBtn.onclick=play;el.pauseBtn.onclick=stop;el.mobileStepBackBtn.onclick=()=>step(-1);el.mobileStepForwardBtn.onclick=()=>step(1);el.mobilePlayPauseBtn.onclick=()=>st.playing?stop():play();el.speedDownBtn.onclick=()=>changeSpeed(-1);el.speedUpBtn.onclick=()=>changeSpeed(1);
 for(const [source,input] of [['synoptic',el.obsSynoptic],['mping',el.obsMping]]){
  let stored=null;try{stored=localStorage.getItem('omd_evu_obs_'+source);}catch(_){}
  st.obsEnabled[source]=stored!=='0';input.checked=st.obsEnabled[source];
  input.onchange=()=>{st.obsEnabled[source]=input.checked;
   try{localStorage.setItem('omd_evu_obs_'+source,input.checked?'1':'0');}catch(_){}
   syncAllObservationPanels();};
 }
 for(const [source,input] of [['cocorahs',el.amountReportsCocorahs],['metar',el.amountReportsMetar]]){
  if(!input)continue;
  let saved=null;try{saved=localStorage.getItem('omd_evu_amount_reports_'+source);}catch(_){}
  st.amountReportEnabled[source]=saved!=='0';input.checked=st.amountReportEnabled[source];
  input.onchange=()=>{st.amountReportEnabled[source]=input.checked;
    try{localStorage.setItem('omd_evu_amount_reports_'+source,input.checked?'1':'0');}catch(_){}
    void refreshAmountReports();};
 }
 let opacitySaved=null;try{opacitySaved=localStorage.getItem('omd_evu_image_opacity');}catch(_){}
 st.imageOpacity=opacitySaved===null?1:Math.max(0,Math.min(1,Number(opacitySaved)||0));
 st.imageOpacityReady=true;
 window.EVUAdvancedMap?.setFieldOpacity(st.imageOpacity,surfaceTerrainField(st.field));
 el.imageOpacity.value=String(Math.round(st.imageOpacity*100));el.imageOpacityLabel.textContent=`${Math.round(st.imageOpacity*100)}%`;
 // Image opacity is a user preference. Toggling Terrain must never change
 // this slider or overwrite its saved value; new sessions default to 100%.
 el.imageOpacity.addEventListener('input',()=>{el.imageOpacityLabel.textContent=`${el.imageOpacity.value}%`;if(st.difference.liveCanvas)st.difference.liveCanvas.style.opacity=String(Number(el.imageOpacity.value)/100);});
 el.imageOpacity.addEventListener('change',()=>{
  st.imageOpacity=Math.max(0,Math.min(1,Number(el.imageOpacity.value)/100));
  window.EVUAdvancedMap?.setFieldOpacity(st.imageOpacity,surfaceTerrainField(st.field));
  try{localStorage.setItem('omd_evu_image_opacity',String(st.imageOpacity));}catch(_){}
  let needsLegacy=false;
  for(const p of st.panels){
   if(p.status==='ready'&&p.mobileScalar)scheduleMobileScalarRedraw(p,0);
   else if(p.status==='ready'&&typeof p.layer?.setOpacity==='function')p.layer.setOpacity(st.imageOpacity,p.map);
   else if(p.status==='ready')needsLegacy=true;
  }
  if(needsLegacy){for(const p of st.panels)p.lastKey=null;void renderAll();}
 });
 // GFS atmospheric fields default to smooth shading, but wave height
 // and period fields default to their native (noninterpolated) grid.
 // The marine setting is independently persisted so changing it cannot
 // unexpectedly change the atmospheric or RRFS/REFS settings.
 syncInterpolationPreference();
 el.interpolateToggleBtn.addEventListener('change',()=>{
  if(terrainLocksInterpolation()){syncInterpolationControl();return;}
  st.interpolate=el.interpolateToggleBtn.checked;
  try{
   localStorage.setItem(interpolationPreferenceKey(),st.interpolate?'1':'0');
  }catch(_){}
  // Change the sampler parameters on the existing GPU textures directly.
  // Re-uploading the same field is unnecessary: WGLTexture.setImageData()
  // does not update TEXTURE_MAG_FILTER/TEXTURE_MIN_FILTER on an existing
  // texture. No Zarr fetch, decode, data upload, or map rebuild is needed.
  for(const p of st.panels){
   if(!p.map||p.status!=='ready')continue;
   if(typeof p.layer?.setInterpolation==='function')p.layer.setInterpolation(st.interpolate,p.map);
   else if(p.component&&p.interpolationEligible)applyRasterInterpolationFilter(p.component,p);
  }
 });
 let spcSaved=null;try{spcSaved=localStorage.getItem('omd_evu_spc_overlay');}catch(_){}
 st.spcEnabled=spcSaved==='1';el.spcToggleBtn.checked=st.spcEnabled;
 el.spcToggleBtn.addEventListener('change',()=>{
  st.spcEnabled=el.spcToggleBtn.checked;try{localStorage.setItem('omd_evu_spc_overlay',st.spcEnabled?'1':'0');}catch(_){}
  void refreshSPCReports();
 });
 let lightningSaved=null;try{lightningSaved=localStorage.getItem('omd_evu_lightning_overlay');}catch(_){}
 st.lightningEnabled=lightningSaved==='1';el.lightningToggleBtn.checked=st.lightningEnabled;
 el.lightningToggleBtn.addEventListener('change',()=>{
  st.lightningEnabled=el.lightningToggleBtn.checked;
  el.lightningLegend.hidden=!st.lightningEnabled;
  try{localStorage.setItem('omd_evu_lightning_overlay',st.lightningEnabled?'1':'0');}catch(_){}
  void refreshLightningReports();
 });
 for(const id of ['userGuideClose','userGuideDone'])el[id].onclick=()=>el.userGuideDialog.close();
 for(const id of ['shortcutsClose','shortcutsDone'])el[id].onclick=()=>el.shortcutsDialog.close();
 el.shortcutsBtn.onclick=()=>el.shortcutsDialog.showModal();
 el.shortcutsDialog.addEventListener('click',event=>{if(event.target===el.shortcutsDialog)el.shortcutsDialog.close();});
 initTerrainPanelControls();
 el.terrainToggleBtn.addEventListener('change',()=>{
  if(st.mode==='globe'){syncTerrainProjectionUI();return;}
  if(el.terrainToggleBtn.checked)openTerrainPanelPicker();
  else disableTerrainPanels();
 });
 el.tracersToggleBtn.addEventListener('change',()=>{
  if(!tracerComponentNames(st.field)){el.tracersToggleBtn.checked=false;return;}
  st.tracersEnabled=el.tracersToggleBtn.checked;
  window.EVUAdvancedMap?.setTracers(st.tracersEnabled);
  for(const p of st.active){
   if(st.tracersEnabled&&tracerComponentNames(p.cfg?.field||st.field)&&p.ds&&p.status==='ready')void prepareWindTracers(p,p.ds,p.h,st.seq);
   else if(!st.tracersEnabled)window.EVUAdvancedMap?.setVectors(p,null,null);
  }
 });
 el.userGuideBtn.onclick=()=>el.userGuideDialog.showModal();
 el.userGuideDialog.addEventListener('click',event=>{if(event.target===el.userGuideDialog)el.userGuideDialog.close();});
 setupOverlayStyleControls();
 el.mapViewSelect.onchange=()=>switchProjection(el.mapViewSelect.value);
 for(const [control,key] of [[el.dewpointToggleBtn,'overlayDewpoint'],[el.spfhToggleBtn,'overlaySpfh']]){
  if(!control)continue;
  control.addEventListener('change',()=>{
   st[key]=control.checked;
   try{localStorage.setItem(key==='overlayDewpoint'?'omd_evu_dewpoint_contours':'omd_evu_spfh_contours',control.checked?'1':'0');}catch(_){}
   for(const p of st.active||[]){
    if(p.status==='ready'&&p.ds&&p.map&&isMoistureUpperField(p.cfg?.field||st.field))
     void prepareUpperAirMoistureContours(p,p.ds,p.h,st.seq);
    else scheduleContourRedraw(p);
   }
  });
 }
 // Independent 850-hPa wind-speed contours: selecting a different shaded
 // image never removes or disables this checkbox (nor wind barbs).
 if(el.windSpeedToggleBtn)el.windSpeedToggleBtn.addEventListener('change',()=>{
  st.overlayWindSpeed850=el.windSpeedToggleBtn.checked;
  try{localStorage.setItem('omd_evu_wspd850_contours',st.overlayWindSpeed850?'1':'0');}catch(_){}
  for(const p of st.active||[]){
   if(st.overlayWindSpeed850&&p.status==='ready'&&p.ds&&p.map&&st.field==='t850')
    void prepareWindSpeed850Contours(p,p.ds,p.h,st.seq);
   else{updatePanelPlotTitle(p);scheduleContourRedraw(p);}
  }
 });
 el.contourToggleBtn.onchange=()=>{
  const mslp=st.field==='mslp';
  if(mslp){st.overlayMSLP=el.contourToggleBtn.checked;try{localStorage.setItem('omd_evu_mslp_isobars',st.overlayMSLP?'1':'0');}catch(_){}}
  else{st.contours=el.contourToggleBtn.checked;try{localStorage.setItem('omd_evu_contours',st.contours?'1':'0');}catch(_){}}
  for(const p of st.panels){
   if(st.contours&&UPPER_AIR_IMAGE_FIELDS[st.field]&&p.ds&&p.h!==null&&p.status==='ready')
    void preparePrimaryUpperAirContours(p,p.ds,p.h,st.seq);
   updatePanelPlotTitle(p);scheduleContourRedraw(p);
  }
 };
 // Toggle independently of MSLP shading, isobars and surface-weather
 // analysis. OFF is the first-use default to avoid unexpected network work.
 el.lowTracksToggleBtn.onchange=()=>{
  st.lowTracksEnabled=el.lowTracksToggleBtn.checked;
  try{localStorage.setItem('omd_evu_low_tracks_enabled',st.lowTracksEnabled?'1':'0');}catch(_){}
  for(const p of st.panels){
   if(!st.lowTracksEnabled||!lowTracksAvailableForField()){
    window.EVULowTracks?.remove?.(p);p.lowTrackResult=null;updateLowTrackPanelStatus(p,null);
   }else if(p.map&&p.status==='ready'&&!p.cfg?.differencePanel){
    p.lowTrackResult=null;
    void syncLowTrackOverlay(p,st.seq);
   }
  }
  updateLowTracksStatus();
  // Preserve the display overlay in shareable URLs without changing the
  // weather field, cycle or forecast hour.
  syncUI();
 };
 // Surface-weather feature controls are shared by all model maps, rather than
 // allocating independent controls to each panel (including mobile pages).
 const surfaceWeatherChange=()=>{
   st.surfaceWeatherEnabled=!!el.surfaceWeatherToggleBtn.checked;
   for(const [id,key] of [['surfaceWeatherCentersBtn','centers'],['surfaceWeatherPressureBtn','pressure'],['surfaceWeatherFrontsBtn','fronts'],['surfaceWeatherTroughsBtn','troughs'],['surfaceWeatherDrylinesBtn','drylines']])
     st.surfaceWeatherSettings[key]=!!el[id].checked;
   try{
     localStorage.setItem('omd_evu_surface_weather_enabled',st.surfaceWeatherEnabled?'1':'0');
     localStorage.setItem('omd_evu_surface_weather_settings',JSON.stringify(st.surfaceWeatherSettings));
   }catch(_){}
   for(const p of st.panels)syncSurfaceWeatherPanel(p);
   updateSurfaceWeatherSummary();
 };
 el.surfaceWeatherRetryBtn?.addEventListener('click',()=>{
   for(const p of st.panels){
     const overlay=p.surfaceWeather;
     if(!overlay||!p.map)continue;
     const state=p.surfaceWeatherDisplayState?.state;
     if(!['missing','error','empty'].includes(state))continue;
     if(overlay._url){overlay._negative.delete(overlay._url);overlay._failures?.delete(overlay._url);overlay._cache.delete(overlay._url);}
     p.surfaceWeatherFrameKey=null;
     void syncSurfaceWeatherPanel(p);
   }
 });
 for(const id of ['surfaceWeatherToggleBtn','surfaceWeatherCentersBtn','surfaceWeatherPressureBtn','surfaceWeatherFrontsBtn','surfaceWeatherTroughsBtn','surfaceWeatherDrylinesBtn'])
   el[id]?.addEventListener('change',surfaceWeatherChange);
 el.surfaceMSLPToggleBtn.onchange=()=>{
  st.overlayMSLP=el.surfaceMSLPToggleBtn.checked;
  try{localStorage.setItem('omd_evu_mslp_isobars',st.overlayMSLP?'1':'0');}catch(_){}
  for(const p of st.panels){
   if(surfaceMSLPContoursEnabled()&&p.status==='ready'&&p.ds&&Number.isInteger(p.h))
    void prepareSurfaceMSLPContours(p,p.ds,p.h,st.seq);
   updatePanelPlotTitle(p);scheduleContourRedraw(p);
  }
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
 el.marineWindToggleBtn.onchange=()=>{
  st.overlayMarineWind=el.marineWindToggleBtn.checked;
  try{localStorage.setItem('omd_evu_marine_10m_wind_overlay',st.overlayMarineWind?'1':'0');}catch(_){}
  for(const p of st.panels){if(!p.cfg?.differencePanel)updatePanelPlotTitle(p);scheduleWindRedraw(p);}
 };
 el.windToggleBtn.onchange=()=>{
  const key=overlayWindSetting(st.field);
  const storage=key==='overlayNearSurfaceWind'?'omd_evu_2m_10m_wind_barbs_v1':key==='overlayWaveDirection'?'omd_evu_wave_direction_overlay_v2':key==='overlayUpperWind'?'omd_evu_upper_wind_overlay':key==='overlaySurfaceWind'?'omd_evu_surface_wind_overlay':'omd_evu_severe_wind_overlay';
  st[key]=el.windToggleBtn.checked;
  try{localStorage.setItem(storage,st[key]?'1':'0');}catch(_){}
  for(const p of st.panels){
   if(p.cfg?.differencePanel)continue;
   const field=p.cfg?.field||st.field;
   if(NEAR_SURFACE_WIND_FIELDS.has(field)&&st.overlayNearSurfaceWind&&!p.wind&&p.map&&p.ds&&Number.isInteger(p.h)&&p.status==='ready'){
    void prepareWindBarbs(p,p.ds,p.h,st.seq).then(()=>updatePanelPlotTitle(p));
   }else{updatePanelPlotTitle(p);scheduleWindRedraw(p);}
  }
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
 if(el.exportLargeLabels&&el.exportNoLabels){
  el.exportLargeLabels.addEventListener('change',()=>{if(el.exportLargeLabels.checked)el.exportNoLabels.checked=false;});
  el.exportNoLabels.addEventListener('change',()=>{if(el.exportNoLabels.checked)el.exportLargeLabels.checked=false;});
 }
 el.exportForm.addEventListener('submit',async e=>{
  e.preventDefault();if(st.exporting||!st.exportSelection)return;
  const ratio=el.exportForm.querySelector('input[name="exportRatio"]:checked')?.value||'16:9';
  const framing=el.exportForm.querySelector('input[name="exportFraming"]:checked')?.value||'fill';st.lastExportFraming=framing;
  const kind=el.exportForm.querySelector('input[name="exportKind"]:checked')?.value||'png';
  try{localStorage.setItem('omd_evu_export_framing',framing);}catch(_){}
  if(kind==='video'){
   const panel=st.exportSelection.panel;
   if(st.exportSelection.type!=='panel'||st.expandedPanel!==panel){
    el.exportBusyStatus.textContent='Expand the panel first to record a video.';return;
   }
   // Close before requesting tab sharing so the chooser sees the live map.
   el.exportDialog.close();
   try{await window.EVUPanelRecorder.start(panel);}
   catch(error){console.error('Panel video capture failed:',error);
    window.alert('Unable to record this panel: '+String(error?.message||error));}
   return;
  }
  st.exportLargeLabels=!!el.exportLargeLabels.checked;
  st.exportNoLabels=!!el.exportNoLabels?.checked;
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
 window.addEventListener('resize',()=>{syncHelperPlacement();layout();if(st.expandedPanel&&st.expandedPanel.map)geographyZoom(st.expandedPanel);});window.addEventListener('keydown',e=>{if(el.differenceDialog.open||el.exportDialog.open||el.shortcutsDialog.open||el.userGuideDialog.open)return;if(fieldMenuUI.open||document.activeElement===el.fieldMenuBtn||el.fieldMenuPopup.contains(document.activeElement))return;if(e.key==='Escape'&&st.difference.open){closeDifferenceWindow();return;}if(document.activeElement?.isContentEditable||document.activeElement?.tagName==='TEXTAREA'||(document.activeElement?.tagName==='SELECT'&&(document.activeElement===el.cycleSelect?!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key):!['ArrowLeft','ArrowRight'].includes(e.key)))||(document.activeElement?.tagName==='INPUT'&&!['checkbox','button'].includes(document.activeElement.type)))return;if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);if(e.key===' '){e.preventDefault();st.playing?stop():play();}if(e.key==='ArrowUp'||e.key==='ArrowDown')changeCycleAtValidTime(e.key==='ArrowUp'?-1:1);},true);}
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
 st.theme=theme;window.EVUAdvancedMap?.setTheme(theme);document.documentElement.dataset.theme=theme;
 el.themeToggleBtn.innerHTML=theme==='dark'?'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>':'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 15.3A8.5 8.5 0 0 1 8.7 3.6 8.5 8.5 0 1 0 20.4 15.3Z"/></svg>';
 el.themeToggleBtn.setAttribute('aria-label',`Switch to ${theme==='dark'?'light':'dark'} mode`);
 el.themeToggleBtn.title=`Switch to ${theme==='dark'?'light':'dark'} mode`;
 if(save)try{localStorage.setItem('omd_evu_theme',theme);}catch(e){}
 for(const p of st.active||[]){scheduleWindRedraw(p);scheduleContourRedraw(p);}
 const c=themeColors();
 // Change paint properties IN PLACE: a full map.setStyle() destroys custom APGL layers.
 for(const p of [...st.active,...(st.difference.open&&st.difference.map?[{map:st.difference.map}]:[])]){const m=p.map;if(!m||!m.setPaintProperty)continue;
   for(const [id,property,value] of [
    ['background','background-color',mapBackgroundPaint()],['land-fill','fill-color',st.mapBackground?overlayStrokeColor('mapBackground',c.land):mapBackgroundPaint()],
    ['land-detail-mask','fill-color',mapBackgroundPaint()],['land-detail-fill','fill-color',st.mapBackground?overlayStrokeColor('mapBackground',c.land):mapBackgroundPaint()],['lakes-detail-fill','fill-color',mapBackgroundPaint()],
    ['coast','line-color',c.line],['coast-detail','line-color',c.line],['country','line-color',c.line],['country-detail','line-color',c.line],
    ['states','line-color',c.minor],['counties','line-color',c.minor],
    ...['coast','coast-detail','country','country-detail','states','counties']
      .map(id=>[id+'-casing','line-color',c.boundaryCasing]),
    ['evu-observed-metar','circle-stroke-color',theme==='light'?'#152633':'#ffffff'],
    ['evu-spc-lsr','circle-stroke-color',theme==='light'?'#152633':'#ffffff']]){
    try{if(m.getLayer(id))m.setPaintProperty(id,property,value);}catch(err){console.warn('Theme paint update',id,err);}
   }
   if(m.getLayer?.('evu-observed-mping'))refreshMpingTriangleTheme(m);
   if(m.getLayer?.('evu-lightning'))refreshGLMDiamondTheme(m);
 }
 updateMapBackground();updateLiveGeography();
 // Theme-specific terrain opacity, exaggeration and illumination must all update.
 syncTerrainAppearance();syncTracerAppearance();
 // The live difference overlay is a canvas; refresh its ink on theme changes.
 if(st.difference.open&&st.difference.snapshot){st.difference.outlineCache=null;scheduleDifferenceLiveRender();}
 // Repaint already-open Skew-T and point-series canvases as well. Their
 // rendered pixels do not respond to CSS theme variables on their own.
 window.EVUPointInspector?.refreshTheme?.();
}
// Geography is advisory: an outage or slow connection must never stop the forecast map.
function geographyStatus(){
 const label=el.geographyNotice;if(!label)return;
 const important=['coast','country','states'];
 const failed=important.filter(key=>st.geoFailed.has(key));
 label.hidden=!failed.length;
 if(failed.length){label.dataset.state='error';label.textContent='Map outlines unavailable: '+failed.map(key=>'map_'+key+'.geojson').join(', ');label.title=failed.map(key=>st.geoFailed.get(key)).join(' | ')+' · Open renderer-diagnostics.html to check WebGL and map rendering.';}
}
async function geoData(key){
 if(st.geoCache.has(key))return st.geoCache.get(key);
 if(st.geoInflight.has(key))return st.geoInflight.get(key);
 const url=`data/map_${key}.geojson`;
 const req=(async()=>{const res=await fetch(url,{cache:'no-store'});
  if(!res.ok)throw Error(`${url}: HTTP ${res.status}`);
  const data=await res.json();
  if(data.type!=='FeatureCollection'||!Array.isArray(data.features)||!data.features.length)throw Error(`${url}: missing GeoJSON features`);
  st.geoCache.set(key,data);st.geoFailed.delete(key);geographyStatus();return data;
 })();st.geoInflight.set(key,req);
 try{return await req;}
 catch(error){st.geoFailed.set(key,String(error?.message||error));geographyStatus();throw error;}
 finally{st.geoInflight.delete(key);}
}
function retryGeography(key){
 if(st.geoRetryTimers.has(key))return;
 // Avoid retry storms if a deployed MapLibre worker cannot process any
 // GeoJSON URLs; one page load gets at most three timed retries per source.
 const counts=st.geoRetryCount??=new Map();
 const attempts=counts.get(key)||0;
 if(attempts>=3)return;
 counts.set(key,attempts+1);
 const timer=setTimeout(()=>{
  st.geoRetryTimers.delete(key);
  for(const p of [...st.active,...(st.difference.open&&st.difference.geo?[st.difference.geo]:[])])
   if(p.map&&!p.geoApplied?.has(key))void installGeo(p,key,false);
 },3000);
 st.geoRetryTimers.set(key,timer);
}
async function installGeo(p,key,retryOnFailure=true){
 if(!p.map||p.geoApplied?.has(key)||p.geoPending?.has(key))return;
 p.geoPending??=new Set();p.geoApplied??=new Set();p.geoPending.add(key);
 const current=p.map;
 try{const data=await geoData(key);
  // A panel may have been recycled while the geography was downloading.
  if(p.map!==current)return;
  const source=current.getSource?.(key);
  if(source?.setData){
   // The browser fetch above validates the file. Let MapLibre fetch that
   // same-origin URL in its GeoJSON worker instead of serializing a large
   // FeatureCollection across the CSP worker boundary. Await processing so
   // a worker rejection remains visible and is eligible for retry.
   await source.setData(`data/map_${key}.geojson`);
   if(p.map!==current)return;
   p.geoApplied.add(key);st.geoFailed.delete(key);geographyStatus();
   updateGeographyVisibility(p);if(p===st.difference.geo)scheduleDifferenceLiveRender();
  }
 }catch(e){st.geoFailed.set(key,'MapLibre worker: '+String(e?.message||e));geographyStatus();console.warn('Map geography issue:',key,e);if(retryOnFailure)retryGeography(key);}
 finally{p.geoPending.delete(key);}
}
function updateGeographyVisibility(p){if(p?.mobileScalar||p?.upperAirGeoOverlay)scheduleMobileScalarRedraw(p,180);
 const m=p.map;if(!m)return;
 const detail=outlineDetailThreshold();
 // Overview lines remain in use until their more detailed replacement is present.
 for(const [overview,key] of [['coast','coast_detail'],['country','country_detail']]){
  for(const id of [overview+'-casing',overview])
   if(m.getLayer(id))m.setLayoutProperty(id,'visibility',p.geoOverlayShowing||(p.geoApplied.has(key)&&m.getZoom()>=detail)?'none':'visible');
 }
 // Maintain matching casing/line visibility; county visibility is controlled by its checkbox.
 for(const id of ['coast-detail','country-detail']){
  for(const boundary of [id+'-casing',id])
   if(m.getLayer(boundary))m.setLayerZoomRange(boundary,detail,24);
 }
 const ready=p.geoApplied.has('land_detail')&&p.geoApplied.has('lakes_detail');
 for(const id of ['land-detail-mask','land-detail-fill','lakes-detail-fill']){
  if(m.getLayer(id))m.setLayerZoomRange(id,ready?detailThreshold():24,24);
 }
 for(const id of ['counties-casing','counties'])
  if(m.getLayer(id))m.setLayerZoomRange(id,0,24);
 updateLiveGeography();
}
function maybeDetailedGeography(p){
 const m=p.map,d=st.cfg?.display||{};
 if(!m)return;
 if(m.getZoom()>=outlineDetailThreshold()){
  if(d.showCoastlines!==false)void installGeo(p,'coast_detail');
  if(d.showCountryBoundaries!==false)void installGeo(p,'country_detail');
 }
 if(m.getZoom()>=detailThreshold()&&d.showLandFill!==false){void installGeo(p,'land_detail');void installGeo(p,'lakes_detail');}
}
function maybeCounties(p){
 // County visibility is user-controlled; zoom never changes this setting.
 if(p.map&&st.countiesEnabled)void installGeo(p,'counties');
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
// CCPA / NOHRSC are published as additional analysis stores on the exact
// cropped GFS 0.25-degree grid. Strictly require every native accumulation
// interval; never mix products, extrapolate, or replace missing with zero.
// For both regional and GFS-aligned precipitation, prefer a *complete* set
// of native hourly CCPA analyses. If older catalogs only have 3/6-h native
// products, find a non-overlapping all-CCPA covering instead. Never splice
// CCPA with Stage IV/MRMS; never use a value outside the requested window.
// One complete provider/quality-pass window, using the fewest native intervals.
// No provider mixing, overlapping accumulation periods or grid mismatches.
// Native products are preferred over equivalent hourly sums when available,
// avoiding needless browser fetches/decompression and preserving native QC.
function nativePrecipitationPlan(src,ref,lead,window,variants,source){
 if(!src||!ref||!Number.isInteger(lead)||!Number.isInteger(window)||window<1||lead<window)return null;
 const begin=lead-window,paths=new Map([[begin,{records:[],grid:null}]]);
 for(let end=begin+1;end<=lead;end++){
  for(const {duration,product} of variants){
   const previous=paths.get(end-duration);
   if(!previous||end-duration<begin)continue;
   const when=valid(ref,end);
   // CCPA 3/6-h files end on a synoptic 3/6-hour boundary.
   if(/^gfs_ccpa_|^ccpa_/.test(product)&&duration>1&&when.getUTCHours()%duration)continue;
   const ds=precipitationHourlyRecord(src,when,product);
   const v=ds?.variables?.find(x=>x.name==='apcp'&&x.available_hours?.includes(0));
   if(!v)continue;
   const key=accumulationGridKey(ds,v);
   if(previous.grid!==null&&previous.grid!==key)continue;
   const next={records:[...previous.records,{src,ds,v,interval:duration}],grid:key};
   const old=paths.get(end);
   if(!old||next.records.length<old.records.length)paths.set(end,next);
  }
 }
 const path=paths.get(lead);
 return path?.records.length?{source,records:path.records}:null;
}
function ccpaNativePlan(src,ref,lead,window,prefix){
 return nativePrecipitationPlan(src,ref,lead,window,
  [6,3,1].map(duration=>({duration,product:prefix+duration+'h'})),'CCPA');
}
function nonCcpaPrecipitationPlan(src,ref,lead,window,prefix,source){
 // Pass 2 and Pass 1 are separate providers for source-consistency purposes.
 const families=[
  {source:'Stage IV',variants:[{duration:24,product:prefix+'stageiv_24h'},
    {duration:6,product:prefix+'stageiv_6h'},{duration:1,product:prefix+'stageiv_apcp'}]},
  {source:'MRMS',variants:[{duration:24,product:prefix+'mrms_apcp_24h'},
    {duration:6,product:prefix+'mrms_apcp_6h'},{duration:1,product:prefix+'mrms_apcp_pass2'}]},
  {source:'MRMS',variants:[{duration:1,product:prefix+'mrms_apcp'}]}
 ];
 for(const family of families){
  if(source&&family.source!==source)continue;
  const plan=nativePrecipitationPlan(src,ref,lead,window,family.variants,family.source);
  if(plan)return plan;
 }
 return null;
}
function gfsObservedRecords(analysis,field,reference,lead){
 if(field==='prate'){
  // One valid-time MRMS instantaneous rate on the GFS grid. Neither a
  // period accumulation nor an F000 GFS model analysis is interchangeable.
  const time=cycleKey(valid(reference,lead));
  const ds=analysis?.datasets?.find(d=>d.product==='gfs_mrms_prate'&&cycleKey(d.init_time)===time);
  const v=ds?.variables?.find(x=>x.name==='prate'&&x.available_hours?.includes(0));
  if(!v)throw Error(`GFS-aligned MRMS precipitation-rate analysis missing at ${fmt(valid(reference,lead))}. Run verification_pipeline.py for mrms_prate and publish the aligned analysis.`);
  return{source:'MRMS',records:[{src:analysis,ds,v,interval:0}]};
 }
 const snow=gfsSnowSpec(field),precipitation=field==='apcp'||!!precipitationAccumulationHours(field);
 if(!snow&&!precipitation)throw Error('No GFS verifying analysis configured for '+field);
 if(snow?.method==='depthChange')throw Error('NOHRSC snowfall cannot verify snow-depth change.');
 const period=snow?(snow.period||lead):(precipitationAccumulationHours(field)||lead);
 if(lead<=0||period<=0||lead<period)throw Error('A complete observed accumulation interval is required after F000.');
 const start=lead-period;
 if(snow){
  if(lead%6||start%6)throw Error('NOHRSC snowfall requires complete 6-hour intervals.');
  const records=[];let end=lead;
  while(end>start){
   let interval=6;
   if(end-start>=24&&new Date(valid(reference,end)).getUTCHours()%12===0)interval=24;
   const when=cycleKey(valid(reference,end)),product='gfs_nohrsc_'+interval+'h',name='snow'+interval+'h';
   const ds=analysis?.datasets?.find(d=>d.product===product&&cycleKey(d.init_time)===when);
   const v=ds?.variables?.find(x=>x.name===name&&x.available_hours?.includes(0));
   if(!v)throw Error(`${product} ${name} missing for ${fmt(valid(reference,end))}; no partial observed accumulation shown.`);
   records.unshift({src:analysis,ds,v,interval});end-=interval;
  }
  return {source:'NOHRSC',records};
 }
 if(lead%3||start%3)throw Error('GFS precipitation verification requires a completed 3-hour window.');
 // A complete set of hourly CCPA is preferred even at intermediate hours;
 // 3-/6-hour CCPA remains usable for historical or partially backfilled days.
 const ccpa=ccpaNativePlan(analysis,reference,lead,period,'gfs_ccpa_');
 if(ccpa)return ccpa;
 // A native Stage IV or MRMS interval avoids dozens of extra fetches; if a
 // quality pass is incomplete, try the next complete provider, never splice.
 const backup=nonCcpaPrecipitationPlan(analysis,reference,lead,period,'gfs_');
 if(backup)return backup;
 throw Error(`No complete CCPA, Stage IV, or MRMS analysis available for the ${period}-hour period ending ${fmt(valid(reference,lead))}. No partial or mixed-source total shown.`);
}
function sameGfsAnalysisGrid(model,record){
 const g=model.ds?.grid,o=record.ds?.grid;
 const bound=(grid,plain,grib)=>Number(grid?.[plain]??grid?.['GRIB_'+grib]);
 return !!g&&!!o&&model.v.shape[1]===record.v.shape[1]&&model.v.shape[2]===record.v.shape[2]&&
   Number(g.GRIB_Nx)===Number(o.GRIB_Nx)&&Number(g.GRIB_Ny)===Number(o.GRIB_Ny)&&
   ['longitude_min','longitude_max','latitude_min','latitude_max'].every((k,i)=>{
    const grib=['longitudeOfFirstGridPointInDegrees','longitudeOfLastGridPointInDegrees',
                'latitudeOfFirstGridPointInDegrees','latitudeOfLastGridPointInDegrees'][i];
    return Math.abs(bound(g,k,grib)-bound(o,k,grib))<.0001;
   });
}
async function gfsObservedValues(records,field,modelRecord,onProgress,seq){
 const snow=!!gfsSnowSpec(field);
 const metadata=field==='prate'?FIELDS.prate:{...(snow?FIELDS.snow6h:FIELDS.apcp),convert:snow?'mtoin':'mmtoin'};
 if(field==='prate'&&records.length!==1)throw Error('MRMS precipitation rate requires exactly one instantaneous analysis.');
 let total=null,shape=null;
 for(let i=0;i<records.length;i++){
  if(seq!==st.seq)return null;
  const record=records[i];
  if(modelRecord&&!sameGfsAnalysisGrid(modelRecord,record))throw Error('GFS-aligned observed grid does not match model native grid; reprocess verification analyses.');
  const signature=accumulationGridKey(record.ds,record.v);
  if(shape&&shape!==signature)throw Error('Observed verification grids differ between accumulation intervals.');
  onProgress(`Loading ${snow?'NOHRSC':record.ds.product.replace(/^gfs_/, '')} interval ${i+1}/${records.length}…`);
  const values=await getDisplayData(record.src,record.ds,record.v,0,metadata,()=>{});
  if(!total)total=values.slice();
  else for(let j=0;j<total.length;j++){
   const a=total[j],b=values[j];
   total[j]=Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>=0?a+b:NaN;
  }
  shape=signature;
 }
 return total;
}
// GEFS has native 0.25-degree surface fields and 0.5-degree pressure fields.
// Require the complete requested accumulation at ONE resolution; never mix
// two grids or use the high-resolution product before it finishes publishing.
function preferNativeGefsGrid(datasets,selected,field,lead,window){
 if(!selected)return selected;
 const stored=window?'apcp':field;
 const alternatives=datasets.filter(ds=>cycleKey(ds.init_time)===cycleKey(selected.init_time));
 alternatives.sort((a,b)=>Number(a.grid?.GRIB_DxInDegrees||99)-Number(b.grid?.GRIB_DxInDegrees||99));
 return alternatives.find(ds=>{
  const v=ds.variables?.find(v=>v.name===stored),hours=v?.available_hours;
  return hours?.includes(lead)&&(!window||lead<window||lead===window||hours.includes(lead-window));
 })||selected;
}
// Existing Zarr catalogs already carry paired isobaric U/V winds.  A
// derived, virtual 850-hPa speed variable exposes the same field on old cycles
// without adding a nonexistent Zarr path or requiring a converter backfill.
// Both components must be colocated in the SAME dataset, same grid and hour.
function withVirtualWind850(ds){
 if(!Array.isArray(ds?.variables)||ds.variables.some(item=>item.name==='wspd850'))return ds;
 const u=ds.variables.find(item=>item.name==='u850'),v=ds.variables.find(item=>item.name==='v850');
 if(!u||!v||!Array.isArray(u.shape)||!Array.isArray(v.shape)||
    u.shape.length!==3||u.shape.some((dim,i)=>dim!==v.shape[i]))return ds;
 const common=(u.available_hours||[]).filter(hr=>v.available_hours?.includes(hr));
 if(!common.length)return ds;
 ds.variables.push({...u,name:'wspd850',available_hours:common,
  derivedWindSpeed850:true,attrs:{long_name:'850-hPa wind speed derived from U/V',units:'m s-1'}});
 return ds;
}
function choose(p,hourOverride=st.hour){p.analysisRadar=null;p.analysisNativeRadar=null;p.analysisCategoricalOnly=false;p.snowCompare=null;p.gfsObservedCompare=null;p.gfsObservedAnalysis=null;p.gfsNativeCompare=null;p.gfsAviationCompare=null;const src=st.sources.get(p.cfg.source||st.primary.id);p.src=src;const nativeDiffSourceMissing=st.modelSet==='gfs-versions'&&!!p.cfg?.differencePanel&&/^gfs_diff_/.test(String(p.cfg?.source||''));if((!src||src.error)&&!nativeDiffSourceMissing)return nativeGfsDifferenceFallback(p,panelSelectedField(p),hourOverride)||{error:src?.error||`Unknown source ${p.cfg.source}`};let ds;const mode=p.cfg.run||'selected',list=src?.datasets||[];
 const field=panelSelectedField(p);
 // Categorical flight category (like Ptype) has no meaningful signed delta.
 // Reject it before loading native or materialized GFS difference products;
 // the normal forecast and analysis categorical panels remain available.
 if(p.cfg?.differencePanel&&DIFFERENCE_BLOCKED_FIELDS.has(field))
  return {error:`Not applicable: ${differenceFieldLabel(field)} is categorical; no numerical difference is computed.`,ds:null};
 // GFSv17−v16 aviation differences must be formed from individually capped
 // original sources. A materialized difference alone cannot reveal whether
 // either input exceeded 9 mi / 30,000 ft; never trust it for these fields.
 if(st.modelSet==='gfs-versions'&&p.cfg?.differencePanel&&
    p.cfg.source==='gfs_diff_v17_v16'&&(field==='vis'||field==='ceil'))
  return nativeGfsDifferenceFallback(p,field,hourOverride)||
   {error:`${FIELDS[field].label} difference requires both native GFSv17 and GFSv16 fields at the selected cycle/hour for the 9-mi / 30,000-ft validity mask.`,ds:null};
 // For GFS forecast-minus-analysis aviation differences, use the SAME
 // URMA > RTMA > RAP observation as the visible GFS Analysis panel. The
 // difference catalog is not an observation source and is allowed to lack
 // matching cycle entries. Reproject continuous fields at render time rather
 // than comparing unrelated native grid-cell indices or falling back to F000.
 if(st.modelSet==='gfs-versions'&&p.cfg?.differencePanel&&
    /^gfs_diff_v(?:16|17)_analysis$/.test(String(p.cfg.source||''))&&
    (field==='vis'||field==='ceil')){
  const modelId=p.cfg.source==='gfs_diff_v16_analysis'?'gfs_v16':'gfs_v17';
  const forecastPanel={cfg:{source:modelId,field,run:'selected'},src:null};
  const forecast=choose(forecastPanel,hourOverride);
  if(forecast.error)return {error:`${modelId.toUpperCase()} aviation difference: ${forecast.error}`,ds:null};
  const obsPanel={cfg:{source:'analysis',timeMode:'analysis',field},src:null};
  const observation=choose(obsPanel,hourOverride);
  if(observation.error)return {error:`Observed ${field==='vis'?'visibility':'ceiling'} unavailable for ${fmt(valid(st.ref,hourOverride))}: ${observation.error}`,ds:null};
  p.src=forecastPanel.src;
  p.gfsAviationCompare={modelId,observation:{...observation,src:obsPanel.src}};
  return forecast;
 }
 // The magnitude of precomputed U/V COMPONENT DIFFERENCES is unsigned and
 // is NOT a wind-speed difference. For every GFS comparison, calculate the
 // two native magnitudes first, then subtract them (in native m/s). A signed
 // display conversion to knots occurs only after the subtraction.
 if(st.modelSet==='gfs-versions'&&p.cfg?.differencePanel&&field==='wspd850')
  return nativeGfsDifferenceFallback(p,field,hourOverride)||
   {error:'Cannot compute signed 850-hPa wind-speed difference: both original GFS U/V pairs at matching hours and grid points are required.',ds:null};
 if(field.startsWith('wave_') && st.modelSet!=='gfs-versions')
  return {error:'Marine wave fields are available in the GFS comparison set only.',ds:null};
 // For the GFS Analysis panel, aviation weather is observed URMA/RTMA
 // wherever a matching valid-time analysis has been published. Fall back to
 // the GFSv16 F000 analysis only if no observation field is available; never
 // substitute a different valid time or regrid the categorical field blindly.
 if(st.modelSet==='gfs-versions'&&p.cfg.timeMode==='gfs-analysis'&&
    ['vis','ceil','flightcat'].includes(field)){
  const verification=st.sources.get('analysis');
  if(verification&&!verification.error){
   const proxy={cfg:{source:'analysis',timeMode:'analysis',field},src:null};
   const selected=choose(proxy,hourOverride);
   if(!selected.error){p.src=proxy.src;return selected;}
  }
 }
 const precipitationWindow=precipitationAccumulationHours(field);
 const snowWindow=snowAccumulationHours(field);
 const gfsSnow=gfsSnowSpec(field);
 // Both the GFS comparison and the AI/GEFS comparison reuse the SAME
 // already-published verification analyses. In particular, the AI
 // GFSv16 F000 panel must not present model APCP as observed QPE.
 const isGfsObservationField=(st.modelSet==='gfs-versions'||st.modelSet==='ai-models')&&
  (gfsSnow&&!gfsSnow.rrfs||field==='prate'||field==='apcp'||!!precipitationWindow);
 if(isGfsObservationField&&(p.cfg.timeMode==='gfs-analysis'||
     /^gfs_diff_v(?:16|17)_analysis$/.test(p.cfg.source||''))){
  const analysis=st.sources.get('analysis');
  if(!analysis||analysis.error)return{error:(gfsSnow?'NOHRSC':field==='prate'?'MRMS precipitation rate':'Precipitation')+' analysis catalog unavailable: '+(analysis?.error||'not configured'),ds:null};
  // The visible NOHRSC panel uses the existing REGIONAL observation product;
  // its GFS-grid counterpart is reserved for mathematical differences only.
  if(gfsSnow&&p.cfg.timeMode==='gfs-analysis'){
   const nativeField=nativeNohrscSnowField(field);
   if(!nativeField)return{error:'No matching NOHRSC native accumulation for this snowfall period.',ds:null};
   const proxy={cfg:{source:'analysis',timeMode:'analysis',field:nativeField},src:null};
   const selected=choose(proxy,hourOverride);
   p.src=proxy.src;
   return selected;
  }
  let match;
  try{match=gfsObservedRecords(analysis,field,st.ref,hourOverride);}
  catch(e){return{error:String(e?.message||e),ds:null};}
  const {records,source}=match;
  if(p.cfg.timeMode==='gfs-analysis'){
   p.src=analysis;p.gfsObservedAnalysis={records,source};
   const last=records[records.length-1];return{ds:last.ds,v:last.v,h:0};
  }
  const modelId=p.cfg.source==='gfs_diff_v16_analysis'?'gfs_v16':'gfs_v17';
  const raw={cfg:{source:modelId},src:null};
  const selected=choose(raw,hourOverride);
  if(selected.error)return selected;
  if(!records.every(record=>sameGfsAnalysisGrid(selected,record)))
   return{error:'GFS-aligned '+source+' grid differs from forecast grid; verification difference withheld.',ds:null};
  p.src=raw.src;p.gfsObservedCompare={modelId,records,source};
  return selected;
 }
 // The F000 GFS analysis cannot verify period snow. Reuse the verified
 // NOHRSC catalog/period selection from the regional analysis panels.
 if(gfsSnow&&((!gfsSnow.rrfs&&p.cfg.timeMode==='gfs-analysis')||(gfsSnow.rrfs&&p.cfg.timeMode==='analysis'))){
  const analysis=st.sources.get('analysis');
  if(!analysis||analysis.error)return{error:'NOHRSC analysis catalog unavailable: '+(analysis?.error||'analysis source not configured'),ds:null};
  const nativeField=nativeNohrscSnowField(field);
  const proxy={cfg:{source:'analysis',timeMode:'analysis',field:nativeField},src:null};
  const selected=choose(proxy,hourOverride);p.src=proxy.src;
  return selected;
 }
 // Verification datasets are valid-time analyses, not a forecast cycle. Match
 // exactly, and never imply that NOHRSC has an independent 1- or 3-h product.
 if(p.cfg.timeMode==='analysis'){
  if(field==='mxuphl'||field==='mxuphl_run'){
   const vt=valid(st.ref,hourOverride),wanted=vt.toISOString();
   if(hourOverride<1)return{error:'MRMS mid-level rotation track begins at F001; no completed 60-minute interval at F000',ds:null};
   const record=rotationHourlyRecord(src,vt);
   if(!record)return{error:`MRMS 3–6 km mid-level rotation track (60-minute maximum) unavailable ending ${fmt(vt)}; this is a radar-derived proxy, not observed UH`,ds:null};
   if(field==='mxuphl_run'){
    const missing=missingRotationTrackHours(src,st.ref,hourOverride);
    if(missing.length)return{error:`MRMS running maximum rotation track unavailable: ${missing.length} missing hourly 60-min tracks; first ${missing[0]}. No partial track shown.`,ds:null};
   }
   return{ds:record,v:record.variables.find(v=>v.name==='rottrack_ml60'),h:0};
  }
  // Ground-truth categories: use the valid-time RAP F000 diagnostic, not
  // a surrogate analysis product or a model run at the selected forecast lead.
  // The composite pairs MRMS reflectivity with the same valid-time RAP F000
  // categories. Render on RAP's native grid (explicit nearest-neighbor MRMS
  // sampling), keeping the products geographically registered.
  if(field==='ptype'||field==='refc_ptype'){
   const vt=valid(st.ref,hourOverride),wanted=vt.toISOString();
   const rap=list.find(d=>/^rap(?:_|$)/.test(d.product||'')&&cycleKey(d.init_time)===wanted&&
     nativeAnalysisPtypeVariable(d,0));
   if(!rap)return{error:`RAP F000 precipitation-type analysis is not published for ${fmt(vt)}. Process the four instantaneous RAP categorical fields into ptype at F000; no HRRR, RRFS or MRMS categorical substitute will be used.`,ds:null};
   const category=nativeAnalysisPtypeVariable(rap,0);
   if(field==='ptype')return{ds:rap,v:category,h:0};
   const mrms=list.find(d=>d.product==='mrms_refc'&&cycleKey(d.init_time)===wanted&&
     d.variables?.some(v=>v.name==='refc'&&v.available_hours?.includes(0)));
   if(mrms){
    p.analysisRadar={src,ds:mrms,v:mrms.variables.find(v=>v.name==='refc'),h:0};
    return{ds:rap,v:category,h:0};
   }
   // No matching MRMS radar: retain the exact-valid-time RAP category.
   // Use RAP's own reflectivity only if it is genuinely published on the
   // same native grid. Existing RAP verification catalogs commonly lack it.
   const native=rap.variables?.find(v=>v.name==='refc'&&v.available_hours?.includes(0)&&
     v.shape?.[1]===category.shape?.[1]&&v.shape?.[2]===category.shape?.[2]);
   if(native){p.analysisNativeRadar={ptype:category};return{ds:rap,v:native,h:0};}
   p.analysisCategoricalOnly=true;
   return{ds:rap,v:category,h:0};
  }
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
  const isPrecip=field==='apcp'||!!precipitationWindow;
  const requested=nohrscRunningSnow?'snow6h':field==='snowc'?'snowpresence':isPrecip?'apcp':field==='snow48h'?'snow24h':field;
  const wanted=vt.toISOString();
  const candidates=list.filter(d=>cycleKey(d.init_time)===wanted&&d.variables?.some(v=>v.name===requested&&v.available_hours?.includes(0))&&(!nohrscRunningSnow||d.product==='nohrsc_6h')&&(!(snowWindow||nohrscRunningSnow)||/^nohrsc_/.test(d.product||'')));
  // VIS, CEIL, and flightcat should come from the same native analysis.
  // URMA is the delayed analysis of record, RTMA the early fallback; RAP
  // remains a last resort when neither source has the requested variable.
  const analysisRank=d=>d.product==='urma'?0:d.product==='rtma'?1:2;
  const aviationAnalysis=field==='vis'||field==='ceil'||field==='flightcat';
  // Precipitation must come from ONE consistent source over the full
  // accumulation window. Promote to Stage IV only when every hour exists;
  // otherwise retain a complete MRMS interval, never a mixed grid/QPE.
  if(field==='prate'){
   // Instantaneous precipitation rate must be MRMS on every model set.
   // CCPA, Stage IV and GFS F000 are not substitutes for MRMS rate.
   ds=candidates.find(d=>d.product==='mrms_prate');
  }else if(isPrecip&&hourOverride>0){
   const window=precipitationWindow||hourOverride;
   const source=preferredPrecipitationSource(src,st.ref,hourOverride,window);
   ds=candidates.find(d=>d.product===source);
  }else if(aviationAnalysis){
   ds=candidates.filter(d=>d.product==='urma'||d.product==='rtma'||d.product==='rap_pressure')
    .sort((a,b)=>analysisRank(a)-analysisRank(b))[0];
  }else ds=candidates.sort((a,b)=>analysisRank(a)-analysisRank(b))[0];
  if(snowWindow===48){
   if(!ds||ds.product!=='nohrsc_24h')return{error:`NOHRSC 48-hour snowfall needs 24-hour analysis ending at ${fmt(vt)}`,ds:null};
   const previous=nohrsc24hRecord(src,new Date(vt.getTime()-24*3600000));
   if(!previous)return{error:`NOHRSC 48-hour snowfall needs preceding 24-hour analysis ending at ${fmt(new Date(vt.getTime()-24*3600000))}`,ds:null};
  }
  if(nohrscRunningSnow&&ds){
   const missing=missingNohrscRunningHours(src,st.ref,hourOverride);
   if(missing.length)return{error:`NOHRSC running snowfall unavailable: ${missing.length} missing 6-hour analyses since initialization; first ${missing[0]}`,ds:null};
  }
  if(isPrecip&&hourOverride>0&&!ds){
   const window=precipitationWindow||hourOverride;
   return{error:`Precipitation analysis unavailable: no complete CCPA, Stage IV, or MRMS ${window}-hour window ending ${fmt(vt)}. No partial or mixed-source total is shown.`,ds:null};
  }
  if(field==='prate'&&!ds)return{error:`MRMS precipitation-rate analysis unavailable for ${fmt(vt)} (mrms_prate); no model substitute is used.`,ds:null};
  if(!ds)return{error:(snowWindow||nohrscRunningSnow)?`NOHRSC ${nohrscRunningSnow?'6-hour input for running':snowWindow+'-hour'} snowfall missing from browser analysis catalog for ${fmt(wanted)}. ${nohrscCatalogDetail(src,nohrscRunningSnow||snowWindow===6?'nohrsc_6h':'nohrsc_24h',wanted,requested)}`:`Analysis unavailable for ${fmt(wanted)} (${FIELDS[field]?.label||field}); source latency or no verifier`,ds:null};
  return{ds,v:ds.variables.find(v=>v.name===requested),h:0};
 }
 if(gfsSnow&&!gfsSnow.rrfs&&/gfs_diff_v(?:16|17)_analysis/.test(p.cfg.source||''))
  return{error:'NOHRSC snowfall analysis uses a different grid. Forecast-minus-analysis differences are unavailable until spatial regridding is implemented; see the NOHRSC analysis panel for observed snowfall.',ds:null};
 if(gfsSnow?.method==='slr10'&&!gfsSnow.rrfs&&p.cfg.differencePanel&&st.snowMethod==='precip')
  return{error:'GFSv17 snowfall precipitation (TSNOWP) cannot be differenced against v16 because v16 has no TSNOWP. Switch to WEASD Change for a like-for-like difference.',ds:null};
 // Build v17−v16 SWE-increase difference from the TWO original GFS grids,
 // rather than clipping the change in their precomputed net-WEASD difference.
 if(gfsSnow?.method==='slr10'&&!gfsSnow.rrfs&&p.cfg.source==='gfs_diff_v17_v16'){
  const src17=st.sources.get('gfs_v17'),src16=st.sources.get('gfs_v16');
  const id=st.ref?.id;
  const match=src=>src?.datasets?.find(d=>cycleKey(d.init_time)===id);
  const d17=match(src17),d16=match(src16);
  if(!d17||!d16)return{error:'A matching GFSv16 and v17 cycle is required for WEASD Increase differences.',ds:null};
  const v17=d17.variables?.find(v=>v.name==='weasd'),v16=d16.variables?.find(v=>v.name==='weasd');
  if(!v17||!v16)return{error:'WEASD is missing from at least one GFS model catalog.',ds:null};
  let h=hourOverride+Number(p.cfg.forecastHourOffset||0);
  const prior=gfsSnow.period?h-gfsSnow.period:0;
  if(h<=0||h<gfsSnow.period)
   return{error:`WEASD Increase comparison requires F${pad3(gfsSnow.period||1)} or later (selected F${pad3(h)}).`,ds:null};
  if(![h,prior].every(t=>v17.available_hours.includes(t)&&v16.available_hours.includes(t)))
   return{error:'WEASD Increase comparison requires F'+pad3(prior)+' and F'+pad3(h)+' from both models.',ds:null};
  if(v17.shape[1]!==v16.shape[1]||v17.shape[2]!==v16.shape[2]||JSON.stringify(d17.grid)!==JSON.stringify(d16.grid))
   return{error:'GFS WEASD grids differ; cannot subtract without explicit geographic regridding.',ds:null};
  p.src=src17;p.snowCompare={src16,d16,v16,src17,d17,v17};
  return{ds:d17,v:v17,h};
 }
 if(gfsSnow&&!gfsSnow.rrfs&&(p.cfg.timeMode==='gfs-analysis'||/gfs_diff_v(?:16|17)_analysis/.test(p.cfg.source||'')))
  return{error:'Not applicable: an F000 analysis cannot verify an interval snowfall accumulation or snow-depth change. Compare GFSv16/v17 forecasts at the same valid time.',ds:null};
 if(p.cfg.timeMode==='gfs-analysis'){
  const at=cycleKey(valid(st.ref,hourOverride));
  ds=list.find(d=>cycleKey(d.init_time)===at);
  if(!ds)return{error:`GFSv16 F000 analysis missing from published catalog at ${fmt(valid(st.ref,hourOverride))} (available only at matching 00/06/12/18 UTC cycles)`};
  if(field==='refc_ptype'){
   // Reflectivity/Ptype is a virtual display field, not a Zarr variable.
   // Its GFS analysis must use the valid-time GFSv16 F000 native pair,
   // never F000 of the selected older initialization cycle.
   const v=ds.variables?.find(x=>x.name==='refc'&&x.available_hours?.includes(0));
   const ptype=ds.variables?.find(x=>x.name==='ptype'&&x.available_hours?.includes(0));
   if(!v||!ptype)return{error:`GFSv16 F000 reflectivity and precipitation type are required at ${fmt(valid(st.ref,hourOverride))}`,ds:null};
   if(ptype.shape?.[1]!==v.shape?.[1]||ptype.shape?.[2]!==v.shape?.[2])
    return{error:'GFSv16 F000 reflectivity and Ptype are not on the same native grid',ds:null};
   const analysis=st.sources.get('analysis');
   const mrms=analysis?.datasets?.find(d=>d.product==='mrms_refc'&&cycleKey(d.init_time)===at&&
     d.variables?.some(x=>x.name==='refc'&&x.available_hours?.includes(0)));
   if(mrms)p.analysisRadar={src:analysis,ds:mrms,v:mrms.variables.find(x=>x.name==='refc'),h:0};
   return{ds,v,h:0};
  }
  const v=ds.variables.find(x=>x.name===field);
  if(!v||!v.available_hours?.includes(0))return{error:`GFSv16 F000 ${field} not published for ${fmt(valid(st.ref,hourOverride))}`};
  return{ds,v,h:0};
 }
 if(mode==='latest')ds=list[0];else if(mode==='nearest')ds=list.slice().sort((a,b)=>Math.abs(Date.parse(a.init_time)-Date.parse(st.ref.init_time))-Math.abs(Date.parse(b.init_time)-Date.parse(st.ref.init_time)))[0];else if(mode==='selected')ds=list.find(d=>cycleKey(d.init_time)===st.ref.id);else ds=list.find(d=>d.id===mode);
 if(!ds)return nativeGfsDifferenceFallback(p,field,hourOverride)||{error:`No matching cycle for ${fmt(st.ref.init_time)}`};if(p.cfg.runOffset){ds=list[list.indexOf(ds)+Number(p.cfg.runOffset)];if(!ds)return{error:'Cycle offset unavailable'};}
 // The GEFS Mean catalog contains two native grids, selected per field.
 if(st.modelSet==='ai-models'&&p.cfg.source==='gefs_mean')
  ds=preferNativeGefsGrid(list,ds,field,hourOverride+Number(p.cfg.forecastHourOffset||0),precipitationWindow);

 if(gfsSnow?.method==='slr10'&&!gfsSnow.rrfs&&st.snowMethod==='precip'&&isGfsV16(ds.model))
  return{error:'Snow Precipitation (TSNOWP) is not published for GFSv16. Select WEASD Change to compare both models.',ds:null};
 const storedName=field==='refc_ptype'?'refc':gfsSnowSource(field,ds.model)||(snowWindow?'asnow':precipitationWindow?'apcp':field);
 const v=ds.variables.find(x=>x.name===storedName);
 if(!v){
  const missingName=gfsSnowSource(field,ds.model);
  const detail=gfsUsesSweChange(field,ds.model)
   ?'WEASD Change requires published WEASD snowpack water-equivalent data.'
   :gfsSnow?.method==='slr10'?(st.snowMethod==='weasd'?'WEASD Change requires published WEASD for both models.':'Snow Precipitation requires native TSNOWP.') :'';
  return nativeGfsDifferenceFallback(p,field,hourOverride)||{error:`${FIELDS[field]?.label||field}: ${missingName||field} not in ${ds.model||src.id} catalog (field not yet processed or not provided by model). ${detail}`,ds};
 }
 if(field==='refc_ptype'&&!ds.variables.some(x=>x.name==='ptype'))return{error:`${ds.model||src.id} lacks precipitation type required for reflectivity shading`,ds:null};
 let h=hourOverride+Number(p.cfg.forecastHourOffset||0);
 if(p.cfg.timeMode==='valid')h=Math.round((valid(st.ref,hourOverride)-Date.parse(ds.init_time))/3600000)+Number(p.cfg.forecastHourOffset||0);
 const window=snowWindow||precipitationWindow||gfsSnow?.period||0;
 if(gfsSnow&&h<=0)return{error:'Derived snowfall starts after forecast hour 000',ds:null};
 // Reject incomplete snowfall windows before asking for an earlier chunk.
 // Otherwise F006 with a 48-hour product would incorrectly request F-42.
 if(gfsSnow?.period&&h<gfsSnow.period)
  return{error:`${FIELDS[field].label} requires F${pad3(gfsSnow.period)} or later for a complete ${gfsSnow.period}-hour snowfall accumulation (selected F${pad3(h)}).`,ds:null};
 if((gfsSnow?.method==='depthChange'||gfsUsesSweChange(field,ds.model))&&!v.available_hours.includes(gfsSnow.period?h-gfsSnow.period:0)){
  const prior=gfsSnow.period?h-gfsSnow.period:0;
  const dataName=gfsUsesSweChange(field,ds.model)?'WEASD snowpack water equivalent':'SNOD snow depth';
  return{error:`${FIELDS[field].label} requires ${dataName} at F${pad3(prior)} and F${pad3(h)}; missing ${v.name} F${pad3(prior)} in the published ${ds.model||src.id} catalog. No substitute field used.`,ds:null};
 }
 if(gfsSnow&&!v.available_hours.includes(h))
  return{error:`${FIELDS[field].label} requires ${v.name.toUpperCase()} at F${pad3(h)}; selected GFS forecast hour is not published in this source.`,ds:null};
 if(window && (h<window || (h>window&&!v.available_hours.includes(h-window))))
  return{error:`${window}-hour ${snowWindow?'snowfall':'precipitation'} requires F${pad3(h)} and ${h>window?'F'+pad3(h-window)+' cumulative total':'a complete accumulation interval'}`,ds:null};
 if(!v.available_hours?.includes(h))return nativeGfsDifferenceFallback(p,field,hourOverride)||{error:`${FIELDS[field]?.label||field} at F${pad3(h)} is not published in ${ds.model||src.id}; matching native source data are also unavailable.`,ds};
 return{ds,v,h};}
// Select an on-demand native-grid GFS difference only when a precomputed
// scalar is absent. The converter's precomputed difference retains priority.
// Do not silently regrid: the GFS source grids must be geographically identical.
function nativeGfsDifferenceFallback(p,field,hour){
 const pair={
  gfs_diff_v17_v16:['gfs_v17','gfs_v16'],
  gfs_diff_v16_analysis:['gfs_v16','gfs_v16'],
  gfs_diff_v17_analysis:['gfs_v17','gfs_v16']
 }[p?.cfg?.source];
 if(st.modelSet!=='gfs-versions'||!p?.cfg?.differencePanel||!pair||
    DIFFERENCE_BLOCKED_FIELDS.has(field)||field==='refc_ptype')return null;
 const compareAnalysis=p.cfg.source!=='gfs_diff_v17_v16';
 const leftPanel={cfg:{source:pair[0],field,forecastHourOffset:Number(p.cfg?.forecastHourOffset||0)},src:null};
 const rightPanel={cfg:{source:pair[1],field,forecastHourOffset:Number(p.cfg?.forecastHourOffset||0),timeMode:compareAnalysis?'gfs-analysis':'selected'},src:null};
 const left=choose(leftPanel,hour),right=choose(rightPanel,hour);
 if(left?.error||right?.error||!left?.ds||!right?.ds||!left?.v||!right?.v)return null;
 const leftSource=leftPanel.src,rightSource=rightPanel.src;
 if(!leftSource||!rightSource)return null;
 const leftGrid=left.ds.grid||{},rightGrid=right.ds.grid||{};
 const keys=['GRIB_gridType','GRIB_Nx','GRIB_Ny','GRIB_DxInDegrees','GRIB_DyInDegrees',
  'GRIB_longitudeOfFirstGridPointInDegrees','GRIB_latitudeOfFirstGridPointInDegrees','grid_order'];
 if(!keys.every(key=>String(leftGrid[key]??'')===String(rightGrid[key]??'')))return null;
 p.gfsNativeCompare={left:{panel:leftPanel,src:leftSource,ds:left.ds,v:left.v,h:left.h},right:{panel:rightPanel,src:rightSource,ds:right.ds,v:right.v,h:right.h}};
 p.src=leftSource;
 return {ds:left.ds,v:left.v,h:left.h};
}
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
const DEFAULT_MODEL_EXTENT=[[-135,18],[-60,57]];
function dataBounds(){
 const ds=st.ref||st.primary?.datasets?.[0];
 if(!ds)return DEFAULT_MODEL_EXTENT;
 const v=ds.variables?.find(x=>Array.isArray(x.shape)&&x.shape.length===3)||ds.variables?.[0];
 if(!v)return DEFAULT_MODEL_EXTENT;
 const key=JSON.stringify([ds.grid,v.shape,st.cfg?.display?.earthRadiusM]);
 if(extentCache.has(key))return extentCache.get(key);
 try{
  let bounds;
  if(ds.grid?.GRIB_gridType==='regular_ll'){
   // PlateCarreeGrid does not expose LambertGrid's projected ll_x/ur_x
   // corner members. Use the native catalog bounds instead, without ever
   // constructing a giant grid-coordinate array or moving the data itself.
   const g=ds.grid;
   const coord=(plain,grib)=>{const value=g[plain]??g['GRIB_'+grib];return value===undefined||value===null||value===''?NaN:Number(value);};
   let west=coord('longitude_min','longitudeOfFirstGridPointInDegrees');
   let east=coord('longitude_max','longitudeOfLastGridPointInDegrees');
   const a=coord('latitude_min','latitudeOfFirstGridPointInDegrees');
   const b=coord('latitude_max','latitudeOfLastGridPointInDegrees');
   if(![west,east,a,b].every(Number.isFinite))throw Error('missing regular latitude/longitude bounds');
   if(east<west)east+=360; // A valid regional grid may cross the dateline.
   if(east-west>=300){west=-180;east=180;} // 0..360 global grid: fit one complete world.
   else if(west>=180||(west>=0&&east>180)){west-=360;east-=360;}
   bounds=[[west,Math.max(-85,Math.min(a,b))],[east,Math.min(85,Math.max(a,b))]];
  }else{
   const grid=gridFromDataset(ds,v);
   const west=grid.ll_x,east=grid.ur_x,south=grid.ll_y,north=grid.ur_y;
   if(![west,east,south,north].every(Number.isFinite)||typeof grid.transform!=='function')
    throw Error('missing projected grid corner coordinates');
   const n=28;let minLon=Infinity,maxLon=-Infinity,minLat=Infinity,maxLat=-Infinity;
   const check=(x,y)=>{const [lon,lat]=grid.transform(x,y,{inverse:true});if(Number.isFinite(lon)&&Number.isFinite(lat)){
     minLon=Math.min(minLon,lon);maxLon=Math.max(maxLon,lon);
     minLat=Math.min(minLat,lat);maxLat=Math.max(maxLat,lat);}};
   for(let i=0;i<=n;i++){const t=i/n;check(west+(east-west)*t,south);check(west+(east-west)*t,north);check(west,south+(north-south)*t);check(east,south+(north-south)*t);}
   bounds=[[minLon,Math.max(-85,minLat)],[maxLon,Math.min(85,maxLat)]];
  }
  const [[minLon,minLat],[maxLon,maxLat]]=bounds;
  if(![minLon,minLat,maxLon,maxLat].every(Number.isFinite)||minLon>=maxLon||minLat>=maxLat||maxLon-minLon>360.001)
   throw Error('invalid geographic model envelope');
  extentCache.set(key,bounds);return bounds;
 }catch(e){
  // A malformed/incomplete catalog should not emit one identical warning
  // per panel (often 6-9) on Reset View. Fall back to a safe overview.
  console.warn('Could not compute model extent; using default camera bounds',e);
  extentCache.set(key,DEFAULT_MODEL_EXTENT);return DEFAULT_MODEL_EXTENT;
 }
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
  // Fit only determines the *initial* framing. Do not make the model's
  // data envelope a minimum-zoom constraint: users may zoom out to the
  // entire world in 2D, including blank space beyond any source grid.
  // Keep the normal MapLibre minimum (0), just as Globe does.
  map.setMinZoom(0);
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
function applyProjection(map,camera=null,{reset=false}={}){
 const globe=st.mode==='globe';
 // Reset must clear bearing/pitch BEFORE fitting; fitBounds alone retains a
 // tilted camera and previously did not actually restore a flat map.
 if(reset)map.jumpTo({bearing:0,pitch:0});
 if(map.setMaxBounds)map.setMaxBounds(null);
 map.setMinZoom(0);
 map.setProjection({type:globe?'globe':'mercator'});
 map.setMaxZoom(st.cfg.display.maxZoom||12);
 // Recompute flat-view zoom limits without leaving the camera at the fitted
 // overview. fitDataExtent() can otherwise overwrite a user's saved 2D view.
 if(!globe){map.__evuExtentFitted=false;fitDataExtent(map);}
 const target=reset?{...(globe?makeViewBounds():cameraFromMap(map)||makeViewBounds()),bearing:0,pitch:0}:
    camera||(globe?makeViewBounds():cameraFromMap(map)||makeViewBounds());
 const focus=st.expandedPanel?.map===map;
 const maxZoom=Number(st.cfg?.display?.maxZoom)||12;
 const next=focus?{...target,zoom:Math.max(0,Math.min(maxZoom,target.zoom+Number(st.expandedPanel._expandedZoomDelta||0)))}:target;
 map.jumpTo(next);
 for(const p of st.active)if(p.map===map){geographyZoom(p);scheduleWindRedraw(p);}
 return normalCameraFromFocused(map,cameraFromMap(map));
}
function switchProjection(mode,{reset=false}={}){
 if(mode!=='lambert'&&mode!=='globe')return;
 if(mode===st.mode&&!reset)return;
 const outgoingMode=st.mode;
 const terrainWasEnabled=mode==='globe'&&st.terrainEnabled;
 if(terrainWasEnabled){
  // Stop the DEM and any 3-D drape before changing projection. Never keep a
  // checked Terrain toggle that renders no terrain in Globe view.
  st.terrainEnabled=false;
  window.EVUAdvancedMap?.setTerrain(false,mode,st.terrainPanelIds);
 }
 // Snapshot BEFORE changing projection. MapLibre can clamp or recenter the
 // camera during setProjection() and during flat-view extent fitting.
 const outgoing=currentSharedCamera();
 if(mode!==outgoingMode&&outgoing)st.mapViews[outgoingMode]=outgoing;
 st.mode=mode;
 syncTerrainProjectionUI();
 window.EVUAdvancedMap?.setMode(mode);
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
   const applied=applyProjection(p.map,target||firstCamera,{reset:reset&&!firstCamera});
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
   st.difference.map.jumpTo(differenceCameraForViewport(st.mapView||makeViewBounds(),st.difference.map));
   if(st.difference.geo)geographyZoom(st.difference.geo);
  }catch(e){console.warn('Difference map projection update',e);}
 }
 syncUI();
 // Old 3-D weather canvases must be redrawn without terrain once the
 // incoming globe camera has settled. Other projection changes are untouched.
 if(terrainWasEnabled)void renderAll();
}
function syncViews(source){
 if(st.syncing||st.exportRender||!st.cfg.display.syncMaps)return;
 if(st.expandedPanel&&source!==st.expandedPanel.map)return;
 const camera=normalCameraFromFocused(source,cameraFromMap(source));if(!camera)return;
 st.syncing=true;
 try{
  st.mapView=camera;
  st.mapViews[st.mode]=camera;
  // Hidden model canvases are not resized during focus mode. Keep the
  // canonical unexpanded camera and synchronize them when collapsing.
  if(!st.expandedPanel)for(const p of st.active)if(p.map&&p.map!==source)p.map.jumpTo(camera);
  if(st.difference.open&&st.difference.map){
   st.difference.map.jumpTo(differenceCameraForViewport(camera,st.difference.map));
   if(st.difference.geo)geographyZoom(st.difference.geo);
  }
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
// Use the native, non-exaggerated DEM elevation under the pointer. DEM
// geometry, not the current weather field (or a pressure-level height), is
// authoritative. Never report 0 m when MapLibre has not loaded an elevation
// tile; that would silently misrepresent missing terrain as sea level.
function sampledTerrainHeight(p,lon,lat){
 if(!terrainEnabledForPanel(p))return null;
 const map=p.map;
 if(!map||typeof map.queryTerrainElevation!=='function')return 'Terrain elevation unavailable';
 try{
  const meters=map.queryTerrainElevation({lng:lon,lat},{exaggerated:false});
  if(meters===null||meters===undefined||!Number.isFinite(Number(meters)))return 'Terrain elevation unavailable';
  const m=Math.round(Number(meters));
  const ft=Math.round(Number(meters)*3.280839895);
  return `Terrain ${m.toLocaleString('en-US')} m (${ft.toLocaleString('en-US')} ft) MSL`;
 }catch(_){return 'Terrain elevation unavailable';}
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
  if((p.readoutField||p.rawField)&&p.v){try{
    const value=Number((p.readoutField||p.rawField).sampleField(h.lon,h.lat));
    if(Number.isFinite(value)&&value> -1e9){
     const meta=panelFieldInfo(p,p.v);
     const displayed=formatReadout(value,meta);
     reading=displayed==='—'?'No plotted data':`${displayed} ${meta.unit}`.trim();
    }
  }catch(_){}}
  const terrain=sampledTerrainHeight(p,h.lon,h.lat);
  p.info.textContent=`${h.lat.toFixed(2)}°, ${h.lon.toFixed(2)}° · ${reading}${terrain?'\n'+terrain:''}`;
  p.info.hidden=false;
 }
}

// On a phone the desktop right-click inspector has no obvious equivalent.
// A stationary, one-finger hold opens the SAME point menu, while moving more
// than 12 CSS pixels cancels the gesture so normal map pan/pinch still works.
// Bind to the MapLibre canvas (not to the plot's scroll rail or control buttons).
function bindTouchPointInspector(p,m){
 const canvas=m.getCanvas?.();if(!canvas)return;
 let hold=null;
 const clear=()=>{if(hold)clearTimeout(hold.timer);hold=null;};
 canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'||!e.isPrimary||!window.EVUPointInspector)return;
  clear();const x=e.clientX,y=e.clientY,id=e.pointerId;
  const timer=setTimeout(()=>{
   if(!hold||hold.id!==id||p.map!==m)return;
   // An updated map camera is acceptable; convert from the actual pressed
   // screen position only once the press is confirmed.
   const rect=canvas.getBoundingClientRect();
   if(rect.width<1||rect.height<1){clear();return;}
   const point=m.unproject([x-rect.left,y-rect.top]);
   if(!point){clear();return;}
   p.lastLongPressAt=Date.now();
   window.EVUPointInspector.showMenu(p,{lngLat:point,originalEvent:{clientX:x,clientY:y,preventDefault(){}}});
   clear();
  },600);
  hold={id,x,y,timer};
 },{passive:true});
 canvas.addEventListener('pointermove',e=>{
  if(hold&&e.pointerId===hold.id&&Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>12)clear();
 },{passive:true});
 for(const event of ['pointerup','pointercancel','lostpointercapture','touchcancel'])canvas.addEventListener(event,clear,{passive:true});
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!e.isPrimary)clear();},{passive:true});
}
// Camera moves are interactive, not forecast-rendering opportunities. MapLibre
// emits movestart/moveend for ordinary drag, wheel zoom, touch rotation,
// Shift-drag pitch, double-click and synchronized camera changes. Suspend the
// separate Three.js surface render for ALL of them. Shift + pointerdown also
// suspends immediately (before MapLibre has emitted its first movestart).
// Source-data/resize callbacks may arrive while a gesture is in progress:
// they mark the forecast dirty, but never restart its expensive render.
let shiftDragGesture=null;
// Shared camera-gesture hold: a master pan/zoom can update synchronized peers
// with synchronous jumpTo calls. Their moveend may fire while the master is
// STILL moving; independent panel timers would then redraw five old fields.
const forecastMotionSources=new Set();
function shiftDragActive(){return shiftDragGesture!==null;}
function forecastMapsLinked(){return st.cfg?.display?.syncMaps!==false;}
function mapCameraMoving(p){return !!p?.geoMoving||!!p?.map?.isMoving?.()||
 !!p?.map?.isZooming?.()||!!p?.map?.isRotating?.();}
function forecastCameraBusy(p){
 if(st.exportRender)return false; // PNG/GIF capture uses a temporary camera.
 if((shiftDragActive()&&(forecastMapsLinked()||shiftDragGesture.origin===p))||
    p?._evuForecastMoving||mapCameraMoving(p))return true;
 // A synchronized panel stays suspended for the WHOLE linked gesture,
 // including fresh DEM tiles and delayed asynchronous renderer completions.
 return forecastMapsLinked()&&(forecastMotionSources.size>0||
  (st.active||[]).some(other=>mapCameraMoving(other)));
}
function suspendForecastCameraGroup(origin){
 if(st.exportRender)return;
 forecastMotionSources.add(origin);
 for(const p of forecastMapsLinked()?(st.active||[]):[origin])suspendForecastCamera(p);
}
function endForecastCameraMotion(origin){
 forecastMotionSources.delete(origin);
 if(st.exportRender)return;
 for(const p of forecastMapsLinked()?(st.active||[]):[origin])
  if(p.map)scheduleForecastCameraResume(p);
}
function suspendForecastCamera(p){
 if(st.exportRender||!p)return;
 p._evuForecastMoving=true;
 p.shiftRenderPending=!!(p.mobileScalar||p.upperAirGeoOverlay)||!!p.shiftRenderPending;
 clearTimeout(p.mobileScalarTimer);p.mobileScalarTimer=null;
 clearTimeout(p.forecastResumeTimer);p.forecastResumeTimer=null;
 window.EVUThreeSurface?.suspend?.(p); // invalidates queued/in-flight generations
 if(p.mobileScalarCanvas)p.mobileScalarCanvas.style.opacity='0';
 if(p._terrainDetailNotice)p._terrainDetailNotice.hidden=true;
}
function resumeForecastCamera(p){
 if(!p?.map)return;
 clearTimeout(p.forecastResumeTimer);p.forecastResumeTimer=null;
 if(st.exportRender){p._evuForecastMoving=false;window.EVUThreeSurface?.resume?.(p);return;}
 // Re-check movement after the last frame: a rapidly repeated zoom or pan may
 // start another movement before its predecessor's moveend callback runs.
 if((shiftDragActive()&&(forecastMapsLinked()||shiftDragGesture.origin===p))||
    mapCameraMoving(p)||
    (forecastMapsLinked()&&(forecastMotionSources.size>0||
      (st.active||[]).some(other=>mapCameraMoving(other))))){
  p.forecastResumeTimer=setTimeout(()=>resumeForecastCamera(p),130);return;
 }
 p._evuForecastMoving=false;
 window.EVUThreeSurface?.resume?.(p);
 if(p.shiftRenderPending||p.mobileScalar||p.upperAirGeoOverlay)
  scheduleMobileScalarRedraw(p,35+p.i*18);
}
function scheduleForecastCameraResume(p){
 if(st.exportRender)return;
 clearTimeout(p.forecastResumeTimer);
 // 190 ms of quiet prevents an expensive rebuild between adjacent wheel
 // steps, drag inertia frames or synchronized panel camera updates.
 p.forecastResumeTimer=setTimeout(()=>resumeForecastCamera(p),190+p.i*15);
}
function suspendShiftDrag(event){
 if(shiftDragGesture||!event.shiftKey||![0,2].includes(event.button)||event.isPrimary===false)return;
 const host=event.target?.closest?.('.map-host');if(!host)return;
 const panel=st.active.find(p=>p.map?.getContainer?.()===host);
 if(!panel)return;
 shiftDragGesture={pointerId:event.pointerId,origin:panel};
 for(const p of forecastMapsLinked()?st.active:[panel])suspendForecastCamera(p);
}
function finishShiftDrag(event){
 if(!shiftDragGesture)return;
 if(event?.pointerId!==undefined&&event.pointerId!==shiftDragGesture.pointerId)return;
 const origin=shiftDragGesture.origin;
 shiftDragGesture=null;
 for(const p of forecastMapsLinked()?st.active:[origin]){
  if(!p.map)continue;
  // A gesture with no map movement must still release its suspended field.
  // For actual drag/tilt, wait until MapLibre's moveend AND the settle delay.
  scheduleForecastCameraResume(p);
 }
}
function installShiftDragSuspension(){
 document.addEventListener('pointerdown',suspendShiftDrag,true);
 window.addEventListener('pointerup',finishShiftDrag,true);
 window.addEventListener('pointercancel',finishShiftDrag,true);
 window.addEventListener('blur',()=>finishShiftDrag(),true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finishShiftDrag();});
}
// EVU v1.2.90 automated surface synoptic feature overlay.
// Data are derived offline from native MSLP, 2m T/Td, and 10m winds;
// never infer a front directly from the shaded raster or pressure differences.
function surfaceWeatherEligible(){
 return lowTracksAvailableForField();
}
function surfaceWeatherSource(p){
 if(!surfaceWeatherEligible()||p?.cfg?.differencePanel||!p?.ds||!Number.isInteger(p.h)||p.h<0)return null;
 // Require same-hour native MSLP in this data store; never reuse a different
 // cycle or pressure field from an unrelated model when a plot is missing data.
 if(!p.ds.variables?.some(v=>v.name==='mslp'&&v.available_hours?.includes(p.h)))return null;
 const path=String(p.ds.path||'').split('/').pop().replace(/\.zarr$/,'');
 if(/^analysis_[a-z0-9_]+_\d{10}$/.test(path))return {analysis:path};
 const match=/^([a-z][a-z0-9_]*)_(\d{8})_(00|06|12|18)00$/.exec(path);
 if(!match)return null;
 return {model:match[1],date:match[2],cycle:match[3],hour:p.h};
}
function updateSurfaceWeatherSummary(){
 const output=el.surfaceWeatherStatus;
 if(!output)return;
 const enabled=st.surfaceWeatherEnabled&&surfaceWeatherEligible();
 output.hidden=!enabled;
 if(el.surfaceWeatherRetryBtn)el.surfaceWeatherRetryBtn.hidden=true;
 if(!enabled)return;
 const panels=(st.panels||[]).filter(p=>p.map&&!p.cfg?.differencePanel);
 if(!panels.length){output.textContent='Surface weather: waiting for active maps';return;}
 const counts={ready:0,loading:0,empty:0,filtered:0,missing:0,error:0,unsupported:0,waiting:0};
 for(const p of panels){const state=p.surfaceWeatherDisplayState?.state||'waiting';counts[state]=(counts[state]||0)+1;}
 const parts=[];
 if(counts.ready)parts.push(`${counts.ready} with features`);
 if(counts.empty)parts.push(`${counts.empty} with no detected features`);
 if(counts.filtered)parts.push(`${counts.filtered} with no selected features`);
 if(counts.missing)parts.push(`${counts.missing} not published`);
 if(counts.error)parts.push(`${counts.error} download errors`);
 if(counts.unsupported)parts.push(`${counts.unsupported} without matching MSLP`);
 if(counts.loading)parts.push(`${counts.loading} loading`);
 if(counts.waiting)parts.push(`${counts.waiting} waiting for model data`);
 output.textContent='Surface weather: '+(parts.join(' · ')||'waiting for data');
 // Show the underlying error where possible instead of making HTTP 403, 503
 // and malformed HTML responses look like absent meteorological features.
 const firstFailure=panels.find(p=>p.surfaceWeatherDisplayState?.state==='error');
 const failureDetail=firstFailure?.surfaceWeatherDisplayState?.detail||'';
 if(firstFailure){
   const code=/HTTP\s+(\d{3})/.exec(failureDetail);
   const detail=code?`HTTP ${code[1]}`:/invalid geojson|invalid json|not valid json/i.test(failureDetail)?'invalid GeoJSON':'network/response error';
   output.textContent+=` · First error: ${detail}`;
 }
 output.title=firstFailure?[
   failureDetail||'Surface-weather request failed',
   firstFailure.surfaceWeather?._url||''
 ].filter(Boolean).join('\n'):'';
 if(el.surfaceWeatherRetryBtn)el.surfaceWeatherRetryBtn.hidden=!(counts.missing||counts.error||counts.empty);
}
function updateSurfaceWeatherPanelStatus(p,status){
 const note=p?.surfaceWeatherNotice;
 if(!p||!note)return;
 const next=status||{state:'idle'};
 p.surfaceWeatherDisplayState=next;
 const enabled=st.surfaceWeatherEnabled&&surfaceWeatherEligible()&&!p.cfg?.differencePanel&&!!p.map;
 const labels={loading:'Surface weather · Loading…',missing:'Surface weather · Not published for this hour',
  empty:'Surface weather · No features detected',filtered:'Surface weather · No selected features',
  error:'Surface weather · Download failed',unsupported:'Surface weather · No matching MSLP data',
  waiting:'Surface weather · Waiting for model data'};
 if(next.state==='error'){
   const code=/HTTP\s+(\d{3})/.exec(next.detail||'');
   const http=code?Number(code[1]):0;
   if(http===401||http===403)labels.error=`Surface weather · Access denied (HTTP ${http})`;
   else if(http===429)labels.error='Surface weather · Server busy (HTTP 429)';
   else if(http>=500)labels.error=`Surface weather · Server error (HTTP ${http})`;
   else if(http)labels.error=`Surface weather · Download failed (HTTP ${http})`;
   else if(/invalid geojson|invalid json|not valid json/i.test(next.detail||''))labels.error='Surface weather · Invalid overlay response';
   else if(/failed to fetch|networkerror|network request/i.test(next.detail||''))labels.error='Surface weather · Network error';
 }
 note.hidden=!enabled||!labels[next.state];
 if(!note.hidden){
  note.textContent=labels[next.state];note.dataset.status=next.state;
  note.title=[next.detail||labels[next.state],p.surfaceWeather?._url||''].filter(Boolean).join('\n');
 }
 updateSurfaceWeatherSummary();
}
function syncSurfaceWeatherPanel(p){
 const overlay=p?.surfaceWeather;
 if(!overlay)return Promise.resolve(false);
 const enabled=st.surfaceWeatherEnabled&&surfaceWeatherEligible()&&!p.cfg?.differencePanel;
 overlay.canvas.style.display=enabled?'block':'none';
 overlay.setSettings(st.surfaceWeatherSettings);
 const source=enabled?surfaceWeatherSource(p):null;
 if(!source){
  overlay.clear();p.surfaceWeatherFrameKey=null;p.surfaceWeatherPending=null;
  const kind=!enabled?'idle':!p.ds||!Number.isInteger(p.h)?'waiting':'unsupported';
  updateSurfaceWeatherPanelStatus(p,{state:kind,detail:kind==='unsupported'?'No same-hour MSLP source or recognized model/analysis store':''});
  return Promise.resolve(false);
 }
 const key=source.analysis||[source.model,source.date,source.cycle,source.hour].join('_');
 if(p.surfaceWeatherFrameKey===key&&overlay._url&&!((overlay._negative.get(overlay._url)||0)<=Date.now()&&overlay._negative.has(overlay._url))){
   updateSurfaceWeatherPanelStatus(p,overlay.status||{state:'loading'});
   return p.surfaceWeatherPending||Promise.resolve(true);
 }
 p.surfaceWeatherFrameKey=key;
 const job=source.analysis?overlay.setAnalysisFrame(
   source.analysis.slice('analysis_'.length).replace(/_\d{10}$/,''),source.analysis.slice(-10)):
   overlay.setFrame(source.model,source.date,source.cycle,source.hour);
 p.surfaceWeatherPending=job;
 return job;
}
function createMap(p){
 const node=document.createElement('div');node.className='map-host';
 node.style='position:absolute;inset:0;';p.frame.replaceChildren(node);
 const windCanvas=document.createElement('canvas');windCanvas.className='wind-overlay';
 windCanvas.setAttribute('aria-hidden','true');p.frame.append(windCanvas);p.windCanvas=windCanvas;
 const mobileCanvas=document.createElement('canvas');mobileCanvas.className='mobile-scalar-overlay';mobileCanvas.setAttribute('aria-hidden','true');p.frame.append(mobileCanvas);p.mobileScalarCanvas=mobileCanvas;
 const mobileGeo=document.createElement('canvas');mobileGeo.className='mobile-geography-overlay';mobileGeo.setAttribute('aria-hidden','true');p.frame.append(mobileGeo);p.mobileGeoCanvas=mobileGeo;
 const contourCanvas=document.createElement('canvas');contourCanvas.className='contour-overlay';
 contourCanvas.setAttribute('aria-hidden','true');p.frame.append(contourCanvas);p.contourCanvas=contourCanvas;
 const cityCanvas=document.createElement('canvas');cityCanvas.className='city-overlay';cityCanvas.setAttribute('aria-hidden','true');p.frame.append(cityCanvas);p.cityCanvas=cityCanvas;
 const reportCanvas=document.createElement('canvas');reportCanvas.className='amount-reports-overlay';reportCanvas.setAttribute('aria-hidden','true');p.frame.append(reportCanvas);p.amountReportCanvas=reportCanvas;p.amountReportHits=[];p.amountReportClickBound=false;
 const lowTrackCanvas=document.createElement('canvas');lowTrackCanvas.className='low-track-overlay';lowTrackCanvas.setAttribute('aria-hidden','true');lowTrackCanvas.style.display='none';p.frame.append(lowTrackCanvas);p.lowTrackCanvas=lowTrackCanvas;
 const canonical=st.mapView||makeViewBounds();
 const focus=st.expandedPanel===p;
 const delta=focus?expandedViewportZoomAdjustment(p.normalViewportSize,panelViewportSize(p)):0;
 const focusedZoom=Math.max(0,Math.min(st.cfg.display.maxZoom||12,canonical.zoom+delta));
 if(focus)p._expandedZoomDelta=focusedZoom-canonical.zoom;
 const view={...canonical,zoom:focus?focusedZoom:canonical.zoom};
 const m=new maplibregl.Map({container:node,style:mapStyle(),center:view.center,
  zoom:view.zoom,bearing:view.bearing||0,pitch:view.pitch||0,
  projection:{type:st.mode==='globe'?'globe':'mercator'},
  minZoom:0,maxZoom:st.cfg.display.maxZoom||12,maxPitch:75,
  // Keyboard arrows are reserved for forecast-hour / cycle navigation, not map panning.
  keyboard:false,
  // A 2.7x phone framebuffer is about three times the GPU pixel workload
  // of 1.6x. Weather, contours and map coordinates keep their own native
  // resolution; the existing PNG exporter increases/restores this ratio.
  pixelRatio:touchGraphicsDevice()?Math.min(devicePixelRatio||1,
   Math.max(1,Math.min(3,Number(st.cfg?.display?.mobileMapPixelRatio??1.6)))):undefined,
  attributionControl:false,preserveDrawingBuffer:true,fadeDuration:0});
 // Defense-in-depth for MapLibre builds that register keyboard navigation anyway.
 if(m.keyboard?.disable)m.keyboard.disable();
 window.EVUAdvancedMap?.attach(m,p);
 m.dragRotate?.enable?.();m.touchZoomRotate?.enableRotation?.();
 p.map=m;
 if(window.EVUSurfaceWeatherOverlay){
  p.surfaceWeather=new window.EVUSurfaceWeatherOverlay(m,{container:p.frame,baseUrl:'data/surface_weather',settings:st.surfaceWeatherSettings,
   onStatusChange:status=>updateSurfaceWeatherPanelStatus(p,status),
   onError:err=>console.warn('Surface weather overlay unavailable',err)});
  p.surfaceWeatherCanvas=p.surfaceWeather.canvas;
 }
 m.__evuTerrainPanelId=p.cfg.id;p.geoApplied=new Set();p.geoPending=new Set();
 // Contours are CPU-intensive, so never resample or trace them during
 // panning, wheel zoom, touch gestures, or synced camera movements. Hiding
 // the old overlay also avoids lines drifting over the moving map.
 m.on('movestart',()=>{suspendContours(p);if(p.amountReportCanvas)p.amountReportCanvas.style.visibility='hidden';p.geoMoving=true;p.geoRedrawSerial=(p.geoRedrawSerial||0)+1;
  // Unlike the old Shift-only listener, this catches ordinary pan/zoom/tilt
  // and any synchronized camera movement before rendering another forecast.
  suspendForecastCameraGroup(p);
  scheduleWindRedraw(p);
  if(p.mobileGeoCanvas)p.mobileGeoCanvas.style.display='none';setPanelGeographyOverlay(p,false);});
 m.on('move',()=>{if(!st.rendering)syncViews(m);if(p.mobileScalarCanvas)p.mobileScalarCanvas.style.opacity='0';scheduleWindRedraw(p);if(st.hover&&!st.exportRender&&!st.hoverRaf)st.hoverRaf=requestAnimationFrame(()=>{st.hoverRaf=0;paintSynchronizedHover();});});
 m.on('sourcedata',event=>{
  if(event?.sourceId!=='evu-dem'||!terrainEnabledForPanel(p)||event.isSourceLoaded!==true)return;
  // Process only completed DEM source updates, then coalesce their tile
  // events into one mesh refresh. This prevents repeated 90k-vertex builds
  // as a cluster of new elevation tiles finishes arriving.
  clearTimeout(p.terrainDemRefreshTimer);
  p.terrainDemRefreshTimer=setTimeout(()=>{
   p.terrainDemRefreshTimer=null;
   if(p.map!==m||!terrainEnabledForPanel(p)||!p.mobileScalar)return;
   try{if(m.isSourceLoaded?.('evu-dem')===false)return;}catch(_){return;}
   m.__evuTerrainDEMRevision=(m.__evuTerrainDEMRevision||0)+1;
   // This refresh must always query the newly arrived elevations. In
   // particular, do not reuse an incomplete zero-elevation cached mesh.
   window.EVUThreeSurface?.invalidate?.(p);
   scheduleMobileScalarRedraw(p,65+p.i*22);
  },360);
 });
 m.on('resize',()=>{scheduleMobileScalarRedraw(p,80);scheduleWindRedraw(p);scheduleContourRedraw(p,140);scheduleCityUpdate(p);syncAmountReportsPanel(p);});
 // Debounce across rapid wheel steps; stagger synchronized panels so nine
 // expensive contour passes don't block the same animation frame.
 m.on('moveend',()=>{p.geoMoving=false;
  if(st.exportRender)scheduleMobileScalarRedraw(p,110+p.i*20);
  else endForecastCameraMotion(p);
  scheduleContourRedraw(p,160+p.i*35);scheduleWindRedraw(p);scheduleCityUpdate(p);syncAmountReportsPanel(p);});
 m.on('zoomend',()=>geographyZoom(p));
 m.on('mousemove',e=>queueSynchronizedHover(p,e.lngLat));
 m.on('contextmenu',e=>{e.originalEvent?.preventDefault();if(p.lastLongPressAt&&Date.now()-p.lastLongPressAt<1200)return;window.EVUPointInspector?.showMenu(p,e);});
 bindTouchPointInspector(p,m);
 m.on('mouseleave',()=>{if(st.hover?.master===p)clearSynchronizedHover();});
 m.on('error',e=>{p.lastMapError=String(e.error?.message||e.error||e);console.warn('MapLibre',p.lastMapError);const key=String(e.sourceId||'');if(['coast','country','states','counties'].includes(key)){st.geoFailed.set(key,'MapLibre geography source: '+p.lastMapError);geographyStatus();}else if(/geojson/i.test(p.lastMapError)){st.geoFailed.set('coast','MapLibre GeoJSON worker: '+p.lastMapError);geographyStatus();}});
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
  try{addGeographySkeleton(m);updateLiveGeography();window.EVUAdvancedMap?.orderTerrain(m);scheduleCityUpdate(p);syncObservationPanel(p);syncSPCPanel(p);syncLightningPanel(p);syncAmountReportsPanel(p);}
  catch(e){p.lastMapError='Could not install geography layers: '+String(e);console.error(p.lastMapError);}
  updateGeographyVisibility(p);
  if(st.mode==='lambert'&&!st.mapView&&!m.__evuExtentFitted)fitDataExtent(m);
  startGeography(p);
 });
 p.view.classList.add('has-live-map');p.snap.hidden=true;return m;
}
function discardMap(p){
 p.lowTracksSeq=(p.lowTracksSeq||0)+1;p.amountReportHits=[];p.amountReportClickBound=false;
 const heldGesture=forecastMotionSources.delete(p);
 // A canceled MapLibre map won't emit moveend. Release peers after teardown,
 // or they could remain blank until the next independent camera gesture.
 if(heldGesture&&forecastMapsLinked())for(const peer of st.active||[])
  if(peer!==p&&peer.map)scheduleForecastCameraResume(peer);
 p.shiftRenderPending=false;p._evuForecastMoving=false;
 clearTimeout(p.forecastResumeTimer);p.forecastResumeTimer=null;
 window.EVUThreeSurface?.resume?.(p);
 clearTimeout(p.mobileScalarTimer);p.mobileScalarTimer=null;
 clearTimeout(p.terrainDemRefreshTimer);p.terrainDemRefreshTimer=null;
 clearTimeout(p.windRedrawTimer);p.windRedrawTimer=null;
 window.EVUThreeSurface?.dispose?.(p);p.threeDrawPromise=null;
 p.surfaceWeather?.dispose?.();p.surfaceWeather=null;p.surfaceWeatherCanvas=null;
 p.surfaceWeatherPending=null;p.surfaceWeatherFrameKey=null;p.mobileScalar=null;p.upperAirGeoOverlay=false;
 // A dormant panel must not retain old multi-million-cell field arrays via
 // cached CPU samplers after its WebGL map has been released.
 p._flatLambertSpec=null;p._flatLambertSampler=null;
 p._terrainFastSampleField=null;p._terrainFastSample=null;
 p.mobileScalarCanvas?.remove();p.mobileScalarCanvas=null;p.mobileGeoCanvas?.remove();p.mobileGeoCanvas=null;
 p._terrainDetailNotice?.remove();p._terrainDetailNotice=null;
 if(!p.map)return;
 suspendContours(p); // Don't keep timers or RAF work for an evicted panel.
 clearTimeout(p.contextLossTimer);p.contextLossTimer=null;p.contextLost=false;
 // An evicted MapLibre startup must never leave waitMapReady polling until
 // the entire 90-second deadline. Normal viewport eviction intentionally
 // avoids initializing/busy maps, but cancellation is still defensive.
 if(p.cancelMapWait)p.cancelMapWait();
 if(st.hover?.master===p)clearSynchronizedHover();else{p.ghost.hidden=true;p.info.hidden=true;}
 if(p.geoTimer)clearTimeout(p.geoTimer);p.geoTimer=null;
 if(p.cityTimer)clearTimeout(p.cityTimer);p.cityTimer=null;
 try{const snap=p.lastSnapshot||p.map.getCanvas().toDataURL('image/png');p.snap.src=snap;p.lastSnapshot=snap;p.snap.hidden=false;}
 catch(e){console.warn('Could not retain snapshot',e);}
 window.EVUAdvancedMap?.detach(p.map,p);
 p.map.remove();p.map=null;p.wind=null;p.marineWind=null;p.windCanvas=null;p.windFrameRequested=false;p.contourCanvas=null;p.lowTrackCanvas=null;p.lowTrackFeatures=[];p.contourFrameRequested=false;p.cityCanvas?.remove();p.cityCanvas=null;p.component=null;p.layer=null;p.rawField=null;p.readoutField=null;p.contourField=null;p.primaryContourField=null;p.mslpContourField=null;p.heightField=null;p.windSpeed850Field=null;p.temperature850Field=null;p.moistureFields=null;p.lastKey=null;p.mapReady=null;p.grid=null;p.gridKey=null;
 p.initializing=false;p.cancelMapWait=null;
 p.geoApplied=new Set();p.geoPending=new Set();p.obsClickInstalled=null;p.spcClickInstalled=false;p.frame.replaceChildren();
 p.view.classList.remove('has-live-map');st.active=st.active.filter(x=>x!==p);
 updateSurfaceWeatherPanelStatus(p,{state:'idle'});
 updateLowTrackPanelStatus(p,null);
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
   'Open renderer-diagnostics.html; verify vendor-v6/maplibre-gl-worker.js loads and WebGL is enabled.')),timeout);
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
// Multi-model layouts can contain nine MapLibre/WebGL contexts and nine
// independent CPU weather canvases. On a compact touch screen these offscreen
// maps consume GPU/CPU memory without improving the visible plot. Limit ALL
// model sets to a small mobile working set; retain desktop capacity, shared
// decoded data, geographic camera and lazy offscreen map reactivation.
// This is a resource budget, not a change to the data or forecast fields.
function touchGraphicsDevice(){
 // Windows laptops and desktop monitors can report maxTouchPoints > 0 even
 // when the application is being used in a full-sized desktop workspace.
 // Restrict GPU contexts only in a compact/mobile layout.
 try{
  const width=window.innerWidth;
  if(width<=800)return true;
  return width<=1200&&!!window.matchMedia?.('(pointer: coarse) and (hover: none)')?.matches;
 }catch(_){return window.innerWidth<=800;}
}
function configuredMapCapacity(){
 const actual=st.panels.filter(p=>!p.cfg.placeholder).length;
 const configured=Number(st.cfg?.display?.maxActiveMaps);
 const standard=Math.max(1,Math.min(20,actual,Number.isFinite(configured)&&configured>0?Math.floor(configured):actual));
 if(touchGraphicsDevice()){
  const display=st.cfg?.display||{};
  // A site-specific GFS override remains supported for compatibility.
  const raw=st.modelSet==='gfs-versions'&&display.gfsMobileMapCapacity!=null?
   display.gfsMobileMapCapacity:display.mobileMapCapacity;
  const mobileLimit=Number(raw??2);
  return Math.min(standard,Number.isInteger(mobileLimit)&&mobileLimit>=1?
   Math.min(6,mobileLimit):2);
 }
 return standard;
}
function mapCapacity(){
 return Math.min(configuredMapCapacity(),st.mobilePressureCap??20);
}
// Retry a visible panel that encountered full GPU slots while the previous
// panel was still decoding. IntersectionObserver may not notify it again once
// scrolling stops. Never evict a second visible map just to prewarm a third.
function retryWaitingVisibleMobilePanel(){
 if(!touchGraphicsDevice()||st.rendering||st.exporting||st._mobileActivationRetry)return;
 st._mobileActivationRetry=setTimeout(()=>{
  st._mobileActivationRetry=null;
  if(st.rendering||st.exporting||document.hidden)return;
  const free=st.active.length<mapCapacity()||st.active.some(p=>p.map&&!p.busy&&
   !p.initializing&&!p.activation&&!nearViewport(p));
  if(!free)return;
  const p=st.panels.find(p=>!p.cfg.placeholder&&!p.map&&!p.activation&&nearViewport(p));
  if(p)activate(p,'viewport').catch(error=>fail(p,error));
 },110);
}
// Optional browser-console readout for on-device performance comparisons.
window.OMDEVUMobilePerformance={stats:()=>({compact:touchGraphicsDevice(),
 activeMaps:st.active.length,mapCapacity:mapCapacity(),contextLosses:st.contextLossCount,
 mapPixelRatio:st.active[0]?.map?.getPixelRatio?.()??null,
 panels:st.active.map(p=>({id:p.cfg.id,status:p.status,drawMs:p.mobileDrawMs??null,
  stride:p.mobileRenderStride??1})),
 decodedMiB:Math.round(st.cacheBytes/1048576),
 displayMiB:Math.round(st.displayCacheBytes/1048576),
 prefetchMode:prefetchMode()})};
function trimMapsForGpuPressure(){
 if(st.exporting)return;
 // Also used after device rotation into the compact layout. Prefer
 // releasing offscreen, idle contexts; never discard loading maps.
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
 if(touchGraphicsDevice()&&oldCap>1){
  st.mobilePressureCap=Math.max(1,oldCap-1);
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
 // Only serialize MapLibre/worker startup; GPU plots and Zarr fetches remain
 // concurrent. This avoids context/worker contention when all nine panels
 // initialize together, regardless of screen size.
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
   p.status='waiting';setNote(p,source==='viewport'?(touchGraphicsDevice()?'Waiting for a free mobile map slot…':'Waiting for a free map slot…'):'Finishing another map; tap this panel again if needed');updateStatus();
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
  syncObservationPanel(p);syncSPCPanel(p);syncLightningPanel(p);syncAmountReportsPanel(p);
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
 await renderPanel(p,st.seq);updateMapBackground();updateLiveGeography();scheduleDifferenceRefresh();
}
function syncCategoricalDifferenceControls(){
 const blocked=DIFFERENCE_BLOCKED_FIELDS.has(selectedShadingField());
 if(blocked){
  if(st.difference.open)closeDifferenceWindow();
  else{
   st.difference.selected=[];
   if(el.differenceDialog?.open)el.differenceDialog.close();
  }
 }
 for(const p of st.panels){
  if(!p.compare||!p.compareCheck)continue;
  p.compare.hidden=st.modelSet==='gfs-versions'||!!p.cfg?.placeholder||blocked;
  p.compareCheck.disabled=blocked;
  p.compareCheck.checked=!blocked&&st.difference.selected.includes(p);
 }
}
async function renderAll(){syncCategoricalDifferenceControls();window.EVUAdvancedMap?.setFieldOpacity(st.imageOpacity,surfaceTerrainField(st.field));window.EVUPointInspector?.scheduleSoundingRefresh();void refreshObservationOverlay();void refreshSPCReports();void refreshLightningReports();void refreshAmountReports();if(st.prefetchContext!==null&&st.prefetchContext!==prefetchContextKey())cancelQueuedPrefetches();st.seq++;invalidateDifferenceForViewChange();st.rendering=true;const seq=st.seq;for(const p of st.panels){p.save.disabled=true;p.snap.hidden=true;p.lastSnapshot=null;if(p.cfg.placeholder){p.status='missing';continue;}if(!p.map){p.status='waiting';setNote(p,'Select or scroll to this panel to render');}}try{await Promise.all(st.active.filter(p=>p.map).map(p=>renderPanel(p,seq)));}finally{st.rendering=false;updateMapBackground();updateLiveGeography();updateStatus();schedulePrefetch();scheduleDifferenceRefresh();retryWaitingVisibleMobilePanel();}}
// The compressed-byte store is optional. CacheStorage is available under HTTPS
// (or localhost), survives browser reloads, and holds many forecast hours without
// filling the decoded GPU-data caches. Missing/quota-restricted storage simply
// degrades to a bounded memory-only look-ahead.
class CompressedZarrStore {
 constructor(){this.cache=null;this.opening=null;this.disabled=false;this.entries=new Map();this.bytes=0;this.pendingWrite=Promise.resolve();this.foregroundRecentlyUsed=new Map();this.quotaFailures=0;this.adaptiveBudgetBytes=null;}
 get budget(){const limit=Math.max(32,Math.min(4096,Number(st.cfg?.display?.prefetchDiskCacheMB??512)));
  return Math.min((touchGraphicsDevice()?Math.min(256,limit):limit)*1048576,this.adaptiveBudgetBytes??Infinity);}
 get maxItems(){const limit=Math.max(16,Math.min(3000,Number(st.cfg?.display?.prefetchDiskMaxChunks??550)));
  return touchGraphicsDevice()?Math.min(200,limit):limit;}
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
 const configured=Math.max(2,Math.min(12,Number(d.maxConcurrentFetches||6)));
 const mobile=touchGraphicsDevice(),cap=mobile?Math.min(4,configured):configured;
 const mode=prefetchMode();
 const desired=Math.min(Math.max(1,cap-2),Math.max(1,Number(mode==='idle'?d.prefetchIdleConcurrency??4:d.prefetchActiveConcurrency??2)),mobile?(mode==='idle'?2:1):Infinity);
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
 const limit=Math.max(8,Number(st.cfg.display.decodedCacheMB||96));
 const max=(touchGraphicsDevice()?Math.min(128,limit):limit)*1024*1024;
 while(st.cacheBytes>max&&st.cache.size>1){const oldest=st.cache.keys().next().value;st.cacheBytes-=st.cache.get(oldest).byteLength;st.cache.delete(oldest);st.cacheStats.decodedEvicted++;}
}
function displayKey(src,ds,v,h,m){
 const url=new URL(`${ds.path}/${v.name}/${h}.0.0`,new URL('.',src.url)).href;
 return url+'::'+(m.convert||'native')+'::'+(m.differenceField?'signed':'absolute')+'::'+(m.maxValidDisplay??'unlimited');
}
function displayCacheGet(k){const v=st.displayCache.get(k);if(v){st.cacheStats.displayReady++;st.displayCache.delete(k);st.displayCache.set(k,v);const raw=k.split('::')[0];if(st.chunkStore?.entries.has(raw))st.chunkStore.rememberForeground(raw);}return v;}
function displayCachePut(k,v){
 if(st.displayCache.has(k))st.displayCacheBytes-=st.displayCache.get(k).byteLength;
 st.displayCache.delete(k);st.displayCache.set(k,v);st.displayCacheBytes+=v.byteLength;
 const limit=Math.max(16,Number(st.cfg.display.displayReadyCacheMB||128));
 const max=(touchGraphicsDevice()?Math.min(96,limit):limit)*1024*1024;
 while(st.displayCacheBytes>max&&st.displayCache.size>1){const oldest=st.displayCache.keys().next().value;st.displayCacheBytes-=st.displayCache.get(oldest).byteLength;st.displayCache.delete(oldest);st.cacheStats.displayEvicted++;}
}
async function getDisplayData(src,ds,v,h,m,onProgress){
 const k=displayKey(src,ds,v,h,m),cached=displayCacheGet(k);
 if(cached)return cached;
 if(st.displayInflight.has(k))return st.displayInflight.get(k);
 const pending=(async()=>{
  let raw;
  if(v.derivedWindSpeed850){
   const u=ds.variables.find(item=>item.name==='u850'&&item.available_hours?.includes(h));
   const w=ds.variables.find(item=>item.name==='v850'&&item.available_hours?.includes(h));
   if(!u||!w||u.shape[1]!==w.shape[1]||u.shape[2]!==w.shape[2])
    throw Error('850-hPa wind speed requires matching U850 and V850 in the same native grid and forecast hour.');
   onProgress('Deriving 850-hPa wind speed from native U/V…');
   const [ud,wd]=await Promise.all([getDisplayData(src,ds,u,h,{convert:'native'},()=>{}),
                                     getDisplayData(src,ds,w,h,{convert:'native'},()=>{})]);
   raw=new Float32Array(ud.length);
   for(let i=0;i<raw.length;i++){
    const x=ud[i],y=wd[i];
    raw[i]=Number.isFinite(x)&&Number.isFinite(y)&&x>-1e9&&y>-1e9?Math.hypot(x,y):-1e10;
   }
  }else raw=await chunk(src,ds,v,h,onProgress);
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
function precipitationHourlyRecord(src,instant,product){
 // Catalogs are immutable between reloads. Index once per dataset array and
 // share the index among all 6/9 panels rather than scanning thousands of
 // valid-time records for every candidate accumulation interval.
 const datasets=src?.datasets;if(!Array.isArray(datasets))return null;
 const cache=precipitationHourlyRecord.cache||(precipitationHourlyRecord.cache=new WeakMap());
 let index=cache.get(datasets);
 if(!index){
  index=new Map();
  for(const ds of datasets){
   if(!ds?.product||!ds.init_time||!ds.variables?.some(v=>v.name==='apcp'&&v.available_hours?.includes(0)))continue;
   const key=ds.product+'|'+cycleKey(ds.init_time);
   if(!index.has(key))index.set(key,ds);
  }
  cache.set(datasets,index);
 }
 return index.get(product+'|'+new Date(instant).toISOString())||null;
}
function mrmsHourlyRecord(src,instant){return precipitationHourlyRecord(src,instant,'mrms_apcp');}
function rotationHourlyRecord(src,instant){const key=new Date(instant).toISOString();return src?.datasets?.find(ds=>ds.product==='mrms_rotation_ml60'&&cycleKey(ds.init_time)===key&&ds.variables?.some(v=>v.name==='rottrack_ml60'&&v.available_hours?.includes(0)));}
function missingRotationTrackHours(src,ref,lead){const missing=[];for(let hour=1;hour<=lead;hour++){const record=rotationHourlyRecord(src,valid(ref,hour));if(!record?.variables?.some(v=>v.name==='rottrack_ml60'&&v.available_hours?.includes(0)))missing.push(fmt(valid(ref,hour)));}return missing;}
function precipitationSourceLabel(product){
 return /^(?:gfs_)?ccpa_/.test(product)?'CCPA':/^(?:gfs_)?stageiv_/.test(product)?'Stage IV':/pass2|_6h|_24h/.test(product)?'MRMS Pass 2':'MRMS Pass 1';
}
function missingPrecipitationHours(src,ref,lead,window,product){
 const missing=[];let grid=null;
 for(let hr=Math.max(1,lead-window+1);hr<=lead;hr++){
  const record=precipitationHourlyRecord(src,valid(ref,hr),product);
  const variable=record?.variables.find(v=>v.name==='apcp');
  if(!record||!variable){missing.push(fmt(valid(ref,hr)));continue;}
  const signature=accumulationGridKey(record,variable);
  if(grid!==null&&grid!==signature)missing.push(fmt(valid(ref,hr))+' (grid mismatch)');
  if(grid===null)grid=signature;
 }
 return missing;
}
// Prefer complete hourly CCPA at all valid hours. If hourly data have not
// been fully backfilled, accept complete, non-overlapping CCPA 3/6-h records
// within the same grid. Only then fall back to complete Stage IV/MRMS hours.
function precipitationSourcePlan(src,ref,lead,window){
 if(!src||!ref||!Number.isInteger(lead)||!Number.isInteger(window)||window<1||lead<window)return null;
 return ccpaNativePlan(src,ref,lead,window,'ccpa_')||
  nonCcpaPrecipitationPlan(src,ref,lead,window,'');
}
function preferredPrecipitationSource(src,ref,lead,window){
 return precipitationSourcePlan(src,ref,lead,window)?.records.at(-1)?.ds.product||null;
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
 return missingPrecipitationHours(src,ref,lead,window,'mrms_apcp');
}
function missingMrmsHours(src,ref,lead){return missingMrmsIntervalHours(src,ref,lead,lead);}
function accumulationGridKey(ds,v){return JSON.stringify([ds.grid,v.shape.slice(1)]);}
async function ccpaWindowTotal(p,ds,v,lead,window,m,onProgress,seq){
 const plan=precipitationSourcePlan(p.src,st.ref,lead,window);
 if(!plan||plan.source!=='CCPA')throw Error(`Complete CCPA ${window}-hour analysis unavailable.`);
 const n=v.shape[1]*v.shape[2],sum=new Float32Array(n),grid=accumulationGridKey(ds,v);
 for(let j=0;j<plan.records.length;j++){
  if(seq!==st.seq)return null;
  const {ds:record,v:variable}=plan.records[j];
  if(accumulationGridKey(record,variable)!==grid)throw Error('CCPA accumulation grid mismatch');
  onProgress(`CCPA ${window}-hour accumulation: interval ${j+1}/${plan.records.length}…`);
  const values=await getDisplayData(p.src,record,variable,0,m,()=>{});
  if(seq!==st.seq)return null;
  if(values.length!==n)throw Error('CCPA accumulation shape mismatch');
  for(let i=0;i<n;i++)sum[i]=Number.isFinite(sum[i])&&Number.isFinite(values[i])&&values[i]>=0?sum[i]+values[i]:NaN;
 }
 return sum;
}
async function mrmsWindowTotal(p,ds,v,lead,window,m,onProgress,seq){
 const plan=precipitationSourcePlan(p.src,st.ref,lead,window),label=precipitationSourceLabel(ds.product);
 if(!plan||plan.records.at(-1).ds.product!==ds.product)
  throw Error(`No complete, same-source ${label} ${window}-hour accumulation is available.`);
 const n=v.shape[1]*v.shape[2],total=new Float32Array(n),grid=accumulationGridKey(ds,v);
 for(let j=0;j<plan.records.length;j++){
  if(seq!==st.seq)return null;
  const {ds:record,v:rv,interval}=plan.records[j];
  if(accumulationGridKey(record,rv)!==grid)throw Error(`${label} accumulation grid mismatch`);
  onProgress(`${label}: loading ${interval}-h interval ${j+1}/${plan.records.length}…`);
  const values=await getDisplayData(p.src,record,rv,0,m,()=>{});
  if(seq!==st.seq)return null;
  if(values.length!==n)throw Error(`${label} precipitation grid shape mismatch`);
  for(let i=0;i<n;i++){
   const a=total[i],b=values[i];
   total[i]=Number.isFinite(a)&&Number.isFinite(b)&&b>=0?a+b:NaN;
  }
 }
 return total;
}
async function mrmsRunningTotal(p,ds,v,lead,m,onProgress,seq){
 const src=p.src,reference=st.ref,product=ds.product,label=precipitationSourceLabel(product);
 const plan=precipitationSourcePlan(src,reference,lead,lead);
 if(!plan||plan.records.at(-1).ds.product!==product)throw Error(`${label} running total unavailable; no complete provider window.`);
 if(plan.records.some(record=>record.interval!==1||record.ds.product!==product))
  return mrmsWindowTotal(p,ds,v,lead,lead,m,onProgress,seq);
 const key=String(src.url)+'|'+product+'|'+reference.init_time+'|'+accumulationGridKey(ds,v);
 const previous=st.mrmsAccumCache;
 let total,from=0;
 if(previous?.key===key&&previous.upto<=lead){total=previous.data.slice();from=previous.upto;}
 else total=new Float32Array(v.shape[1]*v.shape[2]);
 if(lead===0)return total;
 for(let hour=from+1;hour<=lead;hour++){
  if(seq!==st.seq)return null;
  const record=precipitationHourlyRecord(src,valid(reference,hour),product);
  const rv=record.variables.find(x=>x.name==='apcp');
  if(accumulationGridKey(record,rv)!==accumulationGridKey(ds,v))
   throw Error(`${label} running total unavailable: hourly grids differ at ${fmt(record.init_time)}`);
  onProgress(`${label} total: adding hour ${hour} of ${lead}…`);
  const values=await getDisplayData(src,record,rv,0,m,()=>{});
  if(seq!==st.seq)return null;
  if(values.length!==total.length)throw Error(`${label} hourly precipitation grid shape mismatch`);
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
async function mrmsRotationRunningMaximum(p,ds,v,lead,m,onProgress,seq){
 const n=v.shape[1]*v.shape[2],key=String(p.src.url)+'|'+st.ref.init_time+'|'+accumulationGridKey(ds,v);
 const cache=st.rotationTrackAccumCache;
 const reuse=cache?.key===key&&cache.upto<=lead;
 const output=reuse?cache.data.slice():new Float32Array(n).fill(NaN);
 for(let hour=(reuse?cache.upto:0)+1;hour<=lead;hour++){
  if(seq!==st.seq)return null;
  const record=rotationHourlyRecord(p.src,valid(st.ref,hour));
  const variable=record?.variables?.find(x=>x.name==='rottrack_ml60'&&x.available_hours?.includes(0));
  if(!variable)throw Error(`Missing MRMS mid-level 60-minute rotation track ending ${fmt(valid(st.ref,hour))}`);
  if(accumulationGridKey(record,variable)!==accumulationGridKey(ds,v))throw Error('MRMS rotation track grids differ during running maximum');
  onProgress(`MRMS rotation track running maximum: hour ${hour} of ${lead}…`);
  const values=await getDisplayData(p.src,record,variable,0,m,()=>{});
  if(values.length!==n)throw Error('MRMS rotation track grid size changed');
  for(let i=0;i<n;i++){const x=values[i];if(Number.isFinite(x)&&x>=0)output[i]=Number.isFinite(output[i])?Math.max(output[i],x):x;}
 }
 st.rotationTrackAccumCache={key,upto:lead,data:output};
 return output;
}

// Use native instantaneous categorical flags when a RAP analysis catalog
// does not yet publish its derived Ptype variable. Do not fabricate flags or
// substitute another model's valid time.
const NATIVE_PTYPE_FLAGS=['crain','csnow','cfrzr','cicep'];
function nativeAnalysisPtypeVariable(ds,h){
 const v=ds.variables?.find(x=>x.name==='ptype'&&x.available_hours?.includes(h));
 if(v)return v;
 const flags=NATIVE_PTYPE_FLAGS.map(name=>ds.variables?.find(x=>x.name===name&&x.available_hours?.includes(h)));
 if(flags.some(v=>!v))return null;
 const base=flags[0];
 if(flags.some(v=>v.shape?.[1]!==base.shape?.[1]||v.shape?.[2]!==base.shape?.[2]))return null;
 return {...base,name:'ptype',derivedNativePtype:true,attrs:{long_name:'Derived precipitation type from instantaneous native categorical fields',units:'category'},available_hours:[h]};
}
function deriveCategoricalPtype(flags){
 if(flags.length!==4||flags.some(a=>!a||a.length!==flags[0].length))throw Error('Categorical precipitation arrays have incompatible shapes.');
 const out=new Float32Array(flags[0].length);
 for(let i=0;i<out.length;i++){
  const known=flags.some(a=>Number.isFinite(a[i])&&a[i]>-1e9&&a[i]<1e9);
  const yes=flags.map(a=>Number.isFinite(a[i])&&a[i]>=.5&&a[i]<1e9),n=yes.filter(Boolean).length;
  out[i]=!known?-1e10:n>1?5:yes[0]?1:yes[1]?2:yes[2]?3:yes[3]?4:0;
 }
 return out;
}
async function readNativePtype(src,ds,v,h,onProgress){
 if(!v.derivedNativePtype)return getDisplayData(src,ds,v,h,FIELDS.ptype,onProgress);
 const flags=NATIVE_PTYPE_FLAGS.map(name=>ds.variables.find(x=>x.name===name&&x.available_hours?.includes(h)));
 if(flags.some(x=>!x))throw Error('Native categorical precipitation flags missing from the requested forecast hour.');
 const data=await Promise.all(flags.map(x=>getDisplayData(src,ds,x,h,{convert:'native'},()=>{})));
 return deriveCategoricalPtype(data);
}
function validPtypeCount(array){
 let hits=0;for(let i=0;i<array.length;i++)if(Number.isInteger(array[i])&&array[i]>=1&&array[i]<=5)hits++;
 return hits;
}
async function hrrrF000Ptype(p,ds,pv,h,category,onProgress){
 if(h!==0||!(/^hrrr(?:$|v|_)/i.test(String(ds.model||''))||/^hrrr$/i.test(String(p.cfg?.source||'')))||validPtypeCount(category)>0)return category;
 // A published Ptype F000 full of code 0 may indicate the converter took
 // zero-length F000 accumulations instead of the HRRR instantaneous C* flags.
 // Recover ONLY if the four actual same-hour category fields were published.
 const variables=NATIVE_PTYPE_FLAGS.map(k=>ds.variables?.find(v=>v.name===k&&v.available_hours?.includes(0)&&v.shape?.[1]===pv.shape?.[1]&&v.shape?.[2]===pv.shape?.[2]));
 if(variables.some(x=>!x)){
  throw Error('HRRR F000 precipitation type contains only None/Unknown. The converter must derive Ptype from instantaneous CRAIN/CSNOW/CFRZR/CICEP in wrfnat F000; no F001 substitution is permitted.');
 }
 onProgress('Recovering HRRR F000 Ptype from native instantaneous categorical flags…');
 const flags=await Promise.all(variables.map(v=>getDisplayData(p.src,ds,v,0,{convert:'native'},()=>{})));
 const out=deriveCategoricalPtype(flags);
 if(!validPtypeCount(out))throw Error('HRRR F000 native precipitation flags are all empty. Check converter extraction from wrfnat F000 and GRIB inventory; F001 will not be substituted.');
 return out;
}
// Align a continuous URMA/RTMA/RAP analysis to the selected GFS forecast
// geography. The forecast grid is always the target; unmatched grid cells
// remain missing, and all data remain in display units (miles or feet).
function alignAviationToGfsGrid(observed,values,forecast){
 const target=gridFromDataset(forecast.ds,forecast.v),source=gridFromDataset(observed.ds,observed.v);
 const sourceField=new apgl.RawScalarField(source,values),coords=target.getGridCoords();
 const [unused,ny,nx]=forecast.v.shape;
 if(coords?.x?.length!==nx||coords?.y?.length!==ny)throw Error('GFS aviation target grid coordinates do not match forecast field.');
 const fast=globalThis.EVUFastWindSampler?.build?.(sourceField,sourceField);
 const samplePair=[NaN,NaN],out=new Float32Array(nx*ny);
 let overlap=0;
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const [lon,lat]=target.transform(coords.x[i],coords.y[j],{inverse:true});
  const value=Number(fast?fast.sample(lon,lat,samplePair)[0]:sourceField.sampleField(lon,lat));
  const accepted=Number.isFinite(value)&&value>-1e9&&value<1e9;
  out[j*nx+i]=accepted?value:NaN;
  if(accepted)overlap++;
 }
 if(!overlap)throw Error('URMA/RTMA aviation analysis and GFS have no geographic overlap.');
 return out;
}
async function getPanelDisplayData(p,ds,v,h,m,onProgress,seq){
 if(p.gfsAviationCompare){
  const obs=p.gfsAviationCompare.observation;
  const forecastPanel={...p,cfg:{source:p.gfsAviationCompare.modelId,field:panelSelectedField(p)},
   gfsAviationCompare:null,gfsNativeCompare:null,gfsObservedCompare:null,gfsObservedAnalysis:null};
  const observedPanel={...p,src:obs.src,cfg:{source:'analysis',timeMode:'analysis',field:panelSelectedField(p)},
   gfsAviationCompare:null,gfsNativeCompare:null,gfsObservedCompare:null,gfsObservedAnalysis:null};
  onProgress('Loading GFS forecast and corresponding URMA/RTMA analysis…');
  const [forecastValues,analysisValues]=await Promise.all([
   getPanelDisplayData(forecastPanel,ds,v,h,fieldInfo(v,panelSelectedField(p),ds.model||p.gfsAviationCompare.modelId),()=>{},seq),
   getPanelDisplayData(observedPanel,obs.ds,obs.v,obs.h,FIELDS[panelSelectedField(p)],()=>{},seq)
  ]);
  if(!forecastValues||!analysisValues)return null;
  const aligned=sameGfsAnalysisGrid({ds,v},{ds:obs.ds,v:obs.v})?analysisValues:
   alignAviationToGfsGrid({ds:obs.ds,v:obs.v},analysisValues,{ds,v});
  return signedSnowChange(forecastValues,aligned);
 }
 // Selection-time fallback for RAP without radar; never interpret Ptype
 // category codes as dBZ or label them as reflectivity.
 if(p.analysisCategoricalOnly&&p.cfg.timeMode==='analysis'&&panelSelectedField(p)==='refc_ptype')
  return readNativePtype(p.src,ds,v,0,onProgress);
 // Optional native RAP reflectivity fallback (only when truly published).
 if(p.analysisNativeRadar&&p.cfg.timeMode==='analysis'&&panelSelectedField(p)==='refc_ptype'){
  const [reflectivity,ptype]=await Promise.all([
   getDisplayData(p.src,ds,v,0,FIELDS.refc,onProgress),
   readNativePtype(p.src,ds,p.analysisNativeRadar.ptype,0,()=>{})]);
  return blendReflectivityPtype(reflectivity,ptype);
 }
 if(p.analysisRadar&&['analysis','gfs-analysis'].includes(p.cfg.timeMode)&&panelSelectedField(p)==='refc_ptype'){
  const radar=p.analysisRadar;
  const ptypeVariable=p.cfg.timeMode==='analysis'?v:ds.variables.find(x=>x.name==='ptype');
  const targetVariable=ptypeVariable;
  // MRMS and both NWP models use different grids. Sample geographic
  // coordinates, never corresponding array indices.
  const cacheKey=displayKey(p.src,ds,targetVariable,0,FIELDS.ptype)+'::mrms-refc-v2::'+
   displayKey(radar.src||p.src,radar.ds,radar.v,0,FIELDS.refc);
  const cached=displayCacheGet(cacheKey);
  if(cached)return cached;
  const radarPromise=getDisplayData(radar.src||p.src,radar.ds,radar.v,0,FIELDS.refc,()=>{})
   .then(values=>({values}),error=>({error}));
  const [ptype,radarResult]=await Promise.all([
   readNativePtype(p.src,ds,ptypeVariable,0,onProgress),radarPromise]);
  if(radarResult.error){
   // MRMS may be catalogued while its chunk is still arriving on RZDM.
   // Use the matching model's F000 values, never a stale radar snapshot.
   console.warn('MRMS reflectivity unavailable; using same-valid-time model fallback',radarResult.error);
   p.analysisRadar=null;
   if(p.cfg.timeMode==='gfs-analysis'){
    onProgress('MRMS unavailable; using native GFSv16 F000 reflectivity and Ptype…');
    const native=await getDisplayData(p.src,ds,v,0,FIELDS.refc,()=>{});
    return blendReflectivityPtype(native,ptype);
   }
   const native=ds.variables.find(x=>x.name==='refc'&&x.available_hours?.includes(0)&&
     x.shape?.[1]===v.shape?.[1]&&x.shape?.[2]===v.shape?.[2]);
   if(native){
    p.analysisNativeRadar={ptype:v};
    onProgress('MRMS unavailable; using native RAP F000 reflectivity and Ptype…');
    return blendReflectivityPtype(await getDisplayData(p.src,ds,native,0,FIELDS.refc,()=>{}),ptype);
   }
   p.analysisCategoricalOnly=true;
   onProgress('MRMS unavailable; showing RAP F000 precipitation type only…');
   return ptype;
  }
  const target=gridFromDataset(ds,targetVariable),source=gridFromDataset(radar.ds,radar.v);
  const radarField=new apgl.RawScalarField(source,radarResult.values);
  const ny=targetVariable.shape[1],nx=targetVariable.shape[2];
  const encoded=new Float32Array(nx*ny);
  const coords=target.getGridCoords();
  if(coords?.x?.length!==nx||coords?.y?.length!==ny)
   throw Error('Model F000 Ptype grid coordinates do not match published array.');
  const fast=globalThis.EVUFastWindSampler?.build?.(radarField,radarField);
  const pair=[NaN,NaN];
  const sample=(lon,lat)=>fast?fast.sample(lon,lat,pair)[0]:radarField.sampleField(lon,lat);
  onProgress('Aligning MRMS reflectivity to '+(p.cfg.timeMode==='analysis'?'RAP':'GFSv16')+' F000 Ptype…');
  const yieldToMobile=touchGraphicsDevice()&&nx*ny>350000;
  for(let y=0;y<ny;y++){
   if(seq!==st.seq)return null;
   // A whole global GFS F000 grid can take a noticeable time to align.
   // Preserve the native category positions but let Android paint/touch
   // events run between small scanline groups instead of freezing the UI.
   if(yieldToMobile&&y>0&&y%32===0){
    await new Promise(resolve=>requestAnimationFrame(resolve));
    if(seq!==st.seq)return null;
   }
   for(let x=0;x<nx;x++){
    const [lon,lat]=target.transform(coords.x[x],coords.y[y],{inverse:true}),k=y*nx+x;
    const d=Number(sample(lon,lat)),t=ptype[k],code=Math.round(t);
    encoded[k]=Number.isFinite(d)&&d>=10&&d<1e9&&Number.isFinite(t)&&Math.abs(t-code)<.01&&code>=1&&code<=5
     ?(code-1)*80+Math.min(d,79.9):-1e10;
   }
  }
  displayCachePut(cacheKey,encoded);
  return encoded;
 }

 if(p.gfsNativeCompare){
  const {left,right}=p.gfsNativeCompare;
  onProgress('Computing GFS difference from matching native source fields…');
  const leftMeta=panelFieldInfo(left.panel,left.v),rightMeta=panelFieldInfo(right.panel,right.v);
  const [a,b]=await Promise.all([
   getPanelDisplayData(left.panel,left.ds,left.v,left.h,leftMeta,()=>{},seq),
   getPanelDisplayData(right.panel,right.ds,right.v,right.h,rightMeta,()=>{},seq)
  ]);
  if(!a||!b)return null;
  if(a.length!==b.length)throw Error('Native GFS difference grids have different dimensions.');
  const result=new Float32Array(a.length);
  for(let i=0;i<result.length;i++){
   const x=a[i],y=b[i];
   result[i]=Number.isFinite(x)&&Number.isFinite(y)&&x>-1e9&&y>-1e9?x-y:-1e10;
  }
  return result;
 }
 const snowfall=gfsSnowSpec(st.field);
 if(p.gfsObservedAnalysis)
  return gfsObservedValues(p.gfsObservedAnalysis.records,st.field,null,onProgress,seq);
 if(p.gfsObservedCompare){
  const {modelId,records}=p.gfsObservedCompare;
  const nativePanel={...p,cfg:{source:modelId},gfsObservedAnalysis:null,gfsObservedCompare:null,snowCompare:null};
  const modelValues=await getPanelDisplayData(nativePanel,ds,v,h,m,onProgress,seq);
  if(!modelValues)return null;
  const observedValues=await gfsObservedValues(records,st.field,{ds,v},onProgress,seq);
  if(!observedValues)return null;
  return signedSnowChange(modelValues,observedValues);
 }
 // NOHRSC is an observed snowfall depth, not liquid equivalent. Preserve
 // the native analysis conversion and supported periods.
 if(snowfall&&(p.cfg.timeMode==='gfs-analysis'||p.cfg.timeMode==='analysis')&&/^nohrsc_/.test(ds.product||'')){
  const observedMeta={...m,convert:'mtoin'};
  if(snowfall.period===48)return nohrsc48hTotal(p,ds,v,observedMeta,onProgress,seq);
  if(snowfall.period===0)return nohrscRunningTotal(p,ds,v,observedMeta,onProgress,seq);
  return getDisplayData(p.src,ds,v,0,observedMeta,onProgress);
 }
 // A WEASD change comparison uses positive gains of each source separately.
 if(snowfall?.method==='slr10'&&p.snowCompare&&p.cfg.differencePanel){
  const {src16,d16,v16,src17,d17,v17}=p.snowCompare;
  const before=snowfall.period?h-snowfall.period:0;
  const gain=async(src,d,v)=>{
   const now=await getDisplayData(src,d,v,h,m,onProgress);
   const old=await getDisplayData(src,d,v,before,m,()=>{});
   return positiveSnowpackGain(now,old);
  };
  const a=await gain(src17,d17,v17),b=await gain(src16,d16,v16);
  return signedSnowChange(a,b);
 }
 if(snowfall){
  if(st.modelSet!=='gfs-versions'&&!snowfall.rrfs)throw Error('Snowfall field selected outside its model set');
  const current=await getDisplayData(p.src,ds,v,h,m,onProgress);
  const priorHour=snowfall.period?h-snowfall.period:0;
  // Native TSNOWP is a cumulative precipitation product (F000 need not exist).
  // v16 WEASD is a snowpack STATE, so F000/interval-start is mandatory.
  const sweProxy=gfsUsesSweChange(st.field,ds.model);
  if(snowfall.method==='slr10'&&!sweProxy&&(!snowfall.period||h===snowfall.period))return current;
  if(priorHour>=h||!v.available_hours.includes(priorHour))
   throw Error(`${m.label} missing earlier F${pad3(priorHour)} native ${v.name} field`);
  onProgress(`Computing ${m.label} from F${pad3(priorHour)} to F${pad3(h)}…`);
  const previous=await getDisplayData(p.src,ds,v,priorHour,m,()=>{});
  // Snow depth change is floored at zero for snowfall visualization; differences between distinct forecast products remain signed.
  return snowfall.method==='depthChange'
   ?positiveSnowpackGain(current,previous):sweProxy?positiveSnowpackGain(current,previous):differenceAccumulations(current,previous);
 }
 if(st.field==='mxuphl_run'&&p.cfg.timeMode==='analysis')return mrmsRotationRunningMaximum(p,ds,v,st.hour,m,onProgress,seq);
 const window=precipitationAccumulationHours(st.field);
 if(st.field==='asnow'&&p.cfg.timeMode==='analysis'&&ds.product==='nohrsc_6h')
  return nohrscRunningTotal(p,ds,v,m,onProgress,seq);
 if(st.field==='snow48h'&&p.cfg.timeMode==='analysis')
  return nohrsc48hTotal(p,ds,v,m,onProgress,seq);
 if(window&&p.cfg.timeMode==='analysis'&&/^ccpa_/.test(ds.product))return ccpaWindowTotal(p,ds,v,st.hour,window,m,onProgress,seq);
 if(st.field==='apcp'&&p.cfg.timeMode==='analysis'&&/^ccpa_/.test(ds.product))return ccpaWindowTotal(p,ds,v,st.hour,st.hour,m,onProgress,seq);
 if(window&&p.cfg.timeMode==='analysis'&&/^(?:stageiv_(?:apcp|6h|24h)|mrms_apcp(?:_pass2|_6h|_24h)?)$/.test(ds.product))
  return mrmsWindowTotal(p,ds,v,st.hour,window,m,onProgress,seq);
 if(st.field==='apcp'&&p.cfg.timeMode==='analysis'&&/^(?:stageiv_(?:apcp|6h|24h)|mrms_apcp(?:_pass2|_6h|_24h)?)$/.test(ds.product))
  return ds.product==='mrms_apcp'||ds.product==='stageiv_apcp'
   ?mrmsRunningTotal(p,ds,v,st.hour,m,onProgress,seq)
   :mrmsWindowTotal(p,ds,v,st.hour,st.hour,m,onProgress,seq);
 if(v.derivedNativePtype)return readNativePtype(p.src,ds,v,h,onProgress);
 let current;
 if(st.field==='ceil'){
  const ref=String(v.attrs?.height_reference||v.attrs?.vertical_reference||'').toUpperCase();
  if(ref!=='AGL')throw Error('Ceiling input is not AGL. Converter must subtract surface geopotential elevation from cloud-ceiling HGT before publishing ceil (metres AGL).');
 }
 try{current=await getDisplayData(p.src,ds,v,h,m,onProgress);}
 catch(error){
  // A difference catalog may advertise the variable before its Zarr chunk
  // finishes publishing. On HTTP 404 only, use the exact native GFS fields
  // if both inputs share the same grid and verify the requested valid time.
  if(p.cfg?.differencePanel&&(error?.status===404||/HTTP 404/.test(String(error?.message||error)))){
   const fallback=nativeGfsDifferenceFallback(p,panelSelectedField(p),st.hour);
   if(fallback)return getPanelDisplayData(p,fallback.ds,fallback.v,fallback.h,m,onProgress,seq);
  }
  throw error;
 }
 if(st.field==='ptype')return hrrrF000Ptype(p,ds,v,h,current,onProgress);
 if(st.field==='refc_ptype'){
  const pv=ds.variables.find(x=>x.name==='ptype');
  if(!pv||!pv.available_hours.includes(h))throw Error(`Ptype F${pad3(h)} unavailable for reflectivity shading`);
  if(!pv.shape||pv.shape[1]!==v.shape[1]||pv.shape[2]!==v.shape[2])throw Error('Reflectivity and Ptype must share a grid');
  onProgress('Combining reflectivity with model precipitation type…');
  const category=await hrrrF000Ptype(p,ds,pv,h,await getDisplayData(p.src,ds,pv,h,FIELDS.ptype,()=>{}),onProgress);
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
  if(typeof apgl.PlateCarreeGrid!=='function')throw Error('This autumnplot-gl build lacks PlateCarreeGrid for regular latitude/longitude grids');
  // Native GFS catalogs use GRIB_* bounds (0..360 longitude), whereas MRMS
  // catalogs use longitude_min/max. The old MRMS-only lookup yielded NaNs
  // for every GFS panel, so the GPU reported ready but drew nothing.
  const coordinate=(plain,grib)=>Number(g[plain]??g['GRIB_'+grib]);
  let west=coordinate('longitude_min','longitudeOfFirstGridPointInDegrees');
  let east=coordinate('longitude_max','longitudeOfLastGridPointInDegrees');
  const south=coordinate('latitude_min','latitudeOfFirstGridPointInDegrees');
  const north=coordinate('latitude_max','latitudeOfLastGridPointInDegrees');
  if(![west,east,south,north].every(Number.isFinite))throw Error('Missing regular lat/lon grid bounds in catalog');
  // A global 0..360 grid needs consistent unwrapped longitudes to render
  // in MapLibre's western-hemisphere Mercator world copy.
  if(west>=0&&east>180){west-=360;east-=360;}
  return new apgl.PlateCarreeGrid(nx,ny,west,south,east,north);
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
 ['#14532e','#209641','#f0d947','#e99b2d'], // rain: green -> yellow -> orange at high dBZ
 ['#16467f','#51baff','#c3f3ff'], // snow, blue
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
 if(m.flightCategory)return {levels:[-.5,.5,1.5,2.5,3.5,4.5],colors:FLIGHT_CATEGORY_COLORS.slice(),banded:true};
 if(m.ptype)return{levels:[.5,1.5,2.5,3.5,4.5,5.5],colors:PTYPE.slice(1)};
 if(m.category&&m.ensembleMeanFraction){
  const colors=['#14253b', '#294b67', '#477c9b', '#77b2c9',m.category];
  return{levels:[.01,.10,.25,.50,.75,1.01],colors};
 }
 if(m.category)return{levels:[.5,1.5],colors:[m.category]};
 if(m.levels&&m.bandColors){
  return {levels:m.levels.slice(),colors:sampledColors(m.bandColors,m.levels.length-1),banded:true};
 }
 // Some catalog variables have no display range. A missing min/max must
 // never propagate NaN into RGB interpolation (autumnplot hex2rgba rejects
 // '#NaNNaNNaN'). Keep valid physical ranges for configured fields.
 const lo=Number.isFinite(m.min)?Math.max(m.min,Number.isFinite(m.cutoff)?m.cutoff:m.min):0;
 const hi=Number.isFinite(m.max)&&m.max>lo?m.max:lo+1;
 const source=(m.colors||[[0,'#3165a8'],[1,'#efa53c']])
  .map(([x,c])=>[m.fraction?lo+Number(x)*(hi-lo):Number(x),c])
  .filter(([x,c])=>Number.isFinite(x)&&typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c))
  .sort((a,b)=>a[0]-b[0]);
 const stops=source.length>=2?source:[[lo,'#3165a8'],[hi,'#efa53c']];
 function col(value){
  if(value<=stops[0][0])return stops[0][1];
  if(value>=stops.at(-1)[0])return stops.at(-1)[1];
  let i=0;while(i<stops.length-2&&value>stops[i+1][0])i++;
  const [x,ca]=stops[i],[y,cb]=stops[i+1];
  const t=Math.max(0,Math.min(1,(value-x)/(y-x||1)));
  const hex=h=>[1,3,5].map(j=>parseInt(h.slice(j,j+2),16));
  const a=hex(ca),b=hex(cb);
  return '#'+a.map((c,j)=>Math.max(0,Math.min(255,Math.round(c+(b[j]-c)*t))).toString(16).padStart(2,'0')).join('');
 }
 const n=Math.max(16,Math.min(256,Number(m.paletteSamples)||64));
 return{levels:Array.from({length:n+1},(_,i)=>lo+(hi-lo)*i/n),colors:Array.from({length:n},(_,i)=>col(lo+(hi-lo)*(i+.5)/n))};
}
// Field-level, presentation-only color scale overrides. Palette *colors* and
// their relative stop positions are preserved; only numerical breakpoints move.
// This does not modify Zarr data, GPU sampling, or meteorological calculations.
function adjustableColorbar(m){
 return !!m&&!m.ptype&&!m.ptypeReflectivity&&!m.category&&!m.flightCategory;
}
function paletteRange(p){return {min:p.levels[0],max:p.levels.at(-1)};}
// Carve a narrow, truly transparent band around *physical zero*, even if
// a user stretches the colorbar range. Insert boundaries into the exact band
// colors used by autumnplot-gl; the rest of the palette remains unchanged.
// This applies equally to live GPU plots and PNG/GIF colorbar exports.
function isTransparentPaletteColor(color){
 return typeof color==='string'&&/^#[0-9a-f]{6}00$/i.test(color);
}
function blendPaletteColors(a,b){
 const ma=typeof a==='string'&&a.match(/^#([0-9a-f]{6})$/i);
 const mb=typeof b==='string'&&b.match(/^#([0-9a-f]{6})$/i);
 if(!ma)return mb?'#'+mb[1]:'#808080';
 if(!mb)return '#'+ma[1];
 const aa=[1,3,5].map(i=>parseInt(ma[1].slice(i-1,i+1),16));
 const bb=[1,3,5].map(i=>parseInt(mb[1].slice(i-1,i+1),16));
 return '#'+aa.map((v,i)=>Math.round((v+bb[i])/2).toString(16).padStart(2,'0')).join('');
}
// Some fixed palettes historically encoded their own transparent zero band.
// That band must not be stretched with custom min/max values: the physical
// zero mask below is the single source of transparency for these fields.
function makeZeroPaletteOpaque(p){
 if(!p?.colors?.some(isTransparentPaletteColor))return p;
 const colors=p.colors.slice();
 for(let i=0;i<colors.length;i++){
  if(!isTransparentPaletteColor(colors[i]))continue;
  let left=i-1,right=i+1;
  while(left>=0&&isTransparentPaletteColor(colors[left]))left--;
  while(right<colors.length&&isTransparentPaletteColor(colors[right]))right++;
  const before=left>=0?colors[left]:null,after=right<colors.length?colors[right]:null;
  colors[i]=before&&after?blendPaletteColors(before,after):(before||after||'#808080');
 }
 return {...p,colors};
}
function clearBelowBand(p,threshold){
 if(!(Number.isFinite(threshold)&&threshold>0)||!p?.levels?.length||!p.colors?.length)return p;
 const levels=p.levels,colors=p.colors;
 if(levels.length!==colors.length+1)return p;
 const edges=[levels[0]],shade=[];
 for(let i=0;i<colors.length;i++){
  const a=levels[i],b=levels[i+1];
  if(!(Number.isFinite(a)&&Number.isFinite(b)&&b>a))return p;
  if(a<threshold&&threshold<b){
   shade.push('#00000000',colors[i]);edges.push(threshold,b);
  }else{shade.push(b<=threshold?'#00000000':colors[i]);edges.push(b);}
 }
 return {...p,levels:edges,colors:shade};
}
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
// A palette belongs to its meteorological field, not to one model/panel/hour.
// The independent MRMS rotation and signed-difference scales get their own keys
// so a model UH palette never silently recolors the radar analysis.
const USER_PALETTE_STORAGE='omd_evu_custom_palettes_v1';
function paletteKey(m,v){
 if(!adjustableColorbar(m))return null;
 const scalar=st.shadedFields?.get?.(st.field)||st.field;
 if(m.differenceField)return 'difference:'+scalar;
 return v?.name==='rottrack_ml60'?'rottrack_ml60':scalar;
}
function paletteBase(m,v,fieldOverride=null){
 const key=fieldOverride||paletteKey(m,v),custom=key&&st.customPalettes.get(key);
 return custom&&window.EVUPalParser?window.EVUPalParser.toPalette(custom):basePal(m,v);
}
function loadCustomPalettes(){
 try{
  const data=JSON.parse(localStorage.getItem(USER_PALETTE_STORAGE)||'{}');
  if(!data||typeof data!=='object'||Array.isArray(data))return;
  for(const [key,p] of Object.entries(data)){
   if(key.length>96||!/^[a-z0-9_:+-]+$/i.test(key)||!p||!window.EVUPalParser)continue;
   try{window.EVUPalParser.validate(p.stops);st.customPalettes.set(key,{name:String(p.name||'Custom .pal').slice(0,100),stops:p.stops});}catch(_){}
  }
 }catch(_){/* Private browsing/storage disabled: session still works. */}
}
function persistCustomPalettes(){
 try{localStorage.setItem(USER_PALETTE_STORAGE,JSON.stringify(Object.fromEntries(st.customPalettes)));return true;}
 catch(_){return false;}
}
function pal(m,v,fieldOverride=null){
 const key=fieldOverride||paletteKey(m,v),base=paletteBase(m,v,fieldOverride),opaqueBase=m.clearZero?makeZeroPaletteOpaque(base):base;
 const selected=key?st.colorRanges.get(key):null;
 let result=opaqueBase;
 if(selected){
  const {min,max}=paletteRange(opaqueBase);
  if(Number.isFinite(min)&&Number.isFinite(max)&&max>min&&selected.max>selected.min){
   const scale=(selected.max-selected.min)/(max-min);
   result={...opaqueBase,levels:opaqueBase.levels.map((x,i)=>i===0?selected.min:i===opaqueBase.levels.length-1?selected.max:selected.min+(x-min)*scale)};
  }
 }
 const validated=clearBelowBand(clearZeroBand(result,m.clearZero),m.clearBelow);
 if(!validated?.levels?.length||validated.colors?.length!==validated.levels.length-1||
    validated.levels.some(x=>!Number.isFinite(x))||
    validated.colors.some(x=>!/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(x))){
  console.warn('Invalid palette for',m.label,'using safe built-in colors');
  return basePal({min:Number.isFinite(m.min)?m.min:0,max:Number.isFinite(m.max)&&m.max>m.min?m.max:100,
   colors:[[0,'#3165a8'],[1,'#efa53c']],fraction:true},v);
 }
 return validated;
}
// The palette mapping is independent of displayed tick labels. Numeric ranges
// are edited in a modal; no guessing min/max values from click positions.
function formatColorbarValue(value){
 return Number(value.toFixed(Math.abs(value)>=100?0:Math.abs(value)>=1?2:4)).toString();
}
function closeLegendRangeEditor(){
 if(el.legendRangePopup?.open)el.legendRangePopup.close();
 if(el.legendRangePopup)el.legendRangePopup.hidden=true;
 st.legendSelection=null;st.legendEditorMeta=null;
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
function openLegendRangeEditor(m,v={name:st.field}){
 if(!adjustableColorbar(m))return;
 const key=paletteKey(m,v);if(!key)return;
 const original=paletteBase(m,v);
 const base=paletteRange(original);
 const previous=st.colorRanges.get(key)||base;
 st.legendEditorMeta={m,v,key};
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
 el.legendRangePopup.dataset.paletteKey=key;
 const imported=st.customPalettes.get(key);
 el.legendPalName.textContent=imported?`Using ${imported.name} (${imported.stops.length} stops)`: 'Using built-in palette';
 el.legendPalRemoveBtn.disabled=!imported;
 el.legendPalStatus.textContent='';
 validateLegendEditor();
 el.legendRangePopup.hidden=false;
 if(!el.legendRangePopup.open)el.legendRangePopup.showModal();
 el.legendMinNumber.focus();el.legendMinNumber.select();
}
function applyLegendRangeEditor(){
 if(!validateLegendEditor())return;
 if(el.legendRangePopup.dataset.field!==st.field){closeLegendRangeEditor();return;}
 const values=legendEditorValues();
 st.colorRanges.set(el.legendRangePopup.dataset.paletteKey,values);
 closeLegendRangeEditor();
 refreshColorbarRange();
}
function bindLegendRangeControls(){
 loadCustomPalettes();
 el.sharedLegendCanvas.addEventListener('click',()=>{
  const data=sharedPalette();if(data)openLegendRangeEditor(data.m,data.v);
 });
 const rightClick=(canvas,reader)=>canvas?.addEventListener('contextmenu',event=>{
  const data=reader();
  if(!data||!adjustableColorbar(data.m))return;
  event.preventDefault();event.stopPropagation();openLegendRangeEditor(data.m,data.v);
 });
 rightClick(el.sharedLegendCanvas,sharedPalette);
 rightClick(el.differenceSharedLegendCanvas,differenceSharedPalette);
 rightClick(el.rotationSharedLegendCanvas,rotationSharedPalette);
 el.legendPalFile.addEventListener('change',async()=>{
  const file=el.legendPalFile.files?.[0];el.legendPalFile.value='';
  const editor=st.legendEditorMeta;
  if(!file||!editor)return;
  if(!/\.pal$/i.test(file.name)){el.legendPalStatus.textContent='Please select a .pal text file.';return;}
  if(file.size>65536){el.legendPalStatus.textContent='Palette file exceeds the 64 KB limit.';return;}
  try{
   const text=await file.text(),imported=window.EVUPalParser.parse(text,file.name);
   if(!el.legendRangePopup.open||editor!==st.legendEditorMeta||editor.key!==paletteKey(editor.m,editor.v))return;
   st.customPalettes.set(editor.key,imported);
   // Imported physical-value stops replace the old range, which may belong to
   // another color table. Users can then adjust min/max as usual.
   st.colorRanges.delete(editor.key);
   const saved=persistCustomPalettes();
   openLegendRangeEditor(editor.m,editor.v);
   el.legendPalStatus.textContent=`Imported ${imported.stops.length} stops (${formatColorbarValue(imported.stops[0].value)}–${formatColorbarValue(imported.stops.at(-1).value)}). ${saved?'Saved in this browser.':'Storage unavailable: session only.'}`;
   refreshColorbarRange();
  }catch(error){el.legendPalStatus.textContent='Could not import palette: '+String(error?.message||error);}
 });
 el.legendPalRemoveBtn.addEventListener('click',()=>{
  const editor=st.legendEditorMeta;if(!editor)return;
  st.customPalettes.delete(editor.key);st.colorRanges.delete(editor.key);
  const saved=persistCustomPalettes();openLegendRangeEditor(editor.m,editor.v);
  el.legendPalStatus.textContent=saved?'Built-in palette restored and saved.':'Built-in palette restored for this session.';
  refreshColorbarRange();
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
  st.colorRanges.delete(el.legendRangePopup.dataset.paletteKey);closeLegendRangeEditor();refreshColorbarRange();
 });
 el.legendResetBtn.addEventListener('click',()=>{
  const key=paletteKey(sharedPalette()?.m,sharedPalette()?.v);
  if(key){st.colorRanges.delete(key);st.customPalettes.delete(key);persistCustomPalettes();}
  closeLegendRangeEditor();refreshColorbarRange();
 });
 el.legendRangePopup.addEventListener('close',()=>{el.legendRangePopup.hidden=true;st.legendSelection=null;st.legendEditorMeta=null;});
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
// Enforce aviation caps after native metres are converted to display units.
// Mask each original source BEFORE subtraction, not the signed delta; a
// 15-mi minus 14-mi difference must not be displayed as a valid 1-mi delta.
// Preserve native/cached chunks and categorical flight-category calculations.
function processedData(raw,m,v){
 const out=new Float32Array(raw.length);
 for(let i=0;i<out.length;i++){
  const x=raw[i];
  if(!Number.isFinite(x)||x<=-1e9||Math.abs(x)>=1e15||(m.validRange&&(x<m.validRange[0]||x>m.validRange[1]))){out[i]=-1e10;continue;}
  const converted=convert(x,m);
  out[i]=Number.isFinite(converted)&&!exceedsDisplayLimit(converted,m)?converted:-1e10;
 }
 return out;
}
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
 ctx.strokeStyle='rgba(240,250,255,.76)';ctx.lineWidth=overlayStrokeWidth('wind',2.8);ctx.stroke();
 ctx.strokeStyle=overlayStrokeColor('wind',ink);ctx.lineWidth=overlayStrokeWidth('wind',1.65);ctx.stroke();
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
  ctx.fillStyle=overlayStrokeColor('wind',ink);ctx.fill();
  ctx.strokeStyle='rgba(240,250,255,.76)';ctx.lineWidth=2.5;ctx.stroke();
  ctx.strokeStyle=ink;ctx.lineWidth=.9;ctx.stroke();
 }
}

// Cities share the existing canvas-overlay path, avoiding external MapLibre
// glyph servers. Text is laid out in screen pixels with deterministic collision
// rejection, and is regenerated only after map motion or data changes.
async function ensureCitiesCatalog(){
 if(st.citiesCatalog)return st.citiesCatalog;
 // The optional GeoNames catalog can be regenerated independently of a
 // viewer release. The city layer is lazily loaded, so a hard refresh of HTML
 // alone does not guarantee that an ordinary fetch will bypass a stale JSON.
 // Use one fresh URL per page session and bypass the browser HTTP cache.
 // Existing in-memory reuse below prevents downloads on pan/zoom/field changes.
 if(!st.citiesLoadPromise){
  const cityUrl=new URL('data/cities.json',document.baseURI);
  cityUrl.searchParams.set('__fresh',String(Date.now()));
  st.citiesLoadPromise=fetch(cityUrl.href,{cache:'no-store',credentials:'same-origin'}).then(r=>{
   if(!r.ok)throw Error('Cities gazetteer HTTP '+r.status);return r.json();
  }).then(data=>{
  if(!data||!Array.isArray(data.cities))throw Error('Cities gazetteer missing cities array');
  st.citiesCatalog=data.cities;
  st.citiesSource=String(data.source||'');
  // GeoNames' attribution is required when the optional expanded gazetteer
  // is installed. The original bundled fallback remains unchanged.
  const credit=document.getElementById('citiesCredit');
  if(credit)credit.hidden=!(st.citiesEnabled&&/geonames/i.test(st.citiesSource));
  return st.citiesCatalog;
 })
   .catch(err=>{st.citiesLoadPromise=null;console.warn('Cities unavailable:',err);return [];});
 }
 return st.citiesLoadPromise;
}
// Shared, bounded OSM tile cache for every synchronized panel. Natural Earth remains the fallback.
const osmRoadStore=window.EVUOSMRoads?window.EVUOSMRoads.create('data/roads_highways'):null;
// Roads are an optional self-hosted GeoJSON overlay installed by install_map_data.py.
// Canvas rendering avoids per-panel MapLibre sources and includes roads in normal
// city-overlay image exports. Missing optional data never blocks model plots.
async function ensureRoadsCatalog(){
 if(st.roadsCatalog)return st.roadsCatalog;
 if(!st.roadsLoadPromise)st.roadsLoadPromise=fetch('data/roads.geojson').then(r=>{
  if(!r.ok)throw Error('Roads GeoJSON HTTP '+r.status);return r.json();
 }).then(data=>{st.roadsCatalog=(data.features||[]).filter(f=>f.geometry&&['LineString','MultiLineString'].includes(f.geometry.type));return st.roadsCatalog;})
 .catch(err=>{st.roadsCatalog=[];console.warn('Optional roads data unavailable; run install_map_data.py:',err);return [];});
 return st.roadsLoadPromise;
}
function renderRoadsOnCanvas(ctx,map,w,h){
 const catalog=st.roadsCatalog||[];
 if(!catalog.length)return;
 const zoom=map.getZoom(),density=overlayDensity('roads'),maxTier=zoom<4?0:zoom<6?1:zoom<8?2:3;
 const bounds=map.getBounds(),color=overlayStrokeColor('roads',defaultOverlayStyleColor('roads'));
 ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();ctx.strokeStyle=color;ctx.globalAlpha=.7;
 ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=Math.max(.5,Math.min(6,overlayStrokeWidth('roads',.85)));
 for(const f of catalog){
  const tier=Number(f.properties?.rank??2);
  if(tier>maxTier+(density>=1.5?1:0))continue;
  const bbox=f.properties?.bbox;
  if(bbox&&!(bbox[2]>=bounds.getWest()&&bbox[0]<=bounds.getEast()&&bbox[3]>=bounds.getSouth()&&bbox[1]<=bounds.getNorth()))continue;
  const lines=f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates;
  for(const line of lines){
   if(!line||line.length<2)continue;
   let started=false,visible=false;
   ctx.beginPath();
   for(const point of line){
    if(!Array.isArray(point)||point.length<2)continue;
    const lon=Number(point[0]),lat=Number(point[1]);
    if(!Number.isFinite(lon)||!Number.isFinite(lat))continue;
    if(!globeFrontVisible(map,lon,lat)){started=false;continue;}
    let xy;try{xy=map.project([lon,lat]);}catch(_){started=false;continue;}
    if(!Number.isFinite(xy.x)||!Number.isFinite(xy.y)){started=false;continue;}
    if(!started){ctx.moveTo(xy.x,xy.y);started=true;}else ctx.lineTo(xy.x,xy.y);
    if(xy.x>=-w*.1&&xy.x<=w*1.1&&xy.y>=-h*.1&&xy.y<=h*1.1)visible=true;
   }
   if(visible)ctx.stroke();
  }
 }
 ctx.restore();
}
function cityStyle(){return overlayStyle('cities');}
function cityMinimumRank(zoom,density=1){
 // Expose mid-size towns sooner as zoom increases. The next tier is still
 // controlled by the city overlay's Density setting.
 const z=zoom+(density-1)*1.5;
 return z<3.25?0:z<4.5?1:z<5.75?2:z<7?3:z<9?4:5;
}
function cityBoundsContains(bounds,lon,lat){
 const west=bounds.getWest(),east=bounds.getEast();
 if(lat<bounds.getSouth()||lat>bounds.getNorth())return false;
 if(east-west>=360)return true;
 // MapLibre may represent a dateline-crossing view using longitudes outside
 // [-180,180]; compare the city in each equivalent wrapped world.
 for(const shift of [-360,0,360]){
  const adjusted=lon+shift;
  if(west<=east?adjusted>=west&&adjusted<=east:
     adjusted>=west||adjusted<=east)return true;
 }
 return false;
}
function cityLabelValue(p,city){
 if(cityStyle().displayValue!==true||!p.rawField)return '';
 try{
  const value=Number((p.readoutField||p.rawField).sampleField(city.lon,city.lat));
  if(!Number.isFinite(value)||value<=-1e9)return '';
  const field=panelSelectedField(p);
  const meta=p.v?panelFieldInfo(p,p.v):(FIELDS[field]||{});
  const readout=formatReadout(value,meta);
  return readout==='—'?'':String(readout)+(meta.unit?' '+meta.unit:'');
 }catch(_){return '';}
}
// A 4-degree geographic index keeps expanded catalogs fast in nine-panel
// layouts and reduces label-screening work during zoom/pan. Created once for
// each catalog object, without modifying source records.
const cityIndexCache=new WeakMap();
function citiesInBounds(catalog,bounds){
 if(!Array.isArray(catalog)||!catalog.length)return [];
 let index=cityIndexCache.get(catalog);
 if(!index){
  index=new Map();
  for(const city of catalog){
   const lat=Number(city.lat),lon=Number(city.lon);
   if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
   const key=Math.floor(lat/4)+'|'+Math.floor(lon/4);
   if(!index.has(key))index.set(key,[]);
   index.get(key).push(city);
  }
  cityIndexCache.set(catalog,index);
 }
 const south=Math.max(-90,Number(bounds.getSouth()));
 const north=Math.min(90,Number(bounds.getNorth()));
 const west=Number(bounds.getWest()),east=Number(bounds.getEast());
 // Wide world/globe views are infrequent; avoid unusual wrapped extents.
 if(![south,north,west,east].every(Number.isFinite)||east-west>=355)return catalog;
 const bins=[];
 const westNorm=((west+180)%360+360)%360-180;
 const eastNorm=((east+180)%360+360)%360-180;
 const ranges=east-west>=0&&east-west<360&&westNorm<=eastNorm?
   [[westNorm,eastNorm]]:[[westNorm,180],[-180,eastNorm]];
 for(let y=Math.floor(south/4);y<=Math.floor(north/4);y++){
  for(const [lo,hi] of ranges){
   for(let x=Math.floor(lo/4);x<=Math.floor(hi/4);x++){
    const items=index.get(y+'|'+x);if(items)bins.push(...items);
   }
  }
 }
 return bins;
}
function visibleCities(p,catalog){
 if(!p.map||!st.citiesEnabled)return [];
 const map=p.map,zoom=map.getZoom(),bounds=map.getBounds();
 const rank=cityMinimumRank(zoom,overlayDensity('cities'));
 // Extended GeoNames catalogs may contain tens of thousands of places.
 // Query only geographic bins touching the visible map instead of testing
 // every place against the viewport on each synchronized panel redraw.
 const entries=citiesInBounds(catalog,bounds);
 const matched=entries.filter(city=>city.rank<=rank&&cityBoundsContains(bounds,city.lon,city.lat));
 matched.sort((a,b)=>a.rank-b.rank||b.population-a.population||a.name.localeCompare(b.name));
 return matched.slice(0,Math.max(24,Math.round((60+zoom*35)*overlayDensity('cities'))));
}
function renderCityCanvas(p,catalog){
 const map=p?.map,canvas=p?.cityCanvas;
 if(!map||!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const w=Math.max(1,Math.round(map.getCanvas().clientWidth||p.frame.clientWidth));
 const h=Math.max(1,Math.round(map.getCanvas().clientHeight||p.frame.clientHeight));
 const ratio=Math.min(3,window.devicePixelRatio||1);
 if(canvas.width!==Math.round(w*ratio))canvas.width=Math.round(w*ratio);
 if(canvas.height!==Math.round(h*ratio))canvas.height=Math.round(h*ratio);
 ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
 let osmRendered=false;
 if(st.roadsEnabled){
  const color=overlayStrokeColor('roads',defaultOverlayStyleColor('roads'));
  const width=Math.max(.5,Math.min(6,overlayStrokeWidth('roads',.85)));
  const rendered=osmRoadStore?.draw(ctx,map,w,h,color,width,overlayDensity('roads'),(lon,lat)=>globeFrontVisible(map,lon,lat));
  osmRendered=!!rendered;
  if(!rendered)renderRoadsOnCanvas(ctx,map,w,h);
 }
 if(osmRendered){
  ctx.save();ctx.font='10px Arial, sans-serif';ctx.textBaseline='bottom';
  const label=String(osmRoadStore?.manifest?.attribution||'U.S. Census Bureau TIGER/Line');const tw=ctx.measureText(label).width;
  ctx.fillStyle='rgba(5,20,32,.7)';ctx.fillRect(Math.max(0,w-tw-13),h-20,tw+10,17);
  ctx.fillStyle='#ffffff';ctx.fillText(label,Math.max(4,w-tw-8),h-5);ctx.restore();
 }
 if(!st.citiesEnabled)return;
 const size=Math.max(9,Math.min(28,Number(cityStyle().fontSize)||12));
 const color=overlayStrokeColor('cities',defaultOverlayStyleColor('cities'));
 ctx.font=`600 ${size}px Arial, sans-serif`;ctx.textBaseline='middle';
 ctx.lineJoin='round';ctx.lineWidth=Math.max(2,size*.25);
 const occupied=[];
 for(const city of visibleCities(p,catalog)){
  if(!globeFrontVisible(map,city.lon,city.lat))continue;
  let pt;try{pt=map.project([city.lon,city.lat]);}catch(_){continue;}
  if(!Number.isFinite(pt?.x)||!Number.isFinite(pt?.y)||pt.x<4||pt.y<4||pt.x>w-4||pt.y>h-4)continue;
  const value=cityLabelValue(p,city),nameVisible=cityStyle().showCityLabel!==false;
  const lines=[...(nameVisible?[city.name]:[]),...(value?[value]:[])];
  if(!lines.length)continue;
  const textW=Math.max(...lines.map(line=>ctx.measureText(line).width));
  const tx=pt.x+8,top=pt.y-(lines.length*size*1.13)/2;
  const rect={l:pt.x-5,r:tx+textW+4,t:top-5,b:top+lines.length*size*1.13+5};
  if(rect.r>w-5||rect.t<3||rect.b>h-3)continue;
  if(occupied.some(other=>rect.l<other.r&&rect.r>other.l&&rect.t<other.b&&rect.b>other.t))continue;
  occupied.push(rect);
  ctx.beginPath();ctx.arc(pt.x,pt.y,Math.max(2,Math.min(4,size*.24)),0,2*Math.PI);
  ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=st.theme==='dark'?'#081827':'#ffffff';ctx.lineWidth=1.3;ctx.stroke();
  for(let i=0;i<lines.length;i++){
   const y=top+(i+.5)*size*1.13;
   ctx.strokeStyle=st.theme==='dark'?'#071827':'#ffffff';ctx.lineWidth=Math.max(2.4,size*.30);
   ctx.strokeText(lines[i],tx,y);
   ctx.fillStyle=color;ctx.fillText(lines[i],tx,y);
  }
 }
}
function scheduleCityUpdate(p){
 if(!p?.map||!p.cityCanvas)return;
 clearTimeout(p.cityTimer);
 p.cityTimer=setTimeout(()=>{p.cityTimer=null;void updateCityLayer(p);},110);
}
async function updateCityLayer(p){
 if(!p?.map||!p.cityCanvas)return;
 if(!st.citiesEnabled&&!st.roadsEnabled){renderCityCanvas(p,[]);return;}
 const map=p.map;
 const [catalog]=await Promise.all([
  st.citiesEnabled?ensureCitiesCatalog():Promise.resolve([]),
  st.roadsEnabled?ensureRoadsCatalog():Promise.resolve(null),
  st.roadsEnabled&&osmRoadStore?osmRoadStore.ready():Promise.resolve(false)
 ]);
 if(p.map!==map)return;
 const osmCredit=document.getElementById('roadsCredit');
 if(osmCredit)osmCredit.hidden=!(st.roadsEnabled&&osmRoadStore?.manifest);
 if(st.roadsEnabled&&osmRoadStore?.manifest&&!map.isMoving?.()){
  osmRoadStore.prefetch(map,()=>{if(p.map===map)scheduleCityUpdate(p);});
 }
 renderCityCanvas(p,catalog);
}
function refreshAllCityLayers(){
 for(const p of st.panels||[])if(p.map)scheduleCityUpdate(p);
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
 t1000:[5,2,1],t925:[5,2,1],t850:[5,2,1],t700:[5,2,1],
 td700:[10,5,2],td850:[10,5,2],td925:[10,5,2],q700:[2,1,.5],q850:[2,1,.5],q925:[2,1,.5],absv500:[10,5,5],wspd250:[20,10,5],wspd300:[20,10,5],wspd850:[10,5,5],
 h1000:[3,3,3],h925:[3,3,3],h850:[3,3,3],h700:[3,3,3],h500:[6,6,6],h300:[12,12,12],h250:[12,12,12],
 rh2m:[20,10,5],wspd10:[10,5,2],gust:[10,5,2],
 u10:[10,5,2],v10:[10,5,2],refc:[10,5,5],
 cpofp:[20,10,5],snowc:[20,10,5],sden:[100,50,25],
 // Severe-weather scalars were previously excluded from the contour control.
 // Base intervals are in display units and are thinned further for small maps.
 sbcape:[1000,500,250],mlcape:[1000,500,250],mucape:[1000,500,250],
 shear01:[20,10,5],shear06:[20,10,5],srh01:[100,50,25],srh03:[100,50,25],
 mxuphl:[100,50,25],mxuphl_run:[100,50,25]
};
const CONTOUR_STANDARD_STEPS=[.25,.5,1,2,2.5,5,10,20,25,50,100,200,250,500,1000,2000];
const CONTOUR_PRECIP=[.01,.05,.10,.25,.5,.75,1,1.5,2,3,4,5,7,10,15,20];
const CONTOUR_PRECIP_COARSE=[.05,.10,.25,.5,1,2,3,5,10,20];
const CONTOUR_SNOW=[.5,1,2,4,6,8,12,18,24,36,48,72];
const CONTOUR_SNOW_COARSE=[1,2,4,8,12,24,36,48,72];
const CONTOUR_RATE=[.01,.02,.05,.10,.20,.30,.50,.75,1,1.5,2,3,5];
const CONTOUR_RATE_COARSE=[.02,.05,.10,.20,.50,1,2,3,5];
const NO_CONTOURS=new Set(['ptype','refc_ptype','csnow','cicep','cfrzr','crain','snowpresence','flightcat']);
function isSnowContourField(field){return /^(?:snow(?:1|3|6|24|48)h|asnow|snod|gfs_snow_.*|rrfs_snow_.*)$/.test(String(field||''));}
function isPrecipContourField(field){return /^(?:apcp(?:(?:1|3|6|24|48)h)?|weasd|frozr|frzr|tsnowp)$/.test(String(field||''));}
function contoursAvailable(field=st.field){return Boolean(field&&!NO_CONTOURS.has(field)&&
 (CONTOUR_STEPS[field]||field==='prate'||isSnowContourField(field)||isPrecipContourField(field)||Boolean(FIELDS?.[field]?.unit&&!/^diff/.test(field))));}
function contourTier(zoom){return zoom<3.6?0:zoom<6?1:2;}
function contourInterval(field,zoom){const steps=CONTOUR_STEPS[field];return steps?steps[contourTier(zoom)]:null;}
function isMoistureUpperField(field){return field==='t700'||field==='t850'||field==='t925';}
function moisturePressure(field){return isMoistureUpperField(field)?Number(field.slice(1)):null;}
function moistureDrawList(p){
 const level=moisturePressure(p.cfg?.field||st.field);
 if(!level||p.cfg?.differencePanel)return [];
 const available=p.moistureFields||{};
 const result=[];
 if(st.overlayDewpoint&&available['td'+level])result.push({name:'td'+level,field:available['td'+level]});
 if(st.overlaySpfh&&available['q'+level])result.push({name:'q'+level,field:available['q'+level]});
 return result;
}
function overlayHeightVisible(field=st.field){return Boolean(heightVariableName(field)&&st.overlayHeight);}
const NEAR_SURFACE_WIND_FIELDS=new Set(['t2m','dpt2m','rh2m']);
function overlayWindSetting(field=st.field){
 if(NEAR_SURFACE_WIND_FIELDS.has(field))return 'overlayNearSurfaceWind';
 if(String(field).startsWith('wave_'))return 'overlayWaveDirection';
 return ['shear01','shear06','srh01','srh03'].includes(field)?'overlaySevereWind':
    heightVariableName(field)?'overlayUpperWind':'overlaySurfaceWind';
}
function overlayWindVisible(field=st.field){
 return Boolean(windComponentNames(field) && st[overlayWindSetting(field)]);
}
function marineSurfaceWindAvailable(field=st.field){return MARINE_WIND_FIELDS.has(field);}
function marineSurfaceWindVisible(field=st.field){return marineSurfaceWindAvailable(field)&&st.overlayMarineWind;}


function marineDirectionLabel(field=st.field){
 if(field==='wave_height_swell1'||field==='wave_period_swell1')return 'Swell direction';
 if(field==='wave_height_wind'||field==='wave_period_wind')return 'Wind-wave direction';
 return 'Wave direction';
}
// The Data Overlays menu uses the same unclipped, body-level popup treatment as
// Map overlays. Move the EXISTING checkbox nodes instead of cloning them: this
// keeps their change handlers, contextmenu/right-click styling and saved state.
let dataOverlaysMenuUI=null;
function initDataOverlaysMenu(){
 const btn=document.getElementById('dataOverlaysMenuBtn');
 const popup=document.getElementById('dataOverlaysPopup');
 const parent=document.getElementById('contourControl');
 if(!btn||!popup||!parent||dataOverlaysMenuUI)return;
 const anchor=document.createComment('Data overlays inline position');
 popup.parentNode.insertBefore(anchor,popup);
 const close=(focus=false)=>{
  popup.classList.remove('menu-open');btn.setAttribute('aria-expanded','false');
  if(focus)btn.focus();
 };
 const position=()=>{
  if(!popup.classList.contains('menu-open'))return;
  const r=btn.getBoundingClientRect();
  const width=Math.min(340,Math.max(220,window.innerWidth-16));
  popup.style.width=width+'px';
  popup.style.left=Math.round(Math.max(8,Math.min(r.left,window.innerWidth-width-8)))+'px';
  const height=Math.min(popup.scrollHeight,window.innerHeight-16);
  popup.style.top=Math.round(r.bottom+8+height<=window.innerHeight-8?
   r.bottom+8:Math.max(8,r.top-height-8))+'px';
 };
 btn.addEventListener('click',()=>{
  if(popup.classList.contains('menu-open')){close();return;}
  if(el.mapLayersMenuPopup&&!el.mapLayersMenuPopup.hidden){el.mapLayersMenuPopup.hidden=true;el.mapLayersMenuBtn?.setAttribute('aria-expanded','false');}
  popup.classList.add('menu-open');btn.setAttribute('aria-expanded','true');position();
 });
 document.addEventListener('pointerdown',event=>{
  if(popup.classList.contains('menu-open')&&!btn.contains(event.target)&&!popup.contains(event.target))close();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&popup.classList.contains('menu-open')){
   event.preventDefault();event.stopPropagation();close(true);
  }
 },true);
 window.addEventListener('resize',position);
 document.addEventListener('scroll',position,true);
 const count=()=>[...popup.querySelectorAll('input[type="checkbox"]')].filter(input=>{
  const label=input.closest('label');
  if(!label||label.hidden)return false;
  // The METAR/mPING group and GLM/SPC containers can be hidden as a unit.
  for(let p=label.parentElement;p&&p!==popup;p=p.parentElement)if(p.hidden)return false;
  return true;
 }).length;
 const apply=()=>{
  btn.hidden=false;
  // Keep the label and SVG chevron intact when the menu is refreshed.
  // Replacing textContent would remove the icon on every field change.
  popup.classList.add('menu-collapsible','data-overlays-menu-popup');
  parent.classList.add('data-overlays-compact');
  // Even plots with only one scalar contour retain the same accessible
  // dropdown, rather than jumping between inline checkboxes and a menu.
  if(popup.parentNode!==document.body)document.body.appendChild(popup);
  position();
 };
 dataOverlaysMenuUI={apply,close,count};
}
initDataOverlaysMenu();
const imageFieldOptions=document.getElementById('imageFieldOptions');
imageFieldOptions?.addEventListener('change',event=>{
 const input=event.target;if(!input?.matches('input[type="radio"]'))return;
 if(!UPPER_AIR_IMAGE_FIELDS[st.field]?.some(([key])=>key===input.value))return;
 st.shadedFields.set(st.field,input.value);
 refreshHours();syncUI();updateSharedLegend();void renderAll();
});
function updateContourControl(){
 if(!el.contourControl)return;
 syncImageFieldChoices();
 const shadedField=selectedShadingField();
 const linesAvailable=contoursAvailable(shadedField);
 const reportsAvailable=observationVisible();
 const amountAvailable=!!amountReportKind();
 const spcAvailable=SPC_FIELDS.has(st.field);
 const lightningAvailable=LIGHTNING_FIELDS.has(st.field)&&st.cfg?.lightning?.enabled!==false;
 el.spcControl.hidden=!spcAvailable;
 el.spcCount.hidden=!spcAvailable;
 el.lightningControl.hidden=!lightningAvailable;
 el.lightningCount.hidden=!lightningAvailable;
 el.lightningLegend.hidden=!lightningAvailable||!st.lightningEnabled;
 el.lightningToggleBtn.checked=st.lightningEnabled;
 el.spcToggleBtn.checked=st.spcEnabled;
 const heightAvailable=Boolean(heightVariableName(st.field));
 const windAvailable=Boolean(windComponentNames(st.field)||marineSurfaceWindAvailable(st.field));
 const moisture=isMoistureUpperField(st.field);
 if(el.dewpointOption)el.dewpointOption.hidden=!moisture;
 if(el.spfhOption)el.spfhOption.hidden=!moisture;
 if(el.windSpeedOption)el.windSpeedOption.hidden=st.field!=='t850';
 if(el.windSpeedToggleBtn)el.windSpeedToggleBtn.checked=st.overlayWindSpeed850;
 if(el.dewpointToggleBtn)el.dewpointToggleBtn.checked=st.overlayDewpoint;
 if(el.spfhToggleBtn)el.spfhToggleBtn.checked=st.overlaySpfh;
 const tracerPair=tracerComponentNames(st.field);
 const tracerEligible=Boolean(tracerPair);
 const tracerUpper=/^u(\d+)$/.exec(tracerPair?.[0]||'');
 const tracerText=tracerPair?.[0]==='u10'?'10 m wind tracers':tracerUpper?`${tracerUpper[1]} hPa wind tracers`:'Wind tracers';
 const tracerTextElement=el.tracersOption?.querySelector('span');
 if(tracerTextElement)tracerTextElement.textContent=tracerText;
 if(el.tracersOption)el.tracersOption.title=`Show ${tracerText.toLowerCase()}; right-click for color, thickness and density`;
 el.tracersOption.hidden=!tracerEligible;
 el.tracersToggleBtn.disabled=!tracerEligible;
 // Pause animation when the selected product has no available wind component pair.
 window.EVUAdvancedMap?.setTracers(st.tracersEnabled&&tracerEligible);
 if(el.surfaceWeatherOption){el.surfaceWeatherOption.hidden=!surfaceWeatherEligible();el.surfaceWeatherToggleBtn.checked=st.surfaceWeatherEnabled;updateSurfaceWeatherSummary();}
 el.contourControl.hidden=!(UPPER_AIR_IMAGE_FIELDS[st.field]||linesAvailable||reportsAvailable||amountAvailable||spcAvailable||lightningAvailable||heightAvailable||windAvailable||tracerEligible||moisture||lowTracksAvailableForField());
 el.heightOption.hidden=!heightAvailable;
 el.windOption.hidden=!Boolean(windComponentNames(st.field));
 el.marineWindOption.hidden=!marineSurfaceWindAvailable(st.field);
 const contourVariable=UPPER_AIR_IMAGE_FIELDS[st.field]?primaryContourKey():shadedField;
 el.contourOption.hidden=!contoursAvailable(contourVariable);
 const contourName=contourFieldLabel(contourVariable);
 const contourCaption=el.contourOption?.querySelector('span');
 if(contourCaption)contourCaption.textContent=contourName;
 if(el.contourOption){
  el.contourOption.setAttribute('aria-label',`Show ${contourName} contours`);
  el.contourOption.dataset.styleLayer=contourAppearance(contourVariable,st.theme).styleLayer;
 }
 // Low tracks are an optional overlay on every surface plot whose image
 // choices include MSLP, even if another scalar is currently shaded.
 if(el.lowTracksOption){
  el.lowTracksOption.hidden=!lowTracksAvailableForField();
  el.lowTracksToggleBtn.checked=st.lowTracksEnabled;
  for(const panel of st.panels||[])updateLowTrackPanelStatus(panel);
  updateLowTracksStatus();
 }
 // Surface multi-image plots show independent MSLP isobars ON by default.
 if(el.surfaceMSLPOption){
  el.surfaceMSLPOption.hidden=!SURFACE_MSLP_IMAGE_FIELDS.has(st.field);
  el.surfaceMSLPToggleBtn.checked=st.overlayMSLP;
 }
 el.mslp850Option.hidden=st.field!=='mslp';
 el.mslp850ToggleBtn.checked=st.overlayMSLP850;
 el.obsControl.hidden=!reportsAvailable;
 el.amountReportsControl.hidden=!amountAvailable;
 if(el.amountReportsCocorahs)el.amountReportsCocorahs.checked=st.amountReportEnabled.cocorahs;
 if(el.amountReportsMetar)el.amountReportsMetar.checked=st.amountReportEnabled.metar;
 el.obsCount.hidden=!reportsAvailable||!(st.obsEnabled.synoptic||st.obsEnabled.mping);
 el.obsAttribution.hidden=!reportsAvailable;
 // Count nested METAR/mPING labels individually. Above four options, the
 // same live nodes move to an unclipped popover; see initDataOverlaysMenu().
 dataOverlaysMenuUI?.apply();

 el.heightToggleBtn.checked=st.overlayHeight;
 el.windToggleBtn.checked=st[overlayWindSetting(st.field)]===true;
 el.marineWindToggleBtn.checked=st.overlayMarineWind;
 const windLabel=el.windOption?.querySelector?.('span');
 if(windLabel)windLabel.textContent=st.field.startsWith('shear')?'Shear barbs':
   st.field.startsWith('srh')?'Storm motion barbs':NEAR_SURFACE_WIND_FIELDS.has(st.field)?'10 m wind barbs':st.field.startsWith('wave_')?marineDirectionLabel(st.field):'Wind barbs';
 // One label is reused for wind and wave products; its right-click editor
 // must follow the current field, not retain the previous wind style layer.
 if(el.windOption)el.windOption.dataset.styleLayer=st.field.startsWith('wave_')?'waveDirection':'wind';
 if(el.windOption)el.windOption.title=st.field.startsWith('shear')?'Display 0–1/0–6 km shear-vector wind barbs (knots)':
   st.field.startsWith('srh')?'Display native Bunkers right-moving storm-motion barbs':NEAR_SURFACE_WIND_FIELDS.has(st.field)?'Overlay native 10 m wind barbs, independently of the 2 m shaded field (off by default); right-click to style':st.field.startsWith('wave_')?`Display ${marineDirectionLabel(st.field).toLowerCase()} (not wind barbs)`:'Display meteorological wind barbs';
 el.contourToggleBtn.checked=st.field==='mslp'?st.overlayMSLP:st.contours;
 const interval=contourInterval(contourVariable,st.active?.find(p=>p.map)?.map?.getZoom?.()??3);
 const m=FIELDS[contourVariable];
 el.contourToggleBtn.title=`Draw labeled ${m?.label||shadedField} contours (${interval?`${interval} ${m?.unit||''} base interval; adapts to map scale`:'standard field thresholds; adapts to map scale'})`;
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
function contourLevels(field,minimum,maximum,zoom=3,width=400,height=250,styleLayer=null){
 if(!Number.isFinite(minimum)||!Number.isFinite(maximum)||maximum<=minimum)return [];
 const density=overlayDensity(styleLayer||(/^h(?:1000|925|850|700|500|300|250)$/.test(field)?'height':'contours'));
 const limit=Math.max(3,Math.min(32,Math.round(Math.max(6,Math.min(20,Math.floor(Math.sqrt(width*height)/31)))*density)));
 if(isSnowContourField(field)||isPrecipContourField(field)||field==='prate'){
  const snow=isSnowContourField(field),rate=field==='prate';
  const standard=rate?CONTOUR_RATE:(snow?CONTOUR_SNOW:CONTOUR_PRECIP);
  const coarse=rate?CONTOUR_RATE_COARSE:(snow?CONTOUR_SNOW_COARSE:CONTOUR_PRECIP_COARSE);
  let levels=(zoom<3.6?coarse:standard).filter(v=>v>minimum&&v<maximum);
  if(levels.length>limit){
   // Choose actual conventional thresholds, not arbitrary interpolated values.
   const n=Math.ceil(levels.length/limit);
   levels=levels.filter((_,i)=>i%n===0);
  }
  return levels;
 }
 const base=contourInterval(field,zoom)||Math.max(0.01,(maximum-minimum)/Math.max(4,Math.min(12,limit)));if(!base)return [];
 // Isobars and geopotential heights must use conventional meteorological
 // increments. Scale-dependent thinning may only select INTEGER MULTIPLES of
 // the 4-hPa or 3/6/12-dm base; never arbitrary nonstandard increments.
 if(field==='mslp'||/^h(?:1000|925|850|700|500|300|250)$/.test(field)){
  let step=base;
  const maxLines=limit;
  // Preserve standard grid phase: 1000/1004-hPa and 540/546-dm etc.
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
// Numeric contour labels should read as annotations rather than becoming
// indistinguishable from the isolines that cross behind them. Select the
// opposite lightness from the *actual* (possibly user-customized) line ink.
// This applies to MSLP isobars, geopotential heights, dashed temperatures,
// and all other numerical field contours, in live maps and PNG/GIF exports.
function contourLabelContrast(lineInk){
 const match=/^#([0-9a-f]{6})$/i.exec(String(lineInk||''));
 if(!match)return {text:'#fffdf5',keyline:'rgba(8,25,38,.98)'};
 const hex=match[1];
 const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
 const brightness=(299*r+587*g+114*b)/1000;
 return brightness>=153
  ?{text:'#0a2436',keyline:'rgba(250,252,255,.99)'}
  :{text:'#fffdf5',keyline:'rgba(8,25,38,.98)'};
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
// One meteorological contour specification for every model set and panel.
// The plotted field, viewer theme and export scale determine the appearance;
// RRFS/REFS, GFS and future model sets must never supply separate defaults.
function contourAppearance(field,theme='dark',exportScale=1,multiExport=false){
 const height=/^h(?:1000|925|850|700|500|300|250)$/.test(field);
 const isobar=field==='mslp';
 const dashed=['t1000','t925','t850','t700','absv500','wspd250','wspd300'].includes(field);
 // A comparison cell is resized after capture. Scale dash lengths in the
 // source CSS pixels just as we do the casing/ink widths, so multi-panel
 // dashed contours retain sensible *final image* dash lengths.
 const scale=multiExport?Math.max(.12,Math.min(3,Number(exportScale)||1)):
  Math.max(1,Math.min(3,Number(exportScale)||1));
 if(field==='wspd850')return {styleLayer:'windSpeed',dashed:true,
  ink:theme==='dark'?'#f6c651':'#8c4b09',casing:'rgba(15,24,40,.94)',
  exportInk:theme==='dark'?'#ffe082':'#854507',liveWidth:2.25,
  exportOuterWidth:4.2,exportInnerWidth:2.1,
  dash:multiExport?[10*scale,3*scale,2*scale,3*scale]:scale>1.001?[10*scale,3*scale,2*scale,3*scale]:[9,3,2,3]};
 if(/^td(?:700|850|925)$/.test(field))return {
  styleLayer:'dewpoint',dashed:false,ink:theme==='dark'?'#35f2df':'#056c76',
  casing:'rgba(5,28,38,.93)',exportInk:theme==='dark'?'#57ffeb':'#075a67',
  liveWidth:2.25,exportOuterWidth:4.2,exportInnerWidth:2.3,dash:[]};
 if(/^q(?:700|850|925)$/.test(field))return {
  styleLayer:'specificHumidity',dashed:true,ink:theme==='dark'?'#ff86ed':'#902189',
  casing:'rgba(12,18,32,.94)',exportInk:theme==='dark'?'#ff9af4':'#8e147c',
  liveWidth:2.0,exportOuterWidth:3.9,exportInnerWidth:2,dash:multiExport?[3*scale,4*scale]:scale>1.001?[3*scale,4*scale]:[2.5,4.5]};
 const ink=isobar?'#000000':height?'#102536':(theme==='dark'?'#f5faff':'#193145');
 const casing=(height||isobar)?'rgba(255,255,255,.96)':
  (theme==='dark'?'rgba(5,17,30,.94)':'rgba(255,255,255,.95)');
 const exportInk=isobar?'rgba(0,0,0,.96)':height?'rgba(11,24,38,.96)':
  (theme==='dark'?'rgba(251,253,255,.94)':'rgba(15,30,45,.90)');
 return {styleLayer:isobar?'mslpContours':height?'height':field==='t850'?'temperature':'contours',
  dashed,ink,casing,exportInk,liveWidth:(height||isobar)?2.85:1.85,
  exportOuterWidth:(height||isobar)?4.8:3.2,
  exportInnerWidth:(height||isobar)?2.1:1.35,
  dash:dashed?(multiExport?[9*scale,7*scale]:scale>1.001?[9*scale,7*scale]:[6,4]):[]};
}
// User-selected contour dash patterns override field-specific defaults only
// when explicitly changed in the appearance editor. Pattern lengths are in
// display pixels and scale with PNG export sizes, including comparison cells.
function styledContourAppearance(appearance,exportScale=1,multiExport=false){
 const mode=overlayStyle(appearance.styleLayer).lineStyle||'auto';
 if(!VALID_CONTOUR_LINE_STYLES.has(mode)||mode==='auto')return appearance;
 const scale=multiExport?Math.max(.12,Math.min(3,Number(exportScale)||1)):
  Math.max(1,Math.min(3,Number(exportScale)||1));
 const patterns={solid:[],dashed:[9,6],dotted:[1.5,4], 'dash-dot':[9,4,1.5,4]};
 const dash=patterns[mode].map(x=>x*scale);
 return {...appearance,dash,dashed:dash.length>0};
}
function drawContours(p,{field=p.contourField||p.rawField,key=p?.cfg?.field||st.shadedFields?.get?.(st.field)||st.field,append=false,always=false,exportScale=1,multiExport=false,comparisonLabels=null}={}){
 // Difference panels never render meteorological contours, regardless of toggles or export.
 if(p?.cfg?.differencePanel){clearContours(p);return;}
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
 const heightContour=/^h(?:1000|925|850|700|500|300|250)$/.test(plottedField);
 const isobarContour=plottedField==='mslp';
 const upperAirScalar=['t1000','t925','t850','t700','absv500','wspd250','wspd300','wspd850'].includes(plottedField);
 const dashedScalar=(upperAirScalar||['wspd300','wspd250'].includes(plottedField))&&!heightContour;
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
 const smooth=!isSnowContourField(plottedField)&&!isPrecipContourField(plottedField)&&!['refc','prate'].includes(plottedField);
 if(smooth){
  const filtered=values.slice();
  for(let iy=1;iy<rows;iy++)for(let ix=1;ix<cols;ix++){
   const i=iy*pitch+ix,c=values[i],n=values[i-pitch],s=values[i+pitch],e=values[i+1],w0=values[i-1];
   if([c,n,s,e,w0].every(Number.isFinite))filtered[i]=.82*c+.045*(n+s+e+w0);
  }
  values.set(filtered);
 }
 const appearance=styledContourAppearance(contourAppearance(plottedField,st.theme,exportScale,multiExport),exportScale,multiExport);
 // The optional MSLP/850-hPa temperature overlay shares the t850 profile.
 const styleLayer=appearance.styleLayer;
 const levels=contourLevels(plottedField,min,max,map.getZoom?.()??3,w,h,styleLayer);
 if(!levels.length)return;
 const all=[];
 for(const level of levels){
  const paths=contourPaths(values,cols,rows,dx,dy,level);
  if(paths.length)all.push({level,paths});
 }
 if(!all.length)return;
 ctx.lineJoin='round';
 // Individual exports keep their established two-tone contour treatment.
 // Multi-panel exports imitate the clean LIVE lines (one strong ink stroke,
 // without the bright white casing). These captured canvases are later
 // composited into final image cells, so counter-scale the widths here.
 const strokeScale=Number.isFinite(exportScale)?
  (multiExport?Math.max(.12,Math.min(3,exportScale)):Math.max(1,Math.min(3,exportScale))):1;
 const exportContours=multiExport||strokeScale>1.001;
 // Live and comparison exports share a single-stroke visual language.
 // Standalone high-resolution exports intentionally keep the established
 // two-tone recipe. Butt caps preserve intervals in dashed scalar overlays.
 ctx.lineCap=overlayStyle(appearance.styleLayer).lineStyle==='dotted'?'round':((exportContours&&appearance.dashed)?'butt':'round');
 const dash=appearance.dash;
 const liveContourInk=appearance.ink;
 ctx.save();
 ctx.setLineDash(dash);
 if(!exportContours){
  const width=appearance.liveWidth;
  ctx.beginPath();
  ctx.lineWidth=typeof overlayStrokeWidth==='function'?overlayStrokeWidth(styleLayer,width):width;
  ctx.strokeStyle=typeof overlayStrokeColor==='function'?overlayStrokeColor(styleLayer,liveContourInk):liveContourInk;
  for(const {paths} of all)for(const path of paths)strokeContourPath(ctx,path);
  ctx.stroke();
 }else if(multiExport){
  // Same (possibly user-customized) ink as the live map, only slightly
  // larger in *output-cell* pixels. Never put a white protective casing
  // under this stroke: it washed out MSLP/height in comparison PNGs.
  ctx.beginPath();
  const width=appearance.liveWidth*strokeScale;
  ctx.lineWidth=typeof overlayStrokeWidth==='function'?overlayStrokeWidth(styleLayer,width):width;
  ctx.strokeStyle=typeof overlayStrokeColor==='function'
   ?overlayStrokeColor(styleLayer,liveContourInk):liveContourInk;
  for(const {paths} of all)for(const path of paths)strokeContourPath(ctx,path);
  ctx.stroke();
 }else{
  for(const [width,color] of [[appearance.exportOuterWidth,appearance.casing],[appearance.exportInnerWidth,appearance.exportInk]]){
   ctx.beginPath();ctx.lineWidth=(typeof overlayStrokeWidth==='function'?overlayStrokeWidth(styleLayer,width*strokeScale):width*strokeScale);
   ctx.strokeStyle=width===appearance.exportInnerWidth?(typeof overlayStrokeColor==='function'?overlayStrokeColor(styleLayer,color):color):color;
   for(const {paths} of all)for(const path of paths)strokeContourPath(ctx,path);
   ctx.stroke();
  }
 }
 ctx.restore();
 // Label connected paths, including small normal panels; never label each
 // individual marching-squares segment. Gap/halo keep numerals legible.
 const fontSize=multiExport&&comparisonLabels?.fontCssPx>0
  ?comparisonLabels.fontCssPx
  :Math.max(10,Math.min(13.5,9.8+Math.sqrt(w*h)/320)) *
   (exportContours?Math.min(1.35,Math.sqrt(strokeScale)):1);
 ctx.font=`600 ${fontSize.toFixed(1)}px Arial, sans-serif`;
 ctx.textAlign='center';ctx.textBaseline='middle';
 const used=[],maxLabels=Math.max(1,Math.min(30,Math.round(Math.max(2,Math.min(16,Math.floor(w*h/34000)))*overlayDensity(styleLayer))));
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
   // All contour labels get a clean, narrow protective keyline, even on the
   // live canvas. This is *text-only* casing: live isolines stay single-stroke.
   // Reuse the final line ink so manually chosen contour colors also work.
   const lineInk=typeof overlayStrokeColor==='function'
    ?overlayStrokeColor(styleLayer,liveContourInk):liveContourInk;
   const labelInk=contourLabelContrast(lineInk);
   const labelScale=exportContours?Math.min(1.35,Math.sqrt(strokeScale)):1;
   ctx.lineWidth=multiExport&&comparisonLabels?.haloCssPx>0
    ?comparisonLabels.haloCssPx
    :Math.max(3.4,fontSize*.38)*labelScale;
   ctx.lineJoin='round';
   ctx.strokeStyle=labelInk.keyline;
   ctx.strokeText(label,0,0);
   ctx.fillStyle=labelInk.text;
   ctx.fillText(label,0,0);
   ctx.restore();used.push([x,y]);
   break; // One label per line before moving to the next geographic contour.
  }
 }
}
function activeContourLayers(p){
 if(!p||p.cfg?.differencePanel||p.status==='missing'||p.status==='error'||!p.rawField)return [];
 const field=panelSelectedField(p),base=primaryContourKey(),layers=[];
 if(st.field==='mslp'){
  if(st.overlayMSLP&&p.primaryContourField)layers.push({field:p.primaryContourField,key:'mslp'});
  if(st.overlayMSLP850&&p.temperature850Field)layers.push({field:p.temperature850Field,key:'t850'});
  return layers;
 }
 // Labeled MSLP isobars are independent from the primary shaded field contours.
 if(surfaceMSLPContoursEnabled()&&p.mslpContourField)
  layers.push({field:p.mslpContourField,key:'mslp'});
 const heightKey=heightVariableName(base);
 if(overlayHeightVisible(base)&&heightKey&&p.heightField)
  layers.push({field:p.heightField,key:heightKey});
 if(base==='t850'&&st.overlayWindSpeed850&&p.windSpeed850Field)
  layers.push({field:p.windSpeed850Field,key:'wspd850'});
 if(UPPER_AIR_IMAGE_FIELDS[base]){
  // Always refer to the PRIMARY product, even when the shaded image is
  // height, dewpoint or specific humidity. Never hide a secondary toggle.
  if(st.contours&&p.primaryContourField&&contoursAvailable(base))
   layers.push({field:p.primaryContourField,key:base});
 }else if(shadedContourEnabled(field)&&contoursAvailable(field)){
  layers.push({field:p.contourField||p.rawField,key:field});
 }
 for(const item of moistureDrawList(p))layers.push({field:item.field,key:item.name});
 return layers;
}
function drawContourStack(p,exportScale=1,multiExport=false,comparisonLabels=null){
 const layers=activeContourLayers(p);
 if(!layers.length){clearContours(p);return false;}
 for(let i=0;i<layers.length;i++){
  const item=layers[i];
  drawContours(p,{field:item.field,key:item.key,append:i>0,always:true,exportScale,multiExport,comparisonLabels});
 }
 p.contourCanvas.style.visibility='visible';
 return true;
}
function scheduleContourRedraw(p,settleMs=0){
 if(!p?.contourCanvas||!p.map)return;
 if(p.contourRedrawTimer!==null){clearTimeout(p.contourRedrawTimer);p.contourRedrawTimer=null;}
 if(p.contourRafId!==null){cancelAnimationFrame(p.contourRafId);p.contourRafId=null;}
 p.contourFrameRequested=false;
 if(!activeContourLayers(p).length){clearContours(p);return;}
 if(p.map.isMoving?.()){suspendContours(p);return;}
 const map=p.map;
 const afterQuiet=()=>{
  p.contourRedrawTimer=null;
  if(p.map!==map||!p.contourCanvas)return;
  if(map.isMoving?.()){suspendContours(p);return;}
  if(st.exportRender)return;
  p.contourFrameRequested=true;
  p.contourRafId=requestAnimationFrame(()=>{
   p.contourRafId=null;p.contourFrameRequested=false;
   if(p.map!==map||!p.contourCanvas||map.isMoving?.()||st.exportRender)return;
   drawContourStack(p);
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
 if(p.cfg?.differencePanel)return;
 const field=p.cfg?.field||st.field;
 const layers=[];
 // Two independent visible layers for non-swell wave maps: actual 10-m wind
 // barbs and, only if requested, the ocean-wave propagation arrows.
 if(p.marineWind&&marineSurfaceWindVisible(field))layers.push({field,pair:p.marineWind,vectorLayer:'wind'});
 if(p.wind&&windComponentNames(field)&&overlayWindVisible(field))
  layers.push({field,pair:p.wind,vectorLayer:field.startsWith('wave_')?'waveDirection':'wind'});
 if(!layers.length)return;
 const zoom=m.getZoom(),size=exportStyle?.sizePx>0?exportStyle.sizePx:Number(st.cfg?.display?.windBarbSizePx??18);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowBlur=0;
 for(const {pair,vectorLayer} of layers){
  const {u,v}=pair,isMarine=vectorLayer==='waveDirection',isShear=field.startsWith('shear');
  const originalSpacing=exportStyle?.spacingPx>0?exportStyle.spacingPx:barbSpacing(zoom);
  const spacing=Math.max(12,originalSpacing/Math.sqrt(overlayDensity(vectorLayer)));
  const columns=Math.ceil(w/spacing),rows=Math.ceil(h/spacing);
  const stepX=w/Math.max(1,columns),stepY=h/Math.max(1,rows);
  // Offset barbs/arrows to distinct positions if both overlays are selected,
  // keeping each visible rather than allowing arrows to obscure barb feathers.
  const shift=layers.length===2?(isMarine?.78:.28):.5;
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const x=(col+shift)*stepX,y=(row+shift)*stepY;
   let pos;try{pos=m.unproject([x,y]);}catch(_){continue;}
   const lon=pos.lng,lat=pos.lat;
   if(!Number.isFinite(lon)||!Number.isFinite(lat)||Math.abs(lat)>88||!globeFrontVisible(m,lon,lat))continue;
   let uu,vv;try{uu=Number(u.sampleField(lon,lat));vv=Number(v.sampleField(lon,lat));}catch(_){continue;}
   if(!Number.isFinite(uu)||!Number.isFinite(vv)||uu < -1e9||vv < -1e9)continue;
   const speed=isMarine?Math.hypot(uu,vv):Math.hypot(uu,vv)*1.94384449;
   if(!isMarine&&!isShear&&speed<2.5){paintBarb(ctx,x,y,0,-1,speed,size);continue;}
   if(isShear&&speed<1)continue;
   // Local east/north basis handles map rotation and globe geometry.
   let e,n;
   try{
    const east=m.project([lon+.08/Math.max(.1,Math.cos(lat*Math.PI/180)),lat]);
    const north=m.project([lon,lat+.08]);
    e=[east.x-x,east.y-y];n=[north.x-x,north.y-y];
   }catch(_){continue;}
   const el=Math.hypot(...e),nl=Math.hypot(...n);
   if(el<1e-5||nl<1e-5)continue;
   const dx=(isMarine?1:-1)*(uu*e[0]/el+vv*n[0]/nl),dy=(isMarine?1:-1)*(uu*e[1]/el+vv*n[1]/nl);
   if(!Number.isFinite(dx+dy)||Math.hypot(dx,dy)<.00001)continue;
   if(isMarine){
    // Wave directions use propagation arrows, not wind barb symbolism.
    const norm=Math.hypot(dx,dy),ax=dx/norm,ay=dy/norm,L=Math.max(13,size*1.25);
    ctx.strokeStyle=overlayStrokeColor('waveDirection',defaultOverlayStyleColor('waveDirection'));
    ctx.fillStyle=ctx.strokeStyle;
    ctx.lineWidth=overlayStrokeWidth('waveDirection',2.2);
    ctx.beginPath();ctx.moveTo(x-ax*L*.48,y-ay*L*.48);ctx.lineTo(x+ax*L*.48,y+ay*L*.48);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+ax*L*.5,y+ay*L*.5);ctx.lineTo(x+ax*L*.13-ay*L*.20,y+ay*L*.13+ax*L*.20);
    ctx.lineTo(x+ax*L*.13+ay*L*.20,y+ay*L*.13-ax*L*.20);ctx.closePath();ctx.fill();
   }else paintBarb(ctx,x,y,dx,dy,speed,size);
  }
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
 if(!p?.windCanvas||!p.map)return;
 // Hundreds of RRFS barbs require geographic unprojection, U/V samples, and
 // two basis projections apiece. Do not repeat that work on every pan/zoom
 // animation frame across nine synchronized maps. Hide the stale overlay
 // until the camera settles, just as contours and terrain shading already do.
 if(forecastCameraBusy(p)){
  p.windCanvas.style.opacity='0';
  clearTimeout(p.windRedrawTimer);
  p.windRedrawTimer=setTimeout(()=>{p.windRedrawTimer=null;scheduleWindRedraw(p);},160);
  return;
 }
 if(p.windRedrawTimer){clearTimeout(p.windRedrawTimer);p.windRedrawTimer=null;}
 if(p.windFrameRequested)return;
 p.windFrameRequested=true;
 requestAnimationFrame(()=>{
  p.windFrameRequested=false;
  if(!p.map||!p.windCanvas)return;
  if(forecastCameraBusy(p)){scheduleWindRedraw(p);return;}
  drawWindBarbs(p);p.windCanvas.style.opacity='1';
 });
}
function clearWindBarbs(p){p.wind=null;p.marineWind=null;if(p.windCanvas){const ctx=p.windCanvas.getContext('2d');ctx?.clearRect(0,0,p.windCanvas.width,p.windCanvas.height);}}
function windComponentNames(field){
 if(field==='wave_height_sig'||field==='wave_period_primary')return ['wave_u_primary','wave_v_primary'];
 if(field==='wave_height_wind'||field==='wave_period_wind')return ['wave_u_wind','wave_v_wind'];
 if(field==='wave_height_swell1'||field==='wave_period_swell1')return ['wave_u_swell1','wave_v_swell1'];
 const level=field==='t1000'?1000:field==='t925'?925:field==='t850'?850:field==='t700'?700:field==='absv500'?500:field==='wspd250'?250:field==='wspd300'?300:0;
 return level?['u'+level,'v'+level]:(field==='wspd10'||NEAR_SURFACE_WIND_FIELDS.has(field))?['u10','v10']:
  field==='shear01'?['shru01','shrv01']:field==='shear06'?['shru06','shrv06']:
  field==='srh01'||field==='srh03'?['ustm','vstm']:null;
}
// Resolve wind components against the selected field's cycle, not just its
// shading store. GEFS uses separate 0.25-degree surface and 0.5-degree
// pressure stores, and future products may split wind and scalar records.
// A pair MUST come from the same store/grid and both contain the requested
// hour. Do not merge U and V from incompatible products or cycle times.
function matchingWindDataset(p,selected,h,names){
 if(!selected||!Array.isArray(names)||names.length!==2)return null;
 const matches=ds=>names.map(name=>ds.variables?.find(v=>v.name===name&&v.available_hours?.includes(h)));
 const own=matches(selected);
 if(own.every(Boolean))return {ds:selected,vars:own};
 const candidates=(p.src?.datasets||[]).filter(ds=>cycleKey(ds.init_time)===cycleKey(selected.init_time));
 const targetSpacing=Number(selected.grid?.GRIB_DxInDegrees);
 candidates.sort((a,b)=>Math.abs(Number(a.grid?.GRIB_DxInDegrees)-targetSpacing)-Math.abs(Number(b.grid?.GRIB_DxInDegrees)-targetSpacing));
 for(const ds of candidates){const vars=matches(ds);if(vars.every(Boolean))return {ds,vars};}
 return null;
}
function heightVariableName(field){return field==='t1000'?'h1000':field==='t925'?'h925':field==='t850'?'h850':field==='t700'?'h700':field==='absv500'?'h500':field==='wspd250'?'h250':field==='wspd300'?'h300':null;}
// Secondary MSLP overlay: temperature is selected from a compatible source
// catalog at the *same valid time*, even when analysis MSLP and RAP 850 hPa
// reside in separate aligned-analysis products.
async function prepareMSLP850Contours(p,ds,h,seq){
 if(p.cfg?.differencePanel||!st.overlayMSLP850||!p.map||st.field!=='mslp'||!ds)return;
 if(panelSelectedField(p)==='t850'&&p.rawField){p.temperature850Field=p.rawField;scheduleContourRedraw(p);return;}
 const candidates=[ds,...(p.src?.datasets||[]).filter(d=>d!==ds)];
 const time=cycleKey(ds.init_time);
 const matching=candidates.find(d=>cycleKey(d.init_time)===time&&
  d.variables?.some(v=>v.name==='t850'&&v.available_hours?.includes(p.cfg.timeMode==='analysis'?0:h)));
 if(!matching)return;
 const hour=p.cfg.timeMode==='analysis'?0:h;
 const v=matching.variables.find(v=>v.name==='t850'&&v.available_hours.includes(hour));
 if(!v)return;
 try{
  const values=await getDisplayData(p.src,matching,v,hour,fieldInfo(v,'t850'),()=>{});
  if(seq!==st.seq||!p.map||st.field!=='mslp')return;
  p.temperature850Field=new apgl.RawScalarField(gridForPanel(p,matching,v),values);
  updatePanelPlotTitle(p);scheduleContourRedraw(p);
 }catch(e){console.warn('MSLP 850-hPa temperature overlay unavailable',e);}
}
function overlayPlotDescriptor(p){
 if(p?.cfg?.differencePanel)return `${differenceFieldLabel(panelSelectedField(p))} difference shading`;
 if(p?.cfg?.timeMode==='analysis'&&p?.ds?.product==='mrms_rotation_ml60')return st.field==='mxuphl_run'?'Mid-level rotation track (3–6 km AGL) · running maximum, NOT UH':'Mid-level rotation track (3–6 km AGL) · 60-minute maximum, NOT UH';
 const field=panelSelectedField(p);
 if(st.field==='mslp'){
  const layers=[(field==='t850'?'850-hPa temperature':'MSLP')+' shading'];
  if(st.overlayMSLP&&p?.primaryContourField)layers.push('MSLP isobars');
  if(st.overlayMSLP850&&p?.temperature850Field)layers.push('850-hPa temperature (dashed)');
  return layers.join(' + ');
 }
 // Always use source-specific metadata when restoring a panel title after
 // overlays or animation redraw. The menu label is intentionally generic,
 // whereas HRRR/REFS Ptype and REFS Mean PMM products are not interchangeable.
 const meta=panelFieldInfo(p,p?.v||{name:field});
 const parts=[p?.ds?.product==='nohrsc_6h'&&field==='asnow'?'Accumulated snowfall':meta.label];
 if(heightVariableName(st.field)&&st.overlayHeight&&p?.heightField)parts.push('height');
 if(st.field==='t850'&&st.overlayWindSpeed850&&p?.windSpeed850Field)parts.push('wind-speed contours');
 if(p?.marineWind&&marineSurfaceWindVisible(field))parts.push('10-m wind barbs');
 if(windComponentNames(st.field)&&overlayWindVisible(st.field)&&p?.wind)parts.push(String(field).startsWith('wave_')?'wave direction arrows':field.startsWith('shear')?'shear barbs':field.startsWith('srh')?'right-mover barbs':NEAR_SURFACE_WIND_FIELDS.has(field)?'10 m wind barbs':'wind barbs');
 if(UPPER_AIR_IMAGE_FIELDS[st.field]){
  if(surfaceMSLPContoursEnabled()&&p?.mslpContourField)parts.push('MSLP isobars');
  if(st.contours&&p?.primaryContourField)parts.push(`${contourFieldLabel(st.field).toLowerCase()} contours`);
 }else if(shadedContourEnabled(field)&&contoursAvailable(p?.ds?.product==='mrms_rotation_ml60'?'rottrack_ml60':field))parts.push(`${contourFieldLabel(field).toLowerCase()} contours`);
 const moisture=moistureDrawList(p);
 if(moisture.some(v=>v.name.startsWith('td')))parts.push('dewpoint contours');
 if(moisture.some(v=>v.name.startsWith('q')))parts.push('specific-humidity contours');
 return parts.join(' + ');
}
function updatePanelPlotTitle(p){
 if(!p?.title)return;
 p.title.textContent=panelDisplayTitle(p,overlayPlotDescriptor(p));
}
async function preparePrimaryUpperAirContours(p,ds,h,seq){
 const name=primaryContourKey();
 if(!UPPER_AIR_IMAGE_FIELDS[name]||!(name==='mslp'?st.overlayMSLP:st.contours)||p.cfg?.differencePanel||!p.map||!ds)return;
 if(panelSelectedField(p)===name&&p.rawField){
  p.primaryContourField=p.rawField;scheduleContourRedraw(p);return;
 }
 const hour=p.cfg?.timeMode==='analysis'||p.cfg?.timeMode==='gfs-analysis'?0:h;
 const time=cycleKey(ds.init_time);
 const matching=[ds,...(p.src?.datasets||[]).filter(d=>d!==ds)].find(d=>cycleKey(d.init_time)===time&&
  d.variables?.some(v=>v.name===name&&v.available_hours?.includes(hour)));
 const v=matching?.variables?.find(item=>item.name===name&&item.available_hours?.includes(hour));
 if(!v)return;
 try{
  const values=await getDisplayData(p.src,matching,v,hour,fieldInfo(v,name),()=>{});
  if(seq!==st.seq||!p.map||p.ds!==ds||p.h!==h)return;
  p.primaryContourField=new apgl.RawScalarField(gridForPanel(p,matching,v),values);
  updatePanelPlotTitle(p);scheduleContourRedraw(p);
 }catch(e){console.warn(name+' primary contours unavailable',e);}
}
async function prepareSurfaceMSLPContours(p,ds,h,seq){
 if(!surfaceMSLPContoursEnabled()||p.cfg?.differencePanel||!p.map||!ds)return;
 if(panelSelectedField(p)==='mslp'&&p.rawField){
  p.mslpContourField=p.rawField;
  updatePanelPlotTitle(p);scheduleContourRedraw(p);return;
 }
 const hour=(p.cfg?.timeMode==='analysis'||p.cfg?.timeMode==='gfs-analysis')?0:h;
 const time=cycleKey(ds.init_time);
 const matching=[ds,...(p.src?.datasets||[]).filter(d=>d!==ds)].find(d=>cycleKey(d.init_time)===time&&
  d.variables?.some(v=>v.name==='mslp'&&v.available_hours?.includes(hour)));
 const v=matching?.variables?.find(item=>item.name==='mslp'&&item.available_hours?.includes(hour));
 if(!v)return;
 try{
  const values=await getDisplayData(p.src,matching,v,hour,fieldInfo(v,'mslp'),()=>{});
  if(seq!==st.seq||!p.map||p.ds!==ds||p.h!==h||!surfaceMSLPContoursEnabled())return;
  p.mslpContourField=new apgl.RawScalarField(gridForPanel(p,matching,v),values);
  updatePanelPlotTitle(p);scheduleContourRedraw(p);
 }catch(e){console.warn('Optional surface MSLP contours unavailable',e);}
}
async function prepareUpperAirMoistureContours(p,ds,h,seq){
 const level=moisturePressure(p.cfg?.field||st.field);
 if(!level||p.cfg?.differencePanel||!p.map||!ds||!Number.isInteger(h))return;
 const needed=[];
 if(st.overlayDewpoint)needed.push('td'+level);
 if(st.overlaySpfh)needed.push('q'+level);
 if(!p.moistureFields)p.moistureFields={};
 await Promise.all(needed.map(async name=>{
  if(p.moistureFields[name])return;
  if(panelSelectedField(p)===name&&p.rawField){p.moistureFields[name]=p.rawField;return;}
  const v=ds.variables?.find(item=>item.name===name&&item.available_hours?.includes(h));
  if(!v)return;
  try{
   // fieldInfo applies K→°C or kg/kg→g/kg before contours/labels.
   const data=await getDisplayData(p.src,ds,v,h,fieldInfo(v,name),()=>{});
   if(seq!==st.seq||!p.map||p.ds!==ds||p.h!==h)return;
   p.moistureFields[name]=new apgl.RawScalarField(gridForPanel(p,ds,v),data);
  }catch(e){console.info(name+' upper-air moisture contours unavailable',e);}
 }));
 if(seq===st.seq&&p.map&&p.ds===ds&&p.h===h){
  updatePanelPlotTitle(p);scheduleContourRedraw(p);
 }
}
// Derive 850-hPa wind-speed contours from the same wind components used for
// native barbs. Maintain separate overlay state from the shaded image choice.
async function prepareWindSpeed850Contours(p,ds,h,seq){
 if(p.cfg?.differencePanel||!st.overlayWindSpeed850||st.field!=='t850'||!p.map||!ds)return;
 const v=ds.variables?.find(item=>item.name==='wspd850'&&item.available_hours?.includes(h));
 if(!v)return;
 if(panelSelectedField(p)==='wspd850'&&p.rawField){p.windSpeed850Field=p.rawField;scheduleContourRedraw(p);return;}
 try{
  const data=await getDisplayData(p.src,ds,v,h,fieldInfo(v,'wspd850'),()=>{});
  if(seq!==st.seq||!p.map||p.ds!==ds||p.h!==h)return;
  p.windSpeed850Field=new apgl.RawScalarField(gridForPanel(p,ds,v),data);
  updatePanelPlotTitle(p);scheduleContourRedraw(p);
 }catch(e){console.info('850-hPa wind-speed contours unavailable',e);}
}
async function prepareHeightContours(p,ds,h,seq){
 const name=heightVariableName(p.cfg?.field||st.field);
 if(p.cfg?.differencePanel||!name||!p.map)return;
 if(panelSelectedField(p)===name&&p.rawField){p.heightField=p.rawField;scheduleContourRedraw(p);return;}
 const v=ds.variables.find(v=>v.name===name&&v.available_hours.includes(h));
 if(!v)return;
 try{
  const values=await getDisplayData(p.src,ds,v,h,fieldInfo(v,name),()=>{});
  if(seq!==st.seq||!p.map)return;
  p.heightField=new apgl.RawScalarField(gridForPanel(p,ds,v),values);
  scheduleContourRedraw(p);
 }catch(e){console.warn(name+' height overlay unavailable',e);}
}
// Legacy forecast shear components retain their native VUCSH/VVCSH units.
// RAP analysis v2 components are explicitly normalized to m/s. Detect from
// paired data so both new and older already-published forecasts display well.
function shearOverlayScale(u,v,depth,componentUnits=''){
 const units=String(componentUnits).trim().toLowerCase();
 // The historical store's .zattrs can still say s-1 after selected hours
 // have been repaired to m/s. Trust an unambiguous sampled magnitude over
 // stale array-wide metadata until all legacy hours have been reconciled.
 const sample=[];const step=Math.max(1,Math.floor(u.length/2048));
 for(let i=0;i<u.length;i+=step){
  const a=u[i],b=v[i];
  if(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a)<1e9&&Math.abs(b)<1e9)
   sample.push(Math.hypot(a,b));
 }
 if(!sample.length)return null;
 sample.sort((a,b)=>a-b);
 const median=sample[Math.floor(sample.length/2)];
 if(median>=.2)return 1;
 if(units==='m s-1'||units==='m/s')return 1;
 if(units==='s-1'||units==='1/s'||units==='s^-1')return depth;
 if(median<.2)return depth;
 return null; // source units ambiguous; do not draw mislabeled barbs
}
function scaledShearField(data,scale){
 return Float32Array.from(data,v=>Number.isFinite(v)&&Math.abs(v)<1e9&&Math.abs(v*scale)<=125?v*scale:NaN);
}
async function prepareWindBarbs(p,ds,h,seq){
 const names=windComponentNames(p.cfg?.field||st.field);
 if(!p.map||!names||p.cfg?.differencePanel)return;
 const match=matchingWindDataset(p,ds,h,names);
 if(!match)return;
 const {ds:windDs,vars:[u,v]}=match;
 try{
  const [ud,vd]=await Promise.all([
   getDisplayData(p.src,windDs,u,h,{convert:null},()=>{}),
   getDisplayData(p.src,windDs,v,h,{convert:null},()=>{})
  ]);
  if(seq!==st.seq||!p.map||!windComponentNames(p.cfg?.field||st.field))return;
  const fieldName=p.cfg?.field||st.field;
  const depth=fieldName==='shear01'?1000:fieldName==='shear06'?6000:null;
  const scale=depth?shearOverlayScale(ud,vd,depth,u.attrs?.units||v.attrs?.units||''):1;
  if(scale===null){console.warn('Ambiguous native bulk-shear component units',p.cfg.label);return;}
  p.wind={u:new apgl.RawScalarField(gridForPanel(p,windDs,u),depth?scaledShearField(ud,scale):ud),
          v:new apgl.RawScalarField(gridForPanel(p,windDs,v),depth?scaledShearField(vd,scale):vd)};
  scheduleWindRedraw(p);
 }catch(e){console.warn('Wind barbs unavailable for '+p.cfg.label+':',e);}
}
// Animate *atmospheric wind* U/V, not the plotted propagation/shear vectors.
// When a field has a wind overlay (including non-swell GFS marine products),
// offer the tracer checkbox and use actual 10-m wind components if available.
// Swell-only plots intentionally have neither 10-m wind barbs nor tracers.
function tracerComponentNames(field){
 if(!field)return null;
 const upper={t1000:1000,t925:925,t850:850,t700:700,absv500:500,wspd250:250,wspd300:300,
  h1000:1000,h925:925,h850:850,h700:700,h500:500,h300:300,h250:250};
 if(upper[field])return ['u'+upper[field],'v'+upper[field]];
 if(String(field).startsWith('wave_'))return marineSurfaceWindAvailable(field)?['u10','v10']:null;
 // Bulk shear and storm-motion barbs are not advection vectors; if u10/v10
 // are present, animate the independent 10-m wind field instead.
 if(/^(shear|srh)/.test(field))return ['u10','v10'];
 const surface=/^(mslp|t2m|dpt2m|q2m|rh2m|wspd10|gust|u10|v10|vis|ceil|pwat|refc|refc_ptype|ptype|prate|apcp|snow|asnow|sbcape|mlcape|mucape|mxuphl|crain|csnow|cicep|cfrzr|frzr|frozr|tsnowp|weasd|snod|snowc|cpofp)/;
 return surface.test(field)?['u10','v10']:null;
}
// Wave forecasts use actual atmospheric 10-m U/V from the SAME GFS forecast
// Zarr dataset as the wave scalar/direction fields; not swell propagation
// components, and never estimated from wave direction or wave height.
async function prepareMarineWindBarbs(p,ds,h,seq){
 if(!marineSurfaceWindAvailable(p.cfg?.field||st.field)||p.cfg?.differencePanel||!p.map)return;
 const u=ds.variables.find(v=>v.name==='u10'&&v.available_hours?.includes(h));
 const v=ds.variables.find(v=>v.name==='v10'&&v.available_hours?.includes(h));
 if(!u||!v)return;
 try{
  const [ud,vd]=await Promise.all([
   getDisplayData(p.src,ds,u,h,{convert:null},()=>{}),
   getDisplayData(p.src,ds,v,h,{convert:null},()=>{})
  ]);
  if(seq!==st.seq||!p.map||!marineSurfaceWindAvailable(p.cfg?.field||st.field))return;
  p.marineWind={u:new apgl.RawScalarField(gridForPanel(p,ds,u),ud),
                v:new apgl.RawScalarField(gridForPanel(p,ds,v),vd)};
  scheduleWindRedraw(p);
 }catch(e){console.warn('GFS marine 10-m wind barbs unavailable for '+p.cfg.label+':',e);}
}
// Tracers use actual model U/V components in m/s, not displayed barbs,
// shear vectors, wave-direction unit vectors, or difference-model products.
// If a matching wind field does not exist, leave tracers absent for that panel.
async function prepareWindTracers(p,ds,h,seq){
 if(!st.tracersEnabled||!p?.map||!ds||p.cfg?.differencePanel||!Number.isInteger(h))return;
 const field=p.cfg?.field||st.field;
 const pair=tracerComponentNames(field);
 if(!pair){window.EVUAdvancedMap?.setVectors(p,null,null);return;}
 const upper=pair&&pair[0]!=='u10';
 if(!pair||pair.length!==2)return;
 const match=matchingWindDataset(p,ds,h,pair);
 if(!match){window.EVUAdvancedMap?.setVectors(p,null,null);return;}
 const {ds:windDs,vars}=match;
 try{
  // Reuse already-loaded U/V fields if they are the matching physical wind.
  if(upper&&p.wind&&pair[0]===windComponentNames(field)?.[0]){
   window.EVUAdvancedMap?.setVectors(p,p.wind.u,p.wind.v,field);return;
  }
  const [ud,vd]=await Promise.all(vars.map(v=>getDisplayData(p.src,windDs,v,h,{convert:null},()=>{})));
  if(seq!==st.seq||!st.tracersEnabled||!p.map||p.cfg?.differencePanel)return;
  const grid=gridForPanel(p,windDs,vars[0]);
  const g2=gridForPanel(p,windDs,vars[1]);
  window.EVUAdvancedMap?.setVectors(p,new apgl.RawScalarField(grid,ud),new apgl.RawScalarField(g2,vd),field);
 }catch(err){console.info('Wind tracer components unavailable for '+(p.cfg?.label||''),err);}
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
 // For derived GFS net depth changes, missing cells AND effectively zero
 // change leave the actual map background visible, not a white near-zero fill.
 // Keep the original signed array for probes, plots and differences.
 if(gfsSnowSpec(field)?.method==='depthChange'){
  const threshold=0;
  let shaded=null;
  for(let i=0;i<data.length;i++){
   const x=data[i];
   if(!Number.isFinite(x)||x<=-1e9||x<=threshold){
    if(!shaded)shaded=data.slice();
    shaded[i]=-1e10;
   }
  }
  return shaded||data;
 }
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
// A real no-data mask is required in addition to transparent colormap
// underflow.  Raster/ContourFill may interpolate samples at the edges of
// missing cells; letting the GPU know which *pixels* are invalid prevents
// blank regions acquiring false shading. A value of 0 in cmap_mask means
// "do not draw"; a value of 1 uses the selected palette. This does not alter
// the original array used by probes, contours, comparisons or exports.
// All scalar products use this rule, including uploaded .pal color tables.
function plotNoDataMask(values,field,isDifference=false){
 const mask=new Uint8Array(values.length);
 // 10:1 GFS snowfall is zero where no snowpack SWE gain (v16) or snowfall
 // liquid equivalent (v17) occurred. Leave zero/trace amounts as the real
 // map background, not as the lowest snow color. Do not apply that criterion
 // to temperatures, winds, pressure, signed differences or other fields for
 // which physical zero is a meaningful plotted value.
 const isTenToOneSnow=!!gfsSnowSpec(field)&&!isDifference;
 // Physical zero is intentionally unshaded for ALL nonnegative accumulated
 // precipitation, snowfall and snow-depth products, independent of palette.
 // Preserve positive trace values and do not mask signed difference fields.
 const zeroUnshaded=!isDifference&&(
  isTenToOneSnow||field==='apcp'||field==='prate'||field==='weasd'||field==='tsnowp'||
  field==='snod'||field==='asnow'||field==='frozr'||field==='frzr'||
  /^apcp(?:1h|3h|6h|24h|48h)$/.test(field)||
  /^snow(?:1h|3h|6h|24h|48h)$/.test(field));
 const traceSnowInches=MIN_DISPLAY_SNOW_IN;
 const precipitationCutoff=!isDifference&&/^apcp(?:1h|3h|6h|24h|48h)?$/.test(field)?MIN_DISPLAY_PRECIP_IN:0;
 const snowCutoff=!isDifference&&(isTenToOneSnow||/^(?:gfs_snow_|rrfs_snow_)/.test(field)||field==='snod'||field==='asnow'||/^snow(?:1h|3h|6h|24h|48h)$/.test(field))?MIN_DISPLAY_SNOW_IN:0;
 for(let i=0;i<values.length;i++){
  const v=values[i];
  mask[i]=Number.isFinite(v)&&v>-1e9&&Math.abs(v)<1e15&&
   (!zeroUnshaded||v>0)&&(!snowCutoff||v>=snowCutoff-1e-8)&&(!precipitationCutoff||v>=precipitationCutoff-1e-8)?1:0;
 }
 return mask;
}
// autumnplot-gl applies the GPU's LINEAR filter to raw scalar texels before
// colormap lookup. A transparent cmap_mask does not prevent a missing texel's
// -1e10/NaN sentinel from entering that interpolation: a single invalid grid
// point next to a valid signed A-B difference can create a spurious saturated
// blue hairline. Keep the mask EXACTLY as computed from the original data and
// replace only invalid texels in the GPU input with bounded nearby valid values.
// The resulting array is used only by the PlotLayer texture, never for probes,
// difference arithmetic, contours, native data or archived output. Precompute
// regardless of the toggle so enabling interpolation does not require a new
// network request, data upload or plot reconstruction.
function safeDifferenceTextureValues(values,mask,nx,ny){
 if(!values||!mask||values.length!==mask.length||nx<2||ny<2||nx*ny!==values.length)return values;
 let result=null;
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const idx=y*nx+x;
  if(mask[idx])continue;
  if(!result)result=values.slice();
  let sum=0,n=0;
  // Only valid ORIGINAL cells contribute. Never chain values invented for
  // previously missing points across a larger coverage gap.
  for(let j=Math.max(0,y-1);j<=Math.min(ny-1,y+1);j++){
   for(let i=Math.max(0,x-1);i<=Math.min(nx-1,x+1);i++){
    const neighbor=j*nx+i,value=values[neighbor];
    if(mask[neighbor]&&Number.isFinite(value)&&value>-1e9&&Math.abs(value)<1e15){sum+=value;n++;}
   }
  }
  // Fully missing interiors have no valid field to display. Use the exact
  // neutral difference value, which is transparent in the signed palette;
  // the original mask still forbids drawing those pixels.
  result[idx]=n?sum/n:0;
 }
 return result||values;
}
// Mask pressure-level scalar fields using the MODEL's native surface
// pressure, rather than a fixed-height approximation to terrain. The
// below-ground mask applies to the displayed field, contour source, and
// map exports; original cached chunks remain untouched.
function fieldPressureLevelHpa(field){
 const match=/^(?:t|h|td|q|u|v|wspd|absv)(1000|925|850|700|500|300|250)$/.exec(String(field||''));
 return match?Number(match[1]):null;
}
function pressureTerrainMask(values, surfacePressure, levelHpa){
 if(!surfacePressure||surfacePressure.length!==values.length)return values;
 const output=new Float32Array(values);
 for(let i=0;i<output.length;i++){
  const ps=surfacePressure[i];
  if(!Number.isFinite(ps)||ps<levelHpa*100)output[i]=NaN;
 }
 return output;
}
async function belowGroundDisplayValues(p,ds,v,h,values){
 // Only mask below-ground isobaric data when the user requests terrain.
 if(!terrainEnabledForPanel(p))return values;
 const level=fieldPressureLevelHpa(panelSelectedField(p));
 if(!level||p?.cfg?.differencePanel||p?.cfg?.timeMode==='analysis'||p?.cfg?.timeMode==='gfs-analysis')return values;
 const psfc=ds?.variables?.find(item=>item.name==='psfc'&&item.available_hours?.includes(h));
 if(!psfc||psfc.shape?.[1]!==v.shape?.[1]||psfc.shape?.[2]!==v.shape?.[2])return values;
 try{
  // Converter psfc is native surface pressure in Pa (not MSLP).
  const pressure=await getDisplayData(p.src,ds,psfc,h,{convert:'native'},()=>{});
  // Cache the mask as a display-derived field. The pressure grid and model
  // chunk are immutable, so repeated pans / renders need not rescan the grid.
  const key=displayKey(p.src,ds,v,h,{convert:'native'})+'::terrain-mask-'+level;
  const cached=displayCacheGet(key);
  if(cached)return cached;
  const masked=pressureTerrainMask(values,pressure,level);
  displayCachePut(key,masked);
  return masked;
 }catch(error){
  console.warn('Surface-pressure terrain mask unavailable; retaining original model missing-data mask',error);
  return values;
 }
}
function vorticityShadeData(p,ds,v,h,m,raw){
 const field=panelSelectedField(p);
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
 const known=/^(?:gfs_)?(stageiv|ccpa|nohrsc|mrms|urma|rtma|rap)(?:[_-]|$)/i.exec(raw);
 return known?(known[1]==='stageiv'?'Stage IV':known[1].toUpperCase()):raw.replace(/[_-]+/g,' ').toUpperCase();
}
// Source and field are selected together: a stale NOHRSC label must never
// migrate to a CCPA / Stage IV / MRMS precipitation verification panel.
function analysisFieldDescription(p,fallback){
 const field=p?.cfg?.field||st.field;
 const product=String(p?.ds?.product||'');
 const snow=field==='asnow'||/^snow(?:1|3|6|24|48)h$/.test(field)||!!gfsSnowSpec(field);
 const isNohrsc=/^(?:gfs_)?nohrsc_/.test(product);
 if(snow&&isNohrsc){
  const requestedPeriod=snowAccumulationHours(field)||gfsSnowSpec(field)?.period||0;
  return requestedPeriod?`${requestedPeriod}-hr snowfall`:'Observed accumulated snowfall';
 }
 if(field==='prate'&&/^(?:gfs_)?mrms_prate$/.test(product))return 'Precipitation rate';
 if((field==='apcp'||!!precipitationAccumulationHours(field))&&/^(?:gfs_)?(?:ccpa_|stageiv_|mrms_)/.test(product)){
  const period=precipitationAccumulationHours(field);
  return period?`${period}-hr precipitation accumulation`:'Accumulated precipitation';
 }
 return fallback;
}
function panelDisplayTitle(p,fieldDescription){
 if(panelSelectedField(p)==='refc_ptype'&&['analysis','gfs-analysis'].includes(p?.cfg?.timeMode)){
  const model=p.cfg.timeMode==='analysis'?'RAP':'GFSv16';
  if(p.analysisRadar)return `Analysis · MRMS reflectivity + ${model} F000 precipitation type`;
  if(p.analysisCategoricalOnly)return 'Analysis · RAP F000 precipitation type (reflectivity unavailable)';
  if(p.analysisNativeRadar||p.cfg.timeMode==='gfs-analysis')
   return `Analysis · ${model} F000 reflectivity + precipitation type (MRMS unavailable)`;
 }
 const product=String(p?.ds?.product||'');
 const snowAnalysis=/^(?:gfs_)?nohrsc_/.test(product);
 const precipAnalysis=/^(?:gfs_)?(?:ccpa_|stageiv_|mrms_(?:apcp|prate))/.test(product);
 const aviationAnalysis=p?.cfg?.timeMode==='gfs-analysis'&&['vis','ceil','flightcat'].includes(st.field)&&
  ['urma','rtma','rap_pressure'].includes(product);
 const isAnalysis=p?.cfg?.timeMode==='analysis'||(p?.cfg?.timeMode==='gfs-analysis'&&(snowAnalysis||precipAnalysis||!!p.gfsObservedAnalysis||aviationAnalysis));
 if(isAnalysis){
  // On the GFS panel the source comes from the verified multi-record plan;
  // on RRFS/REFS it comes from the actual selected analysis store.
  const source=p?.gfsObservedAnalysis?.source||analysisDisplaySource(p.ds);
  const description=analysisFieldDescription(p,fieldDescription);
  const display=source==='NOHRSC'?(description.startsWith('Observed')?description:'Observed '+description):description;
  return source==='Analysis'?`Analysis · ${display}`:`Analysis · ${source}${source==='NOHRSC'?' ':' · '}${display}`;
 }
 if(p?.gfsObservedCompare)return `${String(p?.cfg?.label||p?.cfg?.id||'Panel')} · ${fieldDescription} · vs ${p.gfsObservedCompare.source}`;
 return `${String(p?.cfg?.label||p?.cfg?.id||'Panel')} · ${fieldDescription}`;
}
// FIAB-style relief is appropriate for fields at/very near the surface.
// Upper-air fields and vertically integrated severe proxies cover terrain
// texture at 100% weather opacity, but reveal relief as opacity is lowered.
function surfaceTerrainField(field){
 const name=String(field||'');
 if(/^(?:t|h|u|v|wspd|absv)(?:250|300|500|700|850|925|1000)$/.test(name))return false;
 if(/^(?:sbcape|mlcape|mucape|srh01|srh03|shear01|shear06|mxuphl|mxuphl_run|rottrack_ml60|refc|refc_ptype)$/.test(name))return false;
 return true;
}
// Linear filtering of floating-point textures requires an optional WebGL
// extension on many mobile GPUs. Forcing LINEAR without it makes the floating
// texture incomplete: MapLibre geography and CPU contours still draw, but the
// scalar shading can silently disappear. Never sacrifice a plot for smoothing.
const linearFloatTextureSupport=new WeakMap();
function supportsLinearFloatTextures(gl){
 if(!gl||typeof gl.getExtension!=='function')return false;
 if(linearFloatTextureSupport.has(gl))return linearFloatTextureSupport.get(gl);
 let supported=false;
 try{supported=!!gl.getExtension('OES_texture_float_linear');}catch(_){}
 linearFloatTextureSupport.set(gl,supported);
 return supported;
}
function rasterTextureFilter(gl,p){
 if(!p?.interpolationEligible||!effectiveInterpolation())return gl.NEAREST;
 // Desktop rendering retains its established interpolation path. The guarded
 // fallback targets touch-device GPUs where unavailable float filtering can
 // silently hide otherwise valid scalar textures.
 if(!touchGraphicsDevice()||supportsLinearFloatTextures(gl))return gl.LINEAR;
 if(!p._linearFilterWarning){
  p._linearFilterWarning=true;
  console.warn('OMD EVU: GPU does not support linear filtering of float rasters; using nearest-neighbor for this panel.');
  if(el.interpolateToggleBtn)el.interpolateToggleBtn.title='This GPU does not support smooth float-texture filtering; nearest-neighbor shading is used for reliable display.';
 }
 // The requested preference is retained; it will work when using a capable
 // device. The present map always gets a complete, renderable texture.
 return gl.NEAREST;
}
// A mobile GPU may keep MapLibre geography alive while losing the custom
// float-texture weather shader without reporting WebGL context loss.  For
// compact touch views use a bounded CPU canvas for *shading only*. It reads
// the same display scalar and color map as the GPU, and preserves all vector
// map layers, hover sampling, annotations, and chart interactions. This is
// particularly important for low-memory WebGL mobile browsers.
// Every scalar that can be encoded as one numerical grid uses the native
// terrain-tile shader on MapLibre 6: Lambert, GFS regular LL, categorical
// precipitation type, reflectivity shaded by type and difference fields.
// Categories MUST use nearest-neighbor sampling, never interpolate types.
const terrainProjectionWarnings=new Set();
function nativeTerrainGPUAvailable(p,ds,m){
 if(!(window.EVU_MAPLIBRE_V6&&window.EVUGPUTerrain&&terrainEnabledForPanel(p)&&
      st.mode!=='globe'&&['regular_ll','lambert'].includes(ds?.grid?.GRIB_gridType)&&
      window.EVUGPUTerrain.supported()&&
      // MapLibre terrain RTT can paint ABOVE custom weather layers even with
      // 2-D layer ordering. Use a separate transparent overlay for reliable
      // color preservation until a standalone GPU overlay is implemented.
      st.cfg?.display?.terrainIndependentOverlay===false))return false;
 try{
  window.EVUGPUTerrain.projection(ds.grid,p?.v?.shape?.[2],p?.v?.shape?.[1]);
  return true;
 }catch(error){
  const key=String(ds?.id||ds?.model||'grid');
  if(!terrainProjectionWarnings.has(key)){
   terrainProjectionWarnings.add(key);
   console.warn('Native GPU grid metadata unavailable; using the established GPU renderer for '+key,error);
  }
  return false;
 }
}
function useMobileCanvasField(p){
 // MapLibre's terrain draping pass may draw DEM color-relief/hillshade ABOVE
 // autumnplot-gl custom layers, despite moveLayer(). For terrain, render the
 // field into a transparent, chart-sampled DOM canvas ABOVE the map instead.
 // This guarantees full-opacity colors, while NaN/below-ground masks expose
 // actual DEM geometry (also works around mobile GPU float-texture issues).
 // An independent DOM canvas is above the MapLibre terrain framebuffer.
 // MapLibre's 2D and 3D custom layer ordering did not prevent terrain RTT
 // colors painting over weather in the deployed viewer. Do not return false
 // for v6 here: separate compositing is essential for correct opacity.
 if(terrainEnabledForPanel(p)&&st.cfg?.display?.terrainIndependentOverlay!==false)return true;
 // MapLibre v6 still relies on the autumnplot-gl float-texture shader for
 // non-terrain weather. On some phone GPUs that shader can stop drawing
 // while MapLibre geography and field sampling continue to work. Use the
 // existing bounded, independent 2-D canvas for touch/compact devices even
 // with v6; desktop GPUs retain their normal shader rendering path.
 if(touchGraphicsDevice())return st.cfg?.display?.mobileCanvasFieldRendering!==false;
 if(window.EVU_MAPLIBRE_V6)return false;
 return terrainEnabledForPanel(p);
}

function colorRGBA(value,opacity=1){
 const raw=String(value||'').trim();
 if(!/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(raw))return [0,0,0,0];
 return [parseInt(raw.slice(1,3),16),parseInt(raw.slice(3,5),16),parseInt(raw.slice(5,7),16),
  Math.round((raw.length===9?parseInt(raw.slice(7,9),16):255)*opacity)];
}
function mobileColorForValue(value,palette,opacity,continuous=false){
 const levels=palette.levels,colors=palette.colors;
 if(value<levels[0]||!Number.isFinite(value))return [0,0,0,0];
 const limit=Math.min(levels.length-1,colors.length-1);
 let k=0;
 while(k<limit-1&&value>=levels[k+1])k++;
 const left=colorRGBA(colors[k],1);
 if(!continuous||k>=limit)return [left[0],left[1],left[2],Math.round(left[3]*opacity)];
 const right=colorRGBA(colors[k+1],1),width=Number(levels[k+1])-Number(levels[k]);
 const t=width>0?Math.max(0,Math.min(1,(value-levels[k])/width)):0;
 return [0,1,2,3].map(channel=>Math.round((left[channel]+(right[channel]-left[channel])*t)*(channel===3?opacity:1)));
}
function mobileFieldMasked(value,field,isDifference,m){
 if(!Number.isFinite(value)||value<=-1e9)return true;
 if(isDifference)return false;
 if(exceedsDisplayLimit(value,m))return true;
 if(m?.clearBelow&&value<m.clearBelow-1e-8)return true;
 if(m?.clearZero&&Math.abs(value)<m.clearZero)return true;
 if(/^(?:apcp(?:1h|3h|6h|24h|48h)?|snow(?:1h|3h|6h|24h|48h)|asnow|snod|weasd|tsnowp|frzr|frozr|gfs_snow_.*|rrfs_snow_.*)$/.test(field))
  return value<=0;
 return false;
}
const terrainReliefCanvasCache=new WeakMap();
// Build a subtle, neutral *luminance-only* relief modulation. Neither
// color-relief's greens/browns nor a translucent hillshade is mixed into the
// forecast palette. At 100% the user's selected color remains the base RGB;
// terrain contributes only a small light/dark variation of that same hue.
// The ~6-pixel DEM sampling lattice keeps this affordable across 9 panels.
function terrainFieldLuminance(map,nx,ny,w,h){
 if(!terrainEnabledForMap(map)||!surfaceTerrainField(st.field)||
    typeof map.queryTerrainElevation!=='function')return null;
 const lighting=overlayStyle('terrain'),strength=Math.max(0,Math.min(1,Number(lighting.reliefStrength??.75))),
  opacity=Math.max(0,Math.min(1,Number(lighting.opacity??1)));
 if(strength<=0||opacity<=0)return null;
 const cam=map.getCenter?.()||{},cacheKey=[nx,ny,w,h,cam.lng,cam.lat,map.getZoom?.(),
  map.getPitch?.(),map.getBearing?.(),map.__evuTerrainDEMRevision||0,strength,opacity,lighting.sunAngle,lighting.exaggeration].join('|');
 const existing=terrainReliefCanvasCache.get(map);
 if(existing?.key===cacheKey)return existing.relief;
 const step=10,cols=Math.ceil(nx/step)+1,rows=Math.ceil(ny/step)+1;
 const zs=new Float32Array(cols*rows);zs.fill(NaN);
 let valid=0;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  try{
   const x=Math.min(nx-1,i*step),y=Math.min(ny-1,j*step);
   const pos=map.unproject([(x+.5)*w/nx,(y+.5)*h/ny]);
   const z=map.queryTerrainElevation(pos,{exaggerated:false});
   if(Number.isFinite(z)){zs[j*cols+i]=z;valid++;}
  }catch(_){ /* missing DEM tile: use unchanged palette colors */ }
 }
 if(valid<4)return null;
 const multiplier=new Float32Array(cols*rows);multiplier.fill(1);
 const center=map.getCenter?.(),lat=Number(center?.lat)||0,zoom=Number(map.getZoom?.())||0;
 const metersPerCssPixel=156543.033928*Math.cos(lat*Math.PI/180)/Math.pow(2,zoom);
 const gridMeters=Math.max(.2,metersPerCssPixel*step*w/nx);
 const sun=Number(lighting.sunAngle??315)*Math.PI/180;
 const lightX=Math.sin(sun),lightY=-Math.cos(sun);
 const weight=Math.min(.28,.25*strength*opacity);
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const k=j*cols+i,z=zs[k];if(!Number.isFinite(z))continue;
  const west=zs[j*cols+Math.max(0,i-1)],east=zs[j*cols+Math.min(cols-1,i+1)],
   north=zs[Math.max(0,j-1)*cols+i],south=zs[Math.min(rows-1,j+1)*cols+i];
  if(![west,east,north,south].every(Number.isFinite))continue;
  const dx=(east-west)/(gridMeters*(i===0||i===cols-1?1:2)),
   dy=(south-north)/(gridMeters*(j===0||j===rows-1?1:2));
  // Visually emphasize micro-relief without changing the palette hue, unlike
  // semi-transparent green/brown color-relief or a dark overlay.
  const vertical=Math.max(0,Math.min(20,Number(lighting.exaggeration??12))); // match Terrain control
  const sx=dx*vertical*2.5,sy=dy*vertical*2.5;
  const lit=(sx*lightX+sy*lightY)/Math.sqrt(1+sx*sx+sy*sy);
  multiplier[k]=Math.max(.76,Math.min(1.24,1+lit*weight));
 }
 const relief={values:multiplier,cols,rows,step};
 terrainReliefCanvasCache.set(map,{key:cacheKey,relief});
 return relief;
}
function terrainLuminanceAt(relief,x,y){
 if(!relief)return 1;
 const fx=Math.min(relief.cols-1.00001,x/relief.step),fy=Math.min(relief.rows-1.00001,y/relief.step);
 const i=Math.floor(fx),j=Math.floor(fy),tx=fx-i,ty=fy-j;
 const a=relief.values[j*relief.cols+i],b=relief.values[j*relief.cols+Math.min(i+1,relief.cols-1)],
  c=relief.values[Math.min(j+1,relief.rows-1)*relief.cols+i],d=relief.values[Math.min(j+1,relief.rows-1)*relief.cols+Math.min(i+1,relief.cols-1)];
 return (a*(1-tx)+b*tx)*(1-ty)+(c*(1-tx)+d*tx)*ty;
}
// At a pitched camera the rendered terrain is the most faithful source of
// screen-aligned ridge lighting.  The earlier DEM slope calculation used a
// sea-level unprojected lattice, which does not follow the pitched surface:
// relief could vanish even when MapLibre was visibly rendering mountains.
// Sample only LOCAL luminance contrast from the finished *basemap* canvas;
// NEVER composite its RGB with weather, and never change forecast alpha.
// MapLibre is initialized with preserveDrawingBuffer=true for this purpose.
const terrainVisualScratch=new WeakMap();
function terrainRenderedLuminance(map,nx,ny){
 if(!terrainEnabledForMap(map)||!surfaceTerrainField(st.field))return null;
 const settings=overlayStyle('terrain');
 const opacity=Math.max(0,Math.min(1,Number(settings.opacity??1)));
 const strength=Math.max(0,Math.min(1,Number(settings.reliefStrength??.75)));
 if(opacity===0||strength===0)return null;
 const source=map.getCanvas?.();if(!source?.width||!source?.height)return null;
 // Sample approximately two forecast pixels per relief sample. The former
 // 3-pixel lattice discarded narrow ridges at high pitch and could produce
 // broad bands when exaggeration was raised. Cap cost for nine-panel views.
 const step=Math.max(1.5,Math.sqrt(nx*ny/80000));
 const cols=Math.max(3,Math.ceil(nx/step)),rows=Math.max(3,Math.ceil(ny/step));
 let scratch=terrainVisualScratch.get(map);
 if(!scratch){scratch={canvas:document.createElement('canvas')};terrainVisualScratch.set(map,scratch);}
 const canvas=scratch.canvas;
 const center=map.getCenter?.()||{};
 const revision=map.__evuTerrainDEMRevision||0;
 const key=[nx,ny,cols,rows,source.width,source.height,center.lng,center.lat,map.getZoom?.(),
  map.getPitch?.(),map.getBearing?.(),revision,opacity,strength,settings.exaggeration,settings.sunAngle].join('|');
 if(scratch.key===key&&scratch.relief)return scratch.relief;
 if(canvas.width!==cols)canvas.width=cols;
 if(canvas.height!==rows)canvas.height=rows;
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return null;
 let rgba;
 try{
  context.clearRect(0,0,cols,rows);
  context.drawImage(source,0,0,cols,rows);
  rgba=context.getImageData(0,0,cols,rows).data;
 }catch(_){return null;}
 const lum=new Float32Array(cols*rows),use=new Uint8Array(cols*rows);
 let count=0;
 for(let k=0;k<lum.length;k++){
  const q=k*4,r=rgba[q],g=rgba[q+1],b=rgba[q+2];
  const l=.2126*r+.7152*g+.0722*b;
  lum[k]=l;
  // Keep black background, lakes and white political lines from casting
  // high-contrast false ridges over the forecast.
  if(l>38&&!(Math.max(r,g,b)-Math.min(r,g,b)<17&&l>192)){
   use[k]=1;count++;
  }
 }
 if(count<Math.max(10,lum.length*.08))return null;
 const pitch=Number(map.getPitch?.()||0),iw=cols+1;
 const sums=new Float64Array(iw*(rows+1)),weights=new Uint32Array(iw*(rows+1));
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const k=y*cols+x,a=(y+1)*iw+x+1;
  const value=use[k]?lum[k]:0,n=use[k];
  sums[a]=value+sums[a-1]+sums[a-iw]-sums[a-iw-1];
  weights[a]=n+weights[a-1]+weights[a-iw]-weights[a-iw-1];
 }
 const meanAt=(x,y,radius)=>{
  const x0=Math.max(0,x-radius),x1=Math.min(cols,x+radius+1);
  const y0=Math.max(0,y-radius),y1=Math.min(rows,y+radius+1);
  const a=y0*iw+x0,b=y0*iw+x1,c=y1*iw+x0,d=y1*iw+x1;
  const n=weights[d]-weights[b]-weights[c]+weights[a];
  return n>=4?(sums[d]-sums[b]-sums[c]+sums[a])/n:NaN;
 };
 const fineRadius=pitch>40?3:2,largeRadius=pitch>40?13:10;
 const values=new Float32Array(cols*rows);values.fill(1);
 let changed=0;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const k=y*cols+x;if(!use[k])continue;
  const fine=meanAt(x,y,fineRadius),broad=meanAt(x,y,largeRadius);
  if(!Number.isFinite(fine)||!Number.isFinite(broad))continue;
  // Two scales: fine highlights resolve narrow ridges; the wider component
  // gives valleys their shape. Keep the very broad DEM color ramp out of the
  // calculation, so a slope in the basemap palette does not recolor weather.
  const local=Math.tanh((lum[k]-fine)/14);
  const valley=Math.tanh((fine-broad)/30);
  const detail=.68*local+.32*valley;
  const multiplier=Math.max(.68,Math.min(1.38,1+.43*strength*opacity*detail));
  values[k]=multiplier;
  if(Math.abs(multiplier-1)>.008)changed++;
 }
 if(changed<Math.max(5,cols*rows*.006))return null;
 scratch.key=key;scratch.relief={values,cols,rows,step:0,screenAligned:true};
 return scratch.relief;
}
function screenTerrainLuminanceAt(relief,x,y,nx,ny){
 if(!relief?.screenAligned)return terrainLuminanceAt(relief,x,y);
 const fx=Math.min(relief.cols-1.00001,Math.max(0,(x+.5)*relief.cols/nx-.5));
 const fy=Math.min(relief.rows-1.00001,Math.max(0,(y+.5)*relief.rows/ny-.5));
 const i=Math.floor(fx),j=Math.floor(fy),tx=fx-i,ty=fy-j;
 const a=relief.values[j*relief.cols+i],b=relief.values[j*relief.cols+Math.min(i+1,relief.cols-1)];
 const c=relief.values[Math.min(j+1,relief.rows-1)*relief.cols+i],d=relief.values[Math.min(j+1,relief.rows-1)*relief.cols+Math.min(i+1,relief.cols-1)];
 return (a*(1-tx)+b*tx)*(1-ty)+(c*(1-tx)+d*tx)*ty;
}
// Fast, bilinear regular-lat/lon sampler for the terrain canvas.  The
// previous path called sampleField() (nearest neighbour) at every canvas
// pixel, which was both blocky and prohibitively slow on multi-panel maps.
// Validate the array orientation against the existing field sampler before
// using the fast path; otherwise safely fall back to the native implementation.
function terrainBilinearSampler(spec){
 const data=spec.values,grid=spec.grid||{},nx=spec.nx,ny=spec.ny;
 if(!spec.continuous||!effectiveInterpolation()||grid.GRIB_gridType!=='regular_ll'||!data||data.length!==nx*ny||nx<2||ny<2)return null;
 const get=(a,b)=>Number(grid[a]??grid['GRIB_'+b]);
 let west=get('longitude_min','longitudeOfFirstGridPointInDegrees'),east=get('longitude_max','longitudeOfLastGridPointInDegrees');
 const south=get('latitude_min','latitudeOfFirstGridPointInDegrees'),north=get('latitude_max','latitudeOfLastGridPointInDegrees');
 if(west>=0&&east>180){west-=360;east-=360;}
 if(![west,east,south,north].every(Number.isFinite)||east<=west||north===south)return null;
 const raw=(i,j,flip)=>data[(flip?ny-1-j:j)*nx+i];
 const at=(i,j)=>({lng:west+(east-west)*i/(nx-1),lat:south+(north-south)*j/(ny-1)});
 const probes=[];for(const fx of [.12,.32,.52,.72,.88])for(const fy of [.16,.38,.62,.84])probes.push([Math.floor((nx-1)*fx),Math.floor((ny-1)*fy)]);
 let flip=null,best=Infinity;
 for(const candidate of [false,true]){
  let error=0,used=0;
  for(const [i,j] of probes){
   const xy=at(i,j),native=Number(spec.field.sampleField(xy.lng,xy.lat)),guess=raw(i,j,candidate);
   if(Number.isFinite(native)&&Number.isFinite(guess)&&Math.abs(native)<1e9&&Math.abs(guess)<1e9){
    error+=Math.abs(native-guess)/(1+Math.abs(native));used++;
   }
  }
  if(used===probes.length&&error<best){best=error;flip=candidate;}
 }
 if(flip===null||best>.02)return null;
 return (lon,lat)=>{
  // Match the longitude world copy used by the MapLibre camera.
  let ll=lon;
  if(ll<west)ll+=360*Math.ceil((west-ll)/360);
  if(ll>east)ll-=360*Math.ceil((ll-east)/360);
  const x=(ll-west)*(nx-1)/(east-west),y=(lat-south)*(ny-1)/(north-south);
  if(x<0||y<0||x>nx-1||y>ny-1)return NaN;
  const i=Math.min(nx-2,Math.floor(x)),j=Math.min(ny-2,Math.floor(y)),tx=x-i,ty=y-j;
  const a=raw(i,j,flip),b=raw(i+1,j,flip),c=raw(i,j+1,flip),d=raw(i+1,j+1,flip);
  // Never interpolate through underground masks or nodata sentinels.
  if(![a,b,c,d].every(v=>Number.isFinite(v)&&v>-1e9))return NaN;
  return (a*(1-tx)+b*tx)*(1-ty)+(c*(1-tx)+d*tx)*ty;
 };
}
// The temporary preview has an intentionally smaller sampling budget than
// the final terrain compositor. Its budget is based on the native field's
// ground spacing AND the displayed geographic footprint, not a model-name
// switch or a single fixed 24k pixels for every field/source. A 3-km RRFS
// field consequently receives a finer preview than a 0.25-degree GFS field
// at the same map extent, within a bounded interactive CPU budget.
function terrainPreviewGridSpacing(grid,lat){
 if(!grid)return null;
 const xMetres=Math.abs(Number(grid.GRIB_DxInMetres??grid.DxInMetres));
 const yMetres=Math.abs(Number(grid.GRIB_DyInMetres??grid.DyInMetres));
 if(Number.isFinite(xMetres)&&xMetres>0&&Number.isFinite(yMetres)&&yMetres>0)
  return Math.sqrt(xMetres*yMetres);
 const dx=Math.abs(Number(grid.GRIB_DxInDegrees??grid.DxInDegrees));
 const dy=Math.abs(Number(grid.GRIB_DyInDegrees??grid.DyInDegrees));
 if(Number.isFinite(dx)&&dx>0&&Number.isFinite(dy)&&dy>0)
  return 111195*Math.sqrt(dx*dy*Math.max(.06,Math.cos(Number(lat||0)*Math.PI/180)));
 return null;
}
function terrainPreviewMetresPerPixel(map,w,h){
 // A geographic measurement handles different map projections and future
 // source domains without conflating degrees of longitude with distance.
 try{
  const a=map.unproject([w*.5-16,h*.5]),b=map.unproject([w*.5+16,h*.5]);
  const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad;
  let dlon=(b.lng-a.lng)*rad;
  dlon=Math.atan2(Math.sin(dlon),Math.cos(dlon));
  const hav=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;
  const meters=2*6378137*Math.asin(Math.min(1,Math.sqrt(Math.max(0,hav))));
  if(Number.isFinite(meters)&&meters>0)return meters/32;
 }catch(_){/* zoom-based fallback below */}
 const zoom=Number(map?.getZoom?.()||0),lat=Number(map?.getCenter?.()?.lat||0);
 return 2*Math.PI*6378137*Math.max(.06,Math.cos(lat*Math.PI/180))/(512*Math.pow(2,zoom));
}
function terrainPreviewSamplePlan(map,spec,activePanels=1){
 const w=Number(map.getCanvas().clientWidth),h=Number(map.getCanvas().clientHeight);
 if(!(w>=5&&h>=5))return {nx:2,ny:2,budget:4,spacingMeters:null};
 const area=w*h,centerLat=Number(map?.getCenter?.()?.lat||0);
 const spacing=terrainPreviewGridSpacing(spec?.grid,centerLat);
 const mpp=terrainPreviewMetresPerPixel(map,w,h);
 // No metadata? Retain the previous lightweight preview budget, avoiding
 // assumptions about an unknown/future product's horizontal resolution.
 const cells=spacing&&Number.isFinite(mpp)&&mpp>0?
  area*(mpp/spacing)**2:null;
 const desired=cells===null?24000:Math.max(24000,Math.min(100000,cells*1.5));
 // Avoid monopolizing the main thread when users enable terrain on many
 // synchronized panels. The native data and full-quality final image remain
 // untouched; only this disposable preview receives an adaptive cap.
 const limit=100000/Math.sqrt(Math.max(1,Number(activePanels)||1));
 const budget=Math.max(6000,Math.min(area,desired,limit));
 const step=Math.max(1,Math.sqrt(area/budget));
 return {nx:Math.max(2,Math.ceil(w/step)),ny:Math.max(2,Math.ceil(h/step)),
  budget,spacingMeters:spacing};
}
function terrainPreviewViewKey(map){
 const c=map?.getCenter?.()||{},canvas=map?.getCanvas?.()||{};
 return [canvas.clientWidth,canvas.clientHeight,c.lng,c.lat,map?.getZoom?.(),
   map?.getPitch?.(),map?.getBearing?.()].join('|');
}
function paintTerrainPreview(p,map,canvas,spec,plotName,viewKey){
 const width=map.getCanvas().clientWidth,height=map.getCanvas().clientHeight;
 if(width<5||height<5)return false;
 const {nx,ny}=terrainPreviewSamplePlan(map,spec,
  Math.max(1,st.active.filter(x=>terrainEnabledForPanel(x)).length));
 if(canvas.width!==nx)canvas.width=nx;
 if(canvas.height!==ny)canvas.height=ny;
 const context=canvas.getContext('2d',{alpha:true});if(!context)return false;
 const image=context.createImageData(nx,ny),pixels=image.data;
 const bilinear=terrainBilinearSampler(spec),colorCache=new Map();
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  let value=NaN;
  try{
   const ll=map.unproject([(i+.5)*width/nx,(j+.5)*height/ny]);
   value=bilinear?bilinear(ll.lng,ll.lat):spec.field.sampleField(ll.lng,ll.lat);
  }catch(_){/* Out-of-view or sky pixels remain transparent */}
  if(mobileFieldMasked(value,plotName,!!p.cfg?.differencePanel,spec.meta))continue;
  const key=Math.round(value*10000);
  let rgba=colorCache.get(key);
  if(!rgba){rgba=mobileColorForValue(value,spec.palette,1,!!spec.continuous);colorCache.set(key,rgba);}
  const k=(j*nx+i)*4;
  pixels[k]=rgba[0];pixels[k+1]=rgba[1];pixels[k+2]=rgba[2];pixels[k+3]=rgba[3];
 }
 context.putImageData(image,0,0);
 canvas.dataset.renderMode='terrain-preview';
 canvas.style.imageRendering=spec.continuous?'auto':'pixelated';
 canvas.style.display='block';canvas.style.opacity='1';
 p._terrainPreviewViewKey=viewKey;p._terrainPreviewSpec=spec;
 return true;
}
function showTerrainPreview(p,map,canvas,spec,plotName){
 const key=terrainPreviewViewKey(map);
 if((p._terrainPresentedKey===key&&p._terrainPresentedSpec===spec&&
      canvas.dataset.renderMode==='three-terrain')||
     (p._terrainPreviewViewKey===key&&p._terrainPreviewSpec===spec&&
      canvas.dataset.renderMode==='terrain-preview'))return false;
 return paintTerrainPreview(p,map,canvas,spec,plotName,key);
}
// A source-relative decision, not a model-name switch: a costly preview
// competes with the high-quality terrain render for the same CPU time.
// When it would itself need tens of thousands of expensive map projections,
// skip it and communicate clearly that full-detail terrain is loading.
function terrainPreviewWorthDrawing(plan){return Number(plan?.budget||0)<=36000;}
function terrainDetailNotice(p,on,preview=false){
 if(!p?.view)return;
 if(on&&!p._terrainDetailNotice){
  const notice=document.createElement('div');notice.className='terrain-detail-render-status';
  notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  p.view.append(notice);p._terrainDetailNotice=notice;
 }
 if(p._terrainDetailNotice){
  p._terrainDetailNotice.textContent=preview?'Preview — preparing full-resolution terrain…':
   'Rendering full-resolution 3-D terrain…';
  p._terrainDetailNotice.hidden=!on;
 }
}
function drawMobileScalar(p){
 const map=p?.map,canvas=p?.mobileScalarCanvas,spec=p?.mobileScalar;
 // Never sample or rasterize surface forecast while any camera gesture runs.
 // Export capture deliberately bypasses this guard for its temporary camera.
 if(forecastCameraBusy(p)){if(p)p.shiftRenderPending=true;return;}
 if(!map||!canvas||!spec||!useMobileCanvasField(p))return;
 const w=map.getCanvas?.()?.clientWidth||0,h=map.getCanvas?.()?.clientHeight||0;
 if(w<5||h<5)return;
 // Real geographic DEM mesh, composited through one shared Three.js GPU
 // context into this independent overlay. This is ONLY for ground-following
 // fields. The now-correct upper-air and below-ground-mask paths are untouched.
 const plotName=p.cfg?.field||st.field;
 if(terrainEnabledForPanel(p)&&surfaceTerrainField(plotName)&&
    st.cfg?.display?.threeSurfaceDrape!==false&&!p.threeSurfaceDisabled&&!p.threeSurfaceFallbackFrame&&window.EVUThreeSurface){
  const bilinear=terrainBilinearSampler(spec),style=overlayStyle('terrain');
  const reference=(lon,lat)=>{try{return bilinear?bilinear(lon,lat):spec.field.sampleField(lon,lat);}catch(_){return NaN;}};
  // Only activate an alternative sampler after verifying it against the
  // already-rendering reference field. No model-name assumptions: detect the
  // native Lambert grid and preserve its original orientation/interpolation.
  // A strided grid uses different cell spacing and must retain the reference.
  let fastLambert=null;
  if(p.mobileRenderStride===1&&window.EVUFastLambertSampler?.build){
   // Building the validated native-grid sampler is independent of the map
   // camera. Cache it for this immutable display-field object, rather than
   // repeating calibration on every pan, resize, or terrain tile arrival.
   if(p._terrainFastSampleField!==spec){
    p._terrainFastSampleField=spec;
    try{p._terrainFastSample=window.EVUFastLambertSampler.build(spec.grid,spec.values,
      spec.nx,spec.ny,reference,{earthRadiusM:st.cfg.display.earthRadiusM||6371229});}
    catch(error){p._terrainFastSample=null;console.warn('Terrain Lambert acceleration rejected; using reference sampling',error);}
   }
   fastLambert=p._terrainFastSample;
  }
  const token=spec;
  const settings={identity:spec,fieldKey:p.lastKey||plotName,
   sample:reference,sampleRow:fastLambert?.sampleRow||null,
   samplerDiagnostics:window.EVUFastLambertSampler?.getDiagnostics?.()||null,
   mask:value=>mobileFieldMasked(value,plotName,!!p.cfg?.differencePanel,spec.meta),
   color:value=>mobileColorForValue(value,spec.palette,1,!!spec.continuous),
   interpolate:effectiveInterpolation()&&!!spec.continuous,
   opacity:st.imageOpacity,sunAngle:Number(style.sunAngle??315),
   reliefStrength:Number(style.reliefStrength??.75),
   exaggeration:Number(style.exaggeration??12),
   activePanels:st.expandedPanel===p?1:Math.max(1,st.active.filter(x=>terrainEnabledForPanel(x)).length)};
  // v1.2.51: return to the v1.2.46 direct high-detail terrain render.
  // No intermediate coarse preview, status-stage flip, or DEM-readiness gate.
  // The original renderer can draw with available DEM and refine on tile arrivals.
  const started=window.EVUThreeSurface.draw(p,settings);
  const drawGeneration=p._evuThreeGeneration;
  p.threeDrawPromise=started.then(ok=>{
   // A Shift-drag or later redraw invalidates this generation. Never mistake
   // an intentionally canceled frame for a Three.js failure and disable it.
   if(token!==p.mobileScalar||!p.map||forecastCameraBusy(p)||p._evuThreeSuspended||
      drawGeneration!==p._evuThreeGeneration)return;
   if(ok){p.threeSurfaceFailures=0;return;}
   // The DEM may not be ready yet; retry Three at a later map event. After
   // repeated failures, or a missing GPU/module, keep the stable CPU fallback.
   p.threeSurfaceFailures=(p.threeSurfaceFailures||0)+1;
   if(window.EVUThreeSurface.getStatus().failed||p.threeSurfaceFailures>=4)
    p.threeSurfaceDisabled=true;
   canvas.removeAttribute('data-render-mode');
   p.threeSurfaceFallbackFrame=true;
   try{drawMobileScalar(p);}finally{p.threeSurfaceFallbackFrame=false;}
  });
  return;
 }
 p.threeDrawPromise=null;canvas.removeAttribute('data-render-mode');
 // Hard pixel budget to bound cost, with at least 1.8 CSS px per sample.
 // Keep enough canvas samples for smooth rainbands without redrawing
 // millions of pixels across a nine-panel layout on every map movement.
 const scale=Math.max(1.35,Math.sqrt(w*h/(effectiveInterpolation()?95000:110000)));
 const nx=Math.max(2,Math.ceil(w/scale)),ny=Math.max(2,Math.ceil(h/scale));
 if(canvas.width!==nx)canvas.width=nx;
 if(canvas.height!==ny)canvas.height=ny;
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 const image=ctx.createImageData(nx,ny),pixels=image.data;
 const colorCache=new Map(),fieldName=p.cfg?.field||st.field;
 // Ground-hugging fields receive a *neutral directional light/shadow* multiplier
 // from the DEM, not terrain colors or a second alpha layer. Upper-air field
 // RGB is never modulated: below-ground pixels alone expose terrain.
 const opacity=st.imageOpacity,relief=surfaceTerrainField(fieldName)?
  (terrainRenderedLuminance(map,nx,ny)||terrainFieldLuminance(map,nx,ny,w,h)):null;
 const bilinear=terrainBilinearSampler(spec);
 // This same, fail-closed geographic scanline accelerator was already used
 // in difference PNG exports. In a flat zero-bearing Mercator map, longitude
 // varies linearly with screen X and latitude does not. Other camera modes
 // automatically retain per-pixel map.unproject(), exactly as before.
 const longitude=differenceExportLongitudeScanline(map,nx,w,h);
 const stepX=w/nx,stepY=h/ny;
 // A validated native-grid Lambert sampler is already shipped for the
 // terrain renderer. Reuse it for flat mobile weather pixels when the
 // geographic scanline is valid; reject silently if orientation differs.
 if(longitude&&!bilinear&&p.mobileRenderStride===1&&window.EVUFastLambertSampler?.build&&
    p._flatLambertSpec!==spec){
  p._flatLambertSpec=spec;
  try{p._flatLambertSampler=window.EVUFastLambertSampler.build(spec.grid,spec.values,
    spec.nx,spec.ny,(lon,lat)=>spec.field.sampleField(lon,lat),
    {earthRadiusM:st.cfg.display.earthRadiusM||6371229});}
  catch(error){p._flatLambertSampler=null;console.debug('Mobile Lambert fallback',error);}
 }
 const rowLambert=longitude&&!bilinear&&p.mobileRenderStride===1?
  p._flatLambertSampler?.sampleRow:null;
 const started=performance.now();
 for(let y=0;y<ny;y++){
  const py=(y+.5)*stepY;
  let rowLat=NaN,rowValues=null;
  if(longitude){
   try{rowLat=map.unproject([stepX*.5,py]).lat;
    if(rowLambert&&Number.isFinite(rowLat))rowValues=rowLambert(longitude,rowLat);
   }catch(_){rowLat=NaN;}
  }
  for(let x=0;x<nx;x++){
   let v=NaN;
   try{
    if(rowValues)v=rowValues[x];
    else if(longitude&&Number.isFinite(rowLat))
     v=bilinear?bilinear(longitude[x],rowLat):spec.field.sampleField(longitude[x],rowLat);
    else if(!longitude){const coord=map.unproject([(x+.5)*stepX,py]);
     v=bilinear?bilinear(coord.lng,coord.lat):spec.field.sampleField(coord.lng,coord.lat);}
   }catch(_){ }
   if(mobileFieldMasked(v,fieldName,!!p.cfg?.differencePanel,spec.meta))continue;
   // Quantize cache keys only below the visible color precision. This
  // cache does not change the scalar data or the continuous color scale.
  const lookup=Number.isFinite(v)?Math.round(v*10000):'bad';
  let rgba=colorCache.get(lookup);
  if(!rgba){rgba=mobileColorForValue(v,spec.palette,opacity,spec.continuous);colorCache.set(lookup,rgba);}
  const k=(y*nx+x)*4,lum=screenTerrainLuminanceAt(relief,x,y,nx,ny);
  pixels[k]=Math.min(255,Math.round(rgba[0]*lum));
  pixels[k+1]=Math.min(255,Math.round(rgba[1]*lum));
   pixels[k+2]=Math.min(255,Math.round(rgba[2]*lum));pixels[k+3]=rgba[3];
  }
 }
 p.mobileDrawMs=Math.round(performance.now()-started);
 ctx.putImageData(image,0,0);
 canvas.style.imageRendering=effectiveInterpolation()?'auto':'pixelated';
 // MapLibre's 'move' listener hides stale forecast pixels. A successful
 // settled CPU draw must restore visibility even if that movement completed
 // before the asynchronous field download, or the map will sample correctly
 // but appear empty until the next camera gesture.
 if(!forecastCameraBusy(p)){
  canvas.style.display='block';
  canvas.style.opacity='1';
 }
}
async function drawMobileGeography(p){
 const map=p.map,canvas=p.mobileGeoCanvas;
 if(!map||!canvas)return;
 if(!p.mobileScalar&&!p.upperAirGeoOverlay){
  canvas.style.display='none';setPanelGeographyOverlay(p,false);return;
 }
 // During a pan/zoom MapLibre alone owns geography. The supplemental canvas
 // is hidden until it is redrawn at the settled camera, with zero doubled lines.
 if(p.geoMoving)return;
 const w=map.getContainer().clientWidth,h=map.getContainer().clientHeight;
 if(!(w>0&&h>0))return;
 const dpr=Math.min(2,devicePixelRatio||1);
 canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));
 canvas.style.display='none';setPanelGeographyOverlay(p,false);
 const serial=p.geoRedrawSerial=(p.geoRedrawSerial||0)+1;
 let ready=false;
 try{
  await redrawDifferenceBoundaries(canvas,map,{exportGeoVisible:exportGeographyVisibility(p,map),liveNoHalo:true,
   difference:!!p.cfg.differencePanel});
  ready=true;
 }catch(e){console.warn('Mobile geography overlay:',e);}
 if(ready&&!p.geoMoving&&serial===p.geoRedrawSerial){
  // Canvas is composited OVER the weather; MapLibre outlines live BELOW it.
  // Suppress the native copy before exposing the redrawn canvas.
  setPanelGeographyOverlay(p,true);canvas.style.display='block';
 }
}
function scheduleMobileScalarRedraw(p,delay=120){
 if(!p?.mobileScalarCanvas||(!p.mobileScalar&&!p.upperAirGeoOverlay))return;
 clearTimeout(p.mobileScalarTimer);
 if(forecastCameraBusy(p)){
  // Coalesce DEM tiles, resize, and synchronized camera updates into one
  // settled redraw. Do not even start a setTimeout while the camera moves.
  p.mobileScalarTimer=null;p.shiftRenderPending=true;return;
 }
 p.mobileScalarTimer=setTimeout(()=>{
  p.mobileScalarTimer=null;
  if(forecastCameraBusy(p)){p.shiftRenderPending=true;return;}
  // Upper-air color already comes from a separate GPU path; only outlines
  // need to be redrawn above that field.
  if(p.mobileScalar)drawMobileScalar(p);
  const pending=p.threeDrawPromise;
  if(pending){
   // Don't flash an old, misregistered forecast texture before the new draw.
   void pending.then(()=>{
    if(p.map&&!forecastCameraBusy(p)&&p.threeDrawPromise===pending&&p.mobileScalarCanvas?.dataset.renderMode==='three-terrain')
     p.mobileScalarCanvas.style.opacity='1';
   }).catch(()=>{});
  }else if(p.mobileScalarCanvas&&p.mobileScalar)p.mobileScalarCanvas.style.opacity='1';
  void drawMobileGeography(p);
  p.shiftRenderPending=false;
 },delay);
}
// autumnplot-gl 4.1.1 creates WGLTexture objects with their filter parameters
// in the constructor. Its setImageData() method replaces pixel data but does
// NOT update TEXTURE_MAG_FILTER/TEXTURE_MIN_FILTER on an existing texture.
// Therefore changing image_mag_filter and calling updateField() alone cannot
// change an already-rendered panel. Update the actual bound WebGL texture(s).
function applyRasterInterpolationFilter(component,p){
 const elems=component?.gl_elems,gl=elems?.gl,textures=component?.fill_texture;
 if(!gl||!textures||typeof textures.values!=='function')return false;
 const filter=rasterTextureFilter(gl,p);
 let changed=false;
 for(const texture of textures.values()){
  if(!texture||typeof texture.activate!=='function'||typeof texture.deactivate!=='function')continue;
  texture.activate(0);
  try{
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);
   changed=true;
  }finally{texture.deactivate();}
 }
 if(changed)elems.map?.triggerRepaint?.();
 return changed;
}
// Set the preferred filter before every Raster field update so newly-created
// textures receive it in their constructor. Apply it again after updateField
// so existing textures also receive the real WebGL sampler change.
function installRasterInterpolation(component,p){
 const originalUpdate=component.updateField.bind(component);
 component.updateField=async function(field,mask){
  const gl=this.gl_elems?.gl;
  if(gl)this.image_mag_filter=rasterTextureFilter(gl,p);
  const result=await originalUpdate(field,mask);
  applyRasterInterpolationFilter(this,p);
  return result;
 };
}
// A global regular-lat/lon field can require >1 million texture vertices
// regardless of which model produced it. A 2x display-only grid on compact
// devices reduces that GPU payload 4x; contours, sampling, meteorological
// calculations and native datasets still use full resolution. Do not reduce
// native terrain meshes. Endpoints remain exactly geographically registered.
function mobileRasterStride(ds,v,p){
 const n=Number(v?.shape?.[1])*Number(v?.shape?.[2]);
 if(window.EVU_MAPLIBRE_V6&&terrainEnabledForPanel(p))return 1;
 return touchGraphicsDevice()&&ds?.grid?.GRIB_gridType==='regular_ll'&&n>=300000?2:1;
}
function mobileRegularRasterField(ds,v,values,stride){
 const ny=v.shape[1],nx=v.shape[2];
 if(stride<=1)return {grid:gridFromDataset(ds,v),values};
 const newNx=Math.floor((nx-1)/stride)+1,newNy=Math.floor((ny-1)/stride)+1;
 const selected=new Float32Array(newNx*newNy);
 for(let y=0;y<newNy;y++){
  const srcY=Math.round(y*(ny-1)/(newNy-1));
  for(let x=0;x<newNx;x++){
   const srcX=Math.round(x*(nx-1)/(newNx-1));
   selected[y*newNx+x]=values[srcY*nx+srcX];
  }
 }
 const virtual={...v,shape:[1,newNy,newNx]};
 return {grid:gridFromDataset(ds,virtual),values:selected};
}
// Low tracks are an independent overlay for MSLP-capable surface fields; all
// trajectory geometry is loaded from compact, converter-published JSON.
// We deliberately do not infer tracks from browser pixels or retain grids.
function lowTrackSourceId(model,initTime){
 if(!initTime||!model)return null;
 const date=new Date(initTime);
 if(!Number.isFinite(date.getTime()))return null;
 const day=date.toISOString().slice(0,10).replace(/-/g,'');
 const cycle=String(date.getUTCHours()).padStart(2,'0');
 return `${model}_${day}_${cycle}00`;
}
function lowTrackGridDomain(p){
 const g=p?.ds?.grid;
 if(!g)return null;
 if(g.GRIB_gridType==='regular_ll'){
  const pick=(a,b)=>{const x=g[a]??g['GRIB_'+b];return x==null?NaN:Number(x);};
  let west=pick('longitude_min','longitudeOfFirstGridPointInDegrees');
  let east=pick('longitude_max','longitudeOfLastGridPointInDegrees');
  const south=pick('latitude_min','latitudeOfFirstGridPointInDegrees');
  const north=pick('latitude_max','latitudeOfLastGridPointInDegrees');
  if(![west,east,south,north].every(Number.isFinite))return null;
  if(east<west)east+=360;
  if(east-west>360.001||south>north)return null;
  return {type:'rect',west,east,south,north};
 }
 if(g.GRIB_gridType!=='lambert'||!p.v)return null;
 // The native 3-km RRFS, REFS and HRRR grid is a rectangle in Lambert
 // projection, but its four edges are CURVES in longitude/latitude. Sample
 // these edges from the existing autumnplot projection; a rectangular
 // geographic bounding box would admit erroneous offshore tracks.
 try{
  const grid=gridForPanel(p,p.ds,p.v);
  if(typeof grid.transform!=='function'||
     ![grid.ll_x,grid.ur_x,grid.ll_y,grid.ur_y].every(Number.isFinite))return null;
  const points=[];
  const N=24;
  const sample=(x,y)=>{
   const xy=grid.transform(x,y,{inverse:true});
   if(!Array.isArray(xy)||xy.length<2||!xy.every(Number.isFinite))throw Error('Invalid Lambert edge');
   points.push(xy);
  };
  for(let j=0;j<N;j++){const t=j/N;sample(grid.ll_x+(grid.ur_x-grid.ll_x)*t,grid.ll_y);}
  for(let j=0;j<N;j++){const t=j/N;sample(grid.ur_x,grid.ll_y+(grid.ur_y-grid.ll_y)*t);}
  for(let j=0;j<N;j++){const t=j/N;sample(grid.ur_x-(grid.ur_x-grid.ll_x)*t,grid.ur_y);}
  for(let j=0;j<N;j++){const t=j/N;sample(grid.ll_x,grid.ur_y-(grid.ur_y-grid.ll_y)*t);}
  return {type:'polygon',coordinates:points};
 }catch(error){console.warn('Low-track Lambert boundary unavailable:',error);return null;}
}
function lowTrackProductSources(p){
 const isAnalysis=p.cfg?.timeMode==='analysis';
 const gfsAnalysis=p.cfg?.timeMode==='gfs-analysis';
 if(isAnalysis)return [{file:'analysis_f000_rap_surface.json',label:'RAP F000 low history (diagnostic)',kind:'analysis_f000',model:'rap_surface'}];
 // The GFS Analysis panel is composed of successive GFSv16 F000 cycles,
 // not the selected forecast's F003/F006/... MSLP fields.
 if(gfsAnalysis)return [{file:'analysis_f000_gfs_v16.json',label:'GFSv16 F000 low history (diagnostic)',kind:'analysis_f000',model:'gfs_v16'}];
 // When a 2-m/10-m image came from a companion Zarr with no MSLP,
 // select the SAME-cycle physical MSLP dataset for the track identifier.
 // This prevents false 404s for separate surface/pressure stores and GEFS.
 const sameCycle=cycleKey(p.ds?.init_time||st.ref?.init_time);
 const sourceHasMSLP=ds=>ds?.variables?.some(v=>v.name==='mslp'&&
  (v.available_hours?.includes(p.h)||!Number.isInteger(p.h)));
 const pressureDs=sourceHasMSLP(p.ds)?p.ds:(p.src?.datasets||[])
  .find(ds=>cycleKey(ds.init_time)===sameCycle&&sourceHasMSLP(ds))||p.ds;
 const physical=String(pressureDs?.id||pressureDs?.path||'').replace(/\.zarr$/,'');
 const model=p.cfg?.source||pressureDs?.model||st.primary?.id;
 const id=/^[a-z][a-z0-9_]*_\d{8}_\d{4}$/.test(physical)?physical:
  lowTrackSourceId(model,pressureDs?.init_time||st.ref?.init_time);
 return id?[{file:id+'.json',label:p.cfg?.label||model.toUpperCase()}]:[];
}
// Track products are generated by an independent official gettrk job. Do not
// mistake an unpublished cycle, an unprocessed forecast lead, or a filtered
// active-time fix for evidence that the forecast MSLP field contains no low.
function lowTrackDisplayState(p,result){
 const status=result?.status||'loading';
 const lead=(p?.cfg?.timeMode==='analysis'||p?.cfg?.timeMode==='gfs-analysis')?
  'F000 valid '+String(result?.validTime||'selected time').replace('T',' ').replace(/:00Z$/,'Z'):
  Number.isInteger(p?.h)?`F${pad3(p.h)}`:'this time';
 if(status==='ready')return null;
 if(status==='empty')return {status,text:p?.cfg?.timeMode==='analysis'||p?.cfg?.timeMode==='gfs-analysis'?
  'Low tracks · No F000 diagnostic lows in this cycle':'Low tracks · No active official fix at '+lead};
 if(status==='history')return {status,text:'Low tracks · F000 history only; no low at current time'};
 if(status==='unavailable')return {status,text:p?.cfg?.timeMode==='analysis'||p?.cfg?.timeMode==='gfs-analysis'?
  'Low tracks · F000 diagnostic series not published':'Low tracks · Not published for this cycle'};
 if(status==='legacy')return {status,text:'Low tracks · Official product not published'};
 if(status==='error'){
  const reason=[result?.error,...(result?.errors||[])].filter(Boolean).join(' ');
  const http=/HTTP\s+(\d{3})/.exec(reason);
  return {status,text:http?`Low tracks · Download failed (HTTP ${http[1]})`:
   'Low tracks · Metadata download failed'};
 }
 if(status==='incomplete')return {status,text:result?.currentLeadProcessed===false?
  `Low tracks · ${lead} not yet processed`:'Low tracks · Processing incomplete'};
 if(status==='partial')return {status,text:'Low tracks · Some track sources missing'};
 return null; // Waiting/loading must not flash across animation frames.
}
function updateLowTrackPanelStatus(p,result=p?.lowTrackResult){
 const node=p?.lowTrackNotice;
 if(!node)return;
 const enabled=st.lowTracksEnabled&&lowTracksAvailableForField()&&
  !p.cfg?.differencePanel&&!p.cfg?.placeholder&&!!p.map;
 const message=enabled?lowTrackDisplayState(p,result):null;
 node.hidden=!message;
 if(!message){node.textContent='';node.title='';node.removeAttribute('data-status');return;}
 node.textContent=message.text;node.dataset.status=message.status;
 const details=[];
 if(p.cfg?.label)details.push(p.cfg.label);
 if(result?.validTime)details.push('Valid: '+result.validTime);
 else if(Number.isInteger(p.h))details.push(`F${pad3(p.h)}`);
 if(result?.filesRequested)details.push(`Official files: ${result.filesLoaded||0}/${result.filesRequested}`);
 if(Number.isInteger(result?.totalTracks))details.push(`Published track objects: ${result.totalTracks}`);
 if(Number.isInteger(result?.fixesAtValidTime))details.push(`Fixes at valid time: ${result.fixesAtValidTime}`);
 if(Number.isInteger(result?.fixesInDomainAtValidTime))details.push(`Fixes within native field: ${result.fixesInDomainAtValidTime}`);
 if(result?.coverage?.expectedCount)details.push(`Processed native leads: ${result.coverage.processedCount}/${result.coverage.expectedCount}`);
 if(result?.currentLeadProcessed===false)details.push('Displayed forecast lead not present in official processed_hours');
 if(result?.missingFiles?.length)details.push('Not published: '+result.missingFiles.join(', '));
 if(result?.errors?.length)details.push('Errors: '+result.errors.join('; '));
 if(result?.error)details.push(result.error);
 details.push(p?.cfg?.timeMode==='analysis'||p?.cfg?.timeMode==='gfs-analysis'?
  'F000 center history is an experimental time association, NOT official GFDL gettrk.':'A visible MSLP minimum is not necessarily a published official cyclone track.');
 node.title=details.join('\n');
}
function updateLowTracksStatus(){
 const label=el.lowTracksStatus;
 if(!label)return;
 const enabled=st.lowTracksEnabled&&lowTracksAvailableForField();
 label.hidden=!enabled;
 if(!enabled){label.textContent='';label.title='';return;}
 const panels=(st.panels||[]).filter(p=>!p.cfg?.placeholder&&!p.cfg?.differencePanel);
 const count=status=>panels.filter(p=>p.lowTrackResult?.status===status).length;
 const withTracks=panels.filter(p=>(p.lowTrackResult?.points||0)>0).length;
 const empty=count('empty'),history=count('history'),incomplete=count('incomplete'),partial=count('partial');
 const unavailable=count('unavailable')+count('legacy'),errors=count('error');
 const loading=panels.filter(p=>!p.lowTrackResult||p.lowTrackResult.status==='stale').length;
 const messages=[];
 if(withTracks)messages.push(`${withTracks} panel${withTracks===1?'':'s'} with tracks`);
 if(empty)messages.push(`${empty} without lows`);
 if(history)messages.push(`${history} showing previous F000 tracks`);
 if(incomplete)messages.push(`${incomplete} not fully processed`);
 if(partial)messages.push(`${partial} partially available`);
 if(unavailable)messages.push(`${unavailable} not published`);
 if(errors)messages.push(`${errors} download error${errors===1?'':'s'}`);
 if(loading)messages.push(`${loading} checking/waiting`);
 label.textContent='Low tracks: '+(messages.join(' · ')||'waiting for model data');
 label.title=panels.map(p=>{
  const label=p.cfg?.label||p.cfg?.source||'Panel';
  const msg=lowTrackDisplayState(p,p.lowTrackResult);
  return label+': '+(msg?.text||((p.lowTrackResult?.points||0)>0?'Tracks shown':'Checking'));
 }).join('\n')+'\nOfficial tracks depend on native GRIB and scheduled tracker runs; an MSLP minimum does not itself establish a track.';
}
async function syncLowTrackOverlay(p,seq){
 if(!st.lowTracksEnabled||!lowTracksAvailableForField()||p.cfg?.differencePanel||!p.map){
  window.EVULowTracks?.remove?.(p);p.lowTrackResult=null;updateLowTrackPanelStatus(p,null);updateLowTracksStatus();return;
 }
 const isAnalysis=p.cfg?.timeMode==='analysis',gfsAnalysis=p.cfg?.timeMode==='gfs-analysis';
 const lowerTime=(isAnalysis||gfsAnalysis)?st.ref?.init_time:(p.ds?.init_time||st.ref?.init_time);
 const upperTime=(isAnalysis||gfsAnalysis)?valid(st.ref,st.hour).toISOString():
  (p.ds&&Number.isInteger(p.h)?valid(p.ds,p.h).toISOString():valid(st.ref,st.hour).toISOString());
 const sources=lowTrackProductSources(p);
 updateLowTrackPanelStatus(p,{status:'loading'});
 const pending=window.EVULowTracks?.show?.(p,{
  // Track colors remain tied to the MSLP palette, even when temperature,
  // dewpoint, RH or 10-m wind is the image currently being shaded.
  palette:pal(FIELDS.mslp,{name:'mslp'},'mslp'),
  sources,baseUrl:new URL('data/low_tracks/',document.baseURI).href,
  lowerTime,upperTime,activeTime:upperTime,analysisF000:isAnalysis?'rap_surface':gfsAnalysis?'gfs_v16':null,
  domainBounds:lowTrackGridDomain(p),
  requestedHour:(!isAnalysis&&!gfsAnalysis&&Number.isInteger(p.h))?p.h:null,
  expectedHours:(!isAnalysis&&!gfsAnalysis&&Number.isInteger(p.h))?
   Array.from({length:Math.floor(p.h/Math.max(1,Number(st.modelSetConfig?.forecastHourStep)||1))+1},
     (_,i)=>i*Math.max(1,Number(st.modelSetConfig?.forecastHourStep)||1)):null
 });
 p.lowTrackPending=pending;
 let result;
 try{result=await pending;}
 finally{if(p.lowTrackPending===pending)p.lowTrackPending=null;}
 if(seq!==st.seq||!lowTracksAvailableForField()||!st.lowTracksEnabled||!p.map||result?.status==='stale')return;
 p.lowTrackResult=result;
 updateLowTrackPanelStatus(p,result);
 if(['error','partial','incomplete'].includes(result?.status))
  console.warn('Low-track overlay for',p.cfg?.label||p.cfg?.source||'panel',result?.errors||result?.error||result?.coverage);
 // Missing track data are nonblocking: never replace a valid weather map
 // with a full-panel error, especially across nine concurrent sources.
 updateLowTracksStatus();
}
async function renderPanel(p,seq){if(!p.map)return;
 // The current frame must never retain trajectories from the prior lead or
 // a different plot while its new scalar field is still loading.
 window.EVULowTracks?.remove?.(p);p.lowTrackResult=null;updateLowTrackPanelStatus(p,null);
 p.gfsObservedAnalysis=null;p.gfsObservedCompare=null;window.EVUAdvancedMap?.setVectors(p,null,null);clearWindBarbs(p);clearContours(p);p.heightField=null;p.windSpeed850Field=null;p.moistureFields={};p.rawField=null;p.readoutField=null;p.contourField=null;p.primaryContourField=null;p.mslpContourField=null;p.temperature850Field=null;p.diffDisplayData=null;const selected=choose(p);p.ds=selected.ds||null;p.v=selected.v||null;p.h=selected.h??null;void syncSurfaceWeatherPanel(p);p.title.textContent=panelDisplayTitle(p,st.field==='asnow'&&selected.ds?.product==='nohrsc_6h'?'Accumulated snowfall':panelFieldInfo(p,selected.v||{name:panelSelectedField(p)}).label);p.sub.textContent=selected.ds&&Number.isInteger(selected.h)?((p.cfg.timeMode==='analysis'||(p.cfg.timeMode==='gfs-analysis'&&(/^nohrsc_/.test(selected.ds.product||'')||!!p.gfsObservedAnalysis||
   (['vis','ceil','flightcat'].includes(st.field)&&['urma','rtma','rap_pressure'].includes(selected.ds.product)))))?`Valid ${fmt(valid(selected.ds,selected.h))}`:`Init ${fmt(selected.ds.init_time)} · F${pad3(selected.h)} · valid ${fmt(valid(selected.ds,selected.h))}`):'Source unavailable';
 if(selected.error||!selected.v||!Number.isInteger(selected.h)||selected.h<0||selected.h>=selected.v.shape[0]||!selected.v.available_hours.includes(selected.h)){if(p.layer&&p.map?.getLayer(p.layer.id))p.map.removeLayer(p.layer.id);p.layer=null;p.component=null;p.mobileScalar=null;terrainDetailNotice(p,false);window.EVUThreeSurface?.dispose?.(p);p.upperAirGeoOverlay=false;if(p.mobileScalarCanvas)p.mobileScalarCanvas.style.display='none';if(p.mobileGeoCanvas)p.mobileGeoCanvas.style.display='none';setPanelGeographyOverlay(p,false);p.rawField=null;p.readoutField=null;p.contourField=null;p.primaryContourField=null;p.lastKey=null;scheduleCityUpdate(p);p.status='missing';p.save.disabled=true;setNote(p,selected.error||`No ${selected.v.name} for F${pad3(selected.h)}`);legend(p,null);syncObservationPanel(p);syncSPCPanel(p);syncLightningPanel(p);syncAmountReportsPanel(p);updateStatus();if(st.difference.open&&st.difference.selected.includes(p))scheduleDifferenceRefresh();return;}
 const {ds,v,h}=selected;let m=panelFieldInfo(p,v);if(p.analysisRadar)p.title.textContent='Analysis · MRMS reflectivity + '+(p.cfg.timeMode==='analysis'?'RAP':'GFSv16')+' F000 precipitation type';else if(p.cfg.timeMode==='analysis'&&st.field==='ptype'&&/^rap(?:_|$)/.test(ds.product||''))p.title.textContent='Analysis · RAP F000 precipitation type';if(p.cfg.timeMode==='analysis'&&ds.product==='mrms_rotation_ml60'){p.title.textContent='Analysis · MRMS mid-level rotation track (3–6 km AGL)'+(st.field==='mxuphl_run'?' · running maximum':' · 60-minute maximum');p.sub.textContent='Radar azimuthal shear (×10⁻³ s⁻¹), not model updraft helicity · valid '+fmt(valid(st.ref,st.hour));}p.status='loading';p.loadSince=Date.now();p.save.disabled=true;updateStatus();p.busy=true;
 // When this hour is cached, replace its texture silently: status overlays make
 // a smooth loop appear to flash even though nothing needs downloading.
 const rawUrl=new URL(`${ds.path}/${v.name}/${h}.0.0`,new URL('.',p.src.url)).href;
 // Show a progress overlay immediately only for genuinely uncached input.
 // A prefetch from CacheStorage may still require decoding, but usually
 // finishes quickly enough that flashing a Requesting panel is distracting.
 const derivedModel=!!(precipitationAccumulationHours(st.field)||snowAccumulationHours(st.field)||gfsSnowSpec(st.field))&&p.cfg.timeMode!=='analysis'&&!(p.cfg.timeMode==='gfs-analysis'&&/^nohrsc_/.test(ds.product||''));
 const derivedAnalysis=!!p.analysisRadar||(st.field==='apcp'||!!precipitationAccumulationHours(st.field)||st.field==='snow48h')&&p.cfg.timeMode==='analysis'||(p.cfg.timeMode==='gfs-analysis'&&/^nohrsc_/.test(ds.product||'')&&(gfsSnowSpec(st.field)?.period===48||gfsSnowSpec(st.field)?.period===0));
 const rawCached=url=>st.cache.has(url)||st.chunkStore?.entries.has(url);
 const sameHourHot=st.displayCache.has(displayKey(p.src,ds,v,h,m))||st.cache.has(rawUrl);
 const priorHour=gfsSnowSpec(st.field)?(gfsSnowSpec(st.field).period?h-gfsSnowSpec(st.field).period:0):h-(snowAccumulationHours(st.field)||precipitationAccumulationHours(st.field)||1);
 const modelPriorUrl=new URL(`${ds.path}/${v.name}/${priorHour}.0.0`,new URL('.',p.src.url)).href;
 const priorCached=!derivedModel||priorHour<=0||rawCached(modelPriorUrl);
 const priorHot=!derivedModel||priorHour<=0||st.cache.has(modelPriorUrl)||st.displayCache.has(displayKey(p.src,ds,v,priorHour,m));
 const mrmsCheckpoint=st.field==='apcp'&&derivedAnalysis&&st.mrmsAccumCache?.upto===st.hour&&st.mrmsAccumCache?.key===String(p.src.url)+'|'+ds.product+'|'+st.ref.init_time+'|'+accumulationGridKey(ds,v);
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
 // A late MRMS 404 can change the RAP fallback to categorical-only.
 // Re-evaluate shading metadata after the final source is known.
 if(p.analysisCategoricalOnly)m=panelFieldInfo(p,v);
 const maskedData=await belowGroundDisplayValues(p,ds,v,h,data);
 if(seq!==st.seq||!p.map)return;
 const grid=gridForPanel(p,ds,v),shadeData=snowfallShadeData(vorticityShadeData(p,ds,v,h,m,maskedData),st.field,m,v.shape);
 const stride=mobileRasterStride(ds,v,p);
 const plot=stride>1?mobileRegularRasterField(ds,v,shadeData,stride):{grid,values:shadeData};
 const plotMask=plotNoDataMask(plot.values,panelSelectedField(p),!!p.cfg.differencePanel);
 // All non-GPU consumers retain the exact signed difference grid. Only the
 // GPU's linearly sampled texels receive no-data-safe display values.
 const field=new apgl.RawScalarField(plot.grid,plot.values);
 const textureValues=p.cfg.differencePanel?safeDifferenceTextureValues(
  plot.values,plotMask,Number(plot.grid.nx||v.shape[2]),Number(plot.grid.ny||v.shape[1])):plot.values;
 const gpuField=textureValues===plot.values?field:new apgl.RawScalarField(plot.grid,textureValues);
 const nativeField=stride>1?new apgl.RawScalarField(grid,shadeData):field;
 const rawField=shadeData===maskedData?nativeField:new apgl.RawScalarField(grid,maskedData);
 p.readoutField=null;
 if(Number.isFinite(m.maxValidDisplay)&&!m.differenceField&&!p.cfg?.differencePanel&&
    !p.gfsAviationCompare&&!p.gfsNativeCompare&&!p.gfsObservedCompare){
  // Cached native chunk, a second display-unit conversion, *without* the
  // plotted-range mask. Do not alter plotted or difference data in memory.
  const uncapped=await getDisplayData(p.src,ds,v,h,{...m,maxValidDisplay:undefined},()=>{});
  if(seq!==st.seq||!p.map)return;
  p.readoutField=new apgl.RawScalarField(grid,uncapped);
 }
 const signature=JSON.stringify([panelSelectedField(p),st.snowMethod,activeSnowRatio(st.field),v.name,v.shape,ds.grid,stride,p.cfg.timeMode,p.cfg.differencePanel,terrainEnabledForPanel(p),effectiveInterpolation()]);
 p.mobileRenderStride=stride;
 const klass=st.cfg.display.fieldRendering==='smooth'&&!m.category&&!m.ptype&&!m.ptypeReflectivity&&!m.flightCategory?apgl.ContourFill:apgl.Raster;
 p.interpolationEligible=klass===apgl.Raster&&!m.category&&!m.ptype&&!m.ptypeReflectivity&&!m.flightCategory;
 p.renderField=field;
 if(nativeTerrainGPUAvailable(p,ds,m)){
  if(p.layer&&p.map.getLayer(p.layer.id))p.map.removeLayer(p.layer.id);
  p.mobileScalar=null;terrainDetailNotice(p,false);window.EVUThreeSurface?.dispose?.(p);if(p.mobileScalarCanvas)p.mobileScalarCanvas.style.display='none';
  // The final, flat upper-air custom layer must be ABOVE all MapLibre DEM
  // raster stacks. Restore thin political outlines in a separate transparent
  // canvas; no extra WebGL context or full-frame CPU weather redraw.
  p.upperAirGeoOverlay=terrainEnabledForPanel(p);
  if(p.mobileGeoCanvas)p.mobileGeoCanvas.style.display='none';setPanelGeographyOverlay(p,false);
  const layer=window.EVUGPUTerrain.create({id:`evu-field-${p.i}`,values:plot.values,
   nx:plot.grid.nx||v.shape[2],ny:plot.grid.ny||v.shape[1],
   grid:ds.grid,palette:pal(m,v),opacity:st.imageOpacity,
   interpolate:effectiveInterpolation()&&!m.category&&!m.ptype&&!m.ptypeReflectivity&&!m.flightCategory,
   continuous:!m.category&&!m.ptype&&!m.ptypeReflectivity&&!m.flightCategory,
   field:panelSelectedField(p),mask:plotMask,clearBelow:Number(m.clearBelow),
   // Surface palettes drape over elevation; upper-air & their differences
   // render above the DEM with original colors, transparent only at masks.
   terrainDrape:surfaceTerrainField(panelSelectedField(p))});
  p.map.addLayer(layer,p.map.getLayer('coast-casing')?'coast-casing':undefined);
  p.layer=layer;p.component=null;p.lastKey=signature;
  window.EVUAdvancedMap?.orderTerrain(p.map);
  if(p.upperAirGeoOverlay)scheduleMobileScalarRedraw(p,75+p.i*15);
 }else if(useMobileCanvasField(p)){
  p.upperAirGeoOverlay=false;
  if(p.layer&&p.map.getLayer(p.layer.id))p.map.removeLayer(p.layer.id);
  p.layer=null;p.component=null;p.lastKey=signature;
  p.mobileScalar={field,meta:m,palette:pal(m,v),grid:ds.grid,values:plot.values,continuous:!m.category&&!m.ptype&&!m.ptypeReflectivity&&!m.flightCategory,nx:stride>1?Math.floor((v.shape[2]-1)/stride)+1:v.shape[2],ny:stride>1?Math.floor((v.shape[1]-1)/stride)+1:v.shape[1]};
  if(p.mobileScalarCanvas)p.mobileScalarCanvas.style.display='block';
  drawMobileScalar(p);if(p.threeDrawPromise)await p.threeDrawPromise;void drawMobileGeography(p);
 }else if(p.component&&p.lastKey===signature&&typeof p.component.updateField==='function'){
  p.upperAirGeoOverlay=false;p.mobileScalar=null;terrainDetailNotice(p,false);window.EVUThreeSurface?.dispose?.(p);if(p.mobileScalarCanvas)p.mobileScalarCanvas.style.display='none';if(p.mobileGeoCanvas)p.mobileGeoCanvas.style.display='none';setPanelGeographyOverlay(p,false);
  await p.component.updateField(gpuField,plotMask);
 }
 else{p.upperAirGeoOverlay=false;p.mobileScalar=null;terrainDetailNotice(p,false);window.EVUThreeSurface?.dispose?.(p);if(p.mobileScalarCanvas)p.mobileScalarCanvas.style.display='none';if(p.mobileGeoCanvas)p.mobileGeoCanvas.style.display='none';setPanelGeographyOverlay(p,false);if(p.layer&&p.map.getLayer(p.layer.id))p.map.removeLayer(p.layer.id);const cmap=makeColormap(m,v);const comp=new klass(gpuField,{cmap,cmap_mask:plotMask});if(klass===apgl.Raster)installRasterInterpolation(comp,p);const layer=new apgl.PlotLayer(`evu-field-${p.i}`,comp);p.component=comp;p.layer=layer;
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
 // The shading must sit BELOW both casing and inner geography strokes.
 try{p.map.addLayer(layer,p.map.getLayer('coast-casing')?'coast-casing':p.map.getLayer('coast')?'coast':undefined);window.EVUAdvancedMap?.orderTerrain(p.map);}catch(e){rejectReady(e);throw e;}
 const gpuWait=Math.max(5000,Number(st.cfg.display?.gpuInitTimeoutSeconds||35)*1000);
 let deadline;
 try{await Promise.race([layerReady,new Promise((_,reject)=>{deadline=setTimeout(()=>reject(new Error('GPU layer initialization timed out after '+Math.round(gpuWait/1000)+' s: autumnplot-gl geometry worker did not respond.')),gpuWait);})]);}
 finally{clearTimeout(deadline);}
 p.lastKey=signature;}

 p.rawField=rawField;scheduleCityUpdate(p);
 // Sample the SAME display-unit field and palette used by the visible map.
 // The tracer layer samples sparingly rather than reading canvas pixels.

 p.contourField=/^snow(?:1h|3h|6h|24h|48h)$/.test(st.field)||st.field==='asnow'||!!gfsSnowSpec(st.field)?rawField:nativeField;
 p.primaryContourField=panelSelectedField(p)===st.field?p.contourField:null;
 p.diffDisplayData=maskedData;scheduleContourRedraw(p);legend(p,m);updateDifferenceSharedLegend();if(!p.cfg?.differencePanel){
  const windJobs=[];
  if(windComponentNames(p.cfg?.field||st.field)&&(!NEAR_SURFACE_WIND_FIELDS.has(p.cfg?.field||st.field)||overlayWindVisible(p.cfg?.field||st.field)))windJobs.push(prepareWindBarbs(p,ds,h,seq));
  if(marineSurfaceWindAvailable(p.cfg?.field||st.field))windJobs.push(prepareMarineWindBarbs(p,ds,h,seq));
  if(windJobs.length)await Promise.all(windJobs);
 }if(!p.cfg?.differencePanel&&UPPER_AIR_IMAGE_FIELDS[st.field])await preparePrimaryUpperAirContours(p,ds,h,seq);
 if(!p.cfg?.differencePanel&&surfaceMSLPContoursEnabled())await prepareSurfaceMSLPContours(p,ds,h,seq);if(!p.cfg?.differencePanel&&heightVariableName(p.cfg?.field||st.field))await prepareHeightContours(p,ds,h,seq);if(!p.cfg?.differencePanel&&st.field==='t850'&&st.overlayWindSpeed850)await prepareWindSpeed850Contours(p,ds,h,seq);if(!p.cfg?.differencePanel&&isMoistureUpperField(p.cfg?.field||st.field))await prepareUpperAirMoistureContours(p,ds,h,seq);if(!p.cfg?.differencePanel&&st.tracersEnabled)await prepareWindTracers(p,ds,h,seq);if(!p.cfg?.differencePanel&&st.field==='mslp'&&st.overlayMSLP850)await prepareMSLP850Contours(p,ds,h,seq);updatePanelPlotTitle(p);await waitPaint(p.map);if(seq!==st.seq||!p.map||p.contextLost)return;
 // Reconcile all observation layers after asynchronous weather layer replacement.
 syncObservationPanel(p);syncSPCPanel(p);syncLightningPanel(p);syncAmountReportsPanel(p);
 if(lowTracksAvailableForField()&&st.lowTracksEnabled&&!p.cfg?.differencePanel)
  void syncLowTrackOverlay(p,seq);
 if(p.upperAirGeoOverlay)window.EVUAdvancedMap?.orderTerrain(p.map);
 p.status='ready';p.renderedSeq=seq;p.save.disabled=false;clearNote(p);if(st.hover&&!st.hoverRaf)st.hoverRaf=requestAnimationFrame(()=>{st.hoverRaf=0;paintSynchronizedHover();});// The PNG export path explicitly captures a finished render frame. Avoid stale blank snapshots here.
 }catch(e){if(seq===st.seq)fail(p,e);}finally{if(noteDelay!==null)clearTimeout(noteDelay);p.busy=false;updateStatus();if(st.difference.open&&st.difference.selected.includes(p))scheduleDifferenceRefresh();if(!st.rendering&&!st.panels.some(x=>x.busy))schedulePrefetch();retryWaitingVisibleMobilePanel();}}
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
// Round, physically meaningful ticks for every multi-scalar upper-air image.
// Catalogs can advertise different native grids, but display tick values
// must never depend on model availability or the selected forecast hour.
const UPPER_AIR_FIXED_TICK_STEPS={
 h1000:5,h925:5,h850:5,h700:10,h500:10,h300:20,h250:20,
 t1000:10,t925:10,t850:10,t700:10,
 td925:10,td850:10,td700:10,
 q925:2,q850:2,q700:2
};
function legendTicks(m,v){
 if(!m)return [];
 if(m.ptypeReflectivity)return PTYPE_LABELS.slice(1).map((label,i)=>({label,pos:((i*80)+45-10)/(400-10)}));
 if(m.flightCategory)return FLIGHT_CATEGORY_NAMES.map((label,i)=>({label,pos:(i+.5)/5}));
 if(m.ptype)return PTYPE_LABELS.slice(1).map((label,i)=>({label,pos:(i+.5)/5}));
 if(m.ensembleMeanFraction&&!st.colorRanges.get(paletteKey(m,v))&&!st.customPalettes.has(paletteKey(m,v)))return [0,.25,.5,.75,1].map(v=>({label:String(v),pos:v}));
 if(m.category)return [{label:'No',pos:.25},{label:'Yes',pos:.75}];
 const p=pal(m,v),lo=p.levels[0],hi=p.levels.at(-1);
 const count=Math.max(3,Math.min(15,Number(st.cfg?.display?.legendTickCount??11)||11));
 const fmtNum=(x,decimals)=>x.toFixed(decimals).replace(/(\.\d*?[1-9])0+$/,'$1').replace(/\.0+$/,'');
 if(m===FIELDS.mslp&&!st.colorRanges.get(paletteKey(m,v))&&!st.customPalettes.has(paletteKey(m,v)))return Array.from({length:11},(_,i)=>({label:String(950+i*10),pos:i/10}));
 if(!st.colorRanges.get(paletteKey(m,v))&&!st.customPalettes.has(paletteKey(m,v))&&(m===FIELDS.refc||m.label==='Composite reflectivity'||m.label==='PMM composite reflectivity')){
  // The SPC-style shading changes every 2.5 dBZ, but its colorbar labels
  // remain on familiar 5-dBZ values: 10, 15, 20 ... 70+.
  const total=p.colors.length;
  return Array.from({length:13},(_,i)=>({label:`${10+i*5}${i===12?'+':''}`,pos:(i*2)/total}));
 }
 if(!m.differenceField&&UPPER_AIR_SCALAR_KEYS.has(v?.name)&&
    UPPER_AIR_FIXED_TICK_STEPS[v.name]&&
    !st.colorRanges.get(paletteKey(m,v))&&!st.customPalettes.has(paletteKey(m,v))){
  const field=v.name,step=UPPER_AIR_FIXED_TICK_STEPS[field];
  const low=Math.ceil((lo-1e-9)/step)*step,high=Math.floor((hi+1e-9)/step)*step,ticks=[];
  for(let value=low;value<=high+1e-9;value+=step)
   ticks.push({label:String(value),pos:Math.max(0,Math.min(1,(value-lo)/(hi-lo)))});
  if(ticks.length>=2)return ticks;
 }
 if(p.banded){
  // The color bar has equal-width swatches. Labels must therefore follow bin
  // boundaries, NOT the linear interpolation used by continuous palettes.
  const n=p.colors.length,k=Math.min(count,n+1);
  const indices=[...new Set(Array.from({length:k},(_,i)=>Math.round(i*n/(k-1))))];
  const namedTop=m.bandColors===RAIN_COLORS?30:m.bandColors===SNOW_COLORS?72:null;
  return indices.filter(i=>!(namedTop!==null&&i===n)).map(i=>{const value=p.levels[i];const decimals=value<.01?3:value<1?2:value<10?1:0;
   return {label:fmtNum(value,decimals)+(namedTop!==null&&value===namedTop?'+':i===n&&!st.colorRanges.get(st.field)?'+':''),pos:i/n};});
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
 const image=selectedShadingField();
 const wanted=gfsSnowSource(image,st.ref?.entries?.[0]?.ds?.model)||(snowAccumulationHours(image)?'asnow':precipitationAccumulationHours(image)?'apcp':image);
 let v=entries.flatMap(({ds})=>ds.variables||[]).find(v=>v.name===wanted);
 if(!v)for(const src of st.sources.values()){
  v=src.datasets?.flatMap(ds=>ds.variables||[]).find(v=>v.name===wanted);
  if(v)break;
 }
 v=v||{name:selectedShadingField(),attrs:{}};
 const sourceMeta=fieldInfo(v,selectedShadingField());
 // The shared color scale applies to ALL panels. It must not inherit RRFS's
 // dominant-type title and misdescribe HRRR's derived or REFS Mean's ensemble
 // dominant product.
 const m=selectedShadingField()==='ptype'?{...sourceMeta,label:'Precipitation type (model-specific)'}:sourceMeta;
 return {v,m,palette:pal(m,v),ticks:legendTicks(m,v)};
}
function visibleSharedTicks(ticks,width){
 const max=width<550?5:width<850?7:15;
 if(ticks.length<=max)return ticks;
 const ids=[...new Set(Array.from({length:max},(_,i)=>Math.round(i*(ticks.length-1)/(max-1))))];
 return ids.map(i=>ticks[i]);
}
function differenceSharedPalette(){
 // Fixed GFS difference panels are inapplicable to categorical weather types.
 // Hide the signed legend rather than publishing an invented category delta.
 if(DIFFERENCE_BLOCKED_FIELDS.has(selectedShadingField()))return null;
 // WEASD change is comparable; TSNOWP is not available in GFSv16.
 if(gfsSnowSpec(st.field)?.method==='slr10'&&st.snowMethod==='precip')return null;
 if(st.modelSet!=='gfs-versions'||!st.field)return null;
 const panel=st.panels.find(p=>p.cfg?.differencePanel);
 if(!panel)return null;
 // A field change updates the controls before asynchronous panel loads complete.
 // Never use panel.v from the previous field: it leaves the difference title and
 // color map stuck at (for example) 700 hPa when MSLP has been selected.
 const requested=typeof panelSelectedField==='function'?panelSelectedField(panel):st.field;
 // Resolve the source name while the dataset is still in scope.  Flattening
 // variables first loses the owning dataset and caused ReferenceError: ds is
 // not defined during GFS difference-legend initialization in v1.1.54.
 const referenceVariable=st.ref?.entries?.map(({ds})=>
  (ds.variables||[]).find(item=>item.name===(gfsSnowSource(requested,ds.model)||requested))
 ).find(Boolean);
 const v=(panel.v?.name===requested?panel.v:null)||
  referenceVariable||{name:requested,attrs:{}};
 const m=panelFieldInfo(panel,v);
 return {v,m,palette:pal(m,v),ticks:legendTicks(m,v)};
}
function updateDifferenceSharedLegend(){
 const section=el.differenceSharedLegend;
 if(!section)return;
 const data=differenceSharedPalette();
 section.hidden=!data;
 if(!data)return;
 const {m,palette,ticks}=data,c=el.differenceSharedLegendCanvas,ctx=c.getContext('2d');
 if(!ctx)return;
 ctx.clearRect(0,0,c.width,c.height);
 const colors=legendSwatches(m,palette);
 for(let i=0;i<colors.length;i++){
  const [a,b]=legendColorSpan(palette,i,colors.length);
  ctx.fillStyle=colors[i];ctx.fillRect(Math.round(a*c.width),0,Math.ceil((b-a)*c.width)+1,c.height);
 }
 el.differenceSharedLegendTitle.textContent=`${m.label}${m.unit?' ('+m.unit+')':''} · near zero transparent`;
 el.differenceSharedLegendLabels.replaceChildren();
 for(const tick of visibleSharedTicks(ticks,section.clientWidth||innerWidth)){
  const span=document.createElement('span');span.className='shared-legend-tick';span.textContent=tick.label;
  span.style.left=`${Math.max(0,Math.min(100,tick.pos*100))}%`;
  if(tick.pos<.001)span.dataset.end='first';else if(tick.pos>.999)span.dataset.end='last';
  el.differenceSharedLegendLabels.append(span);
 }
}
function isRotationComparison(){return st.modelSet!=='gfs-versions'&&(st.field==='mxuphl'||st.field==='mxuphl_run');}
function rotationSharedPalette(){
 if(!isRotationComparison())return null;
 const v={name:'rottrack_ml60',attrs:{units:'0.001 s-1'}};
 const m=fieldInfo(v,'rottrack_ml60');
 return {v,m,palette:pal(m,v),ticks:legendTicks(m,v)};
}
function updateRotationSharedLegend(){
 const section=el.rotationSharedLegend;if(!section)return;
 const data=rotationSharedPalette();section.hidden=!data;if(!data)return;
 const {m,palette,ticks}=data,c=el.rotationSharedLegendCanvas,ctx=c.getContext('2d');if(!ctx)return;
 ctx.clearRect(0,0,c.width,c.height);
 const colors=legendSwatches(m,palette);
 for(let i=0;i<colors.length;i++){
  const [a,b]=legendColorSpan(palette,i,colors.length);
  ctx.fillStyle=colors[i];ctx.fillRect(Math.round(a*c.width),0,Math.ceil((b-a)*c.width)+1,c.height);
 }
 el.rotationSharedLegendTitle.textContent='MRMS mid-level rotation track (3–6 km AGL, '+(st.field==='mxuphl_run'?'running max':'60-minute max')+') · ×10⁻³ s⁻¹ (not UH)';
 el.rotationSharedLegendLabels.replaceChildren();
 for(const tick of visibleSharedTicks(ticks,section.clientWidth||innerWidth)){
  const span=document.createElement('span');span.className='shared-legend-tick';span.textContent=tick.label;
  span.style.left=`${Math.max(0,Math.min(100,tick.pos*100))}%`;
  if(tick.pos<.001)span.dataset.end='first';else if(tick.pos>.999)span.dataset.end='last';
  el.rotationSharedLegendLabels.append(span);
 }
}
function updateSharedLegend(){
 updateDifferenceSharedLegend();updateRotationSharedLegend();
 if(!el.sharedLegendCanvas||!el.sharedLegendLabels)return;
 const data=sharedPalette();
 const c=el.sharedLegendCanvas,ctx=c.getContext('2d');
 if(!ctx)return;
 ctx.clearRect(0,0,c.width,c.height);
 el.sharedLegendLabels.replaceChildren();
 if(!data){el.sharedLegendTitle.textContent='Field color scale';el.legendResetBtn.hidden=true;el.sharedLegendCanvas.classList.remove('scale-adjustable');return;}
 const {m,palette,ticks}=data;
 const title=`${m.label}${m.unit?' ('+m.unit+')':''}`;
 const custom=adjustableColorbar(m)?st.colorRanges.get(paletteKey(m,data.v)):null;
 if(el.legendRangePopup.open&&el.legendRangePopup.dataset.field!==st.field)closeLegendRangeEditor();
 el.legendResetBtn.hidden=!custom&&!st.customPalettes.has(paletteKey(m,data.v));
 el.sharedLegendCanvas.classList.toggle('scale-adjustable',adjustableColorbar(m));
 el.sharedLegendCanvas.title=adjustableColorbar(m)?'Click for min/max; right-click to import a .pal palette':'Categorical legend: fixed colors';
 el.sharedLegendTitle.textContent=title+(st.customPalettes.has(paletteKey(m,data.v))?' · custom .pal':'')+(custom?' · custom range':'');el.sharedLegendTitle.title=title;
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
function playbackHours(){if(!st.ref)return[];const choices=forecastHourChoices();return st.cfg.loopOnlyAvailableHours?availableHours().filter(h=>choices.includes(h)):choices;}
function nextHour(dir=1){const hours=playbackHours();if(!hours.length)return null;const ix=hours.indexOf(st.hour),idx=(ix<0?(dir>0?-1:0):ix)+dir;return hours[(idx+hours.length)%hours.length];}
async function step(dir){const h=nextHour(dir);if(h===null)return;st.prefetchDirection=dir<0?-1:1;st.hour=h;syncUI();await renderAll();}
// Adaptive, bidirectional prefetch. Keep the speculative queue alive across
// forecast-hour changes; otherwise continuous play cancels nearly every batch.
// Current-hour plot fetches always outrank background work (see pump()).
// Candidates are hour-major, so all nine data sources warm before distant leads.
function prefetchContextKey(){return `${st.ref?.id||''}|${st.field||''}|${st.snowMethod||'weasd'}|${st.panels.filter(p=>!p.cfg.placeholder).map(p=>p.cfg.source).join(',')}`;}
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
  if(v.derivedNativePtype){
   for(const name of NATIVE_PTYPE_FLAGS){
    const flag=ds.variables?.find(item=>item.name===name);
    if(flag)enqueue(src,ds,flag,h);
   }
   return;
  }
  if(v.derivedWindSpeed850){
   for(const name of ['u850','v850']){
    const component=ds.variables?.find(item=>item.name===name);
    if(component)enqueue(src,ds,component,h);
   }
   return;
  }
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
  // Prioritize the analysis composite for the first few mobile fetch slots.
  // Otherwise 8 model-panel chunks can fill a four-item mobile prefetch
  // batch before the essential MRMS radar input even reaches the queue.
  const panels=st.field==='refc_ptype'
   ?st.panels.slice().sort((a,b)=>Number(!['analysis','gfs-analysis'].includes(a.cfg.timeMode))-
                                Number(!['analysis','gfs-analysis'].includes(b.cfg.timeMode)))
   :st.panels;
  // Pass 1: each panel's primary input, with critical analysis radar first.
  for(const p of panels){
   if(p.cfg.placeholder)continue;
   // Use a throwaway selection context: choose() is intentionally stateful,
   // and calling it on the live panel used to clear/replace analysisRadar
   // during asynchronous rendering of the currently selected hour.
   const proxy={cfg:p.cfg,src:null};
   const choice=choose(proxy,requested),{ds,v,h}=choice,src=proxy.src;
   if(choice.error||!ds||!v)continue;
   chosen.push({p:proxy,ds,v,h,src});
   if(proxy.analysisRadar)enqueue(proxy.analysisRadar.src||src,proxy.analysisRadar.ds,proxy.analysisRadar.v,0);
   enqueue(src,ds,v,h);
  }
  // Pass 2: dependent inputs (one-hour difference, wind barbs and recent
  // MRMS sums), so future frames are actually fully renderable.
  for(const {p,ds,v,h,src} of chosen){
   // The blended analysis requires BOTH native model Ptype and MRMS radar;
   // staging just the selected model variable left every later frame cold.
   if(p.analysisRadar)enqueue(p.analysisRadar.src||src,p.analysisRadar.ds,p.analysisRadar.v,0);
   if(p.analysisNativeRadar)enqueue(src,ds,p.analysisNativeRadar.ptype,0);
   const precipitation=precipitationAccumulationHours(st.field);
   if(precipitation&&p.cfg.timeMode!=='analysis'&&h>precipitation)enqueue(src,ds,v,h-precipitation);
   const snowfall=snowAccumulationHours(st.field);
   if(snowfall&&p.cfg.timeMode!=='analysis'&&h>snowfall)enqueue(src,ds,v,h-snowfall);
   const gfsSnow=gfsSnowSpec(st.field);
   if(gfsSnow&&p.cfg.timeMode!=='analysis'&&p.cfg.timeMode!=='gfs-analysis'&&(gfsSnow.method==='depthChange'||gfsUsesSweChange(st.field,ds.model)||(gfsSnow.period&&h>gfsSnow.period)))
    enqueue(src,ds,v,gfsSnow.period?h-gfsSnow.period:0);
   const heightKey=heightVariableName(st.field);
   if(heightKey){const hv=ds.variables.find(x=>x.name===heightKey);if(hv)enqueue(src,ds,hv,h);}
   if(st.field==='refc_ptype'){
    const pv=ds.variables.find(x=>x.name==='ptype');
    if(pv)enqueue(src,ds,pv,h);
    // Older RAP catalogs derive the category dynamically from four flags.
    if(v.derivedNativePtype)enqueue(src,ds,v,h);
   }
   const secondaryWindNames=[...(NEAR_SURFACE_WIND_FIELDS.has(st.field)&&!overlayWindVisible(st.field)?[]:(windComponentNames(st.field)||[])),
    ...(marineSurfaceWindAvailable(st.field)?['u10','v10']:[])];
   for(const name of new Set(secondaryWindNames)){
    const w=ds.variables.find(x=>x.name===name);if(w)enqueue(src,ds,w,h);
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
   if((st.field==='apcp'||precipitationAccumulationHours(st.field))&&p.cfg.timeMode==='analysis'&&
      /^(?:mrms_apcp|stageiv_)/.test(ds.product)){
    const plan=precipitationSourcePlan(src,st.ref,requested,precipitationAccumulationHours(st.field)||requested);
    for(const item of (plan?.records||[]).slice(-3))enqueue(src,item.ds,item.v,0);
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
  const limit=Math.max(1,Math.min(touchGraphicsDevice()?4:64,Number(d.prefetchBatchSize??12)));
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
 },Math.max(touchGraphicsDevice()?650:50,Math.min(2500,Number(d.prefetchDelayMs??120))));
}
// Diagnostic readout without displaying cache chatter across nine maps.
window.OMDEVUPrefetch={stats:()=>({mode:prefetchMode(),downloadsCompleted:st.prefetchCompleted,downloadsFailed:st.prefetchFailed,failedCoolingDown:st.prefetchAttempted.size,bySource:Object.fromEntries(st.prefetchBySource),direction:st.prefetchDirection<0?'backward':'forward',queued:st.queue.filter(x=>x.background).length,active:st.prefetchActive,decodedMB:Math.round(st.cacheBytes/1048576),displayReadyMB:Math.round(st.displayCacheBytes/1048576),compressedDiskMB:Math.round((st.chunkStore?.bytes||0)/1048576),diskEnabled:Boolean(st.chunkStore?.cache&&!st.chunkStore?.disabled),cacheUsage:{network:st.cacheStats.network,persistentReads:st.cacheStats.disk,decodedHits:st.cacheStats.decoded,displayReadyHits:st.cacheStats.displayReady,sharedRequests:st.cacheStats.shared,decodedEvictions:st.cacheStats.decodedEvicted,displayReadyEvictions:st.cacheStats.displayEvicted},recentlyDisplayedProtected:st.chunkStore?.foregroundRecentlyUsed.size||0,cacheQuotaRetries:st.chunkStore?.quotaFailures||0,compressedCacheBudgetMB:Math.round((st.chunkStore?.budget||0)/1048576)}),resume:()=>schedulePrefetch()};
async function play(){if(st.playing)return;st.playing=true;el.playBtn.classList.add('active');el.pauseBtn.classList.remove('active');syncMobileFrameController();
 while(st.playing){const start=Date.now();try{await step(1);}catch(err){console.error('Playback stopped',err);stop();break;}
  if(!st.playing)break;
  await sleep(Math.max(50,LOOP_INTERVALS[st.loopSpeedIndex]-(Date.now()-start)));
 }
}
function stop(){st.playing=false;el.pauseBtn.classList.add('active');el.playBtn.classList.remove('active');syncMobileFrameController();}
function rounded(ctx,x,y,w,h,r=11){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function clipText(ctx,s,width){s=String(s||'');while(ctx.measureText(s).width>width&&s.length>2)s=s.slice(0,-2)+'…';return s;}
// Download names include their valid-run context AND a unique export stamp.
// Browser auto-renaming as (1), (2), ... obscured distinct exports, particularly
// difference PNGs. Keep a per-page session token and counter for same-ms clicks.
const EXPORT_SESSION_TOKEN=Math.random().toString(36).slice(2,8).padEnd(6,'0');
let exportSequence=0;
function uniqueExportName(name){
 const stamp=new Date().toISOString().replace(/[-:.]/g,'');
 const suffix=`_${stamp}_${EXPORT_SESSION_TOKEN}_${(++exportSequence).toString(36)}`;
 const match=/^(.*?)(\.[A-Za-z0-9]+)$/.exec(String(name));
 return match?`${match[1]}${suffix}${match[2]}`:`${name}${suffix}`;
}
window.OMDEVUUniqueExportName=uniqueExportName;
function canvasPNG(c,name){return new Promise((resolve,reject)=>{
 c.toBlob(blob=>{if(!blob){reject(new Error('Canvas export failed; not enough memory?'));return;}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=uniqueExportName(name);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);resolve();
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
 if(d.showCoastlines!==false){jobs.push(installGeo(p,'coast'));if(targetZoom>=outlineDetailThreshold())jobs.push(installGeo(p,'coast_detail'));}
 if(d.showStateBoundaries!==false)jobs.push(installGeo(p,'states'));
 if(d.showCountryBoundaries!==false){jobs.push(installGeo(p,'country'));if(targetZoom>=outlineDetailThreshold())jobs.push(installGeo(p,'country_detail'));}
 if(d.showLandFill!==false){jobs.push(installGeo(p,'land'));if(targetZoom>=detailThreshold()){jobs.push(installGeo(p,'land_detail'));jobs.push(installGeo(p,'lakes_detail'));}}
 if(st.countiesEnabled)jobs.push(installGeo(p,'counties'));
 if(jobs.length)await Promise.all(jobs);
 updateGeographyVisibility(p);
 await waitPaint(map);
 await waitPaint(map);
}
// Contour widths in a comparison export must be expressed in pixels of each
// FINAL panel cell, not in pixels of the smaller browser viewport. The map,
// geography and contour canvas are captured together, then scaled once more
// into the 6- or 9-panel PNG/GIF. Undo that compositor scale here. The same
// calculation applies to MSLP, heights, temperatures, moisture and wind-speed
// contours; standalone exports intentionally use their original styling.
function exportScaleToCell(viewW,viewH,targetW,targetH,framing='fill'){
 const cw=Math.max(1,Number(viewW)||1),ch=Math.max(1,Number(viewH)||1);
 const tw=Math.max(1,Number(targetW)||1),th=Math.max(1,Number(targetH)||1);
 return framing==='fit'?Math.min(tw/cw,th/ch):Math.max(tw/cw,th/ch);
}
function multiPanelContourScale(viewW,viewH,targetW,targetH,framing='fill'){
 const tw=Math.max(1,Number(targetW)||1);
 const toOutput=exportScaleToCell(viewW,viewH,targetW,targetH,framing);
 // In a six-/nine-panel export match the LIVE contour ink: one clean,
 // continuous stroke, not the two-tone print casing of standalone PNGs.
 // A modest boost in final cell pixels compensates for displaying the full
 // export PNG smaller on screen; do not use source viewport dimensions to
 // choose widths, or Fit/Fill and GIF will diverge.
 const targetFraction=Math.max(1.05,Math.min(1.30,.98+tw/3500));
 return Math.max(.12,Math.min(3,targetFraction/toOutput));
}
// Keep contour labels as readable as the dark central strokes after a
// presentation-sized comparison image is reduced to a typical screen width.
// The old sqrt(strokeScale) calculation could shrink labels twice: once in
// CSS canvas units and once when that canvas was composited into its cell.
function multiPanelContourLabelStyle(viewW,viewH,targetW,targetH,framing='fill'){
 const tw=Math.max(1,Number(targetW)||1);
 const toOutput=exportScaleToCell(viewW,viewH,targetW,targetH,framing);
 const targetFont=Math.max(13,Math.min(18,11+tw/130));
 return {fontCssPx:targetFont/toOutput,
  haloCssPx:Math.max(3.4,targetFont*.28)/toOutput};
}
function multiPanelWindStyle(viewW,viewH,targetW,targetH,framing='fill'){
 const tw=Math.max(1,Number(targetW)||1);
 const toOutput=exportScaleToCell(viewW,viewH,targetW,targetH,framing);
 // Wind barbs must remain legible at comparison sizes, without modifying
 // sampling density, placement, speed, or the individual-panel export.
 const targetSize=Math.max(16,Math.min(23,tw/39));
 return {sizePx:targetSize/toOutput};
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
 const gain=1.12*(Number.isFinite(configured)?Math.max(.5,Math.min(2.5,configured)):1);
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
 const obs=observationVisible(),spc=spcVisible(),lightning=lightningVisible();
 if((!obs&&!spc&&!lightning)||!map)return ()=>{};
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
  for(const [layer,kind,property,enabled] of [
   ['evu-observed-metar','paint','circle-radius',obs],
   ['evu-observed-metar','paint','circle-stroke-width',obs],
   ['evu-observed-mping','layout','icon-size',obs],
   ['evu-spc-lsr','paint','circle-radius',spc],
   ['evu-spc-lsr','paint','circle-stroke-width',spc],
   ['evu-lightning','layout','icon-size',lightning]
  ]){
   if(!enabled||!map.getLayer?.(layer))continue;
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
// Individual exports paint the report symbols (METAR, mPING, SPC LSR and GLM) in
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
   if(!['synoptic','mping'].includes(source))continue;
   const key=aviationObservationField(),value=key?Number(feature.properties[key]):null;
   if(!key&&(!Number.isInteger(ptype)||ptype<1||ptype>5))continue;
   const color=key?aviationObservationColor(value,st.field):PTYPE[ptype];
   if(!color)continue;
   projectReport(feature,source,{ptype,color});
  }
 }
 if(spcVisible()&&st.spcCurrent?.length){
  for(const feature of st.spcCurrent){
   const type=feature?.properties?.type;
   if(!Object.hasOwn(SPC_COLORS,type))continue;
   projectReport(feature,'spc',{type});
  }
 }
 if(lightningVisible()&&st.lightningCurrent?.features?.length){
  for(const f of st.lightningCurrent.features)projectReport(f,'lightning',{age_minutes:Number(f.properties?.age_minutes)});
 }
 return points.length?{points,light:st.theme==='light'}:null;
}
// Exports now use the same cleaner two-tone geography treatment as the
// live viewer. Keep the helper as a no-op so the export flow and tests can
// preserve their restore semantics without mutating live map paint.
function applyExportBoundaryStyle(_map){
 return ()=>{};
}
// The captured APGL raster is composited over MapLibre line layers. To make
// geographic borders readable over BOTH bright and dark forecast colors,
// redraw the same clean two-tone stroke used by the live viewer above the weather raster in final export pixels.
// Reuse the exact visible geography at capture time; temporary export zooms
// must not add counties or detailed features that were absent on screen.
// Freeze visibility BEFORE temporarily enlarging an export camera. MapLibre's
// layer.minzoom can lag a dynamic threshold after resize, so evaluate counties
// against the same effective threshold used by the on-screen viewer.
function exportGeographyVisibility(p,map){
 const visible={};
 for(const [key,id] of [['coast','coast'],['coast_detail','coast-detail'],
   ['country','country'],['country_detail','country-detail'],['states','states'],['counties','counties']]){
  const layer=map.getLayer?.(id);
  visible[key]=Boolean(layer&&p.geoApplied?.has(key)&&
   map.getLayoutProperty?.(id,'visibility')!=='none'&&
   map.getZoom()>=(layer.minzoom||0)&&
   (key!=='counties'||st.countiesEnabled));
 }
 return visible;
}
async function captureExportGeography(p,map,width,height,frozenVisibility=null,comparisonCell=null){
 if(!(width>0&&height>0))return null;
 const visible=frozenVisibility||exportGeographyVisibility(p,map);
 if(!Object.values(visible).some(Boolean))return null;
 // A forecast-hour GIF generally reuses the same map camera. Cache only the
 // relatively small overlay raster, keyed to the exact projection/size and
 // visible geography. Large standalone captures are kept uncached to limit
 // browser memory; no cached geometry can alter screen-map paint properties.
 const center=map.getCenter(),cameraKey=JSON.stringify([
  width,height,center.lng,center.lat,map.getZoom(),map.getBearing(),map.getPitch(),
  st.mode,st.theme,st.field,st.mapOutlines,st.countiesEnabled,
  overlayStyle('mapOutlines'),overlayStyle('counties'),mapBackgroundPaint(),visible,comparisonCell
 ]);
 if(p.exportGeographyCache?.key===cameraKey)return p.exportGeographyCache.canvas;
 const image=document.createElement('canvas');image.width=width;image.height=height;
 await redrawDifferenceBoundaries(image,map,{exportGeoVisible:visible,exportStyle:false,difference:!!p.cfg?.differencePanel,comparisonCell});
 p.exportGeographyCache=width*height<=1800000?{key:cameraKey,canvas:image}:null;
 return image;
}
async function captureMapPNG(p,targetW=0,targetH=0,framing='fill',sharpIndividual=false){
 const map=p.map,canvas=map.getCanvas(),node=map.getContainer();
 const oldStyle=node.getAttribute('style')||'';
 const oldCenter=map.getCenter(),oldZoom=map.getZoom(),oldBearing=map.getBearing(),oldPitch=map.getPitch();
 await ensureExportGeography(p,oldZoom);
 const frozenGeography=exportGeographyVisibility(p,map);
 // MapLibre and the exported canvas must BOTH honor the on-screen county
 // visibility, including the casing layer, even after temporary zoom changes.
 const hiddenCountyLayers=[];
 if(!frozenGeography.counties){
  for(const id of ['counties-casing','counties'])if(map.getLayer?.(id))
   hiddenCountyLayers.push([id,map.getLayoutProperty?.(id,'visibility')||'visible']);
 }
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
 let changedRatio=false,windStyle=null,contourStyle=null,lowTrackStyle=null,reportStyle=null,surfaceWeatherStyle=null;
 let restoreObservationMarkers=()=>{};
 let restoreExportBoundaries=()=>{};
 let png=null,windPNG=null,contourPNG=null,cityPNG=null,lowTrackPNG=null,amountReportPNG=null,surfaceWeatherPNG=null,mobilePNG=null,exportObservations=null,exportGeography=null;
 try{
  for(const [id] of hiddenCountyLayers)map.setLayoutProperty(id,'visibility','none');
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
   if(p.amountReportCanvas&&sharpIndividual){
    reportStyle=p.amountReportCanvas.getAttribute('style')||'';
    p.amountReportCanvas.style.inset='auto';p.amountReportCanvas.style.position='absolute';
    p.amountReportCanvas.style.left=node.style.left;p.amountReportCanvas.style.top=node.style.top;
    p.amountReportCanvas.style.width=newW+'px';p.amountReportCanvas.style.height=newH+'px';
   }
   if(p.surfaceWeatherCanvas){
    surfaceWeatherStyle=p.surfaceWeatherCanvas.getAttribute('style')||'';
    p.surfaceWeatherCanvas.style.inset='auto';p.surfaceWeatherCanvas.style.position='absolute';
    p.surfaceWeatherCanvas.style.left=node.style.left;p.surfaceWeatherCanvas.style.top=node.style.top;
    p.surfaceWeatherCanvas.style.width=newW+'px';p.surfaceWeatherCanvas.style.height=newH+'px';
   }
   if(p.lowTrackCanvas&&sharpIndividual){
    lowTrackStyle=p.lowTrackCanvas.getAttribute('style')||'';
    p.lowTrackCanvas.style.inset='auto';p.lowTrackCanvas.style.position='absolute';
    p.lowTrackCanvas.style.left=node.style.left;p.lowTrackCanvas.style.top=node.style.top;
    p.lowTrackCanvas.style.width=newW+'px';p.lowTrackCanvas.style.height=newH+'px';
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
  // Preserve the live boundary styling; exports now reuse the same
  // cleaner two-tone treatment rather than a heavier export-specific variant.
  restoreExportBoundaries=applyExportBoundaryStyle(map);
  // Let the high-resolution vector and autumnplot custom layers settle before
  // encoding. Existing all-panels map geometry remains deliberately unchanged.
  png=await captureMapFrame(map,sharpIndividual?3:1);
  if(p.mobileScalar&&p.mobileScalarCanvas){
   drawMobileScalar(p);
   // Three.js may initialize asynchronously on the first terrain render.
   // Capture its exact completed frame rather than stale/blank image data.
   if(p.threeDrawPromise)await p.threeDrawPromise;
   mobilePNG=p.mobileScalarCanvas.toDataURL('image/png');
  }
  // Capture projected outlines BEFORE restoring the temporary high-resolution
  // map camera. They are finally composited ABOVE the meteorological shading.
  // Geography is optional: a vector-data fetch failure must not abort PNG/GIF.
  try{exportGeography=await captureExportGeography(p,map,canvas.width,canvas.height,frozenGeography,
   sharpIndividual?null:{width:targetW||screenW,height:targetH||screenH,framing});}
  catch(err){console.warn('Optional export geography overlay unavailable:',err);}
  if(sharpIndividual)exportObservations=snapshotIndividualExportObservations(map,cssW,cssH);
  // Render one common contour stack for live, individual and comparison
  // exports. A comparison cell will scale this captured image again, so
  // counter-scale its strokes in source CSS space. Standalone exports retain
  // their established stronger casing and lighter outlines unchanged.
  const contourExportScale=sharpIndividual?
   Math.max(1.12,Math.min(2.65,
    Math.sqrt(Math.max(1,(targetW||screenW)/Math.max(1,screenW)))*1.16)):
   multiPanelContourScale(cssW,cssH,targetW||screenW,targetH||screenH,framing);
  const comparisonLabels=sharpIndividual?null:
   multiPanelContourLabelStyle(cssW,cssH,targetW||screenW,targetH||screenH,framing);
  if(p.contourCanvas&&drawContourStack(p,contourExportScale,!sharpIndividual,comparisonLabels))
   contourPNG=p.contourCanvas.toDataURL('image/png');
  if((st.citiesEnabled||st.roadsEnabled)&&p.cityCanvas){
   await updateCityLayer(p);
   cityPNG=p.cityCanvas.toDataURL('image/png');
  }
  if(p.amountReportCanvas&&amountReportsEnabled()&&drawAmountReportCanvas(p,{capture:true}))
   amountReportPNG=p.amountReportCanvas.toDataURL('image/png');
  if(p.surfaceWeather&&p.surfaceWeatherCanvas&&st.surfaceWeatherEnabled&&surfaceWeatherEligible()){
   // Temporarily enlarged camera must be projected before capture; keep
   // original overlay visible in all-panel PNGs and GIF frames as well.
   await Promise.race([p.surfaceWeatherPending||Promise.resolve(),
     new Promise(resolve=>setTimeout(resolve,1800))]);
   p.surfaceWeather.render();
   if(p.surfaceWeather._features.length)surfaceWeatherPNG=p.surfaceWeatherCanvas.toDataURL('image/png');
  }
  if(lowTracksAvailableForField()&&st.lowTracksEnabled&&!p.cfg?.differencePanel&&p.lowTrackCanvas){
   await Promise.race([p.lowTrackPending||Promise.resolve(),
    new Promise(resolve=>setTimeout(resolve,1800))]);
   window.EVULowTracks?.paintCanvas?.(p);
   if(p.lowTrackFeatures?.length)lowTrackPNG=p.lowTrackCanvas.toDataURL('image/png');
  }
  if(!p.cfg?.differencePanel&&p.windCanvas&&((p.wind&&windComponentNames(plottedField)&&overlayWindVisible(plottedField))||(p.marineWind&&marineSurfaceWindVisible(plottedField)))){
   // Match the appearance of an enlarged viewer panel; do not use the
   // export-only MapLibre zoom to choose density or unscaled glyph sizes.
   const exportBarbs=sharpIndividual
    ? individualExportWindStyle(cssW,cssH,targetW,targetH,framing)
    : multiPanelWindStyle(cssW,cssH,targetW||screenW,targetH||screenH,framing);
   drawWindBarbs(p,exportBarbs);
   windPNG=p.windCanvas.toDataURL('image/png');
  }
 }finally{
  restoreExportBoundaries();
  restoreObservationMarkers();
  if(changedRatio){try{map.setPixelRatio(oldRatio);}catch(err){console.warn('Could not restore pixel ratio',err);}}
  if(windStyle!==null)p.windCanvas.setAttribute('style',windStyle);
  if(contourStyle!==null)p.contourCanvas.setAttribute('style',contourStyle);
  if(lowTrackStyle!==null)p.lowTrackCanvas.setAttribute('style',lowTrackStyle);
  if(reportStyle!==null)p.amountReportCanvas.setAttribute('style',reportStyle);
  if(surfaceWeatherStyle!==null)p.surfaceWeatherCanvas.setAttribute('style',surfaceWeatherStyle);
  if(expanded){
   node.setAttribute('style',oldStyle);
   try{map.resize();map.jumpTo({center:oldCenter,zoom:oldZoom,bearing:oldBearing,pitch:oldPitch});map.triggerRepaint();}
   catch(err){console.warn('Could not restore export viewport',err);}
  }
  // Restore exactly what was visible before the export, even if capture fails.
  for(const [id,visibility] of hiddenCountyLayers){
   try{map.setLayoutProperty(id,'visibility',visibility);map.triggerRepaint();}
   catch(err){console.warn('Could not restore county visibility after export',id,err);}
  }
  st.exportRender=false;
  if(p.windCanvas)scheduleWindRedraw(p);
  if(p.contourCanvas)scheduleContourRedraw(p);
  if(p.lowTrackCanvas)window.EVULowTracks?.requestPaint?.(p);
  p.surfaceWeather?._schedule?.();
  if(p.cityCanvas)scheduleCityUpdate(p);
  if(p.amountReportCanvas)syncAmountReportsPanel(p);
  if(p.mobileScalarCanvas)scheduleMobileScalarRedraw(p,30);
  if(st.hover&&!st.hoverRaf)st.hoverRaf=requestAnimationFrame(()=>{st.hoverRaf=0;paintSynchronizedHover();});
 }
 return {map:await decodePNG(png),mobileField:await decodePNG(mobilePNG),geography:exportGeography,wind:await decodePNG(windPNG),contours:await decodePNG(contourPNG),cities:await decodePNG(cityPNG),surfaceWeather:await decodePNG(surfaceWeatherPNG),lowTracks:await decodePNG(lowTrackPNG),amountReports:await decodePNG(amountReportPNG),observations:exportObservations,png};
}
async function panelImage(p,targetW=0,targetH=0,framing='fill',sharpIndividual=false){
 if(p.map){const output=await captureMapPNG(p,targetW,targetH,framing,sharpIndividual);p.lastSnapshot=output.png;return output;}
 return {map:await decodePNG(p.lastSnapshot||null),mobileField:null,geography:null,wind:null,contours:null,cities:null,surfaceWeather:null,lowTracks:null,amountReports:null};
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
 const scaleX=(windImage.naturalWidth||windImage.width)/iw,scaleY=(windImage.naturalHeight||windImage.height)/ih;
 ctx.drawImage(windImage,mapRect.sx*scaleX,mapRect.sy*scaleY,
   mapRect.sw*scaleX,mapRect.sh*scaleY,mapRect.dx,mapRect.dy,mapRect.dw,mapRect.dh);
}
// Paint reports on top of the high-resolution individual-panel map (including
// SPC LSRs and GLM lightning) in final PNG/GIF pixels. This guarantees readable sizes whether the browser panel
// began at 300px or 1800px wide and whether Fit or Fill was selected.
function drawIndividualExportObservations(ctx,observations,mapRect,mapImage,plotWidth){
 if(!observations?.points?.length||!(plotWidth>0))return;
 const iw=mapImage.naturalWidth||mapImage.width;
 const ih=mapImage.naturalHeight||mapImage.height;
 if(!(iw>0&&ih>0))return;
 const configured=Number(st.cfg?.display?.exportObservationMarkerScale??1);
 const gain=1.12*(Number.isFinite(configured)?Math.max(.5,Math.min(2.5,configured)):1);
 // At 1920px, METAR/SPC circles have ~12px radius and mPING triangles
 // are ~29px wide. At GIF resolutions, scale proportionally.
 const radius=Math.max(7,Math.min(20,plotWidth/158))*gain;
 const outline=Math.max(1.5,radius*.22);
 const stroke=observations.light?'#152633':'#ffffff';
 ctx.save();
 ctx.beginPath();ctx.rect(mapRect.dx,mapRect.dy,mapRect.dw,mapRect.dh);ctx.clip();
 // Preserve METAR and SPC LSR circles, mPING triangles, and age-colored
 // GLM diamonds in the same age colors as the live map; never circles.
 for(const source of ['synoptic','mping','spc','lightning']){
  for(const report of observations.points){
   if(report.source!==source)continue;
   const col=source==='spc'?SPC_COLORS[report.type]:source==='lightning'?lightningColor(report.age_minutes):report.color||PTYPE[report.ptype];
   if(!col)continue;
   const px=report.x*iw,py=report.y*ih;
   const x=mapRect.dx+(px-mapRect.sx)*mapRect.dw/mapRect.sw;
   const y=mapRect.dy+(py-mapRect.sy)*mapRect.dh/mapRect.sh;
   if(!Number.isFinite(x)||!Number.isFinite(y)||
      x<mapRect.dx-radius*3||x>mapRect.dx+mapRect.dw+radius*3||
      y<mapRect.dy-radius*3||y>mapRect.dy+mapRect.dh+radius*3)continue;
   if(source==='lightning'){
    drawLightningDiamond(ctx,x,y,radius*1.2,col,stroke);
    continue;
   }
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
// Keep the PNG plot aperture and header typography identical for
// standalone panel and difference-map exports. Different apertures were
// causing a small geographic crop mismatch at the same output dimensions.
function exportLabelsHidden(){return !!st.exportNoLabels;}
function standaloneExportLayout(w,h,largeLabels,noLabels=exportLabelsHidden()){
 const headerTop=noLabels?14:(largeLabels?100:60);
 const legendBottom=largeLabels?104:77;
 return {headerTop,mapX:14,mapY:headerTop,mapW:w-28,mapH:h-headerTop-legendBottom,
  titleFont:Math.round(Math.max(15,Math.min(25,w/40))*(largeLabels?1.7:1)),
  subtitleFont:Math.round(Math.max(11,Math.min(15,w/70))*(largeLabels?1.7:1)),
  titleY:largeLabels?30:19,subtitleY:largeLabels?73:43};
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
   drawWindExport(ctx,captured.mobileField,rect,im);
   drawWindExport(ctx,captured.geography,rect,im);
   drawWindExport(ctx,captured.wind,rect,im);
   drawWindExport(ctx,captured.contours,rect,im);
   drawWindExport(ctx,captured.cities,rect,im);
   drawWindExport(ctx,captured.surfaceWeather,rect,im);
   drawWindExport(ctx,captured.lowTracks,rect,im);
  drawWindExport(ctx,captured.amountReports,rect,im);
  }else{
   ctx.fillStyle=muted;ctx.font=`${Math.max(16,Math.min(25,w/35))}px Arial`;
   ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillText(clipText(ctx,p.note?.textContent||'Data unavailable',w-30),x+w/2,y+h/2);
  }
  // WebGL captures do not include HTML overlays. Retain the model and valid
  // time annotation IN the plotting area for exported comparison images.
  if(!exportLabelsHidden()){
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
  }
  return;
 }

 const light=st.theme==='light',fg=light?'#1d2e42':'#eef4fa',muted=light?'#54687e':'#aebfd1';
 ctx.fillStyle=light?'#fff':'#101d2e';rounded(ctx,x,y,w,h,12);
 ctx.fillStyle=fg;const largeLabels=!!st.exportLargeLabels;
 const noLabels=exportLabelsHidden();
 const layout=standaloneExportLayout(w,h,largeLabels,noLabels),headerTop=layout.headerTop;
 ctx.textBaseline='middle';ctx.textAlign='left';
 if(!noLabels){
  ctx.font=`bold ${layout.titleFont}px Arial`;
  ctx.fillText(clipText(ctx,p.title.textContent,w-36),x+18,y+layout.titleY);
  ctx.font=`${layout.subtitleFont}px Arial`;ctx.fillStyle=muted;
  ctx.fillText(clipText(ctx,p.sub.textContent,w-36),x+18,y+layout.subtitleY);
  ctx.fillStyle=fg;
 }
 // In large comparison grids, a narrow vertical bar gives the map noticeably
 // more height. Individual/short-grid exports retain a horizontal colorbar.
 const side=verticalLegend?Math.max(largeLabels?108:75,Math.min(largeLabels?142:102,Math.round(w*(largeLabels?.14:.09)))):0;
 const boxX=x+layout.mapX,boxY=y+layout.mapY,boxW=layout.mapW-side,boxH=verticalLegend?h-(headerTop+14):layout.mapH;
 ctx.fillStyle=light?'#d6e6ee':'#0b2238';ctx.fillRect(boxX,boxY,boxW,boxH);
 const captured=await panelImage(p,boxW,boxH,st.lastExportFraming,true);
 if(captured.map&&p.status==='ready'){
  const im=captured.map;
  const rect=drawMapFramed(ctx,im,boxX,boxY,boxW,boxH,st.lastExportFraming);
  drawWindExport(ctx,captured.mobileField,rect,im);
   drawWindExport(ctx,captured.geography,rect,im);
  drawWindExport(ctx,captured.wind,rect,im);
  drawWindExport(ctx,captured.contours,rect,im);
  drawWindExport(ctx,captured.cities,rect,im);
  drawWindExport(ctx,captured.surfaceWeather,rect,im);
  drawWindExport(ctx,captured.lowTracks,rect,im);
  drawWindExport(ctx,captured.amountReports,rect,im);
  drawIndividualExportObservations(ctx,captured.observations,rect,im,boxW);
 }else{
  ctx.fillStyle=muted;ctx.font='15px Arial';ctx.textBaseline='middle';
  ctx.fillText(clipText(ctx,p.note?.textContent||'Data unavailable',boxW-32),boxX+16,boxY+boxH/2);
 }
 if(p.status!=='ready')return;
 if(verticalLegend){
  const lx=boxX+boxW+13,ly=boxY+29,lw=14,lh=Math.max(20,boxH-41);
  const m=panelFieldInfo(p,p.v),palette=pal(m,p.v),colors=legendSwatches(m,palette),n=colors.length;
  ctx.fillStyle=fg;ctx.font=`bold ${largeLabels?23:15}px Arial`;ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.fillText(clipText(ctx,m.unit||m.label,side-13),lx,boxY+11);
  for(let i=0;i<n;i++){const [a,b]=legendColorSpan(palette,i,n),top=Math.round(ly+lh*(1-b)),bottom=Math.round(ly+lh*(1-a));ctx.fillStyle=colors[i];ctx.fillRect(lx,top,lw,bottom-top);}
  ctx.strokeStyle=muted;ctx.lineWidth=1;ctx.strokeRect(lx,ly,lw,lh);
  const ticks=p.legendTicks||legendTicks(m,p.v);
  const positions=ticks.length<=5?ticks:[...new Set(Array.from({length:5},(_,i)=>Math.round(i*(ticks.length-1)/4)))].map(i=>ticks[i]);
  ctx.font=`${largeLabels?29:14}px Arial`;ctx.textAlign='left';ctx.fillStyle=muted;
  for(const tick of positions){
   const ty=ly+lh*(1-tick.pos);
   ctx.fillRect(lx+lw,ty-.5,4,1);
   ctx.textBaseline=tick.pos>=.999?'top':tick.pos<=.001?'bottom':'middle';
   ctx.fillText(tick.label,lx+lw+6,ty);
  }
  ctx.textBaseline='middle';
 }else{
  const m=panelFieldInfo(p,p.v),palette=pal(m,p.v),colors=legendSwatches(m,palette),n=colors.length;
  const fullLegend=`${m.label}${m.unit?' ('+m.unit+')':''}`;
  ctx.fillStyle=fg;ctx.font=`bold ${Math.max(largeLabels?26:15,Math.min(largeLabels?32:20,w/(largeLabels?38:46)))}px Arial`;
  ctx.fillText(clipText(ctx,fullLegend,w-30),x+18,y+h-(largeLabels?81:61));
  // Build the export legend from palette data, never stretch the small vertical
  // browser legend canvas into a horizontal gradient.
  const bx=x+18,by=y+h-(largeLabels?57:42),bw=w-36,bh=largeLabels?17:13;
  for(let i=0;i<n;i++){const [a,b]=legendColorSpan(palette,i,n),left=Math.round(bx+a*bw),right=Math.round(bx+b*bw);ctx.fillStyle=colors[i];ctx.fillRect(left,by,right-left,bh);}
  const ticks=p.legendTicks||legendTicks(m,p.v);ctx.fillStyle=muted;ctx.font=`${largeLabels?25:14}px Arial`;
  const shown=ticks.filter((_,i)=>ticks.length<=5||w>=850||i%2===0||i===ticks.length-1);
  for(const tick of shown){
   const tx=x+18+(w-36)*tick.pos;
   ctx.textAlign=tick.pos===0?'left':tick.pos===1?'right':'center';
   ctx.fillText(tick.label,tx,y+h-(largeLabels?20:15));ctx.fillRect(tx-.5,by+bh,1,largeLabels?7:5);
  }
  ctx.textAlign='left';
 }
}
// Both ratios are fixed, presentation-quality canvases; captured maps remain
// uniformly scaled inside them (no geographic stretching).
// GIF export is intentionally bounded to prevent a large nine-panel animation
// from exhausting browser memory or monopolizing all WebGL map contexts.
const GIF_MAX_FRAMES=25; // Shared cap for Standard (1200 px) and High (1600 px) GIFs.
function gifHoursInRange(start,end,step,hours){
 const supported=new Set(hours),out=[];
 for(let h=start;h<=end;h+=step)if(supported.has(h))out.push(h);
 return out;
}
function gifSelection(){
 const start=Number(el.exportGifStart.value),end=Number(el.exportGifEnd.value),step=Number(el.exportGifStep.value);
 const hours=gifHoursInRange(start,end,step,availableHours());
 const maxFrames=GIF_MAX_FRAMES;
 return {start,end,step,hours,maxFrames,delay:Number(el.exportGifDelay.value)};
}
function syncGifExportControls(){
 if(!el.exportForm)return;
 const mode=el.exportForm.querySelector('input[name="exportKind"]:checked')?.value||'png';
 const gif=mode==='gif',video=mode==='video';
 el.exportGifOptions.hidden=!gif;
 el.exportVideoNotice.hidden=!video;
 el.exportLabelFieldset.hidden=video;el.exportRatioFieldset.hidden=video;el.exportFramingFieldset.hidden=video;
 el.exportConfirmBtn.textContent=video?'Start recording':gif?'Download animated GIF':'Download PNG';
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
 el.exportConfirmBtn.disabled=st.exporting||gif&&!valid||video&&(!window.EVUPanelRecorder?.supported?.()||!st.expandedPanel||window.EVUPanelRecorder.active());
}
function resetDefaultGifRange(){
 const max=Number(el.exportGifEnd.max)||0;
 el.exportGifStart.value='0';
 el.exportGifEnd.value=String(Math.min(max,GIF_MAX_FRAMES-1));
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
  a.download=uniqueExportName(`omd_evu_${st.field}_${st.ref?.id?.replace(/[^0-9A-Za-z]/g,'')||'run'}_f${pad3(opt.hours[0])}-f${pad3(opt.hours.at(-1))}_${selection.type}.gif`);
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
 el.exportDialogTitle.textContent=multi?'Save all panels':type==='difference'?'Save difference map':st.expandedPanel===panel?'Save or record panel':'Save panel';
 el.exportGifChoice.hidden=type==='difference';
 const videoEligible=type==='panel'&&st.expandedPanel===panel;
 el.exportVideoChoice.hidden=!videoEligible;
 const videoMode=window.EVUPanelRecorder?.captureMode?.()||'unsupported';
 el.exportVideoChoice.querySelector('input').disabled=videoMode==='unsupported';
 el.exportVideoChoice.querySelector('small').textContent=videoMode==='canvas'
  ?'(Android Chrome · local panel canvas)':videoMode==='tab'?'(Chrome/Edge · tab capture)':'(recording unavailable in this browser)';
 el.exportVideoChoice.title=videoEligible&&videoMode==='unsupported'
  ?'Requires desktop Chrome/Edge Element Capture or Android Chrome canvas recording, plus MediaRecorder and HTTPS.':'';
 el.exportVideoNotice.innerHTML=videoMode==='canvas'
  ?'Android recording uses a local panel-only canvas: it includes the live map, terrain, weather shading, wind tracers, map overlays, an approximate panel label and the shared colorbar. It does <strong>not</strong> record menus, the Stop &amp; save button, or the large terrain-selection numbers. HTML-only popups may be simplified. Recording runs at up to 15 fps; keep Chrome visible. There is no tab-sharing prompt, audio, or upload. A 3-second countdown begins before Stop &amp; save downloads the video.'
  :'Record the expanded panel, including map movements, terrain, wind tracers, weather overlays, geographic labels and colorbar. <strong>Not recorded:</strong> the floating Stop &amp; save button, Data overlays / Map overlays menus, and the large numbered terrain panel-selection markers. These controls remain visible and usable while recording; changes they make to the map <strong>are recorded</strong>. Select <strong>this browser tab</strong> when prompted. Recording begins after a 3-second countdown, and Stop &amp; save downloads a local video (WebM or MP4 depending on browser), with no audio or upload.';
 el.exportForm.querySelector('input[name="exportKind"][value="png"]').checked=true;
 el.exportGifOptions.hidden=true;
 el.exportDialogHelp.textContent=type==='difference'
  ?'Choose 16:9 or 4:3 and how the difference map fits the saved plot. Fit shows surrounding geography; Fill crops edges without stretching. The map style and visible boundary detail are preserved.'
  :videoEligible?videoMode==='canvas'?'Choose PNG, GIF, or a mobile canvas recording of this expanded panel. No tab-sharing permission is needed.':'Choose PNG, GIF or a live video of this expanded panel. Video requires permission to share this browser tab.':'Choose PNG or GIF, an aspect ratio, and whether the map should fill the frame or fit entirely.';
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
 if(el.exportNoLabels)el.exportNoLabels.checked=false;
 st.exportNoLabels=false;
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
 await canvasPNG(c,`evu_${p.src?.id||'model'}_${(p.cfg?.field||st.field||p.v?.name||'missing')}_${p.ds?.id||'run'}_f${pad3(p.h??0)}_${ratio.replace(':','x')}.png`);
}
function drawSharedExportLegend(ctx,x,y,w,h,difference=false,rotation=false){
 const data=rotation?rotationSharedPalette():difference?differenceSharedPalette():sharedPalette();if(!data)return;
 const {m,palette,ticks}=data,light=st.theme==='light';
 const fg=light?'#1d2e42':'#eef4fa',muted=light?'#54687e':'#aebfd1';
 const title=`${m.label}${m.unit?' ('+m.unit+')':''}`;
 const left=x+Math.max(4,Math.round(w*.07)),right=x+w-Math.max(4,Math.round(w*.07));
 const largeLabels=!!st.exportLargeLabels;
 const barW=right-left,barY=y+Math.round(h*(largeLabels?.37:.33)),barH=Math.max(12,Math.min(largeLabels?24:20,Math.round(h*.25)));
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg;
 ctx.font=`bold ${largeLabels?Math.max(23,Math.min(33,w/70)):Math.max(15,Math.min(24,w/115))}px Arial`;
 ctx.fillText(clipText(ctx,title,barW),x+w/2,y+Math.round(h*.15));
 const colors=legendSwatches(m,palette),n=colors.length;
 colors.forEach((color,i)=>{const [a,b]=legendColorSpan(palette,i,n),from=Math.round(left+a*barW),to=Math.round(left+b*barW);ctx.fillStyle=color;ctx.fillRect(from,barY,to-from,barH);});
 ctx.strokeStyle=muted;ctx.lineWidth=1;ctx.strokeRect(left,barY,barW,barH);
 ctx.fillStyle=muted;ctx.font=`${largeLabels?Math.max(30,Math.min(38,w/75)):Math.max(11,Math.min(17,w/160))}px Arial`;
 const shown=visibleSharedTicks(ticks,w*.9);
 for(const t of shown){
  const tx=left+barW*t.pos;
  ctx.textAlign=t.pos<.001?'left':t.pos>.999?'right':'center';
  ctx.fillRect(tx-.5,barY+barH,1,6);
  ctx.fillText(t.label,tx,barY+barH+Math.min(largeLabels?25:18,Math.round(h*.26)));
 }
 ctx.textAlign='left';
}
async function exportAll(ratio='16:9',returnCanvas=false){
 el.saveAllPngBtn.disabled=true;stop();
 const n=st.panels.length,{width:W,height:H}=returnCanvas?gifOutputDimensions(ratio,true):exportDimensions(true,ratio);
 const cols=Math.min(n,columnCount(n)),rows=Math.ceil(n/cols);
 // One pixel between cells, one colorbar for the whole image.
 const pad=Math.max(12,Math.round(W*.006)),gap=1;
 const largeLabels=!!st.exportLargeLabels,noLabels=exportLabelsHidden();
 const head=noLabels?Math.max(8,Math.round(H*.008)):(largeLabels?Math.max(89,Math.round(H*.078)):Math.max(51,Math.round(H*.036)));
 const dualLegend=(st.modelSet==='gfs-versions'&&!!differenceSharedPalette())||!!rotationSharedPalette();
 const legendH=(largeLabels?Math.max(96,Math.round(H*.085)):Math.max(58,Math.round(H*.050)))*(dualLegend?2:1);
 const cellW=(W-2*pad-gap*(cols-1))/cols;
 const cellH=(H-head-2*pad-legendH-gap*(rows-1))/rows;
 if(cellW<100||cellH<130)throw Error('Export has too many panels for the chosen layout');
 const c=document.createElement('canvas');c.width=W;c.height=H;
 const cx=c.getContext('2d');
 cx.fillStyle=st.theme==='light'?'#e8eef5':'#09111f';cx.fillRect(0,0,W,H);
 cx.fillStyle=st.theme==='light'?'#1d2e42':'#eef4fa';
 cx.textBaseline='middle';cx.textAlign='left';
 const fieldMeta=fieldInfo({name:selectedShadingField()},selectedShadingField());
 const fieldHeading=`${st.field==='mslp'?'MSLP shading'+(st.overlayMSLP?' + MSLP isobars':'')+(st.overlayMSLP850?' + 850-hPa temperature (dashed where available)':''):st.field==='ptype'?'Precipitation type (model-specific)':fieldMeta.label}${fieldMeta.unit?' ('+fieldMeta.unit+')':''}`;
 const timingHeading=`Init ${fmt(st.ref.init_time)} · F${pad3(st.hour)} · Valid ${fmt(valid(st.ref,st.hour))}`;
 // Common field and valid-time information belong in the comparison image
 // header; model names stay exclusively in the individual map panels.
 if(!noLabels){
  cx.font=`bold ${Math.round(Math.max(27,W/110)*(largeLabels?1.65:1))}px Arial`;
  cx.fillText(clipText(cx,fieldHeading,W-2*pad),pad,head*.30);
  cx.font=`${Math.round(Math.max(15,W/220)*(largeLabels?1.7:1))}px Arial`;
  cx.fillText(clipText(cx,timingHeading,W-2*pad),pad,head*.72);
 }
 try{
  for(let i=0;i<n;i++){
   const p=st.panels[i];el.dataStatus.textContent=`Preparing export panel ${i+1} of ${n}…`;
   el.exportBusyStatus.textContent=`Rendering panel ${i+1} of ${n}…`;
   if(!p.map&&!p.cfg.placeholder){await activate(p);if(p.map)await waitPaint(p.map);}
   const px=pad+(i%cols)*(cellW+gap),py=head+pad+Math.floor(i/cols)*(cellH+gap);
   await drawExport(cx,p,px,py,cellW,cellH,false,true);
  }
  const legendY=head+pad+rows*cellH+(rows-1)*gap+6;
  if(dualLegend){
   drawSharedExportLegend(cx,pad,legendY,W-2*pad,legendH/2-3);
   drawSharedExportLegend(cx,pad,legendY+legendH/2,W-2*pad,legendH/2-3,st.modelSet==='gfs-versions',isRotationComparison());
  }else drawSharedExportLegend(cx,pad,legendY,W-2*pad,legendH-6);
  if(returnCanvas)return c;
  await canvasPNG(c,`omd_evu_autumnplot_${st.ref.id.replace(/[-:.]/g,'')}_f${pad3(st.hour)}_${n}panels_${ratio.replace(':','x')}.png`);
 }finally{el.saveAllPngBtn.disabled=false;updateStatus();}
}

// v7.47 — Geographic A−B comparison. Selection order defines the sign.
// The two fields are sampled at identical latitude/longitude points. This
// deliberately never subtracts GRIB grid indices: those are not colocated
// between e.g. HRRR, RRFS, REFS, MRMS, and RAP.
const DIFFERENCE_BLOCKED_FIELDS=new Set(['refc_ptype','ptype','crain','csnow','cicep','cfrzr','snowpresence','flightcat']);
const DIFFERENCE_COLORS=[
 '#173a89','#2155a7','#2d74c0','#428fce','#66abd9','#95c9e7','#c5e4f1','#e9f6fb',
 '#fff1ec','#fbd7cb','#f4b2a3','#ea8d80','#dd685c','#cc463e','#a72e35','#7e1e38'
];
// Difference shading uses very pale blue/red hues near a transparent zero
// rather than a gray neutral center. The same hues appear in export legends. Fade edges avoid a harsh blank stripe.
// The same alpha is used by the interactive difference and exported PNGs.
function differenceZeroOpacity(value,range){
 if(!(Number.isFinite(value)&&Number.isFinite(range)&&range>0))return 0;
 const neutral=differenceNeutralThreshold(selectedShadingField(),range),fadeEnd=Math.min(range*.85,neutral+range*.055),amount=Math.abs(value);
 return amount<=neutral?0:amount>=fadeEnd?1:(amount-neutral)/(fadeEnd-neutral);
}
const DIFFERENCE_LIMITS={wave_height_sig:26.24672,wave_height_wind:19.68504,wave_height_swell1:19.68504,
 wave_period_primary:8,wave_period_wind:8,wave_period_swell1:8,ceil:10000,mslp:12,t2m:15,dpt2m:15,t1000:10,t925:10,t850:10,t700:10,td700:12,td850:12,td925:12,q700:4,q850:5,q925:6,rh2m:40,
 h1000:8,h925:10,h850:12,h700:16,h500:24,h300:30,h250:30,wspd250:35,wspd300:35,wspd850:25,absv500:20,
 wspd10:30,gust:40,refc:30,prate:1.2,apcp:3,apcp1h:1.5,apcp3h:2,apcp6h:3,apcp24h:5,apcp48h:8,snow1h:6,snow3h:12,snow6h:18,
 snod:24,asnow:24,weasd:4,frzr:2,frozr:2,tsnowp:3,
 cpofp:40,snowc:40,sden:150,shear01:20,shear06:30};
const DIFFERENCE_TICK_STEPS={ceil:2500,mslp:4,t2m:5,dpt2m:5,t1000:5,t925:5,t850:5,t700:5,td700:4,td850:4,td925:4,q700:1,q850:1,q925:2,rh2m:10,
 h1000:2,h925:2,h850:3,h700:4,h500:6,h300:10,h250:10,wspd250:10,wspd300:10,wspd850:5,absv500:5,
 wspd10:10,gust:10,refc:10,prate:.4,apcp:1,apcp1h:.5,apcp3h:.5,apcp6h:1,apcp24h:2,apcp48h:3,snow1h:2,snow3h:3,snow6h:6,
 snod:6,asnow:6,weasd:1,frzr:.5,frozr:.5,tsnowp:1,
 cpofp:10,snowc:10,sden:50,shear01:5,shear06:10};
function differenceAnalysisSource(p){
 if(p?.cfg?.timeMode!=='analysis')return '';
 const source=String(p.ds?.product||p.ds?.source||'').toLowerCase();
 const known=/^(ccpa|stageiv|mrms|rap|rtma|urma)(?:_|$)/.exec(source);
 return known?(known[1]==='stageiv'?'Stage IV':known[1].toUpperCase()):(source?source.toUpperCase():'unavailable');
}
function floatingDifferenceField(){
 return selectedShadingField();
}
function floatingDifferenceFieldAvailable(field){
 const diff=st.difference;
 return diff.selected.length===2&&diff.selected.every(panel=>{
  try{
   const proxy={cfg:{...panel.cfg,field},src:null};
   const selection=choose(proxy,st.hour);
   return !selection.error&&selection.ds&&selection.v&&
    selection.v.available_hours?.includes(selection.h);
  }catch(_){return false;}
 });
}
async function loadFloatingDifferenceField(panel,field){
 // Respect the panel's original cycle, offset and analysis valid-time mode;
 // this lookup is separate from the visible forecast shading.
 const proxy={cfg:{...panel.cfg,field},src:null};
 const selected=choose(proxy,st.hour);
 if(selected.error||!selected.ds||!selected.v||!selected.v.available_hours?.includes(selected.h))
  throw Error(`${panel.cfg.label||panel.cfg.id} does not publish ${differenceFieldLabel(field)} at F${pad3(st.hour)}: ${selected.error||'missing native field'}`);
 const {ds,v,h}=selected;
 const meta=fieldInfo(v,field,ds.model||panel.cfg.source);
 const data=await getDisplayData(proxy.src,ds,v,h,meta,()=>{});
 return {src:proxy.src,ds,v,h,meta,data,rawField:new apgl.RawScalarField(gridForPanel(panel,ds,v),data)};
}
function differenceLabel(p){
 const label=p?.cfg?.label||p?.cfg?.id||'Panel',source=differenceAnalysisSource(p);
 return source?`${label} (${source})`:label;
}
// Difference color bars are fixed to meaningful field ranges, but their
// labels should NOT inherit fractional endpoints that make no meteorological
// sense (e.g. a 212.5-unit SRH range). Keep the
// original shading and mapping unchanged; put integer labels *inside* such
// ranges rather than mislabeling the endpoints. Small liquid accumulations and
// precipitation rates genuinely need fractional ticks.
const DIFFERENCE_FRACTIONAL_TICKS=new Set([
 'prate','apcp','apcp1h','apcp3h','apcp6h','apcp24h','apcp48h',
 'frzr','frozr','tsnowp','weasd'
]);
function differenceIntegerStep(target){
 const size=Math.max(1,target);
 const base=Math.pow(10,Math.floor(Math.log10(size)));
 const choices=[1,2,5,10].map(mult=>mult*base).filter(n=>n>=1);
 return choices.reduce((best,n)=>Math.abs(n-size)<Math.abs(best-size)?n:best,choices[0]);
}
function differenceTicks(field,limit){
 if(!(Number.isFinite(limit)&&limit>0))return [0];
 const fractional=DIFFERENCE_FRACTIONAL_TICKS.has(field)||limit<1;
 let step=DIFFERENCE_TICK_STEPS[field]||Math.max(1,limit/3);
 if(!fractional)step=Number.isInteger(step)&&step>=1?step:differenceIntegerStep(limit/3);
 // Limit the number of labels so narrow difference windows remain readable.
 while(Math.floor((limit+1e-8)/step)*2+1>9){
  step=fractional?step*2:differenceIntegerStep(step*1.9);
 }
 const n=Math.floor((limit+1e-8)/step),ticks=[];
 for(let i=-n;i<=n;i++)ticks.push(Number((i*step).toFixed(6)));
 // Fractional-limit endpoints must not masquerade as integers. When a limit
 // is itself an integer, it is safe and useful to label the exact endpoints.
 if(fractional||Number.isInteger(limit)){
  if(!ticks.some(x=>Math.abs(x+limit)<1e-8))ticks.unshift(-limit);
  if(!ticks.some(x=>Math.abs(x-limit)<1e-8))ticks.push(limit);
 }
 return [...new Set(ticks)].sort((a,b)=>a-b);
}
function differenceNumber(x){
 if(!Number.isFinite(x))return '—';
 const nearZero=Math.abs(x)<1e-8;return nearZero?'0':String(Number(x.toFixed(4)));
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
  const signed=snap.aiRegular?differenceSampleValue(snap.rawDifference,lon,lat):NaN;
  ui.textContent=`${lat.toFixed(2)}°, ${lon.toFixed(2)}° · Δ ${fmt(Number.isFinite(signed)?signed:av-bv)}${unit} · ${snap.labelA}: ${fmt(av)} · ${snap.labelB}: ${fmt(bv)}`;
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
 if(DIFFERENCE_BLOCKED_FIELDS.has(selectedShadingField())){
  if(p.compareCheck)p.compareCheck.checked=false;
  return;
 }
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
  if(el.differenceDialog.returnValue==='open'&&st.difference.selected.length===2&&
     !DIFFERENCE_BLOCKED_FIELDS.has(selectedShadingField())){
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
 diff.open=true;diff.fieldKey=null;diff.snapshot=null;el.differenceWindow.hidden=false;syncImageFieldChoices();el.differenceSaveBtn.disabled=true;el.differenceSample.hidden=true;
 // Start from the CSS default every time, so a previous manual resize does
 // not determine the next popup's initial geographic extent.
 el.differenceWindow.style.width='';el.differenceWindow.style.height='';
 matchInitialDifferenceWindow();
 showDifferenceMessage('Initializing difference map…');
 const camera=currentSharedCamera()||makeViewBounds();
 try{
  // MapLibre must own a child of the flex-layout map region. Moving or
  // resizing the region itself during export detaches it from the floating
  // window (v0.48.2), leaving a blank view and a stalled PNG capture.
  const host=document.createElement('div');host.className='difference-map-host';
  el.differenceMap.prepend(host);
  const fittedCamera=differenceCameraForViewport(camera,host);
  const map=new maplibregl.Map({container:host,style:mapStyle(),
   center:fittedCamera.center,zoom:fittedCamera.zoom,bearing:fittedCamera.bearing||0,pitch:fittedCamera.pitch||0,
   projection:{type:st.mode==='globe'?'globe':'mercator'},minZoom:0,maxPitch:75,
   maxZoom:st.cfg.display.maxZoom||12,keyboard:false,attributionControl:false,preserveDrawingBuffer:true,fadeDuration:0});
  diff.map=map;map.keyboard?.disable?.();map.dragRotate?.enable?.();map.touchZoomRotate?.enableRotation?.();window.EVUAdvancedMap?.attach(map,null);
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
  if(typeof ResizeObserver==='function'){diff.resizeObserver=new ResizeObserver(()=>{
   if(diff.open&&diff.map){diff.map.resize();if(diff.geo)geographyZoom(diff.geo);}
   if(diff.snapshot){setDifferenceLegend(diff.snapshot.fieldKey,diff.snapshot.range,diff.snapshot.unit);scheduleDifferenceLiveRender();}
  });
   diff.resizeObserver.observe(el.differenceWindow);}
  await new Promise((resolve,reject)=>{
   if(map.loaded())resolve();else{map.once('load',resolve);map.once('error',e=>reject(e.error||new Error('Difference map did not load')));}
  });
  if(!diff.open||diff.map!==map)return;
  // Re-measure after MapLibre has laid out the container, so even a popup
  // opened while CSS sizing settles inherits the panel's geographic footprint.
  map.resize();
  map.jumpTo(differenceCameraForViewport(camera,map));
  addGeographySkeleton(map);
  window.EVUAdvancedMap?.orderTerrain(map);
  updateLiveGeography();
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
 try{window.EVUAdvancedMap?.detach(diff.map,null);diff.map?.remove();}catch(e){console.warn('Difference map cleanup',e);}
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
function regularDifferenceCoordinates(record){
 const g=record?.ds?.grid;if(String(g?.GRIB_gridType||'').toLowerCase()!=='regular_ll')return null;
 const nx=Number(record?.v?.shape?.[2]),ny=Number(record?.v?.shape?.[1]);
 let west=Number(g.GRIB_longitudeOfFirstGridPointInDegrees??g.longitude_min),
     east=Number(g.GRIB_longitudeOfLastGridPointInDegrees??g.longitude_max);
 const south=Number(g.GRIB_latitudeOfFirstGridPointInDegrees??g.latitude_min),
       north=Number(g.GRIB_latitudeOfLastGridPointInDegrees??g.latitude_max);
 if(![west,east,south,north].every(Number.isFinite)||!Number.isInteger(nx)||!Number.isInteger(ny)||nx<2||ny<2)return null;
 if(west>=0&&east>180){west-=360;east-=360;}
 if(east<=west)east+=360;
 if(!(east>west&&north>south))return null;
 return{nx,ny,west,east,south,north,dx:(east-west)/(nx-1),dy:(north-south)/(ny-1)};
}
function identicalDifferenceGrids(a,b){
 const x=a?.ds?.grid,y=b?.ds?.grid;if(!x||!y)return false;
 const ax=regularDifferenceCoordinates(a),bx=regularDifferenceCoordinates(b);
 if(ax||bx)return !!ax&&!!bx&&['nx','ny','west','east','south','north'].every(k=>Math.abs(ax[k]-bx[k])<1e-6);
 return ['GRIB_Nx','GRIB_Ny','GRIB_DxInMetres','GRIB_DyInMetres',
  'GRIB_LoVInDegrees','GRIB_LaDInDegrees','GRIB_Latin1InDegrees',
  'GRIB_Latin2InDegrees','GRIB_longitudeOfFirstGridPointInDegrees',
  'GRIB_latitudeOfFirstGridPointInDegrees'].every(k=>Number(x[k])===Number(y[k]));
}
// Display-unit values are on a south-to-north regular lat/lon grid. Use
// bilinear interpolation at ONE common coordinate for each target point;
// masked/missing corners never get silently filled. The coarser native
// grid is the target, limiting CPU work without degrading its resolution.
function regularDifferenceSample(record,values,lon,lat){
 const {nx,ny,west,east,south,north,dx,dy}=record;
 let x=(lon-west)/dx,y=(lat-south)/dy;
 if(x<-.00001||x>nx-1+.00001){
  const shifted=x+360/dx;
  if(shifted>=-.00001&&shifted<=nx-1+.00001)x=shifted;
  else {const alternate=x-360/dx;if(alternate>=-.00001&&alternate<=nx-1+.00001)x=alternate;}
 }
 if(!(x>=-.00001&&x<=nx-1+.00001&&y>=-.00001&&y<=ny-1+.00001))return NaN;
 x=Math.max(0,Math.min(nx-1,x));y=Math.max(0,Math.min(ny-1,y));
 const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j;
 const corners=[[i,j,(1-u)*(1-v)],[Math.min(nx-1,i+1),j,u*(1-v)],
  [i,Math.min(ny-1,j+1),(1-u)*v],[Math.min(nx-1,i+1),Math.min(ny-1,j+1),u*v]];
 let value=0;
 for(const [ci,cj,weight] of corners){
  if(weight<=1e-7)continue;
  const datum=values[cj*nx+ci];
  if(!Number.isFinite(datum)||datum<=-1e9)return NaN;
  value+=datum*weight;
 }
 return value;
}
// The floating AI difference's on-screen raster, exported raster, and
// probes must sample the SAME geographically registered values. A native
// RawScalarField projection here can disagree with the explicit 0.25/0.50
// degree alignment (especially on mixed native grids). Keep the comparison
// sample on its canonical SW-to-NE regular grid, with no interpolation to a
// second display projection. This sampler allocates nothing per pixel.
function regularDifferenceField(record,values){
 const geo=regularDifferenceCoordinates(record);
 if(!geo||!values||values.length!==geo.nx*geo.ny)
  throw Error('AI difference sampling grid is inconsistent with its computed values.');
 const {nx,ny,west,east,south,north,dx,dy}=geo;
 const lonShift=360/dx;
 return {sampleField(lon,lat){
  let x=(lon-west)/dx,y=(lat-south)/dy;
  if(x<0||x>nx-1){
   if(x+lonShift>=0&&x+lonShift<=nx-1)x+=lonShift;
   else if(x-lonShift>=0&&x-lonShift<=nx-1)x-=lonShift;
  }
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<-.00001||x>nx-1+.00001||y<-.00001||y>ny-1+.00001)return NaN;
  x=Math.min(nx-1,Math.max(0,x));y=Math.min(ny-1,Math.max(0,y));
  const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j;
  const k=j*nx+i,r=i+1<nx?k+1:k,t=j+1<ny?k+nx:k,tr=j+1<ny?r+nx:r;
  const w00=(1-u)*(1-v),w10=u*(1-v),w01=(1-u)*v,w11=u*v;
  const a=values[k],b=values[r],c=values[t],d=values[tr];
  if((w00>1e-7&&(!Number.isFinite(a)||a<=-1e9))||
     (w10>1e-7&&(!Number.isFinite(b)||b<=-1e9))||
     (w01>1e-7&&(!Number.isFinite(c)||c<=-1e9))||
     (w11>1e-7&&(!Number.isFinite(d)||d<=-1e9)))return NaN;
  return (w00>1e-7?w00*a:0)+(w10>1e-7?w10*b:0)+
         (w01>1e-7?w01*c:0)+(w11>1e-7?w11*d:0);
 }};
}
function alignAIDifferenceInputs(a,aData,b,bData){
 const ga=regularDifferenceCoordinates(a),gb=regularDifferenceCoordinates(b);
 if(!ga||!gb||aData.length!==ga.nx*ga.ny||bData.length!==gb.nx*gb.ny)
  throw Error('AI comparison requires valid regular lat/lon grids with matching dimensions in the source catalogs.');
 const firstIsTarget=aData.length<=bData.length;
 const target=firstIsTarget?ga:gb,source=firstIsTarget?gb:ga;
 const values=firstIsTarget?bData:aData;
 const converted=new Float32Array(target.nx*target.ny);
 let overlaps=0;
 for(let j=0;j<target.ny;j++)for(let i=0;i<target.nx;i++){
  const lon=target.west+i*target.dx,lat=target.south+j*target.dy;
  const v=regularDifferenceSample(source,values,lon,lat);
  converted[j*target.nx+i]=Number.isFinite(v)?v:NaN;
  if(Number.isFinite(v))overlaps++;
 }
 if(!overlaps)throw Error('AI models have no shared geographic region at this hour.');
 return firstIsTarget?{a:aData,b:converted,reference:a}:{a:converted,b:bData,reference:b};
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
 st.alignedSource={id:'aligned_analysis',url,datasets:cat.datasets,_catalogFingerprint:catalogSignature(cat.datasets)};
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
   if(windowHours&&['mrms_apcp','stageiv_apcp'].includes(product)){
    // Bounded recent slices; older precipitation hours are loaded on demand.
    for(let h=Math.max(1,hour-1);h<=hour;h++)add(h,'apcp');
   }else if(st.field==='apcp'&&['mrms_apcp','stageiv_apcp'].includes(product)){
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
 const product=panel.ds?.product,precipWindow=precipitationAccumulationHours(st.field),snow=rrfsSnowSpec(st.field);
 if(snow?.method==='depthChange')throw Error('Signed snow-depth change is not equivalent to observed snowfall accumulation; NOHRSC subtraction is unavailable.');
 const field=snow?nativeNohrscSnowField(st.field):precipWindow?'apcp':st.field;
 const m=snow?{...(FIELDS[field]||FIELDS.snow6h),convert:'mtoin'}:FIELDS[st.field];
 if(!st.alignedSource){try{await reloadAlignedCatalog();}catch(e){throw Error('Aligned analysis catalog is not available: '+String(e?.message||e));}}
 if(!product)throw Error('Cannot identify verifying analysis source.');
 if(precipWindow||st.field==='apcp'){
  const window=precipWindow||st.hour;
  if(st.hour<window||window<1)throw Error(`Need F${pad3(Math.max(1,window))} for a complete precipitation analysis.`);
  const plan=precipitationSourcePlan(panel.src,st.ref,st.hour,window);
  if(!plan||plan.records.at(-1).ds.product!==product)
   throw Error(`Complete ${precipitationSourceLabel(product)} ${window}-h verification window is not available.`);
  let sum=null,grid=null,recLast=null;
  for(const segment of plan.records){
   if(token!==st.difference.token)throw Error('Difference selection changed.');
   const rec=await requireAlignedRecord(segment.ds.product,segment.ds.init_time,'apcp');
   const vals=await getDisplayData(rec.src,rec.ds,rec.v,0,m,()=>{});
   if(sum&&JSON.stringify(rec.ds.grid)!==JSON.stringify(grid))throw Error('Aligned precipitation grids differ within accumulation interval.');
   if(!sum){sum=new Float32Array(vals);grid=rec.ds.grid;}
   else {
    if(sum.length!==vals.length)throw Error('Aligned precipitation shapes differ.');
    for(let i=0;i<sum.length;i++)sum[i]=Number.isFinite(sum[i])&&Number.isFinite(vals[i])&&sum[i]>-1e9&&vals[i]>=0?sum[i]+vals[i]:-1e10;
   }
   recLast=rec;
  }
  return {...recLast,data:sum,grid};
 }
 if(st.field==='snow48h'||(snow&&snow.period===48)){
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
 if(snow&&snow.period===0){
  if(st.hour<6||st.hour%6)throw Error('Accumulated observed snowfall requires a complete six-hour interval.');
  let sum=null,last=null,signature=null;
  for(let h=6;h<=st.hour;h+=6){
   if(token!==st.difference.token)throw Error('Difference selection changed.');
   const rec=await requireAlignedRecord('nohrsc_6h',valid(st.ref,h),'snow6h');
   const key=accumulationGridKey(rec.ds,rec.v);
   if(signature&&signature!==key)throw Error('NOHRSC accumulated snowfall grids differ.');
   const values=await getDisplayData(rec.src,rec.ds,rec.v,0,m,()=>{});
   sum=sum?sumSnowAnalysisArrays(sum,values):values.slice();signature=key;last=rec;
  }
  return {...last,data:sum,grid:last.ds.grid};
 }
 const rec=await requireAlignedRecord(product,valid(st.ref,st.hour),field);
 let data;try{data=await getDisplayData(rec.src,rec.ds,rec.v,0,m,()=>{});}
 catch(e){throw Error(`Could not load aligned ${product.toUpperCase()} ${field} at ${fmt(valid(st.ref,st.hour))}: ${String(e?.message||e)}. Check RZDM aligned/ permissions and catalog.`);}
 return {...rec,data,grid:rec.ds.grid};
}
async function updateDifferenceMap(token){
 const diff=st.difference;if(!diff.open||!diff.map||token!==diff.token)return;
 const [a,b]=diff.selected;const fieldKey=floatingDifferenceField(),meta=FIELDS[fieldKey];
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
 if([a,b].some(p=>panelSelectedField(p)===fieldKey&&(p.status!=='ready'||!p.rawField||!p.diffDisplayData))){
  showDifferenceMessage('A matching field or forecast hour is unavailable for one or both selected panels.');return;
 }
 const selectedAlternate=[a,b].some(p=>panelSelectedField(p)!==fieldKey);
 let altA=null,altB=null;
 let am=fieldInfo(a.v),bm=fieldInfo(b.v);
 if(!selectedAlternate&&(am.unit!==bm.unit||am.ensembleMeanFraction!==bm.ensembleMeanFraction)){
  showDifferenceMessage('Incompatible units or statistics; difference not computed.');return;
 }
 showDifferenceMessage('Loading aligned data and subtracting grids…');
 try{
  const isAnalysis=p=>p.cfg.timeMode==='analysis';
  if(isAnalysis(a)&&isAnalysis(b))throw Error('Analysis–Analysis subtraction is not configured.');
  let arrayA=a.diffDisplayData,arrayB=b.diffDisplayData;
  let rawA=a.rawField,rawB=b.rawField;
  let model=isAnalysis(a)?b:a;
  let nativeGridRecord=null;
  if(selectedAlternate){
   // The alternate field is not painted on the source maps; retrieve it
   // directly from both native catalogs instead of subtracting the wrong field.
   [altA,altB]=await Promise.all([
    loadFloatingDifferenceField(a,fieldKey),loadFloatingDifferenceField(b,fieldKey)]);
   if(token!==diff.token)return;
   am=altA.meta;bm=altB.meta;
   if(am.unit!==bm.unit||am.ensembleMeanFraction!==bm.ensembleMeanFraction)
    throw Error('Alternate fields have incompatible units/statistics.');
   arrayA=altA.data;arrayB=altB.data;
   rawA=altA.rawField;rawB=altB.rawField;
   nativeGridRecord=altA;model=altA;
  }
  if(!selectedAlternate&&(isAnalysis(a)||isAnalysis(b))){
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
  }
  // AI/GEFS fields are published at independent 0.25/0.50-degree native
  // resolutions. Subtract ONLY after registering both to the same geographic
  // latitude/longitude points; no array-index subtraction across grids.
  const compareA=selectedAlternate?altA:a,compareB=selectedAlternate?altB:b;
  const aiRegular=st.modelSet==='ai-models'&&!isAnalysis(a)&&!isAnalysis(b)&&
    !!regularDifferenceCoordinates(compareA)&&!!regularDifferenceCoordinates(compareB);
  // Retain the unmodified, unaligned input arrays for the source-value probe.
  // ArrayA/B below may be replaced by geographically co-registered values.
  if(aiRegular){
   rawA=regularDifferenceField(compareA,arrayA);
   rawB=regularDifferenceField(compareB,arrayB);
  }
  if(!isAnalysis(a)&&!isAnalysis(b)&&!identicalDifferenceGrids(compareA,compareB)){
   if(st.modelSet!=='ai-models')throw Error('Models have different native grids; no pre-aligned comparison available.');
   const aligned=alignAIDifferenceInputs(compareA,arrayA,compareB,arrayB);
   arrayA=aligned.a;arrayB=aligned.b;
   nativeGridRecord=aligned.reference;model=aligned.reference;
  }
  if(token!==diff.token||!diff.open||st.seq!==a.renderedSeq)return;
  if(arrayA.length!==arrayB.length)throw Error('Difference array dimensions are inconsistent.');
  const range=DIFFERENCE_LIMITS[fieldKey]||Math.max(1,(am.max??100)-(am.min??0))*.25;
  const arr=new Float32Array(arrayA.length);let count=0,visibleCount=0;
  const neutral=differenceNeutralThreshold(fieldKey,range);
  for(let i=0;i<arr.length;i++){
   const va=arrayA[i],vb=arrayB[i];
   if(Number.isFinite(va)&&Number.isFinite(vb)&&va> -1e9&&vb> -1e9){
    // AI values remain signed and unclipped for accurate cursor sampling;
    // the raster colormap already clips to its symmetric display range.
    const delta=va-vb;
    arr[i]=aiRegular?delta:Math.max(-range,Math.min(range,delta));
    count++;if(Math.abs(delta)>neutral)visibleCount++;
   }else arr[i]=-1e10;
  }
  if(!count)throw Error('No overlapping valid points for this comparison.');
  console.info('Difference native grid',fieldKey,'valid',count,'of',arr.length,'above neutral',visibleCount);
  const reference=nativeGridRecord||model;
  const field=aiRegular?regularDifferenceField(reference,arr):
    new apgl.RawScalarField(gridForPanel(model,reference.ds||model.ds,reference.v||model.v),arr);
  // Rendering this via a second PlotLayer was unreliable in the floating
  // MapLibre map. The canvas renderer is the same proven path used by PNG.
  // RRFS comparisons preserve native grids; mixed-resolution AI models
  // share a geographic comparison grid at the same physical coordinates.
  if(token!==diff.token||!diff.open)return;
  setDifferenceLegend(fieldKey,range,am.unit||'');
  diff.snapshot={fieldKey,range,unit:am.unit||'',meta:am,rawA,rawB,rawDifference:field,
   labelA:differenceLabel(a),labelB:differenceLabel(b),seq:st.seq,init:st.ref.init_time,
   hour:st.hour,valid:fmt(valid(st.ref,st.hour)),nativeAligned:true,aiRegular,
   overlapCount:count,aboveNeutralCount:visibleCount};
  await paintDifferenceLive(diff.snapshot);
  if(token!==diff.token||!diff.open)return;
  el.differenceSaveBtn.disabled=false;
  if(visibleCount===0){
   const value=Number(neutral.toFixed(3));
   showDifferenceMessage(`Differences are within ±${value} ${am.unit||''} (the transparent near-zero band). Cursor values remain available.`);
  }else clearDifferenceMessage();
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
   map.getZoom()>=(layer.minzoom||0)&&
   (key!=='counties'||st.countiesEnabled));
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
 if(token!==diff.liveToken||!diff.open||snapshot!==diff.snapshot||diff.saveBusy){
  // A resize/camera update can supersede a slow AI/GEFS raster while it is
  // calculating. If no newer frame is already queued, retry the latest view
  // rather than leaving a valid snapshot with a permanently hidden canvas.
  if(diff.open&&snapshot===diff.snapshot&&!diff.saveBusy&&!diff.liveTimer)
   scheduleDifferenceLiveRender(95);
  return;
 }
 // Show pixels immediately; don't hold back the shading on a slow
 // GeoJSON fetch (or a high-resolution county outline redraw).
 canvas.width=width;canvas.height=height;
 canvas.getContext('2d').drawImage(raster,0,0,width,height);
 canvas.style.visibility='visible';
 const visible=differenceGeoVisibility(map);
 if(Object.values(visible).some(Boolean)){
  const center=map.getCenter();
  const key=JSON.stringify([width,height,center.lng,center.lat,map.getZoom(),map.getBearing(),map.getPitch(),st.mode,st.theme,st.mapOutlines,overlayStyle('mapOutlines'),visible]);
  let lines=diff.outlineCache?.key===key?diff.outlineCache.canvas:null;
  if(!lines){
   lines=document.createElement('canvas');lines.width=width;lines.height=height;
   await redrawDifferenceBoundaries(lines,map,{exportGeoVisible:visible,liveNoHalo:true,difference:true});
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
 const layerIds=['coast','coast-detail','country','country-detail','states','counties'].flatMap(id=>[id+'-casing',id]);
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
  await redrawDifferenceBoundaries(outlines,map,{exportGeoVisible:visible,exportStyle:false,difference:true});
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
 if(st.mapOutlines===false&&!st.countiesEnabled)return;
 const visible=snapshot.exportGeoVisible||{};
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const w=map.getContainer().clientWidth,h=map.getContainer().clientHeight;
 if(!(w>0&&h>0))return;
 const sx=canvas.width/w,sy=canvas.height/h;
 const colors=liveGeographyInk({cfg:{differencePanel:!!snapshot.difference}});
 const specs=[['coast','coast',1.3],['coast_detail','coast',1.2],['country','coast',1.1],
              ['country_detail','coast',1.1],['states','minor',.95],['counties','minor',.75]];
 // Comparison geometry is captured at the live-map size, then composed into
 // a smaller cell. Convert desired final-pixel widths to capture pixels once.
 const comparisonCell=snapshot.comparisonCell;
 const toFinal=comparisonCell?exportScaleToCell(canvas.width,canvas.height,
  comparisonCell.width,comparisonCell.height,comparisonCell.framing):0;
 // Live outlines have a mostly single-stroke appearance with only a
 // hairline of adaptive contrast. For comparison cells, keep that subtle
 // edge instead of importing the standalone PNG's broad white casing.
 // In particular, thin state lines must not look like pale white rails.
 const targetOutside=comparisonCell?Math.max(2.2,Math.min(2.7,2.0+comparisonCell.width/3400)):0;
 const minorOutside=comparisonCell?Math.max(1.55,Math.min(1.9,1.45+comparisonCell.width/3300)):0;
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 for(const [id,kind,weight] of specs){
  if(!visible[id]||(id==='counties'?!st.countiesEnabled:!st.mapOutlines))continue;
  ctx.globalAlpha=id==='counties'?(overlayStyle('counties').opacity??.85):1;
  let data;try{data=await geoData(id);}catch(_){continue;}
  // The country/coast/states/county classes retain their visual hierarchy.
  const targetInside=comparisonCell?(kind==='minor'?1.2:1.95):0;
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
  if(segments){
   const liveWidth=Math.max(kind==='minor'?.85:1.1,weight*Math.min(sx,sy));
   ctx.globalAlpha=comparisonCell?(kind==='minor'?.30:.38):(kind==='minor'?.68:.85);
   const isManual=Boolean(overlayStyle('mapOutlines').color);
   // Print and live PNG exports use the same adaptive default as the map;
   // a custom single-color outline is rendered exactly as chosen.
   if(!isManual&&!snapshot.liveNoHalo&&id!=='counties'){
    ctx.strokeStyle=colors.boundaryCasing;
    ctx.lineWidth=overlayStrokeWidth('mapOutlines',comparisonCell?
     (kind==='minor'?minorOutside:targetOutside)/Math.max(1e-5,toFinal):liveWidth+(snapshot.liveNoHalo?.50:1.3));
    ctx.stroke();
   }
   ctx.globalAlpha=kind==='minor'?.86:.97;
   ctx.strokeStyle=overlayStrokeColor(id==='counties'?'counties':'mapOutlines',kind==='minor'?colors.minor:colors.line);
   ctx.lineWidth=overlayStrokeWidth(id==='counties'?'counties':'mapOutlines',comparisonCell?
    targetInside/Math.max(1e-5,toFinal):liveWidth);ctx.stroke();
  }
 }
 ctx.restore();
}
// A zero-bearing/pitch 2D Mercator view has longitude linear in screen X and
// latitude independent of X. Verify this at sample centers before using it:
// sampleField still receives the original native-grid lon/lat coordinates and
// all pixels/colors/resolution remain unchanged. Globe, tilted, rotated, and
// nonrectilinear projections retain the precise per-pixel inverse projection.
function differenceExportLongitudeScanline(map,sampleW,cssW,cssH){
 if(st.mode==='globe'||sampleW<2||Math.abs(Number(map.getBearing?.()||0))>1e-8||
    Math.abs(Number(map.getPitch?.()||0))>1e-8||
    (map.getProjection?.()?.type||'mercator')!=='mercator')return null;
 const step=cssW/sampleW,y=cssH/2;
 try{
  const a=map.unproject([step*.5,y]);
  const b=map.unproject([cssW-step*.5,y]);
  const mid=map.unproject([cssW/2,y]);
  if(!a||!b||!mid||![a.lng,a.lat,b.lng,b.lat,mid.lng,mid.lat].every(Number.isFinite))return null;
  const dx=(b.lng-a.lng)/(sampleW-1);
  if(Math.abs(a.lat-b.lat)>1e-7||Math.abs(mid.lat-a.lat)>1e-7||
     Math.abs(mid.lng-(a.lng+dx*(sampleW-1)/2))>1e-7||
     Math.abs(b.lng-a.lng)>180)return null;
  const longitude=new Float64Array(sampleW);
  for(let x=0;x<sampleW;x++)longitude[x]=a.lng+x*dx;
  return longitude;
 }catch(_){return null;}
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
 const longitude=differenceExportLongitudeScanline(map,sampleW,cssW,cssH);
 const cssStepX=cssW/sampleW,cssStepY=cssH/sampleH;
 let painted=0;
 for(let y=0;y<sampleH;y++){
  const py=(y+.5)*cssStepY;
  // The ordinary 2D view needs only one unproject per raster row, rather
  // than one per pixel. Other projections retain the original exact path.
  const rowGeo=longitude?map.unproject([cssStepX*.5,py]):null;
  const rowLat=rowGeo?.lat;
  for(let x=0;x<sampleW;x++){
   const point=longitude?null:[(x+.5)*cssStepX,py];
   if(point&&typeof map.isPointOnSurface==='function'&&!map.isPointOnSurface(point))continue;
   const geo=point?map.unproject(point):null;
   const lon=longitude?longitude[x]:geo?.lng,lat=longitude?rowLat:geo?.lat;
   if(!Number.isFinite(lon)||!Number.isFinite(lat))continue;
   const v=differenceSampleValue(field,lon,lat);if(!Number.isFinite(v)||v<-1e9)continue;
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
  const layout=standaloneExportLayout(W,H,!!st.exportLargeLabels,exportLabelsHidden());
  if(layout.mapH<100)throw Error('Difference export has insufficient plot height.');
  const {image,overlay,outlines}=await captureSharpDifferenceFrame(diff.map,snap,layout.mapW,layout.mapH,framing);
  if(!diff.open||snap!==diff.snapshot||snap.seq!==st.seq)
   throw Error('Difference changed while exporting. Retry with the current data.');
  const c=document.createElement('canvas');c.width=W;c.height=H;const cx=c.getContext('2d');
  const dark=st.theme!=='light',fg=dark?'#e8f0fb':'#24394e',bg=dark?'#09111f':'#f0f5fa';
  cx.fillStyle=bg;cx.fillRect(0,0,W,H);
  cx.fillStyle=fg;cx.textAlign='left';cx.textBaseline='middle';
  if(!exportLabelsHidden()){
   cx.font=`bold ${layout.titleFont}px Arial`;
   cx.fillText(clipText(cx,`Difference · ${FIELDS[snap.fieldKey]?.label||snap.fieldKey}`,W-36),18,layout.titleY);
   cx.font=`${layout.subtitleFont}px Arial`;
   cx.fillText(clipText(cx,`${snap.labelA} − ${snap.labelB} · Init ${fmt(snap.init)} · F${pad3(snap.hour)} · Valid ${snap.valid}`,W-36),18,layout.subtitleY);
  }
  // Draw one combined map with identical framing for background, raster,
  // and bright boundaries. The shared panel helper preserves aspect ratio.
  const combined=document.createElement('canvas');
  combined.width=image.naturalWidth;combined.height=image.naturalHeight;
  const cc=combined.getContext('2d');
  cc.drawImage(image,0,0);cc.drawImage(overlay,0,0);cc.drawImage(outlines,0,0);
  drawMapFramed(cx,combined,layout.mapX,layout.mapY,layout.mapW,layout.mapH,framing);
  const largeLabels=!!st.exportLargeLabels;
  const y=H-(largeLabels?57:42),left=18,right=W-18,rampW=right-left;
  const rampH=largeLabels?17:13;
  cx.fillStyle=fg;cx.font=`bold ${largeLabels?Math.max(25,Math.min(32,W/45)):Math.max(12,Math.min(16,W/58))}px Arial`;
  cx.fillText(clipText(cx,snap.unit?`Difference (${snap.unit})`:'Difference',W-36),18,H-(largeLabels?81:61));
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
  cx.fillStyle=fg;cx.font=`${largeLabels?30:11}px Arial`;cx.textAlign='center';
  for(const t of differenceTicks(snap.fieldKey,snap.range)){
   const x=left+((t+snap.range)/(snap.range*2))*rampW;
   cx.fillRect(x-.5,y+rampH,1,5);
   cx.fillText(differenceNumber(t),x,H-(largeLabels?20:15));
  }
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
 else {if(st.cfg){schedulePrefetch();void refreshCatalogInventory({resumed:true});}void checkViewerRelease({resumed:true});}
});
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
