'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const js=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const start=js.indexOf('function gifHoursInRange('),end=js.indexOf('function syncGifExportControls(',start);
assert(start>=0&&end>start);
const context=vm.createContext({
 el:{exportGifStart:{value:'0'},exportGifEnd:{value:'24'},exportGifStep:{value:'1'},exportGifDelay:{value:'500'},exportGifQuality:{value:'standard'}},
 availableHours:()=>Array.from({length:85},(_,i)=>i),
});
vm.runInContext(js.slice(start,end),context);
for(const [quality,max] of [['standard',25],['high',19]]){
 context.el.exportGifQuality.value=quality;
 context.el.exportGifEnd.value=String(max-1);
 let selected=vm.runInContext('gifSelection()',context);
 assert.equal(selected.maxFrames,max);
 assert.equal(selected.hours.length,max,'The last supported forecast hour must be permitted');
 context.el.exportGifEnd.value=String(max);
 selected=vm.runInContext('gifSelection()',context);
 assert.equal(selected.hours.length,max+1,'The next hour must exceed the limit');
 assert(selected.hours.length>selected.maxFrames);
}
assert.match(html,/<td>Standard \(1200 px\)<\/td>[\s\S]*?<td[^>]*><strong>25<\/strong><\/td>/);
assert.match(html,/<td>High \(1600 px\)<\/td>[\s\S]*?<td[^>]*><strong>19<\/strong><\/td>/);
console.log('PASS Standard 25/High 19 boundary behavior, both resolutions and displayed limits');
