<!-- agent-harness:universal-design:v1:start -->
## Universal interface rules

The authority is `~/.agents/DESIGN.md`, and it is fuller than this. What follows is
carried here rather than only linked because a cloud or container session has no
`~/.agents` to reach — so the rules that actually change what gets built have to survive
in the repository itself.

### Anti-default discipline

Quoted verbatim from the authority rather than paraphrased, because this is the section an
agent most needs and a paraphrase is a second copy that drifts.

The model's house style is recognizable, and reaching for it reads as machine-made. Never
default to: purple-blue gradients, a centered hero over a dark mesh background, three equal
feature cards, ubiquitous glassmorphism, or Inter with slate everywhere. The
beige-brass-espresso "premium consumer" palette is the same tell; rotate off it.

- Lock one accent color page-wide, and one gray family per project.
- Lock one corner-radius system per page. Mix radii only under a rule you can state.
- Keep one theme per page. Sections do not invert light and dark mid-scroll except as a single deliberate composition device.
- A section layout family appears at most once per page. At most two consecutive image-text zigzag splits. At most one small uppercase eyebrow label per three sections.
- Where a brief reads as an established design system, use that system's official package rather than approximating it. One system per project.
- The brief wins. Honor a pinned aesthetic even when it is not the choice you would make; redirecting a clear brief toward your own taste is failure, not judgment.

### Names that appear here only to be forbidden

The rules above and below name specific typefaces in order to ban them. A project that
scans its own source for banned font names will find those names *here* and report this
file as the violation — measured on `base-flight-finder`, 2026-08-07, whose typography
policy test failed against text whose whole purpose is to forbid the thing it names.

**If you write such a scan, exclude the region between the two `agent-harness:universal-design`
marker comments.** That region is generated and is replaced wholesale on every sync, so
nothing a project owns ever lives inside it. The names are also declared machine-readably
on the next line, so a scanner can subtract them without parsing prose. `Test-DesignBlockScanSafety.ps1`
fails the build if any of them appears outside the markers, which is what makes the
exclusion sufficient rather than merely conventional.

**Match on word boundaries, not substrings.** `Inter` is a prefix of interaction,
interface, internal and interval, so a bare substring scan reports a violation on ordinary
English. That is a second, independent cause of the same false positive, and it lives on
your side of the line rather than in this block — the check above hit it on its own first
run, against the heading "Interaction and accessibility" a few sections down.

<!-- agent-harness:design-prohibited-names: IBM Plex Mono, Inter, Fraunces, Instrument Serif -->

### Everything else

- Never use IBM Plex Mono.
- Default to a sans display face. Use serif only with an articulated reason; `Fraunces` and `Instrument Serif` are banned as defaults specifically because they are the common machine-made choice.
- Hero discipline: the hero fits the first viewport, the headline runs at most two lines, subtext stays under roughly twenty words, and no more than four text elements sit inside it. Trust marks and logo walls go below the hero, never in it.
- A grid has exactly as many cells as there is content for. Reshape the grid rather than pasting in a blank tile.
- Every animation names what it communicates — hierarchy, sequence, feedback, or state change. An animation that names nothing gets cut.
- Reread every visible string before shipping. Never invent a precise-sounding number.
- Use a proportional body face for prose, navigation, labels, dates, names, and human-readable metadata.
- Reserve monospace for code, commands, identifiers, timestamps, and genuinely tabular numeric data.
- Define explicit body, display, and monospace roles. Use tabular numerals on the proportional face for aligned quantities.
- Establish hierarchy through size, weight, spacing, and placement before decoration.
- Give each screen a clear primary action or reading path. Use spacing and alignment to show relationships.
- Reuse existing tokens and components before adding variants.
- Cover relevant default, hover, focus, active, disabled, loading, empty, error, and success states.
- Use semantic structure and native controls, visible keyboard focus, logical tab order, accessible names, sufficient contrast, and non-color state cues.
- Support narrow, medium, and wide layouts, zoom, text resizing, touch targets, and reduced motion.
- A design skill's silence on accessibility is not an exemption. Seven of the sixteen design-adjacent skill packages carry no accessibility content at all, so the two bullets above are the floor whichever skill is driving.
- A visual world is chosen, not accumulated. Template packs, style presets, and named aesthetics contradict each other by construction — `retro-windows` bans every rounded corner where `capsule` requires a 9999px radius. Commit to one, take its taste entire, and treat the others as unread. The rules here apply to all of them.
- Inspect the existing design system, screenshots, and implementation before proposing a new rule or component.
- Verify browser-visible work with browser or end-to-end tests across responsive, keyboard, loading, empty, and error behavior.

### Design libraries

Concrete things to reach for — animation packages and working skeletons, icon kits, typeface pools, design-system install commands and canonical documentation. Read the leaf you need; each one loads on its own.

- **Index** `~/.agents/design/LIBRARIES.md`
- **Motion** `~/.agents/design/animation/` — `libraries.md`, `sticky-stack.md`, `horizontal-pan.md`, `scroll-reveal.md`, `liquid-glass.md` (frosted glass), `forbidden.md`
- **Icons** `~/.agents/design/icons/libraries.md`
- **Type** `~/.agents/design/type/families.md`
- **Design systems** `~/.agents/design/systems/install.md` and `sources.md`
- **Design languages** `~/.agents/design/languages/registry.md` — read it before committing a visual world or generating a new design language, and register the world committed for this project there in the same work unit
- **Surface craft** `~/.agents/design/craft/` — `high-end.md` (surface construction), `from-reference.md` (building faithfully from a reference image), `from-code.md` (reading a design system out of a live product's own CSS), `device-mockups.md`
- **Fundamentals** `~/.agents/design/fundamentals.md` — the arithmetic under a decision: palette construction (60-30-10, one accent, warm neutrals, the colourblind-safe sets and the grayscale test), type-scale ratios with a worked scale and measure, and grid selection. Read it when the palette or scale is not already decided
- **Slides and posters** `~/.agents/design/slides-and-posters.md` — the only leaf addressing a non-web medium: deck frameworks, PowerPoint craft, HTML deck frameworks, and the academic poster including A0 sizing and the ≥24pt body floor
- **Pre-ship matrix** `~/.agents/design/preflight.md` — the mechanical finish check for landing, marketing and portfolio surfaces; not dashboards, not product UI
- **Dashboards and data-dense product UI** `~/.agents/design/dashboards.md` — the full system for the surface this tree used to leave uncovered: the three dashboard kinds and why building one while thinking of another causes most of the mistakes, information architecture and the three reading distances, density targets set against marketing spacing, typography and colour for data (sequential, diverging, categorical and semantic scales), chart selection ordered by the Cleveland-McGill perceptual ranking, chart and table craft, the six states every data region has, filters and URL state, interaction, real-time cadence, renderer choice by point count, the charting-library table, the anti-patterns, and a §18 pre-ship matrix that is the entry above's equivalent for this medium. This line used to say the tree did not own dashboards and pointed at the `/design-review` rubric, which critiques a running app rather than generating one; that gap closed on 2026-08-09
- **Mobile, touch and responsive** `~/.agents/design/mobile.md` — the medium, not a surface type: the three kinds of mobile thing and why a responsive site should not get a bottom tab bar, the viewport and its moving parts (`svh`/`lvh`/`dvh`, `viewport-fit=cover`, `env(safe-area-inset-*)` with the `max()` fallback that is the part people omit), the three touch-target floors — WCAG 2.2's 24px, Material's 48dp, Apple's 44pt — and which to design to, thumb reach and what it decides, mobile type including the 16px threshold below which iOS zooms a focused input, breakpoints and container queries, navigation patterns, forms with `inputmode`/`autocomplete`/`enterkeyhint` and the keyboard that covers your action bar, the gestures the OS has already reserved, the states that do not exist without a pointer, scrolling, the motion budget on a mid-tier device, images, offline, touch accessibility, the anti-patterns, a §18 pre-ship matrix, and §19 on the four checks emulation cannot answer. It does not restate `impeccable`'s `reference/adapt.md`, which owns converting an existing surface between contexts

The full universal rules are `~/.agents/DESIGN.md`. Where a library entry and a rule disagree, the rule wins.

**This list is enumerated because it has to be.** A cloud or container session has no `~/.agents` to walk, so this block is the only routing it gets — which also means a leaf missing here is a leaf that session cannot reach at all. `craft/` and `preflight.md` were absent until 2026-08-07 and every project copy inherited the gap. `Test-DesignLibraryIndex.ps1` now fails the build when this list falls behind the tree.
<!-- agent-harness:universal-design:v1:end -->

# 168 Audit Design System

## Stack template declaration (B8)

**Template 2 — Application with auth and data**, from `~/.agents/design/STACK-TEMPLATES.md`.

Selected by questions 3 and 4 of the six in `~/.agents/skills/stack/SKILL.md` § 1: a human signs in (Supabase Auth, optional but shipped), and data survives between sessions (weeks, snapshots, groups and shares in Postgres under row-level security). Those two answers occupy the auth and `database/ORM` slots, and only template 2 occupies both. Question 6 confirms the internet-reachable answer: the app is live at https://168-audit.vercel.app.

The app runs fully signed-out on `localStorage` alone, which is why the auth slot reads "optional but shipped" rather than "required".

### Deviations from template 2, each with its reason

| Slot | Template 2 says | This app has | Reason |
|---|---|---|---|
| language | TypeScript | TypeScript | Converged 2026-09-27. `server.ts` and `data/categories.ts` are strict-clean (`npx tsc --noEmit` exits 0); the six Playwright suites are `.mts` with 39 type errors left, tracked in `tsconfig.tests.json`. |
| UI library | React | none — hand-written DOM strings | **Open deviation.** No component boundary exists to convert. Closing it is workstream 13 and is gated behind the floor. |
| framework/build | Next.js, App Router | hand-written Express, no build step | **Open deviation.** Express is on the cut list. The floor-first stop in `APP-REPAIR-SPEC.md` forbids entering workstream 13 until this row is DONE at BASELINE, so the move is deliberately not taken here. |
| styling method | Tailwind plus CSS custom properties | one inline `<style>` template literal, 91 custom properties on one `:root` | **Partial.** The custom-property half is in place and is the app's single source of colour, size, space, radius, shadow, duration and easing — including the Compare donut palette (`--slice-1` .. `--slice-10`), which the client reads at render time rather than holding its own array. No hex literal, no `px` font size and no `rem` or `px` radius survives outside `:root`; the only hex left anywhere outside it is inside the standalone `/favicon.svg` document, which is served as an image and cannot see the page's custom properties. Tailwind is absent and arrives with the framework move. |
| headless primitives | Base UI, via shadcn | none | **Open deviation.** Follows the UI-library row. Radix, Vite and Astro are out of the stack entirely and are not alternatives here. |
| component source | shadcn/ui | none | Follows the UI-library row. |
| motion | Framer Motion, CSS transitions for plain state changes | CSS transitions only, on duration and easing tokens | **Accepted deviation.** Every state change in this app is a plain one; 50 transition rules, two `@keyframes`, a `prefers-reduced-motion: reduce` block. Framer Motion would be weight with nothing to spend it on. |
| charts | Recharts when there is a reporting surface | hand-written bars and SVG | **Accepted deviation.** The Compare surface draws one comparative bar form from data the client already holds; a chart library here is a dependency for one shape. |
| icons | Lucide | hand-written inline SVG in one `ui-icon` class | **Accepted deviation.** One set, project-wide, which is the rule the slot exists to enforce. Emoji appear only as category *content* in `data/categories.ts`, never as interface icons. |
| fonts | `next/font` with a self-hosted face | self-hosted Rethink Sans variable woff2 from `@fontsource-variable/rethink-sans`, served by Express with `font-display: swap` and a size-adjusted fallback | **Converged 2026-10-06** on the slot's intent (a self-hosted face with no layout shift) without `next/font`, which arrives with the framework move. |
| state/data/forms | TanStack Query, React Hook Form, Zod | `localStorage` plus direct `@supabase/supabase-js` calls | Follows the UI-library row. |
| tables | TanStack Table | a semantic `<table>` reshaped with CSS grid at narrow widths | **Accepted deviation.** The worksheet is not sorted, filtered or paginated; it is edited in place. |
| database/ORM | Postgres with Drizzle | Postgres on Supabase, SQL migrations, no ORM | **Accepted deviation.** Four `.sql` files with an explicit row-level-security contract. An ORM over four tables under RLS would move the authorization surface away from the file that states it. |
| testing | Playwright end to end, Vitest for units | Playwright via six hand-rolled `.mts` scripts, no `playwright.config.*`, no Vitest | **Open deviation.** 149 checks across five viewports, both themes, keyboard, WCAG, persistence, backup/restore, hostile payloads, zoom and touch targets. Converging on `playwright.config.*` is a real migration rather than a rename and is not taken here. |
| observability | Sentry, PostHog | none | **Accepted deviation.** A signed-out user's data never leaves the browser; adding a third-party beacon would be the first time it did. |

### Motion exception, recorded here because the universal rule says to

`~/.agents/DESIGN.md` § Motion holds that "an instant state change with no transition … reads as unfinished". The tutorial spotlight is a deliberate exception: it snaps rather than animating position, because the tutorial is a discrete-step model and a mid-transition measurement races the tooltip's placement. `.tour-spotlight` in `server.ts` carries the reason, and `tests/verify-live.mts` asserts the snap rather than asserting motion the product had removed on purpose.

### Conventions in force (2026-10-06 compliance pass)

- **Dates.** Short month, day, and year for saved snapshots (`Oct 6, 2026`); month and day for week titles and invite expiry; times as locale hour and minute. No middle-dot or bullet dividers anywhere in visible text: use a comma, semicolon, or colon.
- **Numbers and units.** Hours carry a lowercase `h` suffix with no space (`12.5h`). Whole hours print bare (`40h`), fractions trim trailing zeros to at most two decimals, and snapshot totals use one decimal. Tabular numerals on every aligned quantity.
- **Case.** Sentence case everywhere. There are no uppercase transforms and no eyebrow or kicker labels; a region is named by its heading or an accessible name.
- **Token roles added.** `--weight-regular` (with medium and semibold, the only three weights); `--track-tight`, `--track-snug`, `--track-label` (the only letter-spacing values); `--paper-solid` (opaque control surface, light and dark); `--scrim-modal`, `--scrim-tour`, `--scrim-spot` (overlay dims); `--shadow-thumb`, `--shadow-hair`, `--shadow-pop`, `--shadow-menu`, `--shadow-lift` (the only shadow recipes). `--text-title` and `--text-display` are `clamp()` values that equal 24px and 28px at 375px and above.
- **Layout.** Every margin, padding, and gap reads from `--space-1` to `--space-8`. The Plan category panel is a size container (`category-panel`) and adapts through `@container`; route padding uses `clamp()`.
- **Backdrop blur** lives only on fixed layers (sticky stats, modal, tour tooltip) and the profile popover. The theme toggle and export buttons use the opaque `--paper-solid`.
- **Tutorial spotlight** is the scrim plus a crisp `--accent` ring and one offset neutral shadow; no zero-offset coloured glow.
- **Reduced motion.** No `!important`. Every transition and animation reads `--dur-in` or `--dur-out`, and `@media (prefers-reduced-motion: reduce)` redefines both tokens to `0.01ms` on `:root` and sets `html { scroll-behavior: auto }`, so the outcome holds for every present and future rule that uses the tokens.

## Product character

Professional, calm, direct, and trustworthy. The app should feel like a mature planning instrument: clear enough for a first visit, efficient enough for weekly reuse, and restrained enough to keep attention on the user's hours and decisions.

## Spatial thesis

Every route follows one reading order: global context, selected destination, current task, work surface, next action. Related controls use compact spacing; route sections receive visibly larger separation.

### Layout rails

- App shell: `--content-max` / 78rem.
- Analysis routes (Compare and History): 60rem.
- Reading route (Reflect): 46rem.
- Multi-user Center: 68rem.
- Desktop gutter: `--content-gutter` / 2rem.
- Mobile gutter: `--content-gutter-mobile` / 1.125rem.
- Plan keeps the wide rail because its worksheet needs operational width.

### Spacing

The primitive scale is 4, 8, 12, 16, 24, 32, 48, and 64px (`--space-1` through `--space-8`).

- 4–8px: icon details and tightly related metadata.
- 12px: control clusters and form fields.
- 16px: component internals and toolbar rhythm.
- 24px: cards, headers, and route sections.
- 32–64px: major page separation.

Avoid new arbitrary spacing values. Choose the nearest scale value and preserve one shared horizontal rail.

## Design system: Thrive (2026-10-06)

**Case: completed, not replaced.** The layout rails, spacing scale, nested radius rule, token layer, dark mode by token redefinition and the 20px outline icon set were already sound and stay. What was generic is replaced: the beige-brass-espresso neutrals, the blue accent shared with fellowship-tracker, the platform system font and the hashed category colours that let two categories share a slice.

**Pulled from.** The Thrive world in the harness language library: `doug-harness/.agents/skills/hue/examples/thrive/design-model.yaml`, registered in `doug-harness/.agents/design/languages/registry.md` ("Small steps, tracked honestly, without being cheered at"), rendered at `design-library/worlds/thrive/`. Taken: the parchment neutral ramp with its faint olive bias, the sage accent, the gentle 6/10/16 radii, typography and air doing the work. Left out on purpose: Fraunces and Inter (both banned as defaults by the universal rules), the painterly hero wash (this app has no hero; it is an instrument), and Phosphor icons (one icon family per project, and this one already has its own).

**Character.** A week laid flat: what you planned, what you lived, and the gap. Honest numbers, no applause. **Wrong if** the app adds streaks, badges, confetti or coaching copy.

### Colour

Surface levels are named and off-white or off-black. Dark mode is the same names redefined.

| Token | Role | Light | Dark |
|---|---|---|---|
| `--paper` | page | `#FAF8F4` | `#14110E` |
| `--paper-soft` | card, grouped surface | `#F2EFE8` | `#221F1B` |
| `--paper-deep` | inset, track, selected row | `#E5E0D4` | `#332F29` |
| `--paper-solid` | opaque control surface | `#FDFCFA` | `#2A2621` |
| `--paper-raised` | translucent surface on fixed layers only | `rgba(253,252,250,.72)` | `rgba(34,31,27,.86)` |
| `--ink` | primary text | `#14110E` | `#FAF8F4` |
| `--ink-soft` | secondary text | `#4A453D` | `#E5E0D4` |
| `--ink-faint` | metadata, placeholders (never on `--paper-deep`) | `#6B645A` | `#B3AB9B` |
| `--rule` / `--rule-soft` | hairlines | ink at 10% / 6% | ink at 12% / 7% |
| `--accent` | sage: focus ring, current selection, primary fill | `#5E7855` | `#96AC8C` |
| `--accent-strong` | accent used as text or on `--paper-soft` | `#465C3F` | `#BDCBB5` |
| `--on-accent` | text on a primary fill | `#FAF8F4` | `#14110E` |

Status tokens are separate from the sage accent and always come with a word, sign or icon: `--delta-positive` slate blue (`#2E5F80` / `#8FB8D6`), `--delta-negative` and `--urgent` Thrive rose-700 (`#8E3F2C` / `#E39A86`), `--warn` ochre (`#7A5A12` / `#D9B45E`), `--good` = `--delta-positive`. Each has a `-soft` 12% tint for backgrounds. Measured contrast in light: ink 17.7:1, ink-soft 9.0:1, ink-faint 5.5:1, on-accent on accent 4.6:1, status text 6.0 to 6.8:1 on the page. In dark: ink-faint 8.3:1, accent 7.7:1.

**Category slices** `--slice-1..10` are one muted set for both themes: sage `#6F8F64`, clay `#C27A5E`, slate `#5B7FA6`, ochre `#B8913A`, plum `#8C6A9E`, teal `#4F9A93`, rose `#C9828C`, moss `#8F965A`, sand `#A8957A`, steel `#7C8794`. Each sits at 3:1 or better against both page colours. **A category's colour is its position in the category list, not a hash of its name**, so no two categories share a slice until there are more than ten. With more than ten, the colour repeats and the text label and total still carry the meaning.

### Type

- **Face:** Rethink Sans (OFL-1.1), one variable family for display, interface and prose. It is self-hosted from `@fontsource-variable/rethink-sans` (npm, pinned in the lockfile): the latin woff2 is copied to `public/fonts/` and served at `/fonts/rethink-sans-latin-wght-normal.woff2` with `font-display: swap`. The fallback is the platform sans, tuned with `size-adjust` so that the swap does not reflow. There is no code on screen, so there is no monospace role.
- **Scale:** one ratio, 1.333 (perfect fourth), from a 16px body: `--text-meta` 0.75rem (body / 1.333), `--text-body` 1rem, `--text-title` 1.333rem (× 1.333), `--text-display` `clamp(1.777rem, 1.4rem + 1.6vw, 2.369rem)` (× 1.333² at 375, × 1.333³ = 37.9px at 1440, which is 2.37 × body). There are four sizes in the whole app, and **at most three on any one screen**. The masthead wordmark is `--text-title`. Route headings are `--text-display`. Card and section headings are `--text-body` at semibold, so hierarchy comes from weight. Metadata, table headings and chips are `--text-meta`. `--text-ui` and `--text-section` survive only as aliases of body and title, so old selectors keep resolving.
- **Weights:** 400 for prose, 500 for controls, 600 for headings and totals. **Tracking:** display `-0.02em`, body 0, meta `0.01em`. **Measure:** 68ch. **Leading:** 1.15 display, 1.4 interface, 1.6 prose. All quantities use tabular numerals.

### Space, shape, elevation

- **Space:** `--space-1..8` = 4, 8, 12, 16, 24, 32, 48, 64px, unchanged.
- **Radii:** Thrive's softer set. `--radius-xs` 6px (chips, color keys), `--radius-control` 10px (buttons, fields), `--radius-surface` 16px (cards, panels), `--radius-overlay` 16px (menus, dialogs), `--radius-pill` 999px (status pills, segmented track). An inner radius is never larger than its container's.
- **Elevation**, each declared once per surface (a border or a shadow, never both):
  - Level 0, the page: flat.
  - Level 1, cards and grouped surfaces: a tinted `--paper-soft` fill with no border and no shadow. Grouping comes from spacing, then tint.
  - Level 2, menus, popovers and the sticky stats bar: `--shadow-pop`, a wide soft shadow tinted toward warm ink at 8–10%, with no border.
  - Level 3, dialogs and the tour tooltip: `--shadow-modal`, a wider and softer shadow, plus the scrim.
  - Hairlines (`--rule`) are kept for table rows, input edges and dividers, where a rule does a job.

### Packet 1 record (2026-10-06)

- **Slices as built.** Four spec values sat under 3:1 against `#FAF8F4` and were lowered in lightness only: `--slice-4` ochre `#AE8937`, `--slice-7` rose `#C57984`, `--slice-8` moss `#8D9358`, `--slice-9` sand `#A08C6E`. The other six are as specified. All ten measure 3.06:1 or better on `#FAF8F4` and 4.18:1 or better on `#14110E`.
- **Type roles as built, differing from the spec.** The spec puts the wordmark on `--text-title` and route headings on `--text-display`, which with body and meta gives four sizes on every route, over the three-per-screen cap. The wordmark is therefore `--text-body` at semibold, route headings and the donut total are `--text-display`, dialog titles are body at semibold, and `--text-title` stays defined for later use. Measured per screen at 1440 and 375: Plan, Compare, Reflect, History, Center and every dialog show exactly three sizes (12px, 16px, display).
- **Category colour follows position.** `colorFor` takes the slice at the category's index in the ordered list, so reordering a category changes its colour with its position.
- **Fallback face.** `Rethink Sans Fallback` is `local("Arial")` with `size-adjust` 104.47%, `ascent-override` 94.76%, `descent-override` 29.67% and `line-gap-override` 0%, measured against the shipped woff2.

### Motion

The motion inventory is under Design system: Thrive. `--dur-in` handles direct hover and press feedback, `--dur-out` handles state changes, and `--dur-draw` is reserved for the week-band draw-in.

## Content

- State the task once.
- Saved state belongs in the global save status.
- Navigation labels need no numbering or icons.
- Helper text earns its space by explaining a consequence, resolving ambiguity, or providing recovery.
- Errors state what happened and the next available action.
- Privacy and destructive-action consequences remain explicit.
