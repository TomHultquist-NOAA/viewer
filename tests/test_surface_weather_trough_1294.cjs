'use strict';
const assert=require('node:assert/strict');
const {drawFeature}=require('../js/surface-weather-overlay.js');
const strokes=[];let color='',dash=[];
const ctx={canvas:{clientWidth:900,clientHeight:550},lineWidth:1,
 set strokeStyle(v){color=v},get strokeStyle(){return color},
 setLineDash(v){dash=v.slice()},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes.push({color,dash:dash.slice()})},lineCap:'',lineJoin:''};
const map={project(p){return {x:(p.lng+180)*3,y:(80-p.lat)*3}}};
const f=type=>({type:'Feature',geometry:{type:'LineString',coordinates:[[-106,40],[-95,38]]},properties:{type,confidence:0.9,symbol_side:1}});
const settings={troughs:true,drylines:true,fronts:true,centers:true,pressure:true,minimumConfidence:.3};
drawFeature(ctx,map,f('trough'),settings,-100,1);
assert.deepEqual(strokes[0],{color:'#000000',dash:[8,7]});
strokes.length=0;
// dryline uses a brown solid base; the separate scallops are brown too
ctx.arc=()=>{};ctx.fill=()=>{};ctx.closePath=()=>{};
drawFeature(ctx,map,f('dryline'),settings,-100,1);
assert.deepEqual(strokes[0],{color:'#a25b2c',dash:[]});
console.log('PASS: troughs black dashed; drylines brown solid/scalloped');
