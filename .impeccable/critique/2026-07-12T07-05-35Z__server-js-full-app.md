---
target: server.js (full app)
total_score: 30
p0_count: 0
p1_count: 4
p2_count: 2
timestamp: 2026-07-12T07-05-35Z
slug: server-js-full-app
---
Method: dual-agent (A: design-review sub-agent · B: detector/browser-evidence sub-agent), synthesized with a third independent technical audit (a11y/perf/responsive/theming/anti-patterns, scored separately).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Toasts + undo confirm destructive actions; sticky stats bar always visible |
| 2 | Match System / Real World | 3 | "TC" abbreviation in God Time category is unexplained jargon |
| 3 | User Control and Freedom | 3 | Undo on row-delete, Esc closes everything; no undo for individual value edits |
| 4 | Consistency and Standards | 3 | Strong token system; table→card responsive transform is genuinely consistent |
| 5 | Error Prevention | 3 | Inputs auto-clamp 0–168 and round to quarter-hours; slider has explanatory aria-label |
| 6 | Recognition Rather Than Recall | 2 | Sub-category labels truncate mid-word, no ellipsis/tooltip |
| 7 | Flexibility and Efficiency | 4 | Full keyboard shortcut layer, multi-select + bulk delete, Numbers/Sliders toggle |
| 8 | Aesthetic and Minimalist Design | 3 | Undercut by the identical reference-card grid and un-privileged TARGET number |
| 9 | Error Recovery | 2 | Out-of-range numbers silently clamp with no inline explanation |
| 10 | Help and Documentation | 4 | "?" modal has purpose explanation, shortcut table, quick tour, full tutorial |
| **Total** | | **30/40** | **Good — solid foundation, address recognition + error feedback** |

Technical audit (separate 0-20 scale, 5 dimensions): **15/20, Good.** Accessibility 2/4, Performance 4/4, Responsive 2/4, Theming 3/4, Anti-Patterns 4/4 (audit's own scoped check; detector evidence below adds findings audit's holistic pass didn't independently flag).

## Anti-Patterns Verdict

**Not AI slop, with concrete exceptions.** The Reflect tab's copy is genuinely idiosyncratic and personal (contrasting Sabbath reflection prompts back-to-back) — the single strongest piece of evidence against a generic-AI read. Color strategy is deliberate: `--paper` (#FAFAF7, chroma-0) judged an earned choice tied to the paper-worksheet metaphor, not a reflexive AI cream-default (see DESIGN.md). System font stack, real `<table>` markup, no gradient text, no hero-metric tiles.

**Deterministic scan (detect.mjs) — 3 findings, 0 false positives after live verification:**
- Two **side-tab accent borders** (the single most recognizable AI-UI tell per impeccable's own registry): `.compare-callout { border-left: 3px solid var(--accent) }` (Compare tab, 1 instance) and `.prompt-card { border-left: 3px solid var(--accent-line) }` (Reflect tab, 9 instances — one per prompt). Confirmed live: decorative callout-box pattern on plain text, not a semantically load-bearing rule.
- One **layout-thrashing transition**: `.bar-fill { transition: width 0.4s }` on the ideal/actual comparison bars — recomputes layout on every hours-cell edit; `transform: scaleX()` avoids the reflow.

**LLM assessment adds one more ban hit the detector doesn't check for:** the Reflect tab's "Reference: Recommended Categories" section is 6 uniformly-sized cards (emoji + heading + bullet list) in a grid — a textbook "identical card grids" hit, ironic given it sits right next to the app's most distinctive, non-generic content.

## Overall Impression

A real personal tool, not a template fill — the voice, the keyboard-power-user investment, and the deliberate color strategy all read as intentional. The two systems working against each other: a genuinely disciplined design-token system (`--ink-faint` aside) undercut by one token that quietly fails contrast everywhere it's used, and a restrained layout undercut by scaffolding (the reference-card grid, the two side-stripe callouts) that doesn't match the specificity of the content it's decorating.

## What's Working

1. **Voice-first content.** The Reflect tab prompts are unmistakably one person's — protect this, it's the strongest asset.
2. **Power-user investment is real.** Full keyboard layer, multi-select + bulk delete, genuinely serves the "come back weekly" goal — not decorative.
3. **Real responsive redesign.** Table genuinely re-flows into stacked cards on mobile; no horizontal scroll at 320px.

## Priority Issues

**[P1] `--ink-faint` fails WCAG AA contrast, used for real text in ~35 places** — Root cause tying together three independently-found symptoms: Assessment A's placeholder-text finding, Assessment B's `th` header finding (3.55:1), and the audit's systemic sweep (footer, sticky-bar labels, legend values). Light theme: 3.55:1 on `--paper`, 3.20:1 on `--paper-soft`, 2.85:1 on `--paper-deep` — all fail the 4.5:1 floor. One token fix repairs every call site. → `/impeccable harden`

**[P1] Modal (`#whatIs`) has no focus trap or initial focus placement** — Keyboard/screen-reader users can Tab through to worksheet inputs hidden behind the backdrop; no way to know where focus is. Escape-to-close works; entry doesn't. → `/impeccable harden`

**[P1] Mobile touch targets systemically undersized** — `.del-btn` (22×22px, destructive action) is the worst offender; theme toggle, help, view-mode toggle, profile chip, input-mode toggle, add buttons, export trigger all sit under the 44×44px WCAG 2.5.8 floor. → `/impeccable adapt`

**[P1] Two side-stripe accent borders + one identical card grid** — `.compare-callout` and `.prompt-card` (9 instances) hit impeccable's own "most recognizable AI-UI tell" ban; the Reference: Recommended Categories section hits the "identical card grids" ban. → `/impeccable quieter` + `/impeccable distill`

**[P2] Sub-category labels truncate mid-word with no ellipsis or tooltip** — Confirmed visually ("Eating Alone / Housekee…"); undercuts the stated "every value is user-editable inline" principle since you can't read the value before editing it. → `/impeccable layout`

**[P2] Donut-chart palette (`SLICE_COLORS`) is hard-coded, non-token, and fails light-theme contrast** — The only color source bypassing the `[data-theme]` system; 1.55–2.71:1 in light mode vs. the 3:1 non-text minimum. → `/impeccable colorize`

## Persona Red Flags

**Sam (Accessibility-Dependent)**: `--ink-faint` contrast failure directly hits Sam's stated 4.5:1 need; `.del-btn` at 22×21px compounds risk for reduced dexterity; modal focus trap gap breaks the keyboard-only flow Sam depends on.

**Casey (Distracted Mobile)**: Export FAB overlaps scrolling card content mid-page; undersized delete button sits directly next to the number fields Casey is tapping one-handed; a 4-second undo window is tight if she's interrupted right after a mis-tap.

**Alex (Power User)**: mostly well served (full shortcuts, bulk actions, skippable one-time tour) — only friction is the first-run modal's hard pointer-block with no click-outside dismiss, a minor one-time cost.

**Project-specific — "the digital-garden reader" (secondary user per PRODUCT.md)**: a one-off visitor with no shared vocabulary or faith framing as Douglas. "TC" in the God Time category hint is unexplained shorthand meaningful only to the primary user. Named as context, not necessarily something to fix — PRODUCT.md is explicit this is Douglas's own tool first.

## Minor Observations

- Export menu (6 flat items) has no internal grouping; file-format exports vs. share/print are a different category of action.
- Emoji-as-icon usage sits in mild tension with the stated "quiet... not gamified" brand personality.
- Silent value-clamping (300 → 168) with no inline explanation could read as a bug on first encounter.
- The `.selected` row's `inset 3px 0 0 var(--accent)` box-shadow visually echoes the banned side-stripe pattern, though it's a functional selection-state indicator rather than decorative — judged acceptable, flagged for awareness.
- TARGET (168h, the fixed constant) shares identical type weight with IDEAL/ACTUAL (the numbers being filled in), despite PRODUCT.md naming the 168h ceiling as the number that "always has to be legible."

## Questions to Consider

- If the 168-hour ceiling is truly the one number that always has to be legible, what would make TARGET visually unmistakable as the fixed anchor rather than a peer stat?
- The Reflect tab's copy is the most distinctive part of the app — what would its scaffolding look like if it matched that specificity instead of defaulting to a card grid?
