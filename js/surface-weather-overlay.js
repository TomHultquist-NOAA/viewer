/* OMD EVU Surface Weather — projection-aware canvas overlay for MapLibre.
 * Works with MapLibre's project()/on()/off() API; no JS build or CSS dependency.
 * Compatible with the existing flat-map renderer and basic globe projections.
 * Copyright 2026. Original OMD EVU project integration code.
 */
(function (global) {
  'use strict';
  const TYPES = ['high','low','cold_front','warm_front','stationary_front','occluded_front','trough','dryline'];
  const COLORS = { high:'#135fd2', low:'#dd2633', cold_front:'#1268e3', warm_front:'#e02635',
    stationary_front:'#1268e3',occluded_front:'#a044b7',trough:'#000000',dryline:'#a25b2c' };
  const DEFAULTS={centers:true,pressure:true,fronts:true,troughs:true,drylines:true,minimumConfidence:.3};
  const saturate=(n,a,b)=>Math.min(b,Math.max(a,n));
  function coord(feature) { return feature && feature.geometry && feature.geometry.coordinates; }
  function isLine(f) { return f && f.geometry && f.geometry.type==='LineString'; }
  function isPoint(f) { return f && f.geometry && f.geometry.type==='Point'; }
  function validFeatures(collection) {
    if(!collection || collection.type!=='FeatureCollection'||!Array.isArray(collection.features)) return [];
    return collection.features.filter(f=>f && f.properties && TYPES.includes(f.properties.type) && (isPoint(f)||isLine(f)));
  }
  function drawHaloText(ctx, s,x,y,color,font,haloWidth=3) {
    ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.lineWidth=haloWidth*2;ctx.lineJoin='round';ctx.strokeStyle='rgba(255,255,255,.95)';
    ctx.strokeText(s,x,y);ctx.fillStyle=color;ctx.fillText(s,x,y);
  }
  function project(map, location, centerLng) {
    if(!location || location.length<2 || !Number.isFinite(location[0]) || !Number.isFinite(location[1])) return null;
    let lon=location[0];
    if(Number.isFinite(centerLng)) lon=centerLng+((lon-centerLng+540)%360)-180;
    try { const pt=map.project({lng:lon,lat:location[1]});return pt&&Number.isFinite(pt.x)&&Number.isFinite(pt.y)?pt:null; }
    catch(e){return null;}
  }
  function projectedPath(map, pts,centerLng){return (Array.isArray(pts)?pts:[]).map(p=>project(map,p,centerLng)).filter(Boolean);}
  function polyline(ctx,pts){
    if(pts.length<2)return;
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++){ if(Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y)<1200)ctx.lineTo(pts[i].x,pts[i].y);else ctx.moveTo(pts[i].x,pts[i].y); }
    ctx.stroke();
  }
  function stationaryBaseline(ctx,pts,scale){
    // WPC convention: alternating blue/red segments, rather than a neutral
    // purple line. Symbol colors and opposite-side placement match these.
    const step=28*scale;
    let carry=0,index=0;
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1],b=pts[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
      if(len<.2||len>1200){carry=0;continue;}
      for(let d=0;d<len;){
        const seg=Math.min(len-d,step-carry),t0=d/len,t1=(d+seg)/len;
        ctx.strokeStyle=(index%2===0)?COLORS.cold_front:COLORS.warm_front;
        ctx.beginPath();ctx.moveTo(a.x+dx*t0,a.y+dy*t0);ctx.lineTo(a.x+dx*t1,a.y+dy*t1);ctx.stroke();
        d+=seg;carry+=seg;
        if(carry>=step-.001){carry=0;index++;}
      }
    }
  }
  function triangle(ctx,x,y,tanX,tanY,side,size,color){
    // Warm-side direction supplied in physical Cartesian x-east/y-north;
    // screen y grows downward, hence negate side.
    const nx=-tanY*side,ny=tanX*side;
    const tx=tanX,ty=tanY;
    const cx=x+nx*size*.72,cy=y+ny*size*.72;
    ctx.fillStyle=color;ctx.beginPath();
    ctx.moveTo(cx+nx*size*.75,cy+ny*size*.75);
    ctx.lineTo(cx-nx*size*.48+tx*size*.65,cy-ny*size*.48+ty*size*.65);
    ctx.lineTo(cx-nx*size*.48-tx*size*.65,cy-ny*size*.48-ty*size*.65);
    ctx.closePath();ctx.fill();
  }
  function semicircle(ctx,x,y,tanX,tanY,side,size,color,open){
    const nx=-tanY*side,ny=tanX*side;
    const steps=10;
    ctx.beginPath();
    for(let j=0;j<=steps;j++){
      const t=Math.PI*j/steps;
      const xx=x+tanX*size*Math.cos(t)+nx*size*Math.sin(t);
      const yy=y+tanY*size*Math.cos(t)+ny*size*Math.sin(t);
      if(j===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
    }
    if(open){ctx.strokeStyle=color;ctx.lineWidth=2.4;ctx.stroke();}
    else{ctx.lineTo(x-tanX*size,y-tanY*size);ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  }
  function symbolsAlong(ctx,pts,type,prop,scale=1){
    if(pts.length<2)return;
    const spacing=type==='dryline'?36:56;
    let d=spacing*.55,section=0;
    const warmSide=-(prop.symbol_side||1); // flip geographic left/right to browser y-down
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1],b=pts[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
      if(len<.2||len>1200)continue;
      let t=d;
      while(t<len){
        const x=a.x+dx*t/len,y=a.y+dy*t/len;
        const ux=dx/len,uy=dy/len;
        if(type==='cold_front')triangle(ctx,x,y,ux,uy,warmSide,6.6*scale,COLORS.cold_front);
        else if(type==='warm_front')semicircle(ctx,x,y,ux,uy,warmSide,6.5*scale,COLORS.warm_front,false);
        else if(type==='occluded_front'){
          if(section++%2===0)triangle(ctx,x,y,ux,uy,warmSide,6.4*scale,COLORS.occluded_front);
          else semicircle(ctx,x,y,ux,uy,warmSide,6.3*scale,COLORS.occluded_front,false);
        } else if(type==='stationary_front'){
          if(section++%2===0)triangle(ctx,x,y,ux,uy,warmSide,6.3*scale,COLORS.cold_front);
          else semicircle(ctx,x,y,ux,uy,-warmSide,6.3*scale,COLORS.warm_front,false);
        } else if(type==='dryline')semicircle(ctx,x,y,ux,uy,warmSide,5.6*scale,COLORS.dryline,true);
        t+=spacing;
      }
      d=t-len;
    }
  }
  function drawFeature(ctx,map,feature,settings,centerLng,scale=1){
    const prop=feature.properties,type=prop.type;
    if(typeof prop.confidence==='number' && prop.confidence<settings.minimumConfidence)return;
    if((type==='high'||type==='low')&&!settings.centers)return;
    if((type==='trough')&&!settings.troughs)return;
    if((type==='dryline')&&!settings.drylines)return;
    if(type.includes('front')&&!settings.fronts)return;
    const g=coord(feature);if(!g)return;
    if(isPoint(feature)){
      const p=project(map,g,centerLng);if(!p)return;
      if(p.x<-80||p.y<-80||p.x>ctx.canvas.clientWidth+80||p.y>ctx.canvas.clientHeight+80)return;
      const color=COLORS[type];drawHaloText(ctx,type==='high'?'H':'L',p.x,p.y,color,`bold ${Math.round(27*scale)}px Arial, sans-serif`,3.6);
      const pressure=Number(prop.pressure_hpa);
      if(settings.pressure&&Number.isFinite(pressure))drawHaloText(ctx,String(Math.round(pressure)),p.x,p.y+23*scale,color,`bold ${Math.round(13*scale)}px Arial, sans-serif`,2.2);
      return;
    }
    const pts=projectedPath(map,g,centerLng);if(pts.length<2)return;
    ctx.lineWidth=(type==='trough'?2.2:2.6)*scale;
    ctx.strokeStyle=COLORS[type]||'#ccc';ctx.lineCap='round';ctx.lineJoin='round';
    ctx.setLineDash(type==='trough'?[8*scale,7*scale]:[]);
    if(type==='stationary_front')stationaryBaseline(ctx,pts,scale);
    else polyline(ctx,pts);
    ctx.setLineDash([]);
    symbolsAlong(ctx,pts,type,prop,scale);
  }

  class SurfaceWeatherOverlay {
    constructor(map,options={}) {
      if(!map||typeof map.project!=='function'||typeof map.getContainer!=='function')throw new TypeError('Expected a MapLibre compatible map');
      this.map=map;this.options=options;
      this.settings=Object.assign({},DEFAULTS,options.settings||{});
      this._features=[];this._cache=new Map();this._negative=new Map();this._failures=new Map();this._frame=null;this._url=null;this._pending=null;
      this._controller=null;this._raf=null;this._disposed=false;
      this._loadState='idle';this.status={state:'idle',count:0,selectedCount:0,detail:''};
      const node=options.container||map.getContainer();
      const computed=global.getComputedStyle(node).position;
      if(computed==='static')node.style.position='relative';
      this.canvas=global.document.createElement('canvas');
      this.canvas.className='evu-surface-weather-canvas';
      Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'6'});
      node.appendChild(this.canvas);this.ctx=this.canvas.getContext('2d');
      this._schedule=this._schedule.bind(this);
      ['move','zoom','rotate','pitch','resize'].forEach(event=>map.on(event,this._schedule));
      this._schedule();
    }
    _schedule(){
      if(this._disposed||this._raf!==null)return;
      this._raf=global.requestAnimationFrame(()=>{this._raf=null;this.render();});
    }
    _resize(){
      const rect=this.map.getContainer().getBoundingClientRect();
      const width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));
      const dpr=Math.min(1.5,Math.max(1,global.devicePixelRatio||1));
      if(this.canvas.width!==Math.round(width*dpr)||this.canvas.height!==Math.round(height*dpr)){
        this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);
      }
      this.ctx.setTransform(dpr,0,0,dpr,0,0);
      return {width,height};
    }
    _emitStatus(state,count=0,selectedCount=0,detail=''){
      if(this._disposed)return;
      const next={state,count,selectedCount,detail};
      if(this.status&&Object.keys(next).every(key=>this.status[key]===next[key]))return;
      this.status=next;
      if(typeof this.options.onStatusChange==='function')this.options.onStatusChange({...next});
    }
    _enabledFeature(f){
      const prop=f.properties||{},type=prop.type;
      if(typeof prop.confidence==='number'&&prop.confidence<this.settings.minimumConfidence)return false;
      if(type==='high'||type==='low')return !!this.settings.centers;
      if(type==='trough')return !!this.settings.troughs;
      if(type==='dryline')return !!this.settings.drylines;
      return type.includes('front')&&!!this.settings.fronts;
    }
    _describeLoaded(){
      if(this._loadState!=='loaded')return;
      const count=this._features.length;
      const selected=this._features.filter(f=>this._enabledFeature(f)).length;
      const missing=this._data?.metadata?.missing_inputs;
      const detail=Array.isArray(missing)&&missing.length?'Some analysis inputs unavailable: '+missing.join(', '):'';
      this._emitStatus(!count?'empty':!selected?'filtered':'ready',count,selected,detail);
    }
    setSettings(changes){Object.assign(this.settings,changes);this._describeLoaded();this._schedule();}
    clear(){
      if(this._controller)this._controller.abort();
      this._controller=null;this._url=null;this._pending=null;this._features=[];this._data=null;
      this._loadState='idle';this._emitStatus('idle');this._schedule();
    }
    setData(geojson){
      if(this._disposed)return;
      this._data=geojson;
      this._features=validFeatures(geojson);
      this._describeLoaded();this._schedule();
    }
    loadUrl(url){
      if(this._disposed)return Promise.resolve(false);
      if(url===this._url&&this._pending)return this._pending;
      if(url===this._url&&this._cache.has(url))return Promise.resolve(true);
      if(url===this._url&&(this._negative.get(url)||0)>Date.now())return Promise.resolve(false);
      this._url=url;
      if(this._controller)this._controller.abort();
      const controller=new AbortController();this._controller=controller;
      if(this._cache.has(url)){
        this._loadState='loaded';this.setData(this._cache.get(url));return Promise.resolve(true);
      }
      this._loadState='loading';this._features=[];this._data=null;
      this._emitStatus('loading');this._schedule();
      if((this._negative.get(url)||0)>Date.now()){
        const old=this._failures.get(url)||{state:'error',detail:'Temporary request failure'};
        this._emitStatus(old.state,0,0,old.detail);return Promise.resolve(false);
      }
      const job=(async()=>{
        try{
          const response=await global.fetch(url,{signal:controller.signal,cache:'default'});
          if(!response.ok){const err=new Error(`HTTP ${response.status}`);err.httpStatus=response.status;throw err;}
          let data;
          try{data=await response.json();}
          catch(_parseError){throw new Error('Invalid GeoJSON response (possibly an HTML error page)');}
          if(!data||data.type!=='FeatureCollection'||!Array.isArray(data.features))throw new Error('Invalid GeoJSON FeatureCollection');
          if(this._disposed||controller!==this._controller)return false;
          this._cache.set(url,data);
          if(this._cache.size>12)this._cache.delete(this._cache.keys().next().value);
          this._negative.delete(url);this._failures.delete(url);
          this._loadState='loaded';this.setData(data);return true;
        }catch(err){
          if(controller.signal.aborted||this._disposed||controller!==this._controller)return false;
          this._negative.set(url,Date.now()+30000);
          if(this._negative.size>48)this._negative.delete(this._negative.keys().next().value);
          this._loadState='error';this._features=[];this._data=null;this._schedule();
          const missing=err.httpStatus===404||err.httpStatus===410;
          const failure={state:missing?'missing':'error',detail:missing?'Overlay not published for this model and valid hour':String(err.message||err)};
          this._failures.set(url,failure);
          if(this._failures.size>48)this._failures.delete(this._failures.keys().next().value);
          this._emitStatus(failure.state,0,0,failure.detail);
          if(typeof this.options.onError==='function'&&!missing)this.options.onError(err);
          return false;
        }finally{
          if(this._pending===job)this._pending=null;
        }
      })();
      this._pending=job;return job;
    }
    async setFrame(model,date,cycle,hour){
      const safe=s=>String(s).replace(/[^a-zA-Z0-9_]/g,'');
      const root=String(this.options.baseUrl||'surface_weather').replace(/\/$/,'');
      const file=`${safe(model)}_${safe(date)}_${safe(cycle)}00_f${String(Math.max(0,Number(hour)||0)).padStart(3,'0')}.geojson`;
      this._frame={model,date,cycle,hour};
      return this.loadUrl(`${root}/${file}`);
    }
    // Analysis stores may be indexed by valid time instead of cycle/hour.
    async setAnalysisFrame(product,stamp){
      const root=String(this.options.baseUrl||'surface_weather').replace(/\/$/,'');
      const name=String(product).replace(/[^a-zA-Z0-9_]/g,'');
      const time=String(stamp).replace(/[^0-9]/g,'');
      return this.loadUrl(`${root}/analysis_${name}_${time}.geojson`);
    }
    render(){
      if(this._disposed||!this.ctx)return;
      const size=this._resize(),ctx=this.ctx;
      ctx.clearRect(0,0,size.width,size.height);
      if(!this._features.length)return;
      let centerLng=null;
      try{centerLng=this.map.getCenter().lng;}catch(e){}
      const scale=this.options.largeLabels?1.3:1;
      for(const f of this._features.filter(isLine))drawFeature(ctx,this.map,f,this.settings,centerLng,scale);
      // Keep H/L labels legible on nine-panel and phone-sized layouts. This
      // screen-space pass is *in addition* to the converter's synoptic center
      // detection; it never rewrites the GeoJSON or research track archive.
      const points=this._features.filter(f=>isPoint(f)&&this._enabledFeature(f))
        .slice().sort((a,b)=>(b.properties.confidence||0)-(a.properties.confidence||0));
      let zoom=4;
      try{zoom=this.map.getZoom();}catch(_error){}
      // Pressure numbers beneath the symbols also need breathing room.
      // Allow more labels only as the user zooms into an individual system.
      const separation=(zoom<4?102:zoom<5.5?84:zoom<7?68:54)*scale;
      const occupied=[];
      for(const f of points){
        const p=project(this.map,coord(f),centerLng);if(!p)continue;
        if(p.x<-35||p.y<-35||p.x>size.width+35||p.y>size.height+50)continue;
        if(occupied.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<separation))continue;
        occupied.push(p);drawFeature(ctx,this.map,f,this.settings,centerLng,scale);
      }
    }
    makeControls(host){
      const wrap=global.document.createElement('div');wrap.className='evu-surface-weather-controls';
      wrap.style.cssText='display:flex;flex-wrap:wrap;gap:7px 11px;align-items:center;font-size:12px;line-height:1.3;';
      const items=[['centers','H / L'],['pressure','Central pressure'],['fronts','Fronts'],['troughs','Troughs'],['drylines','Drylines']];
      for(const [key,label] of items){
        const holder=global.document.createElement('label');holder.style.cssText='display:inline-flex;align-items:center;gap:4px;cursor:pointer;';
        const box=global.document.createElement('input');box.type='checkbox';box.checked=!!this.settings[key];
        box.addEventListener('change',()=>this.setSettings({[key]:box.checked}));
        holder.appendChild(box);holder.appendChild(global.document.createTextNode(label));wrap.appendChild(holder);
      }
      if(host)host.appendChild(wrap);
      return wrap;
    }
    dispose(){
      if(this._disposed)return;
      this._disposed=true;
      if(this._controller)this._controller.abort();
      if(this._raf!==null)global.cancelAnimationFrame(this._raf);
      ['move','zoom','rotate','pitch','resize'].forEach(e=>this.map.off(e,this._schedule));
      this.canvas.remove();this._cache.clear();this._negative.clear();this._failures.clear();
    }
  }
  global.EVUSurfaceWeatherOverlay=SurfaceWeatherOverlay;
  if(typeof module!=='undefined'&&module.exports)module.exports={SurfaceWeatherOverlay,drawFeature,validFeatures};
})(typeof window!=='undefined'?window:globalThis);
