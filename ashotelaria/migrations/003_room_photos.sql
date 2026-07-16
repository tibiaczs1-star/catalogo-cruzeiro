BEGIN;

CREATE TABLE room_photos (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  room_id text NOT NULL,
  kind text NOT NULL DEFAULT 'delivery' CHECK (kind IN ('room', 'delivery')),
  image_data_url text NOT NULL CHECK (image_data_url ~ '^data:image/(jpeg|png|webp);base64,'),
  note text,
  actor jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, property_id, room_id) REFERENCES rooms (tenant_id, property_id, id) ON DELETE CASCADE
);

CREATE INDEX room_photos_room_idx
  ON room_photos (tenant_id, property_id, room_id, kind, created_at DESC);

COMMIT;
