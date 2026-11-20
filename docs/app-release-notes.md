# CHUGC Study Portal {{VERSION}}

এই সাইটের নিজস্ব Android, Windows ও Linux অ্যাপের প্রথম **পরীক্ষামূলক beta**। কলেজের আনুষ্ঠানিক অ্যাপ, Play Store প্রকাশনা বা Microsoft Store সংস্করণ নয়।

## কোন ফাইলটি নেবে?

| ডিভাইস | প্যাকেজ | প্রয়োজন |
| --- | --- | --- |
| Android | `CHUGC-Study-Portal-{{VERSION}}-android-debug.apk` | Android 6.0+ ও Android System WebView; platform WebView ব্যবহারের কারণে APK-তে নির্দিষ্ট CPU ABI-র native library নেই |
| Windows | `CHUGC-Study-Portal-{{VERSION}}-windows-x64-setup.exe` | Windows 10/11 x64; Chromium অ্যাপের সঙ্গেই আছে, আলাদা .NET/WebView2 লাগে না |
| Linux | `CHUGC-Study-Portal-{{VERSION}}-linux-x64.AppImage` | সমর্থিত x86_64 desktop Linux; GTK/NSS-সহ system libraries ও কিছু distribution-এ FUSE লাগতে পারে |

### Android

APK ডাউনলোড করে খুলুন। Android চাইলে শুধু ব্যবহৃত browser/file manager-এর জন্য **Install unknown apps** অনুমতি দিন, সতর্কতা পড়ে সিদ্ধান্ত নিন এবং পরে অনুমতি বন্ধ করুন। এটি **debug-signed ও debuggable পরীক্ষামূলক APK**; স্থায়ী release signing key এখনো কনফিগার করা নেই। ভবিষ্যৎ build-এর key ভিন্ন হলে সরাসরি update নাও হতে পারে। এটি স্থায়ী signed production release নয়।

নিজস্ব application ID `bd.edu.chugc.studyportal`, তাই আগের `bd.edu.hsc2027` অ্যাপের পাশাপাশি রাখা যাবে। পুরোনো অ্যাপের অগ্রগতি আপনাআপনি আসে না। পুরোনো ডেটা রাখতে পুরোনো অ্যাপ আনইনস্টল করবেন না।

### Windows

Installer চালিয়ে নিজের account-এর জন্য install করুন। এটি **unsigned beta**; SmartScreen/অন্য নিরাপত্তা সতর্কতা আসতে পারে। কেবল এই repository-র বিশ্বস্ত release থেকে নামান, checksum মিলিয়ে সতর্কতা পড়ে সিদ্ধান্ত নিন; সুরক্ষা ব্যবস্থা বন্ধ করবেন না। ARM Windows-এর native build এতে নেই।

### Linux

নিজের ডাউনলোড করা ফাইলের directory-তে:

```sh
chmod +x CHUGC-Study-Portal-{{VERSION}}-linux-x64.AppImage
./CHUGC-Study-Portal-{{VERSION}}-linux-x64.AppImage
```

কিছু distribution-এ উপযুক্ত FUSE package লাগবে। FUSE না থাকলে AppImage-এর `--appimage-extract` এবং `squashfs-root/AppRun` বিকল্প ব্যবহার করা যায়; প্রয়োজনীয় system libraries ও sandbox support তখনও লাগবে। অ্যাপকে root হিসেবে চালাবেন না বা sandbox বন্ধ করবেন না। ARM Linux build নয়।

## কী কী থাকবে?

- অফলাইনে ৩৫টি পড়ার পেজ, স্থানীয় বাংলা ফন্ট, তিন বিভাগের স্টাডি রুটিন, ১৩০ প্রশ্নের বাংলা MCQ ও প্রশ্নের শিট।
- স্থানীয় অধ্যায় ট্র্যাকার, light/dark theme এবং হালকা animation control; OS reduced-motion preference অগ্রাধিকার পায়।
- MCQ উত্তর/ফলাফল সার্ভারে যায় না এবং refresh করলে চলমান quiz মুছে যায়। ট্র্যাকার এই app installation-এই থাকে; browser/পুরোনো app/অন্য device-এর সঙ্গে sync বা automatic migration নেই।
- Android অনলাইনে `https://chugc.cc.cd/` থেকে সম্পূর্ণ hash-যাচাইকৃত site update প্রস্তুত করতে পারে; ব্যবহারকারীর সম্মতির আগে কপি বদলায় না। Desktop-এ নতুন site snapshot পেতে নতুন app build লাগে। কোনো OS-এই binary auto-update বা auto-install নেই।
- ভিডিও, WhatsApp, feedback ও বাইরের portal-এর জন্য ইন্টারনেট লাগে। Portal password অ্যাপ নেয় না; বাইরের portal নিজস্ব browser-এ খোলে।

App data মুছলে/Android app uninstall করলে স্থানীয় অগ্রগতি হারাবে। এই beta-তে বাস্তব ডিভাইসের সব পরিবেশে কাজ করার নিশ্চয়তা নেই।

## যাচাই ও সোর্স

`SHA256SUMS.txt` দিয়ে ডাউনলোডের integrity যাচাই করুন (Linux: `sha256sum -c SHA256SUMS.txt`; Windows: `Get-FileHash <ফাইল> -Algorithm SHA256`)। Checksum file একই release থেকে নামাতে হবে। SHA-256 মিললেই publisher identity বা Windows signature প্রমাণ হয় না।

`ANDROID-VERIFICATION.txt`-এ APK identity ও public signing-certificate fingerprint এবং `BUILD-INFO.json`-এ source commit, CI run ও installer hashes আছে। **কোনো private key/password প্রকাশ করা হয়নি।**

- Source commit: `{{SOURCE_SHA}}`
- Build workflow: {{RUN_URL}}
- Release: {{RELEASE_URL}}
- License: GPL-3.0-or-later; bundled assets/dependencies-এর আলাদা license-ও প্রযোজ্য।
