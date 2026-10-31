'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
// This block owns the actual field declarations and menu helper used by boot().
const until=src.indexOf('const PTYPE_LABELS=');
assert.ok(until>0,'Field declaration boundary found');
const ctx=vm.createContext({});
vm.runInContext(src.slice(0,until),ctx);
const fields=vm.runInContext('fieldMenuEntries()',ctx);
const names=Array.from(fields,f=>f.key), labels=new Map(Array.from(fields,f=>[f.key,f.label]));
for (const key of [
 't925','t850','t700','absv500',
 'shear01','shear06','srh01','srh03','sbcape','mlcape','mucape',
 'mxuphl','mxuphl_run','scp','stp','stp_fixed',
 'apcp1h','apcp3h','apcp6h','snow1h','snow3h','snow6h'
]) assert.ok(names.includes(key),`Missing menu option ${key}`);
for (const [key,label] of [
 ['t925','925 hPa forecast'],['t850','850 hPa forecast'],
 ['t700','700 hPa forecast'],['absv500','500 hPa forecast'],
 ['scp','Supercell composite parameter (effective layer)'],
 ['stp','Significant tornado parameter with CIN (effective layer)'],
 ['stp_fixed','Significant tornado parameter (fixed layer)']
]) assert.equal(labels.get(key),label,`Bad label for ${key}`);
assert.ok(!names.includes('uphl'),'Instantaneous UH should not be offered');
assert.equal(new Set(names).size,names.length,'Duplicate field entries');
assert.ok(src.includes('const menu=fieldMenuEntries()'),'The boot path uses complete menu definitions');
assert.ok(!src.includes("FIELD_ORDER.filter(n=>names.has("),'No catalog-driven field menu suppression');
console.log('PASS: all configured fields remain selectable before data backfill; sentence-case labels and unchanged keys');
