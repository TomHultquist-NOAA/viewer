/* Validated constant-time U/V lookup on native Lambert and lat/lon grids.
 * The library's sampleField() scans all X and Y grid coordinates for each
 * sample. For a 1799x1059 grid, doing that twice per tracer per frame is
 * expensive. This module uses the same Float32 axis caches, checks only the
 * nearest neighboring indices, and validates both components against the
 * original field sampling before activation. No regridding or interpolation.
 */
(function(root){'use strict';
 const finite=Number.isFinite;
 let diagnostics={mode:'not-attempted',reason:'not-attempted'};
 function getDiagnostics(){return {...diagnostics};}
 function fail(reason){diagnostics={mode:'reference',reason};return null;}
 function build(u,v){
  if(!u||!v||typeof u.sampleField!=='function'||typeof v.sampleField!=='function')return fail('missing-fields');
  const ug=u.grid,vg=v.grid;
  if(!ug||!vg||!['lcc','latlon'].includes(ug.type)||ug.type!==vg.type||typeof ug.transform!=='function'||
     typeof ug.getGridCoords!=='function'||typeof vg.getGridCoords!=='function')return fail('unsupported-grid-type');
  const nx=ug.ni,ny=ug.nj;
  if(!Number.isInteger(nx)||!Number.isInteger(ny)||nx<4||ny<4||
     vg.ni!==nx||vg.nj!==ny||!u.data||!v.data||u.data.length!==nx*ny||v.data.length!==nx*ny)return fail('incompatible-data');
  // Compare projection-defining metadata before sharing one grid lookup for
  // U and V. A regular lat/lon grid has no Lambert projection parameters.
  const keys=ug.type==='lcc'
   ?['type','lon_0','lat_0','ll_x','ll_y','ur_x','ur_y','a','b']
   :['type','ll_lon','ll_lat','ur_lon','ur_lat'];
  for(const key of keys)if(!finite(ug[key])&&key!=='type'||ug[key]!==vg[key])return fail('different-projections');
  if(ug.type==='lcc'&&String(ug.lat_std)!==String(vg.lat_std))return fail('different-standard-latitudes');
  const uc=ug.getGridCoords(),vc=vg.getGridCoords();
  const xs=uc?.x,ys=uc?.y;
  if(!xs||!ys||xs.length!==nx||ys.length!==ny||vc?.x?.length!==nx||vc?.y?.length!==ny)return fail('missing-grid-coordinates');
  // Compare the complete cached axes once: subsequent per-particle lookups
  // reuse the common index for U and V, not two full axis searches.
  for(let i=0;i<nx;i++)if(xs[i]!==vc.x[i])return fail('different-x-axis');
  for(let j=0;j<ny;j++)if(ys[j]!==vc.y[j])return fail('different-y-axis');
  const dx=xs[1]-xs[0],dy=ys[1]-ys[0];
  if(!finite(dx)||!finite(dy)||dx<=0||dy<=0||!finite(xs[nx-1])||!finite(ys[ny-1]))return fail('unsupported-axis-order');
  const xMin=xs[0]-dx*.5,xMax=xs[nx-1]+dx*.5;
  const yMin=ys[0]-dy*.5,yMax=ys[ny-1]+dy*.5;
  function nearest(axis,value,first,step){
   const len=axis.length;
   const guess=Math.max(0,Math.min(len-1,Math.round((value-first)/step)));
   let index=guess,dist=Math.abs(axis[guess]-value);
   for(let k=Math.max(0,guess-3);k<=Math.min(len-1,guess+3);k++){
    const d=Math.abs(axis[k]-value);
    if(d<dist||(d===dist&&k<index)){dist=d;index=k;}
   }
   return index;
  }
  function sample(lon,lat,out){
   const xy=ug.transform(lon,lat),x=xy[0],y=xy[1];
   if(!finite(x)||!finite(y)||x<xMin||x>xMax||y<yMin||y>yMax){out[0]=NaN;out[1]=NaN;return out;}
   const i=nearest(xs,x,xs[0],dx),j=nearest(ys,y,ys[0],dy),idx=i+j*nx;
   out[0]=u.data[idx];out[1]=v.data[idx];return out;
  }
  // Deliberately exercise interior, boundaries, and half-cell positions.
  // Native sampleField is authoritative: even one mismatch rejects fast mode.
  const results=[NaN,NaN];let checked=0;
  const ix=[.01,.12,.27,.49,.66,.84,.98],iy=[.02,.19,.43,.71,.97];
  try{
   for(const a of ix)for(const b of iy){
    const i=Math.min(nx-2,Math.floor(a*(nx-1)));
    const j=Math.min(ny-2,Math.floor(b*(ny-1)));
    for(const shift of [0,.46]){
     const [lon,lat]=ug.transform(xs[i]+dx*shift,ys[j]+dy*shift,{inverse:true});
     const sampleU=u.sampleField(lon,lat),sampleV=v.sampleField(lon,lat);
     sample(lon,lat,results);
     const equal=(a,b)=>a===b||(Number.isNaN(a)&&Number.isNaN(b));
     if(!equal(results[0],sampleU)||!equal(results[1],sampleV))return fail('reference-calibration-mismatch');
     checked++;
    }
   }
  }catch(_){return fail('reference-calibration-error');}
  if(checked<20)return fail('too-few-probes');
  diagnostics={mode:'validated-native-wind',reason:'validated',gridType:ug.type,nx,ny,probes:checked};
  return {sample,mode:'validated-native-wind',gridType:ug.type,probes:checked};
 }
 root.EVUFastWindSampler={build,getDiagnostics};
 if(typeof module==='object'&&module.exports)module.exports={build,getDiagnostics};
})(typeof window==='object'?window:globalThis);
