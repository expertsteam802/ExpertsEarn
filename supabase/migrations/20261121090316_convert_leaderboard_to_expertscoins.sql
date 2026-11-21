drop function public.get_public_leaderboard();
create function public.get_public_leaderboard()
returns table(rank bigint,display_name text,lifetime_earned_ec numeric)
language sql stable security definer set search_path=public
as $function$
 select row_number() over(order by w.lifetime_earned_ec desc,coalesce(p.display_name,'Respondent') asc) as rank,
        coalesce(nullif(trim(p.display_name),''),'Respondent') as display_name,
        w.lifetime_earned_ec
 from public.wallets w join public.profiles p on p.id=w.user_id
 where w.lifetime_earned_ec>0
 order by w.lifetime_earned_ec desc,display_name asc limit 50;
$function$;
grant execute on function public.get_public_leaderboard() to anon,authenticated;
