CREATE TABLE measurement_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_measurement_units_tenant_code ON measurement_units (tenant_id, code)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_measurement_units_tenant_name ON measurement_units (tenant_id, name) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_measurement_units_set_tenant
    BEFORE INSERT ON measurement_units
    FOR EACH ROW EXECUTE FUNCTION app_set_tenant_id();

ALTER TABLE measurement_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_units FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON measurement_units
    FOR ALL
    USING (app_tenant_match(tenant_id))
    WITH CHECK (app_tenant_match(tenant_id));

INSERT INTO measurement_units (tenant_id, code, name)
SELECT t.id, v.code, v.name
FROM tenants t
CROSS JOIN (
    VALUES
        ('PCS', 'Cái'),
        ('HOP', 'Hộp'),
        ('THUNG', 'Thùng'),
        ('KG', 'Kilogram'),
        ('L', 'Lít'),
        ('GOI', 'Gói'),
        ('CHAI', 'Chai')
) AS v(code, name)
WHERE NOT EXISTS (
    SELECT 1
    FROM measurement_units mu
    WHERE mu.tenant_id = t.id
      AND mu.code = v.code
      AND mu.deleted_at IS NULL
);
