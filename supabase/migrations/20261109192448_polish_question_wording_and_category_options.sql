-- Improve question wording and tailor feature/add-on choices by research category.
update public.question_bank
set prompt=regexp_replace(prompt,'^How does (.*) compare with other available options\\?$','How does your experience with \\1 compare with other available options?')
where prompt like 'How does % compare with other available options?';

update public.question_bank
set prompt=replace(prompt,'Which device or channel do you use most for ','Which device or channel do you most often use to find or access ')
where prompt like 'Which device or channel do you use most for %';

update public.question_bank
set prompt=replace(prompt,'How much time do you typically spend using ','How much time do you typically spend using or accessing ')
where prompt like 'How much time do you typically spend using %';

update public.question_bank q
set options=case
 when c.slug='education' then '["Course or lesson quality","Instructor support","Practical exercises","Flexible schedule","Recognized certificate","Affordable fees","Accessible learning materials","Other"]'::jsonb
 when c.slug='finance' then '["Low transaction fees","Fast transactions","Strong security","Easy-to-use service","Wide agent or ATM access","Higher transaction limits","Helpful customer support","Other"]'::jsonb
 when c.slug='health' then '["Qualified health professionals","Shorter waiting times","Clean facilities","Affordable care","Convenient location","Medicine availability","Privacy and confidentiality","Other"]'::jsonb
 when c.slug='transport' then '["Passenger safety","Reliable schedules","Affordable fares","Shorter travel time","Comfortable vehicles","More routes or destinations","Easy booking and payment","Other"]'::jsonb
 when c.slug='entertainment' then '["More content choices","Affordable subscription","Better audio or video quality","Offline access","Personalized recommendations","Subtitles or language choices","Family or parental controls","Other"]'::jsonb
 when c.slug='food' then '["Fresh ingredients","Good taste","Food safety and hygiene","Affordable prices","Suitable portion sizes","Clear ingredient information","Convenient availability","Other"]'::jsonb
 when c.slug='technology' then '["Fast performance","Reliable operation","Easy-to-use interface","Security and privacy","Compatibility with my devices","Useful features","Helpful technical support","Other"]'::jsonb
 else '["Product quality","Durability","Affordable price","Safety","Design and appearance","Available sizes or choices","Warranty or after-sales support","Other"]'::jsonb
end
from public.survey_categories c
where q.category_id=c.id and q.prompt like 'Which feature do you value most in %';

update public.question_bank q
set options=case
 when c.slug='education' then '["One-to-one tutoring","Extra learning materials","Career guidance","Mentoring","Practice tests","Certificates","Study reminders","Other"]'::jsonb
 when c.slug='finance' then '["Transaction notifications","Savings and budgeting tools","Financial advice","Faster customer support","Account statements","Bill payment options","Fraud alerts","Other"]'::jsonb
 when c.slug='health' then '["Appointment booking","Follow-up consultations","Medicine delivery","Health reminders","Nutrition guidance","Counselling support","Home visits","Other"]'::jsonb
 when c.slug='transport' then '["Live vehicle tracking","Route and schedule updates","Advance booking","Safety assistance","Digital receipts","Luggage or delivery support","Customer help line","Other"]'::jsonb
 when c.slug='entertainment' then '["Offline access","Personalized recommendations","Subtitles or translations","Family profiles","Live events","Download options","Creator interaction","Other"]'::jsonb
 when c.slug='food' then '["Home delivery","Meal customization","Nutrition information","Online ordering","Loyalty discounts","Scheduled pickup","Allergen information","Other"]'::jsonb
 when c.slug='technology' then '["Setup assistance","Technical support","Data backup","Security monitoring","Training or tutorials","Integration with other tools","Extended warranty","Other"]'::jsonb
 else '["Home delivery","Installation or setup","Product demonstrations","Warranty extension","Repair service","Easy returns or exchanges","Usage instructions","Other"]'::jsonb
end
from public.survey_categories c
where q.category_id=c.id and q.prompt like 'What additional service would you like to receive with %';
