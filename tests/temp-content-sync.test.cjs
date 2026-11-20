// Selective content import: keep this site's shell, offline quiz and tracker identities.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.resolve(__dirname, '../site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const video = 'https://youtu.be/7PIx8szWEz4';
const counts = {accounting:20, biology:24, business:22, chemistry:10, finance:23, marketing:20, math:20, physics:21};

test('eight subjects follow Temp by dropping historical change boxes, not source warnings or chapters', () => {
  for (const [subject, count] of Object.entries(counts)) {
    const html = read(subject+'.html');
    for (const [box] of html.matchAll(/<div class="tip"[^>]*>[\s\S]*?<\/div>/g)) {
      assert.doesNotMatch(box, /হালনাগাদ করা হয়েছে|আগে দেওয়া টিক|সংরক্ষিত টিক রাখা আছে|আগে তালিকায় ছিল না/, subject);
    }
    assert.ok(html.includes('এটি পূর্ণ পাঠ্যসূচি নয়'), subject+' keeps the scope warning');
    assert.ok(html.includes('https://nctb.gov.bd/pages/files/6922dbc6933eb65569e0c702'), subject+' NCTB source');
    assert.ok(html.includes('https://sylhetboard.gov.bd/corner/hsc'), subject+' board source');
    assert.equal((html.match(new RegExp(`class="chap" data-subject="${subject}"`, 'g')) || []).length, count, subject+' retains its chapters');
  }
  assert.match(read('civics.html'), /পূর্ণ অধ্যায় ও কোড যাচাই বাকি/, 'unresolved verification notes are not change-history boxes');
  assert.match(read('economics.html'), /পূর্ণ অধ্যায় ও কোড যাচাই বাকি/);
});

test('the imported civics lesson is a safe sibling link beside the original stable chapter', () => {
  const html = read('civics.html');
  const row = html.match(/<div class="chap-row" id="civics-introduction">(<div class="chap"[^>]*>[\s\S]*?<\/div>)(<a class="class-tag"[^>]*>[\s\S]*?<\/a>)<\/div>/);
  assert.ok(row, 'static chapter + sibling lesson, also available without JavaScript');
  assert.equal(row[1], '<div class="chap" data-subject="civics" data-chapter="0"><span class="box"></span><span class="nm">১ম পত্র: পৌরনীতি ও সুশাসন পরিচিতি</span></div>');
  assert.ok(row[2].includes(`href="${video}"`));
  assert.match(row[2], /target="_blank" rel="noopener noreferrer"/);
  assert.match(row[2], /aria-label="ক্লাস দেখো: পৌরনীতি ও সুশাসন ১ম পত্র, ১ম অধ্যায় — Unique e School/);
  assert.doesNotMatch(row[2], /\?si=|onclick=|iframe/);
  assert.match(row[2], /aria-hidden="true" focusable="false"><use href="assets\/icons\.svg#external"/);
  assert.equal((html.match(/class="class-tag"/g) || []).length, 1);
  assert.deepEqual([...html.matchAll(/data-subject="civics" data-chapter="(\d+)"/g)].map(m=>Number(m[1])), Array.from({length:20}, (_,i)=>i));
  for (const name of fs.readdirSync(site).filter(name=>name.endsWith('.html'))) {
    for (const [chapter] of read(name).matchAll(/<div class="chap"[^>]*>[\s\S]*?<\/div>/g)) assert.doesNotMatch(chapter, /<a\b/, name+' has no nested interactive link');
  }
  const css = read('assets/editorial.css');
  assert.match(css, /\.class-tag\{[^}]*min-height:44px/);
  assert.match(css, /@media\(max-width:600px\)\{\.chap-row\{flex-direction:column/);
});

test('the classes directory exposes the same specific lesson as well as its search and reciprocal links', () => {
  const card = read('classes.html').match(/id="class-civics"([\s\S]*?)<a class="resource-subject-link" href="civics.html">/);
  assert.ok(card);
  assert.match(card[1], /১ম পত্রের ১ম অধ্যায়: পৌরনীতি ও সুশাসন পরিচিতি/);
  assert.ok(card[1].includes(`class="dl chapter-video" href="${video}"`));
  assert.match(card[1], /https:\/\/www.youtube.com\/results\?search_query=/);
  assert.match(card[1], /অন্যান্য ক্লাস খুঁজো/);
  assert.match(read('civics.html'), /data-page="classes" href="classes.html#class-civics"/);
});

test('a content sync never replaces the accepted quiz, corrected literary genres or private/offline boundaries', () => {
  const bangla = read('bangla.html'), tracker = read('tracker.html');
  for (const html of [bangla,tracker]) {
    assert.match(html, /data-chapter="11"><span class="box"><\/span><span class="nm">লালসালু<\/span> <span class="badge"[^>]*>উপন্যাস<\/span>/);
    assert.match(html, /data-chapter="36"><span class="box"><\/span><span class="nm">সিরাজউদ্দৌলা<\/span> <span class="badge"[^>]*>নাটক<\/span>/);
  }
  assert.equal(require('../data/bangla-mcq.json').questions.length, 130);
  assert.ok(bangla.includes('সম্পূর্ণ বিষয়ের ওয়ান শট ক্লাস'));
  for (const name of fs.readdirSync(site).filter(name=>name.endsWith('.html'))) {
    assert.doesNotMatch(read(name), /clarity\.ms\/tag|mcq-test\.html|assets\/mcq-test\.js/, name+' does not inherit unrelated analytics or the other exam backend');
  }
});
