import Link from "next/link";
export default function PartnerApiDocs(){return <main className="min-h-screen py-10"><div className="container max-w-3xl"><Link href="/partners/dashboard" className="text-sm font-bold text-forest">← Partner dashboard</Link><p className="mt-6 text-sm font-extrabold uppercase tracking-widest text-amber-600">Developer documentation</p><h1 className="mt-2 text-3xl font-black text-slate-950">ExpertsEarn Partner API</h1><p className="mt-3 leading-7 text-slate-500">Use the REST API to create surveys, check their status, and export completed responses.</p><div className="surface mt-7 p-6"><p className="text-sm font-bold text-slate-500">Base URL</p><code className="mt-2 block break-all rounded-lg bg-slate-950 p-3 text-sm text-emerald-300">https://YOUR-DEPLOYMENT/api/v1</code><p className="mt-5 text-sm font-bold text-slate-500">Authentication</p><p className="mt-2 text-sm leading-6 text-slate-600">Send your partner key in the <code>x-api-key</code> header. Keep it on your backend only. Never expose it in browser JavaScript.</p><pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-emerald-200">{`curl -H "x-api-key: YOUR_KEY" https://YOUR-DEPLOYMENT/api/v1/surveys`}</pre></div><h2 className="mt-9 text-xl font-black">Endpoints</h2><div className="surface mt-4 divide-y divide-slate-100">{[["GET","/surveys","List your surveys."],["POST","/surveys","Create a draft survey with 1–100 questions."],["GET","/surveys/{id}","Get survey status, targeting and response count."],["GET","/surveys/{id}/responses","Retrieve submitted response data as JSON."],["GET","/surveys/{id}/responses?format=csv","Download response data as CSV."]].map(([method,path,desc])=><div key={method+path} className="p-4"><div className="flex flex-wrap items-center gap-3"><span className="rounded bg-emerald-50 px-2 py-1 text-xs font-black text-forest">{method}</span><code className="text-sm font-bold text-slate-800">{path}</code></div><p className="mt-2 text-sm text-slate-500">{desc}</p></div>)}</div><h2 className="mt-9 text-xl font-black">Create survey body</h2><pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-5 text-xs leading-6 text-emerald-200">{`{
  "title": "Mobile banking experience",
  "description": "Tell us about your experience.",
  "language": "en",
  "target_country": "RW",
  "min_age": 18,
  "max_age": 45,
  "reward_rwf": 500,
  "partner_price_usd": 0.35,
  "response_limit": 250,
  "questions": [
    { "prompt": "Which mobile money service do you use?", "type": "single_choice", "options": ["MTN", "Airtel", "Other"] },
    { "prompt": "How satisfied are you?", "type": "rating" }
  ]
}`}</pre><p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">New surveys are saved as drafts and require platform review before respondents can access them. Partner API keys are displayed once when generated.</p></div></main>;}