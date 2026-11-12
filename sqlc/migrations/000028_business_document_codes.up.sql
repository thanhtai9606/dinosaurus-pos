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
