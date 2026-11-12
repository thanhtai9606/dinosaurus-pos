-- name: GetCustomerDebtByID :one
SELECT cd.*, c.name AS customer_name
FROM customer_debts cd
JOIN customers c ON c.id = cd.customer_id
WHERE cd.id = $1;

-- name: GetCustomerDebtByOrderID :one
SELECT * FROM customer_debts WHERE order_id = $1;

-- name: ListCustomerDebts :many
SELECT cd.*, c.name AS customer_name
FROM customer_debts cd
JOIN customers c ON c.id = cd.customer_id
WHERE (sqlc.narg(customer_id)::uuid IS NULL OR cd.customer_id = sqlc.narg(customer_id))
  AND (sqlc.narg(status)::debt_status IS NULL OR cd.status = sqlc.narg(status))
ORDER BY cd.issued_at DESC
LIMIT $1 OFFSET $2;

-- name: CountCustomerDebts :one
SELECT COUNT(*)::int FROM customer_debts cd
WHERE (sqlc.narg(customer_id)::uuid IS NULL OR cd.customer_id = sqlc.narg(customer_id))
  AND (sqlc.narg(status)::debt_status IS NULL OR cd.status = sqlc.narg(status));

-- name: CreateCustomerDebt :one
INSERT INTO customer_debts (
    customer_id, order_id, reference_no, total_amount, amount_paid, status, note, issued_at, created_by
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: UpdateCustomerDebtAmounts :one
UPDATE customer_debts
SET amount_paid = $2, status = $3, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: SetCustomerDebtStatus :one
UPDATE customer_debts
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: InsertCustomerDebtPayment :one
INSERT INTO customer_debt_payments (customer_debt_id, amount, paid_at, note, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListCustomerDebtPayments :many
SELECT * FROM customer_debt_payments
WHERE customer_debt_id = $1
ORDER BY paid_at DESC, created_at DESC;

-- name: ListCustomerDebtSummary :many
SELECT
    cd.customer_id,
    c.name AS customer_name,
    COALESCE(SUM(cd.total_amount - cd.amount_paid) FILTER (WHERE cd.status IN ('open', 'partial')), 0)::numeric(14,2) AS balance_due,
    COUNT(*) FILTER (WHERE cd.status IN ('open', 'partial'))::int AS open_count
FROM customer_debts cd
JOIN customers c ON c.id = cd.customer_id
GROUP BY cd.customer_id, c.name
ORDER BY balance_due DESC;
