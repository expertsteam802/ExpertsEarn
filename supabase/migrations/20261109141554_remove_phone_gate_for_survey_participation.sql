CREATE OR REPLACE FUNCTION public.start_survey_response(p_survey_id uuid, p_ip_hash text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_user uuid := auth.uid();
  v_survey public.surveys%rowtype;
  v_profile public.profiles%rowtype;
  v_age integer;
  v_response_id uuid;
  v_daily_cap integer := 20;
  v_today_count integer := 0;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_profile from public.profiles where id = v_user;
  if not found then raise exception 'Complete your profile before starting a survey'; end if;

  select coalesce((value #>> '{}')::integer, 20) into v_daily_cap
    from public.platform_settings where key = 'daily_survey_cap';
  v_daily_cap := greatest(1, coalesce(v_daily_cap, 20));
  select count(*)::integer into v_today_count
    from public.survey_responses
   where respondent_id = v_user
     and started_at >= date_trunc('day', now())
     and status in ('in_progress','submitted');
  if v_today_count >= v_daily_cap then raise exception 'Daily survey limit reached'; end if;

  select * into v_survey from public.surveys where id = p_survey_id for update;
  if not found or v_survey.status <> 'active' then raise exception 'Survey is not available'; end if;
  if v_survey.starts_at is not null and now() < v_survey.starts_at then raise exception 'Survey has not started'; end if;
  if v_survey.ends_at is not null and now() > v_survey.ends_at then raise exception 'Survey has ended'; end if;
  if v_survey.target_country is not null and v_survey.target_country <> v_profile.country_code then raise exception 'This survey is not available in your country'; end if;
  if v_survey.target_region is not null and v_survey.target_region <> v_profile.region then raise exception 'This survey is not available in your region'; end if;
  if v_survey.target_city is not null and v_survey.target_city <> v_profile.city then raise exception 'This survey is not available in your city'; end if;
  if v_survey.target_province is not null and v_survey.target_province <> v_profile.province then raise exception 'This survey is not available in your province'; end if;
  if v_survey.target_district is not null and v_survey.target_district <> v_profile.district then raise exception 'This survey is not available in your district'; end if;
  if v_survey.target_sector is not null and v_survey.target_sector <> v_profile.sector then raise exception 'This survey is not available in your sector'; end if;
  if v_survey.target_cell is not null and v_survey.target_cell <> v_profile.cell then raise exception 'This survey is not available in your cell'; end if;
  if v_survey.target_village is not null and v_survey.target_village <> v_profile.village then raise exception 'This survey is not available in your village'; end if;
  if v_survey.target_gender is not null and (v_profile.gender is null or v_survey.target_gender <> v_profile.gender) then raise exception 'This survey is not available for your profile'; end if;
  if v_profile.date_of_birth is not null then
    v_age := date_part('year', age(current_date, v_profile.date_of_birth))::integer;
    if v_survey.min_age is not null and v_age < v_survey.min_age then raise exception 'You do not meet the minimum age requirement'; end if;
    if v_survey.max_age is not null and v_age > v_survey.max_age then raise exception 'You do not meet the maximum age requirement'; end if;
  elsif v_survey.min_age is not null or v_survey.max_age is not null then
    raise exception 'Add your date of birth to check survey eligibility';
  end if;
  if v_survey.response_limit is not null and v_survey.response_count >= v_survey.response_limit then raise exception 'Survey is full'; end if;
  if p_ip_hash is not null and exists (
    select 1 from public.survey_responses r
     where r.survey_id = p_survey_id and r.ip_hash = p_ip_hash
       and r.status in ('in_progress','submitted')
  ) then
    raise exception 'A response from this network has already been recorded for this survey';
  end if;

  insert into public.survey_responses(survey_id, respondent_id, ip_hash)
  values (p_survey_id, v_user, p_ip_hash)
  returning id into v_response_id;
  return v_response_id;
exception when unique_violation then
  raise exception 'You have already started or completed this survey';
end;
$function$;

REVOKE ALL ON FUNCTION public.start_survey_response(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_survey_response(uuid, text) TO authenticated;
