'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const preview=src.slice(src.indexOf('async function paintDifferenceLive('),src.indexOf('// Difference PNGs use a high-resolution',src.indexOf('async function paintDifferenceLive(')));
assert.match(preview,/differenceExportRaster\(map,snapshot,width,height,\{interactive:true\}\)/);
assert.match(preview,/diff\.outlineCache\?\.key===key/);
assert.match(preview,/diff\.outlineCache=\{key,canvas:lines\}/);
assert.match(src,/const divisor=interactive\?3:2;/,'lower-cost interactive sampling; export unchanged');
assert.match(src,/const range=DIFFERENCE_LIMITS\[fieldKey\]/,'difference numerical limits unchanged');
assert.match(src,/scheduleDifferenceInputWarm\(\);/);
const a=src.indexOf('function scheduleDifferenceInputWarm(){');
const b=src.indexOf('async function alignedDisplayForAnalysis(',a);
assert(a>0&&b>a);
const timers=[];
const network=[];
const analysis={cfg:{id:'analysis',timeMode:'analysis'},ds:{product:'rap'}};
const model={cfg:{id:'rrfs',timeMode:'forecast'},ds:{product:'rrfs'}};
const st={field:'t850',ref:{id:'2026102912'},hour:5,alignedSource:{datasets:[]},difference:{selected:[model,analysis],warmSerial:0,warmKey:null}};
const ctx=vm.createContext({st,DIFFERENCE_BLOCKED_FIELDS:new Set(),console,
 setTimeout(fn){timers.push(fn);return timers.length;},
 playbackHours(){return [3,4,5,6,7];},
 valid(ref,h){return h;},
 alignedRecord(product,time,field){assert.equal(product,'rap');assert.equal(field,'t850');return {src:{id:'aligned'},ds:{path:`t${time}`},v:{name:'t850'}};},
 prefetchChunkUrl(src,ds,v,h){return `${src.id}/${ds.path}/${v.name}/${h}`;},
 compressedChunk(url,options){assert.equal(options.background,true);network.push(url);return Promise.resolve();},
 precipitationAccumulationHours(){return 0;},
 reloadAlignedCatalog(){throw Error('Should reuse the aligned-analysis catalog');}
});
vm.runInContext(src.slice(a,b),ctx);
(async()=>{
 vm.runInContext('scheduleDifferenceInputWarm()',ctx);
 assert.equal(timers.length,1);
 vm.runInContext('scheduleDifferenceInputWarm()',ctx);
 assert.equal(timers.length,1,'duplicate selection reuses pending prewarm');
 timers.shift()();await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(network,['aligned/t5/t850/0','aligned/t6/t850/0']);
 st.hour=6;
 vm.runInContext('scheduleDifferenceInputWarm()',ctx);
 assert.equal(timers.length,1,'new valid hour schedules the next verification hour');
 timers.shift()();await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(network.slice(2),['aligned/t6/t850/0','aligned/t7/t850/0']);
 st.difference.selected=[model,{cfg:{id:'refs',timeMode:'forecast'},ds:{product:'refs'}}];
 vm.runInContext('scheduleDifferenceInputWarm()',ctx);
 assert.equal(timers.length,0,'forecast-versus-forecast needs no additional aligned-analysis download');
 console.log('PASS: aligned-analysis selective prefetch, deduped requests, next-hour warming, accelerated popup preview and outline cache');
})().catch(e=>{console.error(e);process.exitCode=1;});
