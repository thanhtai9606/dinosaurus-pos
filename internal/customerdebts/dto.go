package customerdebts

import (
	"time"

	"dinosaurus-pos/internal/common/pagination"

	"github.com/google/uuid"
)

type CreateManualCustomerDebtRequest struct {
	CustomerID  uuid.UUID `json:"customer_id" validate:"required"`
	TotalAmount float64   `json:"total_amount" validate:"required,gt=0"`
	Note        *string   `json:"note" validate:"omitempty,max=500"`
	IssuedAt    *time.Time `json:"issued_at"`
}

type RecordCustomerDebtPaymentRequest struct {
	Amount float64    `json:"amount" validate:"required,gt=0"`
	PaidAt *time.Time `json:"paid_at"`
	Note   *string    `json:"note" validate:"omitempty,max=500"`
}

type ListCustomerDebtsRequest struct {
	pagination.PaginationRequest
	CustomerID *uuid.UUID `query:"customer_id"`
	Status     *string    `query:"status" validate:"omitempty,oneof=open partial settled void"`
}

type CustomerDebtPaymentResponse struct {
	ID        uuid.UUID  `json:"id"`
	Amount    float64    `json:"amount"`
	PaidAt    time.Time  `json:"paid_at"`
	Note      *string    `json:"note,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type CustomerDebtResponse struct {
	ID             uuid.UUID  `json:"id"`
	CustomerID     uuid.UUID  `json:"customer_id"`
	CustomerName   string     `json:"customer_name"`
	OrderID *uuid.UUID `json:"order_id,omitempty"`
	ReferenceNo    string     `json:"reference_no"`
	TotalAmount    float64    `json:"total_amount"`
	AmountPaid     float64    `json:"amount_paid"`
	BalanceDue     float64    `json:"balance_due"`
	Status         string     `json:"status"`
	Note           *string    `json:"note,omitempty"`
	IssuedAt       time.Time  `json:"issued_at"`
	Payments       []CustomerDebtPaymentResponse `json:"payments,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type PagedCustomerDebtsResponse struct {
	Debts      []CustomerDebtResponse `json:"debts"`
	Pagination pagination.Pagination  `json:"pagination"`
}

type CustomerDebtSummaryItem struct {
	CustomerID   uuid.UUID `json:"customer_id"`
	CustomerName string    `json:"customer_name"`
	BalanceDue   float64   `json:"balance_due"`
	OpenCount    int       `json:"open_count"`
}

type CustomerDebtSummaryResponse struct {
	Items []CustomerDebtSummaryItem `json:"items"`
}
