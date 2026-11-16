package repository

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type DebtStatus string

const (
	DebtStatusOpen    DebtStatus = "open"
	DebtStatusPartial DebtStatus = "partial"
	DebtStatusSettled DebtStatus = "settled"
	DebtStatusVoid    DebtStatus = "void"
)

func (e *DebtStatus) Scan(src interface{}) error {
	switch s := src.(type) {
	case string:
		*e = DebtStatus(s)
	case []byte:
		*e = DebtStatus(s)
	default:
		return fmt.Errorf("unsupported scan type for DebtStatus: %T", src)
	}
	return nil
}

type SupplierDebt struct {
	ID              uuid.UUID          `json:"id"`
	SupplierID      uuid.UUID          `json:"supplier_id"`
	StockReceiptID  pgtype.UUID        `json:"stock_receipt_id"`
	ReferenceNo     string             `json:"reference_no"`
	TotalAmount     pgtype.Numeric     `json:"total_amount"`
	AmountPaid      pgtype.Numeric     `json:"amount_paid"`
	Status          DebtStatus         `json:"status"`
	Note            *string            `json:"note"`
	IssuedAt        pgtype.Timestamptz `json:"issued_at"`
	CreatedBy       pgtype.UUID        `json:"created_by"`
	CreatedAt       pgtype.Timestamptz `json:"created_at"`
	UpdatedAt       pgtype.Timestamptz `json:"updated_at"`
}

type SupplierDebtPayment struct {
	ID             uuid.UUID          `json:"id"`
	SupplierDebtID uuid.UUID          `json:"supplier_debt_id"`
	Amount         pgtype.Numeric     `json:"amount"`
	PaidAt         pgtype.Timestamptz `json:"paid_at"`
	Note           *string            `json:"note"`
	CreatedBy      pgtype.UUID        `json:"created_by"`
	CreatedAt      pgtype.Timestamptz `json:"created_at"`
}

func NumericToFloat(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, _ := n.Float64Value()
	return f.Float64
}

func FloatToNumeric(v float64) pgtype.Numeric {
	var n pgtype.Numeric
	_ = n.Scan(fmt.Sprintf("%f", v))
	return n
}

func DebtStatusFromAmounts(total, paid float64) DebtStatus {
	if paid <= 0 {
		return DebtStatusOpen
	}
	if paid >= total-0.0001 {
		return DebtStatusSettled
	}
	return DebtStatusPartial
}

func PtrTime(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}
