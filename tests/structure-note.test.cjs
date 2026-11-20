const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');

test('home page explains web-linked navigation immediately above the page network', () => {
  const section = read('index.html').match(/<section id="structure"[^>]*>([\s\S]*?)<\/section>/)[1];
  const note = section.indexOf('class="structure-note"'), network = section.indexOf('<div class="web-network">');
  assert.ok(note > 0 && note < network);
  assert.match(section, /ওয়েব-লিংকড \(নেটওয়ার্ক\) স্ট্রাকচারে/);
  assert.match(section, /হোমে ফিরে না গিয়েই/);
  assert.doesNotMatch(section, /class="tree|হায়ারার্কিক্যাল/);
});

test('every page ends with a small ICT chapter-four inspiration line', () => {
  for (const name of fs.readdirSync(site).filter(n => n.endsWith('.html') && !n.startsWith('google'))) {
    const html = read(name);
    assert.match(html, /<p class="ict-inspiration" id="ict-inspiration">ICT চতুর্থ অধ্যায় থেকে অনুপ্রাণিত হয়ে বানানো<\/p>\n  <\/div>\n<\/footer>/, name);
  }
  assert.match(read('assets/style.css'), /\.ict-inspiration\{[^}]*font-size:10px/);
});
