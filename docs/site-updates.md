# Home, department study routines and public-root deployment

## Public URL and deployment ownership

- Public origin: **https://chugc.cc.cd**. `scripts/site-config.cjs` is the common public-origin setting for the sitemap, breadcrumbs and IndexNow generators. All public page canonicals, Open Graph/structured data, `robots.txt` and the deployed `site/CNAME` use that host.
- Only **`.github/workflows/pages.yml`** owns GitHub Pages. It uploads the **contents of `site/`**, not the repository root. Therefore `site/index.html` is served at `/`, and `site/assets/...` at `/assets/...`.
- The former `static.yml` uploaded `.` and the former Jekyll workflow built `./`. Both targeted the same Pages environment as `pages.yml`; whichever deployed last could put the real site under `/site/`. Those two competing workflows are removed, and were also disabled in GitHub while this branch was being prepared. Do not add a second Pages publisher.
- `tests/site-deployment.test.cjs` guards against multiple publishers and inconsistent origins. A deployment recovery should rerun **Deploy HSC site to GitHub Pages**, not upload the entire repository.
- `site/site/index.html` is a small, `noindex` compatibility redirect for the old **`/site/` entry** only. JavaScript preserves its query/fragment, and a meta refresh/root link also works without JavaScript. It is not a second copy of the website. Old deeper `/site/<page>.html` links are not aliased: remove the `/site` prefix.
- DNS/HTTPS/Pages settings are external to these files. `CNAME` alone does not configure DNS. Preview/local servers should serve `site/` directly.

### Storage and app compatibility

Moving `/site/` to `/` **on the same `chugc.cc.cd` origin** does not change `localStorage`; tracker keys are not rewritten. A browser's data on the previous `hsc2027.de5.net` origin cannot automatically be read by the new host. There is no cross-device or cross-origin progress migration.

Android deliberately keeps `NavigationPolicy.HOME` on its historical **intercepted offline WebView origin**, so an existing installation's tracker remains in the same storage namespace. Only `UPDATE_HOME` and `LocalSiteStore`'s remote download base change to the new public root. Update redirects remain disabled and full-file hash/size checks stay in place. Public links to the new web host or external college portal open outside the app. **A new native app build is needed to ship that updater-source change; this change does not publish an APK.** Existing installed apps retain their last complete offline copy if their old update host is unreachable.

The feedback function's exact CORS allowlist additionally permits `https://chugc.cc.cd`, retaining the historical native/desktop origins. This allowlist-only update was deployed to the existing `feedback` function and read back as **ACTIVE, version 2, `verify_jwt: false`**. Its existing OIDC audience, workflow identity, private queue, validation and rate limits are not changed as part of the URL migration. No database schema or existing student data is changed, and no real feedback was submitted for testing.

## Formal home design

- The `CAMPUS · GALAXY` badge/box and the requested hero footnote are removed.
- One semantic `h1` has three intact Bengali typographic lines: a restrained lead, large emphasized word and smaller closing line. No per-letter markup or new external font service is used.
- The user's uploaded college photograph, galaxy layers, full/lite control, theme preference and distinct Bengali numeral font remain.
- `site/assets/editorial.css` contains the heading accents, home routine shortcuts and adjacent college portal cards. Its shared inclusion is owned by `scripts/site-shell.cjs`.

## Three separate study plans

- **`routine.html#science`**, **`routine.html#arts`**, **`routine.html#commerce`** each have their own subject-specific methods, five adjustable daily sessions and seven-day subject rotation.
- `data/study-routines.json` is the editable source. `scripts/study-routines.cjs` renders the plans and home/department shortcuts; `scripts/site-navigation.cjs` writes them to HTML. Subject and department contextual links go straight to the matching routine, while common subjects link to the choice page.
- These are **suggested personal preparation plans, not the college's official timetable or a verified syllabus**. The plan asks students to use only registered subjects, substitute unregistered options, rotate the two papers and retain breaks/sleep. Suggested sessions total 185 minutes excluding breaks; they can be shortened or moved around classes/travel.
- `study-routines.js` progressively enhances native hash links into tabs with Arrow Left/Right, Home, End, Space/Enter, selected state, roving focus and Back/Forward support. It makes no request and stores no preference or progress.
- Without JavaScript (or when that script is blocked), all three complete plans remain in HTML. Each weekly table has a caption, scoped headers and a labelled keyboard-scrollable region. Print CSS shows **all three** plans even when two are hidden on screen. The optional print button is labelled accordingly.

## Finite text animation

`site/assets/text-motion.js` gives most headings, paragraphs, list blocks and action text **one entrance per page visit** when they enter the viewport. It does not animate individual Bengali letters/conjuncts, timers, live regions, quiz results, interactive tracker rows, nonvisual headings or dense table cells. Text is never hidden while waiting for an observer, so failed scripts/APIs cannot leave an unreadable page.

- Full: at most **28 concurrent** block effects, 650 ms plus a bounded 0–275 ms stagger, 10–16 px translation and a short fade.
- Lite: at most **6 concurrent** effects, 260 ms, 3 px, no stagger, higher starting opacity. Dense excess blocks simply remain visible. Changing quality cancels unfinished text effects; later entrances follow the selected quality. The existing decorative particles remain animated in lite mode.
- OS reduced-motion wins and cancels/disables text motion; background tabs pause active effects. Page exit/printing cancels effects. Animations run once, use no persistent fill and add no frame loop, network, runtime dependency or new storage key.
- The existing **in-content** galaxy control governs both enhancements. No new menu control is added, and the existing `site:motion-paused` compatibility key is retained. Text settles; it never floats perpetually while being read.

## College portal and credentials

Home and college-info show the old `https://chugc.edu.bd/` beside **https://chugc.eshiksaems.com/**. The old site is tagged **এখন বন্ধ**, explicitly as user-reported current availability, not a permanent shutdown or automatic uptime result. Historical college-profile/source links and booklet facts remain attributed.

The new portal button opens the HTTPS login page in another tab with `noopener noreferrer`. There is **no embedded username/password, credential-bearing URL, login form proxy, iframe, session transfer or auto-login script**. A public static site cannot keep a shared password secret. Login and any password-manager autofill happen on the portal's own origin; the study site does not receive or store the password. No successful authenticated login is claimed.

## Regenerate and test

```bash
node scripts/site-shell.cjs
node scripts/site-navigation.cjs
node scripts/generate-sitemap.cjs
node scripts/breadcrumbs.cjs
node scripts/bangla-mcq.cjs --check
node scripts/offline-manifest.cjs site
node --test tests/*.test.cjs
```

With `site/` served at port 8765 and the existing Playwright/axe test dependencies installed:

```bash
node tests/study-routines-browser.cjs
node tests/text-motion-browser.cjs
node tests/galaxy-browser.cjs
node tests/bangla-mcq-browser.cjs
node tests/android-browser.cjs
node tests/web-linked-browser.cjs
node tests/accessibility-browser.cjs
```

Automated structure, navigation, print, motion and axe checks are not a claim of full manual accessibility or educational-content certification. No portal account or real feedback submission is needed for the tests.


## Accessibility follow-up

[Accessibility review](accessibility-review.md) records the heading/landmark/ARIA fixes, complex timetable relationships, keyboard-menu focus, safe tracker-storage failures and decoration/contrast layering. The existing two-sided credit content and its independent deadlines remain unchanged. Pull requests now run the complete regression/browser workflow, including all-page default axe rules and WCAG 2.2 target-size checks; inconclusive findings remain available for review rather than being suppressed.
