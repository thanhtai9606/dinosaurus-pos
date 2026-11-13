-- name: CreateCustomer :one
INSERT INTO customers (name, phone, email, address, code, customer_group_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: CountCustomersForCode :one
SELECT COUNT(*)::bigint FROM customers WHERE deleted_at IS NULL;

-- name: GetCustomerByID :one
SELECT
    c.id,
    c.name,
    c.phone,
    c.email,
    c.address,
    c.created_at,
    c.updated_at,
    c.deleted_at,
    c.code,
    c.customer_group_id,
    cg.name AS customer_group_name
FROM customers c
LEFT JOIN customer_groups cg ON cg.id = c.customer_group_id AND cg.deleted_at IS NULL
WHERE c.id = $1 AND c.deleted_at IS NULL;

-- name: ListCustomers :many
SELECT
    c.id,
    c.name,
    c.phone,
    c.email,
    c.address,
    c.created_at,
    c.updated_at,
    c.deleted_at,
    c.code,
    c.customer_group_id,
    cg.name AS customer_group_name
FROM customers c
LEFT JOIN customer_groups cg ON cg.id = c.customer_group_id AND cg.deleted_at IS NULL
WHERE c.deleted_at IS NULL
  AND (
    sqlc.narg(search)::text IS NULL
    OR btrim(sqlc.narg(search)::text) = ''
    OR c.name ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR c.phone ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR c.code ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR c.id::text = btrim(sqlc.narg(search)::text)
  )
  AND (
    sqlc.narg(group_id)::uuid IS NULL
    OR c.customer_group_id = sqlc.narg(group_id)::uuid
  )
ORDER BY c.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountCustomers :one
SELECT COUNT(*) FROM customers c
WHERE c.deleted_at IS NULL
  AND (
    sqlc.narg(search)::text IS NULL
    OR btrim(sqlc.narg(search)::text) = ''
    OR c.name ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR c.phone ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR c.code ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR c.id::text = btrim(sqlc.narg(search)::text)
  )
  AND (
    sqlc.narg(group_id)::uuid IS NULL
    OR c.customer_group_id = sqlc.narg(group_id)::uuid
  );

-- name: UpdateCustomer :one
UPDATE customers
SET name = $2,
    phone = $3,
    email = $4,
    address = $5,
    customer_group_id = $6,
    updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: DeleteCustomer :exec
UPDATE customers SET deleted_at = NOW() WHERE id = $1;
