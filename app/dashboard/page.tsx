import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {DashboardShell} from "@/components/dashboard-shell";
export default async function DashboardPage(){
 const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const [{data:profile},{data:wallet},{data:allSurveys},{data:responses}]=await Promise.all([
  supabase.from("profiles").select("display_name,avatar_url,role,country_code,province,district,sector,cell,village,region,city,gender,date_of_birth").eq("id",user.id).maybeSingle(),
  supabase.from("wallets").select("balance_rwf,lifetime_earned_rwf").eq("user_id",user.id).maybeSingle(),
  supabase.from("surveys").select("id,title,description,reward_rwf,question_count,language,response_count,response_limit,starts_at,ends_at,target_country,target_region,target_city,target_province,target_district,target_sector,target_cell,target_village,target_gender,min_age,max_age").eq("status","active").order("created_at",{ascending:false}).limit(200),
  supabase.from("survey_responses").select("survey_id,status").eq("respondent_id",user.id)
 ]);
 const completed=new Set((responses||[]).filter(r=>r.status==="submitted").map(r=>r.survey_id));
 const age=profile?.date_of_birth ? Math.floor((Date.now()-new Date(profile.date_of_birth).getTime())/31557600000) : null;
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
 }).map(s=>({...s,question_count:s.question_count||0}));
 return <DashboardShell name={profile?.display_name||""} avatarUrl={profile?.avatar_url||""} email={user.email||""} role={profile?.role||"respondent"} balance={wallet?.balance_rwf??0} lifetime={wallet?.lifetime_earned_rwf??0} surveys={eligible as any}/>;
}
