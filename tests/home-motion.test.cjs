// Formal academic content stays readable beneath the optional glass/galaxy layer.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const read = p => fs.readFileSync(path.join(site, p), 'utf8');

test('home presents clear academic actions, departments, notices, services and the directory', () => {
  const html = read('index.html');
  for (const section of ['departments','parents-meeting','portal-title','structure','online-title','feedback-invite-title']) assert.ok(html.includes(`id="${section}"`), section);
  for (const action of ['href="#departments"','href="tracker.html"','href="classes.html"']) assert.ok(html.includes(action), action);
  assert.equal((html.match(/class="dept reveal"/g) || []).length, 3);
  assert.equal((html.match(/class="dabi-teaser"/g) || []).length, 6);
  assert.ok(html.indexOf('id="departments"') < html.indexOf('id="parents-meeting"'));
  assert.ok(html.indexOf('id="parents-meeting"') < html.indexOf('id="structure"'));
  assert.match(html, /সম্ভাব্য তারিখ · চূড়ান্ত নয়/);
  for (const id of ['cdD','cdH','cdM','cdS']) assert.ok(html.includes(`id="${id}"`));
});

test('unnecessary advice stays trimmed but essential exam information and links remain', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /প্রতিদিন পড়ো অন্তত|Hierarchical Structure|পরীক্ষা শেষ হলে তালিকা থেকে নিজে থেকেই সরে যাবে/);
  for (const s of ['চূড়ান্ত নয়','অভিভাবক <span class="grad">সমাবেশ-২০২৬</span>','০২ নং হলরুম','সকাল ১১.০০ ঘটিকায়','href="assets/parents-meeting-notice-2026.jpg"']) assert.ok(html.includes(s), s);
  for (const link of ['student-group.html','teachers.html','college-info.html','hsc-2027-routine.html','college-routine.html','honours-info.html']) assert.ok(html.includes(`href="${link}"`), link);
  assert.doesNotMatch(read('routine.html'), /মোবাইল পড়ার সময় সাইলেন্ট মোডে রাখো/);
  assert.doesNotMatch(read('classes.html'), /টিপস: ক্লাস দেখার পর/);
});

test('legacy heading/marquee effects stay removed; the formal base has no reading animations', () => {
  const html = read('index.html'), css = read('assets/style.css');
  assert.doesNotMatch(html, /hero-spark|hero-orbit|hero-ambient|aurora|ambient-comet|motion-toggle|marquee|data-motion=/);
  assert.doesNotMatch(html, /assets\/(home-motion|motion|heading-motion|light-motion)\.(js|css)/);
  assert.doesNotMatch(css, /@keyframes|animation:(?!none\b)/);
  assert.match(css, /\.hero::before\{[^}]*pointer-events:none/);
  assert.match(css, /\.reveal,\.reveal\.reveal-pending\{opacity:1;transform:none\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(html, /class="exam-notice-link" href="assets\/parents-meeting-notice-2026.jpg"/);
  assert.match(html, /<figure class="meet-figure">/);
});

test('the network illustration is optional native HTML; the searchable directory is progressively enhanced', () => {
  const html = read('index.html');
  assert.match(html, /<details class="network-diagram">\s*<summary>/);
  assert.match(html, /class="directory-search"[^>]*role="search"[^>]*hidden/);
  assert.match(html, /<label for="directory-query">/);
  assert.match(html, /id="directory-query"[^>]*aria-controls="page-directory"[^>]*aria-describedby="directory-status"/);
  assert.match(html, /id="directory-status" role="status" aria-live="polite" hidden/);
  assert.match(html, /id="directory-empty" hidden/);
  assert.doesNotMatch(read('assets/interface.js'), /fetch\(|localStorage|XMLHttpRequest|innerHTML/);
});
