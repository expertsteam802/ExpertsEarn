"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, ShieldCheck, Upload, Save } from "lucide-react";

type Submission = { id: string; status: string; submitted_at: string; admin_note: string | null } | null;
type Props = {
  profile: {
    display_name: string | null; avatar_url: string | null; phone_e164: string | null; phone_verified_at: string | null;
    country_code: string; preferred_language: "en" | "rw" | "fr"; date_of_birth: string | null;
    gender: string | null; identity_verified_at: string | null; province: string | null;
    district: string | null; sector: string | null; cell: string | null; village: string | null;
    region: string | null; city: string | null;
  };
  submission: Submission;
};

export function ProfileEditor({ profile, submission }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [geoRows, setGeoRows] = useState<{admin_level_1:string|null;admin_level_2:string|null;admin_level_3:string|null}[]>([]);
  const router = useRouter();
  const [name, setName] = useState(profile.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [country, setCountry] = useState(profile.country_code || "RW");
  const [language, setLanguage] = useState(profile.preferred_language || "en");
  const [dob, setDob] = useState(profile.date_of_birth || "");
  const [gender, setGender] = useState(profile.gender || "");
  const [province, setProvince] = useState(profile.province || "");
  const [district, setDistrict] = useState(profile.district || "");
  const [sector, setSector] = useState(profile.sector || "");
  const [cell, setCell] = useState(profile.cell || "");
  const [village, setVillage] = useState(profile.village || "");
  const provinces = Array.from(new Set(geoRows.map(row => row.admin_level_1).filter((value): value is string => !!value))).sort();
  const districts = Array.from(new Set(geoRows.filter(row => row.admin_level_1 === province).map(row => row.admin_level_2).filter((value): value is string => !!value))).sort();
  const sectors = Array.from(new Set(geoRows.filter(row => row.admin_level_1 === province && row.admin_level_2 === district).map(row => row.admin_level_3).filter((value): value is string => !!value))).sort();
  const [region, setRegion] = useState(profile.region || "");
  const [city, setCity] = useState(profile.city || "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadRwandaGeography() {
      const { data, error: geographyError } = await supabase.from("geography").select("admin_level_1,admin_level_2,admin_level_3").eq("country_code", "RW").not("admin_level_1", "is", null).limit(1000);
      if (active && !geographyError) setGeoRows(data || []);
    }
    void loadRwandaGeography();
    return () => { active = false; };
  }, [supabase]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setBusy("profile"); setMessage(""); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in again."); setBusy(""); return; }
    const payload: Record<string, string | null> = {
      display_name: name.trim(), country_code: country.trim().toUpperCase(), preferred_language: language,
      date_of_birth: dob || null, gender: gender || null,
      province: country.toUpperCase() === "RW" ? province.trim() || null : null,
      district: country.toUpperCase() === "RW" ? district.trim() || null : null,
      sector: country.toUpperCase() === "RW" ? sector.trim() || null : null,
      cell: country.toUpperCase() === "RW" ? cell.trim() || null : null,
      village: country.toUpperCase() === "RW" ? village.trim() || null : null,
      region: country.toUpperCase() !== "RW" ? region.trim() || null : null,
      city: country.toUpperCase() !== "RW" ? city.trim() || null : null,
      updated_at: new Date().toISOString()
    };
    const { error: updateError } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setBusy("");
    if (updateError) { setError(updateError.message); return; }
    setMessage("Profile saved."); router.refresh();
  }

  async function uploadAvatar(e: React.FormEvent) {
    e.preventDefault(); setBusy("avatar"); setMessage(""); setError("");
    if (!avatarFile) { setError("Choose a JPG, PNG or WebP image."); setBusy(""); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(avatarFile.type) || avatarFile.size > 5 * 1024 * 1024) {
      setError("Use a JPG, PNG or WebP image up to 5 MB."); setBusy(""); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in again."); setBusy(""); return; }
    const safeName = avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = user.id + "/" + Date.now() + "-" + safeName;
    const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(path, avatarFile, { contentType: avatarFile.type, upsert: false });
    if (uploadError) { setError(uploadError.message); setBusy(""); return; }
    const { data: publicData } = supabase.storage.from("profile-avatars").getPublicUrl(path);
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicData.publicUrl, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (updateError) { await supabase.storage.from("profile-avatars").remove([path]); setError(updateError.message); setBusy(""); return; }
    setAvatarUrl(publicData.publicUrl); setAvatarFile(null); setBusy(""); setMessage("Profile picture updated."); router.refresh();
  }

  async function uploadIdentity(e: React.FormEvent) {
    e.preventDefault(); setBusy("identity"); setMessage(""); setError("");
    if (!file) { setError("Choose an identity document."); setBusy(""); return; }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError("Use a JPG, PNG, or PDF file up to 10 MB."); setBusy(""); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in again."); setBusy(""); return; }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = user.id + "/" + Date.now() + "-" + safeName;
    const { error: uploadError } = await supabase.storage.from("identity-documents").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { setError(uploadError.message); setBusy(""); return; }
    const { error: insertError } = await supabase.from("identity_verification_submissions").insert({ user_id: user.id, object_path: path, status: "pending" });
    if (insertError) {
      await supabase.storage.from("identity-documents").remove([path]);
      setError(insertError.message); setBusy(""); return;
    }
    setFile(null); setBusy(""); setMessage("Identity document submitted securely and is awaiting admin review."); router.refresh();
  }

  return <div className="mt-7 space-y-6">
    <form onSubmit={saveProfile} className="surface space-y-4 p-6">
      <h2 className="text-lg font-black text-slate-950">Personal details</h2>
      <label className="block text-sm font-semibold">Full name<input required minLength={2} value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Country code<input required maxLength={2} value={country} onChange={e=>setCountry(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3" placeholder="RW"/></label>
        <label className="block text-sm font-semibold">Preferred language<select value={language} onChange={e=>setLanguage(e.target.value as "en"|"rw"|"fr")} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"><option value="en">English</option><option value="rw">Kinyarwanda</option><option value="fr">Français</option></select></label>
        <label className="block text-sm font-semibold">Date of birth<input type="date" value={dob} onChange={e=>setDob(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
        <label className="block text-sm font-semibold">Gender<select value={gender} onChange={e=>setGender(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
      </div>
      {country.toUpperCase() === "RW" ? <div className="rounded-xl border border-slate-100 p-4">
        <h3 className="font-bold text-slate-800">Rwanda location</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Province<select value={province} onChange={e=>{setProvince(e.target.value);setDistrict("");setSector("");setCell("");setVillage("");}} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"><option value="">Select province</option>{provinces.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
          <label className="block text-sm font-semibold">District<select value={district} onChange={e=>{setDistrict(e.target.value);setSector("");setCell("");setVillage("");}} disabled={!province} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 disabled:opacity-50"><option value="">Select district</option>{districts.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
          <label className="block text-sm font-semibold">Sector<select value={sector} onChange={e=>{setSector(e.target.value);setCell("");setVillage("");}} disabled={!district} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 disabled:opacity-50"><option value="">Select sector</option>{sectors.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
          <label className="block text-sm font-semibold">Cell<input value={cell} onChange={e=>setCell(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3" placeholder="Enter cell"/></label>
          <label className="block text-sm font-semibold">Village<input value={village} onChange={e=>setVillage(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3" placeholder="Enter village"/></label>
        </div>
        <p className="mt-2 text-xs text-slate-400">Province, district and sector choices use the CC-BY-4.0 Rwanda administrative reference. Cell and village names remain editable until the 2022 detailed reference is loaded.</p>
      </div> : <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Region / state<input value={region} onChange={e=>setRegion(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
        <label className="block text-sm font-semibold">City<input value={city} onChange={e=>setCity(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3"/></label>
      </div>}
      <button disabled={busy!==""} className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 font-bold text-white disabled:opacity-60"><Save className="h-4 w-4"/>{busy==="profile"?"Saving…":"Save profile"}</button>
    </form>

    <section className="surface p-6">
      <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-forest"/><h2 className="text-lg font-black text-slate-950">Identity verification</h2></div>
      {profile.identity_verified_at ? <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4"/> Identity verified. Payouts are enabled.</p>
      : submission?.status === "pending" ? <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">Your document is securely submitted and awaiting review.</p>
      : <form onSubmit={uploadIdentity} className="mt-4 space-y-3"><p className="text-sm text-slate-500">Upload a clear national ID, passport, or accepted identity document. Only you and authorized administrators can access this private file.</p><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} className="block w-full text-sm"/><button disabled={busy!==""} className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><Upload className="h-4 w-4"/>{busy==="identity"?"Uploading…":"Submit identity document"}</button></form>}
      {submission?.status === "rejected" && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Your previous document was not approved. {submission.admin_note || "Please upload a clearer document."}</p>}
    </section>

    {(message||error)&&<p role="status" className={error?"rounded-xl bg-rose-50 p-3 text-sm text-rose-700":"rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"}>{error||message}</p>}
  </div>;
}
