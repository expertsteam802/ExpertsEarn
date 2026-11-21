-- ExpertsCoins launch: preserve the RWF liability ledger and add a rate-locked points ledger.
alter table public.wallets
  add column if not exists balance_ec numeric(20,4) not null default 0,
  add column if not exists lifetime_earned_ec numeric(20,4) not null default 0,
  add column if not exists lifetime_paid_ec numeric(20,4) not null default 0;
alter table public.wallet_transactions
  add column if not exists amount_ec numeric(20,4) not null default 0,
  add column if not exists ec_per_rwf numeric(20,8) not null default 1;
update public.wallets set balance_ec=balance_rwf,lifetime_earned_ec=lifetime_earned_rwf,lifetime_paid_ec=lifetime_paid_rwf;
update public.wallet_transactions set amount_ec=amount_rwf,ec_per_rwf=1 where amount_rwf<>0;
insert into public.platform_settings(key,value,updated_at) values('expertscoins_per_rwf','1'::jsonb,now()) on conflict(key) do nothing;
create table if not exists public.wallet_credit_lots (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 source_transaction_id uuid references public.wallet_transactions(id),
 remaining_rwf bigint not null check(remaining_rwf>=0),
 remaining_ec numeric(20,4) not null check(remaining_ec>=0),
 ec_per_rwf numeric(20,8) not null check(ec_per_rwf>0),
 created_at timestamptz not null default now()
);
create index if not exists wallet_credit_lots_user_fifo_idx on public.wallet_credit_lots(user_id,created_at,id) where remaining_rwf>0;
alter table public.wallet_credit_lots enable row level security;
revoke all on public.wallet_credit_lots from anon,authenticated;
grant select on public.wallet_credit_lots to authenticated;
drop policy if exists "Users can view their own ExpertsCoins lots" on public.wallet_credit_lots;
create policy "Users can view their own ExpertsCoins lots" on public.wallet_credit_lots for select to authenticated using(user_id=(select auth.uid()));
insert into public.wallet_credit_lots(user_id,remaining_rwf,remaining_ec,ec_per_rwf,created_at)
select w.user_id,w.balance_rwf,w.balance_ec,1,now() from public.wallets w
where w.balance_rwf>0 and not exists(select 1 from public.wallet_credit_lots l where l.user_id=w.user_id and l.remaining_rwf>0);

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
 select coalesce((value #>> '{}')::numeric,1) into v_ec_rate from public.platform_settings where key='expertscoins_per_rwf';
 v_ec_rate:=coalesce(v_ec_rate,1);
 if v_ec_rate<=0 or v_ec_rate>1000000 then raise exception 'ExpertsCoins conversion is not configured correctly'; end if;
 v_reward_ec:=round(v_reward*v_ec_rate,4);
 update public.survey_responses set status='submitted',submitted_at=now(),duration_seconds=v_elapsed,reward_rwf=v_reward where id=v_response.id;
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

create or replace function public.request_payout(p_amount_rwf bigint,p_method text,p_destination text)
returns uuid language plpgsql security definer set search_path=public
as $function$
declare
 v_user uuid:=auth.uid(); v_balance bigint; v_minimum bigint:=1000; v_identity_verified timestamptz;
 v_payout_id uuid; v_lot record; v_take bigint; v_ec_used numeric(20,4):=0; v_lot_ec numeric(20,4); v_remaining bigint;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 select coalesce((value #>> '{}')::bigint,1000) into v_minimum from public.platform_settings where key='minimum_payout_rwf';
 v_minimum:=greatest(1000,coalesce(v_minimum,1000));
 if p_amount_rwf is null or p_amount_rwf<v_minimum then raise exception 'Minimum payout is % RWF',to_char(v_minimum,'FM999999999'); end if;
 if p_method not in('mtn_momo','airtel_money','paypal','wise') then raise exception 'Unsupported payout method'; end if;
 if length(trim(coalesce(p_destination,'')))<4 then raise exception 'Enter a valid payout destination'; end if;
 select balance_rwf into v_balance from public.wallets where user_id=v_user for update;
 if v_balance is null or v_balance<p_amount_rwf then raise exception 'Insufficient wallet balance'; end if;
 select identity_verified_at into v_identity_verified from public.profiles where id=v_user for update;
 if v_identity_verified is null then raise exception 'Complete identity verification before requesting a payout'; end if;
 v_remaining:=p_amount_rwf;
 for v_lot in select id,remaining_rwf,remaining_ec from public.wallet_credit_lots where user_id=v_user and remaining_rwf>0 order by created_at,id for update loop
  exit when v_remaining=0;
  v_take:=least(v_remaining,v_lot.remaining_rwf);
  if v_take=v_lot.remaining_rwf then v_lot_ec:=v_lot.remaining_ec;
  else v_lot_ec:=round(v_lot.remaining_ec*v_take/v_lot.remaining_rwf,4); end if;
  update public.wallet_credit_lots set remaining_rwf=remaining_rwf-v_take,remaining_ec=greatest(0,remaining_ec-v_lot_ec) where id=v_lot.id;
  v_remaining:=v_remaining-v_take; v_ec_used:=v_ec_used+v_lot_ec;
 end loop;
 if v_remaining>0 then raise exception 'Wallet credit history is incomplete. Contact support before requesting payout'; end if;
 update public.wallets set balance_rwf=balance_rwf-p_amount_rwf,balance_ec=greatest(0,balance_ec-v_ec_used),updated_at=now() where user_id=v_user;
 insert into public.payout_requests(user_id,amount_rwf,method,destination) values(v_user,p_amount_rwf,p_method,trim(p_destination)) returning id into v_payout_id;
 insert into public.wallet_transactions(user_id,amount_rwf,amount_ec,ec_per_rwf,transaction_type,description,reference_id)
 values(v_user,-p_amount_rwf,-v_ec_used,v_ec_used/p_amount_rwf,'payout','Monthly payout request ('||p_method||')',v_payout_id);
 return v_payout_id;
end;
$function$;
revoke all on function public.request_payout(bigint,text,text) from public,anon;
grant execute on function public.request_payout(bigint,text,text) to authenticated;

create or replace function public.admin_update_payout(p_payout_id uuid,p_status public.payout_status,p_note text default null)
returns boolean language plpgsql security definer set search_path=public
as $function$
declare v_payout public.payout_requests%rowtype; v_tx public.wallet_transactions%rowtype;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;
 select * into v_payout from public.payout_requests where id=p_payout_id for update;
 if not found then raise exception 'Payout request not found'; end if;
 if v_payout.status in('paid','rejected','failed') then raise exception 'Payout has already been finalized'; end if;
 select * into v_tx from public.wallet_transactions where reference_id=v_payout.id and transaction_type='payout' for update;
 update public.payout_requests set status=p_status,admin_note=p_note,processed_at=case when p_status in('paid','rejected','failed') then now() else null end where id=p_payout_id;
 if p_status in('rejected','failed') then
  update public.wallets set balance_rwf=balance_rwf+v_payout.amount_rwf,
   balance_ec=balance_ec+abs(coalesce(v_tx.amount_ec,v_payout.amount_rwf)),updated_at=now() where user_id=v_payout.user_id;
  update public.wallet_transactions set amount_rwf=abs(amount_rwf),amount_ec=abs(amount_ec),transaction_type='adjustment',
   description='Refund for rejected payout',created_at=now() where id=v_tx.id;
  insert into public.wallet_credit_lots(user_id,source_transaction_id,remaining_rwf,remaining_ec,ec_per_rwf)
  values(v_payout.user_id,v_tx.id,v_payout.amount_rwf,abs(coalesce(v_tx.amount_ec,v_payout.amount_rwf)),
   abs(coalesce(v_tx.amount_ec,v_payout.amount_rwf))/v_payout.amount_rwf);
 elsif p_status='paid' then
  update public.wallets set lifetime_paid_rwf=lifetime_paid_rwf+v_payout.amount_rwf,
   lifetime_paid_ec=lifetime_paid_ec+abs(coalesce(v_tx.amount_ec,v_payout.amount_rwf)),updated_at=now() where user_id=v_payout.user_id;
 end if;
 return true;
end;
$function$;
revoke all on function public.admin_update_payout(uuid,public.payout_status,text) from public,anon;
grant execute on function public.admin_update_payout(uuid,public.payout_status,text) to authenticated;

insert into public.platform_settings(key,value,updated_at)
values('expertscoins_payout_cycle','{"frequency":"monthly","processing":"admin_batch"}'::jsonb,now())
on conflict(key) do nothing;
