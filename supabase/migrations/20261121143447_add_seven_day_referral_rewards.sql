-- Personal referral codes and one-time seven-day ExpertsCoins rewards.
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles alter column referral_code set default upper(substr(md5(random()::text||clock_timestamp()::text),1,10));
update public.profiles set referral_code=upper(substr(md5(random()::text||clock_timestamp()::text||id::text),1,10)) where referral_code is null;
create unique index if not exists profiles_referral_code_uidx on public.profiles(referral_code);
create table if not exists public.referrals(id uuid primary key default gen_random_uuid(),referrer_id uuid not null references public.profiles(id) on delete cascade,referred_user_id uuid not null references public.profiles(id) on delete cascade,referral_code text not null,status text not null default 'pending' check(status in ('pending','rewarded','rejected')),reward_ec numeric(20,4) not null default 0 check(reward_ec>=0),created_at timestamptz not null default now(),qualified_at timestamptz,rewarded_at timestamptz,constraint referrals_not_self check(referrer_id<>referred_user_id),constraint referrals_one_referrer_per_user unique(referred_user_id));
create index if not exists referrals_referrer_status_created_idx on public.referrals(referrer_id,status,created_at desc);
alter table public.referrals enable row level security;revoke all on public.referrals from anon,authenticated;grant select on public.referrals to authenticated;
drop policy if exists "Inviters can view their referrals" on public.referrals;
create policy "Inviters can view their referrals" on public.referrals for select to authenticated using(referrer_id=(select auth.uid()));
insert into public.platform_settings(key,value,updated_at) values('referral_reward_ec','100'::jsonb,now()) on conflict(key) do nothing;
create unique index if not exists wallet_transactions_referral_reward_uidx on public.wallet_transactions(reference_id,transaction_type) where transaction_type='referral_reward';
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $function$
declare v_code text;v_referrer uuid;
begin
 insert into public.profiles(id,display_name,phone_e164) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',new.raw_user_meta_data->>'full_name'),new.phone) on conflict(id) do nothing;
 update public.profiles set referral_code=upper(substr(md5(random()::text||clock_timestamp()::text||new.id::text),1,10)) where id=new.id and referral_code is null;
 insert into public.wallets(user_id) values(new.id) on conflict(user_id) do nothing;
 v_code:=upper(left(trim(coalesce(new.raw_user_meta_data->>'referral_code','')),32));
 if v_code<>'' then select id into v_referrer from public.profiles where referral_code=v_code and id<>new.id and account_status='active' limit 1;
 if v_referrer is not null then insert into public.referrals(referrer_id,referred_user_id,referral_code) values(v_referrer,new.id,v_code) on conflict(referred_user_id) do nothing;end if;end if;return new;
end;$function$;
create or replace function public.claim_referral_rewards() returns jsonb language plpgsql security definer set search_path=public as $function$
declare v_user uuid:=auth.uid();v_referral record;v_reward_ec numeric(20,4);v_rate numeric(20,8);v_reward_rwf bigint;v_actual_ec numeric(20,4);v_transaction_id uuid;v_count integer:=0;
begin
 if v_user is null then raise exception 'Authentication required';end if;
 if not exists(select 1 from public.profiles where id=v_user and account_status='active') then return jsonb_build_object('success',false,'rewarded',0);end if;
 select coalesce((value #>> '{}')::numeric,100) into v_reward_ec from public.platform_settings where key='referral_reward_ec';v_reward_ec:=greatest(0,coalesce(v_reward_ec,100));
 select coalesce((value #>> '{}')::numeric,1) into v_rate from public.platform_settings where key='expertscoins_per_rwf';v_rate:=greatest(0.000001,coalesce(v_rate,1));
 for v_referral in select r.id,r.referred_user_id from public.referrals r join public.profiles invited on invited.id=r.referred_user_id join auth.users au on au.id=invited.id where r.referrer_id=v_user and r.status='pending' and invited.account_status='active' and invited.created_at<=now()-interval '7 days' and au.email_confirmed_at is not null order by r.created_at for update of r skip locked loop
  if v_reward_ec<=0 then update public.referrals set status='rewarded',qualified_at=coalesce(qualified_at,now()),rewarded_at=now(),reward_ec=0 where id=v_referral.id and status='pending';if found then v_count:=v_count+1;end if;continue;end if;
  v_reward_rwf:=ceil(v_reward_ec/v_rate)::bigint;v_actual_ec:=round(v_reward_rwf*v_rate,4);
  update public.referrals set status='rewarded',qualified_at=coalesce(qualified_at,now()),rewarded_at=now(),reward_ec=v_actual_ec where id=v_referral.id and status='pending';if not found then continue;end if;
  insert into public.wallets(user_id,balance_rwf,lifetime_earned_rwf,balance_ec,lifetime_earned_ec,updated_at) values(v_user,v_reward_rwf,v_reward_rwf,v_actual_ec,v_actual_ec,now()) on conflict(user_id) do update set balance_rwf=public.wallets.balance_rwf+excluded.balance_rwf,lifetime_earned_rwf=public.wallets.lifetime_earned_rwf+excluded.lifetime_earned_rwf,balance_ec=public.wallets.balance_ec+excluded.balance_ec,lifetime_earned_ec=public.wallets.lifetime_earned_ec+excluded.lifetime_earned_ec,updated_at=now();
  insert into public.wallet_transactions(user_id,amount_rwf,amount_ec,ec_per_rwf,transaction_type,description,reference_id) values(v_user,v_reward_rwf,v_actual_ec,v_rate,'referral_reward','Referral reward: invited member remained active for 7 days',v_referral.id) returning id into v_transaction_id;
  insert into public.wallet_credit_lots(user_id,source_transaction_id,remaining_rwf,remaining_ec,ec_per_rwf) values(v_user,v_transaction_id,v_reward_rwf,v_actual_ec,v_rate);v_count:=v_count+1;
 end loop;return jsonb_build_object('success',true,'rewarded',v_count,'reward_ec',v_reward_ec);
end;$function$;
revoke all on function public.claim_referral_rewards() from public,anon;grant execute on function public.claim_referral_rewards() to authenticated;