import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {DashboardShell} from "@/components/dashboard-shell";
export default async function DashboardPage(){
 const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const [{data:profile},{data:wallet},{data:surveys}]=await Promise.all([
  supabase.from("profiles").select("display_name,role").eq("id",user.id).maybeSingle(),
  supabase.from("wallets").select("balance_rwf,lifetime_earned_rwf").eq("user_id",user.id).maybeSingle(),
  supabase.from("surveys").select("id,title,description,reward_rwf,question_count,language").eq("status","active").limit(40)
 ]);
 return <DashboardShell name={profile?.display_name||""} email={user.email||""} role={profile?.role||"respondent"} balance={wallet?.balance_rwf??0} lifetime={wallet?.lifetime_earned_rwf??0} surveys={surveys??[]}/>;
}
