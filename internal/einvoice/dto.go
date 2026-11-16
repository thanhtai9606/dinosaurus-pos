package einvoice

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type IssueEInvoiceRequest struct {
	BuyerName    *string `json:"buyer_name" validate:"omitempty,max=255"`
	BuyerTaxCode *string `json:"buyer_tax_code" validate:"omitempty,max=32"`
}

type EInvoiceResponse struct {
	ID            uuid.UUID       `json:"id"`
	OrderID       uuid.UUID       `json:"order_id"`
	InvoiceNo     string          `json:"invoice_no"`
	BuyerName     *string         `json:"buyer_name,omitempty"`
	BuyerTaxCode  *string         `json:"buyer_tax_code,omitempty"`
	TotalAmount   int64           `json:"total_amount"`
	Status        string          `json:"status"`
	IssuedAt      time.Time       `json:"issued_at"`
	PayloadJSON   json.RawMessage `json:"payload_json,omitempty"`
}