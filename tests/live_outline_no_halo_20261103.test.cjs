'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
test('interactive MapLibre casings are disabled and field-specific colors and widths remain',()=>{
 const body=between('function updateLiveGeography(){','function mapStyle(){');
 const calls=[];const map={getLayer:()=>true,setPaintProperty:(...args)=>calls.push(args)};
 const ctx={st:{active:[{map,cfg:{differencePanel:true}}],difference:{open:false}},liveGeographyInk:()=>({line:'#ffffff',minor:'#dddddd'}),overlayStrokeColor:(_,c)=>c,overlayStrokeWidth:(_,w)=>w};
 vm.runInNewContext(body+'\nupdateLiveGeography();',ctx);
 const casings=calls.filter(c=>c[0].endsWith('-casing')&&c[1]==='line-opacity');
 assert.equal(casings.length,6);assert.ok(casings.every(c=>c[2]===0));
 assert.ok(calls.some(c=>c[0]==='coast'&&c[1]==='line-color'&&c[2]==='#ffffff'));
 assert.ok(calls.some(c=>c[0]==='states'&&c[1]==='line-width'));
 assert.match(source,/updateLiveGeography\(\);\s*diff\.geo=/);
});
test('floating live difference uses single strokes but PNG export keeps two-tone',async()=>{
 assert.match(source,/redrawDifferenceBoundaries\(lines,map,\{exportGeoVisible:visible,liveNoHalo:true\}\)/);
 assert.match(source,/redrawDifferenceBoundaries\(outlines,map,\{exportGeoVisible:visible,exportStyle:false\}\)/);
 const render=between('async function redrawDifferenceBoundaries(','// A zero-bearing/pitch 2D Mercator view');
 let strokes=0;const context={st:{mapOutlines:true},themeColors:()=>({line:'#ccc',minor:'#bbb',boundaryCasing:'#111'}),geoData:async()=>({features:[{geometry:{type:'LineString',coordinates:[[1,1],[9,9]]}}]}),overlayStrokeWidth:(_,v)=>v,overlayStrokeColor:(_,v)=>v};
 const map={getContainer:()=>({clientWidth:100,clientHeight:100}),project:p=>({x:p[0],y:p[1]})};
 const canvas={width:100,height:100,getContext:()=>({save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++;}})};
 vm.runInNewContext(render,context);
 await context.redrawDifferenceBoundaries(canvas,map,{exportGeoVisible:{coast:true},liveNoHalo:true});assert.equal(strokes,1);
 strokes=0;await context.redrawDifferenceBoundaries(canvas,map,{exportGeoVisible:{coast:true},exportStyle:false});assert.equal(strokes,2);
});
