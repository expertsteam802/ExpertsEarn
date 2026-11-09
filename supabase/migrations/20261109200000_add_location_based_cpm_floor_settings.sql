insert into public.platform_settings(key,value,updated_at)
values ('location_cpm_rates', '{"default_floor_usd":0,"countries":{}}'::jsonb, now())
on conflict (key) do nothing;
