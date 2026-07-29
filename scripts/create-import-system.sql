-- Semi-automated tryout import system
-- Safe to re-run (idempotent). Run in Supabase SQL Editor.
-- These tables are ADMIN-ONLY: RLS is enabled with no public policy, so only
-- the service role key (which bypasses RLS) can read/write them.

-- 1. source_pages ----------------------------------------------------------
create table if not exists public.source_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public."Organizations"(id) on delete set null,
  source_url text not null,
  source_type text default 'webpage',
  province text,
  active boolean default true,
  scrape_allowed boolean default true,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  next_check_at timestamptz,
  content_hash text,
  error_message text,
  created_at timestamptz default now()
);

create unique index if not exists source_pages_url_idx on public.source_pages(source_url);
create index if not exists source_pages_org_idx on public.source_pages(organization_id);

-- 2. tryout_import_queue ---------------------------------------------------
create table if not exists public.tryout_import_queue (
  id uuid primary key default gen_random_uuid(),
  source_page_id uuid references public.source_pages(id) on delete cascade,
  organization_name text,
  team_name text,
  age_group text,
  birth_year text,
  level text,
  season text,
  tryout_dates text,
  registration_deadline text,
  cost text,
  registration_link text,
  arena text,
  address text,
  google_maps_link text,
  positions_needed text,
  equipment text,
  capacity text,
  description text,
  contact_information text,
  source_url text,
  confidence_score numeric,
  status text default 'pending_review',
  duplicate_of_tryout_id uuid references public."Tryouts"(id) on delete set null,
  raw_content text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

create index if not exists import_queue_status_idx on public.tryout_import_queue(status);
create index if not exists import_queue_source_idx on public.tryout_import_queue(source_page_id);

-- Enforce the allowed status values.
alter table public.tryout_import_queue
  drop constraint if exists tryout_import_queue_status_check;
alter table public.tryout_import_queue
  add constraint tryout_import_queue_status_check
  check (status in ('pending_review', 'approved', 'rejected', 'duplicate', 'needs_information'));

-- 3. Track the original source URL on published tryouts --------------------
alter table public."Tryouts" add column if not exists source_url text;

-- 4. Row Level Security: admin-only (no public policy) ----------------------
alter table public.source_pages enable row level security;
alter table public.tryout_import_queue enable row level security;
