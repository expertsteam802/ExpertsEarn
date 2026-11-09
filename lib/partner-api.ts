import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function authenticatePartner(request: NextRequest) {
  const rawKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!rawKey || rawKey.length < 24) return { error: NextResponse.json({ error: "A valid API key is required" }, { status: 401 }) };
  const hash = createHash("sha256").update(rawKey).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin.from("partner_api_keys")
    .select("id,partner_id,partner_accounts!inner(id,user_id,is_approved)")
    .eq("key_hash", hash).is("revoked_at", null).maybeSingle();
  if (error || !data || !(data as any).partner_accounts?.is_approved) {
    return { error: NextResponse.json({ error: "Invalid or inactive partner API key" }, { status: 401 }) };
  }
  await admin.from("partner_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return { admin, partnerUserId: (data as any).partner_accounts.user_id as string, partnerAccountId: data.partner_id as string };
}