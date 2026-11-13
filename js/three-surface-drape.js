/**
 * EVU Three.js terrain-following forecast compositor (v1.2.5).
 *
 * A SINGLE offscreen Three.js WebGL context is shared by all six/nine panels.
 * Each panel gets a geographic, DEM-sampled triangulated surface projected by
 * MapLibre's terrain-aware map.project(). A high-resolution RGBA forecast
 * texture is draped over that surface. The rendered result is copied to the
 * independent above-map canvas, which prevents MapLibre RTT/hillshade from
 * ever overdrawing the forecast. Upper-air fields do not use this renderer.
 *
 * Rendering the surface as geographic triangles rather than screen-aligned
 * pixels is important: a pitched camera receives actual relief displacement,
 * not a flat postprocess or a transparency wash. This module intentionally
 * does not manipulate forecast scalar values or the original palette.
 *
 * Optional vendor: ../vendor-three/three.module.js and three.core.js.
 * On internet-connected clients only, an identical pinned CDN module is used
 * when the local vendor has not been installed. Failure safely selects the
 * previous independent 2-D canvas implementation.
 */
const VERSION='0.187.0';
const CDN=`https://cdn.jsdelivr.net/npm/three@${VERSION}/build/three.module.js`;
const WGS84=6378137, DEG=Math.PI/180;
const instances=new WeakMap();
let threePromise=null, THREE=null, renderer=null, rendererCanvas=null;
let failed=false, warned=false;
let renderQueue=Promise.resolve();
const perfCounters={textureBuilds:0,textureReuses:0,meshBuilds:0,
 lastMeshMs:0,lastTextureMs:0,lastProjectionMs:0,lastDrawMs:0,
 lastVertices:0,lastTexturePixels:0,lastDemCoverage:0,
 lastTextureSampleMs:0,lastTextureColorMs:0,lastTextureSamplingMode:'reference',
 lastTextureSamplingReason:'not-attempted',lastTextureInterpolationMode:'reference'};
const perfNow=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function mercY(latitude){return Math.log(Math.tan(Math.PI/4+clamp(latitude,-85,85)*DEG/2));}
function inverseMercY(y){return (2*Math.atan(Math.exp(y))-Math.PI/2)/DEG;}
function wrapLongitude(lon,center){return lon+360*Math.round((center-lon)/360);}
function signedBounds(map,padding=.12){
 const canvas=map.getCanvas(),w=canvas.clientWidth,h=canvas.clientHeight;
 if(w<5||h<5)return null;
 const center=map.getCenter().lng;
 const pts=[];
 // Include the top/horizon edge as well as the bottom corners and center.
 for(const x of [0,w*.25,w*.5,w*.75,w])for(const y of [0,h*.25,h*.5,h*.75,h]){
  try{const ll=map.unproject([x,y]);
   if(Number.isFinite(ll.lng)&&Number.isFinite(ll.lat))pts.push([wrapLongitude(ll.lng,center),clamp(ll.lat,-84.5,84.5)]);
  }catch(_){/* horizon above ground */}
 }
 if(pts.length<4)return null;
 const minX=Math.min(...pts.map(p=>p[0])),maxX=Math.max(...pts.map(p=>p[0]));
 const minY=Math.min(...pts.map(p=>mercY(p[1]))),maxY=Math.max(...pts.map(p=>mercY(p[1])));
 // A 12% border avoids resampling during small pans and wheel animation.
 const px=Math.max(.000025,(maxX-minX)*padding),py=Math.max(.000025,(maxY-minY)*padding);
 const bounds={west:minX-px,east:maxX+px,southY:minY-py,northY:maxY+py};
 if(bounds.east-bounds.west>170||bounds.northY-bounds.southY>3.8)return null;
 return bounds;
}
function containsView(have,map){
 if(!have)return false;
 const next=signedBounds(map,0);if(!next)return false;
 // The next view already includes a 12% pad, so the prior mesh can remain
 // until its margins are genuinely insufficient.
 return next.west>=have.west&&next.east<=have.east&&
   next.southY>=have.southY&&next.northY<=have.northY;
}
function geoAt(b,u,v){return {lng:b.west+(b.east-b.west)*u,
 lat:inverseMercY(b.southY+(b.northY-b.southY)*v)};}
async function ensureRenderer(){
 if(failed)return null;
 if(!threePromise)threePromise=(async()=>{
  // Prefer same-origin local modules for restricted/server-only deployments.
  try{THREE=await import('../vendor-three/three.module.js');}
  catch(_){THREE=await import(CDN);}
  rendererCanvas=document.createElement('canvas');
  renderer=new THREE.WebGLRenderer({canvas:rendererCanvas,alpha:true,antialias:false,
   premultipliedAlpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(1);
  renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
  renderer.toneMapping=THREE.NoToneMapping;
  renderer.setClearColor(0,0);
  return THREE;
 })().catch(error=>{
  failed=true;if(!warned){warned=true;console.warn('Three.js surface drape unavailable; retaining 2-D forecast overlay.',error);}
  return null;
 });
 return threePromise;
}
function disposePanel(p){
 const a=instances.get(p);if(!a)return;
 a.geometry?.dispose();a.texture?.dispose();a.material?.dispose();
 instances.delete(p);
}
function buildTexturePixels(spec,b,nx,ny){
 const pixels=new Uint8Array(nx*ny*4);
 // Preserve exactly the original south-up geographic coordinate convention.
 // A validated Lambert source may sample an entire longitude row directly
 // from the native grid, avoiding hundreds of thousands of costly per-pixel
 // RawScalarField geographic projections. Invalid/unknown sources use the
 // original reference sampler at full resolution, never a low-detail preview.
 const colorCache=new Map();
 const lons=Float64Array.from({length:nx},(_,i)=>b.west+(b.east-b.west)*(i+.5)/nx);
 const lats=Float64Array.from({length:ny},(_,j)=>inverseMercY(b.southY+(b.northY-b.southY)*(j+.5)/ny));
 let rowSampler=typeof spec.sampleRow==='function'?spec.sampleRow:null;
 let sampleMs=0,colorMs=0;
 for(let j=0;j<ny;j++){
  const tSample=perfNow();
  let values=null;
  if(rowSampler){
   try{values=rowSampler(lons,lats[j],!!spec.interpolate);if(!values||values.length!==nx)throw Error('Invalid sampled row length');}
   catch(error){
    console.warn('Validated terrain row sampling unavailable; using reference field sampler',error);
    rowSampler=null;values=null;
   }
  }
  if(!values){
   values=new Float64Array(nx);
   for(let i=0;i<nx;i++)values[i]=spec.sample(lons[i],lats[j]);
  }
  sampleMs+=perfNow()-tSample;
  const tColor=perfNow();
  for(let i=0;i<nx;i++){
   const value=values[i],k=(j*nx+i)*4;
   if(!Number.isFinite(value)||spec.mask(value))continue;
   const key=Math.round(value*100000);
   let rgba=colorCache.get(key);
   if(!rgba){rgba=spec.color(value);if(colorCache.size<60000)colorCache.set(key,rgba);}
   pixels[k]=rgba[0];pixels[k+1]=rgba[1];pixels[k+2]=rgba[2];pixels[k+3]=rgba[3];
  }
  colorMs+=perfNow()-tColor;
 }
 perfCounters.lastTextureSampleMs=Math.round(sampleMs);
 perfCounters.lastTextureColorMs=Math.round(colorMs);
 perfCounters.lastTextureSamplingMode=rowSampler?'validated-lambert-row':'reference';
 perfCounters.lastTextureSamplingReason=rowSampler?'validated':
  String(spec.samplerDiagnostics?.reason||'not-available');
 perfCounters.lastTextureInterpolationMode=rowSampler?(spec.interpolate?'native-bilinear':'native-nearest'):'reference';
 return pixels;
}
function createTexture(spec,b,nx,ny){
 const started=perfNow();
 perfCounters.textureBuilds++;
 const pixels=buildTexturePixels(spec,b,nx,ny);
 const texture=new THREE.DataTexture(pixels,nx,ny,THREE.RGBAFormat,THREE.UnsignedByteType);
 texture.colorSpace=THREE.NoColorSpace;
 texture.flipY=false;
 texture.minFilter=spec.interpolate?THREE.LinearFilter:THREE.NearestFilter;
 texture.magFilter=spec.interpolate?THREE.LinearFilter:THREE.NearestFilter;
 texture.generateMipmaps=false;
 texture.needsUpdate=true;
 perfCounters.lastTextureMs=Math.round(perfNow()-started);
 perfCounters.lastTexturePixels=nx*ny;
 return texture;
}
function meshDensity(map,activePanels=1){
 const {clientWidth:w,clientHeight:h}=map.getCanvas();
 const pitch=Number(map.getPitch?.()||0);
 // Increase near-screen geometry density at high pitch. A cap prevents one
 // large image or nine panels from monopolizing the main thread with DEM
 // queries; compact panels spend substantially fewer vertices.
 // Higher near-view fidelity; bounded for six/nine-panel GPU throughput.
 const cell=pitch>=48?2.0:2.5;
 let cols=clamp(Math.ceil(w/cell),70,360),rows=clamp(Math.ceil(h/cell),62,310);
 const maxVertices=activePanels>=9?32000:activePanels>=6?56000:(w>=760?90000:70000);
 const total=(cols+1)*(rows+1);
 if(total>maxVertices){const scale=Math.sqrt(maxVertices/total);cols=Math.max(70,Math.floor(cols*scale));rows=Math.max(62,Math.floor(rows*scale));}
 // Count includes grid endpoints; rounded dimensions can overshoot budget.
 while((cols+1)*(rows+1)>maxVertices){if(cols>=rows)cols--;else rows--;}
 return {cols,rows};
}
function meshWarp(map,b){
 // Uniform geographic grids spend most triangles near a pitched horizon.
 // Bias tessellation toward the near-screen ground using the map's actual
 // bearing, so the bias also works when the camera faces east or west.
 const pitch=Number(map.getPitch?.()||0);
 if(pitch<45)return {u:t=>t,v:t=>t};
 const {clientWidth:w,clientHeight:h}=map.getCanvas();
 let near;
 try{near=map.unproject([w*.5,h*.84]);}catch(_){return {u:t=>t,v:t=>t};}
 if(!near||!Number.isFinite(near.lng)||!Number.isFinite(near.lat))return {u:t=>t,v:t=>t};
 const u=clamp((wrapLongitude(near.lng,map.getCenter().lng)-b.west)/(b.east-b.west),0,1);
 const v=clamp((mercY(near.lat)-b.southY)/(b.northY-b.southY),0,1);
 const exponent=1+clamp((pitch-40)/35,0,1)*.85;
 const bias=(anchor,t)=>anchor<.32?Math.pow(t,exponent):anchor>.68?1-Math.pow(1-t,exponent):t;
 return {u:t=>bias(u,t),v:t=>bias(v,t)};
}
function makeMesh(map,b,spec){
 const started=perfNow();
 perfCounters.meshBuilds++;
 const canvas=map.getCanvas(),w=canvas.clientWidth,h=canvas.clientHeight;
 // Mesh density is independent of forecast-texture resolution. This resolves
 // terrain ridges without forcing hundreds of thousands of DEM queries.
 const {cols,rows}=meshDensity(map,spec.activePanels||1),warp=meshWarp(map,b);
 const count=(cols+1)*(rows+1);
 let goodHeights=0;
 const position=new Float32Array(count*3),uv=new Float32Array(count*2),light=new Float32Array(count);
 const lons=new Float64Array(count),lats=new Float64Array(count),heights=new Float32Array(count);
 const indices=[];
 const us=Float64Array.from({length:cols+1},(_,i)=>warp.u(i/cols));
 const vs=Float64Array.from({length:rows+1},(_,j)=>warp.v(j/rows));
 const xLons=Float64Array.from(us,u=>b.west+(b.east-b.west)*u);
 const yLats=Float64Array.from(vs,v=>inverseMercY(b.southY+(b.northY-b.southY)*v));
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const u=us[i],v=vs[j],k=j*(cols+1)+i,lon=xLons[i],lat=yLats[j];
  lons[k]=lon;lats[k]=lat;uv[k*2]=u;uv[k*2+1]=v;
  let z=0;
  try{const elevation=map.queryTerrainElevation({lng:lon,lat});if(Number.isFinite(elevation)){
   // Terrarium includes bathymetry. Never use negative offshore seafloor
   // elevations to illuminate or deform the surface forecast image.
   // Land ridges and valleys above sea level retain their full DEM detail.
   z=Math.max(0,elevation);goodHeights++;
  }}catch(_){}
  heights[k]=z;
 }
 // Geographic slopes, not differences of projected screen coordinates. This
 // gives light direction that stays geographically fixed when camera rotates.
 const az=Number(spec.sunAngle??315)*DEG, sunX=Math.sin(az),sunY=Math.cos(az);
 // Rendered DEM already includes MapLibre's vertical exaggeration, so don't
 // multiply the heights a second time. Fine and broad hillshade are derived
 // from the SAME queried elevation grid: no extra network or DEM reads.
 const width=cols+1;
 const gradient=(i,j,radius)=>{
  const il=Math.max(0,i-radius),ir=Math.min(cols,i+radius);
  const jb=Math.max(0,j-radius),jt=Math.min(rows,j+radius),k=j*width+i;
  const west=j*width+il,east=j*width+ir;
  const south=jb*width+i,north=jt*width+i;
  const dx=Math.max(1,(lons[east]-lons[west])*DEG*WGS84*Math.cos(lats[k]*DEG));
  const dy=Math.max(1,(lats[north]-lats[south])*DEG*WGS84);
  const sx=clamp((heights[east]-heights[west])/dx*1.85,-3.5,3.5);
  const sy=clamp((heights[north]-heights[south])/dy*1.85,-3.5,3.5);
  return {facing:(sx*sunX+sy*sunY)/Math.sqrt(1+sx*sx+sy*sy),
   dx,dy,west,east,south,north};
 };
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const k=j*width+i,near=gradient(i,j,1),far=gradient(i,j,4);
  // Geologic-scale valley/crest form comes from a four-cell derivative;
  // the one-cell derivative retains thin ridges that disappear when one
  // smooth normal is stretched over strongly pitched terrain triangles.
  const localMean=(heights[near.west]+heights[near.east]+
    heights[near.south]+heights[near.north])*.25;
  const localDistance=Math.max(25,Math.sqrt(near.dx*near.dy)*.5);
  const crest=clamp((heights[k]-localMean)/localDistance*3,-1,1);
  // A slight directional crest/valley accent is deliberately neutral: RGB
  // still comes exclusively from the forecast texture, and upper-air never
  // invokes this shader. Bounded lighting preserves saturated palette peaks.
  light[k]=heights[k]<=0?1:clamp(1+near.facing*.91+far.facing*.27+crest*.16,.62,1.40);
 }
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;
  indices.push(a,b,d,a,d,c);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(position,3));
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 geometry.setAttribute('aLight',new THREE.BufferAttribute(light,1));
 geometry.setIndex(indices);
 perfCounters.lastMeshMs=Math.round(perfNow()-started);
 perfCounters.lastVertices=count;
 perfCounters.lastDemCoverage=Math.round(goodHeights/Math.max(1,count)*1000)/10;
 return {geometry,lons,lats,cols,rows,goodHeights,geometryVertices:count,textureSize:[0,0],lastView:null,
  sampleZoom:Number(map.getZoom?.()||0),samplePitch:Number(map.getPitch?.()||0)};
}
function projectMesh(instance,map){
 const started=perfNow();
 const {geometry,lons,lats}=instance,attr=geometry.getAttribute('position');
 const width=map.getCanvas().clientWidth,height=map.getCanvas().clientHeight;
 for(let i=0;i<lons.length;i++){
  let x=-10000,y=-10000;
  try{const q=map.project({lng:lons[i],lat:lats[i]});
   if(Number.isFinite(q.x)&&Number.isFinite(q.y)){x=q.x;y=q.y;}}
  catch(_){/* offscreen horizon */}
  attr.array[i*3]=x;attr.array[i*3+1]=height-y;
  // Near/bottom geometry wins in the uncommon case of overlapping folds.
  attr.array[i*3+2]=clamp(y/Math.max(1,height),-2,2)*.001;
 }
 attr.needsUpdate=true;geometry.computeBoundingSphere();
 perfCounters.lastProjectionMs=Math.round(perfNow()-started);
}
function createMaterial(texture,opacity){
 return new THREE.ShaderMaterial({
  uniforms:{uField:{value:texture},uOpacity:{value:opacity},uRelief:{value:1}},
  vertexShader:`attribute float aLight; varying float vLight; varying vec2 vUV;
   void main(){vUV=uv;vLight=aLight;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform sampler2D uField;uniform float uOpacity;uniform float uRelief;
   varying float vLight;varying vec2 vUV;
   void main(){vec4 c=texture2D(uField,vUV);if(c.a<.003)discard;
    float light=mix(1.0,vLight,uRelief);
    gl_FragColor=vec4(clamp(c.rgb*light,0.0,1.0),c.a*uOpacity);}`,
  depthTest:false,depthWrite:false,transparent:true,side:THREE.DoubleSide,
  blending:THREE.NormalBlending
 });
}
// DEM tiles and illumination frequently invalidate a mesh while the exact
// forecast texture remains unchanged. Reuse that texture if and only if its
// field object, sample envelope, size, and filter mode all still match.
// Forecast-derived RGBA values are never coarsened or reprojected differently.
function reusableTexture(inst,spec,b,w,h){
 if(!inst?.texture||inst.spec!==spec.identity||inst.textureInterpolate!==!!spec.interpolate||
    inst.textureWidth!==w||inst.textureHeight!==h)return false;
 return ['west','east','southY','northY'].every(k=>inst.bounds?.[k]===b[k]);
}
function signature(spec){return [spec.fieldKey,spec.interpolate,spec.sunAngle,spec.reliefStrength,spec.exaggeration].join('|');}
function renderPrepared(p,map,target,inst,spec){
 const started=perfNow();
 const w=Math.max(2,Math.round(map.getCanvas().clientWidth)),h=Math.max(2,Math.round(map.getCanvas().clientHeight));
 if(w<4||h<4)return false;
 projectMesh(inst,map);
 inst.material.uniforms.uOpacity.value=clamp(spec.opacity,0,1);
 inst.material.uniforms.uRelief.value=clamp(spec.reliefStrength??.75,0,1);
 const scene=new THREE.Scene(),mesh=new THREE.Mesh(inst.geometry,inst.material);
 mesh.frustumCulled=false;scene.add(mesh);
 const camera=new THREE.OrthographicCamera(0,w,h,0,-10,10);camera.position.z=5;
 // Supersample only the small number of pixels needed for sharp ridges.
 // Each panel shares one context, and the six/nine-panel caps avoid a costly
 // full-device-pixel-ratio render across every map simultaneously.
 const dpr=clamp(typeof devicePixelRatio==='number'?devicePixelRatio:1,1,2);
 const maxScale=spec.activePanels>=9?1.06:spec.activePanels>=6?1.3:1.55;
 const minScale=spec.activePanels>=9?1.00:spec.activePanels>=6?1.20:1.35;
 const scale=clamp(dpr,minScale,maxScale);
 const tw=Math.round(w*scale),th=Math.round(h*scale);
 renderer.setSize(tw,th,false);renderer.clear();renderer.render(scene,camera);
 if(target.width!==tw)target.width=tw;if(target.height!==th)target.height=th;
 const ctx=target.getContext('2d',{alpha:true});if(!ctx)return false;
 ctx.clearRect(0,0,tw,th);ctx.drawImage(renderer.domElement,0,0,tw,th);
 target.style.imageRendering=spec.interpolate?'auto':'pixelated';
 target.style.display='block';target.style.opacity='1';
 target.dataset.renderMode='three-terrain';
 perfCounters.lastDrawMs=Math.round(perfNow()-started);
 return true;
}
async function doDraw(p,spec,generation){
 if(!await ensureRenderer())return false;
 // A user may have changed models while the optional vendor module loaded.
 if(generation!==p?._evuThreeGeneration||p?._evuThreeSuspended||p?._evuForecastMoving)return false;
 if(!p?.map||!p.mobileScalarCanvas||!p.mobileScalar)return false;
 const map=p.map,target=p.mobileScalarCanvas;
 let inst=instances.get(p),newBounds=null;
 const key=signature(spec);
 // Zooming within a previously sampled geographic envelope MUST rebuild
 // geometry at finer resolution. Reprojection alone cannot invent the new
 // ridge detail present in MapLibre's subsequently fetched DEM tiles.
 const zoom=Number(map.getZoom?.()||0),pitch=Number(map.getPitch?.()||0);
 const needsRebuild=!inst||inst.dirty||inst.spec!==spec.identity||inst.key!==key||
  !containsView(inst.bounds,map)||zoom>inst.sampleZoom+.75||
  Math.abs(pitch-inst.samplePitch)>18;
 if(needsRebuild){
  // Terrain tile arrivals and relief-lighting adjustments require a new DEM
  // mesh, but not a fresh 700k-pixel weather texture at a stable camera.
  // Keep the existing padded geographic envelope when it still covers the
  // complete view; regenerate only if the data/view truly changed.
  const covered=inst&&inst.spec===spec.identity&&containsView(inst.bounds,map)&&
   zoom<=inst.sampleZoom+.75&&Math.abs(pitch-inst.samplePitch)<=18;
  newBounds=covered?inst.bounds:signedBounds(map);if(!newBounds)return false;
  // Make the CPU sampling texture finer than the actual geometry to preserve
  // GFS precipitation palettes and narrow rain bands at full opacity.
  const w=map.getCanvas().clientWidth,h=map.getCanvas().clientHeight;
  const scale=spec.activePanels>=9?1.35:spec.activePanels>=6?1.5:1.75;
  let texW=clamp(Math.ceil(w*scale),240,960),texH=clamp(Math.ceil(h*scale),200,800);
  // A canvas resize (including opening/closing DevTools) changes the target
  // size but not necessarily the sampled geographic domain. Reuse the exact
  // full-resolution source texture if it already covers the view: geometry
  // will still be rebuilt/projected for the resized map. Avoids a costly
  // CPU re-sampling step and never changes any forecast scalar value.
  if(covered&&inst?.texture&&inst.spec===spec.identity&&inst.textureInterpolate===!!spec.interpolate){
   texW=inst.textureWidth;texH=inst.textureHeight;
  }
  const terrain=makeMesh(map,newBounds,spec);
  const reuse=reusableTexture(inst,spec,newBounds,texW,texH);
  if(reuse)perfCounters.textureReuses++;
  const texture=reuse?inst.texture:createTexture(spec,newBounds,texW,texH);
  const material=createMaterial(texture,spec.opacity);
  // Ownership moves to the replacement mesh; the previous material and
  // geometry are disposed normally, without releasing this GPU texture.
  if(reuse)inst.texture=null;
  disposePanel(p);
  inst={...terrain,material,texture,bounds:newBounds,spec:spec.identity,key,
   textureWidth:texW,textureHeight:texH,textureInterpolate:!!spec.interpolate,
   // DEM tiles often finish loading after the first forecast. Do not freeze
   // an all-zero mesh; source-data events invalidate and retry projection.
   dirty:terrain.goodHeights<terrain.geometryVertices*.30};
  instances.set(p,inst);
 }
 if(generation!==p._evuThreeGeneration||p._evuThreeSuspended||p._evuForecastMoving)return false;
 return renderPrepared(p,map,target,inst,spec);
}
// Serializing render() is required because all panels share one GPU context.
// A stale render must not overwrite a newer forecast during quick model steps.
function draw(p,spec){
 if(p._evuThreeSuspended||p._evuForecastMoving)return Promise.resolve(false);
 const generation=p._evuThreeGeneration=(p._evuThreeGeneration||0)+1;
 renderQueue=renderQueue.catch(()=>{}).then(async()=>{
  if(generation!==p._evuThreeGeneration||p._evuThreeSuspended||p._evuForecastMoving)return false;
  try{return await doDraw(p,spec,generation);}catch(error){
   console.warn('Three.js surface drape failed for this panel; falling back to independent canvas',error);
   disposePanel(p);return false;
  }
 });
 return renderQueue;
}
function invalidate(p){const inst=instances.get(p);if(inst)inst.dirty=true;}
// Cancel any awaiting/queued frames; synchronous GPU calls complete naturally.
function suspend(p){p._evuThreeSuspended=true;p._evuThreeGeneration=(p._evuThreeGeneration||0)+1;}
function resume(p){if(!p._evuForecastMoving)p._evuThreeSuspended=false;}
function dispose(p){p._evuThreeGeneration=(p._evuThreeGeneration||0)+1;disposePanel(p);}
const api={draw,dispose,invalidate,suspend,resume,whenIdle:()=>renderQueue,getStatus:()=>({version:VERSION,ready:!!renderer,failed,...perfCounters}),
 _test:{signedBounds,geoAt,mercY,inverseMercY,wrapLongitude,containsView,meshDensity,meshWarp,createTexture,makeMesh,projectMesh,reusableTexture,buildTexturePixels}};
export default api;
