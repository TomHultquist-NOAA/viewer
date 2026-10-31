'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const start=code.indexOf('// A map may start well after the SPC fetch');
const end=code.indexOf('async function refreshSPCReports()',start);
assert.ok(start>=0&&end>start,'LSR reconciliation has a dedicated per-panel function');
const makeMap=()=>{
 let reportSource=null, reportLayer=false, weatherLayer=true;
 const calls=[];
 return {calls,
  getSource(id){if(id==='evu-spc-lsr')return reportSource;return null;},
  addSource(id,opt){assert.equal(id,'evu-spc-lsr');reportSource={data:opt.data,setData(d){this.data=d;calls.push(['data',d.features.length]);}};},
  getLayer(id){if(id==='evu-spc-lsr')return reportLayer?{id}:undefined;return id.startsWith('evu-field')&&weatherLayer?{id}:undefined;},
  addLayer(layer){assert.equal(layer.id,'evu-spc-lsr');reportLayer=true;calls.push(['add-layer']);},
  setLayoutProperty(id,property,val){calls.push(['visibility',id,property,val]);},
  moveLayer(id){calls.push(['move-to-top',id]);},
  triggerRepaint(){calls.push(['repaint']);},
  on(){},getCanvas(){return{style:{}}}
 };
};
const rows=['RRFS','HRRR','REFS-1','REFS-2','REFS-3','REFS-4','REFS-5','REFS Mean','Analysis'];
const features=[{type:'Feature',properties:{type:'hail'},geometry:{type:'Point',coordinates:[-99,39]}}];
const st={spcEnabled:true,field:'sbcape',spcCurrent:features,active:[],theme:'dark'};
const el={spcCount:{textContent:''}};
const SPC_EMPTY={type:'FeatureCollection',features:[]};
const SPC_COLORS={tornado:'#e63737',wind:'#2e80dc',hail:'#35b86b'};
const ctx=vm.createContext({st,el,SPC_EMPTY,SPC_COLORS,spcVisible:()=>st.spcEnabled,console,Map,Set});
vm.runInContext(code.slice(code.indexOf('function ensureSPCOverlay(p)'),end),ctx);
for(let i=0;i<rows.length;i++)st.active.push({i,cfg:{label:rows[i]},map:makeMap()});
ctx.syncSPCPanels();
for(const p of st.active){
 assert.equal(p.map.getSource('evu-spc-lsr').data.features.length,1,`${p.cfg.label} receives the same LSRs`);
 assert.ok(p.map.calls.some(x=>x[0]==='move-to-top'),`${p.cfg.label} LSR layer above other layers`);
 assert.ok(p.map.calls.some(x=>x[0]==='visibility'&&x[3]==='visible'),`${p.cfg.label} LSR layer visible`);
}
assert.equal(el.spcCount.textContent,'1 preliminary reports');
// Late panel activation after reports were already fetched must still be populated.
const late={i:9,cfg:{label:'Late REFS'},map:makeMap()};ctx.syncSPCPanel(late);
assert.equal(late.map.getSource('evu-spc-lsr').data.features.length,1);
assert.ok(late.map.calls.some(x=>x[0]==='move-to-top'));
// Disabling reports must hide the overlay for every model, not just the first.
st.spcEnabled=false;ctx.syncSPCPanels();
for(const p of st.active){
 assert.equal(p.map.getSource('evu-spc-lsr').data.features.length,0);
 assert.ok(p.map.calls.some(x=>x[0]==='visibility'&&x[3]==='none'));
}
// Regression checks for map-ready and post-weather rendering paths.
assert.match(code,/await p\.mapReady;\s*if\(p\.map!==m\)return null;[\s\S]{0,250}syncSPCPanel\(p\);/);
assert.match(code,/await waitPaint\(p\.map\);[\s\S]{0,300}syncSPCPanel\(p\);/);
assert.match(code,/p\.spcClickInstalled=false;p\.frame\.replaceChildren/);
console.log('PASS LSR overlays synchronize all nine panels, late REFS activation, field rendering, and layer order');
