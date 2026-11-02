'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const st={field:'ptype',ref:null,sources:new Map(),contours:false,overlayHeight:false};
const cx=vm.createContext({st,Map,Math,Number,Date,
  heightVariableName:()=>null,windComponentNames:()=>null,overlayWindVisible:()=>false,
  precipitationAccumulationHours:()=>0,snowAccumulationHours:()=>0,
  pal:()=>({colors:[]}),legendTicks:()=>[],
  contoursAvailable:()=>false,analysisDisplaySource:()=> 'RAP'});
const first=js.slice(0,js.indexOf('const PTYPE_LABELS='));
const fieldInfo=js.slice(js.indexOf('function fieldInfo('),js.indexOf('// A raw Zarr chunk'));
const overlays=js.slice(js.indexOf('function overlayPlotDescriptor('),js.indexOf('async function prepareHeightContours('));
const displayTitle=js.slice(js.indexOf('function panelDisplayTitle('),js.indexOf('async function renderPanel('));
const shared=js.slice(js.indexOf('function sharedPalette('),js.indexOf('function visibleSharedTicks('));
vm.runInContext(first+'\n'+fieldInfo+'\n'+displayTitle+'\n'+overlays+'\n'+shared,cx);
const testCases=[
 ['rrfs','RRFS','Dominant precipitation type'],
 ['hrrr','HRRR','Derived precipitation type'],
 ['refs_m001','REFS-1','Dominant precipitation type'],
 ['refs_m002','REFS-2','Dominant precipitation type'],
 ['refs_m003','REFS-3','Dominant precipitation type'],
 ['refs_m004','REFS-4','Dominant precipitation type'],
 ['refs_m005','REFS-5','Dominant precipitation type'],
 ['refs_mean','REFS-mean','Ensemble dominant precipitation type'],
];
for(const [source,label,expected] of testCases){
 const p={cfg:{source,label},ds:{model:source},v:{name:'ptype',attrs:{}},title:{textContent:''}};
 cx.p=p;
 // A panel's initial render and every overlay-induced title update must agree.
 const initial=vm.runInContext('fieldInfo(p.v,st.field,p.ds.model).label',cx);
 assert.equal(initial,expected,`initial panel title for ${label}`);
 const refreshed=vm.runInContext('updatePanelPlotTitle(p);p.title.textContent',cx);
 assert.equal(refreshed,`${label} · ${expected}`,`redrawn title for ${label}`);
 // Null catalogs must not erase model specificity during a subsequent update.
 p.v=null;p.ds=null;
 const fallback=vm.runInContext('updatePanelPlotTitle(p);p.title.textContent',cx);
 assert.equal(fallback,`${label} · ${expected}`,`fallback title for ${label}`);
}
// PMM and legacy-mean product names must survive overlay redraws as well.
for(const [name,attrs,expected] of [
 ['refc',{},'PMM composite reflectivity'],
 ['apcp',{probability_matched_mean:true},'PMM accumulated precipitation'],
 ['apcp',{},'Accumulated precipitation · legacy ensemble mean'],
]){
 st.field=name;
 cx.p={cfg:{source:'refs_mean',label:'REFS-mean'},ds:{model:'refs_mean'},v:{name,attrs},title:{textContent:''}};
 assert.equal(vm.runInContext('updatePanelPlotTitle(p);p.title.textContent',cx),`REFS-mean · ${expected}`);
}
st.field='ptype';
st.ref={entries:[{ds:{variables:[{name:'ptype',attrs:{},available_hours:[0]}]}}]};
const globalLabel=vm.runInContext('sharedPalette().m.label',cx);
assert.equal(globalLabel,'Precipitation type (model-specific)','shared legend must not imply all panels use RRFS dominant type');
assert.match(js,/st\.field==='ptype'\?'Precipitation type \(model-specific\)':fieldMeta\.label/,'all-panel PNG/GIF title must be neutral');
assert.match(js,/const name=String\(p\.title\.textContent/,'comparison captions must use corrected panel title');
assert.match(js,/clipText\(ctx,p\.title\.textContent/,'single-panel PNG/GIF titles must use corrected panel title');
assert.match(html,/js\/viewer\.js\?v=1\.1\.34-20261102/,'new viewer code must bypass browser cache');
console.log('PASS all eight model-specific Ptype labels across initial draw, overlay redraw, missing data, PNG/GIF captions; PMM semantics retained');
