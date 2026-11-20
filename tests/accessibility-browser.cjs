// Automated regression coverage, not a substitute for assistive-technology/user testing.
// Serve site/ on :8765; use playwright-core@1.56.1 and axe-core@4.10.3.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright-core');
const BASE = 'http://127.0.0.1:8765/';
const pageTypes = fs.readdirSync(path.resolve(__dirname, '../site')).filter(name => name.endsWith('.html') && !name.startsWith('google')).sort();
const creditDeadline = Date.parse('2026-12-01T12:43:22Z');
const ictDeadline = Date.parse('2026-12-19T12:43:22Z');
const localOnly = route => route.request().url().startsWith(BASE) ? route.continue() : route.abort();
const reports = [];
const fits = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const spacing = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';

async function audit(page, label, selector) {
  if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const result = await page.evaluate(async selector => {
    // All default rules, including heading/landmark best practices, plus WCAG 2.2 target size.
    const result = await axe.run(selector ? document.querySelector(selector) : document, {rules:{'target-size':{enabled:true}}});
    const summarize = violation => ({id:violation.id, nodes:violation.nodes.map(node => ({target:node.target, summary:node.failureSummary,
      checks:[...node.any,...node.all,...node.none].map(check => ({id:check.id, message:check.message, data:check.data}))}))});
    return {violations:result.violations.map(summarize), incomplete:result.incomplete.map(summarize)};
  }, selector);
  reports.push({label, ...result});
  assert.deepEqual(result.violations, [], `${label}: ${JSON.stringify(result.violations)}`);
}
async function openDisclosures(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('details').forEach(details => { details.open = true; });
    document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
    await document.fonts.ready;
  });
}
async function installCreditClock(context) {
  // Keep time moving for browser/axe timers, but test before expiry regardless of the real date.
  await context.addInitScript(before => {
    const realNow = Date.now.bind(Date);
    let offset = before - realNow();
    Date.now = () => realNow() + offset;
    window.setCreditTestTime = time => { offset = time - realNow(); };
  }, creditDeadline - 86400000);
}
async function assertCreditLayout(page, label) {
  const group = page.locator('#temporary-credit');
  assert.equal(await group.isVisible(), true, label);
  assert.deepEqual(await group.locator('.credit-name').allTextContents(), ['Mahadin','Morshed']);
  const boxes = await group.locator('.credit-person').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
  }));
  assert.equal(boxes.length, 2);
  assert.ok(Math.abs(boxes[0].top-boxes[1].top)<1, label+': two columns on the same row');
  assert.ok(boxes[0].right<=boxes[1].left && boxes[0].left<boxes[1].left, label+': Mahadin left, Morshed right; no overlap');
  assert.equal(await fits(page), true, label+': no page overflow');
}
async function checkFooterCredits(browser) {
  for (const width of [320,390,768,1440]) {
    for (const theme of ['light','dark']) {
      const context = await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce'});
      await context.route('**/*',localOnly);await installCreditClock(context);
      const page = await context.newPage();await page.goto(BASE+'index.html');
      if (theme==='dark') await page.locator('.theme-toggle').click();
      await page.evaluate(()=>document.fonts.ready);
      await assertCreditLayout(page,`${width}px ${theme}`);
      await audit(page,`footer credits, ${width}px, ${theme}`,'#temporary-credit');
      await page.evaluate(time=>{window.setCreditTestTime(time);window.dispatchEvent(new Event('focus'));},creditDeadline);
      assert.equal(await page.locator('#temporary-credit').isVisible(),false,'the grid must not override expiry');
      assert.equal(await page.locator('.credit-person:visible').count(),0,'both columns hide together');
      assert.equal(await page.locator('#ict-inspiration').isVisible(),true,'the ICT note retains its independent deadline');
      await page.evaluate(time=>{window.setCreditTestTime(time);document.dispatchEvent(new Event('visibilitychange'));},ictDeadline);
      assert.equal(await page.locator('#ict-inspiration').isVisible(),false);
      await context.close();
    }
  }
  for (const fallback of ['no-js','credit-script','storage']) {
    const context = await browser.newContext({viewport:{width:320,height:960},reducedMotion:'reduce',javaScriptEnabled:fallback!=='no-js'});
    await context.route('**/*',route=>fallback==='credit-script' && route.request().url().includes('/assets/credit.js') ? route.abort() : localOnly(route));
    await installCreditClock(context);
    if (fallback==='storage') await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('storage unavailable');}}));
    const page = await context.newPage();await page.goto(BASE+'index.html');await page.evaluate(()=>document.fonts.ready);
    await assertCreditLayout(page,'footer fallback: '+fallback);
    await context.close();
  }
}
async function checkKeyboard(browser) {
  for (const width of [320,720,1440]) {
    const context = await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce'});
    await context.route('**/*',localOnly);
    const page = await context.newPage();
    for (const name of pageTypes) {
      await page.goto(BASE+name);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.skip-link').evaluate(node=>node===document.activeElement),true,name+': skip link first');
      assert.notEqual(await page.locator('.skip-link').evaluate(node=>getComputedStyle(node).outlineStyle),'none');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#main-content').evaluate(node=>node===document.activeElement),true,name+': skip reaches main');
      assert.equal(await fits(page),true,`${name}, ${width}px: reflow`);
    }
    await page.goto(BASE+'index.html');
    if (width<=1200) {
      const menu = page.locator('#burger');
      await menu.focus();await page.keyboard.press('Enter');
      assert.equal(await menu.getAttribute('aria-expanded'),'true');
      assert.equal(await page.locator('#navLinks a').first().evaluate(node=>node===document.activeElement),true,'opening enters the links');
      await audit(page,`open keyboard navigation, ${width}px`);
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('aria-expanded'),'false');
      assert.equal(await menu.evaluate(node=>node===document.activeElement),true,'Escape returns to the disclosure');
      await page.keyboard.press('Space');
      // A nonmodal disclosure must neither trap focus nor remain over the content after tabbing out.
      for (let i=0;i<15 && await menu.getAttribute('aria-expanded')==='true';i++) await page.keyboard.press('Tab');
      assert.equal(await menu.getAttribute('aria-expanded'),'false','tabbing outside closes the overlay');
      assert.equal(await page.evaluate(()=>!!document.activeElement.closest('nav')),false);
    }
    await page.goto(BASE+'physics.html');
    const chapter = page.locator('.chap').first();
    await chapter.focus();await page.keyboard.press('Enter');
    assert.equal(await chapter.getAttribute('aria-checked'),'true');
    assert.notEqual(await chapter.evaluate(node=>getComputedStyle(node).outlineStyle),'none','checkbox focus visible');
    await page.keyboard.press('Space');assert.equal(await chapter.getAttribute('aria-checked'),'false');
    if (width===320) {
      await page.goto(BASE+'honours-info.html');await openDisclosures(page);
      const region = page.locator('.table-wrap').first();
      await region.focus();await page.keyboard.press('ArrowRight');
      await page.waitForFunction(()=>document.querySelector('.table-wrap').scrollLeft>0);
      await page.goto(BASE+'college-routine.html');await openDisclosures(page);
      const image = page.locator('.booklet-scroll.wide');
      await image.locator('img').evaluate(image=>image.decode());
      assert.equal(await image.evaluate(node=>node.scrollWidth>node.clientWidth),true,'test an actually wide source image');
      await image.focus();await page.keyboard.press('ArrowRight');
      await page.waitForFunction(()=>document.querySelector('.booklet-scroll.wide').scrollLeft>0);
    }
    await context.close();
  }
}
async function checkNoScript(browser) {
  const context = await browser.newContext({viewport:{width:320,height:960},reducedMotion:'reduce',javaScriptEnabled:false});
  await context.route('**/*',localOnly);
  const page = await context.newPage();
  for (const name of pageTypes) {
    await page.goto(BASE+name);await openDisclosures(page);
    assert.equal(await page.locator('main').count(),1,name);
    assert.equal(await page.locator('main h1').isVisible(),true,name);
    assert.equal(await page.locator('#navLinks a').first().isVisible(),true,name+': no-script navigation');
    assert.equal(await fits(page),true,name+': no-script 320px reflow');
  }
  await page.goto(BASE+'routine.html#arts');
  assert.equal(await page.locator('[data-routine-panel]:visible').count(),3);
  assert.equal(await page.locator('[data-routine-panel][role="region"]').count(),3);
  await page.goto(BASE+'assets/bangla-mcq-sheet.html');
  assert.equal(await page.locator('.sheet-question').count(),130);
  assert.equal(await fits(page),true);
  await context.close();
}
async function checkTrackerStorage(browser) {
  for (const failure of ['getter','read','write','enumerate']) {
    const context = await browser.newContext({viewport:{width:390,height:960},reducedMotion:'reduce'});
    await context.route('**/*',localOnly);
    await context.addInitScript(failure => {
      const native = localStorage, read = native.getItem.bind(native);
      native.setItem('hsc2027:physics:0','1');native.setItem('site:theme','light');native.setItem('unrelated:keep','yes');
      window.storedForTest = key => read(key);
      const blocked = () => { throw Error('storage unavailable'); };
      if (failure==='getter') Object.defineProperty(window,'localStorage',{get:blocked});
      if (failure==='read') Storage.prototype.getItem = blocked;
      if (failure==='write') Storage.prototype.setItem = blocked;
      if (failure==='enumerate') Object.defineProperty(window,'localStorage',{value:new Proxy(native,{ownKeys:blocked,get(target,key){
        const value=Reflect.get(target,key,target);return typeof value==='function' ? value.bind(target) : value;
      }})});
    },failure);
    const page = await context.newPage(), errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    for (const name of ['physics','tracker']) {
      await page.goto(BASE+name+'.html');
      const items = page.locator('.chap,.item');
      assert.ok(await items.count()>20);
      assert.equal(await page.locator('.chap[role="checkbox"],.item[role="checkbox"]').count(),await items.count(),`${failure}: every checklist item is keyboard-enabled`);
      const chapter = page.locator('.chap[data-subject="physics"][data-chapter="0"]');
      const before = await chapter.getAttribute('aria-checked');
      await chapter.focus();await page.keyboard.press('Enter');
      assert.equal(await chapter.getAttribute('aria-checked'),String(before!=='true'));
      await page.keyboard.press('Space');assert.equal(await chapter.getAttribute('aria-checked'),before);
      if (name==='tracker') {
        page.once('dialog',dialog=>dialog.accept());await page.locator('#resetBtn').click();
        assert.equal(await page.locator('.chap[aria-checked="true"],.item[aria-checked="true"]').count(),0);
      }
    }
    assert.equal(await page.locator('#tracker-storage-notice').count(),1,`${failure}: show one honest, accessible persistence warning`);
    assert.equal(await page.locator('#tracker-storage-notice').getAttribute('role'),'status');
    assert.equal(await page.evaluate(()=>window.storedForTest('site:theme')),'light');
    assert.equal(await page.evaluate(()=>window.storedForTest('unrelated:keep')),'yes','reset must not clear unrelated storage');
    assert.deepEqual(errors,[],failure+': storage failure must not abort enhancement');
    await audit(page,`tracker storage fallback: ${failure}`);
    await context.close();
  }
}

(async () => {
  assert.equal(pageTypes.length,35,'audit every navigable page, including retired notices');
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    for (const width of [390,1440]) {
      for (const name of pageTypes) {
        const page = await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'});
        const errors = [];page.on('pageerror',error=>errors.push(error.message));
        await page.route('**/*',localOnly);
        await page.goto(BASE+name);await openDisclosures(page);
        for (const theme of ['light','dark']) {
          if (theme==='dark') await page.locator('.theme-toggle').click();
          await audit(page,`${name}, ${width}px, ${theme}`);
        }
        if (width===390) {
          await page.setViewportSize({width:320,height:960});
          assert.equal(await fits(page),true,name+': 320px reflow');
          await page.addStyleTag({content:spacing});
          assert.equal(await fits(page),true,name+': 320px text-spacing override');
        }
        assert.deepEqual(errors,[],name+': script errors');
        await page.close();
      }
      console.log(`Accessibility matrix passed: ${pageTypes.length} pages, ${width}px, light/dark, default axe + WCAG 2.2 target size.`);
    }
    for (const width of [320,1440]) {
      const page = await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'});
      await page.route('**/*',localOnly);await page.goto(BASE+'assets/bangla-mcq-sheet.html');
      await page.evaluate(()=>document.fonts.ready);await audit(page,`standalone MCQ sheet, ${width}px`);await page.close();
    }
    await checkKeyboard(browser);
    await checkNoScript(browser);
    await checkTrackerStorage(browser);
    await checkFooterCredits(browser);
    const manual = {};
    for (const report of reports) for (const rule of report.incomplete) manual[rule.id]=(manual[rule.id] || 0)+rule.nodes.length;
    console.log(`Accessibility browser checks passed: ${reports.length} audits (140 all-page, 2 MCQ-sheet, 2 open-menu, 4 storage-fallback, 8 footer); keyboard/focus, 320px/720px reflow, text spacing, all-page no-JS, two-sided credits and independent expiry.`);
    console.log('Inconclusive axe nodes need contextual/manual review, not a certification: '+JSON.stringify(manual));
  } finally {
    if (process.env.A11Y_REPORT) {
      fs.mkdirSync(path.dirname(process.env.A11Y_REPORT),{recursive:true});
      fs.writeFileSync(process.env.A11Y_REPORT,JSON.stringify(reports,null,2)+'\n');
    }
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
