/* Lightweight, browser-only approximate parcel thermodynamics for sounding display.
 * This is a qualitative pseudo-adiabatic parcel trace, NOT an operational CAPE/CIN
 * calculation. Uses only existing native T/Td pressure samples; missing values
 * and sparse moisture profiles never generate synthetic parcel origins.
 */
(()=>{
 'use strict';
 const good=x=>Number.isFinite(x);
 const EPS=.622, RD=287.05, CP=1004.0, LV=2.5e6, KAPPA=RD/CP;
 const satVaporPressure=tk=>6.112*Math.exp(17.67*(tk-273.15)/(tk-29.65));
 function lcl(start){
  const t=start.t+273.15,td=Math.min(t,start.td+273.15);
  if(t<170||td<170||td>t||start.p<=0)return null;
  const tlcl=1/(1/(td-56)+Math.log(t/td)/800)+56;
  return {p:start.p*Math.pow(tlcl/t,1/KAPPA),t:tlcl};
 }
 // Bolton (1980) approximation; theta-e selects the largest value within
 // the lowest 300-hPa layer, matching conventional MU-parcel selection.
 function thetaE(row){
  if(!good(row.p)||!good(row.t)||!good(row.td)||row.p<200||row.p>1100)return null;
  const l=lcl(row);if(!l)return null;
  const tk=row.t+273.15,e=Math.min(row.p*.95,satVaporPressure(row.td+273.15));
  const r=EPS*e/(row.p-e),pd=row.p-e;
  if(!good(r)||r<0||r>.08||pd<=0)return null;
  return tk*Math.pow(1000/pd,KAPPA*(1-.28*r))*Math.exp((3376/l.t-2.54)*r*(1+.81*r));
 }
 function moistDerivative(tk,p){
  const es=Math.min(p*.9,satVaporPressure(tk)),rs=EPS*es/Math.max(1e-6,p-es);
  return (RD*tk+LV*rs)/(CP+LV*LV*rs*EPS/(RD*tk*tk))/p;
 }
 // RK4 integration in pressure (hPa); units cancel because dT/dp ~ 1/p.
 function moistFrom(tk,startP,endP){
  let p=startP,t=tk;
  if(endP>=startP)return tk;
  const count=Math.max(1,Math.ceil((startP-endP)/2));
  const dp=(endP-startP)/count;
  for(let i=0;i<count;i++){
   const k1=moistDerivative(t,p),k2=moistDerivative(t+dp*k1/2,p+dp/2);
   const k3=moistDerivative(t+dp*k2/2,p+dp/2),k4=moistDerivative(t+dp*k3,p+dp);
   t+=dp*(k1+2*k2+2*k3+k4)/6;p+=dp;
   if(!good(t)||t<145||t>370)return null;
  }
  return t;
 }
 function mostUnstableParcel(rows,{sparse=false}={}){
  if(sparse)return null;
  const sorted=(rows||[]).filter(r=>good(r?.p)&&r.p>=100&&r.p<=1050&&good(r.t))
   .sort((a,b)=>b.p-a.p);
  const wet=sorted.filter(r=>good(r.td)&&r.td<=r.t+2&&r.td>-110&&r.t<70);
  if(wet.length<3||sorted.length<6)return null;
  const bottom=wet[0].p;
  const layer=wet.filter(r=>r.p>=bottom-300);
  // Sparse and disconnected moisture profiles are not suitable for a parcel.
  if(layer.length<3||bottom-layer[layer.length-1].p<75)return null;
  let best=null,bestE=-Infinity;
  for(const r of layer){const e=thetaE(r);if(good(e)&&e>bestE){best=r;bestE=e;}}
  if(!best)return null;
  const lift=lcl(best);if(!lift||!good(lift.p)||lift.p<100)return null;
  const top=Math.max(100,sorted[sorted.length-1].p);
  const points=[{p:best.p,t:best.t}];
  let prevP=lift.p,prevT=lift.t;
  for(let p=best.p-10;p>top;p-=10){
   const tk=p>=lift.p?(best.t+273.15)*Math.pow(p/best.p,KAPPA):moistFrom(prevT,prevP,p);
   if(!good(tk))return null;
   points.push({p,t:tk-273.15});
   if(p<lift.p){prevP=p;prevT=tk;}
  }
  if(points[points.length-1].p>top+1){
   const tk=top>=lift.p?(best.t+273.15)*Math.pow(top/best.p,KAPPA):moistFrom(prevT,prevP,top);
   if(good(tk))points.push({p:top,t:tk-273.15});
  }
  return {sourcePressure:best.p,lclPressure:lift.p,lclTemperature:lift.t-273.15,
   thetaE:bestE,points,approximate:true};
 }
 window.EVUSoundingThermo={mostUnstableParcel,thetaE,lcl};
})();
