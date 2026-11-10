"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (error || profile?.role !== "admin") redirect("/dashboard?error=admin_required");
}

export async function updatePayout(formData:FormData){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const id=String(formData.get("payout_id")||"");const status=String(formData.get("status")||"");
 const note=String(formData.get("note")||"");
 const {error}=await supabase.rpc("admin_update_payout",{p_payout_id:id,p_status:status,p_note:note});
 if(error)redirect("/admin?tab=payouts&error="+encodeURIComponent(error.message));
 redirect("/admin?tab=payouts&updated=1");
}
export async function approvePartner(formData:FormData){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 await requireAdmin(supabase,user.id);
 const id=String(formData.get("partner_id")||"");
 if(!id)redirect("/admin?tab=partners&error=invalid_partner");
 const {error}=await supabase.from("partner_accounts").update({is_approved:true}).eq("id",id).select("id").single();
 if(error)redirect("/admin?tab=partners&error="+encodeURIComponent(error.message));
 redirect("/admin?tab=partners&partner_approved=1");
}

export async function setSurveyStatus(formData: FormData) {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false,error:"Please sign in again."};
  const surveyId=String(formData.get("survey_id")||""); const status=String(formData.get("status")||"");
  if(!surveyId||!["draft","active","paused","completed","archived"].includes(status)) return {ok:false,error:"Invalid survey status."};
  const {error}=await supabase.rpc("admin_set_survey_status",{p_survey_id:surveyId,p_status:status});
  return error?{ok:false,error:error.message}:{ok:true,message:"Survey status updated."};
}
export async function updateUserRole(formData: FormData) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await requireAdmin(supabase,user.id);
  const key = String(formData.get("key") || "");
  const raw = String(formData.get("value") || "");
  const allowed = ["daily_survey_cap", "minimum_payout_rwf", "revenue_splits", "survey_pricing_usd", "supported_languages", "public_branding", "location_cpm_rates", "usd_to_rwf_rate"];
  if (!allowed.includes(key)) return {ok:false,error:"This setting is not allowed."};
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return {ok:false,error:"Enter valid JSON before saving."}; }
  if (key === "daily_survey_cap" && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 500)) return {ok:false,error:"Daily survey cap must be between 1 and 500."};
  if (key === "minimum_payout_rwf" && (!Number.isInteger(Number(value)) || Number(value) < 1000 || Number(value) > 10000000)) return {ok:false,error:"Minimum payout must be between 1,000 and 10,000,000 RWF."};
  if (key === "usd_to_rwf_rate" && (!Number.isFinite(Number(value)) || Number(value) < 1 || Number(value) > 100000)) return {ok:false,error:"Enter a valid RWF per USD exchange rate."};
  if (key === "revenue_splits") {
    const split=value as any; const partner=split?.partner;
    if (!partner || !["owner","respondent","reserve"].every(k=>Number.isFinite(partner[k]) && partner[k]>=0 && partner[k]<=100) || partner.owner+partner.respondent+partner.reserve!==100) return {ok:false,error:"Partner revenue shares must total exactly 100%."};
  }
  if (key === "survey_pricing_usd") {
    const pricing=value as any;
    if (!pricing || !Number.isFinite(pricing.min) || !Number.isFinite(pricing.max) || pricing.min<0.01 || pricing.max>1000 || pricing.min>pricing.max) return {ok:false,error:"Enter a valid minimum and maximum partner price."};
  }
  if (key === "location_cpm_rates") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {ok:false,error:"Location CPM settings must be a JSON object."};
    const config=value as {default_floor_usd?:number;countries?:Record<string,{floor_cpm_usd?:number}>};
    if (typeof config.default_floor_usd!=="number" || !Number.isFinite(config.default_floor_usd) || config.default_floor_usd<0 || config.default_floor_usd>1000 || !config.countries || typeof config.countries!=="object" || Array.isArray(config.countries)) return {ok:false,error:"Set a valid default_floor_usd and countries object."};
    for (const [country,rate] of Object.entries(config.countries)) if (!/^[A-Z]{2}$/.test(country) || !rate || typeof rate.floor_cpm_usd!=="number" || !Number.isFinite(rate.floor_cpm_usd) || rate.floor_cpm_usd<0 || rate.floor_cpm_usd>1000) return {ok:false,error:"Each country must use a two-letter ISO code and a non-negative floor_cpm_usd."};
  }
  const { error } = await supabase.from("platform_settings").update({ value: value as any, updated_at: new Date().toISOString() }).eq("key", key).select("key").single();
  if (error) return {ok:false,error:error.message};
  return {ok:true,message:"Setting saved."};
}


export async function updateSurveyTerms(formData: FormData) {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false,error:"Please sign in again."};
  const surveyId=String(formData.get("survey_id")||""); const reward=Number(formData.get("reward_rwf"));
  const limitRaw=String(formData.get("response_limit")||"").trim(); const limit=limitRaw?Number(limitRaw):null;
  if(!surveyId||!Number.isInteger(reward)||(limit!==null&&!Number.isInteger(limit))) return {ok:false,error:"Enter a valid reward and response cap."};
  const {error}=await supabase.rpc("admin_update_survey_terms",{p_survey_id:surveyId,p_reward_rwf:reward,p_response_limit:limit});
  return error?{ok:false,error:error.message}:{ok:true,message:"Survey terms saved."};
}
export async function bulkUpdateSurveyStatus(formData: FormData) {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false,error:"Please sign in again."};
  const ids=formData.getAll("survey_ids").map(String).filter(Boolean); const status=String(formData.get("status")||"");
  if(!ids.length||ids.length>50||!["active","paused","archived"].includes(status)) return {ok:false,error:"Select between 1 and 50 surveys and choose a valid action."};
  for(const surveyId of ids){const {error}=await supabase.rpc("admin_set_survey_status",{p_survey_id:surveyId,p_status:status});if(error)return {ok:false,error:error.message};}
  return {ok:true,message:ids.length+" surveys updated."};
}

export async function bulkUpdateSurveyRewards(formData: FormData) {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false,error:"Please sign in again."};
  const ids=formData.getAll("survey_ids").map(String).filter(Boolean);
  const rewardRaw=String(formData.get("reward_rwf")??"").trim();
  const reward=Number(rewardRaw);
  if(!ids.length||ids.length>50||!rewardRaw||!Number.isSafeInteger(reward)||reward<0||reward>1000000) return {ok:false,error:"Select 1–50 draft or paused surveys and enter a reward from 0 to 1,000,000 RWF."};
  const {data:surveys,error:loadError}=await supabase.from("surveys").select("id,response_limit,status").in("id",ids);
  if(loadError||!surveys||surveys.length!==ids.length) return {ok:false,error:loadError?.message||"Could not load the selected surveys."};
  if(surveys.some(s=>!["draft","paused"].includes(s.status))) return {ok:false,error:"Pause active surveys before changing their rewards."};
  for(const survey of surveys){
    const {error}=await supabase.rpc("admin_update_survey_terms",{p_survey_id:survey.id,p_reward_rwf:reward,p_response_limit:survey.response_limit});
    if(error) return {ok:false,error:error.message};
  }
  return {ok:true,message:"Reward updated for "+surveys.length+" surveys."};
}
