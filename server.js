const express = require("express");
const { DEFAULT_ROWS, REFERENCE, REFLECTION, TARGET_HOURS, DEFAULT_SLIDER_MAX } = require("./data/categories");

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
  <div class="stats-sticky" id="statsSticky" aria-hidden="true">
    <div class="stats-sticky-inner">
      <span class="stats-sticky-brand">168</span>
      <div class="stats-sticky-row" id="statsStickyRow"></div>
    </div>
  </div>
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
        <div class="profile-wrap" id="profileWrap" data-open="false">
          <button type="button" class="profile-chip" id="profileChip" aria-haspopup="menu" aria-expanded="false">
            <span class="profile-chip-eyebrow">Profile</span>
            <span class="profile-chip-name" id="profileChipName">Default</span>
            <span class="profile-chip-caret" aria-hidden="true">&#x25BE;</span>
          </button>
          <div class="profile-menu" id="profileMenu" role="menu"></div>
        </div>
        <div class="viewmode-toggle" role="group" aria-label="View mode">
          <button type="button" class="viewmode-btn" data-mode="dashboard" id="vmDashboard">Dashboard</button>
          <button type="button" class="viewmode-btn" data-mode="app" id="vmApp">App</button>
        </div>
        <button type="button" class="tour-replay" id="tourReplay" title="Replay guided tour" aria-label="Replay guided tour">?</button>
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

  <div id="exportBar" class="export-fab" data-open="false">
    <button type="button" class="export-trigger" id="exportTrigger" aria-haspopup="true" aria-expanded="false" aria-controls="exportMenu">
      <span class="export-trigger-glyph" aria-hidden="true">&#x2913;</span>
      <span class="export-trigger-label">Export</span>
    </button>
    <div class="export-menu" id="exportMenu" role="menu">
      <button class="export-btn" id="exportCsv" role="menuitem">CSV</button>
      <button class="export-btn" id="exportJson" role="menuitem">JSON</button>
      <button class="export-btn" id="exportMd" role="menuitem">Markdown</button>
      <button class="export-btn" id="exportPrint" role="menuitem">Print</button>
    </div>
  </div>

  <div id="tour" class="tour-overlay" hidden>
    <div class="tour-backdrop" id="tourBackdrop"></div>
    <div class="tour-spotlight" id="tourSpotlight"></div>
    <div class="tour-tooltip" id="tourTooltip" role="dialog" aria-modal="true" aria-labelledby="tourTitle" aria-describedby="tourBody">
      <div class="tour-step-count" id="tourCount"></div>
      <h3 class="tour-step-title" id="tourTitle"></h3>
      <p class="tour-step-body" id="tourBody"></p>
      <div class="tour-actions">
        <button type="button" class="tour-skip" id="tourSkip">Skip tour</button>
        <div class="tour-nav">
          <button type="button" class="tour-back" id="tourBack">Back</button>
          <button type="button" class="tour-next" id="tourNext">Next &rarr;</button>
        </div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast" aria-live="polite" aria-atomic="true"></div>

  <footer class="colophon">
    <span class="colophon-bit">Adapted from <a class="colophon-link" href="https://dpm5970digitalgarden.vercel.app/168-audit-your-week/" target="_blank" rel="noopener">Douglas McGowan&rsquo;s digital garden</a></span>
    <span class="colophon-sep">/</span>
    <span class="colophon-bit"><a class="colophon-link" href="https://github.com/douglaspmcgowan/168-audit" target="_blank" rel="noopener">source</a></span>
  </footer>

<script>
window.__SEED__ = ${seedJson};
window.__REFERENCE__ = ${referenceJson};
window.__REFLECTION__ = ${reflectionJson};
window.__TARGET__ = ${TARGET_HOURS};
window.__SLIDER_MAX_DEFAULT__ = ${DEFAULT_SLIDER_MAX};
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
.stat { display: inline-flex; align-items: baseline; gap: 0.48rem; min-height: 1.5rem; }
.stat strong {
  font-family: var(--sans);
  font-weight: 600;
  color: var(--ink);
  font-size: 1.08rem;
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
  width: 2.4rem;
  height: 2.4rem;
  background: var(--paper-raised);
  border: 0;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--rule);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  font-size: 0.95rem;
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

/* Sticky stats bar that appears when masthead-stats scrolls out of view */
.stats-sticky {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 80;
  background: var(--paper-raised);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--rule);
  transform: translateY(-100%);
  transition: transform 240ms var(--ease-out);
  pointer-events: none;
}
.stats-sticky.visible { transform: translateY(0); pointer-events: auto; }
.stats-sticky-inner {
  max-width: 78rem;
  margin: 0 auto;
  padding: 0.55rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.1rem;
}
.stats-sticky-brand {
  font-family: var(--sans);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.04em;
  padding-right: 1rem;
  border-right: 1px solid var(--rule);
}
.stats-sticky-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 1.4rem;
  flex: 1;
  font-size: 0.78rem;
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
}
.stats-sticky-row .stat strong {
  font-family: var(--sans);
  font-weight: 600;
  color: var(--ink);
  font-size: 0.95rem;
  letter-spacing: -0.01em;
  text-transform: none;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 720px) {
  .stats-sticky-inner { padding: 0.5rem 1.1rem; gap: 0.7rem; }
  .stats-sticky-brand { padding-right: 0.6rem; }
  .stats-sticky-row { gap: 0.3rem 0.95rem; font-size: 0.7rem; }
  .stats-sticky-row .stat strong { font-size: 0.88rem; }
}

/* Replay-tour pill */
.tour-replay {
  width: 2.4rem; height: 2.4rem;
  appearance: none; border: 0; cursor: pointer;
  background: var(--paper-raised);
  color: var(--ink-soft);
  box-shadow: inset 0 0 0 1px var(--rule);
  border-radius: 999px;
  font-family: var(--sans);
  font-size: 0.95rem;
  font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center;
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out), transform var(--dur-out) var(--ease-out);
}
.tour-replay:hover { color: var(--accent); background: var(--paper-soft); transform: translateY(-1px); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }

/* Guided tour overlay */
.tour-overlay { position: fixed; inset: 0; z-index: 9999; pointer-events: none; }
.tour-overlay:not([hidden]) { pointer-events: auto; }
.tour-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0); transition: background-color 220ms var(--ease-out); }
.tour-overlay:not([hidden]) .tour-backdrop { background: rgba(0,0,0,0.55); }
.tour-spotlight {
  position: absolute;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.62), 0 0 0 4px var(--accent-soft), 0 0 0 6px var(--accent-line);
  pointer-events: none;
  transition: top 240ms var(--ease-out), left 240ms var(--ease-out), width 240ms var(--ease-out), height 240ms var(--ease-out);
}
.tour-tooltip {
  position: absolute;
  background: var(--paper-raised);
  color: var(--ink);
  box-shadow: var(--shadow-modal);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 12px;
  padding: 1.1rem 1.2rem 1rem;
  max-width: 22rem;
  width: max-content;
  pointer-events: auto;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 180ms var(--ease-out), transform 220ms var(--ease-out), top 240ms var(--ease-out), left 240ms var(--ease-out);
}
.tour-overlay:not([hidden]) .tour-tooltip { opacity: 1; transform: translateY(0); }
.tour-step-count {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--accent);
  font-weight: 500;
  margin-bottom: 0.35rem;
}
.tour-step-title { margin: 0 0 0.35rem; font-size: 1.05rem; font-weight: 600; line-height: 1.25; }
.tour-step-body { margin: 0 0 1rem; color: var(--ink-soft); font-size: 0.92rem; line-height: 1.5; }
.tour-actions { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; }
.tour-nav { display: inline-flex; gap: 0.4rem; }
.tour-skip, .tour-back, .tour-next {
  appearance: none; border: 0; cursor: pointer;
  font-family: var(--sans); font-size: 0.82rem; font-weight: 500;
  border-radius: 999px; padding: 0.45rem 0.85rem 0.47rem;
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
.tour-skip { background: transparent; color: var(--ink-faint); padding-left: 0.2rem; padding-right: 0.2rem; }
.tour-skip:hover { color: var(--ink); }
.tour-back { background: var(--paper-soft); color: var(--ink-soft); box-shadow: inset 0 0 0 1px var(--rule-soft); }
.tour-back:hover { color: var(--ink); }
.tour-back:disabled { opacity: 0.4; cursor: not-allowed; }
.tour-next { background: var(--accent); color: #fff; }
[data-theme="dark"] .tour-next { color: var(--paper); }
.tour-next:hover { transform: translateY(-1px); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
@media (max-width: 600px) {
  .tour-tooltip { max-width: calc(100vw - 2rem); width: calc(100vw - 2rem); padding: 0.95rem 1rem 0.85rem; }
  .tour-actions { flex-direction: column-reverse; align-items: stretch; gap: 0.45rem; }
  .tour-nav { justify-content: space-between; }
  .tour-skip { padding: 0.4rem 0.4rem; text-align: left; }
}

/* Masthead actions row holds profile + view-mode + theme — all 2.4rem tall */
.masthead-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end; }

/* Profile picker */
.profile-wrap { position: relative; }
.profile-chip {
  appearance: none;
  border: 0;
  cursor: pointer;
  background: var(--paper-raised);
  color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--rule);
  height: 2.4rem;
  padding: 0 0.85rem 0 0.95rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--sans);
  font-size: 0.85rem;
  font-weight: 500;
  max-width: 14rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out), transform var(--dur-out) var(--ease-out);
}
.profile-chip:hover { background: var(--paper-soft); transform: translateY(-1px); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.profile-chip-eyebrow { font-size: 0.66rem; color: var(--ink-faint); text-transform: uppercase; letter-spacing: var(--label-spacing); padding-right: 0.3rem; border-right: 1px solid var(--rule); }
.profile-chip-name { font-weight: 500; max-width: 8rem; overflow: hidden; text-overflow: ellipsis; }
.profile-chip-caret { color: var(--ink-faint); font-size: 0.7rem; }

.profile-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 17rem;
  background: var(--paper-raised);
  box-shadow: inset 0 0 0 1px var(--rule), var(--shadow-modal);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 10px;
  padding: 0.55rem;
  z-index: 200;
  display: none;
}
.profile-wrap[data-open="true"] .profile-menu { display: block; }
.profile-menu-section { display: flex; flex-direction: column; gap: 0.18rem; }
.profile-menu-item {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--ink);
  text-align: left;
  font-family: var(--sans);
  font-size: 0.88rem;
  padding: 0.5rem 0.7rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  transition: background-color var(--dur-out) var(--ease-out);
}
.profile-menu-item:hover { background: var(--paper-soft); transition-duration: var(--dur-in); }
.profile-menu-item.active { background: var(--accent-soft); color: var(--ink); }
.profile-menu-item .pmi-check { width: 1rem; color: var(--accent); }
.profile-menu-divider { height: 1px; background: var(--rule); margin: 0.3rem 0; }
.profile-menu-action { color: var(--ink-soft); font-size: 0.82rem; }
.profile-menu-action.danger { color: var(--urgent); }

/* View-mode toggle (App ↔ Dashboard) */
.viewmode-toggle {
  display: inline-flex;
  align-items: center;
  height: 2.4rem;
  background: var(--paper-raised);
  border-radius: 999px;
  padding: 0.22rem;
  box-shadow: inset 0 0 0 1px var(--rule);
}
.viewmode-btn {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--ink-soft);
  font-family: var(--sans);
  font-size: 0.82rem;
  font-weight: 500;
  height: 100%;
  padding: 0 0.85rem;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  transition: background-color var(--dur-out) var(--ease-out), color var(--dur-out) var(--ease-out);
}
.viewmode-btn:hover { color: var(--ink); }
.viewmode-btn.active { background: var(--ink); color: var(--paper); }
[data-theme="dark"] .viewmode-btn.active { background: var(--paper-raised); color: var(--ink); box-shadow: inset 0 0 0 1px var(--rule); }

/* App mode visual changes — scaffolded as card-stack everywhere */
body[data-mode="app"] table.audit thead { display: none; }
body[data-mode="app"] table.audit, body[data-mode="app"] table.audit tbody,
body[data-mode="app"] table.audit tr, body[data-mode="app"] table.audit td { display: block; width: 100%; }
body[data-mode="app"] table.audit tr {
  background: var(--paper-raised);
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px var(--rule-soft);
  padding: 1rem 1.1rem;
  margin-bottom: 0.7rem;
  position: relative;
}
body[data-mode="app"] table.audit td { border-bottom: 0; padding: 0.3rem 0; text-align: left; }
body[data-mode="app"] table.audit td::before {
  content: attr(data-label);
  display: block;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: var(--label-spacing);
  color: var(--ink-faint);
  margin-bottom: 0.2rem;
}
body[data-mode="app"] table.audit td.col-cat.cat-merged { display: none; }
body[data-mode="app"] table.audit td.col-del { position: absolute; top: 0.7rem; right: 0.7rem; width: auto; padding: 0; }
body[data-mode="app"] table.audit td.col-del::before { display: none; }
body[data-mode="app"] table.audit td.col-num { text-align: left; }
body[data-mode="app"] .num-input { width: 7rem; font-size: 1rem; }
body[data-mode="app"] tfoot.audit-foot { display: none; }
body[data-mode="app"] .brand-title { font-size: clamp(1.5rem, 4vw, 2rem); }
body[data-mode="app"] table.audit tbody tr.cat-start { margin-top: 1.4rem; }
body[data-mode="app"] table.audit tbody tr.cat-start::before {
  content: "";
  display: block;
  width: 2rem; height: 2px;
  background: var(--accent);
  margin: 0 0 0.6rem;
  border-radius: 999px;
}
body[data-mode="app"] table.audit tbody tr.cat-start td { border-top: 0; padding-top: 0.3rem; }

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
.btn-quiet { background: transparent; color: var(--ink-faint); box-shadow: none; }
.btn-quiet:hover { color: var(--ink); background: var(--paper-soft); box-shadow: inset 0 0 0 1px var(--rule-soft); }

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
table.audit tbody tr.cat-start td {
  border-top: 2px solid var(--rule);
  padding-top: 0.85rem;
}
table.audit tbody tr.cat-start td.col-cat { color: var(--ink); }
table.audit tbody tr.cat-start td.col-cat .cell-input.cell-cat { font-weight: 600; }
table.audit td.col-cat {
  font-weight: 600;
  color: var(--ink);
  font-size: 1.02rem;
  letter-spacing: -0.015em;
  white-space: nowrap;
  min-width: 11rem;
}
table.audit td.col-cat.cat-merged { color: transparent; user-select: none; }
table.audit td.col-sub { color: var(--ink-soft); font-size: 0.92rem; min-width: 10rem; }
table.audit td.col-num { text-align: right; min-width: 7rem; }
table.audit td.col-notes { min-width: 10rem; }
table.audit td.col-del { width: 2.4rem; text-align: center; }

/* category text in editable cells inherits the bigger size */
.cell-input.cell-cat { font-size: 1.02rem; font-weight: 600; letter-spacing: -0.015em; }
.cell-input.cell-sub { font-size: 0.92rem; font-weight: 400; }

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
.cell-input.cell-cat { color: var(--ink); }
.cell-input.cell-sub { color: var(--ink-soft); }
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
  padding: 0.78rem 0.9rem;
  font-family: var(--sans);
  font-variant-numeric: tabular-nums;
  font-size: 1.08rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
  text-align: right;
  position: sticky;
  bottom: 0;
}
tfoot.audit-foot td:first-child { text-align: left; font-size: 0.78rem; font-weight: 500; text-transform: uppercase; letter-spacing: var(--label-spacing); color: var(--ink-faint); }
tfoot.audit-foot td:nth-child(2) { text-align: left; }

.verdict-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--sans);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.22rem 0.55rem 0.24rem;
  border-radius: 999px;
  font-weight: 500;
  margin-left: 0.55rem;
  vertical-align: middle;
  position: relative;
  top: -1px;
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
.prompt-text { margin: 0 0 0.55rem; }
.reflect-answer {
  display: block;
  width: 100%;
  resize: vertical;
  font: inherit;
  font-family: var(--sans);
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 0.55rem 0.7rem;
  min-height: 2.4rem;
  transition: border-color var(--dur-out) var(--ease-out), background var(--dur-out) var(--ease-out);
}
.reflect-answer::placeholder { color: var(--ink-faint); font-style: italic; }
.reflect-answer:hover { border-color: var(--ink-soft); }
.reflect-answer:focus-visible { outline: 2px solid var(--accent); outline-offset: 0; border-color: transparent; }

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

/* ------ Export FAB ------ */
.export-fab {
  position: fixed;
  bottom: 1.3rem;
  right: 1.3rem;
  z-index: 60;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 0.55rem;
}
.export-trigger {
  appearance: none;
  border: 0;
  cursor: pointer;
  background: var(--accent);
  color: #fff;
  font-family: var(--sans);
  font-size: 0.88rem;
  font-weight: 500;
  letter-spacing: 0.005em;
  width: 9.5rem;
  padding: 0.7rem 1.15rem 0.74rem 1rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 12px 28px rgba(45, 91, 255, 0.28), 0 1px 2px rgba(0,0,0,0.06);
  transition: transform var(--dur-out) var(--ease-out), box-shadow var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
[data-theme="dark"] .export-trigger { color: var(--paper); box-shadow: 0 14px 30px rgba(122, 156, 255, 0.22), 0 1px 2px rgba(0,0,0,0.4); }
.export-trigger:hover { transform: translateY(-2px); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.export-trigger-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  font-size: 0.95rem;
  transform: translateY(-1px);
}
.export-menu {
  display: flex;
  flex-direction: column-reverse;
  gap: 0.4rem;
  align-items: flex-end;
  opacity: 0;
  transform: translateY(6px) scale(0.97);
  transform-origin: bottom right;
  pointer-events: none;
  transition: opacity 160ms var(--ease-out), transform 200ms var(--ease-out);
}
.export-fab[data-open="true"] .export-menu {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
.export-fab[data-open="true"] .export-trigger { background: var(--ink); color: var(--paper); box-shadow: 0 6px 16px rgba(15, 15, 14, 0.2); }
[data-theme="dark"] .export-fab[data-open="true"] .export-trigger { background: var(--paper-raised); color: var(--ink); }
.export-btn {
  appearance: none;
  border: 0;
  cursor: pointer;
  background: var(--paper-raised);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 0.84rem;
  font-weight: 500;
  padding: 0.5rem 0.95rem 0.52rem;
  border-radius: 999px;
  width: 9.5rem;
  text-align: center;
  box-shadow: inset 0 0 0 1px var(--rule), 0 4px 14px rgba(0,0,0,0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out), transform var(--dur-out) var(--ease-out);
}
.export-btn:hover { color: var(--accent); transform: translateX(-2px); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
@media (max-width: 600px) {
  .export-fab { right: 1rem; bottom: 1rem; }
  .export-trigger { width: 11rem; }
  .export-btn { width: 11rem; padding: 0.55rem 1.05rem; }
}

body[data-view="compare"] .export-fab,
body[data-view="reflect"] .export-fab { display: none; }

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
  .grain, .theme-toggle, .viewbar, .export-fab, .toast, .colophon,
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
  .masthead { padding: 1.5rem 1.1rem 0.9rem; }
  .masthead-row { flex-direction: column; align-items: stretch; gap: 0.85rem; padding-bottom: 0.7rem; }
  .brand-title { font-size: 1.32rem; }
  .masthead-actions {
    width: 100%;
    justify-content: flex-start;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .profile-chip { height: 2.1rem; padding: 0 0.7rem 0 0.85rem; font-size: 0.8rem; max-width: none; flex: 1 1 auto; min-width: 0; }
  .profile-chip-name { max-width: none; }
  .viewmode-toggle { height: 2.1rem; padding: 0.18rem; }
  .viewmode-btn { padding: 0 0.6rem; font-size: 0.76rem; }
  .theme-toggle { width: 2.1rem; height: 2.1rem; flex-shrink: 0; }
  .tour-replay { width: 2.1rem; height: 2.1rem; flex-shrink: 0; font-size: 0.9rem; }
  .profile-menu { right: 0; left: 0; min-width: 0; }
  .viewbar, main, .colophon { padding-left: 1.1rem; padding-right: 1.1rem; }
  .masthead-lede { font-size: 0.94rem; margin-bottom: 0.9rem; }
  .masthead-stats { gap: 0.5rem 1rem; }
  .viewbar-inner { gap: 0.9rem; }
  main { padding-bottom: 6rem; }
  .worksheet-toolbar { gap: 0.5rem; }
  .worksheet-toolbar .input-mode-toggle { margin-left: 0; width: 100%; justify-content: stretch; }
  .input-mode-toggle { flex-wrap: wrap; }
  .input-mode-label { padding: 0 0.4rem 0 0.6rem; }
  .input-mode-btn { flex: 1; }
  .range-cell { grid-template-columns: 1fr 4.4rem; }
  .export-fab { right: 0.85rem; bottom: 0.85rem; }
  .export-trigger { padding: 0.6rem 1rem 0.62rem 0.85rem; font-size: 0.84rem; }

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
  table.audit tbody tr.cat-start { margin-top: 1.5rem; }
  table.audit tbody tr.cat-start::before {
    content: "";
    display: block;
    width: 2rem; height: 2px;
    background: var(--accent);
    margin: 0 0 0.55rem;
    border-radius: 999px;
  }
  table.audit tbody tr.cat-start td {
    border-top: 0;
    padding-top: 0.25rem;
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
  const STORAGE_KEY = "168-audit:v2";
  const LEGACY_KEY = "168-audit:v1";

  // ------ State ------
  // state shape:
  //   { activeProfile, profiles: { id: { id, name, rows, reflections } }, viewMode }
  let state = null;
  let rows = []; // alias for state.profiles[active].rows; updated on profile switch
  let undoStack = null; // {rows, index} for single-step undo
  let toastTimer = null;
  let inputMode = (function() {
    try { return localStorage.getItem("168-audit:input-mode") || "numbers"; }
    catch(e) { return "numbers"; }
  })();
  const SLIDER_MAX_DEFAULT = window.__SLIDER_MAX_DEFAULT__ || 15;
  function sliderMaxFor(row) {
    if (row && typeof row.sliderMax === "number") return row.sliderMax;
    return SLIDER_MAX_DEFAULT;
  }

  function freshRows() {
    return SEED.map(r => Object.assign({}, r, { ideal: "", actual: "", notes: "" }));
  }
  function freshProfile(id, name) {
    return { id: id, name: name || "My Schedule", rows: freshRows(), reflections: {} };
  }
  function uniqueProfileId() {
    return "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  }
  function currentProfile() {
    return state.profiles[state.activeProfile];
  }
  function syncRows() {
    rows = currentProfile().rows;
  }
  function slugify(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "profile";
  }
  function profileFilename(ext) {
    return "168-audit-" + slugify(currentProfile().name) + "." + ext;
  }

  function loadState() {
    // 1) Try v2 (current schema)
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.profiles && typeof parsed.profiles === "object" && parsed.activeProfile) {
          // Defensive: ensure active profile exists and has required shape.
          if (!parsed.profiles[parsed.activeProfile]) {
            parsed.activeProfile = Object.keys(parsed.profiles)[0] || "default";
          }
          Object.values(parsed.profiles).forEach(p => {
            if (!Array.isArray(p.rows)) p.rows = freshRows();
            if (!p.reflections || typeof p.reflections !== "object") p.reflections = {};
            if (!p.id) p.id = uniqueProfileId();
            if (!p.name) p.name = "My Schedule";
          });
          if (parsed.viewMode !== "app" && parsed.viewMode !== "dashboard") parsed.viewMode = "dashboard";
          state = parsed;
          syncRows();
          return;
        }
      }
    } catch(e) {}

    // 2) Migrate from v1 if present
    try {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (parsed && Array.isArray(parsed.rows)) {
          const id = "default";
          state = {
            activeProfile: id,
            profiles: { [id]: { id: id, name: "My Schedule", rows: parsed.rows, reflections: {} } },
            viewMode: "dashboard"
          };
          syncRows();
          saveState();
          return;
        }
      }
    } catch(e) {}

    // 3) Fresh state
    const id = "default";
    state = {
      activeProfile: id,
      profiles: { [id]: freshProfile(id, "My Schedule") },
      viewMode: "dashboard"
    };
    syncRows();
  }

  function saveState() {
    try {
      currentProfile().rows = rows;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch(e) {}
  }

  function setReflection(promptText, value) {
    const cp = currentProfile();
    if (!cp.reflections) cp.reflections = {};
    if (value && value.trim()) cp.reflections[promptText] = value;
    else delete cp.reflections[promptText];
    saveState();
  }
  function getReflection(promptText) {
    const cp = currentProfile();
    return (cp.reflections && cp.reflections[promptText]) || "";
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

    const inner =
      '<span class="stat"><strong class="' + idealClass + '">' + fmtH(ideal) + 'h</strong> ideal</span>' +
      '<span class="stat"><strong class="' + actualClass + '">' + fmtH(actual) + 'h</strong> actual</span>' +
      '<span class="stat"><strong>' + TARGET + 'h</strong> target</span>';
    statsEl.innerHTML = inner;
    const sticky = document.getElementById("statsStickyRow");
    if (sticky) sticky.innerHTML = inner;
  }

  // Sticky stats bar: show when masthead-stats scrolls out of view.
  (function initStickyStats() {
    const target = document.getElementById("stats");
    const bar = document.getElementById("statsSticky");
    if (!target || !bar || typeof IntersectionObserver !== "function") return;
    const obs = new IntersectionObserver(function(entries) {
      entries.forEach(e => bar.classList.toggle("visible", !e.isIntersecting));
    }, { threshold: 0 });
    obs.observe(target);
  })();

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
      '<button class="btn btn-primary" id="addSubBtn" title="Add a row under the last category">+ Subcategory</button>' +
      '<button class="btn" id="addCatBtn" title="Start a new top-level category">+ Category</button>' +
      '<button class="btn btn-quiet" id="resetBtn">Reset</button>' +
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
      const catStart = !merged && i > 0;
      prevCat = row.category;
      html += '<tr data-idx="' + i + '"' + (catStart ? ' class="cat-start"' : '') + '>' +
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

    document.getElementById("addSubBtn").addEventListener("click", () => addRow("sub"));
    document.getElementById("addCatBtn").addEventListener("click", () => addRow("cat"));
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
    const rowMax = sliderMaxFor(row);
    if (inputMode === "sliders" && (numericValue === "" || +numericValue <= rowMax)) {
      const sv = numericValue === "" ? 0 : +numericValue;
      const fill = (Math.min(sv, rowMax) / rowMax * 100).toFixed(1);
      return '<div class="range-cell" data-row-max="' + rowMax + '">' +
        '<input type="range" class="range-input range-' + field + '" data-field="' + field + '" data-idx="' + i + '" data-row-max="' + rowMax + '" min="0" max="' + rowMax + '" step="0.25" value="' + sv + '" style="--fill:' + fill + '%" aria-label="' + field + ' hours">' +
        '<span class="range-val" data-val-for="' + field + '-' + i + '" title="Max for this row: ' + rowMax + 'h">' + (numericValue === "" ? "0" : fmtH(+numericValue)) + 'h</span>' +
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
    const max = +(inp.dataset.rowMax || inp.max || SLIDER_MAX_DEFAULT);
    const v = +inp.value;
    inp.style.setProperty("--fill", (v / max * 100).toFixed(1) + "%");
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

  function addRow(kind) {
    // kind: "sub" → append under the last category. "cat" → new top-level category.
    const lastCat = rows.length ? rows[rows.length - 1].category : "Other";
    const isSub = kind !== "cat";
    rows.push({
      id: "custom-" + Date.now(),
      category: isSub ? lastCat : "New category",
      sub: isSub ? "New subcategory" : "New row",
      group: "", hint: "",
      ideal: "", actual: "", notes: ""
    });
    saveState();
    renderWorksheet();
    renderStats();
    // Focus + select the new row's relevant cell so user can rename in place.
    requestAnimationFrame(() => {
      const body = document.getElementById("auditBody");
      if (!body) return;
      const lastRow = body.lastElementChild;
      if (!lastRow) return;
      lastRow.scrollIntoView({ behavior: "smooth", block: "center" });
      const target = lastRow.querySelector(isSub ? ".cell-sub" : ".cell-cat");
      if (target) {
        target.focus();
        if (typeof target.select === "function") target.select();
      }
    });
  }

  function resetToDefaults() {
    if (!confirm("Reset this profile to default rows? Current data in '" + currentProfile().name + "' will be lost (reflection answers kept).")) return;
    rows = freshRows();
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

    function promptBlock(promptText, key) {
      const saved = escAttr(getReflection(promptText));
      return '<div class="prompt-card">' +
        '<p class="prompt-text">' + md(promptText) + '</p>' +
        '<textarea class="reflect-answer" data-prompt="' + escAttr(promptText) + '" data-key="' + key + '" placeholder="Type your answer…" rows="2">' + saved + '</textarea>' +
        '</div>';
    }

    let html = '<div class="reflect-section"><p class="reflect-section-title">Ideal Week Analysis</p>';
    REFLECTION.ideal.forEach((p, i) => { html += promptBlock(p, "ideal-" + i); });
    html += '</div>';

    html += '<div class="reflect-section"><p class="reflect-section-title">Actual Week Analysis</p>';
    REFLECTION.actual.forEach((p, i) => { html += promptBlock(p, "actual-" + i); });
    html += '</div>';

    html += '<div class="reflect-section"><p class="reflect-section-title">Vital Reflection</p>';
    REFLECTION.vital.forEach((p, i) => { html += promptBlock(p, "vital-" + i); });
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

    container.querySelectorAll(".reflect-answer").forEach(ta => {
      autoResize(ta);
      ta.addEventListener("input", function() {
        setReflection(this.dataset.prompt, this.value);
        autoResize(this);
      });
    });
  }

  function autoResize(ta) {
    ta.style.height = "auto";
    ta.style.height = (ta.scrollHeight + 2) + "px";
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

  // ------ Export FAB open/close ------
  (function initFab() {
    const fab = document.getElementById("exportBar");
    const trigger = document.getElementById("exportTrigger");
    function setOpen(open) {
      fab.dataset.open = open ? "true" : "false";
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    }
    trigger.addEventListener("click", function(e) {
      e.stopPropagation();
      setOpen(fab.dataset.open !== "true");
    });
    document.addEventListener("click", function(e) {
      if (!fab.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape") setOpen(false);
    });
    fab.querySelectorAll(".export-btn").forEach(btn => btn.addEventListener("click", function() { setTimeout(() => setOpen(false), 80); }));
  })();

  document.getElementById("exportCsv").addEventListener("click", function() {
    const lines = ["Category,Sub-category,Ideal,Actual,Notes"];
    rows.forEach(r => lines.push([r.category, r.sub, r.ideal, r.actual, r.notes].map(csvEscape).join(",")));
    download(profileFilename("csv"), "text/csv", lines.join("\\r\\n"));
  });

  document.getElementById("exportJson").addEventListener("click", function() {
    const cp = currentProfile();
    download(profileFilename("json"), "application/json", JSON.stringify({
      profile: cp.name,
      rows: cp.rows,
      reflections: cp.reflections || {},
      generated: new Date().toISOString()
    }, null, 2));
  });

  document.getElementById("exportMd").addEventListener("click", function() {
    const cp = currentProfile();
    const idealTotal = sumIdeal();
    const actualTotal = sumActual();
    const diff = actualTotal - idealTotal;
    const signed = (diff >= 0 ? "+" : "") + fmtH(diff);
    let md = "# 168 — Audit Your Week\\n";
    md += "**Profile:** " + cp.name + "\\n\\n";
    md += "| Category | Sub-category | Ideal (h) | Actual (h) | Notes |\\n";
    md += "|---|---|---:|---:|---|\\n";
    rows.forEach(r => {
      md += "| " + [r.category, r.sub, r.ideal || 0, r.actual || 0, r.notes || ""].join(" | ") + " |\\n";
    });
    md += "\\n**Ideal total:** " + fmtH(idealTotal) + "h · **Actual total:** " + fmtH(actualTotal) + "h · **Delta:** " + signed + "h\\n";

    function reflectSection(title, list, prefix) {
      const answered = list.map((p, i) => ({ p, a: getReflection(p) })).filter(x => x.a && x.a.trim());
      if (!answered.length) return "";
      let s = "\\n## " + title + "\\n\\n";
      answered.forEach(x => {
        s += "**Q.** " + x.p + "\\n\\n";
        s += x.a.split("\\n").map(line => "> " + line).join("\\n") + "\\n\\n";
      });
      return s;
    }
    md += reflectSection("Ideal Week Analysis", REFLECTION.ideal, "ideal");
    md += reflectSection("Actual Week Analysis", REFLECTION.actual, "actual");
    md += reflectSection("Vital Reflection", REFLECTION.vital, "vital");

    download(profileFilename("md"), "text/markdown", md);
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

  // ------ Profile picker ------
  function renderProfileChip() {
    document.getElementById("profileChipName").textContent = currentProfile().name;
  }
  function buildProfileMenu() {
    const menu = document.getElementById("profileMenu");
    const ids = Object.keys(state.profiles);
    let html = '<div class="profile-menu-section">';
    ids.forEach(id => {
      const p = state.profiles[id];
      const active = id === state.activeProfile;
      html += '<button class="profile-menu-item' + (active ? " active" : "") + '" data-profile-id="' + id + '" role="menuitemradio" aria-checked="' + active + '">' +
        '<span class="pmi-check">' + (active ? "&#10003;" : "") + '</span>' +
        '<span class="pmi-name">' + escHtml(p.name) + '</span>' +
        '</button>';
    });
    html += '</div>';
    html += '<div class="profile-menu-divider"></div>';
    html += '<div class="profile-menu-section">';
    html += '<button class="profile-menu-item profile-menu-action" data-action="new"><span class="pmi-check">+</span><span>New profile…</span></button>';
    html += '<button class="profile-menu-item profile-menu-action" data-action="rename"><span class="pmi-check"></span><span>Rename current…</span></button>';
    html += '<button class="profile-menu-item profile-menu-action" data-action="duplicate"><span class="pmi-check"></span><span>Duplicate current</span></button>';
    if (ids.length > 1) {
      html += '<button class="profile-menu-item profile-menu-action danger" data-action="delete"><span class="pmi-check"></span><span>Delete current</span></button>';
    }
    html += '</div>';
    menu.innerHTML = html;

    menu.querySelectorAll("[data-profile-id]").forEach(btn => {
      btn.addEventListener("click", function() {
        const id = this.dataset.profileId;
        if (id === state.activeProfile) { closeProfileMenu(); return; }
        state.activeProfile = id;
        syncRows();
        saveState();
        renderProfileChip();
        buildProfileMenu();
        renderWorksheet();
        renderStats();
        if (activeView === "compare") renderCompare();
        if (activeView === "reflect") renderReflect();
        closeProfileMenu();
        showToast("Switched to '" + currentProfile().name + "'", false);
      });
    });
    menu.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", function() {
        const action = this.dataset.action;
        if (action === "new") {
          const name = prompt("Name for the new profile:", "New schedule");
          if (!name || !name.trim()) return;
          const id = uniqueProfileId();
          state.profiles[id] = freshProfile(id, name.trim());
          state.activeProfile = id;
          syncRows();
          saveState();
          renderProfileChip();
          buildProfileMenu();
          renderWorksheet();
          renderStats();
          closeProfileMenu();
        } else if (action === "rename") {
          const cur = currentProfile();
          const name = prompt("Rename profile:", cur.name);
          if (!name || !name.trim()) return;
          cur.name = name.trim();
          saveState();
          renderProfileChip();
          buildProfileMenu();
          closeProfileMenu();
        } else if (action === "duplicate") {
          const cur = currentProfile();
          const id = uniqueProfileId();
          state.profiles[id] = {
            id: id,
            name: cur.name + " (copy)",
            rows: JSON.parse(JSON.stringify(cur.rows)),
            reflections: JSON.parse(JSON.stringify(cur.reflections || {}))
          };
          state.activeProfile = id;
          syncRows();
          saveState();
          renderProfileChip();
          buildProfileMenu();
          renderWorksheet();
          renderStats();
          closeProfileMenu();
        } else if (action === "delete") {
          const cur = currentProfile();
          if (!confirm("Delete profile '" + cur.name + "'? This can't be undone.")) return;
          delete state.profiles[state.activeProfile];
          state.activeProfile = Object.keys(state.profiles)[0];
          syncRows();
          saveState();
          renderProfileChip();
          buildProfileMenu();
          renderWorksheet();
          renderStats();
          if (activeView === "reflect") renderReflect();
          closeProfileMenu();
        }
      });
    });
  }
  function openProfileMenu() {
    document.getElementById("profileWrap").dataset.open = "true";
    document.getElementById("profileChip").setAttribute("aria-expanded", "true");
  }
  function closeProfileMenu() {
    document.getElementById("profileWrap").dataset.open = "false";
    document.getElementById("profileChip").setAttribute("aria-expanded", "false");
  }
  (function initProfileChip() {
    const chip = document.getElementById("profileChip");
    chip.addEventListener("click", function(e) {
      e.stopPropagation();
      const wrap = document.getElementById("profileWrap");
      if (wrap.dataset.open === "true") closeProfileMenu();
      else { buildProfileMenu(); openProfileMenu(); }
    });
    document.addEventListener("click", function(e) {
      const wrap = document.getElementById("profileWrap");
      if (!wrap.contains(e.target)) closeProfileMenu();
    });
    document.addEventListener("keydown", function(e) { if (e.key === "Escape") closeProfileMenu(); });
  })();

  // ------ View-mode (App / Dashboard) ------
  function applyViewMode(mode) {
    if (mode !== "app" && mode !== "dashboard") mode = "dashboard";
    state.viewMode = mode;
    document.body.dataset.mode = mode;
    document.querySelectorAll(".viewmode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
    saveState();
  }
  (function initViewMode() {
    document.querySelectorAll(".viewmode-btn").forEach(btn => {
      btn.addEventListener("click", function() { applyViewMode(this.dataset.mode); });
    });
  })();

  // ------ Guided tour ------
  const TOUR_KEY = "168-audit:tour-seen";
  const TOUR_STEPS = [
    {
      selector: ".brand-titles",
      title: "168 hours, your week",
      body: "Plan an ideal week, log your actual one, and see where the gap lives. Quick tour — about 60 seconds."
    },
    {
      view: "worksheet",
      selector: "#auditBody tr:first-child .col-sub .cell-input",
      title: "Edit any row",
      body: "Category and sub-category labels are editable. Click a cell to rename, and the Ideal/Actual fields take hours."
    },
    {
      view: "worksheet",
      selector: ".input-mode-toggle",
      title: "Numbers or sliders",
      body: "Switch input style. Sliders are sized per row — sleep and work scale to 80h, others to 15–20h."
    },
    {
      selector: '.view-tab[data-view="compare"]',
      title: "Compare ideal vs actual",
      body: "See which categories diverge most, with a callout for the biggest gap."
    },
    {
      view: "reflect",
      selector: "#view-reflect .reflect-answer",
      title: "Reflect in writing",
      body: "Type answers under each prompt. They save per profile and land in the Markdown export."
    },
    {
      selector: "#profileChip",
      title: "Multiple schedules",
      body: "Save separate weeks — Term, Summer, Sabbatical. Each profile keeps its own rows and reflections."
    },
    {
      selector: ".viewmode-toggle",
      title: "App or Dashboard",
      body: "Dashboard is a dense table. App is a focused card-stack. Pick whichever fits the moment."
    },
    {
      selector: "#exportTrigger",
      title: "Export anytime",
      body: "Tap to expand. CSV, JSON, Markdown (with answers), or print. Files are named for the active profile.",
      before: function() { /* nothing — keep FAB closed for the highlight */ }
    },
    {
      selector: "#themeBtn",
      title: "You're set",
      body: "Theme toggle here. Replay this tour with the ? button next to it. Have a useful audit.",
      final: true
    }
  ];

  function startTour(force) {
    if (!force) {
      try { if (localStorage.getItem(TOUR_KEY)) return; } catch(e) {}
    }
    let idx = 0;
    const overlay = document.getElementById("tour");
    const spotlight = document.getElementById("tourSpotlight");
    const tooltip = document.getElementById("tourTooltip");
    const countEl = document.getElementById("tourCount");
    const titleEl = document.getElementById("tourTitle");
    const bodyEl = document.getElementById("tourBody");
    const backBtn = document.getElementById("tourBack");
    const nextBtn = document.getElementById("tourNext");
    const skipBtn = document.getElementById("tourSkip");

    function show() {
      overlay.hidden = false;
      paint();
    }
    function paint() {
      const step = TOUR_STEPS[idx];
      if (step.view && activeView !== step.view) {
        document.querySelector('.view-tab[data-view="' + step.view + '"]').click();
        setTimeout(positionSpotlight, 80);
      } else {
        positionSpotlight();
      }
      countEl.textContent = "Step " + (idx + 1) + " of " + TOUR_STEPS.length;
      titleEl.textContent = step.title;
      bodyEl.textContent = step.body;
      backBtn.disabled = idx === 0;
      nextBtn.textContent = step.final ? "Done" : "Next →";
      if (typeof step.before === "function") step.before();
    }
    function positionSpotlight() {
      const step = TOUR_STEPS[idx];
      const target = document.querySelector(step.selector);
      if (!target) {
        // Target missing — center the tooltip and skip the spotlight.
        spotlight.style.opacity = "0";
        tooltip.style.top = "50%";
        tooltip.style.left = "50%";
        tooltip.style.transform = "translate(-50%, -50%)";
        return;
      }
      spotlight.style.opacity = "1";
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      // Defer positioning a frame so scroll completes
      requestAnimationFrame(() => {
        const r = target.getBoundingClientRect();
        const pad = 8;
        spotlight.style.top = (r.top - pad) + "px";
        spotlight.style.left = (r.left - pad) + "px";
        spotlight.style.width = (r.width + pad * 2) + "px";
        spotlight.style.height = (r.height + pad * 2) + "px";
        positionTooltip(r);
      });
    }
    function positionTooltip(r) {
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      tooltip.style.transform = "";
      // Reset any prior placement to measure naturally.
      tooltip.style.top = "0px"; tooltip.style.left = "0px";
      const tipRect = tooltip.getBoundingClientRect();
      const tw = tipRect.width, th = tipRect.height;
      const margin = 14;
      let top, left;
      // Prefer below the target
      if (r.bottom + th + margin < vh) {
        top = r.bottom + margin;
      } else if (r.top - th - margin > 0) {
        top = r.top - th - margin;
      } else {
        top = Math.max(margin, Math.min(vh - th - margin, r.top));
      }
      // Horizontally center on target, clamp to viewport.
      left = Math.max(margin, Math.min(vw - tw - margin, r.left + r.width / 2 - tw / 2));
      tooltip.style.top = top + "px";
      tooltip.style.left = left + "px";
    }
    function next() {
      if (TOUR_STEPS[idx].final) return done();
      idx = Math.min(TOUR_STEPS.length - 1, idx + 1);
      paint();
    }
    function back() {
      idx = Math.max(0, idx - 1);
      paint();
    }
    function done() {
      try { localStorage.setItem(TOUR_KEY, "1"); } catch(e) {}
      overlay.hidden = true;
      detach();
    }
    function onKey(e) {
      if (e.key === "Escape") done();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
    }
    function onResize() { positionSpotlight(); }
    function detach() {
      nextBtn.removeEventListener("click", next);
      backBtn.removeEventListener("click", back);
      skipBtn.removeEventListener("click", done);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    }
    nextBtn.addEventListener("click", next);
    backBtn.addEventListener("click", back);
    skipBtn.addEventListener("click", done);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);

    show();
  }

  document.getElementById("tourReplay").addEventListener("click", function() { startTour(true); });

  // ------ Init ------
  loadState();
  applyViewMode(state.viewMode);
  renderProfileChip();
  renderWorksheet();
  renderStats();
  // First-run tour, deferred so layout settles.
  setTimeout(() => startTour(false), 350);
})();
`;
}

const server = app.listen(PORT, () => console.log("168-audit listening on :" + PORT));

module.exports = app;
