import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestionBankImporter } from "@/components/question-bank-importer";
import { createRandomSurvey, generateStarterSurveys } from "./actions";

export default async function QuestionBankPage({ searchParams }: { searchParams: { error?: string; created?: string; starter_generated?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  const [{ count }, { data: categories }] = await Promise.all([
    supabase.from("question_bank").select("*", { count: "exact", head: true }),
    supabase.from("survey_categories").select("slug,name").order("name")
  ]);

  return <main className="min-h-screen py-9"><div className="container max-w-4xl">
    <Link href="/admin" className="text-sm font-bold text-forest">← Admin dashboard</Link>
    <p className="mt-6 text-sm font-bold uppercase tracking-wider text-amber-600">Survey engine</p>
    <h1 className="mt-1 text-3xl font-black text-slate-950">Question bank</h1>
    <div className="surface mt-5 flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="text-sm text-slate-500">Questions currently stored</p><p className="mt-1 text-3xl font-black text-forest">{(count ?? 0).toLocaleString()}</p></div><div className="text-right"><p className="text-sm font-bold text-slate-800">Target: 10,000+</p><p className="mt-1 text-xs text-slate-500">English · Kinyarwanda · French</p></div></div>
    {searchParams.error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{decodeURIComponent(searchParams.error)}</p>}
    {searchParams.created && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Random survey created as a draft: {searchParams.created}</p>}
    {searchParams.starter_generated && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{searchParams.starter_generated} starter surveys were generated as drafts. Review and publish them from Creator Studio.</p>}
    <section className="surface mt-6 p-6">
      <h2 className="text-lg font-black text-slate-950">Generate 100 starter surveys</h2>
      <p className="mt-2 text-sm text-slate-500">Creates draft surveys across all eight research categories. Set the reward here; every completed response earns that exact RWF amount after the survey is published.</p>
      <form action={generateStarterSurveys} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-semibold">Survey count<input name="survey_count" type="number" min="1" max="100" defaultValue="100" className="mt-2 block w-28 rounded-xl border border-slate-200 p-3"/></label>
        <label className="text-sm font-semibold">Questions per survey<input name="question_count" type="number" min="1" max="100" defaultValue="20" className="mt-2 block w-36 rounded-xl border border-slate-200 p-3"/></label>
        <label className="text-sm font-semibold">Reward per completed survey (RWF)<input name="reward_rwf" type="number" min="0" max="1000000" required placeholder="Enter reward" className="mt-2 block w-48 rounded-xl border border-slate-200 p-3"/></label>
        <button className="rounded-xl bg-forest px-5 py-3 font-bold text-white">Generate starter set</button>
      </form>
    </section>
    <div className="mt-6"><QuestionBankImporter/></div>
    <section className="surface mt-6 p-6">
      <h2 className="text-lg font-black text-slate-950">Generate a random survey</h2>
      <p className="mt-2 text-sm text-slate-500">Selects unique active questions randomly from the imported bank. The generated survey stays in draft until you publish it.</p>
      <form action={createRandomSurvey} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold sm:col-span-2">Survey title<input name="title" required minLength={3} placeholder="Community pulse survey" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
        <label className="text-sm font-semibold">Language<select name="language" className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"><option value="en">English</option><option value="rw">Kinyarwanda</option><option value="fr">French</option></select></label>
        <label className="text-sm font-semibold">Questions<input name="question_count" type="number" min="1" max="100" defaultValue="20" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
        <label className="text-sm font-semibold">Reward (RWF)<input name="reward_rwf" type="number" min="0" max="1000000" required placeholder="Enter reward" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
        <button className="self-end rounded-xl bg-forest px-5 py-3 font-bold text-white">Generate draft survey</button>
      </form>
    </section>
    <section className="surface mt-6 p-6"><h2 className="font-black text-slate-950">Available categories</h2><div className="mt-3 flex flex-wrap gap-2">{(categories || []).map((category) => <span key={category.slug} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-forest">{category.name} · {category.slug}</span>)}</div></section>
  </div></main>;
}
