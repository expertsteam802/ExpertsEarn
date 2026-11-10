"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function reviewIdentity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const submissionId = String(formData.get("submission_id") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "").trim();
  if (!submissionId || !["approved", "rejected"].includes(status)) {
    redirect("/admin/identity?error=invalid");
  }
  const { error } = await supabase.rpc("admin_review_identity_submission", {
    p_submission_id: submissionId,
    p_status: status,
    p_note: note || null
  });
  if (error) redirect("/admin/identity?error=" + encodeURIComponent(error.message));
  redirect("/admin/identity?updated=1");
}
