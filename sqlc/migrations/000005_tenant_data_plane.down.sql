ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_dedicated_requires_dsn_key;
ALTER TABLE tenants DROP COLUMN IF EXISTS database_dsn_key;
ALTER TABLE tenants DROP COLUMN IF EXISTS data_plane;
DROP TYPE IF EXISTS tenant_data_plane;
