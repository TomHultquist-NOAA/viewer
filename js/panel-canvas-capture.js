/*
 * OMD EVU mobile panel video compositor, v1.2.58.
 *
 * Chrome Android does not provide getDisplayMedia()/Element Capture. Instead,
 * composite the panel's actual rendered MapLibre and overlay canvases, plus
 * its annotation and field legend, into a bounded-resolution local canvas.
 * That canvas is recorded by MediaRecorder with captureStream(). No tab,
 * screen, camera, microphone, menu, or Stop control is captured.
 *
 * This is a separate, mobile-only alternative. The established desktop tab
 * + Element Capture recorder is deliberately unchanged. In-map HTML popups
 * are represented by readable text but not pixel-perfect DOM snapshots.
 */
(function(){
 'use strict';
 const FPS=15, MAX_PIXELS=960000, MAX_WIDTH=1280, MAX_HEIGHT=960;
 const BACKDROP=[12,29,45];
 const LAYER_ORDER=[
  ['mobileScalarCanvas',1],['mobileGeoCanvas',2],['tracerCanvas',2.5],
  ['contourCanvas',3],['windCanvas',4],['cityCanvas',5]
 ];
 function isAndroid(){
  return /Android/i.test(navigator.userAgent||'') || navigator.userAgentData?.platform==='Android';
 }
 function supported(){
  return !!(window.isSecureContext&&isAndroid()&&typeof window.MediaRecorder==='function'&&
   typeof HTMLCanvasElement.prototype.captureStream==='function'&&
   typeof window.requestAnimationFrame==='function');
 }
 function visible(node){
  if(!node?.isConnected)return false;
  const style=getComputedStyle(node);
  return style.display!=='none'&&style.visibility!=='hidden'&&parseFloat(style.opacity||'1')>0;
 }
 function getTargetSize(panel){
  const rect=panel.view.getBoundingClientRect();
  const width=Math.max(2,rect.width),height=Math.max(2,rect.height),footer=58;
  const dpr=Math.max(1,Math.min(2.5,Number(window.devicePixelRatio)||1));
  const scale=Math.max(.1,Math.min(dpr,MAX_WIDTH/width,MAX_HEIGHT/(height+footer),
   Math.sqrt(MAX_PIXELS/(width*(height+footer)))));
  return {width,height,footer,scale,outputWidth:Math.max(2,Math.round(width*scale)),
   outputHeight:Math.max(2,Math.round((height+footer)*scale))};
 }
 function paintLayer(ctx,node,viewRect){
  if(!visible(node)||!node.width||!node.height)return false;
  const rect=node.getBoundingClientRect();
  if(rect.width<=0||rect.height<=0)return false;
  const opacity=Number.parseFloat(getComputedStyle(node).opacity||'1');
  ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,Number.isFinite(opacity)?opacity:1));
  try{ctx.drawImage(node,rect.left-viewRect.left,rect.top-viewRect.top,rect.width,rect.height);}
  finally{ctx.restore();}
  return true;
 }
 function textOneLine(ctx,text,maxWidth){
  let value=String(text||'');
  while(value.length>3&&ctx.measureText(value).width>maxWidth)value=value.slice(0,-2)+'…';
  return value;
 }
 function drawPlotLabel(ctx,panel,viewRect){
  const title=panel.title?.textContent||panel.cfg?.label||'',sub=panel.sub?.textContent||'';
  if(!visible(panel.view.querySelector('.plot-label'))||(!title&&!sub))return;
  ctx.save();ctx.font='600 12px system-ui,sans-serif';
  const textWidth=Math.min(viewRect.width-90,Math.max(ctx.measureText(title).width,ctx.measureText(sub).width)+16);
  if(textWidth<=20){ctx.restore();return;}
  const x=9,y=9,w=Math.max(50,textWidth),h=sub?38:24;
  ctx.fillStyle='rgba(7,17,29,0.83)';ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='rgba(200,219,237,0.25)';ctx.strokeRect(x+.5,y+.5,w-1,h-1);
  ctx.fillStyle='#f4f8fc';ctx.fillText(textOneLine(ctx,title,w-12),x+7,y+15);
  if(sub){ctx.font='10px system-ui,sans-serif';ctx.fillStyle='#d5e3f2';
   ctx.fillText(textOneLine(ctx,sub,w-12),x+7,y+29);}
  ctx.restore();
 }
 function drawMapPopups(ctx,panel,viewRect){
  const popup=panel.map?.getContainer?.()?.querySelector('.maplibregl-popup-content');
  if(!popup||!visible(popup))return;
  const rect=popup.getBoundingClientRect();
  const x=Math.max(3,Math.min(viewRect.width-130,rect.left-viewRect.left));
  const y=Math.max(3,Math.min(viewRect.height-48,rect.top-viewRect.top));
  const w=Math.min(250,Math.max(100,viewRect.width-x-6));
  const lines=String(popup.textContent||'').replace(/\s+/g,' ').trim().match(/.{1,42}(?:\s|$)/g)?.slice(0,3)||[];
  if(!lines.length)return;
  ctx.save();ctx.fillStyle='rgba(12,24,38,.93)';ctx.fillRect(x,y,w,lines.length*15+12);
  ctx.strokeStyle='#8da9c7';ctx.strokeRect(x+.5,y+.5,w-1,lines.length*15+11);
  ctx.fillStyle='#f5f8fc';ctx.font='11px system-ui,sans-serif';
  lines.forEach((line,i)=>ctx.fillText(textOneLine(ctx,line,w-12),x+6,y+16+15*i));ctx.restore();
 }
 function activeLegend(){
  for(const id of ['rotationSharedLegend','differenceSharedLegend','sharedLegend']){
   const el=document.getElementById(id);
   if(el&&!el.hidden&&visible(el))return el;
  }
  return null;
 }
 function drawLegend(ctx,w,y,footer){
  const legend=activeLegend();
  ctx.save();ctx.fillStyle='#13243a';ctx.fillRect(0,y,w,footer);
  ctx.strokeStyle='#54718e';ctx.fillRect(0,y,w,1);
  if(!legend){ctx.restore();return;}
  const title=legend.querySelector('.shared-legend-title')?.textContent?.trim()||'Field color scale';
  ctx.font='600 11px system-ui,sans-serif';ctx.fillStyle='#f2f6fc';
  ctx.fillText(textOneLine(ctx,title,w-16),8,y+14);
  const source=legend.querySelector('canvas.shared-legend-canvas');
  if(source?.width&&source?.height){
   try{ctx.drawImage(source,9,y+19,w-18,13);}catch(error){console.warn('Mobile video legend:',error);}
   const src=source.getBoundingClientRect();
   const ticks=Array.from(legend.querySelectorAll('.shared-legend-tick')).filter(visible);
   ctx.fillStyle='#c6d7e9';ctx.font='10px system-ui,sans-serif';
   for(const tick of ticks){
    const r=tick.getBoundingClientRect();
    const rel=src.width>0?(r.left+r.width*.5-src.left)/src.width:0;
    const x=Math.max(9,Math.min(w-9,9+(w-18)*rel));
    const label=textOneLine(ctx,tick.textContent,Math.max(40,w/(ticks.length+1)));
    ctx.textAlign=rel<=.02?'left':rel>=.98?'right':'center';
    ctx.fillText(label,x,y+45);
   }
  }
  ctx.restore();
 }
 // Unlike the tab recorder, a captureStream canvas is not the browser's
 // retained composited frame. The viewer explicitly hides the 3-D forecast
 // overlay while a camera gesture runs, and some WebGL canvases can briefly
 // yield an empty readback between rendering passes. Keep the last complete
 // *video* frame in either case rather than clearing it to black.
 function weatherSurfacePending(panel){
  const layer=panel?.mobileScalarCanvas;
  if(!panel?.mobileScalar||!layer)return false;
  // The ordinary map renderer has no terrain-surface overlay to synchronize.
  // Never pause its panning frames just because the map is moving.
  const moving=!!(panel._evuForecastMoving||panel.geoMoving||
   panel.map?.isMoving?.()||panel.map?.isZooming?.()||panel.map?.isRotating?.());
  return moving||!visible(layer);
 }
 function isEmptyMapImage(ctx,size){
  // Check the map rectangle BEFORE drawing label/legend: they could make an
  // otherwise empty frame appear nonempty. Sampling twelve tiny pixels avoids
  // copying the entire ~1-megapixel image back from the 2-D compositor.
  let allBackdrop=true,allBlack=true;
  for(let j=1;j<=3;j++)for(let i=1;i<=4;i++){
   const x=Math.max(0,Math.min(size.outputWidth-1,Math.floor(size.outputWidth*i/5)));
   const y=Math.max(0,Math.min(Math.round(size.height*size.scale)-1,
    Math.floor(size.height*size.scale*j/4)));
   const v=ctx.getImageData(x,y,1,1).data;
   if(Math.abs(v[0]-BACKDROP[0])>3||Math.abs(v[1]-BACKDROP[1])>3||
    Math.abs(v[2]-BACKDROP[2])>3)allBackdrop=false;
   if(v[0]>4||v[1]>4||v[2]>4)allBlack=false;
   if(!allBackdrop&&!allBlack)return false;
  }
  return allBackdrop||allBlack;
 }
 function create(panel){
  if(!supported())throw Error('Mobile panel recording needs Chrome Android with canvas.captureStream() and MediaRecorder.');
  if(!panel?.map?.getCanvas?.()||!panel?.view?.isConnected)throw Error('The expanded map is not ready to record.');
  const size=getTargetSize(panel);
  const canvas=document.createElement('canvas');
  canvas.width=size.outputWidth;canvas.height=size.outputHeight;
  const ctx=canvas.getContext('2d',{alpha:false});
  // Draw to staging first, publish ONLY complete frames to captureStream().
  // If the map goes temporarily blank, the output canvas never changes.
  const staging=document.createElement('canvas');
  staging.width=canvas.width;staging.height=canvas.height;
  const stagingCtx=staging.getContext('2d',{alpha:false,willReadFrequently:true});
  if(!ctx||!stagingCtx)throw Error('Could not initialize the mobile video canvas.');
  const session={panel,canvas,ctx,staging,stagingCtx,size,frames:0,failures:0,
   heldFrames:0,heldForRedraw:0,heldForBlank:0};
  draw(session);
  return session;
 }
 function draw(session){
  const {panel,ctx,staging,stagingCtx,size}=session;
  if(!panel?.view?.isConnected||!panel.map)return false;
  // During a terrain camera gesture the viewer hides the forecast overlay
  // until the new geographic mesh is ready. Continue streaming the last
  // complete frame; do not turn the video black or record misaligned weather.
  if(session.frames&&weatherSurfacePending(panel)){
   session.heldFrames++;session.heldForRedraw++;return false;
  }
  const viewRect=panel.view.getBoundingClientRect();
  const c=stagingCtx;
  c.save();c.setTransform(size.scale,0,0,size.scale,0,0);
  c.fillStyle='#0c1d2d';c.fillRect(0,0,size.width,size.height+size.footer);
  c.save();c.beginPath();c.rect(0,0,size.width,size.height);c.clip();
  // MapLibre base and weather are already composited in its live WebGL canvas.
  let drewMap=false,overlayCount=0;
  try{drewMap=paintLayer(c,panel.map.getCanvas(),viewRect);}
  catch(error){session.failures++;if(session.failures===1)console.warn('Mobile video map canvas capture unavailable:',error);}
  const layers=LAYER_ORDER.map(([id,z],i)=>({node:panel[id],z,i})).sort((a,b)=>a.z-b.z||a.i-b.i);
  for(const layer of layers){
   try{if(paintLayer(c,layer.node,viewRect))overlayCount++;}
   catch(error){session.failures++;if(session.failures===1)console.warn('Mobile video overlay capture unavailable:',error);}
  }
  c.restore();
  // drawImage() can succeed but copy a cleared/black WebGL backing buffer.
  // Detect such intermediate frames BEFORE labels create false visual content.
  // Retain the prior frame; don't make a background-only WebM frame.
  const empty=!drewMap&&!overlayCount||isEmptyMapImage(c,size);
  if(empty&&session.frames){
   c.restore();session.heldFrames++;session.heldForBlank++;return false;
  }
  c.save();c.beginPath();c.rect(0,0,size.width,size.height);c.clip();
  drawPlotLabel(c,panel,viewRect);
  drawMapPopups(c,panel,viewRect);
  c.restore();drawLegend(c,size.width,size.height,size.footer);
  c.restore();
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  ctx.drawImage(staging,0,0);
  ctx.restore();session.frames++;
  return true;
 }
 function status(session){
  if(!session)return null;
  return {frames:session.frames,heldFrames:session.heldFrames,
   heldForRedraw:session.heldForRedraw,heldForBlank:session.heldForBlank,
   failures:session.failures};
 }
 window.EVUPanelCanvasCapture={supported,isAndroid,create,draw,FPS,
  getStatus:status,_test:{getTargetSize,paintLayer,activeLegend,isEmptyMapImage,weatherSurfacePending}};
})();
