'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const ctx=vm.createContext({});
vm.runInContext(src.slice(0,src.indexOf('const PTYPE_LABELS=')),ctx);
for(const [field,max] of [['shear01',60],['shear06',90]]){
  const meta=vm.runInContext('FIELDS.'+field,ctx);
  assert.equal(meta.min,0);
  assert.equal(meta.max,max);
  assert.equal(meta.unit,'kt');
  assert.equal(meta.convert,'mpsToKt');
}
assert.match(src,/sden:150,shear01:20,shear06:30/);
assert.match(src,/sden:50,shear01:5,shear06:10/);
assert.doesNotMatch(src,/\['shear01','0–1 km bulk shear','kt',0,100\]/);
console.log('PASS reduced bulk shear color range and consistent difference-map defaults');
