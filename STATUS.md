# Status

## 2026-07-27 row-editor refinement

- Production interface deployed from commit `17a1f67` to `https://168-audit.vercel.app`.
- Focus/All now shares the row-action toolbar; the allocation donut is integrated into the Ideal/Actual/Weekly total summary.
- Category and subcategory rows have explicit selection, group-aware drag/reorder, keyboard and touch alternatives, bounded title hover states, stable colors, and fixed-width numeric rails.
- Production verification confirmed the deployed structure and the expandable chart dialog.
- Vercel has the Supabase project URL and publishable key; Supabase Auth has the production site URL plus production and local redirect URLs.
- The deployed production app passed a two-user Center journey covering account sign-in, group creation/join, offline failures, sync, explicit sharing, shared ideal/actual/note data, revocation, member removal, accessibility, responsive containment, and zero-residue cleanup.
- `PRODUCT.md` follows Impeccable product schema 1 and records the product's current operating context, capabilities, constraints, evidence, and principles.

## 2026-07-26 all-category release

- Production interface deployed from commit `38907a5` to `https://168-audit.vercel.app`.
- Focus and All-category worksheet modes, larger sliders, compact grouped mobile rows, linked category colors, expandable donut, and password-recovery completion are implemented.
- Full local, Overview, schema, deterministic cloud, accessibility, responsive, and 168-hour Ideal/Actual journeys pass.
- Production cloud login awaits Vercel public Supabase variables and Supabase Auth redirect configuration; the dashboard session available to this run is signed out.

The professional guided-audit redesign is implemented on branch `codex/168-audit-redesign` in its isolated worktree.

Working capabilities:

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
- The release UI pass removes the worksheet heading and duplicate total card, surfaces remaining/over hours in the masthead, combines desktop planning controls into one command bar, uses compact Data and “123” controls, and provides a consolidated source/feedback footer.
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

The original checkout, `main` branch, and production deployment remain unchanged. This branch is uncommitted and undeployed. The isolated `claude-personal` project is migrated and verified; the unrelated active Supabase project was left untouched.
# 2026-07-27 Plan editor refinement

- Focus/All now shares the row-action toolbar; the expandable allocation donut lives with Ideal, Actual, and Weekly total.
- Category groups and subcategory rows use explicit selection and reorder controls. Selection clears through the worksheet background, Escape, or the visible action bar.
- Reordering supports pointer drag, keyboard grab/move/drop/cancel, and visible Move up/Move down actions. Category moves preserve contiguous groups; subcategories stay within their category.
- Category colors remain stable after reorder. Numeric inputs and slider readouts use fixed, tabular, right-aligned rails.
- Fresh verification passed: overview interaction, full Playwright browser suite, schema contract, deterministic owner/admin/member/outsider cloud UI, axe, 320px/375px/495px/tablet/desktop/zoom, syntax, Impeccable detector, and npm audit.
- Production cloud remains disabled until the Supabase publishable key and Auth redirects are configured through an authenticated Supabase session.
