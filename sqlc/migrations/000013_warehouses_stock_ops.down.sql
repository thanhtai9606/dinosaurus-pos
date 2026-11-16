DROP TABLE IF EXISTS stock_take_items;
DROP TABLE IF EXISTS stock_takes;
DROP TYPE IF EXISTS stock_take_status;

DROP TABLE IF EXISTS stock_transfer_items;
DROP TABLE IF EXISTS stock_transfers;

DROP TABLE IF EXISTS stock_adjustment_items;
DROP TABLE IF EXISTS stock_adjustments;
DROP TYPE IF EXISTS stock_doc_status;

ALTER TABLE orders DROP COLUMN IF EXISTS fulfillment_warehouse_id;
ALTER TABLE stock_receipts DROP COLUMN IF EXISTS warehouse_id;
ALTER TABLE stock_history DROP COLUMN IF EXISTS warehouse_id;

DROP TABLE IF EXISTS warehouse_stock;
DROP TABLE IF EXISTS warehouses;

-- Enum values cannot be removed safely; types left as-is on rollback.