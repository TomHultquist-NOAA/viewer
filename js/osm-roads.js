/* EVU Roads v1.2.7: optional self-hosted highway tiles, independent of MapLibre.
   All panels share one bounded tile cache. No third-party runtime tile API. */
(function(root){'use strict';
const MAX_CACHE=192,MAX_CACHE_BYTES=48*1024*1024,MAX_VISIBLE=64,MAX_INFLIGHT=8;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const mercY=(lat,z)=>{const p=clamp(lat,-85.05112878,85.05112878)*Math.PI/180;
 return (1-Math.log(Math.tan(p)+1/Math.cos(p))/Math.PI)/2*(2**z);};
const mercX=(lon,z)=>(lon+180)/360*(2**z);
function tilesForBounds(bounds,z,index){
 const n=2**z,south=clamp(bounds.getSouth(),-85.05112878,85.05112878),north=clamp(bounds.getNorth(),-85.05112878,85.05112878);
 const ya=clamp(Math.floor(mercY(north,z)),0,n-1),yb=clamp(Math.floor(mercY(south,z)),0,n-1);
 let west=bounds.getWest(),east=bounds.getEast();
 if(east<west)east+=360;
 // Bounds from pitched MapLibre views may cross multiple world wraps.
 const width=Math.min(360,Math.max(0,east-west));
 if(width>=359.99){west=-180;east=180;}else{
   west=((west+180)%360+360)%360-180;east=west+width;
 }
 const xa=Math.floor(mercX(west,z)),xb=Math.floor(mercX(east,z));
 if((xb-xa+1)*(yb-ya+1)>MAX_VISIBLE)return [];
 const seen=new Set(),keys=[];
 for(let x=xa;x<=xb;x++)for(let y=ya;y<=yb;y++){
  const wrapped=((x%n)+n)%n,key=z+'/'+wrapped+'/'+y;
  if(index.has(wrapped+'/'+y)&&!seen.has(key)){keys.push(key);seen.add(key);}
 }
 return keys;
}
class Store{
 constructor(base){this.base=base.replace(/\/$/,'');this.manifest=null;this.index=null;this.manifestPromise=null;
   this.tileCache=new Map();this.cacheBytes=0;this.loading=new Map();this.failed=new Set();this.queue=[];this.running=0;this.listeners=new Map();}
 ready(){
  if(this.manifestPromise)return this.manifestPromise;
  this.manifestPromise=fetch(this.base+'/manifest.json',{cache:'no-cache'}).then(r=>{
    if(!r.ok)throw Error('OSM roads manifest HTTP '+r.status);return r.json();
  }).then(data=>{
    if(!['evu-osm-roads-v1','evu-highways-v1'].includes(data.format)||!Array.isArray(data.zooms)||!data.tile_index)throw Error('Invalid OSM road manifest');
    this.manifest=data;this.index=new Map(data.zooms.map(z=>[Number(z),new Set(data.tile_index[String(z)]||[])]));
    return true;
  }).catch(_=>false); // Optional data: Natural Earth remains available.
  return this.manifestPromise;
 }
 level(map){
  if(!this.manifest||map.getZoom()<Math.max(5.5,Number(this.manifest.min_display_zoom)||5.5))return null;
  const zooms=this.manifest.zooms.map(Number).sort((a,b)=>a-b);
  return map.getZoom()<9?zooms[0]:zooms[1];
 }
 visible(map){
  const z=this.level(map);if(z===null)return [];
  return tilesForBounds(map.getBounds(),z,this.index.get(z)||new Set());
 }
 get(key){
  if(!this.tileCache.has(key))return null;
  const data=this.tileCache.get(key);this.tileCache.delete(key);this.tileCache.set(key,data);return data.roads;
 }
 load(key,onReady){
  if(this.tileCache.has(key)||this.failed.has(key))return;
  if(onReady){let set=this.listeners.get(key);if(!set){set=new Set();this.listeners.set(key,set);}set.add(onReady);}
  if(this.loading.has(key)||this.queue.includes(key))return;
  this.queue.push(key);this.pump();
 }
 pump(){
  while(this.running<MAX_INFLIGHT&&this.queue.length){
   const key=this.queue.shift();if(this.tileCache.has(key)||this.failed.has(key))continue;
   const url=this.base+'/'+key+'.json';this.running++;
   const request=fetch(url).then(r=>{if(!r.ok)throw Error('OSM tile '+r.status);return r.json();})
    .then(data=>{
      if(!Array.isArray(data.roads))throw Error('Malformed OSM road tile');
      const bytes=JSON.stringify(data.roads).length*2;
      this.tileCache.set(key,{roads:data.roads,bytes});this.cacheBytes+=bytes;
      while(this.tileCache.size>MAX_CACHE||this.cacheBytes>MAX_CACHE_BYTES&&this.tileCache.size>1){
       const first=this.tileCache.keys().next().value;
       this.cacheBytes-=this.tileCache.get(first).bytes;this.tileCache.delete(first);
      }
      for(const cb of this.listeners.get(key)||[])try{cb();}catch(e){console.warn('Road tile redraw:',e);}
    }).catch(err=>{this.failed.add(key);console.warn('Optional OSM road tile unavailable:',key,err);})
    .finally(()=>{this.loading.delete(key);this.listeners.delete(key);this.running--;this.pump();});
   this.loading.set(key,request);
  }
 }
 prefetch(map,onReady){
  if(!this.manifest)return;
  for(const key of this.visible(map))this.load(key,onReady);
 }
 draw(ctx,map,w,h,color,width,density,frontVisible){
  const keys=this.visible(map);
  if(!keys.length)return false;
  const zoom=map.getZoom();let maxTier=zoom<6.5?0:zoom<9?1:zoom<10.5?2:zoom<12?3:zoom<13?4:5;
  if(density>=1.5)maxTier=Math.min(5,maxTier+1);
  let drew=false;
  ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();ctx.globalAlpha=.7;
  ctx.strokeStyle=color;ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=width;
  for(const key of keys){
   const entries=this.get(key);if(!entries)continue;
   drew=true;
   for(const entry of entries){
    if(!Array.isArray(entry)||entry[0]>maxTier||!Array.isArray(entry[1]))continue;
    const line=entry[1];if(line.length<2)continue;
    ctx.beginPath();let started=false,visible=false;
    for(const point of line){
     if(!Array.isArray(point)||point.length<2||!frontVisible(point[0],point[1])){started=false;continue;}
     let xy;try{xy=map.project(point);}catch(_){started=false;continue;}
     if(!Number.isFinite(xy.x)||!Number.isFinite(xy.y)){started=false;continue;}
     if(!started){ctx.moveTo(xy.x,xy.y);started=true;}else ctx.lineTo(xy.x,xy.y);
     if(xy.x>=-w*.05&&xy.x<=w*1.05&&xy.y>=-h*.05&&xy.y<=h*1.05)visible=true;
    }
    if(visible)ctx.stroke();
   }
  }
  ctx.restore();return drew;
 }
}
root.EVUOSMRoads={create:base=>new Store(base),Store,tilesForBounds};
})(typeof window!=='undefined'?window:globalThis);
