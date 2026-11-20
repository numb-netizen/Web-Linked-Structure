// Serve site/ on :8765. Observe finite WAAPI text effects separately from infinite CSS decorations.
const assert = require('node:assert/strict');
const {chromium} = require('playwright-core');
const BASE='http://127.0.0.1:8765/';
const localOnly=route=>route.request().url().startsWith(BASE)?route.continue():route.abort();
async function instrumentation(context, lite=false) {
  await context.addInitScript(lite=>{
    window.textEntranceLog=[];
    window.textEntranceNodes=[];
    window.maxConcurrentText=0;
    const active=window.textActiveEffects=new Set();
    try {localStorage.setItem('site:motion-paused',lite?'1':'0');localStorage.setItem('hsc2027:physics:0','1');} catch(_){}
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(frames,options) {
      window.textEntranceLog.push({tag:this.tagName,classes:this.className,text:this.textContent,frames,options});
      window.textEntranceNodes.push(this);
      const effect=animate.call(this,frames,options);
      active.add(effect);window.maxConcurrentText=Math.max(window.maxConcurrentText,active.size);
      effect.addEventListener('finish',()=>active.delete(effect),{once:true});
      effect.addEventListener('cancel',()=>active.delete(effect),{once:true});
      return effect;
    };
  },lite);
}
async function settle(page) {
  await page.waitForFunction(()=>document.fonts.status==='loaded' && (!window.textActiveEffects || window.textActiveEffects.size===0) && document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).every(a=>a.playState==='finished'||a.playState==='idle'));
}
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    for (const lite of [false,true]) {
      const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);await instrumentation(context,lite);
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(BASE+'index.html');
      await page.waitForFunction(()=>window.textEntranceLog.length>0);await settle(page);
      const initial=await page.evaluate(()=>window.textEntranceLog);
      assert.ok(initial.some(effect=>effect.classes.includes('hero-title-')),'the styled hero really enters');
      for (const effect of initial) {
        assert.equal(effect.options.iterations,1);assert.equal(effect.options.fill,'none');
        assert.equal(effect.options.duration,lite?260:650);
      }
      assert.ok(await page.evaluate(()=>window.maxConcurrentText) <= (lite?6:28),'simultaneous text work is bounded');
      if (!lite) {
        assert.equal(initial.filter(effect=>effect.classes.includes('hero-title-')).length,3);
        assert.ok(initial.some(effect=>effect.classes==='sub'));
      }
      assert.equal(await page.locator('.hero-title>span').count(),3,'Bengali words/conjuncts are not split into glyph spans');
      await page.locator('#college-online').evaluate(node=>node.scrollIntoView({behavior:'instant',block:'center'}));
      await page.waitForFunction(count=>window.textEntranceLog.length>count,initial.length);await settle(page);
      if (!lite) assert.ok(await page.evaluate(()=>window.textEntranceNodes.some(node=>node.matches('.college-portal h3'))));
      assert.ok(await page.evaluate(()=>window.maxConcurrentText) <= (lite?6:28),'scroll entrances retain the concurrency budget');
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      await page.locator('#college-online').evaluate(node=>node.scrollIntoView({behavior:'instant',block:'center'}));await settle(page);
      assert.equal(await page.evaluate(()=>new Set(window.textEntranceNodes).size===window.textEntranceNodes.length),true,'each observed block animates at most once');
      assert.equal(await page.evaluate(()=>window.textEntranceNodes.some(node=>!!node.closest('table,.mcq-panel,.chap,.tcard,[role="timer"],[aria-live],.galaxy-control'))),false);
      assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.hero-title>span')].every(node=>getComputedStyle(node).opacity==='1'&&getComputedStyle(node).transform==='none')));
      await page.locator('.galaxy-toggle').click();
      await page.waitForFunction(lite=>document.documentElement.dataset.textMotion===(lite?'full':'lite'),lite);
      assert.equal(await page.evaluate(()=>localStorage.getItem('hsc2027:physics:0')),'1');
      await page.locator('#departments').evaluate(node=>node.scrollIntoView({behavior:'instant',block:'center'}));
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>document.documentElement.dataset.textMotion==='reduced');
      assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity&&a.playState==='running').length),0);
      assert.deepEqual(errors,[]);await context.close();
    }
    {
      const context=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce'});
      await context.route('**/*',localOnly);await instrumentation(context);
      const page=await context.newPage();await page.goto(BASE+'index.html');await settle(page);
      assert.equal(await page.locator('html').getAttribute('data-text-motion'),'reduced');
      assert.equal(await page.evaluate(()=>window.textEntranceLog.length),0);
      await page.locator('#college-online').evaluate(node=>node.scrollIntoView({behavior:'instant'}));
      assert.equal(await page.evaluate(()=>window.textEntranceLog.length),0);
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.waitForFunction(()=>window.textEntranceLog.length>0);await settle(page);
      await context.close();
    }
    {
      const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',localOnly);
      const page=await context.newPage();await page.goto(BASE+'routine.html#commerce');
      await page.evaluate(()=>{
        document.querySelector('.skip-link').focus();
        const effect=document.querySelector('#commerce h3').animate([
          {opacity:.2,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}
        ],{duration:60000,fill:'both'});
        effect.pause();effect.currentTime=100;
      });
      await page.emulateMedia({media:'print'});
      assert.equal(await page.locator('.skip-link').isVisible(),false,'print never includes the focused skip link');
      assert.deepEqual(await page.locator('#commerce h3').evaluate(node=>({opacity:getComputedStyle(node).opacity,transform:getComputedStyle(node).transform})),{opacity:'1',transform:'none'},'print CSS wins even if an entrance effect has not finished');
      assert.equal(await page.locator('.study-week-table tbody tr:visible').count(),21);
      await context.close();
    }
    for (const blocked of ['script','observer','animate','no-js']) {
      const context=await browser.newContext({javaScriptEnabled:blocked!=='no-js',viewport:{width:390,height:1000},reducedMotion:'no-preference'});
      await context.route('**/*',route=>blocked==='script'&&route.request().url().includes('/assets/text-motion.js')?route.abort():localOnly(route));
      if (blocked==='observer') await context.addInitScript(()=>{window.IntersectionObserver=undefined;});
      if (blocked==='animate') await context.addInitScript(()=>{Element.prototype.animate=undefined;});
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(BASE+'index.html');await settle(page);
      assert.equal(await page.locator('html').getAttribute('data-text-motion'),null);
      assert.ok(await page.locator('.hero-title').isVisible());
      assert.ok(await page.locator('.hero-title>span').evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).opacity==='1'&&getComputedStyle(node).transform==='none')));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.deepEqual(errors,[],blocked);await context.close();
    }
    console.log('Text motion browser checks passed: intact Bengali heading, one-shot scroll entrances, bounded full/lite effects, preference changes, settled text, unchanged tracker, reduced motion, no-JS and missing APIs/scripts.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
