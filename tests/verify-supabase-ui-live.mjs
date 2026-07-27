import crypto from "node:crypto";
import { spawn } from "node:child_process";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const required = ["SUPABASE_ACCESS_TOKEN", "LIVE_SUPABASE_PROJECT_REF"];
const missing = required.filter(name => !process.env[name]);
if (missing.length) {
  console.log(`SKIP live Center UI verification: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} unset.`);
  process.exit(0);
}

const projectRef = process.env.LIVE_SUPABASE_PROJECT_REF;
const projectUrl = `https://${projectRef}.supabase.co`;
const managementBase = `https://api.supabase.com/v1/projects/${projectRef}`;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const runId = crypto.randomUUID().replaceAll("-", "");
const password = `Audit-${crypto.randomUUID()}-9a!`;
const PORT = 3171;
const appUrl = `http://localhost:${PORT}`;
const users = [];
let service;
let groupId;
let weekId;
let server;
let browser;
let stage = "configuration";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const safeMessage = value => String(value ?? "")
  .replace(/\b(?:sb_(?:publishable|secret)_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)\b/g, "[redacted]")
  .slice(0, 500);
const timedFetch = (input, init = {}) => fetch(input, {
  ...init,
  signal: init.signal ?? AbortSignal.timeout(20_000),
});
const setStage = value => {
  stage = value;
  console.log(`Live Center UI stage: ${value}.`);
};

async function managementRequest(path) {
  const response = await timedFetch(`${managementBase}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Management API returned ${response.status}.`);
  return response.json();
}

async function configure() {
  const response = await managementRequest("/api-keys?reveal=true");
  const keys = Array.isArray(response) ? response : response?.api_keys;
  const publishable = keys?.find(key => key.type === "publishable")
    ?? keys?.find(key => key.name === "anon");
  const privileged = keys?.find(key => key.type === "secret")
    ?? keys?.find(key => key.name === "service_role");
  assert(publishable?.api_key && privileged?.api_key, "Required project keys are unavailable.");
  service = createClient(projectUrl, privileged.api_key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: timedFetch },
  });
  return publishable.api_key;
}

async function createUser(role) {
  const email = `168-ui-${role}-${runId}@example.test`;
  const result = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `${role[0].toUpperCase()}${role.slice(1)} UI verifier` },
  });
  if (result.error) throw result.error;
  users.push(result.data.user);
  return email;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await timedFetch(`${appUrl}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Configured application server did not become healthy.");
}

async function openApp(context) {
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("168-audit:intro-seen-v2", "1"));
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  return { page, runtimeErrors };
}

async function signIn(page, email) {
  await page.click("#tab-center");
  await page.waitForSelector("#signInForm");
  await page.fill("#signInEmail", email);
  await page.fill("#signInPassword", password);
  await page.click('#signInForm button[type="submit"]');
  await page.waitForSelector("#syncWeekBtn");
}

async function openCenterAfterReload(page) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.click("#tab-center");
  await page.waitForSelector("#syncWeekBtn");
}

async function assertAccessible(page, label) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(item => item.impact === "critical" || item.impact === "serious");
  assert(
    !serious.length,
    `${label} has serious accessibility violations: ${serious.map(item => `${item.id}(${item.nodes.map(node => node.target.join(" ")).join("|")})`).join(", ")}`,
  );
}

async function assertResponsive(page, label) {
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    offenders: [...document.querySelectorAll("body *")]
      .filter(element => element.getClientRects().length)
      .map(element => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, id: element.id, className: String(element.className || ""), right: Math.round(rect.right), width: Math.round(rect.width) };
      })
      .filter(item => item.right > document.documentElement.clientWidth + 1 || item.width > document.documentElement.clientWidth + 1)
      .slice(0, 5),
    undersized: [...document.querySelectorAll("#view-center button, #view-center input, #view-center select, #view-center summary")]
      .filter(element => element.getClientRects().length)
      .filter(element => {
        const target = element.matches('input[type="checkbox"], input[type="radio"]')
          ? element.closest("label") ?? element
          : element;
        const rect = target.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      })
      .map(element => element.id || element.getAttribute("aria-label") || element.tagName)
      .slice(0, 5),
  }));
  assert(result.overflow <= 1, `${label} has horizontal overflow: ${JSON.stringify(result.offenders)}`);
  assert(!result.undersized.length, `${label} has undersized controls: ${result.undersized.join(", ")}`);
}

async function cleanup() {
  if (!service) return;
  if (groupId) await service.from("groups").delete().eq("id", groupId);
  if (weekId) await service.from("audit_weeks").delete().eq("id", weekId);
  for (const user of users) await service.auth.admin.deleteUser(user.id);
}

async function verifyCleanup() {
  if (!service) return;
  const listed = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;
  assert(
    !listed.data.users.some(user => user.email?.includes(`-${runId}@example.test`)),
    "live UI test identities remained after cleanup",
  );
}

try {
  const publishableKey = await configure();
  setStage("synthetic identities");
  const ownerEmail = await createUser("owner");
  const memberEmail = await createUser("member");

  setStage("configured application");
  server = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      SUPABASE_URL: projectUrl,
      SUPABASE_PUBLISHABLE_KEY: publishableKey,
    },
    stdio: "ignore",
  });
  await waitForServer();

  browser = await chromium.launch();
  const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const memberContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const ownerApp = await openApp(ownerContext);
  const memberApp = await openApp(memberContext);
  const ownerPage = ownerApp.page;
  const memberPage = memberApp.page;

  setStage("owner local audit and sign-in");
  await ownerPage.click('[data-plan-stage="both"]');
  await ownerPage.locator("#auditBody tr").first().locator(".num-input[data-field='ideal']").fill("12");
  await ownerPage.locator("#auditBody tr").first().locator(".num-input[data-field='actual']").fill("10");
  await ownerPage.locator("#auditBody tr").first().locator(".notes-input").fill("Protected focus block.");
  await signIn(ownerPage, ownerEmail);

  setStage("group creation and invitation");
  await ownerPage.fill("#groupName", `Live Center ${runId}`);
  await ownerPage.click('#createGroupForm button[type="submit"]');
  await ownerPage.waitForSelector(".group-row.active");
  groupId = await ownerPage.locator(".group-row.active").getAttribute("data-group-id");
  assert(Boolean(groupId), "created group was not selected.");
  await ownerPage.click('#createInviteForm button[type="submit"]');
  await ownerPage.waitForSelector("#inviteCodeWrap:not([hidden])");
  const joinUrl = await ownerPage.locator("#inviteCodeOutput").getAttribute("data-join-url");
  const inviteToken = new URL(joinUrl).searchParams.get("invite");
  assert(Boolean(inviteToken), "invitation token was not available to the UI handoff.");

  setStage("member sign-in and join");
  await signIn(memberPage, memberEmail);
  await memberContext.setOffline(true);
  await memberPage.waitForTimeout(100);
  await memberPage.fill("#inviteToken", inviteToken);
  await memberPage.click('#joinGroupForm button[type="submit"]');
  await memberPage.waitForFunction(() => Boolean(document.getElementById("centerError")?.textContent.trim()));
  assert(!await memberPage.locator(".group-row").count(), "offline join created visible membership.");
  await memberContext.setOffline(false);
  await memberPage.waitForTimeout(100);
  await memberPage.fill("#inviteToken", inviteToken);
  await memberPage.click('#joinGroupForm button[type="submit"]');
  await memberPage.waitForSelector(".group-row.active");
  assert(await memberPage.locator(".group-row.active").getAttribute("data-group-id") === groupId, "member joined the wrong group.");

  setStage("owner sync and explicit sharing");
  await ownerContext.setOffline(true);
  await ownerPage.waitForTimeout(100);
  assert(await ownerPage.locator("#syncWeekBtn").isDisabled(), "offline sync remained enabled.");
  assert(await ownerPage.locator("#view-center").innerText().then(text => text.includes("Offline")), "offline state was not announced.");
  await ownerContext.setOffline(false);
  await ownerPage.waitForTimeout(100);
  await ownerPage.click("#syncWeekBtn");
  await ownerPage.waitForSelector("[data-share-week]");
  weekId = await ownerPage.locator("[data-share-week]").getAttribute("data-share-week");
  await ownerPage.waitForTimeout(500);
  await ownerContext.setOffline(true);
  await ownerPage.waitForTimeout(100);
  await ownerPage.locator("[data-share-week]").check();
  await ownerPage.waitForFunction(() => Boolean(document.getElementById("centerError")?.textContent.trim()));
  assert(!await ownerPage.locator("[data-share-week]").isChecked(), "failed offline share stayed checked.");
  await ownerContext.setOffline(false);
  await ownerPage.waitForTimeout(750);
  await ownerPage.locator("[data-share-week]").check();
  await ownerPage.waitForTimeout(500);

  setStage("member shared-week view");
  await openCenterAfterReload(memberPage);
  await memberPage.waitForSelector(".shared-week-card");
  await memberPage.click(".shared-week-details summary");
  const sharedText = await memberPage.locator(".shared-week-data").innerText();
  assert(/Protected focus block\./.test(sharedText), `shared note was absent: ${safeMessage(sharedText)}`);
  assert(/\b12h ideal\b/i.test(sharedText) && /\b10h actual\b/i.test(sharedText), "shared ideal/actual data was absent.");
  assert(!await memberPage.locator("[data-member-role]").count(), "member received role-management controls.");
  await assertAccessible(memberPage, "mobile shared-week Center");
  await assertResponsive(memberPage, "375px Center");
  await memberPage.setViewportSize({ width: 320, height: 568 });
  await assertResponsive(memberPage, "320px Center");

  setStage("revocation through UI");
  await ownerContext.setOffline(true);
  await ownerPage.waitForTimeout(100);
  await ownerPage.locator("[data-share-week]").uncheck();
  await ownerPage.waitForFunction(() => Boolean(document.getElementById("centerError")?.textContent.trim()));
  assert(await ownerPage.locator("[data-share-week]").isChecked(), "failed offline unshare stayed unchecked.");
  await ownerContext.setOffline(false);
  await ownerPage.waitForTimeout(750);
  await ownerPage.locator("[data-share-week]").uncheck();
  await ownerPage.waitForTimeout(500);
  await openCenterAfterReload(memberPage);
  assert(!await memberPage.locator(".shared-week-card").count(), "unshared week remained visible.");

  setStage("member removal through UI");
  await openCenterAfterReload(ownerPage);
  await ownerPage.waitForSelector("[data-share-week]");
  await ownerPage.waitForTimeout(500);
  await ownerPage.locator("[data-share-week]").check();
  await ownerPage.waitForTimeout(500);
  await openCenterAfterReload(memberPage);
  await memberPage.waitForSelector(".shared-week-card");
  await openCenterAfterReload(ownerPage);
  await ownerPage.waitForSelector("[data-remove-member]");
  await ownerContext.setOffline(true);
  await ownerPage.waitForTimeout(100);
  await ownerPage.click("[data-remove-member]");
  await ownerPage.click("#appDialogConfirm");
  await ownerPage.waitForFunction(() => Boolean(document.getElementById("centerError")?.textContent.trim()));
  assert(await ownerPage.locator("[data-remove-member]").count(), "offline member removal changed the roster.");
  await ownerContext.setOffline(false);
  await ownerPage.waitForTimeout(100);
  await ownerPage.click("[data-remove-member]");
  await ownerPage.click("#appDialogConfirm");
  await ownerPage.waitForFunction(() => !document.querySelector("[data-remove-member]"));
  await openCenterAfterReload(memberPage);
  assert(!await memberPage.locator(".group-row").count(), "removed member retained the group.");
  assert(!await memberPage.locator(".shared-week-card").count(), "removed member retained shared-week data.");
  await memberContext.setOffline(true);
  await memberPage.waitForTimeout(100);
  await memberPage.click("#signOutBtn");
  await memberPage.waitForSelector("#signInForm");
  await memberContext.setOffline(false);
  await assertAccessible(ownerPage, "desktop owner Center");
  await assertResponsive(ownerPage, "desktop Center");
  assert(!ownerApp.runtimeErrors.length && !memberApp.runtimeErrors.length, "browser runtime errors occurred.");

  console.log("Live Center UI verification passed: two isolated browser sessions, group creation/join, local-week sync, explicit share, shared ideal/actual/note data, unshare, member removal, accessibility, and 320px/375px/desktop layouts.");
} catch (error) {
  console.error(`Live Center UI verification failed during ${stage}: ${safeMessage(error?.message)}.`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
  try {
    await cleanup();
    await verifyCleanup();
    console.log("Live Center UI cleanup passed: generated rows and Auth identities were removed.");
  } catch (error) {
    console.error(`Live Center UI cleanup failed: ${safeMessage(error?.message)}.`);
    process.exitCode = 1;
  }
}
