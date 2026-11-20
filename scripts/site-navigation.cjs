// Generate static web-linked navigation. No runtime fetch, framework or database is needed.
//   node scripts/site-navigation.cjs          update the checked-in HTML
//   node scripts/site-navigation.cjs --check  detect stale navigation without writing
const fs = require('node:fs');
const path = require('node:path');
const {icon, withShell} = require('./site-shell.cjs');
const {pages, subjectGroups, subjects, tools, college, graph, fileOf, hrefFor, neighborsOf} = require('./site-graph.cjs');
const {renderStudyRoutines, renderRoutinePreview, renderDepartmentRoutine} = require('./study-routines.cjs');
const {renderCollegePortals} = require('./college-portals.cjs');
const SITE = path.resolve(__dirname, '..', 'site');
const CSS = '<link rel="stylesheet" href="assets/network.css?v=2">';
const NAV = '<a class="network-nav-link" href="index.html#structure">পেজ নেটওয়ার্ক</a>';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const bn = value => String(value).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);

const diagramNodes = [
  {id:'science', x:17, y:18, caption:'বিভাগ'},
  {id:'arts', x:50, y:18, caption:'বিভাগ'},
  {id:'commerce', x:83, y:18, caption:'বিভাগ'},
  {id:'ict', x:50, y:50, caption:'সবার সাধারণ বিষয়'},
  {id:'classes', x:17, y:82, caption:'পড়ার টুল'},
  {id:'tracker', x:50, y:82, caption:'পড়ার টুল'},
  {id:'routine', x:83, y:82, caption:'পড়ার টুল'},
];
// An illustrative subset of the real links, not a parent/child tree.
const diagramEdges = [
  ['science','arts'], ['arts','commerce'],
  ['science','ict'], ['arts','ict'], ['commerce','ict'],
  ['ict','classes'], ['ict','tracker'], ['ict','routine'],
  ['classes','tracker'], ['tracker','routine'],
  ['science','classes'], ['commerce','routine'],
  ['science','routine'], ['commerce','classes'],
];

function chip(from, to, className = 'network-chip') {
  const page = pages[to];
  return `<a class="${className}" data-page="${to}" href="${escape(hrefFor(from, to))}">${escape(page.shortLabel || page.label)}</a>`;
}
function renderHomeNetwork() {
  const positions = Object.fromEntries(diagramNodes.map(node => [node.id, node]));
  const lines = diagramEdges.map(([a, b]) => {
    if (!graph[a].has(b)) throw new Error(`Diagram shows a nonexistent connection: ${a} / ${b}`);
    const start = positions[a], end = positions[b];
    return `          <line data-from="${a}" data-to="${b}" x1="${start.x * 10}" y1="${(start.y * 4.3).toFixed(1)}" x2="${end.x * 10}" y2="${(end.y * 4.3).toFixed(1)}"/>`;
  }).join('\n');
  const nodes = diagramNodes.map(node => {
    const page = pages[node.id];
    return `        <a class="network-node${node.id === 'ict' ? ' network-node--shared' : ''}" data-page="${node.id}" href="${fileOf(node.id)}" style="--node-x:${node.x}%;--node-y:${node.y}%"><span aria-hidden="true">${icon(page.icon)}</span><strong>${escape(page.shortLabel || page.label)}</strong><small>${node.caption}</small></a>`;
  }).join('\n');
  const directoryGroups = [
    ['common', 'সাধারণ বিষয় · সব বিভাগ', subjectGroups.common],
    ['science', 'বিজ্ঞানের বিষয়', ['science', ...subjectGroups.science]],
    ['arts', 'মানবিকের বিষয়', ['arts', ...subjectGroups.arts]],
    ['commerce', 'ব্যবসায় শিক্ষার বিষয়', ['commerce', ...subjectGroups.commerce]],
    ['tools', 'পড়ার টুল ও সহায়তা', [...tools, 'android-app', 'feedback']],
    ['college', 'কলেজ ও কমিউনিটি', college],
  ];
  const directory = directoryGroups.map(([id, title, ids]) => `      <div class="network-directory-group" data-graph-group="${id}">
        <h3>${title}</h3>
        <div class="network-chip-list">${ids.map(to => chip('index', to)).join('')}</div>
      </div>`).join('\n');
  return `<!-- WEB-LINKED NETWORK:START -->
<section id="structure" aria-labelledby="network-title">
  <div class="wrap">
    <div class="section-heading"><div>
      <div class="eyebrow">বিষয় ও পেজ ডিরেক্টরি</div>
      <h2 class="title" id="network-title">প্রতিটি বিষয়, <span class="grad">একটি সহজ সংযোগ</span></h2>
      <p class="structure-note">এই ওয়েবসাইটটি <strong>ওয়েব-লিংকড (নেটওয়ার্ক) স্ট্রাকচারে</strong> সাজানো। হোমে ফিরে না গিয়েই সম্পর্কিত বিষয়, ক্লাস, ট্র্যাকার ও রুটিনে সরাসরি যাওয়া যায়।</p>
    </div><span class="network-badge" lang="en">WEB-LINKED</span></div>
    <form class="directory-search" role="search" aria-label="পড়ার পেজ খুঁজুন" hidden>
      <label for="directory-query">বিষয় বা পেজ খুঁজুন</label>
      <div class="search-field">${icon('search')}<input id="directory-query" type="search" autocomplete="off" placeholder="যেমন: পদার্থবিজ্ঞান, physics, রুটিন…" aria-controls="page-directory" aria-describedby="directory-status"><button type="button" data-search-reset hidden>মুছুন</button></div>
    </form>
    <p class="directory-status" id="directory-status" role="status" aria-live="polite" hidden></p>
    <div class="network-directory" id="page-directory" role="navigation" aria-label="বিষয় ও দরকারি পেজে সরাসরি যাও">
${directory}
    </div>
    <div class="directory-empty" id="directory-empty" hidden>${icon('search')}<h3>মিলছে এমন কোনো পেজ পাওয়া যায়নি</h3><p>বিষয়ের নাম বা অন্য কোনো শব্দ দিয়ে আবার খুঁজুন।</p><button class="btn btn-g" type="button" data-search-reset>সব পেজ দেখুন</button></div>
    <p class="network-disclaimer">বিষয়ের এই বিন্যাস পড়ার পেজ খোঁজার জন্য; কলেজের অনুমোদিত বিষয়তালিকা ও নিজের নিবন্ধন অনুযায়ী বিষয় বেছে নিন।</p>
    <details class="network-diagram">
      <summary><span>${icon('network')} পেজগুলোর সংযোগ দেখুন</span><span class="diagram-summary-note">ওয়েব-লিংকড স্ট্রাকচার</span></summary>
      <div class="web-network">
        <div class="network-map-heading"><p>কয়েকটি পেজের সংযোগ · প্রতিটি বক্সেই সরাসরি লিংক</p></div>
        <div class="network-map" role="group" aria-label="বিভাগ, সাধারণ বিষয় ও পড়ার টুলের সংযোগ">
          <svg class="network-lines" viewBox="0 0 1000 430" preserveAspectRatio="none" aria-hidden="true" focusable="false">
${lines}
          </svg>
${nodes}
        </div>
        <p class="network-map-note">প্রতিটি বক্স একটি পেজ, রেখাগুলো সরাসরি লিংকের উদাহরণ। প্রতিটি পেজের <strong>“এই পেজের সংযোগ”</strong> অংশ থেকে অন্য সম্পর্কিত পেজে যাওয়া যাবে।</p>
      </div>
    </details>
  </div>
</section>
<!-- WEB-LINKED NETWORK:END -->`;

}

function renderConnections(id) {
  const neighbors = neighborsOf(id).filter(to => to !== 'index');
  const kinds = [
    ['subject', pages[id].kind === 'subject' ? 'সম্পর্কিত বিষয়' : 'বিষয়ে সরাসরি যাও'],
    ['department', 'বিভাগে যাও'], ['tool', 'পড়ার টুল'],
    ['college', 'কলেজ ও কমিউনিটি'], ['help', 'সহায়তা'],
  ];
  const groups = kinds.map(([kind, title]) => {
    const ids = neighbors.filter(to => pages[to].kind === kind);
    if (!ids.length) return '';
    return `      <div class="connection-group"><h3>${title}</h3><div class="network-chip-list">${ids.map(to => chip(id, to)).join('')}</div></div>`;
  }).filter(Boolean).join('\n');
  // Keep long directories compact. Native details stays keyboard- and no-JS-accessible.
  const open = neighbors.length <= 12 ? ' open' : '';
  return `<!-- PAGE CONNECTIONS:START -->
<aside class="page-connections wrap" aria-label="এই পেজের সংযোগ">
  <h2 class="sr-only">এই পেজের সংযোগ</h2>
  <details class="connection-panel"${open}>
    <summary><span class="connection-heading"><span>${icon('network')}</span><span><strong>এই পেজের সংযোগ</strong><small>হোমে না ফিরেই সম্পর্কিত পেজে যাও</small></span></span><span class="connection-count">${bn(neighbors.length)}টি লিংক</span></summary>
    <div class="connection-groups" role="navigation" aria-label="এই পেজের সঙ্গে সম্পর্কিত পেজগুলো">
${groups}
    </div>
    <p class="connection-map-link"><a href="index.html#structure">সব পেজের নেটওয়ার্ক দেখো ↗</a></p>
  </details>
</aside>
<!-- PAGE CONNECTIONS:END -->`;
}

function decorateTracker(html) {
  const seen = new Set();
  return html.replace(/<div class="tcard" data-subject="([^"]+)"(?: id="track-[^"]+")?>([\s\S]*?<\/header>)(?:\n  <a class="tracker-subject-link"[^>]*>[^<]*<\/a>)?/g, (all, id, header) => {
    if (!subjects.includes(id)) throw new Error(`Unknown tracker subject: ${id}`);
    const anchor = seen.has(id) ? '' : ` id="track-${id}"`;
    seen.add(id);
    return `<div class="tcard" data-subject="${id}"${anchor}>${header}\n  <a class="tracker-subject-link" href="${fileOf(id)}">বিষয়ের প্রস্তুতি পেজ ↗</a>`;
  });
}

function decorateClasses(html) {
  // The two paper pages already exist. Give them the same reciprocal resource links.
  const missing = [
    ['bangla-2', 'HSC বাংলা ২য় পত্র ক্লাস'],
    ['english-2', 'HSC English 2nd paper class'],
  ].filter(([id]) => !html.includes(`<h3>${pages[id].label}</h3>`));
  if (missing.length) {
    const cards = missing.map(([id, query]) => {
      const page = pages[id];
      return `<div class="res reveal"><div class="ic">${page.icon}</div><h3>${page.label}</h3>
  <p>বিষয়ভিত্তিক ভিডিও ক্লাস খুঁজে দেখো</p>
  <a class="dl" href="https://www.youtube.com/results?search_query=${encodeURIComponent(query)}" target="_blank" rel="noopener">ক্লাস দেখো ▶</a></div>`;
    }).join('\n');
    const end = '\n</div>\n</div></section>';
    if (!html.includes(end)) throw new Error('Cannot find the subject resource grid in classes.html');
    html = html.replace(end, `\n${cards}${end}`);
  }
  const seen = new Set();
  html = html.replace(/<div class="res reveal"(?: id="class-[^"]+")?><div class="ic">([\s\S]*?)<\/div><h3>([^<]+)<\/h3>([\s\S]*?)<\/div>/g, (all, icon, title, body) => {
    const id = subjects.find(id => pages[id].label === title);
    if (!id) throw new Error(`Unknown class subject: ${title}`);
    seen.add(id);
    const clean = body.replace(/\n  <a class="resource-subject-link"[^>]*>[^<]*<\/a>/g, '');
    return `<div class="res reveal" id="class-${id}"><div class="ic">${icon}</div><h3>${title}</h3>${clean}\n  <a class="resource-subject-link" href="${fileOf(id)}">বিষয়ের প্রস্তুতি পেজ ↗</a></div>`;
  });
  if (seen.size !== subjects.length) throw new Error('Each subject needs a class resource card');
  return html;
}

function decorateStudyContent(id, html) {
  let next = html;
  if (id === 'routine') {
    const block = /<!-- STUDY ROUTINES:START -->[\s\S]*?<!-- STUDY ROUTINES:END -->/;
    const legacy = /<section style="padding-top:10px">[\s\S]*?<\/section>/;
    if (!block.test(next) && !legacy.test(next)) throw new Error('Cannot find the study routine content');
    next = next.replace(block.test(next) ? block : legacy, renderStudyRoutines());
    next = next.replace(/\n?<link rel="stylesheet" href="assets\/study-routines\.css[^"<>]*">/g, '');
    next = next.replace(/(<link rel="stylesheet" href="assets\/style\.css[^"<>]*">)/, '$1\n<link rel="stylesheet" href="assets/study-routines.css?v=1">');
    next = next.replace(/\n?<script src="assets\/study-routines\.js[^"<>]*"><\/script>/g, '');
    next = next.replace('</body>', '<script src="assets/study-routines.js?v=1"></script>\n</body>');
  }
  if (['science', 'arts', 'commerce'].includes(id)) {
    next = next.replace(/\n?<!-- DEPARTMENT ROUTINE:START -->[\s\S]*?<!-- DEPARTMENT ROUTINE:END -->/g, '');
    next = next.replace(/(<header class="page-head">[\s\S]*?)(\n  <\/div>\n<\/header>)/, `$1\n${renderDepartmentRoutine(id)}$2`);
  }
  if (id === 'index') {
    const block = /<!-- ROUTINE PREVIEW:START -->[\s\S]*?<!-- ROUTINE PREVIEW:END -->/;
    next = block.test(next) ? next.replace(block, renderRoutinePreview())
      : next.replace("<!-- COLLEGE NOTICE: PARENTS' MEETING 2026 -->", renderRoutinePreview() + "\n\n<!-- COLLEGE NOTICE: PARENTS' MEETING 2026 -->");
  }
  if (['index', 'college-info'].includes(id)) {
    const block = /<!-- COLLEGE PORTALS:START -->[\s\S]*?<!-- COLLEGE PORTALS:END -->/;
    const anchor = id === 'index' ? '<!-- WEB-LINKED NETWORK:START -->' : '<section class="college-section"><h2>কলেজের যোগাযোগ</h2>';
    if (!block.test(next) && !next.includes(anchor)) throw new Error(`Cannot place college portals on ${id}`);
    next = block.test(next) ? next.replace(block, renderCollegePortals()) : next.replace(anchor, renderCollegePortals() + '\n' + anchor);
  }
  return next;
}

function updatePage(name, html) {
  if (!html.includes('<div class="links" id="navLinks">')) return html; // Verification files are untouched.
  const id = name.replace(/\.html$/, '');
  let next = decorateStudyContent(id, html).replace(/\n?<link rel="stylesheet" href="assets\/network\.css\?v=[^"]+">/g, '');
  next = next.replace(/(<link rel="stylesheet" href="assets\/style\.css[^"<>]*">)/, `$1\n${CSS}`);
  next = next.replace(/<a class="network-nav-link"[^>]*>[^<]*<\/a>/g, '');
  next = next.replace(/(<div class="links" id="navLinks">[\s\S]*?<a href="index\.html"[^>]*>[^<]*<\/a>)/, `$1${NAV}`);
  if (id === 'index') {
    const block = /<!-- WEB-LINKED NETWORK:START -->[\s\S]*?<!-- WEB-LINKED NETWORK:END -->/;
    const old = /<!-- TREE STRUCTURE -->\n<section id="structure">[\s\S]*?<\/section>/;
    if (!block.test(next) && !old.test(next)) throw new Error('Cannot find the home page network section');
    return withShell(id, next.replace(block.test(next) ? block : old, renderHomeNetwork()));
  }
  if (!pages[id]) return withShell(id, next); // Keep retired URLs as notices, out of the public graph.
  next = next.replace(/\n?<!-- PAGE CONNECTIONS:START -->[\s\S]*?<!-- PAGE CONNECTIONS:END -->\n?/g, '');
  if (next.includes('</header>')) next = next.replace(/<\/header>\s*/, `</header>\n${renderConnections(id)}\n`);
  else if (next.includes('</main>')) next = next.replace(/<\/main>\s*/, `</main>\n${renderConnections(id)}\n`);
  else throw new Error(`Cannot find a content landmark in ${name}`);
  if (pages[id].kind === 'subject') next = next.replace(/\n  <div class="sib-nav">[\s\S]*?<\/div>/g, '');
  if (id === 'tracker') next = decorateTracker(next);
  if (id === 'classes') next = decorateClasses(next);
  return withShell(id, next);
}

function generate({check = false, root = SITE} = {}) {
  const stale = [];
  for (const name of fs.readdirSync(root).filter(name => name.endsWith('.html')).sort()) {
    const file = path.join(root, name), html = fs.readFileSync(file, 'utf8');
    const next = updatePage(name, html);
    if (next === html) continue;
    stale.push(name);
    if (!check) fs.writeFileSync(file, next);
  }
  return stale;
}
if (require.main === module) {
  const check = process.argv.includes('--check'), stale = generate({check});
  if (check && stale.length) {
    console.error(`Web-linked navigation out of date: ${stale.join(', ')}\nRun node scripts/site-navigation.cjs`);
    process.exitCode = 1;
  } else console.log(check ? 'Web-linked navigation is up to date' : `Web-linked navigation updated on ${stale.length} page(s)`);
}
module.exports = {diagramNodes, diagramEdges, renderHomeNetwork, renderConnections, decorateTracker, decorateClasses, updatePage, generate};
