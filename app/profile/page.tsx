import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile-editor";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: submissions }] = await Promise.all([
    supabase.from("profiles").select("display_name,phone_e164,phone_verified_at,country_code,preferred_language,date_of_birth,gender,identity_verified_at").eq("id", user.id).maybeSingle(),
    supabase.from("identity_verification_submissions").select("id,status,submitted_at,admin_note").eq("user_id", user.id).order("submitted_at", { ascending: false }).limit(1)
  ]);

  return <main className="min-h-screen py-10">
    <div className="container max-w-2xl">
      <Link href="/dashboard" className="text-sm font-bold text-forest">← Dashboard</Link>
      <h1 className="mt-5 text-3xl font-black text-slate-950">Your profile</h1>
      <p className="mt-2 text-sm text-slate-500">Manage your details, verify your phone, and complete identity checks before your first payout.</p>
      <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Signed in as <strong>{user.email}</strong></div>
      <ProfileEditor profile={{
        display_name: profile?.display_name ?? null,
        phone_e164: profile?.phone_e164 ?? null,
        phone_verified_at: profile?.phone_verified_at ?? null,
        country_code: profile?.country_code ?? "RW",
        preferred_language: (profile?.preferred_language ?? "en") as "en"|"rw"|"fr",
        date_of_birth: profile?.date_of_birth ?? null,
        gender: profile?.gender ?? null,
        identity_verified_at: profile?.identity_verified_at ?? null
      }} submission={submissions?.[0] ?? null}/>
    </div>
  </main>;
}
