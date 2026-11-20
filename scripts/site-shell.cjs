// Shared, static site chrome. Icons use a local SVG sprite, not an icon font or CDN.
const ICONS = {
  book: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z"/><path d="M12 6v14M6 9h3M6 12h3M15 9h3M15 12h3"/>',
  flask: '<path d="M9 3h6M10 3v7L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M7 15h10"/><path d="m10 17 1 1m3-1h.01"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12c5 4 13 4 18 0M10 14h4"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  external: '<path d="M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  checklist: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m7 8 1 1 2-2m-3 8 1 1 2-2m3-6h4m-4 7h4"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3Z"/>',
  users: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3"/>',
  building: '<path d="m3 9 9-6 9 6M3 21h18M5 10v8m5-8v8m4-8v8m5-8v8M2 9h20"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h2m4 0h2m2 0h1"/>',
  message: '<path d="M21 11a8 8 0 0 1-8 8H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M7 8h10M7 12h7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  moon: '<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
  chart: '<path d="M4 3v17h17M8 15l4-5 4 2 5-7"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  atom: '<ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1"/>',
  leaf: '<path d="M20 3C9 2 2 8 5 16c8 5 16-2 15-13ZM3 21l12-12"/>',
  calculator: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h1m3 0h1m3 0h.01M8 15h1m3 0h1m3 0h.01M8 19h1m3 0h4"/>',
  network: '<rect x="9" y="9" width="6" height="6" rx="1"/><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="17" y="2" width="5" height="5" rx="1"/><rect x="2" y="17" width="5" height="5" rx="1"/><rect x="17" y="17" width="5" height="5" rx="1"/><path d="m7 7 2 2m6 0 2-2M7 17l2-2m6 0 2 2"/>',
  graduation: '<path d="m2 9 10-6 10 6-10 6Z"/><path d="M6 12v5c4 3 8 3 12 0v-5M22 9v8"/>',
  sparkles: '<path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2Z"/><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  resume: '<path d="m8 4 12 8-12 8Z"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
};
const EMOJI = {'🏫':'building','🔬':'flask','📖':'book','💼':'briefcase','📚':'book','🌍':'globe','🗺️':'globe','💰':'chart','🌅':'sun','🌙':'moon','📘':'book','💻':'network','⚛️':'atom','🧪':'flask','📐':'calculator','🧬':'leaf','👥':'users','🏛️':'building','📈':'chart','📜':'book','🧮':'calculator','🚀':'chart','🏦':'building','📣':'message','🎥':'play','✅':'checklist','🕐':'clock','👩‍🏫':'users','🗓️':'calendar','📋':'calendar','🎓':'graduation','💬':'message','📱':'download','🔍':'search','⏳':'clock'};
function icon(name, className = '') {
  const id = EMOJI[name] || name;
  if (!ICONS[id]) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="icon${className ? ' ' + className : ''}" aria-hidden="true" focusable="false"><use href="assets/icons.svg#${id}"></use></svg>`;
}
function iconSprite() {
  return `<svg xmlns="http://www.w3.org/2000/svg"><defs>${Object.entries(ICONS).map(([name, paths]) => `<symbol id="${name}" viewBox="0 0 24 24">${paths}</symbol>`).join('')}</defs></svg>\n`;
}
function brand() {
  return '<a class="brand" href="index.html" aria-label="চুনারুঘাট সরকারি কলেজ HSC 2027 — হোম"><img class="brand-logo" src="assets/study-logo.png" width="44" height="44" alt=""><span class="brand-copy"><span class="brand-name">চুনারুঘাট সরকারি কলেজ</span><span class="brand-batch" lang="en">HSC <em>2027</em><span class="brand-separator">/</span> STUDY PORTAL</span></span></a>';
}
function renderHeader(id) {
  const {subjectGroups} = require('./site-graph.cjs');
  let active = id;
  for (const group of ['science','arts','commerce']) if (subjectGroups[group].includes(id)) active = group;
  const links = [['index','হোম'], ['network','পেজ নেটওয়ার্ক'], ['science','বিজ্ঞান'], ['arts','মানবিক'], ['commerce','ব্যবসায়'], ['classes','অনলাইন ক্লাস'], ['tracker','ট্র্যাকার'], ['routine','রুটিন'], ['android-app','অ্যাপ ডাউনলোড']];
  return `<nav>
  <div class="site-topbar"><div class="wrap"><span>${icon('pin')} চুনারুঘাট, হবিগঞ্জ</span><span class="topbar-note">শিক্ষার্থীদের উদ্যোগে · HSC ব্যাচ ২০২৭</span><a href="college-info.html">কলেজ পরিচিতি ${icon('external')}</a></div></div>
  <div class="wrap nav-in">
    ${brand()}
    <div class="links" id="navLinks">${links.map(([target,label]) => `<a${target === 'network' ? ' class="network-nav-link"' : target === active ? ` class="active" aria-current="${target === id ? 'page' : 'location'}"` : ''} href="${target === 'network' ? 'index.html#structure' : target + '.html'}">${label}</a>`).join('')}<a href="#contact">যোগাযোগ</a></div>
    <div class="nav-controls"><button class="theme-toggle" type="button" aria-label="ডার্ক মোড" aria-pressed="false" title="ডার্ক মোড চালু করুন" hidden>${icon('moon','theme-moon')}${icon('sun','theme-sun')}</button><button class="burger" id="burger" aria-label="মেনু" aria-controls="navLinks" aria-expanded="false" hidden>${icon('menu','menu-open')}${icon('close','menu-close')}</button></div>
  </div>
</nav>`;
}
function renderFooter() {
  return `<footer>
  <h2 class="sr-only">সাইটের লিংক ও যোগাযোগ</h2>
  <div class="wrap">
    <div class="footer-heading"><span class="footer-kicker" lang="en">LEARN WITH PURPOSE.</span><a href="index.html#structure">পড়ার সব পেজ ${icon('arrow')}</a></div>
    <div class="foot">
      <div class="footer-about">
        ${brand()}
        <p>চুনারুঘাট সরকারি কলেজের HSC ব্যাচ ২০২৭-এর শিক্ষার্থীদের জন্য একটি সহজ ও সুসংগঠিত স্টাডি প্ল্যাটফর্ম।</p>
        <span class="student-initiative">শিক্ষার্থীদের উদ্যোগ · কলেজের আনুষ্ঠানিক ওয়েবসাইট নয়</span>
      </div>
      <div><h3>একাডেমিক বিভাগ</h3><a href="science.html">বিজ্ঞান বিভাগ</a><a href="arts.html">মানবিক বিভাগ</a><a href="commerce.html">ব্যবসায় শিক্ষা</a><a href="teachers.html">শিক্ষক পরিচিতি</a></div>
      <div><h3>পড়াশোনা ও সহায়তা</h3><a href="classes.html">অনলাইন ক্লাস</a><a href="tracker.html">অধ্যায় ট্র্যাকার</a><a href="routine.html">স্টাডি রুটিন</a><a href="feedback.html">মতামত ও সমস্যা জানাও</a><a href="android-app.html">অ্যাপ ডাউনলোড</a></div>
      <div class="contact-info" id="contact">
        <h3>যোগাযোগ</h3>
        <p>WhatsApp: <span dir="ltr">+880 1974-500165</span></p>
        <a class="contact-whatsapp" href="https://wa.me/8801974500165" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp-এ Mahadin-কে মেসেজ পাঠাও">WhatsApp-এ মেসেজ ${icon('external')}</a>
        <p>ইউজারনেম: <span dir="ltr">@Mahadin321</span></p>
      </div>
    </div>
    <div class="copy"><span>© <span id="year"></span> HSC 2027 · চুনারুঘাট সরকারি কলেজ</span><span>নিজের গতিতে শিখুন, একসঙ্গে এগিয়ে চলুন।</span></div>
    <div class="temporary-credit footer-credits" id="temporary-credit" role="group" aria-label="Site credits" lang="en">
      <p class="credit-person"><span class="credit-role">Requested by</span><strong class="credit-name">Mahadin</strong><span class="credit-detail">Concept &amp; information</span></p>
      <p class="credit-person credit-person--owner"><span class="credit-role">Built &amp; managed by</span><strong class="credit-name">Morshed</strong><span class="credit-detail">Site owner</span></p>
    </div>
    <script src="assets/credit.js?v=20261119" defer></script>
    <p class="ict-inspiration" id="ict-inspiration">ICT চতুর্থ অধ্যায় থেকে অনুপ্রাণিত হয়ে বানানো</p>
  </div>
</footer>`;
}
function renderGalaxyBackdrop() {
  return `<!-- GALAXY SKY:START -->
<div class="galaxy-sky" aria-hidden="true">
  <span class="galaxy-nebula galaxy-nebula--violet galaxy-animated"></span>
  <span class="galaxy-nebula galaxy-nebula--cyan galaxy-animated"></span>
  <span class="galaxy-stars galaxy-animated"></span>
  <div class="galaxy-field" data-galaxy-field="ambient"></div>
</div>
<!-- GALAXY SKY:END -->`;
}
function renderGalaxyControl() {
  return `<!-- GALAXY CONTROL:START -->
<div class="galaxy-control" role="group" aria-label="অ্যানিমেশন সেটিংস" hidden>
  <div class="galaxy-control-main"><button class="galaxy-toggle" type="button" aria-label="হালকা অ্যানিমেশন" aria-pressed="false" aria-describedby="galaxy-help" title="কম ইফেক্টে হালকা অ্যানিমেশন চালু করুন" hidden>${icon('leaf')}<span>হালকা অ্যানিমেশন</span><span class="galaxy-switch" aria-hidden="true"></span></button><span class="galaxy-mode-status" role="status" aria-live="polite">পূর্ণ মোড চলছে</span></div>
  <p id="galaxy-help">পুরোনো ডিভাইসে কম ইফেক্টে অ্যানিমেশন চালু রাখুন।</p>
</div>
<!-- GALAXY CONTROL:END -->`;
}
function withShell(id, html) {
  let next = html.replace(/<nav>[\s\S]*?<\/nav>/, renderHeader(id)).replace(/<footer>[\s\S]*?<\/footer>/, renderFooter());
  next = next.replace(/\n?<!-- GALAXY CONTROL:START -->[\s\S]*?<!-- GALAXY CONTROL:END -->\n?/g, '\n');
  next = next.replace(/<body(?:\s+data-page="[^"]+")?>/, `<body data-page="${id}">`);
  next = next.replace(/\n?<a class="skip-link"[^>]*>[^<]*<\/a>/g, '');
  next = next.replace(/\n?<!-- GALAXY SKY:START -->[\s\S]*?<!-- GALAXY SKY:END -->/g, '');
  next = next.replace(/(<body[^>]*>)/, '$1\n<a class="skip-link" href="#main-content">মূল বিষয়বস্তুতে যান</a>\n' + renderGalaxyBackdrop());
  if (!next.includes('id="main-content"')) {
    if (/<main\b/.test(next)) next = next.replace(/<main\b([^>]*)>/, '<main$1 id="main-content" tabindex="-1">');
    else next = next.replace(/(<\/nav>\s*)([\s\S]*?)(?=<footer>)/, '$1<main id="main-content" tabindex="-1">\n$2</main>\n');
  }
  next = next.replace(/^.*(?:fonts\.googleapis\.com|fonts\.gstatic\.com).*\n/gm, '');
  next = next.replace(/^.*assets\/(?:heading-motion|light-motion|motion|home-motion|subject-scene)\.(?:css|js)[^\n]*\n/gm, '');
  next = next.replace(/<div class="blob b[123]"><\/div>/g, '');
  next = next.replace(/ data-scene="[^"]+"/g, '');
  next = next.replace(/(assets\/style\.css)\?v=[^"<>]+/g, '$1?v=3');
  next = next.replace(/(assets\/theme\.(?:css|js))\?v=[^"<>]+/g, '$1?v=2');
  next = next.replace(/(assets\/(?:college-details|teachers|student-group|android-download|feedback)\.css)(?:\?v=[^"<>]+)?/g, '$1?v=3');
  next = next.replace(/(assets\/app\.js)\?v=[^"<>]+/g, '$1?v=20261119-accessibility');
  next = next.replace(/\n?<script src="assets\/interface\.js[^"<>]*"><\/script>/g, '');
  next = next.replace(/(<script src="assets\/app\.js[^"<>]*"><\/script>)/, '$1\n<script src="assets/interface.js?v=2"></script>');
  next = next.replace(/<meta name="theme-color" content="[^"]+">/, '<meta name="theme-color" content="#f8f9fb">');
  next = next.replace(/\n?<link rel="stylesheet" href="assets\/galaxy\.css[^"<>]*">/g, '');
  next = next.replace(/(<link rel="stylesheet" href="assets\/theme\.css[^"<>]*">)/, '$1\n<link rel="stylesheet" href="assets/galaxy.css?v=4">');
  next = next.replace(/\n?<link rel="stylesheet" href="assets\/numerals\.css[^"<>]*">/g, '');
  next = next.replace(/(<link rel="stylesheet" href="assets\/galaxy\.css[^"<>]*">)/, '$1\n<link rel="stylesheet" href="assets/numerals.css?v=1">');
  next = next.replace(/\n?<link rel="stylesheet" href="assets\/editorial\.css[^"<>]*">/g, '');
  next = next.replace(/(<link rel="stylesheet" href="assets\/numerals\.css[^"<>]*">)/, '$1\n<link rel="stylesheet" href="assets/editorial.css?v=1">');
  next = next.replace(/\n?<script src="assets\/galaxy\.js[^"<>]*"><\/script>/g, '');
  next = next.replace(/(<script src="assets\/interface\.js[^"<>]*"><\/script>)/, '$1\n<script src="assets/galaxy.js?v=3"></script>');
  next = next.replace(/\n?<script src="assets\/text-motion\.js[^"<>]*"><\/script>/g, '');
  next = next.replace(/(<script src="assets\/galaxy\.js[^"<>]*"><\/script>)/, '$1\n<script src="assets/text-motion.js?v=2"></script>');
  // Keyboard users must be able to pan wide source images and information tables.
  next = next.replace(/<div class="(table-wrap|booklet-scroll(?: wide)?)"([^>]*)>/g, (all, className, attrs) => attrs.includes('tabindex=') ? all : `<div class="${className}"${attrs} tabindex="0" role="region" aria-label="${className === 'table-wrap' ? 'তথ্য টেবিল' : 'মূল ছবিটি'}; ডানে-বাঁয়ে সরান">`);
  next = next.replace(/<div class="ic">([^<]+)<\/div>/g, (all, value) => EMOJI[value] ? `<div class="ic">${icon(value)}</div>` : all);
  for (const [emoji, name] of Object.entries(EMOJI).sort((a,b) => b[0].length-a[0].length)) {
    next = next.replace(new RegExp(`(<h1[^>]*>)${emoji}\\s*`, 'g'), `$1${icon(name,'heading-icon')}`);
    next = next.replace(new RegExp(`(<h[23][^>]*>)${emoji}\\s*`, 'g'), `$1${icon(name,'inline-icon')}`);
    next = next.replace(new RegExp(`(<div class="tip[^"]*"[^>]*>)${emoji}\\s*`, 'g'), `$1${icon(name,'inline-icon')} `);
  }
  // Keep motion settings in normal page flow, centred beneath the introduction, never in the menu.
  if (/<header\b/.test(next)) next = next.replace(/(<header\b[^>]*>[\s\S]*?<\/header>)\s*/, `$1\n${renderGalaxyControl()}\n`);
  else next = next.replace(/(<div class="crumbs">[\s\S]*?<\/div>)\s*/, `$1\n${renderGalaxyControl()}\n`);
  return next;
}
module.exports = {ICONS, EMOJI, icon, iconSprite, brand, renderHeader, renderFooter, renderGalaxyBackdrop, renderGalaxyControl, withShell};

// The shared header/footer are applied by site-navigation.cjs; this CLI owns the icon asset.
if (require.main === module) {
  const fs = require('node:fs');
  const path = require('node:path');
  const file = path.resolve(__dirname, '../site/assets/icons.svg');
  const sprite = iconSprite();
  const stale = !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== sprite;
  if (process.argv.includes('--check')) {
    if (stale) { console.error('Icon sprite is stale. Run node scripts/site-shell.cjs'); process.exitCode = 1; }
    else console.log('Local icon sprite is up to date');
  } else if (stale) { fs.writeFileSync(file, sprite); console.log('Local icon sprite updated'); }
}
