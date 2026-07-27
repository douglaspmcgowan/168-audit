# Interface Distillation Implementation Plan

> **For Codex:** Execute each task with regression verification before advancing.

**Goal:** Reduce the visual and interaction weight of every app surface while preserving the complete 168-hour audit and its recovery paths.

**Architecture:** Keep the current local document model and rendering functions. Improve information hierarchy and progressive disclosure within each renderer, then add focused browser assertions for behavior and density.

**Tech Stack:** Express, browser JavaScript, CSS, Playwright, axe-core.

---

## Task 1: Plan density and controls

- [x] Replace Snapshot with a named camera icon.
- [x] Replace the Numbers/Sliders segmented control with one dynamic named icon.
- [x] Keep both controls adjacent at the right edge of the toolbar.
- [x] Reduce narrow-screen row padding, repeated labels, and category ornament.
- [x] Preserve numeric, slider, note, category, subcategory, delete, and totals behavior.

## Task 2: Optional multi-user Center

- [x] Add Center to the global workflow navigation.
- [x] Provide a useful configured, signed-out, signed-in, and unavailable state.
- [x] Keep privacy language explicit and close to sharing controls.
- [x] Add responsive Center layouts and accessibility semantics.

## Task 3: Remaining surface distillation

- [ ] Condense the masthead and remove repeated save/privacy copy.
- [ ] Hide negligible Compare rows initially and add Show all.
- [ ] Convert Reflect into a four-prompt guided sequence.
- [ ] Convert History into a compact timeline and two-week selection mode.
- [ ] Rename Profile to Schedule and replace native prompts/confirms.
- [ ] Group Data actions and consolidate Help into one walkthrough.

## Task 4: Verification

- [x] Run the existing full local workflow suite.
- [x] Assert icon-control count, names, and visible-text removal.
- [x] Assert Center privacy language, selection semantics, mobile containment, CSP client route, and axe baseline.
- [ ] Add 200% zoom density assertions.
- [ ] Add signed-in persona tests against a disposable Supabase project.
