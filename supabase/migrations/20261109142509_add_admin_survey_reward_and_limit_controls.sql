CREATE OR REPLACE FUNCTION public.admin_update_survey_terms(p_survey_id uuid,p_reward_rwf integer,p_response_limit integer DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;
 if p_reward_rwf<0 or p_reward_rwf>1000000 then raise exception 'Reward must be between 0 and 1,000,000 RWF'; end if;
 if p_response_limit is not null and (p_response_limit<1 or p_response_limit>1000000) then raise exception 'Response limit must be between 1 and 1,000,000'; end if;
 update public.surveys set reward_rwf=p_reward_rwf,response_limit=p_response_limit,updated_at=now() where id=p_survey_id and status in ('draft','paused');
 if not found then raise exception 'Only draft or paused surveys can be edited'; end if;
end;
$function$;
REVOKE ALL ON FUNCTION public.admin_update_survey_terms(uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_update_survey_terms(uuid,integer,integer) TO authenticated;
