/**
 * OMD EVU native terrain-tile weather shader. MapLibre GL JS 6.13+.
 * Regular latitude/longitude AND native Lambert conformal GRIB2 grids.
 *
 * Browser-only, self-hosted, no CPU weather canvas, and no server build.
 * Weather values are quantized once to RG8 (16 bits per grid point) and are
 * decoded and interpolated within the WebGL2 shader. Sampling, contouring,
 * time-series and export data continue to use original full-precision arrays.
 */
const PI=Math.PI, DEG=PI/180, EARTH=6371229;
function supported(){
 const v=String(window.maplibregl?.version||window.maplibregl?.getVersion?.()||'');
 const m=/^(\d+)\.(\d+)/.exec(v);
 return !!(m&&(Number(m[1])>6||(Number(m[1])===6&&Number(m[2])>=13)));
}
const vertex=`#version 300 es
precision highp float;
uniform vec4 u_tile;
uniform mat4 u_mapMatrix;
uniform int u_flat;
uniform int u_mesh;
layout(location=0) in vec3 a_mesh;
out vec2 v_mercator;
void main(){
 vec2 corner=vec2(float(gl_VertexID&1),float(gl_VertexID>>1));
 // Terrain tiles use their own clip coordinates. Upper air is projected on
 // a FLAT geographic plane in MapLibre's main color pass, not draped onto
 // elevated DEM geometry. Its valid pixels fully cover the terrain;
 // transparent below-ground pixels reveal the DEM rendered underneath.
 v_mercator=u_mesh==1?a_mesh.xy:mix(u_tile.xw,u_tile.zy,corner);
 gl_Position=u_mesh==1?u_mapMatrix*vec4(a_mesh,1.0):u_flat==1 ?
  u_mapMatrix*vec4(v_mercator,0.0,1.0) :
  vec4(corner*2.0-1.0,0.0,1.0);
}`;
const fragment=`#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 v_mercator;
out vec4 fragColor;
uniform sampler2D u_field;
uniform sampler2D u_lut;
uniform int u_projection; // 0: regular LL, 1: Lambert conformal
uniform vec4 u_geo;       // LL west,south,east,north (degrees)
uniform vec4 u_lambert0;  // central longitude(rad), cone n, rho origin, F*R
uniform vec4 u_lambert1;  // first cell x,y(m), cell x/y spacing(m)
uniform ivec2 u_shape;
uniform vec2 u_decode;    // min, range / 65534
uniform vec2 u_range;     // color lookup min/max
uniform float u_opacity;
uniform bool u_interpolate;
uniform float u_clearBelow;
const float PI=3.14159265358979323846;
// RG8 stores 0..65534; 65535 is missing, including mask cutouts.
float readValue(ivec2 coord){
 vec2 bytes=texelFetch(u_field,clamp(coord,ivec2(0),u_shape-1),0).rg;
 vec2 b=floor(bytes*255.0+0.5);
 float encoded=b.r+256.0*b.g;
 return encoded>=65534.5?-1.0e30:u_decode.x+encoded*u_decode.y;
}
bool valid(float x){return x>-1.0e20&&!isnan(x)&&!isinf(x);}
void main(){
 float lon=v_mercator.x*360.0-180.0;
 float lat=degrees(atan(sinh(PI*(1.0-2.0*v_mercator.y))));
 vec2 cell;
 if(u_projection==0){
  lon+=360.0*floor(((u_geo.x+u_geo.z)*0.5-lon)/360.0+0.5);
  cell=(vec2(lon,lat)-u_geo.xy)/(u_geo.zw-u_geo.xy)*vec2(u_shape-1);
 }else{
  float phi=clamp(radians(lat),-1.5707,1.5707);
  float lambda=radians(lon);
  float theta=u_lambert0.y*atan(sin(lambda-u_lambert0.x),cos(lambda-u_lambert0.x));
  float rho=u_lambert0.w/pow(tan(PI*0.25+phi*0.5),u_lambert0.y);
  float x=rho*sin(theta),y=u_lambert0.z-rho*cos(theta);
  cell=(vec2(x,y)-u_lambert1.xy)/u_lambert1.zw;
 }
 if(any(lessThan(cell,vec2(0.0)))||any(greaterThan(cell,vec2(u_shape-1))))discard;
 float value;
 if(u_interpolate){
  ivec2 a=ivec2(floor(cell)), b=min(a+ivec2(1),u_shape-1);
  float v00=readValue(a),v10=readValue(ivec2(b.x,a.y));
  float v01=readValue(ivec2(a.x,b.y)),v11=readValue(b);
  // Never smear temperature or precipitation through missing/below-ground cells.
  if(!(valid(v00)&&valid(v10)&&valid(v01)&&valid(v11)))discard;
  vec2 f=fract(cell);
  value=mix(mix(v00,v10,f.x),mix(v01,v11,f.x),f.y);
 }else value=readValue(ivec2(round(cell)));
 if(!valid(value)||value<u_clearBelow||value<u_range.x)discard;
 float range=max(u_range.y-u_range.x,0.000001);
 float key=clamp((value-u_range.x)/range,0.0,1.0);
 vec4 c=texture(u_lut,vec2(key,0.5));
 if(c.a<0.001)discard;
 float alpha=c.a*u_opacity;
 // MapLibre custom layers use premultiplied alpha in their framebuffer.
 fragColor=vec4(c.rgb*alpha,alpha);
}`;
function compile(gl,type,source){
 const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
 if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
  const err=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error('Terrain weather shader: '+err);
 }
 return shader;
}
function makeProgram(gl){
 const p=gl.createProgram(),vs=compile(gl,gl.VERTEX_SHADER,vertex),fs=compile(gl,gl.FRAGMENT_SHADER,fragment);
 gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
  const err=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw Error('Terrain shader linkage: '+err);
 }
 return p;
}
function parseColor(raw){
 const s=String(raw||'').replace('#','');
 if(!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(s))return [0,0,0,0];
 return [parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16),s.length===8?parseInt(s.slice(6,8),16):255];
}
// The standard color map interpolates between continuous palette stops.
// The original terrain shader used a constant color for each stop interval,
// visibly quantizing smooth precipitation (even with scalar interpolation on).
// Categorical fields retain exact, unblended bin colors.
function lookup(palette,count=4096,continuous=true){
 const levels=palette?.levels||[],colors=palette?.colors||[];
 if(levels.length<2||!colors.length)throw Error('Missing weather color scale');
 const min=Number(levels[0]),max=Number(levels.at(-1));
 if(!(Number.isFinite(min)&&Number.isFinite(max)&&max>min))throw Error('Invalid weather color scale');
 const rgba=new Uint8Array(count*4),colorBytes=colors.map(parseColor);
 let k=0;
 for(let i=0;i<count;i++){
  const v=min+(max-min)*i/(count-1);
  while(k+1<levels.length-1&&v>=Number(levels[k+1]))k++;
  const left=colorBytes[Math.min(k,colorBytes.length-1)];
  const right=colorBytes[Math.min(k+1,colorBytes.length-1)];
  const width=Number(levels[k+1])-Number(levels[k]);
  const t=continuous&&width>0?Math.max(0,Math.min(1,(v-Number(levels[k]))/width)):0;
  const j=i*4;
  for(let channel=0;channel<4;channel++)rgba[j+channel]=Math.round(left[channel]+(right[channel]-left[channel])*t);
 }
 return {min,max,rgba};
}
function numberGrid(grid,name,fallback=NaN){
 const value=grid?.[name]??grid?.['GRIB_'+name];
 return Number(value??fallback);
}
function geographic(grid,nx,ny){
 let west=numberGrid(grid,'longitude_min',numberGrid(grid,'longitudeOfFirstGridPointInDegrees'));
 let east=numberGrid(grid,'longitude_max',numberGrid(grid,'longitudeOfLastGridPointInDegrees'));
 const south=numberGrid(grid,'latitude_min',numberGrid(grid,'latitudeOfFirstGridPointInDegrees'));
 const north=numberGrid(grid,'latitude_max',numberGrid(grid,'latitudeOfLastGridPointInDegrees'));
 if([west,east,south,north].some(x=>!Number.isFinite(x)))throw Error('Missing regular LL bounds');
 if(west>=0&&east>180){west-=360;east-=360;}
 if(east<=west)east+=360;
 if(!(north>south))throw Error('Regular LL grid latitude order unsupported');
 return {type:0,bounds:[west,south,east,north],nx,ny};
}
function lambert(grid,nx,ny){
 const central=numberGrid(grid,'LoVInDegrees'),origin=numberGrid(grid,'LaDInDegrees');
 const lat1=numberGrid(grid,'Latin1InDegrees'),lat2=numberGrid(grid,'Latin2InDegrees',lat1);
 const lonFirst=numberGrid(grid,'longitudeOfFirstGridPointInDegrees');
 const latFirst=numberGrid(grid,'latitudeOfFirstGridPointInDegrees');
 const dx=numberGrid(grid,'DxInMetres'),dy=numberGrid(grid,'DyInMetres');
 if([central,origin,lat1,lat2,lonFirst,latFirst,dx,dy].some(x=>!Number.isFinite(x)))throw Error('Incomplete Lambert metadata');
 if(!(dx>0&&dy>0))throw Error('Invalid Lambert grid spacing');
 const phi1=lat1*DEG,phi2=lat2*DEG;
 const t=phi=>Math.tan(PI/4+phi/2);
 const n=Math.abs(lat1-lat2)<1e-7?Math.sin(phi1):
  Math.log(Math.cos(phi1)/Math.cos(phi2))/Math.log(t(phi2)/t(phi1));
 if(!Number.isFinite(n)||Math.abs(n)<1e-7)throw Error('Unsupported Lambert cone');
 const fr=EARTH*Math.cos(phi1)*Math.pow(t(phi1),n)/n;
 const rho0=fr/Math.pow(t(origin*DEG),n);
 const rhoFirst=fr/Math.pow(t(latFirst*DEG),n);
 const theta=n*(lonFirst-central)*DEG;
 const xFirst=rhoFirst*Math.sin(theta),yFirst=rho0-rhoFirst*Math.cos(theta);
 return {type:1,lambert0:[central*DEG,n,rho0,fr],lambert1:[xFirst,yFirst,dx,dy],nx,ny};
}
function projection(grid,nx,ny){
 const type=String(grid?.GRIB_gridType||grid?.gridType||'').toLowerCase();
 if(type==='regular_ll')return geographic(grid,nx,ny);
 if(type==='lambert')return lambert(grid,nx,ny);
 throw Error('GPU terrain does not support grid '+type);
}
function encode(values,mask){
 let min=Infinity,max=-Infinity,total=0;
 for(let i=0;i<values.length;i++){
  if(mask&&mask[i]===0)continue;
  const x=values[i];if(!Number.isFinite(x)||x<=-1e9)continue;
  if(x<min)min=x;if(x>max)max=x;total++;
 }
 if(!total){min=0;max=1;}
 const step=Math.max((max-min)/65534,1e-9),out=new Uint8Array(values.length*2);
 for(let i=0;i<values.length;i++){
  const x=values[i];
  let code=65535;
  if((!mask||mask[i]!==0)&&Number.isFinite(x)&&x>-1e9)
   code=Math.max(0,Math.min(65534,Math.round((x-min)/step)));
  out[2*i]=code&255;out[2*i+1]=code>>8;
 }
 return {bytes:out,min,step,count:total};
}
function texture(gl,internal,width,height,format,type,data,filter=gl.NEAREST){
 const tex=gl.createTexture(),oldUnpack=gl.getParameter(gl.UNPACK_ALIGNMENT);
 gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
 gl.texImage2D(gl.TEXTURE_2D,0,internal,width,height,0,format,type,data);
 gl.pixelStorei(gl.UNPACK_ALIGNMENT,oldUnpack);
 gl.bindTexture(gl.TEXTURE_2D,null);
 return tex;
}
// Shared draw for native DEM texture tiles and the terrain-independent map
// pass. A single compact RG8 field texture and 4096-entry color lookup are
// uploaded per field; neither is re-created when panning or pitching.
function drawWeather(gl,layer,tile,flat,modelMatrix,mesh=false){
 if(!layer.program)return;
 const state=layer.weatherState,U=layer.uniforms;
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.STENCIL_TEST);gl.disable(gl.CULL_FACE);
 gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 gl.useProgram(layer.program);gl.bindVertexArray(layer.vao);
 gl.uniform4fv(U.u_tile,tile);
 gl.uniform1i(U.u_flat,flat?1:0);
 gl.uniform1i(U.u_mesh,mesh?1:0);
 if(flat)gl.uniformMatrix4fv(U.u_mapMatrix,false,modelMatrix);
 gl.uniform1i(U.u_projection,state.geo.type);
 if(state.geo.type===0)gl.uniform4fv(U.u_geo,state.geo.bounds);
 else{gl.uniform4fv(U.u_lambert0,state.geo.lambert0);gl.uniform4fv(U.u_lambert1,state.geo.lambert1);}
 gl.uniform2i(U.u_shape,state.nx,state.ny);
 gl.uniform2f(U.u_decode,state.encoded.min,state.encoded.step);
 gl.uniform2f(U.u_range,state.lut.min,state.lut.max);
 gl.uniform1f(U.u_opacity,Math.max(0,Math.min(1,Number(state.opacity??1))));
 gl.uniform1i(U.u_interpolate,state.interpolate?1:0);
 gl.uniform1f(U.u_clearBelow,Number.isFinite(state.clearBelow)?state.clearBelow:-1e20);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,layer.fieldTex);gl.uniform1i(U.u_field,0);
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,layer.lutTex);gl.uniform1i(U.u_lut,1);
 if(mesh){
  gl.bindBuffer(gl.ARRAY_BUFFER,layer.meshBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  gl.drawArrays(gl.TRIANGLES,0,layer.meshCount);
  gl.disableVertexAttribArray(0);
 }else gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
 gl.bindVertexArray(null);
}
// Render the surface weather *after* MapLibre has finished its DEM color,
// hillshade, and terrain RTT composition. A geographic triangle mesh samples
// exactly the DEM elevations used by the map. Drawing the forecast on this
// mesh (rather than inside the terrain RTT) prevents 100% terrain opacity
// from ever covering fully opaque forecast pixels.
const WORLD_METRES=40075016.68557849;
function surfaceMesh(map){
 const bounds=map.getBounds?.();if(!bounds)return null;
 let west=bounds.getWest(),east=bounds.getEast();
 if(east<=west)east+=360;
 let south=Math.max(-85,Math.min(85,bounds.getSouth())),north=Math.max(-85,Math.min(85,bounds.getNorth()));
 if(!(east>west&&north>south))return null;
 // An expanded mesh keeps the map covered during fractional pans and avoids
 // regenerating elevation samples on every animated frame.
 const dx=east-west,dy=north-south;
 west-=dx*.3;east+=dx*.3;south=Math.max(-85,south-dy*.3);north=Math.min(85,north+dy*.3);
 const cols=65,rows=65,points=new Float32Array(cols*rows*3);
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const lat=south+(north-south)*j/(rows-1),lon=west+(east-west)*i/(cols-1);
  const phi=lat*Math.PI/180;
  let elevation=0;
  try{const sampled=map.queryTerrainElevation?.({lng:lon,lat},{exaggerated:true});if(Number.isFinite(sampled))elevation=Math.max(0,sampled);}catch(_){/*DEM tile not loaded yet*/}
  const index=(j*cols+i)*3;
  points[index]=(lon+180)/360;
  points[index+1]=(1-Math.log(Math.tan(Math.PI/4+phi/2))/Math.PI)/2;
  // Slight altitude bias avoids terrain z-fighting without changing the
  // field RGB or using alpha-based hillshading.
  points[index+2]=(elevation+4)/(WORLD_METRES*Math.max(.01,Math.cos(phi)));
 }
 const triangles=new Float32Array((cols-1)*(rows-1)*18);let o=0;
 function put(i,j){const k=(j*cols+i)*3;triangles[o++]=points[k];triangles[o++]=points[k+1];triangles[o++]=points[k+2];}
 for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){
  put(i,j);put(i+1,j);put(i,j+1);
  put(i+1,j);put(i+1,j+1);put(i,j+1);
 }
 return {triangles,bounds:{west,east,south,north}};
}
function meshCovers(map,box){
 const b=map.getBounds?.();if(!b)return false;
 let w=b.getWest(),e=b.getEast();if(e<=w)e+=360;
 // Keep at least 10% of the full padded extent as a safety margin.
 return w>box.west+.06*(box.east-box.west)&&e<box.east-.06*(box.east-box.west)&&
  b.getSouth()>box.south+.06*(box.north-box.south)&&b.getNorth()<box.north-.06*(box.north-box.south);
}
function create(opts){
 if(!supported())throw Error('Native terrain weather requires MapLibre 6.13+');
 const nx=Number(opts.nx),ny=Number(opts.ny);
 if(!Number.isSafeInteger(nx)||!Number.isSafeInteger(ny)||nx<2||ny<2||opts.values?.length!==nx*ny)
  throw Error('Invalid weather grid shape');
 const geo=projection(opts.grid,nx,ny);
 const state={...opts,nx,ny,geo,lut:lookup(opts.palette,4096,opts.continuous!==false),encoded:encode(opts.values,opts.mask),
  // Only surface/near-surface fields are attached to the DEM mesh. For
  // upper-air and upper-air differences, native terrain tile lighting and
  // elevation must never affect valid opaque forecast colors.
  terrainDrape:opts.terrainDrape!==false,gl:null};
 const layer={
  // All forecast fields are 2-D custom layers in MapLibre's normal paint
  // sequence, AFTER its terrain/draped raster group. Declaring them 3-D
  // caused the terrain mesh to be composited over the already painted fields,
  // regardless of their depth-test state. Surface fields still use a DEM
  // sampled vertex mesh; upper-air fields remain geographically flat.
  // Neither implements renderToTerrainTile: all valid forecast RGB colors
  // must be painted once, above the completed basemap.
  id:String(opts.id),type:'custom',renderingMode:'2d',terrainTileRevision:1,
  onAdd(map,gl){
   if(typeof gl.createVertexArray!=='function')throw Error('WebGL2 required for terrain shader');
   if(Math.max(nx,ny)>gl.getParameter(gl.MAX_TEXTURE_SIZE))throw Error('Weather grid exceeds GPU texture size');
   state.gl=gl;this.weatherState=state;this.terrainMap=map;
   if(state.terrainDrape){
    this.meshBuffer=gl.createBuffer();this.meshCount=0;this.meshBounds=null;
    this._meshDirty=true;
    this._onTerrainData=e=>{if(e?.sourceId==='evu-dem')this._meshDirty=true;};
    map.on?.('sourcedata',this._onTerrainData);
   }
   this.program=makeProgram(gl);this.vao=gl.createVertexArray();
   this.fieldTex=texture(gl,gl.RG8,nx,ny,gl.RG,gl.UNSIGNED_BYTE,state.encoded.bytes);
   this.lutTex=texture(gl,gl.RGBA8,state.lut.rgba.length/4,1,gl.RGBA,gl.UNSIGNED_BYTE,state.lut.rgba);
   this.uniforms={};
   for(const name of ['u_tile','u_mapMatrix','u_flat','u_mesh','u_projection','u_geo','u_lambert0','u_lambert1','u_shape','u_decode','u_range','u_opacity','u_interpolate','u_clearBelow','u_field','u_lut'])
    this.uniforms[name]=gl.getUniformLocation(this.program,name);
   // Free the large CPU upload buffer immediately; raw values remain in the viewer's cache.
   state.encoded.bytes=null;
  },
  render(gl,options){
   // All fields render after terrain. Surface fields additionally follow
   // sampled DEM elevations, and upper-air fields remain on a flat plane.
   // IMPORTANT: modelViewProjectionMatrix is in WORLD-PIXEL coordinates in
   // MapLibre 6. It does NOT accept normalized [0..1] Mercator coordinates.
   // Feeding it [0..1] was the cause of invisible upper-air plots when the
   // terrain mesh was active. MapLibre's custom-layer projection matrix *is*
   // expressly scaled for normalized Mercator coordinates; see
   // MercatorTransform.getProjectionDataForCustomLayer().
   const sourceMatrix=options?.defaultProjectionData?.mainMatrix;
   if(!sourceMatrix||sourceMatrix.length!==16){
    if(!this._reportedProjectionIssue){
     console.error('EVU upper-air GPU requires MapLibre custom-layer projection data');
     this._reportedProjectionIssue=true;
    }
    return;
   }
   // WebGL uniformMatrix4fv requires Float32List (MapLibre may supply a
   // Float64Array). Reuse a buffer to avoid per-panel/per-frame allocations.
   if(!this._flatMatrix32)this._flatMatrix32=new Float32Array(16);
   for(let i=0;i<16;i++)this._flatMatrix32[i]=sourceMatrix[i];
   if(state.terrainDrape){
    if(this._meshDirty||!this.meshBounds||!meshCovers(this.terrainMap,this.meshBounds)){
     const mesh=surfaceMesh(this.terrainMap);
     if(!mesh)return;
     gl.bindBuffer(gl.ARRAY_BUFFER,this.meshBuffer);
     gl.bufferData(gl.ARRAY_BUFFER,mesh.triangles,gl.DYNAMIC_DRAW);
     this.meshCount=mesh.triangles.length/3;
     this.meshBounds=mesh.bounds;this._meshDirty=false;
    }
    drawWeather(gl,this,[0,0,1,1],true,this._flatMatrix32,true);
   }else drawWeather(gl,this,[0,0,1,1],true,this._flatMatrix32);
  },
  setOpacity(value,map){
   const next=Math.max(0,Math.min(1,Number(value)));
   if(!Number.isFinite(next)||next===state.opacity)return;
   state.opacity=next;this.terrainTileRevision++;map?.triggerRepaint?.();
  },
  setInterpolation(enabled,map){
   const next=Boolean(enabled);
   if(next===state.interpolate)return;
   state.interpolate=next;this.terrainTileRevision++;map?.triggerRepaint?.();
  },
  onRemove(map,gl){
   if(this._onTerrainData)map.off?.('sourcedata',this._onTerrainData);
   if(this.meshBuffer)gl.deleteBuffer(this.meshBuffer);
   this.meshBuffer=null;this.meshBounds=null;
   if(this.fieldTex)gl.deleteTexture(this.fieldTex);
   if(this.lutTex)gl.deleteTexture(this.lutTex);
   if(this.vao)gl.deleteVertexArray(this.vao);
   if(this.program)gl.deleteProgram(this.program);
   this.fieldTex=this.lutTex=this.vao=this.program=null;
  this._flatMatrix32=null;state.gl=null;
  }
 };
 // There is deliberately NO renderToTerrainTile hook. That renderer
 // composites DEM relief over opaque weather regardless of ordinary style
 // layer order on MapLibre 6. Both variants draw in the post-terrain pass.
 return layer;
}
const EVUGPUTerrain={supported,create,lookup,geographic,lambert,projection,encode};
window.EVUGPUTerrain=EVUGPUTerrain;
export {supported,create,lookup,geographic,lambert,projection,encode};
export default EVUGPUTerrain;
