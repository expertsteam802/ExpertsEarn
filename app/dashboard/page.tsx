import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {DashboardShell} from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function DashboardPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const [{data:profile},{data:wallet},{data:allSurveys},{data:responses},{data:ecSetting}]=await Promise.all([
  supabase.from("profiles").select("display_name,avatar_url,role,country_code,province,district,sector,cell,village,region,city,gender,date_of_birth,account_status,account_locked_until,account_status_reason").eq("id",user.id).maybeSingle(),
  supabase.from("wallets").select("balance_rwf,lifetime_earned_rwf,balance_ec,lifetime_earned_ec").eq("user_id",user.id).maybeSingle(),
  supabase.from("surveys").select("id,title,description,reward_rwf,question_count,language,response_count,response_limit,starts_at,ends_at,target_country,target_region,target_city,target_province,target_district,target_sector,target_cell,target_village,target_gender,min_age,max_age").eq("status","active").gt("reward_rwf",0).order("created_at",{ascending:false}).limit(200),
  supabase.from("survey_responses").select("survey_id,status").eq("respondent_id",user.id),
  supabase.from("platform_settings").select("value").eq("key","expertscoins_per_rwf").maybeSingle()
 ]);
 const ecRate=Math.max(0.000001,Number(ecSetting?.value??1));
 const completed=new Set((responses||[]).filter(r=>r.status==="submitted").map(r=>r.survey_id));
 const age=profile?.date_of_birth ? (()=>{const today=new Date();const birth=new Date(profile.date_of_birth);let years=today.getFullYear()-birth.getFullYear();if(today.getMonth()<birth.getMonth()||(today.getMonth()===birth.getMonth()&&today.getDate()<birth.getDate()))years--;return years;})() : null;
 const eligible=(allSurveys||[]).filter(s=>{
  if(completed.has(s.id)||(s.response_limit!==null&&s.response_count>=s.response_limit)) return false;
  const now=Date.now();
  if(s.starts_at&&new Date(s.starts_at).getTime()>now) return false;
  if(s.ends_at&&new Date(s.ends_at).getTime()<now) return false;
  const fields:[string|null,string|null][]=[
   [s.target_country,profile?.country_code||null],[s.target_region,profile?.region||null],[s.target_city,profile?.city||null],
   [s.target_province,profile?.province||null],[s.target_district,profile?.district||null],[s.target_sector,profile?.sector||null],
   [s.target_cell,profile?.cell||null],[s.target_village,profile?.village||null],[s.target_gender,profile?.gender||null]
  ];
  if(fields.some(([target,actual])=>target!==null&&target!==actual)) return false;
  if((s.min_age!==null||s.max_age!==null)&&age===null) return false;
  if(s.min_age!==null&&age!==null&&age<s.min_age) return false;
  if(s.max_age!==null&&age!==null&&age>s.max_age) return false;
  return true;
 }).map(s=>({...s,question_count:s.question_count||0,reward_ec:Number(s.reward_rwf||0)*ecRate}));
 const accountRestricted = profile?.account_status === "suspended" || (profile?.account_status === "locked" && (!profile?.account_locked_until || new Date(profile.account_locked_until).getTime() > Date.now()));
 return <DashboardShell emailVerified={Boolean(user.email_confirmed_at)} accountRestricted={accountRestricted} restrictionReason={profile?.account_status_reason||""} name={profile?.display_name||""} avatarUrl={profile?.avatar_url||""} email={user.email||""} role={profile?.role||"respondent"} balanceEc={Number(wallet?.balance_ec??wallet?.balance_rwf??0)} lifetimeEc={Number(wallet?.lifetime_earned_ec??wallet?.lifetime_earned_rwf??0)} surveys={accountRestricted?[]:eligible as any}/>;
}
