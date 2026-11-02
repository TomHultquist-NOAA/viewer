'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const section=(from,to)=>{
 const a=src.indexOf(from),b=src.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,`missing ${from}`);return src.slice(a,b);
};
const geoSource=section('function exportGeographyVisibility(', 'async function captureExportGeography(');
const diffGeo=section('function differenceGeoVisibility(', 'async function paintDifferenceLive(');
const st={cfg:{display:{showCountiesOnZoom:true}},mode:'2d',imageOpacity:1,seq:3,difference:{snapshot:null,geo:null}};
const layer={minzoom:0};
let zoom=4.5;
const geoMap={getLayer:()=>layer,getLayoutProperty:()=> 'visible',getZoom:()=>zoom};
const geo={map:geoMap,geoApplied:new Set(['counties','states'])};st.difference.geo=geo;
const env={st,countyThreshold:()=>5.5,console,Math,Number};
vm.createContext(env);vm.runInContext(geoSource+'\n'+diffGeo,env);
assert.equal(env.exportGeographyVisibility(geo,geoMap).counties,false,'panel export uses actual zoom threshold, not stale layer.minzoom');
assert.equal(env.differenceGeoVisibility(geoMap).counties,false,'difference export uses actual zoom threshold, not stale layer.minzoom');
zoom=5.75;
assert.equal(env.exportGeographyVisibility(geo,geoMap).counties,true,'panel counties appear when visibly enabled');
assert.equal(env.differenceGeoVisibility(geoMap).counties,true,'difference counties appear when visibly enabled');
st.cfg.display.showCountiesOnZoom=false;
assert.equal(env.exportGeographyVisibility(geo,geoMap).counties,false,'disabled counties never appear in panel export');
assert.equal(env.differenceGeoVisibility(geoMap).counties,false,'disabled counties never appear in difference export');
assert.match(src,/const frozenGeography=exportGeographyVisibility\(p,map\)/,'snapshot happens before resize');
assert.match(src,/captureExportGeography\(p,map,canvas\.width,canvas\.height,frozenGeography\)/,'panel export preserves frozen visibility');
assert.match(src,/if\(!frozenGeography\.counties\)/,'all exports enforce the on-screen county state');
assert.match(src,/for\(const \[id\] of hiddenCountyLayers\)map\.setLayoutProperty\(id,'visibility','none'\)/,'both layers hidden during capture');
assert.match(src,/for\(const \[id,visibility\] of hiddenCountyLayers\)/,'county layers restored afterward');
assert.match(src,/const visible=differenceGeoVisibility\(map\)/,'difference freezes original live visibility');

// Render precisely the same export-size sampled pixels with a fast Mercator
// row lookup and the full per-pixel fallback. Mock 2D and Globe to share the
// same mathematical transform so pixel equality can be checked byte-for-byte.
const runner=section('function differenceExportLongitudeScanline(', 'async function exportDifferencePNG(');
const calls=[];
const canvasFactory=()=>{
 const canvas={width:0,height:0,sampled:null};
 const ctx={imageSmoothingEnabled:false,imageSmoothingQuality:'',
  createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
  putImageData(data){canvas.sampled=data.data;},drawImage(){}};
 canvas.getContext=()=>ctx;calls.push(canvas);return canvas;
};
const env2={st,document:{createElement:()=>canvasFactory()},console,Math,Number,Float64Array,Uint8ClampedArray,
 requestAnimationFrame:fn=>fn(),DIFFERENCE_COLORS:['#162e69','#eeeeee','#bb3245'],
 differenceZeroOpacity:()=>1,
 differenceSampleValue:(field,lon,lat)=>field.sampleField(lon,lat)};
vm.createContext(env2);vm.runInContext(runner,env2);
function fakeMap(bearing=0){
 let unprojects=0;
 return {getCanvas:()=>({clientWidth:300,clientHeight:180}),
  getContainer:()=>({clientWidth:300,clientHeight:180}),
  getBearing:()=>bearing,getPitch:()=>0,getProjection:()=>({type:'mercator'}),
  isPointOnSurface:()=>true,
  unproject:([x,y])=>{unprojects++;return {lng:-117+x*.025,lat:26+y*.08};},
  count:()=>unprojects};
}
(async()=>{
 st.cfg.display.showCountiesOnZoom=true;
 const snapshot={rawDifference:{sampleField:(lng,lat)=>lng/31+lat/23},range:10,seq:3};
 st.difference.snapshot=snapshot;
 const mapFast=fakeMap(),mapFallback=fakeMap();
 st.mode='2d';calls.length=0;
 await env2.differenceExportRaster(mapFast,snapshot,600,360);
 const fast=Uint8ClampedArray.from(calls[0].sampled);
 st.mode='globe';calls.length=0;
 await env2.differenceExportRaster(mapFallback,snapshot,600,360);
 const slow=Uint8ClampedArray.from(calls[0].sampled);
 assert.deepEqual(fast,slow,'Mercator scanlines preserve the existing export raster pixels byte-for-byte');
 assert.ok(mapFast.count()<400,'2D scanline does not inversely project every pixel');
 assert.ok(mapFallback.count()>50000,'Globe retains full per-pixel unprojection');
 st.mode='2d';const rotated=fakeMap(8);
 assert.equal(env2.differenceExportLongitudeScanline(rotated,300,300,180),null,'rotation falls back to full projection');
 assert.match(src,/const divisor=interactive\?3:2;/,'export sampling resolution unchanged');
 console.log(`PASS export county snapshots and accelerated 2D difference raster: ${mapFast.count()} vs ${mapFallback.count()} inverse projections; identical pixels`);
})().catch(err=>{console.error(err);process.exitCode=1;});
