begin;

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Audit member'
    check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_weeks (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'My week'
    check (char_length(btrim(title)) between 1 and 120),
  week_start date,
  audit_document jsonb not null default '{}'::jsonb
    check (jsonb_typeof(audit_document) = 'object'),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_memberships (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create unique index group_memberships_one_owner
  on public.group_memberships (group_id)
  where role = 'owner';

create table public.group_invites (
  id uuid primary key default extensions.gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  token_digest bytea not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses between 1 and 1000),
  use_count integer not null default 0 check (use_count >= 0 and use_count <= max_uses),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.group_week_shares (
  group_id uuid not null references public.groups(id) on delete cascade,
  week_id uuid not null references public.audit_weeks(id) on delete cascade,
  shared_by uuid not null references auth.users(id) on delete cascade,
  shared_at timestamptz not null default now(),
  primary key (group_id, week_id)
);

create index audit_weeks_owner_updated_idx
  on public.audit_weeks (owner_id, updated_at desc);
create unique index audit_weeks_owner_week_unique
  on public.audit_weeks (owner_id, week_start)
  where week_start is not null;
create index group_memberships_user_idx
  on public.group_memberships (user_id, joined_at desc);
create index group_invites_group_idx
  on public.group_invites (group_id, created_at desc);
create index group_week_shares_week_idx
  on public.group_week_shares (week_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger audit_weeks_set_updated_at
before update on public.audit_weeks
for each row execute function public.set_updated_at();

create trigger groups_set_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  requested_name text;
begin
  requested_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  insert into public.profiles (user_id, display_name)
  values (new.id, left(coalesce(requested_name, 'Audit member'), 80))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.group_memberships membership
    where membership.group_id = target_group_id
      and membership.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_manager(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.group_memberships membership
    where membership.group_id = target_group_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_group_owner(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.groups audit_group
    where audit_group.id = target_group_id
      and audit_group.owner_id = auth.uid()
  );
$$;

create or replace function public.owns_audit_week(target_week_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.audit_weeks week
    where week.id = target_week_id
      and week.owner_id = auth.uid()
  );
$$;

create or replace function public.can_read_audit_week(target_week_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() is not null and (
    public.owns_audit_week(target_week_id)
    or exists (
      select 1
      from public.group_week_shares share
      join public.group_memberships membership
        on membership.group_id = share.group_id
      where share.week_id = target_week_id
        and membership.user_id = auth.uid()
    )
  );
$$;

create or replace function public.add_group_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.group_memberships (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger groups_add_owner_membership
after insert on public.groups
for each row execute function public.add_group_owner_membership();

create or replace function public.create_group_invite(
  target_group_id uuid,
  valid_for interval default interval '7 days',
  allowed_uses integer default 1
)
returns table (invite_id uuid, invite_token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  raw_token text;
begin
  if auth.uid() is null or not public.is_group_manager(target_group_id) then
    raise exception 'group manager access required' using errcode = '42501';
  end if;
  if valid_for <= interval '0 seconds' or valid_for > interval '90 days' then
    raise exception 'invite lifetime must be between 1 second and 90 days' using errcode = '22023';
  end if;
  if allowed_uses < 1 or allowed_uses > 1000 then
    raise exception 'invite uses must be between 1 and 1000' using errcode = '22023';
  end if;

  raw_token := encode(extensions.gen_random_bytes(24), 'hex');
  return query
    insert into public.group_invites (
      group_id, token_digest, created_by, expires_at, max_uses
    )
    values (
      target_group_id,
      extensions.digest(raw_token, 'sha256'),
      auth.uid(),
      now() + valid_for,
      allowed_uses
    )
    returning id, raw_token, group_invites.expires_at;
end;
$$;

create or replace function public.save_audit_week(
  target_week_id uuid,
  target_title text,
  target_week_start date,
  target_document jsonb,
  expected_version bigint default null
)
returns table (week_id uuid, new_version bigint)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  saved_id uuid;
  saved_version bigint;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(target_title, ''))) not between 1 and 120
    or jsonb_typeof(target_document) <> 'object' then
    raise exception 'invalid audit week' using errcode = '22023';
  end if;

  if target_week_id is null then
    insert into public.audit_weeks (owner_id, title, week_start, audit_document)
    values (auth.uid(), btrim(target_title), target_week_start, target_document)
    returning id, version into saved_id, saved_version;
  else
    update public.audit_weeks
    set title = btrim(target_title),
        week_start = target_week_start,
        audit_document = target_document,
        version = version + 1
    where id = target_week_id
      and owner_id = auth.uid()
      and version = expected_version
    returning id, version into saved_id, saved_version;
    if saved_id is null then
      raise exception 'audit week changed in another session' using errcode = 'PT409';
    end if;
  end if;

  return query select saved_id, saved_version;
end;
$$;

create or replace function public.redeem_group_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  matched_invite public.group_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if invite_token is null or char_length(invite_token) <> 48 then
    raise exception 'invalid invite' using errcode = '22023';
  end if;

  select *
  into matched_invite
  from public.group_invites
  where token_digest = extensions.digest(invite_token, 'sha256')
  for update;

  if not found
    or matched_invite.revoked_at is not null
    or matched_invite.expires_at <= now()
    or matched_invite.use_count >= matched_invite.max_uses then
    raise exception 'invite is unavailable' using errcode = '22023';
  end if;

  insert into public.group_memberships (group_id, user_id, role)
  values (matched_invite.group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  if found then
    update public.group_invites
    set use_count = use_count + 1
    where id = matched_invite.id;
  end if;

  return matched_invite.group_id;
end;
$$;

create or replace function public.revoke_group_invite(target_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_group_id uuid;
begin
  select group_id into target_group_id
  from public.group_invites
  where id = target_invite_id;

  if target_group_id is null or not public.is_group_manager(target_group_id) then
    raise exception 'group manager access required' using errcode = '42501';
  end if;

  update public.group_invites
  set revoked_at = coalesce(revoked_at, now())
  where id = target_invite_id;
end;
$$;

create or replace function public.leave_group(target_group_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if public.is_group_owner(target_group_id) then
    raise exception 'transfer ownership or delete the group before leaving' using errcode = '22023';
  end if;

  delete from public.group_memberships
  where group_id = target_group_id and user_id = auth.uid();
end;
$$;

create or replace function public.remove_group_member(target_group_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_role text;
  target_role text;
begin
  select role into actor_role
  from public.group_memberships
  where group_id = target_group_id and user_id = auth.uid();
  select role into target_role
  from public.group_memberships
  where group_id = target_group_id and user_id = target_user_id;

  if actor_role not in ('owner', 'admin') then
    raise exception 'group manager access required' using errcode = '42501';
  end if;
  if target_role is null or target_role = 'owner' then
    raise exception 'member cannot be removed' using errcode = '22023';
  end if;
  if actor_role = 'admin' and target_role = 'admin' then
    raise exception 'only the owner can remove an admin' using errcode = '42501';
  end if;

  delete from public.group_memberships
  where group_id = target_group_id and user_id = target_user_id;
end;
$$;

create or replace function public.set_group_member_role(
  target_group_id uuid,
  target_user_id uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_group_owner(target_group_id) then
    raise exception 'group owner access required' using errcode = '42501';
  end if;
  if new_role not in ('admin', 'member') then
    raise exception 'role must be admin or member' using errcode = '22023';
  end if;

  update public.group_memberships
  set role = new_role
  where group_id = target_group_id
    and user_id = target_user_id
    and role <> 'owner';

  if not found then
    raise exception 'eligible member not found' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.transfer_group_ownership(
  target_group_id uuid,
  new_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_group_owner(target_group_id) then
    raise exception 'group owner access required' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.group_memberships
    where group_id = target_group_id and user_id = new_owner_id
  ) then
    raise exception 'new owner must already be a group member' using errcode = '22023';
  end if;
  if new_owner_id = auth.uid() then
    return;
  end if;

  update public.group_memberships
  set role = 'admin'
  where group_id = target_group_id and user_id = auth.uid();

  update public.group_memberships
  set role = 'owner'
  where group_id = target_group_id and user_id = new_owner_id;

  update public.groups
  set owner_id = new_owner_id
  where id = target_group_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.audit_weeks enable row level security;
alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.group_invites enable row level security;
alter table public.group_week_shares enable row level security;

create policy profiles_select_self_or_group_member
on public.profiles for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.group_memberships mine
    join public.group_memberships theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.user_id
  )
);

create policy profiles_update_self
on public.profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy audit_weeks_select_owner_or_explicit_group_share
on public.audit_weeks for select
to authenticated
using (
  public.can_read_audit_week(id)
);

create policy audit_weeks_insert_owner
on public.audit_weeks for insert
to authenticated
with check (owner_id = auth.uid());

create policy audit_weeks_update_owner
on public.audit_weeks for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy audit_weeks_delete_owner
on public.audit_weeks for delete
to authenticated
using (owner_id = auth.uid());

create policy groups_select_member
on public.groups for select
to authenticated
using (public.is_group_member(id));

create policy groups_insert_owner
on public.groups for insert
to authenticated
with check (owner_id = auth.uid());

create policy groups_update_manager
on public.groups for update
to authenticated
using (public.is_group_manager(id))
with check (public.is_group_manager(id));

create policy groups_delete_owner
on public.groups for delete
to authenticated
using (owner_id = auth.uid());

create policy group_memberships_select_fellow_member
on public.group_memberships for select
to authenticated
using (public.is_group_member(group_id));

create policy group_invites_select_manager
on public.group_invites for select
to authenticated
using (public.is_group_manager(group_id));

create policy group_week_shares_select_group_member_or_week_owner
on public.group_week_shares for select
to authenticated
using (
  public.is_group_member(group_id)
  or public.owns_audit_week(week_id)
);

create policy group_week_shares_insert_week_owner_and_member
on public.group_week_shares for insert
to authenticated
with check (
  shared_by = auth.uid()
  and public.is_group_member(group_id)
  and public.owns_audit_week(week_id)
);

create policy group_week_shares_delete_week_owner
on public.group_week_shares for delete
to authenticated
using (
  public.owns_audit_week(week_id)
);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.audit_weeks from anon, authenticated;
revoke all on table public.groups from anon, authenticated;
revoke all on table public.group_memberships from anon, authenticated;
revoke all on table public.group_invites from anon, authenticated;
revoke all on table public.group_week_shares from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

grant select, delete on public.audit_weeks to authenticated;
grant insert (id, title, week_start, audit_document) on public.audit_weeks to authenticated;
grant update (title, week_start, audit_document) on public.audit_weeks to authenticated;

grant select, delete on public.groups to authenticated;
grant insert (id, name) on public.groups to authenticated;
grant update (name) on public.groups to authenticated;

grant select on public.group_memberships to authenticated;
grant select on public.group_invites to authenticated;
grant select, insert, delete on public.group_week_shares to authenticated;

revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.add_group_owner_membership() from public;
revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_group_manager(uuid) from public;
revoke all on function public.is_group_owner(uuid) from public;
revoke all on function public.owns_audit_week(uuid) from public;
revoke all on function public.can_read_audit_week(uuid) from public;
revoke all on function public.create_group_invite(uuid, interval, integer) from public;
revoke all on function public.save_audit_week(uuid, text, date, jsonb, bigint) from public;
revoke all on function public.redeem_group_invite(text) from public;
revoke all on function public.revoke_group_invite(uuid) from public;
revoke all on function public.leave_group(uuid) from public;
revoke all on function public.remove_group_member(uuid, uuid) from public;
revoke all on function public.set_group_member_role(uuid, uuid, text) from public;
revoke all on function public.transfer_group_ownership(uuid, uuid) from public;

revoke all on function public.set_updated_at() from anon;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.add_group_owner_membership() from anon;
revoke all on function public.is_group_member(uuid) from anon;
revoke all on function public.is_group_manager(uuid) from anon;
revoke all on function public.is_group_owner(uuid) from anon;
revoke all on function public.owns_audit_week(uuid) from anon;
revoke all on function public.can_read_audit_week(uuid) from anon;
revoke all on function public.create_group_invite(uuid, interval, integer) from anon;
revoke all on function public.save_audit_week(uuid, text, date, jsonb, bigint) from anon;
revoke all on function public.redeem_group_invite(text) from anon;
revoke all on function public.revoke_group_invite(uuid) from anon;
revoke all on function public.leave_group(uuid) from anon;
revoke all on function public.remove_group_member(uuid, uuid) from anon;
revoke all on function public.set_group_member_role(uuid, uuid, text) from anon;
revoke all on function public.transfer_group_ownership(uuid, uuid) from anon;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_manager(uuid) to authenticated;
grant execute on function public.is_group_owner(uuid) to authenticated;
grant execute on function public.owns_audit_week(uuid) to authenticated;
grant execute on function public.can_read_audit_week(uuid) to authenticated;
grant execute on function public.create_group_invite(uuid, interval, integer) to authenticated;
grant execute on function public.save_audit_week(uuid, text, date, jsonb, bigint) to authenticated;
grant execute on function public.redeem_group_invite(text) to authenticated;
grant execute on function public.revoke_group_invite(uuid) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
grant execute on function public.set_group_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.transfer_group_ownership(uuid, uuid) to authenticated;

commit;
