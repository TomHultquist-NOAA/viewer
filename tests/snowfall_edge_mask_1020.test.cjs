'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const a=src.indexOf('function snowfallShadeData(data,field,metadata,shape)');
const b=src.indexOf('function vorticityShadeData(',a);
assert(a>=0&&b>a);
const ctx=vm.createContext({Float32Array,Math,Number,st:{colorRanges:new Map()}});
vm.runInContext(src.slice(a,b),ctx);
const shade=(input,field='snow1h',threshold=.01,ny=7,nx=7)=>{
 ctx.input=input;ctx.fieldName=field;ctx.threshold=threshold;ctx.shape=[1,ny,nx];
 return vm.runInContext('snowfallShadeData(input,fieldName,{levels:[threshold]},shape)',ctx);
};
const n=7,original=new Float32Array(n*n).fill(-1e10);
// Single unsupported trace sample adjacent to NO DATA must vanish.
original[1*n+1]=.015;
// A coherent three-by-three trace snow area must survive (at least its core).
for(let y=3;y<6;y++)for(let x=3;x<6;x++)original[y*n+x]=.016;
// A relatively strong snow amount must survive even when isolated.
original[0*n+6]=1.2;
// Other nonphysical, inconsistent no-data sentinel values must normalize.
original[0*n+0]=-9999;
original[0*n+1]=NaN;
original[0*n+2]=-.0005;
original[0*n+3]=0;
original[0*n+4]=.00002;
const before=original.slice();
const output=shade(original);
assert.notStrictEqual(output,original);
assert.equal(output[1*n+1],-1e10,'single near-zero speckle filtered');
assert(Math.abs(output[4*n+4]-.016)<1e-6,'coherent snow area preserved');
assert(Math.abs(output[0*n+6]-1.2)<1e-6,'meaningful snowfall preserved');
for(const i of [0,1,2,3,4])assert.equal(output[i],-1e10,'different invalid/trace sentinel normalized');
for(let i=0;i<before.length;i++){
 if(Number.isNaN(before[i]))assert(Number.isNaN(original[i]));
 else assert.equal(original[i],before[i],'input original preserved');
}
assert.strictEqual(shade(original,'apcp'),original,'rain unmodified');
// Nonrectangular/corrupt dims should fall back to numerical threshold alone.
const fallback=shade(Float32Array.from([0,.02,-9999]),'snow6h',.1,2,4);
assert.deepEqual(Array.from(fallback),[-1e10,-1e10,-1e10]);
assert.match(src,/snowfallShadeData\(vorticityShadeData\(p,ds,v,h,m,data\),st\.field,m,v\.shape\)/,'actual plot uses geographic grid shape');
assert.match(src,/p\.rawField=rawField/,'hover and contour paths retain unmodified scalar data');
console.log('PASS missing-data normalization, trace speckle support, scientific value preservation');
