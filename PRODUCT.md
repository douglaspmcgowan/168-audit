# Product

## Register

product

## Platform

web

## Users

Douglas McGowan himself, first — this is his own weekly-time-audit tool, built to replace a static table he was manually copying into a spreadsheet. Secondary audience: readers of his digital garden who land on the interactive version from the source note and want to run their own 168-hour audit without setting up a spreadsheet. Both are self-directed, one-off-to-weekly users doing quiet personal reflection, not a team or an audience being sold to.

## Product Purpose

Turn "168 hours in a week, planned vs. actual" from a read-only static worksheet into something you can actually use: edit every cell, watch totals update live against the 168h ceiling, compare an ideal week against a logged actual week side by side, keep a history of past weeks, and export the result. Success is a user completing one real audit of their own week and coming back the next week to do it again.

## Positioning

The static version made you copy a table into your own spreadsheet before it was useful; this one is already the spreadsheet, live, with plan-vs-actual comparison and history built in.

## Brand Personality

Quiet, precise, paper-and-ink — a personal worksheet, not a SaaS product. Calm confidence over cheerfulness; direct and legible over decorative. It should feel like a well-kept ledger, not a dashboard trying to sell you something.

## Anti-references

Not a productivity-SaaS landing page (no hero-metric tiles, no gradient CTAs, no marketing chrome). Not a gamified habit-tracker with streaks/badges/confetti — the tone is reflective, not motivational.

## Design Principles

- The 168-hour ceiling is the one number that always has to be legible and correct — every view reinforces it.
- Plan and actual are peers, always comparable, never one buried under the other.
- Every value is user-editable inline; nothing requires a settings screen to reach.
- Local-first and yours: no login, no server-side account, `localStorage` is the source of truth, export is a real escape hatch.
- Quiet by default, precise on demand — density and honesty over decoration.

## Accessibility & Inclusion

No stated WCAG level from the user; treat WCAG AA as the working bar (this is a solo/small-audience personal tool, not an enterprise product, but the existing test suite already checks contrast-adjacent concerns like light/dark themes and mobile down to 320px). Support `prefers-reduced-motion`. No other accommodations specified.

---
*Assumptions stated, not confirmed by interview — inferred from README.md, commit history, and the existing test suite per the operator's instruction to proceed without stopping for questions. Re-run `/impeccable init` (or hand-edit this file) if any of these miss.*
