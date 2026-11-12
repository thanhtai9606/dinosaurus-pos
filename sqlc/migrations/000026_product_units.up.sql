CREATE TABLE product_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    is_base BOOLEAN NOT NULL DEFAULT FALSE,
    factor_to_base NUMERIC(12, 4) NOT NULL CHECK (factor_to_base > 0),
    sell_price BIGINT NOT NULL CHECK (sell_price >= 0),
    barcode VARCHAR(100),
    sku VARCHAR(50),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX product_units_one_base_per_product
    ON product_units (product_id)
    WHERE is_base = TRUE AND deleted_at IS NULL;

CREATE UNIQUE INDEX product_units_barcode_unique
    ON product_units (barcode)
    WHERE barcode IS NOT NULL AND barcode <> '' AND deleted_at IS NULL;

CREATE INDEX product_units_product_id_idx ON product_units (product_id) WHERE deleted_at IS NULL;

INSERT INTO product_units (product_id, name, is_base, factor_to_base, sell_price, barcode, sku, sort_order)
SELECT
    p.id,
    COALESCE(NULLIF(TRIM(p.unit), ''), 'pcs'),
    TRUE,
    1,
    p.price,
    p.barcode,
    p.sku,
    0
FROM products p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM product_units pu WHERE pu.product_id = p.id AND pu.deleted_at IS NULL
  );

ALTER TABLE order_items
    ADD COLUMN product_unit_id UUID REFERENCES product_units(id),
    ADD COLUMN sale_unit_name VARCHAR(50),
    ADD COLUMN factor_to_base NUMERIC(12, 4) NOT NULL DEFAULT 1;
