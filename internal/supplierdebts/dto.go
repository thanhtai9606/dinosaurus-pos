package supplierdebts

import (
	"time"

	"POS-kasir/internal/common/pagination"

	"github.com/google/uuid"
)

type CreateManualSupplierDebtRequest struct {
	SupplierID  uuid.UUID `json:"supplier_id" validate:"required"`
	TotalAmount float64   `json:"total_amount" validate:"required,gt=0"`
	Note        *string   `json:"note" validate:"omitempty,max=500"`
	IssuedAt    *time.Time `json:"issued_at"`
}

type RecordSupplierDebtPaymentRequest struct {
	Amount float64    `json:"amount" validate:"required,gt=0"`
	PaidAt *time.Time `json:"paid_at"`
	Note   *string    `json:"note" validate:"omitempty,max=500"`
}

type ListSupplierDebtsRequest struct {
	pagination.PaginationRequest
	SupplierID *uuid.UUID `query:"supplier_id"`
	Status     *string    `query:"status" validate:"omitempty,oneof=open partial settled void"`
}

type SupplierDebtPaymentResponse struct {
	ID        uuid.UUID  `json:"id"`
	Amount    float64    `json:"amount"`
	PaidAt    time.Time  `json:"paid_at"`
	Note      *string    `json:"note,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type SupplierDebtResponse struct {
	ID             uuid.UUID  `json:"id"`
	SupplierID     uuid.UUID  `json:"supplier_id"`
	SupplierName   string     `json:"supplier_name"`
	StockReceiptID *uuid.UUID `json:"stock_receipt_id,omitempty"`
	ReferenceNo    string     `json:"reference_no"`
	TotalAmount    float64    `json:"total_amount"`
	AmountPaid     float64    `json:"amount_paid"`
	BalanceDue     float64    `json:"balance_due"`
	Status         string     `json:"status"`
	Note           *string    `json:"note,omitempty"`
	IssuedAt       time.Time  `json:"issued_at"`
	Payments       []SupplierDebtPaymentResponse `json:"payments,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type PagedSupplierDebtsResponse struct {
	Debts      []SupplierDebtResponse `json:"debts"`
	Pagination pagination.Pagination  `json:"pagination"`
}

type SupplierDebtSummaryItem struct {
	SupplierID   uuid.UUID `json:"supplier_id"`
	SupplierName string    `json:"supplier_name"`
	BalanceDue   float64   `json:"balance_due"`
	OpenCount    int       `json:"open_count"`
}

type SupplierDebtSummaryResponse struct {
	Items []SupplierDebtSummaryItem `json:"items"`
}
