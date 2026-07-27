# 168 Audit Multi-User Center Implementation Plan

> **For implementers:** Execute tasks in order, preserve the browser-local path throughout, and run the named verifier after each task.

**Goal:** Add optional Supabase accounts, cross-device audit weeks, private groups, invitations, and explicit per-group week sharing.

**Architecture:** Keep the existing local state as the immediate editing and recovery layer. Add a small cloud adapter around Supabase Auth and PostgREST, persist each cloud audit as one versioned JSONB document, and let database RLS enforce every read and mutation boundary. Expose multi-user work through a responsive account center separated from the four-step audit flow.

**Tech stack:** Node/Express, browser JavaScript, Supabase Auth/Postgres/PostgREST, Playwright, axe-core, SQL contract assertions.

---

## Task 1: Establish the database contract

**Files:**
- Create: `supabase/migrations/202607250001_multi_user_center.sql`
- Create: `supabase/tests/rls_contract.sql`

- [x] Create profiles, audit weeks, groups, memberships, invites, and explicit week shares.
- [x] Add owner-membership and updated-time triggers.
- [x] Add fixed-`search_path` helpers and checked membership/invitation RPCs.
- [x] Enable RLS on every application table and define owner/member/share policies.
- [x] Revoke direct membership/invite writes and sensitive owner-column writes.
- [x] Add catalog assertions for RLS, policy shape, grants, and function hardening.

**Verifier:** Apply the migration to a disposable Supabase/Postgres database, then run `psql --set ON_ERROR_STOP=1 --file supabase/tests/rls_contract.sql`.

## Task 2: Expose safe public configuration

**Files:**
- Modify: `server.js`
- Modify: `.gitignore`
- Create: `.env.example`
- Modify: `tests/verify-live.mjs`

- [x] Read only the project URL and publishable/anonymous browser key from exact environment variables.
- [x] Emit cloud capability as disabled when either value is absent.
- [x] Serialize configuration with safe JSON encoding and no debug output.
- [x] Serve the installed Supabase browser client from a same-origin route covered by CSP.
- [x] Assert that absent configuration preserves the full signed-out audit and that no service-role value appears in HTML.

**Verifier:** `npm.cmd run test:local`

## Task 3: Build the cloud adapter

**Files:**
- Modify: `server.js`
- Create: `tests/verify-cloud-ui.mjs`
- Create: `tests/verify-schema.mjs`

- [x] Define the versioned audit-document serializer and reuse import validation for cloud reads.
- [x] Implement auth session observation, sign-in, sign-out, and current-profile update.
- [x] Implement owned-week list, fetch, create, and version-checked update calls.
- [x] Implement group list/detail/create/rename/delete calls.
- [x] Implement invite create/revoke/redeem and membership role/leave/remove calls.
- [x] Implement share/unshare and shared-week reads.
- [x] Normalize Supabase failures into UI-safe recovery messages.
- [x] Test request shapes, persona permissions, offline state, lifecycle actions, and conflicts with deterministic clients.

**Verifier:** `npm.cmd run test:cloud-ui`

## Task 4: Add offline-safe synchronization

**Files:**
- Modify: `server.js`
- Modify: `tests/verify-cloud-ui.mjs`
- Create: `tests/verify-supabase-ui-live.mjs`

- [x] Render local data before session or network work.
- [x] Add an explicit first-upload flow for local profiles.
- [x] Persist cloud UUID, server version, sync base, and pending-write state locally.
- [x] Debounce cloud writes after the existing local save succeeds.
- [x] Retry pending writes after reconnect and a new authenticated session.
- [x] Detect divergent cloud updates and require a local-versus-cloud choice.
- [x] Create a recovery copy before applying either conflict choice.
- [x] Test offline state, reconnect availability, stale response, sign-out, and malformed cloud data.

**Verifier:** `npm.cmd run test:cloud-ui` and `npm.cmd run test:supabase-ui-live`

## Task 5: Build the responsive account center

**Files:**
- Modify: `server.js`
- Modify: `tests/verify-live.mjs`
- Modify: `tests/verify-cloud-ui.mjs`

- [x] Replace the local-only profile affordance with a compact account entry that preserves local profile switching.
- [x] Add signed-out, loading, empty, error, and signed-in states.
- [x] Add My weeks with open, sync, first-upload, and per-group share controls.
- [x] Add Groups with create and join actions.
- [x] Add group detail with role-aware roster, invitations, and shared-week feed.
- [x] Use a mobile stacked layout and a wide-screen master/detail layout.
- [x] Add focus containment/return, live status, touch sizing, wrapping, and reduced motion.
- [x] Verify Center and surrounding app flows at 320×568, 375×812, 768×1024, 1280×720, and 1440×900.

**Verifier:** `npm.cmd run test:local`

## Task 6: Verify live authorization behavior

**Files:**
- Create: `tests/verify-supabase-live.mjs`
- Create: `tests/run-supabase-live.ps1`
- Create: `tests/verify-supabase-ui-live.mjs`
- Create: `tests/run-supabase-ui-live.ps1`
- Modify: `package.json`
- Modify: `README.md`

- [x] Create disposable owner, admin, member, other-group, unrelated, and cascade test identities through the supported test harness.
- [x] Verify private owner reads and writes.
- [x] Verify explicit sharing enables read-only group access.
- [x] Verify unrelated, other-group, removed, and unshared readers are denied.
- [x] Verify invalid, expired, exhausted, revoked, and concurrent invite redemption.
- [x] Verify owner/admin/member role actions and ownership transfer.
- [x] Verify deleting a user or group cascades its dependent records.
- [x] Remove all disposable identities and records after the run and assert zero residue.

**Verifier:** Run the isolated multi-user E2E command documented in `README.md`, then rerun `supabase/tests/rls_contract.sql`.

## Task 7: Complete the adversarial product pass

**Files:**
- Modify: `tests/verify-live.mjs`
- Modify: `DESIGN-REVIEW.md`
- Modify: `STATUS.md`
- Modify: `LOG.md`

- [x] Attack authorization with guessed UUIDs, replayed invite tokens, role escalation, owner-column assignment, and direct table writes.
- [x] Test network loss during save, join, share, unshare, removal, and sign-out.
- [x] Test two active authenticated clients editing the same week.
- [x] Run keyboard-only, screen-reader semantics, axe, 200% zoom, reduced motion, and high-contrast checks.
- [x] Confirm the browser-local workflow remains complete with cloud configuration absent.
- [x] Record exact commands, results, known constraints, and operational setup.

**Verifier:** `npm.cmd run test:local`
