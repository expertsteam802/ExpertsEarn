import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, Wallet } from "lucide-react";

export default async function CompletePage({ searchParams }: { searchParams: Promise<{ response?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const responseId = query.response || "";
  if (!responseId) notFound();
  const [{ data: response }, { data: rewardTx }] = await Promise.all([supabase
    .from("survey_responses")
    .select("id,status,reward_rwf")
    .eq("id", responseId)
    .eq("respondent_id", user.id)
    .eq("status", "submitted")
    .maybeSingle(),
    supabase.from("wallet_transactions").select("amount_ec,amount_rwf").eq("user_id",user.id).eq("reference_id",responseId).eq("transaction_type","survey_reward").maybeSingle()
  ]);
  if (!response) notFound();
  const reward = Math.max(0, Number(rewardTx?.amount_ec ?? response.reward_rwf ?? 0));
  const cashValue = Math.max(0, Number(rewardTx?.amount_rwf ?? response.reward_rwf ?? 0));

  return <main className="grid min-h-screen place-items-center px-5">
    <div className="surface w-full max-w-md p-9 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600"/>
      <h1 className="mt-5 text-2xl font-black text-slate-950">Survey completed!</h1>
      <p className="mt-2 text-slate-500">Thank you for sharing your opinion.</p>
      <div className="my-7 rounded-2xl bg-emerald-50 p-5">
        <p className="text-sm font-semibold text-forest">Verified ExpertsCoins added to your wallet</p>
        <p className="mt-1 text-3xl font-black text-forest">+{reward.toLocaleString(undefined,{maximumFractionDigits:2})} EC</p>
      <p className="mt-2 text-xs text-emerald-700">Protected cash value: {cashValue.toLocaleString()} RWF</p>
      </div>
      <Link href="/wallet" className="block rounded-xl bg-forest px-5 py-3 font-bold text-white"><Wallet className="mr-2 inline h-4 w-4"/> View wallet</Link>
      <Link href="/dashboard" className="mt-4 block text-sm font-bold text-forest">Back to dashboard</Link>
    </div>
  </main>;
}
