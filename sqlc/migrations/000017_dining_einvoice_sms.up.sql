ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);

CREATE TYPE dining_table_status AS ENUM ('available', 'occupied', 'reserved', 'dirty');

CREATE TYPE kitchen_ticket_status AS ENUM ('pending', 'preparing', 'ready', 'served');

CREATE TABLE dining_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(120) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dining_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    area_id UUID NOT NULL REFERENCES dining_areas(id) ON DELETE CASCADE,
    name VARCHAR(60) NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    status dining_table_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, area_id, name)
);

CREATE INDEX idx_dining_tables_tenant_status ON dining_tables (tenant_id, status);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS dining_table_id UUID REFERENCES dining_tables(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS kitchen_status kitchen_ticket_status NOT NULL DEFAULT 'pending';

CREATE INDEX idx_orders_kitchen ON orders (tenant_id, kitchen_status) WHERE status <> 'cancelled';

CREATE TABLE e_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    invoice_no VARCHAR(64) NOT NULL,
    buyer_name VARCHAR(255),
    buyer_tax_code VARCHAR(32),
    total_amount BIGINT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(24) NOT NULL DEFAULT 'issued',
    payload_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_e_invoices_tenant_no ON e_invoices (tenant_id, invoice_no);

ALTER TABLE supplier_debt_payments
    ADD COLUMN IF NOT EXISTS cash_transaction_id UUID REFERENCES cash_transactions(id) ON DELETE SET NULL;

CREATE TRIGGER trg_dining_areas_set_tenant BEFORE INSERT ON dining_areas
    FOR EACH ROW EXECUTE FUNCTION app_set_tenant_id();
CREATE TRIGGER trg_dining_tables_set_tenant BEFORE INSERT ON dining_tables
    FOR EACH ROW EXECUTE FUNCTION app_set_tenant_id();
CREATE TRIGGER trg_e_invoices_set_tenant BEFORE INSERT ON e_invoices
    FOR EACH ROW EXECUTE FUNCTION app_set_tenant_id();

ALTER TABLE dining_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_areas FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON dining_areas FOR ALL USING (app_tenant_match(tenant_id)) WITH CHECK (app_tenant_match(tenant_id));

ALTER TABLE dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_tables FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON dining_tables FOR ALL USING (app_tenant_match(tenant_id)) WITH CHECK (app_tenant_match(tenant_id));

ALTER TABLE e_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON e_invoices FOR ALL USING (app_tenant_match(tenant_id)) WITH CHECK (app_tenant_match(tenant_id));

INSERT INTO dining_areas (tenant_id, name, sort_order)
SELECT t.id, 'Khu chính', 0
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM dining_areas da WHERE da.tenant_id = t.id
);