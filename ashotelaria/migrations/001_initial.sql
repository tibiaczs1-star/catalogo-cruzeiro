BEGIN;

CREATE TABLE tenants (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE properties (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  time_zone text NOT NULL DEFAULT 'America/Rio_Branco',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id)
);

CREATE TABLE room_types (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  name text NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  nightly_rate_cents bigint NOT NULL CHECK (nightly_rate_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id, id),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE rooms (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  room_type_id text NOT NULL,
  number text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'dirty', 'cleaning', 'inspected', 'maintenance', 'blocked', 'do_not_disturb')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id, id),
  UNIQUE (tenant_id, property_id, number),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, property_id, room_type_id) REFERENCES room_types (tenant_id, property_id, id) ON DELETE RESTRICT
);

CREATE TABLE users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  role text NOT NULL CHECK (role IN (
    'superadmin', 'proprietario', 'administrador', 'gerente', 'recepcionista', 'camareira',
    'supervisor_governanca', 'contador', 'financeiro', 'caixa', 'manutencao', 'revenue_manager',
    'auditor', 'hospede'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id, property_id, role),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE guests (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  document text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id, id),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE reservations (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  guest_id text NOT NULL,
  room_type_id text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults integer NOT NULL CHECK (adults > 0),
  children integer NOT NULL DEFAULT 0 CHECK (children >= 0),
  nightly_rate_cents bigint NOT NULL CHECK (nightly_rate_cents >= 0),
  extras_cents bigint NOT NULL DEFAULT 0 CHECK (extras_cents >= 0),
  taxes_cents bigint NOT NULL DEFAULT 0 CHECK (taxes_cents >= 0),
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'canceled', 'no_show')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (check_out > check_in),
  UNIQUE (tenant_id, property_id, id),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, property_id, guest_id) REFERENCES guests (tenant_id, property_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, property_id, room_type_id) REFERENCES room_types (tenant_id, property_id, id) ON DELETE RESTRICT
);

CREATE TABLE reservation_rooms (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  reservation_id text NOT NULL,
  room_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id, reservation_id, room_id),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, property_id, reservation_id) REFERENCES reservations (tenant_id, property_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, property_id, room_id) REFERENCES rooms (tenant_id, property_id, id) ON DELETE RESTRICT
);

CREATE TABLE idempotency_keys (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  key text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id, key),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE housekeeping_tasks (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  room_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, property_id, room_id) REFERENCES rooms (tenant_id, property_id, id) ON DELETE CASCADE
);

CREATE TABLE maintenance_orders (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  room_id text,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, property_id, room_id) REFERENCES rooms (tenant_id, property_id, id) ON DELETE RESTRICT
);

CREATE TABLE integration_connections (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'disabled' CHECK (status IN ('disabled', 'sandbox', 'active', 'error')),
  secret_ciphertext text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id, provider),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE audit_events (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  action text NOT NULL,
  entity_id text,
  actor jsonb NOT NULL DEFAULT '{}'::jsonb,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX room_types_scope_idx ON room_types (tenant_id, property_id);
CREATE INDEX rooms_inventory_idx ON rooms (tenant_id, property_id, room_type_id, status);
CREATE INDEX memberships_scope_idx ON memberships (tenant_id, property_id, user_id);
CREATE INDEX guests_scope_idx ON guests (tenant_id, property_id);
CREATE INDEX reservations_stay_idx ON reservations (tenant_id, property_id, room_type_id, check_in, check_out, status);
CREATE INDEX reservation_rooms_room_idx ON reservation_rooms (tenant_id, property_id, room_id, reservation_id);
CREATE INDEX housekeeping_scope_idx ON housekeeping_tasks (tenant_id, property_id, status);
CREATE INDEX maintenance_scope_idx ON maintenance_orders (tenant_id, property_id, status);
CREATE INDEX integrations_scope_idx ON integration_connections (tenant_id, property_id);
CREATE INDEX audit_scope_idx ON audit_events (tenant_id, property_id, created_at DESC);

COMMIT;
