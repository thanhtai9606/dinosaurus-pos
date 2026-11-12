package products

import (
	"context"
	"errors"
	"fmt"
	"math"

	"POS-kasir/internal/common"
	products_repo "POS-kasir/internal/products/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func numericFromFloat(v float64) pgtype.Numeric {
	var n pgtype.Numeric
	_ = n.Scan(fmt.Sprintf("%v", v))
	return n
}

func FloatFromNumeric(n pgtype.Numeric) float64 {
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return 1
	}
	return f.Float64
}

func mapProductUnit(u products_repo.ProductUnit) ProductSaleUnitResponse {
	return ProductSaleUnitResponse{
		ID:           u.ID,
		Name:         u.Name,
		IsBase:       u.IsBase,
		FactorToBase: FloatFromNumeric(u.FactorToBase),
		SellPrice:    float64(u.SellPrice),
		Barcode:      u.Barcode,
		Sku:          u.Sku,
		SortOrder:    u.SortOrder,
	}
}

func (s *PrdService) loadSaleUnits(ctx context.Context, productID uuid.UUID) ([]ProductSaleUnitResponse, error) {
	rows, err := s.repo.ListProductUnitsByProduct(ctx, productID)
	if err != nil {
		return nil, err
	}
	out := make([]ProductSaleUnitResponse, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapProductUnit(row))
	}
	return out, nil
}

func (s *PrdService) ensureBaseSaleUnit(ctx context.Context, qtx products_repo.Querier, product products_repo.Product) error {
	_, err := qtx.GetBaseProductUnit(ctx, product.ID)
	if err == nil {
		return nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	unit := product.Unit
	if unit == "" {
		unit = "pcs"
	}
	_, err = qtx.CreateProductUnit(ctx, products_repo.CreateProductUnitParams{
		ProductID:    product.ID,
		Name:         unit,
		IsBase:       true,
		FactorToBase: numericFromFloat(1),
		SellPrice:    product.Price,
		Barcode:      product.Barcode,
		Sku:          product.Sku,
		SortOrder:    0,
	})
	return err
}

func (s *PrdService) ReplaceSaleUnits(ctx context.Context, productID uuid.UUID, req ReplaceSaleUnitsRequest) (*ProductResponse, error) {
	_, err := s.repo.GetProductByID(ctx, productID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}

	baseCount := 0
	for _, u := range req.Units {
		if u.IsBase {
			baseCount++
		}
		if u.IsBase && u.FactorToBase != 1 {
			return nil, fmt.Errorf("base unit factor must be 1")
		}
		if !u.IsBase && u.FactorToBase < 1 {
			return nil, fmt.Errorf("invalid factor for %s", u.Name)
		}
	}
	if baseCount != 1 {
		return nil, fmt.Errorf("exactly one base unit is required")
	}

	err = s.store.ExecTx(ctx, func(tx pgx.Tx) error {
		qtx := products_repo.New(tx)
		if err := qtx.SoftDeleteProductUnitsByProduct(ctx, productID); err != nil {
			return err
		}
		var basePrice int64
		var baseUnitName string
		for _, u := range req.Units {
			if u.IsBase {
				basePrice = int64(u.SellPrice)
				baseUnitName = u.Name
			}
			_, err := qtx.CreateProductUnit(ctx, products_repo.CreateProductUnitParams{
				ProductID:    productID,
				Name:         u.Name,
				IsBase:       u.IsBase,
				FactorToBase: numericFromFloat(u.FactorToBase),
				SellPrice:    int64(u.SellPrice),
				Barcode:      u.Barcode,
				Sku:          u.Sku,
				SortOrder:    u.SortOrder,
			})
			if err != nil {
				return err
			}
		}
		_, err := qtx.UpdateProduct(ctx, products_repo.UpdateProductParams{
			ID:    productID,
			Price: &basePrice,
			Unit:  &baseUnitName,
		})
		return err
	})
	if err != nil {
		s.log.Errorf("ReplaceSaleUnits failed", "error", err)
		return nil, err
	}

	s.syncProductToSearch(ctx, productID)
	return s.GetProductByID(ctx, productID)
}

// SaleQtyToBase converts quantity in a sale unit to base-unit stock pieces (rounded up).
func SaleQtyToBase(qty int32, factor float64) int32 {
	if factor <= 0 {
		factor = 1
	}
	return int32(math.Ceil(float64(qty) * factor))
}
