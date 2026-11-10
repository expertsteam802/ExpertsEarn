import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {ProfileEditor} from "@/components/profile-editor";
export default async function ProfilePage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const [{data:profile},{data:submissions}]=await Promise.all([
  supabase.from("profiles").select("display_name,avatar_url,country_code,preferred_language,date_of_birth,gender,identity_verified_at,province,district,sector,cell,village,region,city").eq("id",user.id).maybeSingle(),
  supabase.from("identity_verification_submissions").select("id,status,submitted_at,admin_note").eq("user_id",user.id).order("submitted_at",{ascending:false}).limit(1)
 ]);
 return <main className="min-h-screen bg-[#090a0f] py-10"><div className="container max-w-2xl"><Link href="/dashboard" className="text-sm font-bold text-[#c6a873]">← Workspace</Link><h1 className="mt-5 text-3xl font-semibold text-[#f2ecdf]">Your profile</h1><p className="mt-2 text-sm text-[#aaa6a2]">Manage your account details, email identity, location, language and identity review.</p><div className="mt-4 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm text-[#aaa6a2]">Signed in as <strong className="text-[#eee7dc]">{user.email}</strong></div><ProfileEditor profile={{display_name:profile?.display_name??null,avatar_url:profile?.avatar_url??null,phone_e164:null,phone_verified_at:null,country_code:profile?.country_code??"RW",preferred_language:(profile?.preferred_language??"en") as "en"|"rw"|"fr",date_of_birth:profile?.date_of_birth??null,gender:profile?.gender??null,identity_verified_at:profile?.identity_verified_at??null,province:profile?.province??null,district:profile?.district??null,sector:profile?.sector??null,cell:profile?.cell??null,village:profile?.village??null,region:profile?.region??null,city:profile?.city??null}} submission={submissions?.[0]??null}/></div></main>;
}
