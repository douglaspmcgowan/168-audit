import fs from "node:fs";

const migrationPath = "supabase/migrations/202607250001_multi_user_center.sql";
const sql = fs.readFileSync(migrationPath, "utf8");
const rlsContract = fs.readFileSync("supabase/tests/rls_contract.sql", "utf8");
const liveVerifier = fs.readFileSync("tests/verify-supabase-live.mjs", "utf8");
const liveLauncher = fs.readFileSync("tests/run-supabase-live.ps1", "utf8");
const failures = [];

const requirePattern = (label, pattern) => {
  if (!pattern.test(sql)) failures.push(label);
};

for (const table of [
  "profiles",
  "audit_weeks",
  "groups",
  "group_memberships",
  "group_invites",
  "group_week_shares",
]) {
  requirePattern(`${table}: table`, new RegExp(`create table public\\.${table}\\b`, "i"));
  requirePattern(`${table}: RLS`, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  requirePattern(`${table}: anon revoked`, new RegExp(`revoke all on table public\\.${table} from anon`, "i"));
}

requirePattern("explicit share relation", /create table public\.group_week_shares/i);
requirePattern("shared-week membership check", /join public\.group_memberships[\s\S]+share\.group_id/i);
requirePattern("owner-only share creation", /group_week_shares_insert_week_owner_and_member[\s\S]+owns_audit_week/i);
requirePattern("owner-only week writes", /audit_weeks_update_owner[\s\S]+owner_id = auth\.uid\(\)/i);
requirePattern("hashed invite lookup", /digest\([^)]*invite_token[^)]*'sha256'\)/i);
requirePattern("invite row lock", /for update/i);
requirePattern("invite expiry check", /expires_at <= now\(\)/i);
requirePattern("single group owner", /unique index group_memberships_one_owner/i);
requirePattern("single week per owner/date", /unique index audit_weeks_owner_week_unique/i);
requirePattern("optimistic week version", /version bigint not null default 1/i);
requirePattern("version-checked week save", /save_audit_week[\s\S]+version = expected_version/i);
requirePattern("non-retrying week conflict", /save_audit_week[\s\S]+errcode = 'PT409'/i);
requirePattern("fixed helper search paths", /security definer\s+set search_path = pg_catalog, public/i);
requirePattern("public function execution revoked", /revoke all on function public\.redeem_group_invite\(text\) from public/i);
requirePattern("anonymous function execution revoked", /revoke all on function public\.redeem_group_invite\(text\) from anon/i);
requirePattern("authenticated RPC grant", /grant execute on function public\.redeem_group_invite\(text\) to authenticated/i);

const hardeningSql = fs.readFileSync("supabase/migrations/202607260001_revoke_anon_rpc_execute.sql", "utf8");
for (const rpc of ["save_audit_week", "redeem_group_invite", "transfer_group_ownership"]) {
  if (!new RegExp(`revoke all on function public\\.${rpc}\\b[\\s\\S]* from anon`, "i").test(hardeningSql)) {
    failures.push(`hardening migration revokes anon ${rpc}`);
  }
}

const conflictSql = fs.readFileSync("supabase/migrations/202607260002_week_conflict_status.sql", "utf8");
if (!/save_audit_week[\s\S]+errcode = 'PT409'/i.test(conflictSql)) {
  failures.push("conflict repair migration uses PT409");
}
const serverSource = fs.readFileSync("server.js", "utf8");
if (!/error\.code === "PT409"/.test(serverSource)) {
  failures.push("cloud error normalization recognizes PT409");
}
if (/groups\(id,name,created_by\)/.test(serverSource)) {
  failures.push("Center group query uses the real groups schema");
}
if (!/const newGroupId = crypto\.randomUUID\(\)[\s\S]*insert\(\{ id: newGroupId, name:/i.test(serverSource)) {
  failures.push("Center creates groups without an RLS-sensitive returning query");
}

if (!/save_audit_week/.test(rlsContract)) {
  failures.push("SQL contract covers save_audit_week");
}
if (!/routine\.proname in \([\s\S]*'save_audit_week'[\s\S]*\)[\s\S]*search_path/i.test(rlsContract)
    && !/search_path[\s\S]*routine\.proname in \([\s\S]*'save_audit_week'/i.test(rlsContract)) {
  failures.push("SQL contract pins save_audit_week search_path");
}
if (!/has_function_privilege\([\s\S]*'anon'[\s\S]*'EXECUTE'/i.test(rlsContract)
    || !/routine\.proname in \([\s\S]*'save_audit_week'/i.test(rlsContract)) {
  failures.push("SQL contract denies anonymous save_audit_week execution");
}

for (const marker of [
  "SUPABASE_ACCESS_TOKEN",
  "LIVE_SUPABASE_PROJECT_REF",
  "/api-keys",
  "/database/query",
]) {
  if (!liveVerifier.includes(marker)) failures.push(`live verifier uses ${marker}`);
}
for (const obsolete of [
  "LIVE_SUPABASE_DATABASE_URL",
  "LIVE_SUPABASE_SERVICE_ROLE_KEY",
  "LIVE_SUPABASE_ANON_KEY",
]) {
  if (liveVerifier.includes(obsolete)) failures.push(`live verifier omits ${obsolete}`);
}
if (!liveLauncher.includes("GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'User')")) {
  failures.push("live launcher reads PAT from Windows User scope");
}
if (!liveLauncher.includes("Remove-Item Env:SUPABASE_ACCESS_TOKEN")) {
  failures.push("live launcher clears the child PAT");
}

if (/\b(service_role|SUPABASE_SERVICE|sb_secret_)\b/i.test(sql)) {
  failures.push("server-only credential marker appears in migration");
}

if (failures.length) {
  console.error(`Schema contract failed (${failures.length}):`);
  failures.forEach(item => console.error(`  - ${item}`));
  process.exit(1);
}

console.log("Schema contract passed: RLS, ownership, explicit sharing, invite, and grant invariants are present.");
