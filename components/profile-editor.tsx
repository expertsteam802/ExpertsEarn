"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, ShieldCheck, Upload, Phone, Save } from "lucide-react";

type Submission = { id: string; status: string; submitted_at: string; admin_note: string | null } | null;
type Props = {
  profile: {
    display_name: string | null;
    phone_e164: string | null;
    phone_verified_at: string | null;
    country_code: string;
    preferred_language: "en" | "rw" | "fr";
    date_of_birth: string | null;
    gender: string | null;
    identity_verified_at: string | null;
  };
  submission: Submission;
};

export function ProfileEditor({ profile, submission }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState(profile.display_name || "");
  const [country, setCountry] = useState(profile.country_code || "RW");
  const [language, setLanguage] = useState(profile.preferred_language || "en");
  const [dob, setDob] = useState(profile.date_of_birth || "");
  const [gender, setGender] = useState(profile.gender || "");
  const [phone, setPhone] = useState(profile.phone_e164 || "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy("profile"); setMessage(""); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in again."); setBusy(""); return; }
    const { error: updateError } = await supabase.from("profiles").update({
      display_name: name.trim(),
      country_code: country.trim().toUpperCase(),
      preferred_language: language,
      date_of_birth: dob || null,
      gender: gender || null,
      updated_at: new Date().toISOString()
    }).eq("id", user.id);
    setBusy("");
    if (updateError) { setError(updateError.message); return; }
    setMessage("Profile saved.");
    router.refresh();
  }

  async function sendPhoneCode() {
    setBusy("phone"); setMessage(""); setError("");
    const normalized = phone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      setError("Enter your phone number in international format, for example +2507XXXXXXXX.");
      setBusy(""); return;
    }
    const { error: phoneError } = await supabase.auth.updateUser({ phone: normalized });
    setBusy("");
    if (phoneError) { setError(phoneError.message); return; }
    setOtpSent(true);
    setMessage("Verification code sent. Enter the SMS code to confirm this number.");
  }

  async function verifyPhoneCode() {
    setBusy("verify"); setMessage(""); setError("");
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: otp.trim(),
      type: "phone_change"
    });
    setBusy("");
    if (verifyError) { setError(verifyError.message); return; }
    setOtpSent(false); setOtp("");
    setMessage("Phone number verified.");
    router.refresh();
  }

  async function uploadIdentity(e: React.FormEvent) {
    e.preventDefault();
    setBusy("identity"); setMessage(""); setError("");
    if (!file) { setError("Choose a passport, national ID, or other accepted identity document."); setBusy(""); return; }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError("Use a JPG, PNG, or PDF file up to 10 MB."); setBusy(""); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in again."); setBusy(""); return; }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = user.id + "/" + Date.now() + "-" + safeName;
    const { error: uploadError } = await supabase.storage.from("identity-documents").upload(path, file, {
      contentType: file.type,
      upsert: false
    });
    if (uploadError) { setError(uploadError.message); setBusy(""); return; }
    const { error: insertError } = await supabase.from("identity_verification_submissions").insert({
      user_id: user.id,
      object_path: path,
      status: "pending"
    });
    if (insertError) {
      await supabase.storage.from("identity-documents").remove([path]);
      setError(insertError.message); setBusy(""); return;
    }
    setFile(null); setBusy("");
    setMessage("Identity document submitted securely. An administrator must review it before payouts are enabled.");
    router.refresh();
  }

  return <div className="mt-7 space-y-6">
    <form onSubmit={saveProfile} className="surface space-y-4 p-6">
      <h2 className="text-lg font-black text-slate-950">Personal details</h2>
      <label className="block text-sm font-semibold">Full name
        <input required minLength={2} value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3"/>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Country code
          <input required maxLength={2} value={country} onChange={e=>setCountry(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3" placeholder="RW"/>
        </label>
        <label className="block text-sm font-semibold">Preferred language
          <select value={language} onChange={e=>setLanguage(e.target.value as "en"|"rw"|"fr")} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3">
            <option value="en">English</option><option value="rw">Kinyarwanda</option><option value="fr">Français</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">Date of birth
          <input type="date" value={dob} onChange={e=>setDob(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3"/>
        </label>
        <label className="block text-sm font-semibold">Gender
          <select value={gender} onChange={e=>setGender(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3">
            <option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </label>
      </div>
      <button disabled={busy!==""} className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 font-bold text-white disabled:opacity-60"><Save className="h-4 w-4"/> {busy==="profile"?"Saving…":"Save profile"}</button>
    </form>

    <section className="surface p-6">
      <div className="flex items-center gap-2"><Phone className="h-5 w-5 text-forest"/><h2 className="text-lg font-black text-slate-950">Phone verification</h2></div>
      <p className="mt-2 text-sm text-slate-500">One verified phone number per account. Use international format with country code.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+2507XXXXXXXX" className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3"/>
        <button type="button" disabled={busy!==""} onClick={sendPhoneCode} className="rounded-xl border border-forest px-4 py-3 text-sm font-bold text-forest">{busy==="phone"?"Sending…":"Send SMS code"}</button>
      </div>
      {otpSent&&<div className="mt-3 flex flex-col gap-3 sm:flex-row"><input value={otp} onChange={e=>setOtp(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="SMS verification code" className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3"/><button type="button" disabled={busy!==""||!otp.trim()} onClick={verifyPhoneCode} className="rounded-xl bg-forest px-4 py-3 text-sm font-bold text-white">{busy==="verify"?"Verifying…":"Verify number"}</button></div>}
      <p className="mt-3 text-xs text-slate-400">{profile.phone_verified_at ? "Verified phone: " + (profile.phone_e164 || "confirmed") : "Not verified yet. SMS delivery requires a phone provider configured in Supabase Auth."}</p>
    </section>

    <section className="surface p-6">
      <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-forest"/><h2 className="text-lg font-black text-slate-950">Identity verification</h2></div>
      {profile.identity_verified_at ? <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4"/> Identity verified. Payouts are enabled.</p>
      : submission?.status === "pending" ? <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">Your document is securely submitted and awaiting review.</p>
      : <form onSubmit={uploadIdentity} className="mt-4 space-y-3">
          <p className="text-sm text-slate-500">Upload a clear national ID, passport, or accepted identity document. Only you and authorized administrators can access this private file.</p>
          <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} className="block w-full text-sm"/>
          <button disabled={busy!==""} className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><Upload className="h-4 w-4"/> {busy==="identity"?"Uploading…":"Submit identity document"}</button>
        </form>}
      {submission?.status === "rejected" && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Your previous document was not approved. {submission.admin_note || "Please upload a clearer document."}</p>}
    </section>

    {(message||error)&&<p role="status" className={error?"rounded-xl bg-rose-50 p-3 text-sm text-rose-700":"rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"}>{error||message}</p>}
  </div>;
}
