"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { completeSurvey } from "@/app/surveys/actions";

type Question = {
  id: string; position: number; required: boolean; prompt_override: string | null;
  question_type_override: string | null; options_override: any;
  question_bank: { prompt: string; question_type: string; options: any } | null;
};

export function SurveyRunner({ responseId, questions }: { surveyId: string; responseId: string; questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const supabase = createClient();
  const current = questions[step];
  const setAnswer = (id: string, value: any) => setAnswers((previous) => ({ ...previous, [id]: value }));

  async function submit() {
    setBusy(true); setError("");
    for (const question of questions) {
      const value = answers[question.id];
      if (question.required && (value === undefined || value === "" || (Array.isArray(value) && value.length === 0))) {
        setError("Please answer every required question.");
        setStep(questions.findIndex((item) => item.id === question.id));
        setBusy(false); return;
      }
    }
    for (const question of questions) {
      if (answers[question.id] === undefined) continue;
      const { error: saveError } = await supabase.from("response_answers").upsert({ response_id: responseId, survey_question_id: question.id, answer: answers[question.id] }, { onConflict: "response_id,survey_question_id" });
      if (saveError) { setError(saveError.message); setBusy(false); return; }
    }
    try { await completeSurvey(responseId); }
    catch (submitError: any) { setError(submitError.message || "Could not submit your survey."); setBusy(false); }
  }

  if (!questions.length) return <div className="surface p-6 text-sm text-slate-600">This survey has no questions yet. Please contact the survey publisher.</div>;
  const prompt = current.prompt_override || current.question_bank?.prompt || "Survey question";
  const type = current.question_type_override || current.question_bank?.question_type || "text";
  const options = current.options_override || current.question_bank?.options || [];
  const value = answers[current.id];

  return <div className="space-y-4">
    <section className="surface p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-amber-700"><span>Question {step + 1} of {questions.length}</span><span>{Math.round(((step + 1) / questions.length) * 100)}% complete</span></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-forest transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }}/></div>
      <h2 className="mt-6 text-lg font-bold leading-7 text-slate-900 sm:text-xl">{prompt}{current.required && <span className="text-rose-500"> *</span>}</h2>
      {type === "single_choice" || type === "yes_no" ? <div className="mt-5 space-y-3">{(type === "yes_no" ? ["Yes", "No"] : options).map((option: any) => { const optionValue = typeof option === "string" ? option : option.value; const label = typeof option === "string" ? option : option.label; return <label key={optionValue} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm hover:border-forest"><input type="radio" name={current.id} checked={value === optionValue} onChange={() => setAnswer(current.id, optionValue)}/>{label}</label>; })}</div>
      : type === "multiple_choice" ? <div className="mt-5 space-y-3">{options.map((option: any) => { const optionValue = typeof option === "string" ? option : option.value; const label = typeof option === "string" ? option : option.label; const selected = (value || []).includes(optionValue); return <label key={optionValue} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm hover:border-forest"><input type="checkbox" checked={selected} onChange={(event) => setAnswer(current.id, event.target.checked ? [...(value || []), optionValue] : (value || []).filter((item: string) => item !== optionValue))}/>{label}</label>; })}</div>
      : type === "rating" ? <div className="mt-5 flex flex-wrap gap-2">{[1,2,3,4,5].map((number) => <button type="button" key={number} aria-pressed={value === number} onClick={() => setAnswer(current.id, number)} className={`h-12 w-12 rounded-xl border font-bold ${value === number ? "border-forest bg-forest text-white" : "border-slate-200"}`}>{number}</button>)}</div>
      : type === "number" ? <input type="number" value={value ?? ""} onChange={(event) => setAnswer(current.id, event.target.value === "" ? "" : Number(event.target.value))} className="mt-5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-forest" placeholder="Enter a number"/>
      : <textarea value={value ?? ""} onChange={(event) => setAnswer(current.id, event.target.value)} rows={4} className="mt-5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-forest" placeholder="Your answer…"/>}
    </section>
    <p className="text-xs leading-5 text-slate-400">Advertisements may appear in standard site placements. Survey completion rewards are for your answers, never for ad views or clicks.</p>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="flex gap-3"><button type="button" disabled={busy || step === 0} onClick={() => { setError(""); setStep((currentStep) => currentStep - 1); }} className="min-h-12 rounded-xl border border-slate-200 px-5 font-bold text-slate-700 disabled:opacity-40">Previous</button>
      {step < questions.length - 1 ? <button type="button" disabled={busy} onClick={() => { if (current.required && (value === undefined || value === "" || (Array.isArray(value) && value.length === 0))) { setError("Please answer this required question."); return; } setError(""); setStep((currentStep) => currentStep + 1); }} className="min-h-12 flex-1 rounded-xl bg-forest px-5 font-bold text-white">Next question</button>
      : <button type="button" disabled={busy} onClick={submit} className="min-h-12 flex-1 rounded-xl bg-forest px-5 font-bold text-white disabled:opacity-60">{busy ? "Submitting…" : "Submit answers"}</button>}
    </div>
  </div>;
}
