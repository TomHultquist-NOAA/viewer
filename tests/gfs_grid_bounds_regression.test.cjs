const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const src = fs.readFileSync(require('node:path').join(__dirname,'../js/viewer.js'),'utf8');
const start = src.indexOf('function gridFromDataset(');
const end = src.indexOf('\nfunction gridForPanel(', start);
assert.ok(start>=0 && end>start);
class PlateCarreeGrid {constructor(...args){this.args=args;}}
const context={apgl:{PlateCarreeGrid},st:{cfg:{display:{earthRadiusM:6371229}}}};
vm.createContext(context);
vm.runInContext(src.slice(start,end),context);
const shape={shape:[241,281,601]};
test('native GFS 0..360 longitude grid maps to valid western hemisphere coordinates',()=>{
 const g={GRIB_gridType:'regular_ll',GRIB_longitudeOfFirstGridPointInDegrees:160,GRIB_longitudeOfLastGridPointInDegrees:310,GRIB_latitudeOfFirstGridPointInDegrees:5,GRIB_latitudeOfLastGridPointInDegrees:75};
 assert.deepEqual(Array.from(context.gridFromDataset({grid:g},shape).args),[601,281,-200,5,-50,75]);
});
test('MRMS conventional lat lon bounds remain intact',()=>{
 const g={GRIB_gridType:'regular_ll',longitude_min:-130,longitude_max:-60,latitude_min:20,latitude_max:55};
 assert.deepEqual(Array.from(context.gridFromDataset({grid:g},shape).args),[601,281,-130,20,-60,55]);
});
test('invalid coordinates throw instead of silently rendering a blank map',()=>{
 assert.throws(()=>context.gridFromDataset({grid:{GRIB_gridType:'regular_ll'}},shape),/Missing regular lat\/lon grid bounds/);
});
