
alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists account_locked_until timestamptz,
  add column if not exists account_status_reason text,
  add column if not exists account_status_updated_at timestamptz,
  add column if not exists account_status_updated_by uuid references public.profiles(id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_account_status_check') then
    alter table public.profiles add constraint profiles_account_status_check
      check (account_status in ('active','locked','suspended'));
  end if;
end $$;

create table if not exists public.account_security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null default 'session_check' check (event_type in ('session_check','country_change')),
  ip_hash text,
  country_code text,
  region text,
  city text,
  user_agent text,
  risk_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists account_security_events_user_created_idx
  on public.account_security_events(user_id, created_at desc);
create index if not exists account_security_events_created_idx
  on public.account_security_events(created_at desc);
alter table public.account_security_events enable row level security;
revoke all on public.account_security_events from anon, authenticated;
grant insert on public.account_security_events to authenticated;
create policy "Members can record their own security events"
  on public.account_security_events for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Admins can review security events"
  on public.account_security_events for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

create or replace function public.admin_set_account_status(
  p_user_id uuid,
  p_status text,
  p_reason text default null,
  p_locked_until timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Administrator access required';
  end if;
  if p_user_id is null or p_user_id = auth.uid() then
    raise exception 'You cannot change your own account status';
  end if;
  if p_status not in ('active','locked','suspended') then
    raise exception 'Invalid account status';
  end if;
  if p_status in ('locked','suspended') and coalesce(length(trim(p_reason)),0) < 5 then
    raise exception 'Provide a reason of at least five characters';
  end if;
  if p_status = 'locked' and p_locked_until is not null and p_locked_until <= now() then
    raise exception 'Lock expiry must be in the future';
  end if;
  update public.profiles
  set account_status = p_status,
      account_locked_until = case when p_status = 'locked' then p_locked_until else null end,
      account_status_reason = case when p_status = 'active' then null else trim(p_reason) end,
      account_status_updated_at = now(),
      account_status_updated_by = auth.uid(),
      updated_at = now()
  where id = p_user_id;
  if not found then raise exception 'Account not found'; end if;
end;
$$;
revoke all on function public.admin_set_account_status(uuid,text,text,timestamptz) from public, anon;
grant execute on function public.admin_set_account_status(uuid,text,text,timestamptz) to authenticated;

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
  target_user := coalesce(new.respondent_id, new.user_id);
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

drop trigger if exists enforce_active_account_on_survey_response on public.survey_responses;
create trigger enforce_active_account_on_survey_response
before insert or update of status on public.survey_responses
for each row execute function public.enforce_active_account_for_rewards();

drop trigger if exists enforce_active_account_on_payout_request on public.payout_requests;
create trigger enforce_active_account_on_payout_request
before insert on public.payout_requests
for each row execute function public.enforce_active_account_for_rewards();
