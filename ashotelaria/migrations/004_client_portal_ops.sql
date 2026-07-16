BEGIN;

ALTER TABLE housekeeping_tasks
  ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'daily_cleaning',
  ADD COLUMN IF NOT EXISTS reservation_id text,
  ADD COLUMN IF NOT EXISTS scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS away_from text,
  ADD COLUMN IF NOT EXISTS away_until text,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'system';

CREATE TABLE client_partners (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  discount_label text NOT NULL,
  contact text,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id, id),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE food_menu (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  partner_id text,
  name text NOT NULL,
  category text NOT NULL,
  price_cents bigint NOT NULL CHECK (price_cents >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id, id),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE room_service_orders (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  reservation_id text NOT NULL,
  room_id text NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'preparing', 'delivered', 'cancelled')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id, id),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, property_id, reservation_id) REFERENCES reservations (tenant_id, property_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, property_id, room_id) REFERENCES rooms (tenant_id, property_id, id) ON DELETE RESTRICT
);

CREATE TABLE guest_messages (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  reservation_id text NOT NULL,
  room_id text NOT NULL,
  target text NOT NULL DEFAULT 'frontdesk',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id, id),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, property_id, reservation_id) REFERENCES reservations (tenant_id, property_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, property_id, room_id) REFERENCES rooms (tenant_id, property_id, id) ON DELETE RESTRICT
);

CREATE INDEX client_partners_property_idx ON client_partners (tenant_id, property_id, category) WHERE active;
CREATE INDEX food_menu_property_idx ON food_menu (tenant_id, property_id, category) WHERE active;
CREATE INDEX room_service_orders_property_idx ON room_service_orders (tenant_id, property_id, created_at DESC);
CREATE INDEX guest_messages_property_idx ON guest_messages (tenant_id, property_id, created_at DESC);
CREATE INDEX housekeeping_tasks_distribution_idx ON housekeeping_tasks (tenant_id, property_id, scheduled_date, task_type, source);

COMMIT;
