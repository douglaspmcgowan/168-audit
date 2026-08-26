# Task

## Goal

Ship the verified All-view hierarchy and align its design-language documentation with the deployed application.

## Active

- [~] Review and reconcile `DESIGN.md` and `MAP.md`, then commit, push, deploy, and verify production.

## Queue

<!-- Add required work extracted from the request here. -->

## Blocked

<!-- Record externally blocked work here. -->

## Needs decision

<!-- Record items requiring a user decision here. -->

## Completed

- [x] Confirmed `origin/main` at `94c0703` already contains the All-default hierarchy, compact spacing, selection semantics, and browser regression updates.
- [x] Applied read-only Modernize and Design Review passes; adoption findings remain outside this release.

## Verification

- Next: start the app on a clean port; run `npm.cmd run test:overview -- http://localhost:<port>`, `node tests/verify-live.mjs http://localhost:<port>`, and every remaining command in `VERIFY.md`; then push and verify `https://168-audit.vercel.app/` against the pushed commit.

<!--
Markers use a space for queued work, a tilde for active work, x for complete,
an exclamation mark for blocked work, and a question mark for decisions.
Required delegated work may be nested under its parent with agent provenance.
Optional discoveries belong in BACKBURNER.md.
Parallel mode applies to three or more independent, file-disjoint items.
-->
