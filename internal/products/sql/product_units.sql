-- name: ListProductUnitsByProduct :many
SELECT *
FROM product_units
WHERE product_id = $1
  AND deleted_at IS NULL
ORDER BY sort_order ASC, is_base DESC, name ASC;

-- name: ListProductUnitsByProductIDs :many
SELECT *
FROM product_units
WHERE product_id = ANY(sqlc.arg(product_ids)::uuid[])
  AND deleted_at IS NULL
ORDER BY product_id, sort_order ASC, is_base DESC, name ASC;

-- name: GetProductUnit :one
SELECT *
FROM product_units
WHERE id = $1
  AND deleted_at IS NULL;

-- name: GetProductUnitByBarcode :one
SELECT *
FROM product_units
WHERE barcode = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: GetBaseProductUnit :one
SELECT *
FROM product_units
WHERE product_id = $1
  AND is_base = TRUE
  AND deleted_at IS NULL
LIMIT 1;

-- name: GetMeasurementUnitLabel :one
SELECT code, name
FROM measurement_units
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetMeasurementUnitByNameCI :one
SELECT id, name
FROM measurement_units
WHERE lower(trim(name)) = lower(trim($1))
  AND deleted_at IS NULL
LIMIT 1;

-- name: GetDefaultMeasurementUnit :one
SELECT id, name
FROM measurement_units
WHERE deleted_at IS NULL
ORDER BY CASE WHEN lower(trim(name)) = lower('Cái') THEN 0 ELSE 1 END, name ASC
LIMIT 1;

-- name: CreateProductUnit :one
INSERT INTO product_units (
    product_id,
    measurement_unit_id,
    name,
    is_base,
    factor_to_base,
    sell_price,
    wholesale_price,
    barcode,
    sku,
    sort_order
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: SoftDeleteProductUnitsByProduct :exec
UPDATE product_units
SET deleted_at = NOW(), updated_at = NOW()
WHERE product_id = $1
  AND deleted_at IS NULL;
