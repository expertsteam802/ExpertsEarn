-- Reward-aware starter survey generation and question-specific answer sets.
drop function if exists public.admin_generate_starter_survey_set(integer, integer);
create function public.admin_generate_starter_survey_set(
  p_survey_count integer default 100,
  p_questions_per_survey integer default 20,
  p_reward_rwf integer default 0
)
returns integer language plpgsql security definer set search_path=public
as $function$
declare v_i integer; v_category_id uuid; v_category_name text; v_survey_id uuid; v_inserted integer; v_total integer:=0; v_category_count integer;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required'; end if;
 if p_survey_count<1 or p_survey_count>100 then raise exception 'Survey count must be between 1 and 100'; end if;
 if p_questions_per_survey<1 or p_questions_per_survey>100 then raise exception 'Question count must be between 1 and 100'; end if;
 if p_reward_rwf<0 or p_reward_rwf>1000000 then raise exception 'Reward must be between 0 and 1,000,000 RWF'; end if;
 select count(*) into v_category_count from public.survey_categories;
 if v_category_count=0 then raise exception 'No survey categories are configured'; end if;
 for v_i in 1..p_survey_count loop
  select id,name into v_category_id,v_category_name from (
   select id,name,row_number() over(order by slug) as rn from public.survey_categories
  ) categories where rn=((v_i-1)%v_category_count)+1;
  if (select count(*) from public.question_bank where category_id=v_category_id and is_active=true and language='en')<p_questions_per_survey then
   raise exception 'Not enough active English questions in category %',v_category_name;
  end if;
  insert into public.surveys(owner_id,title,status,language,reward_rwf,is_random_session,question_count)
  values(auth.uid(),format('Starter research · %s · %s',v_category_name,lpad(v_i::text,3,'0')),'draft','en',p_reward_rwf,true,p_questions_per_survey)
  returning id into v_survey_id;
  insert into public.survey_questions(survey_id,question_id,position,required)
  select v_survey_id,picked.id,picked.position,true from (
   select q.id,row_number() over()::smallint as position
   from (select id from public.question_bank where category_id=v_category_id and is_active=true and language='en' order by random() limit p_questions_per_survey) q
  ) picked;
  get diagnostics v_inserted=row_count;
  if v_inserted<>p_questions_per_survey then raise exception 'Could not fill starter survey %',v_i; end if;
  v_total:=v_total+1;
 end loop;
 return v_total;
end;
$function$;
revoke all on function public.admin_generate_starter_survey_set(integer,integer,integer) from public,anon;
grant execute on function public.admin_generate_starter_survey_set(integer,integer,integer) to authenticated;

update public.question_bank set options=case
 when prompt ilike 'How frequently do you use %' or prompt ilike 'How often do you seek advice before choosing %' then '["Daily","Several times a week","About once a week","A few times a month","About once a month","Less than once a month","Never"]'::jsonb
 when prompt ilike 'Which factor most influences your choice of %' then '["Price or affordability","Quality or performance","Availability or convenience","Safety or reliability","Brand reputation","Recommendations or reviews","Customer service","Other"]'::jsonb
 when prompt ilike 'What price range feels fair for %' then '["Less than 1,000 RWF","1,000–4,999 RWF","5,000–9,999 RWF","10,000–19,999 RWF","20,000–49,999 RWF","50,000 RWF or more","I would not pay for it"]'::jsonb
 when prompt ilike 'Which feature do you value most in %' then '["Ease of use","Quality or durability","Reliability","Speed or performance","Safety or privacy","Affordability","Accessibility","Customer support","Other"]'::jsonb
 when prompt ilike 'How easy is it for you to access %' then '["Very easy","Somewhat easy","Neither easy nor difficult","Somewhat difficult","Very difficult","Not sure"]'::jsonb
 when prompt ilike 'How does % compare with other available options' then '["Much better than alternatives","Somewhat better","About the same","Somewhat worse","Much worse","I have not tried alternatives"]'::jsonb
 when prompt ilike 'At what time or occasion do you most often use %' then '["Early morning","Morning","Afternoon","Evening","Late night","Weekends or holidays","Only when needed","Not applicable"]'::jsonb
 when prompt ilike 'Where do you usually discover or learn about %' then '["Physical shop or service location","Official website","Mobile application","Social media or messaging","Search engine","Phone call or SMS","Friends or family","Radio or television","Other"]'::jsonb
 when prompt ilike 'How important is quality when selecting %' then '["Extremely important","Very important","Moderately important","Slightly important","Not important","Not sure"]'::jsonb
 when prompt ilike 'How reliable has your experience with %' then '["Very reliable","Mostly reliable","Neither reliable nor unreliable","Somewhat unreliable","Very unreliable","Not enough experience to judge"]'::jsonb
 when prompt ilike 'What is your preferred way to pay for %' then '["MTN Mobile Money","Airtel Money","Cash","Debit or credit card","Bank transfer","Mobile banking","Online wallet","I do not purchase this","Other"]'::jsonb
 when prompt ilike 'Which device or channel do you use most for %' then '["Smartphone","Feature phone","Laptop or desktop computer","Tablet","In person","Phone call or SMS","I do not use it","Other"]'::jsonb
 when prompt ilike 'What is your main goal when choosing %' then case
  when category_id=(select id from public.survey_categories where slug='education') then '["Learn a new skill","Improve school or exam results","Advance my career","Earn a qualification","Gain practical knowledge","Support a child or family member","Other"]'::jsonb
  when category_id=(select id from public.survey_categories where slug='finance') then '["Send or receive money","Save money","Pay bills or merchants","Access credit","Manage a budget","Protect against financial risk","Learn about finances","Other"]'::jsonb
  when category_id=(select id from public.survey_categories where slug='health') then '["Prevent illness","Treat or manage a health issue","Get reliable health advice","Improve fitness","Improve nutrition","Access care conveniently","Support mental wellbeing","Other"]'::jsonb
  when category_id=(select id from public.survey_categories where slug='transport') then '["Reach a destination safely","Save travel time","Reduce transport cost","Travel comfortably","Move goods or deliveries","Find reliable transport","Other"]'::jsonb
  when category_id=(select id from public.survey_categories where slug='entertainment') then '["Relax or reduce stress","Have fun","Learn something","Connect with others","Follow news or culture","Discover new creators","Create or share content","Other"]'::jsonb
  when category_id=(select id from public.survey_categories where slug='food') then '["Meet nutritional needs","Enjoy taste","Save money","Save preparation time","Find convenient meals","Meet dietary needs","Support local producers","Other"]'::jsonb
  when category_id=(select id from public.survey_categories where slug='technology') then '["Communicate with others","Work more efficiently","Learn or research","Access services online","Stay secure","Create content","Entertainment","Other"]'::jsonb
  else '["Get good value for money","Choose reliable quality","Save time or effort","Meet a household need","Find a durable option","Choose a safer option","Other"]'::jsonb end
 else options end
where question_type='single_choice';

update public.question_bank set question_type='multiple_choice',options=case
 when prompt ilike 'What would prevent you from using % more often?' then '["Cost is too high","Not available where I live","I do not have enough information","Difficult to access or use","I do not trust the provider or product","Quality is inconsistent","I use an alternative","I do not need it","Other"]'::jsonb
 when prompt ilike 'What information would help you decide whether to choose %?' then '["Prices and fees","Features or available services","Customer reviews","Safety and reliability","How to use it","Availability and location","Terms, warranty or conditions","Comparison with alternatives","Other"]'::jsonb
 else '["Better quality","Lower price or discounts","Faster service","More convenient access","More choices or features","Reliable customer support","Delivery or installation","Training or guidance","Other"]'::jsonb end
where question_type='text' and (
 prompt ilike 'What would prevent you from using % more often?' or
 prompt ilike 'What information would help you decide whether to choose %?' or
 prompt ilike 'What additional service would you like to receive with %?'
);

update public.survey_questions sq set options_override=qb.options
from public.question_bank qb
where sq.question_id=qb.id and (sq.options_override is null or sq.options_override='[]'::jsonb)
and sq.question_type_override is null and qb.question_type in ('single_choice','multiple_choice');
