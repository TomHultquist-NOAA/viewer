/*
 * OMD EVU focused-panel recorder v1.2.58.
 *
 * Record the panel as the user sees it (MapLibre/Three.js WebGL, overlays,
 * HTML labels, and its colorbar), without rebuilding thousands of PNG frames.
 * Uses explicitly consented same-tab Screen Capture + Element Capture.
 * Restricting to the panel DOM subtree EXCLUDES external controls, recorder
 * stop bar, and detached overlay menus that overlap the panel visually.
 * Transient terrain selector numbers are portaled out of the panel subtree
 * during capture, preserving visible selection feedback without recording it.
 * Fail closed if Element Capture is unavailable; never record a whole tab.
 * Android uses a separate local canvas compositor when tab sharing is not
 * available. No microphone/system audio or server upload. Video is saved locally.
 */
(function(){
 'use strict';
 const CAPTURE_OPTIONS={
  video:{displaySurface:'browser',frameRate:30},audio:false,
  preferCurrentTab:true,selfBrowserSurface:'include',surfaceSwitching:'exclude'
 };
 const COUNTDOWN_SECONDS=3;
 const VIDEO_BPS=4800000;
 const state={phase:'idle',panel:null,stream:null,recorder:null,chunks:[],mimeType:'',
  timer:null,startedAt:0,token:0,bar:null,countdown:null,terrainPortal:null,downloaded:false,
  canvasSession:null,canvasRaf:0,canvasLast:0,mode:null};

 function captureMode(){
  if(window.EVUPanelCanvasCapture?.supported?.())return 'canvas';
  if(window.isSecureContext&&navigator.mediaDevices&&
   typeof navigator.mediaDevices.getDisplayMedia==='function'&&
   typeof window.RestrictionTarget?.fromElement==='function'&&
   typeof window.MediaRecorder==='function')return 'tab';
  return 'unsupported';
 }
 function supported(){return captureMode()!=='unsupported';}
 function getStatus(){
  return {phase:state.phase,mode:state.mode,
   capture:state.canvasSession?window.EVUPanelCanvasCapture?.getStatus?.(state.canvasSession)||null:null};
 }
 function selectMime(){
  const options=captureMode()==='canvas'
   ?['video/webm;codecs=vp8','video/webm','video/mp4;codecs=avc1.42E01E','video/mp4']
   :['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm',
      'video/mp4;codecs=avc1.42E01E','video/mp4'];
  return options.find(t=>typeof window.MediaRecorder?.isTypeSupported==='function'&&window.MediaRecorder.isTypeSupported(t))||'';
 }
 function stopTracks(stream){
  try{for(const track of stream?.getTracks?.()||[])track.stop();}
  catch(error){console.warn('Video capture track cleanup:',error);}
 }
 function clockText(milliseconds){
  const sec=Math.floor(Math.max(0,milliseconds)/1000);
  const h=Math.floor(sec/3600),m=Math.floor(sec/60)%60,s=sec%60;
  return (h?`${h}:`:'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
 }
 function labelText(panel){return String(panel?.cfg?.label||panel?.cfg?.id||'Panel');}
 function ensureBar(){
  if(state.bar?.isConnected)return state.bar;
  const bar=document.createElement('div');bar.className='evu-video-recorder-bar';
  bar.setAttribute('role','status');bar.setAttribute('aria-live','polite');
  const dot=document.createElement('span');dot.className='evu-video-recorder-dot';dot.setAttribute('aria-hidden','true');
  const text=document.createElement('span');text.className='evu-video-recorder-text';text.textContent='Preparing panel recording…';
  const stop=document.createElement('button');stop.type='button';stop.className='evu-video-recorder-stop';
  stop.textContent='Cancel';stop.setAttribute('aria-label','Cancel or stop the panel video recording');
  stop.addEventListener('click',()=>stopRecording());
  bar.append(dot,text,stop);document.body.append(bar);state.bar=bar;
  return bar;
 }
 function showStatus(message,button='Stop & save'){
  const bar=ensureBar();bar.querySelector('.evu-video-recorder-text').textContent=message;
  bar.querySelector('.evu-video-recorder-stop').textContent=button;
  bar.dataset.phase=state.phase;
 }
 // The terrain-panel picker paints huge numbers directly INSIDE the focused
 // panel. Element Capture correctly includes descendants, so temporarily
 // render that one visual-only marker outside the restricted subtree instead.
 // Keep the same marker and update its viewport position: the picker remains
 // usable and its selection state continues to be controlled by the viewer.
 function syncTerrainPortal(){
  const portal=state.terrainPortal;if(!portal)return;
  const {node,panel}=portal;
  if(!panel?.view?.isConnected)return;
  const rect=panel.view.getBoundingClientRect();
  node.style.left=`${rect.left}px`;node.style.top=`${rect.top}px`;
  node.style.width=`${rect.width}px`;node.style.height=`${rect.height}px`;
  // 9cqw in the normal CSS refers to panel-card's inline-size container.
  node.style.fontSize=`${Math.max(52,Math.min(110,(panel.card?.getBoundingClientRect().width||rect.width)*.09))}px`;
 }
 function portalTerrainNumber(panel){
  if(state.terrainPortal)return;
  const node=panel?.terrainNumber||panel?.view?.querySelector('.terrain-panel-number');
  if(!node||!panel?.view?.contains(node))return;
  const originalParent=node.parentNode,nextSibling=node.nextSibling;
  const originalStyle=node.getAttribute('style');
  state.terrainPortal={node,panel,originalParent,nextSibling,originalStyle,listener:null,observer:null};
  node.classList.add('evu-terrain-number-outside-capture');
  document.body.append(node);
  syncTerrainPortal();
  const listener=()=>syncTerrainPortal();
  state.terrainPortal.listener=listener;
  window.addEventListener('resize',listener);
  window.addEventListener('scroll',listener,true);
  window.visualViewport?.addEventListener('resize',listener);
  if(typeof ResizeObserver==='function'){
   state.terrainPortal.observer=new ResizeObserver(listener);
   state.terrainPortal.observer.observe(panel.view);
  }
 }
 function restoreTerrainNumber(){
  const portal=state.terrainPortal;if(!portal)return;
  state.terrainPortal=null;
  const {node,originalParent,nextSibling,originalStyle,listener,observer}=portal;
  observer?.disconnect();
  if(listener){
   window.removeEventListener('resize',listener);
   window.removeEventListener('scroll',listener,true);
   window.visualViewport?.removeEventListener('resize',listener);
  }
  node.classList.remove('evu-terrain-number-outside-capture');
  if(originalParent?.isConnected){
   if(nextSibling?.parentNode===originalParent)originalParent.insertBefore(node,nextSibling);
   else originalParent.append(node);
  }else node.remove();
  if(originalStyle===null)node.removeAttribute('style');
  else node.setAttribute('style',originalStyle);
 }
 function cleanupUi(){
  if(state.timer!==null){clearInterval(state.timer);state.timer=null;}
  state.countdown?.remove();state.countdown=null;
  restoreTerrainNumber();
  state.panel?.card?.classList.remove('evu-panel-recording');
  state.bar?.remove();state.bar=null;
 }
 function release(){
  if(state.canvasRaf){cancelAnimationFrame(state.canvasRaf);state.canvasRaf=0;}
  stopTracks(state.stream);cleanupUi();
  state.stream=null;state.recorder=null;state.panel=null;state.chunks=[];
  state.canvasSession=null;state.canvasLast=0;state.mode=null;
  state.phase='idle';state.startedAt=0;state.mimeType='';
 }
 function abort(error){
  console.warn('OMD EVU panel recording:',error);
  state.token++;
  release();
 }
 function keepVideo(filename,blob){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;a.style.display='none';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 function fileName(panel,mime){
  const model=String(panel?.cfg?.id||'model').replace(/[^a-z0-9_-]/gi,'_');
  const iso=new Date().toISOString().replace(/[-:]/g,'').replace(/\..*/, 'Z');
  return `omd_evu_${model}_panel_recording_${iso}.${mime.includes('mp4')?'mp4':'webm'}`;
 }
 function showCountdown(panel){
  const box=document.createElement('div');box.className='evu-video-recorder-countdown';
  box.setAttribute('aria-live','assertive');
  box.innerHTML='<span class="evu-video-count-number" aria-hidden="true">3</span><small>Recording begins in</small>';
  panel.view.append(box);state.countdown=box;
  return box;
 }
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function stillCurrent(token,panel){
  return state.token===token&&state.panel===panel&&state.phase!=='idle'&&state.phase!=='finalizing';
 }
 async function startCanvas(panel){
  const compositor=window.EVUPanelCanvasCapture;
  if(!compositor?.supported?.())throw Error('Canvas recording is not supported by this Android browser.');
  if(!panel?.map?.getCanvas?.())throw Error('The expanded map is still loading. Try again when the map is ready.');
  const mime=selectMime();
  if(!mime)throw Error('This browser has no supported local video recording format.');
  const token=++state.token;
  state.phase='countdown';state.panel=panel;state.mode='canvas';state.mimeType=mime;state.chunks=[];
  panel.card.classList.add('evu-panel-recording');
  const overlay=showCountdown(panel);
  try{
   for(let n=COUNTDOWN_SECONDS;n>=1;n--){
    if(!stillCurrent(token,panel))return false;
    overlay.querySelector('.evu-video-count-number').textContent=String(n);
    showStatus(`${labelText(panel)} · mobile recording in ${n}…`,'Cancel');
    await delay(1000);
   }
   if(!stillCurrent(token,panel))return false;
   overlay.remove();state.countdown=null;
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(!stillCurrent(token,panel))return false;
   // Compose only the live panel map, overlay canvases and local labels; this
   // never captures the rest of the tab, controls, menus or phone UI.
   const canvasSession=compositor.create(panel);
   const stream=canvasSession.canvas.captureStream(compositor.FPS);
   if(!stream?.getVideoTracks?.().length){stopTracks(stream);throw Error('This Android browser could not generate a video stream from the panel canvas.');}
   if(!stillCurrent(token,panel)){stopTracks(stream);return false;}
   state.stream=stream;state.canvasSession=canvasSession;
   const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2600000});
   state.recorder=recorder;state.phase='recording';state.startedAt=Date.now();
   const initialPanel=panel;
   recorder.ondataavailable=e=>{if(e.data?.size>0)state.chunks.push(e.data);};
   recorder.onerror=e=>{
    console.error('Mobile panel video encoder failure:',e.error||e);
    if(state.phase==='recording')stopRecording();
   };
   recorder.onstop=()=>{
    if(state.recorder!==recorder)return;
    const chunks=state.chunks.slice(),type=recorder.mimeType||mime;
    try{
     if(chunks.length&&chunks.reduce((size,b)=>size+b.size,0)>0)
      keepVideo(fileName(initialPanel,type),new Blob(chunks,{type}));
     else console.warn('Mobile panel recording ended with no encoded frames.');
    }finally{state.token++;release();}
   };
   recorder.start(1000);
   state.canvasLast=0;
   const tick=(timestamp)=>{
    if(state.phase!=='recording'||state.canvasSession!==canvasSession)return;
    if(!state.canvasLast||timestamp-state.canvasLast>=1000/compositor.FPS){
     compositor.draw(canvasSession);state.canvasLast=timestamp;
    }
    state.canvasRaf=requestAnimationFrame(tick);
   };
   state.canvasRaf=requestAnimationFrame(tick);
   showStatus(`${labelText(panel)} · REC 00:00`);
   state.timer=setInterval(()=>{
    if(state.phase==='recording')showStatus(`${labelText(panel)} · REC ${clockText(Date.now()-state.startedAt)}`);
   },400);
   return true;
  }catch(error){
   if(stillCurrent(token,panel))abort(error);
   throw error;
  }
 }
 async function start(panel){
  if(captureMode()==='canvas'){
   if(state.phase!=='idle')throw Error('A panel recording is already active. Stop it first.');
   if(!panel?.card?.isConnected||!panel?.card?.classList.contains('is-focused'))
    throw Error('Expand the panel to full size before starting a recording.');
   return startCanvas(panel);
  }
  if(state.phase!=='idle')throw Error('A panel recording is already active. Stop it first.');
  if(!panel?.card?.isConnected||!panel?.card?.classList.contains('is-focused'))
   throw Error('Expand the panel to full size before starting a recording.');
  if(!supported())throw Error('Clean panel video recording requires HTTPS and a current Chrome/Edge browser supporting Element Capture (RestrictionTarget) and MediaRecorder.');
  const mime=selectMime();
  if(!mime)throw Error('This browser has no supported local video recording format.');

  const token=++state.token;
  state.phase='requesting';state.panel=panel;state.mode='tab';state.mimeType=mime;state.chunks=[];
  showStatus('Select THIS tab in the browser sharing dialog…','Cancel');
  // getDisplayMedia() is requested immediately inside the user click handler;
  // delaying it behind an await loses required transient user activation.
  let requested;
  try{requested=navigator.mediaDevices.getDisplayMedia(CAPTURE_OPTIONS);}
  catch(error){abort(error);throw error;}
  let stream=null;
  try{
   stream=await requested;
   if(!stillCurrent(token,panel)){stopTracks(stream);return false;}
   const track=stream.getVideoTracks()[0];
   // Element Capture records only the panel's DOM subtree. Region Capture
   // would record the overlapping Stop bar and body-level Data/Map menus;
   // deliberately never fall back to cropTo() or the unmodified tab track.
   if(!track||typeof track.restrictTo!=='function')
    throw Error('This sharing source cannot isolate the panel. Select the CURRENT BROWSER TAB in an up-to-date Chrome/Edge browser, not a window or screen.');
   const target=await window.RestrictionTarget.fromElement(panel.card);
   await track.restrictTo(target);
   if(!stillCurrent(token,panel)||!panel.card.classList.contains('is-focused')){
    stopTracks(stream);return false;
   }
   state.stream=stream;
   // Portal before the countdown begins, and leave it outside until the
   // recorder has finished flushing the last encoded frames.
   portalTerrainNumber(panel);
   state.phase='countdown';
   panel.card.classList.add('evu-panel-recording');
   const overlay=showCountdown(panel);
   for(let n=COUNTDOWN_SECONDS;n>=1;n--){
    if(!stillCurrent(token,panel))return false;
    overlay.querySelector('.evu-video-count-number').textContent=String(n);
    showStatus(`${labelText(panel)} · recording in ${n}…`,'Cancel');
    await delay(1000);
   }
   if(!stillCurrent(token,panel))return false;
   overlay.remove();state.countdown=null;
   // Allow paint after countdown disappears, then begin the actual capture.
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(!stillCurrent(token,panel))return false;
   const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:VIDEO_BPS});
   state.recorder=recorder;state.phase='recording';state.startedAt=Date.now();
   const initialPanel=panel;
   recorder.ondataavailable=e=>{if(e.data?.size>0)state.chunks.push(e.data);};
   recorder.onerror=e=>{
    console.error('Video encoder failure:',e.error||e);
    if(state.phase==='recording')stopRecording();
   };
   recorder.onstop=()=>{
    if(state.recorder!==recorder)return;
    const chunks=state.chunks.slice(),type=recorder.mimeType||mime;
    try{
     if(chunks.length&&chunks.reduce((size,b)=>size+b.size,0)>0){
      keepVideo(fileName(initialPanel,type),new Blob(chunks,{type}));
     }else console.warn('Panel video stopped without receiving encoded frames.');
    }finally{state.token++;release();}
   };
   // If the browser's own Stop sharing action is used, save as usual.
   track.addEventListener('ended',()=>{
    if(state.recorder===recorder&&state.phase==='recording')stopRecording();
   },{once:true});
   recorder.start(1000); // bounded chunks avoid a single large in-memory encoding buffer
   showStatus(`${labelText(panel)} · REC 00:00`);
   state.timer=setInterval(()=>{
    if(state.phase==='recording')showStatus(`${labelText(panel)} · REC ${clockText(Date.now()-state.startedAt)}`);
   },400);
   return true;
  }catch(error){
   stopTracks(stream);
   // A user-initiated refusal is not treated as a renderer failure.
   if(stillCurrent(token,panel))abort(error);
   if(error?.name==='NotAllowedError'||error?.name==='AbortError')return false;
   throw error;
  }
 }
 function stopRecording(){
  const phase=state.phase;
  if(phase==='idle'||phase==='finalizing')return;
  if(phase==='requesting'||phase==='countdown'){
   state.token++;release();return;
  }
  state.phase='finalizing';
  showStatus('Saving panel video…','Saving…');
  const stopBtn=state.bar?.querySelector('.evu-video-recorder-stop');
  if(stopBtn)stopBtn.disabled=true;
  if(state.timer!==null){clearInterval(state.timer);state.timer=null;}
  state.countdown?.remove();state.countdown=null;
  state.panel?.card?.classList.remove('evu-panel-recording');
  try{
   if(state.recorder?.state==='recording'||state.recorder?.state==='paused'){
    try{state.recorder.requestData();}catch(_){/* stop() will flush data */}
    state.recorder.stop();
   }else if(!state.recorder||state.recorder.state==='inactive'){
    // The browser may have ended capture and queued MediaRecorder.onstop.
    // Do not release state/chunks before that event flushes the file.
    if(!state.recorder)release();
   }
  }catch(error){abort(error);}
 }
 // Video must never continue recording a different or collapsed panel.
 function focusedPanelChanged(panel){
  if(state.panel&&state.panel!==panel)stopRecording();
 }
 function active(){return state.phase!=='idle';}
 window.addEventListener('beforeunload',event=>{
  if(state.phase==='recording'){
   event.preventDefault();event.returnValue='';
  }
 });
 window.addEventListener('pagehide',()=>{if(active())stopRecording();});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&state.mode==='canvas'&&state.phase==='recording')stopRecording();
 });
 window.EVUPanelRecorder={supported,captureMode,getStatus,start,stop:stopRecording,active,focusedPanelChanged,
  syncTerrainPortal,
  // Pure helpers exposed for small offline regression checks.
  clockText,selectMime};
})();
