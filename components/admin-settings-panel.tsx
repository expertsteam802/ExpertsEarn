"use client";
import {useState} from "react";
import {updatePlatformSetting} from "@/app/admin/actions";

type Setting={key:string;value:any;updated_at:string};
const groups=[
 {key:"daily_survey_cap",label:"Survey limits"},
 {key:"minimum_payout_rwf",label:"Payout rules"},
 {key:"revenue_splits",label:"Revenue split"},
 {key:"survey_pricing_usd",label:"Partner pricing"},
 {key:"supported_languages",label:"Languages"},
 {key:"public_branding",label:"Branding"},
 {key:"location_cpm_rates",label:"Location CPM floors"}
];
export function AdminSettingsPanel({settings}:{settings:Setting[]}){
 const [active,setActive]=useState(groups[0].key);
 const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(settings.map(s=>[s.key,JSON.stringify(s.value,null,2)])));
 const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");
 const current=settings.find(s=>s.key===active);
 async function save(){
  if(!current)return;setBusy(true);setNotice("");
  const form=new FormData();form.set("key",active);form.set("value",values[active]||"");
  try{const result=await updatePlatformSetting(form);setNotice(result?.ok?"Saved instantly.":result?.error||"Could not save this setting.");}
  catch(e:any){setNotice(e?.message||"Could not save this setting.");}
  finally{setBusy(false);}
 }
 return <section className="pt-12"><p className="eyebrow">Platform configuration</p><h2 className="mt-2 text-xl font-bold">Settings studio</h2><p className="mt-2 text-sm text-[#969198]">Switch settings panels instantly. Saving updates this panel without a full page reload. Location CPM floors are publisher-side estimates only; they do not pay respondents for ad views or clicks.</p>
  <nav className="mt-5 flex flex-wrap gap-2">{groups.map(g=><button type="button" key={g.key} onClick={()=>{setActive(g.key);setNotice("");}} className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${active===g.key?"border-[#c6a873]/50 bg-[#c6a873]/10 text-[#e2cda6]":"border-white/10 text-[#aaa6a2] hover:border-white/25"}`}>{g.label}</button>)}</nav>
  <div className="surface mt-4 p-5">{current?<><div className="flex items-center justify-between gap-3"><p className="font-bold capitalize text-[#eee7dc]">{active.replace(/_/g," ")}</p><span className="text-[10px] text-[#77747a]">Last updated {new Date(current.updated_at).toLocaleDateString()}</span></div><textarea aria-label={active+" setting value"} rows={typeof current.value==="object"?7:2} value={values[active]||""} onChange={e=>setValues(old=>({...old,[active]:e.target.value}))} className="mt-4 w-full rounded-xl border border-white/10 bg-[#0c0d13] p-3 font-mono text-xs leading-5"/><div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={save} className="rounded-lg border border-[#c6a873]/35 px-4 py-2 text-xs font-bold text-[#d5bd91] disabled:opacity-50">{busy?"Saving…":"Save setting"}</button>{notice&&<span role="status" className="text-xs text-[#d5bd91]">{notice}</span>}</div></>:<p className="text-sm text-[#aaa6a2]">No value has been configured for this setting yet.</p>}</div>
 </section>;
}
