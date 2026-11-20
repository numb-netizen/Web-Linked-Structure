# Selective website-content update from Temp

## Pinned source

Compared the public website files in [`numb-netizen/Temp`](https://github.com/numb-netizen/Temp) at **[`933cbabcfacc307b2681a3c4baf703786c9c7dad`](https://github.com/numb-netizen/Temp/commit/933cbabcfacc307b2681a3c4baf703786c9c7dad)** with the current working copy. This is a selective, reviewed content update, **not a merge, full mirror or continuous sync**. It does not modify the source repository.

The source archive/comparison scratch files stay in ignored `.cache/temp-sync/`, not the public site or Git history. The code and scripts from that archive were not executed.

## Imported

1. **Civics first paper, first chapter — পৌরনীতি ও সুশাসন পরিচিতি.** The source's [class-link change](https://github.com/numb-netizen/Temp/commit/135b1a1f77a9) adds **https://youtu.be/7PIx8szWEz4**, labelled Unique e School / মিসকাত স্যার. `civics.html#civics-introduction` now offers this as a native external link beside chapter **`civics:0`**. It is a sibling of the checkbox, not nested inside it, so clicking or pressing Enter on the video cannot change saved progress. The matching `classes.html#class-civics` resource also exposes the lesson while retaining general YouTube search and the reciprocal subject link. New-tab links use `noopener noreferrer`; no player, third-party script or automatic video request is embedded. The lesson's educational completeness/accuracy was not independently audited.
2. **Remove obsolete list-change boxes on eight subjects.** The source's [change-note cleanup](https://github.com/numb-netizen/Temp/commit/0857f1b2f63a) removes historical “what was added/corrected and which ticks were retained” notes from **physics, chemistry, math, biology, accounting, business, finance and marketing**. The same boxes are removed here. Chapter text, order, stable IDs, totals, actual syllabus-scope warnings and NCTB/board-source links remain. Notes about still-unverified humanities topics are not removed.

## Already current / deliberately retained

- Science/business chapter lists, the English second-paper topic list, college profile, teachers, photographed class routine, honours information and the parents' meeting notice already match the relevant source content. They were not overwritten just to produce a diff. This is not a new official-syllabus certification.
- This site's reciprocal web-linked navigation, uploaded campus photo, formal/galaxy design, accessible motion control, three department study routines, `https://chugc.cc.cd` root deployment and external college portal remain.
- The existing **130-question / 26-chapter offline Bangla MCQ** and its exact one-shot playlist/button remain. Temp's separate `mcq-test.html`, question batches, per-question timing, answer-lock rules and online exam service are **not** imported. No Google Sheet or database is changed by this content sync.
- Local corrections **লালসালু = উপন্যাস (`bangla:11`)** and **সিরাজউদ্দৌলা = নাটক (`bangla:36`)** are kept; the source snapshot still has those two genres reversed.
- Temp's Microsoft Clarity analytics, external font-service loading, old domain, old navigation/design/animation behavior and legacy study routine are not imported. No credentials, login/session integration, feedback deployment, native build or new backend is added.

## Validation

- `tests/temp-content-sync.test.cjs` guards the precise changes, unchanged chapter/quiz identities and source-import boundaries. Existing science/commerce tests continue checking textbook order and tracker equivalence; the old assertion for a deleted science change-note is replaced with checks that the syllabus disclaimer and board source remain.
- `tests/web-linked-browser.cjs` checks the external lesson's keyboard/new-tab behavior, saved-progress isolation, classes-directory round trip, responsive layout and no-JavaScript link.
- `tests/accessibility-browser.cjs` includes civics in mobile/desktop and both-theme axe checks.
- Re-run navigation/MCQ/sitemap/breadcrumb consistency checks, regenerate `site/offline-manifest.json`, and run the Node/browser tests before publishing. Video navigation is tested against an intercepted local test response, without fetching YouTube or submitting any data.

Local validation completed: **164/164 Node regression tests passed**; the web-linked, Android-context, finite text-motion and accessibility browser suites passed. The accessibility suite now covers **60 targeted audits**, with **8 additional final lesson/link audits** at 320/1440 px in light/dark themes after replacing font-dependent arrow glyphs with local SVG icons. Source/quiz/sitemap/breadcrumb generation checks and whitespace validation passed; the offline manifest contains 112 resources. Automated checks are not a full manual accessibility or educational-content certification.

The per-update comparison also confirmed that the existing chapter markup is unchanged and that the home, three study plans, Bangla MCQ, tracker, portal and uploaded-background files remain byte-for-byte identical to the pre-sync working copy.

These content edits are part of the current working branch. Updating files does not itself merge them into `main`, publish a Pages deployment or update installed apps.
