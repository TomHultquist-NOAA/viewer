'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const segment=(start,end)=>{
 const a=src.indexOf(start),b=src.indexOf(end,a);
 assert(a>=0&&b>a,`missing ${start} .. ${end}`);
 return src.slice(a,b);
};
const context=vm.createContext({console,Float32Array,Math,Number});
// Execute the actual shipped contour calculation and drawing code in isolation.
vm.runInContext(segment('const CONTOUR_STEPS=', 'function scheduleContourRedraw('), context);
for(const [field,base,min,max] of [
 ['mslp',4,968,1042],['h925',30,500,950],['h850',30,900,1720],
 ['h700',30,2000,3500],['h500',60,4900,6000]]){
 const got=vm.runInContext(`contourInterval('${field}',3)`,context);
 assert.equal(got,base,`${field} conventional base contour`);
 for(const zoom of [2.5,4.5,7]){
  const levels=Array.from(vm.runInContext(`contourLevels('${field}',${min},${max},${zoom},500,350)`,context));
  assert(levels.length,`${field} should have contours`);
  assert(levels.every(v=>Math.abs(v/base-Math.round(v/base))<1e-7),`${field} levels must be integer multiples of ${base}: ${levels}`);
  const intervals=levels.slice(1).map((v,i)=>v-levels[i]);
  assert(intervals.every(v=>Math.abs(v/base-Math.round(v/base))<1e-7),`${field} spacing must be meteorologically conventional`);
 }
}
// Test actual rendering stroke and label colors and dash lengths. A simple
// gradient creates several full-length contour paths for each field.
function strokes(field,theme='dark'){
 const calls=[],ctx={
  save(){},restore(){},setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},translate(){},rotate(){},
  setLineDash(v){this.dash=[...v]},stroke(){calls.push({dash:[...(this.dash||[])],color:this.strokeStyle,width:this.lineWidth})},
  measureText(v){return{width:8*String(v).length}},strokeText(){},fillText(){}
 };
 const canvas={width:0,height:0,getContext(){return ctx}};
 const map={getContainer(){return{clientWidth:500,clientHeight:300}},getCanvas(){return{clientWidth:500,clientHeight:300}},getZoom(){return 4.2},isMoving(){return false},unproject([x,y]){return{lng:x,lat:y}}};
 const p={contourCanvas:canvas,map,cfg:{field},status:'ready'};
 context.st={theme,contours:true};
 context.devicePixelRatio=1;
 context.globeFrontVisible=()=>true;
 const value=field==='mslp'?x=>990+x*.12:field.startsWith('h')?x=>1300+x*1.0:x=>-10+x*.1;
 p.rawField={sampleField(x){return value(x)}};
 vm.runInContext('drawContours(p,{field:p.rawField,key:p.cfg.field,always:true})',Object.assign(context,{p}));
 return calls;
}
for(const h of ['h925','h850','h700','h500']){
 const got=strokes(h);assert(got.length>=2,`${h} needs visible height contours`);
 assert(got.every(c=>c.dash.length===0),`${h} height contours are solid`);
 assert.match(got[0].color,/255,255,255/,'height halo white');
 assert.match(got[1].color,/11,24,38/,'height core dark');
}
for(const t of ['t925','t850','t700']){
 for(const theme of ['dark','light']){
  const got=strokes(t,theme);assert(got.length>=2,`${t} needs contours`);
  assert(got.every(c=>JSON.stringify(c.dash)==='[6,4]'),`${t} scalar contours dashed`);
  assert.match(got[1].color,theme==='dark'?/251,253,255/:/15,30,45/,'scalar colors preserve original theme styling');
 }
}
for(const theme of ['dark','light']){
 const got=strokes('absv500',theme);
 assert(got.length>=2,'500 hPa absolute vorticity must draw optional contours');
 assert(got.every(c=>JSON.stringify(c.dash)==='[6,4]'),'500 hPa vorticity contours are dashed');
}
assert.equal(vm.runInContext('contoursAvailable("absv500")',context),true,'500 hPa Contours toggle must be available');
assert.equal(vm.runInContext('contourInterval("absv500",3)',context),10);
assert.equal(vm.runInContext('contourInterval("absv500",5)',context),5);
assert(strokes('mslp').every(c=>c.dash.length===0),'MSLP isobars stay solid');
// Check smoothing with native grid spacing. The original data and missing mask
// must remain unchanged, while an isolated gridpoint spike is substantially
// reduced by the display-only smooth.
vm.runInContext(segment('// 500-hPa absolute-vorticity SHADING only.', 'async function renderPanel('),context);
const smooth=(array,ny,nx,model,field='absv500',mode='forecast')=>{
 context.raw=array;context.ny=ny;context.nx=nx;
 context.model=model;context.fieldName=field;context.modeName=mode;
 const should=vm.runInContext('shouldSmoothVorticity(fieldName,model,modeName)',context);
 const output=vm.runInContext('smoothVorticityForDisplay(raw,ny,nx,{GRIB_DxInMetres:3000,GRIB_DyInMetres:3000})',context);
 return {should,output};
};
for(const [model,expected] of [['rrfs',true],['refs_m001',true],['refs_m005',true],['REFS m001',true],['REFS-m003',true],['REFS-4',true],['REFS member 5',true],['hrrr',true],['refs_mean',true],['REFS Mean',true],['REFS-mean',true],['rap',false]]){
 const result=smooth(new Float32Array(81).fill(8),9,9,model);
 assert.equal(result.should,expected,model);
}
// This is the real call path: panel source and dataset metadata differ.
context.st={field:'absv500'};
context.displayKey=()=> 'unique-vort-key';
context.displayCacheGet=()=>null;
context.displayCachePut=()=>{};
const chunk=new Float32Array(9*9).fill(10);chunk[40]=95;
context.vortCtx={p:{cfg:{source:'refs_m002',field:'absv500',timeMode:'forecast'},src:{}},
 ds:{model:'REFS m002',grid:{GRIB_DxInMetres:3000,GRIB_DyInMetres:3000}},
 v:{shape:[5,9,9]},h:1,m:{},raw:chunk};
const applied=vm.runInContext('vorticityShadeData(vortCtx.p,vortCtx.ds,vortCtx.v,vortCtx.h,vortCtx.m,vortCtx.raw)',context);
assert.notStrictEqual(applied,chunk,'REFS member panel must actually use smoothed shading');
assert(applied[40]<50,'REFS member smoothing must reduce a sharp peak');
context.vortCtx.p.cfg.source='refs_mean';context.vortCtx.ds.model='REFS Mean';
assert.notStrictEqual(vm.runInContext('vorticityShadeData(vortCtx.p,vortCtx.ds,vortCtx.v,vortCtx.h,vortCtx.m,vortCtx.raw)',context),chunk,'REFS Mean gets a light display smooth');
context.vortCtx.p.cfg.source='refs_m002';context.vortCtx.p.cfg.timeMode='analysis';
assert.strictEqual(vm.runInContext('vorticityShadeData(vortCtx.p,vortCtx.ds,vortCtx.v,vortCtx.h,vortCtx.m,vortCtx.raw)',context),chunk,'analysis excluded');
assert.equal(vm.runInContext('vorticitySmoothingMeters("absv500","rrfs","forecast")',context),12000);
assert.equal(vm.runInContext('vorticitySmoothingMeters("absv500","hrrr","forecast")',context),6000);
assert.equal(vm.runInContext('vorticitySmoothingMeters("absv500","refs_mean","forecast")',context),6000);
assert.equal(smooth(new Float32Array(81).fill(8),9,9,'rrfs','t850').should,false);
assert.equal(smooth(new Float32Array(81).fill(8),9,9,'rrfs','absv500','analysis').should,false);
const original=new Float32Array(41*41).fill(10);original[20*41+20]=90;
original[19*41+18]=NaN;original[19*41+19]=-9999999999;
const before=new Float32Array(original);
const {output}=smooth(original,41,41,'rrfs');
assert.notStrictEqual(output,original,'copy rather than mutate original');
assert.equal(output.length,original.length);
assert(output[20*41+20]<50 && output[20*41+20]>10,'display speckle smoothed but background preserved');
assert(Number.isNaN(output[19*41+18]),'NaN masked sample preserved');
assert(Number.isNaN(output[19*41+19]),'large missing-value marker preserved as missing');
assert.equal(original[20*41+20],before[20*41+20]);
assert(Number.isNaN(original[19*41+18]),'input mask not mutated');
assert.equal(original[19*41+19],before[19*41+19]);
assert.equal(output[0],10,'constant field far from impulse unchanged');
assert.match(src,/p\.rawField=rawField;p\.contourField=\/\^snow/, 'sampling and difference values remain raw');
assert.match(src,/new apgl\.RawScalarField\(grid,shadeData\)/, 'only GPU shaded field uses smoothed values');
console.log('PASS standard 4-hPa/30-m/60-m intervals, distinct solid/dashed/halo colors, GPU-only selective vorticity smoothing');

assert.match(src,/st\.field==='asnow'\?rawField:field/, 'snowfall contours use the native values; vorticity remains smoothed');
assert.match(src,/field:p\.contourField\|\|p\.rawField,key:fieldName/, 'on-screen vorticity isolines follow smoothed shading');
assert.match(src,/field:p\.contourField\|\|p\.rawField,key:plottedField/, 'PNG vorticity isolines follow smoothed shading');
