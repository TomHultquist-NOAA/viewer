'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(base,'js/point-inspector.js'),'utf8');
const viewer=fs.readFileSync(path.join(base,'js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const css=fs.readFileSync(path.join(base,'css/styles.css'),'utf8');
assert.match(viewer,/m\.on\('contextmenu',e=>/);
assert.match(viewer,/EVUPointInspector\?\.scheduleSoundingRefresh/);
assert.match(src,/\['Time series','series'\]/);
assert.match(src,/\['Sounding','sounding'\]/);
assert.match(src,/getDisplayData\(/);
assert.match(src,/new apgl\.RawScalarField/);
assert.match(src,/s\.type==='sounding'/);
assert.match(src,/data\.dataset/); // time series keeps clicked cycle
assert.match(src,/upper-level dewpoint unavailable/);
assert.match(src,/const Y=p=>y1-Math\.log\(1000\/p\)/);
assert.match(src,/p===1000\?'t2m':'t'\+p/);
assert.match(src,/const surfaceDs=/);
assert.match(src,/lastH/); // plot gaps rather than zero interpolation
assert.match(src,/canvas\.toDataURL\('image\/png'\)/);
assert.match(css,/\.evu-inspect-window/);
assert.match(html,/src="js\/point-inspector\.js/);
assert.match(html,/href="USER_GUIDE\.pdf" target="_blank"/);
assert.doesNotMatch(html, /class="helper-instructions"/);
assert.ok(fs.statSync(path.join(base,'USER_GUIDE.pdf')).size>5000);
assert.match(fs.readFileSync(path.join(base,'USER_GUIDE.md'),'utf8'),/Sounding.*updates automatically|updates automatically.*forecast hour/);
console.log('PASS: point inspector, sounding time follow, persistent series, user guide and PDF action');
