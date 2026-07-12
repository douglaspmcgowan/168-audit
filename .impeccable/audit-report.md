# Technical Audit — 168, Audit Your Week

**Scope**: `server.js` (single-file Express app, inline HTML/CSS/JS via `getCSS()`/`getJS()`/`buildPage()`), served at `http://localhost:3168`.
**Method**: Live Playwright driving (not static reading) at desktop 1440×900 and mobile 390×844, light + dark theme, keyboard-only navigation, measured touch targets, computed WCAG contrast ratios from the actual token values in `server.js`, and a targeted investigation of the one known-failing assertion in `tests/verify-live.mjs`.
**Register**: product (personal tool). Per `PRODUCT.md`, WCAG AA is the stated working bar, `prefers-reduced-motion` support is required, this is a solo/small-audience tool (not enterprise), and the brand is explicitly "quiet, precise, paper-and-ink" — anti-references call out SaaS hero-metric chrome and gamified flourish.
**Documentation-only pass.** Nothing in this report was fixed; all findings are as-observed on the running app.

---

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2/4 | Modal dialog has no focus trap; `--ink-faint` fails AA contrast (3.55:1) in light theme across ~35 usages |
| 2 | Performance | 4/4 | Zero external requests/fonts/images, `IntersectionObserver` used correctly, reduced-motion respected |
| 3 | Responsive Design | 2/4 | Nearly every primary mobile control (theme toggle, help, remove-row, view-mode toggle, add buttons, export trigger) is under the 44×44px touch-target minimum |
| 4 | Theming | 3/4 | Full light/dark token system works well; donut-chart categorical palette is a hard-coded, non-token constant that's "dark-mode tuned" and fails in light theme |
| 5 | Anti-Patterns | 4/4 | No AI-slop tells found — restrained ledger/table aesthetic, system font stack, functional (not decorative) blur, no gradient text, no hero metrics, no card grids |
| **Total** | | **15/20** | **Good (address weak dimensions)** |

---

## Anti-Patterns Verdict

**PASS — does not read as AI-generated.**

Screenshots at both viewports and both themes show a genuinely restrained, table-first, editorial layout that matches the stated "quiet, paper-and-ink" brand register:

- No gradient text, no gradient CTAs, no hero-metric tiles.
- No identical card grids — the worksheet is a real `<table>` with `<thead>`/`<tbody>`/`<tfoot>`, which is the correct structural choice for this content, not a card-grid default.
- No tiny-uppercase-tracked eyebrows scaffolding every section, no `01/02/03` numbered markers.
- System font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text"...`), not a generic AI-default (Inter/Poppins/Manrope).
- `backdrop-filter: blur()` appears on 5 floating-chrome surfaces (sticky stats bar, modal, tour tooltip, profile menu, export menu) — worth watching as the surface grows, but it's applied uniformly to overlay/floating chrome only (never to content cards), and `.impeccable/design.json` itself documents it as "functional legibility blur, not decorative glassmorphism." Screenshots back this up: nothing reads as a glass-card hero.
- Status colors (urgent/warn/good) are properly theme-tuned with *different* hex values per theme (not just opacity tweaks) — a sign of real design attention, not template defaults.

The one place color discipline slips is the donut-chart palette (see Theming finding below) — a single hard-coded array, not per-theme tokens — but it's a data-viz palette, not a "look," so it doesn't move the Anti-Patterns verdict.

---

## Executive Summary

- **Audit Health Score: 15/20 (Good — address weak dimensions)**
- **Issues found: 6 total** — 0 P0, 3 P1, 2 P2, 1 P3 (see baseline test-suite investigation below for a finding that resolved to "not a product bug")
- **Top issues**:
  1. The "What is 168?" modal (`#whatIs`) opens with no focus management and no focus trap — keyboard users can Tab straight through to worksheet inputs hidden behind the modal backdrop.
  2. `--ink-faint` (#8A847A light / #877C6B dark) is used for real body-scale text — footer, table headers, placeholders, sticky-bar labels — in ~35 places, and fails WCAG AA (4.5:1) against the light theme's `--paper` (3.55:1), `--paper-soft` (3.20:1), and `--paper-deep` (2.85:1).
  3. Touch targets are systemically undersized on mobile: theme toggle and help button are 34×34px, the row-remove `×` is 22×22px, and the view-mode toggle, profile chip, input-mode toggle, add-category/subcategory buttons, and export trigger all sit between 28–41px tall — all below the 44×44px WCAG 2.5.8 minimum.
  4. The donut-chart categorical palette (`SLICE_COLORS`) is a single hard-coded, non-token JS array explicitly commented "dark-mode tuned" — every one of its 10 colors fails WCAG 1.4.11 non-text contrast (3:1) against the light theme background (measured 1.55–2.71:1), hurting the Compare view specifically in light mode.
  5. **Baseline fact investigated**: the one pre-existing failing assertion in `tests/verify-live.mjs` ("sticky bar visible at top: true") is a **test-timing race, not a product bug and not a stale/inverted assertion** — see full writeup below.
- **Recommended next steps**: fix the modal focus trap and contrast issues first (both real WCAG AA violations), then address touch targets and the donut palette, then patch the test's scroll-wait assumption.

---

## Detailed Findings by Severity

### P1 — Major

#### [P1] Modal dialog has no focus trap or initial focus placement
- **Location**: `server.js` — `#whatIs` modal markup (~line 122), `initWhatIs()` IIFE (~line 3278-3288)
- **Category**: Accessibility
- **Impact**: The "?" (help/tour) button opens a `role="dialog" aria-modal="true"` modal with a visible backdrop (`rgba(0,0,0,0.55)` + `blur(4px)`), but `open()` only does `modal.hidden = false; document.body.style.overflow = "hidden"` — no `.focus()` call and no keydown handler constraining Tab/Shift+Tab. Verified live: after opening the modal, focus stays on the trigger button, and pressing Tab moves focus through `.theme-toggle`, all four `.view-tab`s, `#addSubBtn`, `#addCatBtn`, `.input-mode-btn`s, and worksheet `<input>`s — all of which are visually obscured behind the modal backdrop. A keyboard-only or screen-reader user has no reliable way to know where focus is, and can accidentally edit worksheet data while believing they're interacting with the modal. Escape does correctly close the modal (that part works).
- **WCAG/Standard**: WCAG 2.4.3 Focus Order (AA); ARIA Authoring Practices Guide "Dialog (Modal)" pattern (focus moves into the dialog on open, is trapped inside via Tab/Shift+Tab, and returns to the trigger on close)
- **Recommendation**: On open, move focus to the modal's first focusable element (or the close button) and install a keydown handler that wraps Tab from the modal's last focusable element back to its first (and Shift+Tab from first to last). On close, return focus to `#tourReplay`. Apply the same pattern check to any other `role="dialog"` surfaces if added later (the tour tooltip already uses `role="dialog"` too — worth the same check).
- **Suggested command**: `/impeccable harden`

#### [P1] `--ink-faint` fails WCAG AA contrast in light theme, used for real body text in ~35 places
- **Location**: `server.js` — token definition ~line 211 (`--ink-faint: #8A847A`), used at lines 338, 433, 495, 524, 636, 679, 681, 771, 783, 826, 879, 899, 1064, 1099, 1107, 1131, 1187, 1191, 1196, 1202, 1235, 1270, 1283, 1293, 1304, 1338, 1348, 1505, 1557, 1562, 1587, 1613, 1627, 1641, 1645, 1653, 1739
- **Category**: Accessibility / Theming
- **Impact**: Measured contrast (relative-luminance WCAG formula, using the token's actual hex values): `--ink-faint` (#8A847A) on `--paper` (#FAFAF7) = **3.55:1**; on `--paper-soft` (#F2EEE5) = **3.20:1**; on `--paper-deep` (#E7E1D5) = **2.85:1**. All fail the 4.5:1 AA minimum for normal text, and several usages are small (0.66–0.82rem) uppercase labels, which need the *higher* bar, not a lower one. This isn't decorative gray — it's the color for the footer/colophon credit line, `tfoot` totals label, the sticky stats-bar row, legend values, and (per the project's own `impeccable` skill guidance) **placeholder text in `.notes-input` and `.reflect-answer`**, which explicitly calls out placeholder-at-4.5:1 as "the single biggest reason AI designs feel hard to read." Dark theme is closer but `--paper-soft` still fails there too (4.27:1 vs 4.5:1 required; `--paper` itself passes at 4.56:1). This directly contradicts `PRODUCT.md`'s own stated WCAG AA bar.
- **WCAG/Standard**: WCAG 1.4.3 Contrast (Minimum), AA — text contrast must be ≥4.5:1
- **Recommendation**: Darken (light theme) / lighten (dark theme) `--ink-faint` until it clears 4.5:1 against all three paper surfaces it's actually painted on (`--paper`, `--paper-soft`, `--paper-deep`), or split it into two tokens — one for genuinely decorative/non-text use (carets, dividers) that can stay lower-contrast, and one for label/placeholder/footer text that must hit AA. Re-verify against `--paper-deep` specifically since that's the worst case (2.85:1 light / needs checking dark).
- **Suggested command**: `/impeccable harden`

#### [P1] Touch targets systemically undersized on mobile (390×844)
- **Location**: `server.js` — `.theme-toggle` (~line 384), `.tour-replay` (~line 80/823), `.del-btn` (~line 2095), `.viewmode-btn` (~line 77-78), `.profile-chip` (~line 69), `.input-mode-btn` (~line 2054-2055), `#addSubBtn`/`#addCatBtn` (~line 2049-2050), `.export-trigger` (~line 108)
- **Category**: Responsive Design / Accessibility
- **Impact**: Live measurement at 390×844 (mobile viewport):

  | Element | Measured size | Gap from 44×44 |
  |---|---|---|
  | `#themeBtn` | 34×34px | both axes |
  | `#tourReplay` (help "?") | 34×34px | both axes |
  | `.del-btn` (remove row, destructive) | 22×22px | both axes, worst offender |
  | `.viewmode-btn` | 85×28 / 43×28px | height |
  | `.profile-chip` | 182×34px | height |
  | `.input-mode-btn` | 172×30px | height |
  | `#addSubBtn` / `#addCatBtn` | 128×37 / 105×37px | height |
  | `.export-trigger` | 176×41px | height |

  This is nearly every primary chrome control in the masthead and worksheet toolbar. The worst case (`.del-btn` at 22×22, a *destructive* action) is the most consequential — mis-tapping it silently deletes a worksheet row. On a personal daily-use tool meant to be operated one-handed, this is a real day-to-day friction point, not a theoretical one.
- **WCAG/Standard**: WCAG 2.5.8 Target Size (Minimum), AA (24×24px floor) and the stricter 2.5.5 Target Size (Enhanced) convention of 44×44px this audit is scored against per the reference criteria
- **Recommendation**: Raise the tap area (via padding, not necessarily visual size, to preserve the "quiet" density) to ≥44×44px on all of the above, with `.del-btn` as the priority fix given its destructive, irreversible action. A hit-area technique (larger invisible padding/`::before` overlay) keeps the visual footprint compact while satisfying the target size.
- **Suggested command**: `/impeccable adapt`

### P2 — Minor

#### [P2] Donut-chart categorical palette is hard-coded and fails light-theme contrast
- **Location**: `server.js` — `SLICE_COLORS` constant (~line 2326), used at `colorFor()` (~line 2327-2330) for both the donut `stroke` fill (~line 2343) and the `.legend-swatch` background (~line 2374)
- **Category**: Theming
- **Impact**: Unlike every other color in the app (which flows through `[data-theme]`-scoped custom properties), the Compare view's donut/legend palette is a single JS array — the code comment literally reads `// Pleasant palette for category slices, dark-mode tuned.` Measured WCAG 1.4.11 non-text contrast against `--paper`: light theme ranges from **1.55:1** (#F2C56B) to **2.71:1** (#E07A97) — every one of the 10 colors fails the 3:1 minimum for graphical objects. The same array paints the 0.7rem legend swatches, so the legend key itself is hard to distinguish in light mode. Dark theme is fine (6.58–11.54:1) — confirming the palette really was tuned once, for one theme, and never re-checked for the other. This is the one place the app's otherwise-careful theming discipline breaks down, and it lands on the Compare view, which `PRODUCT.md` calls out as core ("Plan and actual are peers, always comparable, never one buried under the other").
- **WCAG/Standard**: WCAG 1.4.11 Non-text Contrast, AA (3:1 for graphical objects required to understand content)
- **Recommendation**: Move `SLICE_COLORS` into `[data-theme]`-scoped CSS custom properties (e.g., `--slice-1` … `--slice-10`) with separate light/dark values, tuned the same way `--urgent`/`--warn`/`--good` already are (those pass AA in both themes with theme-specific hex values, not just opacity changes — that's the right pattern to copy).
- **Suggested command**: `/impeccable colorize`

#### [P2] Baseline test failure investigated: "sticky bar visible at top" is a test-timing race, not a product bug
- **Location**: `tests/verify-live.mjs` lines 189-197 (assertion); root cause in `server.js` line 283 (`@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }`) interacting with `lastRow.scrollIntoView({ behavior: "smooth", block: "center" })` at `server.js` line 2296 (fired by the preceding "Add Subcategory + Add Category" test step)
- **Category**: Performance / Anti-Pattern (test hygiene) — doesn't map cleanly to Accessibility/Theming/Responsive, closest bucket is Performance (animation timing)
- **Impact**: Investigated per the task's request. The assertion itself is **correct and not inverted** — `beforeScroll === false ? ok(...) : fail(...)` is checking exactly what it should (sticky bar hidden at the top of the page). The failure is a genuine race: by the time this test step runs, the suite has already added two rows via `#addSubBtn`/`#addCatBtn`, each of which triggers `lastRow.scrollIntoView({behavior:"smooth", block:"center"})` deep in the (now 20+ row) worksheet. The test then calls `window.scrollTo(0, 0)` and waits only 350ms — but because `html { scroll-behavior: smooth }` is globally active (correctly gated behind `prefers-reduced-motion: no-preference`, which is Playwright's default), that plain `scrollTo` call itself becomes an animated scroll, not an instant jump. Reproduced in isolation:
  - Replaying the exact sequence (add row, add category, open/close export, `scrollTo(0,0)`, wait 350ms) shows `scrollY` still at **293px** at the 350ms mark, with the sticky bar correctly still showing `visible` (the masthead stats are genuinely still off-screen). Waiting an additional 1000ms settles `scrollY` to 0 and the sticky bar correctly clears.
  - Re-running the identical sequence with the browser context's `reducedMotion: 'reduce'` (which the app's own media query uses to force `scroll-behavior: auto`) makes `scrollTo(0,0)` land instantly, and the assertion passes on the first 350ms check.

  In other words: **the product's sticky-bar logic (`IntersectionObserver` on `#stats`, toggling `.visible`) is working exactly as designed in both cases** — it just needs the scroll to actually finish first. This also is not a "stale" assertion (nothing about the app changed to invalidate it) — it's a latent race that was probably passing reliably before rows/scroll-distance grew enough (or before the smooth-scroll CSS was added) to push the animated-scroll duration past the fixed 350ms wait.
- **WCAG/Standard**: N/A (test infrastructure, not a user-facing standard)
- **Recommendation**: Fix the test, not the app. Either (a) use `window.scrollTo({ top: 0, left: 0, behavior: "instant" })` in the test (bypasses the CSS `scroll-behavior` override, since the `behavior` option takes precedence), or (b) poll for `window.scrollY === 0` with a short interval instead of a fixed `waitForTimeout(350)`, or (c) construct the test's browser context with `reducedMotion: 'reduce'` globally (also makes the rest of the suite's animation-adjacent timing more deterministic). Option (a) is the smallest, most targeted fix.
- **Suggested command**: `/impeccable harden` (test/edge-case hygiene, closest available command — this is a test fix, so treat the recommendation as "the kind of pass that would catch this," not a literal design-system command)

### P3 — Polish

#### [P3] ARIA `role="menu"` widgets lack Arrow-key navigation
- **Location**: `server.js` — `#exportMenu` (~line 112-118), `#profileMenu` (~line 74, populated ~line 2974-2986)
- **Category**: Accessibility
- **Impact**: Minor deviation from the ARIA Authoring Practices "Menu Button" pattern — `role="menu"`/`role="menuitem"` implies Up/Down arrow-key traversal with a roving `tabindex`, which isn't implemented. In practice this is low-impact since the items are real `<button>` elements and remain fully reachable via Tab and activatable via Enter/Space — screen reader users get correct role/state announcements, they just don't get the arrow-key shortcut a native menu would offer.
- **WCAG/Standard**: ARIA Authoring Practices Guide, Menu Button pattern (not a WCAG success criterion on its own — Tab-reachability already satisfies 2.1.1 Keyboard)
- **Recommendation**: Low priority; only worth adding if these menus grow past their current 5-6 items. If addressed, add Arrow Up/Down handling scoped to the open menu's `menuitem`/`menuitemradio` children.
- **Suggested command**: `/impeccable polish`

---

## Patterns & Systemic Issues

- **`--ink-faint` is the one token that breaks an otherwise disciplined system.** Every other semantic color (`--ink`, `--ink-soft`, `--accent`, `--urgent`/`--warn`/`--good`) passes AA in both themes with real theme-specific hex values. `--ink-faint` alone was tuned for "looks quiet" rather than "passes AA," and because it's reused ~35 times for real text (not just hairline dividers or truly decorative marks), the gap shows up everywhere at once — footer, table headers, both empty-state placeholders, and the sticky stats bar. Fixing the one token fixes all ~35 call sites simultaneously.
- **The theming system is token-based everywhere except one hard-coded array.** `SLICE_COLORS` is the single place in the codebase that picks colors outside the `[data-theme]` custom-property system, and it's also the single place that fails light-theme contrast — the two facts are the same root cause. This is worth flagging as a "if it's not a token, check its contrast in both themes before shipping" process note.
- **Touch targets undersized specifically in the *masthead/toolbar chrome*, not the worksheet cells.** The worksheet's own `<input>` cells (num-input, cell-cat, cell-sub) are reasonably sized (112×35 and similar); it's the surrounding UI chrome — buttons that were probably sized to match a tight desktop toolbar rhythm — that didn't get a mobile-specific bump. That's a single, fixable pattern (raise chrome button min-height/tap-padding at the `@media (max-width: 720px)` breakpoint that already exists for other rules), not 8 unrelated one-offs.

---

## Positive Findings

- **Genuinely restrained, on-brand visual design.** Real `<table>` markup for the worksheet (not a card-grid substitute), no gradient text, no hero-metric tiles, no eyebrows, system font stack. This is one of the cleaner "doesn't look AI-made" results this skill's audit checks for.
- **Theme-aware status colors done right.** `--urgent`/`--warn`/`--good` use genuinely different hex values per theme (not just alpha tweaks) and all six variants (3 semantic colors × 2 themes) pass AA comfortably (5.0–8.9:1) — this is the pattern the donut palette (P2 finding above) should be copied onto.
- **Logical, complete keyboard tab order on the primary worksheet flow.** Verified by walking Tab from `<body>`: profile chip → view-mode toggle → help → theme toggle → view tabs → toolbar buttons → input-mode toggle → worksheet cells, in reading order, with no dead zones or skips.
- **Focus-visible is systematic, not ad hoc.** A single base rule (`:where(a, button, input, label):focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }`) plus per-component refinements for inputs (`outline-offset: 0` + background swap so the outline reads clearly against the paper texture). Verified live: outline color/contrast is clearly visible in both themes.
- **`prefers-reduced-motion` is genuinely wired up**, not just present as a token — `scroll-behavior: smooth` is correctly *scoped inside* `@media (prefers-reduced-motion: no-preference)` rather than applied unconditionally, and the `reduce` branch zeroes out animation/transition duration globally. (This is also exactly what made the P2 test-timing investigation above conclusively solvable — turning on `reducedMotion: 'reduce'` fixed the race immediately, proving the media query does what it claims.)
- **No performance red flags.** Zero external network requests, no web fonts, no raster images (only two tiny inline data-URI SVGs for grain texture), scroll-driven UI uses `IntersectionObserver` rather than scroll-event listeners (avoids layout thrash by construction), and no read/write interleaving in loops that would force synchronous reflow.
- **Semantic landmarks and live regions are correctly used**: one `<header>`, one `<nav role="tablist">`, one `<main>`, one `<footer>`; `aria-live="polite"` on both the stats summary and the toast notification region.

---

## Recommended Actions

1. **[P1] `/impeccable harden`**: Fix the `#whatIs` modal's missing focus trap and initial-focus placement (move focus in on open, wrap Tab/Shift+Tab inside the dialog, return focus to `#tourReplay` on close). Check the tour tooltip's `role="dialog"` for the same gap while in there.
2. **[P1] `/impeccable harden`**: Re-tune `--ink-faint` (both themes) until it clears 4.5:1 against `--paper`, `--paper-soft`, and `--paper-deep` everywhere it's used for real text — or split decorative uses (carets, dividers) from text uses (footer, labels, placeholders) into two tokens.
3. **[P1] `/impeccable adapt`**: Raise mobile tap areas to ≥44×44px on `.theme-toggle`, `.tour-replay`, `.del-btn` (priority — destructive action), `.viewmode-btn`, `.profile-chip`, `.input-mode-btn`, `#addSubBtn`/`#addCatBtn`, and `.export-trigger`.
4. **[P2] `/impeccable colorize`**: Move `SLICE_COLORS` into theme-scoped custom properties with light/dark-specific values, verified against `--paper` in both themes (copy the pattern already used correctly for `--urgent`/`--warn`/`--good`).
5. **[P2] Fix `tests/verify-live.mjs` directly** (not a design command — a one-line test fix): change `window.scrollTo(0, 0)` at line 190 to `window.scrollTo({ top: 0, left: 0, behavior: "instant" })`, or poll for `scrollY === 0` before asserting.
6. **[P3] `/impeccable polish`**: Add Arrow-key navigation to `#exportMenu`/`#profileMenu` if/when they grow past their current item count.
7. **`/impeccable polish`**: Final pass once the above land, to catch any regressions the fixes introduce.

You can ask me to run these one at a time, all at once, or in any order you prefer.

Re-run `/impeccable audit` after fixes to see your score improve.
