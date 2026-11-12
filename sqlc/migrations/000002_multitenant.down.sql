-- Revert multi-tenant (destructive: drops RLS and tenant columns)

DROP POLICY IF EXISTS customer_debt_payments_tenant ON customer_debt_payments;
ALTER TABLE customer_debt_payments DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_debt_payments_tenant ON supplier_debt_payments;
ALTER TABLE supplier_debt_payments DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_history_tenant ON stock_history;
ALTER TABLE stock_history DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cash_transactions_tenant ON cash_transactions;
ALTER TABLE cash_transactions DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_receipt_items_tenant ON stock_receipt_items;
ALTER TABLE stock_receipt_items DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promotion_targets_tenant ON promotion_targets;
ALTER TABLE promotion_targets DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promotion_rules_tenant ON promotion_rules;
ALTER TABLE promotion_rules DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_categories_tenant ON product_categories;
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_units_tenant ON product_units;
ALTER TABLE product_units DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_options_tenant ON product_options;
ALTER TABLE product_options DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_item_options_tenant ON order_item_options;
ALTER TABLE order_item_options DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_items_tenant ON order_items;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

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
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_set_tenant ON %I', tbl, tbl);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS tenant_id', tbl);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS app_set_tenant_id();
DROP FUNCTION IF EXISTS app_tenant_match(uuid);

DROP TABLE IF EXISTS tenant_users;
DROP TABLE IF EXISTS tenants;
