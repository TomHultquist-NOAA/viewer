"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const start=src.indexOf('function surfaceWeatherEligible(){'),end=src.indexOf('function createMap(p){',start);
assert(start>=0&&end>start,'surface-weather panel helpers must be integrated before MapLibre creation');
const cfg={field:'mslp',surfaceWeatherEnabled:true,surfaceWeatherSettings:{centers:true}};
const ctx={st:cfg,SURFACE_MSLP_IMAGE_FIELDS:new Set(['t2m','dpt2m','rh2m','wspd10','gust']),Date,Promise,Number,String};
vm.createContext(ctx);vm.runInContext(src.slice(start,end),ctx);
const varmslp={name:'mslp',available_hours:[0,1,2,3]};
const captured=[];
const overlay={canvas:{style:{}},_url:null,_negative:new Map(),setSettings(){},clear(){captured.push(['clear']);this._url=null;},
 setFrame(...x){captured.push(['forecast',...x]);this._url='set';return Promise.resolve(true)},
 setAnalysisFrame(...x){captured.push(['analysis',...x]);this._url='set';return Promise.resolve(true)}};
const panel={cfg:{differencePanel:false},ds:{path:'rrfs_20261114_1200.zarr',variables:[varmslp]},h:3,surfaceWeather:overlay};
assert.equal(ctx.surfaceWeatherEligible(),true);
ctx.syncSurfaceWeatherPanel(panel);
assert.equal(captured[0].join(','),'forecast,rrfs,20261114,12,3');
ctx.syncSurfaceWeatherPanel(panel);assert.equal(captured.length,1,'same frame must not repeatedly fetch');
// Missing MSLP must not show stale features from earlier frame.
panel.ds={path:'gfs_v16_20261114_1200.zarr',variables:[{name:'t2m',available_hours:[3]}]};
ctx.syncSurfaceWeatherPanel(panel);assert.equal(captured.at(-1)[0],'clear');
// Analysis paths are under analysis/, and their frame key is valid time.
panel.ds={path:'analysis/analysis_rap_surface_2026111418.zarr',variables:[{name:'mslp',available_hours:[0]}]};panel.h=0;
ctx.syncSurfaceWeatherPanel(panel);assert.equal(captured.at(-1).join(','),'analysis,rap_surface,2026111418');
cfg.field='h500';ctx.syncSurfaceWeatherPanel(panel);assert.equal(captured.at(-1)[0],'clear');
cfg.field='mslp';panel.cfg.differencePanel=true;ctx.syncSurfaceWeatherPanel(panel);assert.equal(captured.at(-1)[0],'clear');
assert(src.includes('surfaceWeatherPNG=p.surfaceWeatherCanvas.toDataURL'), 'capture must include weather canvas');
assert(src.match(/drawWindExport\(ctx,captured\.surfaceWeather,rect,im\)/g)?.length===2,'individual and all-panel exports must paint surface weather');
const boot=fs.readFileSync(path.join(__dirname,'../js/evu-bootstrap.js'),'utf8');
assert(boot.indexOf("'surface-weather-overlay.js'")<boot.indexOf("'viewer.js'"));
const mobileCapture=fs.readFileSync(path.join(__dirname,'../js/panel-canvas-capture.js'),'utf8');
assert(mobileCapture.includes("['surfaceWeatherCanvas',6]"), 'Android canvas video must include the weather overlay');
console.log('PASS: per-hour catalog matching, analysis valid time, stale-data clearance, difference exclusion and PNG/GIF export hooks');
