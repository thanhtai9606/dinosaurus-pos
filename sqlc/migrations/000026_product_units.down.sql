ALTER TABLE order_items
    DROP COLUMN IF EXISTS factor_to_base,
    DROP COLUMN IF EXISTS sale_unit_name,
    DROP COLUMN IF EXISTS product_unit_id;

DROP TABLE IF EXISTS product_units;
