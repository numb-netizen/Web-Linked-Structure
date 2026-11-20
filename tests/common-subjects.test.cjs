const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const common = ['bangla', 'bangla-2', 'english', 'english-2', 'ict'];

for (const dept of ['science', 'arts', 'commerce']) {
  test(`${dept}: common subjects appear once in department cards and in the shared network directory`, () => {
    const page = read(`${dept}.html`);
    const shared = read('index.html').match(/data-graph-group="common">([\s\S]*?)<\/div>/)[1];
    for (const subject of common) {
      assert.equal((page.match(new RegExp(`<a class="subj reveal" href="${subject}\\.html">`, 'g')) || []).length, 1);
      assert.equal((shared.match(new RegExp(`href="${subject}\\.html"`, 'g')) || []).length, 1);
      assert.ok(fs.existsSync(path.join(site, `${subject}.html`)));
    }
  });
}

test('shared subject pages do not label themselves science-only', () => {
  for (const subject of ['bangla', 'english', 'ict']) {
    const page = read(`${subject}.html`);
    assert.match(page, /<span class="tag g">সকল বিভাগ<\/span>/);
    assert.doesNotMatch(page, /<a href="science.html">বিজ্ঞান বিভাগ<\/a><span class="sep">/);
    assert.match(page, new RegExp(`data-subject="${subject}"`));
  }
});
