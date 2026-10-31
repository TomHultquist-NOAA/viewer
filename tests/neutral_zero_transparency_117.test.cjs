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
`,ctx);
for(const field of ['sbcape','mlcape','mucape','shear01','shear06','srh01','srh03','scp','stp','stp_fixed','absv500','mxuphl','mxuphl_run','u10','v10','wspd10','wspd300','gust','rh2m','snowc','cpofp']){
 const p=vm.runInContext(`st.field='${field}'; pal(FIELDS['${field}'],{name:'${field}'})`,ctx);
 assert.equal(p.levels.length,p.colors.length+1,field+' palette structure');
 assert.equal(vm.runInContext(`colorAt(pal(FIELDS['${field}'],{}),0)`,ctx),'#00000000',field+' zero should be clear');
 assert(p.levels.every((value,i)=>i===0||value>p.levels[i-1]),field+' levels strictly sorted');
 const t=vm.runInContext(`FIELDS['${field}'].clearZero`,ctx);
 const positive=vm.runInContext(`colorAt(pal(FIELDS['${field}'],{}),${t*1.1})`,ctx);
 if(field!=='mxuphl'&&field!=='mxuphl_run')assert.notEqual(positive,'#00000000',field+' significant positive values shaded');
}
for(const field of ['t2m','dpt2m','t700']){
 assert.notEqual(vm.runInContext(`st.field='${field}';colorAt(pal(FIELDS['${field}'],{}),0)`,ctx),'#00000000',field+' physical zero is not absent weather');
}
assert.notEqual(vm.runInContext(`st.field='mslp';colorAt(pal(FIELDS.mslp,{}),1000)`,ctx),'#00000000','ordinary MSLP values must remain shaded');
assert.equal(vm.runInContext(`st.field='srh01';st.colorRanges.set('srh01',{min:-400,max:1000});colorAt(pal(FIELDS.srh01,{}),0)`,ctx),'#00000000','physical zero stays transparent after custom range');
assert.notEqual(vm.runInContext(`colorAt(pal(FIELDS.srh01,{}),50)`,ctx),'#00000000','custom range does not erase meaningful SRH');
const diffStart=source.indexOf('function differenceZeroOpacity('),diffEnd=source.indexOf('const DIFFERENCE_LIMITS',diffStart);
vm.runInContext(source.slice(diffStart,diffEnd),ctx);
assert.equal(vm.runInContext('differenceZeroOpacity(0,100)',ctx),0);
assert.equal(vm.runInContext('differenceZeroOpacity(-2,100)',ctx),0);
assert.equal(vm.runInContext('differenceZeroOpacity(9,100)',ctx),1);
const middle=vm.runInContext('differenceZeroOpacity(4,100)',ctx);
assert(middle>0&&middle<1);
assert.match(source,/205\*st\.imageOpacity\*differenceZeroOpacity\(v,range\)/,'difference renderer uses transparent alpha');
console.log('PASS transparent neutral centers and minima, untouched temperature palettes, custom color range, difference alpha');
