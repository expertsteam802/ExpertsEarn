revoke insert on public.account_security_events from authenticated;
drop policy if exists "Members can record their own security events" on public.account_security_events;
grant select on public.account_security_events to authenticated;