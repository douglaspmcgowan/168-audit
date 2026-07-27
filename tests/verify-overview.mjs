import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const url = process.argv[2] || "http://localhost:3168";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
await context.addInitScript(() => localStorage.setItem("168-audit:intro-seen-v2", "1"));
const page = await context.newPage();
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

try {
  await page.goto(url, { waitUntil: "networkidle" });
  if (await page.locator("#whatIs").isVisible()) await page.locator("#whatIs button[data-close]").first().click();
  await page.locator("#categoryViewAll").click();

  const overview = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("#auditBody tr")];
    const categoryStarts = rows.filter((row) => row.classList.contains("cat-start"));
    const download = document.querySelector("#exportTrigger").getBoundingClientRect();
    const help = document.querySelector("#tourReplay").getBoundingClientRect();
    return {
      mode: document.querySelector("#view-worksheet")?.dataset.categoryView,
      visibleRows: rows.filter((row) => !row.classList.contains("mobile-category-hidden")).length,
      totalRows: rows.length,
      categoryStarts: categoryStarts.length,
      coloredStarts: categoryStarts.filter((row) => row.style.getPropertyValue("--category-color")).length,
      download: [download.width, download.height],
      help: [help.width, help.height],
      chartLabel: document.querySelector("#worksheetDonutBtn")?.getAttribute("aria-label"),
    };
  });
  check(overview.mode === "all", `expected all mode, got ${overview.mode}`);
  check(overview.visibleRows === overview.totalRows, "all mode hides worksheet rows");
  check(overview.coloredStarts === overview.categoryStarts, "category groups lack stable colors");
  check(overview.chartLabel?.includes("Expand"), "worksheet donut has no accessible expand action");
  check(
    overview.download[0] === overview.help[0] && overview.download[1] === overview.help[1],
    `download control ${overview.download} does not match help ${overview.help}`,
  );

  await page.locator("#inputModeBtn").click();
  const slider = await page.locator(".range-input").first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { height: rect.height, width: rect.width };
  });
  check(slider.height >= 44, `slider hit area is ${slider.height}px`);
  check(slider.width >= 150, `slider width is ${slider.width}px`);

  await page.locator("#worksheetDonutBtn").click();
  check(await page.locator("#distributionDialog").isVisible(), "distribution dialog did not open");
  check(await page.locator("#distributionDialog .legend li").count() > 0, "distribution legend is empty");
  await page.keyboard.press("Escape");
  check(await page.locator("#distributionDialog").isHidden(), "distribution dialog did not close");
  check(await page.locator("#worksheetDonutBtn").evaluate((el) => document.activeElement === el), "chart focus was not restored");

  const axe = await new AxeBuilder({ page }).include("#view-worksheet").analyze();
  check(axe.violations.length === 0, `axe violations: ${axe.violations.map((item) => item.id).join(", ")}`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "375px overview overflows");
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Overview interaction verification passed.");
