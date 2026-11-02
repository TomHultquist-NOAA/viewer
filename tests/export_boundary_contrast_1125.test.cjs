'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const start=source.indexOf('// Export-only outline enhancement.');
const end=source.indexOf('async function captureMapPNG(',start);
assert.ok(start>0&&end>start,'export boundary helper exists');
const st={theme:'dark'},c=vm.createContext({st,console});
vm.runInContext(source.slice(start,end),c);
const style={};
for(const id of ['coast','coast-detail','country','country-detail','states','counties']){
 style[id]={'line-color':id==='states'||id==='counties'?'#5d7888':'#adc3cc','line-width':id==='counties'?0.67:1.1,'line-opacity':id==='counties'?.78:.9};
}
const original=JSON.parse(JSON.stringify(style));
const map={getLayer:id=>style[id],getPaintProperty:(id,k)=>style[id][k],setPaintProperty:(id,k,v)=>{style[id][k]=v;}};
const restore=c.applyExportBoundaryStyle(map);
for(const id of Object.keys(style)){
 assert.notEqual(style[id]['line-color'],original[id]['line-color'],`${id} color stronger`);
 assert.ok(style[id]['line-width']>original[id]['line-width'],`${id} line thicker`);
 assert.ok(style[id]['line-opacity']>=original[id]['line-opacity'],`${id} line opacity stronger`);
}
restore();
assert.deepEqual(style,original,'dark export paint settings restored exactly');
st.theme='light';const restoreLight=c.applyExportBoundaryStyle(map);
assert.deepEqual(style,original,'light-theme capture unchanged');
restoreLight();
st.theme='dark';
const flaky={...map,setPaintProperty:(id,k,v)=>{if(id==='states'&&k==='line-width')throw new Error('simulated failed paint write');style[id][k]=v;}};
const undo=c.applyExportBoundaryStyle(flaky);undo();
assert.deepEqual(style,original,'failed individual property update does not leave modified paint');
assert.match(source,/restoreExportBoundaries=applyExportBoundaryStyle\(map\)/,'applied during PNG and GIF map captures');
assert.match(source,/\}finally\{\s*restoreExportBoundaries\(\)/,'finally restores live settings');
assert.match(source,/redrawDifferenceBoundaries\(outlines,map,\{exportGeoVisible:visible,exportStyle:true\}\)/,
 'difference export requests enhanced outlines');
assert.match(source,/const exportStyle=!!snapshot\.exportStyle/,
 'difference exports use an explicit two-tone stroke across both themes');
console.log('PASS exported dark-mode outlines strengthened, differences covered, and live paint restored');
