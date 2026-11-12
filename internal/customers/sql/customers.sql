-- name: CreateCustomer :one
INSERT INTO customers (name, phone, email, address, code)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: CountCustomersForCode :one
SELECT COUNT(*)::bigint FROM customers WHERE deleted_at IS NULL;

-- name: GetCustomerByID :one
SELECT * FROM customers WHERE id = $1 AND deleted_at IS NULL;

-- name: ListCustomers :many
SELECT * FROM customers
WHERE deleted_at IS NULL
  AND (
    sqlc.narg(search)::text IS NULL
    OR btrim(sqlc.narg(search)::text) = ''
    OR name ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR phone ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR code ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR id::text = btrim(sqlc.narg(search)::text)
  )
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountCustomers :one
SELECT COUNT(*) FROM customers
WHERE deleted_at IS NULL
  AND (
    sqlc.narg(search)::text IS NULL
    OR btrim(sqlc.narg(search)::text) = ''
    OR name ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR phone ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR code ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR id::text = btrim(sqlc.narg(search)::text)
  );

-- name: UpdateCustomer :one
UPDATE customers
SET name = $2, phone = $3, email = $4, address = $5, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: DeleteCustomer :exec
UPDATE customers SET deleted_at = NOW() WHERE id = $1;
