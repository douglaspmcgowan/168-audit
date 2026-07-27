# All-Category Allocation Design

## Goal

Let a person manage an entire 168-hour week in one continuous workspace while preserving the lower-scroll focused workflow.

## Interaction model

- **Focus** shows one category and keeps previous/next navigation.
- **All categories** shows every category as a compact group in one vertical manager.
- The selected view persists locally and does not alter saved audit data.
- Ideal, Actual, and Both remain global stage controls.
- Numbers remain the precision input; Sliders provide a larger coarse-allocation control with a 44px hit area.

This paired overview/detail model follows the category-management patterns documented by [YNAB Focused Views](https://support.ynab.com/en_us/focused-views-a-guide-BksnNYqLh) and the list/overview split described by [Toggl Track](https://toggl.com/track/mobile-time-tracking-app/).

## Category groups and color

- Each category receives a stable color based on its worksheet order.
- The same color appears beside the category heading, in the worksheet donut, and in the expanded legend.
- Names and hour values accompany every color so the encoding remains understandable without color perception.
- Renaming a category updates its complete group.

## Distribution chart

- A compact donut sits at the upper-right of the category manager.
- Its center reports allocated hours against 168.
- Unallocated time uses a neutral segment.
- Activating the chart opens a focus-trapped dialog with a larger chart, status sentence, and complete category legend.
- Escape and the close action return focus to the chart button.

The accessibility contract follows the [Microsoft data-visualization guidance](https://learn.microsoft.com/en-us/office/dev/add-ins/design/data-visualization-guidelines), [Section 508 color guidance](https://www.section508.gov/create/making-color-usage-accessible/), and the native-slider recommendations in the [WAI-ARIA slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/).

## Responsive behavior

- Desktop uses a compact worksheet table with a shorter category column.
- Mobile All view turns category starts into visible group headings and places subcategory rows beneath them.
- Mobile slider rows span the usable width; their numeric readout remains visible.
- Focus retains the category selector and arrow navigation.
- All controls keep a 44px minimum target and the page remains contained at 320px and 200% zoom.

## Data and cloud impact

The feature uses presentation state only. Audit documents, Supabase tables, RLS policies, sharing contracts, and group membership behavior remain unchanged. Password recovery completes through the existing Supabase session by presenting a new-password form when the `PASSWORD_RECOVERY` event arrives.

## Verification

- Dedicated Overview browser contract at 375px.
- Full desktop/mobile/tablet browser regression.
- Complete 168-hour Ideal/Actual journey in Numbers and Sliders.
- Axe, keyboard dialog, focus return, long labels, 320px, and zoom checks.
- Configured cloud and live multi-user/RLS suites.
- Production health, login, recovery, group, and shared-week smoke tests after deployment.
