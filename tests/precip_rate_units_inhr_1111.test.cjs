'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const ctx=vm.createContext({});
vm.runInContext(src.slice(0,src.indexOf('const PTYPE_LABELS=')),ctx);
vm.runInContext(src.slice(src.indexOf('function convert('),src.indexOf('function columnCount(')),ctx);
const meta=vm.runInContext('FIELDS.prate',ctx);
assert.equal(meta.unit,'in/hr');
assert.equal(meta.convert,'rateToInHr');
assert.equal(meta.levels.length,19);
assert.equal(meta.levels[0],.002);
assert.equal(meta.levels.at(-1),8);
// Native PRATE is kg/m2/s, numerically equal to mm/s: 25.4 mm/hr = 1 in/hr.
const rate=25.4/3600;
assert.ok(Math.abs(ctx.convert(rate,meta)-1)<1e-10);
assert.ok(Math.abs(ctx.convert(0,meta))<1e-10);
assert.ok(Math.abs(ctx.convert(10/3600,meta)-10/25.4)<1e-10);
assert.equal(ctx.formatReadout(ctx.convert(rate,meta),meta),'1.00');
// Difference colorbar must also use the same displayed unit, not old mm/hr bounds.
assert.match(src,/prate:1\.2,apcp:3/);
assert.match(src,/prate:\.4,apcp:1/);
assert.doesNotMatch(src,/unit:'mm h⁻¹'/);
console.log('PASS PRATE native kg/m²/s → displayed in/hr; legends, reads and differences');
