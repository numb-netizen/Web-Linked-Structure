const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {ICONS, iconSprite, renderHeader, renderFooter, withShell} = require('../scripts/site-shell.cjs');
const {makeManifest} = require('../scripts/offline-manifest.cjs');
const site = path.resolve(__dirname, '../site');
const read = file => fs.readFileSync(path.join(site, file), 'utf8');
const pages = fs.readdirSync(site).filter(name => name.endsWith('.html') && !name.startsWith('google'));

test('all 35 pages share one formal shell, a working skip link and exactly one main landmark', () => {
  assert.equal(pages.length, 35);
  for (const file of pages) {
    const html = read(file), id = file.replace('.html','');
    assert.ok(html.includes(renderHeader(id)), file);
    assert.ok(html.includes(renderFooter()), file);
    assert.equal((html.match(/<main\b/g) || []).length, 1, file);
    assert.equal((html.match(/id="main-content"/g) || []).length, 1, file);
    assert.match(html, /<a class="skip-link" href="#main-content">মূল বিষয়বস্তুতে যান<\/a>/, file);
    assert.match(html, /<main\b[^>]*id="main-content" tabindex="-1"/, file);
    assert.match(html, /কলেজের আনুষ্ঠানিক ওয়েবসাইট নয়/, file);
    assert.equal(withShell(id, html), html, `${file}: shared shell is idempotent`);
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/, file);
    for (const match of html.matchAll(/href="assets\/(?:college-details|teachers|student-group|android-download|feedback)\.css([^"]*)"/g)) assert.equal(match[1], '?v=3', `${file}: updated page styles invalidate old caches`);
  }
  assert.match(read('physics.html'), /class="active" aria-current="location" href="science.html"/);
  assert.match(read('science.html'), /class="active" aria-current="page" href="science.html"/);
});

test('all referenced SVG symbols exist locally and decorative icons never compete with link names', () => {
  assert.equal(read('assets/icons.svg'), iconSprite());
  execFileSync(process.execPath, ['scripts/site-shell.cjs','--check'], {cwd:path.resolve(site,'..')});
  for (const file of pages) {
    const html = read(file);
    for (const match of html.matchAll(/<svg class="icon[^>]*>[\s\S]*?<\/svg>/g)) {
      assert.match(match[0], /aria-hidden="true" focusable="false"/, file);
      const symbol = match[0].match(/<use href="assets\/icons.svg#([^"]+)"/)[1];
      assert.ok(Object.hasOwn(ICONS, symbol), `${file}: ${symbol}`);
    }
    assert.doesNotMatch(html, /<div class="ic">[^<]+<\/div>/, `${file}: resource icons use the shared set`);
    for (const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(assets\/[^"]+)"/g)) {
      assert.ok(fs.existsSync(path.join(site, match[1].split('?')[0])), `${file}: ${match[1]}`);
    }
  }
});

test('Bengali fonts, their redistribution license and interface assets ship in the offline manifest', () => {
  const manifest = makeManifest(site), css = read('assets/style.css');
  for (const weight of ['regular','semibold','bold']) {
    const file = `assets/fonts/hind-siliguri-${weight}.woff2`;
    const buffer = fs.readFileSync(path.join(site,file));
    assert.equal(buffer.subarray(0,4).toString(), 'wOF2', file);
    assert.ok(buffer.length < 100 * 1024, file);
    assert.ok(css.includes(`fonts/hind-siliguri-${weight}.woff2`), file);
    assert.ok(manifest.files.some(entry => entry.path === file), file);
  }
  assert.equal((css.match(/font-display:swap/g) || []).length, 3);
  assert.match(read('assets/fonts/OFL.txt'), /SIL OPEN FONT LICENSE Version 1.1/);
  for (const file of ['assets/fonts/OFL.txt','assets/icons.svg','assets/interface.js']) assert.ok(manifest.files.some(entry => entry.path === file), file);
  assert.deepEqual(JSON.parse(read('offline-manifest.json')), manifest, 'checked-in offline hashes must match the delivered assets');
});

test('the light-first design retains keyboard focus, no-script navigation and responsive reading layouts', () => {
  const css = read('assets/style.css');
  for (const required of ['color-scheme:light','--header-height:108px','focus-visible','.skip-link:focus','html:not([data-js="true"]) .links','@media(max-width:760px)','@media(max-width:350px)','prefers-reduced-motion:reduce']) assert.ok(css.includes(required), required);
  for (const file of ['teachers.css','student-group.css','college-details.css','android-download.css']) {
    const pageCSS = read('assets/' + file);
    assert.ok(pageCSS.includes('var(--header-height)'), file);
    assert.ok(pageCSS.includes('html:not([data-js="true"])'), file);
  }
});

test('wide source tables and images stay pannable by keyboard, and source links are underlined', () => {
  for (const file of ['college-info.html','college-routine.html','honours-info.html']) {
    for (const match of read(file).matchAll(/<div class="(?:table-wrap|booklet-scroll(?: wide)?)"[^>]*>/g)) {
      assert.match(match[0], /tabindex="0" role="region" aria-label=/, file);
    }
  }
  assert.match(read('assets/teachers.css'), /\.teachers-page p a\{[^}]*text-decoration:underline/);
});
