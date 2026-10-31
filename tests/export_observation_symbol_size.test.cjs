'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),src=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'config.json'),'utf8'));
assert.equal(config.display.exportObservationMarkerScale,1);
const begin=src.indexOf('// The single-panel export expands its real CSS map viewport');
const end=src.indexOf('async function captureMapPNG(',begin);
assert.ok(begin>0&&end>begin,'export-specific observation scaling helpers exist');
const c=vm.createContext({st:{cfg:{display:{exportObservationMarkerScale:1}}},observationVisible:()=>true,console});
vm.runInContext(src.slice(begin,end),c);
const radius=['interpolate',['linear'],['zoom'],2,3.8,5,5,9,6];
const icon=['interpolate',['linear'],['zoom'],2,.59,5,.73,9,.9];
const at=(style,z)=>c.observationMarkerAtZoom(style,z);
assert.equal(at(radius,2),3.8);
assert.equal(at(radius,5),5);
assert.equal(at(radius,9),6);
assert.equal(at(radius,3.5),4.4);
assert.equal(at(icon,7),.815);
assert.equal(at(radius,15),6);
assert.equal(at(null,4),null);
assert.equal(at(['bogus'],4),null);
const factor=(scale,z0,z1,style,single=true)=>c.exportObservationMarkerScale(scale,z0,z1,style,single);
// Validate *actual* marker size at export zoom, instead of just asserting the
// raw factor exceeds 2. A previous sqrt-of-export-size multiplier passed that
// weak test and still produced undersized output images.
for(const scale of [1.5,2.5,4,6]){
 const z0=2.7,z1=z0+Math.log2(scale);
 for(const symbol of [radius,icon]){
  const output=at(symbol,z1)*factor(scale,z0,z1,symbol,true);
  const wanted=at(symbol,z0)*scale*1.2;
  assert.ok(Math.abs(output-wanted)<1e-9,`size matches map enlargement for scale ${scale}`);
 }
}
assert.ok(factor(4,3,5,radius)>3,'single PNG symbols scale substantially');
const all=factor(1,3,3,radius,false);
assert.ok(Math.abs(all-1.7)<1e-9,'comparison grid export symbols are 70% larger');
c.st.cfg.display.exportObservationMarkerScale=1.5;
const gainFactor=factor(3,3,3+Math.log2(3),radius,true);
assert.ok(Math.abs(gainFactor*at(radius,3+Math.log2(3))-1.8*3*at(radius,3))<1e-9,'config multiplier is applied');
c.st.cfg.display.exportObservationMarkerScale=1;
const scaled=c.scaledObservationZoomSize(radius,2);
assert.equal(scaled[0],'interpolate');
assert.equal(scaled[2][0],'zoom');
assert.deepEqual(JSON.parse(JSON.stringify(scaled.slice(3))),[2,7.6,5,10,9,12]);
assert.deepEqual(radius,['interpolate',['linear'],['zoom'],2,3.8,5,5,9,6],'source style is unchanged');
const style={
 'evu-observed-metar':{paint:{'circle-radius':radius,'circle-stroke-width':1.25},layout:{}},
 'evu-observed-mping':{paint:{},layout:{'icon-size':icon}}
};
const map={
 getLayer:id=>style[id],
 getPaintProperty:(id,k)=>style[id].paint[k],
 getLayoutProperty:(id,k)=>style[id].layout[k],
 setPaintProperty:(id,k,v)=>{style[id].paint[k]=v;},
 setLayoutProperty:(id,k,v)=>{style[id].layout[k]=v;}
};
const exportZoom=3+Math.log2(4);
const restore=c.applyExportObservationMarkerSize(map,4,3,exportZoom,true);
const rExport=at(style['evu-observed-metar'].paint['circle-radius'],exportZoom);
const iExport=at(style['evu-observed-mping'].layout['icon-size'],exportZoom);
assert.ok(Math.abs(rExport-at(radius,3)*4*1.2)<1e-9,'METAR exported radius scales with viewport');
assert.ok(Math.abs(iExport-at(icon,3)*4*1.2)<1e-9,'mPING exported size scales with viewport');
assert.ok(style['evu-observed-metar'].paint['circle-stroke-width']>1.25,'outline scales as well');
restore();
assert.equal(style['evu-observed-metar'].paint['circle-radius'],radius,'METAR style restored exactly');
assert.equal(style['evu-observed-metar'].paint['circle-stroke-width'],1.25,'METAR outline restored');
assert.equal(style['evu-observed-mping'].layout['icon-size'],icon,'mPING style restored exactly');
const failing={...map,setLayoutProperty(){throw new Error('simulated icon style rejection');}};
const undo=c.applyExportObservationMarkerSize(failing,4,3,exportZoom,true);
undo();
assert.equal(style['evu-observed-metar'].paint['circle-radius'],radius,'partial failure restores changed properties');
assert.match(src,/if\(!sharpIndividual\)restoreObservationMarkers=applyExportObservationMarkerSize\(map,\s*renderScale,oldZoom,exportZoom,false\)/);
assert.match(src,/\}finally\{\s*restoreObservationMarkers\(\);\s*if\(changedRatio\)/);
assert.match(src,/const canvas=selection\.type==='all'\?await exportAll\(ratio,true\):await exportPanel\(panel,ratio,true\)/);
console.log('PASS export markers preserve on-screen scale for PNG/GIF, interpolate correctly, honor gain and restore live styles');
