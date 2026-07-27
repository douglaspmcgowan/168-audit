begin;

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

revoke all on function public.save_audit_week(uuid, text, date, jsonb, bigint) from public;
revoke all on function public.save_audit_week(uuid, text, date, jsonb, bigint) from anon;
grant execute on function public.save_audit_week(uuid, text, date, jsonb, bigint) to authenticated;

commit;
