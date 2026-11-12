-- Squashed baseline schema (fresh install). Replaces migrations 000001–000028.
-- Generated: 2026-11-12T15:44:23+07:00


-- >>> 000001_init.up.sql
-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'manager');
CREATE TYPE order_type AS ENUM ('dine_in', 'takeaway');
CREATE TYPE order_status AS ENUM ('open', 'in_progress', 'served', 'paid', 'cancelled');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');
CREATE TYPE promotion_scope AS ENUM ('ORDER', 'ITEM');
CREATE TYPE promotion_target_type AS ENUM ('PRODUCT', 'CATEGORY');
CREATE TYPE promotion_rule_type AS ENUM (
  'MINIMUM_ORDER_AMOUNT',
  'REQUIRED_PRODUCT',
  'REQUIRED_CATEGORY',
  'ALLOWED_PAYMENT_METHOD',
  'ALLOWED_ORDER_TYPE'
);
CREATE TYPE log_action_type AS ENUM (
  'CREATE', 'UPDATE', 'DELETE', 'CANCEL', 'APPLY_PROMOTION', 'PROCESS_PAYMENT'
);
CREATE TYPE log_entity_type AS ENUM (
  'PRODUCT', 'CATEGORY', 'PROMOTION', 'ORDER', 'USER'
);

-- TABLES
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  avatar TEXT,
  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_options (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  additional_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (additional_price >= 0),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cancellation_reasons (
  id SERIAL PRIMARY KEY,
  reason VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE promotions (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scope promotion_scope NOT NULL DEFAULT 'ORDER',
  discount_type discount_type NOT NULL,
  discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value >= 0),
  max_discount_amount NUMERIC(12,2) CHECK (max_discount_amount >= 0),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE promotion_rules (
  id UUID PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  rule_type promotion_rule_type NOT NULL,
  rule_value VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE promotion_targets (
  id UUID PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  target_type promotion_target_type NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type order_type NOT NULL DEFAULT 'dine_in',
  status order_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gross_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (gross_total >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  net_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (net_total >= 0),
  applied_promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  payment_method_id INTEGER REFERENCES payment_methods(id),
  payment_gateway_reference VARCHAR(255),
  cash_received NUMERIC(12,2) CHECK (cash_received >= 0),
  change_due NUMERIC(12,2) CHECK (change_due >= 0),
  cancellation_reason_id INTEGER REFERENCES cancellation_reasons(id) ON DELETE SET NULL,
  cancellation_notes TEXT
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_sale NUMERIC(12,2) NOT NULL CHECK (price_at_sale >= 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  net_subtotal NUMERIC(12,2) NOT NULL CHECK (net_subtotal >= 0)
);

CREATE TABLE order_item_options (
  id UUID PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  product_option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE RESTRICT,
  price_at_sale NUMERIC(12,2) NOT NULL CHECK (price_at_sale >= 0)
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type log_action_type NOT NULL,
  entity_type log_entity_type NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_payment_gateway_reference ON orders(payment_gateway_reference);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);


-- Automatically update updated_at on row update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'updated_at'
      AND table_schema = 'public'
  LOOP
    EXECUTE format('
      CREATE TRIGGER %I_set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    ', tbl, tbl);
  END LOOP;
END;
$$;

-- Default UUID generation for id columns
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE products ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE product_options ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE promotions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE promotion_rules ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE promotion_targets ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE orders ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE order_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE order_item_options ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE activity_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;-- <<< 000001_init.up.sql

-- >>> 000002_enum_user_order.up.sql
CREATE TYPE user_order_column AS ENUM ('created_at', 'username', 'email');-- <<< 000002_enum_user_order.up.sql

-- >>> 000003_enum_sort_order.up.sql
CREATE TYPE sort_order AS ENUM ('asc', 'desc');-- <<< 000003_enum_sort_order.up.sql

-- >>> 000004_alter_enum_log_action_type.up.sql
ALTER TYPE log_action_type ADD VALUE 'REGISTER';
ALTER TYPE log_action_type ADD VALUE 'UPDATE_PASSWORD';
ALTER TYPE log_action_type ADD VALUE 'UPDATE_AVATAR';
ALTER TYPE log_action_type ADD VALUE 'LOGIN_SUCCESS';
ALTER TYPE log_action_type ADD VALUE 'LOGIN_FAILED';
-- <<< 000004_alter_enum_log_action_type.up.sql

-- >>> 000005_alter_products_add_deleted_at.up.sql
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ NULL;-- <<< 000005_alter_products_add_deleted_at.up.sql

-- >>> 000006_alter_product_options_add_delete_at.up.sql
ALTER TABLE product_options ADD COLUMN deleted_at TIMESTAMPTZ NULL;-- <<< 000006_alter_product_options_add_delete_at.up.sql

-- >>> 000007_add_deleted_at_to_users.up.sql
-- Menambahkan kolom deleted_at ke tabel users untuk implementasi soft delete.
-- Kolom ini akan NULL secara default, yang berarti pengguna tersebut aktif.
ALTER TABLE users
    ADD COLUMN deleted_at TIMESTAMPTZ NULL;
-- <<< 000007_add_deleted_at_to_users.up.sql

-- >>> 000008_alter_table_order_discount.up.sql
ALTER TABLE orders ALTER COLUMN discount_amount SET DEFAULT 0;-- <<< 000008_alter_table_order_discount.up.sql

-- >>> 000009_alter_price.up.sql
-- Ubah tipe data di tabel products
ALTER TABLE products
    ALTER COLUMN price TYPE bigint USING price::bigint;

-- Ubah tipe data di tabel orders
ALTER TABLE orders
    ALTER COLUMN gross_total TYPE bigint USING gross_total::bigint,
    ALTER COLUMN discount_amount TYPE bigint USING discount_amount::bigint,
    ALTER COLUMN net_total TYPE bigint USING net_total::bigint,
    ALTER COLUMN cash_received TYPE bigint USING cash_received::bigint,
    ALTER COLUMN change_due TYPE bigint USING change_due::bigint;

-- Ubah tipe data di tabel order_items
ALTER TABLE order_items
    ALTER COLUMN price_at_sale TYPE bigint USING price_at_sale::bigint,
    ALTER COLUMN subtotal TYPE bigint USING subtotal::bigint,
    ALTER COLUMN net_subtotal TYPE bigint USING net_subtotal::bigint,
    ALTER COLUMN discount_amount TYPE bigint USING discount_amount::bigint;

-- Ubah tipe data di tabel product_options
ALTER TABLE product_options
    ALTER COLUMN additional_price TYPE bigint USING additional_price::bigint;

-- Ubah tipe data di tabel order_item_options
ALTER TABLE order_item_options
    ALTER COLUMN price_at_sale TYPE bigint USING price_at_sale::bigint;-- <<< 000009_alter_price.up.sql

-- >>> 000010_add_refresh_token_to_users.up.sql
ALTER TABLE users ADD COLUMN refresh_token TEXT;
-- <<< 000010_add_refresh_token_to_users.up.sql

-- >>> 000011_add_deleted_at_to_promotions.up.sql
ALTER TABLE promotions
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
-- <<< 000011_add_deleted_at_to_promotions.up.sql

-- >>> 000012_alter_orders_add_payment_url.up.sql
ALTER TABLE orders ADD COLUMN payment_url TEXT;
ALTER TABLE orders ADD COLUMN payment_token TEXT;
-- <<< 000012_alter_orders_add_payment_url.up.sql

-- >>> 000013_create_settings_table.up.sql
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default values
INSERT INTO settings (key, value, description) VALUES
('app_name', 'POS Kasir', 'Application Name displayed in sidebar and titles'),
('app_logo', '', 'URL or path to the application logo image'),
('footer_text', '© 2024 POS Kasir. All rights reserved.', 'Text displayed in the footer'),
('theme_color', '#000000', 'Primary theme color (hex code)');
-- <<< 000013_create_settings_table.up.sql

-- >>> 000014_create_shifts_and_cash_transactions_tables.up.sql
CREATE TYPE shift_status AS ENUM ('open', 'closed');

CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    start_cash BIGINT NOT NULL DEFAULT 0,
    expected_cash_end BIGINT,
    actual_cash_end BIGINT,
    status shift_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure a user can have only one open shift at a time
CREATE UNIQUE INDEX idx_shifts_user_open ON shifts (user_id) WHERE status = 'open';

CREATE TYPE cash_transaction_type AS ENUM ('cash_in', 'cash_out');

CREATE TABLE cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES shifts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    amount BIGINT NOT NULL,
    type cash_transaction_type NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., "expense", "drop", "float"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
-- <<< 000014_create_shifts_and_cash_transactions_tables.up.sql

-- >>> 000015_create_stock_history_table.up.sql
CREATE TYPE stock_change_type AS ENUM ('sale', 'restock', 'correction', 'return', 'damage');

CREATE TABLE stock_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    change_amount INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    current_stock INTEGER NOT NULL,
    change_type stock_change_type NOT NULL,
    reference_id UUID,
    note TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX idx_stock_history_created_at ON stock_history(created_at);
-- <<< 000015_create_stock_history_table.up.sql

-- >>> 000016_add_cost_price.up.sql
-- Add cost_price to products
ALTER TABLE products
ADD COLUMN cost_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0);

-- Add cost_price_at_sale to order_items to track historical cost
ALTER TABLE order_items
ADD COLUMN cost_price_at_sale NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_price_at_sale >= 0);
-- <<< 000016_add_cost_price.up.sql

-- >>> 000017_update_activity_log_enums.up.sql
-- Add RESTORE to log_action_type
ALTER TYPE log_action_type ADD VALUE 'RESTORE';

-- Add new entities to log_entity_type
ALTER TYPE log_entity_type ADD VALUE 'SETTINGS';
ALTER TYPE log_entity_type ADD VALUE 'SHIFT';
ALTER TYPE log_entity_type ADD VALUE 'PAYMENT_METHOD';
ALTER TYPE log_entity_type ADD VALUE 'CANCELLATION_REASON';
-- <<< 000017_update_activity_log_enums.up.sql

-- >>> 000018_add_order_version.up.sql
ALTER TABLE orders ADD COLUMN version INT NOT NULL DEFAULT 1;
-- <<< 000018_add_order_version.up.sql

-- >>> 000019_add_tax_and_service_charge.up.sql
ALTER TABLE orders ADD COLUMN tax_amount BIGINT NOT NULL DEFAULT 0 CHECK (tax_amount >= 0);
ALTER TABLE orders ADD COLUMN service_charge_amount BIGINT NOT NULL DEFAULT 0 CHECK (service_charge_amount >= 0);
-- <<< 000019_add_tax_and_service_charge.up.sql

-- >>> 000020_create_customers_table.up.sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
-- <<< 000020_create_customers_table.up.sql

-- >>> 000021_product_categories_many_to_many.up.sql
CREATE TABLE product_categories (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (product_id, category_id)
);

-- Migrate existing data
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id FROM products WHERE category_id IS NOT NULL;

-- Drop the old column
ALTER TABLE products DROP COLUMN category_id;
-- <<< 000021_product_categories_many_to_many.up.sql

-- >>> 000022_financial_invoice_settings.up.sql
INSERT INTO settings (key, value, description) VALUES
('currency', 'IDR', 'Default currency code for display and receipts'),
('tax_rate', '11', 'Tax rate percentage applied to order subtotal (e.g. 11 for 11%)'),
('service_charge_rate', '0', 'Service charge percentage applied to order subtotal'),
('tax_enabled', 'true', 'Whether tax is applied when creating orders'),
('receipt_header', '', 'Optional message printed at the top of receipts/invoices'),
('receipt_footer', 'Terima kasih atas kunjungan Anda.', 'Message printed at the bottom of receipts/invoices'),
('invoice_prefix', 'INV', 'Optional prefix shown before order/queue number on receipts'),
('show_tax_on_receipt', 'true', 'Show tax and service charge breakdown on printed receipts'),
('invoice_legal_text', '', 'Legal/business info on invoice (NPWP, address, etc.)')
ON CONFLICT (key) DO NOTHING;
-- <<< 000022_financial_invoice_settings.up.sql

-- >>> 000023_supported_currencies.up.sql
INSERT INTO settings (key, value, description) VALUES
(
  'supported_currencies',
  '[{"code":"IDR","label":"IDR (Rp)","locale":"id-ID","fraction_digits":0},{"code":"VND","label":"VND (₫)","locale":"vi-VN","fraction_digits":0},{"code":"USD","label":"USD ($)","locale":"en-US","fraction_digits":2}]',
  'JSON array of enabled currencies for POS display and financial settings (code, label, locale, fraction_digits)'
)
ON CONFLICT (key) DO NOTHING;
-- <<< 000023_supported_currencies.up.sql

-- >>> 000024_suppliers_stock_receipts_product_inventory.up.sql
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
-- <<< 000024_suppliers_stock_receipts_product_inventory.up.sql

-- >>> 000025_stock_receipt_sell_price.up.sql
ALTER TABLE stock_receipt_items
    ADD COLUMN unit_sell_price NUMERIC(12, 2) CHECK (unit_sell_price IS NULL OR unit_sell_price >= 0);
-- <<< 000025_stock_receipt_sell_price.up.sql

-- >>> 000026_product_units.up.sql
CREATE TABLE product_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    is_base BOOLEAN NOT NULL DEFAULT FALSE,
    factor_to_base NUMERIC(12, 4) NOT NULL CHECK (factor_to_base > 0),
    sell_price BIGINT NOT NULL CHECK (sell_price >= 0),
    barcode VARCHAR(100),
    sku VARCHAR(50),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX product_units_one_base_per_product
    ON product_units (product_id)
    WHERE is_base = TRUE AND deleted_at IS NULL;

CREATE UNIQUE INDEX product_units_barcode_unique
    ON product_units (barcode)
    WHERE barcode IS NOT NULL AND barcode <> '' AND deleted_at IS NULL;

CREATE INDEX product_units_product_id_idx ON product_units (product_id) WHERE deleted_at IS NULL;

INSERT INTO product_units (product_id, name, is_base, factor_to_base, sell_price, barcode, sku, sort_order)
SELECT
    p.id,
    COALESCE(NULLIF(TRIM(p.unit), ''), 'pcs'),
    TRUE,
    1,
    p.price,
    p.barcode,
    p.sku,
    0
FROM products p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM product_units pu WHERE pu.product_id = p.id AND pu.deleted_at IS NULL
  );

ALTER TABLE order_items
    ADD COLUMN product_unit_id UUID REFERENCES product_units(id),
    ADD COLUMN sale_unit_name VARCHAR(50),
    ADD COLUMN factor_to_base NUMERIC(12, 4) NOT NULL DEFAULT 1;
-- <<< 000026_product_units.up.sql

-- >>> 000027_debt_ledgers.up.sql
CREATE TYPE debt_status AS ENUM ('open', 'partial', 'settled', 'void');

CREATE TYPE stock_receipt_payment_mode AS ENUM ('cash', 'credit');

ALTER TABLE stock_receipts
    ADD COLUMN payment_mode stock_receipt_payment_mode NOT NULL DEFAULT 'cash',
    ADD COLUMN amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0);

CREATE TABLE supplier_debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers (id) ON DELETE RESTRICT,
    stock_receipt_id UUID UNIQUE REFERENCES stock_receipts (id) ON DELETE RESTRICT,
    reference_no VARCHAR(64) NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    status debt_status NOT NULL DEFAULT 'open',
    note TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT supplier_debts_paid_lte_total CHECK (amount_paid <= total_amount)
);

CREATE INDEX idx_supplier_debts_supplier_id ON supplier_debts (supplier_id);
CREATE INDEX idx_supplier_debts_status ON supplier_debts (status);
CREATE INDEX idx_supplier_debts_issued_at ON supplier_debts (issued_at);

CREATE TABLE supplier_debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_debt_id UUID NOT NULL REFERENCES supplier_debts (id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    note TEXT,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_debt_payments_debt_id ON supplier_debt_payments (supplier_debt_id);

CREATE TABLE customer_debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
    order_id UUID UNIQUE REFERENCES orders (id) ON DELETE RESTRICT,
    reference_no VARCHAR(64) NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    status debt_status NOT NULL DEFAULT 'open',
    note TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT customer_debts_paid_lte_total CHECK (amount_paid <= total_amount)
);

CREATE INDEX idx_customer_debts_customer_id ON customer_debts (customer_id);
CREATE INDEX idx_customer_debts_status ON customer_debts (status);
CREATE INDEX idx_customer_debts_issued_at ON customer_debts (issued_at);

CREATE TABLE customer_debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_debt_id UUID NOT NULL REFERENCES customer_debts (id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    note TEXT,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_debt_payments_debt_id ON customer_debt_payments (customer_debt_id);
-- <<< 000027_debt_ledgers.up.sql

-- >>> 000028_business_document_codes.up.sql
-- Human-readable document codes (UUID remains primary key).

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_no VARCHAR(32);

WITH daily AS (
    SELECT
        id,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY (created_at AT TIME ZONE 'UTC')::date
            ORDER BY created_at
        ) AS rn
    FROM orders
    WHERE order_no IS NULL
)
UPDATE orders o
SET order_no = 'SO-' || TO_CHAR(d.created_at AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' || LPAD(d.rn::text, 4, '0')
FROM daily d
WHERE o.id = d.id;

ALTER TABLE orders
    ALTER COLUMN order_no SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_no ON orders (order_no);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS code VARCHAR(32);

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
    FROM customers
    WHERE code IS NULL
)
UPDATE customers c
SET code = 'CUS-' || LPAD(r.rn::text, 6, '0')
FROM ranked r
WHERE c.id = r.id;

ALTER TABLE customers
    ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_code ON customers (code) WHERE deleted_at IS NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS code VARCHAR(32);

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
    FROM products
    WHERE deleted_at IS NULL AND code IS NULL
)
UPDATE products p
SET code = 'P-' || LPAD(r.rn::text, 6, '0')
FROM ranked r
WHERE p.id = r.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code ON products (code) WHERE deleted_at IS NULL AND code IS NOT NULL;
-- <<< 000028_business_document_codes.up.sql
