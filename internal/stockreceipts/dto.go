package stockreceipts

import (
	"POS-kasir/internal/common/pagination"
	"time"

	"github.com/google/uuid"
)

type ReceiptItemInput struct {
	ProductID     uuid.UUID `json:"product_id" validate:"required"`
	Quantity      int32     `json:"quantity" validate:"required,gt=0"`
	UnitCost      float64   `json:"unit_cost" validate:"required,gte=0"`
	UnitSellPrice *float64  `json:"unit_sell_price" validate:"omitempty,gte=0"`
}

type CreateStockReceiptRequest struct {
	SupplierID *uuid.UUID         `json:"supplier_id" validate:"omitempty"`
	ReceivedAt *time.Time         `json:"received_at" validate:"omitempty"`
	Note       *string            `json:"note" validate:"omitempty,max=500"`
	PaymentMode *string           `json:"payment_mode" validate:"omitempty,oneof=cash credit"`
	AmountPaid  *float64          `json:"amount_paid" validate:"omitempty,gte=0"`
	Items      []ReceiptItemInput `json:"items" validate:"omitempty,dive"`
}

type UpdateStockReceiptRequest struct {
	SupplierID *uuid.UUID         `json:"supplier_id"`
	ReceivedAt *time.Time         `json:"received_at"`
	Note       *string            `json:"note" validate:"omitempty,max=500"`
	PaymentMode *string           `json:"payment_mode" validate:"omitempty,oneof=cash credit"`
	AmountPaid  *float64          `json:"amount_paid" validate:"omitempty,gte=0"`
	Items      []ReceiptItemInput `json:"items" validate:"required,min=1,dive"`
}

type ListStockReceiptsRequest struct {
	pagination.PaginationRequest
	Status     *string    `query:"status" validate:"omitempty,oneof=draft completed cancelled"`
	SupplierID *uuid.UUID `query:"supplier_id"`
	FromDate   *time.Time `query:"from_date"`
	ToDate     *time.Time `query:"to_date"`
}

type StockReceiptItemResponse struct {
	ID                 uuid.UUID `json:"id"`
	ProductID          uuid.UUID `json:"product_id"`
	ProductName        string    `json:"product_name"`
	ProductSku         *string   `json:"product_sku,omitempty"`
	ProductBarcode     *string   `json:"product_barcode,omitempty"`
	Quantity           int32     `json:"quantity"`
	UnitCost           float64   `json:"unit_cost"`
	UnitSellPrice      *float64  `json:"unit_sell_price,omitempty"`
	LineTotal          float64   `json:"line_total"`
	ProductCostPrice   float64   `json:"product_cost_price,omitempty"`
	ProductSellPrice   float64   `json:"product_sell_price,omitempty"`
}

type StockReceiptResponse struct {
	ID           uuid.UUID                  `json:"id"`
	ReceiptNo    string                     `json:"receipt_no"`
	SupplierID   *uuid.UUID                 `json:"supplier_id,omitempty"`
	SupplierName *string                    `json:"supplier_name,omitempty"`
	Status       string                     `json:"status"`
	ReceivedAt   time.Time                  `json:"received_at"`
	Note         *string                    `json:"note,omitempty"`
	PaymentMode  string                     `json:"payment_mode,omitempty"`
	AmountPaid   float64                    `json:"amount_paid"`
	TotalAmount  float64                    `json:"total_amount"`
	Items        []StockReceiptItemResponse `json:"items,omitempty"`
	CreatedAt    time.Time                  `json:"created_at"`
	UpdatedAt    time.Time                  `json:"updated_at"`
}

type StockReceiptListItem struct {
	ID           uuid.UUID  `json:"id"`
	ReceiptNo    string     `json:"receipt_no"`
	SupplierID   *uuid.UUID `json:"supplier_id,omitempty"`
	SupplierName *string    `json:"supplier_name,omitempty"`
	Status       string     `json:"status"`
	ReceivedAt   time.Time  `json:"received_at"`
	TotalAmount  float64    `json:"total_amount"`
	CreatedAt    time.Time  `json:"created_at"`
}

type PagedStockReceiptResponse struct {
	Receipts   []StockReceiptListItem `json:"receipts"`
	Pagination pagination.Pagination `json:"pagination"`
}
