-- Adjustments
-- name: CountStockAdjustmentsOnDate :one
SELECT COUNT(*)::int FROM stock_adjustments WHERE created_at::date = $1::date;

-- name: CreateStockAdjustment :one
INSERT INTO stock_adjustments (tenant_id, doc_no, warehouse_id, status, reason, note, created_by)
VALUES ($1, $2, $3, 'draft', $4, $5, $6)
RETURNING *;

-- name: GetStockAdjustmentByID :one
SELECT sa.*, w.name AS warehouse_name
FROM stock_adjustments sa
JOIN warehouses w ON w.id = sa.warehouse_id
WHERE sa.id = $1;

-- name: ListStockAdjustments :many
SELECT sa.*, w.name AS warehouse_name
FROM stock_adjustments sa
JOIN warehouses w ON w.id = sa.warehouse_id
WHERE (sqlc.narg(status)::stock_doc_status IS NULL OR sa.status = sqlc.narg(status))
  AND (sqlc.narg(warehouse_id)::uuid IS NULL OR sa.warehouse_id = sqlc.narg(warehouse_id))
ORDER BY sa.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountStockAdjustments :one
SELECT COUNT(*) FROM stock_adjustments sa
WHERE (sqlc.narg(status)::stock_doc_status IS NULL OR sa.status = sqlc.narg(status))
  AND (sqlc.narg(warehouse_id)::uuid IS NULL OR sa.warehouse_id = sqlc.narg(warehouse_id));

-- name: UpdateStockAdjustmentDraft :one
UPDATE stock_adjustments
SET warehouse_id = $2, reason = $3, note = $4, updated_at = NOW()
WHERE id = $1 AND status = 'draft'
RETURNING *;

-- name: CompleteStockAdjustment :one
UPDATE stock_adjustments
SET status = 'completed', completed_at = NOW(), updated_at = NOW()
WHERE id = $1 AND status = 'draft'
RETURNING *;

-- name: DeleteStockAdjustmentItems :exec
DELETE FROM stock_adjustment_items WHERE adjustment_id = $1;

-- name: InsertStockAdjustmentItem :one
INSERT INTO stock_adjustment_items (adjustment_id, product_id, quantity_delta, note)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListStockAdjustmentItems :many
SELECT sai.*, p.name AS product_name, p.code, p.sku
FROM stock_adjustment_items sai
JOIN products p ON p.id = sai.product_id
WHERE sai.adjustment_id = $1
ORDER BY sai.created_at ASC;

-- Transfers
-- name: CountStockTransfersOnDate :one
SELECT COUNT(*)::int FROM stock_transfers WHERE created_at::date = $1::date;

-- name: CreateStockTransfer :one
INSERT INTO stock_transfers (tenant_id, doc_no, from_warehouse_id, to_warehouse_id, status, note, created_by)
VALUES ($1, $2, $3, $4, 'draft', $5, $6)
RETURNING *;

-- name: GetStockTransferByID :one
SELECT st.*,
       wf.name AS from_warehouse_name,
       wt.name AS to_warehouse_name
FROM stock_transfers st
JOIN warehouses wf ON wf.id = st.from_warehouse_id
JOIN warehouses wt ON wt.id = st.to_warehouse_id
WHERE st.id = $1;

-- name: ListStockTransfers :many
SELECT st.*,
       wf.name AS from_warehouse_name,
       wt.name AS to_warehouse_name
FROM stock_transfers st
JOIN warehouses wf ON wf.id = st.from_warehouse_id
JOIN warehouses wt ON wt.id = st.to_warehouse_id
WHERE (sqlc.narg(status)::stock_doc_status IS NULL OR st.status = sqlc.narg(status))
ORDER BY st.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountStockTransfers :one
SELECT COUNT(*) FROM stock_transfers st
WHERE (sqlc.narg(status)::stock_doc_status IS NULL OR st.status = sqlc.narg(status));

-- name: UpdateStockTransferDraft :one
UPDATE stock_transfers
SET from_warehouse_id = $2, to_warehouse_id = $3, note = $4, updated_at = NOW()
WHERE id = $1 AND status = 'draft'
RETURNING *;

-- name: CompleteStockTransfer :one
UPDATE stock_transfers
SET status = 'completed', completed_at = NOW(), updated_at = NOW()
WHERE id = $1 AND status = 'draft'
RETURNING *;

-- name: DeleteStockTransferItems :exec
DELETE FROM stock_transfer_items WHERE transfer_id = $1;

-- name: InsertStockTransferItem :one
INSERT INTO stock_transfer_items (transfer_id, product_id, quantity)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListStockTransferItems :many
SELECT sti.*, p.name AS product_name, p.code, p.sku
FROM stock_transfer_items sti
JOIN products p ON p.id = sti.product_id
WHERE sti.transfer_id = $1
ORDER BY sti.created_at ASC;

-- Stock takes
-- name: CountStockTakesOnDate :one
SELECT COUNT(*)::int FROM stock_takes WHERE created_at::date = $1::date;

-- name: CreateStockTake :one
INSERT INTO stock_takes (tenant_id, doc_no, warehouse_id, status, note, created_by)
VALUES ($1, $2, $3, 'draft', $4, $5)
RETURNING *;

-- name: GetStockTakeByID :one
SELECT st.*, w.name AS warehouse_name
FROM stock_takes st
JOIN warehouses w ON w.id = st.warehouse_id
WHERE st.id = $1;

-- name: ListStockTakes :many
SELECT st.*, w.name AS warehouse_name
FROM stock_takes st
JOIN warehouses w ON w.id = st.warehouse_id
WHERE (sqlc.narg(status)::stock_take_status IS NULL OR st.status = sqlc.narg(status))
ORDER BY st.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountStockTakes :one
SELECT COUNT(*) FROM stock_takes st
WHERE (sqlc.narg(status)::stock_take_status IS NULL OR st.status = sqlc.narg(status));

-- name: SetStockTakeStatus :one
UPDATE stock_takes SET status = $2, updated_at = NOW(),
    posted_at = CASE WHEN $2::stock_take_status = 'posted' THEN NOW() ELSE posted_at END
WHERE id = $1
RETURNING *;

-- name: UpdateStockTakeDraft :one
UPDATE stock_takes SET warehouse_id = $2, note = $3, updated_at = NOW()
WHERE id = $1 AND status IN ('draft', 'counting')
RETURNING *;

-- name: DeleteStockTakeItems :exec
DELETE FROM stock_take_items WHERE stock_take_id = $1;

-- name: InsertStockTakeItem :one
INSERT INTO stock_take_items (stock_take_id, product_id, system_qty, counted_qty)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListStockTakeItems :many
SELECT sti.*, p.name AS product_name, p.code, p.sku
FROM stock_take_items sti
JOIN products p ON p.id = sti.product_id
WHERE sti.stock_take_id = $1
ORDER BY p.name ASC;

-- name: UpdateStockTakeItemCount :one
UPDATE stock_take_items
SET counted_qty = $3, updated_at = NOW()
WHERE id = $1 AND stock_take_id = $2
RETURNING *;

-- Ledger
-- name: ListStockMovements :many
SELECT sh.id, sh.product_id, sh.warehouse_id, sh.change_amount, sh.previous_stock,
       sh.current_stock, sh.change_type, sh.reference_id, sh.note, sh.created_at,
       p.name AS product_name, p.code, w.name AS warehouse_name
FROM stock_history sh
JOIN products p ON p.id = sh.product_id
LEFT JOIN warehouses w ON w.id = sh.warehouse_id
WHERE (sqlc.narg(product_id)::uuid IS NULL OR sh.product_id = sqlc.narg(product_id))
  AND (sqlc.narg(warehouse_id)::uuid IS NULL OR sh.warehouse_id = sqlc.narg(warehouse_id))
  AND (sqlc.narg(change_type)::stock_change_type IS NULL OR sh.change_type = sqlc.narg(change_type))
  AND (sqlc.narg(from_at)::timestamptz IS NULL OR sh.created_at >= sqlc.narg(from_at))
  AND (sqlc.narg(to_at)::timestamptz IS NULL OR sh.created_at <= sqlc.narg(to_at))
ORDER BY sh.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountStockMovements :one
SELECT COUNT(*) FROM stock_history sh
WHERE (sqlc.narg(product_id)::uuid IS NULL OR sh.product_id = sqlc.narg(product_id))
  AND (sqlc.narg(warehouse_id)::uuid IS NULL OR sh.warehouse_id = sqlc.narg(warehouse_id))
  AND (sqlc.narg(change_type)::stock_change_type IS NULL OR sh.change_type = sqlc.narg(change_type))
  AND (sqlc.narg(from_at)::timestamptz IS NULL OR sh.created_at >= sqlc.narg(from_at))
  AND (sqlc.narg(to_at)::timestamptz IS NULL OR sh.created_at <= sqlc.narg(to_at));