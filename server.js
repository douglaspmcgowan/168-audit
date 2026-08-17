const express = require("express");
const crypto = require("crypto");
const { DEFAULT_ROWS, REFERENCE, REFLECTION, TARGET_HOURS, DEFAULT_SLIDER_MAX } = require("./data/categories");

const app = express();
const PORT = process.env.PORT || 3168;
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "X-Frame-Options": "DENY"
  });
  next();
});

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
app.get("/vendor/supabase.js", (req, res) => {
  res.set("Cache-Control", "public, max-age=86400, immutable");
  res.sendFile(require.resolve("@supabase/supabase-js/dist/umd/supabase.js"));
});

app.get("*", (req, res) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.set("Content-Type", "text/html; charset=utf-8");
  res.set("Cache-Control", "no-store");
  let connectSource = "'self'";
  if (SUPABASE_URL) {
    try { connectSource += " " + new URL(SUPABASE_URL).origin; } catch (error) {}
  }
  res.set("Content-Security-Policy",
    "default-src 'none'; script-src 'nonce-" + nonce + "'; style-src 'unsafe-inline'; " +
    "img-src 'self' data:; connect-src " + connectSource + "; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  );
  res.send(buildPage(nonce));
});

function buildPage(nonce) {
  const seedJson = JSON.stringify(DEFAULT_ROWS);
  const referenceJson = JSON.stringify(REFERENCE);
  const reflectionJson = JSON.stringify(REFLECTION);
  const cloudConfigJson = JSON.stringify({
    enabled: Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY),
    url: SUPABASE_URL,
    publishableKey: SUPABASE_PUBLISHABLE_KEY
  }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>168 — Audit Your Week</title>
<meta name="description" content="168 hours in a week. Plan your ideal week, log your actual week, and find out where the gap lives.">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>${getCSS()}</style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to audit</a>
  <div class="stats-sticky" id="statsSticky" aria-hidden="true">
    <div class="stats-sticky-inner">
      <div class="stats-sticky-row" id="statsStickyRow"></div>
    </div>
  </div>
  <header class="masthead">
    <div class="masthead-row">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">168</span>
        <div class="brand-titles">
          <h1 class="brand-title">Audit your week</h1>
        </div>
      </div>
      <div class="masthead-actions">
        <div class="profile-wrap" id="profileWrap" data-open="false">
          <button type="button" class="profile-chip" id="profileChip" aria-haspopup="menu" aria-expanded="false">
            <span class="profile-chip-name" id="profileChipName">Default</span>
            <svg class="ui-icon profile-chip-caret" aria-hidden="true" viewBox="0 0 20 20"><path d="m6.5 8 3.5 3.5L13.5 8"/></svg>
          </button>
          <div class="profile-menu" id="profileMenu" role="menu"></div>
        </div>
        <div id="exportBar" class="export-fab" data-open="false">
          <button type="button" class="export-trigger" id="exportTrigger" aria-haspopup="true" aria-expanded="false" aria-controls="exportMenu" aria-label="Data" title="Data">
            <svg class="ui-icon export-trigger-glyph" aria-hidden="true" viewBox="0 0 20 20"><path d="M10 3v9m0 0 3-3m-3 3L7 9M4 15.5h12"/></svg>
          </button>
          <div class="export-menu" id="exportMenu" role="menu">
            <p class="data-menu-scope">Download, restore, or share this schedule.</p>
            <div class="data-menu-group" role="presentation"><p class="data-menu-heading">Backup</p>
              <button class="export-btn data-menu-action" id="exportJson" role="menuitem"><span>Download backup</span><small>JSON</small></button>
              <button class="export-btn data-menu-action" id="importJson" role="menuitem"><span>Restore from backup</span><small>JSON</small></button>
            </div>
            <div class="data-menu-group" role="presentation"><p class="data-menu-heading">Share</p>
              <button class="export-btn data-menu-action" id="exportShare" role="menuitem"><span>Copy read-only link</span></button>
              <p class="data-menu-description">Anyone with the link can read this exported copy.</p>
            </div>
            <div class="data-menu-group" role="presentation"><p class="data-menu-heading">Other formats</p>
              <button class="export-btn data-menu-action" id="exportCsv" role="menuitem"><span>Spreadsheet</span><small>CSV</small></button>
              <button class="export-btn data-menu-action" id="exportMd" role="menuitem"><span>Full audit</span><small>Markdown</small></button>
              <button class="export-btn data-menu-action" id="exportJournal" role="menuitem"><span>Weekly journal</span><small>Markdown</small></button>
              <button class="export-btn data-menu-action" id="exportPrint" role="menuitem"><span>Print</span></button>
            </div>
            <div class="data-menu-footer"><button type="button" class="text-action" id="dataInfoBtn" role="menuitem">How storage and sharing work</button></div>
          </div>
          <input type="file" id="importFile" accept="application/json,.json" hidden>
        </div>
        <button type="button" class="tour-replay" id="tourReplay" title="What is 168 / replay tour / full tutorial" aria-label="Help"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.25"/><path d="M7.9 7.6a2.2 2.2 0 0 1 4.2 1c0 1.6-2.1 1.8-2.1 3.25M10 14.7h.01"/></svg></button>
        <button class="theme-toggle" id="themeBtn" aria-label="Toggle theme" title="Toggle theme">
          <svg class="ui-icon theme-icon-light" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.2"/><path d="M10 2v2m0 12v2M2 10h2m12 0h2M4.35 4.35l1.4 1.4m8.5 8.5 1.4 1.4m0-11.3-1.4 1.4m-8.5 8.5-1.4 1.4"/></svg>
          <svg class="ui-icon theme-icon-dark" aria-hidden="true" viewBox="0 0 20 20"><path d="M16.3 12.4A6.8 6.8 0 0 1 7.6 3.7a6.8 6.8 0 1 0 8.7 8.7Z"/></svg>
        </button>
      </div>
    </div>
    <div class="save-line">
      <span class="save-status" id="saveStatus" role="status" aria-live="polite">Saved in this browser</span>
    </div>
    <div class="masthead-stats" id="stats" aria-live="polite"></div>
  </header>

  <nav class="viewbar" role="tablist" aria-label="View">
    <div class="viewbar-inner">
      <button id="tab-worksheet" class="view-tab active" data-view="worksheet" role="tab" aria-selected="true" aria-controls="view-worksheet" tabindex="0">Plan</button>
      <button id="tab-compare" class="view-tab" data-view="compare" role="tab" aria-selected="false" aria-controls="view-compare" tabindex="-1">Compare</button>
      <button id="tab-reflect" class="view-tab" data-view="reflect" role="tab" aria-selected="false" aria-controls="view-reflect" tabindex="-1">Reflect</button>
      <button id="tab-history" class="view-tab" data-view="history" role="tab" aria-selected="false" aria-controls="view-history" tabindex="-1">History</button>
      <button id="tab-center" class="view-tab view-tab-center" data-view="center" role="tab" aria-selected="false" aria-controls="view-center" tabindex="-1">Center</button>
    </div>
  </nav>

  <main id="main">
    <section id="view-worksheet" class="view" role="tabpanel" aria-labelledby="tab-worksheet"></section>
    <section id="view-compare" class="view hidden" role="tabpanel" aria-labelledby="tab-compare"></section>
    <section id="view-reflect" class="view hidden" role="tabpanel" aria-labelledby="tab-reflect"></section>
    <section id="view-history" class="view hidden" role="tabpanel" aria-labelledby="tab-history"></section>
    <section id="view-center" class="view hidden" role="tabpanel" aria-labelledby="tab-center"></section>
  </main>

  <div id="whatIs" class="modal" hidden role="dialog" aria-modal="true" aria-labelledby="whatIsTitle">
    <div class="modal-backdrop" data-close="1"></div>
    <div class="modal-panel">
      <button type="button" class="modal-close" data-close="1" aria-label="Close">&times;</button>
      <p class="modal-eyebrow">What is this?</p>
      <h2 class="modal-title" id="whatIsTitle">168 hours, your week</h2>
      <div class="modal-body">
        <p>There are <strong>168 hours in a week</strong> — 24 × 7. Sleep, work, family, ministry, leisure, transit: all of it comes out of the same fixed budget.</p>
        <p>This is a planning tool, not a tracker. You make two passes:</p>
        <ul>
          <li><strong>Ideal:</strong> the week you'd live if you were intentional about every hour.</li>
          <li><strong>Actual:</strong> what last week really looked like.</li>
        </ul>
        <p>The gap between them is the useful part. Most people's first ideal week comes out 15–40 hours over budget — which is the whole point. It surfaces what you actually believe should give.</p>
        <p>Adapted from the <a href="https://dpm5970digitalgarden.vercel.app/168-audit-your-week/" target="_blank" rel="noopener">"168 — Audit Your Week"</a> note in Douglas McGowan's digital garden, which in turn draws on Laura Vanderkam's <a href="https://lauravanderkam.com/start-here/" target="_blank" rel="noopener">168 Hours</a> work.</p>
        <details class="modal-shortcuts">
          <summary>Keyboard shortcuts</summary>
          <table>
            <tr><td><kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> / <kbd>4</kbd></td><td>Switch to Plan / Compare / Reflect / History</td></tr>
            <tr><td><kbd>T</kbd></td><td>Toggle theme</td></tr>
            <tr><td><kbd>I</kbd></td><td>Toggle Numbers / Sliders input</td></tr>
            <tr><td><kbd>N</kbd></td><td>New subcategory row</td></tr>
            <tr><td><kbd>Shift</kbd>+<kbd>N</kbd></td><td>New category row</td></tr>
            <tr><td><kbd>E</kbd></td><td>Open export menu</td></tr>
            <tr><td><kbd>?</kbd></td><td>Open this help</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>Close modal / tour / menu</td></tr>
            <tr><td><kbd>Click</kbd> a row's left edge</td><td>Select row (Shift to extend range, Ctrl/Cmd to toggle)</td></tr>
            <tr><td><kbd>Delete</kbd> or <kbd>Backspace</kbd></td><td>Remove selected rows</td></tr>
          </table>
        </details>
        <details class="modal-tour-options">
          <summary>Tour options</summary>
          <div>
            <button type="button" class="btn btn-quiet" id="startTutorialBtn">Full tutorial</button>
            <button type="button" class="btn btn-quiet" id="startTourBtn">Quick tour</button>
          </div>
        </details>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-quiet" data-close="1">Continue planning</button>
        <button type="button" class="btn btn-primary" id="startWalkthroughBtn">Start walkthrough</button>
      </div>
    </div>
  </div>

  <div id="dataInfo" class="modal" hidden role="dialog" aria-modal="true" aria-labelledby="dataInfoTitle">
    <div class="modal-backdrop" data-close="1"></div>
    <div class="modal-panel modal-panel-compact">
      <button type="button" class="modal-close" data-close="1" aria-label="Close">&times;</button>
      <h2 class="modal-title" id="dataInfoTitle">Your audit stays with you</h2>
      <div class="modal-body">
        <p>Your entries save automatically in this browser. They are not sent to an account or shared with Douglas.</p>
        <p>Browser storage can be cleared or remain on only one device. Export JSON for a portable backup; import that file to restore your profile later.</p>
        <p>Share links contain the selected profile&rsquo;s entries in the URL. Anyone who receives the link can read that copy.</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" data-close="1">Got it</button>
      </div>
    </div>
  </div>

  <div id="appDialog" class="modal" hidden role="dialog" aria-modal="true" aria-labelledby="appDialogTitle" aria-describedby="appDialogBody">
    <div class="modal-backdrop" data-app-dialog-cancel="1"></div>
    <form class="modal-panel modal-panel-compact" id="appDialogForm">
      <button type="button" class="modal-close" data-app-dialog-cancel="1" aria-label="Cancel">&times;</button>
      <h2 class="modal-title" id="appDialogTitle"></h2>
      <p class="modal-body" id="appDialogBody"></p>
      <label class="center-field" id="appDialogField" hidden>
        <span id="appDialogLabel">Name</span>
        <input id="appDialogInput" maxlength="120" autocomplete="off">
      </label>
      <div class="modal-actions">
        <button type="button" class="btn btn-quiet" data-app-dialog-cancel="1">Cancel</button>
        <button type="submit" class="btn btn-primary" id="appDialogConfirm">Continue</button>
      </div>
    </form>
  </div>

  <div id="distributionDialog" class="modal" hidden role="dialog" aria-modal="true" aria-labelledby="distributionDialogTitle">
    <div class="modal-backdrop" data-distribution-close="1"></div>
    <div class="modal-panel distribution-panel">
      <button type="button" class="modal-close" data-distribution-close="1" aria-label="Close allocation chart">&times;</button>
      <h2 class="modal-title" id="distributionDialogTitle">Week allocation</h2>
      <div id="distributionDialogContent"></div>
    </div>
  </div>

  <div id="feedbackDialog" class="modal" hidden role="dialog" aria-modal="true" aria-labelledby="feedbackTitle" aria-describedby="feedbackIntro">
    <div class="modal-backdrop" data-feedback-close="1"></div>
    <form class="modal-panel feedback-panel" id="feedbackForm">
      <button type="button" class="modal-close" data-feedback-close="1" aria-label="Close feedback form">&times;</button>
      <h2 class="modal-title" id="feedbackTitle">Send feedback</h2>
      <p class="modal-body" id="feedbackIntro">Tell Douglas what worked, what felt difficult, or what would make the audit more useful.</p>
      <label class="center-field">
        <span>Your feedback</span>
        <textarea id="feedbackMessage" rows="6" maxlength="4000" required></textarea>
      </label>
      <label class="center-field">
        <span>Email <small>(optional)</small></span>
        <input id="feedbackEmail" type="email" maxlength="254" autocomplete="email">
      </label>
      <p class="feedback-status" id="feedbackStatus" role="status" aria-live="polite"></p>
      <div class="modal-actions">
        <button type="button" class="btn btn-quiet" id="copyFeedbackBtn">Copy message</button>
        <button type="submit" class="btn btn-primary">Open email</button>
      </div>
      <a id="feedbackEmailLink" hidden target="_blank" rel="noopener"></a>
    </form>
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
    <span class="colophon-bit"><a class="colophon-link" href="https://dpm5970digitalgarden.vercel.app/168-audit-your-week/" target="_blank" rel="noopener">Source: Douglas McGowan&rsquo;s digital garden</a></span>
    <span class="colophon-sep">/</span>
    <span class="colophon-bit"><button type="button" class="colophon-link colophon-button" id="feedbackBtn">Send feedback</button></span>
  </footer>

<script nonce="${nonce}" src="/vendor/supabase.js"></script>
<script nonce="${nonce}">
window.__SEED__ = ${seedJson};
window.__REFERENCE__ = ${referenceJson};
window.__REFLECTION__ = ${reflectionJson};
window.__CLOUD_CONFIG__ = ${cloudConfigJson};
window.__TARGET__ = ${TARGET_HOURS};
window.__SLIDER_MAX_DEFAULT__ = ${DEFAULT_SLIDER_MAX};
</script>
<script nonce="${nonce}">${getJS()}</script>
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
  --delta-positive: #2F6B3F;
  --delta-positive-soft: rgba(47, 107, 63, 0.12);
  --delta-negative: #C53838;
  --delta-negative-soft: rgba(197, 56, 56, 0.12);
  --tag-ink: #FAFAF7;
  --sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", system-ui, sans-serif;
  --mono: var(--sans);
  --label-spacing: 0.08em;
  --measure: 68ch;
  --content-max: 78rem;
  --content-gutter: 2rem;
  --content-gutter-mobile: 1.125rem;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;
  --text-meta: 0.75rem;
  --text-ui: 0.875rem;
  --text-body: 1rem;
  --text-section: 1.25rem;
  --text-title: 1.5rem;
  --text-display: 1.75rem;
  --leading-tight: 1.2;
  --leading-ui: 1.4;
  --leading-body: 1.6;
  --weight-medium: 500;
  --weight-semibold: 600;
  --control-height: 2.75rem;
  --radius-xs: 4px;
  --radius-control: 6px;
  --radius-surface: 10px;
  --radius-overlay: 12px;
  --radius-pill: 999px;
  --shadow-card: 0 18px 30px rgba(15, 15, 14, 0.035);
  --shadow-modal: 0 28px 72px rgba(15, 15, 14, 0.18);
  --scrollbar-track: #F2EEE5;
  --scrollbar-thumb: #A29A8D;
  --scrollbar-thumb-hover: #777064;
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
  --ink-faint: #A79D8C;
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
  --delta-positive: #6FBF7E;
  --delta-positive-soft: rgba(111, 191, 126, 0.16);
  --delta-negative: #FF7B75;
  --delta-negative-soft: rgba(255, 123, 117, 0.16);
  --tag-ink: #FAFAF7;
  --shadow-card: 0 18px 32px rgba(0, 0, 0, 0.28);
  --shadow-modal: 0 30px 80px rgba(0, 0, 0, 0.52);
  --scrollbar-track: #1D1914;
  --scrollbar-thumb: #6F675B;
  --scrollbar-thumb-hover: #9A9080;
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
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  scrollbar-width: thin;
}
*::-webkit-scrollbar { width: 0.75rem; height: 0.75rem; }
*::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border-radius: 999px;
}
*::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border: 3px solid var(--scrollbar-track);
  border-radius: 999px;
}
*::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }
*::-webkit-scrollbar-corner { background: var(--scrollbar-track); }
body { margin: 0; background: var(--paper); color: var(--ink); min-height: 100vh; }
button, input, textarea, select { font: inherit; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
.ui-icon {
  width: 1.1rem;
  height: 1.1rem;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
}
.skip-link {
  position: fixed; top: 0.75rem; left: 0.75rem; z-index: 10000;
  padding: 0.65rem 0.9rem; border-radius: 6px;
  background: var(--ink); color: var(--paper); font-weight: 600;
  transform: translateY(-180%); transition: transform var(--dur-out) var(--ease-out);
}
.skip-link:focus { transform: translateY(0); }
p { max-width: var(--measure); text-wrap: pretty; font-variant-numeric: oldstyle-nums; }
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

/* ------ Masthead ------ */
.masthead { max-width: var(--content-max); margin: 0 auto; padding: var(--space-5) var(--content-gutter) var(--space-4); }
.masthead-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding-bottom: 0.65rem; }
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
  font-family: var(--sans);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 500;
  line-height: 1;
}
.brand-title { font-size: var(--text-display); font-weight: var(--weight-semibold); letter-spacing: -0.028em; margin: 0; line-height: var(--leading-tight); max-width: 24ch; }
.save-line {
  display: flex; align-items: center; flex-wrap: wrap; gap: 0.45rem;
  margin: 0 0 0.7rem; color: var(--ink-faint); font-size: 0.78rem;
}
.save-status[data-state="saving"] { color: var(--warn); }
.save-status[data-state="error"] { color: var(--urgent); font-weight: 600; }
.save-status:not([data-state="error"]) {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
.text-action {
  appearance: none; padding: 0; border: 0; background: transparent; color: inherit;
  text-decoration: underline; text-decoration-color: var(--rule); text-underline-offset: 0.2em;
  cursor: pointer;
}
.text-action:hover { color: var(--ink); text-decoration-color: currentColor; }
.masthead-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, max-content));
  gap: var(--space-3) var(--space-6);
  padding-top: 0.7rem;
  border-top: 1px solid var(--rule);
  font-size: 0.74rem;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}
.stat {
  display: grid;
  grid-template-rows: auto auto;
  gap: var(--space-1);
  min-width: 0;
}
.stat-label {
  font-size: var(--text-meta);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--ink-faint);
}
.stat-value { display: flex; align-items: baseline; gap: var(--space-2); min-width: 0; }
.stat strong {
  display: inline-block;
  font-family: var(--sans);
  font-weight: 600;
  color: var(--ink);
  font-size: 1.08rem;
  letter-spacing: -0.02em;
  text-transform: none;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  min-width: 3.1rem;
  text-align: left;
}
.stat .stat-accent { color: var(--accent); }
.stat .stat-good { color: var(--good); }
.stat .stat-warn { color: var(--warn); }
.stat .stat-urgent { color: var(--urgent); }
.stat-detail { color: var(--ink-faint); font-size: var(--text-meta); white-space: nowrap; }
.stat-total { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--space-3); }
.stat-total > span { display:grid; grid-template-rows:auto auto; gap:var(--space-1); }
.stats-donut-btn {
  width:2.75rem; height:2.75rem; padding:.25rem; flex:0 0 2.75rem;
  display:grid; place-items:center; border:0; border-radius:var(--radius-control);
  background:transparent; color:var(--ink); cursor:pointer;
  transition:background-color var(--dur-out) var(--ease-out);
}
.stats-donut-btn:hover { background:var(--paper-soft); transition-duration:var(--dur-in); }
.stats-donut-btn:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.stats-donut-btn .donut { width:2.25rem; height:2.25rem; }
.stats-donut-btn .donut-label,
.stats-donut-btn .donut-unit { display:none; }
.stats-donut-btn .donut-num { font-size:2rem; }
.stats-sticky-row .stats-donut-btn { display:none; }

.theme-toggle {
  width: 2.75rem;
  height: 2.75rem;
  background: var(--paper-raised);
  border: 0;
  border-radius: var(--radius-control);
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
    box-shadow var(--dur-out) var(--ease-out);
}
.theme-toggle:hover {
  color: var(--ink);
  background: var(--paper-soft);
  box-shadow: inset 0 0 0 1px var(--rule);
  transition-duration: var(--dur-in);
  transition-timing-function: var(--ease-in);
}
[data-theme="dark"] .theme-toggle:hover { box-shadow: inset 0 0 0 1px var(--rule); }
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

/* Replay-tour / help pill — "?" glyph centered both axes */
.tour-replay {
  width: 2.75rem; height: 2.75rem;
  appearance: none; border: 0; cursor: pointer; padding: 0;
  background: var(--paper-raised);
  color: var(--ink-soft);
  box-shadow: inset 0 0 0 1px var(--rule);
  border-radius: var(--radius-control);
  font-family: var(--sans);
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1;
  display: inline-flex; align-items: center; justify-content: center;
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
.stats-sticky-row .stat { display: flex; align-items: baseline; gap: .45rem; }
.stats-sticky-row .stat-label { order: 2; }
.stats-sticky-row .stat-value { display: contents; }
.stats-sticky-row .stat-detail { order: 3; font-size: .68rem; }
.tour-replay:hover { color: var(--accent); background: var(--paper-soft); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }

/* "What is 168?" modal (and any future modal) */
.modal { position: fixed; inset: 0; z-index: 9998; display: flex; align-items: center; justify-content: center; padding: 1.2rem; }
.modal[hidden] { display: none; }
.modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); animation: modal-fade 180ms var(--ease-out); }
.modal-panel {
  position: relative;
  background: var(--paper-raised);
  color: var(--ink);
  box-shadow: var(--shadow-modal);
  border-radius: var(--radius-overlay);
  padding: 1.75rem 1.85rem 1.4rem;
  max-width: 34rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modal-rise 240ms var(--ease-out);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.modal-panel-compact { max-width: 34rem; }
.feedback-panel { max-width: 38rem; }
.feedback-panel .center-field { margin-top: var(--space-4); }
.feedback-panel .center-field textarea {
  width: 100%; resize: vertical; min-height: 8rem; border: 1px solid var(--rule);
  border-radius: var(--radius-control); background: var(--paper); color: var(--ink);
  padding: .75rem; font: inherit; line-height: var(--leading-body); letter-spacing: normal; text-transform: none;
}
.feedback-panel :where(input, textarea):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.feedback-status { min-height: 1.2em; margin: var(--space-3) 0 0; color: var(--ink-soft); font-size: var(--text-meta); }
.modal-close {
  position: absolute; top: 0.85rem; right: 0.95rem;
  width: 2rem; height: 2rem; border-radius: 999px;
  appearance: none; border: 0; cursor: pointer;
  background: transparent; color: var(--ink-faint);
  font-size: 1.35rem; line-height: 1;
  display: inline-flex; align-items: center; justify-content: center;
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
.modal-close:hover { color: var(--ink); background: var(--paper-soft); }
.modal-eyebrow {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: var(--label-spacing);
  color: var(--accent); font-weight: 500; margin: 0 0 0.35rem;
}
.modal-title { margin: 0 0 1rem; font-size: 1.45rem; font-weight: 600; line-height: 1.18; letter-spacing: -0.02em; }
.modal-body { color: var(--ink-soft); font-size: 0.96rem; line-height: 1.62; }
.modal-body p { margin: 0 0 0.85rem; }
.modal-body ul { margin: 0 0 0.95rem; padding-left: 1.25rem; }
.modal-body li { margin-bottom: 0.25rem; }
.modal-body strong { color: var(--ink); font-weight: 600; }
.modal-body a { color: var(--accent); text-decoration: none; border-bottom: 1px solid var(--accent-line); transition: border-color var(--dur-out) var(--ease-out); }
.modal-body a:hover { border-color: var(--accent); }
.modal-actions {
  margin-top: 1.4rem;
  padding-top: 1.1rem;
  border-top: 1px solid var(--rule);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.modal-shortcuts { margin-top: 1.2rem; padding-top: 1rem; border-top: 1px solid var(--rule-soft); }
.modal-shortcuts summary { cursor: pointer; font-size: 0.78rem; text-transform: uppercase; letter-spacing: var(--label-spacing); color: var(--ink-faint); font-weight: 500; padding: 0.3rem 0; }
.modal-shortcuts summary:hover { color: var(--ink); }
.modal-shortcuts table { width: 100%; margin-top: 0.6rem; border-collapse: collapse; font-size: 0.86rem; }
.modal-shortcuts td { padding: 0.32rem 0.4rem; vertical-align: top; color: var(--ink-soft); border-bottom: 1px solid var(--rule-soft); }
.modal-shortcuts tr:last-child td { border-bottom: 0; }
.modal-shortcuts td:first-child { width: 8.5rem; color: var(--ink); }
.modal-tour-options { margin-top:.7rem; }
.modal-tour-options summary { cursor:pointer; color:var(--ink-soft); font-size:.82rem; font-weight:500; padding:.35rem 0; }
.modal-tour-options summary:hover { color:var(--ink); }
.modal-tour-options > div { display:flex; gap:.45rem; flex-wrap:wrap; padding:.45rem 0 .2rem; }
kbd {
  display: inline-block;
  font-family: var(--sans); font-size: 0.78rem; font-weight: 500;
  padding: 0.08rem 0.4rem 0.12rem;
  border-radius: 4px;
  background: var(--paper-soft);
  color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--rule), 0 1px 0 var(--rule-soft);
  margin: 0 0.05rem;
}

/* Row selection (bulk actions) */
table.audit tbody tr.selected { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent), inset 0 0 0 1px var(--accent-line); }
table.audit tbody tr.selected td { color: var(--ink); }
.bulk-bar {
  display: none;
  align-items: center; justify-content: space-between; gap: 0.85rem;
  background: var(--accent-soft);
  border-radius: var(--radius-surface);
  padding: 0.55rem 0.95rem;
  margin-bottom: 0.9rem;
  font-size: 0.88rem;
  color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--accent-line);
}
.bulk-bar.visible { display: flex; }
.bulk-bar-count strong { font-weight: 600; }
.bulk-bar-actions { display: inline-flex; gap: 0.4rem; }
.bulk-bar-actions button {
  appearance: none; border: 0; cursor: pointer;
  background: var(--paper-raised); color: var(--ink);
  padding: 0.32rem 0.75rem; border-radius: 999px;
  font: inherit; font-size: 0.82rem; font-weight: 500;
  box-shadow: inset 0 0 0 1px var(--rule);
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
.bulk-bar-actions button.danger:hover { color: var(--urgent); }
.bulk-bar-actions button:hover { color: var(--ink); background: var(--paper-soft); }
.bulk-bar-actions button:disabled { opacity:.42; cursor:not-allowed; background:transparent; }
.row-title-line { display:flex; align-items:center; gap:var(--space-1); min-width:0; }
.category-color-key { width:.65rem; height:.65rem; margin-left:auto; flex:0 0 .65rem; border-radius:2px; background:var(--category-color); }
.category-panel { display:flex; flex-direction:column; gap:0; min-width:0; }
.category-panel-head { display:flex; align-items:center; gap:var(--space-1); min-width:0; }
.category-label {
  color:var(--ink-faint); font:600 var(--text-meta)/var(--leading-ui) var(--sans);
  letter-spacing:.04em; text-transform:uppercase;
}
.category-count { margin-left:auto; color:var(--ink-faint); font:400 var(--text-meta)/var(--leading-ui) var(--sans); }
.row-controls-sub { display:contents; }
.row-select-btn,
.row-reorder-btn {
  width:2.75rem; height:2.75rem; flex:0 0 2.75rem; display:grid; place-items:center;
  border:0; border-radius:var(--radius-control); background:transparent; color:var(--ink-faint); cursor:pointer;
  transition:color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
.row-select-btn:hover,
.row-reorder-btn:hover { color:var(--ink); background:var(--paper-soft); transition-duration:var(--dur-in); }
.row-select-btn:focus-visible,
.row-reorder-btn:focus-visible { outline:2px solid var(--accent); outline-offset:1px; }
.row-select-btn[aria-pressed="true"] { color:var(--accent); background:var(--accent-soft); }
.row-select-btn .select-check { opacity:0; }
.row-select-btn[aria-pressed="true"] .select-check { opacity:1; }
.row-reorder-btn[aria-grabbed="true"] { color:var(--accent); background:var(--accent-soft); cursor:grabbing; }
.row-reorder-btn[draggable="true"] { cursor:grab; touch-action:none; }
.row-reorder-btn[draggable="true"]:active { cursor:grabbing; }
tr.reorder-drop-target { background:var(--accent-soft); outline:2px solid var(--accent); outline-offset:-2px; }
.reorder-live { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
@keyframes modal-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes modal-rise { from { opacity: 0; transform: translateY(8px) scale(0.985); } to { opacity: 1; transform: none; } }
@media (max-width: 600px) {
  .modal { padding: 0.7rem; }
  .modal-panel { padding: 1.4rem 1.3rem 1.1rem; border-radius: var(--radius-overlay); }
  .modal-title { font-size: 1.25rem; }
  .modal-body { font-size: 0.92rem; }
  .modal-actions { justify-content: stretch; }
  .modal-actions .btn { flex: 1; justify-content: center; }
}

/* Guided tour overlay */
.tour-overlay { position: fixed; inset: 0; z-index: 9999; pointer-events: none; }
.tour-overlay:not([hidden]) { pointer-events: auto; }
/* In interactive mode (tutorial) the backdrop still dims hard but lets clicks through to the spotlighted UI */
.tour-overlay.interactive { pointer-events: none; }
.tour-overlay.interactive .tour-tooltip { pointer-events: auto; }
.tour-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0); transition: background-color 220ms var(--ease-out); }
.tour-overlay:not([hidden]) .tour-backdrop { background: rgba(0,0,0,0.62); }
.tour-overlay.interactive:not([hidden]) .tour-backdrop { background: rgba(0,0,0,0.62); }
.tour-spotlight {
  position: absolute;
  border-radius: var(--radius-overlay);
  box-shadow:
    0 0 0 9999px rgba(0, 0, 0, 0.68),
    0 0 0 3px var(--accent),
    0 0 28px 6px rgba(122, 156, 255, 0.45),
    inset 0 0 28px rgba(122, 156, 255, 0.16);
  pointer-events: none;
  /* No position transitions — instant snap matches the tutorial's discrete-step
     model and avoids tooltip-placement races during mid-transition measurements. */
}
.tour-tooltip {
  position: absolute;
  background: var(--paper-raised);
  color: var(--ink);
  box-shadow: var(--shadow-modal);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: var(--radius-overlay);
  padding: 1.1rem 1.2rem 1rem;
  max-width: 22rem;
  width: max-content;
  pointer-events: auto;
  opacity: 0;
  transform: translateY(4px);
  /* Snap top/left (like the spotlight) so step transitions don't briefly overlap. */
  transition: opacity 180ms var(--ease-out), transform 220ms var(--ease-out);
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
.tour-next:hover { background:color-mix(in srgb, var(--accent) 90%, var(--ink)); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
@media (max-width: 600px) {
  .tour-tooltip { max-width: calc(100vw - 2rem); width: calc(100vw - 2rem); padding: 0.95rem 1rem 0.85rem; }
  .tour-actions { align-items: center; gap: 0.35rem; }
  .tour-nav { justify-content: flex-end; margin-left: auto; }
  .tour-skip, .tour-back, .tour-next { min-height: 2.75rem; }
  .tour-skip { padding: 0.4rem; text-align: left; }
}
@media (max-width: 360px) {
  .tour-tooltip { padding: 0.75rem 0.85rem 0.7rem; }
  .tour-step-body { margin-bottom: 0.75rem; }
}
@media (max-height: 480px) {
  .tour-tooltip { max-width: min(20rem, calc(100vw - 2rem)); padding: 0.7rem 0.85rem 0.65rem; }
  .tour-step-body { line-height: 1.35; margin-bottom: 0.6rem; }
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
  height: 2.75rem;
  padding: 0 0.85rem 0 0.95rem;
  border-radius: var(--radius-control);
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
.profile-chip:hover { background: var(--paper-soft); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.profile-chip-name { font-weight: 500; max-width: 8rem; overflow: hidden; text-overflow: ellipsis; }
.profile-chip-caret { color: var(--ink-faint); width:.85rem; height:.85rem; }

.profile-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 17rem;
  background: var(--paper-raised);
  box-shadow: inset 0 0 0 1px var(--rule), var(--shadow-modal);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: var(--radius-surface);
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

/* ------ View tabs ------ */
.viewbar { max-width: var(--content-max); margin: 0 auto; padding: 0 var(--content-gutter); border-top: 1px solid var(--rule-soft); border-bottom: 1px solid var(--rule); }
.viewbar-inner { display: flex; gap: var(--space-5); flex-wrap: wrap; }
.view-tab {
  flex: 0 0 auto;
  min-width: 2.75rem;
  background: transparent;
  border: 0;
  padding: 0.92rem 0 0.78rem;
  cursor: pointer;
  font-family: var(--sans);
  font-size: var(--text-ui);
  font-weight: var(--weight-medium);
  color: var(--ink-faint);
  opacity: 1;
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
main { max-width: var(--content-max); margin: 0 auto; padding: var(--space-5) var(--content-gutter) calc(var(--space-8) * 2); }
.view.hidden { display: none; }

/* ------ Worksheet ------ */
.worksheet-commandbar {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--space-4);
  margin-bottom: var(--space-4); padding-bottom: var(--space-4); border-bottom: 1px solid var(--rule-soft);
}
.plan-guide {
  display: flex; align-items: center; justify-content: flex-end; gap: var(--space-4);
  grid-column: 2; grid-row: 1;
}
.plan-stage-toggle {
  display: inline-flex; flex-shrink: 0; padding: 0.2rem;
  border-radius: var(--radius-surface); background: var(--paper-soft);
}
.plan-stage-toggle button {
  min-height: 2.5rem; padding: 0 0.85rem; border: 0; border-radius: var(--radius-control);
  background: transparent; color: var(--ink-soft); cursor: pointer; font-size: 0.82rem; font-weight: 500;
}
.plan-stage-toggle button.active { background: var(--paper-raised); color: var(--ink); box-shadow: inset 0 0 0 1px var(--rule); }
.audit.plan-stage-ideal thead .stage-actual,
.audit.plan-stage-ideal tbody .stage-actual,
.audit.plan-stage-actual thead .stage-ideal,
.audit.plan-stage-actual tbody .stage-ideal { display: none; }
.mobile-category-nav { display: none; }
.category-view-toggle {
  display:inline-flex; padding:.2rem; border-radius:var(--radius-surface); background:var(--paper-soft);
}
.category-view-toggle button {
  min-height:2.5rem; padding:0 .8rem; border:0; border-radius:var(--radius-control);
  background:transparent; color:var(--ink-soft); cursor:pointer; font:500 .82rem var(--sans);
}
.category-view-toggle button.active { background:var(--paper-raised); color:var(--ink); box-shadow:inset 0 0 0 1px var(--rule); }
.distribution-panel { max-width:44rem; max-height:none; overflow:visible; }
.distribution-layout { display:grid; grid-template-columns:minmax(13rem,.8fr) minmax(14rem,1.2fr); gap:var(--space-6); align-items:center; }
.distribution-layout .donut { width:min(18rem, 100%); height:auto; margin:auto; }
.distribution-layout .legend { margin:0; }
.distribution-summary { color:var(--ink-soft); margin:-.35rem 0 var(--space-5); }
.worksheet-toolbar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  grid-column: 1; grid-row: 1;
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
  border-radius: var(--radius-control);
  cursor: pointer;
  background: var(--paper-raised);
  color: var(--ink-soft);
  box-shadow: inset 0 0 0 1px var(--rule-soft);
  transition:
    color var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out),
    box-shadow var(--dur-out) var(--ease-out);
  letter-spacing: -0.005em;
}
.btn:hover { color: var(--ink); box-shadow: inset 0 0 0 1px var(--rule); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.btn-primary { background: var(--accent); color: #fff; box-shadow: none; }
.btn-primary:hover { background: color-mix(in srgb, var(--accent) 90%, var(--ink)); color: #fff; box-shadow: none; }
[data-theme="dark"] .btn-primary { color: var(--paper); }
[data-theme="dark"] .btn-primary:hover { box-shadow: none; }
.btn-quiet { background: transparent; color: var(--ink-faint); box-shadow: none; }
.btn-quiet:hover { color: var(--ink); background: var(--paper-soft); box-shadow: inset 0 0 0 1px var(--rule-soft); }
.btn-secondary { box-shadow: inset 0 0 0 1px var(--rule); color: var(--ink-soft); }
.btn-secondary:hover { box-shadow: inset 0 0 0 1px var(--accent); color: var(--accent); }
.worksheet-icon-actions { display:flex; gap:.4rem; margin-left:auto; }
.toolbar-icon-btn {
  width:2.75rem; height:2.75rem; display:inline-flex; align-items:center; justify-content:center;
  border:1px solid var(--rule); border-radius:var(--radius-control); background:var(--paper-raised); color:var(--ink-soft);
  cursor:pointer; font:600 .8rem var(--sans);
}
.worksheet-toolbar .category-view-toggle { margin-left:auto; }
.worksheet-icon-actions { margin-left:0; }
.toolbar-icon-btn:hover { background:var(--paper-soft); color:var(--ink); }
.toolbar-icon-btn:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.mode-123 { font-variant-numeric:tabular-nums; letter-spacing:-.05em; }
.mode-slider { font-size:1.15rem; }

.table-wrap { overflow-x: clip; }
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
  font-family: var(--sans);
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
  padding: var(--space-1) var(--space-3);
  border-bottom: 1px solid var(--rule-soft);
  vertical-align: middle;
}
table.audit tbody tr:last-child td { border-bottom: 0; }
table.audit tbody tr.cat-start:not(.cat-start-first) td {
  border-top: 2px solid var(--rule);
  padding-top: var(--space-2);
}
table.audit tbody tr.cat-start td.col-cat { color: var(--ink); }
table.audit tbody tr.cat-start td.col-cat .cell-input.cell-cat { font-weight: 600; }
table.audit td.col-cat {
  font-weight: 600;
  color: var(--ink);
  font-size: 1.02rem;
  letter-spacing: -0.015em;
  white-space: nowrap;
  width: 15.5rem;
  min-width: 15.5rem;
  max-width: 15.5rem;
  padding:var(--space-2) var(--space-3);
  vertical-align:top;
  background:color-mix(in srgb, var(--category-color, var(--accent)) 7%, var(--paper));
}
table.audit tbody tr.cat-start td.col-cat { border-right:1px solid var(--category-color, var(--accent)); }
table.audit td.col-sub { color: var(--ink-soft); font-size: 0.92rem; min-width: 10rem; }
table.audit td.col-num { text-align: right; width: 13rem; min-width: 13rem; }
table.audit td.col-notes { min-width: 10rem; }
table.audit td.col-del { width: 2.4rem; text-align: center; }
.add-note-btn { display:none; }

/* category text in editable cells inherits the bigger size */
.cell-input.cell-cat { font-size: 1.02rem; font-weight: 650; letter-spacing: -0.015em; padding-left:0; }
.cell-input.cell-sub { font-size: 0.92rem; font-weight: 400; }

/* number inputs */
.num-input {
  width: 6rem;
  text-align: right;
  background: var(--paper-soft);
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: 0.3rem 0.55rem;
  font-family: var(--sans);
  font-size: 0.92rem;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  font-feature-settings:"tnum" 1;
  transition: border-color var(--dur-out) var(--ease-out), background var(--dur-out) var(--ease-out);
  -moz-appearance: textfield;
}
.num-input::-webkit-inner-spin-button,
.num-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.num-input:hover { border-color: var(--ink-soft); }
.num-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 0; border-color: transparent; background: var(--paper); }

/* inline-editable text cell (category + sub-category) */
.cell-input {
  width: min(100%, var(--field-width, 100%));
  background: transparent;
  border: 0;
  border-radius: 4px;
  padding: 0.32rem 0.5rem;
  font: inherit;
  color: inherit;
  box-shadow:inset 0 -1px 0 transparent;
  transition: box-shadow var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
.cell-input:hover { box-shadow:inset 0 -1px 0 var(--rule); background:var(--paper-soft); }
.cell-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; box-shadow:none; background: var(--paper); }
.cell-input.cell-cat { color: var(--ink); }
.cell-input.cell-sub { color: var(--ink-soft); }

/* slider input mode — fixed width in dashboard rows so the column doesn't reflow */
.range-cell {
  display: grid;
  grid-template-columns: 1fr 4.75rem;
  align-items: center;
  gap: 0.55rem;
  width: 12rem;
  max-width: 100%;
}
.range-cell.over-max .range-val { color: var(--warn); }
.range-cell.over-max .range-val::after { content: " ⚠"; font-size: 0.78em; }
.range-input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 2.75rem;
  background: transparent;
  cursor: pointer;
  margin: 0;
}
.range-input::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(to right, var(--accent) 0 var(--fill, 0%), var(--paper-soft) var(--fill, 0%) 100%);
  box-shadow: inset 0 0 0 1px var(--rule-soft);
}
.range-input::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: var(--paper-soft);
  box-shadow: inset 0 0 0 1px var(--rule-soft);
}
.range-input::-moz-range-progress {
  height: 6px;
  border-radius: 999px;
  background: var(--accent);
}
.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px; height: 22px;
  border-radius: 999px;
  background: var(--paper);
  box-shadow: 0 0 0 1.5px var(--accent), 0 2px 6px rgba(0,0,0,0.18);
  margin-top: -8px;
  transition: transform 120ms var(--ease-in);
}
.range-input::-moz-range-thumb {
  width: 22px; height: 22px; border: 0; border-radius: 999px;
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
  font-feature-settings:"tnum" 1;
  font-size: 0.88rem;
  color: var(--ink);
  text-align: right;
  font-weight: 500;
  width: 4.75rem;
  min-width: 4.75rem;
  white-space: nowrap;
  overflow: hidden;
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

/* ------ Compare view ------ */
.insights {
  background: var(--paper-raised);
  border-radius: var(--radius-surface);
  padding: 1rem 1.2rem 1.1rem;
  box-shadow: inset 0 0 0 1px var(--rule-soft);
  margin-bottom: 1.5rem;
}
.insights-eyebrow {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: var(--label-spacing);
  color: var(--accent); font-weight: 500; margin: 0 0 0.55rem;
}
.insights-line { margin: 0 0 0.45rem; color: var(--ink); font-size: 0.96rem; line-height: 1.55; }
.insights-line:last-child { margin-bottom: 0; }
.insights-line strong { color: var(--ink); font-weight: 600; }

/* Donut + legend */
.donut-row {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 1.5rem 2rem;
  align-items: start;
  margin-bottom: 1.8rem;
}
.donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.55rem; }
.donut { width: 11rem; height: 11rem; display: block; }
.donut .donut-num {
  font-family: var(--sans); font-weight: 600;
  font-size: 1.55rem;
  fill: var(--ink); letter-spacing: -0.02em;
}
.donut .donut-unit { font-family: var(--sans); font-size: 0.7rem; fill: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.08em; }
.donut-label {
  margin: 0;
  font-size: 0.72rem; text-transform: uppercase; letter-spacing: var(--label-spacing);
  color: var(--ink-faint); font-weight: 500;
}
.donut-legend { padding-top: 0.35rem; }
.legend-eyebrow {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: var(--label-spacing);
  color: var(--ink-faint); font-weight: 500; margin: 0 0 0.55rem;
}
.legend { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); gap: 0.32rem 1rem; }
.legend li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.86rem; color: var(--ink-soft); }
.legend-swatch { width: 0.7rem; height: 0.7rem; border-radius: 2px; display: inline-block; flex-shrink: 0; }
.legend-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.legend-val { font-variant-numeric: tabular-nums; color: var(--ink-faint); font-size: 0.82rem; }

@media (max-width: 720px) {
  .donut-row { grid-template-columns: 1fr 1fr; gap: 1rem 1rem; }
  .donut-legend { grid-column: 1 / -1; }
  .donut { width: 9rem; height: 9rem; }
}

.compare-callout {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.9rem 1.15rem;
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
  border-radius: 6px;
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
  font-family: var(--sans);
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
}
.toolbar-icon-btn.input-mode-btn {
  width:2.75rem;
  height:2.75rem;
  padding:0;
  border:1px solid var(--rule);
  border-radius:var(--radius-control);
  background:var(--paper-raised);
  box-shadow:none;
}
.toolbar-icon-btn.input-mode-btn.active { box-shadow:none; }
.compare-header {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem;
  margin-bottom: 1.4rem;
}
.compare-header h2 { margin: 0 0 0.3rem; font-size: 1.25rem; letter-spacing: -0.02em; }
.compare-header p { margin: 0; color: var(--ink-soft); font-size: 0.9rem; }
.compare-total { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end; }
.compare-total span {
  padding: 0.4rem 0.65rem; border-radius: 999px;
  background: var(--paper-soft); color: var(--ink-soft); font-size: 0.78rem; font-variant-numeric: tabular-nums;
}
.delta-table-ranked { margin-bottom: 1rem; }
.edit-gap {
  min-height: 2.5rem; padding: 0 0.75rem; border: 1px solid var(--rule); border-radius: 6px;
  background: transparent; color: var(--ink); cursor: pointer; font-size: 0.8rem;
}
.edit-gap:hover { border-color: var(--accent); color: var(--accent); }
.compare-details { margin-top: 1rem; }
.compare-details > summary {
  min-height: 2.75rem; display: flex; align-items: center; cursor: pointer;
  color: var(--ink-soft); font-size: 0.86rem; font-weight: 500;
}
.compare-empty {
  max-width: 34rem; padding: 2rem; border-radius: var(--radius-surface);
  background: var(--paper-soft);
}
.compare-empty h3 { margin: 0 0 0.4rem; font-size: 1.05rem; }
.compare-empty p { margin: 0 0 1rem; color: var(--ink-soft); font-size: 0.9rem; }
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
  font-family: var(--sans);
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
.reflect-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
  margin-bottom: 1.5rem;
}
.reflect-header h2 { margin: 0 0 0.3rem; font-size: 1.25rem; letter-spacing: -0.02em; }
.reflect-header p { margin: 0; color: var(--ink-soft); font-size: 0.9rem; }
.reflect-progress {
  flex-shrink: 0; padding: 0.42rem 0.65rem; border-radius: 999px;
  background: var(--paper-soft); color: var(--ink-soft); font-size: 0.78rem;
}
.reflect-section-title {
  font-family: var(--sans);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin: 0 0 0.85rem;
  font-weight: 500;
}
.prompt-card {
  padding: 0.9rem 1.1rem;
  border: 1px solid var(--rule-soft);
  background: var(--paper-soft);
  border-radius: 6px;
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
.reflect-guided { max-width: 46rem; margin-left:auto; margin-right:auto; }
.reflect-guided .prompt-card { padding:1.2rem; }
.reflect-guided .reflect-answer { min-height:9rem; }
.reflect-nav { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-top:1rem; }
.reflect-nav .btn { min-height:2.75rem; }
.reflect-prior { max-width:46rem; margin:0 auto 1rem; }
.reflect-prior > summary { min-height:2.75rem; cursor:pointer; color:var(--ink-soft); font-size:.84rem; }
.reflect-prior .prompt-card { background:transparent; }
.muted { color:var(--ink-faint); }

.reference-section { margin-top: 2.4rem; }
.reference-section > summary { cursor: pointer; min-height: 2.75rem; display: flex; align-items: center; }
.reference-section[open] > summary { margin-bottom: 1rem; }
.reference-section-title {
  font-family: var(--sans);
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
  border-radius: var(--radius-surface);
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
  position: relative;
  z-index: 220;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.55rem;
  pointer-events: none;
}
.export-trigger, .export-menu { pointer-events: auto; }
.export-trigger {
  appearance: none;
  border: 0;
  cursor: pointer;
  background: var(--paper-raised);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 0.88rem;
  font-weight: 500;
  letter-spacing: 0.005em;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border-radius: var(--radius-control);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: inset 0 0 0 1px var(--rule);
  transition: color var(--dur-out) var(--ease-out), box-shadow var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
[data-theme="dark"] .export-trigger { color: var(--ink); box-shadow: inset 0 0 0 1px var(--rule); }
.export-trigger:hover { background:var(--paper-soft); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.export-trigger-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  font-size: 0.95rem;
}
.export-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  align-items: stretch;
  width: min(21rem, calc(100vw - 2rem));
  max-height: min(36rem, calc(100vh - 6rem));
  overflow-y: auto;
  padding: 1rem;
  border: 1px solid var(--rule);
  border-radius: var(--radius-overlay);
  background: var(--paper-raised);
  box-shadow: var(--shadow-modal);
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
  border-radius: var(--radius-control);
  width: 9.5rem;
  text-align: center;
  box-shadow: inset 0 0 0 1px var(--rule), 0 4px 14px rgba(0,0,0,0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
.export-btn:hover { color: var(--accent); background:var(--paper-soft); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.data-menu-scope { margin:0; color:var(--ink-soft); font-size:.8rem; }
.data-menu-group { display:grid; gap:.25rem; }
.data-menu-heading { margin:.2rem 0 .25rem; color:var(--ink-faint); font:600 .68rem var(--sans); letter-spacing:.08em; text-transform:uppercase; }
.data-menu-action { width:100%; min-height:2.75rem; padding:.55rem .7rem; border-radius:var(--radius-control); box-shadow:none; display:flex; align-items:center; justify-content:space-between; text-align:left; }
.data-menu-action small { color:var(--ink-faint); font-size:.7rem; }
.data-menu-description { margin:.15rem .7rem .3rem; color:var(--ink-faint); font-size:.72rem; line-height:1.4; }
.data-menu-footer { padding-top:.55rem; border-top:1px solid var(--rule-soft); }
.data-menu-footer .text-action { min-height:2.75rem; width:100%; text-align:left; }
@media (max-width: 600px) {
  .export-menu { position:fixed; top:auto; left:1rem; right:1rem; bottom:max(1rem, env(safe-area-inset-bottom)); width:auto; }
  .export-btn { width:100%; padding:0.55rem .7rem; }
}

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
.colophon { max-width: 78rem; margin: 0 auto; padding: 1.7rem 1rem 2.6rem; border-top: 1px solid var(--rule); display: flex; flex-wrap: wrap; gap: 0.4rem 0.65rem; align-items: center; font-family: var(--sans); font-size: 0.7rem; color: var(--ink-faint); letter-spacing: 0.06em; text-transform: uppercase; overflow-wrap: anywhere; }
.colophon-bit { overflow-wrap: anywhere; }
@media (min-width: 480px) { .colophon { padding-left: 2rem; padding-right: 2rem; } .colophon-bit { white-space: nowrap; overflow-wrap: normal; } }
.colophon-sep { color: var(--rule); }
.colophon-link { color: var(--ink-soft); text-decoration: none; border-bottom: 1px solid transparent; transition: color var(--dur-out) var(--ease-out), border-color var(--dur-out) var(--ease-out); }
.colophon-link:hover { color: var(--ink); border-color: var(--ink-soft); transition-duration: var(--dur-in); }
.colophon-button { appearance: none; padding: 0; background: transparent; border: 0; border-bottom: 1px solid transparent; cursor: pointer; font: inherit; letter-spacing: inherit; text-transform: inherit; }

/* ------ History view ------ */
.history-toolbar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  padding-bottom: 1rem;
  margin-bottom: 0.95rem;
  border-bottom: 1px solid var(--rule-soft);
}
.history-empty {
  text-align: center;
  padding: 3.5rem 1.5rem;
  background: var(--paper-raised);
  border-radius: var(--radius-overlay);
  box-shadow: inset 0 0 0 1px var(--rule-soft);
  margin-top: 1.2rem;
}
.history-empty-icon { width:2.75rem; height:2.75rem; margin:0 auto .8rem; display:grid; place-items:center; color:var(--accent); background:var(--accent-soft); border-radius:var(--radius-control); }
.history-empty-icon .ui-icon { width:1.35rem; height:1.35rem; }
.history-empty-title { font-size: 1.1rem; font-weight: 600; margin: 0 0 0.5rem; color: var(--ink); letter-spacing: -0.015em; }
.history-empty-body { font-size: 0.9rem; color: var(--ink-soft); margin: 0 0 1.2rem; line-height: 1.6; }
.snap-list { display: flex; flex-direction: column; gap: 0.55rem; margin-top: 0.5rem; }
.snap-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 0.7rem;
  background: var(--paper-raised);
  border-radius: var(--radius-surface);
  padding: 0.75rem 1rem;
  box-shadow: inset 0 0 0 1px var(--rule-soft);
}
.snap-row-info { min-width: 0; }
.snap-label {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 22rem;
}
.snap-meta {
  font-size: 0.76rem;
  color: var(--ink-faint);
  font-family: var(--sans);
  margin-top: 0.18rem;
}
.snap-compare-wrap { display:none; align-items:center; gap:.4rem; flex-shrink:0; }
.history-compare-mode .snap-compare-wrap { display:flex; }
.snap-commitment { margin-top:.2rem; color:var(--ink-soft); font-size:.78rem; line-height:1.4; }
.snap-compare-label { font-size: 0.76rem; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.05em; }
.snap-compare-select {
  appearance: none;
  background: var(--paper-soft);
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 0.3rem 1.8rem 0.3rem 0.55rem;
  font: inherit;
  font-size: 0.8rem;
  color: var(--ink);
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%238A847A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.4rem center;
  background-size: 1rem;
  transition: border-color var(--dur-out) var(--ease-out);
  max-width: 11rem;
}
.snap-compare-select:hover { border-color: var(--ink-soft); }
.snap-compare-select:focus-visible { outline: 2px solid var(--accent); outline-offset: 0; }
.snap-del-btn {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--ink-faint);
  font-size: 0.95rem;
  padding: 0.3rem 0.4rem;
  border-radius: 4px;
  line-height: 1;
  flex-shrink: 0;
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
.snap-del-btn:hover { color: var(--urgent); background: var(--urgent-soft); transition-duration: var(--dur-in); }
@media (max-width: 600px) {
  .snap-row { grid-template-columns: 1fr auto; grid-template-rows: auto auto; gap: 0.5rem 0.6rem; }
  .snap-row-info { grid-column: 1; grid-row: 1; }
  .snap-del-btn { grid-column: 2; grid-row: 1; }
  .snap-compare-wrap { grid-column: 1 / -1; grid-row: 2; }
  .snap-label { max-width: none; }
}

/* History diff table */
.history-diff-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}
.history-diff-title { font-size: 1rem; font-weight: 600; color: var(--ink); letter-spacing: -0.015em; margin: 0; }
.history-diff-sub { font-size: 0.8rem; color: var(--ink-faint); }
.snap-diff-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.88rem;
  border-top: 1px solid var(--rule);
}
.snap-diff-table th {
  background: var(--paper);
  font-family: var(--sans);
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  font-weight: 500;
  padding: 0.62rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid var(--rule);
  position: sticky;
  top: 0;
  z-index: 2;
  white-space: nowrap;
}
.snap-diff-table th.col-num { text-align: right; }
.snap-diff-table td { padding: 0.42rem 0.8rem; border-bottom: 1px solid var(--rule-soft); vertical-align: middle; }
.snap-diff-table tbody tr:last-child td { border-bottom: 0; }
.snap-diff-table td.col-num { text-align: right; font-family: var(--mono); font-variant-numeric: tabular-nums; }
.snap-diff-table td.col-removed { color: var(--ink-faint); font-style: italic; }
.snap-diff-delta { font-weight: 500; font-family: var(--mono); font-variant-numeric: tabular-nums; }
.snap-diff-delta.pos { color: var(--delta-positive); }
.snap-diff-delta.neg { color: var(--delta-negative); }
.snap-diff-delta.zero { color: var(--ink-faint); }
.snap-diff-summary {
  background: var(--paper-soft);
  font-weight: 600;
  border-top: 2px solid var(--rule);
}
.snap-diff-summary td { padding: 0.62rem 0.8rem; }
.snap-diff-back { margin-bottom: 1rem; }
.snap-diff-cat { font-size: 0.72rem; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.04em; margin-right: 0.25rem; }
@media (max-width: 720px) {
  .snap-diff-table th, .snap-diff-table td { padding: 0.38rem 0.55rem; }
}

/* ------ Print ------ */
@media print {
  .theme-toggle, .viewbar, .export-fab, .toast, .colophon,
  .worksheet-toolbar, .del-btn, #view-compare, #view-reflect { display: none !important; }
  body { background: #fff; color: #000; }
  .masthead { padding: 1rem 0; }
  main { padding: 0; }
  table.audit { font-size: 10pt; }
  table.audit th, table.audit td { padding: 0.35rem 0.5rem; }
  #view-worksheet { display: block !important; }
}

/* ------ Mobile ------ */
@media (max-width: 720px) {
  .masthead {
    padding: max(1rem, env(safe-area-inset-top)) max(1.1rem, env(safe-area-inset-right)) 0.7rem max(1.1rem, env(safe-area-inset-left));
  }
  .masthead-row { flex-direction: column; align-items: stretch; gap: var(--space-3); padding-bottom: var(--space-3); }
  .brand { align-items: center; gap: var(--space-3); }
  .brand-mark { width: 2.25rem; height: 2.25rem; margin-top: 0; flex: 0 0 2.25rem; }
  .brand-title { font-size: 1.4rem; line-height: 1.1; }
  .masthead-actions {
    width: 100%;
    justify-content: flex-start;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .profile-chip { height: 2.75rem; padding: 0 0.7rem 0 0.85rem; font-size: 0.8rem; max-width: none; flex: 1 1 auto; min-width: 0; }
  .profile-chip-name { max-width: none; }
  .theme-toggle { width: 2.75rem; height: 2.75rem; flex-shrink: 0; }
  .tour-replay { width: 2.75rem; height: 2.75rem; flex-shrink: 0; font-size: 0.9rem; }
  .profile-menu { right: 0; left: 0; min-width: 0; }
  .viewbar, main, .colophon { padding-left: 1.1rem; padding-right: 1.1rem; }
  .save-line { margin: 0; min-height: 0; }
  .masthead-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-3);
    padding-top: var(--space-3);
  }
  .masthead-stats .stat { align-content: start; }
  .masthead-stats .stat-value { flex-wrap: wrap; gap: var(--space-1) var(--space-2); }
  .masthead-stats .stat strong { min-width: 0; }
  .viewbar-inner { gap: 0.9rem; }
  main { padding-bottom: max(4rem, env(safe-area-inset-bottom)); }
  .worksheet-commandbar { display: flex; flex-direction: column; align-items: stretch; }
  .category-view-toggle { flex:1; }
  .category-view-toggle button { flex:1; }
  .worksheet-toolbar { gap: 0.5rem; order: 3; }
  .worksheet-toolbar .category-view-toggle { order:4; flex:1 1 100%; margin-left:0; }
  .plan-guide { align-items: stretch; order: 1; }
  .plan-stage-toggle { width: 100%; }
  .plan-stage-toggle button { flex: 1; min-height: 2.75rem; padding: 0 0.45rem; }
  .mobile-category-nav {
    display: grid; grid-template-columns: 2.75rem minmax(0, 1fr) 2.75rem; gap: 0.5rem;
    align-items: end; margin-bottom: 0; order: 5; flex:1 1 100%;
  }
  .mobile-category-nav[hidden] { display:none; }
  .mobile-category-nav button {
    width: 2.75rem; height: 2.75rem; border: 0; border-radius: 6px;
    background: var(--paper-soft); color: var(--ink); cursor: pointer;
    display:grid; place-items:center;
  }
  .mobile-category-nav label {
    display: block;
  }
  .mobile-category-nav select {
    width: 100%; height: 2.75rem; padding: 0 0.65rem;
    border: 1px solid var(--rule); border-radius:var(--radius-control);
    background: var(--paper-raised); color: var(--ink); font:500 var(--text-ui)/var(--leading-ui) var(--sans);
  }
  #auditBody tr.mobile-category-hidden { display: none; }
  .worksheet-icon-actions { margin-left: auto; }
  .worksheet-compact-action .ui-icon { display:none; }
  .range-cell { grid-template-columns: 1fr 4.4rem; width: 100%; min-width: 0; }
  .export-fab { flex: 0 0 2.75rem; align-items: center; justify-content: center; }
  .export-trigger {
    position: relative;
    width: 2.75rem;
    height: 2.75rem;
    min-height: 2.75rem;
    padding: 0;
    font-size: 0.84rem;
  }

  /* table → card stack on mobile */
  table.audit thead { display: none; }
  table.audit { border-top: 0; }
  table.audit, table.audit tbody, table.audit tr, table.audit td { display: block; width: 100%; }
  table.audit tr {
    background: transparent;
    border-radius: 0;
    box-shadow: none;
    border-bottom:1px solid var(--rule-soft);
    padding: var(--space-1) 0;
    margin-bottom: 0;
    position: relative;
  }
  table.audit tbody tr.cat-start,
  table.audit tbody tr.cat-start-first { margin-top:0; border-top:0; }
  table.audit tbody tr.cat-start::before {
    display: none;
  }
  table.audit tbody tr.cat-start td,
  table.audit tbody tr.cat-start:not(.cat-start-first) td {
    border-top: 0;
    padding-top: var(--space-1);
  }
  table.audit td {
    border-bottom: 0;
    padding: var(--space-1) 0;
    text-align: left;
  }
  table.audit td::before {
    content: attr(data-label);
    display: block;
    font-family: var(--sans);
    font-size: var(--text-meta);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-faint);
    margin-bottom: 0.18rem;
  }
  table.audit tbody tr { display:grid; grid-template-columns:minmax(0,1fr) 6.5rem 2.75rem; column-gap:.5rem; align-items:center; }
  table.audit tbody tr.selected { box-shadow:inset 3px 0 0 var(--accent); }
  table.audit td.col-cat { display:none; }
  #view-worksheet[data-category-view="all"] table.audit tr.cat-start { margin-top:var(--space-3); }
  #view-worksheet[data-category-view="all"] table.audit tr.cat-start-first { margin-top:0; }
  #view-worksheet[data-category-view="all"] table.audit tr.cat-start td.col-cat {
    display:block; grid-column:1 / -1; grid-row:1; width:100%; max-width:none;
    padding:var(--space-2); margin-bottom:var(--space-1); border:0;
    border-radius:var(--radius-control); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--category-color) 34%, var(--rule));
  }
  #view-worksheet[data-category-view="all"] table.audit tr.cat-start td.col-cat::before { display:none; }
  #view-worksheet[data-category-view="all"] table.audit tr.cat-start td.col-sub,
  #view-worksheet[data-category-view="all"] table.audit tr.cat-start td.col-num,
  #view-worksheet[data-category-view="all"] table.audit tr.cat-start td.col-del { grid-row:2; }
  #view-worksheet[data-category-view="all"] table.audit tr.cat-start td.col-notes { grid-row:3; }
  table.audit td.col-sub { grid-column:1; grid-row:1; min-width:0; padding-right:0; }
  table.audit td.col-sub .cell-input { padding:var(--space-1); font-size:1rem; color:var(--ink); }
  #view-worksheet[data-category-view="all"] table.audit td.col-sub { padding-left:var(--space-2); }
  table.audit .row-title-line { gap:0; }
  table.audit .row-select-btn,
  table.audit .row-reorder-btn { width:2.75rem; height:2.75rem; flex-basis:2.75rem; }
  table.audit td.col-num { grid-column:2; grid-row:1; width:auto; min-width:6.5rem; }
  table.audit td.col-notes { grid-column:1 / -1; grid-row:2; min-width:0; display:flex; align-items:center; gap:.5rem; }
  table.audit td.col-notes.notes-empty .notes-input { display:none; }
  table.audit td.col-notes.notes-empty .add-note-btn { display:inline-flex; }
  .add-note-btn {
    min-height:2.35rem; border:0; background:transparent; color:var(--ink-faint);
    padding:0 .25rem; cursor:pointer; font:500 .78rem var(--sans);
  }
  table.audit td.col-notes .notes-input { flex:1; min-width:0; }
  table.audit td.col-sub::before,
  table.audit td.col-num::before,
  table.audit td.col-notes::before { display: none; }
  table.audit td.col-del { position:static; grid-column:3; grid-row:1; width:2.75rem; padding:0; }
  table.audit td.col-del::before { display: none; }
  table.audit td.col-num { text-align: left; }
  .num-input { width: 6.5rem; min-height: 2.75rem; }
  .audit.input-sliders tbody tr { grid-template-columns:minmax(0,1fr) 2.75rem; }
  .audit.input-sliders td.col-sub { grid-column:1; }
  .audit.input-sliders td.col-num { grid-column:1 / -1; grid-row:2; width:100%; min-width:0; padding-top:.2rem; }
  .audit.input-sliders td.col-del { grid-column:2; grid-row:1; }
  .audit.input-sliders td.col-notes { grid-row:3; }
  #view-worksheet[data-category-view="all"] .audit.input-sliders tr.cat-start td.col-sub { grid-row:2; }
  #view-worksheet[data-category-view="all"] .audit.input-sliders tr.cat-start td.col-del { grid-row:2; }
  #view-worksheet[data-category-view="all"] .audit.input-sliders tr.cat-start td.col-num { grid-row:3; }
  #view-worksheet[data-category-view="all"] .audit.input-sliders tr.cat-start td.col-notes { grid-row:4; }
  .del-btn { width: 2.75rem; height: 2.75rem; display: grid; place-items: center; padding: 0; }
  .add-note-btn { min-height: 2.75rem; }
  .compare-grid { grid-template-columns: 1fr; gap: 1.2rem; }
  .compare-header { align-items: flex-start; flex-direction: column; }
  .compare-total { justify-content: flex-start; }
  .delta-table-ranked th:nth-child(2),
  .delta-table-ranked td:nth-child(2) { display: none; }
  .bar-row { grid-template-columns: 6rem 1fr auto; }

  .reference-grid { grid-template-columns: 1fr; }
  .reflect-header { flex-direction: column; }
}
@media (max-width: 480px) {
  .masthead-actions { flex-wrap: nowrap; }
  .profile-wrap { flex: 1 1 0; min-width: 0; }
  .profile-chip { width: 100%; }
  .profile-chip { min-width: 0; padding-left: 0.7rem; padding-right: 0.55rem; }
  .profile-chip-name { max-width: 7rem; }
  .colophon-sep { display: none; }
  .export-trigger { width: 2.75rem; padding: 0; gap: 0; }
  .viewbar { padding-left: 0.5rem; padding-right: 0.5rem; }
  .viewbar-inner { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0; }
  .view-tab {
    width: 100%; min-width: 0; display: inline-flex; align-items: center; justify-content: center;
    padding: 0.8rem 0.1rem 0.72rem; font-size: 0.74rem;
  }
  .worksheet-toolbar { flex-wrap:wrap; gap:.4rem; }
  .worksheet-toolbar > .btn { min-height:2.75rem; padding:0 .75rem; flex:0 0 auto; }
  .worksheet-compact-action { padding:0 .65rem !important; justify-content:center; }
  .worksheet-compact-action { background:var(--paper-raised); box-shadow:inset 0 0 0 1px var(--rule); }
  .worksheet-compact-action .ui-icon { display:block; }
  .worksheet-compact-action > span { display:inline; }
  .worksheet-icon-actions { gap:.4rem; }
  .worksheet-donut-copy { display:none; }
  .distribution-layout { grid-template-columns:1fr; gap:var(--space-4); }
}

/* ------ Multi-user center ------ */
.center-shell { max-width: 78rem; margin: 0 auto; }
.center-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.5rem; }
.center-heading h2 { margin:0; font-family:var(--sans); font-size:1.75rem; line-height:1.15; letter-spacing:-0.025em; }
.center-heading p { margin:.35rem 0 0; color:var(--ink-soft); max-width:42rem; line-height:1.55; }
.center-status { display:inline-flex; align-items:center; gap:.45rem; min-height:2.25rem; padding:0 .8rem; border-radius:999px; background:var(--paper-soft); color:var(--ink-soft); font-size:.78rem; white-space:nowrap; }
.center-status::before { content:""; width:.5rem; height:.5rem; border-radius:50%; background:var(--warn); }
.center-status[data-state="synced"]::before { background:var(--good); }
.center-grid { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(18rem,.85fr); gap:1rem; align-items:start; }
.center-grid > * { min-width:0; }
.center-card { min-width:0; border:1px solid var(--rule); border-radius:var(--radius-overlay); padding:1.25rem; background:var(--paper-raised); }
.center-card h3 { margin:0 0 .35rem; font-size:1rem; overflow-wrap:anywhere; }
.center-card > p { margin:.2rem 0 1rem; color:var(--ink-soft); font-size:.86rem; line-height:1.5; }
.center-form { display:grid; gap:.75rem; }
.center-form-row { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
.center-field { display:grid; gap:.35rem; color:var(--ink-soft); font-size:.75rem; font-weight:600; letter-spacing:.04em; text-transform:uppercase; }
.center-field input, .center-field select { width:100%; min-width:0; min-height:2.75rem; border:1px solid var(--rule); border-radius:var(--radius-control); background:var(--paper); color:var(--ink); padding:.65rem .75rem; font:inherit; letter-spacing:normal; text-transform:none; }
.center-actions { display:flex; align-items:center; gap:.55rem; flex-wrap:wrap; }
.center-divider { display:flex; align-items:center; gap:.7rem; margin:1rem 0; color:var(--ink-faint); font-size:.72rem; text-transform:uppercase; letter-spacing:.08em; }
.center-divider::before,.center-divider::after { content:""; height:1px; flex:1; background:var(--rule-soft); }
.center-empty { padding:1.5rem 1rem; border:1px dashed var(--rule); border-radius:var(--radius-surface); text-align:center; color:var(--ink-soft); }
.center-list { display:grid; gap:.6rem; }
.group-row,.week-share-row,.member-row { width:100%; min-width:0; display:flex; align-items:center; justify-content:space-between; gap:.8rem; padding:.75rem; border:1px solid var(--rule-soft); border-radius:var(--radius-control); background:var(--paper); color:var(--ink); text-align:left; }
.group-row-main,.member-main { min-width:0; }
.group-row strong,.member-row strong { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.group-row small,.member-row small,.week-share-row small { color:var(--ink-faint); }
.member-role-select { min-height:2.5rem; border:1px solid var(--rule); border-radius:var(--radius-control); background:var(--paper); color:var(--ink); padding:0 .55rem; }
.center-help { margin:.5rem 0 0; color:var(--ink-faint); font-size:.78rem; }
.invite-created { display:grid; gap:.55rem; padding:.75rem; border:1px solid var(--accent-line); border-radius:var(--radius-control); background:var(--accent-soft); color:var(--ink-soft); font-size:.78rem; }
.invite-created[hidden] { display:none; }
.invite-row { display:flex; align-items:center; justify-content:space-between; gap:.6rem; padding:.55rem 0; border-bottom:1px solid var(--rule-soft); }
.invite-row:last-child { border-bottom:0; }
.invite-row strong,.invite-row small { display:block; }
.invite-row small { color:var(--ink-faint); }
.group-row.active { border-color:var(--accent); background:var(--accent-soft); }
.privacy-note { display:flex; gap:.65rem; align-items:flex-start; padding:.8rem; border-radius:var(--radius-control); background:var(--accent-soft); color:var(--ink-soft); font-size:.8rem; line-height:1.45; }
.privacy-note strong { color:var(--ink); }
.center-error { color:var(--urgent); font-size:.82rem; min-height:1.2em; }
.center-tabs { display:flex; gap:.3rem; padding:.25rem; border-radius:var(--radius-surface); background:var(--paper-soft); margin-bottom:1rem; width:max-content; max-width:100%; }
.center-tabs button { border:0; border-radius:var(--radius-control); background:transparent; color:var(--ink-soft); min-height:2.5rem; padding:0 .8rem; cursor:pointer; }
.center-tabs button.active { background:var(--paper-raised); color:var(--ink); box-shadow:inset 0 0 0 1px var(--rule); }
.share-switch { display:inline-flex; align-items:center; gap:.45rem; min-width:2.75rem; min-height:2.75rem; padding:0 .25rem; cursor:pointer; color:var(--ink-soft); font-size:.78rem; }
.share-switch input { width:1.1rem; height:1.1rem; accent-color:var(--accent); }
.shared-week-card { border:1px solid var(--rule-soft); border-radius:var(--radius-surface); overflow:hidden; background:var(--paper); }
.shared-week-card .week-share-row { border:0; border-radius:0; }
.shared-week-details { border-top:1px solid var(--rule-soft); }
.shared-week-details > summary { min-height:2.75rem; display:flex; align-items:center; padding:0 .75rem; cursor:pointer; color:var(--accent); font-size:.8rem; }
.shared-week-data { padding:.25rem .75rem .75rem; display:grid; gap:.25rem; }
.shared-week-data-row { display:flex; justify-content:space-between; gap:1rem; padding:.55rem 0; border-bottom:1px solid var(--rule-soft); font-size:.8rem; }
.shared-week-data-row > span:last-child { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
.shared-week-data-row small { display:block; color:var(--ink-faint); }
.shared-week-note {
  max-width: 46ch;
  margin-top: var(--space-1);
  color: var(--ink-soft) !important;
  line-height: var(--leading-body);
}
.shared-reflection { padding:.6rem 0; }
.shared-reflection strong { font-size:.78rem; }
.shared-reflection p { margin:.25rem 0 0; color:var(--ink-soft); font-size:.82rem; line-height:1.45; }
@media (max-width: 760px) {
  .center-heading { flex-direction:column; }
  .center-grid { grid-template-columns:1fr; }
  .center-form-row { grid-template-columns:1fr; }
  .center-card { padding:1rem; }
  .member-row { flex-wrap:wrap; justify-content:flex-start; }
  .member-main { flex:1 1 100%; }
  .member-role-select { flex:1 1 7rem; min-width:0; }
}
@media (max-width: 380px) {
  .view-tab { font-size:var(--text-meta); }
}

/* ------ Shared design system roles ------ */
#view-compare, #view-history { max-width: 60rem; margin-inline: auto; }
#view-reflect { max-width: 46rem; margin-inline: auto; }
.center-shell { max-width: 68rem; }

:where(.btn, .view-tab, .profile-menu-item, .plan-stage-toggle button, .center-tabs button,
  .member-role-select, .data-menu-action, .shared-week-details > summary, .edit-gap) {
  font-size: var(--text-ui);
  line-height: var(--leading-ui);
}
:where(.save-line, .masthead-stats, .brand-eyebrow, .audit th, .field-label, .center-field,
  .center-divider, .center-status, .center-help, .invite-created, .share-switch,
  .shared-week-data-row, .shared-reflection strong, .reflect-progress, .reflect-section-title) {
  font-size: var(--text-meta);
  line-height: var(--leading-ui);
}
:where(.compare-header h2, .reflect-header h2, .history-toolbar h2) {
  font-size: var(--text-title);
  line-height: var(--leading-tight);
  font-weight: var(--weight-semibold);
}
:where(.center-heading h2) {
  font-size: var(--text-display);
  line-height: var(--leading-tight);
  font-weight: var(--weight-semibold);
}
:where(.center-card h3, .compare-empty h3, .history-empty h3) {
  font-size: var(--text-section);
  line-height: var(--leading-tight);
  font-weight: var(--weight-semibold);
}
:where(.center-card > p, .center-heading p, .compare-empty p, .history-empty p,
  .prompt-card p, .shared-reflection p) {
  line-height: var(--leading-body);
}
:where(.btn, .toolbar-icon-btn, .theme-toggle, .tour-replay, .export-trigger,
  .plan-stage-toggle button, .center-tabs button, .center-field input,
  .center-field select, .member-role-select, .shared-week-details > summary) {
  min-height: var(--control-height);
}

.compare-header, .reflect-header, .center-heading { margin-bottom: var(--space-5); }
.worksheet-toolbar, .history-toolbar {
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
}
.center-grid { gap: var(--space-4); }
.center-card { padding: var(--space-5); }
.center-list { gap: var(--space-2); }
.center-form { gap: var(--space-3); }

@media (max-width: 760px) {
  .masthead { padding: var(--space-4) var(--content-gutter-mobile) var(--space-3); }
  .viewbar { padding-inline: var(--content-gutter-mobile); }
  main { padding: var(--space-4) var(--content-gutter-mobile) var(--space-8); }
  .viewbar-inner { gap: var(--space-4); }
  .center-card { padding: var(--space-4); }
}
@media (max-width: 480px) {
  .viewbar { padding-inline: var(--space-2); }
  .view-tab { font-size: var(--text-meta); }
}
@media (max-width: 380px) {
  .view-tab { font-size: var(--text-meta); }
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
  const COMMITMENT_PROMPT = "What is one specific change you will test next week?";
  const GUIDED_REFLECTION_PROMPTS = [
    "What surprised you most about how your actual week differed from your ideal week?",
    "Which gap matters most to you?",
    "What caused that gap?",
    COMMITMENT_PROMPT
  ];
  const STORAGE_KEY = "168-audit:v2";
  const STORAGE_KEY_V3 = "168-audit:v3";
  const LEGACY_KEY = "168-audit:v1";

  // ------ State ------
  // state shape:
  //   { activeProfile, profiles: { id: { id, name, rows, reflections } }, snapshots }
  let state = null;
  let recoveryNotice = "";
  let rows = []; // alias for state.profiles[active].rows; updated on profile switch
  let undoStack = null; // {rows, index} for single-step undo
  let toastTimer = null;
  let inputMode = (function() {
    try { return localStorage.getItem("168-audit:input-mode") || "numbers"; }
    catch(e) { return "numbers"; }
  })();
  let planStage = (function() {
    try {
      const saved = localStorage.getItem("168-audit:plan-stage");
      return saved === "actual" || saved === "both" ? saved : "ideal";
    } catch(e) { return "ideal"; }
  })();
  let mobileCategory = null;
  let categoryView = (function() {
    try { return localStorage.getItem("168-audit:category-view") || "all"; }
    catch(e) { return "all"; }
  })();
  let selectedRows = new Set(); // row indices currently selected (for bulk actions)
  let lastClickedRowIdx = null; // for Shift+click range
  let grabbedRow = null;
  let grabbedKind = null;
  let grabOriginalRows = null;
  let dragSourceRow = null;
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
  function sanitizeRows(input, limit) {
    if (!Array.isArray(input) || input.length < 1 || input.length > limit) {
      throw new Error("Expected 1–" + limit + " valid audit rows");
    }
    function text(value, max, label) {
      if (value === null || value === undefined) return "";
      if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
        throw new Error(label + " must be text");
      }
      return String(value).slice(0, max);
    }
    return input.map(function(r, i) {
      if (!r || typeof r !== "object" || Array.isArray(r)) throw new Error("Row " + (i + 1) + " is invalid");
      return {
        id: text(r.id || ("row-" + i + "-" + Date.now()), 120, "Row id"),
        category: text(r.category, 120, "Category"),
        sub: text(r.sub, 180, "Sub-category"),
        ideal: fmtH(num(r.ideal)),
        actual: fmtH(num(r.actual)),
        notes: text(r.notes, 2000, "Notes"),
        sliderMax: Math.max(1, Math.min(168, num(r.sliderMax) || SLIDER_MAX_DEFAULT)),
        group: text(r.group, 120, "Group"),
        hint: text(r.hint, 500, "Hint")
      };
    });
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
    // 0) Try v3 (has snapshots)
    try {
      const raw = localStorage.getItem(STORAGE_KEY_V3);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.profiles && typeof parsed.profiles === "object" && parsed.activeProfile) {
          if (!parsed.profiles[parsed.activeProfile]) {
            parsed.activeProfile = Object.keys(parsed.profiles)[0] || "default";
          }
          Object.values(parsed.profiles).forEach(p => {
            p.rows = sanitizeRows(p.rows, 500);
            if (!p.reflections || typeof p.reflections !== "object") p.reflections = {};
            if (!p.id) p.id = uniqueProfileId();
            if (!p.name) p.name = "My Schedule";
          });
          if (!parsed.snapshots || typeof parsed.snapshots !== "object") parsed.snapshots = {};
          state = parsed;
          syncRows();
          return;
        }
      }
    } catch(e) {
      recoveryNotice = "Saved data could not be read. A fresh audit is open; import a JSON backup to restore it.";
    }

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
            p.rows = sanitizeRows(p.rows, 500);
            if (!p.reflections || typeof p.reflections !== "object") p.reflections = {};
            if (!p.id) p.id = uniqueProfileId();
            if (!p.name) p.name = "My Schedule";
          });
          parsed.snapshots = {};
          state = parsed;
          syncRows();
          saveState();
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
            snapshots: {}
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
      snapshots: {}
    };
    syncRows();
  }

  function saveState() {
    const status = document.getElementById("saveStatus");
    if (status) {
      status.textContent = "Saving…";
      status.dataset.state = "saving";
    }
    try {
      currentProfile().rows = rows;
      localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(state));
      if (status) {
        status.textContent = "Saved in this browser · " + new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());
        status.dataset.state = "saved";
      }
      return true;
    } catch(e) {
      if (status) {
        status.textContent = "Save failed · export a backup";
        status.dataset.state = "error";
      }
      return false;
    }
  }

  // ------ Snapshot helpers ------
  function getSnapshotsForProfile(pid) {
    return (state.snapshots && state.snapshots[pid]) || [];
  }

  function takeSnapshot(label) {
    if (!state.snapshots) state.snapshots = {};
    const pid = state.activeProfile;
    if (!state.snapshots[pid]) state.snapshots[pid] = [];
    const snap = {
      id: "snap-" + Date.now(),
      takenAt: new Date().toISOString(),
      label: label,
      commitment: getReflection(COMMITMENT_PROMPT),
      rows: JSON.parse(JSON.stringify(rows.map(r => ({ id: r.id, hours: r.hours !== undefined ? r.hours : (r.actual !== undefined ? r.actual : r.ideal), sub: r.sub, category: r.category, ideal: r.ideal, actual: r.actual }))))
    };
    state.snapshots[pid].push(snap);
    try {
      saveState();
    } catch(e) {
      if (e.name === "QuotaExceededError") showToast("Storage full — couldn't save snapshot.");
    }
  }

  function deleteSnapshot(snapId) {
    const pid = state.activeProfile;
    if (!state.snapshots || !state.snapshots[pid]) return;
    state.snapshots[pid] = state.snapshots[pid].filter(s => s.id !== snapId);
    saveState();
  }

  function defaultSnapshotLabel() {
    return "Week of " + new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
    const value = cp.reflections && cp.reflections[promptText];
    return typeof value === "string" ? value : "";
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
    history: document.getElementById("view-history"),
    center: document.getElementById("view-center"),
  };
  let activeView = "worksheet";
  let historySelecting = false;
  let historySelection = new Set();
  document.body.dataset.view = activeView;

  function activateView(tab, moveFocus) {
      const v = tab.dataset.view;
      activeView = v;
      document.body.dataset.view = v;
      tabs.forEach(t => {
        const selected = t.dataset.view === v;
        t.classList.toggle("active", selected);
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
      });
      Object.entries(views).forEach(([k, el]) => el.classList.toggle("hidden", k !== v));
      if (v === "compare") renderCompare();
      if (v === "reflect") renderReflect();
      if (v === "history") renderHistory();
      if (v === "center") renderCenter();
      if (moveFocus) tab.focus();
  }
  tabs.forEach(tab => {
    tab.addEventListener("click", function() {
      activateView(this, false);
    });
    tab.addEventListener("keydown", function(e) {
      const list = Array.from(tabs);
      const index = list.indexOf(this);
      let next = null;
      if (e.key === "ArrowRight") next = list[(index + 1) % list.length];
      else if (e.key === "ArrowLeft") next = list[(index - 1 + list.length) % list.length];
      else if (e.key === "Home") next = list[0];
      else if (e.key === "End") next = list[list.length - 1];
      if (next) {
        e.preventDefault();
        activateView(next, true);
      }
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

    function statDetail(total) {
      const diff = +(total - TARGET).toFixed(2);
      if (Math.abs(diff) <= 0.25) return "balanced";
      return diff > 0 ? "+" + fmtH(diff) + "h over" : fmtH(-diff) + "h left";
    }
    const distribution = worksheetDistribution();
    const chartLabel = distribution.field === "actual" ? "Actual week" : "Ideal week";
    const summaryInner =
      '<span class="stat"><span class="stat-label">Ideal week</span><span class="stat-value"><strong class="' + idealClass + '">' + fmtH(ideal) + 'h</strong></span></span>' +
      '<span class="stat"><span class="stat-label">Actual week</span><span class="stat-value"><strong class="' + actualClass + '">' + fmtH(actual) + 'h</strong></span></span>';
    statsEl.innerHTML =
      summaryInner +
      '<button type="button" class="stats-donut-btn" id="worksheetDonutBtn" aria-label="Expand ' + chartLabel.toLowerCase() + ' allocation chart" title="View ' + chartLabel.toLowerCase() + ' allocation">' +
        '<span class="worksheet-donut-content" aria-hidden="true">' + worksheetDonutMarkup(distribution) + '</span>' +
      '</button>';
    const chartButton = document.getElementById("worksheetDonutBtn");
    if (chartButton) chartButton.addEventListener("click", openDistributionDialog);
    const sticky = document.getElementById("statsStickyRow");
    if (sticky) sticky.innerHTML = summaryInner;
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

  // ------ Worksheet ------
  function worksheetDistribution() {
    const categories = Array.from(new Set(rows.map(function(row) { return row.category; })));
    const field = planStage === "actual" ? "actual" : "ideal";
    const byCategory = {};
    categories.forEach(function(category) { byCategory[category] = 0; });
    rows.forEach(function(row) { byCategory[row.category] += num(row[field]); });
    const total = categories.reduce(function(sum, category) { return sum + byCategory[category]; }, 0);
    return { categories: categories, field: field, byCategory: byCategory, total: total };
  }

  function worksheetDonutMarkup(distribution) {
    const label = distribution.field === "actual" ? "Actual week" : "Ideal week";
    return buildDonut(distribution.byCategory, distribution.categories, label, distribution.total);
  }

  function updateWorksheetDistribution() {
    const distribution = worksheetDistribution();
    const content = document.querySelector("#worksheetDonutBtn .worksheet-donut-content");
    if (content) content.innerHTML = worksheetDonutMarkup(distribution);
    const total = document.querySelector("#worksheetDonutBtn .worksheet-donut-copy strong");
    if (total) total.textContent = fmtH(distribution.total) + "h allocated";
    if (!document.getElementById("distributionDialog").hidden) renderDistributionDialog();
  }

  function renderWorksheet() {
    const container = views.worksheet;
    const categories = Array.from(new Set(rows.map(function(r) { return r.category; })));
    if (mobileCategory === null) {
      mobileCategory = categoryView === "focus" ? (categories[0] || "all") : "all";
    }
    if (categoryView === "all") mobileCategory = "all";
    container.dataset.categoryView = categoryView;
    const distribution = worksheetDistribution();

    let html = '<div class="worksheet-commandbar"><div class="plan-guide"><div class="plan-stage-toggle" role="group" aria-label="Plan stage">' +
        '<button type="button" data-plan-stage="ideal"' + (planStage === "ideal" ? ' class="active"' : '') + '>Ideal week</button>' +
        '<button type="button" data-plan-stage="actual"' + (planStage === "actual" ? ' class="active"' : '') + '>Actual week</button>' +
        '<button type="button" data-plan-stage="both"' + (planStage === "both" ? ' class="active"' : '') + '>Both</button>' +
      '</div></div>';

    let categoryPicker = '<div class="mobile-category-nav"' + (categoryView === "all" ? ' hidden' : '') + '><button type="button" id="prevCategory" aria-label="Previous category"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="m12.5 5-5 5 5 5"/></svg></button>' +
      '<label><span class="sr-only">Category</span><select id="mobileCategory">';
    categories.forEach(function(cat, index) {
      categoryPicker += '<option value="' + escAttr(cat) + '"' + (mobileCategory === cat ? " selected" : "") + '>' +
        (index + 1) + ' of ' + categories.length + ' · ' + escHtml(cat) + '</option>';
    });
    categoryPicker += '</select></label>' +
      '<button type="button" id="nextCategory" aria-label="Next category"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="m7.5 5 5 5-5 5"/></svg></button></div>';

    html += '<div class="worksheet-toolbar">' +
      '<button class="btn btn-primary" id="addSubBtn" title="Add a row under the last category (N)">Add row</button>' +
      '<button class="btn worksheet-compact-action" id="addCatBtn" title="Add a new top-level category (Shift+N)" aria-label="Add a new category"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M3.5 5.5h5l1.5 2h6.5v8h-13zM13.5 10v4m-2-2h4"/></svg><span>New category</span></button>' +
      '<button class="btn btn-quiet worksheet-compact-action" id="resetBtn" aria-label="Reset schedule"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M5.4 6.1A6 6 0 1 1 4 10m0-4v4h4"/></svg><span>Reset</span></button>' +
      '<div class="category-view-toggle" role="group" aria-label="Category view">' +
        '<button type="button" id="categoryViewFocus"' + (categoryView === "focus" ? ' class="active" aria-pressed="true"' : ' aria-pressed="false"') + '>Focus</button>' +
        '<button type="button" id="categoryViewAll"' + (categoryView === "all" ? ' class="active" aria-pressed="true"' : ' aria-pressed="false"') + '>All</button>' +
      '</div>' +
      categoryPicker +
      '<div class="worksheet-icon-actions">' +
        '<button class="toolbar-icon-btn" id="snapshotBtn" type="button" title="Save snapshot" aria-label="Save snapshot"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M4 5.5h12v10H4zM6.5 3.5h7v2M7 9h6m-6 3h4"/></svg></button>' +
        '<button class="toolbar-icon-btn input-mode-btn active" id="inputModeBtn" data-mode="' + (inputMode === "numbers" ? "sliders" : "numbers") + '" type="button" title="Switch to ' + (inputMode === "numbers" ? "sliders" : "numbers") + '" aria-label="Input mode: ' + inputMode + '. Switch to ' + (inputMode === "numbers" ? "sliders" : "numbers") + '">' +
          (inputMode === "numbers"
            ? '<span class="mode-123" aria-hidden="true">123</span>'
            : '<svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M4 5h7m3 0h2M4 10h2m3 0h7M4 15h6m3 0h3M11 3v4M6 8v4m4 1v4"/></svg>') +
        '</button>' +
      '</div>' +
      '</div></div>';

    html += '<div class="bulk-bar" id="bulkBar" role="status"><span class="bulk-bar-count" id="bulkBarCount"></span>' +
      '<div class="bulk-bar-actions">' +
        '<button type="button" id="bulkMoveUp">Move up</button>' +
        '<button type="button" id="bulkMoveDown">Move down</button>' +
        '<button type="button" id="bulkDeselect">Deselect</button>' +
        '<button type="button" id="bulkDelete" class="danger">Remove rows</button>' +
      '</div></div>';

    html += '<div class="table-wrap"><table class="audit plan-stage-' + planStage + ' input-' + inputMode + '">';
    html += '<thead><tr>' +
      '<th>Category</th>' +
      '<th>Sub-category</th>' +
      '<th class="col-num stage-ideal">Ideal (h)</th>' +
      '<th class="col-num stage-actual">Actual (h)</th>' +
      '<th>Notes</th>' +
      '<th></th>' +
      '</tr></thead>';

    html += '<tbody id="auditBody">';
    let prevCat = null;
    rows.forEach((row, i) => {
      const merged = row.category === prevCat;
      const catStart = !merged;
      const isFirstCat = catStart && i === 0;
      prevCat = row.category;
      const classes = [];
      if (catStart) classes.push("cat-start");
      if (isFirstCat) classes.push("cat-start-first");
      if (selectedRows.has(i)) classes.push("selected");
      const rowName = catStart ? row.category : row.sub;
      const titleWidth = Math.min(24, Math.max(5, String(rowName || "").length + 2));
      const selectControl =
        '<button type="button" class="row-select-btn" data-select-row="' + i + '" aria-pressed="' + (selectedRows.has(i) ? "true" : "false") + '" aria-label="Select ' + escAttr(row.sub || "subcategory") + '">' +
          '<svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="6.5"/><path class="select-check" d="m6.8 10 2 2.1 4.5-4.5"/></svg></button>';
      const reorderControl = function(kind, label) {
        const position = kind === "category"
          ? categories.indexOf(row.category) + 1
          : rows.slice(0, i + 1).filter(function(item) { return item.category === row.category; }).length;
        const count = kind === "category"
          ? categories.length
          : rows.filter(function(item) { return item.category === row.category; }).length;
        return '<button type="button" class="row-reorder-btn" data-reorder-row="' + i + '" data-reorder-kind="' + kind + '" draggable="true" aria-grabbed="false" aria-label="Reorder ' + escAttr(label || "row") + ', position ' + position + ' of ' + count + '" title="Drag to reorder. Keyboard: Enter, then arrow keys.">' +
          '<svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M7 5h6M7 10h6M7 15h6"/></svg></button>';
      };
      const categorySize = catStart ? rows.filter(function(item) { return item.category === row.category; }).length : 0;
      html += '<tr data-idx="' + i + '" data-category="' + escAttr(row.category) + '" style="--category-color:' + colorFor(row.category, categories) + '"' + (classes.length ? ' class="' + classes.join(" ") + '"' : '') + '>' +
        (catStart ? '<td class="col-cat" data-label="Category" rowspan="' + categorySize + '">' +
          '<div class="category-panel"><div class="category-panel-head">' +
            '<span class="category-label">Category</span>' +
            '<span class="category-count">' + categorySize + ' subcategor' + (categorySize === 1 ? 'y' : 'ies') + '</span>' +
            '<span class="category-color-key" aria-hidden="true"></span>' +
          '</div>' +
          '<div class="category-panel-head">' + reorderControl("category", row.category) +
            '<input type="text" class="cell-input cell-cat" data-field="category" data-idx="' + i + '" value="' + escAttr(row.category) + '" aria-label="Category name" style="--field-width:' + titleWidth + 'ch">' +
          '</div></div>' +
        '</td>' : '') +
        '<td class="col-sub" data-label="Sub-category">' +
          '<div class="row-title-line"><span class="row-controls-sub">' + selectControl + reorderControl("subcategory", row.sub) + '</span>' +
            '<input type="text" class="cell-input cell-sub" data-field="sub" data-idx="' + i + '" value="' + escAttr(row.sub) + '" aria-label="Sub-category" style="--field-width:' + Math.min(30, Math.max(8, String(row.sub || "").length + 2)) + 'ch">' +
          '</div>' +
        '</td>' +
        '<td class="col-num stage-ideal" data-label="Ideal (h)">' + valueCell(row, i, "ideal") + '</td>' +
        '<td class="col-num stage-actual" data-label="Actual (h)">' + valueCell(row, i, "actual") + '</td>' +
        '<td class="col-notes' + (row.notes ? '' : ' notes-empty') + '" data-label="Notes">' +
          '<button type="button" class="add-note-btn" data-note-idx="' + i + '">+ Note</button>' +
          '<input type="text" class="notes-input" data-field="notes" data-idx="' + i + '" value="' + escAttr(row.notes || "") + '" placeholder="Add a useful detail">' +
        '</td>' +
        '<td class="col-del"><button class="del-btn" data-del="' + i + '" aria-label="Remove row" title="Remove row">&times;</button></td>' +
        '</tr>';
    });
    html += '</tbody>';

    html += '</table></div><div class="reorder-live" id="reorderLive" role="status" aria-live="polite"></div>';
    container.innerHTML = html;

    document.getElementById("addSubBtn").addEventListener("click", () => addRow("sub"));
    document.getElementById("addCatBtn").addEventListener("click", () => addRow("cat"));
    document.getElementById("resetBtn").addEventListener("click", resetToDefaults);
    document.getElementById("snapshotBtn").addEventListener("click", saveSnapshotFromButton);
    document.getElementById("categoryViewFocus").addEventListener("click", function() {
      categoryView = "focus";
      mobileCategory = categories.includes(mobileCategory) ? mobileCategory : (categories[0] || "all");
      try { localStorage.setItem("168-audit:category-view", categoryView); } catch(e) {}
      renderWorksheet();
    });
    document.getElementById("categoryViewAll").addEventListener("click", function() {
      categoryView = "all";
      mobileCategory = "all";
      try { localStorage.setItem("168-audit:category-view", categoryView); } catch(e) {}
      renderWorksheet();
    });
    container.querySelectorAll("[data-plan-stage]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        planStage = this.dataset.planStage;
        try { localStorage.setItem("168-audit:plan-stage", planStage); } catch(e) {}
        renderWorksheet();
        renderStats();
      });
    });
    const categorySelect = document.getElementById("mobileCategory");
    categorySelect.addEventListener("change", function() {
      mobileCategory = this.value;
      applyMobileCategoryFilter();
    });
    function moveMobileCategory(delta) {
      let index = categories.indexOf(mobileCategory);
      if (index < 0) index = 0;
      mobileCategory = categories[(index + delta + categories.length) % categories.length];
      categorySelect.value = mobileCategory;
      applyMobileCategoryFilter();
    }
    document.getElementById("prevCategory").addEventListener("click", function() { moveMobileCategory(-1); });
    document.getElementById("nextCategory").addEventListener("click", function() { moveMobileCategory(1); });

    container.querySelectorAll(".input-mode-btn").forEach(btn => btn.addEventListener("click", onModeChange));
    container.querySelectorAll(".num-input").forEach(inp => inp.addEventListener("change", onNumChange));
    container.querySelectorAll(".range-input").forEach(inp => {
      inp.addEventListener("input", onRangeInput);
      inp.addEventListener("change", onRangeChange);
    });
    container.querySelectorAll(".notes-input").forEach(inp => inp.addEventListener("input", onNotesChange));
    container.querySelectorAll(".add-note-btn").forEach(function(button) {
      button.addEventListener("click", function() {
        const cell = this.closest(".col-notes");
        cell.classList.remove("notes-empty");
        const input = cell.querySelector(".notes-input");
        if (input) input.focus();
      });
    });
    container.querySelectorAll(".cell-input.cell-cat, .cell-input.cell-sub").forEach(inp => inp.addEventListener("input", onCellTextChange));
    container.querySelectorAll(".cell-input.cell-cat").forEach(inp => inp.addEventListener("change", function() {
      renderWorksheet();
      renderStats();
    }));
    container.querySelectorAll(".del-btn").forEach(btn => btn.addEventListener("click", onDelete));

    container.querySelectorAll("[data-select-row]").forEach(function(button) {
      button.addEventListener("click", function(e) {
        const idx = +this.dataset.selectRow;
        if (e.shiftKey && lastClickedRowIdx !== null) {
          const lo = Math.min(lastClickedRowIdx, idx);
          const hi = Math.max(lastClickedRowIdx, idx);
          for (let i = lo; i <= hi; i++) selectedRows.add(i);
        } else if (e.ctrlKey || e.metaKey) {
          if (selectedRows.has(idx)) selectedRows.delete(idx); else selectedRows.add(idx);
        } else {
          // Plain click: toggle just this row, clear others
          const wasOnly = selectedRows.size === 1 && selectedRows.has(idx);
          selectedRows.clear();
          if (!wasOnly) selectedRows.add(idx);
        }
        lastClickedRowIdx = idx;
        renderSelection();
      });
    });
    initRowReordering(container);

    // Bulk-bar handlers
    const bdel = document.getElementById("bulkDelete");
    const bdes = document.getElementById("bulkDeselect");
    const bup = document.getElementById("bulkMoveUp");
    const bdown = document.getElementById("bulkMoveDown");
    if (bdel) bdel.addEventListener("click", bulkDeleteSelected);
    if (bdes) bdes.addEventListener("click", function() { selectedRows.clear(); renderSelection(); });
    if (bup) bup.addEventListener("click", function() { moveSelectedRows(-1); });
    if (bdown) bdown.addEventListener("click", function() { moveSelectedRows(1); });

    renderSelection();
    applyMobileCategoryFilter();
  }

  function applyMobileCategoryFilter() {
    document.querySelectorAll("#auditBody tr").forEach(function(tr) {
      const hidden = mobileCategory && mobileCategory !== "all" && tr.dataset.category !== mobileCategory;
      tr.classList.toggle("mobile-category-hidden", hidden);
    });
  }

  function announceReorder(message) {
    const live = document.getElementById("reorderLive");
    if (live) live.textContent = message;
  }

  function visibleReorderHandle(index, kind) {
    return Array.from(document.querySelectorAll('[data-reorder-row="' + index + '"][data-reorder-kind="' + kind + '"]'))
      .find(function(handle) { return handle.getClientRects().length; }) || null;
  }

  function reorderLabel(row, kind) {
    return kind === "category" ? row.category : (row.sub || "subcategory");
  }

  function reorderPosition(row, kind) {
    if (kind === "category") {
      const categories = Array.from(new Set(rows.map(function(item) { return item.category; })));
      return { position: categories.indexOf(row.category) + 1, count: categories.length };
    }
    const siblings = rows.filter(function(item) { return item.category === row.category; });
    return { position: siblings.indexOf(row) + 1, count: siblings.length };
  }

  function categoryRange(index) {
    const category = rows[index] && rows[index].category;
    let start = index;
    let end = index;
    while (start > 0 && rows[start - 1].category === category) start--;
    while (end + 1 < rows.length && rows[end + 1].category === category) end++;
    return { start: start, end: end, category: category };
  }

  function moveRowByDelta(index, delta, kind) {
    if (!rows[index] || !delta) return index;
    const range = categoryRange(index);
    if (kind === "category") {
      const groups = [];
      for (let i = 0; i < rows.length;) {
        const current = categoryRange(i);
        groups.push(rows.slice(current.start, current.end + 1));
        i = current.end + 1;
      }
      const groupIndex = groups.findIndex(function(group) { return group.includes(rows[index]); });
      const nextGroupIndex = Math.max(0, Math.min(groups.length - 1, groupIndex + delta));
      if (nextGroupIndex === groupIndex) return index;
      const movedGroup = groups.splice(groupIndex, 1)[0];
      groups.splice(nextGroupIndex, 0, movedGroup);
      rows = groups.flat();
      currentProfile().rows = rows;
      return rows.indexOf(movedGroup[0]);
    }
    const target = index + delta;
    if (target < range.start || target > range.end) return index;
    const moved = rows[index];
    rows.splice(index, 1);
    rows.splice(target, 0, moved);
    return rows.indexOf(moved);
  }

  function moveRowTo(sourceIndex, targetIndex, kind) {
    if (!rows[sourceIndex] || !rows[targetIndex] || sourceIndex === targetIndex) return sourceIndex;
    const sourceRange = categoryRange(sourceIndex);
    const targetRange = categoryRange(targetIndex);
    if (kind === "category") {
      const groups = [];
      for (let i = 0; i < rows.length;) {
        const current = categoryRange(i);
        groups.push(rows.slice(current.start, current.end + 1));
        i = current.end + 1;
      }
      const movedGroupIndex = groups.findIndex(function(group) { return group.includes(rows[sourceIndex]); });
      const targetGroupIndex = groups.findIndex(function(group) { return group.includes(rows[targetIndex]); });
      const movedGroup = groups.splice(movedGroupIndex, 1)[0];
      groups.splice(targetGroupIndex, 0, movedGroup);
      rows = groups.flat();
      currentProfile().rows = rows;
      return rows.indexOf(movedGroup[0]);
    }
    if (sourceRange.category !== targetRange.category) return sourceIndex;
    const moved = rows[sourceIndex];
    rows.splice(sourceIndex, 1);
    rows.splice(targetIndex, 0, moved);
    return rows.indexOf(moved);
  }

  function finishReorder(row, kind, message) {
    selectedRows.clear();
    lastClickedRowIdx = null;
    saveState();
    renderWorksheet();
    renderStats();
    const nextIndex = rows.indexOf(row);
    requestAnimationFrame(function() {
      const handle = visibleReorderHandle(nextIndex, kind);
      if (handle) handle.focus();
      const position = reorderPosition(row, kind);
      announceReorder(message || ("Moved " + reorderLabel(row, kind) + " to position " + position.position + " of " + position.count + "."));
    });
  }

  function moveSelectedRows(delta) {
    if (selectedRows.size !== 1) return;
    const index = Array.from(selectedRows)[0];
    const row = rows[index];
    const kind = index === categoryRange(index).start ? "category" : "subcategory";
    const nextIndex = moveRowByDelta(index, delta, kind);
    if (nextIndex === index) {
      announceReorder("This row is already at the edge of its group.");
      return;
    }
    selectedRows = new Set([nextIndex]);
    saveState();
    renderWorksheet();
    renderStats();
    requestAnimationFrame(function() {
      const handle = visibleReorderHandle(nextIndex, kind);
      if (handle) handle.focus();
      const position = reorderPosition(row, kind);
      announceReorder("Moved " + reorderLabel(row, kind) + " to position " + position.position + " of " + position.count + ".");
    });
  }

  function initRowReordering(container) {
    container.querySelectorAll("[data-reorder-row]").forEach(function(handle) {
      let pointerDrag = null;
      handle.addEventListener("pointerdown", function(event) {
        if (event.pointerType === "mouse") return;
        pointerDrag = {
          pointerId: event.pointerId,
          row: rows[+this.dataset.reorderRow],
          kind: this.dataset.reorderKind,
          startX: event.clientX,
          startY: event.clientY,
          target: this
        };
        this.setPointerCapture(event.pointerId);
      });
      handle.addEventListener("pointermove", function(event) {
        if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
        const distance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);
        if (distance < 8) return;
        event.preventDefault();
        const targetRow = document.elementFromPoint(event.clientX, event.clientY)?.closest('tr[data-idx]');
        const target = targetRow?.querySelector('[data-reorder-kind="' + pointerDrag.kind + '"]');
        if (target) pointerDrag.target = target;
      });
      handle.addEventListener("pointerup", function(event) {
        if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
        const state = pointerDrag;
        pointerDrag = null;
        const sourceIndex = rows.indexOf(state.row);
        const targetIndex = +(state.target?.dataset.reorderRow ?? sourceIndex);
        const nextIndex = moveRowTo(sourceIndex, targetIndex, state.kind);
        if (nextIndex !== sourceIndex) {
          finishReorder(state.row, state.kind);
        }
      });
      handle.addEventListener("pointercancel", function() { pointerDrag = null; });
      handle.addEventListener("dragstart", function(event) {
        const index = +this.dataset.reorderRow;
        dragSourceRow = { row: rows[index], kind: this.dataset.reorderKind };
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      });
      handle.addEventListener("dragover", function(event) {
        if (!dragSourceRow) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      });
      handle.addEventListener("drop", function(event) {
        event.preventDefault();
        event.stopPropagation();
        const sourceIndex = rows.indexOf(dragSourceRow.row);
        const targetIndex = +this.dataset.reorderRow;
        const row = dragSourceRow.row;
        const kind = dragSourceRow.kind;
        const targetKind = this.dataset.reorderKind;
        if (kind !== targetKind) {
          dragSourceRow = null;
          announceReorder("Choose another " + kind + " handle as the drop target.");
          return;
        }
        const nextIndex = moveRowTo(sourceIndex, targetIndex, kind);
        dragSourceRow = null;
        if (nextIndex !== sourceIndex) finishReorder(row, kind);
        else announceReorder("That row can only move within its category.");
      });
      handle.addEventListener("dragend", function() { dragSourceRow = null; });
      handle.addEventListener("keydown", function(event) {
        const index = +this.dataset.reorderRow;
        const row = rows[index];
        const kind = this.dataset.reorderKind;
        if ((event.key === "Enter" || event.key === " ") && !grabbedRow) {
          event.preventDefault();
          grabbedRow = row;
          grabbedKind = kind;
          grabOriginalRows = rows.slice();
          this.setAttribute("aria-grabbed", "true");
          announceReorder("Grabbed " + reorderLabel(row, kind) + ". Use up and down arrows to move, Enter to drop, or Escape to cancel.");
          return;
        }
        if (grabbedRow !== row || grabbedKind !== kind) return;
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          const nextIndex = moveRowByDelta(index, event.key === "ArrowUp" ? -1 : 1, kind);
          saveState();
          renderWorksheet();
          renderStats();
          requestAnimationFrame(function() {
            const nextHandle = visibleReorderHandle(nextIndex, kind);
            if (nextHandle) {
              nextHandle.setAttribute("aria-grabbed", "true");
              nextHandle.focus();
            }
            const position = reorderPosition(row, kind);
            announceReorder("Moved " + reorderLabel(row, kind) + " to position " + position.position + " of " + position.count + ".");
          });
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          grabbedRow = null;
          grabbedKind = null;
          grabOriginalRows = null;
          this.setAttribute("aria-grabbed", "false");
          const position = reorderPosition(row, kind);
          announceReorder("Dropped " + reorderLabel(row, kind) + " at position " + position.position + " of " + position.count + ".");
        } else if (event.key === "Escape") {
          event.preventDefault();
          rows = grabOriginalRows.slice();
          currentProfile().rows = rows;
          const restoredIndex = rows.indexOf(row);
          grabbedRow = null;
          grabbedKind = null;
          grabOriginalRows = null;
          saveState();
          renderWorksheet();
          renderStats();
          requestAnimationFrame(function() {
            const restoredHandle = visibleReorderHandle(restoredIndex, kind);
            if (restoredHandle) restoredHandle.focus();
            announceReorder("Reordering cancelled.");
          });
        }
      });
    });
    const body = container.querySelector("#auditBody");
    body.addEventListener("dragover", function(event) {
      if (!dragSourceRow) return;
      const target = event.target.closest("tr[data-idx]");
      if (!target) return;
      event.preventDefault();
      body.querySelectorAll(".reorder-drop-target").forEach(function(row) { row.classList.remove("reorder-drop-target"); });
      target.classList.add("reorder-drop-target");
    });
    body.addEventListener("dragleave", function(event) {
      const target = event.target.closest("tr[data-idx]");
      if (target) target.classList.remove("reorder-drop-target");
    });
    body.addEventListener("drop", function(event) {
      if (!dragSourceRow) return;
      event.preventDefault();
      const target = event.target.closest("tr[data-idx]");
      body.querySelectorAll(".reorder-drop-target").forEach(function(row) { row.classList.remove("reorder-drop-target"); });
      if (!target) return;
      const sourceIndex = rows.indexOf(dragSourceRow.row);
      const targetIndex = +target.dataset.idx;
      const row = dragSourceRow.row;
      const kind = dragSourceRow.kind;
      dragSourceRow = null;
      const nextIndex = moveRowTo(sourceIndex, targetIndex, kind);
      if (nextIndex !== sourceIndex) finishReorder(row, kind);
      else announceReorder(kind === "subcategory" ? "Subcategories stay within their category." : "That category is already in this position.");
    });
  }

  function renderSelection() {
    document.querySelectorAll("#auditBody tr").forEach(tr => {
      const idx = +tr.dataset.idx;
      tr.classList.toggle("selected", selectedRows.has(idx));
      tr.querySelectorAll("[data-select-row]").forEach(function(button) {
        button.setAttribute("aria-pressed", selectedRows.has(idx) ? "true" : "false");
      });
    });
    const bar = document.getElementById("bulkBar");
    const count = document.getElementById("bulkBarCount");
    if (!bar || !count) return;
    if (selectedRows.size > 0) {
      bar.classList.add("visible");
      count.innerHTML = '<strong>' + selectedRows.size + '</strong> row' + (selectedRows.size === 1 ? '' : 's') + ' selected';
      const moveDisabled = selectedRows.size !== 1;
      const up = document.getElementById("bulkMoveUp");
      const down = document.getElementById("bulkMoveDown");
      if (up) up.disabled = moveDisabled;
      if (down) down.disabled = moveDisabled;
    } else {
      bar.classList.remove("visible");
    }
  }

  function bulkDeleteSelected() {
    if (selectedRows.size === 0) return;
    const count = selectedRows.size;
    undoStack = { rows: rows.slice() };
    const keep = rows.filter((_, i) => !selectedRows.has(i));
    rows = keep;
    selectedRows.clear();
    lastClickedRowIdx = null;
    saveState();
    renderWorksheet();
    renderStats();
    showToast("Removed " + count + " row" + (count === 1 ? '' : 's'), true);
  }

  document.addEventListener("pointerdown", function(event) {
    if (!selectedRows.size) return;
    if (event.target.closest("[data-select-row], #bulkBar")) return;
    const row = event.target.closest("#auditBody tr");
    if (row && selectedRows.has(+row.dataset.idx)) return;
    selectedRows.clear();
    lastClickedRowIdx = null;
    renderSelection();
  });

  function valueCell(row, i, field) {
    const v = row[field];
    const numericValue = v === "" || v === null || v === undefined ? "" : v;
    const rowMax = sliderMaxFor(row);
    if (inputMode === "sliders") {
      const raw = numericValue === "" ? 0 : +numericValue;
      const sv = Math.min(raw, rowMax); // clamp visible slider position to max
      const fill = (sv / rowMax * 100).toFixed(1);
      const overMax = raw > rowMax;
      const displayed = numericValue === "" ? "0" : fmtH(raw);
      return '<div class="range-cell' + (overMax ? ' over-max' : '') + '" data-row-max="' + rowMax + '">' +
        '<input type="range" class="range-input range-' + field + '" data-field="' + field + '" data-idx="' + i + '" data-row-max="' + rowMax + '" min="0" max="' + rowMax + '" step="0.25" value="' + sv + '" style="--fill:' + fill + '%" aria-valuetext="' + displayed + ' hours" aria-label="' + field + ' hours' + (overMax ? ' (currently ' + raw + 'h, slider capped at ' + rowMax + 'h — switch to Numbers mode to set higher)' : '') + '">' +
        '<span class="range-val" data-val-for="' + field + '-' + i + '" title="Max for this row: ' + rowMax + 'h' + (overMax ? '. Current value (' + raw + 'h) exceeds it — switch to Numbers mode to keep changing.' : '') + '">' + displayed + 'h</span>' +
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
    // User actively dragging clears the over-max state (they're setting a new value <= max).
    inp.parentElement.classList.remove("over-max");
    inp.setAttribute("aria-valuetext", fmtH(v) + " hours");
    rows[idx][field] = v === 0 ? "" : v;
    renderStats();
    updateWorksheetDistribution();
  }

  function onRangeChange() {
    saveState();
  }

  function onCellTextChange(e) {
    const idx = +e.target.dataset.idx;
    const field = e.target.dataset.field;
    if (field === "category") {
      const previous = rows[idx].category;
      const next = e.target.value;
      if (mobileCategory === previous) mobileCategory = next;
      const categories = Array.from(new Set(rows.map(function(row) { return row.category === previous ? next : row.category; })));
      rows.forEach(function(row, rowIndex) {
        if (row.category !== previous) return;
        row.category = next;
        const renderedRow = document.querySelector('#auditBody tr[data-idx="' + rowIndex + '"]');
        if (renderedRow) {
          renderedRow.dataset.category = next;
          renderedRow.style.setProperty("--category-color", colorFor(next, categories));
          renderedRow.querySelectorAll(".cell-cat").forEach(function(input) {
            if (input !== e.target) input.value = next;
          });
        }
      });
      e.target.style.setProperty("--field-width", Math.min(24, Math.max(5, next.length + 2)) + "ch");
      saveState();
      renderStats();
      return;
    }
    rows[idx][field] = e.target.value;
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
    updateWorksheetDistribution();
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

  async function resetToDefaults() {
    const approved = await openAppDialog({
      title: "Reset “" + currentProfile().name + "”?",
      body: "Its planning rows will return to the defaults. Reflection answers will stay.",
      confirmLabel: "Reset schedule",
      danger: true
    });
    if (!approved) return;
    rows = freshRows();
    saveState();
    renderWorksheet();
    renderStats();
  }

  // ------ Compare ------
  // Pleasant palette for category slices, dark-mode tuned.
  const SLICE_COLORS = ["#7A9CFF", "#D2AD79", "#6FBF7E", "#FF9B6B", "#C28BE0", "#5FBEA6", "#E07A97", "#9DB07A", "#F2C56B", "#86C4E0"];
  function colorFor(cat, cats) {
    let hash = 0;
    const value = String(cat || "");
    for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    return SLICE_COLORS[Math.abs(hash) % SLICE_COLORS.length];
  }
  function buildDonut(byCat, cats, label, totalH) {
    const r = 64, c = 80, stroke = 18;
    const circ = 2 * Math.PI * r;
    const sum = cats.reduce((a, k) => a + byCat[k], 0);
    let offset = 0;
    let segments = "";
    cats.forEach(cat => {
      const v = byCat[cat];
      if (v <= 0) return;
      const frac = v / TARGET;
      const len = Math.max(0, Math.min(circ, frac * circ));
      segments += '<circle cx="' + c + '" cy="' + c + '" r="' + r +
        '" fill="none" stroke="' + colorFor(cat, cats) + '" stroke-width="' + stroke +
        '" stroke-dasharray="' + len.toFixed(2) + ' ' + (circ - len).toFixed(2) +
        '" stroke-dashoffset="' + (-offset).toFixed(2) + '" transform="rotate(-90 ' + c + ' ' + c + ')">' +
        '<title>' + escHtml(cat) + ': ' + fmtH(v) + 'h</title></circle>';
      offset += len;
    });
    const unalloc = Math.max(0, TARGET - sum);
    if (unalloc > 0 && sum > 0) {
      const len = unalloc / TARGET * circ;
      segments += '<circle cx="' + c + '" cy="' + c + '" r="' + r +
        '" fill="none" stroke="var(--paper-soft)" stroke-width="' + stroke +
        '" stroke-dasharray="' + len.toFixed(2) + ' ' + (circ - len).toFixed(2) +
        '" stroke-dashoffset="' + (-offset).toFixed(2) + '" transform="rotate(-90 ' + c + ' ' + c + ')" opacity="0.5">' +
        '<title>Unallocated: ' + fmtH(unalloc) + 'h</title></circle>';
    }
    if (sum === 0) {
      // Empty-state ring
      segments += '<circle cx="' + c + '" cy="' + c + '" r="' + r +
        '" fill="none" stroke="var(--rule)" stroke-width="' + stroke + '" stroke-dasharray="3 6" opacity="0.6"></circle>';
    }
    const center = '<text x="' + c + '" y="' + (c - 2) + '" text-anchor="middle" class="donut-num">' + fmtH(totalH) + '</text>' +
      '<text x="' + c + '" y="' + (c + 14) + '" text-anchor="middle" class="donut-unit">of ' + TARGET + 'h</text>';
    return '<div class="donut-wrap">' +
      '<svg viewBox="0 0 ' + (c * 2) + ' ' + (c * 2) + '" class="donut" aria-label="' + label + ' breakdown donut">' + segments + center + '</svg>' +
      '<p class="donut-label">' + label + '</p>' +
      '</div>';
  }
  function buildLegend(cats, byCat) {
    if (!cats.length) return '';
    let html = '<ul class="legend">';
    cats.forEach(cat => {
      html += '<li><span class="legend-swatch" style="background:' + colorFor(cat, cats) + '"></span>' +
        '<span class="legend-name">' + escHtml(cat) + '</span>' +
        '<span class="legend-val">' + fmtH(byCat[cat]) + 'h</span></li>';
    });
    return html + '</ul>';
  }
  function buildInsights(byIdeal, byActual, cats) {
    const sumI = cats.reduce((a, c) => a + byIdeal[c], 0);
    const sumA = cats.reduce((a, c) => a + byActual[c], 0);
    if (sumI === 0 && sumA === 0) {
      return '<p class="insights-line">Start by filling in your <strong>ideal</strong> week — type hours per row in the worksheet, then come back here.</p>';
    }
    const out = [];
    // Ideal commentary
    if (sumI > 0) {
      if (sumI > TARGET + 0.5) out.push("Your ideal week is " + fmtH(sumI - TARGET) + "h <strong>over</strong> the 168 target — something has to give.");
      else if (sumI < TARGET - 0.5) out.push("Your ideal week is " + fmtH(TARGET - sumI) + "h <strong>under</strong> 168 — room to be more ambitious.");
      else out.push("Your ideal week is <strong>balanced</strong> at 168h.");
    }
    // Actual commentary
    if (sumA > 0) {
      if (sumA > TARGET + 0.5) out.push("Your actual week ran " + fmtH(sumA - TARGET) + "h over.");
      else if (sumA < TARGET - 0.5) out.push("Your actual week ran " + fmtH(TARGET - sumA) + "h under — what's filling the unaccounted hours?");
    }
    // Biggest delta (if both sides have data)
    if (sumI > 0 && sumA > 0) {
      let bigCat = null, bigDelta = 0;
      cats.forEach(c => {
        const d = byActual[c] - byIdeal[c];
        if (Math.abs(d) > Math.abs(bigDelta)) { bigDelta = d; bigCat = c; }
      });
      if (bigCat && Math.abs(bigDelta) >= 1) {
        const dir = bigDelta > 0 ? "more time on" : "less time on";
        out.push("Biggest divergence: you lived " + fmtH(Math.abs(bigDelta)) + "h " + dir + " <strong>" + escHtml(bigCat) + "</strong> than you planned.");
      }
    }
    // Quiet inflow: identify a high-actual category not in top-3 ideals
    if (sumA > 0) {
      const sorted = cats.slice().sort((a, b) => byActual[b] - byActual[a]);
      const topActualCat = sorted[0];
      if (topActualCat && byActual[topActualCat] > 0) {
        const idealRank = cats.slice().sort((a, b) => byIdeal[b] - byIdeal[a]).indexOf(topActualCat);
        if (idealRank > 2 && byActual[topActualCat] >= 6) {
          out.push("<strong>" + escHtml(topActualCat) + "</strong> ate " + fmtH(byActual[topActualCat]) + "h — that's bigger than you planned for.");
        }
      }
    }
    return out.map(s => '<p class="insights-line">' + s + '</p>').join("");
  }

  function renderCompare() {
    const container = views.compare;

    const cats = [...new Set(rows.map(r => r.category))];
    const byIdeal = {};
    const byActual = {};
    cats.forEach(c => { byIdeal[c] = 0; byActual[c] = 0; });
    rows.forEach(r => { byIdeal[r.category] += num(r.ideal); byActual[r.category] += num(r.actual); });

    const maxVal = Math.max(TARGET, ...cats.map(c => Math.max(byIdeal[c], byActual[c])), 1);
    const sumI = cats.reduce((a, c) => a + byIdeal[c], 0);
    const sumA = cats.reduce((a, c) => a + byActual[c], 0);

    // biggest gap
    let biggestCat = null, biggestDelta = 0;
    cats.forEach(c => {
      const d = Math.abs(byIdeal[c] - byActual[c]);
      if (d > biggestDelta) { biggestDelta = d; biggestCat = c; }
    });

    const rankedCats = cats.slice().sort(function(a, b) {
      return Math.abs(byActual[b] - byIdeal[b]) - Math.abs(byActual[a] - byIdeal[a]);
    });
    const meaningfulCats = rankedCats.filter(function(c) {
      return Math.abs(byActual[c] - byIdeal[c]) >= 0.25 || byIdeal[c] > 0 || byActual[c] > 0;
    });
    const initialCats = meaningfulCats.slice(0, 5);
    let html = '<header class="compare-header"><div><h2>Where your week diverged</h2></div>' +
      '<div class="compare-total"><span>Ideal ' + fmtH(sumI) + 'h</span><span>Actual ' + fmtH(sumA) + 'h</span></div></header>';

    if (sumI === 0 && sumA === 0) {
      container.innerHTML = html + '<div class="compare-empty"><h3>Your comparison will appear here</h3>' +
        '<p>Add hours to your ideal or actual week, then return to see the largest gaps first.</p>' +
        '<button type="button" class="btn btn-primary" id="emptyToPlan">Start with ideal week</button></div>';
      document.getElementById("emptyToPlan").addEventListener("click", function() {
        planStage = "ideal";
        activateView(document.querySelector('.view-tab[data-view="worksheet"]'), false);
        renderWorksheet();
      });
      return;
    }

    html += '<table class="delta-table delta-table-ranked">' +
      '<thead><tr><th>Category</th><th>Ideal</th><th>Actual</th><th>Delta</th><th></th></tr></thead><tbody>';
    rankedCats.forEach((c, index) => {
      const diff = byActual[c] - byIdeal[c];
      const absDiff = Math.abs(diff);
      let deltaClass = "delta-muted";
      if (absDiff >= 4) deltaClass = "delta-urgent";
      else if (absDiff >= 1) deltaClass = "delta-warn";
      const signedDiff = (diff >= 0 ? "+" : "") + fmtH(diff) + "h";
      html += '<tr' + (initialCats.indexOf(c) < 0 ? ' class="minor-gap" hidden' : '') + '><td>' + escHtml(c) + '</td>' +
        '<td>' + fmtH(byIdeal[c]) + 'h</td>' +
        '<td>' + fmtH(byActual[c]) + 'h</td>' +
        '<td class="' + deltaClass + '">' + signedDiff + '</td>' +
        '<td><button type="button" class="edit-gap" data-category="' + escAttr(c) + '">Edit</button></td></tr>';
    });
    html += '</tbody></table>';
    if (rankedCats.length > initialCats.length) {
      html += '<button type="button" class="btn btn-quiet compare-show-all" id="showAllGaps">Show all ' + rankedCats.length + ' categories</button>';
    }
    html += '<div class="center-actions" style="margin-top:1rem"><button type="button" class="btn btn-primary" id="compareToReflect">Reflect on these gaps</button></div>';
    html += '<details class="compare-details"><summary>View distribution charts</summary><div class="donut-row">' +
      buildDonut(byIdeal, cats, "Ideal", sumI) +
      buildDonut(byActual, cats, "Actual", sumA) +
      '<div class="donut-legend"><p class="legend-eyebrow">Categories</p>' + buildLegend(cats, byIdeal) + '</div>' +
      '</div></details>';

    container.innerHTML = html;
    const showAll = document.getElementById("showAllGaps");
    if (showAll) showAll.addEventListener("click", function() {
      container.querySelectorAll(".minor-gap").forEach(function(row) { row.hidden = false; });
      this.remove();
    });
    document.getElementById("compareToReflect").addEventListener("click", function() {
      activateView(document.querySelector('.view-tab[data-view="reflect"]'), true);
    });
    container.querySelectorAll(".edit-gap").forEach(function(btn) {
      btn.addEventListener("click", function() {
        mobileCategory = this.dataset.category;
        planStage = "both";
        try { localStorage.setItem("168-audit:plan-stage", "both"); } catch(e) {}
        activateView(document.querySelector('.view-tab[data-view="worksheet"]'), false);
        renderWorksheet();
        const row = document.querySelector('#auditBody tr[data-category="' + CSS.escape(mobileCategory) + '"]');
        if (row) {
          row.scrollIntoView({ block: "center" });
          const input = row.querySelector(".num-input");
          if (input) input.focus();
        }
      });
    });
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

    const visiblePrompts = GUIDED_REFLECTION_PROMPTS;
    let reflectStep = 0;
    try { reflectStep = Math.max(0, Math.min(visiblePrompts.length - 1, +(localStorage.getItem("168-audit:reflect-step") || 0))); } catch(e) {}

    let html = '<header class="reflect-header"><div><h2>Turn the gaps into one experiment</h2></div>' +
      '<span class="reflect-progress">' + (reflectStep + 1) + ' of ' + visiblePrompts.length + '</span></header>';

    if (reflectStep > 0) {
      html += '<details class="reflect-prior"><summary>Earlier answers</summary>';
      visiblePrompts.slice(0, reflectStep).forEach(function(promptText) {
        const answer = getReflection(promptText).trim();
        html += '<div class="prompt-card"><p class="prompt-text">' + md(promptText) + '</p><p>' +
          (answer ? escHtml(answer) : '<span class="muted">No answer yet</span>') + '</p></div>';
      });
      html += '</details>';
    }
    html += '<div class="reflect-section reflect-guided"><p class="reflect-section-title">' +
      (reflectStep === visiblePrompts.length - 1 ? "Your next experiment" : "Reflection") + '</p>' +
      promptBlock(visiblePrompts[reflectStep], "guided-" + reflectStep) +
      '<div class="reflect-nav"><button type="button" class="btn btn-quiet" id="reflectBack"' +
      (reflectStep === 0 ? ' disabled' : '') + '>Back</button><button type="button" class="btn btn-primary" id="reflectNext">' +
      (reflectStep === visiblePrompts.length - 1 ? "Review from start" : "Next") + '</button></div></div>';
    const legacyEntries = Object.entries(currentProfile().reflections || {}).filter(function(entry) {
      return GUIDED_REFLECTION_PROMPTS.indexOf(entry[0]) < 0 && String(entry[1] || "").trim();
    });
    if (legacyEntries.length) {
      html += '<details class="reflect-legacy"><summary>Earlier reflections (' + legacyEntries.length + ')</summary>';
      legacyEntries.forEach(function(entry) {
        html += '<div class="prompt-card"><p class="prompt-text">' + md(entry[0]) + '</p><p>' + escHtml(String(entry[1])) + '</p></div>';
      });
      html += '</details>';
    }
    html += '<details class="reference-section"><summary class="reference-section-title">Recommended categories</summary><div class="reference-grid">';
    REFERENCE.forEach(function(ref) {
      html += '<div class="reference-card"><div class="reference-card-head"><span class="reference-card-glyph">' + ref.glyph + '</span>' +
        escHtml(ref.group) + '</div><ul>';
      ref.bullets.forEach(function(bullet) { html += '<li>' + escHtml(bullet) + '</li>'; });
      html += '</ul></div>';
    });
    html += '</div></details>';

    container.innerHTML = html;

    container.querySelectorAll(".reflect-answer").forEach(ta => {
      autoResize(ta);
      ta.addEventListener("input", function() {
        setReflection(this.dataset.prompt, this.value);
        autoResize(this);
        const progress = container.querySelector(".reflect-progress");
        if (progress) progress.textContent = (reflectStep + 1) + " of " + visiblePrompts.length;
      });
    });
    document.getElementById("reflectBack").addEventListener("click", function() {
      try { localStorage.setItem("168-audit:reflect-step", String(Math.max(0, reflectStep - 1))); } catch(e) {}
      renderReflect();
    });
    document.getElementById("reflectNext").addEventListener("click", function() {
      const next = reflectStep === visiblePrompts.length - 1 ? 0 : reflectStep + 1;
      try { localStorage.setItem("168-audit:reflect-step", String(next)); } catch(e) {}
      renderReflect();
      const answer = container.querySelector(".reflect-answer");
      if (answer) answer.focus();
    });
  }

  function autoResize(ta) {
    ta.style.height = "auto";
    ta.style.height = (ta.scrollHeight + 2) + "px";
  }

  // ------ History ------
  function renderHistory(diffState) {
    const v = document.getElementById("view-history");
    const snaps = getSnapshotsForProfile(state.activeProfile);

    if (diffState) {
      v.innerHTML = renderDiffHTML(diffState.a, diffState.b);
      const backBtn = document.getElementById("snapDiffBack");
      if (backBtn) backBtn.addEventListener("click", () => renderHistory(null));
      return;
    }

    if (!snaps.length) {
      v.innerHTML =
        '<div class="history-empty">' +
          '<div class="history-empty-icon"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M4 5.5h12v10H4zM6.5 3.5h7v2M7 9h6m-6 3h4"/></svg></div>' +
          '<h2 class="history-empty-title">No snapshots yet</h2>' +
          '<p class="history-empty-body">Create snapshots from Plan, then return here to review or compare them.</p>' +
          '<button class="btn btn-primary" id="historyGoPlan" type="button">Go to Plan</button>' +
        '</div>';
      document.getElementById("historyGoPlan").addEventListener("click", function() {
        activateView(document.querySelector('.view-tab[data-view="worksheet"]'), false);
        const snapshotButton = document.getElementById("snapshotBtn");
        if (snapshotButton) snapshotButton.focus();
      });
      return;
    }

    let html =
      '<div class="history-toolbar">' +
        '<button class="btn btn-secondary" id="historyCompareStart" type="button">' + (historySelecting ? "Cancel comparison" : "Compare weeks") + '</button>' +
        '<span class="history-diff-sub">' + snaps.length + ' snapshot' + (snaps.length === 1 ? "" : "s") + '</span>' +
      '</div>' +
      '<div class="snap-list">';

    snaps.slice().reverse().forEach(function(s) {
      const total = s.rows.reduce(function(sum, r) {
        const h = r.actual !== undefined ? r.actual : (r.hours !== undefined ? r.hours : 0);
        return sum + (parseFloat(h) || 0);
      }, 0);
      const date = new Date(s.takenAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      const options =
        '<option value="">Compare with…</option>' +
        '<option value="__current__">Current week</option>' +
        snaps.filter(function(o) { return o.id !== s.id; }).map(function(o) {
          return '<option value="' + escAttr(o.id) + '">' + escHtml(o.label) + '</option>';
        }).join("");
      html +=
        '<div class="snap-row" data-snap-id="' + escAttr(s.id) + '">' +
          '<div class="snap-row-info">' +
            '<div class="snap-label">' + escHtml(s.label) + '</div>' +
            '<div class="snap-meta">' + date + ' \xb7 ' + total.toFixed(1) + 'h actual</div>' +
            '<div class="snap-commitment">Experiment: ' + (s.commitment ? escHtml(s.commitment) : "not recorded") + '</div>' +
          '</div>' +
          '<div class="snap-compare-wrap">' +
            '<select class="snap-compare-select" data-from="' + escAttr(s.id) + '">' + options + '</select>' +
          '</div>' +
          '<button class="snap-del-btn" type="button" data-del="' + escAttr(s.id) + '" aria-label="Delete snapshot">✕</button>' +
        '</div>';
    });
    html += '</div>';
    v.innerHTML = html;
    v.classList.toggle("history-compare-mode", historySelecting);

    document.getElementById("historyCompareStart").addEventListener("click", function() {
      historySelecting = !historySelecting;
      renderHistory(null);
    });
    v.querySelectorAll(".snap-compare-select").forEach(function(sel) {
      sel.addEventListener("change", function() {
        if (!sel.value) return;
        const fromId = sel.dataset.from;
        const toId = sel.value;
        const a = snaps.find(function(s) { return s.id === fromId; });
        const b = toId === "__current__"
          ? { id: "__current__", label: "Current week", rows: rows.map(function(r) { return { id: r.id, ideal: r.ideal, actual: r.actual, sub: r.sub, category: r.category }; }) }
          : snaps.find(function(s) { return s.id === toId; });
        historySelecting = false;
        renderHistory({ a: a, b: b });
      });
    });
    v.querySelectorAll("[data-del]").forEach(function(btn) {
      btn.addEventListener("click", async function() {
        const snapshot = snaps.find(function(item) { return item.id === btn.dataset.del; });
        const approved = await openAppDialog({
          title: "Delete “" + (snapshot ? snapshot.label : "snapshot") + "”?",
          body: "This removes the snapshot from this schedule.",
          confirmLabel: "Delete snapshot",
          danger: true
        });
        if (!approved) return;
        deleteSnapshot(btn.dataset.del);
        renderHistory(null);
      });
    });
  }

  function snapRowHours(row) {
    // Snapshots may store ideal+actual or just hours. Use actual if available, else ideal, else hours.
    if (row.actual !== undefined && row.actual !== "") return parseFloat(row.actual) || 0;
    if (row.ideal !== undefined && row.ideal !== "") return parseFloat(row.ideal) || 0;
    if (row.hours !== undefined) return parseFloat(row.hours) || 0;
    return 0;
  }

  function renderDiffHTML(a, b) {
    // Build union of row ids
    const aMap = {};
    a.rows.forEach(function(r) { aMap[r.id] = r; });
    const bMap = {};
    b.rows.forEach(function(r) { bMap[r.id] = r; });
    const allIds = [];
    const seen = {};
    a.rows.forEach(function(r) { if (!seen[r.id]) { seen[r.id] = true; allIds.push(r.id); } });
    b.rows.forEach(function(r) { if (!seen[r.id]) { seen[r.id] = true; allIds.push(r.id); } });

    // Also build a label lookup from current rows for fallback
    const currentMap = {};
    rows.forEach(function(r) { currentMap[r.id] = r; });

    function getLabel(row) {
      if (!row) return "";
      var sub = row.sub || (currentMap[row.id] && currentMap[row.id].sub) || row.id;
      var cat = row.category || (currentMap[row.id] && currentMap[row.id].category) || "";
      return { sub: sub, cat: cat };
    }

    let totalA = 0, totalB = 0;
    let tableRows = "";

    allIds.forEach(function(id) {
      const ra = aMap[id];
      const rb = bMap[id];
      const lbl = getLabel(ra || rb);
      const ha = ra ? snapRowHours(ra) : null;
      const hb = rb ? snapRowHours(rb) : null;

      const aCell = ha !== null ? ha.toFixed(1) : "—";
      const bCell = hb !== null ? hb.toFixed(1) : "—";

      let deltaCell = "";
      let deltaClass = "snap-diff-delta zero";
      if (ha !== null && hb !== null) {
        const d = hb - ha;
        totalA += ha;
        totalB += hb;
        if (d > 0) { deltaClass = "snap-diff-delta pos"; deltaCell = "▲+" + d.toFixed(1); }
        else if (d < 0) { deltaClass = "snap-diff-delta neg"; deltaCell = "▼" + d.toFixed(1); }
        else { deltaCell = "0.0"; }
      } else if (ha !== null) {
        totalA += ha;
        deltaClass = "snap-diff-delta neg";
        deltaCell = "(removed)";
      } else if (hb !== null) {
        totalB += hb;
        deltaClass = "snap-diff-delta pos";
        deltaCell = "(added)";
      }

      const subLabel = !ra ? escHtml(lbl.sub) + ' <em>(added)</em>' : (!rb ? escHtml(lbl.sub) + ' <em>(removed)</em>' : escHtml(lbl.sub));
      const labelDisplay = '<span class="snap-diff-cat">' + escHtml(lbl.cat) + '</span> ' + subLabel;

      tableRows +=
        '<tr>' +
          '<td>' + labelDisplay + '</td>' +
          '<td class="col-num">' + aCell + '</td>' +
          '<td class="col-num">' + bCell + '</td>' +
          '<td class="' + deltaClass + '">' + deltaCell + '</td>' +
        '</tr>';
    });

    const totalDelta = totalB - totalA;
    let totalDeltaClass = "snap-diff-delta zero";
    let totalDeltaCell = "0.0";
    if (totalDelta > 0) { totalDeltaClass = "snap-diff-delta pos"; totalDeltaCell = "▲+" + totalDelta.toFixed(1); }
    else if (totalDelta < 0) { totalDeltaClass = "snap-diff-delta neg"; totalDeltaCell = "▼" + totalDelta.toFixed(1); }

    const summaryRow =
      '<tr class="snap-diff-summary">' +
        '<td><strong>Total</strong></td>' +
        '<td class="col-num"><strong>' + totalA.toFixed(1) + '</strong></td>' +
        '<td class="col-num"><strong>' + totalB.toFixed(1) + '</strong></td>' +
        '<td class="' + totalDeltaClass + '"><strong>' + totalDeltaCell + '</strong></td>' +
      '</tr>';

    return (
      '<button class="btn btn-secondary snap-diff-back" id="snapDiffBack" type="button">← Back to snapshots</button>' +
      '<div class="history-diff-header">' +
        '<h2 class="history-diff-title">' + escHtml(a.label) + ' → ' + escHtml(b.label) + '</h2>' +
        '<span class="history-diff-sub">Δ shown as hours</span>' +
      '</div>' +
      '<table class="snap-diff-table">' +
        '<thead><tr>' +
          '<th>Sub-category</th>' +
          '<th class="col-num">' + escHtml(a.label) + '</th>' +
          '<th class="col-num">' + escHtml(b.label) + '</th>' +
          '<th>Δ</th>' +
        '</tr></thead>' +
        '<tbody>' + tableRows + summaryRow + '</tbody>' +
      '</table>'
    );
  }

  async function saveSnapshotFromButton() {
    const label = await openAppDialog({
      kind: "text",
      title: "Save a snapshot",
      body: "Give this week a short label so you can recognize it later.",
      label: "Snapshot label",
      value: defaultSnapshotLabel(),
      confirmLabel: "Save snapshot"
    });
    if (!label) return;
    takeSnapshot(label);
    showToast("Snapshot saved.");
    if (activeView === "history") renderHistory(null);
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
      if (open) setTimeout(function() {
        const first = fab.querySelector('[role="menuitem"]');
        if (first) first.focus();
      }, 0);
    }
    trigger.addEventListener("click", function(e) {
      e.stopPropagation();
      setOpen(fab.dataset.open !== "true");
    });
    document.addEventListener("click", function(e) {
      if (!fab.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && fab.dataset.open === "true") {
        setOpen(false);
        trigger.focus();
      }
    });
    document.getElementById("exportMenu").addEventListener("keydown", function(e) {
      const items = Array.from(this.querySelectorAll('[role="menuitem"]'));
      const index = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && items.length) {
        e.preventDefault(); items[(index + 1 + items.length) % items.length].focus();
      } else if (e.key === "ArrowUp" && items.length) {
        e.preventDefault(); items[(index - 1 + items.length) % items.length].focus();
      } else if (e.key === "Home" && items.length) {
        e.preventDefault(); items[0].focus();
      } else if (e.key === "End" && items.length) {
        e.preventDefault(); items[items.length - 1].focus();
      }
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

  document.getElementById("importJson").addEventListener("click", function() {
    document.getElementById("importFile").click();
  });

  document.getElementById("importFile").addEventListener("change", async function() {
    const file = this.files && this.files[0];
    this.value = "";
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error("File is larger than 2 MB");
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.rows) || parsed.rows.length < 1 || parsed.rows.length > 500) {
        throw new Error("Expected a 168 Audit JSON file with 1–500 rows");
      }
      const cleanRows = parsed.rows.map(function(r, i) {
        if (!r || typeof r !== "object") throw new Error("Row " + (i + 1) + " is invalid");
        return {
          id: String(r.id || ("import-" + i + "-" + Date.now())),
          category: String(r.category || "").slice(0, 120),
          sub: String(r.sub || "").slice(0, 180),
          ideal: fmtH(num(r.ideal)),
          actual: fmtH(num(r.actual)),
          notes: String(r.notes || "").slice(0, 2000),
          sliderMax: Math.max(1, Math.min(168, num(r.sliderMax) || SLIDER_MAX_DEFAULT))
        };
      });
      if (!cleanRows.some(function(r) { return r.category || r.sub; })) throw new Error("The file has no named categories");
      const approved = await openAppDialog({
        title: "Restore this backup?",
        body: "Rows and reflections in “" + currentProfile().name + "” will be replaced.",
        confirmLabel: "Restore backup",
        danger: true
      });
      if (!approved) return;
      const cp = currentProfile();
      cp.name = String(parsed.profile || cp.name || "Imported schedule").slice(0, 80);
      cp.rows = cleanRows;
      cp.reflections = parsed.reflections && typeof parsed.reflections === "object" ? parsed.reflections : {};
      syncRows();
      if (!saveState()) throw new Error("Browser storage could not save the imported audit");
      renderProfileChip();
      renderWorksheet();
      renderStats();
      if (activeView === "compare") renderCompare();
      if (activeView === "reflect") renderReflect();
      showToast("Audit imported and saved.", false);
    } catch (e) {
      showToast("Import failed: " + e.message, false);
    }
  });

  document.getElementById("exportMd").addEventListener("click", function() {
    const cp = currentProfile();
    const idealTotal = sumIdeal();
    const actualTotal = sumActual();
    const diff = actualTotal - idealTotal;
    const signed = (diff >= 0 ? "+" : "") + fmtH(diff);
    let md = "# 168 — Audit Your Week\\n";
    md += "**Schedule:** " + cp.name + "\\n\\n";
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
    const standardPrompts = new Set(REFLECTION.ideal.concat(REFLECTION.actual, REFLECTION.vital));
    md += reflectSection("Guided and earlier reflections", Object.keys(cp.reflections || {}).filter(function(promptText) {
      return !standardPrompts.has(promptText);
    }), "additional");

    download(profileFilename("md"), "text/markdown", md);
  });

  document.getElementById("exportJournal").addEventListener("click", function() {
    const cp = currentProfile();
    const dateLabel = new Date().toISOString().slice(0, 10);
    let md = "# Weekly journal — " + dateLabel + "\\n";
    md += "**Schedule:** " + cp.name + "\\n\\n";
    md += "## What I planned vs what happened\\n\\n";
    const sumI = sumIdeal(), sumA = sumActual();
    md += "- Ideal: " + fmtH(sumI) + "h\\n";
    md += "- Actual: " + fmtH(sumA) + "h\\n";
    md += "- Delta: " + ((sumA - sumI) >= 0 ? "+" : "") + fmtH(sumA - sumI) + "h\\n\\n";
    function answered(list) { return list.map(p => ({ p, a: getReflection(p) })).filter(x => x.a && x.a.trim()); }
    function sect(title, list) {
      const items = answered(list);
      if (!items.length) return "";
      let s = "## " + title + "\\n\\n";
      items.forEach(x => { s += "**" + x.p + "**\\n\\n" + x.a + "\\n\\n"; });
      return s;
    }
    md += sect("Ideal-week reflections", REFLECTION.ideal);
    md += sect("Actual-week reflections", REFLECTION.actual);
    md += sect("Vital reflections", REFLECTION.vital);
    const journalStandardPrompts = new Set(REFLECTION.ideal.concat(REFLECTION.actual, REFLECTION.vital));
    md += sect("Guided and earlier reflections", Object.keys(cp.reflections || {}).filter(function(promptText) {
      return !journalStandardPrompts.has(promptText);
    }));
    md += "## Categories I want to change next week\\n\\n_Write here._\\n\\n";
    md += "## One thing I'm grateful for this week\\n\\n_Write here._\\n";
    download("168-audit-" + slugify(cp.name) + "-journal-" + dateLabel + ".md", "text/markdown", md);
  });

  document.getElementById("exportShare").addEventListener("click", async function() {
    const cp = currentProfile();
    const payload = {
      name: cp.name,
      rows: cp.rows.map(r => ({ category: r.category, sub: r.sub, ideal: r.ideal, actual: r.actual, notes: r.notes, sliderMax: r.sliderMax })),
      reflections: cp.reflections || {}
    };
    try {
      const json = JSON.stringify(payload);
      const encoded = btoa(unescape(encodeURIComponent(json))).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
      const url = location.origin + location.pathname + "#share=" + encoded;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        showToast("Share link copied — anyone with it sees a read-only copy.", false);
      } else {
        await openAppDialog({
          kind: "text",
          title: "Copy read-only link",
          body: "Anyone with this link can read this exported copy.",
          label: "Share link",
          value: url,
          readOnly: true,
          confirmLabel: "Done"
        });
      }
    } catch (e) {
      showToast("Couldn't build share link: " + e.message, false);
    }
  });

  document.getElementById("exportPrint").addEventListener("click", function() {
    window.print();
  });

  // ------ Share-link import (URL hash) ------
  (function importShareIfPresent() {
    const m = location.hash.match(/^#share=([\\w\\-_]+)/);
    if (!m) return;
    try {
      const b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "===".slice(0, (4 - b64.length % 4) % 4);
      const json = decodeURIComponent(escape(atob(padded)));
      const payload = JSON.parse(json);
      if (!payload || !Array.isArray(payload.rows)) return;
      // Defer until state is loaded; queue it.
      window.__SHARE_IMPORT__ = payload;
    } catch (e) {
      console.warn("share import parse failed:", e);
    }
  })();
  function applyShareImportIfQueued() {
    const payload = window.__SHARE_IMPORT__;
    if (!payload) return;
    window.__SHARE_IMPORT__ = null;
    history.replaceState(null, "", location.pathname);
    try {
      const cleanRows = sanitizeRows(payload.rows, 500);
      const id = uniqueProfileId();
      state.profiles[id] = {
        id: id,
        name: String(payload.name || "Shared").slice(0, 80) + " (imported)",
        rows: cleanRows,
        reflections: payload.reflections && typeof payload.reflections === "object" && !Array.isArray(payload.reflections) ? payload.reflections : {}
      };
      state.activeProfile = id;
      syncRows();
      saveState();
      showToast("Imported shared schedule as '" + state.profiles[id].name + "'.", false);
    } catch(e) {
      showToast("Shared audit rejected: " + e.message, false);
    }
  }

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

  // ------ Multi-user center ------
  const CLOUD = window.__CLOUD_CONFIG__ || { enabled: false };
  let cloudClient = null;
  let cloudSession = null;
  let cloudPasswordRecovery = false;
  let cloudGroups = [];
  let cloudWeeks = [];
  let cloudMembers = [];
  let cloudInvites = [];
  let cloudSharedWeekIds = new Set();
  let selectedGroupId = "";
  let cloudBusy = false;
  let cloudOnline = navigator.onLine;
  const CLOUD_STORAGE_KEY = "168-audit:cloud-auth";

  function mondayISO() {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d.toISOString().slice(0, 10);
  }

  function setCloudError(message) {
    const el = document.getElementById("centerError");
    if (el) el.textContent = message || "";
  }

  function clearCloudSessionState() {
    cloudSession = null;
    cloudGroups = [];
    cloudWeeks = [];
    cloudMembers = [];
    cloudInvites = [];
    cloudSharedWeekIds = new Set();
    selectedGroupId = "";
  }

  function signOutLocally() {
    if (cloudClient && cloudClient.auth && typeof cloudClient.auth.stopAutoRefresh === "function") {
      cloudClient.auth.stopAutoRefresh();
    }
    localStorage.removeItem(CLOUD_STORAGE_KEY);
    clearCloudSessionState();
    if (activeView === "center") renderCenter();
  }

  function cloudMessage(error, fallback) {
    if (!error) return fallback || "";
    if (error.code === "40001" || error.code === "PT409") return "This week changed in another session. Your local copy is safe; refresh Center before syncing again.";
    if (error.status === 401 || error.status === 403 || error.code === "42501") return "Your access changed. Refresh your session and try again.";
    return error.message || fallback || "The cloud service could not complete that request.";
  }

  async function refreshCloudData() {
    if (!cloudClient || !cloudSession) return;
    const memberships = await cloudClient
      .from("group_memberships")
      .select("group_id,role,groups(id,name)")
      .eq("user_id", cloudSession.user.id);
    if (memberships.error) throw memberships.error;
    cloudGroups = (memberships.data || []).map(function(row) {
      return { id: row.group_id, name: row.groups && row.groups.name ? row.groups.name : "Group", role: row.role };
    });
    if (!selectedGroupId || !cloudGroups.some(function(group) { return group.id === selectedGroupId; })) {
      selectedGroupId = cloudGroups[0] ? cloudGroups[0].id : "";
    }
    cloudMembers = [];
    cloudInvites = [];
    if (selectedGroupId) {
      const memberResult = await cloudClient.from("group_memberships").select("user_id,role,joined_at").eq("group_id", selectedGroupId);
      if (memberResult.error) throw memberResult.error;
      const membershipsForGroup = memberResult.data || [];
      const memberIds = membershipsForGroup.map(function(member) { return member.user_id; });
      let profileNames = {};
      if (memberIds.length) {
        const profileResult = await cloudClient.from("profiles").select("user_id,display_name").in("user_id", memberIds);
        if (profileResult.error) throw profileResult.error;
        (profileResult.data || []).forEach(function(profile) { profileNames[profile.user_id] = profile.display_name; });
      }
      cloudMembers = membershipsForGroup.map(function(member) {
        return { userId: member.user_id, role: member.role, name: profileNames[member.user_id] || "Group member" };
      });
      const selectedMembership = cloudGroups.find(function(group) { return group.id === selectedGroupId; });
      if (selectedMembership && (selectedMembership.role === "owner" || selectedMembership.role === "admin")) {
        const inviteResult = await cloudClient.from("group_invites")
          .select("id,expires_at,max_uses,use_count,revoked_at")
          .eq("group_id", selectedGroupId)
          .is("revoked_at", null)
          .gt("expires_at", new Date().toISOString())
          .order("expires_at", { ascending: true });
        if (inviteResult.error) throw inviteResult.error;
        cloudInvites = inviteResult.data || [];
      }
    }
    const weeks = await cloudClient
      .from("audit_weeks")
      .select("id,owner_id,week_start,title,audit_document,version,updated_at")
      .order("week_start", { ascending: false })
      .limit(100);
    if (weeks.error) throw weeks.error;
    cloudWeeks = weeks.data || [];
    cloudSharedWeekIds = new Set();
    if (selectedGroupId) {
      const shares = await cloudClient.from("group_week_shares").select("week_id").eq("group_id", selectedGroupId);
      if (shares.error) throw shares.error;
      (shares.data || []).forEach(function(share) { cloudSharedWeekIds.add(share.week_id); });
    }
  }

  async function syncCurrentWeek() {
    if (!cloudClient || !cloudSession) throw new Error("Sign in before syncing.");
    const cp = currentProfile();
    const payload = {
      week_start: mondayISO(),
      title: cp.name,
      audit_document: {
        schemaVersion: 1,
        rows: cp.rows,
        reflections: cp.reflections || {},
        source: "168-audit"
      }
    };
    const existing = await cloudClient.from("audit_weeks").select("id,version")
      .eq("owner_id", cloudSession.user.id).eq("week_start", payload.week_start).maybeSingle();
    if (existing.error) throw existing.error;
    const result = await cloudClient.rpc("save_audit_week", {
      target_week_id: existing.data ? existing.data.id : null,
      target_title: payload.title,
      target_week_start: payload.week_start,
      target_document: payload.audit_document,
      expected_version: existing.data ? existing.data.version : null
    });
    if (result.error) throw result.error;
    await refreshCloudData();
    showToast("Week synced securely", false);
    const saved = Array.isArray(result.data) ? result.data[0] : result.data;
    return saved && saved.week_id;
  }

  function renderCenterSignedOut(container) {
    container.innerHTML =
      '<div class="center-shell">' +
        '<div class="center-heading"><div><h2>Your weeks, together</h2><p>Sign in to carry your audit across devices and share selected weeks with a group.</p></div>' +
        '<span class="center-status">Local mode</span></div>' +
        '<div class="center-grid">' +
          '<section class="center-card"><h3>Sign in</h3><p>Your browser audit remains available while you connect an account.</p>' +
            '<form class="center-form" id="signInForm"><label class="center-field">Email<input id="signInEmail" type="email" autocomplete="email" required></label>' +
            '<label class="center-field">Password<input id="signInPassword" type="password" autocomplete="current-password" minlength="8" required></label>' +
            '<div class="center-actions"><button class="btn btn-primary" type="submit">Sign in</button><button class="btn btn-quiet" type="button" id="resetPasswordBtn">Reset password</button></div></form>' +
            '<div class="center-divider">New here</div>' +
            '<form class="center-form" id="signUpForm"><label class="center-field">Display name<input id="signUpName" maxlength="80" autocomplete="name" required></label>' +
            '<label class="center-field">Email<input id="signUpEmail" type="email" autocomplete="email" required></label>' +
            '<label class="center-field">Password<input id="signUpPassword" type="password" autocomplete="new-password" minlength="8" required></label>' +
            '<button class="btn" type="submit">Create account</button></form>' +
            '<p class="center-error" id="centerError" role="alert" aria-live="assertive"></p></section>' +
          '<aside class="center-card"><h3>Privacy by default</h3><p>Every audit begins private.</p>' +
            '<div class="privacy-note"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><rect x="4.5" y="8.5" width="11" height="8" rx="2"/><path d="M7 8.5V6a3 3 0 0 1 6 0v2.5"/></svg><span><strong>You choose each shared week.</strong> Joining a group never opens your private drafts or history. You can revoke access at any time.</span></div>' +
            '<div class="center-divider">On this device</div><p><strong>' + escHtml(currentProfile().name) + '</strong><br>' + rows.length + ' planning rows are saved locally and ready to sync after sign-in.</p></aside>' +
        '</div></div>';
    const signIn = document.getElementById("signInForm");
    const signUp = document.getElementById("signUpForm");
    signIn.addEventListener("submit", async function(event) {
      event.preventDefault(); setCloudError(""); cloudBusy = true;
      const result = await cloudClient.auth.signInWithPassword({
        email: document.getElementById("signInEmail").value,
        password: document.getElementById("signInPassword").value
      });
      cloudBusy = false;
      if (result.error) setCloudError(cloudMessage(result.error, "Sign-in failed."));
    });
    signUp.addEventListener("submit", async function(event) {
      event.preventDefault(); setCloudError(""); cloudBusy = true;
      const result = await cloudClient.auth.signUp({
        email: document.getElementById("signUpEmail").value,
        password: document.getElementById("signUpPassword").value,
        options: {
          data: { display_name: document.getElementById("signUpName").value.trim() },
          emailRedirectTo: location.origin
        }
      });
      cloudBusy = false;
      if (result.error) setCloudError(cloudMessage(result.error, "Account creation failed."));
      else showToast("Check your email to confirm your account", false);
    });
    document.getElementById("resetPasswordBtn").addEventListener("click", async function() {
      const email = document.getElementById("signInEmail").value.trim();
      if (!email) { setCloudError("Enter your email first."); return; }
      const result = await cloudClient.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
      if (result.error) setCloudError(cloudMessage(result.error));
      else showToast("Password reset instructions sent", false);
    });
  }

  function renderCenterPasswordRecovery(container) {
    container.innerHTML =
      '<div class="center-shell"><div class="center-heading"><div><h2>Choose a new password</h2>' +
      '<p>Finish recovering your account, then return to your weeks and groups.</p></div><span class="center-status">Secure recovery</span></div>' +
      '<section class="center-card"><form class="center-form" id="recoveryPasswordForm">' +
      '<label class="center-field">New password<input id="recoveryPassword" type="password" autocomplete="new-password" minlength="8" required></label>' +
      '<label class="center-field">Confirm password<input id="recoveryPasswordConfirm" type="password" autocomplete="new-password" minlength="8" required></label>' +
      '<div class="center-actions"><button class="btn btn-primary" type="submit">Update password</button></div>' +
      '<p class="center-error" id="centerError" role="alert" aria-live="assertive"></p></form></section></div>';
    document.getElementById("recoveryPasswordForm").addEventListener("submit", async function(event) {
      event.preventDefault();
      const password = document.getElementById("recoveryPassword").value;
      const confirmation = document.getElementById("recoveryPasswordConfirm").value;
      if (password !== confirmation) return setCloudError("The passwords do not match.");
      const result = await cloudClient.auth.updateUser({ password: password });
      if (result.error) return setCloudError(cloudMessage(result.error, "Password update failed."));
      cloudPasswordRecovery = false;
      showToast("Password updated", false);
      renderCenter();
    });
  }

  function centerGroupRows() {
    if (!cloudGroups.length) return '<div class="center-empty">Create a group or accept an invitation to begin.</div>';
    return cloudGroups.map(function(group) {
      return '<button type="button" class="group-row' + (group.id === selectedGroupId ? ' active' : '') + '" data-group-id="' + escAttr(group.id) + '">' +
        '<span class="group-row-main"><strong>' + escHtml(group.name) + '</strong><small>' + escHtml(group.role) + '</small></span><span aria-hidden="true">&rsaquo;</span></button>';
    }).join("");
  }

  function centerInviteRows() {
    if (!cloudInvites.length) return '<p class="center-help">No active invitations.</p>';
    return '<div class="center-list invite-list">' + cloudInvites.map(function(invite) {
      const remaining = Math.max(0, num(invite.max_uses) - num(invite.use_count));
      const expiry = new Date(invite.expires_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return '<div class="invite-row"><span><strong>' + remaining + ' use' + (remaining === 1 ? '' : 's') +
        ' left</strong><small>Expires ' + escHtml(expiry) + '</small></span>' +
        '<button class="btn btn-quiet" type="button" data-revoke-invite="' + escAttr(invite.id) + '">Revoke</button></div>';
    }).join("") + '</div>';
  }

  function centerWeekRows() {
    const ownId = cloudSession.user.id;
    const ownWeeks = cloudWeeks.filter(function(week) { return week.owner_id === ownId; });
    const sharedWeeks = cloudWeeks.filter(function(week) {
      return week.owner_id !== ownId && cloudSharedWeekIds.has(week.id);
    });
    let html = '<h3>Your cloud weeks</h3><p>Sync the current schedule, then choose which group can view it.</p>';
    html += '<div class="center-actions"><button class="btn btn-primary" id="syncWeekBtn" type="button"' + (cloudOnline ? '' : ' disabled') + '>Sync current week</button></div>';
    html += '<div class="center-list" style="margin-top:1rem">';
    if (!ownWeeks.length) html += '<div class="center-empty">No cloud weeks yet.</div>';
    ownWeeks.forEach(function(week) {
      html += '<div class="week-share-row"><span><strong>' + escHtml(week.title || "Untitled week") + '</strong><br><small>Week of ' + escHtml(week.week_start) + '</small></span>' +
        (selectedGroupId ? '<label class="share-switch"><input type="checkbox" data-share-week="' + escAttr(week.id) + '"' +
          (cloudSharedWeekIds.has(week.id) ? ' checked' : '') + '> Share</label>' : '<small>Select a group</small>') + '</div>';
    });
    html += '</div><div class="center-divider">Shared with you</div><div class="center-list">';
    if (!sharedWeeks.length) html += '<div class="center-empty">Weeks shared by group members will appear here.</div>';
    sharedWeeks.forEach(function(week) {
      const rowCount = week.audit_document && Array.isArray(week.audit_document.rows) ? week.audit_document.rows.length : 0;
      const sharedRows = rowCount ? week.audit_document.rows : [];
      const owner = cloudMembers.find(function(member) { return member.userId === week.owner_id; });
      html += '<article class="shared-week-card"><div class="week-share-row"><span><strong>' + escHtml(week.title || "Shared week") +
        '</strong><br><small>' + escHtml(owner ? owner.name : "Group member") + ' &middot; ' + escHtml(week.week_start) + ' &middot; ' + rowCount +
        ' rows</small></span><span class="center-status" data-state="synced">Shared</span></div>' +
        '<details class="shared-week-details"><summary>View week data</summary><div class="shared-week-data">';
      sharedRows.forEach(function(row) {
        html += '<div class="shared-week-data-row"><span><strong>' + escHtml(row.sub || "Untitled") + '</strong><small>' +
          escHtml(row.category || "") + '</small>' + (String(row.notes || "").trim() ? '<small class="shared-week-note">' + escHtml(String(row.notes).trim()) + '</small>' : '') +
          '</span><span><b>' + fmtH(num(row.ideal)) + 'h</b> ideal<br><b>' +
          fmtH(num(row.actual)) + 'h</b> actual</span></div>';
      });
      const reflectionEntries = week.audit_document && week.audit_document.reflections
        ? Object.entries(week.audit_document.reflections).filter(function(entry) { return String(entry[1] || "").trim(); })
        : [];
      if (reflectionEntries.length) {
        html += '<div class="center-divider">Reflections</div>';
        reflectionEntries.forEach(function(entry) {
          html += '<div class="shared-reflection"><strong>' + escHtml(entry[0]) + '</strong><p>' + escHtml(String(entry[1])) + '</p></div>';
        });
      }
      html += '</div></details></article>';
    });
    html += '</div><div class="center-divider">Members</div><div class="center-list">';
    if (!cloudMembers.length) html += '<div class="center-empty">The roster will appear here.</div>';
    const selectedGroup = cloudGroups.find(function(group) { return group.id === selectedGroupId; });
    const canManage = selectedGroup && (selectedGroup.role === "owner" || selectedGroup.role === "admin");
    cloudMembers.forEach(function(member) {
      html += '<div class="member-row"><span class="member-main"><strong>' + escHtml(member.name) + '</strong><small>' +
        escHtml(member.role) + '</small></span>';
      if (selectedGroup && selectedGroup.role === "owner" && member.userId !== cloudSession.user.id && member.role !== "owner") {
        html += '<label class="sr-only" for="role-' + escAttr(member.userId) + '">Role for ' + escHtml(member.name) + '</label>' +
          '<select class="member-role-select" id="role-' + escAttr(member.userId) + '" data-member-role="' + escAttr(member.userId) + '">' +
          '<option value="member"' + (member.role === "member" ? " selected" : "") + '>Member</option>' +
          '<option value="admin"' + (member.role === "admin" ? " selected" : "") + '>Admin</option></select>' +
          '<button class="btn btn-quiet" type="button" data-transfer-owner="' + escAttr(member.userId) + '">Make owner</button>';
      }
      if (canManage && member.userId !== cloudSession.user.id && member.role !== "owner" &&
          (selectedGroup.role === "owner" || member.role === "member")) {
        html += '<button class="btn btn-quiet" type="button" data-remove-member="' + escAttr(member.userId) + '">Remove</button>';
      }
      html += '</div>';
    });
    html += '</div>';
    if (selectedGroup) {
      html += '<div class="center-divider">Group controls</div><div class="center-actions">';
      if (selectedGroup.role === "owner" || selectedGroup.role === "admin") {
        html += '<button class="btn btn-quiet" id="renameGroupBtn" type="button">Rename group</button>';
      }
      if (selectedGroup.role === "owner") {
        html += '<button class="btn btn-quiet danger" id="deleteGroupBtn" type="button">Delete group</button>';
      } else {
        html += '<button class="btn btn-quiet danger" id="leaveGroupBtn" type="button">Leave group</button>';
      }
      html += '</div>';
    }
    return html;
  }

  function renderCenterSignedIn(container) {
    const email = cloudSession.user.email || "Signed in";
    const pendingInvite = new URLSearchParams(location.search).get("invite") || "";
    container.innerHTML =
      '<div class="center-shell"><div class="center-heading"><div><h2>Your center</h2></div>' +
      '<span class="center-status" data-state="' + (cloudOnline ? "synced" : "offline") + '">' +
      (cloudOnline ? "Cloud connected" : "Offline · local edits safe") + '</span></div>' +
      '<div class="center-grid"><aside class="center-card"><h3>' + escHtml(email) + '</h3><p>Personal audits remain private until you share one.</p>' +
      '<button class="btn btn-quiet" id="signOutBtn" type="button">Sign out</button><div class="center-divider">Groups</div><div class="center-list" id="groupList">' + centerGroupRows() + '</div>' +
      '<div class="center-divider">Create or join</div><form class="center-form" id="createGroupForm"><label class="center-field">Group name<input id="groupName" maxlength="100" required></label><button class="btn" type="submit">Create group</button></form>' +
      '<form class="center-form" id="joinGroupForm" style="margin-top:.75rem"><label class="center-field">Invitation code<input id="inviteToken" autocomplete="off" value="' + escAttr(pendingInvite) + '" required></label><button class="btn btn-quiet" type="submit">Join with invitation</button></form>' +
      (selectedGroupId && cloudGroups.some(function(group) { return group.id === selectedGroupId && (group.role === "owner" || group.role === "admin"); })
        ? '<div class="center-divider">Invite members</div><form class="center-form" id="createInviteForm"><p>Create a single-use invitation that expires in seven days.</p><button class="btn btn-quiet" type="submit">Create invitation</button><div id="inviteCodeWrap" class="invite-created" hidden><output id="inviteCodeOutput"></output><button class="btn btn-quiet" id="copyInviteBtn" type="button">Copy join link</button></div></form>' + centerInviteRows()
        : '') +
      '<p class="center-error" id="centerError" role="alert" aria-live="assertive"></p></aside>' +
      '<section class="center-card" id="centerWeeks">' + centerWeekRows() + '</section></div></div>';
    document.getElementById("signOutBtn").addEventListener("click", async function() {
      if (!cloudOnline) {
        signOutLocally();
        showToast("Signed out on this device. The remote session will expire automatically.", false);
        return;
      }
      const result = await cloudClient.auth.signOut();
      if (!result.error) return;
      const localResult = await cloudClient.auth.signOut({ scope: "local" });
      if (localResult.error) setCloudError(cloudMessage(localResult.error, "Sign out could not finish."));
      else showToast("Signed out on this device. The remote session will expire automatically.", false);
    });
    document.querySelectorAll("[data-group-id]").forEach(function(button) {
      button.addEventListener("click", function() { selectedGroupId = this.dataset.groupId; renderCenter(); });
    });
    document.getElementById("createGroupForm").addEventListener("submit", async function(event) {
      event.preventDefault(); setCloudError("");
      const newGroupId = crypto.randomUUID();
      const result = await cloudClient.from("groups")
        .insert({ id: newGroupId, name: document.getElementById("groupName").value.trim() });
      if (result.error) return setCloudError(cloudMessage(result.error));
      await refreshCloudData(); selectedGroupId = newGroupId; renderCenter(); showToast("Group created", false);
    });
    document.getElementById("joinGroupForm").addEventListener("submit", async function(event) {
      event.preventDefault(); setCloudError("");
      const result = await cloudClient.rpc("redeem_group_invite", { invite_token: document.getElementById("inviteToken").value.trim() });
      if (result.error) return setCloudError(cloudMessage(result.error, "That invitation is unavailable."));
      if (pendingInvite) history.replaceState(null, "", location.pathname + location.hash);
      await refreshCloudData(); selectedGroupId = result.data; renderCenter(); showToast("Joined group", false);
    });
    const inviteForm = document.getElementById("createInviteForm");
    if (inviteForm) inviteForm.addEventListener("submit", async function(event) {
      event.preventDefault(); setCloudError("");
      const result = await cloudClient.rpc("create_group_invite", {
        target_group_id: selectedGroupId,
        valid_for: "7 days",
        allowed_uses: 1
      });
      if (result.error) return setCloudError(cloudMessage(result.error, "The invitation could not be created."));
      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      const output = document.getElementById("inviteCodeOutput");
      const wrap = document.getElementById("inviteCodeWrap");
      const token = row && row.invite_token ? row.invite_token : "";
      wrap.hidden = false;
      output.textContent = token ? "Invitation ready. It is shown only in this session." : "Invitation created";
      output.dataset.joinUrl = token ? location.origin + "/?invite=" + encodeURIComponent(token) : "";
      await refreshCloudData();
      showToast("Invitation created", false);
    });
    const copyInviteButton = document.getElementById("copyInviteBtn");
    if (copyInviteButton) copyInviteButton.addEventListener("click", async function() {
      const output = document.getElementById("inviteCodeOutput");
      if (!output.dataset.joinUrl) return;
      await navigator.clipboard.writeText(output.dataset.joinUrl);
      showToast("Join link copied", false);
    });
    document.querySelectorAll("[data-revoke-invite]").forEach(function(button) {
      button.addEventListener("click", async function() {
        const approved = await openAppDialog({
          title: "Revoke this invitation?",
          body: "Anyone who has not joined yet will lose access to this invitation.",
          confirmLabel: "Revoke invitation",
          danger: true
        });
        if (!approved) return;
        const result = await cloudClient.rpc("revoke_group_invite", { target_invite_id: button.dataset.revokeInvite });
        if (result.error) return setCloudError(cloudMessage(result.error));
        await refreshCloudData(); renderCenter(); showToast("Invitation revoked", false);
      });
    });
    document.getElementById("syncWeekBtn").addEventListener("click", async function() {
      try { this.disabled = true; await syncCurrentWeek(); renderCenter(); }
      catch (error) { setCloudError(cloudMessage(error)); }
    });
    document.querySelectorAll("[data-share-week]").forEach(function(input) {
      input.addEventListener("change", async function() {
        const weekId = this.dataset.shareWeek;
        const result = this.checked
          ? await cloudClient.from("group_week_shares").insert({ group_id: selectedGroupId, week_id: weekId, shared_by: cloudSession.user.id })
          : await cloudClient.from("group_week_shares").delete().eq("group_id", selectedGroupId).eq("week_id", weekId);
        if (result.error) { this.checked = !this.checked; setCloudError(cloudMessage(result.error)); }
        else {
          if (this.checked) cloudSharedWeekIds.add(weekId);
          else cloudSharedWeekIds.delete(weekId);
          showToast(this.checked ? "Week shared with group" : "Group access revoked", false);
        }
      });
    });
    document.querySelectorAll("[data-remove-member]").forEach(function(button) {
      button.addEventListener("click", async function() {
        const member = cloudMembers.find(function(item) { return item.userId === button.dataset.removeMember; });
        const approved = await openAppDialog({
          title: "Remove “" + (member ? member.name : "member") + "”?",
          body: "They will lose access to this group and its shared weeks.",
          confirmLabel: "Remove member",
          danger: true
        });
        if (!approved) return;
        const result = await cloudClient.rpc("remove_group_member", {
          target_group_id: selectedGroupId,
          target_user_id: button.dataset.removeMember
        });
        if (result.error) return setCloudError(cloudMessage(result.error));
        await refreshCloudData(); renderCenter(); showToast("Member removed", false);
      });
    });
    document.querySelectorAll("[data-member-role]").forEach(function(select) {
      select.addEventListener("change", async function() {
        const previousRole = cloudMembers.find(function(member) { return member.userId === select.dataset.memberRole; });
        const result = await cloudClient.rpc("set_group_member_role", {
          target_group_id: selectedGroupId,
          target_user_id: select.dataset.memberRole,
          new_role: select.value
        });
        if (result.error) {
          if (previousRole) select.value = previousRole.role;
          return setCloudError(cloudMessage(result.error));
        }
        await refreshCloudData(); renderCenter(); showToast("Member role updated", false);
      });
    });
    document.querySelectorAll("[data-transfer-owner]").forEach(function(button) {
      button.addEventListener("click", async function() {
        const member = cloudMembers.find(function(item) { return item.userId === button.dataset.transferOwner; });
        const approved = await openAppDialog({
          title: "Make " + (member ? member.name : "this member") + " the owner?",
          body: "You will become an admin. The new owner will control roles and group deletion.",
          confirmLabel: "Transfer ownership"
        });
        if (!approved) return;
        const result = await cloudClient.rpc("transfer_group_ownership", {
          target_group_id: selectedGroupId,
          new_owner_id: button.dataset.transferOwner
        });
        if (result.error) return setCloudError(cloudMessage(result.error));
        await refreshCloudData(); renderCenter(); showToast("Ownership transferred", false);
      });
    });
    const leaveGroupButton = document.getElementById("leaveGroupBtn");
    if (leaveGroupButton) leaveGroupButton.addEventListener("click", async function() {
      const group = cloudGroups.find(function(item) { return item.id === selectedGroupId; });
      const approved = await openAppDialog({
        title: "Leave " + (group ? group.name : "this group") + "?",
        body: "You will lose access to its shared weeks. Your personal audits stay private and safe.",
        confirmLabel: "Leave group",
        danger: true
      });
      if (!approved) return;
      const result = await cloudClient.rpc("leave_group", { target_group_id: selectedGroupId });
      if (result.error) return setCloudError(cloudMessage(result.error));
      selectedGroupId = "";
      await refreshCloudData(); renderCenter(); showToast("Group left", false);
    });
    const deleteGroupButton = document.getElementById("deleteGroupBtn");
    if (deleteGroupButton) deleteGroupButton.addEventListener("click", async function() {
      const group = cloudGroups.find(function(item) { return item.id === selectedGroupId; });
      const approved = await openAppDialog({
        title: "Delete " + (group ? group.name : "this group") + "?",
        body: "Members will lose group access. Their personal audit weeks remain intact.",
        confirmLabel: "Delete group",
        danger: true
      });
      if (!approved) return;
      const result = await cloudClient.from("groups").delete().eq("id", selectedGroupId);
      if (result.error) return setCloudError(cloudMessage(result.error));
      selectedGroupId = "";
      await refreshCloudData(); renderCenter(); showToast("Group deleted", false);
    });
    const renameGroupButton = document.getElementById("renameGroupBtn");
    if (renameGroupButton) renameGroupButton.addEventListener("click", async function() {
      const group = cloudGroups.find(function(item) { return item.id === selectedGroupId; });
      const nextName = await openAppDialog({
        title: "Rename group",
        body: "Choose a name every member will recognize.",
        inputLabel: "Group name",
        value: group ? group.name : "",
        confirmLabel: "Save name",
        maxLength: 100
      });
      if (!nextName || !nextName.trim()) return;
      const result = await cloudClient.from("groups").update({ name: nextName.trim() }).eq("id", selectedGroupId);
      if (result.error) return setCloudError(cloudMessage(result.error));
      await refreshCloudData(); renderCenter(); showToast("Group renamed", false);
    });
  }

  function renderCenter() {
    const container = views.center;
    if (!container) return;
    if (!CLOUD.enabled || !cloudClient) {
      container.innerHTML = '<div class="center-shell"><div class="center-heading"><div><h2>Your weeks, together</h2><p>The multi-user center is ready for a Supabase project connection.</p></div><span class="center-status">Cloud setup</span></div>' +
        '<section class="center-card"><h3>Local audit remains fully available</h3><p>Add the documented Supabase environment variables and apply the included migration to enable account login, device sync, private groups, invitations, and explicit week sharing.</p>' +
        '<div class="privacy-note"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 20 20"><rect x="4.5" y="8.5" width="11" height="8" rx="2"/><path d="M7 8.5V6a3 3 0 0 1 6 0v2.5"/></svg><span><strong>Privacy is enforced in the database.</strong> Group members can read only weeks their owners deliberately share.</span></div></section></div>';
      return;
    }
    if (cloudPasswordRecovery && cloudSession) renderCenterPasswordRecovery(container);
    else if (!cloudSession) renderCenterSignedOut(container);
    else renderCenterSignedIn(container);
  }

  (function initCloud() {
    if (!CLOUD.enabled || !window.supabase || typeof window.supabase.createClient !== "function") return;
    cloudClient = window.supabase.createClient(CLOUD.url, CLOUD.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: CLOUD_STORAGE_KEY
      }
    });
    cloudClient.auth.getSession().then(async function(result) {
      cloudSession = result.data.session;
      if (cloudSession) {
        try { await refreshCloudData(); } catch (error) { showToast(cloudMessage(error), false); }
      }
      if (activeView === "center") renderCenter();
    });
    cloudClient.auth.onAuthStateChange(function(event, session) {
      cloudSession = session;
      if (event === "PASSWORD_RECOVERY") cloudPasswordRecovery = true;
      if (!session) clearCloudSessionState();
      setTimeout(async function() {
        if (session) {
          try { await refreshCloudData(); } catch (error) { showToast(cloudMessage(error), false); }
        }
        if (activeView === "center") renderCenter();
      }, 0);
    });
    window.addEventListener("offline", function() {
      cloudOnline = false;
      if (activeView === "center") renderCenter();
      showToast("Offline · your local audit remains safe", false);
    });
    window.addEventListener("online", function() {
      cloudOnline = true;
      if (activeView === "center") renderCenter();
      showToast("Back online · cloud sync is available", false);
    });
  })();

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
    html += '<button class="profile-menu-item profile-menu-action" data-action="new" role="menuitem"><span class="pmi-check">+</span><span>New schedule…</span></button>';
    html += '<button class="profile-menu-item profile-menu-action" data-action="rename" role="menuitem"><span class="pmi-check"></span><span>Rename schedule…</span></button>';
    html += '<button class="profile-menu-item profile-menu-action" data-action="duplicate" role="menuitem"><span class="pmi-check"></span><span>Duplicate schedule</span></button>';
    if (ids.length > 1) {
      html += '<button class="profile-menu-item profile-menu-action danger" data-action="delete" role="menuitem"><span class="pmi-check"></span><span>Delete schedule</span></button>';
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
        if (activeView === "history") renderHistory();
        closeProfileMenu();
        showToast("Switched to '" + currentProfile().name + "'", false);
      });
    });
    menu.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", async function() {
        const action = this.dataset.action;
        if (action === "new") {
          closeProfileMenu();
          const name = await openAppDialog({
            kind: "text", title: "Create schedule", body: "Schedules keep separate rows and reflections.",
            label: "Schedule name", value: "New schedule", confirmLabel: "Create"
          });
          if (!name) return;
          const id = uniqueProfileId();
          state.profiles[id] = freshProfile(id, name);
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
          closeProfileMenu();
          const name = await openAppDialog({
            kind: "text", title: "Rename schedule", body: "Choose a name you will recognize later.",
            label: "Schedule name", value: cur.name, confirmLabel: "Save name"
          });
          if (!name) return;
          cur.name = name;
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
          closeProfileMenu();
          const approved = await openAppDialog({
            title: "Delete “" + cur.name + "”?",
            body: "Its rows and reflections will be removed from this browser.",
            confirmLabel: "Delete schedule",
            danger: true
          });
          if (!approved) return;
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
    setTimeout(function() {
      const first = document.querySelector("#profileMenu [role^='menuitem']");
      if (first) first.focus();
    }, 0);
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
    document.getElementById("profileMenu").addEventListener("keydown", function(e) {
      const items = Array.from(this.querySelectorAll('[role^="menuitem"]'));
      const index = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && items.length) {
        e.preventDefault(); items[(index + 1 + items.length) % items.length].focus();
      } else if (e.key === "ArrowUp" && items.length) {
        e.preventDefault(); items[(index - 1 + items.length) % items.length].focus();
      } else if (e.key === "Home" && items.length) {
        e.preventDefault(); items[0].focus();
      } else if (e.key === "End" && items.length) {
        e.preventDefault(); items[items.length - 1].focus();
      }
    });
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && document.getElementById("profileWrap").dataset.open === "true") {
        closeProfileMenu();
        chip.focus();
      }
    });
  })();

  function animateTourPlacement(element, before, resizeFromPrevious) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const after = element.getBoundingClientRect();
    if (!before || !before.width || !before.height || !after.width || !after.height) return;
    element.getAnimations().forEach(animation => animation.cancel());
    const dx = before.left - after.left;
    const dy = before.top - after.top;
    const sx = resizeFromPrevious ? before.width / after.width : 1;
    const sy = resizeFromPrevious ? before.height / after.height : 1;
    element.animate([
      { transform: "translate(" + dx + "px," + dy + "px) scale(" + sx + "," + sy + ")", opacity: 0.62 },
      { transform: "translate(0,0) scale(1,1)", opacity: 1 }
    ], {
      duration: 260,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    });
  }

  // ------ Guided tour ------
  // Bumped for v9: triggers the new first-run intro modal once for existing users.
  const TOUR_KEY = "168-audit:intro-seen-v2";
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
      selector: "#inputModeBtn",
      title: "Numbers or sliders",
      body: "This icon switches input style. Sliders use a useful range for each kind of activity."
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
      body: "Keep separate Term, Summer, or Sabbatical schedules. Each one preserves its own rows and reflections."
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
        const previousSpot = spotlight.getBoundingClientRect();
        spotlight.style.top = (r.top - pad) + "px";
        spotlight.style.left = (r.left - pad) + "px";
        spotlight.style.width = (r.width + pad * 2) + "px";
        spotlight.style.height = (r.height + pad * 2) + "px";
        animateTourPlacement(spotlight, previousSpot, true);
        positionTooltip(r);
      });
    }
    function positionTooltip(r) {
      const previousTip = tooltip.getBoundingClientRect();
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
      animateTourPlacement(tooltip, previousTip, false);
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

  function dialogFocusables(dialog) {
    return Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function(el) { return !el.hidden && el.getClientRects().length; });
  }
  function containDialogFocus(dialog, e) {
    if (e.key !== "Tab") return;
    const items = dialogFocusables(dialog);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function renderDistributionDialog() {
    const distribution = worksheetDistribution();
    const label = distribution.field === "actual" ? "Actual week" : "Ideal week";
    const remaining = TARGET - distribution.total;
    const status = Math.abs(remaining) <= .25
      ? "Balanced at 168 hours."
      : remaining > 0
        ? fmtH(remaining) + " hours remain."
        : fmtH(Math.abs(remaining)) + " hours over the weekly total.";
    document.getElementById("distributionDialogTitle").textContent = label + " allocation";
    document.getElementById("distributionDialogContent").innerHTML =
      '<p class="distribution-summary">' + status + ' Category colors match the worksheet.</p>' +
      '<div class="distribution-layout">' +
        worksheetDonutMarkup(distribution) +
        '<div>' + buildLegend(distribution.categories, distribution.byCategory) + '</div>' +
      '</div>';
  }

  function openDistributionDialog() {
    const modal = document.getElementById("distributionDialog");
    const returnFocus = document.activeElement;
    renderDistributionDialog();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const closeButton = modal.querySelector(".modal-close");
    function close() {
      modal.hidden = true;
      document.body.style.overflow = "";
      modal.removeEventListener("click", click);
      modal.removeEventListener("keydown", keydown);
      if (returnFocus && returnFocus.focus) returnFocus.focus();
    }
    function click(event) {
      if (event.target.closest("[data-distribution-close]")) close();
    }
    function keydown(event) {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      else containDialogFocus(modal, event);
    }
    modal.addEventListener("click", click);
    modal.addEventListener("keydown", keydown);
    requestAnimationFrame(function() { closeButton.focus(); });
  }

  (function initFeedback() {
    const modal = document.getElementById("feedbackDialog");
    const form = document.getElementById("feedbackForm");
    const message = document.getElementById("feedbackMessage");
    const email = document.getElementById("feedbackEmail");
    const status = document.getElementById("feedbackStatus");
    const mailLink = document.getElementById("feedbackEmailLink");
    let returnFocus = null;

    function feedbackText() {
      const sender = email.value.trim();
      return message.value.trim() + (sender ? "\\n\\nReply to: " + sender : "");
    }
    function close() {
      modal.hidden = true;
      document.body.style.overflow = "";
      status.textContent = "";
      if (returnFocus) returnFocus.focus();
    }
    function open() {
      returnFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      message.focus();
    }
    document.getElementById("feedbackBtn").addEventListener("click", open);
    modal.querySelectorAll("[data-feedback-close]").forEach(function(button) {
      button.addEventListener("click", close);
    });
    modal.addEventListener("keydown", function(event) {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      else containDialogFocus(modal, event);
    });
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const href = "mailto:douglaspmcgowan@gmail.com?subject=" +
        encodeURIComponent("168 Audit feedback") + "&body=" + encodeURIComponent(feedbackText());
      mailLink.href = href;
      mailLink.click();
      status.textContent = "Your email app should open with the message ready.";
    });
    document.getElementById("copyFeedbackBtn").addEventListener("click", async function() {
      if (!message.value.trim()) {
        message.focus();
        form.reportValidity();
        return;
      }
      try {
        await navigator.clipboard.writeText(feedbackText());
        status.textContent = "Feedback copied. Paste it into any message app.";
      } catch (error) {
        message.select();
        const copied = document.execCommand("copy");
        status.textContent = copied ? "Feedback copied. Paste it into any message app." : "Select the message and copy it manually.";
      }
    });
  })();

  function openAppDialog(options) {
    const modal = document.getElementById("appDialog");
    const form = document.getElementById("appDialogForm");
    const field = document.getElementById("appDialogField");
    const input = document.getElementById("appDialogInput");
    const confirmButton = document.getElementById("appDialogConfirm");
    const returnFocus = document.activeElement;
    document.getElementById("appDialogTitle").textContent = options.title || "Confirm";
    document.getElementById("appDialogBody").textContent = options.body || "";
    document.getElementById("appDialogLabel").textContent = options.label || "Name";
    confirmButton.textContent = options.confirmLabel || "Continue";
    confirmButton.classList.toggle("danger-action", Boolean(options.danger));
    field.hidden = options.kind !== "text";
    input.required = options.kind === "text";
    input.readOnly = Boolean(options.readOnly);
    input.value = options.value || "";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    return new Promise(function(resolve) {
      let settled = false;
      function finish(value) {
        if (settled) return;
        settled = true;
        modal.hidden = true;
        document.body.style.overflow = "";
        form.removeEventListener("submit", submit);
        modal.removeEventListener("click", cancelClick);
        document.removeEventListener("keydown", keydown);
        if (returnFocus && returnFocus.focus) returnFocus.focus();
        resolve(value);
      }
      function submit(event) {
        event.preventDefault();
        const value = options.kind === "text" ? input.value.trim() : true;
        if (options.kind === "text" && !value) { input.focus(); return; }
        finish(value);
      }
      function cancelClick(event) {
        if (event.target.closest("[data-app-dialog-cancel]")) finish(null);
      }
      function keydown(event) {
        if (event.key === "Escape") { event.preventDefault(); finish(null); }
        else containDialogFocus(modal, event);
      }
      form.addEventListener("submit", submit);
      modal.addEventListener("click", cancelClick);
      document.addEventListener("keydown", keydown);
      requestAnimationFrame(function() {
        if (options.kind === "text") { input.focus(); input.select(); }
        else confirmButton.focus();
      });
    });
  }

  // ------ "What is 168?" modal ------
  (function initWhatIs() {
    const modal = document.getElementById("whatIs");
    let returnFocus = null;
    function open() {
      returnFocus = document.activeElement;
      const exportBar = document.getElementById("exportBar");
      if (exportBar) exportBar.dataset.open = "false";
      const exportTrigger = document.getElementById("exportTrigger");
      if (exportTrigger) exportTrigger.setAttribute("aria-expanded", "false");
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      modal.querySelector(".modal-close").focus();
    }
    function close() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (returnFocus && returnFocus.focus) returnFocus.focus();
    }
    document.getElementById("tourReplay").addEventListener("click", open);
    modal.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", close));
    document.addEventListener("keydown", function(e) {
      if (modal.hidden) return;
      if (e.key === "Escape") close();
      else containDialogFocus(modal, e);
    });
    document.getElementById("startTourBtn").addEventListener("click", function() { close(); startTour(true); });
    document.getElementById("startTutorialBtn").addEventListener("click", function() { close(); startTutorial(); });
    document.getElementById("startWalkthroughBtn").addEventListener("click", function() {
      const cp = currentProfile();
      const hasWork = cp.rows.some(function(row) {
        return num(row.ideal) > 0 || num(row.actual) > 0 || String(row.notes || "").trim();
      }) || Object.values(cp.reflections || {}).some(function(answer) { return String(answer || "").trim(); });
      close();
      if (hasWork) startTour(true);
      else startTutorial();
    });
  })();

  (function initDataInfo() {
    const modal = document.getElementById("dataInfo");
    const trigger = document.getElementById("dataInfoBtn");
    let returnFocus = null;
    function open() {
      returnFocus = document.activeElement;
      const exportBar = document.getElementById("exportBar");
      const exportTrigger = document.getElementById("exportTrigger");
      if (exportBar) exportBar.dataset.open = "false";
      if (exportTrigger) exportTrigger.setAttribute("aria-expanded", "false");
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      modal.querySelector(".modal-close").focus();
    }
    function close() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (returnFocus && returnFocus.focus) returnFocus.focus();
    }
    trigger.addEventListener("click", open);
    modal.querySelectorAll("[data-close]").forEach(function(el) { el.addEventListener("click", close); });
    document.addEventListener("keydown", function(e) {
      if (modal.hidden) return;
      if (e.key === "Escape") close();
      else containDialogFocus(modal, e);
    });
  })();

  // ------ Full tutorial (interactive, category-by-category) ------
  function rowsForCategory(catName) {
    // Walk the rendered tbody and collect rows whose category matches.
    const trs = Array.from(document.querySelectorAll("#auditBody tr"));
    return trs.filter(tr => {
      const cellCat = tr.querySelector(".cell-input.cell-cat");
      return cellCat && cellCat.value === catName;
    });
  }
  function unionRect(elements) {
    if (!elements.length) return null;
    let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;
    elements.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < top) top = r.top;
      if (r.left < left) left = r.left;
      if (r.right > right) right = r.right;
      if (r.bottom > bottom) bottom = r.bottom;
    });
    return { top, left, right, bottom, width: right - left, height: bottom - top };
  }

  const TUTORIAL_STEPS = [
    {
      kind: "intro",
      view: "worksheet",
      title: "Why 168?",
      body: "There are 168 hours in a week. Sleep, work, family, ministry, leisure — all of it comes out of the same fixed budget. We'll walk through each category and plan an ideal week together. About five minutes."
    },
    {
      cat: "Work", view: "worksheet",
      title: "1. Work",
      body: "Mandatory work + anything voluntary (side projects, optional overtime). A standard US full-time job is around 40h. Fill in this category's rows below the highlight."
    },
    {
      cat: "Sleep", view: "worksheet",
      title: "2. Sleep",
      body: "Aim for 7–8 hours per night = 49–56h per week. Below ~49h, attention and mood degrade reliably. Don't shave this one."
    },
    {
      cat: "Eating w/ People", view: "worksheet",
      title: "3. Eating with people",
      body: "Shared meals are one of the cheapest, highest-return uses of time. Log group lunches + family meals separately so you can see them."
    },
    {
      cat: "Transit / Maintenance", view: "worksheet",
      title: "4. Transit & maintenance",
      body: "Commute, hygiene, cooking, admin, medical, housework. People reliably underestimate this — usually 25–35h. Be honest now to avoid the surprise later."
    },
    {
      cat: "Productive Transit", view: "worksheet",
      title: "5. Productive transit",
      body: "Train or bus where you can read or work. Different from commute-by-car. Even 3–5h here absorbs a lot of background reading."
    },
    {
      cat: "God Time", view: "worksheet",
      title: "6. God time",
      body: "Individual (prayer, scripture, sermons) and communal (church, small group). Communal often overlaps with people-time — that's fine; log it here for the spiritual dimension."
    },
    {
      cat: "Play", view: "worksheet",
      title: "7. Play",
      body: "Active leisure. Hangouts, media, hobbies. Media tends to silently expand — log it as honestly as you can; the slider tops out at 20h for a reason."
    },
    {
      cat: "Rest", view: "worksheet",
      title: "8. Rest",
      body: "Sabbath / quiet rest. Not the same as play. For introverts this means solitude; for extroverts it can mean low-stimulation time alone with God. Plan a real chunk — it's a command, not a suggestion."
    },
    {
      cat: "Other", view: "worksheet",
      title: "9. Other",
      body: "Exercise + non-regular travel. Travel is the one that can blow up a normal week — plan an average if your travel is irregular."
    },
    {
      kind: "total", view: "worksheet",
      title: "Check the total",
      body: "Does it add to 168? Most people's first pass goes 15–40h over. That's the whole point — it shows you which categories you're treating as 'always available' when they aren't."
    },
    {
      view: "reflect",
      title: "Reflect on it",
      body: "Switch to Reflect and answer the prompts in writing. The honest answers are what make this useful — they show you what you actually believe vs what you wish you believed.",
      selector: "#view-reflect .reflect-answer"
    },
    {
      kind: "outro",
      title: "That's the ideal week",
      body: "Come back at the end of the week with actuals to see where the gap is. Save this as a profile (Profile chip top-right → New profile…) so you can iterate without losing it. Tap the ? any time."
    }
  ];

  function startTutorial() {
    // Make sure tour is closed before opening tutorial.
    const tourOverlay = document.getElementById("tour");
    tourOverlay.hidden = false;
    tourOverlay.classList.add("interactive");

    let idx = 0;
    const spotlight = document.getElementById("tourSpotlight");
    const tooltip = document.getElementById("tourTooltip");
    const countEl = document.getElementById("tourCount");
    const titleEl = document.getElementById("tourTitle");
    const bodyEl = document.getElementById("tourBody");
    const backBtn = document.getElementById("tourBack");
    const nextBtn = document.getElementById("tourNext");
    const skipBtn = document.getElementById("tourSkip");

    function paint() {
      const step = TUTORIAL_STEPS[idx];
      // Set text BEFORE positioning so positionTooltip measures the new content's
      // width/height (tooltip is width:max-content, so dimensions depend on text).
      countEl.textContent = "Tutorial · Step " + (idx + 1) + " of " + TUTORIAL_STEPS.length;
      titleEl.textContent = step.title;
      bodyEl.textContent = step.body;
      backBtn.disabled = idx === 0;
      nextBtn.textContent = (idx === TUTORIAL_STEPS.length - 1) ? "Done" : "Next →";
      if (step.view && activeView !== step.view) {
        document.querySelector('.view-tab[data-view="' + step.view + '"]').click();
        setTimeout(positionSpot, 80);
      } else {
        positionSpot();
      }
    }
    function positionSpot() {
      const step = TUTORIAL_STEPS[idx];
      const collectTarget = () => {
        if (step.cat) {
          // Spotlight only the first row of the category to keep the highlight
          // compact enough that the tooltip always has room. The user can still
          // edit any row in that category — the overlay is non-blocking.
          const trs = rowsForCategory(step.cat);
          const row = trs[0] || null;
          const compactTarget = row && (window.innerWidth < 800 || window.innerHeight < 500)
            ? row.querySelector(".cell-sub, .num-input, .range-input")
            : row;
          return {
            rect: compactTarget ? compactTarget.getBoundingClientRect() : null,
            scroll: row
          };
        }
        if (step.kind === "total") {
          const stats = document.getElementById("stats");
          return { rect: stats ? stats.getBoundingClientRect() : null, scroll: stats };
        }
        if (step.selector) {
          const el = document.querySelector(step.selector);
          const compactElement = el && window.innerHeight < 500 && el.matches(".reflect-answer")
            ? el.closest(".prompt-card").querySelector(".prompt-text")
            : el;
          return {
            rect: compactElement ? compactElement.getBoundingClientRect() : null,
            scroll: el
          };
        }
        if (step.kind === "intro") {
          const brand = document.querySelector(".brand-titles");
          return { rect: brand ? brand.getBoundingClientRect() : null, scroll: brand };
        }
        if (step.kind === "outro") {
          const chip = document.getElementById("profileChip");
          return { rect: chip ? chip.getBoundingClientRect() : null, scroll: chip };
        }
        return { rect: null, scroll: null };
      };
      const t1 = collectTarget();
      if (t1.scroll) {
        const initialRect = t1.scroll.getBoundingClientRect();
        const targetTop = Math.max(0, window.scrollY + initialRect.top - 112);
        window.scrollTo({
          top: targetTop,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        });
      }
      const placementDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
      setTimeout(() => requestAnimationFrame(() => {
        const t2 = collectTarget();
        const rect = t2.rect;
        if (!rect) {
          spotlight.style.opacity = "0";
          tooltip.style.top = "50%";
          tooltip.style.left = "50%";
          tooltip.style.transform = "translate(-50%, -50%)";
          return;
        }
        spotlight.style.opacity = "1";
        const pad = 10;
        const previousSpot = spotlight.getBoundingClientRect();
        spotlight.style.top = (rect.top - pad) + "px";
        spotlight.style.left = (rect.left - pad) + "px";
        spotlight.style.width = (rect.width + pad * 2) + "px";
        spotlight.style.height = (rect.height + pad * 2) + "px";
        animateTourPlacement(spotlight, previousSpot, true);
        positionTooltip(rect);
      }), placementDelay);
    }
    function positionTooltip(r) {
      const previousTip = tooltip.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      tooltip.style.transform = "";
      tooltip.style.top = "0px"; tooltip.style.left = "0px";
      const tr = tooltip.getBoundingClientRect();
      const tw = tr.width, th = tr.height, margin = 14;
      // Spotlight has its own 10px pad in positionSpot; keep extra distance beyond it.
      const spotPad = 26;
      // Use the spotlight's actual rect (which includes the 10px pad) for collision checks.
      const sr = {
        top: r.top - 10, left: r.left - 10,
        right: r.right + 10, bottom: r.bottom + 10,
      };
      const rightRoom = vw - sr.right - margin;
      const leftRoom = sr.left - margin;
      const belowRoom = vh - sr.bottom - margin;
      const aboveRoom = sr.top - margin;
      let top, left;

      // Pick the placement that has the most room.
      const candidates = [
        { side: "right", room: rightRoom, fits: rightRoom >= tw },
        { side: "left", room: leftRoom, fits: leftRoom >= tw },
        { side: "below", room: belowRoom, fits: belowRoom >= th },
        { side: "above", room: aboveRoom, fits: aboveRoom >= th },
      ];
      const fits = candidates.filter(c => c.fits).sort((a, b) => b.room - a.room);
      const pick = fits[0] || candidates.sort((a, b) => b.room - a.room)[0];

      if (pick.side === "right") {
        left = sr.right + spotPad;
        top = Math.max(margin, Math.min(vh - th - margin, sr.top));
      } else if (pick.side === "left") {
        left = sr.left - spotPad - tw;
        top = Math.max(margin, Math.min(vh - th - margin, sr.top));
      } else if (pick.side === "below") {
        top = sr.bottom + spotPad;
        left = Math.max(margin, Math.min(vw - tw - margin, sr.left + (sr.right - sr.left) / 2 - tw / 2));
      } else { // above
        top = sr.top - th - spotPad;
        left = Math.max(margin, Math.min(vw - tw - margin, sr.left + (sr.right - sr.left) / 2 - tw / 2));
      }
      // Final clamp to viewport.
      top = Math.max(margin, Math.min(vh - th - margin, top));
      left = Math.max(margin, Math.min(vw - tw - margin, left));
      tooltip.style.top = top + "px";
      tooltip.style.left = left + "px";
      animateTourPlacement(tooltip, previousTip, false);
    }
    function next() {
      if (idx === TUTORIAL_STEPS.length - 1) return done();
      idx = Math.min(TUTORIAL_STEPS.length - 1, idx + 1);
      paint();
    }
    function back() { idx = Math.max(0, idx - 1); paint(); }
    function done() {
      tourOverlay.hidden = true;
      tourOverlay.classList.remove("interactive");
      detach();
    }
    function onKey(e) {
      if (e.key === "Escape") done();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    }
    function onResize() { positionSpot(); }
    function detach() {
      nextBtn.removeEventListener("click", next);
      backBtn.removeEventListener("click", back);
      skipBtn.removeEventListener("click", done);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    }
    nextBtn.addEventListener("click", next);
    backBtn.addEventListener("click", back);
    skipBtn.addEventListener("click", done);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    paint();
  }

  // ------ Global keyboard shortcuts ------
  document.addEventListener("keydown", function(e) {
    // Don't hijack typing in inputs/textareas/contenteditable
    const t = e.target;
    const isTyping = t && (
      t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable ||
      t.tagName === "SELECT"
    );
    if (!isTyping && e.key === "Escape" && selectedRows.size > 0 && !grabbedRow) {
      selectedRows.clear();
      lastClickedRowIdx = null;
      renderSelection();
      e.preventDefault();
      return;
    }
    // Allow Delete/Backspace as bulk-delete only when bulk-bar is visible AND not typing
    if (!isTyping && (e.key === "Delete" || e.key === "Backspace") && selectedRows.size > 0) {
      e.preventDefault();
      bulkDeleteSelected();
      return;
    }
    if (isTyping) return;
    // Don't fire shortcuts while any modal/tour is open
    if (!document.getElementById("whatIs").hidden) return;
    if (!document.getElementById("dataInfo").hidden) return;
    if (!document.getElementById("appDialog").hidden) return;
    if (!document.getElementById("distributionDialog").hidden) return;
    if (!document.getElementById("feedbackDialog").hidden) return;
    if (!document.getElementById("tour").hidden) return;
    const k = e.key;
    if (k === "1") { document.querySelector('.view-tab[data-view="worksheet"]').click(); e.preventDefault(); }
    else if (k === "2") { document.querySelector('.view-tab[data-view="compare"]').click(); e.preventDefault(); }
    else if (k === "3") { document.querySelector('.view-tab[data-view="reflect"]').click(); e.preventDefault(); }
    else if (k === "4") { document.querySelector('.view-tab[data-view="history"]').click(); e.preventDefault(); }
    else if (k === "t" || k === "T") { document.getElementById("themeBtn").click(); }
    else if (k === "i" || k === "I") {
      const next = inputMode === "numbers" ? "sliders" : "numbers";
      inputMode = next;
      try { localStorage.setItem("168-audit:input-mode", next); } catch (err) {}
      if (activeView === "worksheet") renderWorksheet();
    }
    else if (k === "n" && !e.shiftKey && !e.ctrlKey && !e.metaKey) { if (activeView === "worksheet") { addRow("sub"); e.preventDefault(); } }
    else if ((k === "N" || (k === "n" && e.shiftKey)) && !e.ctrlKey && !e.metaKey) { if (activeView === "worksheet") { addRow("cat"); e.preventDefault(); } }
    else if (k === "e" || k === "E") { document.getElementById("exportTrigger").click(); }
    else if (k === "?" || (k === "/" && e.shiftKey)) { document.getElementById("tourReplay").click(); e.preventDefault(); }
  });

  // ------ Init ------
  loadState();
  applyShareImportIfQueued();
  saveState();
  renderProfileChip();
  renderWorksheet();
  renderStats();
  if (recoveryNotice) {
    showToast(recoveryNotice, false);
    const status = document.getElementById("saveStatus");
    if (status) {
      status.textContent = "Recovery mode · previous browser data was unreadable";
      status.dataset.state = "error";
    }
  }
  // First-run: open the "What is this?" modal so users get context before being
  // dropped into a tour. The modal offers Quick tour / Full tutorial / Close.
  // Closing it (any path) marks TOUR_KEY so this doesn't show again.
  setTimeout(() => {
    try {
      if (localStorage.getItem(TOUR_KEY)) return;
      const trigger = document.getElementById("tourReplay");
      if (!trigger) return;
      trigger.click();
      // Mark seen as soon as we open — any close path counts as seen.
      try { localStorage.setItem(TOUR_KEY, "1"); } catch(e) {}
    } catch(e) {}
  }, 350);
})();
`;
}

const server = app.listen(PORT, () => console.log("168-audit listening on :" + PORT));

module.exports = app;
