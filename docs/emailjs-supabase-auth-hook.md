# ExpertsEarn authentication email delivery (EmailJS)

This function is the production delivery adapter for Supabase Auth's Send Email Hook. Supabase remains responsible for creating and validating OTPs/token hashes; EmailJS only delivers the message.

## EmailJS setup (free plan)

1. Create an EmailJS account and connect the mailbox you want to send from.
2. Create one email template. The free plan currently allows two templates, so one shared template is enough for all Supabase auth events.
3. Configure the template fields:
   - **To email:** `{{to_email}}`
   - **To name:** `{{to_name}}`
   - **Subject:** `{{subject}}`
   - **From name:** `ExpertsEarn`
   - **Reply-to:** `expertsearn@gmail.com`
4. Use this HTML body (the template variables are supplied by the Edge Function):

```html
<div style="margin:0;padding:32px 12px;background:#f4f6f8;font-family:Arial,sans-serif;color:#17212b">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
    <div style="padding:26px 30px;background:#123b32;color:#ffffff">
      <div style="font-size:12px;letter-spacing:2px;font-weight:700">EXPERTSEARN</div>
      <h1 style="margin:18px 0 0;font-size:25px">{{headline}}</h1>
    </div>
    <div style="padding:30px">
      <p style="margin:0 0 16px">Hello {{to_name}},</p>
      <p style="line-height:1.65">{{message}}</p>
      <p style="margin:28px 0">
        <a href="{{action_url}}" style="display:inline-block;padding:14px 22px;border-radius:9px;background:#176b52;color:#ffffff;text-decoration:none;font-weight:700">{{action_label}}</a>
      </p>
      <p style="font-size:13px;color:#65716c">If you did not request this, you can ignore this email. Never share a verification code with anyone.</p>
      <p style="font-size:13px;color:#65716c">Need help? <a href="mailto:{{support_email}}">{{support_email}}</a></p>
    </div>
    <div style="padding:18px 30px;background:#f8faf9;color:#65716c;font-size:12px">© {{year}} ExpertsEarn · Your Opinions. Your Rewards.</div>
  </div>
</div>
```

5. Save the EmailJS **Service ID**, **Template ID**, and **Public Key**. Keep the **Private Key** secret.

## Supabase Edge Function secrets

In Supabase Dashboard → Edge Functions → Secrets, add:

- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`
- `SEND_EMAIL_HOOK_SECRET` — generate this in Authentication → Hooks → Send Email Hook. Preserve its full `v1,whsec_...` value.
- `APP_URL` = `https://www.expertsearn.mywire.org`

Supabase supplies `SUPABASE_URL` to Edge Functions. The service-role/secret key is not needed by this function.

## Activate the hook

After all secrets are saved, open Supabase Dashboard → Authentication → Hooks → Send Email Hook:

- Enable the Email Provider (email signups must remain enabled).
- Select **HTTP Hook**.
- URL: `https://jaimcybsmrzktuglpxmd.supabase.co/functions/v1/experts-earn-auth-email`
- Send the generated hook secret using the dashboard's supported signing-secret configuration.
- Save/enable the hook only after secrets are present.

The function verifies the Standard Webhooks signature and returns an error if configuration or provider delivery fails. Do not enable the hook before all secrets are configured, or sign-up and password-reset requests may fail. Keep email confirmation enabled.

## Free-plan capacity and operational notes

EmailJS's Free plan currently lists 200 requests per month and is described as a testing tier. It can deliver real emails, but it is a small-launch allowance, not a guaranteed high-volume production mail service. Requests above quota may be dropped. Monitor usage and delivery history. Do not create multiple free accounts to bypass the quota.

The function uses one EmailJS template for confirmation, recovery, email changes, and security notifications. It sends the two separate confirmation messages required when Supabase Secure Email Change is enabled. It never generates tokens itself and never logs token values.
