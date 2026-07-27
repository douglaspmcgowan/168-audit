import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = 3170;
const URL = `http://localhost:${PORT}`;
const server = spawn(process.execPath, ["server.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(PORT),
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "browser-test-key",
  },
  stdio: "ignore",
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
for (let attempt = 0; attempt < 30; attempt += 1) {
  try {
    const response = await fetch(`${URL}/health`);
    if (response.ok) break;
  } catch {}
  await delay(100);
}

const mockClient = `
(() => {
  let session = null;
  const listeners = [];
  const ownerId = "00000000-0000-4000-8000-000000000001";
  const memberId = "00000000-0000-4000-8000-000000000002";
  const adminId = "00000000-0000-4000-8000-000000000003";
  const groupId = "00000000-0000-4000-8000-000000000010";
  const ownWeek = { id:"00000000-0000-4000-8000-000000000020", owner_id:ownerId, week_start:"2026-07-20", title:"My Schedule", audit_document:{rows:[]}, updated_at:"2026-07-25T00:00:00Z" };
  const sharedWeek = { id:"00000000-0000-4000-8000-000000000021", owner_id:"00000000-0000-4000-8000-000000000002", week_start:"2026-07-13", title:"A teammate's week", audit_document:{rows:[
    {category:"Work",sub:"Focused work",ideal:32,actual:38,notes:"Protected mornings worked well."},
    {category:"Rest",sub:"Sleep",ideal:56,actual:52,notes:"Late meetings reduced sleep."}
  ]}, updated_at:"2026-07-25T00:00:00Z" };
  const rpcCalls = [];
  window.__cloudRpcCalls = rpcCalls;
  function resultFor(table, action, filters = {}) {
    if (table === "group_memberships" && filters.user_id) {
      const role = filters.user_id === ownerId ? "owner" : filters.user_id === adminId ? "admin" : filters.user_id === memberId ? "member" : "";
      return { data:role ? [{group_id:groupId,user_id:filters.user_id,role,groups:{id:groupId,name:"Design cohort",created_by:ownerId}}] : [], error:null };
    }
    if (table === "group_memberships") return { data:[
      {group_id:groupId,user_id:ownerId,role:"owner",joined_at:"2026-07-20T00:00:00Z"},
      {group_id:groupId,user_id:memberId,role:"member",joined_at:"2026-07-21T00:00:00Z"},
      {group_id:groupId,user_id:adminId,role:"admin",joined_at:"2026-07-22T00:00:00Z"}
    ], error:null };
    if (table === "profiles") return { data:[
      {user_id:ownerId,display_name:"Owner Person"},
      {user_id:memberId,display_name:"Member Person"},
      {user_id:adminId,display_name:"Admin Person"}
    ], error:null };
    if (table === "group_invites") return { data:[{id:"00000000-0000-4000-8000-000000000030",expires_at:"2026-08-01T00:00:00Z",max_uses:1,use_count:0,revoked_at:null}], error:null };
    if (table === "audit_weeks") return { data:[ownWeek,sharedWeek], error:null };
    if (table === "group_week_shares") return { data:[{week_id:sharedWeek.id}], error:null };
    if (table === "groups" && action === "insert") return { data:{id:groupId}, error:null };
    return { data:null, error:null };
  }
  function chain(table, action, filters = {}) {
    const api = {
      select(){ return chain(table, action, filters); }, order(){ return api; }, limit(){ return api; },
      eq(field,value){ return chain(table, action, {...filters,[field]:value}); },
      in(){ return api; }, is(){ return api; }, gt(){ return api; },
      insert(){ return chain(table, "insert", filters); }, update(){ return chain(table, "update", filters); }, delete(){ return chain(table, "delete", filters); },
      maybeSingle(){ return Promise.resolve(table === "group_week_shares" ? {data:null,error:null} : resultFor(table, action, filters)); },
      single(){ return Promise.resolve(resultFor(table, action, filters)); },
      then(resolve, reject){ return Promise.resolve(resultFor(table, action, filters)).then(resolve, reject); }
    };
    return api;
  }
  window.supabase = { createClient(){
    return {
      auth: {
        getSession: async()=>({data:{session},error:null}),
        onAuthStateChange(fn){ listeners.push(fn); return {data:{subscription:{unsubscribe(){}}}}; },
        async signInWithPassword({email}){ const id=email.startsWith("member")?memberId:email.startsWith("admin")?adminId:email.startsWith("outsider")?"00000000-0000-4000-8000-000000000099":ownerId; session={user:{id,email}}; listeners.forEach(fn=>fn("SIGNED_IN",session)); return {data:{session},error:null}; },
        async signUp(){ return {data:{user:{}},error:null}; },
        async resetPasswordForEmail(){ return {data:{},error:null}; },
        async signOut(){ session=null; listeners.forEach(fn=>fn("SIGNED_OUT",null)); return {error:null}; }
      },
      from(table){ return chain(table, "select"); },
      rpc(name,args){
        rpcCalls.push({name,args});
        if (name === "redeem_group_invite") return Promise.resolve({data:groupId,error:null});
        if (name === "create_group_invite") return Promise.resolve({data:[{invite_token:"test-invitation-code"}],error:null});
        if (name === "save_audit_week") return Promise.resolve({data:[{week_id:ownWeek.id,new_version:2}],error:null});
        return Promise.resolve({data:null,error:null});
      }
    };
  }};
})();`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/vendor/supabase.js", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: mockClient,
  }));
  await page.addInitScript(() => localStorage.setItem("168-audit:intro-seen-v2", "1"));
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.click("#tab-center");

  if (!(await page.locator("#signInForm").isVisible())) throw new Error("configured signed-out state missing");
  await page.fill("#signInEmail", "owner@example.test");
  await page.fill("#signInPassword", "correct-horse-battery");
  await page.click('#signInForm button[type="submit"]');
  await page.waitForSelector("#syncWeekBtn");

  const state = await page.evaluate(() => ({
    heading: document.querySelector("#view-center h2")?.textContent,
    group: document.querySelector(".group-row strong")?.textContent,
    own: document.querySelector("#centerWeeks")?.textContent.includes("My Schedule"),
    shared: document.querySelector("#centerWeeks")?.textContent.includes("A teammate's week"),
    privacy: document.querySelector("#view-center")?.textContent.includes("private until you share"),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  if (state.heading !== "Your center" || state.group !== "Design cohort" || !state.own || !state.shared || !state.privacy || state.overflow > 1) {
    throw new Error(`signed-in Center contract failed: ${JSON.stringify(state)}`);
  }
  await page.click(".shared-week-details summary");
  if (!(await page.locator(".shared-week-data").isVisible())) throw new Error("shared week data did not open");
  const sharedData = await page.locator(".shared-week-data").innerText();
  if (!/Focused work/.test(sharedData) || !/32/.test(sharedData) || !/38/.test(sharedData) ||
      !/Protected mornings worked well/.test(sharedData) || !/Sleep/.test(sharedData)) {
    throw new Error(`populated same-group week data missing: ${sharedData}`);
  }
  const lifecycle = await page.evaluate(() => ({
    roster: [...document.querySelectorAll(".member-row strong")].map(node => node.textContent),
    roleControl: Boolean(document.querySelector("[data-member-role]")),
    transfer: Boolean(document.querySelector("[data-transfer-owner]")),
    rename: Boolean(document.getElementById("renameGroupBtn")),
    deleteGroup: Boolean(document.getElementById("deleteGroupBtn")),
    leaveGroup: Boolean(document.getElementById("leaveGroupBtn")),
    activeInvite: Boolean(document.querySelector("[data-revoke-invite]")),
  }));
  if (!lifecycle.roster.includes("Member Person") || !lifecycle.roleControl || !lifecycle.transfer ||
      !lifecycle.rename || !lifecycle.deleteGroup || lifecycle.leaveGroup || !lifecycle.activeInvite) {
    throw new Error(`owner lifecycle controls failed: ${JSON.stringify(lifecycle)}`);
  }
  await page.selectOption("[data-member-role]", "admin");
  await page.waitForFunction(() => window.__cloudRpcCalls.some(call => call.name === "set_group_member_role"));
  await page.click("#createInviteForm button");
  if (!/shown only in this session/i.test(await page.locator("#inviteCodeOutput").innerText()) ||
      !(await page.locator("#copyInviteBtn").isVisible())) {
    throw new Error("one-session invitation handoff was not surfaced");
  }
  await page.click("[data-revoke-invite]");
  await page.click("#appDialogConfirm");
  await page.waitForFunction(() => window.__cloudRpcCalls.some(call => call.name === "revoke_group_invite"));
  await page.context().setOffline(true);
  await page.waitForTimeout(100);
  const offline = await page.evaluate(() => ({
    status: document.querySelector("#view-center .center-status")?.textContent,
    syncDisabled: document.getElementById("syncWeekBtn")?.disabled,
  }));
  if (!/Offline/.test(offline.status || "") || !offline.syncDisabled) {
    throw new Error(`offline contract failed: ${JSON.stringify(offline)}`);
  }
  await page.context().setOffline(false);

  async function signInAs(email) {
    await page.fill("#signInEmail", email);
    await page.fill("#signInPassword", "correct-horse-battery");
    await page.click('#signInForm button[type="submit"]');
    await page.waitForSelector("#syncWeekBtn");
  }

  await page.click("#signOutBtn");
  await page.waitForSelector("#signInForm");
  await signInAs("member@example.test");
  const memberControls = await page.evaluate(() => ({
    leave: Boolean(document.getElementById("leaveGroupBtn")),
    rename: Boolean(document.getElementById("renameGroupBtn")),
    remove: Boolean(document.querySelector("[data-remove-member]")),
    roles: Boolean(document.querySelector("[data-member-role]")),
    invite: Boolean(document.getElementById("createInviteForm")),
    deleteGroup: Boolean(document.getElementById("deleteGroupBtn")),
  }));
  if (!memberControls.leave || memberControls.rename || memberControls.remove || memberControls.roles ||
      memberControls.invite || memberControls.deleteGroup) {
    throw new Error(`member permissions UI failed: ${JSON.stringify(memberControls)}`);
  }

  await page.click("#signOutBtn");
  await page.waitForSelector("#signInForm");
  await signInAs("admin@example.test");
  const adminControls = await page.evaluate(() => ({
    leave: Boolean(document.getElementById("leaveGroupBtn")),
    rename: Boolean(document.getElementById("renameGroupBtn")),
    removes: [...document.querySelectorAll("[data-remove-member]")].map(button => button.dataset.removeMember),
    roles: Boolean(document.querySelector("[data-member-role]")),
    invite: Boolean(document.getElementById("createInviteForm")),
    deleteGroup: Boolean(document.getElementById("deleteGroupBtn")),
  }));
  if (!adminControls.leave || !adminControls.rename || !adminControls.invite || adminControls.deleteGroup ||
      adminControls.roles || adminControls.removes.length !== 1 || !adminControls.removes.includes("00000000-0000-4000-8000-000000000002")) {
    throw new Error(`admin permissions UI failed: ${JSON.stringify(adminControls)}`);
  }

  await page.click("#signOutBtn");
  await page.waitForSelector("#signInForm");
  await signInAs("outsider@example.test");
  const outsider = await page.evaluate(() => ({
    groups: document.querySelectorAll("[data-group-id]").length,
    shared: document.querySelectorAll(".shared-week-card").length,
    create: Boolean(document.getElementById("createGroupForm")),
    join: Boolean(document.getElementById("joinGroupForm")),
  }));
  if (outsider.groups || outsider.shared || !outsider.create || !outsider.join) {
    throw new Error(`outsider privacy UI failed: ${JSON.stringify(outsider)}`);
  }
  if (errors.length) throw new Error(`runtime errors: ${errors.join("; ")}`);
  console.log("Cloud UI contract passed: owner/admin/member/outsider personas, lifecycle roles, invitations, personal/shared weeks, privacy, offline state, and mobile layout.");
} finally {
  await browser.close();
  server.kill();
}
