import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Wallet, ClipboardList, UserRound, ShieldCheck } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data: wallet }, { data: surveys }] = await Promise.all([
    supabase.from("profiles").select("display_name,preferred_language,role").eq("id", user.id).maybeSingle(),
    supabase.from("wallets").select("balance_rwf,lifetime_earned_rwf").eq("user_id", user.id).maybeSingle(),
    // RLS applies country, demographic and geography targeting through can_access_survey().
    supabase.from("surveys").select("id,title,description,reward_rwf,question_count,language").eq("status", "active").limit(8)
  ]);
  return <main className="min-h-screen">
    <header className="border-b border-slate-100 bg-white"><div className="container flex h-16 items-center justify-between gap-3">
      <Link href="/" className="font-black text-forest">ExpertsEarn</Link>
      <div className="flex items-center gap-3 text-sm">
        <Link href="/wallet" className="rounded-xl bg-emerald-50 px-3 py-2 font-extrabold text-forest"><Wallet className="mr-1 inline h-4 w-4"/> {(wallet?.balance_rwf ?? 0).toLocaleString()} RWF</Link>
        <span className="hidden text-slate-500 sm:inline">Hi, {profile?.display_name || user.email}</span>
        <form action="/auth/signout" method="post"><button className="font-bold text-forest">Sign out</button></form>
      </div>
    </div></header>
    <div className="container py-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold text-amber-600">YOUR SPACE</p><h1 className="mt-1 text-3xl font-black text-slate-950">Dashboard</h1><p className="mt-2 text-slate-500">Discover surveys and keep track of your rewards.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/profile" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"><UserRound className="mr-2 inline h-4 w-4"/> My profile</Link><Link href="/leaderboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Leaderboard</Link></div>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-forest p-6 text-white"><div className="flex items-center justify-between"><span className="text-sm text-emerald-100">Available balance</span><Wallet className="h-5 w-5 text-amber-300"/></div><p className="mt-3 text-3xl font-black">{(wallet?.balance_rwf ?? 0).toLocaleString()} <span className="text-base">RWF</span></p><Link href="/wallet" className="mt-4 inline-block text-sm font-bold text-amber-300">Open wallet <ArrowRight className="ml-1 inline h-4 w-4"/></Link></div>
        <div className="surface p-6"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">Lifetime earned</span><ShieldCheck className="h-5 w-5 text-forest"/></div><p className="mt-3 text-3xl font-black text-slate-950">{(wallet?.lifetime_earned_rwf ?? 0).toLocaleString()} <span className="text-base text-slate-500">RWF</span></p><p className="mt-4 text-sm text-slate-500">Rewards are added after a response is verified.</p></div>
      </div>
      <div className="mt-10 flex items-center justify-between"><div><h2 className="text-xl font-black text-slate-950">Available surveys</h2><p className="mt-1 text-sm text-slate-500">Showing opportunities that match your profile and location.</p></div><ClipboardList className="h-6 w-6 text-forest"/></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{(surveys ?? []).map((survey) => <article key={survey.id} className="surface p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-extrabold text-slate-900">{survey.title}</h3><p className="mt-1 text-sm text-slate-500">{survey.description || "Share your opinion in this survey."}</p></div><span className="whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-forest">+{survey.reward_rwf.toLocaleString()} RWF</span></div><div className="mt-4 flex items-center justify-between text-xs text-slate-400"><span>{survey.question_count} questions · {survey.language.toUpperCase()}</span><Link href={`/surveys/${survey.id}`} className="font-bold text-forest">Start survey <ArrowRight className="ml-1 inline h-3 w-3"/></Link></div></article>)}</div>
      {(!surveys || surveys.length === 0) && <div className="surface mt-4 p-8 text-center"><p className="font-bold text-slate-800">No matching surveys yet</p><p className="mt-2 text-sm text-slate-500">Complete your profile and check back when new opportunities are published.</p></div>}
    </div>
  </main>;
}
