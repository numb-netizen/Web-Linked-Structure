/* Small, dependency-free MCQ engine; shared by the page, exports and tests. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HSC_MCQ = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const letters = ['ক', 'খ', 'গ', 'ঘ'];
  const originLabel = origin => origin === 'pdf' ? 'স্ক্যান থেকে নির্বাচিত/অভিযোজিত' : 'নতুন অনুশীলন (AI-রচিত)';
  function validateBank(bank) {
    const fail = message => { throw new Error('Invalid MCQ bank: ' + message); };
    if (!bank || bank.schemaVersion !== 1 || !Array.isArray(bank.questions) || !bank.questions.length || !Array.isArray(bank.chapters) || !Array.isArray(bank.sources)) fail('schema');
    const chapters = new Set(), sources = new Map(), ids = new Set(), prompts = new Set();
    for (const c of bank.chapters) {
      if (!c.id || !c.title || chapters.has(c.id)) fail('chapter');
      chapters.add(c.id);
    }
    for (const s of bank.sources) {
      if (!s.id || sources.has(s.id) || !Number.isInteger(s.pages) || s.pages < 1 || !Number.isInteger(s.scanStart) || !/^[a-f0-9]{64}$/.test(s.sha256)) fail('source');
      sources.set(s.id, s);
    }
    for (const q of bank.questions) {
      if (!q.id || ids.has(q.id) || !chapters.has(q.chapterId)) fail('question id/chapter');
      if (typeof q.prompt !== 'string' || !q.prompt.trim() || prompts.has(q.prompt.normalize('NFC'))) fail('prompt');
      if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some(o => typeof o !== 'string' || !o.trim()) || new Set(q.options.map(o => o.normalize('NFC').trim())).size !== 4) fail('options');
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3 || typeof q.explanation !== 'string' || !q.explanation.trim()) fail('answer/explanation');
      if (!['pdf', 'original'].includes(q.origin)) fail('origin');
      const r = q.reference, s = r && sources.get(r.sourceId);
      if (!s || !Number.isInteger(r.pdfPage) || r.pdfPage < 1 || r.pdfPage > s.pages || r.scanPage !== s.scanStart + r.pdfPage - 1 || !r.locator) fail('reference');
      ids.add(q.id); prompts.add(q.prompt.normalize('NFC'));
    }
    for (const id of chapters) if (!bank.questions.some(q => q.chapterId === id)) fail('empty chapter');
    return true;
  }
  function filterQuestions(bank, chapterId = 'all', origin = 'all') {
    return bank.questions.filter(q => (chapterId === 'all' || q.chapterId === chapterId) && (origin === 'all' || q.origin === origin));
  }
  function shuffle(items, random = Math.random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function createSession(pool, count, minutes = 0, now = Date.now(), random = Math.random) {
    if (!Array.isArray(pool) || !pool.length || !Number.isInteger(count) || count < 1 || !Number.isFinite(now) || !Number.isFinite(minutes) || minutes < 0 || minutes > 60) throw new Error('Invalid MCQ session');
    const selected = shuffle(pool, random).slice(0, Math.min(count, pool.length, 30));
    const questions = selected.map(q => {
      const order = shuffle([0, 1, 2, 3], random);
      return Object.assign({}, q, {options: order.map(index => q.options[index]), answer: order.indexOf(q.answer)});
    });
    return {questions, answers: questions.map(() => null), startedAt: now, deadline: minutes ? now + minutes * 60000 : null};
  }
  function grade(session) {
    const details = session.questions.map((question, index) => {
      const raw = session.answers[index];
      const selected = Number.isInteger(raw) && raw >= 0 && raw < 4 ? raw : null;
      return {question, selected, status: selected === null ? 'skipped' : selected === question.answer ? 'correct' : 'wrong'};
    });
    const correct = details.filter(d => d.status === 'correct').length;
    const skipped = details.filter(d => d.status === 'skipped').length;
    return {total: details.length, correct, skipped, wrong: details.length - correct - skipped, percent: details.length ? Math.round(correct / details.length * 100) : 0, details};
  }
  const remainingSeconds = (session, now = Date.now()) => session.deadline === null ? null : Math.max(0, Math.ceil((session.deadline - now) / 1000));
  function referenceText(bank, q) {
    const source = bank.sources.find(s => s.id === q.reference.sourceId);
    const r = q.reference;
    return (q.origin === 'original' ? 'বিষয়ভিত্তি: ' : 'উৎস: ') + source.label + ' · PDF পৃষ্ঠা ' + r.pdfPage.toLocaleString('bn-BD') + ' · সমন্বিত স্ক্যান পৃষ্ঠা ' + r.scanPage.toLocaleString('bn-BD') + ' · ' + r.locator;
  }
  function sheetRows(bank) {
    const chapters = new Map(bank.chapters.map(c => [c.id, c.title]));
    return [['ID', 'অধ্যায়', 'প্রশ্ন', 'ক', 'খ', 'গ', 'ঘ', 'সঠিক অপশন', 'সঠিক উত্তর', 'ব্যাখ্যা', 'ধরন', 'উৎস', 'PDF পৃষ্ঠা', 'স্ক্যান পৃষ্ঠা', 'উৎসচিহ্ন'], ...bank.questions.map(q => [q.id, chapters.get(q.chapterId), q.prompt, ...q.options, letters[q.answer], q.options[q.answer], q.explanation, originLabel(q.origin), q.reference.sourceId, String(q.reference.pdfPage), String(q.reference.scanPage), q.reference.locator])];
  }
  function csv(rows) {
    return '\uFEFF' + rows.map(row => row.map(value => {
      let text = String(value);
      // Do not let later editor-supplied content become a spreadsheet formula.
      if (/^\s*[=+@-]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }).join(',')).join('\r\n') + '\r\n';
  }
  return {letters, originLabel, validateBank, filterQuestions, shuffle, createSession, grade, remainingSeconds, referenceText, sheetRows, csv};
});
