import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SurveyRunner } from "@/components/survey-runner";
export default async function TakeSurvey({params}:{params:Promise<{id:string;responseId:string}>}){
 const {id,responseId}=await params;
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:response}=await supabase.from("survey_responses").select("id,status,respondent_id").eq("id",responseId).eq("survey_id",id).maybeSingle();
 if(!response||response.respondent_id!==user.id||response.status!=="in_progress")notFound();
 const {data:survey}=await supabase.from("surveys").select("id,title").eq("id",id).maybeSingle();if(!survey)notFound();
 const {data:questions}=await supabase.from("survey_questions").select("id,position,required,prompt_override,question_type_override,options_override,question_bank(prompt,question_type,options)").eq("survey_id",id).order("position");
 return <main className="min-h-screen py-8"><div className="container max-w-2xl"><Link href="/dashboard" className="text-sm font-bold text-forest">← Exit survey</Link><h1 className="mt-4 text-2xl font-black text-slate-950">{survey.title}</h1><p className="mb-6 mt-2 text-sm text-slate-500">Take your time and answer honestly.</p><SurveyRunner surveyId={id} responseId={responseId} questions={(questions||[]) as any}/></div></main>;
}