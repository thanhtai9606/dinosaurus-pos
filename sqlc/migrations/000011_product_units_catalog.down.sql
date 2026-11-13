DROP INDEX IF EXISTS product_units_measurement_unit_id_idx;
DROP INDEX IF EXISTS product_units_product_measurement_unit;

ALTER TABLE product_units
    DROP COLUMN IF EXISTS wholesale_price,
    DROP COLUMN IF EXISTS measurement_unit_id;
