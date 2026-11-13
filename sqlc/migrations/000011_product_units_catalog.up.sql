ALTER TABLE product_units
    ADD COLUMN measurement_unit_id UUID REFERENCES measurement_units(id) ON DELETE SET NULL,
    ADD COLUMN wholesale_price BIGINT NOT NULL DEFAULT 0 CHECK (wholesale_price >= 0);

CREATE UNIQUE INDEX product_units_product_measurement_unit
    ON product_units (product_id, measurement_unit_id)
    WHERE deleted_at IS NULL AND measurement_unit_id IS NOT NULL;

CREATE INDEX product_units_measurement_unit_id_idx ON product_units (measurement_unit_id)
    WHERE deleted_at IS NULL AND measurement_unit_id IS NOT NULL;

UPDATE product_units pu
SET measurement_unit_id = mu.id
FROM products p,
     measurement_units mu
WHERE pu.product_id = p.id
  AND mu.tenant_id = p.tenant_id
  AND pu.deleted_at IS NULL
  AND mu.deleted_at IS NULL
  AND pu.measurement_unit_id IS NULL
  AND (
    lower(trim(mu.code)) = lower(trim(pu.name))
    OR lower(trim(mu.name)) = lower(trim(pu.name))
  );
