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
  const catSaved = await page.evaluate(() => JSON.parse(localStorage.getItem("168-audit:v1") || "{}").rows?.[0]?.category);
  catSaved === "Career" ? ok(`category persisted: ${catSaved}`) : fail(`category not saved: ${catSaved}`);

  log("\nToggle to slider mode");
  await page.click('.input-mode-btn[data-mode="sliders"]');
  await page.waitForTimeout(200);
  const sliders = await page.locator("input.range-input").count();
  sliders >= 30 ? ok(`${sliders} sliders rendered`) : fail(`only ${sliders} sliders`);
  const firstSlider = page.locator('input.range-input[data-field="actual"]').first();
  await firstSlider.evaluate((el) => { el.value = "12"; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); });
  await page.waitForTimeout(150);
  const sliderSaved = await page.evaluate(() => JSON.parse(localStorage.getItem("168-audit:v1") || "{}").rows?.[0]?.actual);
  sliderSaved === 12 ? ok(`slider value persisted: ${sliderSaved}`) : fail(`slider not saved: ${sliderSaved}`);
  await page.screenshot({ path: path.join(SHOTS, "02b-worksheet-sliders.png"), fullPage: true });
  ok("screenshot: 02b-worksheet-sliders.png");
  // Back to numbers for the rest
  await page.click('.input-mode-btn[data-mode="numbers"]');
  await page.waitForTimeout(150);

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

  log("\nAdd row");
  await page.click('.view-tab[data-view="worksheet"]');
  await page.waitForTimeout(150);
  const before = await page.locator("[data-row-id], #view-worksheet tbody tr").count();
  const addBtn = page.locator('#addRowBtn, button:has-text("Add row"), button:has-text("+ Add")').first();
  if (await addBtn.count()) {
    await addBtn.click();
    await page.waitForTimeout(150);
    const after = await page.locator("[data-row-id], #view-worksheet tbody tr").count();
    after > before ? ok(`add row: ${before} → ${after}`) : fail(`add row didn't grow: ${before} → ${after}`);
  } else {
    fail("no add-row button found");
  }

  log("\nExport CSV (no actual download — just verify handler doesn't error)");
  const csvErrors = [];
  page.on("pageerror", (e) => csvErrors.push(e.message));
  // Try export — most are anchor-download or blob URL, so we just click + verify no errors
  await page.click('#exportCsv').catch(() => fail("exportCsv click failed"));
  await page.waitForTimeout(150);
  csvErrors.length === 0 ? ok("CSV export ran without errors") : fail("CSV export errors: " + csvErrors.join("; "));

  log("\nLocalStorage persistence");
  const stored = await page.evaluate(() => localStorage.getItem("168-audit:v1"));
  stored && stored.length > 10 ? ok(`localStorage has ${stored.length} chars saved`) : fail(`localStorage: ${stored}`);

  await ctx.close();
}

async function inspectMobile(browser) {
  log("\n=== Mobile (375×812, iPhone 13) ===");
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => fail(`pageerror: ${e.message}`));

  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });

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
    const el = document.querySelector(".export-bar");
    if (!el) return "no-export-bar";
    const cs = getComputedStyle(el);
    return cs.display === "none" ? "hidden" : "visible";
  });
  exportHidden === "hidden" ? ok("export bar hidden on Compare view") : fail(`export bar on Compare: ${exportHidden}`);
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
