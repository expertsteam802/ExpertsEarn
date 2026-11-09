"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { completeSurvey } from "@/app/surveys/actions";

type Question = { id:string; position:number; required:boolean; prompt_override:string|null; question_type_override:string|null; options_override:any; question_bank:{prompt:string;question_type:string;options:any}|null };
export function SurveyRunner({ surveyId,responseId,questions }: { surveyId:string; responseId:string; questions:Question[] }) {
 const [answers,setAnswers]=useState<Record<string,any>>({});
 const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 const supabase=createClient(); const router=useRouter();
 const setAnswer=(id:string,value:any)=>setAnswers(prev=>({...prev,[id]:value}));
 async function submit(){
   setBusy(true);setError("");
   for(const q of questions){
     if(q.required && (answers[q.id]===undefined || answers[q.id]==="" || (Array.isArray(answers[q.id]) && answers[q.id].length===0))){setError("Please answer every required question.");setBusy(false);return;}
   }
   for(const q of questions){
     if(answers[q.id]===undefined) continue;
     const {error:e}=await supabase.from("response_answers").upsert({response_id:responseId,survey_question_id:q.id,answer:answers[q.id]},{onConflict:"response_id,survey_question_id"});
     if(e){setError(e.message);setBusy(false);return;}
   }
   try { await completeSurvey(responseId); } catch(e:any) { setError(e.message || "Could not submit your survey.");setBusy(false); }
 }
 return <div className="space-y-4">{questions.map((q,i)=>{
   const prompt=q.prompt_override || q.question_bank?.prompt || "Survey question";
   const type=q.question_type_override || q.question_bank?.question_type || "text";
   const opts=q.options_override || q.question_bank?.options || [];
   return <section key={q.id} className="surface p-5"><p className="text-xs font-bold uppercase tracking-wider text-amber-600">Question {i+1} of {questions.length}</p><h2 className="mt-2 font-bold leading-7 text-slate-900">{prompt}{q.required && <span className="text-rose-500"> *</span>}</h2>
   {type==="single_choice" || type==="yes_no" ? <div className="mt-4 space-y-2">{(type==="yes_no"?["Yes","No"]:opts).map((o:any)=>{const val=typeof o==="string"?o:o.value;const label=typeof o==="string"?o:o.label;return <label key={val} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm"><input type="radio" name={q.id} checked={answers[q.id]===val} onChange={()=>setAnswer(q.id,val)}/>{label}</label>})}</div>
   : type==="multiple_choice" ? <div className="mt-4 space-y-2">{opts.map((o:any)=>{const val=typeof o==="string"?o:o.value;const label=typeof o==="string"?o:o.label;const checked=(answers[q.id]||[]).includes(val);return <label key={val} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" checked={checked} onChange={e=>setAnswer(q.id,e.target.checked?[...(answers[q.id]||[]),val]:(answers[q.id]||[]).filter((x:string)=>x!==val))}/>{label}</label>})}</div>
   : type==="rating" ? <div className="mt-4 flex gap-2">{[1,2,3,4,5].map(n=><button type="button" key={n} onClick={()=>setAnswer(q.id,n)} className={`h-11 w-11 rounded-xl border font-bold ${answers[q.id]===n?"border-forest bg-forest text-white":"border-slate-200"}`}>{n}</button>)}</div>
   : <textarea value={answers[q.id]??""} onChange={e=>setAnswer(q.id,e.target.value)} rows={type==="text"?3:1} className="mt-4 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-forest" placeholder="Your answer…"/>}
   </section>;
 })}
 {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
 <button disabled={busy} onClick={submit} className="w-full rounded-xl bg-forest px-5 py-4 font-bold text-white disabled:opacity-60">{busy?"Submitting…":"Submit answers"}</button>
 </div>;
}