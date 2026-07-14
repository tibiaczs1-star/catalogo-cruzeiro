BEGIN;

CREATE TABLE credential_profiles (
  id bigserial PRIMARY KEY,
  tenant_id text NOT NULL,
  property_id text NOT NULL,
  username text NOT NULL CHECK (username = 'admin'),
  role text NOT NULL CHECK (role IN (
    'superadmin', 'proprietario', 'administrador', 'gerente', 'recepcionista', 'camareira',
    'supervisor_governanca', 'contador', 'financeiro', 'caixa', 'manutencao', 'revenue_manager',
    'auditor', 'hospede'
  )),
  password_hash text NOT NULL,
  session_version integer NOT NULL DEFAULT 1 CHECK (session_version > 0),
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until timestamptz,
  force_change boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id, username, role),
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties (tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX credential_profiles_scope_idx
  ON credential_profiles (tenant_id, property_id, username, role);
CREATE INDEX credential_profiles_lock_idx
  ON credential_profiles (locked_until) WHERE locked_until IS NOT NULL;

ALTER TABLE housekeeping_tasks
  ADD COLUMN assigned_username text,
  ADD COLUMN assigned_role text;

CREATE INDEX housekeeping_assignment_idx
  ON housekeeping_tasks (tenant_id, property_id, assigned_username, assigned_role, status);

COMMIT;
