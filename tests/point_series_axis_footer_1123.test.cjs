'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../js/point-inspector.js'),'utf8');
const start=src.indexOf(' function intervalAccumulationHours(');
const end=src.indexOf(' const SKEW=35;',start);
assert(start>0&&end>start);
const labels=[];
const context={
 Math,Number,Object,Array,console,
 isGood:n=>Number.isFinite(n)&&n>-1e9&&Math.abs(n)<1e9,
 FIELDS:{t2m:{unit:'°F',label:'2-m temperature'},mslp:{unit:'hPa',label:'Mean sea level pressure'},
  srh01:{unit:'m²/s²',label:'Storm-relative helicity'},prate:{unit:'in/hr',label:'Precipitation rate'},
  apcp1h:{unit:'in',label:'1-hour precipitation'},wspd10:{unit:'kt',label:'Wind speed'}},
 frame(){return {ink:'#fff',muted:'#777',grid:'#222'};},
 axis(){},dot(){},fieldName:f=>f,cycleLabel:()=>'',fmt:()=>'',st:{theme:'light'},
};
vm.createContext(context);
vm.runInContext(src.slice(start,end)+'\nthis.seriesYAxis=seriesYAxis;this.seriesTickLabel=seriesTickLabel;this.plotSeries=plotSeries;',context);
for(const unit of ['°F','°C','kt','hPa','dBZ','m²/s²','J/kg','%','gpm','10⁻⁵ s⁻¹']){
 const result=context.seriesYAxis([10.25,11.63,13.72,16.01],unit,false);
 assert(result.ticks.length>=3&&result.ticks.every(Number.isInteger),`integer ticks expected for ${unit}: ${result.ticks}`);
 assert(result.ticks.every(t=>!context.seriesTickLabel(t,result.decimals).includes('.')));
}
for(const unit of ['in','in/hr']){
 const result=context.seriesYAxis([0.025,0.044,0.086,0.131],unit,true);
 assert(result.ticks.some(t=>t>0&&t<1),`sub-inch ticks expected for ${unit}`);
 assert(result.ticks.some(t=>context.seriesTickLabel(t,result.decimals).includes('.')));
 assert.equal(result.ticks[0],0);
}
for(const [values,unit] of [[[1002.3,1002.9,1003.1],'hPa'],[[-6.2,-6.2,-6.2],'°C'],[[0,0,0],'kt'],[[0.0001,0.0002,0.0004],'in/hr']]){
 const axis=context.seriesYAxis(values,unit,false);
 assert(axis.max>axis.min&&axis.ticks.length>1,`valid axis expected for ${unit}`);
 assert(axis.ticks[0]<=Math.min(...values)&&axis.ticks.at(-1)>=Math.max(...values));
}
const ctx={
 fillText(text,x,y){labels.push({text:String(text),x,y,align:this.textAlign});},
 fillRect(){},save(){},restore(){},translate(){},rotate(){},
};
const canvas={width:1100,height:785,getContext:()=>ctx};
const data={modelLabel:'HRRR',field:'t2m',timeMode:'model',dataset:{},lat:44.86,lon:-93.3};
context.plotSeries({canvas,data},Array.from({length:85},(_,i)=>({hour:i,value:15+(i%8)*1.4})));
const heading=labels.find(l=>l.text==='Forecast lead time (hours)');
const footer=labels.find(l=>l.text.includes('85 valid / 85 hours.'));
assert(heading&&footer);
assert(footer.y-heading.y>=35,`footer/title overlap: ${heading.y}, ${footer.y}`);
assert(footer.y<canvas.height-10,'footer must remain inside canvas');
assert.equal(heading.align,'center');
assert.equal(footer.align,'left');
console.log('PASS rounded whole-number axes, fractional precip axes, and non-overlapping time-series footer');
