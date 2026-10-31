'use strict';
// Regression for the v1.0.10 GIF scanline-striping bug: 0xF7 incorrectly
// enabled the four-pass interlace flag for normal, top-to-bottom pixel order.
// Independently parse GIF descriptors, LZW-decode pixels, and verify both
// frames exactly match the encoder's quantized indices.
const assert = require('node:assert/strict');
const { Encoder, adaptivePalette } = require('../js/gif-export.js');

function parseGif(data) {
  const bytes=Buffer.from(data),read16=i=>bytes[i]|(bytes[i+1]<<8);
  assert.equal(bytes.toString('ascii',0,6),'GIF89a');
  const w=read16(6),h=read16(8);
  let pos=13;
  if(bytes[10]&0x80)pos+=3*(1<<((bytes[10]&7)+1));
  const frames=[];let frameDelay=0,loop=false;
  while(pos<bytes.length){
    const type=bytes[pos++];
    if(type===0x3b)break;
    if(type===0x21){
      const label=bytes[pos++];
      if(label===0xf9){
        assert.equal(bytes[pos++],4);pos++;frameDelay=read16(pos)*10;pos+=2;
        pos+=2; // transparent index and GCE terminator
        continue;
      }
      if(label===0xff)loop=true;
      while(true){const n=bytes[pos++];if(!n)break;pos+=n;}
      continue;
    }
    assert.equal(type,0x2c,'Unexpected GIF block');
    const left=read16(pos),top=read16(pos+2),fw=read16(pos+4),fh=read16(pos+6),packed=bytes[pos+8];pos+=9;
    assert.equal(left,0);assert.equal(top,0);assert.equal(fw,w);assert.equal(fh,h);
    assert.equal(packed&0x80,0x80,'Each frame must include an adaptive local color table');
    assert.equal(packed&0x40,0,'Normal row-major pixels MUST NOT be flagged as interlaced');
    assert.equal(packed&0x20,0,'Palette sorting bit is unnecessary');
    assert.equal(packed&7,7,'Expected 256 entries');
    pos+=3*(1<<((packed&7)+1));
    const minSize=bytes[pos++],compressed=[];
    while(true){const n=bytes[pos++];if(!n)break;
      for(let i=0;i<n;i++)compressed.push(bytes[pos+i]);pos+=n;}
    frames.push({data:Uint8Array.from(compressed),minSize,delay:frameDelay});
  }
  assert.equal(pos,bytes.length,'No trailing junk after GIF trailer');
  assert(loop,'GIF should loop');
  return {w,h,frames};
}
function decodeLZW(compressed,minSize,expectedPixels) {
  const clear=1<<minSize,end=clear+1;
  let codeSize=minSize+1,nextCode=end+1,dict=new Map();
  const reset=()=>{dict=new Map();for(let i=0;i<clear;i++)dict.set(i,[i]);nextCode=end+1;codeSize=minSize+1;};
  reset();let pos=0,previous=null;const pixels=[];let finished=false;
  while(pos+codeSize<=compressed.length*8){
    let value=0;
    for(let i=0;i<codeSize;i++){const bit=pos+i;value|=((compressed[bit>>3]>>(bit&7))&1)<<i;}
    pos+=codeSize;
    if(value===clear){reset();previous=null;continue;}
    if(value===end){finished=true;break;}
    let sequence=dict.get(value);
    if(sequence===undefined&&previous&&value===nextCode)sequence=[...previous,previous[0]];
    assert(sequence,`Invalid LZW code ${value} at bit ${pos}`);
    pixels.push(...sequence);
    if(previous&&nextCode<4096){dict.set(nextCode++,[...previous,sequence[0]]);
      if(nextCode===(1<<codeSize)&&codeSize<12)codeSize++;}
    previous=sequence;
    assert(pixels.length<=expectedPixels,'LZW decoded excessive pixels');
  }
  assert(finished,'GIF must include explicit LZW end code');
  assert.equal(pixels.length,expectedPixels,'Image must have exact number of pixels');
  return pixels;
}
const w=260,h=112,source=[];
for(let frame=0;frame<3;frame++){
  const rgba=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const k=(y*w+x)*4;
    rgba[k]=(x*5+y*2+frame*17)%256;
    rgba[k+1]=(y*7+frame*31)%256;
    rgba[k+2]=(x*3+y*11+frame*7)%256;
    rgba[k+3]=255;
  }
  source.push(rgba);
}
const encoder=new Encoder(w,h);
source.forEach((rgba,i)=>encoder.addRGBA(rgba,i===source.length-1?1000:500));
const gif=parseGif(encoder.finish());
assert.equal(gif.frames.length,3);
assert.deepEqual(gif.frames.map(f=>f.delay),[500,500,1000]);
source.forEach((rgba,i)=>{
  const expected=adaptivePalette(rgba,w,h).indices;
  const got=decodeLZW(gif.frames[i].data,gif.frames[i].minSize,w*h);
  assert.deepEqual(Uint8Array.from(got),expected,`Frame ${i} scanline positions match original quantized image`);
});
console.log('PASS GIF header noninterlaced, independently decoded scanline order, adaptive palette, three frames, and final hold');
