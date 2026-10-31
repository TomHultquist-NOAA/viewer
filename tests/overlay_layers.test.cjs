'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const src=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const makeControl=()=>({hidden:true,checked:false,title:''});
const el={spcControl:makeControl(),spcToggleBtn:makeControl(),spcCount:makeControl(),contourControl:makeControl(),contourOption:makeControl(),mslp850Option:makeControl(),mslp850ToggleBtn:makeControl(),heightOption:makeControl(),windOption:makeControl(),obsControl:makeControl(),obsCount:makeControl(),obsAttribution:makeControl(),contourToggleBtn:makeControl(),heightToggleBtn:makeControl(),windToggleBtn:makeControl()};
const st={field:'t850',contours:false,overlayMSLP:true,overlayMSLP850:true,overlayHeight:true,overlayUpperWind:true,overlaySurfaceWind:true,active:[],exportRender:false};
const FIELDS={t850:{label:'850 hPa forecast',unit:'°C'},absv500:{label:'500 hPa forecast'},wspd10:{label:'10-m wind speed'},mslp:{label:'MSLP'},ptype:{label:'Precipitation type'}};
function fieldHasHeight(f){return ['t925','t850','t700','absv500'].includes(f);}
const ctx=vm.createContext({el,st,FIELDS,SPC_FIELDS:new Set(['refc','mxuphl','mxuphl_run']),console,
 heightVariableName(f){return fieldHasHeight(f)?'h'+(f==='absv500'?'500':f.slice(1)):null;},
 windComponentNames(f){return fieldHasHeight(f)||f==='wspd10'?['u','v']:null;},
 contoursAvailable(f=st.field){return f!=='ptype';},
 observationVisible(){return st.field==='ptype';},
 contourInterval(){return 5;},
 clearContours(p){p.calls.push(['clear']);},
 suspendContours(p){p.calls.push(['suspend']);},
 drawContours(p,opts){p.calls.push(['draw',opts||{}]);},
 requestAnimationFrame(cb){cb();return 1;},cancelAnimationFrame(){},clearTimeout(){},setTimeout(){throw Error('unexpected timeout');}
});
assert.match(html,/id="heightOption"[^>]*hidden[^>]*><input type="checkbox" id="heightToggleBtn" checked><span>Height/);
assert.match(html,/id="windOption"[^>]*hidden[^>]*><input type="checkbox" id="windToggleBtn" checked><span>Wind/);
assert.match(html,/id="contourOption"[^>]*hidden[^>]*><input type="checkbox" id="contourToggleBtn"/);
assert.match(src,/overlayHeight:true,overlayUpperWind:true,overlaySurfaceWind:true/);
assert.match(src,/localStorage\.setItem\('omd_evu_height_overlay'/);
assert.match(src,/localStorage\.setItem\(storage,st\[key\]/);
assert.match(src,/!overlayWindVisible\(p\.cfg\?\.field\|\|st\.field\)/);
assert.match(src,/const withHeight=Boolean\(overlayHeightVisible\(plottedField\)&&p\.heightField\)/);
assert.match(src,/if\(p\.wind&&windComponentNames\(plottedField\)&&overlayWindVisible\(plottedField\)/);
const a=src.indexOf('function overlayHeightVisible(');
const b=src.indexOf('function suspendContours(',a);
vm.runInContext(src.slice(a,b),ctx);
function assertControls(field,{height=false,wind=false,contours=false,reports=false}={}){
 st.field=field;vm.runInContext('updateContourControl()',ctx);
 assert.equal(el.contourControl.hidden,!(height||wind||contours||reports),`overlays visibility: ${field}`);
 assert.equal(el.heightOption.hidden,!height,`height visibility: ${field}`);
 assert.equal(el.windOption.hidden,!wind,`wind visibility: ${field}`);
 assert.equal(el.contourOption.hidden,!contours,`contour visibility: ${field}`);
 assert.equal(el.obsControl.hidden,!reports,`observations visibility: ${field}`);
}
assertControls('t850',{height:true,wind:true,contours:true});
assert.equal(el.heightToggleBtn.checked,true);
assert.equal(el.windToggleBtn.checked,true);
assertControls('absv500',{height:true,wind:true,contours:true});
assertControls('wspd10',{wind:true,contours:true});
assertControls('ptype',{reports:true});
assertControls('mslp',{contours:true});
assert.equal(el.contourToggleBtn.checked,true,'MSLP isobars default on');
st.field='wspd10';st.overlaySurfaceWind=false;vm.runInContext('updateContourControl()',ctx);assert.equal(el.windToggleBtn.checked,false);
st.field='t850';vm.runInContext('updateContourControl()',ctx);assert.equal(el.windToggleBtn.checked,true,'upper-wind state independent of surface-wind state');
st.overlayHeight=false;vm.runInContext('updateContourControl()',ctx);assert.equal(el.heightToggleBtn.checked,false);
const b2=src.indexOf('function scheduleContourRedraw(');
const e2=src.indexOf('// Optional individual-PNG rendering overrides',b2);
assert(b2>0&&e2>b2);vm.runInContext(src.slice(b2,e2),ctx);
const p={map:{isMoving(){return false;}},cfg:{field:'t850'},rawField:{},heightField:{},contourCanvas:{style:{}},status:'ready',contourRedrawTimer:null,contourRafId:null,calls:[]};
const run=(field,overHeight,contours)=>{
 p.cfg.field=field;p.calls=[];p.contourRafId=null;st.overlayHeight=overHeight;st.contours=contours;
 vm.runInContext('scheduleContourRedraw(p)',Object.assign(ctx,{p}));
 return p.calls.map(([type,options])=>({type,key:options?.key||null,append:options?.append===true,always:options?.always===true}));
};
assert.deepEqual(run('t850',false,false),[{type:'clear',key:null,append:false,always:false}]);
assert.deepEqual(run('t850',true,false),[{type:'draw',key:'h850',append:false,always:true}]);
assert.deepEqual(run('t850',false,true),[{type:'draw',key:null,append:false,always:false}]);
assert.deepEqual(run('t850',true,true),[{type:'draw',key:'h850',append:false,always:true},{type:'draw',key:'t850',append:true,always:false}]);
assert.deepEqual(run('absv500',true,false),[{type:'draw',key:'h500',append:false,always:true}]);
assert.deepEqual(run('absv500',true,true),[{type:'draw',key:'h500',append:false,always:true},{type:'draw',key:'absv500',append:true,always:false}]);
assert.deepEqual(run('mslp',false,false),[{type:'draw',key:null,append:false,always:true}]);
st.overlayMSLP=false;assert.deepEqual(run('mslp',false,false),[{type:'clear',key:null,append:false,always:false}]);
console.log('PASS Overlay control visibility and state, independent wind switches, height/contour redraw combinations, export and MSLP');
