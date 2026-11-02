'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
const guide=fs.readFileSync(path.join(root,'USER_GUIDE.md'),'utf8');
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');

assert.match(html,/<input type="checkbox" id="interpolateToggleBtn">/,'toggle must be unchecked by default');
assert.match(html,/id="interpolateToggleBtn"[^>]*>/);
assert.match(html,/js\/viewer\.js\?v=1\.1\.35-20261102/,'viewer cache token must change');
assert.match(css,/\.interpolation-control/);
assert.match(js,/localStorage\.getItem\('omd_evu_interpolate'\)/);
assert.match(js,/localStorage\.setItem\('omd_evu_interpolate'/);
assert.match(js,/interpolationSaved==='1'/,'only explicit saved-on preference enables interpolation');
assert.match(js,/p\.interpolationEligible=klass===apgl\.Raster&&!m\.category&&!m\.ptype&&!m\.ptypeReflectivity/,
  'only continuous Raster fields can be interpolated');
assert.match(js,/if\(!p\.map\|\|!p\.component\|\|!p\.interpolationEligible\|\|p\.status!=='ready'\)continue/,
  'toggle should update already-rendered eligible panels only');
assert.match(js,/gl\.texParameteri\(gl\.TEXTURE_2D,gl\.TEXTURE_MAG_FILTER,filter\)/,
  'toggle must update the actual GPU texture magnification filter');
assert.match(js,/gl\.texParameteri\(gl\.TEXTURE_2D,gl\.TEXTURE_MIN_FILTER,filter\)/,
  'toggle must update the actual GPU texture minification filter');
assert.match(js,/this\.image_mag_filter=\(p\.interpolationEligible&&st\.interpolate\)\?gl\.LINEAR:gl\.NEAREST/,
  'GPU texture sampler must switch between bilinear and nearest');
assert.match(js,/component\.updateField=async function\(field,mask\)/,
  'initial Raster.onAdd updateField must also use the selected filter');
assert.match(guide,/Optional grid interpolation/);
assert.match(guide,/off by default/);
assert.match(guide,/nearest-neighbor rendering/);
assert.match(readme,/Optional grid interpolation/);
assert.match(readme,/off by default/);
assert.match(readme,/RELEASE_1_1_34\.md/,'README must link to the current release note');
assert.doesNotMatch(readme,/RELEASE_1_1_31\.md/,'README must not link to an excluded superseded release note');

// Exercise the actual WebGL sampler-parameter update, not just the requested
// image_mag_filter property. Existing WGLTexture objects expose activate and
// deactivate; setImageData alone does not change their filter parameters.
const ctx=vm.createContext({st:{interpolate:true}});
const helperStart=js.indexOf('function applyRasterInterpolationFilter(');
const helperEnd=js.indexOf('function installRasterInterpolation(',helperStart);
assert(helperStart>=0&&helperEnd>helperStart,'actual GPU filter helper must exist');
vm.runInContext(js.slice(helperStart,helperEnd),ctx);
const calls=[],activated=[];
const gl={TEXTURE_2D:3553,TEXTURE_MAG_FILTER:10240,TEXTURE_MIN_FILTER:10241,
  LINEAR:9729,NEAREST:9728,
  texParameteri(target,param,value){calls.push({target,param,value});}};
function texture(name){return {activate(unit){activated.push(['activate',name,unit]);},
  deactivate(){activated.push(['deactivate',name]);}};}
const map={repaints:0,triggerRepaint(){this.repaints++;}};
const component={gl_elems:{gl,map},fill_texture:new Map([['_0',texture('scalar-0')],['_1',texture('scalar-1')]])};
const panel={interpolationEligible:true};
ctx.component=component;ctx.panel=panel;
assert.equal(vm.runInContext('applyRasterInterpolationFilter(component,panel)',ctx),true);
assert.equal(calls.length,4,'both minification and magnification filters must update on every texture');
assert.deepEqual(calls.map(x=>x.value),[9729,9729,9729,9729],'enabled mode applies LINEAR to every texture');
assert.equal(map.repaints,1,'maps repaint after sampler changes');
assert.equal(activated.filter(x=>x[0]==='activate').length,2);

calls.length=0;ctx.st.interpolate=false;
vm.runInContext('applyRasterInterpolationFilter(component,panel)',ctx);
assert.deepEqual(calls.map(x=>x.value),[9728,9728,9728,9728],'disabled mode restores NEAREST on every texture');

calls.length=0;ctx.st.interpolate=true;panel.interpolationEligible=false;
vm.runInContext('applyRasterInterpolationFilter(component,panel)',ctx);
assert.deepEqual(calls.map(x=>x.value),[9728,9728,9728,9728],'categorical panels remain NEAREST even when global toggle is on');
console.log('PASS actual GPU sampler filtering, both texture parameters, all textures, toggle-off restoration, repaint and categorical safeguards');
