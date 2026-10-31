/* OMD EVU Viewer: point time series and native profile Skew-T. v1.1.2.
 * Browser-only; uses the same published Zarr catalogs and decoder as viewer.js.
 * No model levels or dewpoint profiles are synthesized from other layers.
 */
(()=>{
 'use strict';
 const WINDOWS=new Set(); let menu=null, nextZ=4500, refreshTimer=null;
 const nf=n=>Number.isFinite(n)?n.toFixed(Math.abs(n)>=100?0:Math.abs(n)>=10?1:2):'—';
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
  const win=document.createElement('section');win.className='evu-inspect-window';win.setAttribute('role','dialog');win.setAttribute('aria-label',type==='series'?'Point time series':'Point sounding');
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
  const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=735;canvas.className='evu-inspect-canvas';
  body.append(progress,canvas);win.append(head,body);document.body.append(win);
  const n=WINDOWS.size;win.style.left=Math.min(50+n*35,Math.max(8,window.innerWidth-400))+'px';win.style.top=Math.min(120+n*38,Math.max(8,window.innerHeight-320))+'px';win.style.zIndex=String(++nextZ);
  win.addEventListener('pointerdown',()=>{win.style.zIndex=String(++nextZ);});
  close.addEventListener('click',()=>{state.cancelled=true;state.token++;WINDOWS.delete(state);win.remove();});
  save.addEventListener('click',()=>{const a=document.createElement('a');a.download=`EVU_${type}_${data.modelLabel.replace(/[^\w-]+/g,'_')}_${data.lat.toFixed(2)}_${data.lon.toFixed(2)}.png`;a.href=canvas.toDataURL('image/png');a.click();});
  let drag=null;
  head.addEventListener('pointerdown',e=>{
   if(e.button!==0||e.target.closest('button'))return;
   drag={x:e.clientX,y:e.clientY,left:win.offsetLeft,top:win.offsetTop};head.setPointerCapture(e.pointerId);e.preventDefault();
  });
  head.addEventListener('pointermove',e=>{if(!drag)return;win.style.left=Math.max(0,Math.min(window.innerWidth-110,drag.left+e.clientX-drag.x))+'px';win.style.top=Math.max(0,Math.min(window.innerHeight-70,drag.top+e.clientY-drag.y))+'px';});
  head.addEventListener('pointerup',()=>{drag=null;});head.addEventListener('pointercancel',()=>{drag=null;});
  const state={win,canvas,progress,type,data,token:0,cancelled:false,prevKey:null};WINDOWS.add(state);
  return state;
 }
 function frame(ctx,canvas,title,subtitle){
  const w=canvas.width,h=canvas.height,theme=st.theme==='light';
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
 function plotSeries(s,points){
  const {canvas,data}=s,ctx=canvas.getContext('2d'),validPoints=points.filter(x=>isGood(x.value));
  const unit=FIELDS[data.field]?.unit||'';const ink=frame(ctx,canvas,`${data.modelLabel} · ${fieldName(data.field)}`,`Init ${data.timeMode==='analysis'?fmt(data.referenceCycle):cycleLabel(data.dataset)} · ${data.lat.toFixed(3)}°, ${data.lon.toFixed(3)}° · ${unit||'units not specified'}`);
  const x0=95,x1=1039,y0=136,y1=644;
  ctx.font='17px system-ui';
  if(!validPoints.length){ctx.fillStyle=ink.muted;ctx.fillText('No published numeric forecast values for this point and cycle.',x0+40,335);return;}
  const maxH=Math.max(1,...points.map(x=>x.hour));
  const accumulationHours=intervalAccumulationHours(data.field),bars=accumulationHours>0;
  let min=Math.min(...validPoints.map(x=>x.value)),max=Math.max(...validPoints.map(x=>x.value));
  const padding=Math.max(.08*(max-min),max===min?Math.max(1,Math.abs(max)*.1):0);
  if(bars){min=Math.min(0,min);max=Math.max(max+padding,1e-6);}
  else{min-=padding;max+=padding;}
  const px=hour=>x0+hour/maxH*(x1-x0),py=v=>y1-(v-min)/(max-min)*(y1-y0);
  for(let i=0;i<=6;i++){
   const yy=y1-(y1-y0)*i/6,v=min+(max-min)*i/6;axis(ctx,x0,yy,x1,yy,ink.grid);
   ctx.fillStyle=ink.muted;ctx.textAlign='right';ctx.fillText(nf(v),x0-11,yy+6);
  }
  const tickStep=maxH>72?12:maxH>36?6:maxH>18?3:2;
  for(let h=0;h<=maxH;h+=tickStep){const xx=px(h);axis(ctx,xx,y0,xx,y1,ink.grid);ctx.fillStyle=ink.muted;ctx.textAlign='center';ctx.fillText(`F${String(h).padStart(3,'0')}`,xx,y1+30);}
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
  ctx.fillText(`${validPoints.length} valid / ${points.length} hours. ${note}`,x0,718);
 }
 const SKEW=40;
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
  const {canvas,data}=s,ctx=canvas.getContext('2d');const ink=frame(ctx,canvas,`Skew-T / Log-P sounding · ${data.modelLabel}`,`Valid ${fmt(validTime)} · ${data.lat.toFixed(3)}°, ${data.lon.toFixed(3)}°`);
  const x0=88,x1=774,y0=134,y1=646;
  const boxX=828,boxY=138,boxW=236,boxH=334;
  const barbX=1008;
  const Y=p=>y1-Math.log(1000/p)/Math.log(1000/100)*(y1-y0);
  const X=(t,p)=>x0+((t+86+SKEW*Math.log(1000/p))/200)*(x1-x0);
  ctx.font='16px system-ui';
  for(const p of [1000,925,850,700,600,500,400,300,250,200,150,100]){const y=Y(p);axis(ctx,x0,y,x1,y,ink.grid);ctx.fillStyle=ink.muted;ctx.textAlign='right';ctx.fillText(String(p),x0-12,y+6);}
  for(let t=-80;t<=60;t+=10){ctx.strokeStyle=t===0?(st.theme==='light'?'#9db1c5':'#55708a'):ink.grid;ctx.lineWidth=t===0?1.7:1;ctx.beginPath();ctx.moveTo(X(t,1000),Y(1000));ctx.lineTo(X(t,100),Y(100));ctx.stroke();ctx.fillStyle=ink.muted;ctx.textAlign='center';if(t>=-60&&t<=60)ctx.fillText(`${t}`,X(t,1000),y1+26);}
  ctx.textAlign='center';ctx.fillStyle=ink.ink;ctx.fillText('Temperature (°C) · Skewed isotherms',x0+((x1-x0)/2),y1+62);
  ctx.save();ctx.translate(29,(y0+y1)/2);ctx.rotate(-Math.PI/2);ctx.fillText('Pressure (hPa)',0,0);ctx.restore();
  const drawProfile=(key,color)=>{ctx.lineWidth=4;ctx.strokeStyle=color;ctx.beginPath();let open=false;for(const r of rows){if(!isGood(r[key])){open=false;continue;}const x=X(r[key],r.p),y=Y(r.p);if(!open){ctx.moveTo(x,y);open=true;}else ctx.lineTo(x,y);}ctx.stroke();};
  drawProfile('t','#ea5f55');drawProfile('td','#27bc83');
  const drawBarb=(r)=>{
   if(!isGood(r.u)||!isGood(r.v))return;
   const x=barbX,y=Y(r.p),knots=Math.hypot(r.u,r.v)*1.94384449,angle=Math.atan2(-r.u,-r.v);
   const dirX=Math.sin(angle),dirY=-Math.cos(angle),len=57;
   const ex=x+len*dirX,ey=y+len*dirY;axis(ctx,x,y,ex,ey,ink.ink);
   let fifty=Math.floor((knots+2.5)/50),ten=Math.floor((knots+2.5-50*fifty)/10),five=(knots+2.5-50*fifty-10*ten)>=5?1:0;
   let offset=2;
   ctx.strokeStyle=ink.ink;ctx.lineWidth=2;ctx.fillStyle=ink.ink;
   const feather=(length,flag=false)=>{
    const baseX=ex-offset*dirX,baseY=ey-offset*dirY;
    const tipX=baseX+length*dirY,tipY=baseY-length*dirX;
    if(flag){ctx.beginPath();ctx.moveTo(baseX,baseY);ctx.lineTo(tipX,tipY);ctx.lineTo(baseX-11*dirX,baseY-11*dirY);ctx.closePath();ctx.fill();offset+=15;}
    else{axis(ctx,baseX,baseY,tipX,tipY,ink.ink);offset+=9;}
   };
   for(let k=0;k<Math.min(fifty,4);k++)feather(25,true);
   for(let k=0;k<Math.min(ten,5);k++)feather(24);
   if(five)feather(12);
  };
  let lastBarbY=-Infinity;for(const r of rows){const y=Y(r.p);if(Math.abs(y-lastBarbY)>=19&&isGood(r.u)&&isGood(r.v)){drawBarb(r);lastBarbY=y;}}
  const derived=deriveSurfaceMetrics(rows);
  const diag=summary?.diagnostics||{};
  const surface=derived.surface||null;
  ctx.fillStyle=st.theme==='light'?'rgba(248,250,252,0.96)':'rgba(18,31,49,0.96)';
  ctx.strokeStyle=ink.grid;ctx.lineWidth=1.2;ctx.fillRect(boxX,boxY,boxW,boxH);ctx.strokeRect(boxX,boxY,boxW,boxH);
  ctx.fillStyle=ink.ink;ctx.textAlign='left';ctx.font='bold 17px system-ui';ctx.fillText('Diagnostics',boxX+14,boxY+25);
  ctx.font='15px system-ui';
  const v=(n,s='')=>Number.isFinite(n)?`${Math.round(n)}${s}`:'—';
  const tval=(n)=>Number.isFinite(n)?`${Math.round(n)} °C`:'—';
  let yy=boxY+50;
  textRow(ctx,'SBCAPE',v(diag.sbcape,' J/kg'),boxX+14,yy,ink.ink,ink.muted);yy+=23;
  textRow(ctx,'MLCAPE',v(diag.mlcape,' J/kg'),boxX+14,yy,ink.ink,ink.muted);yy+=23;
  textRow(ctx,'MUCAPE',v(diag.mucape,' J/kg'),boxX+14,yy,ink.ink,ink.muted);yy+=23;
  textRow(ctx,'0–1 km SRH',v(diag.srh01,' m²/s²'),boxX+14,yy,ink.ink,ink.muted);yy+=23;
  textRow(ctx,'0–3 km SRH',v(diag.srh03,' m²/s²'),boxX+14,yy,ink.ink,ink.muted);yy+=23;
  textRow(ctx,'0–6 km shear',v(diag.shear06,' kt'),boxX+14,yy,ink.ink,ink.muted);yy+=28;
  ctx.strokeStyle=ink.grid;ctx.beginPath();ctx.moveTo(boxX+14,yy-12);ctx.lineTo(boxX+boxW-14,yy-12);ctx.stroke();
  textRow(ctx,'Surface T',tval(surface?.t),boxX+14,yy,ink.ink,ink.muted);yy+=23;
  textRow(ctx,'Surface Td',tval(surface?.td),boxX+14,yy,ink.ink,ink.muted);yy+=23;
  textRow(ctx,'Surface wind',formatWind(surface?.u,surface?.v),boxX+14,yy,ink.ink,ink.muted);yy+=23;
  textRow(ctx,'LCL',Number.isFinite(derived.lclPressure)?`${Math.round(derived.lclPressure)} hPa`:'—',boxX+14,yy,ink.ink,ink.muted);yy+=23;
  textRow(ctx,'Freezing level',Number.isFinite(derived.freezingPressure)?`${Math.round(derived.freezingPressure)} hPa`:'—',boxX+14,yy,ink.ink,ink.muted);yy+=23;
  textRow(ctx,'Grid sample',summary?.gridKm?`~${Math.round(summary.gridKm)} km`:'native',boxX+14,yy,ink.ink,ink.muted);yy+=23;
  textRow(ctx,'Profile levels',`${summary?.levels?.temperature??0}/${summary?.levels?.dewpoint??0}/${summary?.levels?.wind??0}`,boxX+14,yy,ink.ink,ink.muted);yy+=22;
  ctx.fillStyle=ink.muted;ctx.textAlign='left';ctx.font='13px system-ui';
  ctx.fillText('Levels: temperature / dewpoint / wind',boxX+14,boxY+boxH-14);
  ctx.textAlign='left';ctx.fillStyle='#ea5f55';ctx.fillRect(97,700,26,5);ctx.fillStyle=ink.ink;ctx.fillText('Temperature',129,705);
  ctx.fillStyle='#27bc83';ctx.fillRect(295,700,26,5);ctx.fillStyle=ink.ink;ctx.fillText('Dewpoint',327,705);
  ctx.fillStyle=ink.muted;ctx.fillText('Wind barbs (kt)',915,705);
 }
 async function soundingDiagnostics(selected,record,validTime){
  const out={diagnostics:{sbcape:null,mlcape:null,mucape:null,srh01:null,srh03:null,shear06:null}};
  const names=['sbcape','mlcape','mucape','srh01','srh03','shear06'];
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
  s.progress.textContent=`Loading pressure-level profile for ${fmt(validTime)}…`;
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
     s.progress.textContent=`Valid ${fmt(validTime)} · ${n.temperature} temperature / ${n.dewpoint} dewpoint / ${n.wind} wind levels${gridNote}${sourceNote} · below-ground levels not screened`;
     const summary=await soundingDiagnostics(selected,record,validTime);
     summary.gridKm=result.gridKm||null;
     summary.levels=n;
     plotSounding(s,result.rows,validTime,summary);return;
    }
    await updateSparseSounding(s,token,'Native profile has no valid values at this location');return;
   }
   await updateSparseSounding(s,token,result?.reason||'Profile not yet published');
  }catch(e){
   if(s.cancelled||token!==s.token)return;
   console.warn('Unable to load pressure-level sounding:',e);
   await updateSparseSounding(s,token,'Profile download failed');
  }
 }
 async function openWindow(type,data){const s=makeWindow(type,data);if(type==='series')await updateSeries(s);else await updateSounding(s);}
 function scheduleSoundingRefresh(){
  if(refreshTimer!==null)clearTimeout(refreshTimer);
  refreshTimer=setTimeout(()=>{refreshTimer=null;for(const s of WINDOWS){if(s.type==='sounding'&&!s.cancelled)void updateSounding(s);}},75);
 }
 window.EVUPointInspector={showMenu,scheduleSoundingRefresh};
})();
