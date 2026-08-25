CREATE TABLE organizations (
  id uuid PRIMARY KEY,
  parent_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('matrix', 'affiliate', 'branch', 'client')),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (kind = 'matrix' AND parent_id IS NULL)
    OR (kind <> 'matrix' AND parent_id IS NOT NULL)
  )
);

CREATE INDEX organizations_parent_id_idx ON organizations(parent_id);

CREATE TABLE organization_members (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'sales', 'operator', 'viewer')),
  created_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, admin_id)
);

CREATE INDEX organization_members_admin_id_idx ON organization_members(admin_id);

CREATE TABLE crm_contacts (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
  company text,
  email text,
  phone text,
  notes text,
  status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'customer', 'inactive')),
  created_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id)
);

CREATE INDEX crm_contacts_organization_id_idx ON crm_contacts(organization_id, created_at DESC);

CREATE TABLE crm_opportunities (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id uuid,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  stage text NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'won', 'lost')),
  value_cents bigint NOT NULL DEFAULT 0 CHECK (value_cents >= 0),
  expected_close_date date,
  owner_admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, contact_id)
    REFERENCES crm_contacts(organization_id, id) ON DELETE RESTRICT
);

CREATE INDEX crm_opportunities_organization_stage_idx
  ON crm_opportunities(organization_id, stage, updated_at DESC);

CREATE TABLE crm_tasks (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id uuid,
  opportunity_id uuid,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  due_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  assigned_to uuid REFERENCES admins(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, contact_id)
    REFERENCES crm_contacts(organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, opportunity_id)
    REFERENCES crm_opportunities(organization_id, id) ON DELETE RESTRICT
);

CREATE INDEX crm_tasks_organization_status_due_idx
  ON crm_tasks(organization_id, status, due_at);

ALTER TABLE locations
  ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN venue_type text NOT NULL DEFAULT 'outro'
    CHECK (venue_type IN (
      'supermercado', 'varejo', 'saude', 'alimentacao', 'hotel',
      'educacao', 'publico', 'escritorio', 'outro'
    ));

CREATE INDEX locations_organization_id_idx ON locations(organization_id);

ALTER TABLE devices
  ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX devices_organization_id_idx ON devices(organization_id);
