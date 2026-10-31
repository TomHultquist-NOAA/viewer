'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),js=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
for(const id of ['legendRangePopup','legendRangeForm','legendMinSlider','legendMaxSlider','legendMinNumber','legendMaxNumber','legendRangeApplyBtn','legendRangeResetBtn','legendCancelBtn','legendResetBtn'])assert.ok(html.includes(`id="${id}"`),id);
assert.match(html,/<dialog id="legendRangePopup"/);
assert.match(css,/\.shared-legend-canvas\.scale-adjustable/);
assert.match(js,/const cmap=makeColormap\(m,v\)/);
assert.match(js,/for\(const p of st.panels\)p.lastKey=null;/);
assert.match(js,/function sharedPalette\(\)[\s\S]*?palette:pal\(m,v\)/);
const helper=js.slice(js.indexOf('function sampledColors('),js.indexOf('function imageColorAlpha('));
function mkInput(){return {value:'',min:'',max:'',step:'',focus(){},select(){},addEventListener(){}};}
const dlg={hidden:true,open:false,dataset:{},showModal(){this.open=true;},close(){this.open=false;},addEventListener(){}};
const el={legendRangePopup:dlg,legendRangeForm:{addEventListener(){}},legendRangeMessage:{textContent:''},legendRangeError:{hidden:true},legendRangeApplyBtn:{disabled:false},legendMinSlider:mkInput(),legendMaxSlider:mkInput(),legendMinNumber:mkInput(),legendMaxNumber:mkInput()};
const ctx=vm.createContext({Map,Math,Number,Error,Float32Array,el});
vm.runInContext(`
const st={field:'snow6h',colorRanges:new Map(),legendSelection:null,panels:[{lastKey:'previous'}]};
const RAIN_COLORS=['#0000ff','#00aaff','#ffaa00','#ff0000'];
const PTYPE=['#000000','#00ff00','#0000ff','#ff0000','#ff00ff','#ffff00'];
let redrawn=0,renders=0;
function updateSharedLegend(){redrawn++;}
function renderAll(){renders++;}
${helper}
`,ctx);
ctx.scalar={levels:[.1,.5,1,2,5],bandColors:['#0000ff','#00aaff','#ffaa00','#ff0000'],label:'6-hour snowfall',unit:'in'};
const initial=vm.runInContext('pal(scalar,{name:"snow6h"})',ctx);
assert.deepEqual(Array.from(initial.levels),[.1,.5,1,2,5]);
vm.runInContext('openLegendRangeEditor(scalar)',ctx);
assert.equal(dlg.open,true);
assert.equal(el.legendMinNumber.value,'0.1');assert.equal(el.legendMaxNumber.value,'5');
el.legendMinNumber.value='.5';el.legendMaxNumber.value='.25';
assert.equal(vm.runInContext('validateLegendEditor()',ctx),false,'maximum below minimum must fail');
assert.equal(el.legendRangeApplyBtn.disabled,true);
vm.runInContext('applyLegendRangeEditor()',ctx);
assert.equal(vm.runInContext('st.colorRanges.size',ctx),0);
el.legendMaxNumber.value='2';
vm.runInContext('applyLegendRangeEditor()',ctx);
assert.equal(dlg.open,false);assert.equal(el.legendRangePopup.hidden,true);
const custom=vm.runInContext('pal(scalar,{})',ctx);
assert.equal(custom.levels[0],.5);assert.equal(custom.levels[custom.levels.length-1],2);
assert.deepEqual(Array.from(custom.colors),Array.from(initial.colors));
assert.equal(vm.runInContext('st.panels[0].lastKey',ctx),null);
assert.equal(vm.runInContext('renders',ctx),1);
// Cancel must preserve the previous custom range.
vm.runInContext('openLegendRangeEditor(scalar)',ctx);
el.legendMinNumber.value='1';vm.runInContext('cancelLegendRangeSelection()',ctx);
assert.equal(vm.runInContext('st.colorRanges.get("snow6h").min',ctx),.5);
assert.equal(dlg.open,false);
assert.equal(vm.runInContext('adjustableColorbar({ptype:true})',ctx),false);
assert.equal(vm.runInContext('adjustableColorbar({category:"#fff"})',ctx),false);
vm.runInContext('st.field="ptype";st.colorRanges.set("ptype",{min:2,max:4})',ctx);
assert.deepEqual(Array.from(vm.runInContext('pal({ptype:true},{})',ctx).levels),[.5,1.5,2.5,3.5,4.5,5.5]);
const guide=fs.readFileSync(path.join(root,'USER_GUIDE.md'),'utf8');
assert.match(guide,/Adjust the numerical colorbar/);
assert.match(guide,/sliders/i);
assert.match(guide,/Cancel/);
console.log('PASS modal min/max sliders and entry boxes, apply, validation, cancel, unchanged categorical palettes, data preservation');
