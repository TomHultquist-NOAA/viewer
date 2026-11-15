'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/viewer.js'),'utf8');
const block=source.slice(source.indexOf('const AMOUNT_REPORT_EMPTY='),source.indexOf('function observationVisible(){'));
assert(block.includes('function drawAmountReportCanvas('));
const now=new Date('2026-11-14T18:00:00Z');
const st={field:'apcp1h',hour:0,ref:{id:'2026111418'},amountReportEnabled:{metar:true,cocorahs:true},amountReports:[],amountReportVersion:1,amountReportSelected:[],amountReportSelectionKey:null};
const strokes=[],fills=[];
const fakeContext={setTransform(){},clearRect(){},measureText(value){return {width:value.length*8}},
 strokeText(text,x,y){strokes.push([text,x,y])},fillText(text,x,y){fills.push([text,x,y])},fillRect(){},strokeRect(){},
 set font(v){this._font=v},set textAlign(v){},set textBaseline(v){},set lineJoin(v){},set lineWidth(v){},set strokeStyle(v){},set fillStyle(v) {}};
const geo=(source,station,value,property,period,date)=>({type:'Feature',geometry:{type:'Point',coordinates:[-105,40]},
 properties:{source,station,[property]:value,period_hours:period,report_date:date||'2026-11-14',sample_utc:'2026-11-14T18:00:00Z',...(source==='cocorahs'?{end_utc:'2026-11-14T18:00:00Z'}:{})}});
const ctx={st,devicePixelRatio:1,Date,Number,console,fetch(){throw Error('Should not fetch during drawing')},
 obsValidDate(){return now},observationHourKey(d){return d.toISOString().slice(0,13).replace(/[-T:]/g,'')},
 FIELDS:{apcp24h:{},snod:{}},pal(){return {levels:[0,.1,1,10],colors:['#b6d0f0','#31a353','#ad0026']}},
 basePal(){return {levels:[0,.1,1,10],colors:['#b6d0f0','#31a353','#ad0026']}},
 touchGraphicsDevice(){return false},maplibregl:{}};
vm.createContext(ctx);
vm.runInContext(block,ctx);
assert.equal(vm.runInContext("amountReportKind('apcp1h')",ctx),'precip');
assert.equal(vm.runInContext("amountReportKind('gfs_snow_slr1024h')",ctx),'snowfall');
assert.equal(vm.runInContext("amountReportKind('rrfs_snow_weasd48h')",ctx),'snowfall');
assert.equal(vm.runInContext("amountReportKind('snowc')",ctx),'depth');
assert.equal(vm.runInContext("amountReportKind('refc_ptype')",ctx),null);
st.amountReports=[geo('cocorahs','CO-1',1.25,'precip_in',24),
 geo('metar','KDEN',.37,'precip_in',1),geo('metar','KDEN',.72,'precip_in',6)];
let reports=vm.runInContext('selectedAmountReports()',ctx);
assert.equal(reports.length,1,'strict 1h field must not display 24h CoCoRaHS totals');
let chosen=reports.find(r=>r.source==='metar');
assert.equal(chosen.period,1);assert.equal(chosen.value,.37);
assert.equal(vm.runInContext('amountReportLabel(selectedAmountReports()[0])',ctx),'0.37');
const fakeMap={getCanvas(){return {clientWidth:600,clientHeight:400}},getBounds(){return {contains(){return true}}},
 project(){return {x:150,y:100}},getZoom(){return 5}};
const canvas={style:{},width:0,height:0,getContext(){return fakeContext}};
const panel={map:fakeMap,amountReportCanvas:canvas,cfg:{differencePanel:false},geoMoving:false};
assert(vm.runInContext('drawAmountReportCanvas(panel)',Object.assign(ctx,{panel}))===true);
assert.equal(fills.length,1,'collision thinning should keep one number in same screen cell');
assert.equal(strokes.length,0,'new high-contrast labels use a dark backing instead of noisy halos');
st.field='snow1h';st.amountReportVersion++;
st.amountReports=[geo('metar','KDEN',1,'snowfall_in',1)];st.amountReports[0].properties.snowfall_is_depth_increase=true;
assert.equal(vm.runInContext('selectedAmountReports().length',ctx),0,'snow-depth increase cannot masquerade as new snowfall');
st.field='snod';st.amountReportVersion++;
st.amountReports=[geo('cocorahs','CO-1',14,'snow_depth_in',24)];
assert.equal(vm.runInContext('amountReportLabel(selectedAmountReports()[0])',ctx),'14');
console.log('PASS: valid-hour/period matching, no source prefixes, depth-increase exclusion, contrast backing and collision control');
