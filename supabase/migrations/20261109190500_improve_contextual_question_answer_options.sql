update public.question_bank
set options = case
  when prompt ilike 'At what time or occasion%' then '["Early morning","Morning","Afternoon","Evening","Late night","Weekends or holidays","Only when needed"]'::jsonb
  when prompt ilike '%how frequently%' or prompt ilike '%how often%' then '["Daily","Several times a week","About once a week","A few times a month","About once a month","Less than once a month","Never"]'::jsonb
  when prompt ilike '%price range%' or prompt ilike '%how much would you pay%' then '["Less than 1,000 RWF","1,000–4,999 RWF","5,000–9,999 RWF","10,000–19,999 RWF","20,000–49,999 RWF","50,000 RWF or more","I would not pay for it"]'::jsonb
  when prompt ilike '%how easy%' or prompt ilike '%ease of access%' then '["Very easy","Somewhat easy","Neither easy nor difficult","Somewhat difficult","Very difficult","Not sure"]'::jsonb
  when prompt ilike '%compare%' then '["Much better than alternatives","Somewhat better","About the same","Somewhat worse","Much worse","I have not tried alternatives"]'::jsonb
  when prompt ilike '%factor most influences%' or prompt ilike '%most important factor%' then '["Price or affordability","Quality or performance","Availability or convenience","Safety or reliability","Brand reputation","Recommendations or reviews","Customer service","Other"]'::jsonb
  when prompt ilike '%which feature%' or prompt ilike '%feature do you value%' then '["Ease of use","Reliability","Speed or performance","Quality or durability","Security or privacy","Affordability","Customer support","Other"]'::jsonb
  when prompt ilike '%what information%' then '["Prices and fees","Product or service features","Customer reviews","Safety and reliability","How to use it","Terms and conditions","Availability and location","Other"]'::jsonb
  when prompt ilike '%what would prevent%' or prompt ilike '%main challenge%' or prompt ilike '%biggest barrier%' then '["Cost is too high","Not available nearby","Lack of information","Difficult to use or access","Lack of trust","Poor quality or reliability","I do not need it","Other"]'::jsonb
  when prompt ilike '%where do you usually%' or prompt ilike '%which channel%' or prompt ilike '%where do you access%' then '["Physical shop or office","Official website","Mobile application","Social media or messaging","Phone call or SMS","Through friends or family","Other"]'::jsonb
  when prompt ilike '%how satisfied%' then '["Very satisfied","Satisfied","Neither satisfied nor dissatisfied","Dissatisfied","Very dissatisfied","Not applicable"]'::jsonb
  when prompt ilike '%recommend%' then '["Definitely","Probably","Not sure","Probably not","Definitely not"]'::jsonb
  when prompt ilike '%which type%' or prompt ilike '%what type%' then '["A basic or entry-level option","A standard option","A premium option","A specialist option","I do not use this","Other"]'::jsonb
  else '["Very important","Somewhat important","Neither important nor unimportant","Not very important","Not important at all","Not sure"]'::jsonb
end
where question_type in ('single_choice','multiple_choice');

update public.survey_questions sq
set options_override = qb.options
from public.question_bank qb
where sq.question_id = qb.id
  and sq.options_override = '[]'::jsonb
  and qb.question_type in ('single_choice','multiple_choice');
