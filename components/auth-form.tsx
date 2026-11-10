"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email,setEmail] = useState(""); const [password,setPassword] = useState("");
  const [name,setName] = useState(""); const [error,setError] = useState(""); const [busy,setBusy] = useState(false);
  const router = useRouter(); const supabase = createClient();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    if (mode === "signup" && !result.data.session) { setError("Check your email to confirm your account, then log in."); return; }
    router.push(mode === "login" ? "/dashboard" : "/welcome"); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-4">
    {mode === "signup" && <label className="block text-sm font-semibold text-slate-700">Your name<input required value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-forest" placeholder="Full name"/></label>}
    <label className="block text-sm font-semibold text-slate-700">Email address<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-forest" placeholder="you@example.com"/></label>
    <label className="block text-sm font-semibold text-slate-700">Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-forest" placeholder="At least 8 characters"/></label>
    {error && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
    <button disabled={busy} className="w-full rounded-xl bg-forest px-5 py-3.5 font-bold text-white disabled:opacity-60">{busy ? "Please wait…" : mode === "signup" ? "Create free account" : "Log in"}</button>
    <p className="text-center text-sm text-slate-500">{mode === "signup" ? "Already have an account?" : "New to ExpertsEarn?"} <Link className="font-bold text-forest" href={mode === "signup" ? "/login" : "/signup"}>{mode === "signup" ? "Log in" : "Join free"}</Link></p>
  </form>;
}