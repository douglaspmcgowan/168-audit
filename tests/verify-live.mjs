// Playwright end-to-end verification of 168-audit.
// Run locally: node tests/verify-live.mjs              (defaults to http://localhost:3168)
// Run live:    node tests/verify-live.mjs https://168-audit.vercel.app
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";

const URL = process.argv[2] || "http://localhost:3168";
const SHOTS = path.resolve("tests/screenshots");
fs.mkdirSync(SHOTS, { recursive: true });

const errors = [];
const log = (...a) => console.log(...a);
const ok = (msg) => log("  ✓", msg);
const fail = (msg) => { errors.push(msg); log("  ✗", msg); };

async function inspectDesktop(browser) {
  log("\n=== Desktop (1440×900) ===");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // Suppress tour for the rest of the suite once we've inspected it.
  await ctx.addInitScript(() => { try { localStorage.setItem("168-audit:tour-seen", "1"); } catch(e) {} });
  page.on("pageerror", (e) => fail(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") fail(`console.error: ${m.text()}`); });

  log("\nLoad");
  const res = await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  if (!res || !res.ok()) fail(`HTTP ${res?.status()}`); else ok(`HTTP ${res.status()}`);
  const title = await page.title();
  /168/.test(title) ? ok(`title: ${title}`) : fail(`title: ${title}`);

  log("\nMasthead");
  const h1 = await page.locator(".brand-title").innerText();
  /168/.test(h1) ? ok(`brand title: ${h1}`) : fail(`h1: ${h1}`);
  const stats = await page.locator("#stats").innerText();
  /ideal/i.test(stats) && /actual/i.test(stats) ? ok(`stats: ${stats.replace(/\s+/g, " ").trim()}`) : fail(`stats: ${stats}`);
  const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  theme === "dark" ? ok("dark theme default") : fail(`theme: ${theme}`);

  await page.screenshot({ path: path.join(SHOTS, "01-worksheet-desktop-dark.png"), fullPage: true });
  ok("screenshot: 01-worksheet-desktop-dark.png");

  log("\nWorksheet rows");
  const rows = await page.locator("#view-worksheet tbody tr").count().catch(() => 0);
  const cards = await page.locator("#view-worksheet .row-card, #view-worksheet [data-row-id]").count().catch(() => 0);
  const rowCount = rows || cards;
  rowCount >= 18 ? ok(`${rowCount} seeded rows`) : fail(`only ${rowCount} rows`);

  log("\nEdit a cell + verify total");
  const firstIdeal = page.locator('input[data-field="ideal"]').first();
  await firstIdeal.fill("40");
  await firstIdeal.blur();
  await page.waitForTimeout(200);
  const statsText = await page.locator("#stats").innerText();
  /40/.test(statsText) ? ok(`stats shows 40: ${statsText.replace(/\s+/g, " ").trim()}`) : fail(`stats: ${statsText}`);
  const footTotal = await page.evaluate(() => {
    const tds = document.querySelectorAll("tfoot.audit-foot td");
    return tds.length ? Array.from(tds).map(t => t.textContent.trim()) : null;
  });
  footTotal && footTotal.some(t => /40/.test(t)) ? ok(`tfoot total: ${footTotal.join(" | ")}`) : fail(`tfoot total: ${JSON.stringify(footTotal)}`);

  log("\nInline-edit category label");
  const firstCat = page.locator('input.cell-cat').first();
  await firstCat.fill("Career");
  await firstCat.blur();
  await page.waitForTimeout(120);
  const catSaved = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("168-audit:v2") || "{}");
    return s.profiles?.[s.activeProfile]?.rows?.[0]?.category;
  });
  catSaved === "Career" ? ok(`category persisted: ${catSaved}`) : fail(`category not saved: ${catSaved}`);

  log("\nToggle to slider mode + per-row slider max");
  await page.click('.input-mode-btn[data-mode="sliders"]');
  await page.waitForTimeout(200);
  const sliders = await page.locator("input.range-input").count();
  sliders >= 30 ? ok(`${sliders} sliders rendered`) : fail(`only ${sliders} sliders`);
  // Mandatory Work + Sleep should be max=80; everything else <=20
  const maxes = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("#auditBody tr"));
    return rows.map(tr => {
      const sub = tr.querySelector(".cell-sub")?.value || "";
      const range = tr.querySelector("input.range-input");
      return { sub, max: range ? +range.max : null };
    });
  });
  const work = maxes.find(m => /mandatory work/i.test(m.sub));
  const sleep = maxes.find(m => /^Sleep$/i.test(m.sub));
  const hobby = maxes.find(m => /personal hobby/i.test(m.sub));
  const medical = maxes.find(m => /medical/i.test(m.sub));
  (work && work.max === 80) ? ok(`Mandatory Work slider max=80`) : fail(`Mandatory Work: ${JSON.stringify(work)}`);
  (sleep && sleep.max === 80) ? ok(`Sleep slider max=80`) : fail(`Sleep: ${JSON.stringify(sleep)}`);
  (hobby && hobby.max <= 20) ? ok(`Personal Hobby slider max=${hobby.max}`) : fail(`hobby: ${JSON.stringify(hobby)}`);
  (medical && medical.max <= 20) ? ok(`Medical slider max=${medical.max}`) : fail(`medical: ${JSON.stringify(medical)}`);

  const firstSlider = page.locator('input.range-input[data-field="actual"]').first();
  await firstSlider.evaluate((el) => { el.value = "12"; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); });
  await page.waitForTimeout(150);
  const sliderSaved = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("168-audit:v2") || "{}");
    return s.profiles?.[s.activeProfile]?.rows?.[0]?.actual;
  });
  sliderSaved === 12 ? ok(`slider value persisted: ${sliderSaved}`) : fail(`slider not saved: ${sliderSaved}`);
  await page.screenshot({ path: path.join(SHOTS, "02b-worksheet-sliders.png"), fullPage: true });
  ok("screenshot: 02b-worksheet-sliders.png");
  // Back to numbers for the rest
  await page.click('.input-mode-btn[data-mode="numbers"]');
  await page.waitForTimeout(150);

  log("\nCategory dividers (cat-start class on top-level transitions)");
  const dividerCount = await page.locator("#auditBody tr.cat-start").count();
  dividerCount >= 6 ? ok(`${dividerCount} category dividers in worksheet`) : fail(`only ${dividerCount} dividers`);

  log("\nFooter name");
  const footerText = await page.locator(".colophon").innerText();
  /Douglas McGowan/i.test(footerText) ? ok(`footer reads "Douglas"`) : fail(`footer: ${footerText.trim()}`);

  log("\nTheme toggle");
  await page.click("#themeBtn");
  await page.waitForTimeout(150);
  const themeAfter = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  themeAfter === "light" ? ok("toggled to light") : fail(`theme after toggle: ${themeAfter}`);
  await page.screenshot({ path: path.join(SHOTS, "02-worksheet-desktop-light.png"), fullPage: true });
  ok("screenshot: 02-worksheet-desktop-light.png");
  // back to dark for the rest
  await page.click("#themeBtn");
  await page.waitForTimeout(100);

  log("\nCompare view");
  await page.click('.view-tab[data-view="compare"]');
  await page.waitForTimeout(200);
  const compareVisible = await page.locator("#view-compare").isVisible();
  compareVisible ? ok("compare view visible") : fail("compare view hidden");
  await page.screenshot({ path: path.join(SHOTS, "03-compare-desktop.png"), fullPage: true });
  ok("screenshot: 03-compare-desktop.png");

  log("\nReflect view");
  await page.click('.view-tab[data-view="reflect"]');
  await page.waitForTimeout(200);
  const reflectVisible = await page.locator("#view-reflect").isVisible();
  reflectVisible ? ok("reflect view visible") : fail("reflect view hidden");
  const reflectText = await page.locator("#view-reflect").innerText();
  /168/.test(reflectText) || /sabbath/i.test(reflectText) || /reflection/i.test(reflectText) ? ok("reflect content rendered") : fail("reflect missing prompts");
  await page.screenshot({ path: path.join(SHOTS, "04-reflect-desktop.png"), fullPage: true });
  ok("screenshot: 04-reflect-desktop.png");

  log("\nAdd Subcategory + Add Category buttons");
  await page.click('.view-tab[data-view="worksheet"]');
  await page.waitForTimeout(150);
  const before = await page.locator("#auditBody tr").count();
  const dividersBefore = await page.locator("#auditBody tr.cat-start").count();
  await page.click("#addSubBtn");
  await page.waitForTimeout(150);
  const afterSub = await page.locator("#auditBody tr").count();
  const dividersAfterSub = await page.locator("#auditBody tr.cat-start").count();
  (afterSub === before + 1 && dividersAfterSub === dividersBefore)
    ? ok(`+ Subcategory: rows ${before}→${afterSub}, dividers unchanged at ${dividersAfterSub}`)
    : fail(`+ Subcategory rows=${afterSub} dividers=${dividersAfterSub}`);
  await page.click("#addCatBtn");
  await page.waitForTimeout(150);
  const afterCat = await page.locator("#auditBody tr").count();
  const dividersAfterCat = await page.locator("#auditBody tr.cat-start").count();
  (afterCat === afterSub + 1 && dividersAfterCat === dividersAfterSub + 1)
    ? ok(`+ Category: rows ${afterSub}→${afterCat}, dividers +1 to ${dividersAfterCat}`)
    : fail(`+ Category rows=${afterCat} dividers=${dividersAfterCat}`);

  log("\nChrome height parity");
  const heights = await page.evaluate(() => {
    function h(sel) { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().height * 10) / 10 : null; }
    return { profile: h(".profile-chip"), viewmode: h(".viewmode-toggle"), replay: h(".tour-replay"), theme: h(".theme-toggle") };
  });
  const allEqual = [heights.profile, heights.viewmode, heights.replay, heights.theme].every(v => v && Math.abs(v - heights.profile) <= 1);
  allEqual ? ok(`chrome heights match: ${JSON.stringify(heights)}`) : fail(`chrome heights differ: ${JSON.stringify(heights)}`);

  log("\nFAB widths: trigger == menu items");
  await page.click("#exportTrigger");
  await page.waitForTimeout(160);
  const fabWidths = await page.evaluate(() => {
    function w(sel) { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().width) : null; }
    const triggerW = w("#exportTrigger");
    const menuWidths = Array.from(document.querySelectorAll(".export-menu .export-btn")).map(b => Math.round(b.getBoundingClientRect().width));
    return { trigger: triggerW, menu: menuWidths };
  });
  const fabAllEqual = fabWidths.menu.length === 4 && fabWidths.menu.every(w => Math.abs(w - fabWidths.trigger) <= 2);
  fabAllEqual ? ok(`FAB widths match: trigger=${fabWidths.trigger}, menu=${fabWidths.menu.join(",")}`) : fail(`FAB widths differ: ${JSON.stringify(fabWidths)}`);
  await page.click("#exportTrigger"); // close
  await page.waitForTimeout(120);

  log("\nSticky stats bar appears on scroll");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(350);
  const beforeScroll = await page.evaluate(() => document.getElementById("statsSticky").classList.contains("visible"));
  beforeScroll === false ? ok("sticky bar hidden at top") : fail(`sticky bar visible at top: ${beforeScroll}`);
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(350);
  const afterScroll = await page.evaluate(() => document.getElementById("statsSticky").classList.contains("visible"));
  afterScroll ? ok("sticky bar visible after scroll") : fail("sticky bar didn't appear on scroll");
  await page.screenshot({ path: path.join(SHOTS, "01c-sticky-stats.png"), fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(350);

  log("\nExport FAB (click trigger, menu opens, click CSV)");
  const fabBefore = await page.evaluate(() => document.getElementById("exportBar").dataset.open);
  fabBefore === "false" ? ok("FAB starts closed") : fail(`FAB initial state: ${fabBefore}`);
  await page.click("#exportTrigger");
  await page.waitForTimeout(180);
  const fabAfter = await page.evaluate(() => document.getElementById("exportBar").dataset.open);
  fabAfter === "true" ? ok("FAB opens on click") : fail(`FAB open state: ${fabAfter}`);
  const csvErrors = [];
  page.on("pageerror", (e) => csvErrors.push(e.message));
  await page.click('#exportCsv').catch(() => fail("exportCsv click failed"));
  await page.waitForTimeout(180);
  csvErrors.length === 0 ? ok("CSV export ran without errors") : fail("CSV export errors: " + csvErrors.join("; "));
  const fabClosed = await page.evaluate(() => document.getElementById("exportBar").dataset.open);
  fabClosed === "false" ? ok("FAB auto-closes after export click") : fail(`FAB after export: ${fabClosed}`);

  log("\nLocalStorage v2 + profile persistence");
  const stored = await page.evaluate(() => localStorage.getItem("168-audit:v2"));
  stored && stored.length > 10 ? ok(`localStorage v2 has ${stored.length} chars`) : fail(`localStorage v2: ${stored}`);
  const profileShape = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("168-audit:v2") || "{}");
    return { active: s.activeProfile, count: Object.keys(s.profiles || {}).length, name: s.profiles?.[s.activeProfile]?.name };
  });
  profileShape.active && profileShape.count >= 1 && profileShape.name ? ok(`profile: active="${profileShape.active}", ${profileShape.count} total, name="${profileShape.name}"`) : fail(`profile shape: ${JSON.stringify(profileShape)}`);

  log("\nProfile picker: create a 2nd profile via dialog");
  page.once("dialog", async d => { await d.accept("Summer schedule"); });
  await page.click("#profileChip");
  await page.waitForTimeout(120);
  await page.click('[data-action="new"]');
  await page.waitForTimeout(180);
  const after2 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("168-audit:v2") || "{}");
    return { count: Object.keys(s.profiles).length, activeName: s.profiles[s.activeProfile].name };
  });
  after2.count === 2 && after2.activeName === "Summer schedule" ? ok(`new profile created: active="${after2.activeName}", total=${after2.count}`) : fail(`profile create: ${JSON.stringify(after2)}`);

  log("\nReflect: type an answer, verify it's saved");
  await page.click('.view-tab[data-view="reflect"]');
  await page.waitForTimeout(200);
  const firstAnswer = page.locator(".reflect-answer").first();
  await firstAnswer.fill("I'd cut social media first.");
  await firstAnswer.blur();
  await page.waitForTimeout(120);
  const reflSaved = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("168-audit:v2") || "{}");
    const refs = s.profiles?.[s.activeProfile]?.reflections || {};
    return Object.values(refs)[0] || null;
  });
  reflSaved === "I'd cut social media first." ? ok(`reflect answer saved`) : fail(`reflect answer: ${reflSaved}`);
  await page.screenshot({ path: path.join(SHOTS, "04b-reflect-answers.png"), fullPage: true });
  ok("screenshot: 04b-reflect-answers.png");

  log("\nApp/Dashboard toggle");
  await page.click('.view-tab[data-view="worksheet"]');
  await page.waitForTimeout(120);
  await page.click('#vmApp');
  await page.waitForTimeout(150);
  const mode = await page.evaluate(() => document.body.dataset.mode);
  mode === "app" ? ok("body[data-mode] = app") : fail(`body[data-mode]: ${mode}`);
  await page.screenshot({ path: path.join(SHOTS, "01b-worksheet-app-mode.png"), fullPage: true });
  ok("screenshot: 01b-worksheet-app-mode.png");
  await page.click('#vmDashboard');
  await page.waitForTimeout(120);

  log("\n? button opens What-is-this modal (tour + tutorial + close)");
  await page.click("#tourReplay");
  await page.waitForTimeout(160);
  const modalOpen = await page.evaluate(() => !document.getElementById("whatIs").hidden);
  modalOpen ? ok("? opens modal") : fail("? did not open modal");
  const modalCheck = await page.evaluate(() => {
    const m = document.getElementById("whatIs");
    return {
      title: m.querySelector(".modal-title")?.textContent || "",
      hasTour: !!m.querySelector("#startTourBtn"),
      hasTutorial: !!m.querySelector("#startTutorialBtn"),
    };
  });
  /168/.test(modalCheck.title) && modalCheck.hasTour && modalCheck.hasTutorial
    ? ok(`modal: "${modalCheck.title}" + tour + tutorial buttons`)
    : fail(`modal shape: ${JSON.stringify(modalCheck)}`);
  await page.screenshot({ path: path.join(SHOTS, "10-what-is-modal.png"), fullPage: false });

  log("\nLaunch quick tour from modal");
  await page.click("#startTourBtn");
  await page.waitForTimeout(300);
  const tourVisible = await page.evaluate(() => !document.getElementById("tour").hidden);
  tourVisible ? ok("tour launches from modal") : fail("tour didn't open from modal");
  const totalSteps = await page.evaluate(() => parseInt(document.getElementById("tourCount").textContent.split(" of ")[1] || "0"));
  totalSteps >= 8 ? ok(`tour has ${totalSteps} steps`) : fail(`tour steps: ${totalSteps}`);
  await page.screenshot({ path: path.join(SHOTS, "09a-tour-step-1.png"), fullPage: false });
  for (let i = 0; i < 4; i++) { await page.click("#tourNext"); await page.waitForTimeout(150); }
  await page.screenshot({ path: path.join(SHOTS, "09b-tour-step-5.png"), fullPage: false });
  await page.click("#tourSkip");
  await page.waitForTimeout(150);
  const tourClosed = await page.evaluate(() => document.getElementById("tour").hidden && localStorage.getItem("168-audit:tour-seen") === "1");
  tourClosed ? ok("tour closes + marks seen") : fail("tour didn't close cleanly");

  log("\nLaunch full tutorial from modal");
  await page.click("#tourReplay");
  await page.waitForTimeout(120);
  await page.click("#startTutorialBtn");
  await page.waitForTimeout(300);
  const tut = await page.evaluate(() => {
    const t = document.getElementById("tour");
    return {
      open: !t.hidden,
      interactive: t.classList.contains("interactive"),
      count: document.getElementById("tourCount").textContent
    };
  });
  tut.open && tut.interactive && /Tutorial · Step 1 of/.test(tut.count)
    ? ok(`tutorial open + interactive: ${tut.count}`)
    : fail(`tutorial state: ${JSON.stringify(tut)}`);
  await page.screenshot({ path: path.join(SHOTS, "11-tutorial-step-1.png"), fullPage: false });
  // Walk to step 4 to verify category step (Eating w/ People)
  for (let i = 0; i < 3; i++) { await page.click("#tourNext"); await page.waitForTimeout(150); }
  await page.screenshot({ path: path.join(SHOTS, "11b-tutorial-category-step.png"), fullPage: false });
  await page.click("#tourSkip");
  await page.waitForTimeout(150);

  log("\nColumn-width stability: range value width fixed regardless of value");
  // Go back to sliders; check that the .range-val element width is constant for 0 vs 80
  await page.click('.input-mode-btn[data-mode="sliders"]');
  await page.waitForTimeout(180);
  const valWidths = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll("#auditBody .range-cell"));
    if (!cells.length) return null;
    const a = cells[0].getBoundingClientRect().width;
    const b = cells[cells.length - 1].getBoundingClientRect().width;
    return { a: Math.round(a), b: Math.round(b) };
  });
  valWidths && Math.abs(valWidths.a - valWidths.b) <= 1
    ? ok(`range-cell widths consistent: ${valWidths.a}px == ${valWidths.b}px`)
    : fail(`range-cell widths differ: ${JSON.stringify(valWidths)}`);
  await page.click('.input-mode-btn[data-mode="numbers"]');
  await page.waitForTimeout(150);

  await ctx.close();
}

async function inspectMobile(browser) {
  log("\n=== Mobile (375×812, iPhone 13) ===");
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  await ctx.addInitScript(() => { try { localStorage.setItem("168-audit:tour-seen", "1"); } catch(e) {} });
  page.on("pageerror", (e) => fail(`pageerror: ${e.message}`));

  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });

  log("\nMobile chrome: profile chip + viewmode + FAB visible and contained");
  const chromeCheck = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    function info(sel) {
      const el = document.querySelector(sel);
      if (!el) return { sel, present: false };
      const r = el.getBoundingClientRect();
      return { sel, present: true, right: Math.round(r.right), within: r.right <= vw + 1 && r.left >= -1 };
    }
    return [info(".profile-chip"), info(".viewmode-toggle"), info(".export-fab")];
  });
  chromeCheck.forEach(c => {
    if (!c.present) fail(`${c.sel} missing on mobile`);
    else if (!c.within) fail(`${c.sel} overflows mobile viewport (right=${c.right})`);
    else ok(`${c.sel} fits mobile`);
  });

  log("\nMobile masthead + viewport");
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  overflowX <= 1 ? ok(`no horizontal overflow (${overflowX}px)`) : fail(`horizontal overflow: ${overflowX}px`);
  await page.screenshot({ path: path.join(SHOTS, "05-worksheet-mobile-dark.png"), fullPage: true });
  ok("screenshot: 05-worksheet-mobile-dark.png");

  log("\nMobile: tap Compare tab");
  await page.click('.view-tab[data-view="compare"]');
  await page.waitForTimeout(200);
  const overflowCompare = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  overflowCompare <= 1 ? ok("compare: no overflow") : fail(`compare overflow: ${overflowCompare}px`);
  const exportHidden = await page.evaluate(() => {
    const el = document.querySelector(".export-fab");
    if (!el) return "no-export-fab";
    const cs = getComputedStyle(el);
    return cs.display === "none" ? "hidden" : "visible";
  });
  exportHidden === "hidden" ? ok("export FAB hidden on Compare view") : fail(`export FAB on Compare: ${exportHidden}`);
  await page.screenshot({ path: path.join(SHOTS, "06-compare-mobile.png"), fullPage: true });
  ok("screenshot: 06-compare-mobile.png");

  log("\nMobile: tap Reflect tab");
  await page.click('.view-tab[data-view="reflect"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SHOTS, "07-reflect-mobile.png"), fullPage: true });
  ok("screenshot: 07-reflect-mobile.png");

  log("\nMobile: 320px minimum");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(150);
  const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  overflow320 <= 1 ? ok("320px: no overflow") : fail(`320px overflow: ${overflow320}px`);
  await page.screenshot({ path: path.join(SHOTS, "08-worksheet-320.png"), fullPage: true });
  ok("screenshot: 08-worksheet-320.png");

  await ctx.close();
}

(async () => {
  log(`\nVerifying: ${URL}`);
  const browser = await chromium.launch();
  try {
    await inspectDesktop(browser);
    await inspectMobile(browser);
  } catch (e) {
    fail("uncaught: " + e.message);
  } finally {
    await browser.close();
  }
  log("\n=== Summary ===");
  if (errors.length === 0) {
    log("All checks passed.");
    process.exit(0);
  } else {
    log(`${errors.length} failures:`);
    errors.forEach((e) => log("  -", e));
    process.exit(1);
  }
})();
