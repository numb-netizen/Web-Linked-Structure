// Run against site/ on :8765, with all non-local requests blocked.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright-core');
const bank = require('../data/bangla-mcq.json');
const core = require('../site/assets/mcq-core.js');
const BASE = 'http://127.0.0.1:8765/';
const DIR = path.resolve(__dirname,'../.cache/bangla-mcq-preview');
fs.mkdirSync(DIR,{recursive:true});
const bn = n => n.toLocaleString('bn-BD');
async function audit(page, label) {
  await page.evaluate(()=>document.fonts.ready);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const failures=await page.evaluate(async()=> (await axe.run(document,{rules:{'target-size':{enabled:true}}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
  assert.deepEqual(failures,[],label);
}
async function layout(page,width) {
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth)<=width,`page fits ${width}px`);
  const boxes=await page.locator('#mcq-running input,#mcq-running .btn:visible,#mcq-setup select:visible').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON()));
  for(const box of boxes)assert.ok(box.x>=0 && box.right<=width+1,`control fits ${width}px`);
}
async function choose(page, correct) {
  const meta=await page.locator('#mcq-question-meta').textContent();
  const id=meta.match(/BN1-\d+/)[0],q=bank.questions.find(q=>q.id===id);
  const answer=q.options[correct?q.answer:(q.answer+1)%4];
  const texts=await page.locator('#mcq-options label span').allTextContents();
  const index=texts.findIndex(t=>t.slice(2)===answer);
  assert.ok(index>=0,`${id}: the canonical answer is among the shuffled options`);
  await page.locator('#mcq-options input').nth(index).check();
  return id;
}
async function submit(page) {
  await page.locator('#mcq-submit').click();
  await page.locator('#mcq-confirm-yes').click();
  await page.locator('#mcq-result').waitFor({state:'visible'});
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
 let audits=0;
 try {
  for(const width of [320,390,768,1440])for(const theme of ['light','dark']) {
   const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],external=[];
   await context.route('**/*',route=>route.request().url().startsWith(BASE)?route.continue():(external.push(route.request().url()),route.abort()));
   await context.addInitScript(value=>localStorage.setItem('site:theme',value),theme);
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(BASE+'bangla.html');
   assert.equal(await page.locator('#mcq-fallback').isVisible(),false);
   assert.equal(await page.locator('#bangla-one-shot').getAttribute('href'),bank.playlistUrl);
   await page.locator('.chap[data-subject="bangla"][data-chapter="0"]').click();
   assert.equal(await page.evaluate(()=>localStorage.getItem('hsc2027:bangla:0')),'1');
   await page.locator('#mcq-open').focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('#mcq-chapter option').count(),27);
   assert.equal(await page.locator('#mcq-setup-title').evaluate(el=>el===document.activeElement),true);
   await page.locator('#mcq-chapter').selectOption('aparichita');
   await page.locator('#mcq-count').selectOption('5');
   assert.match(await page.locator('#mcq-availability').textContent(),/৫টি প্রশ্ন/);
   if([390,1440].includes(width)){await audit(page,`${width}/${theme}/setup`);audits++;}
   await layout(page,width);
   await page.locator('#mcq-start').click();
   assert.equal(await page.locator('#mcq-options input[type="radio"]').count(),4);
   assert.equal(await page.locator('#mcq-clock').textContent(),'সময় নির্ধারিত নয়');
   await choose(page,true);
   await page.locator('#mcq-clear').click();
   assert.equal(await page.locator('#mcq-options input:checked').count(),0);
   await choose(page,true);await page.locator('#mcq-next').click();
   await choose(page,false);await page.locator('#mcq-next').click();
   await page.locator('#mcq-next').click();await choose(page,true);await page.locator('#mcq-next').click();
   assert.equal(await page.locator('#mcq-next').isDisabled(),true);
   assert.equal(await page.locator('#mcq-progress').getAttribute('value'),'3');
   await page.locator('#mcq-palette button').first().click();
   assert.equal(await page.locator('#mcq-options input:checked').count(),1,'answers survive navigating back');
   if([390,1440].includes(width)){await audit(page,`${width}/${theme}/running`);audits++;await page.locator('#mcq-question-index').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(DIR,`${width}-${theme}-test.png`)});}
   await layout(page,width);
   await page.locator('#mcq-submit').click();
   assert.match(await page.locator('#mcq-confirm-text').textContent(),/২টি প্রশ্নের উত্তর বাকি/);
   if([390,1440].includes(width)){await audit(page,`${width}/${theme}/confirmation`);audits++;}
   await page.locator('#mcq-confirm-no').click();assert.equal(await page.locator('#mcq-result').isVisible(),false);
   await submit(page);
   assert.equal(await page.locator('#mcq-score').textContent(),'২ / ৫');
   assert.equal(await page.locator('#mcq-wrong').textContent(),'১');assert.equal(await page.locator('#mcq-skipped').textContent(),'২');
   assert.equal(await page.locator('.mcq-review-item').count(),5);
   const missed=await page.locator('.mcq-review-item:not([data-status="correct"])').evaluateAll(nodes=>nodes.map(n=>n.dataset.questionId).sort());
   await page.locator('.mcq-review-item summary').first().click();
   assert.ok(await page.locator('.mcq-review-item').first().locator('.mcq-answer-correct').isVisible());
   if([390,1440].includes(width)){await audit(page,`${width}/${theme}/results`);audits++;await page.locator('#mcq-result-title').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(DIR,`${width}-${theme}-result.png`)});}
   await page.locator('#mcq-retry-wrong').click();
   assert.equal(await page.locator('#mcq-palette button').count(),3);
   const retried=[];
   for(let i=0;i<3;i++){retried.push(await choose(page,true));if(i<2)await page.locator('#mcq-next').click();}
   assert.deepEqual(retried.sort(),missed);
   await submit(page);assert.equal(await page.locator('#mcq-score').textContent(),'৩ / ৩');
   assert.equal(await page.locator('#mcq-retry-wrong').isDisabled(),true);
   assert.equal(await page.evaluate(()=>localStorage.getItem('hsc2027:bangla:0')),'1','quiz never changes chapter progress');
   await page.locator('#mcq-new').click();await page.locator('#mcq-origin').selectOption('original');await page.locator('#mcq-count').selectOption('30');await page.locator('#mcq-duration').selectOption('5');
   assert.match(await page.locator('#mcq-availability').textContent(),/১টি আসবে/);
   await page.locator('#mcq-start').click();assert.equal(await page.locator('#mcq-palette button').count(),1);
   await choose(page,true);
   await page.evaluate(()=>{const now=Date.now;Date.now=()=>now()+300001;document.dispatchEvent(new Event('visibilitychange'));});
   await page.locator('#mcq-result').waitFor({state:'visible'});
   assert.equal(await page.locator('#mcq-score').textContent(),'১ / ১');
   assert.match(await page.locator('#mcq-result-reason').textContent(),/সময় শেষ হয়েছে/);
   assert.deepEqual(errors,[]);assert.deepEqual(external,[],'MCQ never makes an external request');
   console.log(`PASS ${width}px ${theme}: selection, clear/change, navigation, grading, missed-only retry, deadline, privacy, layout`);
   await context.close();
  }
  // Android presentation keeps the quiz/worksheet, without offering unsupported Blob downloads.
  // Exercise keyboard changes, both abandon decisions, same-settings retry and a restored deadline.
  {
   const context=await browser.newContext({userAgent:'Mozilla/5.0 HSC2027App/1.0',viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();
   await context.route('**/*',route=>route.request().url().startsWith(BASE)?route.continue():route.abort());
   await page.goto(BASE+'bangla.html#bangla-mcq');
   assert.ok(await page.locator('html').evaluate(el=>el.classList.contains('hsc-android-app')));
   assert.equal(await page.locator('#mcq-csv').isVisible(),false);
   assert.ok(await page.locator('.mcq-intro a[href="assets/bangla-mcq-sheet.html"]').isVisible());
   assert.equal(await page.locator('nav a[href="android-app.html"]').isVisible(),false);
   await page.locator('#mcq-open').click();await page.locator('#mcq-chapter').selectOption('aparichita');await page.locator('#mcq-origin').selectOption('pdf');await page.locator('#mcq-count').selectOption('5');await page.locator('#mcq-start').click();
   assert.equal(await page.locator('#mcq-palette button').count(),4);
   const radios=page.locator('#mcq-options input');
   await radios.first().focus();await page.keyboard.press('Space');assert.equal(await radios.first().isChecked(),true);
   await page.keyboard.press('ArrowDown');assert.equal(await radios.nth(1).isChecked(),true);assert.equal(await radios.first().isChecked(),false);
   assert.equal(await page.locator('#mcq-progress').getAttribute('value'),'1','changing a radio is still one answered question');
   await page.locator('#mcq-exit').click();await page.locator('#mcq-confirm-no').click();assert.equal(await radios.nth(1).isChecked(),true);
   await page.locator('#mcq-exit').click();await page.locator('#mcq-confirm-yes').click();assert.ok(await page.locator('#mcq-setup').isVisible());assert.equal(await page.locator('#mcq-result').isVisible(),false);
   await page.locator('#mcq-origin').selectOption('original');await page.locator('#mcq-duration').selectOption('5');await page.locator('#mcq-start').click();await choose(page,true);await page.locator('#mcq-submit').click();
   await page.evaluate(()=>{window.dispatchEvent(new Event('pagehide'));const now=Date.now;Date.now=()=>now()+300001;window.dispatchEvent(new Event('pageshow'));});
   await page.locator('#mcq-result').waitFor({state:'visible'});assert.equal(await page.locator('#mcq-confirm').isVisible(),false);assert.equal(await page.locator('#mcq-score').textContent(),'১ / ১');
   await page.locator('#mcq-retry').click();assert.equal(await page.locator('#mcq-palette button').count(),1);assert.equal(await page.locator('#mcq-clock').textContent(),'০৫:০০');
   await choose(page,true);await submit(page);assert.equal(await page.locator('#mcq-score').textContent(),'১ / ১');
   await page.locator('#mcq-new').click();await page.locator('#mcq-close').click();assert.equal(await page.locator('#mcq-open').getAttribute('aria-expanded'),'false');
   await context.close();
   console.log('PASS Android context, radio keyboard/change, abandon/cancel, page restore expiry and same-settings retry');
  }
  // No script: the exact same questions and answers remain reachable in a static sheet.
  {
   const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}}),page=await context.newPage();
   await context.route('**/*',route=>route.request().url().startsWith(BASE)?route.continue():route.abort());
   await page.goto(BASE+'bangla.html#bangla-mcq');
   assert.equal(await page.locator('#mcq-open').isVisible(),false);assert.equal(await page.locator('#mcq-fallback').isVisible(),true);
   // Native keyboard activation needs no page timers/rAF for Playwright's click-stability probe.
   // This also exercises the no-script fallback as an actual keyboard user would.
   const sheetLink=page.locator('.mcq-intro a[href="assets/bangla-mcq-sheet.html"]');
   assert.equal(await sheetLink.isVisible(),true);await sheetLink.press('Enter');
   await page.waitForURL(BASE+'assets/bangla-mcq-sheet.html');
   assert.equal(await page.locator('.sheet-question').count(),130);
   await page.locator('.sheet-answer summary').first().press('Enter');
   assert.ok(await page.locator('.sheet-answer').first().getAttribute('open')!==null);
   await layout(page,390);
   await context.close();
  }
  // Missing bank: fail closed to the real worksheet, not a broken start button.
  {
   const context=await browser.newContext(),page=await context.newPage();
   await context.route('**/*',route=>route.request().url().includes('bangla-mcq-bank.js')||!route.request().url().startsWith(BASE)?route.abort():route.continue());
   await page.goto(BASE+'bangla.html');assert.equal(await page.locator('#mcq-open').isVisible(),false);assert.equal(await page.locator('#mcq-fallback').isVisible(),true);
   await context.close();
  }
  // Storage denial does not disable an independent, local quiz (tracker may report its own error).
  {
   const context=await browser.newContext(),page=await context.newPage();
   await context.route('**/*',route=>route.request().url().startsWith(BASE)?route.continue():route.abort());
   await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
   await page.goto(BASE+'bangla.html');await page.locator('#mcq-open').click();await page.locator('#mcq-start').click();await choose(page,true);await submit(page);assert.equal(await page.locator('#mcq-correct').textContent(),'১');
   await context.close();
  }
  // The native/desktop offline payload needs no fetch or network API to read the bank.
  {
   const context=await browser.newContext(),page=await context.newPage();
   await context.route('**/*',route=>route.request().url().startsWith('file://')?route.continue():route.abort());
   await page.goto('file://'+path.resolve(__dirname,'../site/bangla.html'));
   await page.locator('#mcq-open').click();await page.locator('#mcq-start').click();await choose(page,true);await submit(page);assert.equal(await page.locator('#mcq-correct').textContent(),'১');
   await context.close();
  }
  // CSV download is identical to the canonical bank, not the shuffled session.
  {
   const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage();
   await page.goto(BASE+'bangla.html');
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#mcq-csv').click()]);
   assert.equal(fs.readFileSync(await download.path(),'utf8'),core.csv(core.sheetRows(bank)));
   await page.goto(BASE+'assets/bangla-mcq-sheet.html');
   await audit(page,'worksheet/mobile-friendly static HTML');audits++;
   await page.emulateMedia({media:'print'});
   const printed=await page.locator('.sheet-answer>div').evaluateAll(nodes=>nodes.every(n=>n.checkVisibility({contentVisibilityAuto:true}) && n.getBoundingClientRect().height>0));
   assert.ok(printed,'closed answer details expand in print without JavaScript');
   await context.close();
  }
  console.log(`PASS Bangla MCQ: ${audits} default axe + WCAG 2.2 target-size audits; no-JS/missing-bank/storage-denied/file-offline/CSV/print fallbacks`);
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
