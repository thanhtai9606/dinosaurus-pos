ALTER TABLE stock_receipt_items
    ADD COLUMN product_unit_id UUID REFERENCES product_units(id),
    ADD COLUMN sale_unit_name VARCHAR(50),
    ADD COLUMN factor_to_base NUMERIC(12, 4) NOT NULL DEFAULT 1;