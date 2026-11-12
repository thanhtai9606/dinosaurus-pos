-- name: CountStockReceiptsOnDate :one
SELECT COUNT(*)::int FROM stock_receipts
WHERE created_at::date = $1::date;

-- name: CreateStockReceipt :one
INSERT INTO stock_receipts (receipt_no, supplier_id, status, received_at, note, created_by)
VALUES ($1, $2, 'draft', $3, $4, $5)
RETURNING *;

-- name: GetStockReceiptByID :one
SELECT * FROM stock_receipts WHERE id = $1;

-- name: ListStockReceipts :many
SELECT sr.*, s.name AS supplier_name
FROM stock_receipts sr
LEFT JOIN suppliers s ON s.id = sr.supplier_id AND s.deleted_at IS NULL
WHERE (sqlc.narg(status)::stock_receipt_status IS NULL OR sr.status = sqlc.narg(status))
  AND (sqlc.narg(supplier_id)::uuid IS NULL OR sr.supplier_id = sqlc.narg(supplier_id))
  AND (sqlc.narg(from_date)::timestamptz IS NULL OR sr.received_at >= sqlc.narg(from_date))
  AND (sqlc.narg(to_date)::timestamptz IS NULL OR sr.received_at <= sqlc.narg(to_date))
ORDER BY sr.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountStockReceipts :one
SELECT COUNT(*) FROM stock_receipts sr
WHERE (sqlc.narg(status)::stock_receipt_status IS NULL OR sr.status = sqlc.narg(status))
  AND (sqlc.narg(supplier_id)::uuid IS NULL OR sr.supplier_id = sqlc.narg(supplier_id))
  AND (sqlc.narg(from_date)::timestamptz IS NULL OR sr.received_at >= sqlc.narg(from_date))
  AND (sqlc.narg(to_date)::timestamptz IS NULL OR sr.received_at <= sqlc.narg(to_date));

-- name: UpdateStockReceiptDraft :one
UPDATE stock_receipts
SET supplier_id = $2,
    received_at = $3,
    note = $4,
    updated_at = NOW()
WHERE id = $1 AND status = 'draft'
RETURNING *;

-- name: SetStockReceiptStatus :one
UPDATE stock_receipts
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteStockReceiptItems :exec
DELETE FROM stock_receipt_items WHERE receipt_id = $1;

-- name: InsertStockReceiptItem :one
INSERT INTO stock_receipt_items (receipt_id, product_id, quantity, unit_cost)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListStockReceiptItems :many
SELECT
    i.*,
    p.name AS product_name,
    p.sku AS product_sku
FROM stock_receipt_items i
JOIN products p ON p.id = i.product_id AND p.deleted_at IS NULL
WHERE i.receipt_id = $1
ORDER BY i.created_at ASC;

-- name: SumReceiptLineTotal :one
SELECT COALESCE(SUM(line_total), 0)::numeric(14,2) AS total
FROM stock_receipt_items
WHERE receipt_id = $1;
