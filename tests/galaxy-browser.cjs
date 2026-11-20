// Serve site/ on :8765. All imagery, fonts and motion must work without external requests.
const assert = require('node:assert/strict');
const {setTimeout:delay} = require('node:timers/promises');
const {chromium} = require('playwright-core');
const BASE = 'http://127.0.0.1:8765/';
const localOnly = route => route.request().url().startsWith(BASE) ? route.continue() : route.abort();
const state = page => page.locator('html').getAttribute('data-galaxy-motion');
async function settled(page) {
  // Poll from Node so this also works when page timers/rAF are disabled in no-JS tests.
  // Query current transitions instead of retaining finished promises for removed effects.
  // Infinite decorative animations remain enabled and are never awaited.
  const until=Date.now()+10000;
  while (Date.now()<until) {
    const ready=await page.evaluate(() => document.fonts.status === 'loaded' &&
      document.getAnimations().filter(animation => animation instanceof CSSTransition)
        .every(animation => animation.playState === 'finished' || animation.playState === 'idle'));
    if (ready) return;
    await delay(40);
  }
  assert.fail('Fonts and finite theme transitions must settle within 10 seconds');
}
async function assertLayers(page, expected) {
  const states = await page.locator('.galaxy-animated').evaluateAll(layers => layers.map(layer => {
    const css = getComputedStyle(layer);
    return {name:css.animationName,state:css.animationPlayState};
  }));
  assert.ok(states.length >= 3);
  states.forEach(layer => expected === 'none' ? assert.equal(layer.name, 'none') : assert.equal(layer.state, expected));
}
async function assertLayout(page, width) {
  const layout = await page.evaluate(() => {
    const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    return {scroll:document.documentElement.scrollWidth,name:box('nav .brand-name'),controls:box('.nav-controls')};
  });
  assert.ok(layout.scroll <= width, `page fits ${width}px: ${layout.scroll}`);
  assert.ok(layout.name.right + 3 <= layout.controls.left, `brand/control separation at ${width}px: ${JSON.stringify(layout)}`);
  assert.ok(layout.controls.right <= width, `controls fit ${width}px`);
}
async function assertControl(page, width) {
  assert.equal(await page.locator('nav .galaxy-toggle').count(),0,'animation control is not in the menu');
  assert.equal(await page.locator('main .galaxy-control .galaxy-toggle').count(),1);
  const box = await page.locator('.galaxy-control').boundingBox();
  assert.ok(Math.abs(box.x + box.width / 2 - width / 2) < 2,'in-page control is centred');
  const button = await page.locator('.galaxy-toggle').boundingBox();
  assert.ok(button.height >= 44 && button.x >= 0 && button.x + button.width <= width,'labelled control has a usable touch target');
  assert.equal(await page.locator('.galaxy-toggle').getAttribute('aria-describedby'),'galaxy-help');
}
async function assertBackground(page, selector) {
  const bg = await page.locator(selector).evaluate(node => ({image:getComputedStyle(node).backgroundImage,width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height}));
  assert.match(bg.image,/assets\/college-campus\.webp/);
  assert.ok(bg.width > 0 && bg.height > 0,'the supplied image is a visible background');
  // Image.onload callbacks are not reliable on JavaScript-disabled audit pages.
  const response = await page.request.get(BASE + 'assets/college-campus.webp');
  assert.equal(response.ok(),true,'the background is served locally');
  const bytes = await response.body();
  assert.equal(bytes.subarray(8,12).toString(),'WEBP');
  const frame = bytes.indexOf(Buffer.from([0x9d,0x01,0x2a]),20);
  assert.ok(frame >= 0,'the optimized photo has a valid VP8 keyframe');
  assert.equal(bytes.readUInt16LE(frame + 3) & 0x3fff,1000);
  assert.equal(bytes.readUInt16LE(frame + 5) & 0x3fff,400);
}
async function assertParticles(page, width) {
  const particles = await page.locator('.galaxy-field > span').count();
  assert.equal(particles,width <= 760 ? 63 : 118,'full effects keep their hard live-node budget');
  assert.equal(await page.locator('.galaxy-meteor').count(),width <= 760 ? 8 : 12);
  const positions = await page.locator('.galaxy-mote').evaluateAll(nodes=>nodes.map(node=>node.style.getPropertyValue('--x')));
  assert.ok(new Set(positions).size >= 40,'particles have randomized positions, not a repeated fixed pattern');
}
async function assertLite(page, width, campus = true) {
  const expected = campus ? width <= 760 ? 10 : 18 : width <= 760 ? 4 : 6;
  assert.equal(await state(page),'lite','the button reduces effects instead of stopping every animation');
  assert.equal(await page.locator('html').getAttribute('data-galaxy-quality'),'lite');
  assert.equal(await page.locator('.galaxy-field > span').count(),expected,'extra nodes are removed, not hidden');
  assert.equal(await page.locator('.galaxy-meteor,.galaxy-halo').count(),0);
  const rendering = await page.evaluate(() => ({
    active:document.getAnimations().filter(animation=>animation.effect.getTiming().iterations === Infinity && animation.playState === 'running').length,
    blur:getComputedStyle(document.querySelector('nav')).backdropFilter,
    navBackground:getComputedStyle(document.querySelector('nav')).backgroundColor,
    shadow:getComputedStyle(document.querySelector('.galaxy-mote')).boxShadow,
    filter:getComputedStyle(document.querySelector('.campus-backdrop') || document.querySelector('nav')).filter,
    large:[...document.querySelectorAll('.galaxy-nebula,.galaxy-stars,.galaxy-ribbon')].every(node=>getComputedStyle(node).display==='none'),
    names:[...document.querySelectorAll('.galaxy-mote')].map(node=>getComputedStyle(node).animationName)
  }));
  assert.equal(rendering.active,expected,'the remaining lightweight points really are animated');
  assert.equal(rendering.blur,'none');
  assert.match(rendering.navBackground,/^rgb\(/,'removing blur must leave an opaque, readable navigation bar');
  assert.equal(rendering.shadow,'none');
  assert.equal(rendering.filter,'none');
  assert.ok(rendering.large);
  assert.ok(rendering.names.every(name=>name==='galaxy-mote-gentle'));
}
async function headingBox(page) {
  return page.locator('.hero h1').evaluate(node=>{
    const box=node.getBoundingClientRect();
    return {x:box.x+scrollX,y:box.y+scrollY,width:box.width,height:box.height};
  });
}
async function audit(page, label) {
  await settled(page);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const violations = await page.evaluate(async () => (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
  assert.deepEqual(violations,[],label);
}

(async () => {
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',args:['--no-sandbox']});
  let audits = 0;
  try {
    // Both qualities keep a visible in-page control; native reduced motion is tested separately.
    for (const width of [320,360,390,768,1201,1440]) {
      const context = await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);
      const page = await context.newPage(), errors = [];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(BASE + 'index.html');
      await settled(page);
      assert.equal(await state(page),'running');
      const toggle=page.getByRole('button',{name:'হালকা অ্যানিমেশন',exact:true});
      assert.equal(await toggle.isVisible(),true);
      const heading=await headingBox(page);
      for (const theme of ['light','dark']) {
        if (theme === 'dark') await page.locator('.theme-toggle').click();
        await settled(page);
        await assertLayout(page,width);
        await assertControl(page,width);
        await assertBackground(page,'.campus-backdrop');
        await assertParticles(page,width);
        assert.equal(await page.locator('.campus-card,.campus-orbit, img[src*="college-gate"]').count(),0);
        assert.equal(await page.getByRole('img',{name:/কলেজের ভবন ও সবুজ ক্যাম্পাস/}).count(),1);
        assert.equal(await page.locator('.campus-photo-link').getAttribute('href'),'assets/college-campus.webp');
        assert.equal(await page.locator('.hero h1').evaluate(node=>getComputedStyle(node).animationName),'none');
        assert.deepEqual(await headingBox(page),heading,'theme does not move reading content');
        if ([390,1440].includes(width)) {
          await audit(page,`${width}px ${theme}: full control audit`); audits++;
        }
        await toggle.click();
        await settled(page);
        await assertLite(page,width);
        await assertLayout(page,width);
        await assertControl(page,width);
        await assertBackground(page,'.campus-backdrop');
        assert.deepEqual(await headingBox(page),heading,'lite does not move the heading or photograph');
        const before=await page.locator('.galaxy-mote').first().evaluate(node=>getComputedStyle(node).transform);
        await page.waitForFunction(previous=>getComputedStyle(document.querySelector('.galaxy-mote')).transform!==previous,before,{timeout:5000});
        if ([390,1440].includes(width)) {
          await audit(page,`${width}px ${theme}: animated lite control audit`); audits++;
        }
        await toggle.click();
        await settled(page);
        assert.equal(await state(page),'running');
        await assertParticles(page,width);
      }
      assert.deepEqual(errors,[],`${width}px script errors`);
      console.log(`Galaxy layout/motion passed: ${width}px, full/lite, light/dark`);
      await context.close();
    }

    // Keyboard activation, saved legacy key, related-page navigation and cross-tab sync.
    {
      const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);
      const page=await context.newPage();
      await page.goto(BASE+'index.html');
      const toggle=page.getByRole('button',{name:'হালকা অ্যানিমেশন',exact:true});
      await toggle.focus(); await page.keyboard.press('Space');
      await assertLite(page,1440);
      assert.equal(await toggle.getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('.galaxy-mode-status').textContent(),'হালকা মোড চলছে');
      assert.equal(await page.evaluate(()=>localStorage.getItem('site:motion-paused')),'1');
      await page.keyboard.press('Enter');
      assert.equal(await state(page),'running');
      await page.keyboard.press('Space');
      await page.evaluate(()=>localStorage.setItem('hsc2027:physics:0','1'));
      await page.locator('.campus-place').click();
      await page.waitForURL(/college-info\.html$/,{waitUntil:'load'});
      await assertLite(page,1440,false);
      await assertBackground(page,'.campus-heading');
      await page.goto(BASE+'physics.html');
      await assertLite(page,1440,false);
      assert.equal(await page.locator('.chap[data-subject="physics"][data-chapter="0"]').getAttribute('aria-checked'),'true');
      await page.reload();
      await assertLite(page,1440,false);
      const other=await context.newPage();
      await other.goto(BASE+'index.html');
      await assertLite(other,1440);
      await other.locator('.galaxy-toggle').click();
      await page.waitForFunction(()=>document.querySelector('.galaxy-toggle').getAttribute('aria-pressed')==='false');
      await page.bringToFront();
      assert.equal(await state(page),'running');
      assert.equal(await page.locator('html').getAttribute('data-galaxy-quality'),'full');
      assert.equal(await page.evaluate(()=>localStorage.getItem('hsc2027:physics:0')),'1');
      await context.close();
    }

    // Toggles retain existing points but discard unused nodes; breakpoints replace fields.
    {
      const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);
      const page=await context.newPage();
      await page.goto(BASE+'index.html');
      const signature=()=>page.locator('[data-galaxy-field="campus"] .galaxy-mote').first().getAttribute('style');
      const first=await signature();
      await page.evaluate(()=>{window.testFirstMote=document.querySelector('.galaxy-mote');});
      for (let i=0;i<3;i++) {
        await page.locator('.galaxy-toggle').click();
        await assertLite(page,1440);
        await page.locator('.galaxy-toggle').click();
        await assertParticles(page,1440);
      }
      assert.equal(await page.evaluate(()=>document.querySelector('.galaxy-mote')===window.testFirstMote),true);
      assert.equal(await signature(),first,'mode changes retain the existing points, without a cached full field');
      await page.setViewportSize({width:390,height:1000});
      await page.waitForFunction(()=>document.querySelectorAll('.galaxy-field > span').length===63);
      await assertParticles(page,390);
      await page.locator('.galaxy-toggle').click();
      await assertLite(page,390);
      await page.setViewportSize({width:1440,height:1000});
      await page.waitForFunction(()=>document.querySelectorAll('.galaxy-field > span').length===18);
      await assertLite(page,1440);
      await page.locator('.galaxy-toggle').click();
      await assertParticles(page,1440);
      await page.reload();
      assert.notEqual(await signature(),first,'a new visit receives fresh randomness');
      await context.close();
    }

    // An accessibility preference must still stop all motion, not merely enable lite mode.
    {
      const context=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce'});
      await context.route('**/*',localOnly);
      const page=await context.newPage();
      await page.goto(BASE+'index.html');
      assert.equal(await state(page),'reduced');
      assert.equal(await page.locator('.galaxy-field > span').count(),0);
      assert.equal(await page.locator('.galaxy-control').isVisible(),false);
      await assertLayers(page,'none');
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.waitForFunction(()=>document.documentElement.dataset.galaxyMotion==='running');
      await page.locator('.galaxy-toggle').click();
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>document.documentElement.dataset.galaxyMotion==='reduced');
      assert.equal(await page.locator('.galaxy-field > span').count(),0);
      await assertLayers(page,'none');
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.waitForFunction(()=>document.documentElement.dataset.galaxyMotion==='lite');
      assert.equal(await page.locator('.galaxy-toggle').getAttribute('aria-pressed'),'true');
      await assertLite(page,390);
      await page.locator('.galaxy-toggle').click();
      const cdp=await context.newCDPSession(page);
      await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});
      assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-transparency:reduce)').matches),true);
      const transparency=await page.locator('nav').evaluate(node=>({blur:getComputedStyle(node).backdropFilter,bg:getComputedStyle(node).backgroundColor}));
      assert.equal(transparency.blur,'none');
      assert.match(transparency.bg,/^rgb\(/,'native reduced transparency still uses an opaque surface in full mode');
      await context.close();
    }

    // Existing saved pauses become lite without allocating a full field first.
    {
      const context=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'no-preference'});
      await context.addInitScript(()=>localStorage.setItem('site:motion-paused','1'));
      await context.route('**/*',localOnly);
      const page=await context.newPage();
      await page.goto(BASE+'index.html');
      await assertLite(page,390);
      await page.locator('.galaxy-toggle').click();
      await assertParticles(page,390);
      await context.close();
    }

    // Blocking optional storage must not disable menu, search or the in-memory mode control.
    {
      const context=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);
      await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get() {throw new Error('Storage blocked for test');}}));
      const page=await context.newPage(), errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(BASE+'index.html');
      await page.locator('.galaxy-toggle').click();
      await assertLite(page,390);
      await page.locator('#burger').click();
      assert.equal(await page.locator('#navLinks').isVisible(),true);
      await page.keyboard.press('Escape');
      await page.getByRole('searchbox').fill('physics');
      assert.equal(await page.locator('.network-directory a[data-page]:visible').count(),1);
      assert.deepEqual(errors,[]);
      await context.close();
    }

    // No JavaScript = still, legible HTML. A failure of galaxy.js also fails closed.
    for (const width of [320,390,1440]) {
      const context=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);
      const page=await context.newPage();
      await page.goto(BASE+'index.html');
      await settled(page);
      assert.equal(await state(page),null);
      await assertLayers(page,'paused');
      await assertLayout(page,width);
      assert.equal(await page.locator('.galaxy-control').isVisible(),false);
      assert.equal(await page.locator('.theme-toggle').isVisible(),false);
      assert.equal(await page.locator('#navLinks .network-nav-link').isVisible(),true);
      await assertBackground(page,'.campus-backdrop');
      assert.equal(await page.locator('.galaxy-field > span').count(),0);
      const explanation=await page.locator('.countdown-body').evaluate(node=>{
        const context=node.querySelector('.countdown-context').getBoundingClientRect();
        const noscript=node.querySelector('noscript').getBoundingClientRect();
        return {contextBottom:context.bottom,noscriptTop:noscript.top,noscriptRight:noscript.right,cardRight:node.getBoundingClientRect().right};
      });
      assert.ok(explanation.noscriptTop>=explanation.contextBottom,'no-script explanation has its own row');
      assert.ok(explanation.noscriptRight<=explanation.cardRight,'no-script explanation stays in the card');
      await page.locator('#navLinks .network-nav-link').click();
      await page.waitForURL(/index\.html#structure$/);
      const subjectLink=page.locator('.network-directory a[data-page="physics"]');
      // Complete smooth scrolling before a second normal, visibility/stability/hit-tested click.
      await subjectLink.evaluate(link=>link.scrollIntoView({behavior:'instant',block:'center'}));
      await subjectLink.click();
      await page.waitForURL(/physics\.html$/,{waitUntil:'load'});
      await assertLayers(page,'paused');
      console.log(`Galaxy no-JavaScript navigation passed: ${width}px`);
      await context.close();
    }
    {
      const context=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',route=>route.request().url().includes('/assets/galaxy.js') ? route.abort() : localOnly(route));
      const page=await context.newPage();
      await page.goto(BASE+'index.html');
      assert.equal(await state(page),null);
      assert.equal(await page.locator('.galaxy-field > span').count(),0);
      assert.equal(await page.locator('.galaxy-control').isVisible(),false);
      await assertLayers(page,'paused');
      await page.locator('#burger').click();
      assert.equal(await page.locator('#navLinks').isVisible(),true);
      await context.close();
    }
    console.log(`Galaxy browser checks passed: centred in-page control, animated lite budgets, fewer nodes/filters/layers, uploaded campus, persistence/cross-tab, resize, keyboard, native preferences, storage/script failures and no-JS; ${audits} additional accessibility audits.`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
