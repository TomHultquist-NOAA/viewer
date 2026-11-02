'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const code=src.slice(src.indexOf('function exportGeographyVisibility('),src.indexOf('async function captureMapPNG('));
const render=src.slice(src.indexOf('async function redrawDifferenceBoundaries('),src.indexOf('async function differenceExportRaster('));
assert.ok(code.startsWith('function exportGeographyVisibility('));
assert.ok(render.startsWith('async function redrawDifferenceBoundaries('));
const calls=[];
function canvas(){
 const ctx={
  lineJoin:'',lineCap:'',globalAlpha:1,strokeStyle:'',lineWidth:1,
  save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},
  stroke(){calls.push({color:this.strokeStyle,width:this.lineWidth,alpha:this.globalAlpha});}
 };
 return {width:960,height:600,getContext:()=>ctx};
}
const st={theme:'dark',mode:'2d'};
const map={
 getContainer:()=>({clientWidth:480,clientHeight:300}),
 project:coord=>({x:coord[0],y:coord[1]}),
 getCenter:()=>({lng:-93,lat:45}),getZoom:()=>6,getBearing:()=>0,getPitch:()=>0,
 getLayer:id=>({minzoom:0}),getLayoutProperty:(id,k)=>'visible'
};
const geo={type:'FeatureCollection',features:[{geometry:{type:'LineString',coordinates:[[20,50],[120,60],[230,70]]}}]};
const world={st,document:{createElement:()=>canvas()},themeColors:()=>({minor:'#557788',line:'#99aabb',boundaryCasing:'#122533'}),geoData:async()=>geo,map,console};
const c=vm.createContext(world);
vm.runInContext(render+'\n'+code,c);
(async()=>{
 for(const theme of ['dark','light']){
  st.theme=theme;calls.length=0;
  await c.redrawDifferenceBoundaries(canvas(),map,{exportGeoVisible:{coast:true,states:true,counties:false},exportStyle:false});
  assert.equal(calls.length,4,'two strokes per geography layer (casing then inner stroke)');
  assert.equal(calls[0].color,'#122533','themed casing color for live/export style');
  assert.equal(calls[1].color,'#99aabb','themed inner stroke preserves live palette');
  assert.ok(calls[0].width>calls[1].width,'casing extends outside inner stroke');
  assert.ok(calls[2].width>calls[3].width,'state outline also has a casing');
 }
 calls.length=0;
 await c.redrawDifferenceBoundaries(canvas(),map,{exportGeoVisible:{coast:true,counties:false}});
 assert.equal(calls.length,2,'live difference map uses a subtle contrast casing and inner stroke');
 assert.equal(calls[0].color,'#122533','live casing is dark');
 assert.equal(calls[1].color,'#99aabb','live inner stroke preserves themed colors');
 assert.ok(calls[0].width>calls[1].width,'live casing remains wider than its inner stroke');
 st.theme='dark';
 const p={geoApplied:new Set(['coast','states']),exportGeographyCache:null};
 calls.length=0;
 const first=await c.captureExportGeography(p,map,960,600);
 assert.ok(first);assert.equal(calls.length,4);
 const cached=await c.captureExportGeography(p,map,960,600);
 assert.equal(cached,first,'reuses exact overlay when GIF camera is unchanged');
 assert.equal(calls.length,4,'no redundant geography work for repeated frames');
 map.getZoom=()=>7;
 const moved=await c.captureExportGeography(p,map,960,600);
 assert.notEqual(moved,first,'camera change invalidates geography cache');
 p.geoApplied=new Set();
 assert.equal(await c.captureExportGeography(p,map,960,600),null,'do not invent absent geographies');
 assert.match(src,/drawWindExport\(ctx,captured\.geography,rect,im\);\s*drawWindExport\(ctx,captured\.wind,rect,im\);/,
  'draw two-tone outlines after map raster and before wind/contours');
 assert.match(src,/redrawDifferenceBoundaries\(image,map,\{exportGeoVisible:visible,exportStyle:false\}\)/,
  'difference export uses the same two-tone outlines as the live viewer');
 assert.match(src,/try\{exportGeography=await captureExportGeography\(/,
  'map export renders optional geography without blocking when unavailable');
 assert.match(src,/const frozenGeography=exportGeographyVisibility\(p,map\)/,
  'no counties added by temporary higher-res zoom');
 console.log('PASS all export types use the live two-tone geography treatment, with cache and visibility honored');
})().catch(e=>{console.error(e);process.exitCode=1});
