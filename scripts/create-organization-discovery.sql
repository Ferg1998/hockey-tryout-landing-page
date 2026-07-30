-- Bulk organization discovery pipeline
-- Safe to re-run. Run in the Supabase SQL Editor before using the
-- "Organization Discovery" admin tab.

create table if not exists public.organization_directory_sources (
  id uuid primary key default gen_random_uuid(),
  source_url text not null unique,
  source_name text,
  province text default 'Ontario',
  active boolean default true,
  scrape_allowed boolean default true,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  content_hash text,
  error_message text,
  created_at timestamptz default now()
);

create table if not exists public.organization_import_queue (
  id uuid primary key default gen_random_uuid(),
  directory_source_id uuid references public.organization_directory_sources(id) on delete cascade,
  organization_name text not null,
  website text,
  city text,
  province text default 'Ontario',
  league_or_branch text,
  source_url text not null,
  confidence_score numeric default 0.5,
  status text default 'pending_review',
  duplicate_of_organization_id uuid references public."Organizations"(id) on delete set null,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

create index if not exists organization_import_status_idx
  on public.organization_import_queue(status);
create unique index if not exists organization_import_identity_idx
  on public.organization_import_queue(
    lower(organization_name),
    coalesce(lower(website), ''),
    directory_source_id
  );

alter table public.organization_import_queue
  drop constraint if exists organization_import_status_check;
alter table public.organization_import_queue
  add constraint organization_import_status_check
  check (status in ('pending_review', 'approved', 'rejected', 'duplicate'));

alter table public.organization_directory_sources enable row level security;
alter table public.organization_import_queue enable row level security;

-- These tables are only accessed by authenticated server actions through the
-- Supabase service-role client. RLS bypass alone does not grant table
-- privileges, so explicitly grant the API role access.
grant usage on schema public to service_role;
grant all on public.organization_directory_sources to service_role;
grant all on public.organization_import_queue to service_role;
