-- name: CreateCustomerGroup :one
INSERT INTO customer_groups (code, name, description)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetCustomerGroupByID :one
SELECT * FROM customer_groups WHERE id = $1 AND deleted_at IS NULL;

-- name: ListCustomerGroups :many
SELECT * FROM customer_groups
WHERE deleted_at IS NULL
  AND (
    sqlc.narg(search)::text IS NULL
    OR btrim(sqlc.narg(search)::text) = ''
    OR name ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR code ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
  )
ORDER BY name ASC
LIMIT $1 OFFSET $2;

-- name: CountCustomerGroups :one
SELECT COUNT(*) FROM customer_groups
WHERE deleted_at IS NULL
  AND (
    sqlc.narg(search)::text IS NULL
    OR btrim(sqlc.narg(search)::text) = ''
    OR name ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
    OR code ILIKE '%' || btrim(sqlc.narg(search)::text) || '%'
  );

-- name: UpdateCustomerGroup :one
UPDATE customer_groups
SET code = $2,
    name = $3,
    description = $4,
    updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: DeleteCustomerGroup :exec
UPDATE customer_groups SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL;

-- name: InsertCustomerGroupIfMissing :exec
INSERT INTO customer_groups (tenant_id, code, name, description)
SELECT sqlc.arg(tenant_id)::uuid, sqlc.arg(code)::varchar, sqlc.arg(name)::varchar, sqlc.arg(description)::text
WHERE NOT EXISTS (
    SELECT 1 FROM customer_groups cg
    WHERE cg.tenant_id = sqlc.arg(tenant_id)::uuid
      AND cg.code = sqlc.arg(code)::varchar
      AND cg.deleted_at IS NULL
);
