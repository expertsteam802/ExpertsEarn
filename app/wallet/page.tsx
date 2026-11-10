import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wallet as WalletIcon, ArrowLeft } from "lucide-react";

export default async function WalletPage({ searchParams }: { searchParams: Promise<{ payout?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: wallet }, { data: tx }] = await Promise.all([
    supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("wallet_transactions").select("id,amount_rwf,transaction_type,description,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30)
  ]);

  return <main className="min-h-screen py-9"><div className="container max-w-3xl">
    <Link href="/dashboard" className="text-sm font-bold text-forest"><ArrowLeft className="mr-1 inline h-4 w-4"/> Dashboard</Link>
    {query.payout === "requested" && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Your payout request was submitted. It is awaiting administrator processing; funds have not yet been sent.</p>}
    <div className="mt-5 rounded-2xl bg-forest p-7 text-white">
      <WalletIcon className="h-6 w-6 text-amber-300"/>
      <p className="mt-4 text-sm text-emerald-100">Available balance</p>
      <p className="mt-1 text-4xl font-black">{(wallet?.balance_rwf ?? 0).toLocaleString()} <span className="text-lg">RWF</span></p>
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
        <div><p className="text-xs text-emerald-100">Lifetime earned</p><p className="mt-1 font-bold">{(wallet?.lifetime_earned_rwf ?? 0).toLocaleString()} RWF</p></div>
        <div><p className="text-xs text-emerald-100">Lifetime paid</p><p className="mt-1 font-bold">{(wallet?.lifetime_paid_rwf ?? 0).toLocaleString()} RWF</p></div>
      </div>
    </div>
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-black text-slate-950">Transaction history</h1><Link href="/wallet/payout" className="rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white">Request payout</Link></div>
    <div className="surface mt-4 divide-y divide-slate-100">
      {(tx ?? []).map(t => <div key={t.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-bold text-slate-800">{t.description || t.transaction_type}</p><p className="mt-1 text-xs text-slate-400">{new Date(t.created_at).toLocaleString()}</p></div><span className={t.amount_rwf >= 0 ? "font-extrabold text-emerald-700" : "font-extrabold text-rose-600"}>{t.amount_rwf > 0 ? "+" : ""}{t.amount_rwf.toLocaleString()} RWF</span></div>)}
      {(!tx || tx.length === 0) && <p className="p-6 text-sm text-slate-500">Your completed survey rewards will appear here.</p>}
    </div>
    <p className="mt-5 text-xs text-slate-400">Payout requests are reviewed and processed by an administrator. A request does not mean funds have already been transferred.</p>
  </div></main>;
}
