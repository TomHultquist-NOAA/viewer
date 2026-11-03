'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../css/styles.css'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const take=(from,to)=>{
 const a=script.indexOf(from),b=script.indexOf(to,a);
 assert.ok(a>=0&&b>a,`can find function ${from}`);
 return script.slice(a,b);
};
const palette=take('function themeColors(){','function mapStyle(){');
const skeleton=take('function addGeographySkeleton(m){','// When a user selects a field');
const visibility=take('function updateGeographyVisibility(p){','function maybeDetailedGeography(p){');
const st={theme:'dark',field:'mslp',cfg:{display:{}}};
const ctx=vm.createContext({st,console,FIELDS:{mslp:{bandColors:['#572d87','#faf4c0','#8d465f']}},detailThreshold:()=>0,countyThreshold:()=>4.25,detailMaskData:()=>({type:'FeatureCollection',features:[]}),themeColors:null});
vm.runInContext(palette+'\n'+skeleton+'\n'+visibility,ctx);
const sources=new Map(),layers=new Map(),order=[];
const zoom=[],layout=[];
const map={
 getSource:id=>sources.get(id),
 addSource:(id,data)=>sources.set(id,data),
 getLayer:id=>layers.get(id),
 addLayer:entry=>{layers.set(entry.id,entry);order.push(entry.id);},
 setLayerZoomRange:(id,min,max)=>zoom.push([id,min,max]),
 setLayoutProperty:(id,name,value)=>layout.push([id,name,value])
};
for(const theme of ['dark','light']){
 st.theme=theme;
 const c=ctx.themeColors();
 assert.ok(c.boundaryCasing&&c.line&&c.minor);
 if(theme==='dark')assert.notEqual(c.line,c.boundaryCasing);
}
st.theme='dark';
ctx.addGeographySkeleton(map);
for(const id of ['coast','coast-detail','country','country-detail','states','counties']){
 assert.ok(layers.has(id),`${id}: main layer exists`);
 assert.ok(layers.has(id+'-casing'),`${id}: casing exists`);
 assert.equal(layers.get(id).source,layers.get(id+'-casing').source,`${id}: same geometry`);
 assert.ok(order.indexOf(id+'-casing')<order.indexOf(id),`${id}: casing beneath inner line`);
 assert.ok(layers.get(id+'-casing').paint['line-width']>layers.get(id).paint['line-width'],`${id}: thin two-tone casing`);
}
assert.match(script,/p\.map\.addLayer\(layer,p\.map\.getLayer\('coast-casing'\)\?'coast-casing'/,
 'weather field below casing and inner geography');
const p={map,geoApplied:new Set(['coast_detail'])};
ctx.updateGeographyVisibility(p);
for(const id of ['coast','coast-casing'])assert.ok(layout.some(([layer,kind,value])=>layer===id&&kind==='visibility'&&value==='none'));
for(const id of ['country','country-casing'])assert.ok(layout.some(([layer,kind,value])=>layer===id&&kind==='visibility'&&value==='visible'));
for(const id of ['coast-detail','coast-detail-casing','country-detail','country-detail-casing'])
 assert.ok(zoom.some(([layer,min])=>layer===id&&min===0));
for(const id of ['counties','counties-casing'])
 assert.ok(zoom.some(([layer,min])=>layer===id&&min===4.25));
assert.match(css,/\.interpolation-control \.contour-switch\{height:28px\}/,
 '28px compact desktop interpolation aligns with Map view');
assert.match(css,/\.interpolation-control \.contour-switch\{height:32px;/,
 '32px interpolation matches non-desktop controls');
assert.match(html, /css\/styles\.css\?v=1\.1\.40-20261102/);
console.log('PASS theme-dependent two-tone live borders, ordering above shading, synchronized visibility, and toolbar alignment');
