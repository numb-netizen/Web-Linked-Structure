# Accessibility review and regression coverage

## Scope and findings

This review covers all **35 navigable HTML pages**, including the retired compatibility notices, plus the standalone, script-free Bangla MCQ sheet. Search-engine verification files and the immediate `/site/` redirect are not treated as content pages. The redirect's no-JavaScript root link and fragment/query preservation are covered separately.

The initial mobile audit used **all default axe-core 4.10.3 rules**, not only WCAG-tagged rules. It flagged 42 nodes across heading order, nested complementary landmarks, repeated landmark names and an HTML/ARIA role mismatch. Heading-order and landmark best-practice findings should not all be described as WCAG failures.

### Changes made

- **Headings:** shared related-page navigation now has a nonvisual level-two heading, with its group headings beneath it. The footer has its own nonvisual level-two heading and level-three column headings. Their existing visible appearance is retained; nonvisual headings are excluded from text animation.
- **Landmarks and names:** the Android installation note and Bangla playlist card use appropriate named note/group roles instead of complementary landmarks nested inside other landmarks. Named home-page groups now have roles that actually permit accessible names. Scrollable source images/tables have distinct, content-specific names.
- **Study plans:** a generic, named region can legally become a tab panel; an `article` could not. Each daily/weekly subregion also includes its department in its accessible name, so the three-plan no-script/blocked-script fallback has distinguishable landmarks. Native hash links, keyboard tab behavior, print-all and history navigation remain intact.
- **Complex class timetable:** explicit `id`/`headers` relationships identify the applicable day, class, department and time. Shared three-department lessons identify the class rather than incorrectly suggesting only the first department; break cells apply to the whole day. Only a day, not each class within that day, uses `scope="rowgroup"`. Source text, times, subjects and cell spans are unchanged.
- **Mobile keyboard navigation:** opening the disclosure enters its links instead of leaving focus after them in DOM order. Escape returns to the disclosure button. Moving focus outside the nonmodal navigation closes its overlay without trapping or moving focus back.
- **Blocked tracker storage:** denied storage access, failed reads/writes or failed reset enumeration no longer abort keyboard/ARIA setup or live progress calculations. Checking items still works on the current page. One visible `role="status"` warning explains that persistence is unavailable/unreliable; this does not promise cross-page saving. Existing `hsc2027:` keys and unrelated theme/preferences are preserved.
- **Photo/decoration contrast:** rendered-background sampling identified bright decorative stars above the mobile hero's text-protecting overlay. The decorative sky is now graded *below* that overlay. The uploaded photograph, theme, full/lite animation budgets and OS reduced-motion precedence are retained. The sky/overlay stacking relationship has static and browser regressions.
- **Caching:** changed shared styles/scripts have updated asset versions and offline hashes, so previous cached shell assets do not hide the fixes.

No accessibility overlay/menu, account, external font, analytics, extra storage key or backend dependency was added.

## Automated checks

`node --test tests/*.test.cjs` includes the semantic regressions in `tests/accessibility.test.cjs` as well as existing content, privacy, deployment and generator checks.

The primary browser suite, `tests/accessibility-browser.cjs`, runs **156 audits**:

| Coverage | Audits |
| --- | ---: |
| All 35 content pages × 390/1440 CSS px × light/dark, with disclosures open | 140 |
| Standalone MCQ sheet at 320/1440 px | 2 |
| Open keyboard navigation at 320/720 px | 2 |
| Tracker with storage getter/read/write/enumeration failures | 4 |
| Two-sided footer credits at 320/390/768/1440 px × light/dark | 8 |

Every audit uses the **default axe rules plus the WCAG 2.2 `target-size` rule**, without suppressing the original findings. The suite additionally checks:

- first-focus skip links and main-content focus on all pages at 320, 720 and 1440 CSS px;
- visible keyboard focus, menu entry/Escape/tab-out, checkbox Enter/Space and keyboard panning of actually wide tables/source images;
- all-page 320 px reflow, including line-height/letter/word/paragraph-spacing overrides;
- actual JavaScript-disabled navigation/readability for all 35 pages at 320 px, all three study plans and the 130-question sheet;
- storage failures without script errors or deletion of unrelated storage;
- equal two-sided credit layout, independent expiry deadlines, no-JS and blocked-script/storage fallbacks.

The viewport checks exercise zoom-equivalent **CSS reflow widths**, not a claim that every browser's native zoom or text-only zoom has been manually tested.

Three interactive suites also use default axe plus target-size rules: **Bangla MCQ (17 audits)** for setup/running/confirmation/results/fallback states, **study routines (14)** including the unenhanced three-plan fallback, and **galaxy controls (8)** for full/lite and light/dark. That is **195 automated audits** across these four suites. All **seven** browser suites remain part of CI: Android presentation, web-linked navigation, galaxy, text motion, study routines, Bangla MCQ and accessibility.

The website test workflow runs on relevant **pull requests and pushes**, has a 20-minute limit, and uploads the primary accessibility report for seven days, including inconclusive findings. No real portal login, student submission or feedback queue delivery is needed for these tests.

### Run locally

Serve `site/` at port 8765. Install test-only dependencies outside the runtime site:

```bash
npm install --prefix .cache/study-tools --no-save --no-package-lock playwright-core@1.56.1 axe-core@4.10.3
node --test tests/*.test.cjs
NODE_PATH="$PWD/.cache/study-tools/node_modules" \
  A11Y_REPORT=.cache/accessibility-report.json \
  node tests/accessibility-browser.cjs
```

Set `CHROME_PATH` if Chrome is not at `/usr/bin/google-chrome`. Run the other six `tests/*-browser.cjs` entry points as listed in the workflow. Generated reports, browser binaries and screenshots belong in ignored `.cache/`, not the published site.

## Contextual visual checks and remaining limits

Axe returns **inconclusive** contrast checks for some photo/gradient/pseudo-element backgrounds or clipped/off-screen table cells. These are retained for review, not counted as passes or silently disabled. The footer's standalone logo/wordmark also produces an inconclusive link-in-text-block check; it is visually separate from body text and keeps a visible keyboard focus indicator.

The home hero, navigation and college-photo heading were inspected at 390 and 1440 px in both themes. A supplementary rendered-image check sampled the actual text/glyph positions against the same background with text transparent, excluding the decorative underline. Across **212 sampled text regions in eight captures**, the minimum measured contrast after moving the sky under the overlay was **4.69:1**. This is a bounded render/sample result, **not proof of every possible animated frame, image, display or page background**.

Automated checks do not establish full WCAG conformance or replace testing with real users, screen readers (for example NVDA, VoiceOver or TalkBack), high-contrast settings, native browser/text zoom and real devices. No native Android SDK/JDK build or new APK was performed in this environment. Educational/source accuracy and authenticated college-portal behavior are separate concerns.
