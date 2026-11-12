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
