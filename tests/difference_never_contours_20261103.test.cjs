'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
function part(start,end){const a=src.indexOf(start),b=src.indexOf(end,a);assert.ok(a>=0&&b>a);return src.slice(a,b);}
test('difference panels are blocked from all live contour paths',()=>{
 const draw=part('function drawContours(', 'function scheduleContourRedraw(');
 const schedule=part('function scheduleContourRedraw(', 'function drawWindBarbs(');
 assert.match(draw,/if\(p\?\.cfg\?\.differencePanel\)\{clearContours\(p\);return;\}/);
 assert.match(schedule,/if\(p\.cfg\?\.differencePanel\)\{clearContours\(p\);return;\}/);
});
test('difference panel exports cannot draw scalar, height or MSLP contours',()=>{
 const exportSection=part('const withHeight=Boolean(', 'if(!p.cfg?.differencePanel&&p.wind');
 assert.match(exportSection,/const withScalar=Boolean\(!p\.cfg\?\.differencePanel&&/);
 assert.match(exportSection,/const withMSLP=!p\.cfg\?\.differencePanel/);
 assert.match(exportSection,/const withMSLP850=!p\.cfg\?\.differencePanel/);
 assert.match(exportSection,/const withHeight=Boolean\(!p\.cfg\?\.differencePanel/);
});
test('difference captions never advertise contours',()=>{
 const descriptor=src.slice(src.indexOf('function overlayPlotDescriptor('),src.indexOf('function overlayPlotDescriptor(')+250);
 assert.match(descriptor,/if\(p\?\.cfg\?\.differencePanel\)return 'Difference shading';/);
});
