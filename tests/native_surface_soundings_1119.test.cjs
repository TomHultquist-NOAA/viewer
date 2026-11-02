'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const zlib=require('node:zlib');
const ROOT=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'js/sounding-profiles.js'),'utf8');
const painter=fs.readFileSync(path.join(ROOT,'js/point-inspector.js'),'utf8');
assert.match(painter,/summary\.surfacePressure/);
assert.match(painter,/p0=summary\.terrainScreened/);
assert.match(painter,/if\(p>p0\)continue/);
const ds={path:'sounding_rrfs_20261028_1200.zarr',model:'rrfs',init_time:'2026-10-28T12:00:00Z',
 available_hours:[0],variables:['t','td','u','v','sp','t2m','td2m'].map(name=>({name}))};
const catalog={schema:'omd-evu-sounding-profile-1',datasets:[ds]};
const compressed=new Map();
const profile={t:[285,278,265],td:[277,269,254],u:[6,9,15],v:[-3,-5,-8]};
for(const [name,values] of Object.entries(profile)){
 const data=new Float32Array(3*2*2);
 values.forEach((v,k)=>data.fill(v,k*4,k*4+4));
 compressed.set(`data/${ds.path}/${name}/0.0.0.0`,zlib.deflateSync(Buffer.from(data.buffer)));
}
for(const [name,v] of [['sp',80000],['t2m',289],['td2m',281]]){
 const data=new Float32Array(4).fill(v);
 compressed.set(`data/${ds.path}/${name}/0.0.0`,zlib.deflateSync(Buffer.from(data.buffer)));
}
const fetchMock=async u=>{
 const name=new URL(u).pathname.slice(1);
 if(name==='data/catalog_profiles.json')return new Response(JSON.stringify(catalog));
 if(name.endsWith('/.zattrs'))return new Response(JSON.stringify({GRIB_gridType:'lambert',GRIB_Nx:2,GRIB_Ny:2,
    GRIB_DxInMetres:48000,grid_order:'WE:SN',pressure_levels_hpa:[1000,850,700]}));
 if(name.endsWith('/t/.zarray'))return new Response(JSON.stringify({shape:[1,3,2,2],chunks:[1,3,2,2],dtype:'<f4',order:'C',compressor:{id:'zlib'}}));
 if(compressed.has(name))return new Response(compressed.get(name));
 return new Response('not found',{status:404});
};
const win={};const ctx=vm.createContext({window:win,document:{baseURI:'https://test.invalid/'},
 fetch:fetchMock,Response,URL,DecompressionStream,Float32Array,Map,Promise,console,
 gridFromDataset:()=>({}),apgl:{RawScalarField:class{constructor(grid,data){this.data=data;}sampleField(){return this.data[0];}}}});
vm.runInContext(src,ctx);
(async()=>{
 const result=await win.EVUSoundingProfiles.load({model:'rrfs',cycle:ds.init_time,hour:0,lon:-100,lat:40});
 assert.equal(result.status,'available');
 assert.equal(result.terrainScreened,true);
 assert.equal(result.surfacePressure,800);
 assert.equal(result.rows.length,2,'1000 and 850 hPa are below terrain');
 assert.equal(result.rows[0].p,800);
 assert.equal(result.rows[0].surface,true);
 assert.ok(Math.abs(result.rows[0].t-15.85)<0.001);
 assert.ok(Math.abs(result.rows[0].td-7.85)<0.001);
 assert.equal(result.rows[0].u,null,'do not invent surface winds');
 assert.equal(result.rows[1].p,700);
 console.log('PASS native 800 hPa surface, 2m T/Td at ground, below-ground screening');
})().catch(e=>{console.error(e);process.exitCode=1;});
