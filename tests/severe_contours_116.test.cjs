'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const start=src.indexOf('const CONTOUR_STEPS='),end=src.indexOf('function scheduleContourRedraw(',start);
assert(start>=0&&end>start);
const context=vm.createContext({console,Float32Array,Math,Number});
vm.runInContext(src.slice(start,end),context);
for(const field of ['sbcape','mlcape','mucape','srh01','srh03','shear01','shear06','mxuphl','mxuphl_run','scp','stp','stp_fixed']){
 assert.equal(vm.runInContext(`contoursAvailable('${field}')`,context),true,`${field} has contour option`);
 assert.equal(vm.runInContext(`contourLevels('${field}',-200,6000,4.5,650,410).length>0`,context),true,`${field} has usable levels`);
}
for(const categorical of ['ptype','refc_ptype','csnow','cicep','cfrzr','crain','snowpresence']){
 assert.equal(vm.runInContext(`contoursAvailable('${categorical}')`,context),false,`${categorical} remains categorical`);
}
// The runtime checkbox is revealed by updateContourControl, not only the helper.
context.st={field:'sbcape',spcEnabled:false,overlayHeight:false,overlayUpperWind:false,
 overlaySurfaceWind:false,overlayMSLP:false,overlayMSLP850:false,contours:false,active:[]};
context.el=Object.fromEntries(['contourControl','spcControl','spcToggleBtn','spcCount','heightOption','windOption',
 'contourOption','mslp850Option','mslp850ToggleBtn','obsControl','obsCount','obsAttribution',
 'heightToggleBtn','windToggleBtn','contourToggleBtn'].map(key=>[key,{hidden:true,checked:false}]));
context.observationVisible=()=>false;
context.SPC_FIELDS=new Set(['sbcape']);
context.heightVariableName=()=>null;
context.windComponentNames=()=>null;
context.FIELDS={sbcape:{label:'Surface-based CAPE',unit:'J/kg'}};
vm.runInContext('updateContourControl()',context);
assert.equal(context.el.contourControl.hidden,false,'overlay control is visible for CAPE');
assert.equal(context.el.contourOption.hidden,false,'Contours checkbox is visible for CAPE');
assert.equal(vm.runInContext('contourInterval("sbcape",2.5)',context),1000);
assert.equal(vm.runInContext('contourInterval("sbcape",4.5)',context),500);
assert.equal(vm.runInContext('contourInterval("sbcape",7)',context),250);
assert.deepEqual(Array.from(vm.runInContext('contourLevels("sbcape",0,3000,4.5,650,410)',context)),[500,1000,1500,2000,2500]);
assert.deepEqual(Array.from(vm.runInContext('contourLevels("stp",0,5,7,650,410)',context)),[.5,1,1.5,2,2.5,3,3.5,4,4.5]);
// Confirm real drawContours performs nonempty strokes for a CAPE gradient.
const strokes=[];
const ctx={save(){},restore(){},setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},translate(){},rotate(){},setLineDash(){},stroke(){strokes.push(this.strokeStyle)},measureText(v){return{width:String(v).length*7}},strokeText(){},fillText(){}};
const canvas={width:0,height:0,getContext(){return ctx}};
const map={getContainer(){return{clientWidth:700,clientHeight:420}},getCanvas(){return{clientWidth:700,clientHeight:420}},getZoom(){return 4.5},isMoving(){return false},unproject([x,y]){return{lng:x,lat:y}}};
context.p={contourCanvas:canvas,map,cfg:{field:'sbcape'},rawField:{sampleField(x){return x*7}},status:'ready'};
context.st={theme:'dark',contours:true};context.devicePixelRatio=1;context.globeFrontVisible=()=>true;
vm.runInContext('drawContours(p,{field:p.rawField,key:"sbcape"})',context);
assert(strokes.length>=2,'CAPE contour lines actually draw');
console.log('PASS CAPE, SRH, shear, UH, composite and tornado indices contour toggles and meteorological contour thresholds');
