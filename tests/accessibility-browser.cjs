// A targeted automated audit, not a substitute for manual accessibility review.
// Serve site/ on :8765; use playwright-core@1.56.1 and axe-core@4.10.3.
const assert = require('node:assert/strict');
const {chromium} = require('playwright-core');
const BASE = 'http://127.0.0.1:8765/';
const pageTypes = ['index','science','physics','english-2','bangla-2','classes','tracker','teachers','college-info','college-routine','honours-info','feedback','android-app','student-group'];

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome', args:['--no-sandbox']});
  try {
    for (const width of [390,1440]) {
      for (const name of pageTypes) {
        const page = await browser.newPage({viewport:{width,height:960}, reducedMotion:'reduce'});
        await page.route('**/*', route => route.request().url().startsWith(BASE) ? route.continue() : route.abort());
        await page.goto(BASE + name + '.html');
        await page.evaluate(async () => {
          document.querySelectorAll('.connection-panel,.network-diagram,.booklet-source,.bangla2-detail').forEach(details => { details.open = true; });
          document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
          await document.fonts.ready;
        });
        await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
        for (const theme of ['light','dark']) {
          if (theme === 'dark') await page.locator('.theme-toggle').click();
          const violations = await page.evaluate(async () => {
            const result = await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});
            return result.violations.map(violation => ({id:violation.id, nodes:violation.nodes.map(node => ({target:node.target,summary:node.failureSummary}))}));
          });
          assert.deepEqual(violations, [], `${name}, ${width}px, ${theme}: ${JSON.stringify(violations)}`);
        }
        await page.close();
      }
    }
    console.log(`Accessibility browser checks passed: ${pageTypes.length * 4} targeted audits across mobile/desktop and light/dark themes.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
