'use strict';
// Open point charts must repaint in both themes using cached plotted data,
// without fetching soundings or restarting a point time-series load.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const inspector=fs.readFileSync(path.join(root,'js/point-inspector.js'),'utf8');
const viewer=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function section(src,from,to){const a=src.indexOf(from),b=src.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,`missing section ${from}`);return src.slice(a,b);}
assert.match(inspector,/s\.lastPlot=\{kind:'sounding',rows,validTime,summary\}/);
assert.match(inspector,/s\.lastPlot=\{kind:'series',points\}/);
assert.match(inspector,/window\.EVUPointInspector=\{showMenu,scheduleSoundingRefresh,refreshTheme\}/);
assert.match(viewer,/window\.EVUPointInspector\?\.refreshTheme\?\.\(\)/);
assert.match(html,/js\/point-inspector\.js\?v=1\.1\.34-20261102/);
assert.match(html,/js\/viewer\.js\?v=1\.1\.34-20261102/);

const frameJS=section(inspector,'function frame(ctx,canvas,title,subtitle){','function axis(');
const refreshJS=section(inspector,'function refreshTheme(){','window.EVUPointInspector=');
const paint=[],draw=[];
function makeCanvas(){
 const ctx={fillRect(x,y,w,h){paint.push(this.fillStyle);},fillText(){}};
 return {width:1260,height:810,getContext:()=>ctx};
}
const sounding={type:'sounding',data:{modelLabel:'RRFS',field:'t850'},canvas:makeCanvas(),
 lastPlot:{kind:'sounding',rows:[{p:925,t:16,td:10}],validTime:new Date('2026-10-28T12:00:00Z'),summary:{levels:{temperature:1}}}};
const series={type:'series',data:{modelLabel:'HRRR',field:'apcp'},canvas:makeCanvas(),
 lastPlot:{kind:'series',points:[{hour:0,value:0.2}]}};
const loading={type:'sounding',data:{modelLabel:'REFS',field:'t850'},canvas:makeCanvas(),lastPlot:null};
const closed={type:'sounding',cancelled:true,data:{modelLabel:'Closed'},canvas:makeCanvas(),lastPlot:sounding.lastPlot};
const WINDOWS=new Set([sounding,series,loading,closed]);
const st={theme:'dark'};
const context=vm.createContext({WINDOWS,st,fieldName:f=>f,draw,paint});
vm.runInContext(frameJS+`
function plotSounding(s,rows,validTime,summary){draw.push(['sounding',s,rows,validTime,summary]);frame(s.canvas.getContext('2d'),s.canvas,'sound','native profile');}
function plotSeries(s,points){draw.push(['series',s,points]);frame(s.canvas.getContext('2d'),s.canvas,'series','points');}
`+refreshJS,context);
context.refreshTheme();
assert.deepEqual(paint,['#111e30','#111e30','#111e30']);
assert.equal(draw.length,2);
assert.equal(draw[0][2],sounding.lastPlot.rows,'same native sounding rows reused');
assert.equal(draw[0][4],sounding.lastPlot.summary,'same diagnostics reused');
assert.equal(draw[1][2],series.lastPlot.points,'same point values reused');
paint.length=0;draw.length=0;
st.theme='light';context.refreshTheme();
assert.deepEqual(paint,['#ffffff','#ffffff','#ffffff']);
assert.equal(draw.length,2,'all open plots refreshed, closed window excluded');
paint.length=0;st.theme='dark';context.refreshTheme();
assert.deepEqual(paint,['#111e30','#111e30','#111e30']);
assert.ok(!refreshJS.includes('EVUSoundingProfiles'),'no sounding network loading');
assert.ok(!refreshJS.includes('updateSeries('),'no point-series reload');
console.log('PASS light/dark theme redraw for open soundings and time series, using cached data and export canvas');
