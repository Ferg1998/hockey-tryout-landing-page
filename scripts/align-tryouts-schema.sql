-- =====================================================================
-- Align public."Tryouts" with the Add/Edit Tryout forms
-- ---------------------------------------------------------------------
-- Idempotent: every statement uses ADD COLUMN IF NOT EXISTS, so running
-- this multiple times is safe. It only ADDS missing columns — it never
-- deletes, renames, overwrites, or duplicates existing columns or data.
--
-- Already present (left untouched): id, organization_id, team_id, arena,
-- address, dates, cost, registration_link, contact_name, contact_email,
-- contact_phone, status, image, team, age_group, birth_year, level, city,
-- province.
-- =====================================================================

-- Arena & location -----------------------------------------------------
alter table public."Tryouts" add column if not exists hero_image text;
alter table public."Tryouts" add column if not exists google_maps_link text;

-- Positions ------------------------------------------------------------
alter table public."Tryouts" add column if not exists positions_needed text;

-- Schedule -------------------------------------------------------------
alter table public."Tryouts" add column if not exists start_date date;
alter table public."Tryouts" add column if not exists end_date date;
alter table public."Tryouts" add column if not exists times text;
alter table public."Tryouts" add column if not exists registration_deadline date;

-- Registration & contact ----------------------------------------------
alter table public."Tryouts" add column if not exists website text;

-- Details --------------------------------------------------------------
alter table public."Tryouts" add column if not exists description text;
alter table public."Tryouts" add column if not exists equipment text;

-- Capacity & status ----------------------------------------------------
alter table public."Tryouts" add column if not exists max_players integer;
alter table public."Tryouts" add column if not exists registrations integer default 0;
alter table public."Tryouts" add column if not exists featured boolean default false;

-- Denormalized organization-name snapshot (kept in sync on save) -------
alter table public."Tryouts" add column if not exists organization text;

-- Reload the PostgREST schema cache so the new columns are visible
-- immediately to the app (otherwise you get "column not found in schema
-- cache" until the next automatic reload).
notify pgrst, 'reload schema';
