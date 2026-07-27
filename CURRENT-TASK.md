# Current Task

Build and deploy a production-ready all-category weekly allocation mode with compact editing, linked category colors, and an expandable donut summary.

## Done

- Confirmed the existing data model and multi-user implementation can support the new presentation without schema changes.
- Scoped Focus and Overview as complementary worksheet modes.

## Remaining

1. Complete interface research and source/code/deployment audits.
2. Write regression assertions for the new interaction and responsive requirements.
3. Implement the worksheet modes, compact controls, color system, donut, and modal.
4. Run local, cloud, accessibility, responsive, and multi-user verification.
5. Configure and deploy Vercel, update Supabase auth redirects, and verify production.

## Next verifier

`npm.cmd run test:local`
