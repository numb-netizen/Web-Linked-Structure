const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
test('current downloads do not mislabel the dedicated desktop installers as legacy Lite packages', () => {
  const html = read('site/android-app.html');
  assert.doesNotMatch(html, /desktop-lite-v|HSC-2027-Lite|Temp\/releases/);
  for (const item of ['Windows x64 installer', 'Linux x64 AppImage', 'Chromium', 'unsigned beta', 'অগ্রগতি আলাদা']) assert.ok(html.includes(item), item);
  assert.match(read('docs/application-releases.md'), /desktop-lite\//);
});
test('lite builds bundle the site, deny permissions and gate releases on both smoke tests', () => {
  const win = read('desktop-lite/windows/Program.cs'), linux = read('desktop-lite/linux/hsc-lite.py');
  const ci = read('.github/workflows/desktop-lite.yml');
  assert.match(win, /CoreWebView2PermissionState\.Deny/);
  assert.match(win, /NavigationStarting/);
  assert.match(linux, /permission-request/);
  assert.match(linux, /decide-policy/);
  assert.match(ci, /needs: \[linux, windows\]/);
  assert.match(ci, /--smoke/);
  assert.match(read('desktop-lite/linux/build-deb.sh'), /cp -a site\/\./);
});
