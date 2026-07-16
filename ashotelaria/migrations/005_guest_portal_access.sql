BEGIN;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS guest_access_code text;

CREATE INDEX IF NOT EXISTS reservations_guest_access_idx
  ON reservations (tenant_id, property_id, id, guest_access_code);

COMMIT;
