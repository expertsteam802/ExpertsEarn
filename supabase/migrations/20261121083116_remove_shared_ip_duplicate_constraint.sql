drop index if exists public.survey_responses_survey_ip_hash_unique;
create index if not exists survey_responses_survey_ip_hash_idx
  on public.survey_responses(survey_id,ip_hash)
  where ip_hash is not null;
