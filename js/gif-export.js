/* Browser-only GIF89a encoder for OMD EVU forecast animations.
 * Per-frame adaptive median-cut palettes (up to 256 RGB colors) use local
 * GIF color tables. This preserves map legends better than a fixed RGB332
 * palette while retaining deterministic, dependency-free LZW encoding.
 */
(function(root){
 'use strict';
 class Bytes{
  constructor(){this.a=[];}
  byte(x){this.a.push(x&255);}
  word(x){this.byte(x);this.byte(x>>8);}
  ascii(s){for(let i=0;i<s.length;i++)this.byte(s.charCodeAt(i));}
  write(arr){for(let i=0;i<arr.length;i++)this.byte(arr[i]);}
  data(){return Uint8Array.from(this.a);}
 }
 const BITS=6,CHANNELS=1<<BITS,SHIFT=8-BITS,HIST_SIZE=CHANNELS*CHANNELS*CHANNELS;
 function pixelRGB(rgba,offset){
  const alpha=rgba[offset+3];
  if(alpha===255)return [rgba[offset],rgba[offset+1],rgba[offset+2]];
  if(alpha===0)return [255,255,255];
  const a=alpha/255,inv=1-a;
  return [Math.round(rgba[offset]*a+255*inv),Math.round(rgba[offset+1]*a+255*inv),Math.round(rgba[offset+2]*a+255*inv)];
 }
 function colorBin(r,g,b){return ((r>>SHIFT)<<(BITS*2))|((g>>SHIFT)<<BITS)|(b>>SHIFT);}
 function makeBox(items){
  let r0=255,g0=255,b0=255,r1=0,g1=0,b1=0,weight=0;
  for(const item of items){r0=Math.min(r0,item.r);r1=Math.max(r1,item.r);g0=Math.min(g0,item.g);g1=Math.max(g1,item.g);b0=Math.min(b0,item.b);b1=Math.max(b1,item.b);weight+=Math.sqrt(item.count);}
  const range=[r1-r0,g1-g0,b1-b0],axis=range.indexOf(Math.max(...range));
  return {items,axis,weight,score:Math.max(...range)*Math.sqrt(weight),canSplit:items.length>1};
 }
 function adaptivePalette(rgba,width,height){
  if(!rgba||rgba.length!==width*height*4)throw Error('Invalid GIF RGBA frame');
  // Slightly quantized histogram drastically reduces quantizer memory without
  // throwing away the color-bar detail as RGB332 (3:3:2) did.
  const counts=new Uint32Array(HIST_SIZE);
  for(let i=0;i<rgba.length;i+=4){const [r,g,b]=pixelRGB(rgba,i);counts[colorBin(r,g,b)]++;}
  const bins=[];
  for(let key=0;key<counts.length;key++)if(counts[key]){
   const r=((key>>(BITS*2))&(CHANNELS-1))<<SHIFT;
   const g=((key>>BITS)&(CHANNELS-1))<<SHIFT;
   const b=(key&(CHANNELS-1))<<SHIFT;
   bins.push({key,count:counts[key],r:r+2,g:g+2,b:b+2});
  }
  if(!bins.length)throw Error('Empty GIF image');
  const boxes=[makeBox(bins)];
  while(boxes.length<256){
   let best=-1,score=-1;
   for(let i=0;i<boxes.length;i++)if(boxes[i].canSplit&&boxes[i].score>score){best=i;score=boxes[i].score;}
   if(best<0)break;
   const target=boxes.splice(best,1)[0],axis=['r','g','b'][target.axis];
   target.items.sort((a,b)=>a[axis]-b[axis]);
   const midWeight=target.weight/2;let total=0,split=1;
   for(let i=0;i<target.items.length-1;i++){
    total+=Math.sqrt(target.items[i].count);
    if(total>=midWeight){split=i+1;break;}
   }
   boxes.push(makeBox(target.items.slice(0,split)),makeBox(target.items.slice(split)));
  }
  const palette=new Uint8Array(768);
  for(let i=0;i<boxes.length;i++){
   let sum=0,r=0,g=0,b=0;
   for(const item of boxes[i].items){const n=item.count;sum+=n;r+=item.r*n;g+=item.g*n;b+=item.b*n;}
   palette[3*i]=Math.max(0,Math.min(255,Math.round(r/sum)));
   palette[3*i+1]=Math.max(0,Math.min(255,Math.round(g/sum)));
   palette[3*i+2]=Math.max(0,Math.min(255,Math.round(b/sum)));
  }
  // Cache nearest-palette color per occupied 6:6:6 RGB bin. A full 24-bit
  // per-pixel nearest-color search would be needlessly expensive at 1600px.
  const table=new Int16Array(HIST_SIZE);table.fill(-1);
  for(const item of bins){
   let min=Infinity,best=0;
   for(let j=0;j<boxes.length;j++){
    const d=j*3,dr=item.r-palette[d],dg=item.g-palette[d+1],db=item.b-palette[d+2];
    const dist=dr*dr*.29+dg*dg*.59+db*db*.12;
    if(dist<min){min=dist;best=j;}
   }
   table[item.key]=best;
  }
  const indices=new Uint8Array(width*height);
  for(let i=0,j=0;i<indices.length;i++,j+=4){
   const [r,g,b]=pixelRGB(rgba,j);
   indices[i]=table[colorBin(r,g,b)];
  }
  return {palette,indices,colorCount:boxes.length};
 }
 function lzw(indices){
  const clear=256,end=257,MAX=4096;
  let width=9,next=258,dict=new Map(),bits=0,bitCount=0;
  const data=[];
  function write(code){bits|=code<<bitCount;bitCount+=width;while(bitCount>=8){data.push(bits&255);bits>>>=8;bitCount-=8;}}
  function reset(){dict=new Map();width=9;next=258;}
  write(clear);
  if(indices.length){
   let prefix=indices[0];
   for(let i=1;i<indices.length;i++){
    const suffix=indices[i],key=(prefix<<8)|suffix;
    const code=dict.get(key);
    if(code!==undefined){prefix=code;continue;}
    write(prefix);
    if(next<MAX){dict.set(key,next++);
     if(next>(1<<width)&&width<12)width++;
    }else{write(clear);reset();}
    prefix=suffix;
   }
   write(prefix);
  }
  write(end);if(bitCount)data.push(bits&255);
  return Uint8Array.from(data);
 }
 class Encoder{
  constructor(width,height){
   if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>4096||height>4096)throw Error('Invalid GIF dimensions');
   this.width=width;this.height=height;this.frames=0;this.bytes=new Bytes();const b=this.bytes;
   // A tiny global palette is required for compatibility; each frame carries
   // its own FULL 256-color palette in the image descriptor's local table.
   b.ascii('GIF89a');b.word(width);b.word(height);b.byte(0x80);b.byte(0);b.byte(0);
   b.write([0,0,0,255,255,255]);
   b.byte(0x21);b.byte(0xff);b.byte(11);b.ascii('NETSCAPE2.0');b.byte(3);b.byte(1);b.word(0);b.byte(0);
  }
  addRGBA(rgba,delayMs=500){
   const b=this.bytes,w=this.width,h=this.height,delay=Math.max(1,Math.min(65535,Math.round(delayMs/10)));
   const {palette,indices}=adaptivePalette(rgba,w,h);
   b.byte(0x21);b.byte(0xf9);b.byte(4);b.byte(0x08);b.word(delay);b.byte(0);b.byte(0);
   b.byte(0x2c);b.word(0);b.word(0);b.word(w);b.word(h);// Bit 7 enables the local 256-color table; bits 0-2 encode its size.
   // Bits 6 and 5 MUST be zero: our pixels are in ordinary scanline order,
   // not GIF's four-pass interlaced order. 0xf7 incorrectly requested both
   // interlacing and a sorted palette, producing severe horizontal striping.
   b.byte(0x87);b.write(palette);
   b.byte(8);const compressed=lzw(indices);
   for(let i=0;i<compressed.length;i+=255){const n=Math.min(255,compressed.length-i);b.byte(n);b.write(compressed.subarray(i,i+n));}
   b.byte(0);this.frames++;
  }
  finish(){if(!this.frames)throw Error('No GIF frames were encoded');const b=this.bytes;b.byte(0x3b);return b.data();}
 }
 const api={Encoder,adaptivePalette,indexRGB:(rgba,w,h)=>adaptivePalette(rgba,w,h).indices,lzw};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.EVUGif=api;
})(typeof window!=='undefined'?window:null);
