# Technical Audit — 168, Audit Your Week

**Scope**: `server.js` (single-file Express app, inline HTML/CSS/JS via `getCSS()`/`getJS()`/`buildPage()`), served at `http://localhost:3168`.
**Method**: Live Playwright driving (not static reading) at desktop 1440×900 and mobile 390×844, light + dark theme, keyboard-only navigation, measured touch targets, computed WCAG contrast ratios from the actual token values read live via `getComputedStyle` (not assumed from source), and targeted regression checks on every change listed in commit `8acb41a` ("Fix P1/P2 issues from impeccable critique + audit").
**Register**: product (personal tool). Per `PRODUCT.md`, WCAG AA is the stated working bar, `prefers-reduced-motion` support is required, this is a solo/small-audience tool (not enterprise), and the brand is explicitly "quiet, precise, paper-and-ink."
**Baseline**: Previous audit scored **15/20**. This is a fresh, independent re-run — findings below are re-verified live, not copied from the changelog.

---

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3/4 | `#whatIs` modal focus trap and `--ink-faint` contrast are both genuinely fixed — but the tour tooltip (`#tourTooltip`, also `role="dialog" aria-modal="true"`) still has **no** focus trap or initial focus; Tab escapes to worksheet inputs behind the overlay |
| 2 | Performance | 4/4 | Still zero external requests/fonts/images; `.bar-fill` now animates `transform:scaleX()` instead of `width`, removing a real (if minor) layout-thrash source |
| 3 | Responsive Design | 3/4 | 7 of 9 flagged touch targets are now genuinely 44×44px (verified live) — but `.viewmode-btn` is still 38.4px tall (`min-height: 2.4rem` vs. the `2.75rem` used everywhere else) and `.modal-close` was never touched (still 32×32px) |
| 4 | Theming | 4/4 | Donut/legend palette moved to `[data-theme]`-scoped `--slice-0..9` custom properties; verified computed contrast now clears 3:1 in light theme (3.20–3.31:1) and remains strong in dark (7.14–11.54:1) |
| 5 | Anti-Patterns | 4/4 | Still no AI-slop tells; the two side-stripe accent borders are gone and the reference-card grid is now a clean divided list — both verified visually with no regression |
| **Total** | | **18/20** | **Excellent (minor polish)** |

**Score delta: was 15/20 → now 18/20 (+3).**

---

## Anti-Patterns Verdict

**PASS — does not read as AI-generated.**

Re-verified at both viewports and both themes. The restrained, editorial, table-first aesthetic is intact and, if anything, slightly improved by this pass:

- The `.compare-callout` and `.prompt-card` side-stripe accent borders (the single most recognizable "AI dashboard" tell in the previous pass) are gone, replaced with a flat tint background + hairline. Screenshotted in both themes — reads clean, no regression, no new tell introduced (no gradient, no glow, no border creeping back in a different form).
- The "Reference: Recommended Categories" section is now a genuine single-column divided list (glyph + heading + bullets, separated by hairline rules) instead of six identical cards in a grid — this was an "absolute-ban" pattern per the project's own design rules, and it's now gone. Verified in both light and dark theme; text wraps correctly, no leftover fixed-width card artifacts.
- Still: real `<table>`/card-stack markup for the worksheet (not a decorative card-grid), system font stack, no gradient text, no hero-metric tiles, functional (not decorative) `backdrop-filter` blur limited to floating chrome (modal, tour tooltip, profile/export menus, sticky stats bar).
- Donut/legend palette (see Theming) is the one place color previously slipped outside the token system — that's now fixed too, so the "hard-coded array, dark-tuned, unchecked in light" pattern that was the closest thing to a slip is gone.

No new anti-pattern was introduced by this pass.

---

## Executive Summary

- **Audit Health Score: 18/20 (Excellent — minor polish)**, up from **15/20**.
- **Issues found this pass: 5 total** — 0 P0, 1 P1, 3 P2, 1 P3.
- **What's genuinely fixed** (verified live, not just per the changelog):
  1. `--ink-faint` now clears 4.5:1 against all three paper surfaces in both themes (light: 5.69 / 5.14 / 4.57:1 vs. `--paper`/`--paper-soft`/`--paper-deep`; dark: 5.92 / 5.54 / 5.06:1) — computed from the live `getComputedStyle` token values, not source-read hex.
  2. The `#whatIs` modal focus trap is real and correctly bidirectional: initial focus lands on `.modal-close`; Tab from the last focusable item wraps to the first; **Shift+Tab from the first item wraps to the last** (explicitly tested at the boundary, not just inferred); Escape closes and returns focus to the trigger (`#tourReplay`).
  3. Touch targets: `.theme-toggle`, `.tour-replay`, `.del-btn`, `.profile-chip`, `.input-mode-btn`, `#addSubBtn`/`#addCatBtn`, `.export-trigger` are all now genuinely 44×44px or better on mobile (measured live at 390×844).
  4. Donut/legend palette now passes WCAG 1.4.11 non-text contrast (≥3:1) against `--paper` in light theme (3.20–3.31:1, all ten slices) — previously 1.55–2.71:1, all failing.
  5. `.bar-fill` animates `transform:scaleX()`, not `width` — confirmed via live computed CSS (`transition: transform 0.4s var(--ease-out)`), removing the one real (if minor) layout-thrash source.
  6. The two side-stripe borders and the reference-card grid are gone with no visual regression (screenshotted both themes).
- **What is NOT actually fixed** (the two things worth flagging plainly):
  1. **The tour tooltip (`#tourTooltip`) still has the exact focus-trap bug the previous audit flagged for `#whatIs`, and it was never patched.** It shares the identical `role="dialog" aria-modal="true"` pattern. Live test: opening the tour leaves focus on `<body>` (no initial-focus placement at all), and Tabbing 15 times lands on `.input-mode-btn` in the worksheet toolbar — fully escaped, `insideTooltip: false`. The previous audit's own recommendation said "worth the same check" for this component; it wasn't done.
  2. **Touch targets are only 7/9 fixed, not 9/9.** `.viewmode-btn` got `min-height: 2.4rem` (38.4px) in the mobile media query while every other fixed control got `2.75rem` (44px) — looks like a typo/inconsistency in the same commit, not a different design decision (nothing else in the diff suggests intentional variance). `.modal-close` (the "×" that closes the very modal whose focus trap was just fixed) was not touched at all and remains 32×32px in all viewports — it wasn't in the commit's stated list of fixed controls.
- **Recommended next steps**: patch the tour-tooltip focus trap (reuse the exact `trapTab` pattern already written for `#whatIs`), bump `.viewmode-btn` to `min-height: 2.75rem` and give `.modal-close` a mobile-safe 44×44 hit area, then re-run.

---

## Detailed Findings by Severity

### P1 — Major

#### [P1] Tour tooltip (`role="dialog"`) has no focus trap or initial focus — same bug as the just-fixed modal, left unpatched
- **Location**: `server.js` — `#tourTooltip` markup (~line 166, `role="dialog" aria-modal="true" aria-labelledby="tourTitle" aria-describedby="tourBody"`); tour logic (`startTour`/paint functions ~line 3200+). Contrast with `initWhatIs()` (~line 3311-3342), which now has a correct `trapTab()` handler.
- **Category**: Accessibility
- **Impact**: Verified live: triggering the tour (`#startTourBtn` → `startTour(true)`) leaves `document.activeElement` on `<body>` — no focus is moved into the dialog at all. Tabbing repeatedly (15 presses) lands on `.input-mode-btn`, a worksheet toolbar control **behind** the tour overlay (`insideTooltip: false`). A keyboard user going through onboarding — arguably the highest-traffic `role="dialog"` surface in the app, since it's shown to every first-run user — has no reliable focus containment and can silently start editing worksheet inputs while the tour overlay is still showing.
- **WCAG/Standard**: WCAG 2.4.3 Focus Order (AA); same violation category as the now-fixed `#whatIs` finding.
- **Recommendation**: Extract the `trapTab`/initial-focus/return-focus logic already written for `#whatIs` into a small shared helper and apply it to `#tourTooltip` (and to `#tour`'s overlay container) on `startTour()`/`startTutorial()` open and on tour-step navigation (since the focused element inside the tooltip changes as steps advance — verify focus stays valid after `paint()` re-renders the tooltip content).
- **Suggested command**: `/impeccable harden`

### P2 — Minor

#### [P2] `.viewmode-btn` mobile touch target still under 44px — inconsistent with every other control fixed in the same commit
- **Location**: `server.js` line 1715, `@media (max-width: 720px) { .viewmode-btn { ... min-height: 2.4rem; } }` (contrast with `.theme-toggle`/`.tour-replay` at 2.75rem, lines 1716-1717, and `.input-mode-btn`/`.export-trigger`/`.del-btn`/`#addSubBtn`/`#addCatBtn` all correctly at 2.75rem)
- **Category**: Responsive Design
- **Impact**: Measured live at 390×844: the "App" view-mode button is **43×38px**, "Dashboard" is 85×38px — both under the 44px height floor. The parent `.viewmode-toggle` container is correctly 44px tall (line 1714), but the button's own hit area inside it is only 38.4px — so the visual chrome is right-sized but the actual clickable/tappable element is not. This reads as a one-line inconsistency (2.4rem where 2.75rem was clearly the intended value everywhere else in the same edit), not a deliberate design choice.
- **WCAG/Standard**: WCAG 2.5.8 Target Size (Minimum) — passes the AA 24×24 floor, but fails the 44×44 bar this audit is scored against (and that every sibling control in the same commit correctly hit).
- **Recommendation**: Change `.viewmode-btn`'s mobile `min-height` from `2.4rem` to `2.75rem` to match the pattern already used for every other control in this fix.
- **Suggested command**: `/impeccable adapt`

#### [P2] `.modal-close` (32×32px) was not included in the touch-target fix
- **Location**: `server.js` line 517-519, `.modal-close { width: 2rem; height: 2rem; ... }` — no `@media (max-width: 720px)` override exists for this selector anywhere in the stylesheet.
- **Category**: Responsive Design
- **Impact**: Measured live at 390×844: 32×32px, unchanged from before the fix pass. This is the close ("×") button for the very `#whatIs` modal whose focus trap was just hardened — the modal is now much more keyboard-accessible, but the mouse/touch close affordance is still under the 44px floor on the one viewport where fat-finger mis-taps matter most.
- **WCAG/Standard**: WCAG 2.5.8 Target Size (Minimum) — same as above, passes AA floor, fails the 44px bar.
- **Recommendation**: Add a mobile-scoped rule (or raise the base rule, since 44px would still look fine at desktop scale for a single icon-button) bumping `.modal-close` to at least 2.75rem × 2.75rem, consistent with `.theme-toggle`/`.tour-replay` which use the identical icon-button pattern already.
- **Suggested command**: `/impeccable adapt`

#### [P2] `ARIA role="menu"` widgets still lack Arrow-key navigation (carried over, unchanged)
- **Location**: `server.js` — `#exportMenu` (~line 112-118), `#profileMenu` (~line 74, populated ~line 2974-2986)
- **Category**: Accessibility
- **Impact**: Unchanged from the previous audit. Low-impact — items are real `<button>`s, fully Tab-reachable and Enter/Space-activatable — but the `role="menu"`/`role="menuitem"` pairing implies Arrow-key traversal per the ARIA APG Menu Button pattern, which isn't implemented.
- **WCAG/Standard**: ARIA Authoring Practices Guide, Menu Button pattern (not an independent WCAG success criterion — 2.1.1 Keyboard is already satisfied via Tab).
- **Recommendation**: Low priority; add if these menus grow past ~6 items.
- **Suggested command**: `/impeccable polish`

---

## Patterns & Systemic Issues

- **The fix commit applied its own pattern (raise to `2.75rem`) inconsistently.** 7 of the 9 controls it touched got exactly `2.75rem`; `.viewmode-btn` got `2.4rem`, off by the same margin every time (about 5.6px short). This is worth a quick "grep all `min-height`/`height` values touched in this diff and confirm they're all `2.75rem`" sanity pass rather than assuming the whole batch is uniform because most of it is.
- **A `role="dialog"` component was fixed in isolation rather than as a reusable pattern.** The previous audit explicitly flagged that the tour tooltip shares `#whatIs`'s `role="dialog"` pattern and deserved the same check; the fix instead wrote `trapTab`/focus-management logic inline inside `initWhatIs()`'s IIFE, scoped to that one modal, so it didn't generalize to the sibling component. Extracting a shared "trap focus inside this dialog element" helper the next time either surface is touched would prevent this from recurring a third time if more dialogs are added.
- **Everything that *was* systematically wrong (all ~35 `--ink-faint` call sites, all 10 `SLICE_COLORS` values) is now systematically right**, because both were fixed at the token/constant level rather than patched call-site-by-call-site. That's the correct pattern and it shows — no stray usage of the old hex values or the old hard-coded array remains.

---

## Positive Findings

- **The modal focus trap is correctly bidirectional, not just forward-only.** Explicitly tested the Shift+Tab-from-first-item boundary case (not just inferred from the forward case): focus wraps from `.modal-close` to the dialog's last button (`.btn.btn-primary`) on Shift+Tab, and back from that last button to `.modal-close` on Tab. Escape closes and correctly restores focus to `#tourReplay`, the original trigger.
- **`--ink-faint` now clears AA with real margin, not by a hair.** Worst case (light theme vs. `--paper-deep`) is 4.57:1 against a 4.5:1 requirement — tight but genuinely passing, and every other combination has more headroom (5.06–5.92:1 elsewhere).
- **The donut/legend fix was verified functionally, not just by contrast math**: filled real worksheet data and screenshotted the Compare view in light theme — all ten category colors and their legend swatches are visually distinguishable against the paper background, which wasn't true before.
- **Category/sub-category cell truncation is live and correctly synced**: typed a long category name into a worksheet cell, confirmed both the CSS (`text-overflow: ellipsis`) and the `title` attribute update to the new value on blur — no stale tooltip text.
- **The "Reference: Recommended Categories" restructure reads better than the card grid it replaced** — same content, single-column divided list with icon + heading + bullets, verified clean in both themes with no leftover fixed-width artifacts from the old grid.
- **No regressions anywhere else scanned**: mobile full-page screenshots (card-stack worksheet, Compare, Reflect) show no horizontal overflow (`scrollWidth === clientWidth === 390`), no broken layouts, no reintroduced side-stripe borders.

---

## Recommended Actions

1. **[P1] `/impeccable harden`**: Extract the `#whatIs` modal's `trapTab`/initial-focus/return-focus logic into a shared helper and apply it to `#tourTooltip` (`role="dialog"`), which currently has zero focus management — verified live, Tab escapes straight to worksheet inputs behind the tour overlay.
2. **[P2] `/impeccable adapt`**: Fix `.viewmode-btn`'s mobile `min-height` from `2.4rem` to `2.75rem` (server.js line 1715) to match every other control raised in the same commit.
3. **[P2] `/impeccable adapt`**: Give `.modal-close` a 44×44 hit area (currently 32×32px in all viewports, untouched by the touch-target fix) — same icon-button pattern already used correctly by `.theme-toggle`/`.tour-replay`.
4. **[P2] `/impeccable polish`**: Add Arrow-key navigation to `#exportMenu`/`#profileMenu` if/when they grow past their current item count (carried over, low priority).
5. **`/impeccable polish`**: Final pass once the above land, to catch any regressions the fixes introduce.

You can ask me to run these one at a time, all at once, or in any order you prefer.

Re-run `/impeccable audit` after fixes to see your score improve.
