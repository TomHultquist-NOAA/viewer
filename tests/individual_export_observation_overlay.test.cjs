'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const start=src.indexOf('// Individual exports paint the report symbols');
const finish=src.indexOf('async function captureMapPNG(',start);
const drawStart=src.indexOf('// Paint reports on top of the high-resolution individual-panel map');
const drawEnd=src.indexOf('function panelMapRatio(p){',drawStart);
assert.ok(start>0&&finish>start&&drawStart>finish&&drawEnd>drawStart);
const report=(source,ptype,lon,lat)=>({properties:{source,ptype},geometry:{coordinates:[lon,lat]}});
const reports=[report('synoptic',1,-100,40),report('mping',2,-99,41),report('other',2,-98,42),report('synoptic',0,-97,43)];
const ctx=vm.createContext({
 st:{cfg:{display:{exportObservationMarkerScale:1}},obsCurrent:{features:reports},theme:'dark'},
 PTYPE:['#192939','#4bc86c','#55b2f0','#e75889','#b266d8','#f0c764'],
 observationVisible:()=>true,
 filteredObservationGeoJSON:()=>({features:reports}),spcVisible:()=>false,SPC_COLORS:{tornado:'#e63737',wind:'#2e80dc',hail:'#35b86b'},console
});
vm.runInContext(src.slice(start,finish)+src.slice(drawStart,drawEnd),ctx);
const map={project:([lon])=>({x:(lon+101)*100,y:120})};
const obs=ctx.snapshotIndividualExportObservations(map,400,240);
assert.equal(obs.points.length,2,'only valid, enabled observed Ptype reports drawn');
assert.equal(obs.points[0].x,.25);
assert.equal(obs.points[0].y,.5);
assert.equal(obs.light,false);
const ops=[];
const canvas={
 save(){ops.push(['save']);},restore(){ops.push(['restore']);},
 beginPath(){},rect(...args){ops.push(['rect',...args]);},clip(){},
 arc(...args){ops.push(['circle',...args]);},
 moveTo(...args){ops.push(['move',...args]);},lineTo(...args){ops.push(['line',...args]);},
 closePath(){},fill(){ops.push(['fill',this.fillStyle,this.globalAlpha]);},
 stroke(){ops.push(['stroke',this.strokeStyle,this.lineWidth]);}
};
const rect={sx:200,sy:0,sw:1400,sh:800,dx:10,dy:50,dw:1400,dh:800};
const image={naturalWidth:1600,naturalHeight:800};
ctx.drawIndividualExportObservations(canvas,obs,rect,image,1896);
const circle=ops.find(a=>a[0]==='circle');
assert.ok(circle,'METAR circle drawn');
assert.ok(Math.abs(circle[1]-(10+(400-200)))<.00001,'latitude/longitude projected through captured crop');
assert.ok(Math.abs(circle[2]-(50+400))<.00001,'correct Y after capture transform');
assert.ok(circle[3]>=11.9&&circle[3]<=12.1,'standalone PNG radius ~12 presentation pixels, regardless of CSS panel size');
assert.ok(ops.some(a=>a[0]==='move'),'mPING triangle drawn');
assert.ok(ops.some(a=>a[0]==='fill'&&a[1]==='#4bc86c'));
assert.ok(ops.some(a=>a[0]==='fill'&&a[1]==='#55b2f0'));
assert.ok(ops.some(a=>a[0]==='stroke'&&a[1]==='#ffffff'));
const gifOps=[];
const gifCanvas={...canvas,arc:(...a)=>gifOps.push(a)};
ctx.drawIndividualExportObservations(gifCanvas,obs,rect,image,1180);
assert.ok(gifOps[0][2]<circle[3],'GIF has proportionally sized circle');
ctx.st.cfg.display.exportObservationMarkerScale=1.5;
const large=[];
ctx.drawIndividualExportObservations({...canvas,arc:(...a)=>large.push(a)},obs,rect,image,1896);
assert.ok(Math.abs(large[0][2]-circle[3]*1.5)<.001,'optional export-only scale retained');
assert.match(src,/if\(sharpIndividual\)exportObservations=snapshotIndividualExportObservations\(map,cssW,cssH\)/);
assert.match(src,/if\(!sharpIndividual\)restoreObservationMarkers=applyExportObservationMarkerSize/);
assert.match(src,/drawIndividualExportObservations\(ctx,captured\.observations,rect,im,boxW\)/);
assert.equal((src.match(/drawIndividualExportObservations\(ctx,captured\.observations,rect,im,boxW\)/g)||[]).length,1,'only individual export compositing is changed');
console.log('PASS final image symbols are fixed output size, crop-aligned, independently colored and all-panels untouched');
