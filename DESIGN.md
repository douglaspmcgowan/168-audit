---
name: 168 — Audit Your Week
description: A quiet, editable paper worksheet for planning an ideal week and logging the actual one against the 168-hour ceiling.
colors:
  paper: "#FAFAF7"
  paper-soft: "#F2EEE5"
  paper-deep: "#E7E1D5"
  paper-raised: "rgba(255, 255, 255, 0.62)"
  ink: "#0F0F0E"
  ink-soft: "#5B564E"
  ink-faint: "#8A847A"
  rule: "rgba(15, 15, 14, 0.09)"
  rule-soft: "rgba(15, 15, 14, 0.05)"
  accent: "#2D5BFF"
  accent-soft: "rgba(45, 91, 255, 0.10)"
  accent-line: "rgba(45, 91, 255, 0.18)"
  good: "#2F6B3F"
  good-soft: "rgba(47, 107, 63, 0.12)"
  warn: "#8C6239"
  warn-soft: "rgba(140, 98, 57, 0.12)"
  urgent: "#C53838"
  urgent-soft: "rgba(197, 56, 56, 0.12)"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "clamp(1.45rem, 2.5vw, 1.8rem)"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.028em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "0.96rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  xxl: "14px"
  pill: "999px"
spacing:
  xs: "0.3rem"
  sm: "0.55rem"
  md: "0.9rem"
  lg: "1.4rem"
  xl: "2rem"
  xxl: "3.4rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.95rem 0.52rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.95rem 0.52rem"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.95rem 0.52rem"
  chip-good:
    backgroundColor: "{colors.good-soft}"
    textColor: "{colors.good}"
    rounded: "{rounded.pill}"
    padding: "0.22rem 0.55rem 0.24rem"
  chip-warn:
    backgroundColor: "{colors.warn-soft}"
    textColor: "{colors.warn}"
    rounded: "{rounded.pill}"
    padding: "0.22rem 0.55rem 0.24rem"
  chip-urgent:
    backgroundColor: "{colors.urgent-soft}"
    textColor: "{colors.urgent}"
    rounded: "{rounded.pill}"
    padding: "0.22rem 0.55rem 0.24rem"
  card-raised:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  input-number:
    backgroundColor: "{colors.paper-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "0.3rem 0.55rem"
  modal-panel:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xxl}"
    padding: "1.75rem 1.85rem 1.4rem"
---

# Design System: 168 — Audit Your Week

## 1. Overview

**Creative North Star: "The Kept Ledger"**

PRODUCT.md says it plainly: this should feel "like a well-kept ledger, not a dashboard trying to sell you something." That line is the whole system. 168 is not a productivity SaaS with a hero-metric tile and a gradient CTA, and it is not a gamified habit tracker handing out streaks and confetti — it's a single sheet of paper you are trusted to write on directly. Every cell is editable in place. Every number reconciles against one fixed, unforgiving constant: 168 hours in a week. The visual language exists to keep that ledger legible, not to decorate it.

The system runs on one typeface, one accent color used sparingly, and a near-white "paper" surface with ink-colored text and hairline rules standing in for gridlines. Structure comes from borders and spacing, not drop shadows — this is a flat sheet, not a stack of floating cards pretending to have physical depth. Where elevation does appear (modals, tooltips, the profile menu), it is reserved for things that genuinely leave the page plane, which keeps it meaningful instead of decorative.

**A deliberate call on `--paper` (#FAFAF7):** a warm near-white body background is impeccable's own flagged "saturated AI default" pattern, and it would deserve a Don't in most audits. Here it is judged as earned, not accidental: the product's entire metaphor is a paper worksheet, `--paper` is not a lone accent wash but the anchor of a full four-step paper ramp (`paper` / `paper-soft` / `paper-deep` / `paper-raised`) that does real structural work (base surface, hover fill, divider fill, floating-panel fill), and it is paired with a true near-black ink (`#0F0F0E`, not a washed-out gray) rather than the low-contrast pairing that usually signals the lazy AI-cream pattern. Downstream agents should not re-litigate this token — it stays. It should, however, stay exactly this restrained: if `--paper` starts creeping toward peach, tan, or gradient territory, that is the point where it tips into the pattern this call is deliberately avoiding.

**Key Characteristics:**
- One typeface for the entire interface — hierarchy comes from weight, size, tracking, and case, never from switching fonts.
- Flat by default: hairline `--rule` borders substitute for shadows everywhere except true floating overlays.
- A single accent (`--accent`, Signal Blue) rationed to interactive/active moments — links, focus, the primary action, the active tab.
- Plan and Actual are peers everywhere: rendered in two distinct, permanent colors (blue ink vs. graphite pencil), never as one buried under the other.
- Every corner radius, color, and spacing value comes from a small closed set — nothing bespoke per screen.

## 2. Colors

The palette reads as ink and paper first, color second: warm off-white surfaces, near-black ink, hairline rules, and exactly one saturated hue held in reserve for things that matter.

### Primary
- **Signal Blue** (`#2D5BFF`, dark theme `#7A9CFF`): the only saturated color in the system. Used for the brand eyebrow, links, focus rings, the primary button, the active view-tab underline, and — critically — as the fixed color of the "Plan" series everywhere plan and actual are compared (donut, bars, sliders).

### Secondary
- **Graphite Ink** (`--ink-soft`, `#5B564E`, dark theme `#B9B09F`): not a second accent hue but a deliberate neutral counterpart to Signal Blue. It is the fixed color of the "Actual" series in every plan-vs-actual view (bar fills, slider tracks, delta comparisons) — pen-blue for the plan you wrote in advance, pencil-gray for what actually happened. This pairing is load-bearing: it is how a user tells the two data series apart without reading a legend.

### Tertiary
- **Ledger Green** (`--good`, `#2F6B3F` / dark `#6FBF7E`): under-budget / on-track verdicts, positive deltas.
- **Warm Umber** (`--warn`, `#8C6239` / dark `#D2AD79`): near-ceiling / caution verdicts, over-slider-max warnings.
- **Ledger Red** (`--urgent`, `#C53838` / dark `#FF7B75`): over-168h verdicts, negative deltas, destructive actions (row delete, snapshot delete).

### Neutral
- **Paper** (`--paper`, `#FAFAF7` / dark `#15120E`): the base page surface — see the Overview note on why this cream tone is an earned choice here, not a default.
- **Paper Soft** (`--paper-soft`, `#F2EEE5` / dark `#1D1914`): hover fill for editable cells, input backgrounds, track backgrounds for sliders/bars.
- **Paper Deep** (`--paper-deep`, `#E7E1D5` / dark `#272118`): declared but not yet wired into any component rule — treat as reserved, not dead; wire it up deliberately before repurposing.
- **Paper Raised** (`--paper-raised`, translucent white 62% / dark translucent `#272118` 86%): the surface for anything that floats above the page — modals, tooltips, the profile menu, cards, the theme toggle. Always paired with `backdrop-filter: blur(...)` so content scrolling underneath stays legible through it; this is functional (keep floating chrome readable), not a decorative frosted-glass treatment layered onto flat surfaces.
- **Ink** (`--ink`, `#0F0F0E` / dark `#E9E2D2`): primary text, high-emphasis numerals, category names.
- **Ink Soft** (`--ink-soft`, `#5B564E` / dark `#B9B09F`): secondary text, sub-category labels, body copy in cards. Doubles as the Secondary "Actual" data color (see above).
- **Ink Faint** (`--ink-faint`, `#8A847A` / dark `#877C6B`): tertiary text — table headers, uppercase eyebrows, placeholder text, disabled affordances.
- **Rule / Rule Soft** (`rgba(15,15,14,0.09)` / `0.05`, dark `rgba(233,226,210,0.12)` / `0.07`): the hairline gridlines that do the structural work shadows would do elsewhere — table borders, card outlines (as `inset 0 0 0 1px`), section dividers.

### Named Rules
**The One Accent Rule.** Signal Blue is the only saturated color permitted for non-semantic UI. If a new element wants a splash of color to feel "alive," the answer is almost always no — reach for weight, spacing, or an existing neutral first.

**The Pen-and-Pencil Rule.** Plan is always Signal Blue; Actual is always Graphite Ink (`--ink-soft`). This pairing is fixed across every view (worksheet, compare, sliders, exports) and must never be reassigned, recolored per-chart, or left to a default categorical palette — it is how the product's central metaphor (plan vs. reality) stays readable without a legend.

## 3. Typography

**Display Font:** -apple-system / SF Pro (with BlinkMacSystemFont, Segoe UI, system-ui, sans-serif fallback)
**Body Font:** same stack
**Label/Mono Font:** same stack — there is no separate monospace font (`--mono` is a literal alias of `--sans`)

**Character:** A single native system sans doing every job in the interface — quiet, fast-loading, and unremarkable by design, exactly as a ledger's handwriting should be. Hierarchy is built entirely through weight, size, negative tracking on larger sizes, and uppercase micro-labels — never by mixing typefaces.

### Hierarchy
- **Display** (600, `clamp(1.45rem, 2.5vw, 1.8rem)`, line-height 1.06, tracking -0.028em): the brand title in the masthead. The single largest piece of type on the page; grows further to `clamp(1.5rem, 4vw, 2rem)` in mobile "app" card-stack mode.
- **Headline** (600, 1.45rem, line-height 1.18, tracking -0.02em): modal titles ("What is 168?", the tutorial).
- **Title** (600, 1.02rem, tracking -0.015em): category names in the worksheet table, snapshot labels, history diff titles — the names of the things being audited.
- **Body** (400, 0.9–1.02rem, line-height 1.55–1.66): masthead lede, insight callouts, modal copy, reflection answers. Body copy carries `text-wrap: pretty` and caps measure at `--measure: 65ch`.
- **Label** (500, 0.66–0.78rem, tracking 0.08em via `--label-spacing`, uppercase): table column headers, section eyebrows, the brand eyebrow, sticky-stat labels, colophon. This is the system's substitute for a second typeface — where another system would reach for a mono font, this one reaches for uppercase + tracking on the same sans.

Numerals get their own micro-rule: body prose uses `font-variant-numeric: oldstyle-nums` (numbers sit in the text like lowercase letters), while every counted value — hours, totals, stats, table figures — uses `tabular-nums` so columns of numbers align on a grid. This split is deliberate and should not be collapsed.

### Named Rules
**The One Typeface Rule.** The entire interface — display titles down to table headers — runs on a single system sans stack. `--mono` is not a second font; it is `var(--sans)` styled with uppercase and letter-spacing. Never introduce a second `font-family` (no serif for "editorial" moments, no real monospace for "technical" moments); build the distinction with weight, size, tracking, and case instead.

**The Tighter-When-Bigger Rule.** Letter-spacing tightens as size increases: −0.028em at Display, −0.02em at Headline, −0.015em at Title, roughly normal at Body, and +0.08em (loosened, uppercase) at Label. A new size added to the scale must sit on this same curve.

## 4. Elevation

This is a flat, paper-plane system, not a stack of floating cards. At rest, every surface — the worksheet table, insight callouts, reference cards, snapshot rows — sits flush on the page and is separated from its neighbors by a 1px `--rule`/`--rule-soft` hairline or an `inset 0 0 0 1px` ring, never a drop shadow. The one real shadow token in active use, `--shadow-modal` (`0 28px 72px rgba(15,15,14,0.18)`, dark `0 30px 80px rgba(0,0,0,0.52)`), is reserved exclusively for elements that genuinely leave the page plane: the modal panel, the guided-tour tooltip, and the profile dropdown menu. A second token, `--shadow-card`, is declared for both themes but is not currently referenced by any component rule — treat it as reserved for a future genuinely-elevated card, not as available scrap to bolt onto existing flat surfaces.

Small directional shadows (2–6px blur) do appear on hover states — the primary button, the export FAB, slider thumbs — but these read as tactile "lift toward the cursor" feedback on an already-flat surface, not structural depth cues. They are always paired with a `translateY(-1px)` or `translateY(-2px)` nudge, not used alone.

### Shadow Vocabulary
- **Modal** (`--shadow-modal`: `0 28px 72px rgba(15, 15, 14, 0.18)`; dark `0 30px 80px rgba(0, 0, 0, 0.52)`): the only shadow for content that floats above the page plane — modal panel, tour tooltip, profile menu.
- **Hover lift** (e.g. `0 4px 14px rgba(45, 91, 255, 0.28)` on the primary button, `0 12px 28px rgba(45, 91, 255, 0.28)` on the export FAB): a soft, accent-tinted glow that appears only on `:hover`, paired with a small upward translate. Never present at rest.
- **Reserved / unused** (`--shadow-card`: `0 18px 30px rgba(15, 15, 14, 0.035)`; dark `0 18px 32px rgba(0, 0, 0, 0.28)`): declared, not yet applied anywhere. Do not repurpose casually — decide deliberately if a surface has earned real ambient elevation before wiring this in.

### Named Rules
**The Flat-Plane Rule.** Nothing sits at rest with a drop shadow. If a surface needs separation from its neighbor, reach for a 1px `--rule` border or an `inset` ring before reaching for `box-shadow`. Shadows are earned only by leaving the page plane (modals, tooltips, menus) or by direct hover feedback.

## 5. Components

Buttons, chips, and inputs share one shape language (pill buttons/chips, small-radius inputs/cards) and one restraint: color is applied to convey state and meaning, never decoration.

### Buttons
- **Shape:** full pill (`border-radius: 999px`).
- **Primary:** `--accent` background, white text (`--ink` on dark theme for contrast), no shadow at rest; on hover gains a soft accent-tinted glow (`0 4px 14px rgba(45, 91, 255, 0.28)`) and lifts 1px.
- **Hover / Focus:** all buttons transition on the asymmetric duo below; focus-visible gets a 2px `--accent` outline offset 3px, never a glow-only focus state.
- **Secondary / Ghost:** `.btn-secondary` is a hairline-outlined ghost (`inset 0 0 0 1px var(--rule)`) that turns accent-outlined on hover; `.btn-quiet` is fully transparent at rest, filling with `--paper-soft` on hover. Both keep the same pill shape and padding as primary — only fill and border change.

### Chips
- **Style:** pill-shaped, soft-tinted background (`*-soft` token) with matching-hue text and a matching 18–22%-opacity inset ring. Uppercase, 0.7rem, tracked +0.04em.
- **State:** three fixed semantic variants only — `chip-good`, `chip-warn`, `chip-urgent` — mapped to verdicts (under / near / over the 168h ceiling). No neutral or "selected" chip variant exists; chips are exclusively for ceiling-status verdicts.

### Cards / Containers
- **Corner Style:** small radii throughout — 8px for reference cards and snapshot rows, 10px for insight callouts and app-mode table-row cards, 12–14px for floating overlays (tour tooltip, modal panel, history-empty state).
- **Background:** `--paper-raised` (translucent, blurred) for anything that reads as "lifted" — cards, menus, modals — vs. flat `--paper`/`--paper-soft` for in-page surfaces like table cells and inputs.
- **Shadow Strategy:** none at rest (see Elevation); only overlay-class containers (modal, tooltip, menu) carry `--shadow-modal`.
- **Border:** `inset 0 0 0 1px var(--rule-soft)` standing in for a shadow's separation function.
- **Internal Padding:** 0.75–1.2rem for compact cards (snapshot rows, reference cards), 1.75rem+ for modal panels.

### Inputs / Fields
- **Style:** number inputs use a filled `--paper-soft` background with a 1px `--rule` border and 4px radius; inline-editable text cells (category/sub-category names, notes) are borderless and transparent until interaction, revealing a hairline border and `--paper-soft` fill on hover only.
- **Focus:** a solid 2px `--accent` outline (`outline-offset: 0`), background shifts to full `--paper`, border becomes transparent — the outline alone carries the focus signal, never a glow or ring shadow.
- **Error / Disabled:** no distinct error state exists on inputs themselves; over-ceiling states are communicated one level up, via the ⚠ marker + `--warn` color on `.range-cell.over-max` and via the verdict chip on the row/total, not by recoloring the input border.

### Navigation
- **Style:** the view switcher (`Worksheet / Compare / Reflect / History`) is a flat text-tab bar (`.view-tab`) with no background or pill — active state is a 2px `--accent` underline plus full-opacity `--ink` text; inactive tabs sit at 72% opacity in `--ink-faint`. No icons, no badges, no counts. Default/hover/active only — no third "visited" state.
- **Mobile treatment:** the tab row wraps rather than collapsing into a hamburger or scroll-snap carousel; it stays flat text at every breakpoint.

### Toggle Pairs (signature component)
The Numbers/Sliders input-mode toggle, the App/Dashboard view-mode toggle, and light/dark theming all share one pattern: a pill-shaped track (`--paper-raised` or `--paper-soft`, `inset 0 0 0 1px var(--rule)`) containing pill sub-buttons where the active option gets a solid, high-contrast fill (`--ink`-on-`--paper` for view-mode; `--paper-raised` + ring for input-mode) rather than an accent fill. Reserve Signal Blue for the primary action; use this ink-on-paper contrast pattern for binary mode switches instead, so the "current mode" reads as a state, not an action to take.

## 6. Do's and Don'ts

### Do:
- **Do** keep the interface to one typeface (the system sans stack) and build all hierarchy from weight/size/tracking/case, per the One Typeface Rule.
- **Do** ration Signal Blue (`#2D5BFF` / dark `#7A9CFF`) to interactive and "Plan" moments only — focus rings, the primary button, links, the active tab, and the Plan data series.
- **Do** keep Plan rendered in `--accent` and Actual rendered in `--ink-soft` everywhere the two are compared, per the Pen-and-Pencil Rule — never substitute a categorical/rainbow palette for this pairing.
- **Do** separate surfaces with a 1px `--rule`/`--rule-soft` hairline or `inset` ring before reaching for `box-shadow`.
- **Do** reserve `--shadow-modal` for content that leaves the page plane (modals, tooltips, dropdown menus) — nothing else.
- **Do** keep every value editable inline with no settings screen required, per PRODUCT.md's "every value is user-editable inline" principle — new controls belong in the cell/row itself, not behind a gear icon.
- **Do** keep the 168-hour ceiling legible in every view (stat bar, chip verdicts, totals row), per PRODUCT.md: "the 168-hour ceiling is the one number that always has to be legible and correct."

### Don't:
- **Don't** build a productivity-SaaS landing page: no hero-metric tiles, no gradient CTAs, no marketing chrome — PRODUCT.md's anti-references, verbatim.
- **Don't** gamify the tool with streaks, badges, or confetti — "the tone is reflective, not motivational," per PRODUCT.md.
- **Don't** introduce a second accent hue or a rainbow categorical palette for chart series; the only sanctioned second "color" for data is `--ink-soft`, used specifically as the Actual counterpart to Plan.
- **Don't** add drop shadows to elements that sit flush on the page (table rows, worksheet cells, in-page cards) — that is what `--rule`/`--rule-soft` borders are for.
- **Don't** silently repurpose `--shadow-card` — it is currently unused by any component; wire it in deliberately or leave it declared-but-dormant, don't reach for it as free elevation.
- **Don't** let `--paper` drift toward peach, tan, or a gradient wash. It is earned here specifically because it stays a restrained near-white anchoring a real neutral ramp with true near-black ink — the moment it saturates further, it becomes the generic AI-cream default this system deliberately avoids.
- **Don't** mix in a second typeface (a serif for "editorial" headers, a real monospace for "technical" numbers) — the Label role already substitutes uppercase + tracking for that job.
- **Don't** relabel or re-skin the semantic trio (`--good` / `--warn` / `--urgent`) for anything other than ceiling-status verdicts and deltas; they are not general-purpose success/warning/error colors for arbitrary UI chrome.
