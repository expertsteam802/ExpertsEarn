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
4. Run `npm install`, then `npm run dev`.

The Supabase database schema is provisioned through the migration applied to project `jaimcybsmrzktuglpxmd`. Never expose the service-role key in browser code or commit real secrets.

## Planned production configuration
Set environment variables in your hosting provider. The custom domain is intentionally deferred.
