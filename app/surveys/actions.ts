"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function startSurvey(surveyId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("start_survey_response", { p_survey_id: surveyId });
  if (error) throw new Error(error.message);
  redirect(`/surveys/${surveyId}/take/${data}`);
}

export async function completeSurvey(responseId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("complete_survey_response", { p_response_id: responseId });
  if (error) throw new Error(error.message);
  redirect(`/complete?reward=${encodeURIComponent(String(data.reward_rwf ?? 0))}`);
}