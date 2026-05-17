# 168 — Audit Your Week

Interactive web app for the "168 hours" weekly time audit. Plan an ideal week, log your actual week, see live totals against 168h, and export your data.

Live: https://168-audit.vercel.app
Source note: https://dpm5970digitalgarden.vercel.app/168-audit-your-week/

## Why

168 hours in a week. 24 × 7. The original note in Doug McGowan's digital garden is a static worksheet — you can read it but you have to copy the table into a spreadsheet to actually use it. This is the interactive version: edit cells, see totals update, compare ideal vs actual side-by-side, and download your results.

## Run locally

```bash
npm install
npm start
# → http://localhost:3168
```

## Test

```bash
npm run test:local   # against localhost:3168
npm run test:live    # against the deployed Vercel URL
```

Tests use Playwright. Screenshots land in `tests/screenshots/`. The suite covers desktop (1440×900) and mobile (iPhone 13 + 320px) for both light and dark themes, and exercises every tab and the export buttons.

## Stack

- Express, single-file (`server.js`)
- Inline HTML, CSS, JS — no bundler, no build step
- `localStorage` for persistence
- Vercel for deploy (`@vercel/node`)

Matches the house pattern from [conference-tracker](https://github.com/douglaspmcgowan/conference-tracker) and [site-runtime-baseline](https://github.com/douglaspmcgowan/site-runtime-baseline).

## Customizing categories

`data/categories.js` seeds the worksheet. You can also add/remove/rename rows live in the app; changes persist to `localStorage` under the key `168-audit:v1`. Clearing the key (or hitting "Reset to defaults") restores the seeded set.

## License

MIT.
