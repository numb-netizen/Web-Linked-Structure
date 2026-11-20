const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.resolve(__dirname, '../site');
const read = file => fs.readFileSync(path.join(site, file), 'utf8');
const script = read('assets/text-motion.js');

function setup({count = 3, reduced = false, lite = false, hidden = false, unsupported = false, rejected = false, nodes: custom} = {}) {
  const attrs = {'data-galaxy-quality': lite ? 'lite' : 'full'}, handlers = {}, docHandlers = {}, animations = [], observers = [], mutations = [];
  const nodes = custom || Array.from({length:count}, () => ({}));
  for (const node of nodes) Object.assign(node, {
    textContent:node.empty ? '' : 'বাংলা লেখা অক্ষত থাকে',
    matches(selector) { return selector === '.hero-title' ? !!node.heroTitle : selector === '.hero-title>span' ? !!node.titleLine : false; },
    closest(selector) { return selector.startsWith('table,') ? node.excluded ? {} : null : selector === '.hero-copy' && node.titleLine ? {} : null; },
    parentElement:{closest() { return node.nested ? {} : null; }},
    getClientRects() { return node.hidden ? [] : [{}]; },
    animate(frames, options) {
      if (rejected) throw Error('unsupported effect');
      const animation = {node,frames,options,playState:'running',cancelled:0,pauses:0,plays:0,
        cancel() { this.cancelled++; this.playState='idle'; if (this.oncancel) this.oncancel(); },
        pause() { this.pauses++; this.playState='paused'; },
        play() { this.plays++; this.playState='running'; }
      };
      animations.push(animation); return animation;
    }
  });
  class IntersectionObserver {
    constructor(callback, options) { this.callback=callback;this.options=options;this.targets=new Set();this.disconnections=0;observers.push(this); }
    observe(node) {this.targets.add(node);}
    unobserve(node) {this.targets.delete(node);}
    disconnect() {this.targets.clear();this.disconnections++;}
  }
  class MutationObserver { constructor(callback) {this.callback=callback;mutations.push(this);} observe(node, options) {this.options=options;} }
  const media={matches:reduced,addEventListener(type, fn) {handlers.media=fn;}};
  const document={hidden,documentElement:{setAttribute(k,v) {attrs[k]=v;},getAttribute(k) {return attrs[k];}},querySelectorAll() {return nodes;},addEventListener(k,fn) {docHandlers[k]=fn;}};
  const window={IntersectionObserver:unsupported ? null : IntersectionObserver,MutationObserver,matchMedia() {return media;},addEventListener(k,fn) {handlers[k]=fn;}};
  vm.runInNewContext(script, {document,window,Element:{prototype:{animate() {}}},IntersectionObserver,MutationObserver,Set,WeakSet});
  const enter = (targets=nodes) => observers[0].callback(targets.map(target => ({target,isIntersecting:true})));
  return {attrs,handlers,docHandlers,nodes,animations,observers,mutations,media,document,enter};
}

test('all 35 shared pages load finite text entrances after the existing motion control', () => {
  const names=fs.readdirSync(site).filter(name=>name.endsWith('.html') && !name.startsWith('google'));
  assert.equal(names.length,35);
  for (const name of names) {
    const html=read(name);
    assert.equal(html.split('assets/text-motion.js?v=2').length-1,1,name);
    assert.equal(html.split('assets/editorial.css?v=1').length-1,1,name);
    assert.ok(html.indexOf('assets/text-motion.js')>html.indexOf('assets/galaxy.js'),name);
    assert.ok(html.indexOf('assets/editorial.css')>html.indexOf('assets/numerals.css'),name);
  }
  const home=read('index.html');
  assert.doesNotMatch(home,/CAMPUS · GALAXY|hero-kicker|hero-footnote|শিক্ষার্থীদের উদ্যোগে, শিক্ষার্থীদের জন্য।/);
  assert.equal((home.match(/class="hero-title-(?:lead|emphasis|closing)"/g)||[]).length,3);
  assert.doesNotMatch(script,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|setTimeout|setInterval|requestAnimationFrame|innerHTML|\.split\(/);
  assert.ok(Buffer.byteLength(script)<6000);
});

test('text enters once per block, preserves Bengali shaping and leaves no persistent fill effect', () => {
  const x=setup();x.enter();
  assert.equal(x.attrs['data-text-motion'],'full');
  assert.equal(x.animations.length,3);
  for (const animation of x.animations) {
    assert.equal(animation.options.iterations,1);
    assert.equal(animation.options.duration,650);
    assert.equal(animation.options.fill,'none');
    assert.equal(animation.frames[1].opacity,1);
    assert.equal(animation.frames[1].transform,'translateY(0)');
    assert.ok(animation.options.delay<=275);
    assert.equal(animation.node.textContent,'বাংলা লেখা অক্ষত থাকে');
    animation.onfinish();
  }
  x.enter();assert.equal(x.animations.length,3,'re-entry cannot restart finished text');
  assert.equal(x.observers[0].targets.size,0);
});

test('dense pages respect full/lite concurrency budgets, and rejected/hidden effects never hide text', () => {
  const full=setup({count:50});full.enter();assert.equal(full.animations.length,28);
  const lite=setup({count:50,lite:true});lite.enter();assert.equal(lite.animations.length,6);
  assert.equal(lite.attrs['data-text-motion'],'lite');
  for (const animation of lite.animations) {
    assert.equal(animation.options.duration,260);assert.equal(animation.options.delay,0);
    assert.equal(animation.frames[0].transform,'translateY(3px)');assert.equal(animation.frames[0].opacity,.8);
  }
  const rejected=setup({rejected:true});assert.doesNotThrow(()=>rejected.enter());assert.equal(rejected.animations.length,0);
  const hidden=setup({nodes:[{hidden:true}]});hidden.enter();assert.equal(hidden.animations.length,0);
  assert.doesNotThrow(()=>setup({unsupported:true}));
});

test('live reduced-motion and quality changes cancel old text effects without changing storage', () => {
  const x=setup({reduced:true});
  assert.equal(x.attrs['data-text-motion'],'reduced');assert.equal(x.observers[0].targets.size,0);
  x.media.matches=false;x.handlers.media();x.enter();assert.equal(x.animations.length,3);
  x.attrs['data-galaxy-quality']='lite';x.mutations[0].callback();
  assert.equal(x.attrs['data-text-motion'],'lite');assert.ok(x.animations.every(animation=>animation.cancelled===1));
  x.media.matches=true;x.handlers.media();assert.equal(x.attrs['data-text-motion'],'reduced');
  assert.equal(x.observers[0].targets.size,0);
  assert.deepEqual(Array.from(x.mutations[0].options.attributeFilter),['data-galaxy-quality']);
});

test('background tabs pause and print/page exit cancel finite text animations', () => {
  const x=setup();x.enter();x.document.hidden=true;x.docHandlers.visibilitychange();
  assert.ok(x.animations.every(animation=>animation.playState==='paused'));
  x.document.hidden=false;x.docHandlers.visibilitychange();
  assert.ok(x.animations.every(animation=>animation.playState==='running'));
  x.handlers.beforeprint();assert.ok(x.animations.every(animation=>animation.cancelled===1));
  const leaving=setup();leaving.enter();leaving.handlers.pagehide();
  assert.ok(leaving.animations.every(animation=>animation.cancelled===1));
});

test('interactive checklists, live results, tables and nested text never receive duplicate motion', () => {
  const x=setup({nodes:[{excluded:true},{nested:true},{heroTitle:true},{empty:true},{titleLine:true,nested:true},{}]});
  assert.equal(x.observers[0].targets.size,2);
  x.enter([...x.observers[0].targets]);assert.equal(x.animations.length,2);
  for (const token of ['.chap','.tcard','.mcq-panel','[aria-live]','[role="timer"]','.galaxy-control','.sr-only','table']) assert.ok(script.includes(token),token);
});
