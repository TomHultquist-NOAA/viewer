'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const zlib=require('node:zlib');
const ROOT=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'js/sounding-profiles.js'),'utf8');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const inspector=fs.readFileSync(path.join(ROOT,'js/point-inspector.js'),'utf8');
assert.match(html,/js\/sounding-profiles\.js\?v=1\.1\.10/);
assert.ok(html.indexOf('js/sounding-profiles.js')<html.indexOf('js/point-inspector.js'));
assert.match(inspector,/EVUSoundingProfiles\?\.load/);
assert.match(inspector,/model==='refs_mean'/);
assert.match(inspector,/Math\.abs\(y-lastBarbY\)>=19/);
assert.match(inspector,/scheduleSoundingRefresh/);
assert.match(inspector,/const Y=p=>y1-Math\.log\(1000\/p\)\/Math\.log\(1000\/100\)/);
const catalog={schema:'omd-evu-sounding-profile-1',datasets:[
  {path:'sounding_rrfs_20261028_1200.zarr',model:'rrfs',init_time:'2026-10-28T12:00:00Z',available_hours:[0,1],variables:['t','td','u','v'].map(name=>({name}))},
  {path:'sounding_refs_mean_20261028_1200.zarr',model:'refs_mean',init_time:'2026-10-28T12:00:00Z',available_hours:[1],ensemble_method:'native operational time-lagged REFS Mean GRIB2',variables:['t','td','u','v'].map(name=>({name}))}
]};
const compressed=new Map();
for(const ds of catalog.datasets){
 for(const name of ['t','td','u','v']){
  for(const hour of ds.available_hours){
   const vals=new Float32Array(3*2*2).fill(NaN);
   const base=name==='t'?280:name==='td'?272:name==='u'?10:-5;
   // First 3 pressure levels; REFS Mean only has 925 and 700.
   for(let level=0;level<3;level++){
    if(ds.model==='refs_mean'&&level===1)continue;
    for(let i=0;i<4;i++)vals[level*4+i]=base-level*2;
   }
   compressed.set(`data/${ds.path}/${name}/${hour}.0.0.0`,zlib.deflateSync(Buffer.from(vals.buffer)));
  }
 }
}
const responseJSON=o=>new Response(JSON.stringify(o),{headers:{'content-type':'application/json'}});
const urlLog=[];let gridSeen=null;
const fetchMock=async u=>{
 const path=new URL(u).pathname.replace(/^\//,'');urlLog.push(path);
 if(path==='data/catalog_profiles.json')return responseJSON(catalog);
 if(path.endsWith('/.zattrs'))return responseJSON({GRIB_gridType:'lambert',GRIB_Nx:2,GRIB_Ny:2,GRIB_DxInMetres:48000,
     grid_order:'WE:SN',grid_spacing_km:48,pressure_levels_hpa:[1000,925,700]});
 if(path.endsWith('/t/.zarray'))return responseJSON({shape:[2,3,2,2],chunks:[1,3,2,2],dtype:'<f4',order:'C',compressor:{id:'zlib'}});
 if(compressed.has(path))return new Response(compressed.get(path));
 return new Response('missing',{status:404});
};
const win={};const context=vm.createContext({window:win,document:{baseURI:'https://test.invalid/'},fetch:fetchMock,
 Date,Number,Math,Promise,Response,URL,DecompressionStream,Float32Array,Error,Map,console,Array,
 gridFromDataset:(ds,v)=>{gridSeen={ds,v};return {grid:'mock'};},
 apgl:{RawScalarField:class{constructor(grid,data){this.grid=grid;this.data=data;}sampleField(){return this.data[0];}}}
});
vm.runInContext(src,context);
const api=win.EVUSoundingProfiles;
assert.equal(api.chooseRecord(catalog,'rrfs','2026-10-28T12:00:00.000Z',1).model,'rrfs');
assert.equal(api.chooseRecord(catalog,'refs_mean','2026-10-28T12:00:00Z',0),null);
assert.equal(api.chooseRecord(catalog,'rrfs','2026-10-29T12:00:00Z',1),null);
assert.equal(api.chooseRecord(catalog,'../../foo','2026-10-28T12:00:00Z',0),null);
(async()=>{
 const a=await api.load({model:'rrfs',cycle:'2026-10-28T12:00:00Z',hour:1,lon:-100,lat:44});
 assert.equal(a.status,'available');assert.equal(a.rows.length,3);
 assert.ok(Math.abs(a.rows[0].t-6.85)<.00001);
 assert.ok(Math.abs(a.rows[0].td+1.15)<.00001);
 assert.equal(a.rows[0].u,10);assert.equal(a.rows[0].v,-5);
 assert.equal(a.gridKm,48);
 assert.equal(gridSeen.ds.grid.GRIB_DxInMetres,48000,'use strided zattrs, not full source catalog grid');
 const b=await api.load({model:'refs_mean',cycle:'2026-10-28T12:00:00Z',hour:1,lon:-100,lat:44});
 assert.equal(b.status,'available');assert.equal(b.levels.temperature,2);
 assert.equal(b.levels.dewpoint,2);
 assert.equal(b.rows[1].td,null,'sparse unavailable level stays missing');
 assert.match(b.ensembleMethod,/operational time-lagged/);
 const c=await api.load({model:'rrfs',cycle:'2026-10-28T12:00:00Z',hour:5,lon:-100,lat:44});
 assert.equal(c.status,'unavailable');
 assert.equal(urlLog.filter(x=>x==='data/catalog_profiles.json').length,1,'catalog reused for window updates');
 console.log('PASS v1.1.3 real compressed native profile chunks, source/cycle/hour selection, sparse mean, Kelvin to Celsius, wind, reduced-grid sampling, absent-hour fallback');
})().catch(e=>{console.error(e);process.exitCode=1;});
