ALTER TABLE stock_receipt_items
    DROP COLUMN IF EXISTS factor_to_base,
    DROP COLUMN IF EXISTS sale_unit_name,
    DROP COLUMN IF EXISTS product_unit_id;