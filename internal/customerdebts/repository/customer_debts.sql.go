package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type ListCustomerDebtsParams struct {
	CustomerID pgtype.UUID `json:"customer_id"`
	Status     NullDebtStatus `json:"status"`
	Limit      int32      `json:"limit"`
	Offset     int32      `json:"offset"`
}

type NullDebtStatus struct {
	DebtStatus DebtStatus
	Valid      bool
}

type CountCustomerDebtsParams struct {
	CustomerID pgtype.UUID `json:"customer_id"`
	Status     NullDebtStatus `json:"status"`
}

type CreateCustomerDebtParams struct {
	CustomerID     uuid.UUID
	OrderID pgtype.UUID
	ReferenceNo    string
	TotalAmount    pgtype.Numeric
	AmountPaid     pgtype.Numeric
	Status         DebtStatus
	Note           *string
	IssuedAt       pgtype.Timestamptz
	CreatedBy      pgtype.UUID
}

type UpdateCustomerDebtAmountsParams struct {
	ID         uuid.UUID
	AmountPaid pgtype.Numeric
	Status     DebtStatus
}

type InsertCustomerDebtPaymentParams struct {
	CustomerDebtID uuid.UUID
	Amount         pgtype.Numeric
	PaidAt         pgtype.Timestamptz
	Note           *string
	CreatedBy      pgtype.UUID
}

type CustomerDebtListRow struct {
	CustomerDebt
	CustomerName string `json:"customer_name"`
}

type CustomerDebtSummaryRow struct {
	CustomerID   uuid.UUID      `json:"customer_id"`
	CustomerName string         `json:"customer_name"`
	BalanceDue   pgtype.Numeric `json:"balance_due"`
	OpenCount    int32          `json:"open_count"`
}

func (q *Queries) GetCustomerDebtByID(ctx context.Context, id uuid.UUID) (CustomerDebtListRow, error) {
	const sql = `
SELECT sd.id, sd.customer_id, sd.order_id, sd.reference_no, sd.total_amount, sd.amount_paid,
       sd.status, sd.note, sd.issued_at, sd.created_by, sd.created_at, sd.updated_at, s.name AS customer_name
FROM customer_debts sd
JOIN customers s ON s.id = sd.customer_id AND s.deleted_at IS NULL
WHERE sd.id = $1`
	row := q.db.QueryRow(ctx, sql, id)
	var i CustomerDebtListRow
	err := row.Scan(
		&i.ID, &i.CustomerID, &i.OrderID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
		&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt, &i.CustomerName,
	)
	return i, err
}

func (q *Queries) GetCustomerDebtByOrderID(ctx context.Context, orderID uuid.UUID) (CustomerDebt, error) {
	const sql = `SELECT id, customer_id, order_id, reference_no, total_amount, amount_paid,
status, note, issued_at, created_by, created_at, updated_at FROM customer_debts WHERE order_id = $1`
	row := q.db.QueryRow(ctx, sql, orderID)
	var i CustomerDebt
	err := row.Scan(
		&i.ID, &i.CustomerID, &i.OrderID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
		&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

func (q *Queries) ListCustomerDebts(ctx context.Context, arg ListCustomerDebtsParams) ([]CustomerDebtListRow, error) {
	const sql = `
SELECT sd.id, sd.customer_id, sd.order_id, sd.reference_no, sd.total_amount, sd.amount_paid,
       sd.status, sd.note, sd.issued_at, sd.created_by, sd.created_at, sd.updated_at, s.name AS customer_name
FROM customer_debts sd
JOIN customers s ON s.id = sd.customer_id AND s.deleted_at IS NULL
WHERE ($1::uuid IS NULL OR sd.customer_id = $1)
  AND ($2::debt_status IS NULL OR sd.status = $2)
ORDER BY sd.issued_at DESC
LIMIT $3 OFFSET $4`
	var supID uuid.UUID
	var supValid bool
	if arg.CustomerID.Valid {
		supID = uuid.UUID(arg.CustomerID.Bytes)
		supValid = true
	}
	var status DebtStatus
	var statusValid bool
	if arg.Status.Valid {
		status = arg.Status.DebtStatus
		statusValid = true
	}
	rows, err := q.db.Query(ctx, sql, nullableUUID(supID, supValid), nullableDebtStatus(status, statusValid), arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []CustomerDebtListRow
	for rows.Next() {
		var i CustomerDebtListRow
		if err := rows.Scan(
			&i.ID, &i.CustomerID, &i.OrderID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
			&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt, &i.CustomerName,
		); err != nil {
			return nil, err
		}
		out = append(out, i)
	}
	return out, rows.Err()
}

func (q *Queries) CountCustomerDebts(ctx context.Context, arg CountCustomerDebtsParams) (int32, error) {
	const sql = `
SELECT COUNT(*)::int FROM customer_debts sd
WHERE ($1::uuid IS NULL OR sd.customer_id = $1)
  AND ($2::debt_status IS NULL OR sd.status = $2)`
	var supID uuid.UUID
	var supValid bool
	if arg.CustomerID.Valid {
		supID = uuid.UUID(arg.CustomerID.Bytes)
		supValid = true
	}
	var status DebtStatus
	var statusValid bool
	if arg.Status.Valid {
		status = arg.Status.DebtStatus
		statusValid = true
	}
	var n int32
	err := q.db.QueryRow(ctx, sql, nullableUUID(supID, supValid), nullableDebtStatus(status, statusValid)).Scan(&n)
	return n, err
}

func (q *Queries) CreateCustomerDebt(ctx context.Context, arg CreateCustomerDebtParams) (CustomerDebt, error) {
	const sql = `
INSERT INTO customer_debts (customer_id, order_id, reference_no, total_amount, amount_paid, status, note, issued_at, created_by)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, customer_id, order_id, reference_no, total_amount, amount_paid, status, note, issued_at, created_by, created_at, updated_at`
	row := q.db.QueryRow(ctx, sql,
		arg.CustomerID, arg.OrderID, arg.ReferenceNo, arg.TotalAmount, arg.AmountPaid,
		arg.Status, arg.Note, arg.IssuedAt, arg.CreatedBy,
	)
	var i CustomerDebt
	err := row.Scan(
		&i.ID, &i.CustomerID, &i.OrderID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
		&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

func (q *Queries) UpdateCustomerDebtAmounts(ctx context.Context, arg UpdateCustomerDebtAmountsParams) (CustomerDebt, error) {
	const sql = `
UPDATE customer_debts SET amount_paid = $2, status = $3, updated_at = NOW() WHERE id = $1
RETURNING id, customer_id, order_id, reference_no, total_amount, amount_paid, status, note, issued_at, created_by, created_at, updated_at`
	row := q.db.QueryRow(ctx, sql, arg.ID, arg.AmountPaid, arg.Status)
	var i CustomerDebt
	err := row.Scan(
		&i.ID, &i.CustomerID, &i.OrderID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
		&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

func (q *Queries) SetCustomerDebtStatus(ctx context.Context, id uuid.UUID, status DebtStatus) (CustomerDebt, error) {
	const sql = `
UPDATE customer_debts SET status = $2, updated_at = NOW() WHERE id = $1
RETURNING id, customer_id, order_id, reference_no, total_amount, amount_paid, status, note, issued_at, created_by, created_at, updated_at`
	row := q.db.QueryRow(ctx, sql, id, status)
	var i CustomerDebt
	err := row.Scan(
		&i.ID, &i.CustomerID, &i.OrderID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
		&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

func (q *Queries) InsertCustomerDebtPayment(ctx context.Context, arg InsertCustomerDebtPaymentParams) (CustomerDebtPayment, error) {
	const sql = `
INSERT INTO customer_debt_payments (customer_debt_id, amount, paid_at, note, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, customer_debt_id, amount, paid_at, note, created_by, created_at`
	row := q.db.QueryRow(ctx, sql, arg.CustomerDebtID, arg.Amount, arg.PaidAt, arg.Note, arg.CreatedBy)
	var i CustomerDebtPayment
	err := row.Scan(&i.ID, &i.CustomerDebtID, &i.Amount, &i.PaidAt, &i.Note, &i.CreatedBy, &i.CreatedAt)
	return i, err
}

func (q *Queries) ListCustomerDebtPayments(ctx context.Context, debtID uuid.UUID) ([]CustomerDebtPayment, error) {
	const sql = `SELECT id, customer_debt_id, amount, paid_at, note, created_by, created_at
FROM customer_debt_payments WHERE customer_debt_id = $1 ORDER BY paid_at DESC, created_at DESC`
	rows, err := q.db.Query(ctx, sql, debtID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []CustomerDebtPayment
	for rows.Next() {
		var i CustomerDebtPayment
		if err := rows.Scan(&i.ID, &i.CustomerDebtID, &i.Amount, &i.PaidAt, &i.Note, &i.CreatedBy, &i.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, i)
	}
	return out, rows.Err()
}

func (q *Queries) ListCustomerDebtSummary(ctx context.Context) ([]CustomerDebtSummaryRow, error) {
	const sql = `
SELECT sd.customer_id, s.name AS customer_name,
       COALESCE(SUM(sd.total_amount - sd.amount_paid) FILTER (WHERE sd.status IN ('open', 'partial')), 0)::numeric(14,2),
       COUNT(*) FILTER (WHERE sd.status IN ('open', 'partial'))::int
FROM customer_debts sd
JOIN customers s ON s.id = sd.customer_id AND s.deleted_at IS NULL
GROUP BY sd.customer_id, s.name
ORDER BY 3 DESC`
	rows, err := q.db.Query(ctx, sql)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []CustomerDebtSummaryRow
	for rows.Next() {
		var i CustomerDebtSummaryRow
		if err := rows.Scan(&i.CustomerID, &i.CustomerName, &i.BalanceDue, &i.OpenCount); err != nil {
			return nil, err
		}
		out = append(out, i)
	}
	return out, rows.Err()
}

func nullableUUID(id uuid.UUID, valid bool) interface{} {
	if !valid {
		return nil
	}
	return id
}

func nullableDebtStatus(s DebtStatus, valid bool) interface{} {
	if !valid {
		return nil
	}
	return string(s)
}

func DefaultPaidAt() pgtype.Timestamptz {
	return PtrTime(time.Now())
}
