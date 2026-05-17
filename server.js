const express = require("express");
const { DEFAULT_ROWS, REFERENCE, REFLECTION, TARGET_HOURS } = require("./data/categories");

const app = express();
const PORT = process.env.PORT || 3168;

app.get("/health", (req, res) => res.send("ok"));

app.get("/favicon.svg", (req, res) => {
  res.set("Content-Type", "image/svg+xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=86400");
  res.send(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" rx="6" fill="#15120E"/>' +
      '<circle cx="16" cy="16" r="10" fill="none" stroke="#7A9CFF" stroke-width="1.8"/>' +
      '<line x1="16" y1="6" x2="16" y2="9.5" stroke="#7A9CFF" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="16" y1="13" x2="16" y2="16" stroke="#E9E2D2" stroke-width="1.6" stroke-linecap="round"/>' +
      '<line x1="16" y1="16" x2="21" y2="16" stroke="#E9E2D2" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle cx="16" cy="16" r="1.6" fill="#7A9CFF"/>' +
    '</svg>'
  );
});
app.get("/favicon.ico", (req, res) => res.redirect(302, "/favicon.svg"));

app.get("*", (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(buildPage());
});

function buildPage() {
  const seedJson = JSON.stringify(DEFAULT_ROWS);
  const referenceJson = JSON.stringify(REFERENCE);
  const reflectionJson = JSON.stringify(REFLECTION);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>168 — Audit Your Week</title>
<meta name="description" content="168 hours in a week. Plan your ideal week, log your actual week, and find out where the gap lives.">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${getCSS()}</style>
</head>
<body>
  <div class="grain" aria-hidden="true"></div>
  <header class="masthead">
    <div class="masthead-row">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
            <line x1="12" y1="3" x2="12" y2="5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="12" y1="12" x2="16.5" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          </svg>
        </span>
        <div class="brand-titles">
          <span class="brand-eyebrow">Week Planner</span>
          <h1 class="brand-title">168 &mdash; Audit Your Week</h1>
        </div>
      </div>
      <div class="masthead-actions">
        <button class="theme-toggle" id="themeBtn" aria-label="Toggle theme" title="Toggle theme">
          <span class="theme-icon-light">&#9728;</span>
          <span class="theme-icon-dark">&#9790;</span>
        </button>
      </div>
    </div>
    <p class="masthead-lede">168 hours in a week. 24 &times; 7. Plan your ideal week, log your actual week, and find out where the gap lives.</p>
    <div class="masthead-stats" id="stats" aria-live="polite"></div>
  </header>

  <nav class="viewbar" role="tablist" aria-label="View">
    <div class="viewbar-inner">
      <button class="view-tab active" data-view="worksheet" role="tab" aria-selected="true">Worksheet</button>
      <button class="view-tab" data-view="compare" role="tab" aria-selected="false">Compare</button>
      <button class="view-tab" data-view="reflect" role="tab" aria-selected="false">Reflect</button>
    </div>
  </nav>

  <main id="main">
    <section id="view-worksheet" class="view"></section>
    <section id="view-compare" class="view hidden"></section>
    <section id="view-reflect" class="view hidden"></section>
  </main>

  <div id="exportBar" class="export-bar">
    <span class="export-label">Export</span>
    <button class="export-btn" id="exportCsv">CSV</button>
    <button class="export-btn" id="exportJson">JSON</button>
    <button class="export-btn" id="exportMd">Markdown</button>
    <button class="export-btn" id="exportPrint">Print</button>
  </div>

  <div id="toast" class="toast" aria-live="polite" aria-atomic="true"></div>

  <footer class="colophon">
    <span class="colophon-bit">Adapted from <a class="colophon-link" href="https://dpm5970digitalgarden.vercel.app/168-audit-your-week/" target="_blank" rel="noopener">Doug McGowan&rsquo;s digital garden</a></span>
    <span class="colophon-sep">/</span>
    <span class="colophon-bit"><a class="colophon-link" href="https://github.com/douglaspmcgowan/168-audit" target="_blank" rel="noopener">source</a></span>
  </footer>

<script>
window.__SEED__ = ${seedJson};
window.__REFERENCE__ = ${referenceJson};
window.__REFLECTION__ = ${reflectionJson};
window.__TARGET__ = ${TARGET_HOURS};
</script>
<script>${getJS()}</script>
</body>
</html>`;
}

function getCSS() {
  return `
:root {
  --paper: #FAFAF7;
  --paper-soft: #F2EEE5;
  --paper-deep: #E7E1D5;
  --paper-raised: rgba(255, 255, 255, 0.62);
  --ink: #0F0F0E;
  --ink-soft: #5B564E;
  --ink-faint: #8A847A;
  --rule: rgba(15, 15, 14, 0.09);
  --rule-soft: rgba(15, 15, 14, 0.05);
  --accent: #2D5BFF;
  --accent-soft: rgba(45, 91, 255, 0.10);
  --accent-line: rgba(45, 91, 255, 0.18);
  --urgent: #C53838;
  --urgent-soft: rgba(197, 56, 56, 0.12);
  --warn: #8C6239;
  --warn-soft: rgba(140, 98, 57, 0.12);
  --good: #2F6B3F;
  --good-soft: rgba(47, 107, 63, 0.12);
  --tag-ink: #FAFAF7;
  --sans: "Inter Tight", system-ui, sans-serif;
  --mono: var(--sans);
  --label-spacing: 0.08em;
  --measure: 65ch;
  --shadow-card: 0 18px 30px rgba(15, 15, 14, 0.035);
  --shadow-modal: 0 28px 72px rgba(15, 15, 14, 0.18);
  --dur-in: 120ms;
  --dur-out: 240ms;
  --ease-in: cubic-bezier(0.3, 0, 0.7, 1);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}
[data-theme="dark"] {
  --paper: #15120E;
  --paper-soft: #1D1914;
  --paper-deep: #272118;
  --paper-raised: rgba(39, 33, 24, 0.86);
  --ink: #E9E2D2;
  --ink-soft: #B9B09F;
  --ink-faint: #877C6B;
  --rule: rgba(233, 226, 210, 0.12);
  --rule-soft: rgba(233, 226, 210, 0.07);
  --accent: #7A9CFF;
  --accent-soft: rgba(122, 156, 255, 0.14);
  --accent-line: rgba(122, 156, 255, 0.24);
  --urgent: #FF7B75;
  --urgent-soft: rgba(255, 123, 117, 0.16);
  --warn: #D2AD79;
  --warn-soft: rgba(210, 173, 121, 0.16);
  --good: #6FBF7E;
  --good-soft: rgba(111, 191, 126, 0.16);
  --tag-ink: #FAFAF7;
  --shadow-card: 0 18px 32px rgba(0, 0, 0, 0.28);
  --shadow-modal: 0 30px 80px rgba(0, 0, 0, 0.52);
}
* { box-sizing: border-box; }
html {
  font-family: var(--sans);
  font-size: 16px;
  font-optical-sizing: auto;
  font-feature-settings: "kern" 1, "liga" 1, "ss01" 1;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  line-height: 1.58;
}
body { margin: 0; background: var(--paper); color: var(--ink); min-height: 100vh; }
button, input, textarea, select { font: inherit; }
p, .masthead-lede { max-width: var(--measure); text-wrap: pretty; font-variant-numeric: oldstyle-nums; }
h1, h2, h3, .brand-title { text-wrap: balance; }
::selection { background: var(--accent-soft); color: var(--ink); }
:focus { outline: none; }
:where(a, button, input, label):focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

.grain {
  position: fixed; inset: 0; pointer-events: none; z-index: 1000;
  opacity: 0.036; mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
[data-theme="dark"] .grain { mix-blend-mode: screen; opacity: 0.042; }

/* ------ Masthead ------ */
.masthead { max-width: 78rem; margin: 0 auto; padding: clamp(2.4rem, 4.6vw, 3.4rem) 2rem 1.4rem; }
.masthead-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding-bottom: 0.9rem; }
.brand { display: flex; align-items: flex-start; gap: 0.85rem; min-width: 0; }
.brand-mark {
  margin-top: 0.18rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  flex-shrink: 0;
  color: var(--accent);
  background: var(--paper-raised);
  box-shadow: inset 0 0 0 1px var(--rule);
  border-radius: 6px;
}
.brand-mark svg { display: block; }
.brand-titles { min-width: 0; display: flex; flex-direction: column; gap: 0.18rem; }
.brand-eyebrow {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 500;
  line-height: 1;
}
.brand-title { font-size: clamp(1.45rem, 2.5vw, 1.8rem); font-weight: 600; letter-spacing: -0.028em; margin: 0; line-height: 1.06; max-width: 24ch; }
.masthead-lede { color: var(--ink-soft); font-size: 1.02rem; margin: 0 0 1.18rem; line-height: 1.66; }
.masthead-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1.6rem;
  padding-top: 0.95rem;
  border-top: 1px solid var(--rule);
  font-family: var(--mono);
  font-size: 0.74rem;
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
}
.stat { display: inline-flex; align-items: baseline; gap: 0.46rem; min-height: 1.5rem; }
.stat strong {
  font-family: var(--sans);
  font-weight: 600;
  color: var(--ink);
  font-size: 1rem;
  letter-spacing: -0.02em;
  text-transform: none;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.stat .stat-accent { color: var(--accent); }
.stat .stat-good { color: var(--good); }
.stat .stat-warn { color: var(--warn); }
.stat .stat-urgent { color: var(--urgent); }

.theme-toggle {
  width: 2.55rem;
  height: 2.55rem;
  background: var(--paper-raised);
  border: 0;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--rule);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  font-size: 1rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition:
    color var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out),
    box-shadow var(--dur-out) var(--ease-out),
    transform var(--dur-out) var(--ease-out);
}
.theme-toggle:hover {
  color: var(--ink);
  background: var(--paper-soft);
  box-shadow: inset 0 0 0 1px var(--rule), 0 8px 18px rgba(15, 15, 14, 0.06);
  transform: translateY(-1px);
  transition-duration: var(--dur-in);
  transition-timing-function: var(--ease-in);
}
[data-theme="dark"] .theme-toggle:hover { box-shadow: inset 0 0 0 1px var(--rule), 0 10px 20px rgba(0, 0, 0, 0.24); }
.theme-icon-dark { display: none; }
[data-theme="dark"] .theme-icon-light { display: none; }
[data-theme="dark"] .theme-icon-dark { display: inline; }

/* ------ View tabs ------ */
.viewbar { max-width: 78rem; margin: 0 auto; padding: 0 2rem; border-top: 1px solid var(--rule-soft); border-bottom: 1px solid var(--rule); }
.viewbar-inner { display: flex; gap: 1.4rem; flex-wrap: wrap; }
.view-tab {
  flex: 0 0 auto;
  background: transparent;
  border: 0;
  padding: 0.92rem 0 0.78rem;
  cursor: pointer;
  font-family: var(--sans);
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--ink-faint);
  opacity: 0.72;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition:
    color var(--dur-out) var(--ease-out),
    border-color var(--dur-out) var(--ease-out),
    opacity var(--dur-out) var(--ease-out);
  letter-spacing: -0.005em;
}
.view-tab:hover { color: var(--ink-soft); opacity: 1; transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.view-tab.active { color: var(--ink); opacity: 1; border-bottom-color: var(--accent); }

/* ------ Main ------ */
main { max-width: 78rem; margin: 0 auto; padding: 1.6rem 2rem 8rem; }
.view.hidden { display: none; }

/* ------ Worksheet ------ */
.worksheet-toolbar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  padding-bottom: 1rem;
  margin-bottom: 0.95rem;
  border-bottom: 1px solid var(--rule-soft);
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.95rem 0.52rem;
  font-family: var(--sans);
  font-size: 0.82rem;
  font-weight: 500;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  background: var(--paper-raised);
  color: var(--ink-soft);
  box-shadow: inset 0 0 0 1px var(--rule-soft);
  transition:
    color var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out),
    box-shadow var(--dur-out) var(--ease-out),
    transform var(--dur-out) var(--ease-out);
  letter-spacing: -0.005em;
}
.btn:hover { color: var(--ink); box-shadow: inset 0 0 0 1px var(--rule); transform: translateY(-1px); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.btn-primary { background: var(--accent); color: #fff; box-shadow: none; }
.btn-primary:hover { background: var(--accent); color: #fff; box-shadow: 0 4px 14px rgba(45, 91, 255, 0.28); transform: translateY(-1px); }
[data-theme="dark"] .btn-primary { color: var(--paper); }
[data-theme="dark"] .btn-primary:hover { box-shadow: 0 6px 18px rgba(122, 156, 255, 0.22); }

.table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
table.audit {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.88rem;
  font-feature-settings: "kern" 1, "liga" 1;
  border-top: 1px solid var(--rule);
}
table.audit th {
  background: var(--paper);
  font-family: var(--mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  white-space: nowrap;
  font-weight: 500;
  padding: 0.78rem 0.9rem;
  text-align: left;
  border-bottom: 1px solid var(--rule);
  position: sticky;
  top: 0;
  z-index: 2;
}
table.audit th.col-num { text-align: right; }
table.audit td {
  padding: 0.38rem 0.9rem;
  border-bottom: 1px solid var(--rule-soft);
  vertical-align: middle;
}
table.audit tbody tr:last-child td { border-bottom: 0; }
table.audit td.col-cat {
  font-weight: 500;
  color: var(--ink-soft);
  font-size: 0.82rem;
  white-space: nowrap;
}
table.audit td.col-cat.cat-merged { color: transparent; user-select: none; }
table.audit td.col-sub { color: var(--ink); min-width: 10rem; }
table.audit td.col-num { text-align: right; min-width: 7rem; }
table.audit td.col-notes { min-width: 10rem; }
table.audit td.col-del { width: 2.4rem; text-align: center; }

/* number inputs */
.num-input {
  width: 5.5rem;
  text-align: right;
  background: var(--paper-soft);
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: 0.3rem 0.55rem;
  font-family: var(--sans);
  font-size: 0.92rem;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  transition: border-color var(--dur-out) var(--ease-out), background var(--dur-out) var(--ease-out);
  -moz-appearance: textfield;
}
.num-input::-webkit-inner-spin-button,
.num-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.num-input:hover { border-color: var(--ink-soft); }
.num-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 0; border-color: transparent; background: var(--paper); }

/* inline-editable text cell (category + sub-category) */
.cell-input {
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0.32rem 0.5rem;
  font: inherit;
  color: inherit;
  transition: border-color var(--dur-out) var(--ease-out), background var(--dur-out) var(--ease-out);
}
.cell-input:hover { border-color: var(--rule); background: var(--paper-soft); }
.cell-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 0; border-color: transparent; background: var(--paper); }
.cell-input.cell-cat { font-weight: 500; color: var(--ink); }
.cell-input.cell-sub { color: var(--ink); }
.cell-input.cell-cat-merged { color: transparent; }
.cell-input.cell-cat-merged:hover, .cell-input.cell-cat-merged:focus-visible { color: var(--ink); }

/* slider input mode */
.range-cell {
  display: grid;
  grid-template-columns: 1fr 3.6rem;
  align-items: center;
  gap: 0.55rem;
  min-width: 11rem;
}
.range-input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 1.5rem;
  background: transparent;
  cursor: pointer;
  margin: 0;
}
.range-input::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(to right, var(--accent) 0 var(--fill, 0%), var(--paper-soft) var(--fill, 0%) 100%);
  box-shadow: inset 0 0 0 1px var(--rule-soft);
}
.range-input::-moz-range-track {
  height: 4px;
  border-radius: 999px;
  background: var(--paper-soft);
  box-shadow: inset 0 0 0 1px var(--rule-soft);
}
.range-input::-moz-range-progress {
  height: 4px;
  border-radius: 999px;
  background: var(--accent);
}
.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px; height: 16px;
  border-radius: 999px;
  background: var(--paper);
  box-shadow: 0 0 0 1.5px var(--accent), 0 2px 6px rgba(0,0,0,0.18);
  margin-top: -6px;
  transition: transform 120ms var(--ease-in);
}
.range-input::-moz-range-thumb {
  width: 16px; height: 16px; border: 0; border-radius: 999px;
  background: var(--paper);
  box-shadow: 0 0 0 1.5px var(--accent), 0 2px 6px rgba(0,0,0,0.18);
}
.range-input:hover::-webkit-slider-thumb { transform: scale(1.12); }
.range-input.range-actual::-webkit-slider-runnable-track {
  background: linear-gradient(to right, var(--ink-soft) 0 var(--fill, 0%), var(--paper-soft) var(--fill, 0%) 100%);
}
.range-input.range-actual::-moz-range-progress { background: var(--ink-soft); }
.range-input.range-actual::-webkit-slider-thumb { box-shadow: 0 0 0 1.5px var(--ink-soft), 0 2px 6px rgba(0,0,0,0.18); }
.range-input.range-actual::-moz-range-thumb { box-shadow: 0 0 0 1.5px var(--ink-soft), 0 2px 6px rgba(0,0,0,0.18); }
.range-val {
  font-variant-numeric: tabular-nums;
  font-size: 0.88rem;
  color: var(--ink);
  text-align: right;
  font-weight: 500;
}

/* input mode toggle (Numbers ↔ Sliders) */
.input-mode-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--paper-soft);
  border-radius: 999px;
  padding: 0.22rem;
  box-shadow: inset 0 0 0 1px var(--rule-soft);
}
.input-mode-label {
  font-size: 0.72rem;
  letter-spacing: var(--label-spacing);
  text-transform: uppercase;
  color: var(--ink-faint);
  padding: 0 0.55rem 0 0.7rem;
}
.input-mode-btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--ink-soft);
  padding: 0.32rem 0.78rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  transition: background-color var(--dur-out) var(--ease-out), color var(--dur-out) var(--ease-out);
}
.input-mode-btn:hover { color: var(--ink); }
.input-mode-btn.active {
  background: var(--paper-raised);
  color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--rule), 0 1px 2px rgba(0,0,0,0.04);
}

/* notes input */
.notes-input {
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0.3rem 0.5rem;
  font-family: var(--sans);
  font-size: 0.85rem;
  color: var(--ink-soft);
  transition: border-color var(--dur-out) var(--ease-out), background var(--dur-out) var(--ease-out), color var(--dur-out) var(--ease-out);
}
.notes-input::placeholder { color: var(--ink-faint); }
.notes-input:hover { border-color: var(--rule); background: var(--paper-soft); }
.notes-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 0; border-color: transparent; background: var(--paper); color: var(--ink); }

.del-btn {
  background: transparent;
  border: 0;
  cursor: pointer;
  color: var(--ink-faint);
  font-size: 0.95rem;
  padding: 0.2rem 0.3rem;
  border-radius: 4px;
  line-height: 1;
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
.del-btn:hover { color: var(--urgent); background: var(--urgent-soft); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }

/* total row */
tfoot.audit-foot td {
  border-top: 2px solid var(--rule);
  background: var(--paper-soft);
  padding: 0.68rem 0.9rem;
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ink);
  text-align: right;
  position: sticky;
  bottom: 0;
}
tfoot.audit-foot td:first-child { text-align: left; font-family: var(--sans); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-faint); font-weight: 500; }
tfoot.audit-foot td:nth-child(2) { text-align: left; }

.verdict-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--mono);
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem 0.22rem;
  border-radius: 999px;
  font-weight: 500;
  margin-left: 0.45rem;
  vertical-align: middle;
}
.chip-good { background: var(--good-soft); color: var(--good); box-shadow: inset 0 0 0 1px rgba(47, 107, 63, 0.18); }
[data-theme="dark"] .chip-good { box-shadow: inset 0 0 0 1px rgba(111, 191, 126, 0.22); }
.chip-warn { background: var(--warn-soft); color: var(--warn); box-shadow: inset 0 0 0 1px rgba(140, 98, 57, 0.18); }
[data-theme="dark"] .chip-warn { box-shadow: inset 0 0 0 1px rgba(210, 173, 121, 0.22); }
.chip-urgent { background: var(--urgent-soft); color: var(--urgent); box-shadow: inset 0 0 0 1px rgba(197, 56, 56, 0.18); }
[data-theme="dark"] .chip-urgent { box-shadow: inset 0 0 0 1px rgba(255, 123, 117, 0.22); }

/* ------ Compare view ------ */
.compare-callout {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.9rem 1.15rem;
  background: var(--accent-soft);
  border-left: 3px solid var(--accent);
  border-radius: 0 6px 6px 0;
  font-size: 0.9rem;
  margin-bottom: 1.6rem;
  color: var(--ink-soft);
}
.compare-callout strong { color: var(--ink); font-weight: 600; }

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 2.5rem;
  align-items: start;
}
.compare-col-head {
  font-family: var(--mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin: 0 0 0.95rem;
  font-weight: 500;
}
.bar-row {
  display: grid;
  grid-template-columns: 7.5rem 1fr auto;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.65rem;
}
.bar-label {
  font-size: 0.84rem;
  color: var(--ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bar-track {
  background: var(--paper-soft);
  border-radius: 999px;
  height: 0.5rem;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px var(--rule-soft);
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width 0.4s var(--ease-out);
}
.bar-fill.bar-actual { background: var(--ink-soft); }
.bar-val {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  min-width: 3.5rem;
  text-align: right;
}

.delta-table { width: 100%; border-collapse: collapse; margin-top: 1.8rem; }
.delta-table th {
  font-family: var(--mono);
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  font-weight: 500;
  padding: 0.38rem 0.7rem;
  text-align: left;
  border-bottom: 1px solid var(--rule);
}
.delta-table th:last-child { text-align: right; }
.delta-table td { padding: 0.48rem 0.7rem; border-bottom: 1px solid var(--rule-soft); font-size: 0.88rem; }
.delta-table td:last-child { text-align: right; font-family: var(--mono); font-variant-numeric: tabular-nums; }
.delta-table tbody tr:last-child td { border-bottom: 0; }
.delta-muted { color: var(--ink-faint); }
.delta-warn { color: var(--warn); }
.delta-urgent { color: var(--urgent); }

/* ------ Reflect view ------ */
.reflect-section { margin-bottom: 2rem; }
.reflect-section-title {
  font-family: var(--mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin: 0 0 0.85rem;
  font-weight: 500;
}
.prompt-card {
  padding: 0.9rem 1.1rem 0.9rem 1.35rem;
  border-left: 3px solid var(--accent-line);
  background: var(--paper-soft);
  border-radius: 0 6px 6px 0;
  margin-bottom: 0.65rem;
  font-size: 0.92rem;
  color: var(--ink-soft);
  line-height: 1.68;
  transition: border-color var(--dur-out) var(--ease-out);
}
.prompt-card:hover { border-color: var(--accent); }
.prompt-card strong { color: var(--ink); font-weight: 600; }

.reference-section { margin-top: 2.4rem; }
.reference-section-title {
  font-family: var(--mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin: 0 0 1rem;
  font-weight: 500;
  padding-top: 1.8rem;
  border-top: 1px solid var(--rule);
}
.reference-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1rem; }
.reference-card {
  background: var(--paper-raised);
  border-radius: 8px;
  padding: 1.05rem 1.2rem 1.1rem;
  box-shadow: inset 0 0 0 1px var(--rule-soft), 0 1px 0 var(--rule-soft);
}
.reference-card-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.68rem;
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--ink);
}
.reference-card-glyph { font-size: 1.05rem; line-height: 1; }
.reference-card ul { margin: 0; padding: 0 0 0 1.1rem; }
.reference-card li {
  font-size: 0.83rem;
  color: var(--ink-soft);
  line-height: 1.6;
  margin-bottom: 0.18rem;
  text-wrap: pretty;
}

/* ------ Export bar ------ */
.export-bar {
  position: fixed;
  bottom: 1.2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--paper-raised);
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  box-shadow: inset 0 0 0 1px var(--rule), var(--shadow-modal);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 50;
}
.export-label {
  font-family: var(--mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  padding-right: 0.35rem;
}
.export-btn {
  padding: 0.35rem 0.82rem 0.37rem;
  font-family: var(--mono);
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 999px;
  cursor: pointer;
  transition:
    color var(--dur-out) var(--ease-out),
    border-color var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out),
    transform var(--dur-out) var(--ease-out);
  white-space: nowrap;
}
.export-btn:hover { color: var(--ink); border-color: var(--ink-soft); transform: translateY(-1px); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }

@media (min-width: 1024px) {
  .export-bar {
    left: auto;
    right: 2rem;
    bottom: 2rem;
    transform: none;
    flex-direction: column;
    align-items: stretch;
    border-radius: 10px;
    padding: 0.85rem 1rem;
    gap: 0.45rem;
  }
  .export-label { padding-right: 0; padding-bottom: 0.35rem; border-bottom: 1px solid var(--rule); margin-bottom: 0.1rem; }
  .export-btn { text-align: center; }
}

body[data-view="compare"] .export-bar,
body[data-view="reflect"] .export-bar { display: none; }

/* ------ Toast ------ */
.toast {
  position: fixed;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%) translateY(0.5rem);
  background: var(--ink);
  color: var(--paper);
  padding: 0.62rem 1.1rem;
  border-radius: 999px;
  font-size: 0.84rem;
  font-family: var(--sans);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease, transform 200ms ease;
  white-space: nowrap;
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
}
.toast-undo {
  background: transparent;
  border: 0;
  color: var(--accent);
  cursor: pointer;
  font: inherit;
  font-size: 0.84rem;
  margin-left: 0.75rem;
  padding: 0;
  text-decoration: underline;
}

/* ------ Footer ------ */
.colophon { max-width: 78rem; margin: 0 auto; padding: 1.7rem 1rem 2.6rem; border-top: 1px solid var(--rule); display: flex; flex-wrap: wrap; gap: 0.4rem 0.65rem; align-items: center; font-family: var(--mono); font-size: 0.7rem; color: var(--ink-faint); letter-spacing: 0.06em; text-transform: uppercase; overflow-wrap: anywhere; }
.colophon-bit { overflow-wrap: anywhere; }
@media (min-width: 480px) { .colophon { padding-left: 2rem; padding-right: 2rem; } .colophon-bit { white-space: nowrap; overflow-wrap: normal; } }
.colophon-sep { color: var(--rule); }
.colophon-link { color: var(--ink-soft); text-decoration: none; border-bottom: 1px solid transparent; transition: color var(--dur-out) var(--ease-out), border-color var(--dur-out) var(--ease-out); }
.colophon-link:hover { color: var(--ink); border-color: var(--ink-soft); transition-duration: var(--dur-in); }

/* ------ Print ------ */
@media print {
  .grain, .theme-toggle, .viewbar, .export-bar, .toast, .colophon,
  .worksheet-toolbar, .del-btn, #view-compare, #view-reflect { display: none !important; }
  body { background: #fff; color: #000; }
  .masthead { padding: 1rem 0; }
  main { padding: 0; }
  table.audit { font-size: 10pt; }
  table.audit th, table.audit td { padding: 0.35rem 0.5rem; }
  tfoot.audit-foot td { background: #f5f5f3; }
  #view-worksheet { display: block !important; }
}

/* ------ Mobile ------ */
@media (max-width: 720px) {
  .masthead { padding: 1.8rem 1.25rem 1rem; }
  .brand-title { font-size: 1.4rem; }
  .viewbar, main, .colophon { padding-left: 1.25rem; padding-right: 1.25rem; }
  .masthead-lede { font-size: 0.96rem; margin-bottom: 1rem; }
  .masthead-stats { gap: 0.5rem 1rem; }
  .viewbar-inner { gap: 1rem; }
  main { padding-bottom: 7rem; }

  /* table → card stack on mobile */
  table.audit thead { display: none; }
  table.audit, table.audit tbody, table.audit tr, table.audit td { display: block; width: 100%; }
  table.audit tr {
    background: var(--paper-raised);
    border-radius: 8px;
    box-shadow: inset 0 0 0 1px var(--rule-soft);
    padding: 0.9rem 1rem;
    margin-bottom: 0.7rem;
    position: relative;
  }
  table.audit td {
    border-bottom: 0;
    padding: 0.25rem 0;
    text-align: left;
  }
  table.audit td::before {
    content: attr(data-label);
    display: block;
    font-family: var(--mono);
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-faint);
    margin-bottom: 0.18rem;
  }
  table.audit td.col-cat.cat-merged { display: none; }
  table.audit td.col-del {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    width: auto;
    padding: 0;
  }
  table.audit td.col-del::before { display: none; }
  table.audit td.col-num { text-align: left; }
  .num-input { width: 7rem; }
  tfoot.audit-foot { display: none; }

  .compare-grid { grid-template-columns: 1fr; gap: 1.2rem; }
  .bar-row { grid-template-columns: 6rem 1fr auto; }

  .reference-grid { grid-template-columns: 1fr; }

  .export-bar { padding: 0.5rem 0.75rem; gap: 0.4rem; }
  .export-label { display: none; }
  .export-btn { font-size: 0.7rem; padding: 0.3rem 0.65rem; }
}
`;
}

function getJS() {
  return `
(function() {
  const SEED = window.__SEED__;
  const REFERENCE = window.__REFERENCE__;
  const REFLECTION = window.__REFLECTION__;
  const TARGET = window.__TARGET__;
  const STORAGE_KEY = "168-audit:v1";

  // ------ State ------
  let rows = [];
  let undoStack = null; // {rows, index} for single-step undo
  let toastTimer = null;
  let inputMode = (function() {
    try { return localStorage.getItem("168-audit:input-mode") || "numbers"; }
    catch(e) { return "numbers"; }
  })();
  const SLIDER_MAX = 80; // hours per row; above this, switch to numbers mode

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.rows)) {
          rows = parsed.rows;
          return;
        }
      }
    } catch(e) {}
    rows = SEED.map(r => Object.assign({}, r, { ideal: "", actual: "", notes: "" }));
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows })); } catch(e) {}
  }

  function num(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : Math.max(0, Math.min(168, n));
  }

  function sumIdeal() { return rows.reduce((a, r) => a + num(r.ideal), 0); }
  function sumActual() { return rows.reduce((a, r) => a + num(r.actual), 0); }

  function fmtH(n) {
    const fixed = +n.toFixed(2);
    return fixed === Math.floor(fixed) ? String(fixed) : fixed.toFixed(2).replace(/\\.?0+$/, "");
  }

  // ------ Theme ------
  (function initTheme() {
    const saved = localStorage.getItem("168-audit:theme");
    document.documentElement.setAttribute("data-theme", saved || "dark");
  })();

  document.getElementById("themeBtn").addEventListener("click", function() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("168-audit:theme", next);
  });

  // ------ View tabs ------
  const tabs = document.querySelectorAll(".view-tab");
  const views = {
    worksheet: document.getElementById("view-worksheet"),
    compare: document.getElementById("view-compare"),
    reflect: document.getElementById("view-reflect"),
  };
  let activeView = "worksheet";
  document.body.dataset.view = activeView;

  tabs.forEach(tab => {
    tab.addEventListener("click", function() {
      const v = this.dataset.view;
      if (v === activeView) return;
      activeView = v;
      document.body.dataset.view = v;
      tabs.forEach(t => { t.classList.toggle("active", t.dataset.view === v); t.setAttribute("aria-selected", t.dataset.view === v); });
      Object.entries(views).forEach(([k, el]) => el.classList.toggle("hidden", k !== v));
      if (v === "compare") renderCompare();
      if (v === "reflect") renderReflect();
    });
  });

  // ------ Stats bar ------
  function renderStats() {
    const ideal = sumIdeal();
    const actual = sumActual();
    const statsEl = document.getElementById("stats");

    let idealClass = "stat-accent";
    let actualClass = "stat-accent";
    if (Math.abs(ideal - TARGET) <= 0.25) idealClass = "stat-good";
    else if (ideal > TARGET) idealClass = "stat-urgent";
    else if (TARGET - ideal >= 1) idealClass = "stat-warn";

    if (Math.abs(actual - TARGET) <= 0.25) actualClass = "stat-good";
    else if (actual > TARGET) actualClass = "stat-urgent";
    else if (TARGET - actual >= 1) actualClass = "stat-warn";

    statsEl.innerHTML =
      '<span class="stat"><strong class="' + idealClass + '">' + fmtH(ideal) + 'h</strong> ideal</span>' +
      '<span class="stat"><strong class="' + actualClass + '">' + fmtH(actual) + 'h</strong> actual</span>' +
      '<span class="stat"><strong>' + TARGET + 'h</strong> target</span>';
  }

  // ------ Verdict chip ------
  function verdictChip(total) {
    const diff = +(total - TARGET).toFixed(2);
    if (Math.abs(diff) <= 0.25) return '<span class="verdict-chip chip-good">Balanced</span>';
    if (diff > 0) return '<span class="verdict-chip chip-urgent">+' + fmtH(diff) + 'h over</span>';
    return '<span class="verdict-chip chip-warn">' + fmtH(-diff) + 'h unallocated</span>';
  }

  // ------ Worksheet ------
  function renderWorksheet() {
    const container = views.worksheet;

    let html = '<div class="worksheet-toolbar">' +
      '<button class="btn btn-primary" id="addRowBtn">+ Add row</button>' +
      '<button class="btn" id="resetBtn">Reset to defaults</button>' +
      '<div class="input-mode-toggle" style="margin-left:auto" role="group" aria-label="Input mode">' +
        '<span class="input-mode-label">Input</span>' +
        '<button class="input-mode-btn' + (inputMode === "numbers" ? " active" : "") + '" data-mode="numbers" type="button">Numbers</button>' +
        '<button class="input-mode-btn' + (inputMode === "sliders" ? " active" : "") + '" data-mode="sliders" type="button">Sliders</button>' +
      '</div>' +
      '</div>';

    html += '<div class="table-wrap"><table class="audit">';
    html += '<thead><tr>' +
      '<th>Category</th>' +
      '<th>Sub-category</th>' +
      '<th class="col-num">Ideal (h)</th>' +
      '<th class="col-num">Actual (h)</th>' +
      '<th>Notes</th>' +
      '<th></th>' +
      '</tr></thead>';

    html += '<tbody id="auditBody">';
    let prevCat = null;
    rows.forEach((row, i) => {
      const merged = row.category === prevCat;
      prevCat = row.category;
      html += '<tr data-idx="' + i + '">' +
        '<td class="col-cat' + (merged ? ' cat-merged' : '') + '" data-label="Category">' +
          '<input type="text" class="cell-input cell-cat' + (merged ? ' cell-cat-merged' : '') + '" data-field="category" data-idx="' + i + '" value="' + escAttr(row.category) + '" aria-label="Category">' +
        '</td>' +
        '<td class="col-sub" data-label="Sub-category">' +
          '<input type="text" class="cell-input cell-sub" data-field="sub" data-idx="' + i + '" value="' + escAttr(row.sub) + '" aria-label="Sub-category">' +
        '</td>' +
        '<td class="col-num" data-label="Ideal (h)">' + valueCell(row, i, "ideal") + '</td>' +
        '<td class="col-num" data-label="Actual (h)">' + valueCell(row, i, "actual") + '</td>' +
        '<td class="col-notes" data-label="Notes"><input type="text" class="notes-input" data-field="notes" data-idx="' + i + '" value="' + escAttr(row.notes || "") + '" placeholder="…"></td>' +
        '<td class="col-del"><button class="del-btn" data-del="' + i + '" aria-label="Remove row" title="Remove row">&times;</button></td>' +
        '</tr>';
    });
    html += '</tbody>';

    const idealTotal = sumIdeal();
    const actualTotal = sumActual();
    html += '<tfoot class="audit-foot"><tr>' +
      '<td>Total</td>' +
      '<td></td>' +
      '<td>' + fmtH(idealTotal) + 'h' + verdictChip(idealTotal) + '</td>' +
      '<td>' + fmtH(actualTotal) + 'h' + verdictChip(actualTotal) + '</td>' +
      '<td colspan="2"></td>' +
      '</tr></tfoot>';

    html += '</table></div>';
    container.innerHTML = html;

    document.getElementById("addRowBtn").addEventListener("click", addRow);
    document.getElementById("resetBtn").addEventListener("click", resetToDefaults);

    container.querySelectorAll(".input-mode-btn").forEach(btn => btn.addEventListener("click", onModeChange));
    container.querySelectorAll(".num-input").forEach(inp => inp.addEventListener("change", onNumChange));
    container.querySelectorAll(".range-input").forEach(inp => {
      inp.addEventListener("input", onRangeInput);
      inp.addEventListener("change", onRangeChange);
    });
    container.querySelectorAll(".notes-input").forEach(inp => inp.addEventListener("input", onNotesChange));
    container.querySelectorAll(".cell-input.cell-cat, .cell-input.cell-sub").forEach(inp => inp.addEventListener("input", onCellTextChange));
    container.querySelectorAll(".del-btn").forEach(btn => btn.addEventListener("click", onDelete));
  }

  function valueCell(row, i, field) {
    const v = row[field];
    const numericValue = v === "" || v === null || v === undefined ? "" : v;
    if (inputMode === "sliders" && (numericValue === "" || +numericValue <= SLIDER_MAX)) {
      const sv = numericValue === "" ? 0 : +numericValue;
      const fill = (Math.min(sv, SLIDER_MAX) / SLIDER_MAX * 100).toFixed(1);
      return '<div class="range-cell">' +
        '<input type="range" class="range-input range-' + field + '" data-field="' + field + '" data-idx="' + i + '" min="0" max="' + SLIDER_MAX + '" step="0.25" value="' + sv + '" style="--fill:' + fill + '%" aria-label="' + field + ' hours">' +
        '<span class="range-val" data-val-for="' + field + '-' + i + '">' + (numericValue === "" ? "0" : fmtH(+numericValue)) + 'h</span>' +
        '</div>';
    }
    return '<input type="number" class="num-input" data-field="' + field + '" data-idx="' + i + '" value="' + numericValue + '" step="0.25" min="0" max="168" placeholder="0" inputmode="decimal" aria-label="' + field + ' hours">';
  }

  function onModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === inputMode) return;
    inputMode = mode;
    try { localStorage.setItem("168-audit:input-mode", mode); } catch(err) {}
    renderWorksheet();
  }

  function onRangeInput(e) {
    const inp = e.target;
    const idx = +inp.dataset.idx;
    const field = inp.dataset.field;
    const v = +inp.value;
    inp.style.setProperty("--fill", (v / SLIDER_MAX * 100).toFixed(1) + "%");
    const label = inp.parentElement.querySelector("[data-val-for='" + field + "-" + idx + "']");
    if (label) label.textContent = fmtH(v) + "h";
    rows[idx][field] = v === 0 ? "" : v;
    renderStats();
    updateTotals();
  }

  function onRangeChange() {
    saveState();
  }

  function onCellTextChange(e) {
    const idx = +e.target.dataset.idx;
    const field = e.target.dataset.field;
    rows[idx][field] = e.target.value;
    if (field === "category") {
      // Reveal merged-cat sibling labels above this row if user typed in a hidden cell.
      e.target.classList.remove("cell-cat-merged");
    }
    saveState();
  }

  function onNumChange(e) {
    const idx = +e.target.dataset.idx;
    const field = e.target.dataset.field;
    let v = parseFloat(e.target.value);
    if (isNaN(v)) v = "";
    else { v = Math.max(0, Math.min(168, Math.round(v * 4) / 4)); e.target.value = v; }
    rows[idx][field] = v === "" ? "" : v;
    saveState();
    renderStats();
    updateTotals();
  }

  function onNotesChange(e) {
    const idx = +e.target.dataset.idx;
    rows[idx].notes = e.target.value;
    saveState();
  }

  function onDelete(e) {
    const idx = +e.target.dataset.del;
    undoStack = { rows: rows.slice(), idx };
    rows.splice(idx, 1);
    saveState();
    renderWorksheet();
    renderStats();
    showToast("Row removed", true);
  }

  function addRow() {
    rows.push({ id: "custom-" + Date.now(), category: "Other", sub: "New row", group: "", hint: "", ideal: "", actual: "", notes: "" });
    saveState();
    renderWorksheet();
    renderStats();
    // focus the new row's sub-category cell
    const body = document.getElementById("auditBody");
    if (body) {
      const lastRow = body.lastElementChild;
      if (lastRow) {
        const sub = lastRow.querySelector(".col-sub");
        if (sub) sub.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function resetToDefaults() {
    if (!confirm("Reset all rows to defaults? Your current data will be lost.")) return;
    rows = SEED.map(r => Object.assign({}, r, { ideal: "", actual: "", notes: "" }));
    saveState();
    renderWorksheet();
    renderStats();
  }

  function updateTotals() {
    // re-render just the tfoot cells without full re-render to avoid losing focus
    const foot = document.querySelector("tfoot.audit-foot");
    if (!foot) return;
    const cells = foot.querySelectorAll("td");
    const idealTotal = sumIdeal();
    const actualTotal = sumActual();
    cells[2].innerHTML = fmtH(idealTotal) + 'h' + verdictChip(idealTotal);
    cells[3].innerHTML = fmtH(actualTotal) + 'h' + verdictChip(actualTotal);
  }

  // ------ Compare ------
  function renderCompare() {
    const container = views.compare;

    const cats = [...new Set(rows.map(r => r.category))];
    const byIdeal = {};
    const byActual = {};
    cats.forEach(c => { byIdeal[c] = 0; byActual[c] = 0; });
    rows.forEach(r => { byIdeal[r.category] += num(r.ideal); byActual[r.category] += num(r.actual); });

    const maxVal = Math.max(TARGET, ...cats.map(c => Math.max(byIdeal[c], byActual[c])), 1);

    // biggest gap
    let biggestCat = null, biggestDelta = 0;
    cats.forEach(c => {
      const d = Math.abs(byIdeal[c] - byActual[c]);
      if (d > biggestDelta) { biggestDelta = d; biggestCat = c; }
    });

    let html = "";
    if (biggestCat !== null) {
      const id = byIdeal[biggestCat], ac = byActual[biggestCat];
      const signed = (ac - id >= 0 ? "+" : "") + fmtH(ac - id);
      html += '<div class="compare-callout"><strong>Biggest gap:</strong> ' + escHtml(biggestCat) +
        ' &mdash; ' + fmtH(id) + 'h planned vs ' + fmtH(ac) + 'h lived (&Delta; ' + signed + 'h)</div>';
    }

    html += '<div class="compare-grid">';

    // Ideal column
    html += '<div><p class="compare-col-head">Ideal</p>';
    cats.forEach(c => {
      const pct = maxVal > 0 ? (byIdeal[c] / maxVal * 100).toFixed(1) : 0;
      html += '<div class="bar-row">' +
        '<span class="bar-label" title="' + escAttr(c) + '">' + escHtml(c) + '</span>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="bar-val">' + fmtH(byIdeal[c]) + 'h</span>' +
        '</div>';
    });
    html += '</div>';

    // Actual column
    html += '<div><p class="compare-col-head">Actual</p>';
    cats.forEach(c => {
      const pct = maxVal > 0 ? (byActual[c] / maxVal * 100).toFixed(1) : 0;
      html += '<div class="bar-row">' +
        '<span class="bar-label" title="' + escAttr(c) + '">' + escHtml(c) + '</span>' +
        '<div class="bar-track"><div class="bar-fill bar-actual" style="width:' + pct + '%"></div></div>' +
        '<span class="bar-val">' + fmtH(byActual[c]) + 'h</span>' +
        '</div>';
    });
    html += '</div>';

    html += '</div>';

    // Delta table
    html += '<table class="delta-table">' +
      '<thead><tr><th>Category</th><th>Ideal</th><th>Actual</th><th>Delta</th></tr></thead><tbody>';
    cats.forEach(c => {
      const diff = byActual[c] - byIdeal[c];
      const absDiff = Math.abs(diff);
      let deltaClass = "delta-muted";
      if (absDiff >= 4) deltaClass = "delta-urgent";
      else if (absDiff >= 1) deltaClass = "delta-warn";
      const signedDiff = (diff >= 0 ? "+" : "") + fmtH(diff) + "h";
      html += '<tr><td>' + escHtml(c) + '</td>' +
        '<td>' + fmtH(byIdeal[c]) + 'h</td>' +
        '<td>' + fmtH(byActual[c]) + 'h</td>' +
        '<td class="' + deltaClass + '">' + signedDiff + '</td></tr>';
    });
    html += '</tbody></table>';

    container.innerHTML = html;
  }

  // ------ Reflect ------
  function renderReflect() {
    const container = views.reflect;

    function md(text) {
      // minimal markdown: **bold**, nothing else needed
      return escHtml(text).replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
    }

    let html = '<div class="reflect-section"><p class="reflect-section-title">Ideal Week Analysis</p>';
    REFLECTION.ideal.forEach(p => { html += '<div class="prompt-card">' + md(p) + '</div>'; });
    html += '</div>';

    html += '<div class="reflect-section"><p class="reflect-section-title">Actual Week Analysis</p>';
    REFLECTION.actual.forEach(p => { html += '<div class="prompt-card">' + md(p) + '</div>'; });
    html += '</div>';

    html += '<div class="reflect-section"><p class="reflect-section-title">Vital Reflection</p>';
    REFLECTION.vital.forEach(p => { html += '<div class="prompt-card">' + md(p) + '</div>'; });
    html += '</div>';

    html += '<div class="reference-section"><p class="reference-section-title">Reference: Recommended Categories</p><div class="reference-grid">';
    REFERENCE.forEach(ref => {
      html += '<div class="reference-card"><div class="reference-card-head">' +
        '<span class="reference-card-glyph">' + ref.glyph + '</span>' +
        escHtml(ref.group) + '</div><ul>';
      ref.bullets.forEach(b => { html += '<li>' + escHtml(b) + '</li>'; });
      html += '</ul></div>';
    });
    html += '</div></div>';

    container.innerHTML = html;
  }

  // ------ Toast ------
  function showToast(msg, withUndo) {
    if (toastTimer) clearTimeout(toastTimer);
    const el = document.getElementById("toast");
    let inner = escHtml(msg);
    if (withUndo) inner += ' <button class="toast-undo" id="undoBtn">Undo</button>';
    el.innerHTML = inner;
    el.classList.add("show");
    if (withUndo) {
      document.getElementById("undoBtn").addEventListener("click", function() {
        if (undoStack) {
          rows = undoStack.rows;
          undoStack = null;
          saveState();
          renderWorksheet();
          renderStats();
        }
        el.classList.remove("show");
        if (toastTimer) clearTimeout(toastTimer);
      });
    }
    toastTimer = setTimeout(() => { el.classList.remove("show"); undoStack = null; }, 4000);
  }

  // ------ Export ------
  function csvEscape(v) {
    const s = String(v === null || v === undefined ? "" : v);
    if (s.includes(",") || s.includes('"') || s.includes("\\n")) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  document.getElementById("exportCsv").addEventListener("click", function() {
    const lines = ["Category,Sub-category,Ideal,Actual,Notes"];
    rows.forEach(r => lines.push([r.category, r.sub, r.ideal, r.actual, r.notes].map(csvEscape).join(",")));
    download("168-audit.csv", "text/csv", lines.join("\\r\\n"));
  });

  document.getElementById("exportJson").addEventListener("click", function() {
    download("168-audit.json", "application/json", JSON.stringify({ rows, generated: new Date().toISOString() }, null, 2));
  });

  document.getElementById("exportMd").addEventListener("click", function() {
    const idealTotal = sumIdeal();
    const actualTotal = sumActual();
    const diff = actualTotal - idealTotal;
    const signed = (diff >= 0 ? "+" : "") + fmtH(diff);
    // TODO: add reflection answer fields in v2 so they can be included here
    let md = "# 168 — Audit Your Week\\n\\n";
    md += "| Category | Sub-category | Ideal (h) | Actual (h) | Notes |\\n";
    md += "|---|---|---:|---:|---|\\n";
    rows.forEach(r => {
      md += "| " + [r.category, r.sub, r.ideal || 0, r.actual || 0, r.notes || ""].join(" | ") + " |\\n";
    });
    md += "\\n**Ideal total:** " + fmtH(idealTotal) + "h · **Actual total:** " + fmtH(actualTotal) + "h · **Delta:** " + signed + "h\\n";
    download("168-audit.md", "text/markdown", md);
  });

  document.getElementById("exportPrint").addEventListener("click", function() {
    window.print();
  });

  function download(filename, mime, content) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  }

  // ------ Escape helpers ------
  function escHtml(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function escAttr(s) {
    return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;");
  }

  // ------ Init ------
  loadState();
  renderWorksheet();
  renderStats();
})();
`;
}

const server = app.listen(PORT, () => console.log("168-audit listening on :" + PORT));

module.exports = app;
