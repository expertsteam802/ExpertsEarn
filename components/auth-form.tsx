"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode, referralCode = "" }: { mode: "login" | "signup"; referralCode?: string }) {
  const [email,setEmail] = useState(""); const [password,setPassword] = useState("");
  const [name,setName] = useState(""); const [error,setError] = useState(""); const [busy,setBusy] = useState(false); const [confirmationPending,setConfirmationPending]=useState(false);
  const router = useRouter(); const supabase = createClient();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: name, ...(referralCode ? { referral_code: referralCode } : {}) }, emailRedirectTo: `${window.location.origin}/auth/callback` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) {
      if (mode === "login" && result.error.code === "email_not_confirmed") {
        const resend = await supabase.auth.resend({ type: "signup", email: email.trim() });
        setBusy(false);
        setConfirmationPending(true);
        setError(resend.error
          ? "Your account still needs email confirmation. We couldn't send another link just now. Please try again shortly."
          : "Your account is not confirmed yet. We have sent a fresh confirmation link to your email. Open it, confirm your account, then log in again.");
        return;
      }
      setBusy(false);
      setError(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) { setBusy(false); setConfirmationPending(true); setError("Check your email to confirm your account, then log in."); return; }
    router.push("/welcome"); router.refresh();
  }
  async function resendConfirmation() {
    setBusy(true);
    const result = await supabase.auth.resend({ type: "signup", email });
    setBusy(false);
    setError(result.error ? result.error.message : "A new confirmation email has been requested. Check your inbox.");
  }
  return <form onSubmit={submit} className="space-y-4">
    {mode === "signup" && <label className="block text-sm font-semibold text-slate-700">Your name<input required value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-forest" placeholder="Full name"/></label>}
    <label className="block text-sm font-semibold text-slate-700">Email address<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-forest" placeholder="you@example.com"/></label>
    <label className="block text-sm font-semibold text-slate-700">Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-forest" placeholder="At least 8 characters"/></label>
    {error && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
    {confirmationPending && <button type="button" onClick={resendConfirmation} disabled={busy||!email} className="w-full rounded-xl border border-forest/20 px-4 py-2.5 text-sm font-bold text-forest disabled:opacity-50">{busy?"Sending…":"Resend confirmation email"}</button>}
    <button disabled={busy} className="w-full rounded-xl bg-forest px-5 py-3.5 font-bold text-white disabled:opacity-60">{busy ? "Please wait…" : mode === "signup" ? "Create free account" : "Log in"}</button>
    {mode === "login" && <p className="text-right text-sm"><Link className="font-bold text-forest" href="/forgot-password">Forgot password?</Link></p>}
    <p className="text-center text-sm text-slate-500">{mode === "signup" ? "Already have an account?" : "New to ExpertsEarn?"} <Link className="font-bold text-forest" href={mode === "signup" ? "/login" : "/signup"}>{mode === "signup" ? "Log in" : "Join free"}</Link></p>
  </form>;
}