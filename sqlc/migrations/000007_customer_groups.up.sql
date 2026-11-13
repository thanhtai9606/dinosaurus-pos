CREATE TABLE customer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_customer_groups_tenant_code ON customer_groups (tenant_id, code)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_groups_tenant_name ON customer_groups (tenant_id, name) WHERE deleted_at IS NULL;

ALTER TABLE customers
    ADD COLUMN customer_group_id UUID REFERENCES customer_groups(id) ON DELETE SET NULL;

CREATE INDEX idx_customers_customer_group ON customers (customer_group_id)
    WHERE deleted_at IS NULL AND customer_group_id IS NOT NULL;

CREATE TRIGGER trg_customer_groups_set_tenant
    BEFORE INSERT ON customer_groups
    FOR EACH ROW EXECUTE FUNCTION app_set_tenant_id();

ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_groups FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON customer_groups
    FOR ALL
    USING (app_tenant_match(tenant_id))
    WITH CHECK (app_tenant_match(tenant_id));

INSERT INTO customer_groups (tenant_id, code, name, description)
SELECT t.id, v.code, v.name, v.description
FROM tenants t
CROSS JOIN (
    VALUES
        ('RETAIL', 'Khách lẻ', 'Khách mua lẻ'),
        ('WHOLESALE', 'Khách sỉ', 'Khách mua sỉ')
) AS v(code, name, description)
WHERE NOT EXISTS (
    SELECT 1
    FROM customer_groups cg
    WHERE cg.tenant_id = t.id
      AND cg.code = v.code
      AND cg.deleted_at IS NULL
);
