WITH category_contexts AS (
  SELECT * FROM (VALUES
    ('consumer-goods', ARRAY['household cleaning products','personal care products','clothing and footwear','consumer electronics','home appliances','mobile devices','packaged snacks','beauty products','local retail stores','online shopping']),
    ('education', ARRAY['online learning platforms','school materials','vocational training','university programs','tutoring services','digital classrooms','language courses','professional certificates','school meal programs','library services']),
    ('entertainment', ARRAY['streaming services','music platforms','local events','movies and cinema','video games','podcasts','social media content','live performances','sports broadcasts','creator channels']),
    ('finance', ARRAY['mobile money services','savings accounts','banking applications','digital loans','insurance products','payment cards','remittance services','budgeting tools','merchant payments','financial education']),
    ('food', ARRAY['packaged foods','fresh produce','restaurants','food delivery services','local markets','beverages','school meals','food labels','cooking ingredients','grocery shops']),
    ('health', ARRAY['clinic services','pharmacy services','health information','preventive care','fitness programs','nutrition products','telemedicine services','maternal health services','mental health support','health insurance']),
    ('technology', ARRAY['smartphones','mobile applications','internet providers','AI tools','cloud storage','cybersecurity services','online shopping platforms','digital identity services','computer software','customer support chatbots']),
    ('transport', ARRAY['public transport','motorcycle taxi services','bus services','ride-hailing applications','bicycle routes','fuel stations','vehicle maintenance','road safety services','delivery services','parking facilities'])
  ) AS t(slug, contexts)
), templates AS (
  SELECT * FROM (VALUES
    (1,'How frequently do you use %s?'),(2,'Which factor most influences your choice of %s?'),(3,'How satisfied are you with your experience of %s?'),(4,'What is one improvement you would like to see in %s?'),(5,'How likely are you to recommend %s to someone you know?'),(6,'What price range feels fair for %s?'),(7,'Which feature do you value most in %s?'),(8,'How easy is it for you to access %s?'),(9,'What would prevent you from using %s more often?'),(10,'Have you used %s in the past 30 days?'),(11,'How does %s compare with other available options?'),(12,'What information would help you decide whether to choose %s?'),(13,'At what time or occasion do you most often use %s?'),(14,'How much time do you typically spend using %s?'),(15,'What is the most frustrating part of your experience with %s?'),(16,'Where do you usually discover or learn about %s?'),(17,'How important is quality when selecting %s?'),(18,'What would make you switch from your current option to %s?'),(19,'How reliable has your experience with %s been?'),(20,'What is your preferred way to pay for %s?'),(21,'How often do you seek advice before choosing %s?'),(22,'Which device or channel do you use most for %s?'),(23,'What is your main goal when choosing %s?'),(24,'How well does %s meet your expectations?'),(25,'What additional service would you like to receive with %s?')
  ) AS t(n,prompt_template)
), generated AS (
 SELECT c.slug,ctx.context,t.n,format(t.prompt_template,ctx.context) AS prompt
 FROM category_contexts c CROSS JOIN LATERAL unnest(c.contexts) AS ctx(context) CROSS JOIN templates t
)
INSERT INTO public.question_bank(category_id,prompt,question_type,options,difficulty,language,is_active)
SELECT sc.id,g.prompt,
 CASE WHEN g.n IN (3,5,17,24) THEN 'rating'::public.question_type
 WHEN g.n IN (2,6,7,13,16,20,22,23,1,8,11,19,21) THEN 'single_choice'::public.question_type
 WHEN g.n=10 THEN 'yes_no'::public.question_type
 WHEN g.n=14 THEN 'number'::public.question_type
 ELSE 'text'::public.question_type END,
 CASE WHEN g.n IN (2,6,7,13,16,20,22,23,1,8,11,19,21) THEN '["Price","Quality","Convenience","Availability","Trust","Other"]'::jsonb ELSE '[]'::jsonb END,
 CASE WHEN g.n IN (4,9,12,15,18,25) THEN 2 ELSE 1 END,'en',true
FROM generated g JOIN public.survey_categories sc ON sc.slug=g.slug
WHERE NOT EXISTS(SELECT 1 FROM public.question_bank q WHERE q.prompt=g.prompt AND q.language='en');
