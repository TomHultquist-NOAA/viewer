// Sounding caveats must stay within the right-hand card/footer, not spill off-canvas.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../js/point-inspector.js'), 'utf8');
assert.match(src, /const SKEW=35;/, 'Skew-T uses a more moderate tilt');
assert.match(src, /const x=dx\+20, maxWidth=dw-40;/, 'footer fits within the diagnostic panel width');
assert.match(src, /ctx\.measureText\(message\)\.width>maxWidth/, 'footer width is measured');
assert.match(src, /footnote\(`\*Approximate pseudo-adiabatic MU parcel; no CAPE\/CIN computed\./, 'MU caveat is preserved');
assert.match(src, /footnote\(summary\.terrainScreened\?/, 'terrain-screening note uses separate line');
assert.doesNotMatch(src, /hx\+dw\/2,865,12,muted/, 'removed single-line overflowing footer');
console.log('Sounding footer layout and gentler skew verified');
