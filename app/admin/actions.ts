"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export async function updatePayout(formData:FormData){
 const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const id=String(formData.get("payout_id")||"");const status=String(formData.get("status")||"");
 const note=String(formData.get("note")||"");
 const {error}=await supabase.rpc("admin_update_payout",{p_payout_id:id,p_status:status,p_note:note});
 if(error)redirect("/admin?tab=payouts&error="+encodeURIComponent(error.message));
 redirect("/admin?tab=payouts&updated=1");
}
export async function approvePartner(formData:FormData){
 const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const id=String(formData.get("partner_id")||"");
 const {error}=await supabase.from("partner_accounts").update({is_approved:true}).eq("id",id);
 if(error)redirect("/admin?tab=partners&error="+encodeURIComponent(error.message));
 redirect("/admin?tab=partners&partner_approved=1");
}

export async function setSurveyStatus(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const surveyId = String(formData.get("survey_id") || "");
  const status = String(formData.get("status") || "");
  const allowed = ["draft", "active", "paused", "completed", "archived"];
  if (!surveyId || !allowed.includes(status)) redirect("/admin?tab=surveys&error=invalid_survey_status");
  const { error } = await supabase.rpc("admin_set_survey_status", {
    p_survey_id: surveyId,
    p_status: status
  });
  if (error) redirect("/admin?tab=surveys&error=" + encodeURIComponent(error.message));
  redirect("/admin?tab=surveys&survey_updated=1");
}


export async function updateUserRole(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const userId = String(formData.get("user_id") || "");
  const role = String(formData.get("role") || "");
  if (!userId || !["respondent", "partner", "admin"].includes(role)) redirect("/admin?tab=users&error=invalid_user_role");
  const { error } = await supabase.rpc("admin_update_profile_role", { p_user_id: userId, p_role: role });
  if (error) redirect("/admin?tab=users&error=" + encodeURIComponent(error.message));
  redirect("/admin?tab=users&user_updated=1");
}

export async function updatePlatformSetting(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const key = String(formData.get("key") || "");
  const raw = String(formData.get("value") || "");
  const allowed = ["daily_survey_cap", "minimum_payout_rwf", "revenue_splits", "survey_pricing_usd", "supported_languages", "public_branding"];
  if (!allowed.includes(key)) redirect("/admin?tab=settings&error=setting_not_allowed");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { redirect("/admin?tab=settings&error=setting_must_be_valid_json"); }
  if (key === "daily_survey_cap" && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 500)) redirect("/admin?tab=settings&error=daily_cap_must_be_1_to_500");
  if (key === "minimum_payout_rwf" && (!Number.isInteger(Number(value)) || Number(value) < 1000 || Number(value) > 10000000)) redirect("/admin?tab=settings&error=minimum_payout_out_of_range");
  const { error } = await supabase.from("platform_settings").update({ value: value as any, updated_at: new Date().toISOString() }).eq("key", key);
  if (error) redirect("/admin?tab=settings&error=" + encodeURIComponent(error.message));
  redirect("/admin?tab=settings&settings_saved=1&setting=" + encodeURIComponent(key));
}


export async function updateSurveyTerms(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const surveyId = String(formData.get("survey_id") || "");
  const reward = Number(formData.get("reward_rwf"));
  const limitRaw = String(formData.get("response_limit") || "").trim();
  const limit = limitRaw ? Number(limitRaw) : null;
  if (!surveyId || !Number.isInteger(reward) || (limit !== null && !Number.isInteger(limit))) redirect("/admin?tab=surveys&error=invalid_survey_terms");
  const { error } = await supabase.rpc("admin_update_survey_terms", {
    p_survey_id: surveyId, p_reward_rwf: reward, p_response_limit: limit
  });
  if (error) redirect("/admin?tab=surveys&error=" + encodeURIComponent(error.message));
  redirect("/admin?tab=surveys&survey_updated=1");
}


export async function bulkUpdateSurveyStatus(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const ids = formData.getAll("survey_ids").map(String).filter(Boolean);
  const status = String(formData.get("status") || "");
  if (!ids.length || ids.length > 50 || !["active", "paused", "archived"].includes(status)) {
    redirect("/admin?tab=surveys&error=select_valid_surveys");
  }
  for (const surveyId of ids) {
    const { error } = await supabase.rpc("admin_set_survey_status", { p_survey_id: surveyId, p_status: status });
    if (error) redirect("/admin?tab=surveys&error=" + encodeURIComponent(error.message));
  }
  redirect("/admin?tab=surveys&survey_updated=1");
}
