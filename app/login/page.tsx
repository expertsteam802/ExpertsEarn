import Link from "next/link";
import {redirect} from "next/navigation";
import {AuthForm} from "@/components/auth-form";
import {Brand} from "@/components/brand";
import {createClient} from "@/lib/supabase/server";
export default async function LoginPage({searchParams}:{searchParams:{next?:string}}){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(user){const next=searchParams.next;redirect(next&&next.startsWith("/")&&!next.startsWith("//")?next:"/dashboard");}
 return <main className="ambient-bg grid min-h-screen place-items-center px-5 py-12"><div className="w-full max-w-md"><Brand/><div className="surface mt-7 p-8"><p className="eyebrow">Member access</p><h1 className="mt-3 text-2xl font-bold text-[#f2ecdf]">Welcome back.</h1><p className="mb-7 mt-2 text-sm text-[#aaa6a2]">Sign in to continue to your ExpertsEarn workspace.</p><AuthForm mode="login"/></div><p className="mt-5 text-center text-xs text-[#77747a]">Secure access · ExpertsEarn by ExpertsTeam</p></div></main>
}