'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(root,'js/low-tracks.js'),'utf8');
const sandbox={window:{},console};
vm.runInNewContext(code,sandbox);
const api=sandbox.window.EVULowTracks;
assert.ok(api);
const pt=(lon,lat)=>({lon,lat});
const box={type:'rect',west:160,east:310,south:5,north:75};
for(const lon of [160,180,235,310,-125,-50,-145])assert.equal(api.withinDomain(pt(lon,45),box),true,`inside ${lon}`);
for(const lon of [150,315,340,-45,-210])assert.equal(api.withinDomain(pt(lon,45),box),false,`outside ${lon}`);
assert.equal(api.withinDomain(pt(250,77),box),false,'north edge must be clipped');
// A projected-grid polygon excludes corners of its geographic bounding box.
const region={type:'polygon',coordinates:[[-134,24],[-120,52],[-63,46],[-82,20]]};
assert.equal(api.withinDomain(pt(-100,38),region),true,'regional native central point');
assert.equal(api.withinDomain(pt(-132,51),region),false,'northwest rectangle corner is outside curved footprint');
assert.equal(api.withinDomain(pt(-64,25),region),false,'southeast rectangle corner is outside curved footprint');
assert.equal(api.withinDomain(pt(260,38),region),true,'0–360 longitude input matches signed longitude polygon');
const payload={algorithm:'ncep-gfdl-gettrk-v2026.01-midlat',model:'gfs_v16',
 tracks:[{id:'storm-1',confirmed:true,points:[
  {time:'2026-11-14T12:00:00Z',forecast_hour:0,lon:151,lat:40,mslp_hpa:998},
  {time:'2026-11-14T15:00:00Z',forecast_hour:3,lon:165,lat:40,mslp_hpa:997},
  {time:'2026-11-14T18:00:00Z',forecast_hour:6,lon:169,lat:41,mslp_hpa:995},
  {time:'2026-11-14T21:00:00Z',forecast_hour:9,lon:332,lat:42,mslp_hpa:994},
  {time:'2026-11-15T00:00:00Z',forecast_hour:12,lon:170,lat:44,mslp_hpa:993}
 ]}]};
const common={domainBounds:box,activeTime:'2026-11-15T00:00:00Z',upperTime:'2026-11-15T00:00:00Z'};
const features=api.featuresFromTracks(payload,common).features;
assert.equal(features.filter(x=>x.properties.kind==='point').length,3,'only in-domain fixes are plotted');
assert.equal(features.filter(x=>x.properties.kind==='line').length,1,'no line across an out-of-domain gap');
const coords=features.filter(x=>x.properties.kind==='line')[0].geometry.coordinates;
assert.equal(coords.length,2);
assert.equal(coords[0][0],165);assert.equal(coords[1][0],169);
// When latest fix falls outside native field bounds the entire stale track
// disappears rather than suggesting a low still exists in the displayed field.
const missing=api.featuresFromTracks(payload,{...common,upperTime:'2026-11-14T21:00:00Z',activeTime:'2026-11-14T21:00:00Z'});
assert.equal(missing.features.length,0);
// Rectangular bounds for Plate Carrée and native Lambert polygon must be
// generated from the active panel's actual catalog grid.
const viewer=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const start=viewer.indexOf('function lowTrackGridDomain(p){');
const stop=viewer.indexOf('function lowTrackProductSources(p){',start);
assert.ok(start>0&&stop>start);
const viewerSandbox={console,Number,String,Math};
vm.createContext(viewerSandbox);
vm.runInContext(viewer.slice(start,stop),viewerSandbox);
assert.equal(viewerSandbox.lowTrackGridDomain({ds:{grid:{GRIB_gridType:'regular_ll',longitude_min:160,longitude_max:310,latitude_min:5,latitude_max:75}}}).type,'rect');
let transformCalls=0;
viewerSandbox.gridForPanel=()=>({ll_x:0,ur_x:100,ll_y:0,ur_y:60,transform(x,y){transformCalls++;return [x/10-120,y/10+25]}});
const lambert=viewerSandbox.lowTrackGridDomain({ds:{grid:{GRIB_gridType:'lambert'}},v:{shape:[1,1059,1799]}});
assert.equal(lambert.type,'polygon');assert.equal(lambert.coordinates.length,96);
assert.ok(transformCalls>=96);
assert.equal(api.withinDomain(pt(-115,28),lambert),true);
assert.equal(api.withinDomain(pt(-135,28),lambert),false);
// Avoid 0 rather than NaN for missing regular_ll catalog coordinates.
assert.equal(viewerSandbox.lowTrackGridDomain({ds:{grid:{GRIB_gridType:'regular_ll',longitude_min:160,longitude_max:310}}}),null);
const snapshotStart=viewer.indexOf('function exceedsDisplayLimit(x,m){');
const snapshotEnd=viewer.indexOf('function columnCount(n){',snapshotStart);
assert.ok(snapshotStart>0&&snapshotEnd>snapshotStart);
const caps={};vm.createContext(caps);
vm.runInContext(viewer.slice(snapshotStart,snapshotEnd),caps);
const vis={maxValidDisplay:9},ceil={maxValidDisplay:30000};
assert.equal(caps.formatReadout(9,vis),'9+');assert.equal(caps.formatReadout(11,vis),'9+');
assert.equal(caps.formatReadout(30500,ceil),'30000+');assert.equal(caps.formatReadout(30000,ceil),'30000+');
assert.equal(caps.formatReadout(-1e10,ceil),'—');assert.equal(caps.formatReadout(NaN,vis),'—');
assert.equal(caps.formatReadout(11,{...vis,differenceField:true}),'11.00','signed comparison is never capped');
const inspect=fs.readFileSync(path.join(root,'js/point-inspector.js'),'utf8');
assert.match(inspect,/const capped=\(name==='vis'\|\|name==='ceil'\)/);
assert.match(inspect,/Math\.min\(value,meta\.maxValidDisplay\)/);
assert.match(inspect,/const displayValue=isGood\(pt\.value\)/);
console.log('PASS: GFS/AI and curved regional track clipping, time-gap lines, aviation capped hover + point time series.');
