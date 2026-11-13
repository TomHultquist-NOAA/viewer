/** EVU primary no-build ES module boot, v1.2.82.
 * MapLibre 6 runs natively as ESM. The weather shader is also ESM. The
 * existing application is intentionally loaded as classic scripts in a
 * known order until its large stateful controller is safely modularized.
 * This preserves all old controls and avoids a risky one-shot rewrite.
 */
import * as maplibregl from '../vendor-v6/maplibre-gl.js';
import EVUGPUTerrain from './gpu-terrain-weather.js?v=1.2.82';

const releaseRedirect=await (window.EVU_EARLY_RELEASE_GATE||Promise.resolve(false));
if(!releaseRedirect){
window.EVU_ES_BOOT_STATUS='loading';
if(typeof maplibregl.Map!=='function'||typeof maplibregl.setWorkerUrl!=='function')throw new Error('MapLibre 6 module exports missing');
maplibregl.setWorkerUrl(new URL('../vendor-v6/maplibre-gl-worker.js', import.meta.url).href);
window.maplibregl=maplibregl;
window.EVUGPUTerrain=EVUGPUTerrain;
window.EVU_MAPLIBRE_V6=true;
// Nonfatal: one shared Three.js GPU drape context when available. The module
// itself loads the pinned vendor only on first terrain surface render.
try{const three=await import('./three-surface-drape.js?v=1.2.82');
 window.EVUThreeSurface=three.default;
}catch(error){console.warn('Optional Three.js surface module unavailable, retaining 2-D fallback',error);}


const scripts=[
  '../vendor/autumnplot-gl.js',
  'gif-export.js',
  'panel-canvas-capture.js',
  'panel-video-recorder.js',
  'pal-parser.js',
  'fast-lambert-sampler.js',
  'fast-wind-sampler.js',
  'advanced-map.js',
  'sounding-profiles.js',
  'sounding-thermodynamics.js',
  'point-inspector.js',
  'osm-roads.js',
  'low-tracks.js',
  'viewer.js',
  'weather-events.js'
];
async function loadClassic(path){
  const url=new URL(path, import.meta.url);
  // Bust stale code on upgrade; retain localStorage user preferences.
  url.searchParams.set('build','1.2.82');
  await new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=url.href;
    script.async=false;
    script.onload=resolve;
    script.onerror=()=>reject(new Error('Unable to load '+path));
    document.head.appendChild(script);
  });
}
try{
  for(const path of scripts)await loadClassic(path);
  if(!window.EVUAdvancedMap)throw new Error('Advanced map component unavailable');
  window.EVU_ES_BOOT_STATUS='ready';
  document.documentElement.dataset.evuRenderer='gpu-terrain-v6';
}catch(error){
  window.EVU_ES_BOOT_STATUS='failed';
  console.error('EVU primary ES-module bootstrap failed',error);
  document.documentElement.dataset.evuRenderer='startup-failed';
  const msg=document.createElement('aside');
  msg.setAttribute('role','alert');
  msg.style.cssText='position:fixed;z-index:99999;top:12px;left:12px;right:12px;background:#812b31;color:white;padding:14px;border-radius:8px;font:14px system-ui';
  msg.textContent='Renderer could not start: '+error.message+'. Check browser console and verify that vendor-v6 assets are installed.';
  document.body.appendChild(msg);
}

} // End preflight-gated module startup.
