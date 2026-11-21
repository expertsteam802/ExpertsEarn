grant select, insert on public.account_security_events to authenticated;

create or replace function public.enforce_active_account_for_rewards()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  target_user uuid;
  target_status text;
  locked_until timestamptz;
begin
  target_user := coalesce(
    nullif(to_jsonb(new)->>'respondent_id','')::uuid,
    nullif(to_jsonb(new)->>'user_id','')::uuid
  );
  if target_user is null then return new; end if;
  select account_status, account_locked_until
    into target_status, locked_until
  from public.profiles where id = target_user;
  if target_status = 'suspended'
     or (target_status = 'locked' and (locked_until is null or locked_until > now())) then
    raise exception 'Account temporarily restricted. Contact ExpertsEarn support.';
  end if;
  return new;
end;
$$;
