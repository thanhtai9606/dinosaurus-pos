package inventory

import (
	"context"
	"errors"
	"fmt"

	"dinosaurus-pos/internal/common"
	products_repo "dinosaurus-pos/internal/products/repository"
	wh_repo "dinosaurus-pos/internal/warehouse/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var ErrInsufficientWarehouseStock = fmt.Errorf("%w: insufficient warehouse stock", common.ErrInvalidInput)

// ApplyWarehouseDelta updates warehouse_stock, syncs products.stock aggregate, and records stock_history.
func ApplyWarehouseDelta(
	ctx context.Context,
	prd *products_repo.Queries,
	wh *wh_repo.Queries,
	warehouseID uuid.UUID,
	productID uuid.UUID,
	delta int32,
	changeType products_repo.StockChangeType,
	refID pgtype.UUID,
	note *string,
	createdBy pgtype.UUID,
) error {
	if delta == 0 {
		return nil
	}
	prod, err := prd.GetProductByID(ctx, productID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return common.ErrNotFound
		}
		return err
	}
	tenantID := prod.TenantID
	row, err := wh.GetWarehouseStock(ctx, warehouseID, productID)
	if errors.Is(err, pgx.ErrNoRows) {
		row, err = wh.EnsureWarehouseStockRow(ctx, tenantID, warehouseID, productID, prod.MinStock)
		if err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	prevWh := row.Quantity
	updated, err := wh.AddWarehouseStockQty(ctx, warehouseID, productID, delta)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrInsufficientWarehouseStock
		}
		return err
	}

	total, err := wh.SumProductStockAcrossWarehouses(ctx, productID)
	if err != nil {
		return err
	}
	prevAgg := prod.Stock
	if _, err := prd.SetProductStock(ctx, products_repo.SetProductStockParams{
		ID:    productID,
		Stock: total,
	}); err != nil {
		return err
	}

	whID := pgtype.UUID{Bytes: warehouseID, Valid: true}
	_, err = prd.CreateStockHistory(ctx, products_repo.CreateStockHistoryParams{
		ProductID:     productID,
		WarehouseID:   whID,
		ChangeAmount:  delta,
		PreviousStock: prevWh,
		CurrentStock:  updated.Quantity,
		ChangeType:    changeType,
		ReferenceID:   refID,
		Note:          note,
		CreatedBy:     createdBy,
	})
	if err != nil {
		return err
	}
	_ = prevAgg
	return nil
}