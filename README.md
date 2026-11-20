# HSC 2027 — চুনারুঘাট সরকারি কলেজ 🎓

চুনারুঘাট সরকারি কলেজের HSC ব্যাচ ২০২৭-এর শিক্ষার্থীদের জন্য তৈরি স্টাডি প্ল্যাটফর্ম।

**সাইটের মূল ঠিকানা:** https://chugc.cc.cd/

## ফরমাল একাডেমিক ডিজাইন

- হালকা reading canvas, নেভি–টিল রং, স্থানীয় **Hind Siliguri** বাংলা ফন্ট এবং একই SVG আইকন সেটে হোম ও ভেতরের ৩৫টি পেজ সাজানো। আগের সংরক্ষিত লাইট/ডার্ক পছন্দ বজায় থাকে; নতুন ব্যবহারকারীর ডিফল্ট লাইট।
- হোমে বিভাগ, কলেজ বিজ্ঞপ্তি, দরকারি তথ্য, বিষয়ের ডিরেক্টরি ও অনলাইন ক্লাস আলাদা সেকশনে আছে। নেটওয়ার্কের চিত্র native details দিয়ে প্রয়োজনে খোলা যায়।
- ডিরেক্টরির সার্চ বাংলা নাম ও ইংরেজি URL-নাম (যেমন `physics`) দিয়ে বর্তমান পেজেই ফিল্টার করে; সার্ভারে তথ্য পাঠায় না। JavaScript বন্ধ থাকলে সার্চ/টগল লুকিয়ে সাধারণ লিংক ও মেনু দেখায়।
- Skip link, keyboard focus, Escape-এ মেনু বন্ধ করা, responsive layout ও reduced-motion সমর্থন আছে। পুরোনো glow, marquee ও অনবরত চলমান heading/scene আর লোড হয় না; নতুন মসৃণ text entrance একবার হয়ে থেমে যায়।
- `site/assets/style.css` মূল design tokens/layout, `theme.css` ডার্ক রং ও `interface.js` মেনু/সার্চ সামলায়। `scripts/site-shell.cjs` থেকে shared header/footer ও `assets/icons.svg` তৈরি হয়; `site-navigation.cjs` সেটি HTML-এ বসায়।
- ফন্টগুলো `site/assets/fonts/`-এ WOFF2 হিসেবে আছে; লাইসেন্স `OFL.txt`-সহ offline manifest-এ অন্তর্ভুক্ত। ফন্ট/আইকনের জন্য CDN লাগে না। সাইটটি শিক্ষার্থীদের উদ্যোগ, কলেজের আনুষ্ঠানিক ওয়েবসাইট নয়।
- বাংলা **১** যাতে **৯**-এর মতো অস্পষ্ট না দেখায়, শুধু `০–৯` সংখ্যার জন্য ৩.৮ KB Noto Sans Bengali subset (`numerals.css`) আছে। অক্ষরের আগের ফন্ট ও সব আসল সংখ্যা/ট্র্যাকার key অপরিবর্তিত; নতুন ফন্টের লাইসেন্সও অফলাইনে থাকে। [সংখ্যার ফন্টের উৎস ও তৈরির বিবরণ](docs/bengali-numerals.md)।

## গ্লাসি–গ্যালাক্সি UI ও কলেজের ছবি

- হোমের পুরো ব্যাকগ্রাউন্ডে **ব্যবহারকারীর আপলোড করা কলেজ ভবনের ছবিটি** আছে; আগের আলাদা photo card নয়। ছবির সবুজ, আকাশি ও ইটের উষ্ণ রঙের সঙ্গে deep-teal overlay ও glass panel মেলানো। ফোনে ওপরের background area-তে ভবন দেখা যায়; খুব লম্বা cover crop দিয়ে ছবির সরু অংশ দেখানো হয় না। হোমসহ ৩৫-পেজের shared shell-এ হালকা campus backdrop; light/dark reading preference আগের মতো থাকে।
- **হালকা অ্যানিমেশন** বোতামটি মেনুতে নয়—সব পেজের মূল কনটেন্টে মাঝ বরাবর থাকে। চাপলে পুরো বন্ধ না হয়ে কম ইফেক্টের **হালকা মোড**, আবার চাপলে পূর্ণ মোড হয়। আগের `site:motion-paused` key-ই রাখা হয়েছে: পুরোনো `1` এখন হালকা মোড বোঝায়। পছন্দ reload, অন্য পেজ ও একই origin-এর অন্য tab-এও মেলে। OS-এর reduced motion সবসময় অগ্রাধিকার পেয়ে সব motion থামায়; tab background-এ গেলেও সাময়িক থামে।
- JavaScript বা নতুন motion script না চললে sky স্থির ও বোতাম লুকানো থাকে। `backdrop-filter` না থাকলে solid panel, reduced-transparency-তে opaque panel থাকে। কোনো WebGL/canvas, animation loop বা বাইরের runtime dependency নেই। `galaxy.css` / `galaxy.js` আলাদা progressive enhancement, পড়ার মূল design অপরিবর্তিত।
- একই ছবিটি কলেজ পরিচিতির heading-এরও background। স্থানীয় `college-campus.webp` ১০০০×৪০০, প্রায় ১৩৪ KiB; original upload `docs/images/college-campus-original.png`-এ অক্ষত। প্রত্যাখ্যাত gate photo ও সংবাদপত্রের photo credit সরানো হয়েছে। কোনো AI-তৈরি ক্যাম্পাস বা Facebook/CDN hotlink নেই; background app-এর offline manifest-এ আছে। [ছবির উৎস ও rights সংক্রান্ত নোট](docs/college-photo.md); কোনো open-content license বা কলেজের আনুষ্ঠানিক অনুমোদন দাবি করা হয়নি।
- **পূর্ণ মোডে প্রচুর র‌্যান্ডম অ্যানিমেশন:** তারার কণা, cross-star, shooting-star, floating halo, nebula, star drift ও light sweep। Desktop-এ ১১৮টি ও phone-এ ৬৩টি randomized decoration; অবস্থান, পথ, রং, মাপ, গতি ও phase প্রতি ভিজিটে বদলায়। ছবি ও layout স্থির থাকে; অধিকাংশ লেখায় একবারের entrance animation আছে, অনবরত দুলতে থাকা heading নয়। Galaxy-তে CSS animation ও লেখায় finite Web Animations API চলে, JS কোনো frame/timer loop চালায় না; বারবার মোড বা tab বদলালে নতুন node জমে না।
- **পুরোনো ডিভাইসের জন্য হালকা মোড:** desktop-এ ১৮টি, phone-এ ১০টি সহজ চলমান কণা থাকে। বাড়তি node DOM থেকে সরিয়ে দেওয়া হয়, লুকিয়ে বা memory-তে cache করে রাখা হয় না। বড় nebula/star/ribbon, shooting-star/halo, glow/shadow ও blur/backdrop-filter বাদ যায়; কলেজের আসল background ছবিটি থাকে। শুধু গতি ধীর করা নয়—চলমান node ও rendering work সত্যিই কমে। নির্দিষ্ট CPU/GPU/RAM সাশ্রয়ের শতাংশ বা সব ডিভাইসে একই ফল দাবি করা হয়নি।
- নতুন regression tests: `tests/galaxy-design.test.cjs` ও `tests/galaxy-browser.cjs` — motion preference, cross-tab sync, script/storage failure, no-JS, reduced motion/transparency, responsive layout, স্থানীয় ছবি ও keyboard controls যাচাই করে।


## নতুন হোম, তিন বিভাগের রুটিন ও কলেজ পোর্টাল

- হোমের **CAMPUS · GALAXY** badge/box ও চাওয়া slogan সরিয়ে ফরমাল, তিন লাইনের stylish বাংলা heading করা হয়েছে; আপলোড করা কলেজের background আগেরটিই আছে।
- `routine.html#science`, `#arts`, `#commerce`: আলাদা বিষয়ভিত্তিক দৈনিক সেশন ও সাত দিনের পরিকল্পনা। হোম/বিভাগ/বিষয় থেকে সরাসরি লিংক, keyboard tabs, Back/Forward, no-JS-এ সব রুটিন ও সব বিভাগের print view আছে। এগুলো প্রস্তাবিত ব্যক্তিগত রুটিন, কলেজের অফিসিয়াল সময়সূচি নয়; শুধু নিজের নিবন্ধিত বিষয় অনুসরণ করতে বলা হয়েছে।
- অধিকাংশ মূল লেখা viewport-এ এলে একবার মসৃণভাবে আসে। পূর্ণ মোডে ৬৫০ ms, হালকায় ২৬০ ms/কম দূরত্ব ও কম concurrent effect; OS reduced-motion মানে স্থির লেখা। কনটেন্ট অপেক্ষা করতে গিয়ে লুকানো থাকে না। একই in-content **হালকা অ্যানিমেশন** control কাজ করে; নতুন storage key নেই।
- পুরোনো কলেজ সাইটে **এখন বন্ধ** (ব্যবহারকারীর জানানো বর্তমান অবস্থা), পাশে **[eShiksa শিক্ষার্থী পোর্টাল](https://chugc.eshiksaems.com/)**। কোনো পাসওয়ার্ড পাবলিক কোড/URL-এ বা এই সাইটে রাখা হয় না; লগইন পোর্টালেই করতে হবে।
- রক্ষণাবেক্ষণ ও নিরাপত্তা/compatibility সীমা: [docs/site-updates.md](docs/site-updates.md)।

## ফুটারে আলাদা কৃতিত্ব ও পরিচালনার পরিচয়

- বাম পাশে **Requested by — Mahadin** / **Concept & information**, ডান পাশে **Built & managed by — Morshed** / **Site owner**। সব shared পেজে একই দুই কলাম, ফোনেও পাশাপাশি থাকে; কোনো নতুন profile link বা account যোগ হয়নি।
- `scripts/site-shell.cjs` থেকে markup তৈরি হয়। আগের credit group-এর স্বয়ংক্রিয় লুকানোর মেয়াদ এবং ICT নোটের আলাদা মেয়াদ অপরিবর্তিত; `credit.js` এখন `defer` দিয়ে দুই নোট DOM-এ আসার পর চলে। JavaScript না চললে দুই পরিচয় সাধারণ HTML হিসেবেই থাকে।

## Temp থেকে নির্বাচিত তথ্য হালনাগাদ

- `Temp`-এর `933cbab` snapshot থেকে পৌরনীতি ১ম পত্রের ১ম অধ্যায়ের **Unique e School / মিসকাত স্যার**-এর ক্লাস লিংক বিষয়পেজ ও অনলাইন ক্লাসের তালিকায় যোগ হয়েছে। ভিডিওর বোতাম checkbox-এর বাইরে, তাই ক্লাস খুললে অধ্যায়ের টিক বদলায় না।
- আটটি বিষয়ের পুরোনো “কী পরিবর্তন হয়েছে” বক্স সরেছে; অধ্যায়, tracker key ও বোর্ড/পাঠ্যবইয়ের সূত্র এবং প্রয়োজনীয় সতর্কতা রাখা আছে। বর্তমান বাংলা MCQ, সঠিক সাহিত্যধরনের লেবেল ও নতুন ডিজাইন/রুটিন আগের মতোই আছে।
- এটি পুরো repo কপি বা স্বয়ংক্রিয় sync নয়; সূত্র, আনা/না-আনা পরিবর্তন ও পরীক্ষার বিবরণ: [docs/temp-content-sync.md](docs/temp-content-sync.md)।

## বাংলা ১ম পত্রের MCQ অনুশীলন

- `bangla.html#bangla-mcq`-তে **MCQ টেস্ট দাও**: অধ্যায়, প্রশ্নের ধরন, প্রশ্নসংখ্যা ও সময় বেছে সরাসরি উত্তর দেওয়া যায়। শেষে নম্বর, সঠিক উত্তর, ব্যাখ্যা ও উৎস দেখা যায়; ভুল/বাদ দেওয়া প্রশ্ন আবার দেওয়া যায়।
- ছয় খণ্ড ব্যবহারকারী-প্রদত্ত স্ক্যান থেকে নির্বাচিত/অভিযোজিত **১০৪টি** ও আলাদা চিহ্নিত নতুন **২৬টি AI-রচিত** প্রশ্ন, মোট ২৬ অধ্যায়ে ১৩০টি। এটি পূর্ণ প্রশ্নব্যাংক বা বোর্ড-অনুমোদিত মডেল টেস্ট নয়।
- একই প্রশ্নসেটের script-free, print-friendly শিট ও CSV আছে। টেস্টের উত্তর বা নম্বর কোথাও পাঠানো/সংরক্ষণ হয় না; কোনো account, API বা নতুন runtime dependency নেই। বাংলা পেজেই দেওয়া playlist-এর **সম্পূর্ণ বিষয়ের ওয়ান শট ক্লাস** বোতাম আছে।
- প্রশ্ন সম্পাদনা, এক উৎস থেকে export তৈরি, Google Sheet-এর snapshot ও পরীক্ষার নির্দেশনা: [docs/bangla-mcq.md](docs/bangla-mcq.md)।

## ওয়েবসাইটের কাঠামো (Web-linked / Network Structure)

সাইটের পেজগুলো এখন পারস্পরিক লিংকে যুক্ত; হোম → বিভাগ → বিষয় ধরে যাওয়া বাধ্যতামূলক নয়। বিভাগ বিষয় খোঁজার একটি উপায়, একমাত্র প্রবেশপথ নয়। কয়েকটি সরাসরি সংযোগের উদাহরণ:

```text
পদার্থবিজ্ঞান ↔ উচ্চতর গণিত
পদার্থবিজ্ঞান ↔ অনলাইন ক্লাস ↔ অধ্যায় ট্র্যাকার ↔ স্টাডি রুটিন
বিজ্ঞান বিভাগ ↔ ICT ↔ মানবিক বিভাগ ↔ ব্যবসায় শিক্ষা
কলেজের ক্লাস রুটিন ↔ স্টাডি রুটিন ↔ HSC ২০২৭ সম্ভাব্য রুটিন
```

- হোমের **পেজ নেটওয়ার্ক** (`index.html#structure`) থেকে সব প্রকাশ্য বিভাগ, বিষয়, টুল ও কলেজের তথ্যপেজে সরাসরি যাওয়া যায়। রেখাগুলো কয়েকটি বাস্তব সংযোগের উদাহরণ, সব লিংকের পূর্ণ চিত্র নয়।
- প্রতিটি প্রকাশ্য উপপেজের **এই পেজের সংযোগ** অংশে সম্পর্কিত বিষয়, বিভাগ, পড়ার টুল ও প্রাসঙ্গিক তথ্যের পারস্পরিক লিংক আছে। দীর্ঘ তালিকা খোলা/বন্ধ করা যায়।
- বাংলা, English-এর দুই পত্র ও ICT একই পেজ ব্যবহার করে তিন বিভাগে যুক্ত; বিভাগভিত্তিক আলাদা কপি নয়। অর্থনীতি মানবিকেই আছে, ব্যবসায় শিক্ষার তালিকায় নয়।
- বিষয় থেকে ক্লাস ও ট্র্যাকারের সংশ্লিষ্ট কার্ডে সরাসরি যাওয়া যায়; কার্ডে বিষয়ের পেজে ফেরার লিংকও আছে। নির্দিষ্ট আগের/পরের বিষয়ের বাধ্যতামূলক ক্রম নেই।
- Breadcrumb শুধু বিষয়ের অবস্থান বুঝতে সাহায্য করে, বাধ্যতামূলক যাতায়াতের পথ নয়। বিদ্যমান HTML ফাইলের নাম ও tracker storage key অপরিবর্তিত; নতুন public origin `https://chugc.cc.cd` অনুযায়ী canonical হালনাগাদ। সরানো/পুরোনো compatibility পেজগুলো নেটওয়ার্কের বাইরে থাকে।
- নেভিগেশন সাধারণ HTML লিংকে তৈরি: JavaScript বা API ছাড়াই এবং Android/desktop-এর offline snapshot-এ চলে। অনলাইন ভিডিও ও বাইরের সেবায় ইন্টারনেট লাগে।

### নেভিগেশনের ফাইল ও রক্ষণাবেক্ষণ

- `scripts/site-graph.cjs` — প্রকাশ্য পেজ, বিষয়ের বিভাগ এবং দ্বিমুখী সম্পর্কের একক তালিকা।
- `scripts/site-navigation.cjs` — ওই তালিকা থেকে হোম নেটওয়ার্ক, পেজের সংযোগ ও ক্লাস/ট্র্যাকার লিংক HTML-এ বসায়। Generated অংশগুলো START/END মন্তব্যে চিহ্নিত; সেগুলো হাতে না বদলে generator চালাও।
- `site/assets/network.css` — responsive নেটওয়ার্ক ও সংযোগ-প্যানেলের স্টাইল। নতুন কোনো runtime dependency নেই।

নতুন পেজ বা সম্পর্ক যোগ করার পর:

```bash
node scripts/site-shell.cjs
node scripts/site-navigation.cjs
node scripts/generate-sitemap.cjs
node scripts/breadcrumbs.cjs
node scripts/offline-manifest.cjs site
node --test tests/*.test.cjs
```

`node scripts/site-shell.cjs --check` স্থানীয় আইকন সেট এবং `node scripts/site-navigation.cjs --check` ফাইল না বদলে নেভিগেশন/shared shell হালনাগাদ আছে কি না যাচাই করে। পরীক্ষা ও Pages deployment-এ এই যাচাই চলে। Generated HTML রিপোতেই থাকে, তাই শুধু `site/` সার্ভ করলেই সাইট চলে।

Browser পরীক্ষাগুলো: `tests/android-browser.cjs`, `tests/web-linked-browser.cjs`, `tests/galaxy-browser.cjs`, `tests/text-motion-browser.cjs`, `tests/study-routines-browser.cjs`, `tests/bangla-mcq-browser.cjs` ও `tests/accessibility-browser.cjs`। শেষটি axe-core 4.10.3 দিয়ে সব **৩৫টি পেজে mobile/desktop ও light/dark মিলিয়ে ১৪০টি audit**, সঙ্গে MCQ sheet, খোলা মেনু, storage fallback ও footer credits মিলিয়ে **১৫৬টি audit** চালায়। শুধু WCAG-tagged নিয়ম নয়—default heading/landmark নিয়ম এবং WCAG 2.2 target-size-ও চালু থাকে। সব পেজে keyboard skip link, ৩২০/৭২০ px reflow, text spacing, প্রকৃত no-JS fallback, tracker storage ব্যর্থতা ও footer-এর স্বাধীন মেয়াদও পরীক্ষা হয়।

বাংলা MCQ suite-এ চার স্ক্রিনসাইজে light/dark অনুশীলন ও ১৭টি audit, study routines-এ blocked-script fallback-সহ ১৪টি এবং galaxy পূর্ণ/হালকা control-এ আরও ৮টি audit আছে—সব মিলিয়ে **১৯৫টি automated accessibility audit**। এগুলো পূর্ণ manual accessibility certification নয়; gradient/photo-র inconclusive ফল আলাদা review দরকার। [Accessibility review ও সীমাবদ্ধতা](docs/accessibility-review.md) দেখুন। CI pull request ও push-এ সাতটি suite চালায়, test-only `playwright-core`/`axe-core` ইনস্টল করে, port 8765-এ static site সার্ভ করে এবং accessibility report সংরক্ষণ করে।


## ফিচারসমূহ

- ⏳ সম্ভাব্য পরীক্ষার তারিখের লাইভ কাউন্টডাউন (সংবাদভিত্তিক, চূড়ান্ত নয়)
- 🕸️ হোমে Web-linked নেটওয়ার্ক ও সব বিষয়ের সরাসরি লিংক
- 📚 বিষয়পেজ — নির্বাচিত প্রস্তুতির চেকলিস্ট; বাংলা ২য় পত্রে দেওয়া ছবিভিত্তিক নির্বাচিত প্রস্তুতি; পূর্ণ তালিকা যাচাই বাকি
- ✅ অধ্যায় ট্র্যাকার — স্টোরেজ ব্যবহার করা গেলে অগ্রগতি ব্রাউজারে অটো-সেভ হয়; ব্যর্থ হলে সতর্কতাসহ বর্তমান পেজে টিক দেওয়া যায়
- 🎥 অনলাইন ক্লাস — 10 Minute School, Shikho ও সাবজেক্টভিত্তিক YouTube ক্লাস
- 🕐 বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষার আলাদা দৈনিক/সাপ্তাহিক স্টাডি রুটিন
- 💬 শিক্ষার্থী গ্রুপ — নিজের দেওয়া উত্তরের ভিত্তিতে গ্রুপের তথ্য দেখা যায়; পরিচয় যাচাই করা হয় না।

## GitHub Pages ও কাস্টম ডোমেইন সেটআপ

এই রিপোর **একমাত্র Pages publisher** `.github/workflows/pages.yml` শুধু `site/`-এর কনটেন্ট সাইটের root হিসেবে প্রকাশ করে। আগে পুরো রিপো প্রকাশ করা `static.yml` ও repo-root Jekyll workflow একই deployment overwrite করায় `/site/` লাগত; ওই দুই workflow বাদ দেওয়া হয়েছে।

1. রিপো → **Settings → Pages → Build and deployment** → Source **GitHub Actions** রাখুন।
2. **Actions → Deploy HSC site to GitHub Pages → Run workflow** থেকে `main`-এ চালান। `main`-এ পরবর্তী push-এও একই workflow চলবে; নতুন কোড আগে main-এ পৌঁছাতে হবে।
3. **Custom domain:** `chugc.cc.cd`; DNS-এ host-টি `numb-netizen.github.io`-এর দিকে নির্দেশ করবে—URL বা `/Web-Linked-Structure/site/` নয়। DNS provider-এর zone অনুযায়ী record/host নির্ধারণ করুন।
4. DNS ও certificate check পাস হলে **Enforce HTTPS** চালু রাখুন। সঠিক ঠিকানা **https://chugc.cc.cd/**, শেষে `/site/` নয়। `site/CNAME` একা DNS বা Pages settings বদলায় না।

কাস্টম ডোমেইন ছাড়া project URL `https://numb-netizen.github.io/Web-Linked-Structure/`। পুরোনো `/site/` entry-তে শুধু মূল সাইটে যাওয়ার noindex redirect আছে; সম্পূর্ণ সাইটের আরেক কপি নয়। Public origin, native storage compatibility ও deployment regression-এর বিস্তারিত: [docs/site-updates.md](docs/site-updates.md)।

## সার্চ ইঞ্জিন sitemap

সাইটের `sitemap.xml`-এ প্রকাশ্য ও প্রাসঙ্গিক পেজগুলোর মূল HTTPS ডোমেইনের URL আছে; `robots.txt` সার্চ ইঞ্জিনকে সেটির অবস্থান জানায়। প্রতিটি পাবলিক পেজে আলাদা বিবরণ ও sitemap-এর সঙ্গে মেলে এমন canonical URL আছে। হোমপেজে WebSite structured data এবং শেয়ারের জন্য Open Graph তথ্যও আছে। সরানো আবেদন ও ভুল তালিকা এবং পুরোনো ভূগোল compatibility পেজে `noindex` আছে; পুরোনো URL ও ডেটা/অগ্রগতি না মুছে সেগুলো sitemap থেকে বাদ রাখা হয়েছে।

`node scripts/generate-sitemap.cjs` চালালে sitemap নতুন করে তৈরি হয়; Pages deployment-এও এটি স্বয়ংক্রিয়ভাবে চলে। `node scripts/generate-sitemap.cjs --check` দিয়ে জমা দেওয়া তালিকা যাচাই করা যায়। সাইটের জন্য ফাইল থাকা মানেই কোনো Search Console বা Bing অ্যাকাউন্টে মালিকানা যাচাই বা sitemap জমা হয়েছে এমন নয়।

### Google ও Bing-এ নিবন্ধন

1. [Google Search Console](https://search.google.com/search-console/) খুলে নিজের Google অ্যাকাউন্টে **Add property → URL prefix**-এ `https://chugc.cc.cd/` দিন। HTML-file পদ্ধতিতে আপনার অ্যাকাউন্টের জন্য দেওয়া ফাইল লাগবে। রিপোতে থাকা `googleb7da7b15e33059e0.html` কেবল যে অ্যাকাউন্টের জন্য ইস্যু হয়েছে সেটির যাচাইয়ে কাজে লাগবে; অন্য অ্যাকাউন্টের জন্য আলাদা ফাইল লাগতে পারে। নির্দেশনা: [Google ownership verification](https://support.google.com/webmasters/answer/9008080)।
2. মালিকানা যাচাই হলে **Sitemaps**-এ `https://chugc.cc.cd/sitemap.xml` জমা দিন। **URL inspection** দিয়ে হোমপেজ পরীক্ষা ও প্রয়োজনে indexing request করা যায়। জমা দেওয়া সফল ও index হওয়া আলাদা বিষয়।
3. [Bing Webmaster Tools](https://www.bing.com/webmasters/) থেকে সাইট যোগ ও যাচাই করুন, অথবা আগে যাচাই করা Search Console property [import করুন](https://blogs.bing.com/webmaster/2019/9/Import-sites-from-Search-Console-to-Bing-Webmaster-Tools/)। এরপর Sitemaps-এ একই URL জমা দিন। আগের `BingSiteAuth.xml` ফাইলও নির্দিষ্ট যাচাইয়ের জন্য; অ্যাকাউন্টে যাচাই সম্পন্ন হয়েছে কি না নিজে দেখুন।
4. নতুন পেজ যোগ করলে নির্ভুল বিষয়ভিত্তিক title ও description, canonical এবং হোম থেকে সাধারণ HTML লিংক দিন; `node --test tests/seo.test.cjs` ও sitemap check চালান। যাচাই ফাইল নিজের অ্যাকাউন্ট অনুযায়ী না বদলে সরাবেন না।

সার্চ ইঞ্জিন নিজস্ব সময়ে crawl/index করে এবং title/snippet নিজে বেছে নিতে পারে; sitemap, structured data বা indexing request থেকে ranking বা নির্দিষ্ট সময়ে উপস্থিতির নিশ্চয়তা নেই। HSC 2027-এর পূর্ণ সিলেবাস এখনো যাচাইকৃত নয়।

## লোকাল প্রিভিউ

```bash
cd site && python3 -m http.server 8000
# http://localhost:8000
```

## স্টাডি সাইটের লোগো

`site/assets/study-logo.png` এই শিক্ষার্থী-ভিত্তিক সাইটের জন্য AI দিয়ে তৈরি একটি নতুন লোগো। পুরোনো কলেজ লোগোর বই, আলো ও পাতার ধারণা থেকে অনুপ্রাণিত হলেও এটি কলেজের আনুষ্ঠানিক প্রতীক নয়।

## সরানো আবেদন পেজের পুরোনো ডেটা

আবেদন পেজ সরানো হয়েছে; পুরোনো `dabi.html`-এ শুধু অপসারণের নোটিশ থাকে যাতে Android-এর আগের বান্ডল করা কপি আপডেটে প্রতিস্থাপিত হয়। বিদ্যমান Supabase ডেটা বা অনুমতি পরিবর্তন করা হয়নি: `dabi_public_supporters` টেবিলের প্রকাশ্য নামগুলো আগের মতো পাবলিক API দিয়ে পড়া এবং নতুন রেকর্ড জমা দেওয়া সম্ভব; রোল নম্বর পাবলিক API থেকে পড়া যায় না। ডেটা বা API অনুমতি সরাতে আলাদা সিদ্ধান্ত ও পদক্ষেপ প্রয়োজন। SQL স্কিমা `supabase/migrations/`-এ আছে।

## Android অ্যাপ

সাইটের মেনুর **অ্যাপ ডাউনলোড** (`android-app.html`) পেজ থেকে beta APK ও ইনস্টলের নির্দেশনা পাওয়া যায়। `android/` হলো Android WebView অ্যাপের সোর্স। Android 1.3 থেকে সাইটের একটি সম্পূর্ণ কপি অ্যাপের সঙ্গে থাকে; বিষয়, রুটিন, টাইমার ও ট্র্যাকার অফলাইনে চলে। ইন্টারনেট থাকলে যাচাই করা নতুন সাইটের কপি প্রস্তুত হয় এবং ব্যবহারকারী চাইলে তা চালু করতে পারেন। অনলাইন ভিডিও এবং WhatsApp-এ ইন্টারনেট লাগে। Android System WebView প্রয়োজন। WhatsApp, YouTube ও বাইরের লিংক অন্য অ্যাপ বা ব্রাউজারে খোলে। পড়ার ট্র্যাকার ও অন্যান্য ব্রাউজার-সংরক্ষিত তথ্য অ্যাপের নিজস্ব WebView-তে থাকে; ফোনের ব্রাউজার বা অন্য ডিভাইসের সঙ্গে স্বয়ংক্রিয়ভাবে মেলে না।

Android Studio-তে `android/` খুলে বা JDK 17 ও Android SDK 35 দিয়ে `cd android && ./gradlew testDebugUnitTest assembleDebug` চালিয়ে debug APK বানানো যায়। GitHub-এর **Build Android app** workflow-ও ৩০ দিনের জন্য APK artifact তৈরি করে। Debug APK পরীক্ষার জন্য, Play Store-এ প্রকাশের জন্য নয়; স্থায়ী বিতরণ বা আপডেটের জন্য নিজের সুরক্ষিত signing key দিয়ে release APK/AAB তৈরি করতে হবে। বিভিন্ন workflow run-এর debug key আলাদা হতে পারে, তাই আগের debug APK-এর উপর সরাসরি update নাও হতে পারে। Uninstall করলে অ্যাপের স্থানীয় tracker data মুছে যায়। কোনো keystore বা password রিপোতে রাখবেন না।

### পরীক্ষামূলক Android release ও package

GitHub Releases-এর `android-v1.1-beta`-তে পরীক্ষামূলক **debug-signed** APK প্রকাশের workflow `.github/workflows/publish-android-beta.yml`। এটি আগে পরীক্ষিত main build artifact-টিই ব্যবহার করে; নতুন debug key তৈরি করে না। APK ও `SHA256SUMS.txt` সাধারণ ডাউনলোডের জন্য Releases-এ রাখা হয়। Packages-এ একই APK OCI artifact হিসেবে রাখা হয়; এটি ডেভেলপারদের `oras` দিয়ে pull করার জন্য, ফোনে সরাসরি ইনস্টল করার সাধারণ পথ নয়। নতুন GitHub container package ডিফল্টে private হতে পারে; জনসাধারণের জন্য দেখতে হলে মালিককে package settings থেকে visibility পরীক্ষা করতে হবে।

Debug key নিরাপদ স্থায়ী release key নয়; নতুন signing key দিয়ে তৈরি APK পূর্বেরটির ওপর আপডেট নাও হতে পারে। চূড়ান্ত বিতরণের আগে মালিকের নিয়ন্ত্রণে নিরাপদ release signing key ও repository secrets সেট করতে হবে; key বা password কখনো রিপোতে রাখতে হবে না।

Android 1.2 beta থেকে আমাদের WebView একটি সাধারণ User-Agent চিহ্ন পাঠায়, যার ভিত্তিতে সাইটে শুধু এই অ্যাপের মেনু ও ফুটারে অ্যাপ ডাউনলোড লিংক লুকানো হয়। অন্য WebView ও সাধারণ ব্রাউজারে লিংক থাকে। এটি নিরাপত্তা বা পরিচয় যাচাই নয়। পুরোনো 1.1 APK-তে চিহ্ন নেই, তাই সেখানে লিংক আগের মতো দেখা যাবে। 1.2 পরীক্ষামূলক APK debug key দিয়ে সই করা; আলাদা key হলে আগেরটির ওপর আপডেট নাও হতে পারে।

### অফলাইন সাইট ও আপডেট

Pages workflow প্রতিবার deploy করার সময় `scripts/offline-manifest.cjs` দিয়ে ফাইলের SHA-256 তালিকা তৈরি করে। Android অ্যাপ শুধু মূল HTTPS সাইট থেকে ওই তালিকা ও ফাইল ডাউনলোড করে; সম্পূর্ণ সেটের আকার ও প্রতিটি hash যাচাইয়ের পরই ব্যবহারকারীকে নতুন তথ্য চালু করার বোতাম দেখায়। সংযোগ বা যাচাই ব্যর্থ হলে পুরোনো সম্পূর্ণ কপি চালু থাকে। নতুন build-এ remote update `https://chugc.cc.cd/` থেকে আসে; অন্তর্নির্মিত এবং হালনাগাদ পেজ ইচ্ছাকৃতভাবে একই পুরোনো intercepted offline `https://hsc2027.de5.net` origin ব্যবহার করে, যাতে একই ইনস্টলেশনের স্থানীয় tracker storage থাকে; কোনো গোপন key অ্যাপে রাখা হয় না। অ্যাপের ভিন্ন signing key হলে পুরোনো অ্যাপ আনইনস্টল করতে হতে পারে, যা তার স্থানীয় ট্র্যাকার ডেটা মুছে দেয়।

## Windows ও Linux ডেস্কটপ অ্যাপ (beta)

`desktop/` ফোল্ডারে Electron-এর মাধ্যমে একই ওয়েবসাইটের একটি offline snapshot প্যাকেজ করা হয়। Windows x64-এর জন্য NSIS installer এবং Linux x86_64-এর জন্য AppImage তৈরি হয়। ব্যবহারকারীর tracker তথ্য অ্যাপের নিজস্ব স্থানীয় storage-এ থাকে; ওয়েবসাইট বা অন্য ডিভাইসের সঙ্গে সিঙ্ক হয় না। সাইট পরিবর্তিত হলে নতুন অ্যাপ build দরকার; automatic update নেই। ভিডিও, বাইরের ওয়েব লিংক ও WhatsApp-এর জন্য ইন্টারনেট প্রয়োজন; নতুন snapshot-এ বাংলা ফন্ট স্থানীয়ভাবে থাকে।

```bash
cd desktop
npm ci
npm start
npm run dist:linux  # Linux-এ
npm run dist:win    # Windows-এ
```

Linux AppImage-এ `chmod +x <file>.AppImage` করে চালাতে হয়; কিছু distribution-এ FUSE লাগতে পারে। Windows build unsigned, তাই SmartScreen সতর্ক করতে পারে। শুধু বিশ্বস্ত উৎস থেকে ডাউনলোড করে প্রকাশিত SHA-256 মিলিয়ে নিন। ইনস্টলার স্থানীয় app data মুছে দেয় না, কিন্তু ব্যবহারকারী নিজে app data সরালে tracker হারাবে। `desktop.yml` CI দুই OS-এ offline navigation ও tracker পরীক্ষার পর installer তৈরি করে; প্রয়োজনে workflow dispatch দিয়ে beta release প্রকাশ করা যায়।

### বিশ্বস্ত Windows code signing (প্রস্তুত ব্যবস্থা)

বর্তমান প্রকাশিত Windows beta এখনো **unsigned**; শুধু workflow যোগ হলেই এটি signed হয় না। একটি Windows-এ বিশ্বাসযোগ্য **code-signing certificate**, তার private key-সহ password-protected PFX এবং certificate-এর SHA-1 thumbprint প্রয়োজন। এটি কেবল এমন certificate/provider-এর জন্য যেটি নীতিমালা মেনে PFX export অনুমতি দেয়; অনেক বর্তমান CA certificate-এর private key hardware token বা cloud HSM-এ non-exportable থাকে। সেক্ষেত্রে ওই provider-এর supported HSM/cloud signing integration আলাদাভাবে তৈরি করতে হবে; key export করতে বাধ্য করা যাবে না। Linux AppImage এই Windows Authenticode প্রক্রিয়ায় signed হয় না।

1. GitHub repository Settings → Environments-এ `windows-signing` environment আগে তৈরি করুন, deployment শুধু `main`-এ সীমিত করুন এবং সম্ভব হলে required reviewer অনুমোদন দিন। Secrets-এ শুধু environment-এর মাধ্যমে access দিন। Branch protection ও বিশ্বস্ত maintainer review চালু রাখুন।
2. ওই environment-এর secrets হিসেবে `WINDOWS_SIGNING_PFX_BASE64` (সম্পূর্ণ PFX-এর single-line base64) ও `WINDOWS_SIGNING_PFX_PASSWORD` দিন। Environment variable `WINDOWS_SIGNING_CERT_SHA1`-এ ঠিক ৪০টি hex অক্ষরের public certificate thumbprint দিন। কখনো certificate, private key, password বা secret-এর মান চ্যাট, লগ বা Git-এ দেবেন না। Repository/environment পরিচালনার অনুমতি শুধু বিশ্বস্ত ব্যক্তিদের দিন।
3. Actions → **Sign Windows desktop beta** workflow `main` থেকে চালান। সাইনিং শুধু ওই protected environment-এ চলে। Secrets না থাকলে, PFX/ thumbprint না মিললে, signature বিশ্বস্ত না হলে বা timestamp না থাকলে build ব্যর্থ হয়। Installer ও bundled app দুটির স্বাক্ষর যাচাই এবং offline smoke test পাস করার পরেই artifact তৈরি হবে। প্রথমে publish না করে artifact পরীক্ষা করুন।
4. প্রকাশ করতে workflow-তে `publish_signed_beta` নির্বাচন করলে আলাদা prerelease `desktop-v0.1.0-signed-beta` তৈরি হবে; বিদ্যমান unsigned release পরিবর্তিত হয় না। Tag আগে থেকে থাকলে workflow সেটি overwrite করে না। Signature থাকা মানেই SmartScreen-এর কোনো সতর্কতা থাকবে, এমন নিশ্চয়তা নেই।

CI-তে আলাদা temporary self-signed certificate দিয়ে signing পথ পরীক্ষা হয়; সেটি অবিশ্বস্ত, শুধু পরীক্ষার জন্য এবং কোনো release artifact-এ যায় না। Secret থাকা job-এ CI dependencies-ও key ব্যবহারের সুযোগ পায়; সেই কারণে workflow, lockfile ও dependencies বদল সর্বদা review করুন।

### Lightweight desktop beta

`desktop-lite/` হলো আলাদা Lite সংস্করণ: Windows x64-এ WebView2 এবং Linux-এ system WebKitGTK ব্যবহার করে, Electron-এর browser bundle নয়। Windows ZIP পুরো extract করে চালাতে হয়; Microsoft **.NET 10 Desktop Runtime x64** ও **Edge WebView2 Runtime** আগে থেকে না থাকলে আলাদা ইনস্টল করতে হবে। অ্যাপ unsigned, SmartScreen সতর্ক করতে পারে। Linux `.deb` Ubuntu/Debian ও WebKitGTK 4.1-এর জন্য, সিস্টেম dependencies ইনস্টল করতে হতে পারে; এটি সব distribution-এর AppImage বিকল্প নয়। Dependencies ডাউনলোড/ইনস্টল করতে ইন্টারনেট ও অতিরিক্ত জায়গা লাগতে পারে।

দুটোতেই bundled snapshot ও local tracker অফলাইনে কাজ করে; ভিডিও/বাইরের লিংক অনলাইন; নতুন snapshot-এ বাংলা ফন্টও অফলাইনে থাকে। Lite, পুরোনো Electron অ্যাপ ও ব্রাউজারের tracker storage আলাদা এবং automatic migration/sync নেই; আগের ডেটা দরকার হলে পুরোনো অ্যাপ বা তার data মুছবেন না। নতুন site snapshot পেতে নতুন build দরকার। একটি স্থির loopback port (Windows 19828 / Linux 19829) কেবল স্থানীয় পৃষ্ঠার জন্য ব্যবহৃত হয়; একই সময়ে একাধিক instance বা port দখল থাকলে অ্যাপ চালু হবে না।

Windows build: `dotnet publish desktop-lite/windows/HscLite.csproj -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true`, তারপর output-এর পাশে `site` কপি করতে হবে। Linux: `desktop-lite/linux/build-deb.sh`, তারপর `sudo apt install ./desktop-lite/dist/HSC-2027-Lite-0.2.1-beta-linux.deb`। `.github/workflows/desktop-lite.yml` প্যাকেজকৃত apps-এ offline tracker/theme smoke test চালায় ও manual dispatch-এ beta release ও SHA-256 প্রকাশ করে। Linux CI-তে sandbox disable কেবল headless test-এর জন্য; বিতরণকৃত অ্যাপ sandbox বন্ধ করে না।

### মতামত ও নিরাপত্তা রিপোর্ট

হোমপেজের **মতামত জানাও** অংশ বা যেকোনো পেজের ফুটারের লিংক থেকে ফর্ম খোলে। বিষয় ও বিবরণ পাঠালে GitHub লগইন ছাড়াই মতামত গ্রহণের চেষ্টা করে। গ্রহণের নিশ্চিত বার্তা মানে এটি Supabase-এর private `feedback_queue`-তে রাখা হয়েছে, Issue ইতিমধ্যে তৈরি হয়েছে এমন নয়। `feedback-issues.yml` সাধারণত প্রতি পাঁচ মিনিটে সারি থেকে সর্বোচ্চ পাঁচটি প্রকাশ্য GitHub Issue তৈরি করে; GitHub Actions বিলম্বিত বা বন্ধ থাকলে বেশি সময় লাগতে পারে। ব্যর্থ হলে লেখাটি ফর্মে থাকে; সংযোগ বিচ্ছিন্ন হলে সার্ভারে গৃহীত হয়েছে কি না নিশ্চিত নাও হতে পারে, তাই পুনরায় পাঠালে দ্বিগুণ হতে পারে। ইন্টারনেট ও JavaScript প্রয়োজন। পুরোনো offline app-এ পরিবর্তন পেতে নতুন build দরকার।

Issue ও তার বিষয়বস্তু **সবার জন্য প্রকাশ্য** হবে; ব্যক্তিগত বা সংবেদনশীল তথ্য দেবেন না। নিরাপত্তা রিপোর্ট এখানে নয়। অপব্যবহার সীমিত করতে সারিতে সর্বোচ্চ পাঁচটি মতামত প্রতি ঘণ্টায় গ্রহণ করা হয়; এটি সম্পূর্ণ স্প্যাম প্রতিরোধ নয় এবং সবার জন্য একই সীমা। ব্যবহার পূর্ণ হলে অপেক্ষা করতে হবে। Supabase টেবিলে anon/authenticated-এর পড়া বা সরাসরি লেখার অনুমতি নেই; Edge Function কেবল GitHub Actions-এর যাচাইকৃত নির্দিষ্ট main workflow-এর স্বল্পমেয়াদি OIDC পরিচয়ে সারি পড়া ও চিহ্নিত করার অনুমতি দেয়। GitHub token ব্রাউজার বা Supabase-এ রাখা হয় না। সারির রেকর্ড স্বয়ংক্রিয়ভাবে মুছে ফেলা হয় না; প্রকল্পের প্রশাসককে নিয়মিত পর্যবেক্ষণ ও উপযুক্ত retention পরিচালনা করতে হবে। GitHub Actions বন্ধ বা permission ব্যর্থ হলে সারি জমে থাকবে—Actions-এর `Deliver site feedback to GitHub Issues` workflow পর্যবেক্ষণ করুন; ব্যর্থ রান সফলভাবে পুনরায় চালানো যায়। স্থিতিশীল ID দিয়ে পূর্বে তৈরি Issue খুঁজে পুনরাবৃত্তি কমানো হয়।

নিরাপত্তা দুর্বলতা পাবলিক Issue-তে না লিখে [গোপন GitHub vulnerability report](https://github.com/numb-netizen/Temp/security/advisories/new) ব্যবহার করুন। বিস্তারিত [SECURITY.md](SECURITY.md)-এ।

### HSC 2027 পাঠ্যসূচি যাচাইয়ের অবস্থা

সাইটের অধ্যায় চেকলিস্ট এখনো বাছাই করা পুরোনো প্রস্তুতির বিষয়, পূর্ণ বা যাচাইকৃত HSC 2027 সিলেবাস নয়। বিদ্যমান পত্রের লেবেলগুলিও পরীক্ষা বাকি; ট্র্যাকারের শতাংশ কেবল দৃশ্যমান পুরোনো তালিকার জন্য। বাংলা ২য় পত্রে ব্যবহারকারীর দেওয়া সূচির ছবির নির্বাচিত বিষয় ও শুধু সেগুলোর অগ্রগতি দেখানো হয়; ছবিগুলো সরকারি পূর্ণ পাঠ্যসূচির প্রমাণ নয়। ইংরেজি ২য় পত্রে যাচাই শেষ না হওয়া পর্যন্ত অনুমানভিত্তিক তালিকা বা শতাংশ দেখানো হয় না। ২০২৫–২৬ শিক্ষাবর্ষের অফিসিয়াল সূত্র, বিষয়ভিত্তিক ঘাটতি ও নিরাপদ key migration-এর পরিকল্পনা: [পাঠ্যসূচি যাচাই প্রতিবেদন](docs/syllabus-verification.md)।
