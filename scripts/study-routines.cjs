// Generate readable, linked routines at edit time; no browser fetch or new storage keys.
const data = require('../data/study-routines.json');
const {pages} = require('./site-graph.cjs');
const {icon} = require('./site-shell.cjs');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const bn = value => String(value).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const links = ids => ids.map(id => {
  if (!pages[id] || pages[id].kind !== 'subject') throw new Error(`Unknown routine subject: ${id}`);
  return `<a href="${id}.html">${escape(pages[id].shortLabel || pages[id].label)}</a>`;
}).join('<span aria-hidden="true"> · </span>');

function renderPlan(department) {
  const {id, name} = department;
  const sessions = data.sessions.map(session => `<li><div class="study-session-heading"><span class="study-session-time">${escape(session.time)} <small>${bn(session.minutes)} মিনিট</small></span><strong>${escape(session.title)}</strong></div><p>${escape(department.methods[session.key])}</p></li>`).join('\n');
  const rows = department.week.map(day => `<tr><th scope="row">${escape(day.day)}</th><td><div class="routine-subjects">${links(day.subjects)}</div><div class="routine-common"><span>সাধারণ:</span> ${links(day.common)}</div></td><td>${escape(day.task)}</td></tr>`).join('\n');
  const total = data.sessions.reduce((sum, session) => sum + session.minutes, 0);
  return `<div class="routine-plan" id="${id}" data-routine-panel role="region" aria-labelledby="${id}-plan-title">
  <header class="routine-plan-heading"><div><p class="eyebrow">প্রস্তাবিত স্টাডি রুটিন</p><h3 id="${id}-plan-title">${icon(department.icon)} ${escape(name)}</h3><p>${escape(department.intro)}</p></div><a class="routine-department-back" href="${id}.html">বিভাগের বিষয়গুলো ${icon('arrow')}</a></header>
  <div class="study-plan-grid">
    <section class="study-daily" aria-labelledby="${id}-plan-title ${id}-daily-title"><h4 id="${id}-daily-title">প্রতিদিনের পড়ার ছক</h4><p class="study-duration">মোট ${bn(Math.floor(total / 60))} ঘণ্টা ${bn(total % 60)} মিনিট · বিরতি বাদে · সময় এগিয়ে–পিছিয়ে নাও</p><ol class="study-sessions">
${sessions}
    </ol></section>
    <section class="study-week" aria-labelledby="${id}-plan-title ${id}-week-title"><h4 id="${id}-week-title">সপ্তাহে বিষয়ের পালা</h4><p class="study-week-intro">নিচের তালিকা থেকে <strong>শুধু নিজের নিবন্ধিত বিষয়</strong> পড়বে। একই বিষয়ের দুই পত্রের অধ্যায় পালা করে নাও; শুক্রবার অসম্পূর্ণ পড়া গুছিয়ে নাও।</p><p class="study-pan-hint">ছোট স্ক্রিনে টেবিলটি ডানে–বাঁয়ে সরানো যায়।</p>
      <div class="study-week-scroll" tabindex="0" role="region" aria-label="${escape(name)}: সাপ্তাহিক রুটিন; ডানে–বাঁয়ে সরান"><table class="study-week-table"><caption>${escape(name)} — প্রস্তাবিত সাত দিনের পরিকল্পনা</caption><thead><tr><th scope="col">দিন</th><th scope="col">মূল ও সাধারণ বিষয়</th><th scope="col">লিখে অনুশীলন</th></tr></thead><tbody>
${rows}
      </tbody></table></div>
    </section>
  </div>
  <p class="routine-substitution">এই তালিকার কোনো বিষয় তোমার না থাকলে ওই সেশনে নিজের নির্বাচিত বিষয় রাখো—সবগুলো বিষয় বাধ্যতামূলক নয়। ছোট অংশ দিয়ে শুরু করো, প্রয়োজন হলে সেশনের সময় কমাও।</p>
  <div class="routine-review-link">${icon('checklist')} পড়া শেষ হলে <a href="tracker.html">অধ্যায় ট্র্যাকারে অগ্রগতি রাখো</a>; এটি শুধু তোমার ডিভাইসে থাকে।</div>
</div>`;
}
function renderStudyRoutines() {
  return `<!-- STUDY ROUTINES:START -->
<section class="study-planner" id="study-planner" aria-labelledby="planner-title"><div class="wrap">
  <div class="section-heading"><div><p class="eyebrow">তিন বিভাগ · তিনটি পরিকল্পনা</p><h2 class="title" id="planner-title">নিজের বিভাগের <span class="grad">রুটিন বেছে নাও</span></h2><p class="lead">বিষয় আলাদা, প্রস্তুতির ধরনও আলাদা। নিয়মিত পড়ার একটি সহজ শুরু হোক এখান থেকেই।</p></div><button class="btn btn-g routine-print" type="button" data-routine-print hidden>${icon('calendar')} সব রুটিন প্রিন্ট করো</button></div>
  <p class="planner-notice">${icon('info')} <span>${escape(data.notice)}</span></p>
  <div class="routine-choices" data-routine-tabs role="navigation" aria-label="বিভাগের স্টাডি রুটিন বেছে নাও">${data.departments.map(department => `<a class="routine-choice" id="routine-tab-${department.id}" href="#${department.id}" data-routine-choice="${department.id}">${icon(department.icon)}<span><strong>${escape(department.name)}</strong><small>${escape(department.focus)}</small></span>${icon('arrow')}</a>`).join('')}</div>
  <div class="routine-panels">${data.departments.map(renderPlan).join('\n')}</div>
  <div class="study-habits" role="group" aria-label="পরিকল্পনা ধরে রাখার ছোট অভ্যাস"><div><h3>ছোট লক্ষ্য রাখো</h3><p>একদিনে সব নয়; প্রতিটি সেশনে একটি ধারণা বা একটি প্রশ্ন ভালোভাবে শেষ করো।</p></div><div><h3>বিরতি রাখো</h3><p>সেশনের মাঝে বিশ্রাম, খাবার, খেলাধুলা ও পর্যাপ্ত ঘুমের সময় বাদ দেবে না।</p></div><div><h3>ভুলের খাতা দেখো</h3><p>সপ্তাহ শেষে শুধু নম্বর নয়—কোথায় আটকে যাচ্ছ, সেটাও লিখে পরের পরিকল্পনা সাজাও।</p></div></div>
  <div class="routine-official-links"><p>কলেজের ক্লাস ও পরীক্ষার সময়সূচি আলাদা:</p><a href="college-routine.html">কলেজের ক্লাস রুটিন ${icon('arrow')}</a><a href="hsc-2027-routine.html">HSC ২০২৭ সম্ভাব্য রুটিন · চূড়ান্ত নয় ${icon('arrow')}</a></div>
  <noscript><p class="planner-noscript">JavaScript বন্ধ আছে—তাই তিন বিভাগের রুটিনই নিচে/উপরে সম্পূর্ণ দেখা যাচ্ছে। বিভাগের লিংকে চাপলে সেই অংশে যাবে; ব্রাউজারের Print দিয়েও সব রুটিন পাওয়া যাবে।</p></noscript>
</div></section>
<!-- STUDY ROUTINES:END -->`;
}
function renderRoutinePreview() {
  return `<!-- ROUTINE PREVIEW:START -->
<section class="routine-preview" aria-labelledby="routine-preview-title"><div class="wrap"><div class="routine-preview-heading"><div><p class="eyebrow">পরিকল্পনা থেকে প্রতিদিনের পড়া</p><h2 id="routine-preview-title">তোমার বিভাগের স্টাডি রুটিন</h2></div><p>বিভাগ অনুযায়ী দৈনিক সেশন ও সাত দিনের বিষয়ভিত্তিক পরিকল্পনা।</p></div><div class="routine-preview-links">${data.departments.map(department => `<a href="routine.html#${department.id}">${icon(department.icon)}<span>${escape(department.name)}</span>${icon('arrow')}</a>`).join('')}</div></div></section>
<!-- ROUTINE PREVIEW:END -->`;
}
function renderDepartmentRoutine(id) {
  const department = data.departments.find(department => department.id === id);
  if (!department) throw new Error(`Unknown routine department: ${id}`);
  return `<!-- DEPARTMENT ROUTINE:START --><p class="department-routine"><a href="routine.html#${id}">${icon('clock')} ${escape(department.name)}: নিজের স্টাডি রুটিন দেখো ${icon('arrow')}</a></p><!-- DEPARTMENT ROUTINE:END -->`;
}
module.exports = {data, renderPlan, renderStudyRoutines, renderRoutinePreview, renderDepartmentRoutine};
