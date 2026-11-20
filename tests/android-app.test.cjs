const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', 'site');
const {config, downloadUrl} = require('../scripts/app-release.cjs');
const apk = downloadUrl(config.android.file);

test('every page has a working app link inside its navigation and footer', () => {
  const pages = fs.readdirSync(site).filter(name => name.endsWith('.html') && name !== 'googleb7da7b15e33059e0.html');
  for (const name of pages) {
    const html = fs.readFileSync(path.join(site, name), 'utf8');
    const nav = html.match(/<div class="links" id="navLinks">([\s\S]*?)<\/div>/);
    assert.ok(nav, name);
    assert.ok(html.indexOf('src="assets/app-context.js?v=20261113"') >= 0, name);
    const style = html.search(/href="assets\/style\.css\?v=[^"]+"/);
    assert.ok(style >= 0 && html.indexOf('src="assets/app-context.js?v=20261113"') < style, name);
    assert.equal((nav[1].match(/href="android-app\.html"/g) || []).length, 1, name);
    assert.match(html, /id="burger"[^>]*aria-controls="navLinks"[^>]*aria-expanded="false"/, name);
    assert.match(html.match(/<footer[\s\S]*?<\/footer>/)[0], /href="android-app\.html"/, name);
  }
});

test('app page points to the dedicated three-platform beta and explains installation and limitations', () => {
  const page = fs.readFileSync(path.join(site, 'android-app.html'), 'utf8');
  assert.ok(page.includes(`href="${apk}"`));
  assert.match(page, /class="active" aria-current="page" href="android-app\.html"/);
  assert.match(page, /debug-signed ও debuggable APK/);
  assert.match(page, /Android 6\.0 বা নতুন/);
  assert.match(page, /সাধারণ পড়াশোনা অফলাইনে/);
  assert.match(page, /ইন্টারনেট লাগবে/);
  assert.match(page, /Install unknown apps/);
  assert.match(page, /আনইনস্টল করলে অ্যাপের স্থানীয় ট্র্যাকার তথ্য মুছে যাবে/);
  assert.match(page, /GitHub release দেখো/);
});

test('mobile menu enters its links and closes on navigation, outside focus/click and Escape', () => {
  const source = fs.readFileSync(path.join(site, 'assets/interface.js'), 'utf8');
  const handlers = {}, attrs = {}, classes = new Set();
  let focused = false, linkFocused = false;
  const firstLink = {focus: () => { linkFocused = true; }};
  const links = {classList: {
    toggle: c => { if (classes.has(c)) { classes.delete(c); return false; } classes.add(c); return true; },
    remove: c => classes.delete(c), contains: c => classes.has(c),
  }, querySelector: () => firstLink, addEventListener: (event, fn) => handlers.link = fn};
  const burger = {hidden:true, setAttribute: (name, value) => attrs[name] = value,
    addEventListener: (event, fn) => handlers.burger = fn, focus: () => { focused = true; }};
  const document = {getElementById: id => id === 'burger' ? burger : links,
    querySelector: () => null, addEventListener: (event, fn) => handlers[event] = fn};
  vm.runInNewContext(source, {document, window:{}});
  assert.equal(burger.hidden, false);
  handlers.burger(); assert.equal(attrs['aria-expanded'], 'true'); assert.ok(classes.has('open')); assert.ok(linkFocused);
  handlers.focusin({target:{closest:()=>({})}});assert.equal(attrs['aria-expanded'], 'true', 'focus within navigation keeps it open');
  handlers.focusin({target:{closest:()=>null}});assert.equal(attrs['aria-expanded'], 'false', 'outside focus closes the nonmodal disclosure');
  handlers.burger();
  handlers.link({target: {closest: () => ({})}});
  assert.equal(attrs['aria-expanded'], 'false'); assert.equal(classes.has('open'), false);
  handlers.burger(); handlers.keydown({key:'Escape'});
  assert.equal(attrs['aria-expanded'], 'false'); assert.ok(focused);
  handlers.burger(); handlers.click({target:{closest:()=>null}});
  assert.equal(attrs['aria-expanded'], 'false');
});


test('only the explicit HSC app marker sets the presentation class', () => {
  const script = fs.readFileSync(path.join(site, 'assets/app-context.js'), 'utf8');
  function classes(userAgent) {
    const result = new Set();
    vm.runInNewContext(script, {navigator:{userAgent}, document:{documentElement:{classList:{add: name => result.add(name)}}}});
    return result;
  }
  const webview = 'Mozilla/5.0 (Linux; Android 13; Pixel; wv) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';
  assert.equal(classes(webview).has('hsc-android-app'), false, 'other app webviews must keep download links');
  assert.equal(classes(webview + ' HSC2027App').has('hsc-android-app'), true);
  assert.equal(classes(webview + ' FakeHSC2027App').has('hsc-android-app'), false);
  assert.equal(classes('Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537.36').size, 0);
});
