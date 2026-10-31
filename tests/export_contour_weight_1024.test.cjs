'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const a=src.indexOf('const CONTOUR_STEPS='),b=src.indexOf('function scheduleContourRedraw(',a);
assert(a>0&&b>a);const context=vm.createContext({console,Float32Array,Number,Math});
vm.runInContext(src.slice(a,b),context);
const run=(field,scale=1)=>{
 const calls=[],ctx={dash:[],cap:null,save(){},restore(){},setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},translate(){},rotate(){},setLineDash(v){this.dash=[...v]},stroke(){calls.push({dash:[...this.dash],width:this.lineWidth,cap:this.lineCap})},measureText(x){return{width:String(x).length*8}},strokeText(){},fillText(){}};
 const canvas={width:0,height:0,getContext(){return ctx}};
 const map={getContainer(){return{clientWidth:500,clientHeight:300}},getCanvas(){return{clientWidth:500,clientHeight:300}},getZoom(){return 4.2},isMoving(){return false},unproject([x,y]){return{lng:x,lat:y}}};
 const fieldSource={sampleField(x){return field==='mslp'?990+x*.12:field.startsWith('h')?1300+x: -10+x*.1}};
 Object.assign(context,{p:{contourCanvas:canvas,map,cfg:{field},status:'ready'},fieldSource,scale,st:{theme:'dark',contours:true},devicePixelRatio:1,globeFrontVisible:()=>true});
 vm.runInContext('drawContours(p,{field:fieldSource,key:p.cfg.field,always:true,exportScale:scale})',context);return calls;
};
for(const name of ['h850','mslp']){
 const live=run(name),ex=run(name,2);
 assert(live.length>=2&&ex.length>=2);
 assert.equal(ex[0].dash.length,0);assert.equal(ex[1].dash.length,0);
 assert(ex[1].width>live[1].width*1.9,'solid core should retain stronger export weight');
}
for(const name of ['t850','absv500','wspd300']){
 const live=run(name),ex=run(name,2);
 assert(live.length>=2&&ex.length>=2);
 assert.equal(JSON.stringify(live[0].dash),'[6,4]','live line styling unchanged');
 assert.equal(JSON.stringify(ex[0].dash),'[18,14]','long, clear export dashes');
 assert.equal(ex[0].cap,'butt','export dash halo cannot fill short gaps');
 assert(ex[1].width>live[1].width*1.9,'export core weight increased');
}
assert(src.includes('wspd300:{label:\'300 hPa forecast\''));
assert(src.includes('exportScale:contourExportScale'));
assert(src.includes('else drawContours(p,{exportScale:contourExportScale})'));
console.log('PASS 300 hPa forecast name and export-only distinct solid/dashed contour styling');
