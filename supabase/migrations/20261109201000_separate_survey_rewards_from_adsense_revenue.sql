update public.platform_settings
set value = jsonb_set(
  jsonb_set(value, '{adsense,owner}', '100'::jsonb, true),
  '{adsense,respondent_pool}', '0'::jsonb, true
), updated_at=now()
where key='revenue_splits';
