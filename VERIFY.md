# Verification

- Setup: `npm.cmd ci`
- Static contracts: `npm.cmd run test:schema`
- Deterministic cloud personas: `npm.cmd run test:cloud-ui`
- Local end-to-end: start `npm.cmd start`, then run `npm.cmd run test:local`
- Live RLS and database lifecycle: `npm.cmd run test:supabase-live`
- Live multi-browser Center: `npm.cmd run test:supabase-ui-live`
- Syntax: `node --check server.js`
- Dependency audit: `npm.cmd audit --omit=dev`
- Secret scan: `C:\Users\dougl\Tools\gitleaks\gitleaks.exe dir . --redact --no-banner --config .gitleaks.toml`
- Design detector: `node C:\Users\dougl\.agents\skills\impeccable\scripts\detect.mjs --json server.js`
- Diff hygiene: `git diff --check`
