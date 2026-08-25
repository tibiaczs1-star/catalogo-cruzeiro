ALTER TABLE media_assets ALTER COLUMN campaign_id DROP NOT NULL;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS duration_seconds numeric(10,3);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'ready'
  CHECK (processing_status IN ('processing', 'ready', 'failed'));

CREATE TABLE playlists (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 160),
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE playlist_items (
  id uuid PRIMARY KEY,
  playlist_id uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  position integer NOT NULL CHECK (position >= 0),
  image_duration_seconds integer CHECK (image_duration_seconds BETWEEN 1 AND 86400),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, position),
  UNIQUE (playlist_id, asset_id, position)
);

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE schedules ALTER COLUMN campaign_id DROP NOT NULL;
ALTER TABLE schedules ADD CONSTRAINT schedules_content_check CHECK (
  (campaign_id IS NOT NULL AND playlist_id IS NULL) OR
  (campaign_id IS NULL AND playlist_id IS NOT NULL)
) NOT VALID;

CREATE TABLE playback_status (
  device_id uuid PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  playlist_id uuid REFERENCES playlists(id) ON DELETE SET NULL,
  current_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  next_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  playlist_position integer NOT NULL DEFAULT 0 CHECK (playlist_position >= 0),
  playback_started_at timestamptz,
  error_message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE download_status (
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES media_assets(id) ON DELETE CASCADE,
  state text NOT NULL CHECK (state IN ('idle', 'downloading', 'ready', 'failed')),
  progress integer CHECK (progress BETWEEN 0 AND 100),
  error_message text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, asset_id)
);

CREATE INDEX playlist_items_playlist_position_idx ON playlist_items(playlist_id, position);
CREATE INDEX schedules_playlist_active_idx ON schedules(playlist_id, starts_at, ends_at, priority);
