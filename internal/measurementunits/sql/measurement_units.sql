-- name: CreateMeasurementUnit :one
INSERT INTO measurement_units (code, name)
VALUES ($1, $2)
RETURNING *;

-- name: GetMeasurementUnitByID :one
SELECT * FROM measurement_units WHERE id = $1 AND deleted_at IS NULL;

-- name: ListMeasurementUnits :many
SELECT * FROM measurement_units
WHERE deleted_at IS NULL
  AND (
    sqlc.narg(search)::text IS NULL
    OR btrim(sqlc.narg(search)::text) = ''
    OR name ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR code ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
  )
ORDER BY name ASC
LIMIT $1 OFFSET $2;

-- name: CountMeasurementUnits :one
SELECT COUNT(*) FROM measurement_units
WHERE deleted_at IS NULL
  AND (
    sqlc.narg(search)::text IS NULL
    OR btrim(sqlc.narg(search)::text) = ''
    OR name ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR code ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
  );

-- name: UpdateMeasurementUnit :one
UPDATE measurement_units
SET code = $2,
    name = $3,
    updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: DeleteMeasurementUnit :exec
UPDATE measurement_units SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL;

-- name: InsertMeasurementUnitIfMissing :exec
INSERT INTO measurement_units (tenant_id, code, name)
SELECT sqlc.arg(tenant_id)::uuid, sqlc.arg(code)::varchar, sqlc.arg(name)::varchar
WHERE NOT EXISTS (
    SELECT 1 FROM measurement_units mu
    WHERE mu.tenant_id = sqlc.arg(tenant_id)::uuid
      AND mu.code = sqlc.arg(code)::varchar
      AND mu.deleted_at IS NULL
);

-- name: CountProductsUsingMeasurementUnit :one
SELECT COUNT(*)::bigint FROM products p
WHERE p.deleted_at IS NULL
  AND (
    LOWER(TRIM(p.unit)) = LOWER(sqlc.arg(code)::text)
    OR LOWER(TRIM(p.unit)) = LOWER(sqlc.arg(name)::text)
  );
