import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import { spawn } from "node:child_process";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const explicitStdinConfig = process.argv.includes("--credentials-stdin");
const stdinConfig = explicitStdinConfig
  ? JSON.parse(fs.readFileSync(0, "utf8"))
  : {};
const directValues = {
  url: explicitStdinConfig ? stdinConfig.url : process.env.LIVE_SUPABASE_URL,
  publishableKey: explicitStdinConfig ? stdinConfig.publishableKey : process.env.LIVE_SUPABASE_PUBLISHABLE_KEY,
  privilegedKey: explicitStdinConfig ? stdinConfig.privilegedKey : process.env.LIVE_SUPABASE_PRIVILEGED_KEY,
};
const directValueCount = Object.values(directValues).filter(Boolean).length;
if (explicitStdinConfig && directValueCount !== 3) {
  throw new Error("Direct live verification requires a complete URL, publishable key, and privileged key.");
}
const managementValueCount = [
  process.env.SUPABASE_ACCESS_TOKEN,
  process.env.LIVE_SUPABASE_PROJECT_REF,
].filter(Boolean).length;
if (!explicitStdinConfig && managementValueCount === 1) {
  throw new Error("Management API verification requires both the access token and project reference.");
}
const managementConfig = !explicitStdinConfig && managementValueCount === 2;
if (!explicitStdinConfig && !managementConfig && directValueCount && directValueCount !== 3) {
  throw new Error("Direct live verification requires a complete URL, publishable key, and privileged key.");
}
const directConfig = explicitStdinConfig || (!managementConfig && directValueCount === 3);
if (!managementConfig && !directConfig) {
  console.log("SKIP live Center UI verification: provide the Management API pair or the direct runtime verification trio.");
  process.exit(0);
}

const projectRef = process.env.LIVE_SUPABASE_PROJECT_REF;
const projectUrl = directConfig ? directValues.url : `https://${projectRef}.supabase.co`;
const managementBase = projectRef ? `https://api.supabase.com/v1/projects/${projectRef}` : "";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const runId = crypto.randomUUID().replaceAll("-", "");
const password = `Audit-${crypto.randomUUID()}-9a!`;
const externalAppUrl = stdinConfig.appUrl || process.env.LIVE_APP_URL || "";
let appUrl = externalAppUrl;
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
  if (directConfig) {
    service = createClient(projectUrl, directValues.privilegedKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: timedFetch },
    });
    return directValues.publishableKey;
  }
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
    if (server && server.exitCode !== null) {
      throw new Error(`Configured application server exited before becoming healthy (${server.exitCode}).`);
    }
    try {
      const response = await timedFetch(`${appUrl}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Configured application server did not become healthy.");
}

async function reservePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(error => error ? reject(error) : resolve(address.port));
    });
  });
}

async function stopServer() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  let stopped = false;
  const exited = new Promise(resolve => server.once("exit", () => {
    stopped = true;
    resolve();
  }));
  server.kill();
  await Promise.race([
    exited,
    new Promise(resolve => setTimeout(resolve, 5_000)),
  ]);
  if (!stopped && server.exitCode === null && server.signalCode === null) {
    server.kill("SIGKILL");
    await Promise.race([
      exited,
      new Promise(resolve => setTimeout(resolve, 5_000)),
    ]);
  }
  assert(stopped || server.exitCode !== null || server.signalCode !== null, "Configured application server did not stop.");
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
  const errors = [];
  if (groupId) {
    const result = await service.from("groups").delete().eq("id", groupId);
    if (result.error) errors.push(result.error);
  }
  if (weekId) {
    const result = await service.from("audit_weeks").delete().eq("id", weekId);
    if (result.error) errors.push(result.error);
  }
  for (const user of users) {
    const result = await service.auth.admin.deleteUser(user.id);
    if (result.error) errors.push(result.error);
  }
  if (errors.length) {
    throw new Error(`Cleanup operations failed: ${errors.map(error => safeMessage(error.message)).join("; ")}`);
  }
}

async function verifyCleanup() {
  if (!service) return;
  for (let page = 1; ; page += 1) {
    const listed = await service.auth.admin.listUsers({ page, perPage: 1000 });
    if (listed.error) throw listed.error;
    assert(
      !listed.data.users.some(user => user.email?.includes(`-${runId}@example.test`)),
      "live UI test identities remained after cleanup",
    );
    if (listed.data.users.length < 1000) break;
  }

  const userIds = users.map(user => user.id);
  const checks = userIds.length ? [
    ["profiles", "user_id", userIds, "user_id"],
    ["audit_weeks", "owner_id", userIds, "id"],
    ["groups", "owner_id", userIds, "id"],
    ["group_memberships", "user_id", userIds, "group_id"],
    ["group_invites", "created_by", userIds, "id"],
  ] : [];
  if (groupId) checks.push(["group_week_shares", "group_id", [groupId], "group_id"]);
  if (weekId) checks.push(["group_week_shares", "week_id", [weekId], "week_id"]);
  for (const [table, column, values, selectColumn] of checks) {
    const result = await service.from(table).select(selectColumn).in(column, values);
    if (result.error) throw result.error;
    assert(!result.data.length, `${table} retained generated live UI rows after cleanup`);
  }
}

try {
  const publishableKey = await configure();
  setStage("synthetic identities");
  const ownerEmail = await createUser("owner");
  const memberEmail = await createUser("member");

  setStage("configured application");
  if (!externalAppUrl) {
    const port = await reservePort();
    appUrl = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, ["server.js"], {
      cwd: process.cwd(),
      env: {
        NODE_ENV: "test",
        PORT: String(port),
        SUPABASE_URL: projectUrl,
        SUPABASE_PUBLISHABLE_KEY: publishableKey,
        SystemRoot: process.env.SystemRoot,
        TEMP: process.env.TEMP,
        TMP: process.env.TMP,
      },
      stdio: "ignore",
    });
  }
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
  const cleanupFailures = [];
  try {
    if (browser) await browser.close();
  } catch (error) {
    cleanupFailures.push(`browser close: ${safeMessage(error?.message)}`);
  }
  try {
    await stopServer();
  } catch (error) {
    cleanupFailures.push(`server shutdown: ${safeMessage(error?.message)}`);
  }
  try {
    await cleanup();
  } catch (error) {
    cleanupFailures.push(`deletion: ${safeMessage(error?.message)}`);
  }
  try {
    await verifyCleanup();
  } catch (error) {
    cleanupFailures.push(`residue check: ${safeMessage(error?.message)}`);
  }
  if (cleanupFailures.length) {
    console.error(`Live Center UI cleanup failed: ${cleanupFailures.join(" | ")}.`);
    process.exitCode = 1;
  } else {
    console.log("Live Center UI cleanup passed: generated rows and Auth identities were removed.");
  }
}
