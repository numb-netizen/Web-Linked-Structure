const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {config, platforms, downloadUrl, checkConfiguration, prepareRelease} = require('../scripts/app-release.cjs');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const sourceSha = 'a'.repeat(40);
const provenance = {sourceSha, runUrl: `https://github.com/${config.repository}/actions/runs/123`, repository: config.repository};

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chugc-release-test-'));
  for (const platform of platforms) {
    const content = Buffer.alloc(1024 * 1024 + 1);
    if (platform === 'android') Buffer.from('504b0304', 'hex').copy(content);
    if (platform === 'windows') content.write('MZ');
    if (platform === 'linux') { Buffer.from('7f454c46', 'hex').copy(content); Buffer.from('414902', 'hex').copy(content, 8); }
    fs.writeFileSync(path.join(dir, config[platform].file), content);
  }
  fs.writeFileSync(path.join(dir, 'ANDROID-VERIFICATION.txt'), `package: name='${config.android.applicationId}' versionCode='${config.android.versionCode}' versionName='${config.version}'\nSigner #1 certificate DN: CN=Android Debug\nSigner #1 certificate SHA-256 digest: ${'b'.repeat(64)}\n`);
  return dir;
}
function clean(dir) { fs.rmSync(dir, {recursive: true, force: true}); }

test('dedicated app identities, native versions and all three site downloads share one release contract', () => {
  assert.equal(checkConfiguration(), config);
  assert.notEqual(config.android.applicationId, 'bd.edu.hsc2027');
  const page = read('site/android-app.html');
  for (const platform of platforms) assert.ok(page.includes(downloadUrl(config[platform].file)), platform);
  for (const word of ['debug-signed', 'debuggable', 'unsigned beta', 'স্থানান্তর', 'sync', 'SmartScreen', 'FUSE', 'checksum']) assert.ok(page.includes(word), word);
  assert.doesNotMatch(page, /Temp\/releases|desktop-lite-v|\.NET 10 Desktop Runtime/);
});

test('cross-platform packaging gates draft creation on validation and all native builds and never publishes automatically', () => {
  const workflow = read('.github/workflows/app-release.yml');
  assert.match(workflow, /needs: \[validate, android, desktop\]/);
  assert.match(workflow, /--draft --prerelease/);
  assert.match(workflow, /refusing to overwrite/);
  assert.match(workflow, /git ls-remote --tags origin/);
  assert.match(workflow, /node scripts\/app-release\.cjs --prepare release/);
  assert.match(workflow, /apksigner.*verify --verbose --print-certs/);
  assert.match(workflow, /CN=Android Debug/);
  assert.match(workflow, /Smoke test the packaged Linux application/);
  assert.match(workflow, /Smoke test the packaged Windows application/);
  assert.doesNotMatch(workflow, /--clobber|--draft=false|pull_request_target|secrets\./);
  assert.equal(fs.existsSync(path.join(__dirname, '../.github/workflows/publish-android-beta.yml')), false, 'do not replay another repository\'s old hardcoded Android artifact');
});

test('release preparation records exact installer hashes, APK certificate and source/run provenance', async () => {
  const dir = fixture();
  try {
    const info = await prepareRelease(dir, provenance);
    assert.equal(info.sourceCommit, sourceSha);
    assert.equal(info.android.applicationId, config.android.applicationId);
    assert.equal(info.android.debugSigned, true);
    assert.equal(info.android.certificateSha256, 'b'.repeat(64));
    assert.equal(info.windows.authenticodeSigned, false);
    assert.equal(info.artifacts.length, 3);
    const sums = fs.readFileSync(path.join(dir, 'SHA256SUMS.txt'), 'utf8');
    assert.equal(sums.trim().split('\n').length, 5);
    for (const line of sums.trim().split('\n')) {
      const [hash, file] = line.split('  ');
      assert.equal(hash, crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, file))).digest('hex'));
    }
    const notes = fs.readFileSync(path.join(dir, 'RELEASE-NOTES.md'), 'utf8');
    assert.doesNotMatch(notes, /\{\{[A-Z_]+\}\}/);
    assert.ok(notes.includes(sourceSha));
    assert.ok(notes.includes('debug-signed'));
  } finally { clean(dir); }
});

test('release preparation refuses wrong provenance, missing platforms and stray/private signing files', async () => {
  const dir = fixture();
  try {
    await assert.rejects(prepareRelease(dir, {...provenance, repository:'someone/else'}));
    await assert.rejects(prepareRelease(dir, {...provenance, sourceSha:'main'}));
    await assert.rejects(prepareRelease(dir, {...provenance, runUrl:'https://example.org/123'}));
    fs.writeFileSync(path.join(dir, 'private.keystore'), 'never publish');
    await assert.rejects(prepareRelease(dir, provenance), /exactly three installers/);
    fs.unlinkSync(path.join(dir, 'private.keystore'));
    fs.unlinkSync(path.join(dir, config.windows.file));
    await assert.rejects(prepareRelease(dir, provenance), /exactly three installers/);
  } finally { clean(dir); }
});

test('release preparation refuses the wrong Android identity/certificate and corrupt installer formats', async () => {
  const dir = fixture();
  try {
    const certPath = path.join(dir, 'ANDROID-VERIFICATION.txt');
    const verification = fs.readFileSync(certPath, 'utf8');
    fs.writeFileSync(certPath, verification.replace(config.android.applicationId, 'bd.edu.hsc2027'));
    await assert.rejects(prepareRelease(dir, provenance), /APK identity/);
    fs.writeFileSync(certPath, verification.replace('CN=Android Debug', 'CN=Unknown'));
    await assert.rejects(prepareRelease(dir, provenance), /debug-signed/);
    fs.writeFileSync(certPath, verification);
    const linux = path.join(dir, config.linux.file);
    fs.writeFileSync(linux, Buffer.alloc(1024 * 1024 + 1));
    await assert.rejects(prepareRelease(dir, provenance), /Linux ELF header/);
  } finally { clean(dir); }
});

test('desktop and Android packaged-app smoke tests include the actual offline quiz and all three study plans', () => {
  const desktop = read('desktop/main.cjs');
  const android = read('android/app/src/androidTest/java/bd/edu/hsc2027/OfflineSiteTest.java');
  for (const source of [desktop, android]) {
    for (const token of ["['science','arts','commerce']", 'HSC_BANGLA_MCQ_BANK.questions.length !== 130', '#mcq-start', '#mcq-confirm-yes', '.mcq-review-item']) assert.ok(source.includes(token), token);
  }
  assert.ok(desktop.includes('https://chugc.cc.cd/'));
  assert.match(read('android/app/src/main/java/bd/edu/hsc2027/NavigationPolicy.java'), /UPDATE_HOME = "https:\/\/chugc\.cc\.cd\/"/);
});
