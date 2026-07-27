# Current Task

Refine and deploy the all-category weekly allocation editor with clearer hierarchy, stable numeric layout, direct row selection/reordering, and a summary-integrated donut.

## Done

- Confirmed the existing data model and multi-user implementation can support the new presentation without schema changes.
- Scoped Focus and Overview as complementary worksheet modes.
- Moved Focus/All into the row-action toolbar and the allocation donut into the weekly summary.
- Added explicit row selection, outside-click/Escape clearing, category-group and within-category reordering, keyboard grab/move/drop/cancel, touch-safe move controls, and live announcements.
- Stabilized numeric rails and category colors, bounded title hover areas, and clarified category/subcategory hierarchy.
- Passed focused overview, full browser, schema, cloud-persona, accessibility, responsive, security, and dependency gates.

## Remaining

1. Deploy the verified build and verify production.
2. Restore an authenticated Supabase dashboard session or host access token.
3. Add the remaining production key/redirect settings and run live multi-user verification.

## Next verifier

`npm.cmd run test:supabase-ui-live`
