# 168 — Audit Your Week

Interactive web app for the “168 hours” weekly time audit. Plan an ideal week, reconstruct the week you lived, compare the largest gaps, reflect, preserve snapshots, and export or restore your data.

Live: https://168-audit.vercel.app
Source note: https://dpm5970digitalgarden.vercel.app/168-audit-your-week/

## Product flow

1. **Plan** — complete the ideal and actual passes separately, or use the combined expert view.
2. **Compare** — review the largest differences first and jump directly to any category that needs correction.
3. **Reflect** — answer prompts that adapt to the current audit and commit to one specific change.
4. **History** — save snapshots, compare weeks, and keep a lightweight reflection journal.
5. **Center** — optionally sign in, sync a week, create or join a private group, and share selected weeks.

On narrow screens, Plan focuses on one category at a time. Signed-out data stays in the current browser. Cloud weeks are private by default; group members see only weeks their owners explicitly share.

## Run locally

```powershell
npm install
npm start
```

Open `http://localhost:3168`.

## Enable accounts and groups

1. Create a Supabase project.
2. Apply `supabase/migrations/202607250001_multi_user_center.sql`.
3. Run `supabase/tests/rls_contract.sql` in a disposable or staging project.
4. Set the browser-safe project variables:

```powershell
$env:SUPABASE_URL = "your-project-url"
$env:SUPABASE_PUBLISHABLE_KEY = "your-publishable-key"
npm start
```

The app also accepts `SUPABASE_ANON_KEY` for projects using the legacy key format. A secret or service-role key must never be supplied to the browser app. Configure local and production URLs in Supabase Auth redirect allow-lists before testing confirmation and password-reset emails.

The included backend provides profiles, versioned audit documents, private groups, memberships, expiring hashed invitation tokens, explicit week sharing, RPCs for membership management, and RLS policies. The full product contract and implementation sequence live under `docs/superpowers/`.

## Test

```powershell
npm run test:local
npm run test:live
npm run test:schema
npm run test:cloud-ui
npm run test:supabase-live
npm run test:supabase-ui-live
```

The Playwright suite checks desktop, tablet, iPhone, 320 px mobile, and phone-landscape layouts; all 13 tutorial steps across five aspect ratios; light and dark themes; keyboard navigation; WCAG automated rules; full audit flows; persistence; JSON backup and restore; snapshots; malformed storage recovery; hostile shared payloads; Center privacy messaging; distilled icon controls; and security headers. Screenshots land in `tests/screenshots/`.

The two live Supabase verifiers read `SUPABASE_ACCESS_TOKEN` directly from Windows User scope and use `LIVE_SUPABASE_PROJECT_REF` as the non-secret project selector. They retrieve runtime keys in memory, never print them, and must run only against an isolated development project.

`test:supabase-live` applies the migrations after a collision preflight, runs the SQL contract, exercises six isolated identities, verifies RLS, invitation concurrency, two-client edit conflicts, role changes, ownership transfer, and database cascades, then asserts that cleanup left no test records or accounts.

`test:supabase-ui-live` starts a configured local server and uses separate desktop and mobile browser contexts. It covers sign-in, group creation, invitation joining, week sync, explicit sharing, shared notes and hours, revocation, member removal, offline operations, accessibility, responsive containment, and cleanup.

## Stack

- Express with a single-file application shell in `server.js`
- Supabase Auth, Postgres, and RLS when cloud configuration is present
- `@supabase/supabase-js`, served from the app origin under the CSP
- Inline HTML, CSS, and JavaScript
- `localStorage` persistence
- Vercel deployment through `@vercel/node`

## Customizing categories

`data/categories.js` seeds the worksheet. Users can add, remove, and rename rows in the app. Changes persist under `168-audit:v1`; “Reset to defaults” restores the seed data.

## License

MIT.
