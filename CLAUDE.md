# 168-audit — project instructions

Single-file Express app (`server.js`): inline HTML/CSS/JS, no bundler. Playwright tests in `tests/verify-live.mjs`. See README.md for run/test commands.

## Routing defaults (ported from global config)

- Any UI/frontend/design task (build, redesign, critique, polish, theming, hardening) routes through **`impeccable`** by default (`.claude/skills/impeccable`). Don't wait to be asked — invoke it proactively for design-shaped work.
- Frontend/browser-visible changes get verified with **Playwright** (`npm run test:local`), not preview screenshots alone.
- Before calling any non-trivial change "done," run an adversarial/independent verification pass — a fresh agent that didn't write the change checks it, per `.claude/skills/walmart-ultrareview`.
- `.claude/skills/doctor` — full project audit (security, test coverage, automation) when doing a broad health check.
- `.claude/skills/tech-debt-audit` — structured tech-debt sweep.
- `.claude/skills/playwright-setup` — audit/extend the Playwright test setup.

## Coding principles

- Simplicity first: minimum code that solves the problem, no speculative abstractions.
- Surgical changes: touch only what a task requires; match existing style (single-file inline HTML/CSS/JS pattern — don't introduce a build step or split into a framework without being asked).
- No "it's X, not Y" antithesis construction in any prose/copy/commit messages.
- State done only after the verification signal (tests green, independent review) has actually run — not just "should work."
