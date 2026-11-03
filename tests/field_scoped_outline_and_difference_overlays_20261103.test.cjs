'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
function part(a,b){const start=src.indexOf(a),end=src.indexOf(b,start);assert(start>=0&&end>start);return src.slice(start,end);}
test('map outline styles are isolated by model set and field',()=>{
 const ctx={st:{modelSet:'gfs-versions',field:'mslp',overlayStyles:{contours:{color:'#445566',width:1.5}},mapOutlineFieldStyles:{}}};
 vm.runInNewContext(part('function outlineStyleKey(){','function overlayStrokeWidth(')+'\nthis.lookup=overlayStyle;this.key=outlineStyleKey;',ctx);
 ctx.st.mapOutlineFieldStyles[ctx.key()]={color:'#123456',width:2.5};
 assert.equal(ctx.lookup('mapOutlines').color,'#123456');
 ctx.st.field='t850';assert.equal(ctx.lookup('mapOutlines').color,null);
 ctx.st.field='mslp';ctx.st.modelSet='rrfs-refs';assert.equal(ctx.lookup('mapOutlines').color,null);
 assert.equal(ctx.lookup('contours').color,'#445566');
 assert.match(src,/omd_evu_outline_field_styles/);
 assert.match(src,/if\(layer==='mapOutlines'\)continue/);
 assert.match(src,/overlayStyle\('mapOutlines'\),visible/);
});
test('GFS differences exclude auxiliary height, wind, and 850 hPa temperature contours in live and exported panels',()=>{
 assert.match(src,/const differencePanel=!!p\.cfg\?\.differencePanel/);
 assert.match(src,/const mslp850=!differencePanel&&plottedField==='mslp'/);
 assert.match(src,/else if\(fieldName==='mslp'&&!differencePanel\)/);
 assert.match(src,/if\(p\.cfg\?\.differencePanel\|\|!st\.overlayMSLP850/);
 assert.match(src,/if\(!p\.cfg\?\.differencePanel&&windComponentNames/);
 assert.match(src,/if\(!p\.cfg\?\.differencePanel&&heightVariableName/);
 assert.match(src,/const withMSLP850=!p\.cfg\?\.differencePanel&&plottedField==='mslp'/);
 assert.match(src,/const withHeight=Boolean\(!p\.cfg\?\.differencePanel/);
 assert.match(src,/if\(!p\.cfg\?\.differencePanel&&p\.wind&&windComponentNames/);
});
test('field-specific difference deadbands retain fixed ranges across forecast hours',()=>{
 const ctx={st:{field:'t850'}};
 vm.runInNewContext(part('const DIFFERENCE_NEUTRAL_BY_FIELD=','// Precomputed GFS comparison grids contain signed deltas')+'\nthis.cutoff=differenceNeutralThreshold;',ctx);
 assert.equal(ctx.cutoff('t850',10),1.5);
 assert.equal(ctx.cutoff('t2m',15),3);
 assert.equal(ctx.cutoff('mslp',15),2);
 assert.equal(ctx.cutoff('mslp',12),2);
 assert.equal(ctx.cutoff('wspd10',30),5);
 const limits=part('const DIFFERENCE_LIMITS=','const DIFFERENCE_TICK_STEPS=');
 assert.match(limits,/mslp:12,t2m:15/);
 assert.doesNotMatch(limits,/st\.hour|forecastHour/);
 assert.match(src,/clearZero:differenceNeutralThreshold\(st.field,range\)/);
 assert.match(src,/differenceZeroOpacity\(v,range\)/);
});
test('map toggles remain horizontal',()=>{
 assert.match(html,/id="mapOutlinesOption"/);assert.match(html,/id="mapBackgroundOption"/);
 assert.match(css,/\.map-layer-control \.overlays-switches\{display:flex;flex-direction:row;flex-wrap:nowrap/);
});
