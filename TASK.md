# Task

## Goal

Onboard the committed repository to the Pyrgos harness-v3 project contract without changing application source, runtime data, secrets, deployment state, or the stable checkout.

## Active

<!-- No active item. -->

## Queue

<!-- No queued item. -->

## Blocked

<!-- Record externally blocked work here. -->

## Needs decision

<!-- Record items requiring a user decision here. -->

## Completed

- [x] Read the stable project contract, task/state files, Git status, remotes, and worktrees before editing.
- [x] Created `C:\tmp\onboard-168-audit` from committed base `19750a8e2c286bdc2138921ac11a05c37fe006fe`; the dirty stable checkout remains out of scope.
- [x] Archived the completed legacy `WORK_QUEUE.md` and legacy `VERIFY.md` verbatim under `.agents/archive/pre-harness-v3/`; their completed obligations remain preserved.
- [x] Synchronized the project contract and vendored skill set from harness revision `61366c70604c1fa1fa42bc1bb61ee78b89a0096d`.
- [x] Replaced generated placeholders with repository-backed identity, commands, architecture, data-flow, integration, and ownership metadata.
- [x] Passed canonical `VerifyProject`, the installed project verifier, the value-free secret-manifest check, diff hygiene, and fully redacted Gitleaks history and worktree scans.
- [x] Passed dependency-free `node --check server.js` and `npm.cmd run test:schema`.
- [x] Prepared a harness-scoped commit; no application source, runtime data, credential values, deployments, or external services changed.

## Verification

- Current evidence: project verifiers passed; 10 value-free runtime names passed manifest synchronization; Gitleaks found no history or worktree leaks; syntax and schema contract passed.
- Dependency-bound browser/cloud suites were not rerun because `npm.cmd ci --offline` reported an uncached locked package. No network install was requested.
- Next: rerun the canonical project verifier, installed project verifier, secret-manifest check, staged diff check, and redacted Gitleaks scans before merge.

<!--
Markers use a space for queued work, a tilde for active work, x for complete,
an exclamation mark for blocked work, and a question mark for decisions.
Required delegated work may be nested under its parent with agent provenance.
Optional discoveries belong in BACKBURNER.md.
Parallel mode applies to three or more independent, file-disjoint items.
-->
