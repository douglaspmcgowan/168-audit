import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const required = ["SUPABASE_ACCESS_TOKEN", "LIVE_SUPABASE_PROJECT_REF"];
const missing = required.filter(name => !process.env[name]);
if (missing.length) {
  console.log(`SKIP live Supabase verification: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} unset.`);
  process.exit(0);
}

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.LIVE_SUPABASE_PROJECT_REF;
const managementBase = `https://api.supabase.com/v1/projects/${projectRef}`;
const url = `https://${projectRef}.supabase.co`;
const runId = crypto.randomUUID().replaceAll("-", "");
const password = `Audit-${crypto.randomUUID()}-9a!`;
const users = new Map();
const emails = new Map();
const clients = new Map();
let groupId = null;
let outsiderGroupId = null;
let weekId = null;
let service;
let stage = "Management API configuration";
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const timedFetch = (input, init = {}) => fetch(input, {
  ...init,
  signal: init.signal ?? AbortSignal.timeout(20_000),
});
const setStage = value => {
  stage = value;
  console.log(`Live Supabase stage: ${value}.`);
};
const safeMessage = value => String(value ?? "")
  .replace(/\b(?:sb_(?:publishable|secret)_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)\b/g, "[redacted]")
  .slice(0, 500);

async function managementRequest(path, { method = "GET", body } = {}) {
  const response = await timedFetch(`${managementBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    let detail = "";
    try {
      const payload = await response.json();
      detail = safeMessage(payload?.message ?? payload?.error ?? payload?.code);
    } catch {
      // Status and endpoint are sufficient when no structured error is available.
    }
    throw new Error(`Management API ${method} ${path} returned ${response.status}${detail ? `: ${detail}` : ""}.`);
  }
  return response.status === 204 ? null : response.json();
}

async function runSql(query, readOnly = false) {
  return managementRequest(readOnly ? "/database/query/read-only" : "/database/query", {
    method: "POST",
    body: { query, read_only: readOnly },
  });
}

function firstRow(result) {
  if (Array.isArray(result)) return result[0] ?? {};
  if (Array.isArray(result?.result)) return result.result[0] ?? {};
  return result?.data?.[0] ?? result ?? {};
}

async function configureRuntimeClients() {
  const response = await managementRequest("/api-keys?reveal=true");
  const keys = Array.isArray(response) ? response : response?.api_keys;
  assert(Array.isArray(keys), "Management API key response was unavailable.");
  const publishable = keys.find(key => key.type === "publishable")
    ?? keys.find(key => key.name === "anon");
  const privileged = keys.find(key => key.type === "secret")
    ?? keys.find(key => key.name === "service_role");
  assert(publishable?.api_key, "No browser-safe Supabase key is configured.");
  assert(privileged?.api_key, "No server-only Supabase key is configured.");
  service = createClient(url, privileged.api_key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: timedFetch },
  });
  return publishable.api_key;
}

async function createPersona(role, anonKey) {
  const email = `168-audit-${role}-${runId}@example.test`;
  const created = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `${role[0].toUpperCase()}${role.slice(1)} verifier` },
  });
  if (created.error) throw created.error;
  users.set(role, created.data.user);
  emails.set(role, email);
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: timedFetch },
  });
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;
  clients.set(role, client);
}

async function createInvite(actor) {
  const result = await clients.get(actor).rpc("create_group_invite", {
    target_group_id: groupId,
    valid_for: "7 days",
    allowed_uses: 1,
  });
  if (result.error) throw result.error;
  return Array.isArray(result.data) ? result.data[0] : result.data;
}

async function canReadWeek(role) {
  const result = await clients.get(role).from("audit_weeks").select("id,title").eq("id", weekId).maybeSingle();
  if (result.error) throw result.error;
  return Boolean(result.data);
}

async function cleanup() {
  if (!service) return;
  if (groupId) await service.from("groups").delete().eq("id", groupId);
  if (outsiderGroupId) await service.from("groups").delete().eq("id", outsiderGroupId);
  if (weekId) await service.from("audit_weeks").delete().eq("id", weekId);
  for (const user of users.values()) await service.auth.admin.deleteUser(user.id);
}

async function cleanupStaleFixtures() {
  const staleGroups = await service.from("groups").select("id")
    .or("name.like.168 live verifier %,name.like.Other group verifier %");
  if (staleGroups.error) throw staleGroups.error;
  for (const group of staleGroups.data) {
    const removed = await service.from("groups").delete().eq("id", group.id);
    if (removed.error) throw removed.error;
  }
  const listed = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;
  for (const user of listed.data.users) {
    if (/^168-audit-.+-[a-f0-9]{32}@example\.test$/i.test(user.email ?? "")) {
      const removed = await service.auth.admin.deleteUser(user.id);
      if (removed.error) throw removed.error;
    }
  }
}

async function verifyCleanup() {
  if (!service) return;
  const groupIds = [groupId, outsiderGroupId].filter(Boolean);
  for (const [table, ids] of [
    ["groups", groupIds],
    ["audit_weeks", [weekId]],
  ]) {
    const liveIds = ids.filter(Boolean);
    if (!liveIds.length) continue;
    const residue = await service.from(table).select("id").in("id", liveIds);
    if (residue.error) throw residue.error;
    assert(residue.data.length === 0, `${table} fixtures remained after cleanup`);
  }
  for (const table of ["group_memberships", "group_invites", "group_week_shares"]) {
    if (!groupIds.length) continue;
    const residue = await service.from(table).select("group_id").in("group_id", groupIds);
    if (residue.error) throw residue.error;
    assert(residue.data.length === 0, `${table} did not cascade after group cleanup`);
  }
  const userIds = [...users.values()].map(user => user.id);
  if (userIds.length) {
    const profileResidue = await service.from("profiles").select("user_id").in("user_id", userIds);
    if (profileResidue.error) throw profileResidue.error;
    assert(profileResidue.data.length === 0, "profiles did not cascade after Auth-user cleanup");
  }
  const listed = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;
  assert(
    !listed.data.users.some(user => user.email?.includes(`-${runId}@example.test`)),
    "test identities remained after cleanup",
  );
}

try {
  const anonKey = await configureRuntimeClients();
  setStage("schema preflight");
  const targetNames = [
    "profiles", "audit_weeks", "groups", "group_memberships", "group_invites", "group_week_shares",
  ];
  const functionNames = [
    "set_updated_at", "handle_new_user", "add_group_owner_membership",
    "is_group_member", "is_group_manager", "is_group_owner", "owns_audit_week",
    "can_read_audit_week", "create_group_invite", "save_audit_week",
    "redeem_group_invite", "revoke_group_invite", "leave_group",
    "remove_group_member", "set_group_member_role", "transfer_group_ownership",
  ];
  const namesSql = values => values.map(value => `'${value}'`).join(", ");
  const preflight = firstRow(await runSql(`
    select
      (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname in (${namesSql(targetNames)})) as table_count,
      (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname in (${namesSql(functionNames)})) as function_count
  `, true));
  const tableCount = Number(preflight.table_count);
  const functionCount = Number(preflight.function_count);
  if (tableCount === 0 && functionCount === 0) {
    setStage("database migration");
    await runSql(await fs.readFile("supabase/migrations/202607250001_multi_user_center.sql", "utf8"));
  } else if (tableCount !== targetNames.length || functionCount < functionNames.length) {
    throw new Error("Target project contains a partial 168 Audit schema.");
  }
  setStage("anonymous RPC hardening migration");
  await runSql(await fs.readFile(
    "supabase/migrations/202607260001_revoke_anon_rpc_execute.sql",
    "utf8",
  ));
  setStage("week conflict response migration");
  await runSql(await fs.readFile(
    "supabase/migrations/202607260002_week_conflict_status.sql",
    "utf8",
  ));
  setStage("SQL RLS contract");
  await runSql(await fs.readFile("supabase/tests/rls_contract.sql", "utf8"));

  setStage("stale fixture cleanup");
  await cleanupStaleFixtures();
  setStage("isolated auth personas");
  for (const role of ["owner", "admin", "member", "otherGroup", "unrelated"]) {
    await createPersona(role, anonKey);
  }
  const owner = clients.get("owner");
  const admin = clients.get("admin");
  const member = clients.get("member");
  const otherGroup = clients.get("otherGroup");
  const unrelated = clients.get("unrelated");

  setStage("group creation and invitations");
  groupId = crypto.randomUUID();
  const group = await owner.from("groups").insert({ id: groupId, name: `168 live verifier ${runId}` });
  if (group.error) throw group.error;
  const visibleGroup = await owner.from("groups").select("id").eq("id", groupId).single();
  if (visibleGroup.error) throw visibleGroup.error;

  const memberInvite = await createInvite("owner");
  const memberJoin = await member.rpc("redeem_group_invite", { invite_token: memberInvite.invite_token });
  if (memberJoin.error) throw memberJoin.error;
  const exhausted = await unrelated.rpc("redeem_group_invite", { invite_token: memberInvite.invite_token });
  assert(Boolean(exhausted.error), "an exhausted invitation was accepted");
  const invalidJoin = await unrelated.rpc("redeem_group_invite", {
    invite_token: crypto.randomBytes(24).toString("hex"),
  });
  assert(Boolean(invalidJoin.error), "an invalid invitation was accepted");

  const adminInvite = await createInvite("owner");
  const adminJoin = await admin.rpc("redeem_group_invite", { invite_token: adminInvite.invite_token });
  if (adminJoin.error) throw adminJoin.error;
  const promote = await owner.rpc("set_group_member_role", {
    target_group_id: groupId,
    target_user_id: users.get("admin").id,
    new_role: "admin",
  });
  if (promote.error) throw promote.error;

  const concurrentInvite = await createInvite("owner");
  const concurrentAttempts = await Promise.all([
    otherGroup.rpc("redeem_group_invite", { invite_token: concurrentInvite.invite_token }),
    unrelated.rpc("redeem_group_invite", { invite_token: concurrentInvite.invite_token }),
  ]);
  const concurrentWinners = concurrentAttempts
    .map((result, index) => ({ result, role: index === 0 ? "otherGroup" : "unrelated" }))
    .filter(entry => !entry.result.error);
  assert(concurrentWinners.length === 1, "a single-use invitation did not admit exactly one concurrent caller");
  const removeConcurrentWinner = await owner.rpc("remove_group_member", {
    target_group_id: groupId,
    target_user_id: users.get(concurrentWinners[0].role).id,
  });
  if (removeConcurrentWinner.error) throw removeConcurrentWinner.error;

  const revokedInvite = await createInvite("admin");
  const revoke = await admin.rpc("revoke_group_invite", { target_invite_id: revokedInvite.invite_id });
  if (revoke.error) throw revoke.error;
  const revokedJoin = await unrelated.rpc("redeem_group_invite", { invite_token: revokedInvite.invite_token });
  assert(Boolean(revokedJoin.error), "a revoked invitation was accepted");

  const expiredToken = crypto.randomBytes(24).toString("hex");
  const expiredDigest = crypto.createHash("sha256").update(expiredToken).digest("hex");
  const expiredInsert = await service.from("group_invites").insert({
    group_id: groupId,
    token_digest: `\\x${expiredDigest}`,
    created_by: users.get("owner").id,
    expires_at: new Date(Date.now() - 60_000).toISOString(),
    max_uses: 1,
  });
  if (expiredInsert.error) throw expiredInsert.error;
  const expiredJoin = await unrelated.rpc("redeem_group_invite", { invite_token: expiredToken });
  assert(Boolean(expiredJoin.error), "an expired invitation was accepted");

  outsiderGroupId = crypto.randomUUID();
  const outsiderGroup = await otherGroup.from("groups").insert({
    id: outsiderGroupId,
    name: `Other group verifier ${runId}`,
  });
  if (outsiderGroup.error) throw outsiderGroup.error;

  setStage("private audit week");
  const saved = await owner.rpc("save_audit_week", {
    target_week_id: null,
    target_title: "Private verifier week",
    target_week_start: "2026-07-20",
    target_document: { schemaVersion: 1, rows: [{ category: "Work", sub: "Focused work", ideal: 20, actual: 18 }] },
    expected_version: null,
  });
  if (saved.error) throw saved.error;
  weekId = (Array.isArray(saved.data) ? saved.data[0] : saved.data).week_id;
  assert(!(await canReadWeek("member")), "member read a private week");
  assert(!(await canReadWeek("admin")), "admin read a private week");
  assert(!(await canReadWeek("otherGroup")), "other-group owner read a private week");
  assert(!(await canReadWeek("unrelated")), "unrelated user read a private week");

  setStage("explicit share and cross-group denial");
  const share = await owner.from("group_week_shares").insert({
    group_id: groupId,
    week_id: weekId,
    shared_by: users.get("owner").id,
  });
  if (share.error) throw share.error;
  assert(await canReadWeek("member"), "member could not read an explicitly shared week");
  assert(await canReadWeek("admin"), "admin could not read an explicitly shared week");
  assert(!(await canReadWeek("otherGroup")), "member of another group read a group-shared week");
  assert(!(await canReadWeek("unrelated")), "unrelated user read a group-shared week");

  setStage("reader mutation denial");
  const readerUpdate = await member.from("audit_weeks").update({ title: "Unauthorized" }).eq("id", weekId).select("id");
  assert(Boolean(readerUpdate.error) || !readerUpdate.data?.length, "member updated another user's week");
  const readerReshare = await member.from("group_week_shares").insert({
    group_id: groupId,
    week_id: weekId,
    shared_by: users.get("member").id,
  });
  assert(Boolean(readerReshare.error), "member re-shared another user's week");
  const memberPromote = await member.rpc("set_group_member_role", {
    target_group_id: groupId,
    target_user_id: users.get("member").id,
    new_role: "admin",
  });
  assert(Boolean(memberPromote.error), "member changed a group role");
  const readerDelete = await member.from("audit_weeks").delete().eq("id", weekId).select("id");
  assert(Boolean(readerDelete.error) || !readerDelete.data?.length, "member deleted another user's week");
  const guessedRead = await unrelated.from("audit_weeks").select("id")
    .eq("id", crypto.randomUUID()).maybeSingle();
  assert(!guessedRead.error && !guessedRead.data, "a guessed week identifier disclosed data");
  const forgedWeek = await member.from("audit_weeks").insert({
    owner_id: users.get("owner").id,
    title: "Forged owner",
    week_start: "2026-07-20",
    audit_document: { schemaVersion: 1, rows: [] },
  });
  assert(Boolean(forgedWeek.error), "a client assigned another user's audit ownership");
  const directMembership = await member.from("group_memberships").insert({
    group_id: outsiderGroupId,
    user_id: users.get("member").id,
    role: "owner",
  });
  assert(Boolean(directMembership.error), "a client wrote group membership directly");

  setStage("optimistic concurrency");
  const secondOwner = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: timedFetch },
  });
  const secondSignIn = await secondOwner.auth.signInWithPassword({
    email: emails.get("owner"),
    password,
  });
  if (secondSignIn.error) throw secondSignIn.error;
  const secondContextSave = await secondOwner.rpc("save_audit_week", {
    target_week_id: weekId,
    target_title: "Second context verifier week",
    target_week_start: "2026-07-20",
    target_document: { schemaVersion: 1, rows: [{ category: "Work", sub: "Second context", ideal: 21, actual: 19 }] },
    expected_version: 1,
  });
  if (secondContextSave.error) throw secondContextSave.error;
  const conflict = await owner.rpc("save_audit_week", {
    target_week_id: weekId,
    target_title: "Conflicting verifier week",
    target_week_start: "2026-07-20",
    target_document: { schemaVersion: 1, rows: [] },
    expected_version: 1,
  });
  assert(
    conflict.error?.code === "PT409",
    `stale version returned ${safeMessage(conflict.error?.code ?? "no error")}: ${safeMessage(conflict.error?.message)}`,
  );

  setStage("revocation and member removal");
  const unshare = await owner.from("group_week_shares").delete().eq("group_id", groupId).eq("week_id", weekId);
  if (unshare.error) throw unshare.error;
  assert(!(await canReadWeek("member")), "member retained access after unshare");
  const reshare = await owner.from("group_week_shares").insert({
    group_id: groupId,
    week_id: weekId,
    shared_by: users.get("owner").id,
  });
  if (reshare.error) throw reshare.error;
  const remove = await admin.rpc("remove_group_member", {
    target_group_id: groupId,
    target_user_id: users.get("member").id,
  });
  if (remove.error) throw remove.error;
  assert(!(await canReadWeek("member")), "removed member retained shared-week access");

  setStage("ownership transfer");
  const transfer = await owner.rpc("transfer_group_ownership", {
    target_group_id: groupId,
    new_owner_id: users.get("admin").id,
  });
  if (transfer.error) throw transfer.error;
  const formerOwner = await owner.from("group_memberships").select("role")
    .eq("group_id", groupId).eq("user_id", users.get("owner").id).single();
  assert(!formerOwner.error && formerOwner.data.role === "admin", "former owner did not become an admin");

  setStage("Auth-user cascade");
  await createPersona("cascade", anonKey);
  const cascade = clients.get("cascade");
  const cascadeGroupId = crypto.randomUUID();
  const cascadeGroup = await cascade.from("groups").insert({
    id: cascadeGroupId,
    name: `Cascade verifier ${runId}`,
  });
  if (cascadeGroup.error) throw cascadeGroup.error;
  const cascadeWeek = await cascade.rpc("save_audit_week", {
    target_week_id: null,
    target_title: "Cascade verifier week",
    target_week_start: "2026-07-13",
    target_document: { schemaVersion: 1, rows: [] },
    expected_version: null,
  });
  if (cascadeWeek.error) throw cascadeWeek.error;
  const cascadeWeekId = (Array.isArray(cascadeWeek.data) ? cascadeWeek.data[0] : cascadeWeek.data).week_id;
  const cascadeShare = await cascade.from("group_week_shares").insert({
    group_id: cascadeGroupId,
    week_id: cascadeWeekId,
    shared_by: users.get("cascade").id,
  });
  if (cascadeShare.error) throw cascadeShare.error;
  const cascadeDelete = await service.auth.admin.deleteUser(users.get("cascade").id);
  if (cascadeDelete.error) throw cascadeDelete.error;
  for (const [table, column, id] of [
    ["profiles", "user_id", users.get("cascade").id],
    ["audit_weeks", "id", cascadeWeekId],
    ["groups", "id", cascadeGroupId],
    ["group_memberships", "group_id", cascadeGroupId],
    ["group_week_shares", "group_id", cascadeGroupId],
  ]) {
    const residue = await service.from(table).select(column).eq(column, id);
    if (residue.error) throw residue.error;
    assert(!residue.data.length, `${table} did not cascade after Auth-user deletion`);
  }
  users.delete("cascade");
  emails.delete("cascade");

  console.log("Live Supabase verification passed: migration, SQL contract, six auth personas, invalid/exhausted/revoked/expired/concurrent invitation handling, cross-group privacy, sharing, mutation denial, two-context conflict, revocation, removal, ownership transfer, and Auth-user cascades.");
} catch (error) {
  console.error(`Live Supabase verification failed during ${stage}: ${safeMessage(error?.message)}.`);
  process.exitCode = 1;
} finally {
  try {
    setStage("fixture cleanup");
    await cleanup();
    await verifyCleanup();
    console.log("Live Supabase cleanup passed: generated database rows and Auth identities were removed.");
  } catch (error) {
    console.error(`Live Supabase verification failed during ${stage}: ${safeMessage(error?.message)}.`);
    process.exitCode = 1;
  }
}
