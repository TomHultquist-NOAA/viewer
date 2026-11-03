'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
function extract(start,end){const a=src.indexOf(start),b=src.indexOf(end,a);assert.ok(a>=0&&b>a);return src.slice(a,b);}
test('GFS signed difference palettes retain full negative/positive gradients for upper-air temperatures and MSLP',()=>{
 const context={st:{field:'t700'},fieldInfo:()=>({label:'temperature',convert:'C',fraction:true,min:-80,max:50,colors:[[0,'#00f'],[1,'#f00']]})};
 vm.createContext(context);
 vm.runInContext(extract('const DIFFERENCE_NEUTRAL_BY_FIELD=','// Precomputed GFS comparison grids contain signed deltas'),context);
 vm.runInContext(extract('function panelFieldInfo(p,v){','// A raw Zarr chunk'),context);
 vm.runInContext(extract('function basePal(m,v){','// Field-level, presentation-only'),context);
 for(const field of ['t925','t850','t700','t2m','dpt2m','mslp','wspd300']){
  context.st.field=field;
  const meta=context.panelFieldInfo({cfg:{differencePanel:true,field}},{name:field,attrs:{}});
  assert.equal(meta.fraction,false,`${field}: difference stops are signed physical numbers, not fractions`);
  assert.equal(meta.min,-meta.max,`${field}: symmetric limits`);
  const colors=context.basePal(meta,{}).colors;
  assert.ok(new Set(colors).size>15,`${field}: many gradient colors instead of one`);
  assert.notEqual(colors[0],colors.at(-1),`${field}: distinct opposing signs`);
 }
});
test('right-click style controls target entire label; maps are independent from observation controls',()=>{
 for(const [id,layer] of [['mapOutlinesOption','mapOutlines'],['mapBackgroundOption','mapBackground'],['contourOption','contours'],['heightOption','height'],['windOption','wind'],['mslp850Option','temperature']]){
  assert.match(html,new RegExp(`id="${id}"[^>]+data-style-layer="${layer}"`));
 }
 assert.match(src,/box\.addEventListener\('contextmenu',event=>/);
 assert.match(src,/event\.preventDefault\(\);event\.stopPropagation\(\);active=box\.dataset\.styleLayer/);
 assert.match(src,/st\.mapOutlines=localStorage\.getItem/);
 assert.match(src,/st\.mapBackground=localStorage\.getItem/);
 assert.match(src,/if\(!st\.mapBackground\)return st\.theme==='dark'\?'#ffffff':'#000000'/);
 assert.match(css,/\.overlay-style-dialog/);
 for(const id of ['obsSynoptic','obsMping','spcToggleBtn','lightningToggleBtn'])assert.doesNotMatch(html,new RegExp(`id="${id}"[^>]+data-style-layer`));
});
