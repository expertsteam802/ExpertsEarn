# ExpertsEarn

**Answer. Earn. Repeat.** A two-sided survey marketplace by ExpertsTeam.

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL (RLS enabled)

## Local setup
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase publishable/anon key from Project Settings → API Keys.
4. Add the server-only `SUPABASE_SERVICE_ROLE_KEY` for partner API and API-key management.
5. Run `npm install`, then `npm run dev`.

Supabase project: `jaimcybsmrzktuglpxmd`  
Project URL: `https://jaimcybsmrzktuglpxmd.supabase.co`

The database schema, RLS policies, survey reward functions and payout functions are provisioned through Supabase migrations. Never expose the service-role key in browser code or commit real secrets.

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
Import this repository into your hosting provider and set the environment variables from `.env.example`. The custom domain is intentionally deferred.
