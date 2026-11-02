'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function section(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return src.slice(i,j);}
const ctx=vm.createContext({Math});
vm.runInContext(section('function standaloneExportLayout(', 'async function drawExport('),ctx);
for(const size of [[1920,1080],[1600,1200]]){
 for(const large of [false,true]){
  const [w,h]=size,layout=ctx.standaloneExportLayout(w,h,large);
  assert.equal(layout.mapX,14);assert.equal(layout.mapY,large?100:60);
  assert.equal(layout.mapW,w-28);
  assert.equal(layout.mapH,h-(large?100:60)-77);
  assert.equal(layout.titleFont,Math.round(Math.max(15,Math.min(25,w/40))*(large?1.7:1)));
  assert.equal(layout.subtitleFont,Math.round(Math.max(11,Math.min(15,w/70))*(large?1.7:1)));
 }
}
const single=section('async function drawExport(', 'function gifHoursInRange(');
const diff=src.slice(src.indexOf('async function exportDifferencePNG('));
assert.match(single,/const layout=standaloneExportLayout\(w,h,largeLabels\)/);
assert.match(diff,/const layout=standaloneExportLayout\(W,H,!!st\.exportLargeLabels\)/);
assert.match(diff,/captureSharpDifferenceFrame\(diff\.map,snap,layout\.mapW,layout\.mapH,framing\)/);
assert.match(diff,/drawMapFramed\(cx,combined,layout\.mapX,layout\.mapY,layout\.mapW,layout\.mapH,framing\)/);
assert.match(diff,/cx\.font=`bold \$\{layout\.titleFont\}px Arial`/);
assert.match(diff,/cx\.font=`\$\{layout\.subtitleFont\}px Arial`/);
assert.ok(!diff.includes('39*scale'),'difference-specific oversized font must be gone');
assert.match(html,/viewer\.js\?v=1\.1\.38-20261102/);
console.log('PASS single-panel and difference PNG export aperture, typography and legend geometry consistent');
