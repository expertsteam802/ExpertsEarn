import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {PartnerApiKey} from "@/components/partner-api-key";
import {PartnerSurveyBuilder} from "@/components/partner-survey-builder";
export default async function PartnerDashboard({searchParams}:{searchParams:{error?:string;created?:string}}){
 const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:account}=await supabase.from("partner_accounts").select("*").eq("user_id",user.id).maybeSingle();
 if(!account)redirect("/partners/apply");
 const {data:surveys}=await supabase.from("surveys").select("id,title,status,response_count,response_limit,created_at").eq("partner_id",user.id).order("created_at",{ascending:false});
 const messages:Record<string,string>={partner_not_approved:"Your partner account must be approved first.",invalid_questions_json:"The questions JSON is invalid. Check the format and try again.",invalid_survey_details:"Check the survey title, audience, response limit, reward and price.",survey_create_failed:"The survey draft could not be created.",survey_questions_failed:"The survey questions could not be saved. Please retry."};
 return <main className="min-h-screen py-9"><div className="container max-w-4xl"><Link href="/partners" className="text-sm font-bold text-forest">← Partner information</Link>
 <div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wider text-amber-600">Partner workspace</p><h1 className="mt-1 text-3xl font-black text-slate-950">{account.company_name}</h1><p className="mt-2 text-sm text-slate-500">Manage research projects, build surveys and developer access.</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${account.is_approved?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-800"}`}>{account.is_approved?"Approved":"Under review"}</span></div>
 {searchParams.error&&<p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{messages[searchParams.error]||"Something went wrong. Check your survey details and try again."}</p>}
 {searchParams.created&&<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Your survey draft was created and is awaiting platform review.</p>}
 {!account.is_approved&&<div className="surface mt-6 p-5 text-sm leading-6 text-slate-600">Your application is waiting for review. Survey publishing and API access unlock after approval.</div>}
 {account.is_approved&&<><PartnerSurveyBuilder/><PartnerApiKey/></>}
 <h2 className="mt-9 text-xl font-black text-slate-950">Your surveys</h2><div className="surface mt-4 divide-y divide-slate-100">{(surveys??[]).map(s=><div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-bold text-slate-900">{s.title}</p><p className="mt-1 text-xs text-slate-500">{s.response_count} responses {s.response_limit?" / "+s.response_limit:""} · {new Date(s.created_at).toLocaleDateString()}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{s.status}</span></div>)}{(!surveys||surveys.length===0)&&<p className="p-6 text-sm text-slate-500">No surveys created yet. Use the survey builder above or developer API after approval.</p>}</div>
 <p className="mt-5 text-sm text-slate-500">API documentation: <Link href="/docs/partner-api" className="font-bold text-forest">Partner API guide</Link></p></div></main>;
}
