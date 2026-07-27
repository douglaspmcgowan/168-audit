# 168 Audit — Design Review

Status: implemented in `codex/168-audit-redesign` and verified locally on 2026-07-25.

## Problem

The app already had strong calculation, history, export, and tutorial machinery. The primary audit opened as a dense two-pass worksheet. Mobile users faced twenty full cards, Compare repeated the same gap through several representations, Reflect displayed prompts that could conflict with the current totals, and local-data behavior was easy to miss.

The redesign centers the core job: describe the week you want, reconstruct the week you lived, understand the largest differences, and choose one change.

## Research

- Toggl frames a time audit as capture, categorization, analysis, and adjustment.
- Clockify demonstrates calendar-assisted reconstruction alongside direct time entry.
- Timely makes privacy boundaries explicit for automatic time capture.
- Typeform emphasizes keyboard operation, understandable labels, and accessible interaction patterns.
- GOV.UK recommends focused question pages and clear progress through longer form journeys.
- WCAG 2.2 adds guidance relevant to focus visibility, target size, and consistent help.

## Concepts explored

### Guided wizard

One question or category at a time creates a low-load first experience. It makes quick comparison and bulk editing expensive for returning users.

### Structured worksheet

Keeping every value visible supports expert speed and scanning. It produces a demanding first screen, especially on a phone.

### Guided worksheet — selected

Staged ideal and actual passes reduce simultaneous decisions. A combined expert view preserves speed, while mobile category navigation keeps the active task compact.

## What changed

- Reframed the product as Plan, Compare, Reflect, and History.
- Added staged ideal and actual passes plus a persistent combined expert view.
- Added one-category-at-a-time mobile navigation.
- Ranked comparison gaps and provided direct edit actions.
- Made distribution charts optional supporting detail.
- Adapted reflection prompts to the available data and added a concrete weekly commitment.
- Moved data controls into the application header and explained local storage.
- Added JSON backup and restore, payload limits, value sanitization, and corrupt-state recovery.
- Added ARIA tab behavior, focus management, keyboard operation, reduced-motion handling, stronger contrast, and 44 px controls.
- Added CSP nonces and defensive HTTP headers.

## Verification evidence

- Playwright exercises the full audit, compare, reflection, history, export, restore, share, tutorial, and profile paths.
- Viewports cover 1440 px desktop, 768 px tablet, 375 px iPhone, and 320 px narrow mobile.
- Automated accessibility checks report zero serious or critical findings in the tested baseline.
- Adversarial cases cover malformed local storage, structurally corrupt rows, hostile shared values, oversized shared payloads, dialog shortcut isolation, and narrow-layout overflow.
- The dependency audit reports zero known vulnerabilities.

## Next-level opportunities

- Calendar-assisted reconstruction with explicit privacy controls.
- Weekly baselines and follow-up prompts that show whether a commitment held.
- Scenario planning for moving hours between categories before changing the ideal plan.
- A printable, privacy-conscious summary for coaching or household conversations.
- Personal trend insights that remain traceable to the user’s own snapshots.
