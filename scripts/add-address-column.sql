-- Adds the "address" column used by the "Arena address" field on the
-- Add/Edit Tryout forms. This does NOT create, rename, or duplicate any table:
-- it only adds a single nullable text column if it is not already present, so
-- it is safe to run multiple times.
alter table public."Tryouts" add column if not exists address text;

-- Refresh PostgREST's schema cache so the new column is immediately usable by
-- the app (otherwise the API may keep returning "could not find column").
notify pgrst, 'reload schema';
