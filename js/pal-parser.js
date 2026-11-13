/* Weather .pal file parser; pure and usable in browser and Node tests.
   GRLevelX/RadarScope Color/SolidColor/Color4/SolidColor4 plus plain numeric
   value RGB(A), value #RRGGBB[AA] entries. No evaluation or network access. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.EVUPalParser=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const MAX_TEXT=65536,MAX_LINES=2048,MAX_STOPS=512;
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const byte=s=>/^(?:\d{1,3})$/.test(s)&&+s<=255?+s:null;
 const hx=x=>Math.round(x).toString(16).padStart(2,'0');
 function rgba(hex){
  const m=String(hex).match(/^#([a-fA-F0-9]{6})([a-fA-F0-9]{2})?$/);
  if(!m)throw Error('Expected a #RRGGBB or #RRGGBBAA color');
  const h=m[1],alpha=m[2];
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)).concat(alpha===undefined?255:parseInt(alpha,16));
 }
 function hex(rgba){return '#'+rgba.map(hx).join('').replace(/ff$/,'').toLowerCase();}
 function parseColorValues(tokens,withAlpha){
  if(tokens.length===1&&/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(tokens[0]))return rgba(tokens[0]);
  const n=withAlpha?4:3;
  if(tokens.length!==n)throw Error('Expected '+n+' color components (0–255)');
  const vals=tokens.map(byte);
  if(vals.some(v=>v===null))throw Error('RGB(A) components must be integers from 0 to 255');
  return withAlpha?vals:[...vals,255];
 }
 function validate(entries){
  if(!Array.isArray(entries)||entries.length<2||entries.length>MAX_STOPS)throw Error('A palette needs 2–512 distinct color stops');
  let previous=-Infinity;
  for(const e of entries){
   if(!e||!finite(e.value)||e.value<=previous||Math.abs(e.value)>1e9||!['linear','solid'].includes(e.kind))throw Error('Invalid or out-of-order .pal value');
   rgba(e.color);
   if(e.end)rgba(e.end);
   previous=e.value;
  }
  return entries;
 }
 function parse(text,name='Custom .pal'){
  if(typeof text!=='string'||text.length>MAX_TEXT)throw Error('Palette file must be plain text under 64 KB');
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/);
  if(lines.length>MAX_LINES)throw Error('Too many lines in palette file');
  const stops=[];
  for(let i=0;i<lines.length;i++){
   const line=lines[i].replace(/[;#](?=\s|$).*$/,'').trim();
   if(!line||line.startsWith(';')||line.startsWith('//')||line.startsWith('#'))continue;
   let kind='linear',withAlpha=false,body=line;
   const tagged=line.match(/^(Color4|SolidColor4|Color|SolidColor)\s*:\s*(.*)$/i);
   if(tagged){kind=tagged[1].toLowerCase().startsWith('solid')?'solid':'linear';withAlpha=/4$/i.test(tagged[1]);body=tagged[2];}
   else if(/^[a-z][\w\s-]*\s*:/i.test(line))continue; // metadata e.g. Product:, Units:
   else if(!/^[+\-\d.]/.test(line))continue;
   const tokens=body.split(/[\s,]+/).filter(Boolean);
   const value=Number(tokens.shift());
   if(!finite(value)||Math.abs(value)>1e9)throw Error('Invalid data value at line '+(i+1));
   let color,end=null;
   try{
    if(tokens.length===1&&tokens[0].startsWith('#'))color=hex(parseColorValues(tokens,false));
    else{
     const stride=withAlpha?4:3;
     // Untagged numeric entries can provide an alpha channel, but tagged Color
     // uses trailing RGB triples for its optional gradient endpoint.
     if(!tagged&&tokens.length===4)withAlpha=true;
     const count=withAlpha?4:3;
     if(tokens.length!==count&&tokens.length!==count*2)throw Error('Expected RGB(A) or two RGB(A) stops');
     color=hex(parseColorValues(tokens.slice(0,count),withAlpha));
     if(tokens.length===count*2)end=hex(parseColorValues(tokens.slice(count),withAlpha));
    }
   }catch(e){throw Error('Invalid .pal color at line '+(i+1)+': '+e.message);}
   stops.push({value,kind,color,...(end?{end}:{})});
   if(stops.length>MAX_STOPS)throw Error('Palette exceeds 512 color stops');
  }
  stops.sort((a,b)=>a.value-b.value);
  // A repeated value is a legitimate hard boundary in some GRLevelX tables;
  // retain the final instruction for that value.
  const unique=[];
  for(const stop of stops){if(unique.length&&unique.at(-1).value===stop.value)unique[unique.length-1]=stop;else unique.push(stop);}
  validate(unique);
  return {name:String(name).slice(0,100),stops:unique};
 }
 function interp(a,b,t){const first=rgba(a),last=rgba(b);return hex(first.map((v,i)=>Math.round(v+(last[i]-v)*t)));}
 function toPalette(palette,samples=192){
  const stops=validate(palette?.stops),count=Math.max(32,Math.min(256,Math.round(Number(samples)||256)));
  const min=stops[0].value,max=stops.at(-1).value;
  const levels=Array.from({length:count+1},(_,i)=>i===count?max:min+(max-min)*i/count);
  const colors=Array.from({length:count},(_,i)=>{
   const x=(levels[i]+levels[i+1])/2;
   let j=0;while(j<stops.length-2&&x>=stops[j+1].value)j++;
   const start=stops[j],next=stops[j+1];
   if(start.kind==='solid')return start.color;
   return interp(start.color,start.end||next.color,Math.max(0,Math.min(1,(x-start.value)/(next.value-start.value))));
  });
  return {levels,colors};
 }
 return {parse,validate,toPalette};
});
