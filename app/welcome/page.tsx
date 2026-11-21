import {redirect} from "next/navigation";import {createClient} from "@/lib/supabase/server";import {WelcomeTransition} from "@/components/welcome-transition";
export const dynamic="force-dynamic";
export default async function WelcomePage(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");const {data:profile}=await supabase.from("profiles").select("youtube_subscription_confirmed_at").eq("id",user.id).maybeSingle();if(profile?.youtube_subscription_confirmed_at)redirect("/dashboard");return <WelcomeTransition/>;}
