import { NextRequest, NextResponse } from "next/server";
import { authenticatePartner } from "@/lib/partner-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await authenticatePartner(request);
  if ("error" in auth) return auth.error;

  const rawLimit = request.nextUrl.searchParams.get("limit");
  const parsedLimit = rawLimit === null ? 100 : Number(rawLimit);
  const limit = Number.isSafeInteger(parsedLimit) ? Math.min(500, Math.max(1, parsedLimit)) : 100;
  const { data, error } = await auth.admin.from("partner_billing")
    .select("id,survey_id,event_type,amount_usd,currency,description,created_at")
    .eq("partner_id", auth.partnerAccountId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: "Could not retrieve billing history" }, { status: 500 });
  const entries = data || [];
  const ledgerTotal = entries.reduce((total, entry) => total + Number(entry.amount_usd || 0), 0);
  return NextResponse.json({ data: entries, count: entries.length, ledger_total_usd: Number(ledgerTotal.toFixed(2)) });
}
