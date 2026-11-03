'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const head=source.slice(0,source.indexOf('// Fixed forecaster field sequence.'));
const palStart=source.indexOf('function basePal(m,v){');
const palEnd=source.indexOf('// The palette mapping is independent of displayed tick labels.',palStart);
assert(palStart>0&&palEnd>palStart);
const ctx=vm.createContext({Math,Array,Number,Map,Object,console});
vm.runInContext(`
const PTYPE=['#00000000'];
function sampledColors(colors,n){return colors.slice(0,n);}
const st={field:'',colorRanges:new Map()};
${head}
${source.slice(palStart,palEnd)}
function colorAt(p,v){
 for(let i=0;i<p.colors.length;i++)if(v>=p.levels[i] && v<p.levels[i+1])return p.colors[i];
 return v<p.levels[0]?'#00000000':p.colors.at(-1);
}
function transparentRuns(p){
 const runs=[];
 for(let i=0;i<p.colors.length;i++){
  if(p.colors[i]!=='#00000000')continue;
  const a=p.levels[i],b=p.levels[i+1],last=runs[runs.length-1];
  if(last&&Math.abs(last[1]-a)<1e-8)last[1]=b;
  else runs.push([a,b]);
 }
 return runs;
}
`,ctx);
for(const field of ['sbcape','mlcape','mucape','shear01','shear06','srh01','srh03','absv500','mxuphl','mxuphl_run','u10','v10','wspd10','wspd300','gust','snowc','cpofp']){
 const p=vm.runInContext(`st.field='${field}'; pal(FIELDS['${field}'],{name:'${field}'})`,ctx);
 assert.equal(p.levels.length,p.colors.length+1,field+' palette structure');
 assert.equal(vm.runInContext(`colorAt(pal(FIELDS['${field}'],{}),0)`,ctx),'#00000000',field+' zero should be clear');
 assert(p.levels.every((value,i)=>i===0||value>p.levels[i-1]),field+' levels strictly sorted');
 const t=vm.runInContext(`FIELDS['${field}'].clearZero`,ctx);
 const positive=vm.runInContext(`colorAt(pal(FIELDS['${field}'],{}),${t*1.1})`,ctx);
 if(field!=='mxuphl'&&field!=='mxuphl_run')assert.notEqual(positive,'#00000000',field+' significant positive values shaded');
}
// Every field carrying a zero threshold retains one and only one physical
// near-zero interval after a range stretch that shifts the original palette.
for(const field of ['sbcape','mlcape','mucape','shear01','shear06','srh01','srh03','absv500','mxuphl','mxuphl_run','u10','v10','wspd10','wspd300','gust','snowc','cpofp']){
 const runs=vm.runInContext(`st.field='${field}';st.colorRanges.set('${field}',{min:-400,max:1000});transparentRuns(pal(FIELDS['${field}'],{}))`,ctx);
 assert.equal(runs.length,1,field+' must have exactly one contiguous transparent interval after a custom range change');
 assert(runs[0][0]<=0&&runs[0][1]>=0,field+' neutral interval remains centered on physical zero');
 vm.runInContext(`st.colorRanges.delete('${field}')`,ctx);
}
assert.equal(vm.runInContext(`makeZeroPaletteOpaque(basePal(FIELDS.mxuphl,{})).colors.includes('#00000000')`,ctx),false,'the original UH palette band is made opaque before the physical-zero mask is added');

// A physical zero/near-zero band is applied exactly once, after any custom
// color-range stretch. The UH source palette's former built-in transparent
// interval must not drift away from zero and create a second blank stripe.
for(const [field,range,expected] of [
 ['mxuphl',{min:-100,max:500},[-5,5]],
 ['mxuphl',{min:-300,max:300},[-5,5]],
 ['mxuphl_run',{min:-100,max:500},[-5,5]],
 ['srh01',{min:-400,max:1000},[-10,10]],
 ['u10',{min:-200,max:100},[-2,2]],
 ['wspd10',{min:0,max:160},[0,2]],
 ['sbcape',{min:-50,max:7000},[-10,10]]
]){
 const runs=vm.runInContext(`st.field='${field}';st.colorRanges.set('${field}',${JSON.stringify(range)});transparentRuns(pal(FIELDS['${field}'],{}))`,ctx);
 assert.equal(runs.length,1,field+' custom range must contain exactly one contiguous transparent band');
 assert(Math.abs(runs[0][0]-expected[0])<1e-7&&Math.abs(runs[0][1]-expected[1])<1e-7,field+' transparent band remains at its physical near-zero threshold');
 vm.runInContext(`st.colorRanges.delete('${field}')`,ctx);
}
assert.notEqual(vm.runInContext(`st.field='rh2m';colorAt(pal(FIELDS.rh2m,{}),0)`,ctx),'#00000000','0% relative humidity is a meaningful very-dry value and remains shaded');
for(const field of ['t2m','dpt2m','t700']){
 assert.notEqual(vm.runInContext(`st.field='${field}';colorAt(pal(FIELDS['${field}'],{}),0)`,ctx),'#00000000',field+' physical zero is not absent weather');
}
assert.notEqual(vm.runInContext(`st.field='mslp';colorAt(pal(FIELDS.mslp,{}),1000)`,ctx),'#00000000','ordinary MSLP values must remain shaded');
assert.equal(vm.runInContext(`st.field='srh01';st.colorRanges.set('srh01',{min:-400,max:1000});colorAt(pal(FIELDS.srh01,{}),0)`,ctx),'#00000000','physical zero stays transparent after custom range');
assert.notEqual(vm.runInContext(`colorAt(pal(FIELDS.srh01,{}),50)`,ctx),'#00000000','custom range does not erase meaningful SRH');
const diffStart=source.indexOf('function differenceZeroOpacity('),diffEnd=source.indexOf('const DIFFERENCE_LIMITS',diffStart);
const neutralStart=source.indexOf('const DIFFERENCE_NEUTRAL_BY_FIELD=');
vm.runInContext(source.slice(neutralStart,source.indexOf('// Precomputed GFS comparison grids',neutralStart)),ctx);
vm.runInContext(source.slice(diffStart,diffEnd),ctx);
vm.runInContext("st.field='mslp'",ctx);
assert.equal(vm.runInContext('differenceZeroOpacity(0,100)',ctx),0);
assert.equal(vm.runInContext('differenceZeroOpacity(-1,100)',ctx),0);
assert.equal(vm.runInContext('differenceZeroOpacity(9,100)',ctx),1);
const middle=vm.runInContext('differenceZeroOpacity(2.5,100)',ctx);
assert(middle>0&&middle<1);
assert.match(source,/205\*st\.imageOpacity\*differenceZeroOpacity\(v,range\)/,'difference renderer uses transparent alpha');
console.log('PASS single physical-zero bands, custom-range transparency stability, valid dry-air shading, untouched temperature palettes, difference alpha');
