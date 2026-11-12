ALTER TABLE stock_receipt_items
    ADD COLUMN unit_sell_price NUMERIC(12, 2) CHECK (unit_sell_price IS NULL OR unit_sell_price >= 0);
