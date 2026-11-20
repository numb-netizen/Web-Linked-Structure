const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {renderFooter} = require('../scripts/site-shell.cjs');
const {renderConnections} = require('../scripts/site-navigation.cjs');
const {data, renderPlan} = require('../scripts/study-routines.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = fs.readdirSync(path.join(root, 'site')).filter(name => name.endsWith('.html') && !name.startsWith('google'));

// These static regressions complement the default axe rules and real keyboard tests.
test('shared connection and footer headings have a meaningful, unskipped hierarchy', () => {
  assert.match(renderConnections('physics'), /<h2 class="sr-only">এই পেজের সংযোগ<\/h2>/);
  assert.match(renderFooter(), /<h2 class="sr-only">সাইটের লিংক ও যোগাযোগ<\/h2>/);
  assert.equal((renderFooter().match(/<h3>/g) || []).length, 3);
  assert.doesNotMatch(renderFooter(), /<h4>/);
  for (const name of pages) {
    let previous = 0;
    for (const match of read('site/' + name).matchAll(/<h([1-6])\b[^>]*>/g)) {
      const level = Number(match[1]);
      assert.ok(level <= previous + 1, `${name}: h${previous} followed by h${level}`);
      previous = level;
    }
  }
  const css = read('site/assets/style.css');
  assert.match(css, /\.sr-only\{[^}]*clip-path:inset\(50%\)/);
  assert.match(css, /\.foot h3\{/);
  assert.ok(read('site/assets/text-motion.js').includes('.sr-only'), 'nonvisual headings do not consume motion budgets');
});

test('scrollable source regions have distinct, descriptive names without losing keyboard access', () => {
  for (const name of ['college-info','college-routine','honours-info']) {
    const html = read('site/' + name + '.html');
    const regions = [...html.matchAll(/<div\b[^>]*role="region"[^>]*aria-label="([^"]+)"[^>]*>/g)];
    assert.ok(regions.length > 0, name);
    assert.equal(new Set(regions.map(match => match[1])).size, regions.length, name);
    for (const region of regions) assert.match(region[0], /tabindex="0"/, name);
    assert.doesNotMatch(html, /aria-label="(?:তথ্য টেবিল|মূল ছবিটি);/g, name);
  }
});

test('supplementary cards and named home groups use roles that permit their accessible names', () => {
  const bangla = read('site/bangla.html'), android = read('site/android-app.html'), home = read('site/index.html');
  assert.match(bangla, /<div class="mcq-class-card" role="group" aria-labelledby="bangla-class-title">/);
  assert.match(android, /<div class="android-panel android-note" role="note" aria-labelledby="android-note-title">/);
  assert.match(android, /<h2 id="android-note-title">/);
  for (const className of ['hero-quick-links','cd-card','wrap stats','meet-list']) {
    assert.ok(home.includes(`class="${className}" role="group" aria-label`), className);
  }
});

test('study plans are named regions without JavaScript and can legally become tab panels', () => {
  for (const department of data.departments) {
    const html = renderPlan(department);
    assert.ok(html.startsWith(`<div class="routine-plan" id="${department.id}" data-routine-panel role="region" aria-labelledby="${department.id}-plan-title">`));
    assert.ok(html.endsWith('</div>'));
    assert.doesNotMatch(html, /<article/);
    for (const kind of ['daily','week']) assert.ok(html.includes(`aria-labelledby="${department.id}-plan-title ${department.id}-${kind}-title"`), 'subregion names distinguish departments when all plans are visible');
    assert.doesNotMatch(html.slice(0,html.indexOf('>')), /\bhidden\b/);
  }
});

test('complex class-routine cells explicitly identify the applicable day, class, department and time', () => {
  const table = read('site/college-routine.html').match(/<table class="college-table routine-table">[\s\S]*?<\/table>/)[0];
  const headers = [...table.matchAll(/<th\b([^>]*)>([^<]+)<\/th>/g)];
  const byId = new Map(headers.map(match => [match[1].match(/\bid="([^"]+)"/)[1], match[2]]));
  assert.equal(byId.size, headers.length, 'every column and row header has a unique ID');
  assert.equal(headers.filter(match => match[1].includes('scope="col"')).length, 11);
  assert.equal(headers.filter(match => match[1].includes('scope="rowgroup"')).length, 5, 'only a day spans an entire tbody');
  for (const cell of table.matchAll(/<(th|td)\b([^>]*)>/g)) {
    const reference = cell[2].match(/\bheaders="([^"]+)"/);
    if (cell[1] === 'th' && cell[2].includes('scope="col"')) continue;
    assert.ok(reference, cell[0]);
    const ids = reference[1].split(' ');
    for (const id of ids) assert.ok(byId.has(id), `${cell[0]}: missing ${id}`);
    if (cell[1] !== 'td') continue;
    assert.ok(ids.some(id => id.startsWith('routine-column-')), cell[0]);
    assert.ok(ids.some(id => id.startsWith('routine-day-')), cell[0]);
    const span = Number((cell[2].match(/rowspan="(\d+)"/) || [null, '1'])[1]);
    assert.equal(ids.some(id => id.startsWith('routine-class-')), span < 6, cell[0]);
    assert.equal(ids.some(id => id.startsWith('routine-department-')), span === 1, cell[0]);
  }
});

test('pull requests run the complete browser suite, including all-page default accessibility rules', () => {
  const workflow = read('.github/workflows/site-tests.yml'), browser = read('tests/accessibility-browser.cjs');
  assert.match(workflow, /\n  pull_request:\n/);
  assert.match(workflow, /for suite in android web-linked galaxy text-motion study-routines bangla-mcq accessibility/);
  assert.match(browser, /readdirSync/);
  assert.match(browser, /'target-size':\{enabled:true\}/);
  assert.doesNotMatch(browser, /runOnly:/, 'do not silently omit heading, landmark and other best-practice checks');
});
