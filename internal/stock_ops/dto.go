package stock_ops

import (
	"time"

	"dinosaurus-pos/internal/common/pagination"

	"github.com/google/uuid"
)

type AdjustmentItemInput struct {
	ProductID     uuid.UUID `json:"product_id" validate:"required"`
	QuantityDelta int32     `json:"quantity_delta" validate:"required"`
	Note          *string   `json:"note" validate:"omitempty,max=255"`
}

type CreateAdjustmentRequest struct {
	WarehouseID uuid.UUID `json:"warehouse_id" validate:"required"`
	Reason      string    `json:"reason" validate:"required,oneof=correction damage restock"`
	Note        *string   `json:"note" validate:"omitempty,max=500"`
	Items       []AdjustmentItemInput `json:"items" validate:"omitempty,dive"`
}

type UpdateAdjustmentRequest struct {
	WarehouseID uuid.UUID             `json:"warehouse_id" validate:"required"`
	Reason      string                `json:"reason" validate:"required,oneof=correction damage restock"`
	Note        *string               `json:"note" validate:"omitempty,max=500"`
	Items       []AdjustmentItemInput `json:"items" validate:"required,min=1,dive"`
}

type ListAdjustmentsRequest struct {
	pagination.PaginationRequest
	Status      *string    `query:"status" validate:"omitempty,oneof=draft completed cancelled"`
	WarehouseID *uuid.UUID `query:"warehouse_id"`
}

type AdjustmentItemResponse struct {
	ID            uuid.UUID `json:"id"`
	ProductID     uuid.UUID `json:"product_id"`
	ProductName   string    `json:"product_name"`
	Code          *string   `json:"code,omitempty"`
	Sku           *string   `json:"sku,omitempty"`
	QuantityDelta int32     `json:"quantity_delta"`
	Note          *string   `json:"note,omitempty"`
}

type AdjustmentResponse struct {
	ID            uuid.UUID                `json:"id"`
	DocNo         string                   `json:"doc_no"`
	WarehouseID   uuid.UUID                `json:"warehouse_id"`
	WarehouseName string                   `json:"warehouse_name"`
	Status        string                   `json:"status"`
	Reason        string                   `json:"reason"`
	Note          *string                  `json:"note,omitempty"`
	Items         []AdjustmentItemResponse `json:"items,omitempty"`
	CreatedAt     time.Time                `json:"created_at"`
	UpdatedAt     time.Time                `json:"updated_at"`
	CompletedAt   *time.Time               `json:"completed_at,omitempty"`
}

type PagedAdjustmentsResponse struct {
	Adjustments []AdjustmentResponse `json:"adjustments"`
	Pagination  pagination.Pagination `json:"pagination"`
}

type TransferItemInput struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
	Quantity  int32     `json:"quantity" validate:"required,gt=0"`
}

type CreateTransferRequest struct {
	FromWarehouseID uuid.UUID           `json:"from_warehouse_id" validate:"required"`
	ToWarehouseID   uuid.UUID           `json:"to_warehouse_id" validate:"required"`
	Note            *string             `json:"note" validate:"omitempty,max=500"`
	Items           []TransferItemInput `json:"items" validate:"omitempty,dive"`
}

type UpdateTransferRequest struct {
	FromWarehouseID uuid.UUID           `json:"from_warehouse_id" validate:"required"`
	ToWarehouseID   uuid.UUID           `json:"to_warehouse_id" validate:"required"`
	Note            *string             `json:"note" validate:"omitempty,max=500"`
	Items           []TransferItemInput `json:"items" validate:"required,min=1,dive"`
}

type ListTransfersRequest struct {
	pagination.PaginationRequest
	Status *string `query:"status" validate:"omitempty,oneof=draft completed cancelled"`
}

type TransferItemResponse struct {
	ID          uuid.UUID `json:"id"`
	ProductID   uuid.UUID `json:"product_id"`
	ProductName string    `json:"product_name"`
	Code        *string   `json:"code,omitempty"`
	Sku         *string   `json:"sku,omitempty"`
	Quantity    int32     `json:"quantity"`
}

type TransferResponse struct {
	ID                uuid.UUID              `json:"id"`
	DocNo             string                 `json:"doc_no"`
	FromWarehouseID   uuid.UUID              `json:"from_warehouse_id"`
	FromWarehouseName string                 `json:"from_warehouse_name"`
	ToWarehouseID     uuid.UUID              `json:"to_warehouse_id"`
	ToWarehouseName   string                 `json:"to_warehouse_name"`
	Status            string                 `json:"status"`
	Note              *string                `json:"note,omitempty"`
	Items             []TransferItemResponse `json:"items,omitempty"`
	CreatedAt         time.Time              `json:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at"`
	CompletedAt       *time.Time             `json:"completed_at,omitempty"`
}

type PagedTransfersResponse struct {
	Transfers  []TransferResponse    `json:"transfers"`
	Pagination pagination.Pagination `json:"pagination"`
}

type StockTakeItemInput struct {
	ProductID   uuid.UUID `json:"product_id" validate:"required"`
	CountedQty  *int32    `json:"counted_qty" validate:"omitempty,gte=0"`
}

type CreateStockTakeRequest struct {
	WarehouseID uuid.UUID            `json:"warehouse_id" validate:"required"`
	Note        *string              `json:"note" validate:"omitempty,max=500"`
	Items       []StockTakeItemInput `json:"items" validate:"omitempty,dive"`
}

type UpdateStockTakeRequest struct {
	WarehouseID uuid.UUID            `json:"warehouse_id" validate:"required"`
	Note        *string              `json:"note" validate:"omitempty,max=500"`
	Items       []StockTakeItemInput `json:"items" validate:"required,min=1,dive"`
}

type ListStockTakesRequest struct {
	pagination.PaginationRequest
	Status *string `query:"status" validate:"omitempty,oneof=draft counting posted cancelled"`
}

type StockTakeItemResponse struct {
	ID          uuid.UUID `json:"id"`
	ProductID   uuid.UUID `json:"product_id"`
	ProductName string    `json:"product_name"`
	Code        *string   `json:"code,omitempty"`
	Sku         *string   `json:"sku,omitempty"`
	SystemQty   int32     `json:"system_qty"`
	CountedQty  *int32    `json:"counted_qty,omitempty"`
}

type StockTakeResponse struct {
	ID            uuid.UUID               `json:"id"`
	DocNo         string                  `json:"doc_no"`
	WarehouseID   uuid.UUID               `json:"warehouse_id"`
	WarehouseName string                  `json:"warehouse_name"`
	Status        string                  `json:"status"`
	Note          *string                 `json:"note,omitempty"`
	Items         []StockTakeItemResponse `json:"items,omitempty"`
	CreatedAt     time.Time               `json:"created_at"`
	UpdatedAt     time.Time               `json:"updated_at"`
	PostedAt      *time.Time              `json:"posted_at,omitempty"`
}

type PagedStockTakesResponse struct {
	StockTakes []StockTakeResponse   `json:"stock_takes"`
	Pagination pagination.Pagination `json:"pagination"`
}

type ListStockMovementsRequest struct {
	pagination.PaginationRequest
	ProductID   *uuid.UUID `query:"product_id"`
	WarehouseID *uuid.UUID `query:"warehouse_id"`
	ChangeType  *string    `query:"change_type"`
	FromAt      *time.Time `query:"from_at"`
	ToAt        *time.Time `query:"to_at"`
}

type StockMovementResponse struct {
	ID            uuid.UUID  `json:"id"`
	ProductID     uuid.UUID  `json:"product_id"`
	ProductName   string     `json:"product_name"`
	Code          *string    `json:"code,omitempty"`
	WarehouseID   *uuid.UUID `json:"warehouse_id,omitempty"`
	WarehouseName *string    `json:"warehouse_name,omitempty"`
	ChangeAmount  int32      `json:"change_amount"`
	PreviousStock int32      `json:"previous_stock"`
	CurrentStock  int32      `json:"current_stock"`
	ChangeType    string     `json:"change_type"`
	ReferenceID   *uuid.UUID `json:"reference_id,omitempty"`
	Note          *string    `json:"note,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

type PagedStockMovementsResponse struct {
	Movements  []StockMovementResponse `json:"movements"`
	Pagination pagination.Pagination   `json:"pagination"`
}