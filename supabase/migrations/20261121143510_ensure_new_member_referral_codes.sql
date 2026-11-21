alter table public.profiles alter column referral_code set default upper(substr(md5(random()::text||clock_timestamp()::text),1,10));
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