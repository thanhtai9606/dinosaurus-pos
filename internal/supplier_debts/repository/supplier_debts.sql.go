package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type ListSupplierDebtsParams struct {
	SupplierID pgtype.UUID `json:"supplier_id"`
	Status     NullDebtStatus `json:"status"`
	Limit      int32      `json:"limit"`
	Offset     int32      `json:"offset"`
}

type NullDebtStatus struct {
	DebtStatus DebtStatus
	Valid      bool
}

type CountSupplierDebtsParams struct {
	SupplierID pgtype.UUID `json:"supplier_id"`
	Status     NullDebtStatus `json:"status"`
}

type CreateSupplierDebtParams struct {
	SupplierID     uuid.UUID
	StockReceiptID pgtype.UUID
	ReferenceNo    string
	TotalAmount    pgtype.Numeric
	AmountPaid     pgtype.Numeric
	Status         DebtStatus
	Note           *string
	IssuedAt       pgtype.Timestamptz
	CreatedBy      pgtype.UUID
}

type UpdateSupplierDebtAmountsParams struct {
	ID         uuid.UUID
	AmountPaid pgtype.Numeric
	Status     DebtStatus
}

type InsertSupplierDebtPaymentParams struct {
	SupplierDebtID uuid.UUID
	Amount         pgtype.Numeric
	PaidAt         pgtype.Timestamptz
	Note           *string
	CreatedBy      pgtype.UUID
}

type SupplierDebtListRow struct {
	SupplierDebt
	SupplierName string `json:"supplier_name"`
}

type SupplierDebtSummaryRow struct {
	SupplierID   uuid.UUID      `json:"supplier_id"`
	SupplierName string         `json:"supplier_name"`
	BalanceDue   pgtype.Numeric `json:"balance_due"`
	OpenCount    int32          `json:"open_count"`
}

func (q *Queries) GetSupplierDebtByID(ctx context.Context, id uuid.UUID) (SupplierDebtListRow, error) {
	const sql = `
SELECT sd.id, sd.supplier_id, sd.stock_receipt_id, sd.reference_no, sd.total_amount, sd.amount_paid,
       sd.status, sd.note, sd.issued_at, sd.created_by, sd.created_at, sd.updated_at, s.name AS supplier_name
FROM supplier_debts sd
JOIN suppliers s ON s.id = sd.supplier_id AND s.deleted_at IS NULL
WHERE sd.id = $1`
	row := q.db.QueryRow(ctx, sql, id)
	var i SupplierDebtListRow
	err := row.Scan(
		&i.ID, &i.SupplierID, &i.StockReceiptID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
		&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt, &i.SupplierName,
	)
	return i, err
}

func (q *Queries) GetSupplierDebtByStockReceiptID(ctx context.Context, receiptID uuid.UUID) (SupplierDebt, error) {
	const sql = `SELECT id, supplier_id, stock_receipt_id, reference_no, total_amount, amount_paid,
status, note, issued_at, created_by, created_at, updated_at FROM supplier_debts WHERE stock_receipt_id = $1`
	row := q.db.QueryRow(ctx, sql, receiptID)
	var i SupplierDebt
	err := row.Scan(
		&i.ID, &i.SupplierID, &i.StockReceiptID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
		&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

func (q *Queries) ListSupplierDebts(ctx context.Context, arg ListSupplierDebtsParams) ([]SupplierDebtListRow, error) {
	const sql = `
SELECT sd.id, sd.supplier_id, sd.stock_receipt_id, sd.reference_no, sd.total_amount, sd.amount_paid,
       sd.status, sd.note, sd.issued_at, sd.created_by, sd.created_at, sd.updated_at, s.name AS supplier_name
FROM supplier_debts sd
JOIN suppliers s ON s.id = sd.supplier_id AND s.deleted_at IS NULL
WHERE ($1::uuid IS NULL OR sd.supplier_id = $1)
  AND ($2::debt_status IS NULL OR sd.status = $2)
ORDER BY sd.issued_at DESC
LIMIT $3 OFFSET $4`
	var supID uuid.UUID
	var supValid bool
	if arg.SupplierID.Valid {
		supID = uuid.UUID(arg.SupplierID.Bytes)
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
	var out []SupplierDebtListRow
	for rows.Next() {
		var i SupplierDebtListRow
		if err := rows.Scan(
			&i.ID, &i.SupplierID, &i.StockReceiptID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
			&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt, &i.SupplierName,
		); err != nil {
			return nil, err
		}
		out = append(out, i)
	}
	return out, rows.Err()
}

func (q *Queries) CountSupplierDebts(ctx context.Context, arg CountSupplierDebtsParams) (int32, error) {
	const sql = `
SELECT COUNT(*)::int FROM supplier_debts sd
WHERE ($1::uuid IS NULL OR sd.supplier_id = $1)
  AND ($2::debt_status IS NULL OR sd.status = $2)`
	var supID uuid.UUID
	var supValid bool
	if arg.SupplierID.Valid {
		supID = uuid.UUID(arg.SupplierID.Bytes)
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

func (q *Queries) CreateSupplierDebt(ctx context.Context, arg CreateSupplierDebtParams) (SupplierDebt, error) {
	const sql = `
INSERT INTO supplier_debts (supplier_id, stock_receipt_id, reference_no, total_amount, amount_paid, status, note, issued_at, created_by)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, supplier_id, stock_receipt_id, reference_no, total_amount, amount_paid, status, note, issued_at, created_by, created_at, updated_at`
	row := q.db.QueryRow(ctx, sql,
		arg.SupplierID, arg.StockReceiptID, arg.ReferenceNo, arg.TotalAmount, arg.AmountPaid,
		arg.Status, arg.Note, arg.IssuedAt, arg.CreatedBy,
	)
	var i SupplierDebt
	err := row.Scan(
		&i.ID, &i.SupplierID, &i.StockReceiptID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
		&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

func (q *Queries) UpdateSupplierDebtAmounts(ctx context.Context, arg UpdateSupplierDebtAmountsParams) (SupplierDebt, error) {
	const sql = `
UPDATE supplier_debts SET amount_paid = $2, status = $3, updated_at = NOW() WHERE id = $1
RETURNING id, supplier_id, stock_receipt_id, reference_no, total_amount, amount_paid, status, note, issued_at, created_by, created_at, updated_at`
	row := q.db.QueryRow(ctx, sql, arg.ID, arg.AmountPaid, arg.Status)
	var i SupplierDebt
	err := row.Scan(
		&i.ID, &i.SupplierID, &i.StockReceiptID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
		&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

func (q *Queries) SetSupplierDebtStatus(ctx context.Context, id uuid.UUID, status DebtStatus) (SupplierDebt, error) {
	const sql = `
UPDATE supplier_debts SET status = $2, updated_at = NOW() WHERE id = $1
RETURNING id, supplier_id, stock_receipt_id, reference_no, total_amount, amount_paid, status, note, issued_at, created_by, created_at, updated_at`
	row := q.db.QueryRow(ctx, sql, id, status)
	var i SupplierDebt
	err := row.Scan(
		&i.ID, &i.SupplierID, &i.StockReceiptID, &i.ReferenceNo, &i.TotalAmount, &i.AmountPaid,
		&i.Status, &i.Note, &i.IssuedAt, &i.CreatedBy, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

func (q *Queries) InsertSupplierDebtPayment(ctx context.Context, arg InsertSupplierDebtPaymentParams) (SupplierDebtPayment, error) {
	const sql = `
INSERT INTO supplier_debt_payments (supplier_debt_id, amount, paid_at, note, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, supplier_debt_id, amount, paid_at, note, created_by, created_at`
	row := q.db.QueryRow(ctx, sql, arg.SupplierDebtID, arg.Amount, arg.PaidAt, arg.Note, arg.CreatedBy)
	var i SupplierDebtPayment
	err := row.Scan(&i.ID, &i.SupplierDebtID, &i.Amount, &i.PaidAt, &i.Note, &i.CreatedBy, &i.CreatedAt)
	return i, err
}

func (q *Queries) ListSupplierDebtPayments(ctx context.Context, debtID uuid.UUID) ([]SupplierDebtPayment, error) {
	const sql = `SELECT id, supplier_debt_id, amount, paid_at, note, created_by, created_at
FROM supplier_debt_payments WHERE supplier_debt_id = $1 ORDER BY paid_at DESC, created_at DESC`
	rows, err := q.db.Query(ctx, sql, debtID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SupplierDebtPayment
	for rows.Next() {
		var i SupplierDebtPayment
		if err := rows.Scan(&i.ID, &i.SupplierDebtID, &i.Amount, &i.PaidAt, &i.Note, &i.CreatedBy, &i.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, i)
	}
	return out, rows.Err()
}

func (q *Queries) ListSupplierDebtSummary(ctx context.Context) ([]SupplierDebtSummaryRow, error) {
	const sql = `
SELECT sd.supplier_id, s.name AS supplier_name,
       COALESCE(SUM(sd.total_amount - sd.amount_paid) FILTER (WHERE sd.status IN ('open', 'partial')), 0)::numeric(14,2),
       COUNT(*) FILTER (WHERE sd.status IN ('open', 'partial'))::int
FROM supplier_debts sd
JOIN suppliers s ON s.id = sd.supplier_id AND s.deleted_at IS NULL
GROUP BY sd.supplier_id, s.name
ORDER BY 3 DESC`
	rows, err := q.db.Query(ctx, sql)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SupplierDebtSummaryRow
	for rows.Next() {
		var i SupplierDebtSummaryRow
		if err := rows.Scan(&i.SupplierID, &i.SupplierName, &i.BalanceDue, &i.OpenCount); err != nil {
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
