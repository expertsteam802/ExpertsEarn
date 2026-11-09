"use server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { createHmac } from "node:crypto";
import { redirect } from "next/navigation";

export async function startSurvey(surveyId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const requestHeaders = headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "";
  const hashSecret = process.env.IP_HASH_SECRET;
  const ipHash = ipAddress && hashSecret
    ? createHmac("sha256", hashSecret).update(ipAddress).digest("hex")
    : null;

  const { data, error } = await supabase.rpc("start_survey_response", {
    p_survey_id: surveyId,
    p_ip_hash: ipHash
  });
  if (error) redirect(`/surveys/${surveyId}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`/surveys/${surveyId}?error=survey_start_failed`);
  redirect(`/surveys/${surveyId}/take/${data}`);
}

export async function completeSurvey(responseId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("complete_survey_response", { p_response_id: responseId });
  if (error) redirect(`/surveys?error=${encodeURIComponent(error.message)}`);
  redirect(`/complete?reward=${encodeURIComponent(String(data?.reward_rwf ?? 0))}`);
}
