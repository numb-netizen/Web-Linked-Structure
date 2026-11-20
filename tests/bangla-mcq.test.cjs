const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../site/assets/mcq-core.js');
const bank = require('../data/bangla-mcq.json');
const {generate, outputs} = require('../scripts/bangla-mcq.cjs');
const ROOT = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT,name),'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

test('Bangla bank has 130 source-traceable questions across the 26 current chapters', () => {
  assert.equal(core.validateBank(bank), true);
  assert.equal(bank.chapters.length,26); assert.equal(bank.questions.length,130); assert.equal(bank.sources.length,6);
  assert.equal(bank.questions.filter(q=>q.origin==='pdf').length,104);
  assert.equal(bank.questions.filter(q=>q.origin==='original').length,26);
  assert.equal(bank.sources.reduce((n,s)=>n+s.pages,0),106);
  const html=read('site/bangla.html');
  for(const c of bank.chapters) {
    const questions=bank.questions.filter(q=>q.chapterId===c.id);
    assert.equal(questions.length,5,c.id);
    assert.equal(questions.filter(q=>q.origin==='original').length,1,c.id);
    assert.ok(html.includes(`data-subject="bangla" data-chapter="${c.trackerChapter}"`),c.id);
  }
  for(const s of bank.sources) assert.ok(bank.questions.some(q=>q.reference.sourceId===s.id));
  assert.equal(bank.chapters.find(c=>c.id==='siraj').kind,'নাটক');
  assert.equal(bank.chapters.find(c=>c.id==='lalsalu').kind,'উপন্যাস');
  for(const page of [html,read('site/tracker.html')]) {
    assert.match(page, /data-chapter="11"[^>]*>[\s\S]*?লালসালু<\/span> <span class="badge"[^>]*>উপন্যাস<\/span>/);
    assert.match(page, /data-chapter="36"[^>]*>[\s\S]*?সিরাজউদ্দৌলা<\/span> <span class="badge"[^>]*>নাটক<\/span>/);
  }
});

test('invalid answer keys, references, duplicate options and unsupported versions fail closed', () => {
  for(const mutate of [b=>b.questions[0].answer=4,b=>b.questions[0].answer='0',b=>b.questions[0].options[1]=b.questions[0].options[0],b=>b.questions[1].id=b.questions[0].id,b=>b.questions[0].reference.scanPage=999,b=>b.questions[0].reference.pdfPage=0,b=>b.questions[0].chapterId='missing',b=>b.questions[0].origin='board',b=>b.schemaVersion=2]) {
    const candidate=clone(bank);mutate(candidate);assert.throws(()=>core.validateBank(candidate),/Invalid MCQ bank/);
  }
});

test('chapter and origin filters return only actual available questions', () => {
  assert.equal(core.filterQuestions(bank).length,130);
  assert.equal(core.filterQuestions(bank,'aparichita').length,5);
  assert.equal(core.filterQuestions(bank,'aparichita','pdf').length,4);
  assert.equal(core.filterQuestions(bank,'aparichita','original').length,1);
  assert.equal(core.filterQuestions(bank,'missing').length,0);
});

test('question and option shuffling preserve each correct answer without mutating the bank', () => {
  const before=JSON.stringify(bank);
  const random=()=>0.2;
  const session=core.createSession(bank.questions,30,10,1000,random);
  assert.equal(session.questions.length,30); assert.equal(new Set(session.questions.map(q=>q.id)).size,30);
  assert.notDeepEqual(session.questions.map(q=>q.id),bank.questions.slice(0,30).map(q=>q.id));
  for(const q of session.questions) {
    const original=bank.questions.find(p=>p.id===q.id);
    assert.deepEqual(q.options.slice().sort(),original.options.slice().sort());
    assert.equal(q.options[q.answer],original.options[original.answer]);
  }
  session.answers=session.questions.map(q=>q.answer);
  assert.equal(core.grade(session).correct,30);
  assert.equal(JSON.stringify(bank),before);
});

test('small pools and requested counts never create duplicates or overrun available questions', () => {
  const pool=core.filterQuestions(bank,'aparichita','original');
  assert.equal(core.createSession(pool,30).questions.length,1);
  assert.equal(core.createSession(bank.questions,1000).questions.length,30);
  for(const args of [[[],5],[bank.questions,0],[bank.questions,1,-1],[bank.questions,1,61]]) assert.throws(()=>core.createSession(...args),/Invalid MCQ session/);
});

test('grading separates correct, wrong and blank without negative marks or coercion', () => {
  const session=core.createSession(bank.questions,5,0,1000,()=>0.4);
  session.answers[0]=session.questions[0].answer;
  session.answers[1]=(session.questions[1].answer+1)%4;
  session.answers[2]=null; session.answers[3]=undefined; session.answers[4]='0';
  const result=core.grade(session);
  assert.equal(result.correct,1); assert.equal(result.wrong,1); assert.equal(result.skipped,3); assert.equal(result.percent,20);
  session.answers[0]=null; assert.equal(core.grade(session).correct,0);
  session.answers[0]=session.questions[0].answer; assert.equal(core.grade(session).correct,1);
});

test('timers use wall-clock deadlines and distinguish unlimited sessions', () => {
  const timed=core.createSession(bank.questions,5,5,1000);
  assert.equal(timed.deadline,301000);
  assert.equal(core.remainingSeconds(timed,1000),300);
  assert.equal(core.remainingSeconds(timed,300999),1);
  assert.equal(core.remainingSeconds(timed,301000),0);
  assert.equal(core.remainingSeconds(timed,999999999),0);
  assert.equal(core.remainingSeconds(core.createSession(bank.questions,5,0,1000),999999999),null);
});

test('generated browser bank, script-free sheet and spreadsheet CSV stay in sync', () => {
  assert.deepEqual(require('../site/assets/bangla-mcq-bank.js'),bank);
  assert.deepEqual(generate(true),[]);
  assert.equal(core.sheetRows(bank).length,131);
  assert.ok(core.sheetRows(bank).every(row=>row.length===15));
  const sheet=read('site/assets/bangla-mcq-sheet.html');
  assert.equal((sheet.match(/class="sheet-question"/g)||[]).length,130);
  assert.equal((sheet.match(/class="sheet-answer"/g)||[]).length,130);
  assert.doesNotMatch(sheet,/<script\b/);
  assert.match(sheet,/\.\.\/bangla\.html#bangla-mcq/);
  for(const q of bank.questions) {
    assert.ok(sheet.includes(`data-question-id="${q.id}"`));
    assert.ok(sheet.includes(q.explanation));
  }
  assert.ok(read('docs/bangla-mcq-sheet.csv').startsWith('\uFEFF"ID"'));
  const attributes=read('.gitattributes');
  assert.match(attributes,/docs\/bangla-mcq-sheet\.csv -text whitespace=[^\n]*cr-at-eol/,'preserve generated RFC 4180 records instead of normalizing their CRLFs');
});

test('the complete MCQ payload is included in the existing offline resource allowlist', () => {
  const manifest=require('../scripts/offline-manifest.cjs').makeManifest(path.join(ROOT,'site'));
  const paths=new Set(manifest.files.map(f=>f.path));
  for(const name of ['bangla.html','assets/mcq-core.js','assets/bangla-mcq-bank.js','assets/bangla-mcq.js','assets/bangla-mcq.css','assets/mcq-sheet.css','assets/bangla-mcq-sheet.html']) assert.ok(paths.has(name),name);
  assert.equal(paths.has('data/bangla-mcq.json'),false);
  assert.equal(paths.has('assets/bangla-mcq-sheet.csv'),false);
});

test('CSV is Unicode-safe, quoted and formula-safe; HTML exports escape question content', () => {
  assert.equal(core.csv([['=1+1','+SUM(A1)','@x','-1','  =1','ক, "খ"\nগ']]),'\uFEFF"\'=1+1","\'+SUM(A1)","\'@x","\'-1","\'  =1","ক, ""খ""\nগ"\r\n');
  const candidate=clone(bank);candidate.questions[0].prompt='<img src=x onerror=alert(1)>';candidate.questions[0].id='q-"<&';
  const out=outputs(candidate);
  assert.ok(out.get('site/assets/bangla-mcq-sheet.html').includes('data-question-id="q-&quot;&lt;&amp;"'));
  assert.ok(out.get('site/assets/bangla-mcq-sheet.html').includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!out.get('site/assets/bangla-mcq-bank.js').includes('<img'));
});

test('Bangla page has one in-page quiz and the exact user playlist, not a search substitute', () => {
  const html=read('site/bangla.html'), main=html.match(/<main\b[\s\S]*?<\/main>/)[0], nav=html.match(/<nav>[\s\S]*?<\/nav>/)[0];
  assert.equal((html.match(/id="bangla-mcq"/g)||[]).length,1);
  assert.ok(main.includes('id="bangla-mcq"'));assert.ok(!nav.includes('mcq-open'));
  assert.ok(main.includes(`href="${bank.playlistUrl}" target="_blank" rel="noopener noreferrer"`));
  assert.match(main,/সম্পূর্ণ বিষয়ের ওয়ান শট ক্লাস/);
  assert.ok(main.indexOf('id="bangla-mcq"')<main.indexOf('data-subject="bangla"'));
  assert.ok(main.includes('id="mcq-open" aria-controls="mcq-app" hidden'));
  for(const [asset,version] of [['mcq-core.js',1],['bangla-mcq-bank.js',1],['bangla-mcq.js',2]]) assert.equal((html.match(new RegExp(`src="assets/${asset.replace('.','\\.')}\\?v=${version}"`,'g'))||[]).length,1);
  const js=read('site/assets/bangla-mcq.js');
  assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|eval\(/);
  assert.doesNotMatch(js,/\.replaceChildren\(/, 'older Android WebViews must render and submit the quiz too');
  assert.match(js,/visibilitychange/);assert.match(js,/pagehide/);
  assert.match(main,/সার্ভারে পাঠানো বা সংরক্ষণ করা হয় না/);
});
