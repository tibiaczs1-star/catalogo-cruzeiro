CREATE TABLE advertisers (
  id uuid PRIMARY KEY, name text NOT NULL, contact_name text, phone text, email text, notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE advertiser_months (
  id uuid PRIMARY KEY, advertiser_id uuid NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  competence date NOT NULL, monthly_amount_cents bigint NOT NULL CHECK (monthly_amount_cents >= 0),
  status text NOT NULL CHECK (status IN ('paid','pending','late','courtesy')), notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(advertiser_id,competence)
);
CREATE TABLE media_advertisers (
  advertiser_id uuid NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(advertiser_id,asset_id)
);
ALTER TABLE playback_events ADD COLUMN IF NOT EXISTS advertiser_id uuid REFERENCES advertisers(id) ON DELETE SET NULL;
CREATE INDEX playback_events_advertiser_month_idx ON playback_events(advertiser_id,occurred_at);

CREATE TABLE emergency_broadcasts (
  id uuid PRIMARY KEY, mode text NOT NULL CHECK(mode IN ('message','media')), title text, message text,
  asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL, active boolean NOT NULL DEFAULT true,
  activated_by uuid REFERENCES admins(id) ON DELETE SET NULL, activated_at timestamptz NOT NULL DEFAULT now(),
  ended_by uuid REFERENCES admins(id) ON DELETE SET NULL, ended_at timestamptz,
  CHECK ((mode='message' AND length(btrim(coalesce(title,'')||coalesce(message,'')))>0) OR (mode='media' AND asset_id IS NOT NULL))
);
CREATE UNIQUE INDEX one_active_emergency_idx ON emergency_broadcasts(active) WHERE active;
