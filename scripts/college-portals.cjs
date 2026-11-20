// User-reported availability, not a live uptime monitor. Never embed portal credentials.
const {icon} = require('./site-shell.cjs');
function renderCollegePortals() {
  return `<!-- COLLEGE PORTALS:START -->
<section class="college-portals" id="college-online" aria-labelledby="college-online-title">
  <div class="wrap">
    <div class="section-heading"><div><p class="eyebrow">কলেজের অনলাইন সেবা</p><h2 class="title" id="college-online-title">দরকারি পোর্টাল, <span class="grad">সঠিক ঠিকানায়</span></h2><p class="lead">মূল ওয়েবসাইটের অবস্থা ও বিকল্প শিক্ষার্থী পোর্টালের লিংক।</p></div></div>
    <div class="college-portal-grid">
      <article class="college-portal college-portal--closed">
        <div class="college-portal-top">${icon('globe')}<span class="portal-status portal-status--closed">এখন বন্ধ</span></div>
        <h3>কলেজের মূল ওয়েবসাইট</h3><p class="portal-domain" lang="en">chugc.edu.bd</p>
        <p>মূল সাইটে আপাতত প্রবেশ করা যাচ্ছে না। প্রয়োজনীয় অনলাইন সেবার জন্য পাশের শিক্ষার্থী পোর্টালটি ব্যবহার করো।</p>
        <a class="portal-original-link" href="https://chugc.edu.bd/" target="_blank" rel="noopener noreferrer">মূল ঠিকানা দেখে নাও ${icon('external')}</a>
      </article>
      <article class="college-portal college-portal--student">
        <div class="college-portal-top">${icon('graduation')}<span class="portal-status">বিকল্প পোর্টাল</span></div>
        <h3>eShiksa শিক্ষার্থী পোর্টাল</h3><p class="portal-domain" lang="en">chugc.eshiksaems.com</p>
        <p>কলেজের দেওয়া ইউজারনেম ও পাসওয়ার্ড কেবল ওই পোর্টালেই ব্যবহার করো। এই স্টাডি সাইটে পাসওয়ার্ড নেওয়া বা সংরক্ষণ করা হয় না।</p>
        <a class="btn btn-p" href="https://chugc.eshiksaems.com/" target="_blank" rel="noopener noreferrer">পোর্টাল খুলে লগইন করো ${icon('external')}</a>
        <small>আলাদা ট্যাবে খুলবে · ইন্টারনেট লাগবে</small>
      </article>
    </div>
    <p class="portal-availability-note">মূল সাইটের “এখন বন্ধ” তথ্যটি ব্যবহারকারীর জানানো অবস্থা; এটি স্বয়ংক্রিয় বা সার্বক্ষণিক uptime পরীক্ষা নয়। পোর্টালের অ্যাকাউন্ট ও তথ্য ওই সেবার নিয়ন্ত্রণাধীন।</p>
  </div>
</section>
<!-- COLLEGE PORTALS:END -->`;
}
module.exports = {renderCollegePortals};
