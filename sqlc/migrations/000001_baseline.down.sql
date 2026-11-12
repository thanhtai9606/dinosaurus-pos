-- Squashed rollback for baseline.

-- >>> 000028_business_document_codes.down.sql
DROP INDEX IF EXISTS idx_products_code;
ALTER TABLE products DROP COLUMN IF EXISTS code;

DROP INDEX IF EXISTS idx_customers_code;
ALTER TABLE customers DROP COLUMN IF EXISTS code;

DROP INDEX IF EXISTS idx_orders_order_no;
ALTER TABLE orders DROP COLUMN IF EXISTS order_no;
-- <<< 000028_business_document_codes.down.sql

-- >>> 000027_debt_ledgers.down.sql
DROP TABLE IF EXISTS customer_debt_payments;
DROP TABLE IF EXISTS customer_debts;
DROP TABLE IF EXISTS supplier_debt_payments;
DROP TABLE IF EXISTS supplier_debts;

ALTER TABLE stock_receipts
    DROP COLUMN IF EXISTS amount_paid,
    DROP COLUMN IF EXISTS payment_mode;

DROP TYPE IF EXISTS stock_receipt_payment_mode;
DROP TYPE IF EXISTS debt_status;
-- <<< 000027_debt_ledgers.down.sql

-- >>> 000026_product_units.down.sql
ALTER TABLE order_items
    DROP COLUMN IF EXISTS factor_to_base,
    DROP COLUMN IF EXISTS sale_unit_name,
    DROP COLUMN IF EXISTS product_unit_id;

DROP TABLE IF EXISTS product_units;
-- <<< 000026_product_units.down.sql

-- >>> 000025_stock_receipt_sell_price.down.sql
ALTER TABLE stock_receipt_items DROP COLUMN IF EXISTS unit_sell_price;
-- <<< 000025_stock_receipt_sell_price.down.sql

-- >>> 000024_suppliers_stock_receipts_product_inventory.down.sql
ALTER TABLE products
    DROP COLUMN IF EXISTS default_supplier_id,
    DROP COLUMN IF EXISTS min_stock,
    DROP COLUMN IF EXISTS unit,
    DROP COLUMN IF EXISTS barcode,
    DROP COLUMN IF EXISTS sku;

DROP TABLE IF EXISTS stock_receipt_items;
DROP TABLE IF EXISTS stock_receipts;
DROP TYPE IF EXISTS stock_receipt_status;
DROP TABLE IF EXISTS suppliers;
-- <<< 000024_suppliers_stock_receipts_product_inventory.down.sql

-- >>> 000023_supported_currencies.down.sql
DELETE FROM settings WHERE key = 'supported_currencies';
-- <<< 000023_supported_currencies.down.sql

-- >>> 000022_financial_invoice_settings.down.sql
DELETE FROM settings WHERE key IN (
    'currency',
    'tax_rate',
    'service_charge_rate',
    'tax_enabled',
    'receipt_header',
    'receipt_footer',
    'invoice_prefix',
    'show_tax_on_receipt',
    'invoice_legal_text'
);
-- <<< 000022_financial_invoice_settings.down.sql

-- >>> 000021_product_categories_many_to_many.down.sql
ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

-- Migrate data back (takes the first category found)
UPDATE products
SET category_id = (
    SELECT category_id 
    FROM product_categories 
    WHERE product_categories.product_id = products.id 
    LIMIT 1
);

DROP TABLE product_categories;
-- <<< 000021_product_categories_many_to_many.down.sql

-- >>> 000020_create_customers_table.down.sql
ALTER TABLE orders DROP COLUMN IF EXISTS customer_id;
DROP TABLE IF EXISTS customers;
-- <<< 000020_create_customers_table.down.sql

-- >>> 000019_add_tax_and_service_charge.down.sql
ALTER TABLE orders DROP COLUMN IF EXISTS tax_amount;
ALTER TABLE orders DROP COLUMN IF EXISTS service_charge_amount;
-- <<< 000019_add_tax_and_service_charge.down.sql

-- >>> 000017_update_activity_log_enums.down.sql
-- Cannot remove enum values in Postgres easily without dropping the type.
-- This down migration is intentionally left empty/commented for safety.
-- <<< 000017_update_activity_log_enums.down.sql

-- >>> 000016_add_cost_price.down.sql
ALTER TABLE order_items
DROP COLUMN cost_price_at_sale;

ALTER TABLE products
DROP COLUMN cost_price;
-- <<< 000016_add_cost_price.down.sql

-- >>> 000015_create_stock_history_table.down.sql
DROP TABLE IF EXISTS stock_history;
DROP TYPE IF EXISTS stock_change_type;
-- <<< 000015_create_stock_history_table.down.sql

-- >>> 000014_create_shifts_and_cash_transactions_tables.down.sql
DROP TABLE IF EXISTS cash_transactions;
DROP TYPE IF EXISTS cash_transaction_type;

DROP TABLE IF EXISTS shifts;
DROP TYPE IF EXISTS shift_status;
-- <<< 000014_create_shifts_and_cash_transactions_tables.down.sql

-- >>> 000013_create_settings_table.down.sql
DROP TABLE IF EXISTS settings;
-- <<< 000013_create_settings_table.down.sql

-- >>> 000012_alter_orders_add_payment_url.down.sql
ALTER TABLE orders DROP COLUMN payment_url;
ALTER TABLE orders DROP COLUMN payment_token;
-- <<< 000012_alter_orders_add_payment_url.down.sql

-- >>> 000011_add_deleted_at_to_promotions.down.sql
ALTER TABLE promotions
DROP COLUMN deleted_at;
-- <<< 000011_add_deleted_at_to_promotions.down.sql

-- >>> 000010_add_refresh_token_to_users.down.sql
ALTER TABLE users DROP COLUMN refresh_token;
-- <<< 000010_add_refresh_token_to_users.down.sql

-- >>> 000009_alter_price.down.sql
-- Revert tipe data kembali ke numeric
ALTER TABLE products
    ALTER COLUMN price TYPE numeric USING price::numeric;

ALTER TABLE orders
    ALTER COLUMN gross_total TYPE numeric USING gross_total::numeric,
    ALTER COLUMN discount_amount TYPE numeric USING discount_amount::numeric,
    ALTER COLUMN net_total TYPE numeric USING net_total::numeric,
    ALTER COLUMN cash_received TYPE numeric USING cash_received::numeric,
    ALTER COLUMN change_due TYPE numeric USING change_due::numeric;

ALTER TABLE order_items
    ALTER COLUMN price_at_sale TYPE numeric USING price_at_sale::numeric,
    ALTER COLUMN subtotal TYPE numeric USING subtotal::numeric,
    ALTER COLUMN net_subtotal TYPE numeric USING net_subtotal::numeric,
    ALTER COLUMN discount_amount TYPE numeric USING discount_amount::numeric;

ALTER TABLE product_options
    ALTER COLUMN additional_price TYPE numeric USING additional_price::numeric;

ALTER TABLE order_item_options
    ALTER COLUMN price_at_sale TYPE numeric USING price_at_sale::numeric;-- <<< 000009_alter_price.down.sql

-- >>> 000008_alter_table_order_discount.down.sql
-- <<< 000008_alter_table_order_discount.down.sql

-- >>> 000007_add_deleted_at_to_users.down.sql
-- Menghapus kolom deleted_at dari tabel users untuk membatalkan migrasi.
ALTER TABLE users
    DROP COLUMN deleted_at;
-- <<< 000007_add_deleted_at_to_users.down.sql

-- >>> 000006_alter_product_options_add_delete_at.down.sql
-- <<< 000006_alter_product_options_add_delete_at.down.sql

-- >>> 000005_alter_products_add_deleted_at.down.sql
ALTER TABLE products DROP COLUMN deleted_at;-- <<< 000005_alter_products_add_deleted_at.down.sql

-- >>> 000004_alter_enum_log_action_type.down.sql
-- <<< 000004_alter_enum_log_action_type.down.sql

-- >>> 000003_enum_sort_order.down.sql
DROP IF EXISTS TYPE sort_order;-- <<< 000003_enum_sort_order.down.sql

-- >>> 000002_enum_user_order.down.sql
DROP TYPE IF EXISTS user_order_column;-- <<< 000002_enum_user_order.down.sql

-- >>> 000001_init.down.sql
-- <<< 000001_init.down.sql
