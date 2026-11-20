const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {data, renderPlan, renderStudyRoutines, renderRoutinePreview, renderDepartmentRoutine} = require('../scripts/study-routines.cjs');
const {pages, subjectGroups, hrefFor} = require('../scripts/site-graph.cjs');
const {makeManifest} = require('../scripts/offline-manifest.cjs');
const site = path.resolve(__dirname, '../site');
const read = file => fs.readFileSync(path.join(site, file), 'utf8');

test('science, humanities and business each have seven distinct, correctly classified study days', () => {
  assert.equal(data.schemaVersion, 1);
  assert.deepEqual(data.departments.map(department => department.id), ['science', 'arts', 'commerce']);
  assert.match(data.notice, /প্রস্তাবিত/);
  assert.match(data.notice, /অফিসিয়াল ক্লাস রুটিন নয়/);
  assert.equal(data.sessions.length, 5);
  assert.equal(new Set(data.sessions.map(session => session.key)).size, 5);
  assert.equal(data.sessions.reduce((sum, session) => sum + session.minutes, 0), 185);
  for (const session of data.sessions) assert.ok(Number.isInteger(session.minutes) && session.minutes >= 10 && session.minutes <= 60);
  for (const department of data.departments) {
    assert.deepEqual(department.week.map(day => day.day), ['শনিবার','রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার']);
    assert.deepEqual(Object.keys(department.methods).sort(), data.sessions.map(session => session.key).sort());
    const main = new Set(), common = new Set();
    for (const day of department.week) {
      assert.ok(day.task && day.subjects.length >= 1 && day.common.length >= 1);
      assert.equal(new Set(day.subjects).size, day.subjects.length);
      for (const id of day.subjects) { assert.ok(subjectGroups[department.id].includes(id), `${department.id}: ${id}`); main.add(id); }
      for (const id of day.common) { assert.ok(subjectGroups.common.includes(id), `${department.id}: ${id}`); common.add(id); }
    }
    assert.deepEqual([...main].sort(), subjectGroups[department.id].slice().sort());
    assert.deepEqual([...common].sort(), subjectGroups.common.slice().sort());
  }
});

test('the checked-in plans are complete, accessible ordinary HTML, not runtime-fetched content', () => {
  const html = read('routine.html');
  assert.ok(html.includes(renderStudyRoutines()));
  assert.doesNotMatch(renderStudyRoutines(), /<script|onclick=|\bhidden\b[^>]*data-routine-panel|data-routine-panel[^>]*\bhidden\b/);
  assert.match(html, /<button[^>]*data-routine-print hidden>/);
  for (const department of data.departments) {
    const plan = renderPlan(department);
    assert.ok(plan.startsWith(`<div class="routine-plan" id="${department.id}" data-routine-panel role="region"`), 'a div allows both region and tabpanel roles');
    assert.equal((plan.match(/<li>/g) || []).length, 5);
    assert.equal((plan.match(/<th scope="row">/g) || []).length, 7);
    assert.equal((plan.match(/<th scope="col">/g) || []).length, 3);
    assert.match(plan, /<caption>[^<]+<\/caption>/);
    assert.match(plan, /tabindex="0" role="region" aria-label=/);
    assert.ok(plan.includes('শুধু নিজের নিবন্ধিত বিষয়'));
    assert.ok(plan.includes('সবগুলো বিষয় বাধ্যতামূলক নয়'));
    assert.ok(plan.includes(`href="${department.id}.html"`));
    for (const [, file] of plan.matchAll(/href="([a-z0-9-]+\.html)"/g)) assert.ok(fs.existsSync(path.join(site, file)), file);
    assert.equal((html.match(new RegExp(`id="${department.id}"`, 'g')) || []).length, 1);
  }
  for (const token of ['<noscript>', 'href="college-routine.html"', 'href="hsc-2027-routine.html"', 'বিরতি', 'পর্যাপ্ত ঘুম']) assert.ok(html.includes(token), token);
});

test('home, departments and related subjects deep-link to the matching routine and back', () => {
  assert.ok(read('index.html').includes(renderRoutinePreview()));
  for (const department of data.departments) {
    const id = department.id;
    assert.ok(read(id + '.html').includes(renderDepartmentRoutine(id)));
    assert.equal(hrefFor(id, 'routine'), `routine.html#${id}`);
    for (const subject of subjectGroups[id]) {
      assert.equal(hrefFor(subject, 'routine'), `routine.html#${id}`);
      assert.ok(read(subject + '.html').includes(`data-page="routine" href="routine.html#${id}"`), subject);
      assert.ok(renderPlan(department).includes(`href="${subject}.html"`));
    }
  }
  for (const subject of [...subjectGroups.common, 'classes', 'tracker', 'index']) assert.equal(hrefFor(subject, 'routine'), 'routine.html');
  assert.throws(() => renderDepartmentRoutine('unknown'), /Unknown/);
  assert.ok(Object.keys(pages).includes('routine'));
});

test('routine assets preserve no-script/print fallbacks and do not create accounts, requests or storage', () => {
  const html = read('routine.html'), script = read('assets/study-routines.js'), css = read('assets/study-routines.css');
  for (const file of ['study-routines.css','study-routines.js']) assert.ok(html.includes(`assets/${file}?v=1`));
  assert.doesNotMatch(script, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|setInterval|setTimeout/);
  for (const token of ["'role', 'tablist'", "'role', 'tab'", "'role', 'tabpanel'", 'aria-selected', 'aria-controls', 'ArrowRight', 'ArrowLeft', 'Home', 'End', 'popstate', 'hashchange', 'pushState']) assert.ok(script.includes(token), token);
  assert.match(css, /@media print/);
  assert.match(css, /\.routine-plan,\.routine-plan\[hidden\]\{display:block!important/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(css, /https?:|@import/);
  const manifest = makeManifest(site).files.map(entry => entry.path);
  for (const file of ['routine.html','assets/study-routines.css','assets/study-routines.js']) assert.ok(manifest.includes(file));
});
