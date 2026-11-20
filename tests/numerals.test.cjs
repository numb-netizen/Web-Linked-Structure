const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {makeManifest} = require('../scripts/offline-manifest.cjs');
const site = path.join(__dirname,'../site');
const read = file => fs.readFileSync(path.join(site,file),'utf8');

test('readable Bengali digits are a scoped, local font without changing Bengali letters or numeric data', () => {
  const css = read('assets/numerals.css');
  assert.match(css, /font-family:"Bengali Numerals"/);
  assert.match(css, /src:url\("fonts\/bengali-numerals.woff2"\)/);
  assert.match(css, /font-weight:100 900/);
  assert.match(css, /font-display:swap;unicode-range:U\+09E6-09EF/);
  assert.match(css, /body,\.android-phone strong\{font-family:var\(--font-ui\)\}/);
  assert.match(css, /tabular-nums;letter-spacing:normal/);
  assert.doesNotMatch(css, /@import|https?:|content:/);
  const pages = fs.readdirSync(site).filter(name=>name.endsWith('.html') && !name.startsWith('google'));
  assert.equal(pages.length,35);
  for (const file of pages) {
    const html = read(file);
    assert.equal(html.split('assets/numerals.css?v=1').length - 1,1,file);
    assert.ok(html.indexOf('assets/numerals.css') > html.indexOf('assets/galaxy.css'),file);
    assert.ok(html.indexOf('assets/numerals.css') < html.indexOf('</head>'),file);
  }
});

test('the tiny variable numeral font and its exact license ship in the verified offline snapshot', () => {
  const font = fs.readFileSync(path.join(site,'assets/fonts/bengali-numerals.woff2'));
  assert.equal(font.subarray(0,4).toString(),'wOF2');
  assert.ok(font.length < 5 * 1024);
  assert.match(read('assets/fonts/OFL-noto-sans-bengali.txt'),/Copyright 2022 The Noto Project Authors/);
  assert.match(read('assets/fonts/OFL-noto-sans-bengali.txt'),/SIL OPEN FONT LICENSE Version 1.1/);
  const provenance = fs.readFileSync(path.join(__dirname,'../docs/bengali-numerals.md'),'utf8');
  assert.ok(provenance.includes(crypto.createHash('sha256').update(font).digest('hex')));
  const manifest = makeManifest(site);
  for (const file of ['assets/numerals.css','assets/fonts/bengali-numerals.woff2','assets/fonts/OFL-noto-sans-bengali.txt']) assert.ok(manifest.files.some(entry=>entry.path === file),file);
  assert.deepEqual(JSON.parse(read('offline-manifest.json')),manifest);
});
