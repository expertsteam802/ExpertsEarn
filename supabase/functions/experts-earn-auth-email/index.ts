import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

type AuthEmailEvent = {
  user: {
    id: string;
    email?: string;
    new_email?: string;
    user_metadata?: { display_name?: string; full_name?: string };
  };
  email_data: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type: string;
    site_url?: string;
    token_new?: string;
    token_hash_new?: string;
    old_email?: string;
  };
};

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const APP_URL = Deno.env.get("APP_URL") ?? "https://www.expertsearn.mywire.org";
const SUPPORT_EMAIL = "expertsearn@gmail.com";

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required secret: ${name}`);
  return value;
}

function safeName(value: unknown): string {
  if (typeof value !== "string") return "there";
  const clean = value.replace(/[<>\r\n]/g, "").trim().slice(0, 80);
  return clean || "there";
}

function allowedRedirect(raw: string | undefined): string {
  const fallback = new URL(APP_URL);
  if (!raw) return fallback.toString();
  try {
    const candidate = new URL(raw);
    const allowed = new Set([fallback.origin, "https://expertsearn.mywire.org"]);
    if (!allowed.has(candidate.origin)) return fallback.toString();
    return candidate.toString();
  } catch {
    return fallback.toString();
  }
}

function verificationUrl(tokenHash: string, actionType: string, redirectTo: string): string {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const url = new URL(`${supabaseUrl}/auth/v1/verify`);
  url.searchParams.set("token", tokenHash);
  url.searchParams.set("type", actionType);
  url.searchParams.set("redirect_to", redirectTo);
  return url.toString();
}

function copyFor(action: string): { subject: string; headline: string; message: string; button: string } {
  const copy: Record<string, { subject: string; headline: string; message: string; button: string }> = {
    signup: { subject: "Confirm your ExpertsEarn account", headline: "Welcome to ExpertsEarn", message: "Confirm your email address to activate your ExpertsEarn account and get started.", button: "Confirm my email" },
    invite: { subject: "You are invited to ExpertsEarn", headline: "Your ExpertsEarn invitation", message: "You have been invited to join ExpertsEarn. Confirm your email to continue.", button: "Accept invitation" },
    magiclink: { subject: "Your ExpertsEarn sign-in link", headline: "Sign in to ExpertsEarn", message: "Use the secure link below to sign in to your account.", button: "Sign in securely" },
    recovery: { subject: "Reset your ExpertsEarn password", headline: "Password reset requested", message: "We received a request to reset your ExpertsEarn password. If you made this request, use the secure link below. If not, you can ignore this email.", button: "Reset my password" },
    email: { subject: "Confirm your email address", headline: "Confirm your email", message: "Use the secure link below to confirm this email address for your ExpertsEarn account.", button: "Confirm email" },
    email_change: { subject: "Confirm your ExpertsEarn email change", headline: "Confirm your email change", message: "A request was made to change the email address on your ExpertsEarn account. Use the secure link below to approve it.", button: "Confirm email change" },
    reauthentication: { subject: "Verify your ExpertsEarn account", headline: "Confirm it's you", message: "Enter the verification code shown below to continue with this sensitive account action.", button: "Open ExpertsEarn" },
    password_changed_notification: { subject: "Your ExpertsEarn password was changed", headline: "Password changed", message: "The password for your ExpertsEarn account was changed. If you did not make this change, contact our support team immediately.", button: "Visit ExpertsEarn" },
    email_changed_notification: { subject: "Your ExpertsEarn email was changed", headline: "Email address changed", message: "The email address associated with your ExpertsEarn account was changed. If you did not make this change, contact our support team immediately.", button: "Visit ExpertsEarn" },
    phone_changed_notification: { subject: "Your ExpertsEarn phone number was changed", headline: "Phone number changed", message: "The phone number associated with your ExpertsEarn account was changed. If you did not make this change, contact our support team.", button: "Visit ExpertsEarn" },
    identity_linked_notification: { subject: "A sign-in method was linked to ExpertsEarn", headline: "Sign-in method linked", message: "A new sign-in identity was linked to your ExpertsEarn account. If you did not do this, secure your account and contact support.", button: "Visit ExpertsEarn" },
    identity_unlinked_notification: { subject: "A sign-in method was removed from ExpertsEarn", headline: "Sign-in method removed", message: "A sign-in identity was removed from your ExpertsEarn account. If you did not do this, secure your account and contact support.", button: "Visit ExpertsEarn" },
    mfa_factor_enrolled_notification: { subject: "Two-factor authentication enabled", headline: "Two-factor authentication enabled", message: "A two-factor authentication method was added to your ExpertsEarn account. If you did not do this, contact support.", button: "Visit ExpertsEarn" },
    mfa_factor_unenrolled_notification: { subject: "Two-factor authentication changed", headline: "Two-factor authentication method removed", message: "A two-factor authentication method was removed from your ExpertsEarn account. If you did not do this, contact support.", button: "Visit ExpertsEarn" },
  };
  return copy[action] ?? { subject: "An account update from ExpertsEarn", headline: "Account update", message: "There has been an update to your ExpertsEarn account. If you do not recognize this activity, contact support.", button: "Visit ExpertsEarn" };
}

async function sendEmail(params: {
  toEmail: string;
  toName: string;
  action: string;
  token?: string;
  actionUrl?: string;
}) {
  const serviceId = requiredEnv("EMAILJS_SERVICE_ID");
  const templateId = requiredEnv("EMAILJS_TEMPLATE_ID");
  const publicKey = requiredEnv("EMAILJS_PUBLIC_KEY");
  const privateKey = requiredEnv("EMAILJS_PRIVATE_KEY");
  const copy = copyFor(params.action);
  const templateParams = {
    to_email: params.toEmail,
    to_name: params.toName,
    subject: copy.subject,
    headline: copy.headline,
    message: copy.message,
    action_url: params.actionUrl ?? APP_URL,
    action_label: copy.button,
    verification_code: params.action === "reauthentication" ? (params.token ?? "") : "",
    support_email: SUPPORT_EMAIL,
    website_url: APP_URL,
    year: String(new Date().getUTCFullYear()),
  };

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: templateParams,
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    console.error("EmailJS delivery failed", { status: response.status, detail });
    throw new Error(`Email provider rejected the message (HTTP ${response.status})`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const hookSecret = requiredEnv("SEND_EMAIL_HOOK_SECRET").replace(/^v1,whsec_/, "");
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const webhook = new Webhook(hookSecret);
    const event = webhook.verify(payload, headers) as AuthEmailEvent;

    const email = event.user?.email?.trim();
    const action = event.email_data?.email_action_type;
    if (!email || !action) throw new Error("Auth hook payload is missing required fields");

    const displayName = safeName(event.user.user_metadata?.display_name ?? event.user.user_metadata?.full_name);
    const redirectTo = allowedRedirect(event.email_data.redirect_to);
    const data = event.email_data;

    if (action === "email_change") {
      const currentEmail = email;
      const newEmail = event.user.new_email?.trim();
      if (data.token_hash_new && data.token && data.token_hash && data.token_new && newEmail) {
        await sendEmail({
          toEmail: currentEmail,
          toName: displayName,
          action,
          token: data.token,
          actionUrl: verificationUrl(data.token_hash_new, action, redirectTo),
        });
        await new Promise((resolve) => setTimeout(resolve, 1100));
        await sendEmail({
          toEmail: newEmail,
          toName: displayName,
          action,
          token: data.token_new,
          actionUrl: verificationUrl(data.token_hash, action, redirectTo),
        });
      } else {
        const target = newEmail ?? currentEmail;
        const hash = data.token_hash ?? data.token_hash_new;
        if (!hash) throw new Error("Email-change verification hash is missing");
        await sendEmail({
          toEmail: target,
          toName: displayName,
          action,
          token: data.token ?? data.token_new,
          actionUrl: verificationUrl(hash, action, redirectTo),
        });
      }
    } else {
      const tokenActions = new Set(["signup", "invite", "magiclink", "recovery", "email", "reauthentication"]);
      const hash = data.token_hash;
      const actionUrl = tokenActions.has(action)
        ? (hash ? verificationUrl(hash, action, redirectTo) : undefined)
        : APP_URL;
      if (tokenActions.has(action) && !hash) throw new Error("Authentication verification hash is missing");
      await sendEmail({
        toEmail: email,
        toName: displayName,
        action,
        token: data.token,
        actionUrl,
      });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("ExpertsEarn auth email hook failed", error instanceof Error ? error.message : "Unknown error");
    return new Response(JSON.stringify({ error: { message: "Authentication email could not be delivered" } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
