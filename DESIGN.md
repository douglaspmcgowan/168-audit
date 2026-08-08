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
- **Surface craft** `~/.agents/design/craft/` — `high-end.md` (surface construction), `from-reference.md` (building faithfully from a reference image), `device-mockups.md`
- **Pre-ship matrix** `~/.agents/design/preflight.md` — the mechanical finish check for landing, marketing and portfolio surfaces; not dashboards, not product UI
- **Dashboards and data-dense product UI** — this tree does not own them yet, and the gap is easy to miss because everything above *sounds* general. The pre-ship matrix disclaims them in its own scope line, and the universal rules below contain no rule about chart form, tile hierarchy, table craft or metric emphasis. The nearest real guidance is the ten-dimension rubric inside the `/design-review` command — tile prominence, one-accent discipline, elevation over borders, chart form matched to the data's meaning, tables built as tools — which is written to critique a running app rather than to generate one. A blind probe on 2026-08-08 reached it only by grepping the word "dashboard", and reported it would otherwise have "proceeded confidently and wrongly". Read it before designing a dashboard, and treat the rest of this section as not yet covering you

The full universal rules are `~/.agents/DESIGN.md`. Where a library entry and a rule disagree, the rule wins.

**This list is enumerated because it has to be.** A cloud or container session has no `~/.agents` to walk, so this block is the only routing it gets — which also means a leaf missing here is a leaf that session cannot reach at all. `craft/` and `preflight.md` were absent until 2026-08-07 and every project copy inherited the gap. `Test-DesignLibraryIndex.ps1` now fails the build when this list falls behind the tree.
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
