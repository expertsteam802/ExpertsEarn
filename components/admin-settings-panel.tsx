"use client";
import {useState} from "react";
import {updatePlatformSetting} from "@/app/admin/actions";

type Setting={key:string;value:any;updated_at:string};
const groups=[
 {key:"daily_survey_cap",label:"Survey limits"},
 {key:"minimum_payout_rwf",label:"Payout rules"},
 {key:"revenue_splits",label:"Revenue shares"},
 {key:"survey_pricing_usd",label:"Partner pricing"},
 {key:"usd_to_rwf_rate",label:"Currency rate"},
 {key:"supported_languages",label:"Languages"},
 {key:"public_branding",label:"Branding"},
 {key:"location_cpm_rates",label:"Location CPM"}
];
export function AdminSettingsPanel({settings}:{settings:Setting[]}){
 const [active,setActive]=useState(groups[0].key);
 const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(settings.map(s=>[s.key,JSON.stringify(s.value,null,2)])));
 const [splits,setSplits]=useState(()=>{const v=settings.find(s=>s.key==="revenue_splits")?.value?.partner||{};return {owner:Number(v.owner??40),respondent:Number(v.respondent??42),reserve:Number(v.reserve??18)}});
 const [pricing,setPricing]=useState(()=>{const v=settings.find(s=>s.key==="survey_pricing_usd")?.value||{};return {min:Number(v.min??0.2),max:Number(v.max??0.5)}});
 const [rate,setRate]=useState(()=>String(settings.find(s=>s.key==="usd_to_rwf_rate")?.value??""));
 const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");
 const current=settings.find(s=>s.key===active);
 const total=splits.owner+splits.respondent+splits.reserve;
 async function saveValue(key:string,value:unknown){
  setBusy(true);setNotice("");
  const form=new FormData();form.set("key",key);form.set("value",JSON.stringify(value));
  try{const result=await updatePlatformSetting(form);setNotice(result?.ok?"Saved successfully.":result?.error||"Could not save this setting.");}
  catch(e:any){setNotice(e?.message||"Could not save this setting.");}
  finally{setBusy(false);}
 }
 async function save(){
  if(active==="revenue_splits"){await saveValue(active,{...(settings.find(s=>s.key===active)?.value||{}),partner:splits});return;}
  if(active==="survey_pricing_usd"){await saveValue(active,pricing);return;}
  if(active==="usd_to_rwf_rate"){await saveValue(active,Number(rate));return;}
  if(!current)return;
  let value:unknown;try{value=JSON.parse(values[active]||"");}catch{setNotice("The value is not valid. Please check it.");return;}
  await saveValue(active,value);
 }
 return <section className="pt-8"><p className="eyebrow">Platform configuration</p><h2 className="mt-2 text-xl font-bold">Settings studio</h2><p className="mt-2 text-sm text-[#969198]">Change platform money rules with simple fields. No code or JSON editing is needed for revenue shares, partner prices or currency conversion.</p>
  <nav className="mt-4 flex flex-wrap gap-1.5">{groups.map(g=><button type="button" key={g.key} onClick={()=>{setActive(g.key);setNotice("");}} className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${active===g.key?"border-[#c6a873]/50 bg-[#c6a873]/10 text-[#e2cda6]":"border-white/10 text-[#aaa6a2] hover:border-white/25"}`}>{g.label}</button>)}</nav>
  <div className="surface mt-3 p-4">
   {active==="revenue_splits"&&<><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-[#eee7dc]">Partner survey revenue allocation</p><p className="mt-1 text-xs text-[#969198]">These percentages are applied to the configured partner API response price.</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${total===100?"bg-[#c6a873]/15 text-[#e2cda6]":"bg-rose-500/10 text-rose-200"}`}>{total}% allocated</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{([["owner","Platform share"],["respondent","Respondent pool"],["reserve","Reserve"]] as const).map(([key,label])=><label key={key} className="block text-xs font-semibold text-[#aaa6a2]">{label}<div className="mt-2 flex items-center gap-2"><input type="number" min="0" max="100" value={splits[key]} onChange={e=>setSplits(v=>({...v,[key]:Number(e.target.value)}))} className="w-full rounded-xl border border-white/10 bg-[#0c0d13] px-3 py-3 text-base text-white"/><span>%</span></div></label>)}</div><p className="mt-4 text-xs text-[#969198]">All three values must total exactly 100%. Respondent wallet credits still use the reward assigned to each survey.</p></>}
   {active==="survey_pricing_usd"&&<><p className="font-bold text-[#eee7dc]">Partner API price per completed response</p><p className="mt-1 text-xs text-[#969198]">Set the allowed minimum and maximum price partners can choose for each completed survey response.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-[#aaa6a2]">Minimum price (USD)<input type="number" min="0.01" step="0.01" value={pricing.min} onChange={e=>setPricing(v=>({...v,min:Number(e.target.value)}))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0d13] px-3 py-3 text-base text-white"/></label><label className="text-xs font-semibold text-[#aaa6a2]">Maximum price (USD)<input type="number" min="0.01" step="0.01" value={pricing.max} onChange={e=>setPricing(v=>({...v,max:Number(e.target.value)}))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0d13] px-3 py-3 text-base text-white"/></label></div></>}
   {active==="usd_to_rwf_rate"&&<><p className="font-bold text-[#eee7dc]">USD to RWF conversion</p><p className="mt-1 text-xs leading-6 text-[#969198]">Enter the exchange rate used for internal estimates and profit reporting. Update it when your accounting rate changes; this is not a live bank quote.</p><label className="mt-5 block text-xs font-semibold text-[#aaa6a2]">RWF for 1 USD<input type="number" min="1" step="1" value={rate} onChange={e=>setRate(e.target.value)} placeholder="Example: 1450" className="mt-2 w-full max-w-sm rounded-xl border border-white/10 bg-[#0c0d13] px-3 py-3 text-base text-white"/></label></>}
   {active==="location_cpm_rates"&&<p className="mb-4 rounded-xl border border-[#c6a873]/20 bg-[#c6a873]/5 p-3 text-xs leading-6 text-[#d4c6ad]">CPM values are planning floors, not live AdSense rates. Respondent rewards remain separate from ad views and clicks.</p>}
   {!["revenue_splits","survey_pricing_usd","usd_to_rwf_rate"].includes(active)&&<><div className="flex items-center justify-between gap-3"><p className="font-bold capitalize text-[#eee7dc]">{active.replace(/_/g," ")}</p>{current&&<span className="text-[10px] text-[#77747a]">Last updated {new Date(current.updated_at).toLocaleDateString()}</span>}</div>{current?<textarea aria-label={active+" setting value"} rows={typeof current.value==="object"?7:2} value={values[active]||""} onChange={e=>setValues(old=>({...old,[active]:e.target.value}))} className="mt-4 w-full rounded-xl border border-white/10 bg-[#0c0d13] p-3 font-mono text-xs leading-5"/>:<p className="mt-3 text-sm text-[#aaa6a2]">No value has been configured for this setting yet.</p>}</>}
   <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" disabled={busy||(active==="revenue_splits"&&total!==100)} onClick={save} className="rounded-lg border border-[#c6a873]/35 px-4 py-2 text-xs font-bold text-[#d5bd91] disabled:opacity-50">{busy?"Saving…":"Save changes"}</button>{notice&&<span role="status" className="text-xs text-[#d5bd91]">{notice}</span>}</div>
  </div>
 </section>;
}
