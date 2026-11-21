import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function safeHeader(value: string | null, max = 120) {
  if (!value) return null;
  return value.replace(/[\r\n\0]/g, "").trim().slice(0, max) || null;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const requestHeaders = await headers();
  // Vercel supplies these geo headers at the edge. They are approximate IP geolocation,
  // not GPS or proof of a member's physical location.
  const country = safeHeader(requestHeaders.get("x-vercel-ip-country"), 2)?.toUpperCase() ?? null;
  const region = safeHeader(requestHeaders.get("x-vercel-ip-country-region"), 40);
  const city = safeHeader(requestHeaders.get("x-vercel-ip-city"), 80);
  const ip = safeHeader(requestHeaders.get("x-real-ip"), 100);
  const secret = process.env.IP_HASH_SECRET;
  const ipHash = ip && secret ? createHmac("sha256", secret).update(ip).digest("hex") : null;
  const userAgent = safeHeader(requestHeaders.get("user-agent"), 400);

  const { data: profile } = await supabase.from("profiles")
    .select("country_code,account_status,account_locked_until")
    .eq("id", user.id).maybeSingle();
  const mismatch = Boolean(country && profile?.country_code && country !== profile.country_code.toUpperCase());
  const riskFlags = mismatch ? ["ip_country_differs_from_profile"] : [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Security event service is not configured" }, { status: 503 });
  }
  const privilegedClient = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { error } = await privilegedClient.from("account_security_events").insert({
    user_id: user.id,
    event_type: mismatch ? "country_change" : "session_check",
    ip_hash: ipHash,
    country_code: country,
    region,
    city,
    user_agent: userAgent,
    risk_flags: riskFlags
  });
  if (error) return NextResponse.json({ error: "Security check could not be recorded" }, { status: 503 });
  return NextResponse.json({
    recorded: true,
    location: { country, region, city, source: "approximate_ip_geolocation" },
    riskFlags,
    vpnProxyDetection: "not_configured"
  });
}
