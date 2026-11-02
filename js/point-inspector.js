/* OMD EVU Viewer: point time series and native profile Skew-T. v1.1.2.
 * Browser-only; uses the same published Zarr catalogs and decoder as viewer.js.
 * No model levels or dewpoint profiles are synthesized from other layers.
 */
(()=>{
 'use strict';
 const WINDOWS=new Set(); let menu=null, nextZ=4500, refreshTimer=null;
 const isGood=n=>Number.isFinite(n)&&n>-1e9&&Math.abs(n)<1e9;
 const cycleLabel=ds=>ds?.init_time?fmt(ds.init_time):'unknown cycle';
 const icDownload='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg>';
 const icClose='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5l14 14M19 5L5 19"/></svg>';
 const fieldName=f=>FIELDS[f]?.label||f;
 function capture(p,lon,lat){
  return {panel:p,source:p.src,sourceId:p.cfg.source||st.primary?.id,modelLabel:p.cfg.label||p.ds?.model||'Panel',
   timeMode:p.cfg.timeMode||'model',field:p.cfg.field||st.field,lon,lat,
   dataset:p.ds,cycle:p.ds?.init_time,referenceCycle:st.ref?.init_time,
   startHour:st.hour,forecastHour:p.h};
 }
 function closeMenu(){if(menu){menu.remove();menu=null;}}
 function showMenu(p,e){
  if(!p?.map||p.cfg.placeholder)return;
  e.originalEvent?.preventDefault();closeMenu();
  const point=e.lngLat;if(!point||![point.lng,point.lat].every(Number.isFinite))return;
  const data=capture(p,point.lng,point.lat);
  menu=document.createElement('div');menu.className='evu-inspect-menu';menu.setAttribute('role','menu');
  const desc=document.createElement('div');desc.className='evu-inspect-location';desc.textContent=`${Math.abs(point.lat).toFixed(3)}°${point.lat>=0?'N':'S'}, ${Math.abs(point.lng).toFixed(3)}°${point.lng>=0?'E':'W'}`;menu.append(desc);
  for(const [label,type] of [['Time series','series'],['Sounding','sounding']]){
   const btn=document.createElement('button');btn.type='button';btn.setAttribute('role','menuitem');btn.textContent=label;
   btn.addEventListener('click',()=>{closeMenu();void openWindow(type,data);});menu.append(btn);
  }
  document.body.append(menu);
  const rect=menu.getBoundingClientRect(),ev=e.originalEvent;
  const x=Math.max(8,Math.min(window.innerWidth-rect.width-8,ev?.clientX??160));
  const y=Math.max(8,Math.min(window.innerHeight-rect.height-8,ev?.clientY??120));
  menu.style.left=x+'px';menu.style.top=y+'px';
 }
 document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target))closeMenu();},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
 function makeWindow(type,data){
  const win=document.createElement('section');win.className='evu-inspect-window'+(type==='sounding'?' evu-inspect-sounding':'');win.setAttribute('role','dialog');win.setAttribute('aria-label',type==='series'?'Point time series':'Point sounding');
  const head=document.createElement('header');head.className='evu-inspect-head';
  const text=document.createElement('div');text.className='evu-inspect-title';
  const title=document.createElement('strong');title.textContent=type==='series'?'Point time series':'Skew-T / Log-P sounding';
  const desc=document.createElement('small');desc.textContent=`${data.modelLabel} · ${data.lat.toFixed(3)}, ${data.lon.toFixed(3)}`;
  text.append(title,desc);head.append(text);
  const save=document.createElement('button');save.className='evu-inspect-icon';save.type='button';save.title='Download this chart as PNG';save.setAttribute('aria-label','Download chart PNG');save.innerHTML=icDownload;
  const close=document.createElement('button');close.className='evu-inspect-icon';close.type='button';close.title='Close chart';close.setAttribute('aria-label','Close chart');close.innerHTML=icClose;
  head.append(save,close);
  const body=document.createElement('div');body.className='evu-inspect-body';
  const progress=document.createElement('p');progress.className='evu-inspect-status';progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');
  const canvas=document.createElement('canvas');canvas.width=type==='sounding'?1480:1100;canvas.height=type==='sounding'?900:785;canvas.className='evu-inspect-canvas';
  body.append(progress,canvas);win.append(head,body);document.body.append(win);
  const n=WINDOWS.size;win.style.left=Math.min(50+n*35,Math.max(8,window.innerWidth-400))+'px';win.style.top=Math.min(120+n*38,Math.max(8,window.innerHeight-320))+'px';win.style.zIndex=String(++nextZ);
  win.addEventListener('pointerdown',()=>{win.style.zIndex=String(++nextZ);});
  close.addEventListener('click',()=>{state.cancelled=true;state.token++;WINDOWS.delete(state);win.remove();});
  save.addEventListener('click',()=>{const a=document.createElement('a');a.download=window.OMDEVUUniqueExportName(`EVU_${type}_${data.modelLabel.replace(/[^\w-]+/g,'_')}_${data.lat.toFixed(2)}_${data.lon.toFixed(2)}.png`);a.href=canvas.toDataURL('image/png');a.click();});
  let drag=null;
  head.addEventListener('pointerdown',e=>{
   if(e.button!==0||e.target.closest('button'))return;
   drag={x:e.clientX,y:e.clientY,left:win.offsetLeft,top:win.offsetTop};head.setPointerCapture(e.pointerId);e.preventDefault();
  });
  head.addEventListener('pointermove',e=>{if(!drag)return;win.style.left=Math.max(0,Math.min(window.innerWidth-110,drag.left+e.clientX-drag.x))+'px';win.style.top=Math.max(0,Math.min(window.innerHeight-70,drag.top+e.clientY-drag.y))+'px';});
  head.addEventListener('pointerup',()=>{drag=null;});head.addEventListener('pointercancel',()=>{drag=null;});
  // Cache the most recently drawn chart so changing theme never triggers a
  // pressure-profile download (or resets a streaming point time series).
  const state={win,canvas,progress,type,data,token:0,cancelled:false,prevKey:null,lastPlot:null};WINDOWS.add(state);
  return state;
 }
 function frame(ctx,canvas,title,subtitle){
  const w=canvas.width,h=canvas.height,theme=st.theme==='light';
  // Reused canvases preserve textAlign from the previous plot (often 'center'
  // or 'right'). Reset it explicitly or header labels can render off-canvas.
  ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.fillStyle=theme?'#ffffff':'#111e30';ctx.fillRect(0,0,w,h);
  ctx.fillStyle=theme?'#1e293b':'#f1f6ff';ctx.font='bold 29px system-ui';ctx.fillText(title,42,51);
  ctx.fillStyle=theme?'#475569':'#abc3d9';ctx.font='19px system-ui';ctx.fillText(subtitle,43,83);
  return {ink:theme?'#334155':'#deedfc',grid:theme?'#dce4ec':'#33465c',muted:theme?'#64748b':'#a5bbd2'};
 }
 function axis(ctx,x1,y1,x2,y2,ink){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=ink;ctx.lineWidth=1;ctx.stroke();}
 function dot(ctx,x,y,color,r=3){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 function intervalAccumulationHours(field){
  // Interval totals are columns. Run-to-date accumulated fields remain lines.
  const match=/^(?:apcp|snow)(1|3|6|24|48)h$/.exec(field||'');
  return match?Number(match[1]):0;
 }
 // Round axis *intervals*, not just the printed values. Most meteorological
 // fields use whole-number hPa, °F, °C, kt, J/kg, etc. Precipitation in inches
 // and rates in in/hr retain decimals because sub-unit changes are meaningful.
 function seriesAxisFractional(unit){
  return unit==='in'||unit==='in/hr'||unit==='fraction'||unit==='ratio';
 }
 function seriesYAxis(values,unit='',bars=false){
  const finite=values.filter(isGood);
  if(!finite.length)return {min:0,max:1,ticks:[0,1],decimals:0};
  const fractional=seriesAxisFractional(unit);
  const low=Math.min(...finite),high=Math.max(...finite);
  const range=high-low;
  const pad=range>0?range*.08:(fractional?Math.max(.005,Math.abs(high)*.08):Math.max(1,Math.min(10,Math.abs(high)*.01)));
  const min=bars?Math.min(0,low):low-pad;
  const max=high+pad;
  const rawStep=Math.max(Number.EPSILON,(max-min)/5);
  const mag=Math.pow(10,Math.floor(Math.log10(rawStep)));
  const fraction=[1,2,5,10].find(n=>n*mag>=rawStep*(1-1e-12))||10;
  const step=fractional?fraction*mag:Math.max(1,Math.ceil(fraction*mag));
  let bottom=Math.floor(min/step)*step,top=Math.ceil(max/step)*step;
  if(top<=bottom)top=bottom+step;
  if((top-bottom)/step<2){
   if(bars)top=bottom+2*step;
   else{bottom-=step;top+=step;}
  }
  const decimals=Number.isInteger(step)?0:Math.min(6,Math.max(0,Math.ceil(-Math.log10(step)-1e-9)));
  const ticks=[];
  const count=Math.min(30,Math.round((top-bottom)/step));
  for(let i=0;i<=count;i++)ticks.push(Number((bottom+i*step).toFixed(Math.max(6,decimals))));
  return {min:bottom,max:top,ticks,decimals};
 }
 function seriesTickLabel(value,decimals){
  const rounded=Number(value.toFixed(decimals));
  return (Object.is(rounded,-0)?0:rounded).toLocaleString('en-US',{maximumFractionDigits:decimals});
 }
 function plotSeries(s,points){
  s.lastPlot={kind:'series',points};
  const {canvas,data}=s,ctx=canvas.getContext('2d'),validPoints=points.filter(x=>isGood(x.value));
  const unit=FIELDS[data.field]?.unit||'';const ink=frame(ctx,canvas,`${data.modelLabel} · ${fieldName(data.field)}`,`Init ${data.timeMode==='analysis'?fmt(data.referenceCycle):cycleLabel(data.dataset)} · ${data.lat.toFixed(3)}°, ${data.lon.toFixed(3)}° · ${unit||'units not specified'}`);
  const x0=95,x1=1039,y0=136,y1=644;
  // Deliberately a little more visible than the sounding guide grid in both themes.
  const seriesGrid=st.theme==='light'?'#bdcbd9':'#4b6680';
  ctx.font='17px system-ui';
  if(!validPoints.length){ctx.fillStyle=ink.muted;ctx.fillText('No published numeric forecast values for this point and cycle.',x0+40,335);return;}
  const maxH=Math.max(1,...points.map(x=>x.hour));
  const accumulationHours=intervalAccumulationHours(data.field),bars=accumulationHours>0;
  const yAxis=seriesYAxis(validPoints.map(x=>x.value),unit,bars);
  const {min,max}=yAxis;
  const px=hour=>x0+hour/maxH*(x1-x0),py=v=>y1-(v-min)/(max-min)*(y1-y0);
  for(const v of yAxis.ticks){
   const yy=py(v);axis(ctx,x0,yy,x1,yy,seriesGrid);
   ctx.fillStyle=ink.muted;ctx.textAlign='right';ctx.fillText(seriesTickLabel(v,yAxis.decimals),x0-11,yy+6);
  }
  const tickStep=maxH>72?12:maxH>36?6:maxH>18?3:2;
  for(let h=0;h<=maxH;h+=tickStep){const xx=px(h);axis(ctx,xx,y0,xx,y1,seriesGrid);ctx.fillStyle=ink.muted;ctx.textAlign='center';ctx.fillText(`F${String(h).padStart(3,'0')}`,xx,y1+30);}
  ctx.textAlign='center';ctx.fillStyle=ink.ink;ctx.fillText('Forecast lead time (hours)',(x0+x1)/2,y1+69);
  ctx.save();ctx.translate(33,(y0+y1)/2);ctx.rotate(-Math.PI/2);ctx.fillText(unit||fieldName(data.field),0,0);ctx.restore();
  const color='#32acdb';ctx.strokeStyle=color;ctx.lineWidth=3;let active=false,lastH=null;
  if(bars){
   // Rolling 3/6/24/48-hour windows may overlap when sampled hourly.
   // Draw a narrow bar for each endpoint rather than pretending intervals
   // are independent or stacking overlapping totals.
   const barWidth=Math.max(3,Math.min(15,(x1-x0)/(maxH+1)*0.82));
   ctx.fillStyle=color;
   for(const d of points){
    if(!isGood(d.value))continue;
    const start=py(0),end=py(d.value),xx=px(d.hour)-barWidth/2;
    ctx.fillRect(xx,Math.min(start,end),barWidth,Math.max(1,Math.abs(start-end)));
   }
  }else{
   // Do not connect missing hours; gaps are not zero.
   for(const d of points){if(!isGood(d.value)){active=false;continue;}
    if(active&&lastH!==null&&d.hour-lastH<=1.001)axis(ctx,px(lastH),py(points.find(x=>x.hour===lastH)?.value),px(d.hour),py(d.value),color);
    dot(ctx,px(d.hour),py(d.value),color,3.7);active=true;lastH=d.hour;
   }
  }
  ctx.textAlign='left';ctx.font='17px system-ui';ctx.fillStyle=ink.muted;
  const note=bars?`${accumulationHours}-hour totals shown as bars · rolling intervals may overlap; missing ≠ zero.`:'Gaps are unavailable data, not zero.';
  // Footer is kept below the X-axis title rather than drawn through it.
  ctx.fillText(`${validPoints.length} valid / ${points.length} hours. ${note}`,x0,canvas.height-26);
 }
 // Place hodograph speed-ring labels on visible arcs rather than clamping
 // them against the edge/cardinal labels. Pure helper for layout tests.
 function hodographRingLabel(ox,oy,r,bounds){
  const angles=[-35,-27,-45,-20,-55,-65,-75,-85,25,35,45,55,115,135,155];
  for(const degrees of angles){
   const theta=degrees*Math.PI/180;
   const x=ox+r*Math.cos(theta),y=oy+r*Math.sin(theta);
   if(x>=bounds.left+24&&x<=bounds.right-24&&
      y>=bounds.top+18&&y<=bounds.bottom-18)return {x,y};
  }
  return null;
 }
 // Slightly gentler tilt than the prior 40°C spread across 1000–100 hPa.
 const SKEW=35;
 function deriveSurfaceMetrics(rows){
  const ordered=[...rows].filter(r=>Number.isFinite(r?.p)).sort((a,b)=>b.p-a.p);
  const sfc=ordered.find(r=>isGood(r.t)||isGood(r.td)||isGood(r.u)||isGood(r.v))||null;
  let lcl=null,frz=null;
  if(sfc&&isGood(sfc.t)&&isGood(sfc.td)){
   const tk=sfc.t+273.15,tdk=sfc.td+273.15;
   const tlcl=1/(1/(tdk-56)+Math.log(tk/tdk)/800)+56;
   lcl=sfc.p*Math.pow(tlcl/tk,3.5);
  }
  for(let i=0;i<ordered.length-1;i++){
   const a=ordered[i],b=ordered[i+1];
   if(!isGood(a.t)||!isGood(b.t))continue;
   if(a.t===0){frz=a.p;break;}
   if((a.t>0&&b.t<0)||(a.t<0&&b.t>0)){
    const f=(0-a.t)/(b.t-a.t);
    frz=a.p+f*(b.p-a.p);break;
   }
  }
  return {surface:sfc,lclPressure:lcl,freezingPressure:frz};
 }
 function formatWind(u,v){
  if(!isGood(u)||!isGood(v))return '—';
  const spd=Math.hypot(u,v)*1.94384449;
  const dir=(Math.atan2(-u,-v)*180/Math.PI+360)%360;
  return `${Math.round(dir).toString().padStart(3,'0')}° / ${Math.round(spd)} kt`;
 }
 function textRow(ctx,label,value,x,y,ink,muted){
  ctx.fillStyle=muted;ctx.textAlign='left';ctx.fillText(label,x,y);
  ctx.fillStyle=ink;ctx.textAlign='right';ctx.fillText(value,x+170,y);
 }
 function plotSounding(s,rows,validTime,summary={}){
  s.lastPlot={kind:'sounding',rows,validTime,summary};
  const {canvas,data}=s,ctx=canvas.getContext('2d');
  // A readable operational sounding display, deliberately rendered locally in
  // the browser. No interpolation is used to create missing thermodynamic data.
  const ink=frame(ctx,canvas,`${data.modelLabel}  /  Vertical profile`,
    `Valid ${fmt(validTime)}   •   ${Math.abs(data.lat).toFixed(3)}° ${data.lat>=0?'N':'S'}, ${Math.abs(data.lon).toFixed(3)}° ${data.lon>=0?'E':'W'}`);
  const light=st.theme==='light', W=canvas.width,H=canvas.height;
  const fg=ink.ink, muted=ink.muted, grid=ink.grid;
  const tint=light?'#f4f7fb':'#15263a',edge=light?'#dce4ec':'#38516b';
  const goodRows=rows.filter(r=>r&&isGood(r.p)&&r.p>=100&&r.p<=1050).sort((a,b)=>b.p-a.p);
  const sparse=!!summary.sparse;
  // Anchor the bottom of the plot at the actual model surface pressure when
  // present. Never extend the temperature trace below terrain.
  const p0=summary.terrainScreened&&isGood(summary.surfacePressure)
   ?Math.max(400,Math.min(1050,summary.surfacePressure)):1050,ptop=100;
  const x0=99,x1=820,y0=166,y1=762;
  // A readable near-surface temperature axis without unnecessary +60/+70°C space.
  const temperatureMin=-50,temperatureMax=50;
  const barbX=860;
  // Preserve standard skew-T log-P pressure scaling.
  const Y=p=>y1-Math.log(p0/p)/Math.log(p0/ptop)*(y1-y0);
  const X=(t,p)=>x0+((t-temperatureMin+SKEW*Math.log(1000/p)/Math.log(1000/100))/(temperatureMax-temperatureMin))*(x1-x0);
  const card=(x,y,w,h,r=12)=>{ctx.fillStyle=tint;ctx.strokeStyle=edge;ctx.lineWidth=1.2;
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();ctx.stroke();};
  const label=(txt,x,y,size=16,color=muted,weight='400',align='left')=>{
    ctx.textAlign=align;ctx.font=`${weight} ${size}px system-ui`;ctx.fillStyle=color;ctx.fillText(txt,x,y);
  };
  const path=(points,color,width=1,dash=[])=>{if(points.length<2)return;ctx.save();ctx.lineWidth=width;ctx.strokeStyle=color;ctx.setLineDash(dash);ctx.beginPath();
    for(let i=0;i<points.length;i++)i?ctx.lineTo(...points[i]):ctx.moveTo(...points[i]);ctx.stroke();ctx.restore();};
  // Plot backing and reference axes. All curves are clipped inside the plot.
  card(x0-14,y0-50,x1-x0+32,y1-y0+87);
  ctx.save();ctx.beginPath();ctx.rect(x0,y0,x1-x0,y1-y0);ctx.clip();
  // Dry adiabats: potential temperature, K, referenced to 1000 hPa.
  for(let theta=260;theta<=430;theta+=20){const points=[];
   for(let p=1000;p>=100;p-=15){let t=theta*Math.pow(p/1000,.2854)-273.15;points.push([X(t,p),Y(p)]);}
   path(points,light?'#a9b8c9':'#536f87',1.2);
  }
  // Mixing-ratio guides in g/kg. Do not portray these as observed dewpoints.
  for(const q of [1,2,4,8,12,16,20]){const points=[];
   for(let p=1000;p>=450;p-=15){const w=q/1000,e=w*p/(.622+w),ratio=Math.log(e/6.112);
    const t=243.5*ratio/(17.67-ratio);if(Number.isFinite(t))points.push([X(t,p),Y(p)]);}
   path(points,light?'#95baa5':'#4b8a73',1.2,[4,7]);
  }
  for(const p of [1000,925,850,700,600,500,400,300,250,200,150,100]){
   path([[x0,Y(p)],[x1,Y(p)]],p===700||p===500?edge:grid,p===700||p===500?1.5:1);
  }
  for(let t=-120;t<=80;t+=10){const z=[];for(let p=1000;p>=100;p-=25)z.push([X(t,p),Y(p)]);
   path(z,t===0?(light?'#b5cce6':'#54738f'):grid,t===0?1.8:1);
  }
  // Connect successive native levels in the sounding trace; do not require
  // every intermediate 25-hPa slot to be populated. Large gaps are dashed.
  const profile=(key,color)=>{
   const validRows=goodRows.filter(r=>isGood(r[key])&&r[key]>-140&&r[key]<90);
   if(validRows.length===1){const r=validRows[0];dot(ctx,X(r[key],r.p),Y(r.p),color,4);return;}
   for(let i=1;i<validRows.length;i++){
    const a=validRows[i-1],b=validRows[i];
    path([[X(a[key],a.p),Y(a.p)],[X(b[key],b.p),Y(b.p)]],color,3.7, a.p-b.p>175?[7,6]:[]);
   }
   for(const r of validRows)dot(ctx,X(r[key],r.p),Y(r.p),color,2.6);
  };
  // Approximate most-unstable parcel trace: selected from valid native T/Td
  // in the lowest 300 hPa. Omit if profile is sparse or incompletely moist.
  const parcel=window.EVUSoundingThermo?.mostUnstableParcel(goodRows,{sparse})||null;
  if(parcel){
   path(parcel.points.map(r=>[X(r.t,r.p),Y(r.p)]),'#f7c873',3.1,[9,5]);
   dot(ctx,X(parcel.lclTemperature,parcel.lclPressure),Y(parcel.lclPressure),'#f7c873',5);
  }
  profile('t','#fa696c');profile('td','#3ed3ad');
  ctx.restore();
  // Pressure and temperature ticks outside of plot clip.
  for(const p of [1000,925,850,700,600,500,400,300,250,200,150,100]){
   if(p>p0)continue;
   label(String(p),x0-23,Y(p)+5,14,muted,'500','right');
  }
  if(summary.terrainScreened)label(String(Math.round(p0)),x0-23,y1+5,14,fg,'700','right');
  for(let t=temperatureMin;t<=temperatureMax;t+=10){const x=X(t,p0);if(x<x0+6||x>x1-6)continue;
   label(String(t),x,y1+28,14,muted,'500','center');
  }
  label('Temperature (°C)',(x0+x1)/2,836,16,fg,'650','center');
  ctx.save();ctx.translate(34,(y0+y1)/2);ctx.rotate(-Math.PI/2);label('Pressure (hPa)',0,0,16,fg,'650','center');ctx.restore();
  // Clean, non-overlapping header for the Skew-T panel. Keep the title and
  // guide-description separate from the trace legend for a more professional look.
  const headY=y0-25, subY=y0-6, legendY=y0-25;
  label('Skew-T / Log-P',x0-2,headY,19,fg,'700');
  label('Dry adiabats · mixing-ratio guides',x0+14,subY,11,muted,'400');
  const legendItem=(x,color,text,size=14)=>{
    path([[x,legendY-5],[x+20,legendY-5]],color,3.2);
    label(text,x+27,legendY,size,color,'700');
  };
  let lx=x1-255;
  legendItem(lx,'#fa696c','T',15); lx+=52;
  legendItem(lx,'#3ed3ad','Td',15); lx+=62;
  if(parcel) legendItem(lx,'#f7c873','MU parcel*',13);
  // Sparse profiles are a transparent fallback, not a purported full sounding.
  if(sparse){ctx.fillStyle=light?'rgba(255,246,225,.96)':'rgba(71,48,26,.96)';
   ctx.fillRect(x0+8,y0+13,x1-x0-16,42);
   label('SPARSE FALLBACK — full profile unavailable',x0+22,y0+40,17,light?'#804d0a':'#ffda92','700');
  }
  if(!goodRows.some(r=>isGood(r.t))){label('No usable temperature profile was published for this point.',x0+55,440,19,muted,'500');}
  // Native wind barbs in knots, selected to avoid overlap and clutter.
  label('WIND',barbX,y0-9,13,muted,'700','center');
  const lerp=(a,b,t)=>a+(b-a)*t;
  const mixColor=(a,b,t)=>{
   const pa=[parseInt(a.slice(1,3),16),parseInt(a.slice(3,5),16),parseInt(a.slice(5,7),16)];
   const pb=[parseInt(b.slice(1,3),16),parseInt(b.slice(3,5),16),parseInt(b.slice(5,7),16)];
   const pc=pa.map((v,i)=>Math.round(lerp(v,pb[i],t)).toString(16).padStart(2,'0'));
   return `#${pc.join('')}`;
  };
  const windBarbColor=knots=>{
   const stops=[
    [0,'#7cc7ff'], [15,'#53d2c7'], [30,'#6edc6e'], [45,'#d9df5a'],
    [60,'#f1bc4f'], [80,'#ef8c3f'], [100,'#df5f55'], [120,'#c04ba5']
   ];
   if(!Number.isFinite(knots))return fg;
   if(knots<=stops[0][0])return stops[0][1];
   for(let i=1;i<stops.length;i++){
    const [k1,c1]=stops[i];
    const [k0,c0]=stops[i-1];
    if(knots<=k1)return mixColor(c0,c1,(knots-k0)/(k1-k0));
   }
   return stops[stops.length-1][1];
  };
  const drawBarb=(r)=>{
   if(!isGood(r.u)||!isGood(r.v))return;
   const x=barbX,y=Y(r.p),knots=Math.hypot(r.u,r.v)*1.94384449,angle=Math.atan2(-r.u,-r.v);
   const color=windBarbColor(knots);
   const dirX=Math.sin(angle),dirY=-Math.cos(angle),len=43;
   const ex=x+len*dirX,ey=y+len*dirY;path([[x,y],[ex,ey]],color,1.9);
   let fifty=Math.floor((knots+2.5)/50),ten=Math.floor((knots+2.5-50*fifty)/10),five=(knots+2.5-50*fifty-10*ten)>=5?1:0;
   let offset=2;
   const feather=(length,flag=false)=>{const bx=ex-offset*dirX,by=ey-offset*dirY;
    const tx=bx-length*dirY,ty=by+length*dirX;
    if(flag){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(tx,ty);ctx.lineTo(bx-10*dirX,by-10*dirY);ctx.closePath();ctx.fill();offset+=13;}
    else{path([[bx,by],[tx,ty]],color,1.9);offset+=8;}};
   for(let k=0;k<Math.min(fifty,4);k++)feather(19,true);
   for(let k=0;k<Math.min(ten,5);k++)feather(18);
   if(five)feather(10);
   if(knots<2.5){ctx.strokeStyle=color;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.stroke();}
  };
  let lastBarbY=-Infinity;
  for(const r of goodRows){const y=Y(r.p);if(Math.abs(y-lastBarbY)>=25&&isGood(r.u)&&isGood(r.v)){
   drawBarb(r);lastBarbY=y;}}
  label('kt',barbX,835,13,muted,'500','center');
  // Expanded hodograph: dynamically fit the occupied wind envelope so the
  // curve uses more of the available panel space while keeping the origin.
  const hx=903,hy=132,hw=545,hh=422;card(hx,hy,hw,hh);
  label('HODOGRAPH',hx+19,hy+31,18,fg,'700');
  label('Wind components (kt)',hx+hw-18,hy+31,13,muted,'400','right');
  const windRows=goodRows.filter(r=>isGood(r.u)&&isGood(r.v)&&Math.hypot(r.u,r.v)<130);
  const windPts=windRows.map(r=>({u:r.u*1.94384449,v:r.v*1.94384449,p:r.p}));
  const left=hx+18, top=hy+58, right=hx+hw-18, bottom=hy+hh-52, pad=22;
  const maxK=Math.max(40,...windPts.map(r=>Math.hypot(r.u,r.v)));
  const ringStep=maxK>=160?40:maxK>=100?25:20;
  const axisMax=Math.ceil(maxK/ringStep)*ringStep;
  const xs=[0,...windPts.map(r=>r.u)], ys=[0,...windPts.map(r=>r.v)];
  const xmin=Math.min(...xs), xmax=Math.max(...xs), ymin=Math.min(...ys), ymax=Math.max(...ys);
  const spanX=Math.max(20,xmax-xmin), spanY=Math.max(20,ymax-ymin);
  const scale=Math.min((right-left-2*pad)/spanX,(bottom-top-2*pad)/spanY);
  const ox=left+pad-xmin*scale, oy=bottom-pad+ymin*scale;
  const plotW=right-left, plotH=bottom-top;
  const radius=axisMax*scale;
  const hxy=r=>[ox+r.u*1.94384449*scale,oy-r.v*1.94384449*scale];
  ctx.save();ctx.beginPath();ctx.rect(left,top,plotW,plotH);ctx.clip();
  // Label ring arcs within the plot instead of clamping all labels against
  // the right boundary (which overlapped the 'E' cardinal label for 80 kt).
  // Prefer the upper-right arc; skip a label if no fully visible position exists.
  for(let speed=ringStep;speed<=axisMax;speed+=ringStep){
   const r=speed*scale;
   ctx.strokeStyle=grid;ctx.lineWidth=1;ctx.beginPath();ctx.arc(ox,oy,r,0,Math.PI*2);ctx.stroke();
   const position=hodographRingLabel(ox,oy,r,{left,top,right,bottom});
   if(position){
    // Small backing patch breaks the guide ring beneath the numeral.
    const text=String(speed);ctx.font='500 12px system-ui';
    const tw=ctx.measureText(text).width;
    ctx.fillStyle=tint;ctx.fillRect(position.x-tw/2-4,position.y-13,tw+8,18);
    label(text,position.x,position.y,12,muted,'600','center');
   }
  }
  path([[left,oy],[right,oy]],grid,1);
  path([[ox,top],[ox,bottom]],grid,1);
  const hcolor=p=>p>=900?'#37c7ae':p>=700?'#5da7ec':p>=500?'#efbb69':'#da82d2';
  for(let i=1;i<windRows.length;i++){
   const a=windRows[i-1],b=windRows[i];
   path([hxy(a),hxy(b)],hcolor((a.p+b.p)/2),3.2,a.p-b.p>175?[6,5]:[]);
  }
  let lastLabel=null;
  for(const target of [1000,925,850,700,500,300,200]){
   const r=windRows.find(r=>Math.abs(r.p-target)<1);
   if(!r)continue;
   const [xx,yy]=hxy(r);dot(ctx,xx,yy,hcolor(r.p),4);
   if([925,850,700,500,300].includes(target)&&(!lastLabel||Math.hypot(xx-lastLabel[0],yy-lastLabel[1])>=30)){
    label(String(target),Math.min(right-18,xx+8),Math.max(top+14,yy-7),12,fg,'650');lastLabel=[xx,yy];
   }
  }
  ctx.restore();
  label('N',ox,Math.max(top-6,oy-radius-12),12,muted,'600','center');
  label('E',Math.min(right+12,ox+radius+18),oy+4,12,muted,'600','center');
  label('S',ox,Math.min(bottom+18,oy+radius+18),12,muted,'600','center');
  label('W',Math.max(left-12,ox-radius-18),oy+4,12,muted,'600','center');
  if(!windRows.length)label('Winds unavailable',ox,oy,17,muted,'500','center');
  label('≥900',hx+22,hy+hh-13,12,'#37c7ae');
  label('900–700',hx+113,hy+hh-13,12,'#5da7ec');
  label('700–500',hx+242,hy+hh-13,12,'#efbb69');
  label('<500 hPa',hx+382,hy+hh-13,12,'#da82d2');
  // Model-derived diagnostics are sampled from the published model grid,
  // not recomputed from the coarser sounding-profile grid.
  const dx=903,dy=570,dw=545,dh=257;card(dx,dy,dw,dh);
  label('MODEL DIAGNOSTICS',dx+20,dy+34,18,fg,'700');
  const diag=summary.diagnostics||{},v=(x,unit)=>isGood(x)?`${Math.round(x)} ${unit}`:'—';
  const validShear=x=>isGood(x)&&x>=0&&x<=250?v(x,'kt'):'—';
  const stats=[['SBCAPE',v(diag.sbcape,'J/kg')],['MLCAPE',v(diag.mlcape,'J/kg')],
   ['MUCAPE',v(diag.mucape,'J/kg')],['SRH 0–1',v(diag.srh01,'m²/s²')],
   ['SRH 0–3',v(diag.srh03,'m²/s²')],['Shear 0–1 km',validShear(diag.shear01)],
   ['Shear 0–6 km',validShear(diag.shear06)]];
  const leftX=dx+20,rightX=dx+dw/2+10;
  for(let i=0;i<stats.length;i++){
   const col=i%2,row=Math.floor(i/2),xx=col?rightX:leftX,yy=dy+70+row*34;
   label(stats[i][0],xx,yy,13,muted);
   label(stats[i][1],xx+222,yy,13,fg,'650','right');
  }
  path([[dx+20,dy+196],[dx+dw-20,dy+196]],edge,1);
  const n=summary.levels||{temperature:goodRows.filter(r=>isGood(r.t)).length,
   dewpoint:goodRows.filter(r=>isGood(r.td)).length,wind:windRows.length};
  label('Levels (2-m T/Td, 10-m wind + aloft)',dx+20,dy+219,13,muted);
  label(`${n.temperature} / ${n.dewpoint} / ${n.wind}`,dx+dw-20,dy+219,14,fg,'700','right');
  if(parcel)label(`MU* ${Math.round(parcel.sourcePressure)} hPa  •  LCL ~${Math.round(parcel.lclPressure)} hPa`,dx+20,dy+245,12,'#f7c873','600');
  else label('MU parcel: unavailable (insufficient native moisture data)',dx+20,dy+245,12,muted);
  const met=deriveSurfaceMetrics(goodRows);
  label(`Lowest level: ${isGood(met.surface?.t)?Math.round(met.surface.t)+'°C':'—'} / ${isGood(met.surface?.td)?Math.round(met.surface.td)+'°C':'—'}  ·  ${formatWind(met.surface?.u,met.surface?.v)}`,x0,865,14,fg,'500');
  // Keep MU-parcel caveats inside the right-hand footer. The former single
  // centered line extended beyond the 1480-pixel canvas and was truncated.
  // Measure both lines against the actual right-card width on either theme.
  const footnote=(message,y)=>{
   const x=dx+20, maxWidth=dw-40;
   let fontSize=12;
   ctx.font=`400 ${fontSize}px system-ui`;
   while(ctx.measureText(message).width>maxWidth&&fontSize>10){
    fontSize-=0.5;ctx.font=`400 ${fontSize}px system-ui`;
   }
   label(message,x,y,fontSize,muted);
  };
  footnote(`*Approximate pseudo-adiabatic MU parcel; no CAPE/CIN computed.${sparse?' Sparse fallback.':''}`,856);
  footnote(summary.terrainScreened?'Native surface pressure; below-ground levels excluded.':'Surface pressure unavailable; no terrain screening.',879);
 }
 async function soundingDiagnostics(selected,record,validTime){
  const out={diagnostics:{sbcape:null,mlcape:null,mucape:null,srh01:null,srh03:null,shear01:null,shear06:null}};
  const names=['sbcape','mlcape','mucape','srh01','srh03','shear01','shear06'];
  if(selected.timeMode==='analysis'){
   const source=st.sources.get(selected.sourceId);if(!source)return out;
   const stamp=validTime.toISOString();
   for(const name of names){
    const ds=source.datasets.find(d=>cycleKey(d.init_time)===stamp&&d.variables?.some(v=>v.name===name&&v.available_hours?.includes(0)));
    if(!ds)continue;
    try{out.diagnostics[name]=await sampledValue(source,ds,name,0,selected.lon,selected.lat,FIELDS[name]||fieldInfo({name},name,ds.model));}catch(_){ }
   }
   return out;
  }
  if(!record?.source||!record?.ds)return out;
  for(const name of names){
   try{out.diagnostics[name]=await sampledValue(record.source,record.ds,name,record.h,selected.lon,selected.lat,FIELDS[name]||fieldInfo({name},name,record.ds.model));}catch(_){ }
  }
  return out;
 }
 function sampleField(data,ds,v,lon,lat){
  const grid=gridFromDataset(ds,v),fld=new apgl.RawScalarField(grid,data);
  const value=Number(fld.sampleField(lon,lat));return isGood(value)?value:null;
 }
 async function sampledValue(src,ds,name,h,lon,lat,overrideMeta){
  const v=ds?.variables?.find(x=>x.name===name&&x.available_hours?.includes(h));if(!v)return null;
  const vals=await getDisplayData(src,ds,v,h,overrideMeta||fieldInfo(v,name,ds.model),()=>{});
  return sampleField(vals,ds,v,lon,lat);
 }
 function snapshotReference(data){return data.referenceCycle?new Date(data.referenceCycle):null;}
 function analysisAt(src,iso,name,product=null){return src?.datasets?.find(d=>cycleKey(d.init_time)===iso&&(!product||d.product===product)&&d.variables?.some(v=>v.name===name&&v.available_hours?.includes(0)));}
 async function seriesValue(s,h){
  const {data}=s,{field,lon,lat}=data;
  const duration=snowAccumulationHours(field)||precipitationAccumulationHours(field);
  if(data.timeMode==='analysis'){
   const ref=snapshotReference(data);if(!ref)return null;const stamp=valid({init_time:ref.toISOString()},h).toISOString();
   let name=field,product=null;
   if(field==='refc_ptype')name='refc';
   if(field==='asnow'||field==='snow6h'){name='snow6h';product='nohrsc_6h';}
   if(field==='snow24h'||field==='snow48h'){name='snow24h';product='nohrsc_24h';}
   if(field==='apcp'||field.startsWith('apcp')){name='apcp';product='mrms_apcp';}
   if(field==='snow1h'||field==='snow3h')return null;
   if(field==='asnow'){
    if(h===0||h%6!==0)return null;let sum=0;
    for(let step=6;step<=h;step+=6){const t=valid({init_time:ref.toISOString()},step).toISOString(),d=analysisAt(data.source,t,'snow6h','nohrsc_6h');if(!d)return null;const n=await sampledValue(data.source,d,'snow6h',0,lon,lat,FIELDS.snow6h);if(n===null)return null;sum+=n;}
    return sum;
   }
   if(field==='snow48h'){
    const current=analysisAt(data.source,stamp,'snow24h','nohrsc_24h'),old=analysisAt(data.source,valid({init_time:ref.toISOString()},h-24).toISOString(),'snow24h','nohrsc_24h');
    if(!current||!old)return null;const a=await sampledValue(data.source,current,'snow24h',0,lon,lat,FIELDS.snow48h),b=await sampledValue(data.source,old,'snow24h',0,lon,lat,FIELDS.snow48h);return a===null||b===null?null:a+b;
   }
   if((field==='apcp'||field.startsWith('apcp')) && name==='apcp'){
    // MRMS records contain one-hour QPE, not a ready-made 3/6/24/48-hour
    // total. Combine the complete and non-overlapping intervals at the point.
    const from=field==='apcp'?1:Math.max(1,h-duration+1);
    if(h===0||h<from||((field!=='apcp')&&h<duration))return null;
    let total=0;
    for(let j=from;j<=h;j++){
     const time=valid({init_time:ref.toISOString()},j).toISOString();
     const record=analysisAt(data.source,time,'apcp','mrms_apcp');
     if(!record)return null;
     const value=await sampledValue(data.source,record,'apcp',0,lon,lat,FIELDS[field]||FIELDS.apcp);
     if(value===null)return null;total+=value;
    }
    return total;
   }
   const d=analysisAt(data.source,stamp,name,product);if(!d)return null;
   return sampledValue(data.source,d,name,0,lon,lat,FIELDS[field]||FIELDS[name]);
  }
  const ds=data.dataset;if(!ds)return null;
  const name=field==='refc_ptype'?'refc':duration?(field.startsWith('snow')?'asnow':'apcp'):field;
  let fh=h+Number(data.panel.cfg.forecastHourOffset||0);
  if(data.panel.cfg.timeMode==='valid')fh=Math.round((Date.parse(data.referenceCycle)-Date.parse(ds.init_time))/3600000)+h+Number(data.panel.cfg.forecastHourOffset||0);
  const meta=field==='refc_ptype'?FIELDS.refc:(FIELDS[field]||FIELDS[name]);
  if(fh<0)return null;
  const end=await sampledValue(data.source,ds,name,fh,lon,lat,meta);if(end===null)return null;
  if(!duration)return end;
  if(fh<duration)return null;
  if(fh===duration)return end;
  const start=await sampledValue(data.source,ds,name,fh-duration,lon,lat,meta);
  return start===null?null:Math.max(0,end-start);
 }
 async function updateSeries(s){
  const token=++s.token;const maxH=Math.max(0,Number(st.cfg?.display?.maxForecastHour)||84);
  const ds=s.data.dataset;
  const allHours=ds?Array.from({length:Math.min(maxH+1,Number(ds.variables?.find(v=>v.name===s.data.field)?.shape?.[0]||maxH+1))},(_,h)=>h):Array.from({length:maxH+1},(_,h)=>h);
  const points=allHours.map(hour=>({hour,value:null}));plotSeries(s,points);
  let validCount=0;for(let i=0;i<points.length;i++){
   if(s.cancelled||token!==s.token)return;
   const record=points[i];
   try{record.value=await seriesValue(s,record.hour);if(isGood(record.value))validCount++;}catch(_){record.value=null;}
   if(i%3===0||i===points.length-1){s.progress.textContent=`Loading forecast-hour values: ${i+1}/${points.length} · ${validCount} valid`;plotSeries(s,points);await new Promise(r=>setTimeout(r,0));}
  }
  s.progress.textContent=`Complete · ${validCount} valid hours · ${points.length-validCount} missing or unavailable`;
 }
 function chooseSoundingRecord(data){
  const source=st.sources.get(data.sourceId);if(!source)return null;
  if(data.timeMode==='analysis'){
   const vtime=valid(st.ref,st.hour).toISOString();
   const ds=source.datasets.find(d=>cycleKey(d.init_time)===vtime&&d.product==='rap_pressure')||source.datasets.find(d=>cycleKey(d.init_time)===vtime&&d.variables?.some(v=>v.name==='t850'))||source.datasets.find(d=>cycleKey(d.init_time)===vtime&&d.variables?.some(v=>v.name==='t2m'));
   return ds?{source,ds,h:0}:null;
  }
  // Follow the current chosen cycle rather than preserving the original one.
  const found=source.datasets.find(d=>cycleKey(d.init_time)===st.ref?.id)||null;
  if(!found)return null;
  const hour=st.hour+Number(data.panel.cfg.forecastHourOffset||0);
  return {source,ds:found,h:hour};
 }
 async function updateSparseSounding(s,token,reason=""){
  const record=chooseSoundingRecord(s.data);
  if(!record){s.progress.textContent='No upper-air dataset for this source at the selected valid time.';plotSounding(s,[],st.ref?valid(st.ref,st.hour):new Date());return;}
  const {source,ds,h}=record;
  const tm=valid(st.ref,st.hour),pts=[1000,925,850,700,500,300];
  const surfaceDs=s.data.timeMode==='analysis'?(analysisAt(source,tm.toISOString(),'t2m','urma')||analysisAt(source,tm.toISOString(),'t2m','rtma')||analysisAt(source,tm.toISOString(),'t2m')):ds;
  s.progress.textContent=`Loading sounding for ${fmt(tm)}…`;
  const tasks=pts.map(async p=>{
   const tempField=p===1000?'t2m':'t'+p;
   const candidates=p===1000?['t2m','dpt2m','u10','v10']:[tempField,'u'+p,'v'+p];
   const values=await Promise.all(candidates.map(async name=>{try{const target=p===1000?surfaceDs:ds;return target?await sampledValue(source,target,name,p===1000&&s.data.timeMode==='analysis'?0:h,s.data.lon,s.data.lat,fieldInfo({name},name,target.model)):null;}catch(_){return null;}}));
   if(p===1000)return {p,t:values[0]===null?null:(values[0]-32)/1.8,td:values[1]===null?null:(values[1]-32)/1.8,u:values[2],v:values[3]};
   return {p,t:values[0],td:null,u:values[1],v:values[2]};
  });
  const rows=await Promise.all(tasks);if(s.cancelled||token!==s.token)return;
  const complete=rows.filter(r=>isGood(r.t)||isGood(r.u));
  s.progress.textContent=complete.length?`${reason?reason+' · ':''}Sparse fallback · ${fmt(tm)} · ${complete.length} available levels · upper-level dewpoint unavailable · surface pressure nominal 1000 hPa`:'No published profile or usable sparse upper-air values for this hour.';
  const summary=await soundingDiagnostics(s.data,record,tm);
  summary.sparse=true;summary.sparseReason=reason||'Full profile unavailable';
  summary.levels={temperature:rows.filter(r=>isGood(r.t)).length,dewpoint:rows.filter(r=>isGood(r.td)).length,wind:rows.filter(r=>isGood(r.u)&&isGood(r.v)).length};
  plotSounding(s,rows,tm,summary);
 }
 async function updateSounding(s){
  const token=++s.token;
  const selected=s.data;
  const isAnalysis=selected.timeMode==='analysis';
  const validTime=st.ref?valid(st.ref,st.hour):new Date();
  const record=chooseSoundingRecord(selected);
  const model=isAnalysis?'rap_analysis':selected.sourceId;
  const cycle=isAnalysis?validTime.toISOString():(record?.ds?.init_time||st.ref?.init_time);
  const hour=isAnalysis?0:record?.h;
  if(!cycle||!Number.isInteger(hour)||hour<0){
   await updateSparseSounding(s,token,'Profile unavailable');return;
  }
  s.progress.textContent=`Loading native pressure-level profile for ${fmt(validTime)}…`;
  try{
   const result=await window.EVUSoundingProfiles?.load({model,cycle,hour,
    lon:selected.lon,lat:selected.lat});
   if(s.cancelled||token!==s.token)return;
   if(result?.status==='available'){
    const n=result.levels;
    const recordCount=n.temperature+n.dewpoint+n.wind;
    if(recordCount){
     const sourceNote=model==='refs_mean'?' · native operational REFS Mean':'';
     const gridNote=result.gridKm?` · sampled grid ~${Math.round(result.gridKm)} km`:'';
     const missingNote=result.unavailableVariables?.length?` · missing chunks: ${result.unavailableVariables.join(', ')}`:'';
     const surfaceNote=result.terrainScreened?` · native surface ${Math.round(result.surfacePressure)} hPa · below-ground levels removed`:' · surface pressure unavailable; terrain screening not possible';
     s.progress.textContent=`Native profile · valid ${fmt(validTime)} · T ${n.temperature} / Td ${n.dewpoint} / Wind ${n.wind} levels${gridNote}${sourceNote}${missingNote}${surfaceNote}`;
     const summary=await soundingDiagnostics(selected,record,validTime);
     summary.gridKm=result.gridKm||null;
     summary.levels=n;
     summary.terrainScreened=result.terrainScreened;
     summary.surfacePressure=result.surfacePressure;
     plotSounding(s,result.rows,validTime,summary);return;
    }
    await updateSparseSounding(s,token,'Native profile has no valid values at this location');return;
   }
   await updateSparseSounding(s,token,result?.reason||'Profile not yet published');
  }catch(e){
   if(s.cancelled||token!==s.token)return;
   console.warn('Unable to load pressure-level sounding:',e);
   await updateSparseSounding(s,token,'Full profile loading error: '+(e?.message||String(e)));
  }
 }
 async function openWindow(type,data){const s=makeWindow(type,data);if(type==='series')await updateSeries(s);else await updateSounding(s);}
 function scheduleSoundingRefresh(){
  if(refreshTimer!==null)clearTimeout(refreshTimer);
  refreshTimer=setTimeout(()=>{refreshTimer=null;for(const s of WINDOWS){if(s.type==='sounding'&&!s.cancelled)void updateSounding(s);}},75);
 }
 // Canvases hold rendered pixels, not CSS colors: repaint existing windows
 // when the main viewer theme changes, using only their last plotted data.
 // New data arriving asynchronously will also draw in the latest st.theme.
 function refreshTheme(){
  for(const s of WINDOWS){
   if(s.cancelled)continue;
   const plot=s.lastPlot;
   if(plot?.kind==='sounding')plotSounding(s,plot.rows,plot.validTime,plot.summary);
   else if(plot?.kind==='series')plotSeries(s,plot.points);
   else frame(s.canvas.getContext('2d'),s.canvas,
    s.type==='sounding'?`${s.data.modelLabel} / Vertical profile`:`${s.data.modelLabel} / ${fieldName(s.data.field)}`,
    'Loading chart…');
  }
 }
 window.EVUPointInspector={showMenu,scheduleSoundingRefresh,refreshTheme};
})();
