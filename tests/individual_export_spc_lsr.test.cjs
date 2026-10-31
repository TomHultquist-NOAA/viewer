'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const snapshotStart=src.indexOf('function snapshotIndividualExportObservations(');
const snapshotEnd=src.indexOf('async function captureMapPNG(',snapshotStart);
const drawStart=src.indexOf('function drawIndividualExportObservations(');
const drawEnd=src.indexOf('function panelMapRatio(p){',drawStart);
assert.ok(snapshotStart>0&&snapshotEnd>snapshotStart&&drawStart>snapshotEnd&&drawEnd>drawStart);
const spcColor={tornado:'#e63737',wind:'#2e80dc',hail:'#35b86b'};
const spcReport=(type,lon,lat)=>({properties:{type,time:'2026-10-26T15:00:00Z'},geometry:{coordinates:[lon,lat]}});
const reportList=[spcReport('tornado',-100,40),spcReport('wind',-99,42),spcReport('hail',-98,44),spcReport('flood',-97,39),spcReport('wind',NaN,45)];
let spcEnabled=true;
const st={cfg:{display:{exportObservationMarkerScale:1}},obsCurrent:null,spcCurrent:reportList,theme:'dark'};
const context=vm.createContext({
 st, PTYPE:[null,'#4bc86c','#55b2f0','#e75889','#b266d8','#f0c764'],
 SPC_COLORS:spcColor,spcVisible:()=>spcEnabled,observationVisible:()=>false,
 filteredObservationGeoJSON:()=>{throw Error('must not read METAR when off');},console
});
vm.runInContext(src.slice(snapshotStart,snapshotEnd)+src.slice(drawStart,drawEnd),context);
const map={project:([lon,lat])=>({x:(lon+101)*100,y:(lat-38)*30})};
const snapshot=context.snapshotIndividualExportObservations(map,600,300);
assert.equal(snapshot.points.length,3,'SPC-only exports include tornado, wind, hail but not unknown/invalid reports');
assert.deepEqual(Array.from(snapshot.points,t=>t.type),['tornado','wind','hail']);
assert.ok(snapshot.points.every(t=>t.source==='spc'));
const calls=[];
const canvas={save(){calls.push(['save']);},restore(){calls.push(['restore']);},beginPath(){},
 rect(...a){calls.push(['cliprect',...a]);},clip(){calls.push(['clip']);},
 arc(...a){calls.push(['arc',...a]);},moveTo(){},lineTo(){},closePath(){},
 fill(){calls.push(['fill',this.fillStyle]);},stroke(){calls.push(['stroke',this.strokeStyle,this.lineWidth]);}};
const rect={sx:0,sy:0,sw:1200,sh:600,dx:20,dy:50,dw:1200,dh:600};
const im={naturalWidth:1200,naturalHeight:600};
context.drawIndividualExportObservations(canvas,snapshot,rect,im,1896);
assert.equal(calls.filter(x=>x[0]==='arc').length,3,'SPC symbols all rendered as circles');
for(const color of Object.values(spcColor))assert.ok(calls.some(x=>x[0]==='fill'&&x[1]===color),'retains SPC color '+color);
assert.equal(calls.filter(x=>x[0]==='stroke'&&x[1]==='#ffffff').length,3,'retains dark-theme contrast outlines');
const circle=calls.find(x=>x[0]==='arc');
assert.ok(Math.abs(circle[1]-220)<1e-6&&Math.abs(circle[2]-170)<1e-6,'geographically projected in final PNG pixels');
assert.ok(circle[3]>=11.9&&circle[3]<=12.1,'LSR circle matches METAR final-image radius at 1920px');
const small=[];
context.drawIndividualExportObservations({...canvas,arc:(...a)=>small.push(a)},snapshot,rect,im,1180);
assert.ok(small[0][2]<circle[3],'GIF symbols scale down proportionally');
context.st.cfg.display.exportObservationMarkerScale=1.5;
const large=[];
context.drawIndividualExportObservations({...canvas,arc:(...a)=>large.push(a)},snapshot,rect,im,1896);
assert.ok(Math.abs(large[0][2]-circle[3]*1.5)<1e-5,'marker scale config affects SPC exports');
spcEnabled=false;
assert.equal(context.snapshotIndividualExportObservations(map,600,300),null,'SPC checkbox controls export inclusion');
spcEnabled=true;context.st.spcCurrent=[];
assert.equal(context.snapshotIndividualExportObservations(map,600,300),null,'no phantom markers when there are no reports');
assert.equal((src.match(/drawIndividualExportObservations\(ctx,captured\.observations,rect,im,boxW\)/g)||[]).length,1,'all-panels export unaffected');
console.log('PASS individual SPC-only PNG/GIF final marker size, symbol type, color, clipping, projection and overlay gating');
