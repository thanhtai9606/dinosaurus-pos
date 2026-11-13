DROP INDEX IF EXISTS idx_measurement_units_tenant_name_ci;
DROP INDEX IF EXISTS idx_measurement_units_tenant_code_ci;

CREATE UNIQUE INDEX idx_measurement_units_tenant_code ON measurement_units (tenant_id, code)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_measurement_units_tenant_name ON measurement_units (tenant_id, name) WHERE deleted_at IS NULL;
