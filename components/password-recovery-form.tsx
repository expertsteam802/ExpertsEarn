"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PasswordRecoveryForm({ mode }: { mode: "request" | "update" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const result = mode === "request"
      ? await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: "https://expertsearn.mywire.org/reset-password" })
      : await supabase.auth.updateUser({ password });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (mode === "request") setMessage("If an account exists for that email, a password reset link will arrive shortly.");
    else {
      setMessage("Your password has been updated. You can now sign in.");
      router.refresh();
    }
  }

  return <form onSubmit={submit} className="mt-6 space-y-4">
    {mode === "request" ? (
      <label className="block text-sm font-semibold text-slate-700">Email address
        <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="you@example.com"/>
      </label>
    ) : (
      <label className="block text-sm font-semibold text-slate-700">New password
        <input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="At least 8 characters"/>
      </label>
    )}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    <button disabled={busy} className="w-full rounded-xl bg-forest px-5 py-3.5 font-bold text-white disabled:opacity-60">{busy ? "Please wait…" : mode === "request" ? "Send reset link" : "Update password"}</button>
    <p className="text-center text-sm text-slate-500"><Link href="/login" className="font-bold text-forest">Back to login</Link></p>
  </form>;
}
