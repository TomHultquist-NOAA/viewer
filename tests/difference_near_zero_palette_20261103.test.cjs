'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
function section(a,b){const i=src.indexOf(a),j=src.indexOf(b,i);assert.ok(i>=0&&j>i);return src.slice(i,j);}
test('GFS precomputed difference colors are chromatic near zero with unchanged transparency mask',()=>{
 const text=section('const DIFFERENCE_NEUTRAL_BY_FIELD=' ,'// Precomputed GFS comparison grids contain signed deltas')+section('function panelFieldInfo(p,v){','// A raw Zarr chunk');
 const ctx={st:{field:'mslp'},fieldInfo:()=>({label:'MSLP',convert:'PaToHpa'})};
 vm.runInNewContext(text,ctx);
 const m=ctx.panelFieldInfo({cfg:{differencePanel:true}},{name:'mslp'});
 assert.equal(m.colors.length,7);
 assert.equal(m.colors[2][1],'#e9f3ff');assert.equal(m.colors[4][1],'#fff0ea');
 assert.equal(m.colors[3][0],0);assert.equal(m.clearZero,2);
});
test('difference-window live/export raster share tinted endpoint palette and transparent near-zero values',()=>{
 const text=section('const DIFFERENCE_NEUTRAL_BY_FIELD=','// Precomputed GFS comparison grids contain signed deltas')+section('const DIFFERENCE_COLORS=[','const DIFFERENCE_LIMITS=');
 const ctx={st:{field:'mslp'}};vm.runInNewContext(text+'\nthis.palette=DIFFERENCE_COLORS;this.alpha=differenceZeroOpacity;',ctx);
 assert.equal(ctx.palette.length,16);
 assert.equal(ctx.palette[7],'#eef6ff');assert.equal(ctx.palette[8],'#fff1eb');
 assert.equal(ctx.alpha(0,12),0);assert.equal(ctx.alpha(12*.02,12),0);
 assert.equal(ctx.alpha(3,12),1);
 assert.match(src,/const colors=DIFFERENCE_COLORS\.map\(/);
 assert.match(src,/const rgb=DIFFERENCE_COLORS\.map\(/);
});
