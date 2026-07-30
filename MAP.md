# Project map

## Core documents

| File | Owns |
|---|---|
| `AGENTS.md` | Portable project behavior |
| `CLAUDE.md` | Claude import |
| `.cursor/rules/00-project-contract.mdc` | Cursor project pointer |
| `TASK.md` | Active goal, queue, blockers, completed evidence, next verifier |
| `STATUS.md` | Durable capability state |
| `LOG.md` | Append-only completed work |
| `BACKBURNER.md` | Parked work |
| `MAP.md` | This architecture and navigation map |
| `DESIGN.md` | Universal and project interface rules |
| `PRODUCT.md` | Optional product intent |
| `MEMORY.md` | Lean durable-reference index |
| `skills-manifest.json` | Canonical skill bindings |
| `data-manifest.yaml` | External-data authorities, adapters, and restore rules |
| `secret-manifest.json` | Value-free secret inventory and trust boundaries |

## Architecture

| Component | Purpose | Entry point | Owner |
|---|---|---|---|
| Express application shell | Serves the five-surface audit UI, local persistence logic, exports, and optional cloud client | `server.js` / `npm.cmd start` | Application source |
| Category seed | Defines the default category and subcategory model | `data/categories.js` | Application source |
| Supabase contract | Provides authentication, versioned audit documents, groups, sharing, RPCs, and row-level security | `supabase/migrations/` and `supabase/tests/rls_contract.sql` | Database migrations |
| Browser and schema verification | Exercises local, responsive, accessibility, deterministic-cloud, and configured live journeys | `tests/verify-*.mjs` and `tests/run-supabase-*.ps1` | Test suite |

## Important paths

| Path | Purpose | Generated | Committed |
|---|---|---|---|
| `server.js` | Express entry point and inline web application | no | yes |
| `data/categories.js` | Default worksheet seed | no | yes |
| `supabase/migrations/` | Versioned database changes | no | yes |
| `tests/` | Automated product verification | no | yes |
| `tests/screenshots/` | Browser-test artifacts | yes | no |
| `.agents/archive/pre-harness-v3/` | Verbatim superseded task and verification records | no | yes |

## Data flow

The browser loads the application from Express, edits one weekly audit model, and persists signed-out state in browser `localStorage`. Users may export or restore portable files. When the public Supabase endpoint and publishable key are configured, authenticated browser requests cross the network boundary to Supabase Auth, Postgres, and RPCs governed by row-level security. Live verification launchers use a non-secret project selector plus a host-scoped management credential inside a child process, provision synthetic users and rows in the isolated development project, verify authorization behavior, and assert zero-residue cleanup.

## Integrations

| System | Direction | Credential name | Failure behavior |
|---|---|---|---|
| Supabase browser runtime | both | `SUPABASE_PUBLISHABLE_KEY` (public configuration) | Center cloud controls remain unavailable when public runtime configuration is absent. |
| Supabase Management API | both | `SUPABASE_ACCESS_TOKEN` | Live database and multi-browser suites stop before provisioning when the credential or isolated project selector is unavailable. |
| Vercel | out | deployment-owned authentication, not stored in this repository | Deployment is an explicit external operation; local verification remains available independently. |

## Ownership and concurrency

Application source, migrations, and tests are committed project state. Browser storage, Supabase records, credentials, Vercel configuration, and deployments are external state. Use one worktree per writable task. Port `3168`, the isolated live-test Supabase project, and the production deployment are shared mutable resources; serialize their use or allocate a distinct target.

## Update rule

Update this file when a component boundary, data flow, owner, integration, core document, or important path changes.
