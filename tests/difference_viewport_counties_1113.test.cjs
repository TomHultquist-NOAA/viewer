'use strict';
// Different physical viewport sizes must not change the geographic footprint
// or trigger counties before the equivalent panel zoom crosses its threshold.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const slice=(from,to)=>{const a=src.indexOf(from),b=src.indexOf(to,a+1);assert(a>=0&&b>a);return src.slice(a,b)};
const source=slice('function differenceReferencePanel(){','function currentSharedCamera(){')+'\n'+slice('function countyThreshold(p=null){','function detailMaskData(){');
const panel={map:{getContainer:()=>({clientWidth:400,clientHeight:250})},view:{clientWidth:400,clientHeight:250}};
const diffMap={getContainer:()=>({clientWidth:600,clientHeight:375})};
const diff={selected:[panel],map:diffMap,geo:null};
const sandbox={st:{difference:diff,active:[panel],cfg:{display:{countyMinZoom:4.25,maxZoom:12}},mode:'lambert',expandedPanel:null},Math};
vm.createContext(sandbox);vm.runInContext(source,sandbox);
assert.equal(sandbox.differenceViewportZoomAdjustment(diffMap,panel),Math.log2(1.5));
const fitted=sandbox.differenceCameraForViewport({center:[-97,38],zoom:4,bearing:0,pitch:0},diffMap);
assert.ok(Math.abs(fitted.zoom-(4+Math.log2(1.5)))<1e-12);
assert.equal(sandbox.countyThreshold(panel),4.25);
diff.geo={map:diffMap};
assert.ok(Math.abs(sandbox.countyThreshold(diff.geo)-(4.25+Math.log2(1.5)))<1e-12);
// Resize to a wide shape: limiting dimension now makes the map show more
// geography vertically, without erroneously revealing county outlines.
diffMap.getContainer=()=>({clientWidth:900,clientHeight:250});
assert.equal(sandbox.differenceViewportZoomAdjustment(diffMap,panel),0);
assert.equal(sandbox.countyThreshold(diff.geo),4.25);
assert.match(src,/const visible=differenceGeoVisibility\(map\)/);
assert.match(src,/redrawDifferenceBoundaries\(outlines,map,\{exportGeoVisible:visible,exportStyle:false\}\)/);
assert.match(src,/st\.difference\.map\.jumpTo\(differenceCameraForViewport\(camera,st\.difference\.map\)\)/);
console.log('PASS difference map matched geography, resize-adjusted counties, frozen PNG outlines');
