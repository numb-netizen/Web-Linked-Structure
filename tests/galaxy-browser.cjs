// Serve site/ on :8765. All imagery, fonts and motion must work without external requests.
const assert = require('node:assert/strict');
const {chromium} = require('playwright-core');
const BASE = 'http://127.0.0.1:8765/';
const localOnly = route => route.request().url().startsWith(BASE) ? route.continue() : route.abort();
const state = page => page.locator('html').getAttribute('data-galaxy-motion');
async function settled(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Audit the final theme colours, not a fast runner's intermediate transition frame.
    // Never wait for the intentionally infinite galaxy animations or disable their motion.
    await Promise.all(document.getAnimations()
      .filter(animation => animation instanceof CSSTransition)
      .map(animation => animation.finished.catch(() => {})));
  });
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
async function assertBackground(page, selector) {
  const bg = await page.locator(selector).evaluate(node => ({image:getComputedStyle(node).backgroundImage,width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height}));
  assert.match(bg.image,/assets\/college-campus\.webp/);
  assert.ok(bg.width > 0 && bg.height > 0,'the supplied image is a visible background');
  // Do not depend on image.onload JS callbacks when auditing JavaScript-disabled pages.
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
  assert.equal(particles,width <= 760 ? 63 : 118,'dense effects have a hard live-node budget');
  assert.equal(await page.locator('.galaxy-meteor').count(),width <= 760 ? 8 : 12);
  const positions = await page.locator('.galaxy-mote').evaluateAll(nodes=>nodes.map(node=>node.style.getPropertyValue('--x')));
  assert.ok(new Set(positions).size >= 40,'particles have randomized positions, not a repeated fixed pattern');
}

(async () => {
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',args:['--no-sandbox']});
  let audits = 0;
  try {
    // The pause control is visible here (the separate 56-audit suite uses reduced motion).
    for (const width of [320,360,390,768,1201,1440]) {
      const context = await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);
      const page = await context.newPage(), errors = [];
      page.on('pageerror',error => errors.push(error.message));
      await page.goto(BASE + 'index.html');
      await settled(page);
      assert.equal(await state(page), 'running');
      assert.equal(await page.getByRole('button',{name:'অ্যানিমেশন বিরতি',exact:true}).isVisible(), true);
      await assertLayers(page,'running');
      const heading = await page.locator('.hero h1').boundingBox();
      for (const theme of ['light','dark']) {
        if (theme === 'dark') await page.locator('.theme-toggle').click();
        await settled(page);
        await assertLayout(page,width);
        await assertBackground(page,'.campus-backdrop');
        await assertParticles(page,width);
        assert.equal(await page.locator('.campus-card,.campus-orbit, img[src*="college-gate"]').count(),0);
        assert.equal(await page.getByRole('img',{name:/কলেজের ভবন ও সবুজ ক্যাম্পাস/}).count(),1);
        assert.equal(await page.locator('.campus-photo-link').getAttribute('href'),'assets/college-campus.webp');
        const animation = await page.locator('.hero h1').evaluate(node => getComputedStyle(node).animationName);
        assert.equal(animation,'none');
        assert.deepEqual(await page.locator('.hero h1').boundingBox(),heading,'theme/motion does not move the heading');
        if ([390,1440].includes(width)) {
          await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
          const violations = await page.evaluate(async () => (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(x => ({id:x.id,nodes:x.nodes.map(n => ({target:n.target,summary:n.failureSummary}))})));
          assert.deepEqual(violations,[],`${width}px ${theme}: visible motion control audit`);
          audits++;
        }
      }
      assert.deepEqual(errors,[],`${width}px script errors`);
      await context.close();
    }

    // Keyboard activation, remembered settings, related-page navigation and cross-tab sync.
    {
      const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);
      const page = await context.newPage();
      await page.goto(BASE + 'index.html');
      const toggle = page.getByRole('button',{name:'অ্যানিমেশন বিরতি',exact:true});
      await toggle.focus();
      await page.keyboard.press('Space');
      assert.equal(await state(page),'paused');
      assert.equal(await toggle.getAttribute('aria-pressed'),'true');
      assert.equal(await page.evaluate(() => localStorage.getItem('site:motion-paused')),'1');
      await assertLayers(page,'paused');
      await page.keyboard.press('Enter');
      assert.equal(await state(page),'running');
      await page.keyboard.press('Space');
      await page.evaluate(() => localStorage.setItem('hsc2027:physics:0','1'));
      await page.locator('.campus-place').click();
      await page.waitForURL(/college-info\.html$/,{waitUntil:'load'});
      assert.equal(await state(page),'paused');
      await assertBackground(page,'.campus-heading');
      await page.goto(BASE + 'physics.html');
      assert.equal(await state(page),'paused');
      assert.equal(await page.locator('.chap[data-subject="physics"][data-chapter="0"]').getAttribute('aria-checked'),'true');
      await page.reload();
      assert.equal(await state(page),'paused');
      const other = await context.newPage();
      await other.goto(BASE + 'index.html');
      assert.equal(await state(other),'paused');
      await other.locator('.galaxy-toggle').click();
      await page.waitForFunction(() => document.querySelector('.galaxy-toggle').getAttribute('aria-pressed') === 'false');
      await page.bringToFront();
      assert.equal(await state(page),'running');
      assert.equal(await page.evaluate(() => localStorage.getItem('hsc2027:physics:0')),'1');
      await context.close();
    }

    // Every load gets fresh randomness, while toggles do not reseed or duplicate nodes.
    {
      const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);
      const page = await context.newPage();
      await page.goto(BASE + 'index.html');
      const signature = () => page.locator('[data-galaxy-field="campus"] .galaxy-mote').first().getAttribute('style');
      const first = await signature();
      await page.evaluate(() => {window.testFirstMote = document.querySelector('.galaxy-mote');});
      for (let i=0;i<3;i++) {
        await page.locator('.galaxy-toggle').click();
        await assertLayers(page,'paused');
        await page.locator('.galaxy-toggle').click();
      }
      await assertParticles(page,1440);
      assert.equal(await page.evaluate(() => document.querySelector('.galaxy-mote') === window.testFirstMote),true);
      assert.equal(await signature(),first,'pause/resume retains the original paths');
      await page.setViewportSize({width:390,height:1000});
      await page.waitForFunction(() => document.querySelectorAll('.galaxy-field > span').length === 63);
      await assertParticles(page,390);
      await page.setViewportSize({width:1440,height:1000});
      await page.waitForFunction(() => document.querySelectorAll('.galaxy-field > span').length === 118);
      await assertParticles(page,1440);
      await page.reload();
      assert.notEqual(await signature(),first,'a new visit gets a fresh random seed');
      await context.close();
    }

    // OS preferences beat saved settings, including changes made while a page is open.
    {
      const context = await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce'});
      await context.route('**/*',localOnly);
      const page = await context.newPage();
      await page.goto(BASE + 'index.html');
      assert.equal(await state(page),'reduced');
      assert.equal(await page.locator('.galaxy-field > span').count(),0);
      assert.equal(await page.locator('.galaxy-toggle').isVisible(),false);
      await assertLayers(page,'none');
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.waitForFunction(() => document.documentElement.dataset.galaxyMotion === 'running');
      await page.locator('.galaxy-toggle').click();
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(() => document.documentElement.dataset.galaxyMotion === 'reduced');
      await assertLayers(page,'none');
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.waitForFunction(() => document.documentElement.dataset.galaxyMotion === 'paused');
      assert.equal(await page.locator('.galaxy-toggle').getAttribute('aria-pressed'),'true');
      await assertLayers(page,'paused');
      const cdp = await context.newCDPSession(page);
      await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});
      assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-transparency:reduce)').matches),true);
      const transparency = await page.locator('nav').evaluate(node => ({blur:getComputedStyle(node).backdropFilter,bg:getComputedStyle(node).backgroundColor}));
      assert.equal(transparency.blur,'none');
      assert.match(transparency.bg,/^rgb\(/,'reduced transparency uses an opaque surface');
      await context.close();
    }

    // A user's stored pause preference applies before any animation is allowed to run.
    {
      const context = await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'no-preference'});
      await context.addInitScript(() => localStorage.setItem('site:motion-paused','1'));
      await context.route('**/*',localOnly);
      const page = await context.newPage();
      await page.goto(BASE + 'index.html');
      assert.equal(await state(page),'paused');
      assert.equal(await page.locator('.galaxy-field > span').count(),0);
      await assertLayers(page,'paused');
      await page.locator('.galaxy-toggle').click();
      await assertParticles(page,390);
      await context.close();
    }

    // Blocking optional storage must not disable menu, search or the in-memory pause control.
    {
      const context = await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);
      await context.addInitScript(() => Object.defineProperty(window,'localStorage',{get() {throw new Error('Storage blocked for test');}}));
      const page = await context.newPage(), errors = [];
      page.on('pageerror',error => errors.push(error.message));
      await page.goto(BASE + 'index.html');
      await page.locator('.galaxy-toggle').click();
      assert.equal(await state(page),'paused');
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
      const context = await browser.newContext({javaScriptEnabled:false,viewport:{width,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);
      const page = await context.newPage();
      await page.goto(BASE + 'index.html');
      await settled(page);
      assert.equal(await state(page),null);
      await assertLayers(page,'paused');
      await assertLayout(page,width);
      assert.equal(await page.locator('.galaxy-toggle').isVisible(),false);
      assert.equal(await page.locator('.theme-toggle').isVisible(),false);
      assert.equal(await page.locator('#navLinks .network-nav-link').isVisible(),true);
      await assertBackground(page,'.campus-backdrop');
      assert.equal(await page.locator('.galaxy-field > span').count(),0);
      const explanation = await page.locator('.countdown-body').evaluate(node => {
        const context = node.querySelector('.countdown-context').getBoundingClientRect();
        const noscript = node.querySelector('noscript').getBoundingClientRect();
        return {contextBottom:context.bottom,noscriptTop:noscript.top,noscriptRight:noscript.right,cardRight:node.getBoundingClientRect().right};
      });
      assert.ok(explanation.noscriptTop >= explanation.contextBottom,'no-script explanation has its own row');
      assert.ok(explanation.noscriptRight <= explanation.cardRight,'no-script explanation stays in the card');
      await page.locator('#navLinks .network-nav-link').click();
      await page.waitForURL(/index\.html#structure$/);
      const subjectLink = page.locator('.network-directory a[data-page="physics"]');
      // Complete the native smooth scroll before starting a second pointer action.
      // The normal click below still checks visibility, stability and hit testing.
      await subjectLink.evaluate(link => link.scrollIntoView({behavior:'instant',block:'center'}));
      await subjectLink.click();
      await page.waitForURL(/physics\.html$/,{waitUntil:'load'});
      await assertLayers(page,'paused');
      await context.close();
    }
    {
      const context = await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',route => route.request().url().includes('/assets/galaxy.js') ? route.abort() : localOnly(route));
      const page = await context.newPage();
      await page.goto(BASE + 'index.html');
      assert.equal(await state(page),null);
      assert.equal(await page.locator('.galaxy-field > span').count(),0);
      assert.equal(await page.locator('.galaxy-toggle').isVisible(),false);
      await assertLayers(page,'paused');
      await page.locator('#burger').click();
      assert.equal(await page.locator('#navLinks').isVisible(),true);
      await context.close();
    }
    console.log(`Galaxy browser checks passed: uploaded campus background, dense bounded randomness, resize, pause/reload/cross-tab, keyboard, reduced motion/transparency, blocked storage/script and no-JS; ${audits} additional accessibility audits.`);
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode = 1;});
