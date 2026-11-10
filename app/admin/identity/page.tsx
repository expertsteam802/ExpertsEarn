import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reviewIdentity } from "./actions";

export default async function IdentityReviewPage({ searchParams }: { searchParams: { error?: string; updated?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: submissions } = await supabase.from("identity_verification_submissions")
    .select("id,user_id,object_path,status,admin_note,submitted_at,profiles(display_name)")
    .order("submitted_at", { ascending: false }).limit(100);

  const items = await Promise.all((submissions || []).map(async (item: any) => {
    const { data } = await supabase.storage.from("identity-documents").createSignedUrl(item.object_path, 900);
    return { ...item, signedUrl: data?.signedUrl || null };
  }));

  return <main className="min-h-screen py-9">
    <div className="container max-w-5xl">
      <Link href="/admin" className="text-sm font-bold text-forest">← Admin dashboard</Link>
      <p className="mt-6 text-sm font-bold uppercase tracking-wider text-amber-600">Trust & safety</p>
      <h1 className="mt-1 text-3xl font-black text-slate-950">Identity verification</h1>
      <p className="mt-2 text-sm text-slate-500">Review private identity documents. Approving a submission enables wallet payouts for that account.</p>
      {searchParams.error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{decodeURIComponent(searchParams.error)}</p>}
      {searchParams.updated && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Verification review saved.</p>}
      <div className="mt-6 space-y-4">
        {items.map((item: any) => <section key={item.id} className="surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-extrabold text-slate-900">{item.profiles?.display_name || "Respondent"}</h2><p className="mt-1 text-xs text-slate-500">User {item.user_id} · {new Date(item.submitted_at).toLocaleString()}</p></div>
            <span className={item.status === "approved" ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700" : item.status === "rejected" ? "rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800"}>{item.status}</span>
          </div>
          {item.signedUrl ? <a href={item.signedUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-forest">Open private document</a> : <p className="mt-3 text-sm text-rose-600">Document could not be opened.</p>}
          {item.status === "pending" && <form action={reviewIdentity} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input type="hidden" name="submission_id" value={item.id}/>
            <input name="note" placeholder="Optional review note" className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
            <button name="status" value="approved" className="rounded-lg bg-forest px-4 py-2 text-sm font-bold text-white">Approve</button>
            <button name="status" value="rejected" className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700">Reject</button>
          </form>}
          {item.admin_note && <p className="mt-3 text-sm text-slate-500">Note: {item.admin_note}</p>}
        </section>)}
        {items.length === 0 && <div className="surface p-8 text-center text-sm text-slate-500">No identity documents have been submitted yet.</div>}
      </div>
    </div>
  </main>;
}
