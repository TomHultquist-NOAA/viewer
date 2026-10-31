'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'),vm = require('node:vm'),path = require('node:path');
const src = fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const ctx = vm.createContext({});
vm.runInContext(src.slice(0,src.indexOf('const PTYPE_LABELS=')),ctx);
const groups=Array.from(vm.runInContext('FIELD_MENU_GROUPS',ctx),g=>({key:g.key,label:g.label,fields:Array.from(g.fields,f=>({key:f.key,label:f.label}))}));
const radar=groups.find(g=>g.key==='radar'),snow=groups.find(g=>g.key==='snow'),precip=groups.find(g=>g.key==='precip');
assert.deepEqual(radar.fields.slice(0,2).map(f=>f.key),['refc','ptype']);
assert.equal(radar.fields[1].label,'Precipitation type');
assert.equal(snow.label,'Winter weather');
for(const [id,label] of [['frzr','Freezing rain accumulation'],['frozr','Sleet accumulation'],['tsnowp','Snow precipitation (liquid equivalent)'],['cpofp','Percent frozen precipitation']]){
 assert.equal(snow.fields.find(f=>f.key===id)?.label,label,`Winter weather must include ${id}`);
 assert(!precip.fields.some(f=>f.key===id),`Precipitation must not include ${id}`);
}
assert.deepEqual(precip.fields.map(f=>f.key),['prate','apcp1h','apcp3h','apcp6h','apcp24h','apcp48h','apcp']);
const all=Array.from(vm.runInContext('fieldMenuEntries()',ctx),f=>f.key),flat=groups.flatMap(g=>g.fields.map(f=>f.key));
assert.equal(flat.length,all.length);assert.deepEqual([...flat].sort(),[...all].sort());
assert.equal(new Set(flat).size,flat.length);
const info=src.slice(src.indexOf('function fieldInfo('),src.indexOf('// A raw Zarr chunk'));
assert.match(info,/:v.name==='ptype'&&isHRRR\?'Derived precipitation type'/);
assert.match(info,/:dominantMean\?'Dominant ensemble precipitation type'/);
assert.match(info,/:v.name==='ptype'\?'Dominant precipitation type'/);
assert.match(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),/1\.0\.20-20261030/);
console.log('PASS: nested categories, ordering, all moved fields, titles and stable field IDs');
