insert into public.platform_settings(key,value,updated_at)
values('usd_to_rwf_rate','0'::jsonb,now())
on conflict(key) do nothing;

create or replace function public.complete_survey_response(p_response_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare
  v_user uuid := auth.uid();
  v_response public.survey_responses%rowtype;
  v_survey public.surveys%rowtype;
  v_required integer;
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

  if v_survey.partner_id is not null and coalesce(v_survey.partner_price_usd,0)>0 then
    select id into v_partner_account from public.partner_accounts where user_id=v_survey.partner_id;
    if v_partner_account is not null then
      insert into public.partner_billing(partner_id,survey_id,event_type,amount_usd,currency,description)
      values(v_partner_account,v_survey.id,'response_charge',-abs(v_survey.partner_price_usd),'USD',
        'Billable API usage: one verified completed response');
    end if;
  end if;

  update public.surveys set response_count=response_count+1,updated_at=now() where id=v_survey.id;
  return jsonb_build_object('success',true,'reward_rwf',v_reward,'duration_seconds',v_elapsed,
    'partner_usage_usd',case when v_survey.partner_id is not null then coalesce(v_survey.partner_price_usd,0) else 0 end);
end;
$function$;

revoke all on function public.complete_survey_response(uuid) from public,anon;
grant execute on function public.complete_survey_response(uuid) to authenticated;
