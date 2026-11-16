-- Multi-warehouse foundation + stock operation documents

CREATE TABLE warehouses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    code        VARCHAR(32) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    is_default  BOOLEAN NOT NULL DEFAULT false,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT warehouses_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_warehouses_tenant ON warehouses (tenant_id);

CREATE TABLE warehouse_stock (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses (id) ON DELETE RESTRICT,
    product_id   UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    quantity     INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_stock    INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT warehouse_stock_wh_product UNIQUE (warehouse_id, product_id)
);

CREATE INDEX idx_warehouse_stock_product ON warehouse_stock (product_id);
CREATE INDEX idx_warehouse_stock_warehouse ON warehouse_stock (warehouse_id);

ALTER TYPE stock_change_type ADD VALUE IF NOT EXISTS 'transfer_out';
ALTER TYPE stock_change_type ADD VALUE IF NOT EXISTS 'transfer_in';
ALTER TYPE stock_change_type ADD VALUE IF NOT EXISTS 'count';

ALTER TABLE stock_history
    ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses (id) ON DELETE SET NULL;

CREATE INDEX idx_stock_history_warehouse ON stock_history (warehouse_id);

ALTER TABLE stock_receipts
    ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses (id) ON DELETE RESTRICT;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS fulfillment_warehouse_id UUID REFERENCES warehouses (id) ON DELETE SET NULL;

CREATE TYPE stock_doc_status AS ENUM ('draft', 'completed', 'cancelled');

CREATE TABLE stock_adjustments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    doc_no        VARCHAR(32) NOT NULL,
    warehouse_id  UUID NOT NULL REFERENCES warehouses (id) ON DELETE RESTRICT,
    status        stock_doc_status NOT NULL DEFAULT 'draft',
    reason        stock_change_type NOT NULL DEFAULT 'correction',
    note          TEXT,
    created_by    UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at  TIMESTAMPTZ,
    CONSTRAINT stock_adjustments_tenant_doc UNIQUE (tenant_id, doc_no)
);

CREATE TABLE stock_adjustment_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_id   UUID NOT NULL REFERENCES stock_adjustments (id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    quantity_delta  INTEGER NOT NULL,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stock_transfers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    doc_no          VARCHAR(32) NOT NULL,
    from_warehouse_id UUID NOT NULL REFERENCES warehouses (id) ON DELETE RESTRICT,
    to_warehouse_id   UUID NOT NULL REFERENCES warehouses (id) ON DELETE RESTRICT,
    status          stock_doc_status NOT NULL DEFAULT 'draft',
    note            TEXT,
    created_by      UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    CONSTRAINT stock_transfers_tenant_doc UNIQUE (tenant_id, doc_no),
 
    CHECK (from_warehouse_id <> to_warehouse_id)
);

CREATE TABLE stock_transfer_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id  UUID NOT NULL REFERENCES stock_transfers (id) ON DELETE CASCADE,
    product_id   UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE stock_take_status AS ENUM ('draft', 'counting', 'posted', 'cancelled');

CREATE TABLE stock_takes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    doc_no        VARCHAR(32) NOT NULL,
    warehouse_id  UUID NOT NULL REFERENCES warehouses (id) ON DELETE RESTRICT,
    status        stock_take_status NOT NULL DEFAULT 'draft',
    note          TEXT,
    created_by    UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    posted_at     TIMESTAMPTZ,
    CONSTRAINT stock_takes_tenant_doc UNIQUE (tenant_id, doc_no)
);

CREATE TABLE stock_take_items (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_take_id  UUID NOT NULL REFERENCES stock_takes (id) ON DELETE CASCADE,
    product_id     UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    system_qty     INTEGER NOT NULL DEFAULT 0,
    counted_qty    INTEGER,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default warehouse per tenant + seed balances from products.stock
INSERT INTO warehouses (tenant_id, code, name, is_default, is_active)
SELECT t.id, 'MAIN', 'Main warehouse', true, true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM warehouses w WHERE w.tenant_id = t.id AND w.is_default = true
);

INSERT INTO warehouse_stock (tenant_id, warehouse_id, product_id, quantity, min_stock)
SELECT p.tenant_id, w.id, p.id, p.stock, p.min_stock
FROM products p
JOIN warehouses w ON w.tenant_id = p.tenant_id AND w.is_default = true
WHERE p.deleted_at IS NULL
ON CONFLICT (warehouse_id, product_id) DO NOTHING;

UPDATE stock_receipts sr
SET warehouse_id = w.id
FROM warehouses w
WHERE sr.tenant_id = w.tenant_id AND w.is_default = true AND sr.warehouse_id IS NULL;

UPDATE stock_history sh
SET warehouse_id = w.id
FROM products p
JOIN warehouses w ON w.tenant_id = p.tenant_id AND w.is_default = true
WHERE sh.product_id = p.id AND sh.warehouse_id IS NULL;