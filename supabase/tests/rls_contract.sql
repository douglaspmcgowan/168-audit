begin;

create or replace function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if condition is distinct from true then
    raise exception 'RLS contract failed: %', message;
  end if;
end;
$$;

select pg_temp.assert_true(
  (
    select count(*) = 6
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname in (
        'profiles',
        'audit_weeks',
        'groups',
        'group_memberships',
        'group_invites',
        'group_week_shares'
      )
      and relation.relrowsecurity
  ),
  'every application table must have RLS enabled'
);

select pg_temp.assert_true(
  (
    select count(*) = 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_weeks'
      and policyname = 'audit_weeks_select_owner_or_explicit_group_share'
      and cmd = 'SELECT'
      and qual ilike '%can_read_audit_week%'
  ),
  'week reads must pass through the hardened access helper'
);

select pg_temp.assert_true(
  (
    select pg_get_functiondef(routine.oid) ilike '%group_week_shares%'
      and pg_get_functiondef(routine.oid) ilike '%group_memberships%'
    from pg_proc routine
    join pg_namespace namespace on namespace.oid = routine.pronamespace
    where namespace.nspname = 'public'
      and routine.proname = 'can_read_audit_week'
  ),
  'shared week access must require both an explicit share and current membership'
);

select pg_temp.assert_true(
  (
    select count(*) = 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_week_shares'
      and policyname = 'group_week_shares_insert_week_owner_and_member'
      and cmd = 'INSERT'
      and with_check ilike '%owns_audit_week%'
      and with_check ilike '%is_group_member%'
  ),
  'only a week owner who belongs to the destination group may share it'
);

select pg_temp.assert_true(
  not has_table_privilege('authenticated', 'public.group_memberships', 'INSERT')
  and not has_table_privilege('authenticated', 'public.group_memberships', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.group_memberships', 'DELETE'),
  'membership changes must use checked RPCs'
);

select pg_temp.assert_true(
  not has_table_privilege('authenticated', 'public.group_invites', 'INSERT')
  and not has_table_privilege('authenticated', 'public.group_invites', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.group_invites', 'DELETE'),
  'invite changes must use checked RPCs'
);

select pg_temp.assert_true(
  not has_column_privilege('authenticated', 'public.audit_weeks', 'owner_id', 'INSERT')
  and not has_column_privilege('authenticated', 'public.audit_weeks', 'owner_id', 'UPDATE'),
  'clients must not assign or transfer audit ownership'
);

select pg_temp.assert_true(
  not has_column_privilege('authenticated', 'public.groups', 'owner_id', 'UPDATE'),
  'group ownership changes must use the transfer RPC'
);

select pg_temp.assert_true(
  (
    select bool_and(
      exists (
        select 1
        from unnest(coalesce(routine.proconfig, array[]::text[])) setting
        where setting like 'search_path=%'
      )
    )
    from pg_proc routine
    join pg_namespace namespace on namespace.oid = routine.pronamespace
    where namespace.nspname = 'public'
      and routine.proname in (
        'handle_new_user',
        'add_group_owner_membership',
        'is_group_member',
        'is_group_manager',
        'is_group_owner',
        'owns_audit_week',
        'can_read_audit_week',
        'create_group_invite',
        'save_audit_week',
        'redeem_group_invite',
        'revoke_group_invite',
        'leave_group',
        'remove_group_member',
        'set_group_member_role',
        'transfer_group_ownership'
      )
  ),
  'every privileged helper and RPC must pin search_path'
);

select pg_temp.assert_true(
  (
    select count(*) = 0
    from pg_proc routine
    join pg_namespace namespace on namespace.oid = routine.pronamespace
    where namespace.nspname = 'public'
      and routine.proname in (
        'is_group_member',
        'is_group_manager',
        'is_group_owner',
        'owns_audit_week',
        'can_read_audit_week',
        'create_group_invite',
        'save_audit_week',
        'redeem_group_invite',
        'revoke_group_invite',
        'leave_group',
        'remove_group_member',
        'set_group_member_role',
        'transfer_group_ownership'
      )
      and has_function_privilege(
        'anon',
        routine.oid,
        'EXECUTE'
      )
  ),
  'anonymous callers must not execute group RPCs'
);

select pg_temp.assert_true(
  (
    select count(*) = 4
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'group_memberships', 'group_invites')
  ),
  'profile, roster, and invite policy set must stay complete'
);

rollback;
