'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const base=path.join(__dirname,'..');
const md=fs.readFileSync(path.join(base,'USER_GUIDE.md'),'utf8');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const pdf=fs.readFileSync(path.join(base,'USER_GUIDE.pdf'));
const hash=crypto.createHash('sha256').update(md).digest('hex');
assert.ok(html.includes(`<!-- user-guide-source-sha256: ${hash} -->`),'Popup must come from the current Markdown');
assert.ok(pdf.includes(Buffer.from(`Guide source SHA256: ${hash}`)),'PDF must come from the same Markdown');
const start=html.indexOf('<div class="user-guide-scroll">');
const end=html.indexOf('<div class="user-guide-footer">',start);
assert.ok(start>=0&&end>start);
const guide=html.slice(start,end);
for(const term of [
 'Getting started','Map controls and shortcuts','Right-click: time series and sounding',
 'Fields, precipitation type, and snowfall','Adjust the numerical colorbar',
 'Overlays and transparency','Weather observations and storm reports',
 'Compare two panels','Save PNGs and animated GIFs','Data availability and troubleshooting',
 'Change forecast hour','Maximum frames','Standard (1200 px)','High (1600 px)',
 'sparse fallback','diagnostics box','700 milliseconds per frame',
])assert.ok(guide.includes(term),`Missing from popup: ${term}`);
assert.equal((guide.match(/<section id="guide-/g)||[]).length,10);
assert.equal((guide.match(/<table>/g)||[]).length,2);
assert.ok(html.includes('href="USER_GUIDE.pdf" target="_blank"'));
console.log('PASS User Guide popup and PDF source hashes, 10 sections, 2 tables, and key user instructions');
