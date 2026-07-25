-- Adds the "registrations" column expected by the Add/Edit Tryout form's
-- "Current registrations" field. Safe to run repeatedly: it only adds the
-- column if it is missing and does NOT create, rename, or drop any table.
alter table public."Tryouts" add column if not exists registrations integer default 0;

-- Ask PostgREST to reload its schema cache so the new column is recognized
-- immediately (otherwise you may keep seeing the "schema cache" error).
notify pgrst, 'reload schema';
