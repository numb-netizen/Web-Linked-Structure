# CHUGC Study Portal: Android, Windows ও Linux

এই repository-র নিজস্ব cross-platform application release: [`study-portal-v1.0.0-beta.1`](https://github.com/numb-netizen/Web-Linked-Structure/releases/tag/study-portal-v1.0.0-beta.1)। সাধারণ ব্যবহারকারীর ডাউনলোড পেজ: https://chugc.cc.cd/android-app.html । ঐতিহাসিক পেজের filename রাখা হয়েছে যাতে বিদ্যমান navigation/deep link না ভাঙে।

## প্যাকেজ ও পরিচয়

| Platform | Package | Application identity |
| --- | --- | --- |
| Android 6.0+ | `CHUGC-Study-Portal-1.0.0-beta.1-android-debug.apk` | `bd.edu.chugc.studyportal` |
| Windows 10/11 x64 | `CHUGC-Study-Portal-1.0.0-beta.1-windows-x64-setup.exe` | Electron app ID `bd.edu.chugc.studyportal.desktop` |
| Linux x86_64 | `CHUGC-Study-Portal-1.0.0-beta.1-linux-x64.AppImage` | executable `chugc-study-portal` |

Android namespace/source package ইচ্ছাকৃতভাবে `bd.edu.hsc2027`-তেই আছে; installable application ID আলাদা। আগে ডাউনলোড করা Temp/HSC 2027 app overwrite হয় না। নতুন app, পুরোনো app, browser ও device-এর tracker আলাদা; automatic migration/sync নেই। পুরোনো তথ্য রাখতে পুরোনো app/data মুছবেন না। Tracker-এর বিদ্যমান `hsc2027:*` keys ও site-এর quiz/রুটিন অপরিবর্তিত।

Windows installer ও Linux AppImage-এ Chromium/Electron bundle করা হয়—পুরোনো Lite ZIP/.deb নয়; আলাদা .NET বা WebView2 Runtime লাগে না। `desktop-lite/` ঐতিহাসিক/ঐচ্ছিক source হিসেবে রাখা হয়েছে, এই release-এর primary download নয়। ARM desktop build দাবি করা হচ্ছে না।

## Beta signing ও নিরাপত্তা

- Android APK **debug-signed ও debuggable**, Play Store/production build নয়। স্থায়ী release signing key এখনো provision করা হয়নি; বর্তমান GitHub integration-এর repository Actions secrets ব্যবস্থাপনার অনুমতি নেই। কোনো স্থায়ী release keystore provision করা বা private key/password প্রকাশ করা হয়নি; CI কেবল Android-এর অস্থায়ী standard debug key ব্যবহার করে। Future run-এর debug key ভিন্ন হলে in-place update ব্যর্থ হতে পারে; uninstall করলে ওই app-এর progress হারাবে।
- Windows build **unsigned**; SmartScreen সতর্ক করতে পারে। CI-র throwaway signing certificate শুধু পরীক্ষার জন্য, release-এ যায় না। বিশ্বস্ত production certificate ছাড়া signed দাবি করা হয় না। Protected `windows-signing` workflow-র নিরাপত্তা শর্ত অপরিবর্তিত।
- Linux AppImage চালাতে distro-উপযোগী system libraries/FUSE/sandbox support লাগতে পারে। Root বা `--no-sandbox` ব্যবহারকারীর নির্দেশনা নয়; headless CI-র sandbox flag শুধু isolated test runner-এর জন্য।
- App navigation শুধু bundled pages-কে privileged renderer-এ রাখে। Desktop-এ Node integration বন্ধ, context isolation ও sandbox চালু; permissions deny থাকে। বাইরের portal/video/browser link-এ app privilege দেওয়া হয় না। নতুন backend/analytics/account/student-data collection যোগ হয়নি।

## Release contract ও build

`data/app-release.json`-ই version, native application ID, tag ও তিনটি filename-এর contract। `node scripts/app-release.cjs --check` native metadata, lockfile ও site-এর সব download/checksum link মিলিয়ে দেখে। Version বদলালে Android `versionCode` বাড়াতে হবে এবং Gradle/package.json/lockfile/site link একসঙ্গে বদলাতে হবে।

`.github/workflows/app-release.yml` (**Package CHUGC Study Portal**) working branch-এ version manifest/workflow বদলালে, অথবা manual dispatch-এ:

1. Node regressions ও Python policy tests চালায়।
2. Android unit tests + debug APK/instrumentation APK build করে; `aapt` দিয়ে identity/version এবং `apksigner` দিয়ে certificate/signature যাচাই করে।
3. Windows ও Linux native runner-এ source এবং packaged-app offline smoke tests চালায়: navigation, persisted chapter tracker, তিনটি study plan, ১৩০-question MCQ শুরু/উত্তর/submit এবং worksheet।
4. ঠিক তিনটি package-এর format header/size পরীক্ষা করে, SHA-256 checksum ও source/run provenance তৈরি করে।
5. কেবল তিন platform সফল হলে **draft prerelease** তৈরি করে; কখনো automatic public release নয়। বিদ্যমান release/tag overwrite করে না।

আলাদা Android online/offline emulator ও সাত-suite website CI-ও review করতে হবে। Package workflow-এর draft-ই এই অতিরিক্ত check-গুলোর success-এর বিকল্প নয়। Release-এর `BUILD-INFO.json`-এ exact source commit ও build run থাকে। Source/version পুনরায় build করতে হলে নতুন version/tag দিন; প্রকাশিত bytes clobber করবেন না।

### Public publication ও site deployment

1. Draft-এর exact source SHA ও successful native/website/emulator runs যাচাই করুন। তিনটি filename, `SHA256SUMS.txt`, `BUILD-INFO.json`, `ANDROID-VERIFICATION.txt` এবং warnings review করুন।
2. Explicit version tag দিয়ে draft publish করুন, যেমন `gh release edit study-portal-v1.0.0-beta.1 --draft=false --prerelease`। কোনো key/password এই command-এ লাগে না।
3. Release API-তে তিন binary asset-এর nonzero size/digest ও public URL আছে নিশ্চিত করুন; তারপর green-check PR merge করে site links deploy করুন। `/releases/latest` ব্যবহার করা হয় না, কারণ prerelease সেখানে নাও আসতে পারে।
4. Pages deployment ও live download page যাচাই করুন। Site update করা আর নতুন native binary publish করা আলাদা কাজ।

Release binary, unpacked app, node_modules বা keystore Git-এ রাখা হয় না। Binaries GitHub Releases-এ, CI scratch/artifacts পৃথক storage-এ থাকে। GitHub Packages/OCI phone installer নয়; এই user-facing publication GitHub Releases-এই।

## Offline scope

বাংলা font, পড়ার পেজ, local tracker, তিনটি study routine ও MCQ offline snapshot-এর অংশ। Desktop-এ নতুন snapshot পেতে নতুন app build প্রয়োজন। Android শুধু `https://chugc.cc.cd/` থেকে সম্পূর্ণ SHA-256-যাচাইকৃত update প্রস্তুত করে এবং user consent-এর পর সক্রিয় করে; interrupted update পুরোনো সম্পূর্ণ copy রাখে। কোনো binary auto-install/update নেই।

একই Android installation-এর storage compatibility-এর জন্য internal intercepted origin `https://hsc2027.de5.net` রাখা হয়েছে; এই host-এ page fetch করে app চলে না। Online update base নতুন domain-ই। External links, feedback, YouTube, WhatsApp ও college portal-এর জন্য internet প্রয়োজন। Portal credentials কেবল portal-এই ব্যবহার করতে হবে।
