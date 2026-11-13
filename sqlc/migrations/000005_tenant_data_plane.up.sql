-- Tenant routing: shared (default) vs dedicated database per legal entity.

CREATE TYPE tenant_data_plane AS ENUM ('shared', 'dedicated');

ALTER TABLE tenants
  ADD COLUMN data_plane tenant_data_plane NOT NULL DEFAULT 'shared',
  ADD COLUMN database_dsn_key VARCHAR(64);

COMMENT ON COLUMN tenants.database_dsn_key IS
  'Name of env var holding DSN for dedicated DB, e.g. TENANT_DSN_ACME. Never store password in this table.';

ALTER TABLE tenants
  ADD CONSTRAINT tenants_dedicated_requires_dsn_key
  CHECK (
    data_plane = 'shared'
    OR (data_plane = 'dedicated' AND database_dsn_key IS NOT NULL AND length(trim(database_dsn_key)) > 0)
  );
