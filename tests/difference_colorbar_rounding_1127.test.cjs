'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const start=source.indexOf('const DIFFERENCE_LIMITS=');
const end=source.indexOf('function setDifferenceLegend(',start);
assert(start>0&&end>start);
const ctx=vm.createContext({Math,Number,Set,Array,console});
vm.runInContext(source.slice(start,end)+'\nthis.ticks=differenceTicks;this.format=differenceNumber;',ctx);
// All meaningful whole-number fields, including previously fractional fallback
// endpoints, must have only integer labels, not rounded false endpoint labels.
for(const [field,limit] of [
 ['mslp',12],['t2m',15],['rh2m',40],['shear01',20],['shear06',30],
 ['srh01',212.5],['srh03',262.5],['sbcape',1500],['absv500',23.75],
 ['wspd10',30],['refc',30],['snow1h',6],['sden',150]
]){
 const t=Array.from(ctx.ticks(field,limit));
 assert(t.length>=3&&t.length<=11,`${field}: density ${t}`);
 assert(t.every(Number.isInteger),`${field} should show only integers: ${t}`);
 assert(t.every(x=>Math.abs(x)<=limit+1e-8),`${field}: no falsely rounded endpoints`);
 assert(t.includes(0)&&t.every(x=>t.includes(-x)),`${field}: centered symmetric zero`);
 assert(t.every((x,i)=>i===0||x>t[i-1]),`${field}: sorted ticks`);
 assert(t.every(x=>!ctx.format(x).includes('.')),`${field}: no unnecessary decimals`);
}
// Exceptions retain meaningful fractions and show the true scale endpoints.
for(const [field,limit] of [
 ['prate',1.2],['apcp1h',1.5],['apcp3h',2],['frzr',2],
 ['frozr',2]
]){
 const t=Array.from(ctx.ticks(field,limit));
 assert(t.length>=3,`${field}: ticks present`);
 assert(t.some(x=>!Number.isInteger(x)),`${field}: meaningful decimal ticks expected: ${t}`);
 assert(t.includes(limit)&&t.includes(-limit)&&t.includes(0),`${field}: true limits retained`);
 assert(t.some(x=>ctx.format(x).includes('.')),`${field}: labeled fractional ticks`);
}
assert.equal(ctx.format(-0),'0');
assert.equal(ctx.format(.4),'0.4');
assert.equal(ctx.format(5),'5');
assert(Array.from(ctx.ticks('apcp',3)).every(Number.isInteger),'inch differences can also use integers when appropriate');
assert(Array.from(ctx.ticks('srh01',100)).length<=11,'integer tick spacing must converge');
assert.deepEqual(Array.from(ctx.ticks('t2m',0)),[0]);
// Same source functions must be used by live legend and saved PNG, avoiding
// divergent precision or drift between the two paths.
assert.match(source,/function setDifferenceLegend\(field,range,unit\)\{\s*const ticks=differenceTicks\(field,range\)/);
assert.match(source,/for\(const t of differenceTicks\(snap\.fieldKey,snap\.range\)\)/);
assert.match(source,/node\.textContent=differenceNumber\(v\)/);
assert.match(source,/cx\.fillText\(differenceNumber\(t\),x,H-\(largeLabels\?20:15\)\)/);
console.log('PASS whole-number difference ticks, justified fractional exceptions, and matched live/export legends');
