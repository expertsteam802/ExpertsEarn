"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export async function updatePayout(formData:FormData){
 const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const id=String(formData.get("payout_id")||"");const status=String(formData.get("status")||"");
 const note=String(formData.get("note")||"");
 const {error}=await supabase.rpc("admin_update_payout",{p_payout_id:id,p_status:status,p_note:note});
 if(error)redirect("/admin?error="+encodeURIComponent(error.message));
 redirect("/admin?updated=1");
}
export async function approvePartner(formData:FormData){
 const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const id=String(formData.get("partner_id")||"");
 const {error}=await supabase.from("partner_accounts").update({is_approved:true}).eq("id",id);
 if(error)redirect("/admin?error="+encodeURIComponent(error.message));
 redirect("/admin?partner_approved=1");
}

export async function setSurveyStatus(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const surveyId = String(formData.get("survey_id") || "");
  const status = String(formData.get("status") || "");
  const allowed = ["draft", "active", "paused", "completed", "archived"];
  if (!surveyId || !allowed.includes(status)) redirect("/admin?error=invalid_survey_status");
  const { error } = await supabase.rpc("admin_set_survey_status", {
    p_survey_id: surveyId,
    p_status: status
  });
  if (error) redirect("/admin?error=" + encodeURIComponent(error.message));
  redirect("/admin?survey_updated=1");
}


export async function updateUserRole(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const userId = String(formData.get("user_id") || "");
  const role = String(formData.get("role") || "");
  if (!userId || !["respondent", "partner", "admin"].includes(role)) redirect("/admin?error=invalid_user_role");
  const { error } = await supabase.rpc("admin_update_profile_role", { p_user_id: userId, p_role: role });
  if (error) redirect("/admin?error=" + encodeURIComponent(error.message));
  redirect("/admin?user_updated=1#users");
}

export async function updatePlatformSetting(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const key = String(formData.get("key") || "");
  const raw = String(formData.get("value") || "");
  const allowed = ["daily_survey_cap", "minimum_payout_rwf", "revenue_splits", "survey_pricing_usd", "supported_languages", "public_branding"];
  if (!allowed.includes(key)) redirect("/admin?error=setting_not_allowed#settings");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { redirect("/admin?error=setting_must_be_valid_json#settings"); }
  if (key === "daily_survey_cap" && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 500)) redirect("/admin?error=daily_cap_must_be_1_to_500#settings");
  if (key === "minimum_payout_rwf" && (!Number.isInteger(Number(value)) || Number(value) < 1000 || Number(value) > 10000000)) redirect("/admin?error=minimum_payout_out_of_range#settings");
  const { error } = await supabase.from("platform_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
  if (error) redirect("/admin?error=" + encodeURIComponent(error.message) + "#settings");
  redirect("/admin?settings_saved=1#settings");
}
