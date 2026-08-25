CREATE TABLE device_remote_commands (
  id uuid PRIMARY KEY,
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  command_type text NOT NULL
    CHECK (command_type IN ('refresh_sync', 'restart_player', 'clear_media_cache')),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'leased', 'succeeded', 'failed', 'expired')),
  idempotency_key text NOT NULL
    CHECK (char_length(idempotency_key) BETWEEN 1 AND 128),
  requested_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  lease_expires_at timestamptz,
  lease_token uuid,
  lease_generation integer NOT NULL DEFAULT 0 CHECK (lease_generation >= 0),
  delivered_at timestamptz,
  acknowledged_at timestamptz,
  outcome text CHECK (outcome IN ('succeeded', 'failed')),
  error_code text,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  UNIQUE (device_id, idempotency_key),
  CHECK (expires_at > requested_at),
  CHECK (
    (lease_generation = 0 AND lease_token IS NULL)
    OR (lease_generation > 0 AND lease_token IS NOT NULL)
  ),
  CHECK ((outcome = 'failed') OR error_code IS NULL),
  CHECK (
    (status IN ('queued', 'leased', 'expired') AND outcome IS NULL AND acknowledged_at IS NULL)
    OR (status IN ('succeeded', 'failed') AND outcome = status AND acknowledged_at IS NOT NULL)
  )
);

CREATE INDEX device_remote_commands_delivery_idx
  ON device_remote_commands(device_id, status, requested_at, id);

CREATE INDEX device_remote_commands_requested_at_idx
  ON device_remote_commands(requested_at DESC);
