-- Remove duplicate codes per tenant (keep oldest row)
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY tenant_id, lower(trim(code)) ORDER BY created_at, id) AS rn
    FROM measurement_units
    WHERE deleted_at IS NULL
)
UPDATE measurement_units mu
SET deleted_at = NOW(), updated_at = NOW()
FROM ranked r
WHERE mu.id = r.id AND r.rn > 1;

-- Remove duplicate names per tenant (keep oldest row)
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY tenant_id, lower(trim(name)) ORDER BY created_at, id) AS rn
    FROM measurement_units
    WHERE deleted_at IS NULL
)
UPDATE measurement_units mu
SET deleted_at = NOW(), updated_at = NOW()
FROM ranked r
WHERE mu.id = r.id AND r.rn > 1;

DROP INDEX IF EXISTS idx_measurement_units_tenant_code;
DROP INDEX IF EXISTS idx_measurement_units_tenant_name;

CREATE UNIQUE INDEX idx_measurement_units_tenant_code_ci ON measurement_units (tenant_id, lower(trim(code)))
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_measurement_units_tenant_name_ci ON measurement_units (tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL;
