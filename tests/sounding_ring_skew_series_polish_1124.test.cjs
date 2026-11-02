'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../js/point-inspector.js'),'utf8');
const start=src.indexOf(' function hodographRingLabel('),end=src.indexOf(' const SKEW=35;',start);
assert(start>0&&end>start,'pure hodograph ring-label placement helper');
const ctx={Math};vm.createContext(ctx);
vm.runInContext(src.slice(start,end)+'\nthis.locate=hodographRingLabel;',ctx);
const bounds={left:24,right:425,top:54,bottom:306};
for(const speed of [20,40,60,80]){
 const p=ctx.locate(45,288,speed*4.5,bounds);
 assert(p,`ring ${speed} should have a visible label location`);
 assert(p.x>=bounds.left+24&&p.x<=bounds.right-24,'speed label safely inset horizontally');
 assert(p.y>=bounds.top+18&&p.y<=bounds.bottom-18,'speed label safely inset vertically');
 assert(Math.hypot(p.x-435,p.y-290)>40,'speed label must not collide with E cardinal');
}
assert.equal(ctx.locate(45,288,700,bounds),null,'unplaceable ring label omitted rather than clamped');
assert.match(src,/const temperatureMin=-50,temperatureMax=50;/,'Skew-T bottom scale is -50 to +50°C');
assert.match(src,/const X=\(t,p\)=>x0\+\(\(t-temperatureMin\+SKEW\*/,'Skew-T transform uses new temperature range');
assert.match(src,/card\(x0-14,y0-50,x1-x0\+32,y1-y0\+87\)/,'Skew-T panel extends upward with same lower edge');
assert.match(src,/const headY=y0-25, subY=y0-6, legendY=y0-25/,'Skew-T title has more top padding');
assert.match(src,/const seriesGrid=st\.theme==='light'\?'#bdcbd9':'#4b6680'/,'theme-specific series grid contrast');
assert.equal((src.match(/axis\(ctx,(?:x0,yy,x1,yy|xx,y0,xx,y1),seriesGrid\);/g)||[]).length,2,'both horizontal and vertical grids use the improved contrast');
console.log('PASS hodograph inset ring labels, Skew-T frame/temp range, and time-series grid contrast');
