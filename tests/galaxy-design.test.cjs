const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const {renderGalaxyBackdrop} = require('../scripts/site-shell.cjs');
const {makeManifest} = require('../scripts/offline-manifest.cjs');
const site = path.join(__dirname, '../site');
const read = file => fs.readFileSync(path.join(site, file), 'utf8');
const script = read('assets/galaxy.js');

test('all 35 shells include versioned local galaxy fields and an accessible pause control', () => {
  const pages = fs.readdirSync(site).filter(name => name.endsWith('.html') && !name.startsWith('google'));
  assert.equal(pages.length, 35);
  for (const file of pages) {
    const html = read(file);
    assert.ok(html.includes(renderGalaxyBackdrop()), file);
    for (const token of ['<!-- GALAXY SKY:START -->','assets/galaxy.css?v=2','assets/galaxy.js?v=2','class="galaxy-toggle"','data-galaxy-field="ambient"']) assert.equal(html.split(token).length - 1, 1, `${file}: ${token}`);
    assert.ok(html.indexOf('assets/galaxy.css') > html.indexOf('assets/theme.css'), file);
    assert.ok(html.indexOf('assets/galaxy.js') > html.indexOf('assets/interface.js'), file);
    assert.match(html, /class="galaxy-toggle"[^>]*type="button"[^>]*aria-label="অ্যানিমেশন বিরতি"[^>]*aria-pressed="false"[^>]*hidden/, file);
    assert.match(html, /<svg class="icon galaxy-pause" aria-hidden="true" focusable="false">/, file);
    assert.match(html, /<svg class="icon galaxy-play" aria-hidden="true" focusable="false">/, file);
    assert.doesNotMatch(html, /assets\/(?:home-motion|motion|heading-motion|light-motion|subject-scene)\.(?:css|js)/, file);
  }
});

test('random decorations use CSS-only motion, gated by a working pause control without moving reading text', () => {
  const html = read('index.html'), css = read('assets/galaxy.css');
  assert.match(html, /<div class="hero-galaxy" aria-hidden="true">/);
  assert.match(html, /<div class="galaxy-field" data-galaxy-field="campus"><\/div>/);
  assert.doesNotMatch(html, /<(?:h[1-6]|a|button|figure|img|p)\b[^>]*class="[^"]*galaxy-animated/);
  assert.match(css, /\.galaxy-sky\{[^}]*position:fixed[^}]*pointer-events:none/);
  assert.match(css, /\.hero-galaxy\{[^}]*pointer-events:none/);
  assert.match(css, /\.galaxy-field\{[^}]*pointer-events:none;contain:strict/);
  assert.match(css, /\.galaxy-animated\{animation-play-state:paused\}/);
  assert.match(css, /:root\[data-galaxy-motion="running"\] \.galaxy-animated\{animation-play-state:running\}/);
  assert.ok(css.indexOf('.galaxy-animated{animation-play-state:paused}') > css.indexOf('animation:galaxy-halo-drift '), 'pause fallback follows the final animation shorthand');
  for (const feature of ['prefers-reduced-motion:reduce','prefers-reduced-transparency:reduce','@supports','backdrop-filter:blur']) assert.ok(css.includes(feature), feature);
  for (const pattern of ['nebula-drift','star-drift','light-sweep','mote-float','mote-swirl','meteor-travel','halo-drift']) assert.ok(css.includes('@keyframes galaxy-' + pattern), pattern);
  assert.doesNotMatch(css, /@import|https?:|animation:[^;}]*\b[01]s\b/);
  assert.doesNotMatch(script, /fetch\(|XMLHttpRequest|requestAnimationFrame|setInterval|setTimeout|innerHTML|canvas|WebGL/);
  assert.match(script, /Math\.random\(\)/);
  assert.match(script, /document\.createDocumentFragment\(\)/);
  assert.equal((script.match(/localStorage\.getItem/g) || []).length, 1);
  assert.equal((script.match(/localStorage\.setItem/g) || []).length, 1);
});

test('the exact uploaded campus is preserved and used as a local background, not a photo card', () => {
  const image = fs.readFileSync(path.join(site, 'assets/college-campus.webp'));
  const original = fs.readFileSync(path.join(__dirname, '../docs/images/college-campus-original.png'));
  assert.equal(original.subarray(1,4).toString(), 'PNG');
  assert.equal(original.readUInt32BE(16),1000);
  assert.equal(original.readUInt32BE(20),400);
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'a21b677670775c000861c1c4f9f5b566674fb9e47c79ec42ae62f17ccffefadd','preserve the user’s upload, not a different college');
  assert.equal(image.subarray(0,4).toString(), 'RIFF');
  assert.equal(image.subarray(8,12).toString(), 'WEBP');
  assert.ok(image.length < 150 * 1024, 'optimize the background without upscaling');
  const documentation = fs.readFileSync(path.join(__dirname, '../docs/college-photo.md'), 'utf8');
  for (const buffer of [image,original]) assert.ok(documentation.includes(crypto.createHash('sha256').update(buffer).digest('hex')));
  assert.match(documentation, /No open-content license or college endorsement is asserted/);
  const css = read('assets/galaxy.css'), home = read('index.html');
  assert.match(css, /\.campus-backdrop\{[^}]*position:absolute[^}]*url\("college-campus.webp"\)[^}]*\/cover no-repeat/);
  assert.match(css, /\.campus-heading\{[^}]*url\("college-campus.webp"\)/);
  assert.match(home, /<div class="campus-backdrop" role="img" aria-label="[^"]*কলেজের ভবন ও সবুজ ক্যাম্পাস/);
  assert.match(home, /<link rel="preload" as="image" href="assets\/college-campus.webp" fetchpriority="high">/);
  assert.match(read('college-info.html'), /<header class="college-head campus-heading">/);
  for (const file of ['index.html','college-info.html']) {
    const html = read(file);
    assert.match(html, /href="assets\/college-campus.webp" target="_blank" rel="noopener"/);
    assert.doesNotMatch(html, /campus-card|campus-orbit|college-campus"><img|college-gate\.webp|amarsokal24\.com/);
    assert.doesNotMatch(html, /<img[^>]*src="https?:/);
  }
  assert.equal(fs.existsSync(path.join(site,'assets/college-gate.webp')),false,'the rejected image is not shipped');
  const manifest = makeManifest(site);
  for (const file of ['assets/college-campus.webp','assets/galaxy.css','assets/galaxy.js']) assert.ok(manifest.files.some(entry => entry.path === file), file);
  assert.ok(!manifest.files.some(entry => /college-gate/.test(entry.path)));
});

function setup({saved = null, blockedRead = false, blockedWrite = false, reduced = false, hidden = false, noMedia = false, legacyMedia = false, noButton = false, noFields = false, width = 1440, random = Math.random} = {}) {
  const attrs = {}, buttonAttrs = {}, handlers = {}, docHandlers = {}, events = {}, queries = [], reads = [], writes = [], created = [];
  const fields = noFields ? [] : ['ambient','campus'].map(type => ({
    type,children:[],clears:0,
    get childElementCount() {return this.children.length;},
    getAttribute() {return type;},
    appendChild(fragment) {this.children.push(...fragment.children);},
    set textContent(value) {assert.equal(value,'');this.children=[];this.clears++;}
  }));
  const button = {hidden:true, setAttribute(k,v) {buttonAttrs[k] = v;}, addEventListener(k,fn) {handlers[k] = fn;}};
  const document = {
    hidden, documentElement:{setAttribute(k,v) {attrs[k] = v;}},
    querySelector() {return noButton ? null : button;}, querySelectorAll() {return fields;},
    addEventListener(k,fn) {docHandlers[k] = fn;},
    createDocumentFragment() {return {children:[],appendChild(node) {this.children.push(node);}};},
    createElement(tag) {assert.equal(tag,'span');const values={};const node={className:'',values,style:{setProperty(k,v) {values[k]=v;}}};created.push(node);return node;}
  };
  const media = {matches:reduced};
  if (legacyMedia) media.addListener = fn => { handlers.media = fn; };
  else media.addEventListener = (k,fn) => { assert.equal(k,'change'); handlers.media = fn; };
  const window = {innerWidth:width,addEventListener(k,fn) {events[k] = fn;}};
  if (!noMedia) window.matchMedia = query => { queries.push(query); return media; };
  const localStorage = {
    getItem(k) {reads.push(k); if (blockedRead) throw Error('blocked'); return saved;},
    setItem(k,v) {writes.push([k,v]); if (blockedWrite) throw Error('blocked'); saved = v;}
  };
  vm.runInNewContext(script, {document,window,localStorage,Math:{random,floor:Math.floor}});
  return {attrs,buttonAttrs,handlers,docHandlers,events,media,button,document,window,fields,created,queries,reads,writes,getSaved:() => saved};
}
const state = x => x.attrs['data-galaxy-motion'];
const live = x => x.fields.flatMap(field=>field.children);

test('motion starts on, pauses, persists the earlier storage key and resumes without touching progress', () => {
  const x = setup();
  assert.equal(state(x), 'running');
  assert.equal(x.button.hidden, false);
  assert.equal(x.buttonAttrs['aria-pressed'], 'false');
  assert.deepEqual(x.queries, ['(prefers-reduced-motion: reduce)']);
  x.handlers.click();
  assert.equal(state(x), 'paused');
  assert.equal(x.buttonAttrs['aria-pressed'], 'true');
  assert.equal(x.buttonAttrs.title, 'অ্যানিমেশন চালু করুন');
  assert.equal(x.getSaved(), '1');
  assert.equal(state(setup({saved:x.getSaved()})), 'paused');
  x.handlers.click();
  assert.equal(state(x), 'running');
  assert.equal(x.buttonAttrs['aria-pressed'], 'false');
  assert.equal(x.buttonAttrs.title, 'অ্যানিমেশন বন্ধ করুন');
  assert.deepEqual(x.reads, ['site:motion-paused']);
  assert.deepEqual(x.writes, [['site:motion-paused','1'],['site:motion-paused','0']]);
});

test('reduced motion always wins and live preference changes retain a deliberate pause', () => {
  const x = setup({reduced:true});
  assert.equal(state(x), 'reduced');
  assert.equal(x.button.hidden, true);
  x.handlers.click();
  assert.deepEqual(x.writes, []);
  assert.equal(state(x), 'reduced');
  x.media.matches = false;
  x.handlers.media();
  assert.equal(state(x), 'running');
  x.handlers.click();
  x.media.matches = true;
  x.handlers.media();
  assert.equal(state(x), 'reduced');
  assert.equal(x.button.hidden, true);
  x.media.matches = false;
  x.handlers.media();
  assert.equal(state(x), 'paused');
  assert.equal(x.button.hidden, false);
  assert.equal(x.buttonAttrs['aria-pressed'], 'true');
  assert.equal(state(setup({saved:'1',reduced:true})), 'reduced');
});

test('missing or blocked storage does not break the optional pause control', () => {
  for (const options of [{blockedRead:true,blockedWrite:true},{blockedWrite:true}]) {
    const x = setup(options);
    assert.equal(state(x), 'running');
    assert.doesNotThrow(() => x.handlers.click());
    assert.equal(state(x), 'paused');
    assert.equal(x.buttonAttrs['aria-pressed'], 'true');
    x.handlers.click();
    assert.equal(state(x), 'running');
  }
  for (const saved of ['0','unexpected','true','',null]) assert.equal(state(setup({saved})), 'running');
});

test('storage changes synchronize tabs without responding to progress or theme changes', () => {
  const x = setup();
  x.events.storage({key:'site:motion-paused',newValue:'1'});
  assert.equal(state(x), 'paused');
  assert.equal(x.buttonAttrs['aria-pressed'], 'true');
  for (const key of ['site:theme','hsc2027:physics:100']) {
    x.events.storage({key,newValue:'0'});
    assert.equal(state(x), 'paused');
  }
  x.events.storage({key:'site:motion-paused',newValue:'0'});
  assert.equal(state(x), 'running');
  x.events.storage({key:'site:motion-paused',newValue:'1'});
  x.events.storage({key:null,newValue:null});
  assert.equal(state(x), 'running');
  assert.deepEqual(x.writes, [], 'storage events must not cause storage feedback loops');
});

test('background tabs suspend decorative work and restore the user’s original pause state', () => {
  const x = setup({hidden:true});
  assert.equal(state(x), 'hidden');
  x.document.hidden = false;
  x.docHandlers.visibilitychange();
  assert.equal(state(x), 'running');
  x.handlers.click();
  x.document.hidden = true;
  x.docHandlers.visibilitychange();
  assert.equal(state(x), 'hidden');
  x.document.hidden = false;
  x.docHandlers.visibilitychange();
  assert.equal(state(x), 'paused');
});

test('the optional enhancement safely supports missing controls, fields and legacy media APIs', () => {
  assert.doesNotThrow(() => setup({noButton:true}));
  assert.equal(state(setup({noButton:true})), undefined);
  assert.equal(live(setup({noFields:true})).length,0);
  const noMedia = setup({noMedia:true});
  assert.equal(state(noMedia), 'running');
  noMedia.handlers.click();
  assert.equal(state(noMedia), 'paused');
  const legacy = setup({legacyMedia:true});
  legacy.media.matches = true;
  legacy.handlers.media();
  assert.equal(state(legacy), 'reduced');
});

test('plenty of decorations stay inside explicit desktop and phone budgets', () => {
  for (const width of [320,390,760,761,1440,2560]) {
    const x = setup({width}), nodes=live(x), small=width <= 760;
    assert.equal(nodes.length,small ? 63 : 118,width);
    assert.equal(nodes.filter(n=>n.className.startsWith('galaxy-mote ')).length,small ? 52 : 100,width);
    assert.equal(nodes.filter(n=>n.className.startsWith('galaxy-meteor ')).length,small ? 8 : 12,width);
    assert.equal(nodes.filter(n=>n.className.startsWith('galaxy-halo ')).length,small ? 3 : 6,width);
    assert.ok(nodes.every(n=>n.className.endsWith(' galaxy-animated')));
  }
});

test('positions, paths, colors, phases and speeds are genuinely randomized within safe ranges', () => {
  let seed=4127;
  const x = setup({random:()=>{seed=seed*16807%2147483647;return seed/2147483647;}});
  const nodes=live(x);
  assert.ok(new Set(nodes.map(n=>n.values['--x'])).size > 100);
  assert.ok(new Set(nodes.map(n=>n.values['--duration'])).size > 100);
  assert.ok(new Set(nodes.map(n=>n.values['--tone'])).size >= 4);
  assert.ok(new Set(nodes.map(n=>n.values['--dx'])).size > 100);
  for (const n of nodes) {
    const p=n.values;
    assert.ok(parseFloat(p['--x']) >= 2 && parseFloat(p['--x']) <= 98);
    assert.ok(parseFloat(p['--y']) >= 4 && parseFloat(p['--y']) <= 96);
    assert.ok(parseFloat(p['--duration']) >= 7 && parseFloat(p['--duration']) <= 48);
    assert.ok(parseFloat(p['--delay']) <= 0 && parseFloat(p['--delay']) >= -36);
    assert.ok(parseFloat(p['--alpha']) >= .25 && parseFloat(p['--alpha']) <= .7);
    assert.match(p['--tone'],/^#[a-f0-9]{6}$/);
  }
});

test('initial reduced motion, saved pauses and hidden tabs allocate no particles', () => {
  for (const options of [{reduced:true},{saved:'1'},{hidden:true}]) {
    const x=setup(options);
    assert.equal(x.created.length,0);
    assert.equal(live(x).length,0);
  }
  const x=setup({saved:'1'});
  x.handlers.click();
  assert.equal(live(x).length,118,'allocate only when the user enables motion');
});

test('repeated pauses, preference events and visibility events never duplicate particles', () => {
  const x=setup(), first=live(x)[0];
  for (let i=0;i<20;i++) {
    x.handlers.click();x.handlers.click();
    x.document.hidden=true;x.docHandlers.visibilitychange();
    x.document.hidden=false;x.docHandlers.visibilitychange();
    x.handlers.media();
    x.events.storage({key:'site:motion-paused',newValue:'0'});
  }
  assert.equal(x.created.length,118);
  assert.equal(live(x).length,118);
  assert.equal(live(x)[0],first);
});

test('only a viewport-class change replaces the existing field, with no accumulating nodes', () => {
  const x=setup(), first=live(x)[0];
  x.window.innerWidth=1000;x.events.resize();
  assert.equal(live(x)[0],first);
  assert.equal(x.created.length,118);
  x.window.innerWidth=390;x.events.resize();
  assert.equal(live(x).length,63);
  assert.notEqual(live(x)[0],first);
  assert.deepEqual(x.fields.map(f=>f.clears),[1,1]);
  x.handlers.click(); // Pausing before another resize must not allocate anything.
  x.window.innerWidth=1440;x.events.resize();
  assert.equal(live(x).length,0);
  assert.equal(state(x),'paused');
  assert.equal(x.created.length,181);
  x.handlers.click();
  assert.equal(live(x).length,118);
});
