'use strict';
// One release contract for native identities, downloadable filenames and provenance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const config = require('../data/app-release.json');
const root = path.resolve(__dirname, '..');
const platforms = ['android', 'windows', 'linux'];
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const releaseUrl = `https://github.com/${config.repository}/releases/tag/${config.tag}`;
const downloadUrl = file => `https://github.com/${config.repository}/releases/download/${config.tag}/${file}`;

function checkConfiguration() {
  assert.match(config.version, /^\d+\.\d+\.\d+-beta\.\d+$/);
  assert.equal(config.tag, `study-portal-v${config.version}`);
  assert.match(config.repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
  assert.equal(config.productName, 'CHUGC Study Portal');
  assert.equal(config.android.applicationId, 'bd.edu.chugc.studyportal');
  assert.ok(Number.isSafeInteger(config.android.versionCode) && config.android.versionCode > 0);
  assert.equal(config.android.minSdk, 23);
  const prefix = `CHUGC-Study-Portal-${config.version}`;
  assert.equal(config.android.file, `${prefix}-android-debug.apk`);
  assert.equal(config.windows.file, `${prefix}-windows-x64-setup.exe`);
  assert.equal(config.linux.file, `${prefix}-linux-x64.AppImage`);
  const pkg = JSON.parse(read('desktop/package.json'));
  const lock = JSON.parse(read('desktop/package-lock.json'));
  assert.equal(pkg.version, config.version);
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.packages[''].name, pkg.name);
  assert.equal(pkg.build.productName, config.productName);
  assert.equal(pkg.build.appId, `${config.android.applicationId}.desktop`);
  assert.equal(pkg.build.linux.executableName, 'chugc-study-portal');
  assert.equal(pkg.build.win.artifactName, 'CHUGC-Study-Portal-${version}-windows-${arch}-setup.${ext}');
  assert.equal(pkg.build.linux.artifactName, 'CHUGC-Study-Portal-${version}-linux-${arch}.${ext}');
  const gradle = read('android/app/build.gradle');
  for (const token of [`applicationId '${config.android.applicationId}'`, `versionCode ${config.android.versionCode}`, `versionName '${config.version}'`, `minSdk ${config.android.minSdk}`]) assert.ok(gradle.includes(token), token);
  assert.ok(read('android/app/src/main/res/values/strings.xml').includes(`>${config.productName}</string>`));
  const html = read('site/android-app.html');
  for (const platform of platforms) assert.ok(html.includes(`href="${downloadUrl(config[platform].file)}"`), `${platform} download must match the release`);
  assert.ok(html.includes(`href="${releaseUrl}"`));
  assert.ok(html.includes(`href="${downloadUrl('SHA256SUMS.txt')}"`));
  assert.ok(html.includes(config.version));
  assert.doesNotMatch(html, /github\.com\/numb-netizen\/Temp\/releases\//, 'do not advertise another site\'s packages');
  return config;
}

async function sha256(file) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function prepareRelease(directory, {sourceSha, runUrl, repository} = {}) {
  checkConfiguration();
  assert.match(sourceSha || '', /^[a-f0-9]{40}$/);
  assert.equal(repository, config.repository, 'refuse to publish under a different repository identity');
  assert.match(runUrl || '', new RegExp('^https://github\\.com/' + config.repository.replaceAll('.', '\\.') + '/actions/runs/[0-9]+$'));
  const allowed = new Set([...platforms.map(p => config[p].file), 'ANDROID-VERIFICATION.txt']);
  assert.deepEqual(fs.readdirSync(directory).sort(), [...allowed].sort(), 'expected exactly three installers and Android verification; no test builds or private signing files');
  const verification = fs.readFileSync(path.join(directory, 'ANDROID-VERIFICATION.txt'), 'utf8');
  assert.ok(verification.includes(`package: name='${config.android.applicationId}' versionCode='${config.android.versionCode}' versionName='${config.version}'`), 'verified APK identity/version');
  assert.match(verification, /CN=Android Debug/, 'the beta must be honestly labelled debug-signed');
  const fingerprint = verification.match(/Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]{64})/);
  assert.ok(fingerprint, 'verified public Android certificate fingerprint is required');
  const artifacts = [];
  for (const platform of platforms) {
    const file = config[platform].file, absolute = path.join(directory, file);
    const stat = fs.lstatSync(absolute);
    assert.ok(stat.isFile() && !stat.isSymbolicLink(), `${file}: regular file required`);
    assert.ok(stat.size > 1024 * 1024 && stat.size < 2 * 1024 ** 3, `${file}: plausible installer size`);
    const fd = fs.openSync(absolute, 'r'), header = Buffer.alloc(12);
    try { fs.readSync(fd, header, 0, header.length, 0); } finally { fs.closeSync(fd); }
    if (platform === 'android') assert.equal(header.subarray(0, 4).toString('hex'), '504b0304', 'APK ZIP header');
    if (platform === 'windows') assert.equal(header.subarray(0, 2).toString(), 'MZ', 'Windows PE header');
    if (platform === 'linux') {
      assert.equal(header.subarray(0, 4).toString('hex'), '7f454c46', 'Linux ELF header');
      assert.equal(header.subarray(8, 11).toString('hex'), '414902', 'AppImage type 2 header');
    }
    artifacts.push({platform, file, bytes: stat.size, sha256: await sha256(absolute)});
  }
  const info = {
    schemaVersion: 1, productName: config.productName, version: config.version,
    repository: config.repository, sourceCommit: sourceSha, workflowRun: runUrl,
    android: {applicationId: config.android.applicationId, versionCode: config.android.versionCode,
      debugSigned: true, certificateSha256: fingerprint[1].toLowerCase()},
    windows: {authenticodeSigned: false}, automaticBinaryUpdates: false, artifacts
  };
  fs.writeFileSync(path.join(directory, 'BUILD-INFO.json'), JSON.stringify(info, null, 2) + '\n');
  const metadata = ['ANDROID-VERIFICATION.txt', 'BUILD-INFO.json'];
  const sums = [...artifacts.map(a => `${a.sha256}  ${a.file}`)];
  for (const file of metadata) sums.push(`${await sha256(path.join(directory, file))}  ${file}`);
  fs.writeFileSync(path.join(directory, 'SHA256SUMS.txt'), sums.join('\n') + '\n');
  fs.writeFileSync(path.join(directory, 'RELEASE-NOTES.md'), read('docs/app-release-notes.md')
    .replaceAll('{{VERSION}}', config.version).replaceAll('{{RELEASE_URL}}', releaseUrl)
    .replaceAll('{{SOURCE_SHA}}', sourceSha).replaceAll('{{RUN_URL}}', runUrl));
  return info;
}

module.exports = {config, platforms, releaseUrl, downloadUrl, checkConfiguration, prepareRelease};
if (require.main === module) {
  (async () => {
    const [command, directory] = process.argv.slice(2);
    if (command === '--check') {
      checkConfiguration(); console.log(`App release ${config.tag}: identities, versions and all three site links match.`);
    } else if (command === '--github-output') {
      checkConfiguration();
      for (const [key, value] of Object.entries({tag: config.tag, version: config.version, android_file: config.android.file,
        windows_file: config.windows.file, linux_file: config.linux.file, android_id: config.android.applicationId, android_code: config.android.versionCode})) console.log(`${key}=${value}`);
    } else if (command === '--prepare' && directory) {
      await prepareRelease(path.resolve(directory), {sourceSha: process.env.GITHUB_SHA,
        runUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
        repository: process.env.GITHUB_REPOSITORY});
      console.log('Three installer headers, APK identity/certificate, SHA-256 sums and build provenance verified.');
    } else throw new Error('Usage: node scripts/app-release.cjs --check | --github-output | --prepare DIRECTORY');
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
