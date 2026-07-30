# Secret manifest

Project: 168-audit

This generated view contains variable names and operating metadata only. Secret values, vault session keys, recovery keys, and access tokens are forbidden.

| Variable | Purpose | Provider | Trust boundary | Owner | Rotation | Consumers | Status |
|---|---|---|---|---|---|---|---|
| `LIVE_APP_URL` | Non-secret base URL for the configured live browser verifier | local verification launcher | isolated development verification | Douglas | update when the verification server address changes | tests/verify-supabase-ui-live.mjs | optional-configuration |
| `LIVE_SUPABASE_PRIVILEGED_KEY` | Ephemeral privileged Supabase key retrieved in memory for isolated live verification | Supabase Management API | isolated development verification child process | Douglas | provider-managed; rotate the project key on compromise | tests/verify-supabase-ui-live.mjs | ephemeral-credential |
| `LIVE_SUPABASE_PROJECT_REF` | Non-secret selector for the isolated Supabase project used by destructive live verification | local environment | isolated development verification | Douglas | update when the approved disposable project changes | tests/run-supabase-live.ps1, tests/run-supabase-ui-live.ps1 | non-secret-configuration |
| `LIVE_SUPABASE_PUBLISHABLE_KEY` | Ephemeral browser-safe project key for configured live UI verification | Supabase Management API | isolated development verification browser | Douglas | provider-managed; update when the disposable project key changes | tests/verify-supabase-ui-live.mjs | non-secret-public-configuration |
| `LIVE_SUPABASE_URL` | Ephemeral public project endpoint for configured live UI verification | Supabase Management API | isolated development verification browser | Douglas | update when the disposable project endpoint changes | tests/verify-supabase-ui-live.mjs | non-secret-public-configuration |
| `PORT` | Optional local Express listening port | local environment | local runtime | Douglas | not applicable | server.js | optional-configuration |
| `SUPABASE_ACCESS_TOKEN` | Supabase Management API credential used by child-process live-verification launchers | Windows User environment or Bitwarden Secrets Manager | isolated development verification child process | Douglas | on compromise, ownership change, or provider policy | tests/run-supabase-live.ps1, tests/run-supabase-ui-live.ps1 | credential-required |
| `SUPABASE_ANON_KEY` | Legacy browser-safe alternative to SUPABASE_PUBLISHABLE_KEY | Supabase and deployment platform | public browser runtime | Douglas | update when the Supabase project key changes | server.js | non-secret-public-configuration |
| `SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase project key for optional account and group features | Supabase and deployment platform | public browser runtime | Douglas | update when the Supabase project key changes | server.js | non-secret-public-configuration |
| `SUPABASE_URL` | Public Supabase project endpoint for optional account and group features | Supabase and deployment platform | public browser runtime | Douglas | update when the Supabase project endpoint changes | server.js | non-secret-public-configuration |

Canonical source: `secret-manifest.json`
Refresh: `C:\Users\dougl\.agents\tools\Update-SecretManifest.cmd -Repository <repo>`
