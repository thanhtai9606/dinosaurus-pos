package products

import (
	"POS-kasir/internal/common/pagination"
	"time"

	"github.com/google/uuid"
)

type CreateProductOptionRequest struct {
	Name            string  `json:"name" validate:"required,min=1,max=100"`
	AdditionalPrice float64 `json:"additional_price" validate:"gte=0"`
}

type CreateProductRequest struct {
	Name                string                       `json:"name" validate:"required,min=3,max=100"`
	CategoryIDs         []int32                      `json:"category_ids" validate:"omitempty,dive,gt=0"`
	Price               float64                      `json:"price" validate:"required,gt=0"`
	CostPrice           float64                      `json:"cost_price" validate:"required,gte=0"`
	Stock               int32                        `json:"stock" validate:"required,gte=0"`
	Sku                 *string                      `json:"sku" validate:"omitempty,max=50"`
	Barcode             *string                      `json:"barcode" validate:"omitempty,max=100"`
	Unit                string                       `json:"unit" validate:"omitempty,max=20"`
	MinStock            int32                        `json:"min_stock" validate:"omitempty,gte=0"`
	DefaultSupplierID   *uuid.UUID                   `json:"default_supplier_id" validate:"omitempty"`
	Options             []CreateProductOptionRequest `json:"options" validate:"dive"`
}

type UpdateProductRequest struct {
	Name                *string    `json:"name" validate:"omitempty,min=3,max=100"`
	CategoryIDs         *[]int32   `json:"category_ids" validate:"omitempty,dive,gt=0"`
	Price               *float64   `json:"price" validate:"omitempty,gt=0"`
	CostPrice           *float64   `json:"cost_price" validate:"omitempty,gte=0"`
	Stock               *int32     `json:"stock" validate:"omitempty,gte=0"`
	Sku                 *string    `json:"sku" validate:"omitempty,max=50"`
	Barcode             *string    `json:"barcode" validate:"omitempty,max=100"`
	Unit                *string    `json:"unit" validate:"omitempty,max=20"`
	MinStock            *int32     `json:"min_stock" validate:"omitempty,gte=0"`
	DefaultSupplierID   *uuid.UUID `json:"default_supplier_id" validate:"omitempty"`
	Note                *string    `json:"note" validate:"omitempty,max=255"`
	ChangeType          *string    `json:"change_type" validate:"omitempty,oneof=sale restock correction return damage"`
}

type ListProductsRequest struct {
	pagination.PaginationRequest
	CategoryID    *int32 `query:"category_id" validate:"omitempty,gt=0"`
	LowStockOnly  *bool  `query:"low_stock_only" validate:"omitempty"`
}

type CreateProductOptionRequestStandalone struct {
	Name            string  `json:"name" validate:"required,min=1,max=100"`
	AdditionalPrice float64 `json:"additional_price" validate:"gte=0"`
}

type UpdateProductOptionRequest struct {
	Name            *string  `json:"name" validate:"omitempty,min=1,max=100"`
	AdditionalPrice *float64 `json:"additional_price" validate:"omitempty,gte=0"`
}

type ProductOptionResponse struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	AdditionalPrice float64   `json:"additional_price"`
	ImageURL        *string   `json:"image_url,omitempty"`
}

type ProductCategoryResponse struct {
	ID   int32  `json:"id"`
	Name string `json:"name"`
}

type ProductResponse struct {
	ID                  uuid.UUID                 `json:"id"`
	Name                string                    `json:"name"`
	Categories          []ProductCategoryResponse `json:"categories,omitempty"`
	ImageURL            *string                   `json:"image_url,omitempty"`
	Price               float64                   `json:"price"`
	CostPrice           float64                   `json:"cost_price"`
	Stock               int32                     `json:"stock"`
	Sku                 *string                   `json:"sku,omitempty"`
	Barcode             *string                   `json:"barcode,omitempty"`
	Unit                string                    `json:"unit"`
	MinStock            int32                     `json:"min_stock"`
	DefaultSupplierID   *uuid.UUID                `json:"default_supplier_id,omitempty"`
	CreatedAt           time.Time                 `json:"created_at"`
	UpdatedAt           time.Time                 `json:"updated_at"`
	DeletedAt           *time.Time                `json:"deleted_at,omitempty"`
	Options             []ProductOptionResponse   `json:"options,omitempty"`
}

type ProductListResponse struct {
	ID                  uuid.UUID                 `json:"id"`
	Name                string                    `json:"name"`
	Categories          []ProductCategoryResponse `json:"categories,omitempty"`
	ImageURL            *string                   `json:"image_url,omitempty"`
	Price               float64                   `json:"price"`
	CostPrice           float64                   `json:"cost_price"`
	Stock               int32                     `json:"stock"`
	Sku                 *string                   `json:"sku,omitempty"`
	Barcode             *string                   `json:"barcode,omitempty"`
	Unit                string                    `json:"unit"`
	MinStock            int32                     `json:"min_stock"`
	DefaultSupplierID   *uuid.UUID                `json:"default_supplier_id,omitempty"`
	DeletedAt           *time.Time                `json:"deleted_at,omitempty"`
}

type ListProductsResponse struct {
	Products   []ProductListResponse `json:"products"`
	Pagination pagination.Pagination `json:"pagination"`
}

type RestoreBulkRequest struct {
	ProductIDs []string `json:"product_ids" validate:"required,min=1"`
}

type ListStockHistoryRequest struct {
	pagination.PaginationRequest
}

type StockHistoryResponse struct {
	ID            uuid.UUID  `json:"id"`
	ProductID     uuid.UUID  `json:"product_id"`
	ChangeAmount  int32      `json:"change_amount"`
	PreviousStock int32      `json:"previous_stock"`
	CurrentStock  int32      `json:"current_stock"`
	ChangeType    string     `json:"change_type"`
	ReferenceID   *uuid.UUID `json:"reference_id,omitempty"`
	Note          *string    `json:"note,omitempty"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

type PagedStockHistoryResponse struct {
	History    []StockHistoryResponse `json:"history"`
	Pagination pagination.Pagination  `json:"pagination"`
}
