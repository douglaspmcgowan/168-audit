<!-- agent-harness:universal-design:v1:start -->
## Universal interface rules

- Never use IBM Plex Mono.
- Use a proportional body face for prose, navigation, labels, dates, names, and human-readable metadata.
- Reserve monospace for code, commands, identifiers, timestamps, and genuinely tabular numeric data.
- Define explicit body, display, and monospace roles. Use tabular numerals on the proportional face for aligned quantities.
- Establish hierarchy through size, weight, spacing, and placement before decoration.
- Give each screen a clear primary action or reading path. Use spacing and alignment to show relationships.
- Reuse existing tokens and components before adding variants.
- Cover relevant default, hover, focus, active, disabled, loading, empty, error, and success states.
- Use semantic structure and native controls, visible keyboard focus, logical tab order, accessible names, sufficient contrast, and non-color state cues.
- Support narrow, medium, and wide layouts, zoom, text resizing, touch targets, and reduced motion.
- Inspect the existing design system, screenshots, and implementation before proposing a new rule or component.
- Verify browser-visible work with browser or end-to-end tests across responsive, keyboard, loading, empty, and error behavior.

### Design libraries

Concrete things to reach for — animation packages and working skeletons, icon kits, typeface pools, design-system install commands and canonical documentation. Read the leaf you need; each one loads on its own.

- **Index** `~/.agents/design/LIBRARIES.md`
- **Motion** `~/.agents/design/animation/` — libraries, sticky-stack, horizontal-pan, scroll-reveal, frosted glass, forbidden patterns
- **Icons** `~/.agents/design/icons/libraries.md`
- **Type** `~/.agents/design/type/families.md`
- **Design systems** `~/.agents/design/systems/install.md` and `sources.md`
- **Design languages** `~/.agents/design/languages/registry.md` — read it before committing a visual world or generating a new design language, and register the world committed for this project there in the same work unit

The full universal rules are `~/.agents/DESIGN.md`. Where a library entry and a rule disagree, the rule wins.
<!-- agent-harness:universal-design:v1:end -->

# 168 Audit Design System

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

## Typography

Use the system sans stack throughout. The hierarchy has six roles:

| Role | Token | Size | Use |
|---|---|---:|---|
| Metadata | `--text-meta` | 12px | labels, saved state, table headings, compact status |
| UI | `--text-ui` | 14px | navigation, buttons, menus, dense rows |
| Body | `--text-body` | 16px | instructions, prompts, explanations |
| Section | `--text-section` | 20px | card and subsection headings |
| Title | `--text-title` | 24px | route headings |
| Display | `--text-display` | 28px | product title and top-level Center heading |

Use `--leading-tight` for headings, `--leading-ui` for controls and metadata, and `--leading-body` for prose. Hours and totals use tabular numerals. Uppercase metadata remains concise and never drops below 12px. Reading text stays within `--measure` / 68ch.

## Color

- Neutral paper and ink establish hierarchy.
- Blue accent is reserved for focus, current selection, and primary action.
- Success, warning, and critical colors always include text or an icon.
- Both themes maintain WCAG AA contrast.
- Native scrollbars use theme-coordinated track, thumb, hover, and rounded geometry.

## Shape

The radius hierarchy is nested:

- `--radius-xs` / 4px: tiny internal details.
- `--radius-control` / 6px: buttons, fields, row controls, icons.
- `--radius-surface` / 10px: cards and grouped surfaces.
- `--radius-overlay` / 12px: menus and dialogs.
- `--radius-pill`: statuses and true pills only.

An inner element never has a larger radius than its containing surface.

## Components

- Navigation uses five text labels with an underline for the active destination.
- Route toolbars share spacing, divider, type, and control-height rules.
- All interactive controls have a 44px minimum target.
- Cards group a distinct task or entity. Dividers and whitespace handle ordinary row separation.
- Icon actions use the shared 20×20 outline SVG language and require accessible names.
- Empty states use a concise heading, one recovery sentence, and one primary action.
- Dialogs share overlay radius, padding, focus entry, focus containment, Escape handling, and focus return.
- Status text is brief, live-region compatible, and placed near the state it describes.

## Route rules

- Plan: wide worksheet, one stage title, stage selector, compact actions, clear totals.
- Plan category manager: Focus and All-category views share one data model; category colors link group headings to the live allocation donut and expanded legend.
- Compare: ranked differences first, totals adjacent to the heading, optional charts below disclosure.
- Reflect: one question at a time, short progress label, prior answers and reference material under disclosure.
- History: compact snapshot list with comparison and safe deletion.
- Center: one 68rem rail, clear signed-in state, entity cards, explicit sharing and membership consequences.

## Responsive behavior

- Preserve the five destination labels down to 320px.
- Plan changes from table to structured editing rows without horizontal page scrolling.
- Analysis and reading routes become single-column layouts.
- Center forms and member controls stack while identity text receives the flexible width.
- Mobile chrome is compressed so the current task begins in the first viewport where practical.
- Long labels wrap when they carry meaning; secondary metadata may truncate.

## Motion

Use `--dur-in` for direct hover/press feedback and `--dur-out` for state changes. Motion communicates view, menu, save, tour, and validation changes. `prefers-reduced-motion` reduces transitions to effectively immediate state changes.

## Content

- State the task once.
- Saved state belongs in the global save status.
- Navigation labels need no numbering or icons.
- Helper text earns its space by explaining a consequence, resolving ambiguity, or providing recovery.
- Errors state what happened and the next available action.
- Privacy and destructive-action consequences remain explicit.
