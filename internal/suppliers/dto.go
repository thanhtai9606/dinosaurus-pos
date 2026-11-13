package suppliers

import (
	"dinosaurus-pos/internal/common/pagination"
	"time"

	"github.com/google/uuid"
)

type CreateSupplierRequest struct {
	Code     *string `json:"code" validate:"omitempty,max=50"`
	Name     string  `json:"name" validate:"required,max=150"`
	Phone    *string `json:"phone" validate:"omitempty,max=30"`
	Email    *string `json:"email" validate:"omitempty,email,max=255"`
	Address  *string `json:"address" validate:"omitempty"`
	TaxID    *string `json:"tax_id" validate:"omitempty,max=50"`
	Notes    *string `json:"notes" validate:"omitempty"`
	IsActive *bool   `json:"is_active" validate:"omitempty"`
}

type UpdateSupplierRequest struct {
	Code     *string `json:"code" validate:"omitempty,max=50"`
	Name     string  `json:"name" validate:"required,max=150"`
	Phone    *string `json:"phone" validate:"omitempty,max=30"`
	Email    *string `json:"email" validate:"omitempty,email,max=255"`
	Address  *string `json:"address" validate:"omitempty"`
	TaxID    *string `json:"tax_id" validate:"omitempty,max=50"`
	Notes    *string `json:"notes" validate:"omitempty"`
	IsActive bool    `json:"is_active"`
}

type ListSuppliersRequest struct {
	pagination.PaginationRequest
	Search string `query:"search" validate:"omitempty,max=100"`
}

type SupplierResponse struct {
	ID        uuid.UUID `json:"id"`
	Code      *string   `json:"code,omitempty"`
	Name      string    `json:"name"`
	Phone     *string   `json:"phone,omitempty"`
	Email     *string   `json:"email,omitempty"`
	Address   *string   `json:"address,omitempty"`
	TaxID     *string   `json:"tax_id,omitempty"`
	Notes     *string   `json:"notes,omitempty"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PagedSupplierResponse struct {
	Suppliers  []SupplierResponse    `json:"suppliers"`
	Pagination pagination.Pagination `json:"pagination"`
}
