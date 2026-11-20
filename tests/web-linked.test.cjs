const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {pages, subjectGroups, subjects, departments, tools, graph, fileOf, hrefFor, neighborsOf} = require('../scripts/site-graph.cjs');
const {diagramNodes, diagramEdges, renderHomeNetwork, renderConnections, updatePage, generate} = require('../scripts/site-navigation.cjs');
const {makeManifest} = require('../scripts/offline-manifest.cjs');
const root = path.resolve(__dirname, '..'), site = path.join(root, 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const publicIds = Object.keys(pages);
const panelOf = id => read(fileOf(id)).match(/<!-- PAGE CONNECTIONS:START -->([\s\S]*?)<!-- PAGE CONNECTIONS:END -->/)[0];
const linkedIds = html => [...html.matchAll(/<a\b[^>]*\bdata-page="([^"]+)"/g)].map(m => m[1]);

test('the web-linked graph covers exactly the indexed pages, not retired or verification URLs', () => {
  const indexed = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname.slice(1) || 'index.html');
  assert.deepEqual(publicIds.map(fileOf).sort(), indexed.sort());
  assert.equal(subjects.length, 17);
  for (const id of publicIds) {
    assert.ok(fs.existsSync(path.join(site, fileOf(id))), id);
    assert.ok(graph[id].size >= 3, `${id} is not a dead end`);
    assert.equal(graph[id].has(id), false, `${id} must not link to itself`);
    for (const other of graph[id]) {
      assert.ok(pages[other], `${id}: unknown target ${other}`);
      assert.ok(graph[other].has(id), `${id} / ${other}: links must be reciprocal`);
    }
  }
  for (const id of ['dabi', 'geography', 'bangladesh']) assert.equal(Object.hasOwn(pages, id), false);
});

test('every declared relationship is an ordinary HTML link in both directions', () => {
  for (const id of publicIds.filter(id => id !== 'index')) {
    const panel = panelOf(id), actual = linkedIds(panel);
    const expected = neighborsOf(id).filter(other => other !== 'index');
    assert.deepEqual(actual.slice().sort(), expected.slice().sort(), id);
    assert.equal(new Set(actual).size, actual.length, `${id}: duplicate connection`);
    assert.ok(read(fileOf(id)).includes(renderConnections(id)), `${id}: generated panel`);
    assert.ok(panel.includes('<details class="connection-panel"'), `${id}: usable without scripts`);
    assert.doesNotMatch(panel, /<script|onclick=|javascript:/i, id);
    for (const other of expected) assert.ok(panel.includes(`href="${hrefFor(id, other)}"`), `${id} → ${other}`);
  }
  const home = renderHomeNetwork();
  assert.ok(read('index.html').includes(home));
  assert.deepEqual([...new Set(linkedIds(home))].sort(), publicIds.filter(id => id !== 'index').sort());
});

test('the actual contextual links connect all subpages without ever passing through home', () => {
  const visited = new Set(), pending = ['physics'];
  while (pending.length) {
    const id = pending.shift();
    if (visited.has(id)) continue;
    assert.notEqual(id, 'index');
    visited.add(id);
    pending.push(...linkedIds(panelOf(id)).filter(other => !visited.has(other)));
  }
  assert.deepEqual([...visited].sort(), publicIds.filter(id => id !== 'index').sort());
});

test('common subjects link to all departments, while subject classification stays accurate', () => {
  for (const id of subjectGroups.common) {
    for (const department of departments) {
      assert.ok(graph[id].has(department), `${id} ↔ ${department}`);
      assert.ok(panelOf(id).includes(`href="${fileOf(department)}"`));
      assert.ok(panelOf(department).includes(`href="${fileOf(id)}"`));
    }
  }
  for (const department of departments) {
    const actual = neighborsOf(department).filter(id => pages[id].kind === 'subject');
    assert.deepEqual(actual.slice().sort(), [...subjectGroups.common, ...subjectGroups[department]].sort());
  }
  assert.equal(graph.commerce.has('economics'), false);
  assert.equal(graph.arts.has('economics'), true);
  for (const id of subjects) {
    assert.doesNotMatch(read(fileOf(id)), /class="sib-nav"|আগের সাবজেক্ট|পরের সাবজেক্ট/, id);
    for (const tool of tools) assert.ok(graph[id].has(tool), `${id} ↔ ${tool}`);
  }
});

test('the network diagram only illustrates real, reciprocal connections', () => {
  const home = renderHomeNetwork(), ids = new Set(diagramNodes.map(node => node.id));
  assert.equal(ids.size, diagramNodes.length);
  for (const [a, b] of diagramEdges) {
    assert.ok(ids.has(a) && ids.has(b));
    assert.ok(graph[a].has(b) && graph[b].has(a));
    assert.ok(home.includes(`data-from="${a}" data-to="${b}"`));
  }
  assert.match(home, /<svg class="network-lines"[^>]*aria-hidden="true"[^>]*focusable="false"/);
  assert.match(home, /রেখাগুলো সরাসরি লিংকের উদাহরণ/);
  assert.doesNotMatch(home, /class="tree/);
});

test('all subjects have unique tracker/class deep links and contextual return links', () => {
  const tracker = read('tracker.html'), classes = read('classes.html');
  for (const id of subjects) {
    assert.equal((tracker.match(new RegExp(`id="track-${id}"`, 'g')) || []).length, 1, id);
    assert.equal((classes.match(new RegExp(`id="class-${id}"`, 'g')) || []).length, 1, id);
    assert.ok(tracker.includes(`class="tracker-subject-link" href="${fileOf(id)}"`), id);
    assert.ok(classes.includes(`class="resource-subject-link" href="${fileOf(id)}"`), id);
    assert.ok(panelOf(id).includes(`href="tracker.html#track-${id}"`), id);
    assert.ok(panelOf(id).includes(`href="classes.html#class-${id}"`), id);
  }
  // The English second-paper page has several tracker cards, but one jump target.
  assert.ok((tracker.match(/data-subject="english-2" id="track-english-2"/g) || []).length === 1);
});

test('all navigable pages expose the network shortcut and ship local, offline-compatible styles', () => {
  for (const name of fs.readdirSync(site).filter(name => name.endsWith('.html'))) {
    const html = read(name);
    if (!html.includes('id="navLinks"')) continue;
    assert.equal((html.match(/class="network-nav-link" href="index.html#structure"/g) || []).length, 1, name);
    assert.equal((html.match(/href="assets\/network.css\?v=2"/g) || []).length, 1, name);
    if (['dabi.html', 'geography.html', 'bangladesh.html'].includes(name)) assert.doesNotMatch(html, /PAGE CONNECTIONS:START/, name);
  }
  const css = read('assets/network.css');
  for (const rule of ['focus-visible', 'prefers-reduced-motion', '@media(max-width:700px)', 'scroll-margin-top:calc(var(--header-height) + 20px)']) assert.ok(css.includes(rule), rule);
  assert.doesNotMatch(css, /@import|https?:\/\//);
  assert.ok(makeManifest(site).files.some(file => file.path === 'assets/network.css'));
});

test('navigation generation is deterministic, and --check never writes stale files', () => {
  execFileSync(process.execPath, ['scripts/site-navigation.cjs', '--check'], {cwd:root});
  assert.deepEqual(generate({check:true}), []);
  for (const name of fs.readdirSync(site).filter(name => name.endsWith('.html'))) assert.equal(updatePage(name, read(name)), read(name), name);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'web-linked-'));
  try {
    const file = path.join(temp, 'physics.html'), original = read('physics.html');
    const stale = original.replace('হোমে না ফিরেই সম্পর্কিত পেজে যাও', 'stale navigation');
    fs.writeFileSync(file, stale);
    assert.deepEqual(generate({root:temp, check:true}), ['physics.html']);
    assert.equal(fs.readFileSync(file, 'utf8'), stale, 'check must be read-only');
    assert.deepEqual(generate({root:temp}), ['physics.html']);
    assert.equal(fs.readFileSync(file, 'utf8'), original);
    assert.deepEqual(generate({root:temp}), []);
  } finally { fs.rmSync(temp, {recursive:true, force:true}); }
});
