-- name: GetSupplierDebtByID :one
SELECT sd.*, s.name AS supplier_name
FROM supplier_debts sd
JOIN suppliers s ON s.id = sd.supplier_id AND s.deleted_at IS NULL
WHERE sd.id = $1;

-- name: GetSupplierDebtByStockReceiptID :one
SELECT * FROM supplier_debts WHERE stock_receipt_id = $1;

-- name: ListSupplierDebts :many
SELECT sd.*, s.name AS supplier_name
FROM supplier_debts sd
JOIN suppliers s ON s.id = sd.supplier_id AND s.deleted_at IS NULL
WHERE (sqlc.narg(supplier_id)::uuid IS NULL OR sd.supplier_id = sqlc.narg(supplier_id))
  AND (sqlc.narg(status)::debt_status IS NULL OR sd.status = sqlc.narg(status))
ORDER BY sd.issued_at DESC
LIMIT $1 OFFSET $2;

-- name: CountSupplierDebts :one
SELECT COUNT(*)::int FROM supplier_debts sd
WHERE (sqlc.narg(supplier_id)::uuid IS NULL OR sd.supplier_id = sqlc.narg(supplier_id))
  AND (sqlc.narg(status)::debt_status IS NULL OR sd.status = sqlc.narg(status));

-- name: CreateSupplierDebt :one
INSERT INTO supplier_debts (
    supplier_id, stock_receipt_id, reference_no, total_amount, amount_paid, status, note, issued_at, created_by
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: UpdateSupplierDebtAmounts :one
UPDATE supplier_debts
SET amount_paid = $2, status = $3, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: SetSupplierDebtStatus :one
UPDATE supplier_debts
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: InsertSupplierDebtPayment :one
INSERT INTO supplier_debt_payments (supplier_debt_id, amount, paid_at, note, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListSupplierDebtPayments :many
SELECT * FROM supplier_debt_payments
WHERE supplier_debt_id = $1
ORDER BY paid_at DESC, created_at DESC;

-- name: ListSupplierDebtSummary :many
SELECT
    sd.supplier_id,
    s.name AS supplier_name,
    COALESCE(SUM(sd.total_amount - sd.amount_paid) FILTER (WHERE sd.status IN ('open', 'partial')), 0)::numeric(14,2) AS balance_due,
    COUNT(*) FILTER (WHERE sd.status IN ('open', 'partial'))::int AS open_count
FROM supplier_debts sd
JOIN suppliers s ON s.id = sd.supplier_id AND s.deleted_at IS NULL
GROUP BY sd.supplier_id, s.name
ORDER BY balance_due DESC;
