# ExpertsEarn authentication email delivery (Mailjet)

Supabase Auth remains responsible for creating and validating OTPs and token hashes. The Edge Function verifies Supabase's signed Send Email Hook request and delivers the message through Mailjet's API v3.1.

## Verified sender

Use the sender address already verified in Mailjet:

- From email: `expertsearn@gmail.com`
- From name: `ExpertsEarn`
- Reply/support email: `expertsearn@gmail.com`

Mailjet may accept a verified sender address without domain authentication. SPF/DKIM authentication can be configured later if DNS access is available and is recommended for deliverability.

## Supabase Edge Function secrets

In Supabase Dashboard → Edge Functions → Secrets, configure:

- `MAILJET_API_KEY` — Mailjet API key (public key)
- `MAILJET_SECRET_KEY` — Mailjet secret key; never expose it in frontend code or commit it
- `MAILJET_FROM_EMAIL` = `expertsearn@gmail.com`
- `SEND_EMAIL_HOOK_SECRET` — full signing secret generated for the Supabase Authentication → Hooks → Send Email Hook (keep its `v1,whsec_...` prefix)
- `APP_URL` = `https://www.expertsearn.mywire.org`

Supabase supplies `SUPABASE_URL` to Edge Functions. Do not add the Supabase service-role key to this function.

## Deploy

Deploy `supabase/functions/experts-earn-auth-email/index.ts` as the Edge Function named `experts-earn-auth-email`, with JWT verification disabled because the function authenticates the request using the Standard Webhooks signature.

The function sends via `https://api.mailjet.com/v3.1/send` using HTTP Basic authentication with the Mailjet API key and secret key. It handles signup, invite, magic-link, recovery, email confirmation/change, reauthentication, and account-security notification events.

## Activate only after testing

The Supabase Send Email Hook must remain disabled until all secrets are configured and a controlled end-to-end test succeeds.

When ready, open Supabase Dashboard → Authentication → Hooks → Send Email Hook and configure the HTTP Hook URL:

`https://jaimcybsmrzktuglpxlqpt.supabase.co/functions/v1/experts-earn-auth-email`

Use the actual project URL shown in Supabase if it differs. Keep email signups and email confirmation enabled.

Test at minimum:
1. A new signup reaches the inbox and the confirmation link completes signup.
2. Password recovery reaches the inbox and the reset link opens the password reset flow.
3. Email-change confirmation works for both current and new addresses if Secure Email Change is enabled.
4. Mailjet's activity log records successful acceptance.

Do not test with real user accounts until the hook configuration is checked. Never log or share OTPs, token hashes, API keys, or webhook signing secrets.

## Operational notes

Mailjet's free-plan allowance and daily caps can change; check the current plan in the Mailjet dashboard. A successful API response means Mailjet accepted the message, not that it reached the recipient's inbox. Monitor bounces, spam complaints, and delivery events in Mailjet.