import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Trophy } from "lucide-react";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_leaderboard");
  const rows = data || [];
  return <main className="min-h-screen py-10"><div className="container max-w-3xl">
    <Link href="/dashboard" className="text-sm font-bold text-forest">← Dashboard</Link>
    <div className="mt-6 flex items-center gap-3"><Trophy className="h-8 w-8 text-amber-500"/><div><p className="text-sm font-bold uppercase tracking-wider text-amber-600">Community rankings</p><h1 className="text-3xl font-black text-slate-950">Top earners</h1></div></div>
    <p className="mt-2 text-sm text-slate-500">Rankings show total confirmed survey earnings, not current wallet balances.</p>
    {error ? <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Leaderboard is temporarily unavailable.</p> : <div className="surface mt-6 divide-y divide-slate-100">
      {rows.map((row: any) => <div key={row.rank} className="flex items-center justify-between gap-4 p-4"><div className="flex items-center gap-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-sm font-black text-forest">#{row.rank}</span><span className="font-bold text-slate-800">{row.display_name}</span></div><span className="font-extrabold text-forest">{Number(row.lifetime_earned_rwf).toLocaleString()} RWF</span></div>)}
      {rows.length === 0 && <p className="p-7 text-center text-sm text-slate-500">The leaderboard will appear as respondents complete surveys.</p>}
    </div>}
  </div></main>;
}
