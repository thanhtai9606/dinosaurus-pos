CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    address TEXT,
    tax_id VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_suppliers_name ON suppliers (name) WHERE deleted_at IS NULL;

CREATE TYPE stock_receipt_status AS ENUM ('draft', 'completed', 'cancelled');

CREATE TABLE stock_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no VARCHAR(32) NOT NULL UNIQUE,
    supplier_id UUID REFERENCES suppliers (id) ON DELETE SET NULL,
    status stock_receipt_status NOT NULL DEFAULT 'draft',
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    note TEXT,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_receipts_status ON stock_receipts (status);
CREATE INDEX idx_stock_receipts_supplier_id ON stock_receipts (supplier_id);
CREATE INDEX idx_stock_receipts_received_at ON stock_receipts (received_at);

CREATE TABLE stock_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES stock_receipts (id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
    line_total NUMERIC(14, 2) NOT NULL GENERATED ALWAYS AS (quantity::numeric * unit_cost) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_receipt_items_receipt_id ON stock_receipt_items (receipt_id);

ALTER TABLE products
    ADD COLUMN sku VARCHAR(50),
    ADD COLUMN barcode VARCHAR(100),
    ADD COLUMN unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
    ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    ADD COLUMN default_supplier_id UUID REFERENCES suppliers (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_products_sku_active ON products (sku) WHERE deleted_at IS NULL AND sku IS NOT NULL;
CREATE INDEX idx_products_default_supplier ON products (default_supplier_id);
