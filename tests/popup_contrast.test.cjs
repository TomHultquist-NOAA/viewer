'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
const js=fs.readFileSync(path.join(root,'js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
// Native MapLibre defaults use white surfaces while app text inherits a light
// dark-mode palette. Use theme-scoped selectors for ALL MapLibre text popups.
for (const expected of [
  'html[data-theme] .maplibregl-popup-content',
  'color:var(--text)',
  'background:var(--panel)',
  'white-space:pre-line',
  'overflow-wrap:anywhere',
  'html[data-theme] .maplibregl-popup-close-button',
  'html[data-theme] .maplibregl-popup-anchor-left .maplibregl-popup-tip',
  'html[data-theme] .maplibregl-popup-anchor-right .maplibregl-popup-tip',
  'border-top-color:var(--panel)',
  'border-bottom-color:var(--panel)',
  'html[data-theme="dark"]',
  'html[data-theme="light"]',
]) assert(css.includes(expected),expected);
assert.equal((js.match(/new maplibregl\.Popup\(/g)||[]).length,2);
assert.equal((js.match(/new maplibregl\.Popup\(\{[^}]*className:'evu-report-popup'/g)||[]).length,2);
assert.equal((js.match(/\.setText\(/g)||[]).length,2,'report data must not be injected as HTML');
assert.match(html,/css\/styles\.css\?v=1\.1\.10-20261030/);
console.log('PASS theme-aware MapLibre popup surfaces, text, line breaks, close controls and pointer triangles');
