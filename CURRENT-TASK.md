# Current Task

Build and deploy a production-ready all-category weekly allocation mode with compact editing, linked category colors, and an expandable donut summary.

## Done

- Confirmed the existing data model and multi-user implementation can support the new presentation without schema changes.
- Scoped Focus and Overview as complementary worksheet modes.

## Remaining

1. Restore an authenticated Supabase dashboard session or host access token.
2. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to the Vercel project.
3. Add `https://168-audit.vercel.app` to Supabase Auth site/redirect settings.
4. Redeploy and run the live production login/group/shared-week verification.

## Next verifier

`npm.cmd run test:supabase-ui-live`
