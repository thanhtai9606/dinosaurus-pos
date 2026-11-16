package warehouse

import (
	"time"

	"dinosaurus-pos/internal/common/pagination"

	"github.com/google/uuid"
)

type CreateWarehouseRequest struct {
	Code       string `json:"code" validate:"required,min=2,max=32"`
	Name       string `json:"name" validate:"required,min=2,max=100"`
	IsDefault  *bool  `json:"is_default,omitempty"`
	IsActive   *bool  `json:"is_active,omitempty"`
}

type UpdateWarehouseRequest struct {
	Code      *string `json:"code" validate:"omitempty,min=2,max=32"`
	Name      *string `json:"name" validate:"omitempty,min=2,max=100"`
	IsDefault *bool   `json:"is_default,omitempty"`
	IsActive  *bool   `json:"is_active,omitempty"`
}

type WarehouseResponse struct {
	ID        uuid.UUID `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	IsDefault bool      `json:"is_default"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ListWarehousesRequest struct {
	pagination.PaginationRequest
	Search     string `query:"search"`
	ActiveOnly *bool  `query:"active_only"`
}

type PagedWarehousesResponse struct {
	Warehouses []WarehouseResponse      `json:"warehouses"`
	Pagination pagination.Pagination    `json:"pagination"`
}

type WarehouseStockLine struct {
	ProductID   uuid.UUID `json:"product_id"`
	ProductName string    `json:"product_name"`
	Code        *string   `json:"code,omitempty"`
	Sku         *string   `json:"sku,omitempty"`
	Unit        string    `json:"unit"`
	Quantity    int32     `json:"quantity"`
	MinStock    int32     `json:"min_stock"`
}

type PagedWarehouseStockResponse struct {
	Lines      []WarehouseStockLine   `json:"lines"`
	Pagination pagination.Pagination  `json:"pagination"`
}