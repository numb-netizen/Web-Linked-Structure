// Serve site/ on :8765. No external portal is opened and no real account/data is used.
const assert = require('node:assert/strict');
const {chromium} = require('playwright-core');
const BASE = 'http://127.0.0.1:8765/';
const ids = ['science','arts','commerce'];
const localOnly = route => route.request().url().startsWith(BASE) ? route.continue() : route.abort();
const fits = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
async function selected(page, id) {
  await page.waitForFunction(id => document.querySelector('#routine-tab-'+id).getAttribute('aria-selected') === 'true', id);
  assert.deepEqual(await page.locator('[data-routine-panel]:visible').evaluateAll(nodes => nodes.map(node => node.id)), [id]);
  assert.equal(await page.getByRole('tab', {selected:true}).count(), 1);
  assert.equal(await page.locator('[data-routine-choice][tabindex="0"]').count(), 1);
  assert.equal(await page.locator('#routine-tab-'+id).getAttribute('aria-controls'), id);
  assert.equal(await page.locator('#'+id).getAttribute('aria-labelledby'), 'routine-tab-'+id);
  assert.equal(await page.locator('#'+id).evaluate(node=>node.tagName), 'DIV', 'generic container permits a tabpanel role');
  assert.equal(await page.getByRole('tabpanel').count(), 1);
}
async function audit(page, label) {
  if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const violations = await page.evaluate(async () => (await axe.run(document, {rules:{'target-size':{enabled:true}}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
  assert.deepEqual(violations, [], label);
}

(async () => {
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',args:['--no-sandbox']});
  let audits=0;
  try {
    for (const width of [320,390,768,1440]) {
      const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
      await context.route('**/*',localOnly);
      const page=await context.newPage(), errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      for (const theme of ['light','dark']) {
        await page.goto(BASE+'routine.html');
        if (theme==='dark') await page.locator('.theme-toggle').click();
        for (const id of ids) {
          await page.goto(BASE+'routine.html#'+id);
          await selected(page,id);
          await page.evaluate(()=>document.fonts.ready);
          assert.equal(await fits(page),true,`${width} ${theme} ${id}: no page overflow`);
          assert.equal(await page.locator('#'+id+' .study-sessions>li').count(),5);
          assert.equal(await page.locator('#'+id+' .study-week-table tbody tr').count(),7);
          const region=page.locator('#'+id+' .study-week-scroll');
          assert.equal(await region.getAttribute('tabindex'),'0');
          assert.equal(await region.getAttribute('role'),'region');
          if (width===320) {
            await region.focus();
            await page.keyboard.press('ArrowRight');
            await page.waitForFunction(id=>document.querySelector('#'+id+' .study-week-scroll').scrollLeft>0,id);
          }
          if ([390,1440].includes(width)) {await audit(page,`${id}, ${width}, ${theme}`);audits++;}
        }
      }
      assert.deepEqual(errors,[],`${width}: scripts`);
      await context.close();
      console.log(`Study routine layout passed: ${width}px, 3 departments, light/dark`);
    }
    {
      const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
      await context.route('**/*',localOnly);
      const page=await context.newPage();
      await page.goto(BASE+'routine.html#science');
      await page.locator('#routine-tab-science').focus();
      for (const [key,id] of [['ArrowRight','arts'],['ArrowRight','commerce'],['ArrowRight','science'],['ArrowLeft','commerce'],['Home','science'],['End','commerce'],[' ','commerce']]) {
        await page.keyboard.press(key);await selected(page,id);
        assert.equal(await page.locator('#routine-tab-'+id).evaluate(node=>node===document.activeElement),true);
        assert.ok(page.url().endsWith('#'+id));
      }
      await page.goto(BASE+'routine.html#science');
      await page.locator('#routine-tab-arts').click();await selected(page,'arts');
      await page.locator('#routine-tab-commerce').click();await selected(page,'commerce');
      await page.goBack();await selected(page,'arts');
      await page.goBack();await selected(page,'science');
      await page.goForward();await selected(page,'arts');
      await page.evaluate(()=>{location.hash='contact';});await selected(page,'arts');
      await page.goto(BASE+'routine.html#unknown');await selected(page,'arts'); // same-document unrelated fragments keep the current choice
      await page.reload();await selected(page,'science'); // a fresh unknown deep link has the default choice
      await page.goto(BASE+'routine.html');await selected(page,'science');
      await page.locator('#routine-tab-commerce').focus();await page.keyboard.press('Enter');await selected(page,'commerce');
      await page.evaluate(()=>{window.printCalls=0;window.print=()=>{window.printCalls++;};});
      await page.locator('[data-routine-print]').click();assert.equal(await page.evaluate(()=>window.printCalls),1);
      await page.emulateMedia({media:'print'});
      assert.deepEqual(await page.locator('[data-routine-panel]:visible').evaluateAll(nodes=>nodes.map(node=>node.id)),ids,'all three print, including hidden panels');
      assert.equal(await page.locator('.study-week-table:visible').count(),3);
      assert.equal(await page.locator('.study-week-table tbody tr:visible').count(),21);
      assert.equal(await page.locator('.routine-choices').isVisible(),false);
      assert.equal(await page.locator('.skip-link').isVisible(),false,'focused skip links never overlay printed content');
      assert.ok(await page.locator('#science .study-sessions').evaluate(node=>node.checkVisibility({checkVisibilityCSS:true})));
      await page.emulateMedia({media:'screen'});await selected(page,'commerce');
      await context.close();
    }
    // Contextual, reciprocal links are ordinary navigation, not a client-only router.
    {
      const context=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce'});
      await context.route('**/*',localOnly);const page=await context.newPage();
      for (const id of ids) {
        await page.goto(BASE+id+'.html');await page.locator('.department-routine a').click();
        await page.waitForURL(new RegExp('routine\\.html#'+id+'$'));await selected(page,id);
        await page.locator('#'+id+' .routine-department-back').click();await page.waitForURL(new RegExp(id+'\\.html$'));
        await page.goto(BASE+'index.html');await page.locator(`.routine-preview-links a[href="routine.html#${id}"]`).click();
        await page.waitForURL(new RegExp('routine\\.html#'+id+'$'));await selected(page,id);
      }
      await page.goto(BASE+'biology.html');await page.locator('.page-connections a[data-page="routine"]').click();
      await page.waitForURL(/routine\.html#science$/);await selected(page,'science');
      await context.close();
    }
    for (const width of [320,1440]) {
      const context=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:1000},reducedMotion:'reduce'});
      await context.route('**/*',localOnly);const page=await context.newPage();
      await page.goto(BASE+'routine.html');
      assert.equal(await page.locator('[data-routine-panel]:visible').count(),3);
      assert.equal(await page.locator('[data-routine-print]').isVisible(),false);
      assert.equal(await fits(page),true);
      await page.locator('[data-routine-choice="arts"]').click();await page.waitForURL(/routine\.html#arts$/);
      assert.equal(await page.locator('[data-routine-panel]:visible').count(),3);
      await context.close();
    }
    for (const width of [320,1440]) {
      // Audit the same unenhanced three-plan HTML with the routine script blocked.
      // axe itself needs page JavaScript/timers; genuine no-JS navigation is checked above.
      const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
      await context.route('**/*',route=>route.request().url().includes('/assets/study-routines.js')?route.abort():localOnly(route));
      const page=await context.newPage();await page.goto(BASE+'routine.html#commerce');
      assert.equal(await page.locator('[data-routine-panel]:visible').count(),3,'blocked enhancement fails readable');
      await audit(page,`${width}: unenhanced three-plan fallback`);audits++;
      await context.close();
    }
    {
      const context=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce'});
      await context.route('**/*',localOnly);
      await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}}));
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(BASE+'routine.html#arts');await selected(page,'arts');
      await page.locator('#routine-tab-commerce').click();await selected(page,'commerce');
      assert.deepEqual(errors,[]);await context.close();
    }
    {
      const context=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce'});
      await context.route('**/*',localOnly);const page=await context.newPage();
      await page.goto(BASE+'site/?from=old#structure');
      await page.waitForURL(url=>url.pathname==='/' && url.search==='?from=old' && url.hash==='#structure');
      assert.equal(await page.locator('#departments').count(),1);
      await context.close();
    }
    console.log(`Study routine browser checks passed: tabs/keyboard/history/deep links, print-all, 21 days, local tables, script/storage failures, no-JS, legacy entry redirect; ${audits} default axe + WCAG 2.2 target-size audits.`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
