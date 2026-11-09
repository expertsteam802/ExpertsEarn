CREATE OR REPLACE FUNCTION public.admin_generate_starter_survey_set(p_survey_count integer DEFAULT 100, p_questions_per_survey integer DEFAULT 20)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_i integer; v_category_id uuid; v_category_name text; v_survey_id uuid; v_inserted integer; v_total integer:=0; v_category_count integer;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;
 if p_survey_count<1 or p_survey_count>100 then raise exception 'Survey count must be between 1 and 100'; end if;
 if p_questions_per_survey<1 or p_questions_per_survey>100 then raise exception 'Question count must be between 1 and 100'; end if;
 select count(*) into v_category_count from public.survey_categories;
 if v_category_count=0 then raise exception 'No survey categories are configured'; end if;
 for v_i in 1..p_survey_count loop
  select id,name into v_category_id,v_category_name from (select id,name,row_number() over(order by slug) as rn from public.survey_categories) categories where rn=((v_i-1)%v_category_count)+1;
  if (select count(*) from public.question_bank where category_id=v_category_id and is_active=true and language='en')<p_questions_per_survey then raise exception 'Not enough active English questions in category %',v_category_name; end if;
  insert into public.surveys(owner_id,title,status,language,reward_rwf,is_random_session,question_count) values(auth.uid(),format('Starter research · %s · %s',v_category_name,lpad(v_i::text,3,'0')),'draft','en',0,true,p_questions_per_survey) returning id into v_survey_id;
  insert into public.survey_questions(survey_id,question_id,position,required) select v_survey_id,picked.id,picked.position,true from (select q.id,row_number() over()::smallint as position from (select id from public.question_bank where category_id=v_category_id and is_active=true and language='en' order by random() limit p_questions_per_survey) q) picked;
  get diagnostics v_inserted=row_count;
  if v_inserted<>p_questions_per_survey then raise exception 'Could not fill starter survey %',v_i; end if;
  v_total:=v_total+1;
 end loop;
 return v_total;
end;
$function$;
REVOKE ALL ON FUNCTION public.admin_generate_starter_survey_set(integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_generate_starter_survey_set(integer,integer) TO authenticated;
