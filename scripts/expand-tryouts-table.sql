-- HockeyTryouts.ca — expand the Tryouts table for a production-ready schema.
-- Run this once in the Supabase SQL Editor (SQL Editor -> New query -> Run).
-- Safe to re-run: every statement uses IF NOT EXISTS.

alter table public."Tryouts" add column if not exists organization text;
alter table public."Tryouts" add column if not exists logo text;
alter table public."Tryouts" add column if not exists hero_image text;
alter table public."Tryouts" add column if not exists address text;
alter table public."Tryouts" add column if not exists google_maps_link text;
alter table public."Tryouts" add column if not exists positions_needed text;
alter table public."Tryouts" add column if not exists start_date date;
alter table public."Tryouts" add column if not exists end_date date;
alter table public."Tryouts" add column if not exists times text;
alter table public."Tryouts" add column if not exists registration_deadline date;
alter table public."Tryouts" add column if not exists website text;
alter table public."Tryouts" add column if not exists contact_name text;
alter table public."Tryouts" add column if not exists contact_email text;
alter table public."Tryouts" add column if not exists contact_phone text;
alter table public."Tryouts" add column if not exists description text;
alter table public."Tryouts" add column if not exists equipment text;
alter table public."Tryouts" add column if not exists max_players integer;
alter table public."Tryouts" add column if not exists registrations integer default 0;
alter table public."Tryouts" add column if not exists featured boolean default false;
alter table public."Tryouts" add column if not exists verified boolean default false;

-- The app also keeps the existing columns: id, team, city, province,
-- birth_year, age_group, level, dates, arena, cost, status,
-- registration_link, image. The `dates` column is auto-composed from
-- start_date/end_date on save, so it stays populated for search and display.
