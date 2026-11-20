/* In-page practice: no network, account, cookies or stored answers. */
(function () {
  'use strict';
  const root = document.querySelector('#bangla-mcq');
  if (!root) return;
  const $ = id => root.querySelector('#' + id);
  const bank = window.HSC_BANGLA_MCQ_BANK, core = window.HSC_MCQ;
  try { if (!core) return; core.validateBank(bank); } catch (_) { return; }
  const bn = n => n.toLocaleString('bn-BD');
  const chapterNames = new Map(bank.chapters.map(c => [c.id, c.title]));
  let session = null, current = 0, active = false, timer = null, lastResult = null, lastPool = [], lastMinutes = 0, lastCount = 10, confirmation = null, warned = false;
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function focus(id) { const el = $(id); el.scrollIntoView({behavior:'instant', block:'start'}); el.focus({preventScroll:true}); }
  function say(text) { $('mcq-live').textContent = text; }
  function stage(id) {
    for (const name of ['mcq-setup', 'mcq-running', 'mcq-result']) $(name).hidden = name !== id;
    $('mcq-confirm').hidden = true; confirmation = null;
  }
  function stopTimer() { if (timer !== null) { clearInterval(timer); timer = null; } }
  function selectedPool() { return core.filterQuestions(bank, $('mcq-chapter').value, $('mcq-origin').value); }
  function updateAvailability() {
    const pool = selectedPool(), count = Math.min(Number($('mcq-count').value), pool.length);
    $('mcq-availability').textContent = 'এই বাছাইয়ে ' + bn(pool.length) + 'টি প্রশ্ন আছে; টেস্টে ' + bn(count) + 'টি আসবে।' + (pool.length < Number($('mcq-count').value) ? ' প্রশ্ন কম থাকায় সবগুলো নেওয়া হবে।' : '');
    $('mcq-start').disabled = !pool.length;
  }
  function showSetup() {
    active = false; stopTimer(); session = null;
    stage('mcq-setup'); updateAvailability(); focus('mcq-setup-title');
    $('mcq-open').setAttribute('aria-expanded', 'true');
  }
  function updateProgress() {
    const done = session.answers.filter(a => a !== null).length;
    $('mcq-answered').textContent = bn(session.questions.length) + 'টির মধ্যে ' + bn(done) + 'টির উত্তর দেওয়া হয়েছে';
    $('mcq-progress').max = session.questions.length; $('mcq-progress').value = done;
    [...$('mcq-palette').children].forEach((button, index) => {
      const answered = session.answers[index] !== null;
      button.textContent = bn(index + 1) + (answered ? ' ✓' : '');
      button.setAttribute('aria-label', 'প্রশ্ন ' + bn(index + 1) + ', ' + (answered ? 'উত্তর দেওয়া' : 'উত্তর বাকি'));
      button.toggleAttribute('data-answered', answered);
      if (index === current) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
  }
  function renderQuestion(moveFocus = true) {
    const q = session.questions[current];
    $('mcq-question-index').textContent = 'প্রশ্ন ' + bn(current + 1) + ' / ' + bn(session.questions.length);
    $('mcq-prompt').textContent = q.prompt;
    $('mcq-question-meta').textContent = chapterNames.get(q.chapterId) + ' · ' + core.originLabel(q.origin) + ' · ' + q.id;
    const options = $('mcq-options'); options.replaceChildren();
    q.options.forEach((text, index) => {
      const label = node('label', undefined, 'mcq-option'), input = document.createElement('input');
      input.type = 'radio'; input.name = 'mcq-answer'; input.value = String(index); input.checked = session.answers[current] === index;
      const copy = node('span'); copy.append(node('b', core.letters[index] + '.'), document.createTextNode(text));
      label.append(input, copy); options.append(label);
      input.addEventListener('change', () => {
        if (!active || expire()) return;
        session.answers[current] = index; updateProgress(); $('mcq-clear').disabled = false;
        say('প্রশ্ন ' + bn(current + 1) + ' এর উত্তর বাছাই করা হয়েছে।');
      });
    });
    $('mcq-prev').disabled = current === 0;
    $('mcq-next').disabled = current === session.questions.length - 1;
    $('mcq-clear').disabled = session.answers[current] === null;
    updateProgress();
    if (moveFocus) focus('mcq-question-index');
  }
  function start(pool, count, minutes) {
    stopTimer();
    session = core.createSession(pool, count, minutes); active = true; current = 0; warned = false;
    lastPool = pool.slice(); lastCount = count; lastMinutes = minutes;
    stage('mcq-running'); $('mcq-palette').replaceChildren();
    session.questions.forEach((q, index) => {
      const button = node('button'); button.type = 'button';
      button.addEventListener('click', () => { if (!active || expire()) return; current = index; renderQuestion(); });
      $('mcq-palette').append(button);
    });
    renderQuestion(); tick();
    if (active && session.deadline !== null) timer = setInterval(tick, 1000);
    say(bn(session.questions.length) + 'টি প্রশ্নের টেস্ট শুরু হয়েছে।');
  }
  function expire() {
    if (active && core.remainingSeconds(session) === 0) { finish(true); return true; }
    return false;
  }
  function tick() {
    if (!active) return;
    const remaining = core.remainingSeconds(session), clock = $('mcq-clock');
    if (remaining === null) { clock.textContent = 'সময় নির্ধারিত নয়'; clock.parentElement.removeAttribute('data-urgent'); return; }
    clock.textContent = bn(Math.floor(remaining / 60)).padStart(2,'০') + ':' + bn(remaining % 60).padStart(2,'০');
    clock.parentElement.toggleAttribute('data-urgent', remaining <= 60);
    if (remaining === 0) { finish(true); return; }
    if (remaining <= 60 && !warned) { warned = true; say('সময় শেষ হতে এক মিনিটের কম বাকি।'); }
  }
  function confirmAction(action) {
    if (!active || expire()) return;
    confirmation = action;
    const missing = session.answers.filter(a => a === null).length;
    $('mcq-confirm-title').textContent = action === 'submit' ? 'টেস্ট জমা দিতে চাও?' : 'চলমান টেস্ট বাদ দিতে চাও?';
    $('mcq-confirm-text').textContent = action === 'submit' ? (missing ? bn(missing) + 'টি প্রশ্নের উত্তর বাকি। এগুলো ০ নম্বর হিসেবে গণনা হবে।' : 'সব প্রশ্নের উত্তর দেওয়া হয়েছে। জমা দিলে উত্তর আর বদলানো যাবে না।') : 'এই টেস্টের উত্তর মুছে যাবে। সেটআপ থেকে নতুন টেস্ট শুরু করতে পারবে।';
    $('mcq-confirm-yes').textContent = action === 'submit' ? 'জমা দিয়ে ফল দেখো' : 'হ্যাঁ, টেস্ট বাদ দাও';
    $('mcq-confirm').hidden = false; focus('mcq-confirm-title');
  }
  function renderReview(result) {
    const review = $('mcq-review'); review.replaceChildren();
    const statusNames = {correct:'✓ সঠিক', wrong:'✕ ভুল', skipped:'— উত্তর দেওয়া হয়নি'};
    result.details.forEach((d, index) => {
      const q = d.question, detail = node('details', undefined, 'mcq-review-item'); detail.dataset.status = d.status; detail.dataset.questionId = q.id;
      const summary = node('summary'); summary.append(node('strong', statusNames[d.status]), document.createTextNode(bn(index+1) + '. ' + q.prompt));
      const body = node('div', undefined, 'mcq-review-body');
      body.append(node('p', 'তোমার উত্তর: ' + (d.selected === null ? 'উত্তর দেওয়া হয়নি' : core.letters[d.selected] + '. ' + q.options[d.selected])));
      body.append(node('p', 'সঠিক উত্তর: ' + core.letters[q.answer] + '. ' + q.options[q.answer], 'mcq-answer-correct'));
      const options = node('ol', undefined, 'mcq-review-options');
      q.options.forEach((o,i) => options.append(node('li', core.letters[i] + '. ' + o)));
      body.append(options, node('p', q.explanation), node('p', core.originLabel(q.origin) + ' · ' + q.id + ' · ' + core.referenceText(bank,q), 'mcq-question-meta'));
      const report = node('a', 'এই প্রশ্নে সমস্যা জানাও ↗'); report.href = 'feedback.html'; report.className = 'mcq-text-button';
      body.append(report); detail.append(summary,body); review.append(detail);
    });
  }
  function finish(timedOut) {
    if (!active) return;
    active = false; stopTimer();
    lastResult = core.grade(session); stage('mcq-result');
    $('mcq-score').textContent = bn(lastResult.correct) + ' / ' + bn(lastResult.total);
    $('mcq-percent').textContent = bn(lastResult.percent) + '% সঠিক';
    $('mcq-correct').textContent = bn(lastResult.correct); $('mcq-wrong').textContent = bn(lastResult.wrong); $('mcq-skipped').textContent = bn(lastResult.skipped);
    $('mcq-result-reason').textContent = timedOut ? 'সময় শেষ হয়েছে। তোমার বাছাই করা উত্তরগুলো দিয়ে ফল হিসাব করা হয়েছে।' : 'টেস্ট জমা হয়েছে। এবার ভুলগুলো বুঝে আবার অনুশীলন করো।';
    $('mcq-retry-wrong').disabled = lastResult.wrong + lastResult.skipped === 0;
    renderReview(lastResult); focus('mcq-result-title');
    say('টেস্ট শেষ। ' + bn(lastResult.total) + ' এর মধ্যে ' + bn(lastResult.correct) + 'টি সঠিক।');
  }
  bank.chapters.forEach(chapter => {
    const option = node('option', chapter.title); option.value = chapter.id; $('mcq-chapter').append(option);
  });
  $('mcq-open').addEventListener('click', () => {
    if (active) { focus('mcq-question-index'); return; }
    showSetup();
  });
  $('mcq-close').addEventListener('click', () => { stage(null); $('mcq-open').setAttribute('aria-expanded','false'); $('mcq-open').focus(); });
  for (const id of ['mcq-chapter','mcq-origin','mcq-count']) $(id).addEventListener('change', updateAvailability);
  $('mcq-config').addEventListener('submit', e => {
    e.preventDefault(); const pool = selectedPool(); if (!pool.length) return;
    start(pool, Number($('mcq-count').value), Number($('mcq-duration').value));
  });
  $('mcq-prev').addEventListener('click', () => { if (!active || expire() || !current) return; current--; renderQuestion(); });
  $('mcq-next').addEventListener('click', () => { if (!active || expire() || current >= session.questions.length - 1) return; current++; renderQuestion(); });
  $('mcq-clear').addEventListener('click', () => { if (!active || expire()) return; session.answers[current] = null; renderQuestion(false); $('mcq-options').querySelector('input').focus(); say('এই প্রশ্নের উত্তর মুছে দেওয়া হয়েছে।'); });
  $('mcq-submit').addEventListener('click', () => confirmAction('submit'));
  $('mcq-exit').addEventListener('click', () => confirmAction('exit'));
  $('mcq-confirm-no').addEventListener('click', () => { $('mcq-confirm').hidden = true; confirmation = null; focus('mcq-question-index'); });
  $('mcq-confirm-yes').addEventListener('click', () => { if (!active || expire()) return; if (confirmation === 'submit') finish(false); else if (confirmation === 'exit') showSetup(); });
  $('mcq-retry').addEventListener('click', () => start(lastPool, lastCount, lastMinutes));
  $('mcq-retry-wrong').addEventListener('click', () => {
    if (!lastResult) return;
    // Use canonical questions: re-shuffling an earlier session must not change its answer key.
    const ids = new Set(lastResult.details.filter(d => d.status !== 'correct').map(d => d.question.id));
    const pool = bank.questions.filter(q => ids.has(q.id));
    if (pool.length) start(pool, pool.length, lastMinutes);
  });
  $('mcq-new').addEventListener('click', showSetup);
  $('mcq-csv').addEventListener('click', () => {
    const blob = new Blob([core.csv(core.sheetRows(bank))], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'hsc-2027-bangla-mcq.csv'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url),60000);
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  window.addEventListener('pagehide', stopTimer);
  window.addEventListener('pageshow', () => { if (active) { tick(); if (active && session.deadline !== null && timer === null) timer=setInterval(tick,1000); } });
  $('mcq-open').hidden = false; $('mcq-open').setAttribute('aria-expanded','false');
  // The Android WebView has no Blob-download bridge; its static reading sheet still works.
  if (!document.documentElement.classList.contains('hsc-android-app') && typeof Blob !== 'undefined' && typeof URL.createObjectURL === 'function') $('mcq-csv').hidden = false;
  $('mcq-fallback').hidden = true;
  updateAvailability();
})();
