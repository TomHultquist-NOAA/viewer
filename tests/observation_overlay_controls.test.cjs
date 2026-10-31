'use strict';
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const src=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
assert.match(html,/id="overlaysLabel">Overlays</);
assert.match(html,/id="contourOption"[^>]+hidden/);
assert.match(html,/id="obsControl"[^>]+hidden/);
assert.match(html,/id="obsSynoptic" checked><span>METARs/);
assert.match(html,/id="obsMping" checked><span>mPING/);
assert.match(html,/id="obsAttribution"/);
assert.match(src,/const linesAvailable=contoursAvailable\(\);/);
assert.match(src,/el\.obsControl\.hidden=!reportsAvailable/);
assert.match(src,/el\.contourOption\.hidden=!linesAvailable/);
assert.match(src,/el\.contourControl\.hidden=!\(linesAvailable\|\|reportsAvailable\|\|heightAvailable\|\|windAvailable\|\|st\.field===/);
assert.match(css,/\.overlays-switches/);
assert.match(src,/filter:\['==',\['get','source'\],'synoptic'\]/);
assert.match(src,/filter:\['==',\['get','source'\],'mping'\]/);
assert.match(src,/type:'circle'/);
assert.match(src,/type:'symbol'/);
assert.match(src,/mpingTriangleImage/);
assert.match(src,/refreshMpingTriangleTheme\(m\)/);
const a=src.indexOf('// Public, preprocessed observation GeoJSON:');
const b=src.indexOf('/* OMD EVU autumnplot-gl',a);
const ctx=vm.createContext({
 st:{field:'ptype',cfg:{ptypeObservations:{enabled:true,path:'data/ptype_observations/'}},theme:'dark',active:[],obsCurrent:null,
   obsEnabled:{synoptic:true,mping:true}},
 el:{obsCount:{textContent:'',hidden:true}},PTYPE:['#0','#1','#2','#3','#4','#5'],PTYPE_LABELS:['Unknown','Rain','Snow','Freezing rain','Sleet','Mixed'],
 document:{createElement:()=>({width:0,height:0,getContext:()=>({beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},getImageData(){return {width:36,height:36,data:new Uint8ClampedArray(36*36*4)}}})})},
 Date,Number,console,URL,fetch(){},maplibregl:{Popup:class{}},fmt:()=>''
});
vm.runInContext(src.slice(a,b),ctx);
const map={sources:{},layers:{},images:{},handlers:{},
 getSource(id){return this.sources[id];},addSource(id,obj){this.sources[id]={...obj,setData:data=>{this.sources[id].data=data;}};},
 getLayer(id){return this.layers[id];},addLayer(obj){this.layers[obj.id]=obj;},
 hasImage(id){return Boolean(this.images[id]);},addImage(id,img){this.images[id]=img;},updateImage(id,img){this.images[id]=img;},
 on(event,id,cb){this.handlers[event+':'+id]=cb;},setLayoutProperty(id,key,val){this.layers[id].layout??={};this.layers[id].layout[key]=val;}
};
ctx.map=map;ctx.p={map,obsClickInstalled:null};
vm.runInContext('ensureObservationOverlay(p)',ctx);
assert.equal(map.layers['evu-observed-metar'].type,'circle');
assert.equal(map.layers['evu-observed-mping'].type,'symbol');
assert.equal(Object.keys(map.images).length,5);
for(let i=1;i<=5;i++)assert.ok(map.images['evu-observed-mping-'+i]);
assert.equal(Object.keys(map.handlers).length,6);
vm.runInContext('ensureObservationOverlay(p)',ctx);
assert.equal(Object.keys(map.handlers).length,6,'no duplicate map event handlers');
vm.runInContext("st.obsCurrent={features:[{type:'Feature',properties:{source:'synoptic',ptype:1}}, {type:'Feature',properties:{source:'mping',ptype:2}}]};syncObservationPanel(p)",ctx);
assert.equal(map.sources['evu-observed-ptype'].data.features.length,2);
vm.runInContext('st.obsEnabled.mping=false;syncObservationPanel(p)',ctx);
assert.equal(map.sources['evu-observed-ptype'].data.features.length,1);
vm.runInContext("st.field='mslp';syncObservationPanel(p)",ctx);
assert.equal(map.layers['evu-observed-metar'].layout.visibility,'none');
assert.equal(map.layers['evu-observed-mping'].layout.visibility,'none');
console.log('PASS: Overlays control, METAR circles, mPING triangles, source filters, theme images, controls and visibility');
