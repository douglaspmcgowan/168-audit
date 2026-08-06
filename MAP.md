# Project map

## Core documents

| File | Audience | Loaded or read when | Owns |
|---|---|---|---|
| `AGENTS.md` | Agents and humans | Every repository session | Portable project contract |
| `CLAUDE.md` | Claude adapter | Every Claude repository session | Imports `AGENTS.md` |
| `.cursor/rules/00-project-contract.mdc` | Cursor adapter | Every Cursor repository session | Requires `AGENTS.md` |
| `CURRENT-TASK.md` | Agents and humans | Start, resume, handoff | Active goal, progress, exact next verifier |
| `WORK_QUEUE.md` | Agents and harness | Multi-step work | Actionable checkbox state |
| `STATUS.md` | Agents and humans | Start, resume, milestone | Durable project state |
| `LOG.md` | Agents and humans | Recent history, handoff | Append-only work record |
| `BACKBURNER.md` | Humans and agents | Planning | Parked backlog |
| `VERIFY.md` | Agents and CI | Before completion | Required evidence and commands |
| `MAP.md` | Agents and humans | Orientation | This document graph and project navigation |
| `DESIGN.md` | Agents and humans | Feature and architecture work | Goals, constraints, decisions |
| `MEMORY.md` | Agents | Recall | Lean links to durable topic notes |
| `data-manifest.yaml` | Agents and applications | Data access | Value-free data locations and classifications |
| `secret-manifest.json` | Agents and automation | Credential-dependent setup | Value-free credential inventory |
| `skills-manifest.json` | Agents and cloud setup | Skill selection and export | Project skill bindings |
| `.agents/feedback/FEEDBACK-LOG.md` | Agents and humans | Explicit correction or recurrence review | Append-only, value-free feedback records |

## Architecture

| Component | Purpose | Entry point | Owner |
|---|---|---|---|
| `<component>` | `<purpose>` | `<path or command>` | `<owner>` |

## Important paths

| Path | Purpose | Generated | Committed |
|---|---|---|---|
| `<path>` | `<purpose>` | `<yes/no>` | `<yes/no>` |

## Data flow

Describe inputs, transformations, stores, outputs, and trust-boundary crossings.

## Integrations

| System | Direction | Authentication name | Failure behavior |
|---|---|---|---|
| `<system>` | `<in/out/both>` | `<manifest name only>` | `<behavior>` |

## Ownership and concurrency

Record component owners, shared mutable resources, worktree constraints, ports, test databases, and deployment targets.

## State

- The professional guided-audit redesign is implemented on branch `codex/168-audit-redesign` in its isolated worktree; the original checkout, `main` branch, and production deployment remain unchanged; this branch is uncommitted and undeployed; the isolated `claude-personal` project is migrated and verified; the unrelated active Supabase project was left untouched.
- Working capabilities:
  - Staged Plan workflow with a combined expert view.
  - Focused mobile category navigation.
  - Ranked Compare workflow with direct correction links.
  - Adaptive Reflect workflow and weekly commitment.
  - Snapshot history, profile support, export, import, and share flows.
  - Local-data explanation, recovery behavior, input sanitization, payload limits, and defensive HTTP headers.
  - Keyboard, focus, reduced-motion, contrast, touch-target, and narrow-layout improvements.
  - Expanded Playwright verification across core journeys and adversarial inputs.
  - Theme-coordinated native scrollbars with rounded track, thumb, and corner treatment.
  - Compact masthead and a balanced single-row mobile step rail at 320 px.
  - Eased guided-tour movement verified across portrait, landscape, tablet, and short-desktop aspect ratios.
  - One responsive worksheet composition; the redundant Dashboard/App presentation switch has been removed.
  - A fifth Center surface with optional Supabase sign-up/sign-in/reset, personal week sync, private group creation/joining, expiring invitation codes, explicit week sharing/revocation, and shared member-week reading.
  - Supabase migration assets with ownership checks, hashed invite tokens, transaction-safe redemption, RLS on every exposed table, narrow grants, and catalog contract assertions.
  - Distilled Snapshot and number/slider icon actions plus compact mobile category rows and progressive note entry.
  - Deterministic configured-cloud UI verification for signed-out and signed-in owner/member states.
  - Guided four-question Reflect flow with persisted answers and one weekly experiment carried into snapshots.
  - Compact History with creation kept in Plan, explicit comparison mode, weekly totals, experiment context, and named deletion.
  - Accessible in-app Schedule and confirmation dialogs; grouped Data actions; adaptive Help entry points.
  - Center member roster, manager removal, single-use invitation display, attributed full shared-week details, offline protection, and version-checked cloud saves.
  - Passing schema and configured-cloud contracts plus a 98-second Playwright matrix covering desktop, tablet, 375 px, 320 px, five tour aspect ratios, axe, recovery, malformed shares, and security headers.
  - A unified 20-pixel outline-SVG icon family across primary app controls; semantic control/surface/overlay radii; stable color/border hover states.
  - Mobile Plan uses one category selector as the group heading, compact divided worksheet rows, and a single aligned action rail.
  - Help exposes one adaptive walkthrough action with optional Quick/Full tour choices under disclosure; repeated feedback and browser-storage copy were removed.
  - Full Center lifecycle UI: rename, promote/demote, transfer ownership, leave, delete, active invitation status/revocation, and one-session join links.
  - Filter-aware configured-cloud browser verification now exercises owner, admin, member, and outsider interfaces and exact role controls.
  - Credential-safe live harnesses read the host-scoped PAT only inside their child process, retrieve runtime keys in memory, apply migrations after collision preflight, and clean every synthetic identity and row.
  - A documented app-wide design system now governs six typography roles, an eight-step spacing scale, route-specific content rails, nested radii, 44px controls, outline SVG icons, and motion/content rules.
  - Plan, Compare, Reflect, History, Center, dialogs, menus, desktop, tablet, and mobile use the shared system; visible step numbering, decorative grain, and repeated save/instruction copy have been removed.
  - Impeccable layout/type/general detectors return clean results, and the post-system full Playwright suite passes with zero critical/serious axe findings and no viewport overflow.
  - The responsive gate now also proves a 200% browser-zoom equivalent and 200% text-only zoom. The durable implementation plan has been reconciled with current source/test evidence.
  - `.env.example` documents the browser-safe and disposable live-verifier variable names using placeholders only.
  - Claude-to-Codex skill parity is complete in the shared `.agents\skills` catalog: Tactician and 33 other missing commands are ported, 23 missing skill packages are copied, and a repeatable parity checker reports zero gaps.
  - The release UI pass removes the worksheet heading and duplicate total card, surfaces remaining/over hours in the masthead, combines desktop planning controls into one command bar, uses compact Data and "123" controls, and provides a consolidated source/feedback footer.
  - Feedback now opens an accessible in-app form, returns focus on close, builds a complete email handoff, and offers a clipboard fallback.
  - The final schema, configured-cloud owner/admin/member/outsider, Impeccable, and 95-second browser matrices pass across desktop, tablet, 375 px, 320 px, five tour aspect ratios, 200% zoom, axe, resilience, and hostile data.
  - The mobile masthead omits routine save copy; Data uses a 36px square visual with a 44px effective hit area; New category names its outcome; category navigation has no repeated heading; row controls align to one 44px rail; and the brand mark/title share an optical center.
  - Masthead totals use three aligned semantic columns: Ideal week, Actual week, and Weekly total, with each balance directly attached to its value.
  - The assembled browser suite completes all 20 rows in both ideal and actual weeks to exactly 168 hours, persists two notes, proves number and slider modes, opens Compare, and verifies the completed audit after reload.
  - Configured-cloud coverage opens a populated same-group member week and verifies its category, subcategory, ideal hours, actual hours, and notes.
  - The isolated live Supabase project passes six-person authorization coverage: private weeks, explicit sharing, cross-group denial, invitation edge cases and concurrency, direct-write attacks, role changes, ownership transfer, two-client conflicts, Auth-user and group cascades, and zero-residue cleanup.
  - The live Center passes in separate desktop and mobile browser contexts through sign-in, group creation, invitation joining, sync, shared notes/hours, unshare, member removal, offline join/save/share/unshare/removal/sign-out behavior, axe, 320 px/375 px containment, and cleanup.
  - Live verification found and repaired direct anonymous RPC grants, retry-looping conflict responses, an invalid group relationship column, RLS-sensitive group returning queries, long-identity and group-row overflow, active-group contrast, undersized share targets, delayed share listeners, and offline sign-out blocking.
  - A source-blind `/user` run proved nine of ten GUI claim groups twice at tier 1. Native export/share handoffs remain blocked-ambiguous for that tester; restore passed twice and the assembled browser suite covers the export/share invocations.
  - The `/user` honesty check changed Data from 44px to 48px, produced the expected red verdict, restored the source, and returned the complete suite to green.

## Update rule

Update this file whenever a core document, component boundary, data flow, owner, integration, or important path changes.
