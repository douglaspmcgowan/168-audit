# Task

## Goal

Ship the verified All-view hierarchy and align its design-language documentation with the deployed application.

## Active

<!-- Move the item currently being worked here. -->

## Queue

<!-- Add required work extracted from the request here. -->

## Blocked

<!-- Record externally blocked work here. -->

## Needs decision

<!-- Record items requiring a user decision here. -->

## Completed

- [x] Confirmed `origin/main` at `94c0703` already contains the All-default hierarchy, compact spacing, selection semantics, and browser regression updates.
- [x] Applied read-only Modernize and Design Review passes; adoption findings remain outside this release.
- [x] Fixed the review blockers for desktop Focus, narrow labels, 44px controls, tablet containment, and short-landscape tutorial geometry.
- [x] Pushed `99e2235`, deployed Vercel production `dpl_EqQsLcaaootcUv5HNtstFW2d2WMU`, and passed the focused plus complete production browser suites.

## Verification

- Evidence: `npm.cmd run test:overview -- https://168-audit.vercel.app` and `node tests/verify-live.mjs https://168-audit.vercel.app` both exited 0; the remaining non-credential checks in `VERIFY.md` passed.

<!--
Markers use a space for queued work, a tilde for active work, x for complete,
an exclamation mark for blocked work, and a question mark for decisions.
Required delegated work may be nested under its parent with agent provenance.
Optional discoveries belong in BACKBURNER.md.
Parallel mode applies to three or more independent, file-disjoint items.
-->
