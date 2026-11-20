# বাংলা ১ম পত্র · MCQ অনুশীলন

## পরিধি ও উৎস

`site/bangla.html#bangla-mcq`-তে ২৬টি অধ্যায়ের নির্বাচিত ১৩০টি প্রশ্ন আছে: প্রতি অধ্যায়ে স্ক্যান থেকে নির্বাচিত/অভিযোজিত ৪টি ও নতুন AI-রচিত ১টি। চার বিকল্প, সঠিক উত্তর, সংক্ষিপ্ত ব্যাখ্যা ও প্রশ্নের ID প্রতিটি প্রশ্নে আছে।

ব্যবহারকারীর দেওয়া উদ্ভাস এইচএসসি বাংলা ১ম পত্র প্রশ্নব্যাংক ২০২৭-এর ছয় খণ্ডে ১০৬টি image-only পৃষ্ঠা ছিল। অধ্যায়ের নির্বাচিত পৃষ্ঠা দৃশ্যত পড়ে প্রশ্ন/তথ্য বাছাই করা হয়েছে; OCR-কে নির্ভরযোগ্য প্রতিলিপি হিসেবে ব্যবহার করা হয়নি। শব্দ ও কিছু বিকল্প সহজ/সম্পাদিত হয়েছে; তথ্যাবলি থেকে তৈরি প্রশ্নও “নির্বাচিত/অভিযোজিত” শ্রেণিতে আছে।

- `data/bangla-mcq.json` একমাত্র মূল প্রশ্নসেট। `sources`-এ সংযুক্তির আসল filename, পৃষ্ঠাসংখ্যা, সমন্বিত শুরুর পৃষ্ঠা ও SHA-256 আছে।
- `reference.pdfPage` খণ্ডটির স্থানীয় পৃষ্ঠা; `scanPage` ছয় খণ্ডের ১–১০৬ ক্রম। **কোনোটিই মূল বইয়ের মুদ্রিত পৃষ্ঠা নয়।** খণ্ডগুলোর সমন্বিত সীমা: ১–২০ / ২১–৪০ / ৪১–৬০ / ৬১–৮০ / ৮১–৯৩ / ৯৪–১০৬।
- AI-রচিত প্রশ্নের page reference শুধু আলোচিত অধ্যায়ের বিষয়ভিত্তি, উৎসে ওই প্রশ্নটি আছে এমন দাবি নয়। UI, শিট ও CSV-তে নতুন প্রশ্ন আলাদা চিহ্নিত।
- মূল PDF, OCR cache বা স্ক্যানের ছবি সাইটে পুনঃপ্রকাশ করা হয়নি। এটি পূর্ণ প্রতিলিপি, পূর্ণ পাঠ্যসূচি, বোর্ড-অনুমোদিত পরীক্ষা বা কমন পড়ার নিশ্চয়তা নয়। প্রকাশক/বোর্ড/কলেজের অনুমোদনও দাবি করা হয়নি।
- অটোমেটেড পরীক্ষা উত্তরসূচির কাঠামো ও শাফলিং যাচাই করে, শিক্ষাগত নির্ভুলতার স্বাধীন নিশ্চয়তা দেয় না। পাঠ্যবই ও শিক্ষক-নির্দেশনা দিয়ে মিলিয়ে নিতে হবে। অসংগতি থাকলে প্রশ্নের ID দিয়ে বিদ্যমান feedback পেজে জানানো যায়।

## এক উৎস থেকে সাইট ও শিট

```bash
# প্রশ্ন/উত্তর/ব্যাখ্যা বদলাও data/bangla-mcq.json-এ, generated ফাইলে নয়।
node scripts/bangla-mcq.cjs
node scripts/offline-manifest.cjs site
node scripts/bangla-mcq.cjs --check
node --test tests/*.test.cjs
```

Generator-এর তিনটি output:

1. `site/assets/bangla-mcq-bank.js` — স্থানীয় script data; fetch/CORS/API ছাড়াই কাজ করে। সাধারণ JSON-কে app whitelist-এ যুক্ত করার দরকার হয়নি।
2. `site/assets/bangla-mcq-sheet.html` — একই ১৩০ প্রশ্নের script-free পড়া ও print view; native details-এ উত্তর/ব্যাখ্যা, print-এ সব উত্তর দৃশ্যমান।
3. `docs/bangla-mcq-sheet.csv` — UTF-8 BOM, quoted cells ও formula-injection protection-সহ spreadsheet copy। একই CSV browser-এ তৈরি করে ডাউনলোড করা যায়। Android WebView-এ Blob-download bridge নেই, তাই শুধু এই CSV বোতাম লুকানো; পড়ার শিট ও টেস্ট থাকে।

Google Sheet: [HSC ২০২৭ · বাংলা ১ম পত্র · MCQ অনুশীলন ও উত্তরব্যাখ্যা](https://docs.google.com/spreadsheets/d/1Vl07ihdO50DhhpgePTALkGyq6t4wl6u-1nlnh6CA7HQ/edit)। এতে `MCQ`, `অধ্যায়সূচি`, `উৎস ও নির্দেশনা` ট্যাব আছে। এটি একবারের export, **live data source নয়**; শিট সম্পাদনা করলে ওয়েবসাইট নিজে বদলাবে না। নতুন bank export-এর `HSC_MCQ.sheetRows(bank)` Google Sheets-compatible rows দেয়। ব্যবহারকারীর অনুমতি ছাড়া online শিটের sharing/publication বদলানো হয়নি; সবার পড়ার জন্য সাইটে নিজস্ব HTML শিট আছে।

## টেস্টের আচরণ

- অধ্যায় ও origin filter; ৫/১০/২০/৩০ প্রশ্ন (pool ছোট হলে যত আছে); unlimited বা ৫/১০/২০/৩০ মিনিট। প্রশ্ন/বিকল্প দুটোই শাফল হয়, সঠিক উত্তরের mapping বজায় থাকে।
- সঠিক +১; ভুল/বাদ ০; নেগেটিভ মার্কিং নেই। উত্তর বদলানো, মুছা, আগের/পরের প্রশ্ন ও palette navigation আছে। জমা বা পরিত্যাগের আগে inline confirmation আসে।
- Deadline wall-clock ভিত্তিক; background tab, visibility change এবং page restore-এর সময়ও যাচাই হয়। সময় শেষ হলে শুধু ইতোমধ্যে দেওয়া উত্তর দিয়ে ফল হিসাব হয়। সিস্টেম clock ইচ্ছাকৃত বদলানো ঠেকানোর server-side anti-cheat নেই—এটি self-practice।
- ফলের পরে উত্তর/ব্যাখ্যা/উৎস, একই settings বা শুধু ভুল/বাদ দেওয়া canonical প্রশ্ন দিয়ে retry করা যায়। ফল board grade নয়।
- উত্তর/স্কোর memory-তেই থাকে; refresh বা page ছাড়লে মুছে যায়। login, cookies, local/session storage, analytics বা server submission নেই। বিদ্যমান অধ্যায় tracker-এর keys ও ডেটা অপরিবর্তিত।
- JS/প্রশ্নসেট না চললে সত্যিকারের HTML শিটে fallback। সম্পূর্ণ offline snapshot-এ স্থানীয় প্রশ্নসেট/শিট থাকে; বাইরের YouTube playlist-এর জন্য ইন্টারনেট লাগে।

## পরীক্ষা

`tests/bangla-mcq.test.cjs`: schema/count/reference bounds, tracker mapping, shuffle/answer key, filtering, grading, deadlines, export drift, HTML/CSV escaping ও page/playlist/privacy integration।

`tests/bangla-mcq-browser.cjs`: ৩২০/৩৯০/৭৬৮/১৪৪০ px × light/dark, keyboard/radio selection, উত্তর মুছা/পরিবর্তন, navigation, ফল/ব্যাখ্যা, retry, deadline, no-JS/missing bank/storage denial, `file://` offline, Android app context, CSV ও print fallback। setup/running/confirmation/results এবং static sheet-এ targeted axe audits চালায়। এটি পূর্ণ manual accessibility certification বা বাস্তব Android ডিভাইসের instrumented test নয়।

CI port 8765-এ `site/` সার্ভ করে অন্য browser suite-এর সঙ্গে এটি চালায়। স্থানীয়ভাবে `playwright-core@1.56.1`, `axe-core@4.10.3` এবং Chrome লাগবে:

```bash
# আলাদা terminal/process-এ static site সার্ভ করতে হবে।
python3 -m http.server 8765 --bind 0.0.0.0 --directory site
NODE_PATH=/path/to/test-dependencies/node_modules CHROME_PATH=/path/to/chrome node tests/bangla-mcq-browser.cjs
```

ভবিষ্যৎ bank পরিবর্তনে script export ও offline manifest আবার তৈরি করো; Google Sheet দরকার হলে সেটিও আলাদাভাবে হালনাগাদ/যাচাই করো।
