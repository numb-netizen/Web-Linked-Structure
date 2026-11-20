// Run against a static server on port 8765. All external requests are blocked.
const assert = require('node:assert/strict');
const {chromium} = require('playwright-core');
const {pages, subjects} = require('../scripts/site-graph.cjs');
const BASE = 'http://127.0.0.1:8765/';
const fits = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const localOnly = route => route.request().url().startsWith(BASE) ? route.continue() : route.abort();
async function assertPage(page, pattern) {
  await page.waitForURL(pattern, {waitUntil:'load'}); // Wait for navigation and shared-script initialization.
  assert.match(page.url(), pattern);
}

async function checkRoundTrip(page, javaScriptEnabled) {
  await page.goto(BASE + 'index.html#structure');
  await page.locator('.network-directory a[data-page="physics"]').click();
  await assertPage(page, /physics\.html$/);
  if (javaScriptEnabled) {
    await page.locator('.chap[data-subject="physics"][data-chapter="0"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => localStorage.getItem('hsc2027:physics:0')), '1');
  }
  await page.locator('.page-connections a[data-page="tracker"]').click();
  await assertPage(page, /tracker\.html#track-physics$/);
  const card = page.locator('#track-physics');
  await card.waitFor({state:'visible'});
  if (javaScriptEnabled) assert.equal(await card.locator('[data-chapter="0"]').getAttribute('aria-checked'), 'true');
  assert.ok(await card.evaluate(el => el.getBoundingClientRect().top >= document.querySelector('nav').getBoundingClientRect().bottom), 'deep-linked card clears fixed navigation');
  await card.locator('.tracker-subject-link').click();
  await assertPage(page, /physics\.html$/);
  if (javaScriptEnabled) assert.equal(await page.locator('[data-subject="physics"][data-chapter="0"]').getAttribute('aria-checked'), 'true');
  await page.locator('.page-connections a[data-page="math"]').click();
  await assertPage(page, /math\.html$/);
  await page.locator('.page-connections a[data-page="classes"]').click();
  await assertPage(page, /classes\.html#class-math$/);
  await page.locator('#class-math .resource-subject-link').click();
  await assertPage(page, /math\.html$/);

  // No script is needed for the expandable connection panel or keyboard activation.
  await page.goto(BASE + 'science.html');
  const panel = page.locator('.connection-panel');
  assert.equal(await panel.getAttribute('open'), null);
  await panel.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.notEqual(await panel.getAttribute('open'), null);
  await page.keyboard.press('Space');
  assert.equal(await panel.getAttribute('open'), null);
  await page.keyboard.press('Enter');
  await panel.locator('a[data-page="bangla"]').focus();
  await page.keyboard.press('Enter');
  await assertPage(page, /bangla\.html$/);
  await page.locator('.page-connections a[data-page="commerce"]').click();
  await assertPage(page, /commerce\.html$/);
  assert.equal(await fits(page), true);
}

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome', args:['--no-sandbox']});
  try {
    for (const width of [320, 768, 1201, 1440]) {
      const context = await browser.newContext({viewport:{width,height:900}, reducedMotion:'reduce'});
      await context.route('**/*', localOnly);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const theme of ['light', 'dark']) {
        await page.goto(BASE + 'index.html#structure');
        if (theme === 'dark') await page.locator('.theme-toggle').click();
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
        assert.equal(await fits(page), true, `network ${width} ${theme}`);
        await page.locator('.network-diagram > summary').click();
        assert.equal(await page.locator('.network-node').count(), 7);
        const boxes = await page.locator('.network-node').evaluateAll(nodes => nodes.map(node => {
          const r = node.getBoundingClientRect();
          return {left:r.left, right:r.right, top:r.top, bottom:r.bottom};
        }));
        boxes.forEach((box, i) => {
          assert.ok(box.left >= 0 && box.right <= width, `node ${i} fits ${width}`);
          boxes.slice(i + 1).forEach(other => assert.ok(box.right <= other.left || other.right <= box.left || box.bottom <= other.top || other.bottom <= box.top, `network nodes do not overlap at ${width}`));
        });
        for (const id of Object.keys(pages).filter(id => id !== 'index')) {
          await page.goto(BASE + id + '.html');
          const panel = page.locator('.connection-panel');
          assert.equal(await panel.count(), 1, id);
          if (await panel.getAttribute('open') === null) await panel.locator('summary').click();
          assert.equal(await panel.locator('.connection-groups').isVisible(), true, id);
          assert.equal(await fits(page), true, `${id} ${width} ${theme}`);
          assert.equal(await page.locator('html').getAttribute('data-theme'), theme, id);
        }
        await page.goto(BASE + 'index.html');
        if (width <= 1200) await page.locator('#burger').click();
        await page.locator('#navLinks .network-nav-link').click();
        await assertPage(page, /index\.html#structure$/);
        if (width <= 1200) assert.equal(await page.locator('#burger').getAttribute('aria-expanded'), 'false');
      }
      await checkRoundTrip(page, true);
      assert.deepEqual(errors, [], `script errors ${width}`);
      await context.close();
    }
    // Search is local, Unicode-aware, keyboard-operable and never rewrites page HTML.
    for (const width of [320, 768, 1440]) {
      const context = await browser.newContext({viewport:{width,height:900}, reducedMotion:'reduce'});
      await context.route('**/*', localOnly);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(BASE + 'index.html#structure');
      const input = page.getByRole('searchbox');
      const visibleIds = () => page.locator('.network-directory a[data-page]:visible').evaluateAll(links => links.map(link => link.dataset.page));
      assert.equal((await visibleIds()).length, 31);
      assert.match(await page.locator('#directory-status').textContent(), /৩১/);
      for (const query of ['পদার্থবিজ্ঞান','PHYSICS','  physics  ']) {
        await input.fill(query);
        assert.deepEqual(await visibleIds(), ['physics'], query);
        assert.equal(await page.locator('.network-diagram').isVisible(), false);
      }
      await input.fill('বাংলা ২');
      assert.deepEqual(await visibleIds(), ['bangla-2']);
      await input.fill('বিজ্ঞান');
      assert.ok((await visibleIds()).includes('science'));
      assert.ok((await visibleIds()).includes('chemistry'));
      await input.fill('<img src=x onerror=alert(1)>');
      assert.deepEqual(await visibleIds(), []);
      assert.equal(await page.locator('#directory-empty').isVisible(), true);
      assert.equal(await page.locator('#page-directory img').count(), 0);
      await page.locator('#directory-empty [data-search-reset]').click();
      assert.equal(await input.inputValue(), '');
      assert.equal(await input.evaluate(el => el === document.activeElement), true);
      assert.equal((await visibleIds()).length, 31);
      await input.fill('রসায়ন');
      await page.keyboard.press('Escape');
      assert.equal((await visibleIds()).length, 31);
      await input.fill('physics');
      await page.keyboard.press('Enter');
      assert.match(page.url(), /index\.html#structure$/);
      await page.locator('.network-directory a[data-page="physics"]').click();
      await assertPage(page, /physics\.html$/);

      await page.goto(BASE + 'index.html');
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#main-content').evaluate(el => el === document.activeElement), true);
      if (width <= 1200) {
        const menu = page.locator('#burger');
        await menu.click();
        await page.keyboard.press('Escape');
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
        assert.equal(await menu.evaluate(el => el === document.activeElement), true);
        await menu.click();
        await page.mouse.click(6, 880);
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
        await menu.click();
        await page.setViewportSize({width:1440,height:900});
        await page.waitForFunction(() => document.getElementById('burger').getAttribute('aria-expanded') === 'false');
      }
      assert.deepEqual(errors, [], `formal interface ${width}`);
      await context.close();
    }
    for (const width of [320, 1440]) {
      const context = await browser.newContext({javaScriptEnabled:false, viewport:{width,height:900}, reducedMotion:'reduce'});
      await context.route('**/*', localOnly);
      const page = await context.newPage();
      await page.goto(BASE + 'index.html');
      assert.equal(await page.locator('.directory-search').isVisible(), false);
      assert.equal(await page.locator('#burger').isVisible(), false);
      assert.equal(await page.locator('#navLinks .network-nav-link').isVisible(), true);
      await checkRoundTrip(page, false);
      for (const id of subjects) {
        await page.goto(BASE + id + '.html');
        assert.equal(await page.locator('.page-connections a[data-page="tracker"]').isVisible(), true, `static links: ${id}`);
        assert.equal(await fits(page), true, `no-JS ${id} ${width}`);
      }
      await context.close();
      console.log(`No-JavaScript navigation: ${width}px passed`);
    }
    // New contextual links follow the app's existing download-link policy too.
    const context = await browser.newContext({userAgent:'Mozilla/5.0 HSC2027App', viewport:{width:360,height:800}});
    await context.route('**/*', localOnly);
    const page = await context.newPage();
    for (const name of ['index', 'feedback']) {
      await page.goto(BASE + name + '.html');
      assert.equal(await page.locator('.network-chip[data-page="android-app"]').isVisible(), false);
    }
    await page.goto(BASE + 'index.html#structure');
    assert.match(await page.locator('#directory-status').textContent(), /৩০/);
    await page.getByRole('searchbox').fill('android');
    assert.equal(await page.locator('#directory-empty').isVisible(), true);
    await context.close();
    console.log('Web-linked browser checks passed: reciprocal navigation, deep links, saved progress, keyboard, no-JS, mobile, desktop and both themes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
