import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { startSurvey } from "@/app/surveys/actions";
import { ArrowLeft, Clock, ClipboardList } from "lucide-react";

export default async function SurveyDetail({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: survey } = await supabase.from("surveys").select("*").eq("id",params.id).eq("status","active").maybeSingle();
  if (!survey) notFound();
  const [{ count }, { data:existing }] = await Promise.all([
    supabase.from("survey_questions").select("*",{count:"exact",head:true}).eq("survey_id",survey.id),
    supabase.from("survey_responses").select("id,status").eq("survey_id",survey.id).eq("respondent_id",user.id).eq("status","in_progress").maybeSingle()
  ]);
  return <main className="min-h-screen py-10"><div className="container max-w-2xl"><Link href="/dashboard" className="text-sm font-bold text-forest"><ArrowLeft className="mr-1 inline h-4 w-4"/> Back to surveys</Link><section className="surface mt-5 p-7"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-forest">{survey.language}</span><h1 className="mt-4 text-3xl font-black text-slate-950">{survey.title}</h1><p className="mt-3 leading-7 text-slate-500">{survey.description || "Share your honest opinion and help improve products and services."}</p>{searchParams.error&&<p role="alert" className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{decodeURIComponent(searchParams.error)}</p>}<div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4"><ClipboardList className="h-5 w-5 text-forest"/><p className="mt-2 text-xl font-black">{count ?? 0}</p><p className="text-xs text-slate-500">Questions</p></div><div className="rounded-xl bg-slate-50 p-4"><Clock className="h-5 w-5 text-forest"/><p className="mt-2 text-xl font-black">~{Math.max(2,Math.ceil((count ?? 0)*0.5))} min</p><p className="text-xs text-slate-500">Estimated time</p></div></div><div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-50 p-4"><span className="font-semibold text-forest">Your reward</span><span className="text-xl font-black text-forest">{survey.reward_rwf.toLocaleString()} RWF</span></div>{existing ? <Link href={`/surveys/${survey.id}/take/${existing.id}`} className="mt-6 block w-full rounded-xl bg-forest px-5 py-3.5 text-center font-bold text-white">Continue survey</Link> : <form action={startSurvey.bind(null,survey.id)} className="mt-6"><button className="w-full rounded-xl bg-forest px-5 py-3.5 font-bold text-white">Start survey</button></form>}<p className="mt-3 text-center text-xs text-slate-400">One response per account. Complete all required questions to receive your reward.</p></section></div></main>;
}