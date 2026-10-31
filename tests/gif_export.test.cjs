'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {Encoder}=require('../js/gif-export.js');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const src=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
for(const id of ['exportGifOptions','exportGifStart','exportGifEnd','exportGifDelay','exportGifStep'])assert.match(html,new RegExp(`id="${id}"`));
assert.match(html,/js\/gif-export\.js\?v=1\.0\.20-/);
assert.match(src,/i===opt\.hours\.length-1\?500:0/);
assert.match(src,/await exportAll\(ratio,true\):await exportPanel\(panel,ratio,true\)/);
assert.match(src,/st\.hour=original;syncUI\(\);await renderAll\(\)/);
assert.match(src,/const maxFrames=high\?19:25/);
let e=new Encoder(12,10);
for(let k=0;k<3;k++){
 const pixels=new Uint8ClampedArray(12*10*4);
 for(let i=0;i<12*10;i++){pixels[4*i]=(k*83+i*3)%256;pixels[4*i+1]=i*11%256;pixels[4*i+2]=220;pixels[4*i+3]=255;}
 e.addRGBA(pixels,k===2?1000:500);
}
const bytes=e.finish();assert.equal(Buffer.from(bytes.subarray(0,6)).toString(),'GIF89a');assert.equal(bytes[bytes.length-1],0x3b);
const gc=[];for(let i=0;i<bytes.length-7;i++)if(bytes[i]===0x21&&bytes[i+1]===0xf9&&bytes[i+2]===4){gc.push(bytes[i+4]+256*bytes[i+5]);}
assert.deepEqual(gc,[50,50,100]);
console.log('PASS GIF container, independent forecast-hour controls, last-frame hold, PNG retention, and state restoration');
