# 168 Audit Completion Audit

Date: 2026-07-26  
Branch: `codex/168-audit-redesign`  
Live target: isolated `claude-personal` Supabase project

## Requirement evidence

| Requirement | Authoritative evidence | Result |
|---|---|---|
| Written interface plan and spec | `docs/superpowers/plans/2026-07-25-interface-distillation.md`; matching spec | Pass |
| Written multi-user plan and spec | `docs/superpowers/plans/2026-07-25-multi-user-center.md`; matching spec; every checklist item closed | Pass |
| Simple complete audit | Full 20-row Ideal and Actual journey reaches 168 hours, saves notes, switches number/slider modes, opens Compare, and survives reload | Pass |
| All application sections | Plan, Compare, Reflect, History, Center, Schedule dialogs, Data menu, Help, feedback, import/export, and snapshots in `test:local` | Pass |
| Multi-user login and personal weeks | Live configured server; separate authenticated browser contexts; sync through `save_audit_week` | Pass |
| Create and join groups | Live owner creates a group and invitation; live member joins through the Center | Pass |
| View another member's week | Live member opens an explicitly shared week and reads Ideal, Actual, and note data | Pass |
| Private-by-default sharing | Six-person RLS suite proves private reads, explicit share, unshare, removal, other-group denial, and unrelated denial | Pass |
| Invitation safety | Invalid, expired, exhausted, revoked, replayed, and concurrent single-use cases | Pass |
| Role lifecycle | Owner, admin, member actions; promotion; removal; ownership transfer; leave/delete UI contracts | Pass |
| Mutation defenses | Guessed UUID, role escalation, owner-column assignment, direct membership write, reader update/delete/re-share | Pass |
| Concurrent editing | Two independently authenticated owner clients edit one week; stale write returns `PT409` | Pass |
| Database lifecycle | Auth-user and group deletion cascade checks; post-run zero-residue assertions for users, profiles, weeks, groups, memberships, invitations, and shares | Pass |
| Offline behavior | Live UI covers join, disabled save, share, unshare, removal, and device sign-out while offline | Pass |
| Responsive interfaces | 1440, 1280, 768, 495, 375, 320, portrait, landscape, 200% browser zoom, and 200% text zoom | Pass |
| Accessibility | Keyboard tabs, focus return/containment, screen-reader semantics, reduced motion, high-contrast path, 44px Center targets, and zero serious/critical axe violations | Pass |
| Visual system | Proportional UI typography, numeric-only monospace, spacing scale, route rails, nested radii, coordinated scrollbars, outline SVG icons, stable hover/focus states | Pass |
| Data resilience | Corrupt storage recovery, malformed rows, hostile values, payload limits, local-first recovery, version conflicts | Pass |
| Security | CSP, anti-frame, nosniff, permissions policy, RLS, pinned function search paths, explicit anonymous RPC revocation, narrow grants | Pass |
| Secret handling | PAT read from Windows User scope in a child launcher; runtime keys held in memory; gitleaks reports zero findings | Pass |
| Research and next-level direction | `DESIGN-REVIEW.md` covers comparable audit/time products, focused-form guidance, selected concept, and future opportunities | Pass |

## Fresh verification

- `npm.cmd run test:local` — complete cross-device product journey passed.
- `npm.cmd run test:cloud-ui` — owner/admin/member/outsider deterministic UI contracts passed.
- `npm.cmd run test:schema` — migration, RLS, RPC, and grant contracts passed.
- `npm.cmd run test:supabase-live` — six-person live authorization, conflict, cascade, and cleanup suite passed.
- `npm.cmd run test:supabase-ui-live` — two-browser live Center, offline, accessibility, responsive, and cleanup suite passed.
- `npm.cmd audit --omit=dev` — zero vulnerabilities.
- Gitleaks directory scan — zero leaks.
- Impeccable detector — zero findings.
- `node --check` for the server and both live verifiers — passed.
- `git diff --check` — passed; Git emitted line-ending conversion warnings only.

## Defects exposed only by live assembly

The live project and browsers exposed issues that deterministic adapters missed:

- Supabase granted `anon` direct RPC execution despite a `PUBLIC` revocation.
- SQLSTATE `40001` retried until timeout; `PT409` now reports an immediate conflict.
- The Center queried a nonexistent group column.
- Group creation used an RLS-sensitive returning query.
- Long identity and group names expanded mobile layout.
- Active-group contrast and the share target missed the quality floor.
- Share listeners attached after an asynchronous lookup and could disappear offline.
- Supabase local-scope sign-out still called the network; the app now clears its dedicated local auth state immediately while offline.

Each defect has a regression assertion in the static, live database, live UI, or full browser suite.

## Release state

The feature is complete and verified in the isolated branch and isolated Supabase project. The original checkout, `main`, and production deployment remain unchanged. This branch is uncommitted and undeployed.
