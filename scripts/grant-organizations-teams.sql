-- ============================================================================
-- Grant Supabase API roles access to the existing Organizations & Teams tables.
--
-- These tables already exist but were created without granting table
-- privileges to Supabase's API roles, so every request — even with the
-- service-role key — fails with:  42501 "permission denied for table ...".
--
-- This script ONLY grants privileges + ensures public-read RLS. It does NOT
-- create, rename, or duplicate any tables. Safe to re-run (idempotent).
-- Run it in the Supabase SQL Editor.
-- ============================================================================

-- 1. Schema usage (harmless if already granted) -----------------------------
grant usage on schema public to anon, authenticated, service_role;

-- 2. Table privileges -------------------------------------------------------
-- service_role backs the admin dashboard and must have full access.
grant all on public."Organizations" to service_role;
grant all on public."Teams"         to service_role;

-- anon/authenticated back the public website and need read access.
grant select on public."Organizations" to anon, authenticated;
grant select on public."Teams"         to anon, authenticated;

-- 3. Row Level Security: public read, writes via service role ---------------
alter table public."Organizations" enable row level security;
alter table public."Teams"         enable row level security;

drop policy if exists "Public read organizations" on public."Organizations";
create policy "Public read organizations" on public."Organizations"
  for select using (true);

drop policy if exists "Public read teams" on public."Teams";
create policy "Public read teams" on public."Teams"
  for select using (true);

-- Note: the service_role key bypasses RLS, so no insert/update/delete policy
-- is needed for the admin dashboard to manage these tables.
