package products

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"

	"dinosaurus-pos/internal/common"
	products_repo "dinosaurus-pos/internal/products/repository"

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
	var muID *uuid.UUID
	var muCode *string
	if u.MeasurementUnitID.Valid {
		id := uuid.UUID(u.MeasurementUnitID.Bytes)
		muID = &id
	}
	resp := ProductSaleUnitResponse{
		ID:             u.ID,
		MeasurementUnitID: muID,
		Name:           u.Name,
		IsBase:         u.IsBase,
		FactorToBase:   FloatFromNumeric(u.FactorToBase),
		SellPrice:      float64(u.SellPrice),
		WholesalePrice: float64(u.WholesalePrice),
		Barcode:        u.Barcode,
		Sku:            u.Sku,
		SortOrder:      u.SortOrder,
	}
	if muCode != nil {
		resp.MeasurementUnitCode = muCode
	}
	return resp
}

func mapProductUnitWithCode(u products_repo.ProductUnit, code string) ProductSaleUnitResponse {
	r := mapProductUnit(u)
	if code != "" {
		r.MeasurementUnitCode = &code
	}
	return r
}

func (s *PrdService) loadSaleUnits(ctx context.Context, productID uuid.UUID) ([]ProductSaleUnitResponse, error) {
	rows, err := s.repo.ListProductUnitsByProduct(ctx, productID)
	if err != nil {
		return nil, err
	}
	out := make([]ProductSaleUnitResponse, 0, len(rows))
	for _, row := range rows {
		code := ""
		if row.MeasurementUnitID.Valid {
			label, err := s.repo.GetMeasurementUnitLabel(ctx, uuid.UUID(row.MeasurementUnitID.Bytes))
			if err == nil {
				code = label.Code
			}
		}
		out = append(out, mapProductUnitWithCode(row, code))
	}
	return out, nil
}

// EnsureBaseProductUnit creates the default base sale unit when missing (legacy rows / old imports).
func EnsureBaseProductUnit(ctx context.Context, qtx products_repo.Querier, product products_repo.Product) error {
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
	barcode := product.Barcode
	if barcode == nil || strings.TrimSpace(*barcode) == "" {
		generated := generateProductUnitBarcode(product.ID, 0)
		barcode = &generated
	}
	_, err = qtx.CreateProductUnit(ctx, products_repo.CreateProductUnitParams{
		ProductID:         product.ID,
		MeasurementUnitID: pgtype.UUID{Valid: false},
		Name:              unit,
		IsBase:            true,
		FactorToBase:      numericFromFloat(1),
		SellPrice:         product.Price,
		WholesalePrice:    0,
		Barcode:           barcode,
		Sku:               product.Sku,
		SortOrder:         0,
	})
	return err
}

func (s *PrdService) ensureBaseSaleUnit(ctx context.Context, qtx products_repo.Querier, product products_repo.Product) error {
	return EnsureBaseProductUnit(ctx, qtx, product)
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
	seenUnits := map[uuid.UUID]struct{}{}
	for _, u := range req.Units {
		if u.MeasurementUnitID == uuid.Nil {
			return nil, fmt.Errorf("measurement_unit_id is required")
		}
		if _, dup := seenUnits[u.MeasurementUnitID]; dup {
			return nil, fmt.Errorf("duplicate measurement unit on product")
		}
		seenUnits[u.MeasurementUnitID] = struct{}{}
		if u.IsBase {
			baseCount++
		}
		if u.IsBase && u.FactorToBase != 1 {
			return nil, fmt.Errorf("base unit factor must be 1")
		}
		if !u.IsBase && u.FactorToBase < 1 {
			return nil, fmt.Errorf("invalid factor for unit")
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
		var baseBarcode *string
		for i, u := range req.Units {
			label, err := qtx.GetMeasurementUnitLabel(ctx, u.MeasurementUnitID)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					return fmt.Errorf("measurement unit not found")
				}
				return err
			}
			unitName := label.Name
			barcode := u.Barcode
			if barcode == nil || strings.TrimSpace(*barcode) == "" {
				generated := generateProductUnitBarcode(productID, int32(i))
				barcode = &generated
			}
			mu := pgtype.UUID{Bytes: u.MeasurementUnitID, Valid: true}
			_, err = qtx.CreateProductUnit(ctx, products_repo.CreateProductUnitParams{
				ProductID:         productID,
				MeasurementUnitID: mu,
				Name:              unitName,
				IsBase:            u.IsBase,
				FactorToBase:      numericFromFloat(u.FactorToBase),
				SellPrice:         int64(u.SellPrice),
				WholesalePrice:    int64(u.WholesalePrice),
				Barcode:           barcode,
				Sku:               u.Sku,
				SortOrder:         u.SortOrder,
			})
			if err != nil {
				return err
			}
			if u.IsBase {
				basePrice = int64(u.SellPrice)
				baseUnitName = label.Code
				if baseUnitName == "" {
					baseUnitName = unitName
				}
				baseBarcode = barcode
			}
		}
		_, err := qtx.UpdateProduct(ctx, products_repo.UpdateProductParams{
			ID:      productID,
			Price:   &basePrice,
			Unit:    &baseUnitName,
			Barcode: baseBarcode,
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
