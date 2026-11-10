create or replace function public.admin_financial_summary()
returns jsonb
language plpgsql
security definer
set search_path=public
as $function$
declare
  v_usage_usd numeric:=0;
  v_rewards_rwf numeric:=0;
  v_rate numeric:=0;
  v_owner numeric:=40;
  v_respondent numeric:=42;
  v_reserve numeric:=18;
  v_gross_rwf numeric:=0;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select coalesce(sum(abs(amount_usd)),0) into v_usage_usd
  from public.partner_billing
  where event_type='response_charge';

  select coalesce(sum(sr.reward_rwf),0) into v_rewards_rwf
  from public.survey_responses sr
  join public.surveys s on s.id=sr.survey_id
  where sr.status='submitted' and s.partner_id is not null;

  select coalesce((value #>> '{}')::numeric,0) into v_rate
  from public.platform_settings where key='usd_to_rwf_rate';

  select
    coalesce((value->'partner'->>'owner')::numeric,40),
    coalesce((value->'partner'->>'respondent')::numeric,42),
    coalesce((value->'partner'->>'reserve')::numeric,18)
  into v_owner,v_respondent,v_reserve
  from public.platform_settings where key='revenue_splits';

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
    'response_count',(select count(*) from public.partner_billing where event_type='response_charge')
  );
end;
$function$;

revoke all on function public.admin_financial_summary() from public,anon;
grant execute on function public.admin_financial_summary() to authenticated;
