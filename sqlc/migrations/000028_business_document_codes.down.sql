DROP INDEX IF EXISTS idx_products_code;
ALTER TABLE products DROP COLUMN IF EXISTS code;

DROP INDEX IF EXISTS idx_customers_code;
ALTER TABLE customers DROP COLUMN IF EXISTS code;

DROP INDEX IF EXISTS idx_orders_order_no;
ALTER TABLE orders DROP COLUMN IF EXISTS order_no;
