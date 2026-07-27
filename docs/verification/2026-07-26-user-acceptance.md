# 168 Audit `/user` Acceptance Run

Date: 2026-07-26  
Target: `http://localhost:3168/?user-run=2`  
Claims source: `README.md`

## Isolation and surfaces

The tester received only the running URL and the README claims. It did not inspect source, tests, repository history, or implementation files. The tester was fresh and source-blind but belonged to the same model family as the implementation agents. CLI and MCP are N/A because the claimed product surface is the web application.

## Discovery

Without a feature list, the tester identified the app as a 168-hour weekly planning and audit tool. It completed an Ideal pass, switched to Actual, compared gaps, followed an Edit action back to the relevant field, completed reflection, saved weekly snapshots, and reviewed the unconfigured Center.

The initial guide made the workflow discoverable. Native browser download instrumentation was the only sustained friction.

## Kitchen-loop matrix

| ID | Claimed GUI capability | Verdict | Tier | Evidence |
|---|---|---|---:|---|
| C1 | Ideal, Actual, and Both planning modes | proven ×2 | 1 | Field visibility and independently retained values matched each mode in two runs. |
| C2 | Add, remove, rename, and reset rows/categories | proven ×2 | 1 | Row counts, renamed category state, removal, and restoration to 20 defaults were observed twice. |
| C3 | Ranked Compare gaps and direct correction | proven ×2 | 1 | Gap ordering changed with entered values; Edit returned to Plan and focused the relevant input. |
| C4 | Adaptive reflection and one weekly commitment | proven ×2 | 1 | Four prompt stages adapted to the audit and accepted a concrete commitment twice. |
| C5 | Snapshot history, comparison, journal context, deletion | proven ×2 | 1 | Labeled snapshots, comparison mode, Experiment context, and confirmed deletion were observed twice. |
| C6 | Export, share, print, and JSON restore | blocked-ambiguous | 2 | Restore and malformed-file recovery passed twice. Native download/share handoffs were visible but not observable through the tester’s browser transport. |
| C7 | Signed-out persistence and understandable recovery | proven ×2 | 1 | Edited values survived reload twice; malformed JSON produced a specific recovery message. |
| C8 | One-category mobile Plan at 375px and 320px | proven ×2 | 375px and 320px had zero horizontal overflow; category navigation focused the visible rows. |
| C9 | Keyboard, Help, theme, feedback, names, and focus | proven ×2 | Keyboard add-row, tutorial/shortcuts, theme switching, feedback focus, accessible names, and focus outline passed twice. |
| C10 | Center login, groups, and private week sharing | proven locally and live | The unconfigured Center explained privacy; configured desktop/mobile sessions then completed sign-in, group creation, invitation joining, sync, sharing, revocation, and member removal. |

All CLI and MCP cells are N/A: web-only product surface.

## Builder-side corroboration

The assembled Playwright suite passes after the final interface changes. It covers the Data menu, CSV action, JSON restore, share-link clipboard state, journal export invocation, print action availability, mobile layouts, accessibility, resilience, and security headers. Schema and configured-cloud persona suites also pass.

## Honesty self-check

A deliberate regression changed the mobile Data target from 44px to 48px. The full verifier turned red with `Data width: 48`. The regression was restored, the server restarted, and the full verifier returned green. This confirms the acceptance gate can reject damage to a proven requirement.

## Live Supabase corroboration

The safe host-scope probe found the existing Supabase access token without exposing its value. The isolated `claude-personal` project was restored, collision-checked, migrated, and verified through the Management API. The unrelated active project was left untouched.

The live authorization suite passes with six synthetic identities. It covers private reads and writes, explicit sharing, unrelated and other-group denial, invalid/expired/exhausted/revoked/concurrent invitations, direct-write attacks, role changes, ownership transfer, two authenticated clients editing one week, Auth-user and group cascades, and zero-residue cleanup.

The live Center suite passes in separate desktop and mobile browser contexts. It covers shared ideal/actual hours and notes, 320px and 375px containment, axe, offline join/save/share/unshare/removal/sign-out behavior, and cleanup.

## Follow-up complete-audit evidence

The assembled Playwright suite fills all 20 rows in both Ideal and Actual, reaches exactly 168 hours in each week, persists notes on separated rows, renders the completed data in number and slider modes, opens Compare, reloads, and confirms both totals and notes survived. The configured-cloud persona suite and the live two-browser suite both open a populated week shared by another member and verify ideal hours, actual hours, and notes.
