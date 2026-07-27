begin;

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

commit;
