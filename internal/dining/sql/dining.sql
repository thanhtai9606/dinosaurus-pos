-- name: ListDiningAreas :many
SELECT * FROM dining_areas ORDER BY sort_order, name;

-- name: CreateDiningArea :one
INSERT INTO dining_areas (name, sort_order)
VALUES ($1, $2)
RETURNING *;

-- name: GetDiningAreaByID :one
SELECT * FROM dining_areas WHERE id = $1;

-- name: UpdateDiningArea :one
UPDATE dining_areas
SET name = $2, sort_order = $3, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: CountActiveDiningTablesInArea :one
SELECT COUNT(*)::int FROM dining_tables
WHERE area_id = $1 AND status IN ('occupied', 'reserved');

-- name: DeleteDiningArea :exec
DELETE FROM dining_areas WHERE id = $1;

-- name: ListDiningTables :many
SELECT dt.*, da.name AS area_name
FROM dining_tables dt
JOIN dining_areas da ON da.id = dt.area_id
ORDER BY da.sort_order, da.name, dt.name;

-- name: CreateDiningTable :one
INSERT INTO dining_tables (area_id, name, capacity, status)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetDiningTableByID :one
SELECT * FROM dining_tables WHERE id = $1;

-- name: UpdateDiningTable :one
UPDATE dining_tables
SET area_id = $2, name = $3, capacity = $4, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteDiningTable :exec
DELETE FROM dining_tables WHERE id = $1;

-- name: UpdateDiningTableStatus :one
UPDATE dining_tables SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *;

-- name: SetDiningTableStatusByID :exec
UPDATE dining_tables SET status = $2, updated_at = NOW() WHERE id = $1;