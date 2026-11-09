# ExpertsEarn

**Answer. Earn. Repeat.** A two-sided survey marketplace by ExpertsTeam.

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL (RLS enabled)

## Local setup
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project.
4. Set `SUPABASE_SECRET_KEY` as a server-only variable for partner API and API-key management. Older projects may use `SUPABASE_SERVICE_ROLE_KEY` instead.
5. Run `npm install`, then `npm run dev`.

Supabase project: `jaimcybsmrzktuglpxmd`  
Project URL: `https://jaimcybsmrzktuglpxmd.supabase.co`

The database schema, RLS policies, survey reward functions and payout functions are provisioned through Supabase migrations. Never expose the secret/service-role key in browser code or commit real secrets.

## First owner setup
After the owner creates their first account, promote that account to admin once in the Supabase SQL Editor (replace the email with the account's sign-in email):

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('OWNER_SIGN_IN_EMAIL');
```

This is intentionally a manual one-time step; public signup cannot assign admin privileges.

## Partner API
See [Partner API documentation](/docs/partner-api). New partner applications must be approved before API access is enabled.

## Deployment
Import this repository into Vercel and configure the environment variables above for Production and Preview. The app supports the modern Supabase integration variable names and legacy anon/service-role names. Environment variable changes require a new deployment. The custom domain is intentionally deferred.
