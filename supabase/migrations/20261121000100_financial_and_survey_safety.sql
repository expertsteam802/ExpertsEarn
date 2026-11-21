alter table public.surveys
  add column if not exists reserved_budget_usd numeric(12,2) not null default 0;

-- Hide active surveys that have no respondent reward and cap legacy uncapped
-- paid surveys so an accidental unlimited publication cannot create an
-- unbounded wallet liability. Admins can raise the cap after funding review.
update public.surveys
  set status='paused',updated_at=now()
  where status='active' and reward_rwf<=0;
update public.surveys
  set response_limit=20,updated_at=now()
  where status='active' and response_limit is null and reward_rwf>0;

drop policy if exists "answers delete own in progress" on public.response_answers;
create policy "answers delete own in progress"
on public.response_answers for delete to authenticated
using (
  exists (
    select 1
    from public.survey_responses r
    join public.survey_questions q on q.id = response_answers.survey_question_id
      and q.survey_id = r.survey_id
    where r.id = response_answers.response_id
      and r.respondent_id = (select auth.uid())
      and r.status = 'in_progress'
  )
);

create or replace function public.admin_set_survey_status(p_survey_id uuid,p_status public.survey_status)
returns boolean
language plpgsql security definer set search_path=public
as $function$
declare
  v_survey public.surveys%rowtype;
  v_question_count integer;
  v_credit numeric(12,2);
  v_budget numeric(12,2);
  v_rate numeric;
  v_respondent_share numeric;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  select * into v_survey from public.surveys where id=p_survey_id for update;
  if not found then raise exception 'Survey not found'; end if;

  if p_status = 'active' then
    if v_survey.response_limit is null or v_survey.response_limit < 1 then
      raise exception 'Every published survey must have a fixed response cap';
    end if;
    select count(*)::integer into v_question_count
      from public.survey_questions where survey_id=p_survey_id;
    if v_question_count < 5 or v_question_count > 10 then
      raise exception 'A survey must contain between 5 and 10 questions before publishing';
    end if;

    if v_survey.partner_id is not null then
      if not exists (
        select 1 from public.partner_accounts p
        where p.user_id=v_survey.partner_id and p.is_approved=true
      ) then raise exception 'Partner account must be approved before publishing'; end if;

      if v_survey.response_limit is null or v_survey.response_limit < 1 then
        raise exception 'Partner surveys must have a fixed response limit'; end if;

      select coalesce((value #>> '{}')::numeric,0) into v_rate
        from public.platform_settings where key='usd_to_rwf_rate';
      select coalesce((value->'partner'->>'respondent')::numeric,0) into v_respondent_share
        from public.platform_settings where key='revenue_splits';
      if v_survey.partner_price_usd<>round(v_survey.partner_price_usd,2) then
        raise exception 'Partner response price must use no more than two decimal places';
      end if;
      if coalesce(v_survey.reward_rwf,0)<=0 then
        raise exception 'Partner surveys must offer a positive respondent reward';
      end if;
      if coalesce(v_survey.reward_rwf,0)>0 then
        if coalesce(v_rate,0)<=0 then
          raise exception 'Configure the USD to RWF rate before publishing surveys with respondent rewards';
        end if;
        if v_survey.reward_rwf > floor(v_survey.partner_price_usd*v_rate*coalesce(v_respondent_share,0)/100) then
          raise exception 'Respondent reward exceeds the funded respondent share for this survey';
        end if;
      end if;

      if coalesce(v_survey.reserved_budget_usd,0)<=0 then
        v_budget:=round((v_survey.response_limit-v_survey.response_count)*v_survey.partner_price_usd,2);
        if v_budget<=0 then raise exception 'There are no remaining funded responses'; end if;
        update public.partner_accounts
          set credit_usd=credit_usd-v_budget
          where user_id=v_survey.partner_id and is_approved=true and credit_usd>=v_budget
          returning credit_usd into v_credit;
        if not found then
          raise exception 'Insufficient partner credit. Add funds before publishing this survey. Required: $%',to_char(v_budget,'FM999999990.00');
        end if;
        update public.surveys set reserved_budget_usd=v_budget where id=p_survey_id;
      end if;
    end if;
  elsif v_survey.partner_id is not null and coalesce(v_survey.reserved_budget_usd,0)>0 then
    update public.partner_accounts
      set credit_usd=credit_usd+v_survey.reserved_budget_usd
      where user_id=v_survey.partner_id;
    update public.surveys set reserved_budget_usd=0 where id=p_survey_id;
  end if;

  update public.surveys set status=p_status,updated_at=now() where id=p_survey_id;
  return true;
end;
$function$;

revoke all on function public.admin_set_survey_status(uuid,public.survey_status) from public,anon;
grant execute on function public.admin_set_survey_status(uuid,public.survey_status) to authenticated;

create or replace function public.admin_adjust_partner_credit(
  p_partner_account_id uuid,
  p_amount_usd numeric,
  p_note text default null
)
returns numeric
language plpgsql security definer set search_path=public
as $function$
declare
  v_balance numeric(12,2);
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_amount_usd is null or p_amount_usd<=0 or p_amount_usd>100000 then
    raise exception 'Credit amount must be greater than $0 and no more than $100,000';
  end if;
  update public.partner_accounts
    set credit_usd=credit_usd+p_amount_usd
    where id=p_partner_account_id
    returning credit_usd into v_balance;
  if not found then raise exception 'Partner account not found'; end if;
  insert into public.partner_billing(partner_id,event_type,amount_usd,currency,description)
  values(p_partner_account_id,'credit_topup',p_amount_usd,'USD',
    'Admin-recorded credit: '||left(coalesce(nullif(trim(p_note),''),'payment verified externally'),180));
  return v_balance;
end;
$function$;

revoke all on function public.admin_adjust_partner_credit(uuid,numeric,text) from public,anon;
grant execute on function public.admin_adjust_partner_credit(uuid,numeric,text) to authenticated;

create or replace function public.complete_survey_response(p_response_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare
  v_user uuid := auth.uid();
  v_response public.survey_responses%rowtype;
  v_survey public.surveys%rowtype;
  v_required integer;
  v_question_count integer;
  v_answered integer;
  v_elapsed integer;
  v_reward integer;
  v_partner_account uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_response from public.survey_responses
   where id=p_response_id and respondent_id=v_user for update;
  if not found then raise exception 'Response not found'; end if;
  if v_response.status<>'in_progress' then raise exception 'Response is already submitted'; end if;
  select * into v_survey from public.surveys where id=v_response.survey_id for update;
  if not found or v_survey.status<>'active' then raise exception 'Survey is no longer active'; end if;

  select count(*)::integer into v_question_count from public.survey_questions where survey_id=v_survey.id;
  if v_question_count<5 or v_question_count>10 then
    raise exception 'This survey is not configured correctly. Please contact support; your answers have not been submitted';
  end if;

  if v_survey.partner_id is not null then
    select id into v_partner_account
      from public.partner_accounts
      where user_id=v_survey.partner_id and is_approved=true
      for update;
    if v_partner_account is null or coalesce(v_survey.reserved_budget_usd,0)<v_survey.partner_price_usd then
      raise exception 'This survey is temporarily unable to accept submissions. Your answers have not been submitted';
    end if;
  end if;

  select count(*) into v_required from public.survey_questions where survey_id=v_survey.id and required=true;
  select count(*) into v_answered from public.response_answers a
   join public.survey_questions q on q.id=a.survey_question_id
   where a.response_id=v_response.id and q.required=true;
  if v_answered<v_required then raise exception 'Please answer all required questions'; end if;
  v_elapsed:=greatest(0,floor(extract(epoch from (now()-v_response.started_at)))::integer);
  if v_elapsed<greatest(10,v_required*3) then raise exception 'Please take more time to complete this survey'; end if;
  if v_survey.response_limit is not null and v_survey.response_count>=v_survey.response_limit then raise exception 'Survey response limit reached'; end if;

  v_reward:=greatest(0,coalesce(v_survey.reward_rwf,0));
  update public.survey_responses set status='submitted',submitted_at=now(),duration_seconds=v_elapsed,reward_rwf=v_reward where id=v_response.id;

  insert into public.wallets(user_id,balance_rwf,lifetime_earned_rwf,updated_at)
  values(v_user,v_reward,v_reward,now())
  on conflict(user_id) do update set
    balance_rwf=public.wallets.balance_rwf+excluded.balance_rwf,
    lifetime_earned_rwf=public.wallets.lifetime_earned_rwf+excluded.lifetime_earned_rwf,
    updated_at=now();

  insert into public.wallet_transactions(user_id,amount_rwf,transaction_type,description,reference_id)
  values(v_user,v_reward,'survey_reward','Completed survey: '||v_survey.title,v_survey.id);

  if v_partner_account is not null then
    update public.surveys
      set reserved_budget_usd=greatest(0,reserved_budget_usd-v_survey.partner_price_usd)
      where id=v_survey.id;
    insert into public.partner_billing(partner_id,survey_id,event_type,amount_usd,currency,description)
    values(v_partner_account,v_survey.id,'response_charge',-abs(v_survey.partner_price_usd),'USD',
      'Pre-funded usage: one verified completed response');
  end if;

  update public.surveys set response_count=response_count+1,updated_at=now() where id=v_survey.id;
  return jsonb_build_object('success',true,'reward_rwf',v_reward,'duration_seconds',v_elapsed,
    'partner_usage_usd',case when v_partner_account is not null then coalesce(v_survey.partner_price_usd,0) else 0 end);
end;
$function$;

revoke all on function public.complete_survey_response(uuid) from public,anon;
grant execute on function public.complete_survey_response(uuid) to authenticated;

create or replace function public.request_payout(p_amount_rwf bigint,p_method text,p_destination text)
returns uuid language plpgsql security definer set search_path=public
as $function$
declare
  v_user uuid:=auth.uid();
  v_balance bigint;
  v_minimum bigint:=1000;
  v_identity_verified timestamptz;
  v_payout_id uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select coalesce((value #>> '{}')::bigint,1000) into v_minimum
    from public.platform_settings where key='minimum_payout_rwf';
  v_minimum:=greatest(1000,coalesce(v_minimum,1000));
  if p_amount_rwf is null or p_amount_rwf<v_minimum then
    raise exception 'Minimum payout is % RWF',to_char(v_minimum,'FM999999999');
  end if;
  if p_method not in ('mtn_momo','airtel_money','paypal','wise') then raise exception 'Unsupported payout method'; end if;
  if length(trim(coalesce(p_destination,'')))<4 then raise exception 'Enter a valid payout destination'; end if;
  select balance_rwf into v_balance from public.wallets where user_id=v_user for update;
  if v_balance is null or v_balance<p_amount_rwf then raise exception 'Insufficient wallet balance'; end if;
  select identity_verified_at into v_identity_verified from public.profiles where id=v_user for update;
  if v_identity_verified is null then raise exception 'Complete identity verification before requesting a payout'; end if;
  update public.wallets set balance_rwf=balance_rwf-p_amount_rwf,updated_at=now() where user_id=v_user;
  insert into public.payout_requests(user_id,amount_rwf,method,destination)
  values(v_user,p_amount_rwf,p_method,trim(p_destination)) returning id into v_payout_id;
  insert into public.wallet_transactions(user_id,amount_rwf,transaction_type,description,reference_id)
  values(v_user,-p_amount_rwf,'payout','Payout request ('||p_method||')',v_payout_id);
  return v_payout_id;
end;
$function$;

revoke all on function public.request_payout(bigint,text,text) from public,anon;
grant execute on function public.request_payout(bigint,text,text) to authenticated;


create or replace function public.admin_update_survey_terms(
  p_survey_id uuid,
  p_reward_rwf integer,
  p_response_limit integer default null
)
returns void language plpgsql security definer set search_path=public
as $function$
declare
  v_survey public.surveys%rowtype;
  v_rate numeric;
  v_respondent_share numeric;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_reward_rwf is null or p_reward_rwf<0 or p_reward_rwf>1000000 then
    raise exception 'Reward must be between 0 and 1,000,000 RWF';
  end if;
  if p_response_limit is null or p_response_limit<1 or p_response_limit>1000000 then
    raise exception 'Every survey must have a response cap between 1 and 1,000,000';
  end if;
  select * into v_survey from public.surveys where id=p_survey_id for update;
  if not found or v_survey.status not in ('draft','paused') then
    raise exception 'Only draft or paused surveys can be edited';
  end if;
  if v_survey.partner_id is not null then
    if v_survey.partner_price_usd<>round(v_survey.partner_price_usd,2) then
      raise exception 'Partner response price must use no more than two decimal places';
    end if;
    select coalesce((value #>> '{}')::numeric,0) into v_rate
      from public.platform_settings where key='usd_to_rwf_rate';
    select coalesce((value->'partner'->>'respondent')::numeric,0) into v_respondent_share
      from public.platform_settings where key='revenue_splits';
    if p_reward_rwf>0 and (
      coalesce(v_rate,0)<=0 or
      p_reward_rwf>floor(v_survey.partner_price_usd*v_rate*coalesce(v_respondent_share,0)/100)
    ) then
      raise exception 'Reward exceeds the configured funded respondent share. Check the USD/RWF rate and partner revenue split';
    end if;
  end if;
  update public.surveys
    set reward_rwf=p_reward_rwf,response_limit=p_response_limit,updated_at=now()
    where id=p_survey_id;
end;
$function$;

revoke all on function public.admin_update_survey_terms(uuid,integer,integer) from public,anon;
grant execute on function public.admin_update_survey_terms(uuid,integer,integer) to authenticated;

create or replace function public.start_survey_response(p_survey_id uuid,p_ip_hash text default null)
returns uuid language plpgsql security definer set search_path=public
as $function$
declare
  v_user uuid:=auth.uid();
  v_survey public.surveys%rowtype;
  v_profile public.profiles%rowtype;
  v_age integer;
  v_response_id uuid;
  v_question_count integer;
  v_daily_cap integer:=20;
  v_today_count integer:=0;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_profile from public.profiles where id=v_user;
  if not found then raise exception 'Complete your profile before starting a survey'; end if;

  select coalesce((value #>> '{}')::integer,20) into v_daily_cap
    from public.platform_settings where key='daily_survey_cap';
  v_daily_cap:=greatest(1,coalesce(v_daily_cap,20));
  select count(*)::integer into v_today_count
    from public.survey_responses
    where respondent_id=v_user
      and started_at>=date_trunc('day',now())
      and status in ('in_progress','submitted');
  if v_today_count>=v_daily_cap then raise exception 'Daily survey limit reached'; end if;

  select * into v_survey from public.surveys where id=p_survey_id for update;
  if not found or v_survey.status<>'active' then raise exception 'Survey is not available'; end if;
  select count(*)::integer into v_question_count from public.survey_questions where survey_id=p_survey_id;
  if v_question_count<5 or v_question_count>10 then raise exception 'This survey is not available because its question count is invalid'; end if;
  if v_survey.starts_at is not null and now()<v_survey.starts_at then raise exception 'Survey has not started'; end if;
  if v_survey.ends_at is not null and now()>v_survey.ends_at then raise exception 'Survey has ended'; end if;
  if v_survey.target_country is not null and v_survey.target_country<>v_profile.country_code then raise exception 'This survey is not available in your country'; end if;
  if v_survey.target_region is not null and v_survey.target_region<>v_profile.region then raise exception 'This survey is not available in your region'; end if;
  if v_survey.target_city is not null and v_survey.target_city<>v_profile.city then raise exception 'This survey is not available in your city'; end if;
  if v_survey.target_province is not null and v_survey.target_province<>v_profile.province then raise exception 'This survey is not available in your province'; end if;
  if v_survey.target_district is not null and v_survey.target_district<>v_profile.district then raise exception 'This survey is not available in your district'; end if;
  if v_survey.target_sector is not null and v_survey.target_sector<>v_profile.sector then raise exception 'This survey is not available in your sector'; end if;
  if v_survey.target_cell is not null and v_survey.target_cell<>v_profile.cell then raise exception 'This survey is not available in your cell'; end if;
  if v_survey.target_village is not null and v_survey.target_village<>v_profile.village then raise exception 'This survey is not available in your village'; end if;
  if v_survey.target_gender is not null and (v_profile.gender is null or v_survey.target_gender<>v_profile.gender) then raise exception 'This survey is not available for your profile'; end if;
  if v_profile.date_of_birth is not null then
    v_age:=date_part('year',age(current_date,v_profile.date_of_birth))::integer;
    if v_survey.min_age is not null and v_age<v_survey.min_age then raise exception 'You do not meet the minimum age requirement'; end if;
    if v_survey.max_age is not null and v_age>v_survey.max_age then raise exception 'You do not meet the maximum age requirement'; end if;
  elsif v_survey.min_age is not null or v_survey.max_age is not null then
    raise exception 'Add your date of birth to check survey eligibility';
  end if;
  if v_survey.response_limit is not null and v_survey.response_count>=v_survey.response_limit then raise exception 'Survey is full'; end if;

  -- Keep the IP hash for fraud investigation, but do not reject every person
  -- behind the same household, school, office or mobile-carrier NAT.
  insert into public.survey_responses(survey_id,respondent_id,ip_hash)
    values(p_survey_id,v_user,p_ip_hash)
    returning id into v_response_id;
  return v_response_id;
exception when unique_violation then
  raise exception 'You have already started or completed this survey';
end;
$function$;

revoke all on function public.start_survey_response(uuid,text) from public,anon;
grant execute on function public.start_survey_response(uuid,text) to authenticated;

create or replace function public.admin_financial_summary()
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare
  v_usage_usd numeric:=0;
  v_rewards_rwf numeric:=0;
  v_rate numeric:=0;
  v_owner numeric:=40;
  v_respondent numeric:=42;
  v_reserve numeric:=18;
  v_gross_rwf numeric:=0;
  v_wallet_liability bigint:=0;
  v_pending_payout bigint:=0;
  v_pending_count bigint:=0;
  v_partner_credit numeric:=0;
  v_reserved_budget numeric:=0;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;
  select coalesce(sum(abs(amount_usd)),0) into v_usage_usd
    from public.partner_billing where event_type='response_charge';
  select coalesce(sum(sr.reward_rwf),0) into v_rewards_rwf
    from public.survey_responses sr join public.surveys s on s.id=sr.survey_id
    where sr.status='submitted' and s.partner_id is not null;
  select coalesce((value #>> '{}')::numeric,0) into v_rate
    from public.platform_settings where key='usd_to_rwf_rate';
  select coalesce((value->'partner'->>'owner')::numeric,40),
         coalesce((value->'partner'->>'respondent')::numeric,42),
         coalesce((value->'partner'->>'reserve')::numeric,18)
    into v_owner,v_respondent,v_reserve
    from public.platform_settings where key='revenue_splits';
  select coalesce(sum(balance_rwf),0) into v_wallet_liability from public.wallets;
  select coalesce(sum(amount_rwf),0),count(*) into v_pending_payout,v_pending_count
    from public.payout_requests where status in ('pending','processing');
  select coalesce(sum(credit_usd),0) into v_partner_credit from public.partner_accounts;
  select coalesce(sum(reserved_budget_usd),0) into v_reserved_budget from public.surveys;
  v_gross_rwf:=v_usage_usd*v_rate;
  return jsonb_build_object(
    'partner_usage_usd',round(v_usage_usd,2),
    'partner_usage_rwf_estimate',round(v_gross_rwf),
    'respondent_rewards_rwf',v_rewards_rwf,
    'estimated_margin_before_other_costs_rwf',round(v_gross_rwf-v_rewards_rwf),
    'platform_share_target_rwf',round(v_gross_rwf*v_owner/100),
    'respondent_pool_target_rwf',round(v_gross_rwf*v_respondent/100),
    'reserve_target_rwf',round(v_gross_rwf*v_reserve/100),
    'usd_to_rwf_rate',v_rate,
    'response_count',(select count(*) from public.partner_billing where event_type='response_charge'),
    'wallet_liability_rwf',v_wallet_liability,
    'pending_payout_liability_rwf',v_pending_payout,
    'pending_payout_count',v_pending_count,
    'available_partner_credit_usd',round(v_partner_credit,2),
    'reserved_partner_budget_usd',round(v_reserved_budget,2)
  );
end;
$function$;

revoke all on function public.admin_financial_summary() from public,anon;
grant execute on function public.admin_financial_summary() to authenticated;


create or replace function public.admin_financial_summary()
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare
  v_usage_usd numeric:=0;
  v_rewards_rwf numeric:=0;
  v_rate numeric:=0;
  v_owner numeric:=40;
  v_respondent numeric:=42;
  v_reserve numeric:=18;
  v_gross_rwf numeric:=0;
  v_wallet_liability bigint:=0;
  v_lifetime_earned bigint:=0;
  v_lifetime_paid bigint:=0;
  v_wallet_count bigint:=0;
  v_pending_payout bigint:=0;
  v_pending_count bigint:=0;
  v_partner_credit numeric:=0;
  v_reserved_budget numeric:=0;
  v_owner_reward_exposure bigint:=0;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;
  select coalesce(sum(abs(amount_usd)),0) into v_usage_usd
    from public.partner_billing where event_type='response_charge';
  select coalesce(sum(sr.reward_rwf),0) into v_rewards_rwf
    from public.survey_responses sr join public.surveys s on s.id=sr.survey_id
    where sr.status='submitted' and s.partner_id is not null;
  select coalesce((value #>> '{}')::numeric,0) into v_rate
    from public.platform_settings where key='usd_to_rwf_rate';
  select coalesce((value->'partner'->>'owner')::numeric,40),
         coalesce((value->'partner'->>'respondent')::numeric,42),
         coalesce((value->'partner'->>'reserve')::numeric,18)
    into v_owner,v_respondent,v_reserve
    from public.platform_settings where key='revenue_splits';
  select coalesce(sum(balance_rwf),0),coalesce(sum(lifetime_earned_rwf),0),
         coalesce(sum(lifetime_paid_rwf),0),count(*)
    into v_wallet_liability,v_lifetime_earned,v_lifetime_paid,v_wallet_count
    from public.wallets;
  select coalesce(sum(amount_rwf),0),count(*) into v_pending_payout,v_pending_count
    from public.payout_requests where status in ('pending','processing');
  select coalesce(sum(credit_usd),0) into v_partner_credit from public.partner_accounts;
  select coalesce(sum(reserved_budget_usd),0) into v_reserved_budget from public.surveys;
  select coalesce(sum(greatest(0,response_limit-response_count)*reward_rwf),0)
    into v_owner_reward_exposure
    from public.surveys
    where status='active' and partner_id is null and response_limit is not null;
  v_gross_rwf:=v_usage_usd*v_rate;
  return jsonb_build_object(
    'partner_usage_usd',round(v_usage_usd,2),
    'partner_usage_rwf_estimate',round(v_gross_rwf),
    'respondent_rewards_rwf',v_rewards_rwf,
    'estimated_margin_before_other_costs_rwf',round(v_gross_rwf-v_rewards_rwf),
    'platform_share_target_rwf',round(v_gross_rwf*v_owner/100),
    'respondent_pool_target_rwf',round(v_gross_rwf*v_respondent/100),
    'reserve_target_rwf',round(v_gross_rwf*v_reserve/100),
    'usd_to_rwf_rate',v_rate,
    'response_count',(select count(*) from public.partner_billing where event_type='response_charge'),
    'wallet_liability_rwf',v_wallet_liability,
    'lifetime_earned_rwf',v_lifetime_earned,
    'lifetime_paid_rwf',v_lifetime_paid,
    'wallet_count',v_wallet_count,
    'pending_payout_liability_rwf',v_pending_payout,
    'pending_payout_count',v_pending_count,
    'available_partner_credit_usd',round(v_partner_credit,2),
    'reserved_partner_budget_usd',round(v_reserved_budget,2),
    'owner_funded_reward_exposure_rwf',v_owner_reward_exposure
  );
end;
$function$;

revoke all on function public.admin_financial_summary() from public,anon;
grant execute on function public.admin_financial_summary() to authenticated;
