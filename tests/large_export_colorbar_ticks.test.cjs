const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../js/viewer.js'), 'utf8');
test('large-label export colorbar ticks are consistently enlarged', () => {
  assert.match(source, /largeLabels\?29:14/); // Vertical per-panel
  assert.match(source, /largeLabels\?25:14/); // Horizontal per-panel
  assert.match(source, /largeLabels\?Math\.max\(30,Math\.min\(38,w\/75\)\)/); // Shared legend
  assert.match(source, /largeLabels\?30:11/); // Difference legend
  assert.match(source, /largeLabels\?23:15/); // Parameter title remains unchanged
});
