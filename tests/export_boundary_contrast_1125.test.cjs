'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const start=source.indexOf('// Exports now use the same cleaner two-tone geography treatment as the');
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
restore();
assert.deepEqual(style,original,'export helper now leaves live map paint unchanged');
st.theme='light';const restoreLight=c.applyExportBoundaryStyle(map);
assert.deepEqual(style,original,'light-theme capture unchanged');
restoreLight();
st.theme='dark';
const flaky={...map,setPaintProperty:(id,k,v)=>{if(id==='states'&&k==='line-width')throw new Error('simulated failed paint write');style[id][k]=v;}};
const undo=c.applyExportBoundaryStyle(flaky);undo();
assert.deepEqual(style,original,'no-op helper cannot leave modified paint behind');
assert.match(source,/restoreExportBoundaries=applyExportBoundaryStyle\(map\)/,'applied during PNG and GIF map captures');
assert.match(source,/\}finally\{\s*restoreExportBoundaries\(\)/,'finally restores live settings');
assert.match(source,/redrawDifferenceBoundaries\(image,map,\{exportGeoVisible:visible,exportStyle:false\}\)/,
 'difference export requests the live two-tone outline treatment');
console.log('PASS export helper is a safe no-op and exports rely on the live two-tone geography styling');
