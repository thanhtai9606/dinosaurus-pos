-- name: CreateSupplier :one
INSERT INTO suppliers (code, name, phone, email, address, tax_id, notes, is_active)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetSupplierByID :one
SELECT * FROM suppliers WHERE id = $1 AND deleted_at IS NULL;

-- name: ListSuppliers :many
SELECT * FROM suppliers
WHERE deleted_at IS NULL
  AND (sqlc.narg(search)::text IS NULL OR name ILIKE '%' || sqlc.narg(search) || '%' OR code ILIKE '%' || sqlc.narg(search) || '%')
ORDER BY name ASC
LIMIT $1 OFFSET $2;

-- name: CountSuppliers :one
SELECT COUNT(*) FROM suppliers
WHERE deleted_at IS NULL
  AND (sqlc.narg(search)::text IS NULL OR name ILIKE '%' || sqlc.narg(search) || '%' OR code ILIKE '%' || sqlc.narg(search) || '%');

-- name: UpdateSupplier :one
UPDATE suppliers
SET code = $2,
    name = $3,
    phone = $4,
    email = $5,
    address = $6,
    tax_id = $7,
    notes = $8,
    is_active = $9,
    updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: DeleteSupplier :exec
UPDATE suppliers SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL;
