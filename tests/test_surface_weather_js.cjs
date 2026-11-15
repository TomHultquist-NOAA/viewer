'use strict';
const assert=require('node:assert/strict');
const lib=require('../js/surface-weather-overlay.js');
const empty=lib.validFeatures(null);
assert.equal(empty.length,0);
assert.equal(lib.validFeatures({type:'FeatureCollection',features:[
  {type:'Feature',geometry:{type:'Point',coordinates:[-99,37]},properties:{type:'low',pressure_hpa:999}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-99,37]},properties:{type:'malicious'}}
]}).length,1);
let drawCount=0,events=new Map(),abortCount=0,fetchCount=0;
const canvas={width:0,height:0,clientWidth:640,clientHeight:480,style:{},remove(){},getContext(){return ctx}};
const ctx={canvas,clearRect(){drawCount++},setTransform(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},setLineDash(){},fill(){},closePath(){},strokeText(){},fillText(){}};
global.getComputedStyle=()=>({position:'relative'});
global.document={createElement:(tag)=>{
 if(tag==='canvas')return canvas;
 return {style:{},appendChild(){},addEventListener(){},set type(x){this._type=x},checked:false};
},createTextNode:()=>({})};
global.requestAnimationFrame=(cb)=>{cb();return 2};
global.cancelAnimationFrame=()=>{};
global.devicePixelRatio=2;
const container={style:{},appendChild(){},getBoundingClientRect(){return {width:640,height:480}}};
const map={project(x){return{x:(x.lng+180)*3,y:(90-x.lat)*3}},on(k,fn){events.set(k,fn)},off(k){events.delete(k)},getCenter(){return{lng:-100}},getContainer(){return container}};
(async()=>{
 global.fetch=async(url,opt)=>{fetchCount++;return {ok:true,async json(){return {type:'FeatureCollection',features:[
  {type:'Feature',geometry:{type:'LineString',coordinates:[[-105,35],[-100,36],[-95,35]]},properties:{type:'cold_front',confidence:.8,symbol_side:1}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-101,38]},properties:{type:'low',pressure_hpa:1002,confidence:.8}}
]}}}};
 const o=new lib.SurfaceWeatherOverlay(map,{baseUrl:'data/surface_weather'});
 await o.setFrame('rrfs','20261114','12',3);
 assert.ok(o._features.length===2);
 assert.ok(drawCount>0);
 assert.ok(o.canvas.width===960); // DPR limited to 1.5
 await o.setFrame('rrfs','20261114','12',3);
 assert.equal(fetchCount,1);
 o.setSettings({fronts:false});
 assert.equal(o.settings.fronts,false);
 o.dispose();
 assert.ok(events.size===0);
 console.log('surface_weather_overlay.js tests passed');
})().catch(e=>{console.error(e);process.exit(1)});
