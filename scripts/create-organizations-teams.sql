-- Normalization migration: Organizations -> Teams -> Tryouts
-- Safe to re-run (idempotent). Run in Supabase SQL Editor.

-- 1. Organizations ---------------------------------------------------------
create table if not exists public."Organizations" (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  slug text unique,
  logo text,
  banner_image text,
  website text,
  email text,
  phone text,
  city text,
  province text,
  address text,
  google_maps_link text,
  description text,
  verified boolean default false,
  created_at timestamptz default now()
);

-- 2. Teams -----------------------------------------------------------------
create table if not exists public."Teams" (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public."Organizations"(id) on delete set null,
  team_name text not null,
  slug text unique,
  age_group text,
  birth_year text,
  level text,
  season text,
  head_coach text,
  assistant_coach text,
  logo text,
  city text,
  province text,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);

-- 3. Link Tryouts to Teams/Organizations -----------------------------------
alter table public."Tryouts"
  add column if not exists organization_id uuid references public."Organizations"(id) on delete set null;
alter table public."Tryouts"
  add column if not exists team_id uuid references public."Teams"(id) on delete set null;

-- 4. Helpful indexes for the public pages -----------------------------------
create index if not exists teams_org_idx on public."Teams"(organization_id);
create index if not exists tryouts_org_idx on public."Tryouts"(organization_id);
create index if not exists tryouts_team_idx on public."Tryouts"(team_id);

-- 5. Row Level Security: allow public read (writes use the service role key) -
alter table public."Organizations" enable row level security;
alter table public."Teams" enable row level security;

drop policy if exists "Public read organizations" on public."Organizations";
create policy "Public read organizations" on public."Organizations"
  for select using (true);

drop policy if exists "Public read teams" on public."Teams";
create policy "Public read teams" on public."Teams"
  for select using (true);
