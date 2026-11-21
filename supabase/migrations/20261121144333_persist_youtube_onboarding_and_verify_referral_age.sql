alter table public.profiles add column if not exists youtube_subscription_confirmed_at timestamptz;
create or replace function public.confirm_youtube_subscription() returns timestamptz language plpgsql security definer set search_path=public as $function$
declare v_user uuid:=auth.uid();v_confirmed_at timestamptz;
begin if v_user is null then raise exception 'Authentication required';end if;
 update public.profiles set youtube_subscription_confirmed_at=coalesce(youtube_subscription_confirmed_at,now()) where id=v_user returning youtube_subscription_confirmed_at into v_confirmed_at;
 if v_confirmed_at is null then raise exception 'Member profile not found';end if;return v_confirmed_at;end;$function$;
revoke all on function public.confirm_youtube_subscription() from public,anon;grant execute on function public.confirm_youtube_subscription() to authenticated;
create or replace function private.credit_mature_referrals(p_inviter_id uuid) returns jsonb language plpgsql security definer set search_path=public,private as $function$
declare v_referral record;v_reward_ec numeric(20,4);v_rate numeric(20,8);v_reward_rwf bigint;v_actual_ec numeric(20,4);v_transaction_id uuid;v_count integer:=0;
begin
 if not exists(select 1 from public.profiles where id=p_inviter_id and account_status='active') then return jsonb_build_object('success',false,'rewarded',0);end if;
 select coalesce((value #>> '{}')::numeric,100) into v_reward_ec from public.platform_settings where key='referral_reward_ec';v_reward_ec:=greatest(0,coalesce(v_reward_ec,100));
 if v_reward_ec<=0 then return jsonb_build_object('success',true,'rewarded',0,'paused',true);end if;
 select coalesce((value #>> '{}')::numeric,1) into v_rate from public.platform_settings where key='expertscoins_per_rwf';v_rate:=greatest(0.000001,coalesce(v_rate,1));
 for v_referral in select r.id from public.referrals r join public.profiles invited on invited.id=r.referred_user_id join auth.users au on au.id=invited.id
 where r.referrer_id=p_inviter_id and r.status='pending' and invited.account_status='active'
 and greatest(invited.created_at,coalesce(invited.account_status_updated_at,invited.created_at),au.email_confirmed_at)<=now()-interval '7 days'
 order by r.created_at for update of r skip locked loop
  v_reward_rwf:=ceil(v_reward_ec/v_rate)::bigint;v_actual_ec:=round(v_reward_rwf*v_rate,4);
  update public.referrals set status='rewarded',qualified_at=coalesce(qualified_at,now()),rewarded_at=now(),reward_ec=v_actual_ec where id=v_referral.id and status='pending';if not found then continue;end if;
  insert into public.wallets(user_id,balance_rwf,lifetime_earned_rwf,balance_ec,lifetime_earned_ec,updated_at) values(p_inviter_id,v_reward_rwf,v_reward_rwf,v_actual_ec,v_actual_ec,now()) on conflict(user_id) do update set balance_rwf=public.wallets.balance_rwf+excluded.balance_rwf,lifetime_earned_rwf=public.wallets.lifetime_earned_rwf+excluded.lifetime_earned_rwf,balance_ec=public.wallets.balance_ec+excluded.balance_ec,lifetime_earned_ec=public.wallets.lifetime_earned_ec+excluded.lifetime_earned_ec,updated_at=now();
  insert into public.wallet_transactions(user_id,amount_rwf,amount_ec,ec_per_rwf,transaction_type,description,reference_id) values(p_inviter_id,v_reward_rwf,v_actual_ec,v_rate,'referral_reward','Referral reward: invited member remained active and verified for 7 days',v_referral.id) returning id into v_transaction_id;
  insert into public.wallet_credit_lots(user_id,source_transaction_id,remaining_rwf,remaining_ec,ec_per_rwf) values(p_inviter_id,v_transaction_id,v_reward_rwf,v_actual_ec,v_rate);v_count:=v_count+1;
 end loop;return jsonb_build_object('success',true,'rewarded',v_count,'reward_ec',v_reward_ec);end;$function$;
create or replace function private.process_mature_referrals() returns integer language plpgsql security definer set search_path=public,private as $function$
declare v_inviter uuid;v_result jsonb;v_total integer:=0;
begin for v_inviter in select distinct r.referrer_id from public.referrals r join public.profiles invited on invited.id=r.referred_user_id join auth.users au on au.id=invited.id
 where r.status='pending' and invited.account_status='active' and greatest(invited.created_at,coalesce(invited.account_status_updated_at,invited.created_at),au.email_confirmed_at)<=now()-interval '7 days'
 loop v_result:=private.credit_mature_referrals(v_inviter);v_total:=v_total+coalesce((v_result->>'rewarded')::integer,0);end loop;return v_total;end;$function$;