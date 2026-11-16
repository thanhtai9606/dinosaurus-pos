-- name: CreateWarehouse :one
INSERT INTO warehouses (tenant_id, code, name, is_default, is_active)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetWarehouseByID :one
SELECT * FROM warehouses WHERE id = $1;

-- name: GetDefaultWarehouse :one
SELECT * FROM warehouses
WHERE is_default = true AND is_active = true
ORDER BY created_at ASC
LIMIT 1;

-- name: ListWarehouses :many
SELECT * FROM warehouses
WHERE (sqlc.narg(active_only)::bool IS NOT TRUE OR is_active = true)
  AND (sqlc.narg(search)::text IS NULL OR name ILIKE '%' || sqlc.narg(search) || '%' OR code ILIKE '%' || sqlc.narg(search) || '%')
ORDER BY is_default DESC, name ASC
LIMIT $1 OFFSET $2;

-- name: CountWarehouses :one
SELECT COUNT(*) FROM warehouses
WHERE (sqlc.narg(active_only)::bool IS NOT TRUE OR is_active = true)
  AND (sqlc.narg(search)::text IS NULL OR name ILIKE '%' || sqlc.narg(search) || '%' OR code ILIKE '%' || sqlc.narg(search) || '%');

-- name: UpdateWarehouse :one
UPDATE warehouses
SET code = $2, name = $3, is_default = $4, is_active = $5, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ClearDefaultWarehouse :exec
UPDATE warehouses SET is_default = false, updated_at = NOW() WHERE is_default = true;

-- name: GetWarehouseStock :one
SELECT * FROM warehouse_stock
WHERE warehouse_id = $1 AND product_id = $2;

-- name: UpsertWarehouseStock :one
INSERT INTO warehouse_stock (tenant_id, warehouse_id, product_id, quantity, min_stock)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (warehouse_id, product_id)
DO UPDATE SET quantity = EXCLUDED.quantity, min_stock = EXCLUDED.min_stock, updated_at = NOW()
RETURNING *;

-- name: AddWarehouseStockQty :one
UPDATE warehouse_stock
SET quantity = quantity + $3, updated_at = NOW()
WHERE warehouse_id = $1 AND product_id = $2
RETURNING *;

-- name: SumProductStockAcrossWarehouses :one
SELECT COALESCE(SUM(quantity), 0)::int AS total
FROM warehouse_stock
WHERE product_id = $1;

-- name: ListWarehouseStockByWarehouse :many
SELECT ws.*, p.name AS product_name, p.code, p.sku, p.unit
FROM warehouse_stock ws
JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
WHERE ws.warehouse_id = $1
  AND (sqlc.narg(search)::text IS NULL OR p.name ILIKE '%' || sqlc.narg(search) || '%'
    OR p.code ILIKE '%' || sqlc.narg(search) || '%' OR p.sku ILIKE '%' || sqlc.narg(search) || '%')
  AND (sqlc.narg(low_stock_only)::bool IS NOT TRUE OR ws.quantity <= ws.min_stock)
ORDER BY p.name ASC
LIMIT $2 OFFSET $3;

-- name: CountWarehouseStockByWarehouse :one
SELECT COUNT(*) FROM warehouse_stock ws
JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
WHERE ws.warehouse_id = $1
  AND (sqlc.narg(search)::text IS NULL OR p.name ILIKE '%' || sqlc.narg(search) || '%'
    OR p.code ILIKE '%' || sqlc.narg(search) || '%' OR p.sku ILIKE '%' || sqlc.narg(search) || '%')
  AND (sqlc.narg(low_stock_only)::bool IS NOT TRUE OR ws.quantity <= ws.min_stock);

-- name: SeedDefaultWarehouse :one
INSERT INTO warehouses (tenant_id, code, name, is_default, is_active)
VALUES ($1, 'MAIN', 'Main warehouse', true, true)
ON CONFLICT (tenant_id, code) DO UPDATE SET updated_at = NOW()
RETURNING *;

-- name: SeedWarehouseStockFromProduct :exec
INSERT INTO warehouse_stock (tenant_id, warehouse_id, product_id, quantity, min_stock)
SELECT $1, $2, p.id, p.stock, p.min_stock
FROM products p
WHERE p.tenant_id = $1 AND p.deleted_at IS NULL
ON CONFLICT (warehouse_id, product_id) DO NOTHING;