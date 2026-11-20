const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const {renderGalaxyBackdrop, renderGalaxyControl} = require('../scripts/site-shell.cjs');
const {makeManifest} = require('../scripts/offline-manifest.cjs');
const site = path.join(__dirname, '../site');
const read = file => fs.readFileSync(path.join(site, file), 'utf8');
const script = read('assets/galaxy.js');

test('all 35 pages place one labelled lite-mode control inside main, never in the menu', () => {
  const pages = fs.readdirSync(site).filter(name => name.endsWith('.html') && !name.startsWith('google'));
  assert.equal(pages.length, 35);
  for (const file of pages) {
    const html = read(file);
    assert.ok(html.includes(renderGalaxyBackdrop()), file);
    assert.ok(html.includes(renderGalaxyControl()), file);
    for (const token of ['<!-- GALAXY SKY:START -->','<!-- GALAXY CONTROL:START -->','assets/galaxy.css?v=4','assets/galaxy.js?v=3','class="galaxy-toggle"','data-galaxy-field="ambient"']) assert.equal(html.split(token).length - 1, 1, `${file}: ${token}`);
    assert.ok(html.indexOf('assets/galaxy.css') > html.indexOf('assets/theme.css'), file);
    assert.ok(html.indexOf('assets/galaxy.js') > html.indexOf('assets/interface.js'), file);
    const control = html.indexOf('<!-- GALAXY CONTROL:START -->');
    assert.ok(control > html.indexOf('<main') && control < html.indexOf('</main>'), file);
    assert.doesNotMatch(html.match(/<nav>[\s\S]*?<\/nav>/)[0], /galaxy-toggle|galaxy-control/, file);
    assert.match(html, /class="galaxy-toggle"[^>]*type="button"[^>]*aria-label="হালকা অ্যানিমেশন"[^>]*aria-pressed="false"[^>]*aria-describedby="galaxy-help"[^>]*hidden/, file);
    assert.match(html, /class="galaxy-control"[^>]*role="group"[^>]*hidden/, file);
    assert.match(html, /class="galaxy-mode-status" role="status" aria-live="polite"/, file);
    assert.equal(html.split('id="galaxy-help"').length - 1, 1, file);
    assert.doesNotMatch(html, /assets\/(?:home-motion|motion|heading-motion|light-motion|subject-scene)\.(?:css|js)/, file);
  }
});

test('perpetual decorations remain separate from finite text entrances and the stationary in-page control', () => {
  const html = read('index.html'), css = read('assets/galaxy.css');
  assert.match(html, /<div class="hero-galaxy" aria-hidden="true">/);
  assert.match(html, /<div class="galaxy-field" data-galaxy-field="campus"><\/div>/);
  assert.doesNotMatch(html, /<(?:h[1-6]|a|button|figure|img|p)\b[^>]*class="[^"]*galaxy-animated/);
  assert.match(css, /\.galaxy-sky\{[^}]*position:fixed[^}]*pointer-events:none/);
  assert.match(css, /\.hero-galaxy\{[^}]*pointer-events:none/);
  assert.match(css, /\.hero-galaxy\{[^}]*z-index:0\}/, 'stars stay below the text-protecting overlay, not above it');
  assert.match(css, /\.galaxy-field\{[^}]*pointer-events:none;contain:strict/);
  assert.match(css, /\.galaxy-animated\{animation-play-state:paused\}/);
  assert.match(css, /:root\[data-galaxy-motion="running"\] \.galaxy-animated\{animation-play-state:running\}/);
  assert.match(css, /:root\[data-galaxy-motion="lite"\] \.galaxy-field>\.galaxy-mote\{animation-play-state:running\}/);
  assert.ok(css.indexOf('.galaxy-animated{animation-play-state:paused}') > css.indexOf('animation:galaxy-halo-drift '), 'static fallback follows full-mode animation shorthands');
  assert.match(css, /\.galaxy-control\{[^}]*margin:[^;]*auto[^}]*text-align:center/);
  assert.match(css, /\.galaxy-toggle\{[^}]*min-height:44px/);
  for (const feature of ['prefers-reduced-motion:reduce','prefers-reduced-transparency:reduce','@supports','backdrop-filter:blur']) assert.ok(css.includes(feature), feature);
  for (const pattern of ['nebula-drift','star-drift','light-sweep','mote-float','mote-swirl','meteor-travel','halo-drift','mote-gentle']) assert.ok(css.includes('@keyframes galaxy-' + pattern), pattern);
  assert.doesNotMatch(css, /@import|https?:|animation:[^;}]*\b[01]s\b/);
  assert.doesNotMatch(script, /fetch\(|XMLHttpRequest|requestAnimationFrame|setInterval|setTimeout|innerHTML|canvas|WebGL/);
  assert.match(script, /Math\.random\(\)/);
  assert.match(script, /document\.createDocumentFragment\(\)/);
  assert.equal((script.match(/localStorage\.getItem/g) || []).length, 1);
  assert.equal((script.match(/localStorage\.setItem/g) || []).length, 1);
});

test('lite reduces actual node/layer work, not just opacity or animation speed', () => {
  const css = read('assets/galaxy.css');
  assert.match(script, /field\.removeChild\(field\.lastElementChild\)/);
  assert.match(css, /\[data-galaxy-quality="lite"\] \*\{[^}]*backdrop-filter:none!important[^}]*filter:none!important[^}]*box-shadow:none!important/);
  assert.match(css, /\[data-galaxy-quality="lite"\] nav\{background:var\(--nav-bg\)\}/);
  assert.match(css, /\[data-galaxy-quality="lite"\] \[data-galaxy-field="ambient"\] \.galaxy-mote\{background:var\(--green2\)\}/);
  assert.match(css, /\[data-galaxy-quality="lite"\] \.galaxy-sky::before\{display:none\}/);
  assert.match(css, /\[data-galaxy-quality="lite"\] \.galaxy-ribbon\{display:none;animation:none\}/);
  assert.match(css, /\[data-galaxy-quality="lite"\] \.galaxy-mote\{[^}]*animation-name:galaxy-mote-gentle/);
  assert.match(css, /@keyframes galaxy-mote-gentle\{from\{transform:translate\(0,0\)\}to\{transform:translate\(16px,-24px\)\}\}/);
});

test('Android offline instrumentation checks current in-page controls and both motion budgets', () => {
  const java = fs.readFileSync(path.join(__dirname, '../android/app/src/androidTest/java/bd/edu/hsc2027/OfflineSiteTest.java'), 'utf8');
  for (const token of ['.hero-galaxy', '.galaxy-field', '.galaxy-toggle', 'data-galaxy-motion', 'prefers-reduced-motion: reduce', 'button.hidden === reduced', 'field.children.length', "'lite'", 'button.click()']) assert.ok(java.includes(token), token);
  assert.doesNotMatch(java, /hero-sparkles|motion-toggle/);
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

function setup({saved = null, blockedRead = false, blockedWrite = false, reduced = false, hidden = false, noMedia = false, legacyMedia = false, noButton = false, noControl = false, noFields = false, width = 1440, random = Math.random} = {}) {
  const attrs = {}, buttonAttrs = {}, handlers = {}, docHandlers = {}, events = {}, queries = [], reads = [], writes = [], created = [];
  const fields = noFields ? [] : ['ambient','campus'].map(type => ({
    type,children:[],clears:0,removed:0,
    get childElementCount() {return this.children.length;},
    get lastElementChild() {return this.children.at(-1);},
    getAttribute() {return type;},
    appendChild(fragment) {this.children.push(...fragment.children);},
    removeChild(node) {assert.equal(node,this.children.at(-1));this.children.pop();this.removed++;},
    set textContent(value) {assert.equal(value,'');this.removed+=this.children.length;this.children=[];this.clears++;}
  }));
  const button = {hidden:true, setAttribute(k,v) {buttonAttrs[k] = v;}, addEventListener(k,fn) {handlers[k] = fn;}};
  const control = {hidden:true}, status = {textContent:''};
  const document = {
    hidden, documentElement:{setAttribute(k,v) {attrs[k] = v;}},
    querySelector(selector) {return selector === '.galaxy-toggle' ? noButton ? null : button : selector === '.galaxy-control' ? noControl ? null : control : status;},
    querySelectorAll() {return fields;},
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
  return {attrs,buttonAttrs,handlers,docHandlers,events,media,button,control,status,document,window,fields,created,queries,reads,writes,getSaved:() => saved};
}
const state = x => x.attrs['data-galaxy-motion'];
const quality = x => x.attrs['data-galaxy-quality'];
const live = x => x.fields.flatMap(field=>field.children);

test('the button switches full to animated lite, persists the earlier key and leaves progress alone', () => {
  const x = setup();
  assert.equal(state(x), 'running');
  assert.equal(quality(x), 'full');
  assert.equal(x.button.hidden, false);
  assert.equal(x.control.hidden, false);
  assert.equal(x.buttonAttrs['aria-pressed'], 'false');
  assert.equal(x.status.textContent, 'পূর্ণ মোড চলছে');
  assert.deepEqual(x.queries, ['(prefers-reduced-motion: reduce)']);
  x.handlers.click();
  assert.equal(state(x), 'lite', 'a click must not pause every animation');
  assert.equal(quality(x), 'lite');
  assert.equal(x.buttonAttrs['aria-pressed'], 'true');
  assert.equal(x.buttonAttrs.title, 'পূর্ণ অ্যানিমেশনে ফিরুন');
  assert.equal(x.status.textContent, 'হালকা মোড চলছে');
  assert.equal(live(x).length,18);
  assert.equal(x.getSaved(), '1');
  assert.equal(state(setup({saved:x.getSaved()})), 'lite');
  x.handlers.click();
  assert.equal(state(x), 'running');
  assert.equal(x.buttonAttrs['aria-pressed'], 'false');
  assert.equal(x.buttonAttrs.title, 'কম ইফেক্টে হালকা অ্যানিমেশন চালু করুন');
  assert.equal(live(x).length,118);
  assert.deepEqual(x.reads, ['site:motion-paused']);
  assert.deepEqual(x.writes, [['site:motion-paused','1'],['site:motion-paused','0']]);
});

test('native reduced motion still stops all effects and restores the chosen quality afterwards', () => {
  const x = setup({reduced:true});
  assert.equal(state(x), 'reduced');
  assert.equal(x.button.hidden, true);
  assert.equal(x.control.hidden, true);
  x.handlers.click();
  assert.deepEqual(x.writes, []);
  assert.equal(live(x).length,0);
  x.media.matches = false;
  x.handlers.media();
  assert.equal(state(x), 'running');
  x.handlers.click();
  x.media.matches = true;
  x.handlers.media();
  assert.equal(state(x), 'reduced');
  assert.equal(quality(x), 'lite');
  assert.equal(live(x).length,0, 'the OS preference releases particle nodes as well');
  x.media.matches = false;
  x.handlers.media();
  assert.equal(state(x), 'lite');
  assert.equal(live(x).length,18);
  assert.equal(x.button.hidden, false);
  assert.equal(x.control.hidden, false);
  assert.equal(x.buttonAttrs['aria-pressed'], 'true');
  assert.equal(state(setup({saved:'1',reduced:true})), 'reduced');
});

test('missing or blocked storage does not break the in-memory lite control', () => {
  for (const options of [{blockedRead:true,blockedWrite:true},{blockedWrite:true}]) {
    const x = setup(options);
    assert.equal(state(x), 'running');
    assert.doesNotThrow(() => x.handlers.click());
    assert.equal(state(x), 'lite');
    assert.equal(live(x).length,18);
    assert.equal(x.buttonAttrs['aria-pressed'], 'true');
    x.handlers.click();
    assert.equal(state(x), 'running');
  }
  for (const saved of ['0','unexpected','true','',null]) assert.equal(state(setup({saved})), 'running');
});

test('storage changes synchronize quality and node budgets without storage feedback loops', () => {
  const x = setup();
  x.events.storage({key:'site:motion-paused',newValue:'1'});
  assert.equal(state(x), 'lite');
  assert.equal(live(x).length,18);
  assert.equal(x.buttonAttrs['aria-pressed'], 'true');
  for (const key of ['site:theme','hsc2027:physics:100']) {
    x.events.storage({key,newValue:'0'});
    assert.equal(state(x), 'lite');
  }
  x.events.storage({key:'site:motion-paused',newValue:'0'});
  assert.equal(state(x), 'running');
  assert.equal(live(x).length,118);
  x.events.storage({key:'site:motion-paused',newValue:'1'});
  x.events.storage({key:null,newValue:null});
  assert.equal(state(x), 'running');
  assert.deepEqual(x.writes, []);
});

test('background tabs suspend animations but keep the user’s full/lite preference', () => {
  const x = setup({hidden:true});
  assert.equal(state(x), 'hidden');
  assert.equal(live(x).length,0);
  x.document.hidden = false;
  x.docHandlers.visibilitychange();
  assert.equal(state(x), 'running');
  x.handlers.click();
  x.document.hidden = true;
  x.docHandlers.visibilitychange();
  assert.equal(state(x), 'hidden');
  assert.equal(quality(x), 'lite');
  x.document.hidden = false;
  x.docHandlers.visibilitychange();
  assert.equal(state(x), 'lite');
  assert.equal(live(x).length,18);
});

test('cross-tab lite selection trims a hidden tab immediately without allocating new particles', () => {
  const x = setup({hidden:true});
  x.events.storage({key:'site:motion-paused',newValue:'1'});
  assert.equal(live(x).length,0);
  x.document.hidden=false;x.docHandlers.visibilitychange();
  assert.equal(x.created.length,18);
  x.events.storage({key:'site:motion-paused',newValue:'0'});
  x.document.hidden=true;x.docHandlers.visibilitychange();
  const created=x.created.length;
  x.events.storage({key:'site:motion-paused',newValue:'1'});
  assert.equal(live(x).length,18);
  assert.equal(x.created.length,created);
});

test('the enhancement safely supports missing controls, fields and legacy media APIs', () => {
  assert.doesNotThrow(() => setup({noButton:true}));
  assert.equal(state(setup({noButton:true})), undefined);
  assert.equal(live(setup({noFields:true})).length,0);
  assert.doesNotThrow(() => setup({noControl:true}).handlers.click());
  const noMedia = setup({noMedia:true});
  assert.equal(state(noMedia), 'running');
  noMedia.handlers.click();
  assert.equal(state(noMedia), 'lite');
  const legacy = setup({legacyMedia:true});
  legacy.media.matches = true;
  legacy.handlers.media();
  assert.equal(state(legacy), 'reduced');
});

test('full mode retains plentiful decorations inside explicit desktop and phone budgets', () => {
  for (const width of [320,390,760,761,1440,2560]) {
    const x = setup({width}), nodes=live(x), small=width <= 760;
    assert.equal(nodes.length,small ? 63 : 118,width);
    assert.equal(nodes.filter(n=>n.className.startsWith('galaxy-mote ')).length,small ? 52 : 100,width);
    assert.equal(nodes.filter(n=>n.className.startsWith('galaxy-meteor ')).length,small ? 8 : 12,width);
    assert.equal(nodes.filter(n=>n.className.startsWith('galaxy-halo ')).length,small ? 3 : 6,width);
    assert.ok(nodes.every(n=>n.className.endsWith(' galaxy-animated')));
  }
});

test('lite actually removes excess particles and retains only 18 desktop or 10 phone motes', () => {
  for (const width of [320,390,760,761,1440,2560]) {
    const x=setup({width}), first=live(x)[0], small=width <= 760;
    x.handlers.click();
    assert.equal(live(x).length,small ? 10 : 18,width);
    assert.ok(live(x).every(n=>n.className==='galaxy-mote galaxy-animated'));
    assert.equal(x.fields.reduce((n,field)=>n+field.removed,0),small ? 53 : 100);
    assert.equal(live(x)[0],first,'retained points do not reseed');
    assert.deepEqual(x.fields.map(field=>field.clears),[0,0]);
    assert.equal(x.created.length,small ? 63 : 118,'lightening never generates a second particle field');
  }
});

test('positions, paths, colours, phases and speeds remain random within safe ranges', () => {
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

test('saved legacy pause means lite immediately, without building a hidden full field first', () => {
  for (const width of [390,1440]) {
    const x=setup({saved:'1',width});
    assert.equal(state(x),'lite');
    assert.equal(x.created.length,width <= 760 ? 10 : 18);
    assert.ok(live(x).every(node=>node.className==='galaxy-mote galaxy-animated'));
  }
  for (const options of [{reduced:true},{hidden:true},{saved:'1',hidden:true},{saved:'1',reduced:true}]) {
    const x=setup(options);
    assert.equal(x.created.length,0);
    assert.equal(live(x).length,0);
  }
});

test('repeated modes, preference events and visibility events never accumulate live nodes', () => {
  const x=setup(), first=live(x)[0];
  for (let i=0;i<20;i++) {
    x.handlers.click();
    assert.equal(live(x).length,18);
    x.handlers.click();
    x.document.hidden=true;x.docHandlers.visibilitychange();
    x.document.hidden=false;x.docHandlers.visibilitychange();
    x.handlers.media();
    x.events.storage({key:'site:motion-paused',newValue:'0'});
    assert.equal(live(x).length,118);
  }
  assert.equal(live(x)[0],first);
  assert.equal(x.fields[0].removed+x.fields[1].removed,2000,'discarded particles are not cached or hidden');
});

test('only a viewport-class change rebuilds fields, keeping the selected lite budget', () => {
  const x=setup(), first=live(x)[0];
  x.window.innerWidth=1000;x.events.resize();
  assert.equal(live(x)[0],first);
  assert.equal(x.created.length,118);
  x.window.innerWidth=390;x.events.resize();
  assert.equal(live(x).length,63);
  assert.notEqual(live(x)[0],first);
  assert.deepEqual(x.fields.map(f=>f.clears),[1,1]);
  x.handlers.click();
  assert.equal(live(x).length,10);
  x.window.innerWidth=1440;x.events.resize();
  assert.equal(live(x).length,18);
  assert.equal(state(x),'lite');
  x.handlers.click();
  assert.equal(live(x).length,118);
  x.document.hidden=true;x.docHandlers.visibilitychange();
  x.window.innerWidth=390;x.events.resize();
  assert.equal(live(x).length,0,'hidden resize never allocates a replacement field');
  x.document.hidden=false;x.docHandlers.visibilitychange();
  assert.equal(live(x).length,63);
});
