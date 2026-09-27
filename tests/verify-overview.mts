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
      toggleParent: document.querySelector("#categoryViewAll")?.closest(".worksheet-toolbar")?.className,
      chartParent: document.querySelector("#worksheetDonutBtn")?.closest(".masthead-stats")?.id,
      categoryCells: document.querySelectorAll("#auditBody td.col-cat").length,
      categorySelectors: document.querySelectorAll("#auditBody td.col-cat [data-select-row]").length,
      firstCategorySpan: Number(document.querySelector("#auditBody td.col-cat")?.getAttribute("rowspan")),
      firstSubcategoryLabel: document.querySelector("#auditBody tr [data-select-row]")?.getAttribute("aria-label"),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  check(overview.mode === "all", `expected all mode, got ${overview.mode}`);
  check(overview.visibleRows === overview.totalRows, "all mode hides worksheet rows");
  check(overview.coloredStarts === overview.categoryStarts, "category groups lack stable colors");
  check(overview.chartLabel?.includes("Expand"), "worksheet donut has no accessible expand action");
  check(overview.toggleParent?.includes("worksheet-toolbar"), "category view toggle is outside the row-action toolbar");
  check(overview.chartParent === "stats", "allocation donut is outside the weekly summary");
  check(overview.categoryCells === overview.categoryStarts, "category labels do not map one-to-one to category groups");
  check(overview.categorySelectors === 0, "category panel duplicates the subcategory selection control");
  check(overview.firstCategorySpan > 1, "first category panel does not visually span its child rows");
  check(overview.firstSubcategoryLabel === "Select Mandatory Work", `first child selector is mislabeled: ${overview.firstSubcategoryLabel}`);
  check(overview.overflow <= 1, `All view overflows horizontally by ${overview.overflow}px`);
  check(
    overview.download[0] === overview.help[0] && overview.download[1] === overview.help[1],
    `download control ${overview.download} does not match help ${overview.help}`,
  );

  const firstRow = page.locator("#auditBody tr").first();
  const firstCategoryInput = firstRow.locator(".cell-cat");
  await firstCategoryInput.click();
  check(await page.locator("#auditBody tr.selected").count() === 0, "editing a category title selects its row");
  const originalCategory = await firstCategoryInput.inputValue();
  await firstCategoryInput.fill("");
  await firstCategoryInput.pressSequentially("Career");
  check(await firstCategoryInput.inputValue() === "Career", "category title loses characters during ordinary typing");
  check(await firstCategoryInput.evaluate((element) => document.activeElement === element), "category typing loses focus");
  await firstCategoryInput.fill(originalCategory);
  await firstCategoryInput.press("Tab");
  const hoverBounds = await firstRow.evaluate((row) => {
    const title = row.querySelector(".cell-cat").getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    return { title: title.width, row: rowRect.width };
  });
  check(hoverBounds.title < hoverBounds.row * 0.75, `category title hover width ${hoverBounds.title}px spans the ${hoverBounds.row}px row`);

  await firstRow.locator("[data-select-row]:visible").click();
  check(await page.locator("#auditBody tr.selected").count() === 1, "explicit row selector did not select");
  await page.locator("#auditBody tr").nth(1).locator(".cell-sub").click();
  check(await page.locator("#auditBody tr.selected").count() === 0, "editing another row leaves stale selection active");
  await firstRow.locator("[data-select-row]:visible").click();
  await page.locator(".brand-title").click();
  check(await page.locator("#auditBody tr.selected").count() === 0, "page-level outside click leaves stale selection active");
  await firstRow.locator("[data-select-row]:visible").click();
  await page.locator(".worksheet-commandbar").click({ position: { x: 2, y: 2 } });
  check(await page.locator("#auditBody tr.selected").count() === 0, "worksheet background did not clear row selection");
  await firstRow.locator("[data-select-row]:visible").click();
  await page.keyboard.press("Escape");
  check(await page.locator("#auditBody tr.selected").count() === 0, "Escape did not clear row selection");

  const numericGeometry = await page.locator(".num-input").evaluateAll((elements) =>
    elements.filter((element) => element.getClientRects().length).slice(0, 6).map((element) => {
      const style = getComputedStyle(element);
      return {
        width: element.getBoundingClientRect().width,
        numeric: style.fontVariantNumeric,
        align: style.textAlign,
      };
    }),
  );
  check(new Set(numericGeometry.map((item) => item.width)).size === 1, "numeric inputs change width with their values");
  check(numericGeometry.every((item) => item.numeric.includes("tabular-nums")), "numeric inputs lack tabular figures");
  check(numericGeometry.every((item) => item.align === "right"), "numeric inputs are not right aligned");

  const rowControlSizes = await page.locator(".row-select-btn:visible, .row-reorder-btn:visible").evaluateAll((elements) =>
    elements.slice(0, 8).map((element) => {
      const rect = element.getBoundingClientRect();
      return [rect.width, rect.height];
    }),
  );
  check(rowControlSizes.every(([width, height]) => width >= 44 && height >= 44), `row controls miss 44px: ${JSON.stringify(rowControlSizes)}`);

  const firstSubcategoryBefore = await page.locator("#auditBody tr").first().locator(".cell-sub").inputValue();
  const firstSubHandle = page.locator("#auditBody tr").first().locator('[data-reorder-kind="subcategory"]:visible');
  await firstSubHandle.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(() => document.activeElement?.dataset.reorderKind === "subcategory");
  await page.keyboard.press("Enter");
  check(
    (await page.locator("#auditBody tr").nth(1).locator(".cell-sub").inputValue()) === firstSubcategoryBefore,
    "first subcategory did not reorder independently",
  );
  check(
    (await page.locator("#auditBody tr.cat-start").first().getAttribute("data-category")) === originalCategory,
    "moving the first subcategory moved its whole category",
  );

  const reorderBefore = await page.evaluate(() => {
    const row = document.querySelector("#auditBody tr");
    return { category: row.dataset.category, color: row.style.getPropertyValue("--category-color") };
  });
  const firstHandle = page.locator("[data-reorder-row]:visible").first();
  await firstHandle.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(() => document.activeElement?.classList.contains("row-reorder-btn"));
  await page.keyboard.press("Enter");
  const reorderAfter = await page.evaluate((category) => {
    const categories = [...document.querySelectorAll("#auditBody tr.cat-start")];
    const moved = categories.find((row) => row.dataset.category === category);
    return {
      first: categories[0]?.dataset.category,
      color: moved?.style.getPropertyValue("--category-color"),
      focused: document.activeElement?.classList.contains("row-reorder-btn"),
    };
  }, reorderBefore.category);
  check(reorderAfter.first !== reorderBefore.category, "keyboard reorder did not move the first category");
  check(reorderAfter.color === reorderBefore.color, "category color changed after reordering");
  check(reorderAfter.focused, "keyboard reorder did not preserve handle focus");
  check((await page.locator("#reorderLive").textContent())?.includes(reorderBefore.category), "category reorder announcement names the wrong object");
  await page.reload({ waitUntil: "networkidle" });
  check(
    (await page.locator("#auditBody tr.cat-start").first().getAttribute("data-category")) === reorderAfter.first,
    "reordered category did not persist after reload",
  );
  const dragFirstCategory = await page.locator("#auditBody tr.cat-start").first().getAttribute("data-category");
  await page.locator("#auditBody tr.cat-start").first().locator('[data-reorder-kind="category"]:visible').dragTo(
    page.locator("#auditBody tr.cat-start").nth(1).locator('[data-reorder-kind="category"]:visible'),
  );
  check(
    (await page.locator("#auditBody tr.cat-start").first().getAttribute("data-category")) !== dragFirstCategory,
    "pointer drag did not reorder a category group",
  );

  const touchSource = page.locator("#auditBody tr.cat-start").first().locator('[data-reorder-kind="category"]:visible');
  const touchTarget = page.locator("#auditBody tr.cat-start").nth(1).locator('[data-reorder-kind="category"]:visible');
  const touchSourceCategory = await page.locator("#auditBody tr.cat-start").first().getAttribute("data-category");
  const touchTargetBox = await touchTarget.boundingBox();
  await touchSource.dispatchEvent("pointerdown", { pointerId: 7, pointerType: "touch", clientX: 10, clientY: 10 });
  await touchSource.dispatchEvent("pointermove", {
    pointerId: 7,
    pointerType: "touch",
    clientX: touchTargetBox.x + touchTargetBox.width / 2,
    clientY: touchTargetBox.y + touchTargetBox.height / 2,
  });
  await touchSource.dispatchEvent("pointerup", {
    pointerId: 7,
    pointerType: "touch",
    clientX: touchTargetBox.x + touchTargetBox.width / 2,
    clientY: touchTargetBox.y + touchTargetBox.height / 2,
  });
  check(
    (await page.locator("#auditBody tr.cat-start").first().getAttribute("data-category")) !== touchSourceCategory,
    "touch-pointer drag did not reorder a category group",
  );
  const movableIndex = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("#auditBody tr")];
    return rows.findIndex((row, index) => rows[index + 1]?.dataset.category === row.dataset.category && !row.classList.contains("cat-start"));
  });
  if (movableIndex >= 0) {
    const movableRow = page.locator("#auditBody tr").nth(movableIndex);
    await movableRow.locator("[data-select-row]:visible").click();
    await page.locator("#bulkMoveDown").click();
    await page.waitForFunction(() => document.activeElement?.classList.contains("row-reorder-btn"));
    check(
      await page.evaluate(() => document.activeElement?.classList.contains("row-reorder-btn")),
      "bulk move did not restore focus to the moved row",
    );
  } else {
    check(false, "fixture has no movable subcategory for bulk-focus verification");
  }

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
  await page.locator("#distributionDialog .modal-close").waitFor({ state: "visible" });
  await page.locator("#distributionDialog .modal-close").focus();
  await page.keyboard.press("Escape");
  check(await page.locator("#distributionDialog").isHidden(), "distribution dialog did not close");
  check(await page.locator("#worksheetDonutBtn").evaluate((el) => document.activeElement === el), "chart focus was not restored");

  const axe = await new AxeBuilder({ page }).include("#view-worksheet").analyze();
  check(axe.violations.length === 0, `axe violations: ${axe.violations.map((item) => item.id).join(", ")}`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "375px overview overflows");

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await desktopContext.addInitScript(() => {
    localStorage.setItem("168-audit:intro-seen-v2", "1");
    localStorage.setItem("168-audit:category-view", "all");
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: "networkidle" });
  await desktopPage.locator("#categoryViewFocus").click();
  const desktopFocus = await desktopPage.evaluate(() => {
    const rows = [...document.querySelectorAll("#auditBody tr")];
    const picker = document.querySelector(".mobile-category-nav");
    return {
      mode: document.querySelector("#view-worksheet")?.dataset.categoryView,
      pickerVisible: picker && getComputedStyle(picker).display !== "none" && !picker.hidden,
      selected: document.querySelector("#mobileCategory")?.value,
      visibleRows: rows.filter((row) => getComputedStyle(row).display !== "none").length,
      totalRows: rows.length,
    };
  });
  check(desktopFocus.mode === "focus", `desktop Focus did not set mode: ${JSON.stringify(desktopFocus)}`);
  check(desktopFocus.pickerVisible, `desktop Focus hides its category picker: ${JSON.stringify(desktopFocus)}`);
  check(
    desktopFocus.selected && desktopFocus.visibleRows > 0 && desktopFocus.visibleRows < desktopFocus.totalRows,
    `desktop Focus leaves every category visible: ${JSON.stringify(desktopFocus)}`,
  );
  const toggleTypography = await desktopPage.locator(
    ".plan-stage-toggle button, .category-view-toggle button",
  ).evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    return { label: element.textContent.trim(), fontSize: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight) };
  }));
  check(
    toggleTypography.every(({ fontSize, lineHeight }) => Math.abs(fontSize - 14) < 0.1 && Math.abs(lineHeight - 19.6) < 0.1),
    `toggle groups diverge from UI typography tokens: ${JSON.stringify(toggleTypography)}`,
  );
  const desktopRowTargets = await desktopPage.locator(
    "#auditBody .num-input:visible, #auditBody .notes-input:visible, #auditBody .del-btn:visible",
  ).evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { type: element.className, width: rect.width, height: rect.height };
  }));
  check(
    desktopRowTargets.every(({ width, height }) => width >= 44 && height >= 44),
    `desktop worksheet controls miss 44px: ${JSON.stringify(desktopRowTargets.filter(({ width, height }) => width < 44 || height < 44))}`,
  );
  await desktopContext.close();

  const responsiveContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await responsiveContext.addInitScript(() => {
    localStorage.setItem("168-audit:intro-seen-v2", "1");
    localStorage.setItem("168-audit:category-view", "all");
  });
  const responsivePage = await responsiveContext.newPage();
  await responsivePage.goto(url, { waitUntil: "networkidle" });
  for (const width of [390, 320]) {
    await responsivePage.setViewportSize({ width, height: 844 });
    const subcategoryWidth = await responsivePage.locator("#auditBody tr").first().locator(".cell-sub").evaluate((element) =>
      Math.round(element.getBoundingClientRect().width),
    );
    check(subcategoryWidth >= 120, `${width}px subcategory name collapses to ${subcategoryWidth}px`);
  }
  await responsivePage.locator("#exportTrigger").click();
  const compactTargets = await responsivePage.locator(
    "#categoryViewFocus, #categoryViewAll, #auditBody .cell-sub:visible, .data-menu-action, .data-menu-footer .text-action",
  ).evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { label: element.id || element.getAttribute("aria-label") || element.textContent.trim(), width: rect.width, height: rect.height };
  }));
  check(
    compactTargets.every(({ width, height }) => width >= 44 && height >= 44),
    `interactive controls miss 44px: ${JSON.stringify(compactTargets.filter(({ width, height }) => width < 44 || height < 44))}`,
  );
  await responsiveContext.close();

  const tabletContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  await tabletContext.addInitScript(() => {
    localStorage.setItem("168-audit:intro-seen-v2", "1");
    localStorage.setItem("168-audit:category-view", "all");
  });
  const tabletPage = await tabletContext.newPage();
  await tabletPage.goto(url, { waitUntil: "networkidle" });
  const tabletControls = await tabletPage.locator("#auditBody .del-btn:visible").evaluateAll((elements) => ({
    viewport: document.documentElement.clientWidth,
    bounds: elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    }),
  }));
  check(
    tabletControls.bounds.length > 0 && tabletControls.bounds.every(({ left, right }) => left >= 0 && right <= tabletControls.viewport),
    `768px clips rightmost row controls: ${JSON.stringify(tabletControls)}`,
  );
  await tabletContext.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Overview interaction verification passed.");
