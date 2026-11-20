const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', 'site');
const script = fs.readFileSync(path.join(site, 'assets/credit.js'), 'utf8');
const deadline = id => Date.parse(script.match(new RegExp(`\\['${id}', '([^']+)'\\]`))[1]);
const credit = deadline('temporary-credit');
const ict = deadline('ict-inspiration');

// Runs credit.js with a fake clock; returns the two notes and the scheduled timers.
function run(now) {
  const notes = {'temporary-credit': {hidden: false}, 'ict-inspiration': {hidden: false}};
  const timers = [], events = {};
  class Clock extends Date { static now() { return now.value; } }
  vm.runInNewContext(script, {
    document: {getElementById: id => notes[id], addEventListener: (name, fn) => { (events[name] ||= []).push(fn); }},
    window: {addEventListener: (name, fn) => { (events[name] ||= []).push(fn); }},
    Date: Clock, clearTimeout: () => {}, setTimeout: (fn, ms) => { timers.push([fn, ms]); },
  });
  return {notes, timers, events};
}

test('every shared page shows separate Mahadin/Morshed attributions and loads the independent expiry script', () => {
  const names = fs.readdirSync(site).filter(name => name.endsWith('.html') && name !== 'googleb7da7b15e33059e0.html');
  assert.equal(names.length, 35);
  for (const name of names) {
    const html = fs.readFileSync(path.join(site, name), 'utf8');
    assert.equal((html.match(/id="temporary-credit"/g) || []).length, 1, name);
    const block = html.match(/<div class="temporary-credit footer-credits" id="temporary-credit" role="group" aria-label="Site credits" lang="en">([\s\S]*?)<\/div>/);
    assert.ok(block, name+' named English-language credit group');
    assert.match(block[1], /<p class="credit-person"><span class="credit-role">Requested by<\/span><strong class="credit-name">Mahadin<\/strong><span class="credit-detail">Concept &amp; information<\/span><\/p>/);
    assert.match(block[1], /<p class="credit-person credit-person--owner"><span class="credit-role">Built &amp; managed by<\/span><strong class="credit-name">Morshed<\/strong><span class="credit-detail">Site owner<\/span><\/p>/);
    assert.equal((block[1].match(/class="credit-name"/g) || []).length, 2, name);
    assert.doesNotMatch(html, /Made by <strong>Mahadin &amp; Morshed/);
    assert.match(html, /<p class="ict-inspiration" id="ict-inspiration">ICT চতুর্থ অধ্যায় থেকে অনুপ্রাণিত হয়ে বানানো<\/p>/, name);
    assert.match(html, /src="assets\/credit\.js\?v=20261119" defer><\/script>/, 'both footer notes must exist before the expiry script runs');
  }
});

test('attributions remain two-sided on narrow screens and the expiry can hide their entire grid', () => {
  const css = fs.readFileSync(path.join(site, 'assets/style.css'), 'utf8');
  assert.match(css, /\.temporary-credit\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.credit-person--owner\{align-items:flex-end;text-align:right;border-left:1px solid var\(--line\)/);
  assert.match(css, /@media\(max-width:480px\)\{\.temporary-credit/);
  assert.match(css, /\[hidden\]\{display:none!important\}/, 'grid styling must never override expiry');
});

test('both attribution columns keep the extended deadline and the ICT line lasts one month', () => {
  assert.equal(new Date(credit).toISOString(), '2026-12-01T12:43:22.000Z');
  assert.equal(credit - Date.parse('2026-11-21T12:43:22Z'), 10 * 24 * 3600 * 1000);
  assert.equal(new Date(ict).toISOString(), '2026-12-19T12:43:22.000Z');
});

test('each note is visible before its deadline and hides exactly at it', () => {
  const now = {value: credit - 1000};
  const {notes, timers, events} = run(now);
  assert.equal(notes['temporary-credit'].hidden, false);
  assert.equal(notes['ict-inspiration'].hidden, false);
  now.value = credit;
  timers[0][0]();
  assert.equal(notes['temporary-credit'].hidden, true);
  assert.equal(notes['ict-inspiration'].hidden, false, 'ICT line outlives the credit');
  now.value = ict;
  for (const fn of events.focus) fn();
  assert.equal(notes['ict-inspiration'].hidden, true);
  assert.equal(notes['temporary-credit'].hidden, true);
});

test('notes are hidden when first opened after their deadlines', () => {
  const {notes, timers} = run({value: ict + 1000});
  assert.equal(notes['temporary-credit'].hidden, true);
  assert.equal(notes['ict-inspiration'].hidden, true);
  assert.equal(timers.length, 0, 'nothing scheduled after expiry');
});
