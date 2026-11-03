const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/viewer.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function has(re,name){assert.match(src,re,`${name} must stay wired`);}
test('GFS viewer has independent absolute and signed-difference legends',()=>{
 assert.match(html,/id="sharedLegend"/);
 assert.match(html,/id="differenceSharedLegend"/);
 has(/function updateSharedLegend\(\)\{\s*updateDifferenceSharedLegend\(\)/,'GFS legend update');
 has(/difference\?differenceSharedPalette\(\):sharedPalette\(\)/,'signed export legend');
 has(/if\(dualLegend\)\{[\s\S]*drawSharedExportLegend\([^;]+true\)/,'two export colorbars');
});
test('GFS difference scales preserve a physical-zero transparent band',()=>{
 has(/differenceField:true/,'difference metadata');
 has(/clearZero:differenceNeutralThreshold\(st.field,range\)/,'difference deadband');
 has(/shade\.push\(mid>=low&&mid<high\?'#00000000'/,'transparent raster color');
 has(/!m\.differenceField\?st\.colorRanges/,'difference fixed color range');
});
test('continuous dark backgrounds are subdued without changing export geography',()=>{
 has(/function liveGeographyInk\(p=null\)/,'live field classifier');
 has(/INTERMITTENT_FIELDS\.has\(st\.field\)/,'intermittent fields');
 has(/function updateLiveGeography\(\)/,'field change live refresh');
 has(/const c=liveGeographyInk\(\),empty=/,'live map creation');
});
test('MSLP defaults to 960–1050 hPa with endpoint saturation',()=>{
 has(/mslp:\{[^\n]*[\s\S]*?levels:\[960,966,972,978,984,990,996,1002,1008,1014,1020,1026,1032,1038,1044,1050\]/,'MSLP color scale');
});
