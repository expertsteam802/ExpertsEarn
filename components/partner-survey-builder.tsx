"use client";

import { useState } from "react";
import { createPartnerSurvey } from "@/app/partners/dashboard/actions";

const starter = [
  { prompt: "How satisfied are you with the service?", type: "rating", options: [], required: true },
  { prompt: "What would you improve?", type: "text", options: [], required: false }
];

export function PartnerSurveyBuilder({minPrice=0.2,maxPrice=0.5}:{minPrice?:number;maxPrice?:number}) {
  const [questions, setQuestions] = useState(JSON.stringify(starter, null, 2));
  return <section className="surface mt-7 p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Research builder</p><h2 className="mt-1 text-xl font-black text-slate-950">Create a survey</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Build a draft, set the audience and reward, then submit it for platform review before publishing.</p></div>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-forest">Draft first · reviewed before launch</span>
    </div>
    <form action={createPartnerSurvey} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold sm:col-span-2">Survey title<input name="title" required minLength={3} maxLength={140} placeholder="Customer experience study" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold sm:col-span-2">Description<textarea name="description" rows={2} maxLength={5000} placeholder="Tell respondents what this research is about." className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Language<select name="language" className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"><option value="en">English</option><option value="rw">Kinyarwanda</option><option value="fr">French</option></select></label>
      <label className="text-sm font-semibold">Reward per respondent (RWF)<input name="reward_rwf" type="number" min="0" max="100000" defaultValue="0" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Target completed responses<input name="response_limit" type="number" min="1" max="100000" defaultValue="100" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Price per completed response (USD)<input name="partner_price_usd" type="number" step="0.01" defaultValue={minPrice.toFixed(2)} min={minPrice} max={maxPrice} placeholder={`Allowed: ${minPrice.toFixed(2)}–${maxPrice.toFixed(2)}`} className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Target country code<input name="target_country" maxLength={2} placeholder="RW" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Target region / province<input name="target_region" maxLength={120} placeholder="Kigali City" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Target city / district<input name="target_city" maxLength={120} placeholder="Gasabo" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Target gender<select name="target_gender" defaultValue="" className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"><option value="">Any gender</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
      <label className="text-sm font-semibold">Rwanda province<input name="target_province" maxLength={120} placeholder="Kigali City" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Rwanda district<input name="target_district" maxLength={120} placeholder="Gasabo" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Rwanda sector<input name="target_sector" maxLength={120} placeholder="Kimihurura" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Rwanda cell<input name="target_cell" maxLength={120} className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Rwanda village<input name="target_village" maxLength={120} className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Minimum age<input name="min_age" type="number" min="13" max="100" placeholder="18" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold">Maximum age<input name="max_age" type="number" min="13" max="100" placeholder="65" className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <label className="text-sm font-semibold sm:col-span-2">Questions (JSON)<textarea name="questions_json" required value={questions} onChange={event => setQuestions(event.target.value)} rows={12} spellCheck={false} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs leading-5" /></label>
      <p className="text-xs leading-5 text-slate-500 sm:col-span-2">Each question needs a prompt and type: text, number, rating, yes_no, single_choice or multiple_choice. Choice questions use an options array. Up to 100 questions per survey.</p>
      <button className="min-h-12 rounded-xl bg-forest px-5 py-3 font-bold text-white sm:col-span-2">Create draft for review</button>
    </form>
  </section>;
}
