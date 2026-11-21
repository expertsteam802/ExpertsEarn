alter table public.survey_responses
 add column if not exists ec_per_rwf numeric(20,8),
 add column if not exists reward_ec numeric(20,4);

create or replace function public.start_survey_response(p_survey_id uuid,p_ip_hash text default null)
returns uuid language plpgsql security definer set search_path=public
as $function$
declare
 v_user uuid:=auth.uid(); v_survey public.surveys%rowtype; v_profile public.profiles%rowtype;
 v_age integer; v_response_id uuid; v_question_count integer; v_daily_cap integer:=20; v_today_count integer:=0;
 v_ec_rate numeric(20,8);
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 select * into v_profile from public.profiles where id=v_user;
 if not found then raise exception 'Complete your profile before starting a survey'; end if;
 select coalesce((value #>> '{}')::integer,20) into v_daily_cap from public.platform_settings where key='daily_survey_cap';
 v_daily_cap:=greatest(1,coalesce(v_daily_cap,20));
 select count(*)::integer into v_today_count from public.survey_responses
 where respondent_id=v_user and started_at>=date_trunc('day',now()) and status in('in_progress','submitted');
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
 select coalesce((value #>> '{}')::numeric,1) into v_ec_rate from public.platform_settings where key='expertscoins_per_rwf';
 v_ec_rate:=coalesce(v_ec_rate,1);
 if v_ec_rate<=0 or v_ec_rate>1000000 then raise exception 'ExpertsCoins conversion is not configured correctly'; end if;
 insert into public.survey_responses(survey_id,respondent_id,ip_hash,ec_per_rwf)
 values(p_survey_id,v_user,p_ip_hash,v_ec_rate) returning id into v_response_id;
 return v_response_id;
exception when unique_violation then raise exception 'You have already started or completed this survey';
end;
$function$;
revoke all on function public.start_survey_response(uuid,text) from public,anon;
grant execute on function public.start_survey_response(uuid,text) to authenticated;

create or replace function public.complete_survey_response(p_response_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare
 v_user uuid:=auth.uid(); v_response public.survey_responses%rowtype; v_survey public.surveys%rowtype;
 v_required integer; v_question_count integer; v_answered integer; v_elapsed integer; v_reward integer;
 v_partner_account uuid; v_ec_rate numeric(20,8); v_reward_ec numeric(20,4); v_transaction_id uuid;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 select * into v_response from public.survey_responses where id=p_response_id and respondent_id=v_user for update;
 if not found then raise exception 'Response not found'; end if;
 if v_response.status<>'in_progress' then raise exception 'Response is already submitted'; end if;
 select * into v_survey from public.surveys where id=v_response.survey_id for update;
 if not found or v_survey.status<>'active' then raise exception 'Survey is no longer active'; end if;
 select count(*)::integer into v_question_count from public.survey_questions where survey_id=v_survey.id;
 if v_question_count<5 or v_question_count>10 then raise exception 'This survey is not configured correctly. Please contact support; your answers have not been submitted'; end if;
 if v_survey.partner_id is not null then
  select id into v_partner_account from public.partner_accounts where user_id=v_survey.partner_id and is_approved=true for update;
  if v_partner_account is null or coalesce(v_survey.reserved_budget_usd,0)<v_survey.partner_price_usd then
   raise exception 'This survey is temporarily unable to accept submissions. Your answers have not been submitted';
  end if;
 end if;
 select count(*) into v_required from public.survey_questions where survey_id=v_survey.id and required=true;
 select count(*) into v_answered from public.response_answers a join public.survey_questions q on q.id=a.survey_question_id
 where a.response_id=v_response.id and q.required=true;
 if v_answered<v_required then raise exception 'Please answer all required questions'; end if;
 v_elapsed:=greatest(0,floor(extract(epoch from(now()-v_response.started_at)))::integer);
 if v_elapsed<greatest(10,v_required*3) then raise exception 'Please take more time to complete this survey'; end if;
 if v_survey.response_limit is not null and v_survey.response_count>=v_survey.response_limit then raise exception 'Survey response limit reached'; end if;
 v_reward:=greatest(0,coalesce(v_survey.reward_rwf,0));
 v_ec_rate:=coalesce(v_response.ec_per_rwf,1);
 if v_ec_rate<=0 or v_ec_rate>1000000 then raise exception 'ExpertsCoins conversion is not configured correctly'; end if;
 v_reward_ec:=round(v_reward*v_ec_rate,4);
 update public.survey_responses set status='submitted',submitted_at=now(),duration_seconds=v_elapsed,
  reward_rwf=v_reward,reward_ec=v_reward_ec,ec_per_rwf=v_ec_rate where id=v_response.id;
 insert into public.wallets(user_id,balance_rwf,lifetime_earned_rwf,balance_ec,lifetime_earned_ec,updated_at)
 values(v_user,v_reward,v_reward,v_reward_ec,v_reward_ec,now())
 on conflict(user_id) do update set
  balance_rwf=public.wallets.balance_rwf+excluded.balance_rwf,
  lifetime_earned_rwf=public.wallets.lifetime_earned_rwf+excluded.lifetime_earned_rwf,
  balance_ec=public.wallets.balance_ec+excluded.balance_ec,
  lifetime_earned_ec=public.wallets.lifetime_earned_ec+excluded.lifetime_earned_ec,updated_at=now();
 insert into public.wallet_transactions(user_id,amount_rwf,amount_ec,ec_per_rwf,transaction_type,description,reference_id)
 values(v_user,v_reward,v_reward_ec,v_ec_rate,'survey_reward','Completed survey: '||v_survey.title,v_response.id)
 returning id into v_transaction_id;
 if v_reward>0 then
  insert into public.wallet_credit_lots(user_id,source_transaction_id,remaining_rwf,remaining_ec,ec_per_rwf)
  values(v_user,v_transaction_id,v_reward,v_reward_ec,v_ec_rate);
 end if;
 if v_partner_account is not null then
  update public.surveys set reserved_budget_usd=greatest(0,reserved_budget_usd-v_survey.partner_price_usd) where id=v_survey.id;
  insert into public.partner_billing(partner_id,survey_id,event_type,amount_usd,currency,description)
  values(v_partner_account,v_survey.id,'response_charge',-abs(v_survey.partner_price_usd),'USD','Pre-funded usage: one verified completed response');
 end if;
 update public.surveys set response_count=response_count+1,updated_at=now() where id=v_survey.id;
 return jsonb_build_object('success',true,'reward_rwf',v_reward,'reward_ec',v_reward_ec,'ec_per_rwf',v_ec_rate,
  'duration_seconds',v_elapsed,'partner_usage_usd',case when v_partner_account is not null then coalesce(v_survey.partner_price_usd,0) else 0 end);
end;
$function$;
revoke all on function public.complete_survey_response(uuid) from public,anon;
grant execute on function public.complete_survey_response(uuid) to authenticated;