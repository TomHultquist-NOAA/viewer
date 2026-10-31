'use strict';
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'config.json'),'utf8'));
assert.equal(cfg.ptypeObservations.enabled,true);
assert.equal(cfg.ptypeObservations.path,'data/ptype_observations/');
for(const id of ['obsControl','obsSynoptic','obsMping','obsCount'])assert(html.includes(`id="${id}"`));
assert.match(js,/new maplibregl\.Popup/);
assert.match(js,/setText\(`\$\{label\}/); // popup escapes external descriptions
assert.match(js,/st\.field==='ptype'/);
assert.match(js,/circle-stroke-color.*st\.theme==='light'/);
assert.match(js,/Date\.parse\(obj\.valid_time\)!==when\.getTime\(\)/);
// Execute only the standalone observations helpers against a synthetic MapLibre-like map.
const start=js.indexOf('const PTYPE_OBS_EMPTY=');
const end=js.indexOf('/* OMD EVU autumnplot-gl',start);
assert(start>0&&end>start);
const context=vm.createContext({
 st:{ref:{init_time:'2026-10-28T12:00:00Z'},hour:6,field:'ptype',cfg:{ptypeObservations:cfg.ptypeObservations},
     theme:'dark',active:[],obsCurrent:null,obsCache:new Map(),obsLoadToken:0,obsEnabled:{synoptic:true,mping:true}},
 el:{obsControl:{hidden:true},obsCount:{textContent:''}},PTYPE:['#0','#1','#2','#3','#4','#5'],
 PTYPE_LABELS:['unknown','rain','snow','freezing rain','sleet','mixed'],Date,Number,console,URL,fetch:async()=>({status:404,ok:false}),
 fmt:()=>'',maplibregl:{Popup:class{}},
});
vm.runInContext(js.slice(start,end),context);
assert.equal(vm.runInContext('observationHourKey(obsValidDate())',context),'2026102818');
assert.equal(vm.runInContext('observationPath(obsValidDate())',context),'data/ptype_observations/2026102818.json');
vm.runInContext(`st.obsCurrent={features:[
 {type:'Feature',properties:{ptype:2,source:'synoptic'}},
 {type:'Feature',properties:{ptype:3,source:'mping'}}]};`,context);
assert.equal(vm.runInContext('filteredObservationGeoJSON().features.length',context),2);
vm.runInContext('st.obsEnabled.mping=false;',context);
assert.equal(vm.runInContext('filteredObservationGeoJSON().features.length',context),1);
vm.runInContext("st.field='mslp';",context);
assert.equal(vm.runInContext('filteredObservationGeoJSON().features.length',context),0);
console.log('PASS: sources, UTC valid-hour filenames, independent toggle and safe ptype-only overlays');
