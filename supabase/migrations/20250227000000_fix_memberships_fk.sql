-- Restablece la relación memberships → profiles y recarga el esquema de PostgREST
BEGIN;

ALTER TABLE memberships
  DROP CONSTRAINT IF EXISTS memberships_user_id_fkey;

ALTER TABLE memberships
  ADD CONSTRAINT memberships_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;
