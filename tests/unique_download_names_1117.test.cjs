const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const main=fs.readFileSync(path.join(base,'js/viewer.js'),'utf8');
const inspector=fs.readFileSync(path.join(base,'js/point-inspector.js'),'utf8');

test('all PNG, GIF and chart downloads pass through unique filename helper',()=>{
 assert.match(main,/a\.download=uniqueExportName\(name\)/);
 assert.match(main,/a\.download=uniqueExportName\(`omd_evu_.*?\.gif`\)/);
 assert.match(inspector,/a\.download=window\.OMDEVUUniqueExportName\(`EVU_.*?\.png`\)/);
 assert.equal([...main.matchAll(/\.download\s*=/g)].length,2);
 assert.equal([...inspector.matchAll(/\.download\s*=/g)].length,1);
});

test('repeated exports in same millisecond still differ and preserve extension',()=>{
 const start=main.indexOf('const EXPORT_SESSION_TOKEN=');
 const end=main.indexOf('window.OMDEVUUniqueExportName=uniqueExportName;',start);
 assert.ok(start>0 && end>start);
 const window={};
 vm.runInNewContext(main.slice(start,end+'window.OMDEVUUniqueExportName=uniqueExportName;'.length),
  {window,Date:class {toISOString(){return '2026-10-31T18:19:20.111Z';}},Math});
 const name='evu_difference_shear06_2026102812_f012_16x9_fit.png';
 const one=window.OMDEVUUniqueExportName(name),two=window.OMDEVUUniqueExportName(name);
 assert.notEqual(one,two);
 assert.ok(one.startsWith(name.slice(0,-4)+'_20261031T181920111Z_'));
 assert.ok(one.endsWith('.png'));
 const gif=window.OMDEVUUniqueExportName('evu_animation.gif');
 assert.ok(gif.endsWith('.gif'));
 assert.ok(gif.includes('20261031T181920111Z'));
});
