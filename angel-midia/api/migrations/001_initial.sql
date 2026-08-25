CREATE TABLE admins (
  id uuid PRIMARY KEY,
  email text NOT NULL CHECK (email = lower(btrim(email))),
  password_hash text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX admins_email_lower_uidx ON admins (lower(email));

CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE locations (
  id uuid PRIMARY KEY,
  label text NOT NULL,
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE devices (
  id uuid PRIMARY KEY,
  installation_id text NOT NULL UNIQUE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked')),
  link_code text UNIQUE,
  app_version text,
  free_storage_bytes bigint CHECK (free_storage_bytes >= 0),
  schedule_version integer NOT NULL DEFAULT 0 CHECK (schedule_version >= 0),
  last_seen_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX devices_last_seen_at_idx ON devices(last_seen_at);

CREATE TABLE device_credentials (
  id uuid PRIMARY KEY,
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

CREATE TABLE groups (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE group_devices (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, device_id)
);

CREATE TABLE campaigns (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'archived')),
  approved_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE media_assets (
  id uuid PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  storage_key text NOT NULL UNIQUE,
  original_name text NOT NULL,
  content_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  sha256 char(64) NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE schedules (
  id uuid PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  priority integer NOT NULL DEFAULT 10 CHECK (priority BETWEEN 0 AND 100),
  created_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX schedules_starts_at_ends_at_idx ON schedules(starts_at, ends_at);

CREATE TABLE schedule_targets (
  id uuid PRIMARY KEY,
  schedule_id uuid NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('device', 'group', 'all')),
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (target_type = 'device' AND device_id IS NOT NULL AND group_id IS NULL)
    OR (target_type = 'group' AND group_id IS NOT NULL AND device_id IS NULL)
    OR (target_type = 'all' AND device_id IS NULL AND group_id IS NULL)
  )
);

CREATE TABLE device_commands (
  id uuid PRIMARY KEY,
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  command_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  UNIQUE (device_id, version)
);

CREATE TABLE playback_events (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL UNIQUE,
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX playback_events_device_id_occurred_at_idx
  ON playback_events(device_id, occurred_at);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
