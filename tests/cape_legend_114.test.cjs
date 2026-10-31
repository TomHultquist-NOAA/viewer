'use strict';
const {readFileSync}=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=readFileSync(path.join(__dirname,'..','js','viewer.js'),'utf8');
const fragment=js.slice(js.indexOf('function legendTicks('),js.indexOf('function legend(p,m){'));
const ctx=vm.createContext({Math,Array,Set,Number});
vm.runInContext(`
const st={field:'sbcape',colorRanges:new Map(),cfg:{display:{legendTickCount:11}}};
const FIELDS={refc:{label:'Reflectivity'}};
const PTYPE_LABELS=[];
let lo=10,hi=6000;
function pal(){return {levels:[lo,hi],colors:new Array(64).fill('#fff'),banded:false};}
${fragment}
`,ctx);
let ticks=vm.runInContext(`legendTicks({label:'Surface-based CAPE',unit:'J kg⁻¹'}, {})`,ctx);
assert.deepEqual(Array.from(ticks,x=>x.label),['0','500','1000','1500','2000','2500','3000','3500','4000','4500','5000','5500','6000']);
assert.ok(ticks.every(t=>t.pos>=0&&t.pos<=1));
vm.runInContext('st.field="mucape";hi=7000',ctx);
ticks=vm.runInContext(`legendTicks({label:'Most-unstable CAPE',unit:'J kg⁻¹'}, {})`,ctx);
assert.deepEqual(Array.from(ticks,x=>x.label),['0','1000','2000','3000','4000','5000','6000','7000']);
console.log('PASS CAPE legends display round physical thresholds rather than fractional 1807-style labels');
