'use strict';
const assert=require('node:assert/strict');
const {Encoder,adaptivePalette}=require('../js/gif-export');
const w=320,h=96,rgba=new Uint8ClampedArray(w*h*4);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const i=(y*w+x)*4;
 rgba[i]=Math.round(x*255/(w-1));
 rgba[i+1]=Math.round(y*255/(h-1));
 rgba[i+2]=(x+y*3)%256;
 rgba[i+3]=255;
}
const indexed=adaptivePalette(rgba,w,h);
assert.equal(indexed.colorCount,256,'Adaptive palette fills the available GIF color table');
assert(new Set(indexed.indices).size>200,'Gradient uses at least 200 palette colors');
const encoder=new Encoder(w,h);encoder.addRGBA(rgba,500);encoder.addRGBA(rgba,1000);
const gif=encoder.finish();
assert.equal(Buffer.from(gif.slice(0,6)).toString(),'GIF89a');
let descriptorCount=0;
for(let i=0;i<gif.length-10;i++)if(gif[i]===0x2c&&gif[i+9]===0x87)descriptorCount++;
assert.equal(descriptorCount,2,'Each GIF frame carries its own 256-color local table');
console.log('PASS adaptive per-frame GIF palettes, 256 bins, gradient utilization, and multi-frame local palettes');
