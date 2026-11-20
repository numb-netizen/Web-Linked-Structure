const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {SITE_ORIGIN} = require('../scripts/site-config.cjs');
const {renderCollegePortals} = require('../scripts/college-portals.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('exactly one Pages publisher deploys the contents of site at the public root', () => {
  const workflows = fs.readdirSync(path.join(root, '.github/workflows')).filter(name => /\.ya?ml$/.test(name));
  const publishers = workflows.filter(name => /uses:\s*actions\/deploy-pages@/.test(read('.github/workflows/' + name)));
  assert.deepEqual(publishers, ['pages.yml']);
  const workflow = read('.github/workflows/pages.yml');
  assert.match(workflow, /path: \.\/site\n/);
  assert.doesNotMatch(workflow, /jekyll-build-pages|path:\s*['"]?\.['"]?\s*\n/);
  for (const file of ['index.html','CNAME','robots.txt','sitemap.xml','offline-manifest.json','googleb7da7b15e33059e0.html','BingSiteAuth.xml']) assert.ok(fs.existsSync(path.join(root, 'site', file)), file);
});

test('all public domain declarations, metadata and generators use chugc.cc.cd without /site/', () => {
  assert.equal(SITE_ORIGIN, 'https://chugc.cc.cd');
  for (const file of ['CNAME','docs/CNAME','site/CNAME']) assert.equal(read(file).trim(), new URL(SITE_ORIGIN).hostname, file);
  for (const name of fs.readdirSync(path.join(root, 'site')).filter(name => name.endsWith('.html') && !name.startsWith('google'))) {
    const html = read('site/' + name);
    assert.doesNotMatch(html, /hsc2027\.de5\.net|https:\/\/chugc\.cc\.cd\/site\//, name);
    assert.match(html, /<link rel="canonical" href="https:\/\/chugc\.cc\.cd\//, name);
  }
  for (const name of ['breadcrumbs','generate-sitemap','indexnow']) assert.match(read(`scripts/${name}.cjs`), /require\('\.\/site-config\.cjs'\)/);
  assert.ok(read('site/robots.txt').includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`));
});

test('the former /site/ entry is only a noindex redirect with a no-JavaScript root link', () => {
  const html = read('site/site/index.html');
  assert.match(html, /name="robots" content="noindex, follow"/);
  assert.ok(html.includes(`rel="canonical" href="${SITE_ORIGIN}/"`));
  assert.match(html, /http-equiv="refresh" content="0;url=\.\.\/"/);
  assert.match(html, /location\.replace\('\.\.\/' \+ window.location.search \+ window.location.hash\)/);
  assert.match(html, /<a href="\.\.\/">/);
  assert.doesNotMatch(html, /<iframe|<form|localStorage|sessionStorage|https?:[^"']+@/);
});

test('the old and new college portals sit together without embedded credentials or auto-login', () => {
  const portals = renderCollegePortals();
  for (const page of ['index','college-info']) assert.ok(read(`site/${page}.html`).includes(portals), page);
  assert.ok(portals.includes('এখন বন্ধ'));
  assert.ok(portals.includes('ব্যবহারকারীর জানানো অবস্থা'));
  assert.ok(portals.includes('পাসওয়ার্ড নেওয়া বা সংরক্ষণ করা হয় না'));
  const links = [...portals.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)];
  assert.deepEqual(links.map(link => link[1]), ['https://chugc.edu.bd/', 'https://chugc.eshiksaems.com/']);
  for (const link of links) {
    const url = new URL(link[1]);
    assert.equal(url.username, ''); assert.equal(url.password, ''); assert.equal(url.search, ''); assert.equal(url.hash, '');
    assert.match(link[0], /target="_blank" rel="noopener noreferrer"/);
  }
  assert.doesNotMatch(portals, /<form|<input|<iframe|<script|onclick|password=|username=/i);
  assert.ok(read('site/college-info.html').includes('https://chugc.edu.bd/?page_id=167'), 'retain historical attribution, marked unavailable');
});

test('native downloads migrate to the new root without orphaning the stable offline tracker origin', () => {
  const policy = read('android/app/src/main/java/bd/edu/hsc2027/NavigationPolicy.java');
  assert.match(policy, /HOME = "https:\/\/hsc2027\.de5\.net\/"/);
  assert.ok(policy.includes(`UPDATE_HOME = "${SITE_ORIGIN}/"`));
  const store = read('android/app/src/main/java/bd/edu/hsc2027/LocalSiteStore.java');
  assert.match(store, /UPDATE_HOME = NavigationPolicy.UPDATE_HOME/);
  assert.match(store, /new URL\(UPDATE_HOME \+ path\)/);
  assert.match(store, /setInstanceFollowRedirects\(false\)/);
  assert.ok(read('android/app/src/main/java/bd/edu/hsc2027/MainActivity.java').includes('webView.loadUrl(NavigationPolicy.HOME)'));
});
