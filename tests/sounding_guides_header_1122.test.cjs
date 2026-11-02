'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/point-inspector.js'),'utf8');

// Use the actual chart frame implementation, with a recording canvas context.
const start=source.indexOf(' function frame(ctx,canvas,title,subtitle){');
const end=source.indexOf('\n function axis(',start);
assert.ok(start>=0&&end>start,'frame function available');
const frameSource=source.slice(start,end);
for(const theme of ['light','dark']){
 const draw=[];
 const ctx={textAlign:'center',textBaseline:'middle',fillRect(){},fillText(text,x,y){
  draw.push({text,x,y,align:this.textAlign,baseline:this.textBaseline});
 }};
 const state={theme};
 const frame=vm.runInNewContext(`(function(st){${frameSource};return frame;})`,{Math})(state);
 frame(ctx,{width:1480,height:900},'RRFS / Vertical profile','Valid 2026-10-28 12:00Z · 44.861°N, 93.325°W');
 assert.equal(ctx.textAlign,'left','canvas header must override prior centered alignment');
 assert.equal(ctx.textBaseline,'alphabetic','canvas header must override prior baseline');
 assert.deepEqual(draw.map(x=>x.x),[42,43],'header anchor within chart bounds');
 assert.ok(draw.every(x=>x.align==='left'),'both title and metadata left-aligned');
 ctx.textAlign='right';
 frame(ctx,{width:1480,height:900},'RRFS / Vertical profile','Valid next hour · 44.861°N, 93.325°W');
 assert.ok(draw.slice(-2).every(x=>x.align==='left'),'refresh resets canvas alignment again');
}

function luminance(hex){
 const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));
 return c[0]*0.2126+c[1]*0.7152+c[2]*0.0722;
}
function contrast(a,b){
 const [lo,hi]=[luminance(a),luminance(b)].sort((x,y)=>x-y);return (hi+0.05)/(lo+0.05);
}
const dry=source.match(/path\(points,light\?'(#[0-9a-f]{6})':'(#[0-9a-f]{6})',(\d+(?:\.\d+)?)\);\s*\n\s*}\s*\n\s*\/\/ Mixing-ratio guides/);
assert.ok(dry,'dry-adiabat line palette found');
const mixing=source.match(/path\(points,light\?'(#[0-9a-f]{6})':'(#[0-9a-f]{6})',(\d+(?:\.\d+)?),\[4,7\]\);/);
assert.ok(mixing,'mixing-ratio guide line palette found');
for(const [name,palette] of [['dry',dry],['mixing',mixing]]){
 assert.ok(contrast(palette[1],'#f4f7fb')>1.65,`${name} legible on light background`);
 assert.ok(contrast(palette[2],'#15263a')>2.2,`${name} legible on dark background`);
 assert.ok(Number(palette[3])>=1.15,`${name} line weight increased`);
}
console.log('PASS sounding guide contrast and retained-canvas title/valid-time alignment in light and dark mode');
