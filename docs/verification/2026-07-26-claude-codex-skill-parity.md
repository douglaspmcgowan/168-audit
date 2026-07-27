# Claude → Codex Skill Parity

Date: 2026-07-26  
Shared Codex-readable catalog: `C:\Users\dougl\.agents\skills`

## Outcome

- Claude skill packages discovered: 50
- Claude slash commands discovered: 107
- Shared skill packages after synchronization: 154
- Missing Claude capabilities after synchronization: 0
- Invalid or duplicate skill names: 0
- Tactician Codex port: `C:\Users\dougl\.agents\skills\source-command-tactician\SKILL.md`
- `claude-sync` is represented by the machine-appropriate `Codex-sync` skill.

OpenAI’s Agent Skills format uses a directory containing `SKILL.md` with `name` and `description` frontmatter. The synchronized catalog follows that structure. A fresh Codex task will index the added metadata at startup.

## Added Claude skill packages

`brandkit`, `build-reviewer`, `chrome-cdp`, `design-taste-frontend-v1`, `frontend-slides`, `full-output-enforcement`, `gpt-taste`, `high-end-visual-design`, `html-ppt`, `html-slides`, `html-slides-pointer`, `image-to-code`, `imagegen-frontend-mobile`, `imagegen-frontend-web`, `industrial-brutalist-ui`, `minimalist-ui`, `pptx-slides`, `redesign-existing-projects`, `slide-design`, `slides`, `slides-ultra`, `stitch-design-taste`, and `wayfinder`.

## Added Claude command ports

`add-ci`, `app-verification-chain`, `assets`, `build-explorable`, `cache-check`, `conductor`, `daily-review`, `declutter`, `detective`, `docket`, `environment-preflight`, `handoff`, `harness-keying`, `janitor`, `learn`, `make-cli`, `make-mcp`, `news-digest`, `overnight`, `permcheck`, `requesting-code-review`, `research-asset-manifest`, `review-lenses`, `schema-research`, `solo-review`, `spec`, `sync-obsidian`, `tactician`, `test-driven-development`, `ui-feature-ledger`, `ultraskill`, `user`, `video-cut`, and `writing-skills`.

Each command is represented as `source-command-<name>/SKILL.md`, preserving the source command’s description and full workflow.

## Validation

- Dry-run parity scan: zero missing packages or commands.
- Structural scan: all 154 shared packages contain `SKILL.md`.
- Frontmatter scan: all 154 packages contain a valid `name` and `description`.
- Name scan: zero invalid names and zero duplicate declared names.
- The bundled `quick_validate.py` could not run because its Python environment lacks PyYAML. The equivalent structural/frontmatter/name checks were run directly.

## Durable maintenance

Run from the 168 Audit worktree:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools\sync-claude-skills-to-agents.ps1
```

The default mode reports drift and makes no changes. Add `-Apply` to copy missing skill packages and create missing command ports. The script refuses to overwrite existing packages.
