-- ============================================================
-- Review-based import system: support tables + traceability
-- ------------------------------------------------------------
-- Idempotent. Adds ONLY new objects (two support tables, a few
-- columns, indexes, grants). It never alters, renames, drops, or
-- overwrites any existing table, column, or row.
--
-- Safe to run multiple times.
-- ============================================================

-- 1. Source pages the admin registers for import.
create table if not exists public.source_pages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  text,
  source_url       text not null,
  source_type      text default 'webpage',
  province         text,
  active           boolean default true,
  scrape_allowed   boolean default true,
  last_checked_at  timestamptz,
  last_success_at  timestamptz,
  next_check_at    timestamptz,
  content_hash     text,
  error_message    text,
  created_at       timestamptz default now()
);

-- 2. Extracted records awaiting review (nothing here is public).
create table if not exists public.tryout_import_queue (
  id                     uuid primary key default gen_random_uuid(),
  source_page_id         uuid references public.source_pages(id) on delete set null,
  organization_name      text,
  team_name              text,
  age_group              text,
  birth_year             text,
  level                  text,
  season                 text,
  tryout_dates           text,
  registration_deadline  text,
  cost                   text,
  registration_link      text,
  arena                  text,
  address                text,
  google_maps_link       text,
  positions_needed       text,
  equipment              text,
  capacity               text,
  description            text,
  contact_information    text,
  source_url             text,
  confidence_score       numeric,
  status                 text default 'pending_review',
  duplicate_of_tryout_id text,
  raw_content            text,
  created_at             timestamptz default now(),
  reviewed_at            timestamptz
);

create index if not exists idx_import_queue_status on public.tryout_import_queue (status);
create index if not exists idx_import_queue_source on public.tryout_import_queue (source_page_id);
create index if not exists idx_source_pages_active on public.source_pages (active);

-- 3. Traceability on the published tryout (approve writes source_url).
alter table public."Tryouts" add column if not exists source_url text;
-- Optional: when-published stamp for published-side traceability.
alter table public."Tryouts" add column if not exists source_last_checked_at timestamptz;

-- 4. Admin-only access. These tables are never read by the public site,
--    so grant to the service role and keep RLS on with no public policy.
grant all on public.source_pages        to service_role;
grant all on public.tryout_import_queue to service_role;
alter table public.source_pages        enable row level security;
alter table public.tryout_import_queue enable row level security;

-- 5. Reload PostgREST's schema cache so the new objects are visible.
notify pgrst, 'reload schema';
