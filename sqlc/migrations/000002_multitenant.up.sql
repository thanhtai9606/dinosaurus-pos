-- Multi-tenant: tenants, memberships, tenant_id on business data, RLS.

CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenant_users (
  tenant_id UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

INSERT INTO tenants (id, code, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'default', 'Default Store');

-- Root business tables
ALTER TABLE categories ADD COLUMN tenant_id UUID;
ALTER TABLE products ADD COLUMN tenant_id UUID;
ALTER TABLE customers ADD COLUMN tenant_id UUID;
ALTER TABLE suppliers ADD COLUMN tenant_id UUID;
ALTER TABLE orders ADD COLUMN tenant_id UUID;
ALTER TABLE stock_receipts ADD COLUMN tenant_id UUID;
ALTER TABLE promotions ADD COLUMN tenant_id UUID;
ALTER TABLE shifts ADD COLUMN tenant_id UUID;
ALTER TABLE payment_methods ADD COLUMN tenant_id UUID;
ALTER TABLE cancellation_reasons ADD COLUMN tenant_id UUID;
ALTER TABLE settings ADD COLUMN tenant_id UUID;
ALTER TABLE settings DROP CONSTRAINT settings_pkey;
ALTER TABLE activity_logs ADD COLUMN tenant_id UUID;
ALTER TABLE supplier_debts ADD COLUMN tenant_id UUID;
ALTER TABLE customer_debts ADD COLUMN tenant_id UUID;

UPDATE categories SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE products SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE customers SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE suppliers SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE orders SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE stock_receipts SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE promotions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE shifts SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE payment_methods SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE cancellation_reasons SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE settings SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE settings ADD PRIMARY KEY (tenant_id, key);
UPDATE activity_logs SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE supplier_debts SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE customer_debts SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

ALTER TABLE categories ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE customers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE suppliers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE orders ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE stock_receipts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE promotions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE shifts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE payment_methods ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE cancellation_reasons ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE activity_logs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE supplier_debts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE customer_debts ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE categories ADD CONSTRAINT categories_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE products ADD CONSTRAINT products_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE customers ADD CONSTRAINT customers_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE suppliers ADD CONSTRAINT suppliers_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE orders ADD CONSTRAINT orders_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE stock_receipts ADD CONSTRAINT stock_receipts_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE promotions ADD CONSTRAINT promotions_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE shifts ADD CONSTRAINT shifts_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE cancellation_reasons ADD CONSTRAINT cancellation_reasons_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE settings ADD CONSTRAINT settings_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE supplier_debts ADD CONSTRAINT supplier_debts_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;
ALTER TABLE customer_debts ADD CONSTRAINT customer_debts_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT;

INSERT INTO tenant_users (tenant_id, user_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM users
ON CONFLICT DO NOTHING;

-- Per-tenant uniqueness
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
CREATE UNIQUE INDEX idx_categories_tenant_name ON categories (tenant_id, name);

DROP INDEX IF EXISTS idx_orders_order_no;
CREATE UNIQUE INDEX idx_orders_tenant_order_no ON orders (tenant_id, order_no);

DROP INDEX IF EXISTS idx_customers_code;
CREATE UNIQUE INDEX idx_customers_tenant_code ON customers (tenant_id, code) WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_products_code;
CREATE UNIQUE INDEX idx_products_tenant_code ON products (tenant_id, code) WHERE deleted_at IS NULL AND code IS NOT NULL;

DROP INDEX IF EXISTS idx_products_sku_active;
CREATE UNIQUE INDEX idx_products_tenant_sku_active ON products (tenant_id, sku) WHERE deleted_at IS NULL AND sku IS NOT NULL;

ALTER TABLE payment_methods DROP CONSTRAINT IF EXISTS payment_methods_name_key;
CREATE UNIQUE INDEX idx_payment_methods_tenant_name ON payment_methods (tenant_id, name);

ALTER TABLE cancellation_reasons DROP CONSTRAINT IF EXISTS cancellation_reasons_reason_key;
CREATE UNIQUE INDEX idx_cancellation_reasons_tenant_reason ON cancellation_reasons (tenant_id, reason);

ALTER TABLE stock_receipts DROP CONSTRAINT IF EXISTS stock_receipts_receipt_no_key;
CREATE UNIQUE INDEX idx_stock_receipts_tenant_receipt_no ON stock_receipts (tenant_id, receipt_no);

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_key;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;
CREATE UNIQUE INDEX idx_customers_tenant_phone ON customers (tenant_id, phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_customers_tenant_email ON customers (tenant_id, email) WHERE email IS NOT NULL AND deleted_at IS NULL;

DROP INDEX IF EXISTS suppliers_code_key;
CREATE UNIQUE INDEX idx_suppliers_tenant_code ON suppliers (tenant_id, code) WHERE code IS NOT NULL;

DROP INDEX IF EXISTS idx_shifts_user_open;
CREATE UNIQUE INDEX idx_shifts_tenant_user_open ON shifts (tenant_id, user_id) WHERE status = 'open';

-- Tenant from session on insert
CREATE OR REPLACE FUNCTION app_set_tenant_id() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
  END IF;
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id is required';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'categories','products','customers','suppliers','orders','stock_receipts',
    'promotions','shifts','payment_methods','cancellation_reasons','settings',
    'activity_logs','supplier_debts','customer_debts'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_set_tenant BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION app_set_tenant_id()',
      tbl, tbl
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION app_tenant_match(tid uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT tid IS NOT NULL
    AND tid = NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

-- RLS on roots
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'categories','products','customers','suppliers','orders','stock_receipts',
    'promotions','shifts','payment_methods','cancellation_reasons','settings',
    'activity_logs','supplier_debts','customer_debts'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I FOR ALL USING (app_tenant_match(tenant_id)) WITH CHECK (app_tenant_match(tenant_id))',
      tbl
    );
  END LOOP;
END $$;

-- Child tables via parent tenant
CREATE POLICY order_items_tenant ON order_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND app_tenant_match(o.tenant_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND app_tenant_match(o.tenant_id)
  ));
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;

CREATE POLICY order_item_options_tenant ON order_item_options FOR ALL
  USING (EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_options.order_item_id AND app_tenant_match(o.tenant_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_options.order_item_id AND app_tenant_match(o.tenant_id)
  ));
ALTER TABLE order_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_options FORCE ROW LEVEL SECURITY;

CREATE POLICY product_options_tenant ON product_options FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_options.product_id AND app_tenant_match(p.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_options.product_id AND app_tenant_match(p.tenant_id)));
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options FORCE ROW LEVEL SECURITY;

CREATE POLICY product_units_tenant ON product_units FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_units.product_id AND app_tenant_match(p.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_units.product_id AND app_tenant_match(p.tenant_id)));
ALTER TABLE product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_units FORCE ROW LEVEL SECURITY;

CREATE POLICY product_categories_tenant ON product_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_categories.product_id AND app_tenant_match(p.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_categories.product_id AND app_tenant_match(p.tenant_id)));
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories FORCE ROW LEVEL SECURITY;

CREATE POLICY promotion_rules_tenant ON promotion_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM promotions p WHERE p.id = promotion_rules.promotion_id AND app_tenant_match(p.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM promotions p WHERE p.id = promotion_rules.promotion_id AND app_tenant_match(p.tenant_id)));
ALTER TABLE promotion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_rules FORCE ROW LEVEL SECURITY;

CREATE POLICY promotion_targets_tenant ON promotion_targets FOR ALL
  USING (EXISTS (SELECT 1 FROM promotions p WHERE p.id = promotion_targets.promotion_id AND app_tenant_match(p.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM promotions p WHERE p.id = promotion_targets.promotion_id AND app_tenant_match(p.tenant_id)));
ALTER TABLE promotion_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_targets FORCE ROW LEVEL SECURITY;

CREATE POLICY stock_receipt_items_tenant ON stock_receipt_items FOR ALL
  USING (EXISTS (SELECT 1 FROM stock_receipts sr WHERE sr.id = stock_receipt_items.stock_receipt_id AND app_tenant_match(sr.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM stock_receipts sr WHERE sr.id = stock_receipt_items.stock_receipt_id AND app_tenant_match(sr.tenant_id)));
ALTER TABLE stock_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_receipt_items FORCE ROW LEVEL SECURITY;

CREATE POLICY cash_transactions_tenant ON cash_transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM shifts s WHERE s.id = cash_transactions.shift_id AND app_tenant_match(s.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM shifts s WHERE s.id = cash_transactions.shift_id AND app_tenant_match(s.tenant_id)));
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions FORCE ROW LEVEL SECURITY;

CREATE POLICY stock_history_tenant ON stock_history FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = stock_history.product_id AND app_tenant_match(p.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = stock_history.product_id AND app_tenant_match(p.tenant_id)));
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history FORCE ROW LEVEL SECURITY;

CREATE POLICY supplier_debt_payments_tenant ON supplier_debt_payments FOR ALL
  USING (EXISTS (SELECT 1 FROM supplier_debts d WHERE d.id = supplier_debt_payments.supplier_debt_id AND app_tenant_match(d.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM supplier_debts d WHERE d.id = supplier_debt_payments.supplier_debt_id AND app_tenant_match(d.tenant_id)));
ALTER TABLE supplier_debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_debt_payments FORCE ROW LEVEL SECURITY;

CREATE POLICY customer_debt_payments_tenant ON customer_debt_payments FOR ALL
  USING (EXISTS (SELECT 1 FROM customer_debts d WHERE d.id = customer_debt_payments.customer_debt_id AND app_tenant_match(d.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM customer_debts d WHERE d.id = customer_debt_payments.customer_debt_id AND app_tenant_match(d.tenant_id)));
ALTER TABLE customer_debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_debt_payments FORCE ROW LEVEL SECURITY;
