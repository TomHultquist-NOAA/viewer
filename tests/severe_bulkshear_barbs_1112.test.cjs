'use strict';
// Regression: shear must be painted with the same knot-based wind-barb glyph
// as storm motion, NOT a directional arrow.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const start=code.indexOf('function drawWindBarbs(');
const end=code.indexOf('// Keep tiny temporary-CSS glyphs legible',start);
assert(start>0&&end>start);
const recorded=[];
const sandbox={
 console,window:{devicePixelRatio:1},st:{cfg:{display:{windBarbSizePx:18}}},
 globeFrontVisible:()=>true,barbSpacing:()=>100,
 windComponentNames:()=>['u','v'],overlayWindVisible:()=>true,
 paintBarb:(...args)=>recorded.push(args),
};
vm.createContext(sandbox);
vm.runInContext(code.slice(start,end),sandbox);
// The map's only sampling position is centered at 25,25. A local +east
// direction projects right, while local +north projects upward.
const map={
 getCanvas:()=>({clientWidth:50,clientHeight:50}),
 getZoom:()=>4,
 unproject:()=>({lng:0,lat:0}),
 project:([lon,lat])=>({x:25+lon*250,y:25-lat*250}),
};
const canvasContext={setTransform(){},clearRect(){}};
const panel={map,windCanvas:{width:0,height:0,getContext:()=>canvasContext},view:{},cfg:{field:'shear06'},wind:{
 u:{sampleField:()=>10},v:{sampleField:()=>0}
}};
sandbox.drawWindBarbs(panel);
assert.equal(recorded.length,1,'Shear should render one barb');
let [ctx,x,y,dx,dy,speed,size]=recorded.pop();
assert.equal(ctx,canvasContext);
assert.equal(x,25);assert.equal(y,25);
assert.ok(dx<0&&Math.abs(dy)<1e-9,'Eastward downshear must produce a west-pointing barb shaft');
assert.ok(Math.abs(speed-19.4384449)<1e-5,'Shear speed must be converted from m/s to knots');
assert.equal(size,18);
panel.cfg.field='srh03';panel.wind={u:{sampleField:()=>0},v:{sampleField:()=>15}};
sandbox.drawWindBarbs(panel);
assert.equal(recorded.length,1,'Right-moving storm motion should render one barb');
[ctx,x,y,dx,dy,speed,size]=recorded.pop();
assert.ok(Math.abs(dx)<1e-9&&dy>0,'Northward storm motion should produce a south-pointing barb shaft');
assert.ok(Math.abs(speed-29.15766735)<1e-5);
assert.doesNotMatch(code,/paintShearArrow/);
assert.match(code,/shear barbs/);
console.log('PASS shear barbs, SRH right-moving storm-motion barbs, knot speed and direction');
