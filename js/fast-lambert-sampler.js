/* High-speed, fail-closed Lambert texture sampling for the OMD EVU viewer.
 *
 * autumnplot-gl's LambertGrid.fromLLCornerLonLat creates the upper-right
 * projected bounds as (ll_x + ni * dx, ll_y + nj * dy), but its coordinate
 * cache distributes ni/nj grid points across those bounds using (ni-1) and
 * (nj-1) intervals. Therefore its actual grid-point spacing is
 * dx * ni/(ni-1), dy * nj/(nj-1), NOT simply GRIB Dx/Dy.
 *
 * RawScalarField.sampleField() selects the nearest native grid point. We
 * match this behavior and validate against the live reference sampler.
 * Compatibility with already-supported conventional dx grids is retained
 * via a second, individually validated candidate. No unvalidated fast mode.
 */
(function(root){'use strict';
 const DEG=Math.PI/180,PI=Math.PI,EARTH=6371229;
 let lastDiagnostics={result:'not-attempted',reason:'not-attempted'};
 const reject=(reason,details={})=>{lastDiagnostics={result:'reference',reason,...details};return null;};
 const finite=Number.isFinite;
 function getDiagnostics(){return {...lastDiagnostics};}
 function build(grid,values,nx,ny,reference,options={}){
  const gridType=String(grid?.GRIB_gridType||grid?.gridType||'').toLowerCase();
  if(gridType!=='lambert')return reject('not-lambert',{gridType});
  if(!values||values.length!==nx*ny||typeof reference!=='function'||nx<4||ny<4)
   return reject('missing-values-or-dimensions',{nx,ny,valuesLength:values?.length});
  const val=(key,fallback)=>Number(grid?.['GRIB_'+key]??grid?.[key]??fallback);
  // These fallbacks match gridFromDataset in the operational viewer.
  const lon0=val('LoVInDegrees',-97.5),lat0=val('LaDInDegrees',38.5),
   latin1=val('Latin1InDegrees',38.5),latin2=val('Latin2InDegrees',38.5),
   lonFirst=val('longitudeOfFirstGridPointInDegrees',-122.719528),
   latFirst=val('latitudeOfFirstGridPointInDegrees',21.138123),
   dx=val('DxInMetres',3000),dy=val('DyInMetres',3000);
  if(![lon0,lat0,latin1,latin2,lonFirst,latFirst,dx,dy].every(finite)||dx<=0||dy<=0)
   return reject('invalid-lambert-metadata',{lon0,lat0,latin1,latin2,lonFirst,latFirst,dx,dy});
  const earth=Number(options.earthRadiusM||EARTH);
  if(!finite(earth)||earth<6000000||earth>7000000)return reject('invalid-earth-radius',{earth});
  const phi1=latin1*DEG,phi2=latin2*DEG,t=phi=>Math.tan(PI/4+phi/2);
  const n=Math.abs(latin1-latin2)<1e-7?Math.sin(phi1):
   Math.log(Math.cos(phi1)/Math.cos(phi2))/Math.log(t(phi2)/t(phi1));
  if(!finite(n)||n<=1e-6)return reject('unsupported-cone',{n});
  const fr=earth*Math.cos(phi1)*Math.pow(t(phi1),n)/n;
  const rho0=fr/Math.pow(t(lat0*DEG),n);
  const rhoFirst=fr/Math.pow(t(latFirst*DEG),n),theta0=n*(lonFirst-lon0)*DEG;
  const x0=rhoFirst*Math.sin(theta0),y0=rho0-rhoFirst*Math.cos(theta0),lon0r=lon0*DEG;
  const ix=[.11,.24,.39,.54,.72,.87],iy=[.12,.29,.46,.66,.83];
  // The first candidate reproduces autumnplot-gl's actual GridCoordinates;
  // conventional spacing is supported only after independent calibration.
  const candidates=[
   {name:'autumnplot-grid-extent',stepX:dx*nx/(nx-1),stepY:dy*ny/(ny-1)},
   {name:'direct-grib-spacing',stepX:dx,stepY:dy}
  ];
  const trials=[];
  for(const candidate of candidates){
   const {stepX,stepY}=candidate;
   const errors=[0,0,0,0],counts=[0,0,0,0],probes=[];
   let valid=0;
   for(const yy of iy)for(const xx of ix){
    const i=Math.round(xx*(nx-1)),j=Math.round(yy*(ny-1));
    const x=x0+i*stepX,y=y0+j*stepY,rho=Math.hypot(x,rho0-y);
    const lat=(2*Math.atan(Math.pow(fr/rho,1/n))-PI/2)/DEG;
    const lon=(lon0r+Math.atan2(x,rho0-y)/n)/DEG;
    if(!finite(lon)||!finite(lat))continue;
    let actual;try{actual=reference(lon,lat);}catch(_){continue;}
    if(!finite(actual)||Math.abs(actual)>1e20)continue;
    valid++;probes.push([i,j,actual]);
    for(let mode=0;mode<4;mode++){
     const k=(mode&2?ny-1-j:j)*nx+(mode&1?nx-1-i:i),pred=values[k];
     if(!finite(pred)||Math.abs(pred)>1e20)continue;
     errors[mode]+=Math.abs(pred-actual)/(1+Math.abs(actual));counts[mode]++;
    }
   }
   let mode=-1,best=Infinity;
   for(let m=0;m<4;m++)if(counts[m]>=valid*.85&&counts[m]>0){
    const error=errors[m]/counts[m];if(error<best){best=error;mode=m;}
   }
   trials.push({...candidate,errors,counts,probes,valid,mode,best});
  }
  // A correct grid convention and orientation must pass independently. A
  // superficially similar value field never justifies increasing tolerance.
  const good=trials.filter(c=>c.valid>=8&&c.mode>=0&&c.best<=.0006);
  const candidate=good.sort((a,b)=>a.best-b.best)[0];
  if(!candidate){
   const best=trials.slice().sort((a,b)=>a.best-b.best)[0];
   if(best.valid<8)return reject('too-few-valid-grid-probes',{valid:best.valid,nx,ny,conventions:trials.map(c=>({name:c.name,best:c.best,valid:c.valid}))});
   return reject('grid-calibration-mismatch',{mode:best.mode,best:best.best,valid:best.valid,
    errors:best.errors,counts:best.counts,nx,ny,earth,conventions:trials.map(c=>({name:c.name,best:c.best,valid:c.valid}))});
  }
  const {stepX,stepY,mode}=candidate;
  // autumnplot-gl's GridCoordinates cache is Float32Array, and its
  // RawScalarField.sampleField() chooses the nearest cached axis coordinate.
  // Using round((x-x0)/stepX) alone can disagree at half-cell boundaries
  // because those cached coordinates are float32-rounded. Inspect just the
  // neighbors of the estimated index, not the entire 1799x1059 grid.
  const xs=Float32Array.from({length:nx},(_,i)=>x0+i*stepX);
  const ys=Float32Array.from({length:ny},(_,j)=>y0+j*stepY);
  function nearestIndex(axis,pos,first,step){
   const approx=Math.max(0,Math.min(axis.length-1,Math.round((pos-first)/step)));
   let best=approx,distance=Math.abs(axis[approx]-pos);
   for(let i=Math.max(0,approx-2);i<=Math.min(axis.length-1,approx+2);i++){
    const delta=Math.abs(axis[i]-pos);
    if(delta<distance||(delta===distance&&i<best)){best=i;distance=delta;}
   }
   return best;
  }
  const at=(i,j)=>values[(mode&2?ny-1-j:j)*nx+(mode&1?nx-1-i:i)];
  function nativeAt(x,y,interpolate){
   if(!finite(x)||!finite(y))return NaN;
   if(!interpolate){
    const xp=x0+x*stepX,yp=y0+y*stepY;
    // Match the real float32 grid cache's border and nearest-node rules.
    if(xp<xs[0]-(xs[1]-xs[0])*.5||xp>xs[nx-1]+(xs[1]-xs[0])*.5||
       yp<ys[0]-(ys[1]-ys[0])*.5||yp>ys[ny-1]+(ys[1]-ys[0])*.5)return NaN;
    const v=at(nearestIndex(xs,xp,xs[0],stepX),nearestIndex(ys,yp,ys[0],stepY));
    return finite(v)&&v>-1e20?v:NaN;
   }
   if(x<0||y<0||x>nx-1||y>ny-1)return NaN;
   const i=Math.min(nx-2,Math.floor(x)),j=Math.min(ny-2,Math.floor(y)),a=x-i,b=y-j;
   const v0=at(i,j),v1=at(i+1,j),v2=at(i,j+1),v3=at(i+1,j+1);
   if(![v0,v1,v2,v3].every(v=>finite(v)&&v>-1e20))return NaN;
   return (v0*(1-a)+v1*a)*(1-b)+(v2*(1-a)+v3*a)*b;
  }
  function gridToLonLat(i,j){
   const x=x0+i*stepX,y=y0+j*stepY,rho=Math.hypot(x,rho0-y);
   return {lon:(lon0r+Math.atan2(x,rho0-y)/n)/DEG,
    lat:(2*Math.atan(Math.pow(fr/rho,1/n))-PI/2)/DEG};
  }
  let nearestError=0,linearError=0,used=0;
  for(const [i,j] of candidate.probes){
   const xy=gridToLonLat(i+.37,j+.29);
   let expected;try{expected=reference(xy.lon,xy.lat);}catch(_){continue;}
   if(!finite(expected))continue;
   const near=nativeAt(i+.37,j+.29,false),linear=nativeAt(i+.37,j+.29,true);
   if(!finite(near)||!finite(linear))continue;
   const norm=1+Math.abs(expected);
   nearestError+=Math.abs(near-expected)/norm;
   linearError+=Math.abs(linear-expected)/norm;
   used++;
  }
  if(used<6)return reject('too-few-interpolation-probes',{used,valid:candidate.valid,mode,convention:candidate.name});
  const interpolate=linearError<nearestError;
  if(Math.min(linearError,nearestError)/used>.001)
   return reject('interpolation-mismatch',{used,linearError:linearError/used,nearestError:nearestError/used,mode,convention:candidate.name});
  // Avoid recomputing trigonometric coordinates for every texture row: the
  // longitude transform depends only on each column and latitude only on row.
  let thetaKey=null,thetaS=null,thetaC=null;
  function cell(lon,lat){
   const angle=n*Math.atan2(Math.sin(lon*DEG-lon0r),Math.cos(lon*DEG-lon0r));
   const rho=fr/Math.pow(t(lat*DEG),n);
   return [(rho*Math.sin(angle)-x0)/stepX,(rho0-rho*Math.cos(angle)-y0)/stepY];
  }
  // referenceInterpolate describes the validation source (normally nearest for
  // autumnplot-gl RawScalarField). The terrain display may independently
  // request bilinear SCALAR interpolation for a continuous field. Interpolate
  // values before applying the color palette, not just the final RGBA texels.
  function sampleRow(lons,lat,smooth=interpolate){
   if(lons!==thetaKey){
    thetaKey=lons;thetaS=new Float64Array(lons.length);thetaC=new Float64Array(lons.length);
    for(let i=0;i<lons.length;i++){
     const angle=n*Math.atan2(Math.sin(lons[i]*DEG-lon0r),Math.cos(lons[i]*DEG-lon0r));
     thetaS[i]=Math.sin(angle);thetaC[i]=Math.cos(angle);
    }
   }
   const out=new Float64Array(lons.length),rho=fr/Math.pow(t(lat*DEG),n);
   for(let i=0;i<lons.length;i++)
    out[i]=nativeAt((rho*thetaS[i]-x0)/stepX,(rho0-rho*thetaC[i]-y0)/stepY,!!smooth);
   return out;
  }
  function sample(lon,lat,smooth=interpolate){const [x,y]=cell(lon,lat);return nativeAt(x,y,!!smooth);}
  lastDiagnostics={result:'validated-lambert-row',reason:'validated',mode,interpolate,
   convention:candidate.name,probeCount:candidate.valid,calibrationError:candidate.best,earth,nx,ny,
   testedConventions:trials.map(c=>({name:c.name,best:c.best,valid:c.valid}))};
  return {sample,sampleRow,mode,interpolate,convention:candidate.name,
   probeCount:candidate.valid,calibrationError:candidate.best};
 }
 root.EVUFastLambertSampler={build,getDiagnostics};
 if(typeof module==='object'&&module.exports)module.exports={build,getDiagnostics};
})(typeof window==='object'?window:globalThis);
