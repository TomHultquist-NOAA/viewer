'use strict';
// The first-open map viewport must have the same aspect ratio as the selected
// panel to match BOTH geographic dimensions (not just an approximate fit).
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
function section(from,to){const a=src.indexOf(from),b=src.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,`missing section ${from}`);return src.slice(a,b);}
const js=section('function differenceReferencePanel(){','function currentSharedCamera(){');
const panel={map:{getContainer:()=>({clientWidth:400,clientHeight:250})}};
const win={offsetWidth:630,offsetHeight:510,style:{}};
const mapRegion={clientWidth:626,clientHeight:389};
const state={difference:{selected:[panel]},active:[panel],cfg:{display:{maxZoom:12}}};
const c=vm.createContext({st:state,el:{differenceWindow:win,differenceMap:mapRegion},getComputedStyle:()=>({minWidth:'300px',minHeight:'265px'}),Math});
vm.runInContext(js,c);
assert.equal(c.matchInitialDifferenceWindow(),true);
const fittedW=Number.parseFloat(win.style.width)-4;
const fittedH=Number.parseFloat(win.style.height)-(510-389);
assert.ok(Math.abs(fittedW/fittedH-(400/250))<.0002,`matching aspect: ${fittedW}/${fittedH}`);
assert.ok(fittedW<=626&&fittedH<=389,'fit stays within current difference window');
const newMap={getContainer:()=>({clientWidth:fittedW,clientHeight:fittedH})};
const adjusted=c.differenceViewportZoomAdjustment(newMap,panel);
assert.ok(Math.abs(Math.pow(2,adjusted)-fittedW/400)<.0001);
assert.ok(Math.abs(Math.pow(2,adjusted)-fittedH/250)<.0001);
// Other panel shapes: wide source reduces height; tall source reduces width.
for(const [w,h] of [[400,150],[250,400],[500,500]]){
 const dim=c.differenceInitialMapFootprint(w,h,626,389);
 assert.ok(Math.abs(dim.width/dim.height-w/h)<1e-10);
 assert.ok(dim.width<=626.001&&dim.height<=389.001);
}
assert.match(src,/el\.differenceWindow\.style\.width='';el\.differenceWindow\.style\.height='';\s*matchInitialDifferenceWindow\(\);/);
assert.match(src,/\/\/ The user can resize it freely after opening/);
assert.match(src,/st\.difference\.map\.jumpTo\(differenceCameraForViewport\(camera,st\.difference\.map\)\)/);
console.log('PASS exact initial map aspect/geographic footprint, bounded popup fit, freely resizable later');
