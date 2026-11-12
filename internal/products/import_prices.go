package products

import (
	"bytes"
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"

	"POS-kasir/internal/common"
	products_repo "POS-kasir/internal/products/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type ImportPriceRow struct {
	Sku       string   `json:"sku"`
	ProductID string   `json:"product_id"`
	CostPrice *float64 `json:"cost_price"`
	Price     *float64 `json:"price"`
}

type ImportPriceFailure struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

type ImportPricesResult struct {
	Updated int                  `json:"updated"`
	Failed  []ImportPriceFailure `json:"failed"`
}

func (s *PrdService) ImportProductPricesCSV(ctx context.Context, data []byte) (*ImportPricesResult, error) {
	rows, err := ParseImportPricesCSV(data)
	if err != nil {
		return nil, err
	}
	return s.ImportProductPrices(ctx, rows)
}

func (s *PrdService) ImportProductPrices(ctx context.Context, rows []ImportPriceRow) (*ImportPricesResult, error) {
	result := &ImportPricesResult{Failed: []ImportPriceFailure{}}

	for i, row := range rows {
		rowNum := i + 1
		if row.CostPrice == nil && row.Price == nil {
			result.Failed = append(result.Failed, ImportPriceFailure{Row: rowNum, Message: "cost_price or price required"})
			continue
		}

		var productID uuid.UUID

		switch {
		case row.ProductID != "":
			id, parseErr := uuid.Parse(strings.TrimSpace(row.ProductID))
			if parseErr != nil {
				result.Failed = append(result.Failed, ImportPriceFailure{Row: rowNum, Message: "invalid product_id"})
				continue
			}
			if _, getErr := s.repo.GetProductByID(ctx, id); getErr != nil {
				if errors.Is(getErr, pgx.ErrNoRows) {
					result.Failed = append(result.Failed, ImportPriceFailure{Row: rowNum, Message: "product not found"})
					continue
				}
				return nil, getErr
			}
			productID = id
		case row.Sku != "":
			sku := strings.TrimSpace(row.Sku)
			product, err := s.repo.GetProductBySku(ctx, &sku)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					result.Failed = append(result.Failed, ImportPriceFailure{Row: rowNum, Message: "sku not found"})
					continue
				}
				return nil, err
			}
			productID = product.ID
		default:
			result.Failed = append(result.Failed, ImportPriceFailure{Row: rowNum, Message: "sku or product_id required"})
			continue
		}

		if row.CostPrice != nil {
			var cost pgtype.Numeric
			_ = cost.Scan(fmt.Sprintf("%f", *row.CostPrice))
			if _, err := s.repo.SetProductCostPrice(ctx, products_repo.SetProductCostPriceParams{
				ID:        productID,
				CostPrice: cost,
			}); err != nil {
				result.Failed = append(result.Failed, ImportPriceFailure{Row: rowNum, Message: err.Error()})
				continue
			}
		}
		if row.Price != nil && *row.Price > 0 {
			if _, err := s.repo.SetProductSellPrice(ctx, products_repo.SetProductSellPriceParams{
				ID:    productID,
				Price: int64(*row.Price),
			}); err != nil {
				result.Failed = append(result.Failed, ImportPriceFailure{Row: rowNum, Message: err.Error()})
				continue
			}
		}
		result.Updated++
	}

	return result, nil
}

func ParseImportPricesCSV(data []byte) ([]ImportPriceRow, error) {
	r := csv.NewReader(bytes.NewReader(data))
	r.TrimLeadingSpace = true
	header, err := r.Read()
	if err != nil {
		return nil, common.ErrInvalidInput
	}

	col := map[string]int{}
	for i, h := range header {
		key := strings.ToLower(strings.TrimSpace(h))
		key = strings.ReplaceAll(key, " ", "_")
		col[key] = i
	}

	idx := func(names ...string) int {
		for _, n := range names {
			if i, ok := col[n]; ok {
				return i
			}
		}
		return -1
	}

	skuI := idx("sku", "product_sku")
	idI := idx("product_id", "id")
	costI := idx("cost_price", "cost", "unit_cost", "gia_von")
	priceI := idx("price", "sell_price", "selling_price", "gia_ban")

	if skuI < 0 && idI < 0 {
		return nil, fmt.Errorf("%w: csv must include sku or product_id column", common.ErrInvalidInput)
	}
	if costI < 0 && priceI < 0 {
		return nil, fmt.Errorf("%w: csv must include cost_price and/or price column", common.ErrInvalidInput)
	}

	parseF := func(row []string, i int) *float64 {
		if i < 0 || i >= len(row) {
			return nil
		}
		s := strings.TrimSpace(row[i])
		if s == "" {
			return nil
		}
		v, err := strconv.ParseFloat(s, 64)
		if err != nil {
			return nil
		}
		return &v
	}

	var out []ImportPriceRow
	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		item := ImportPriceRow{}
		if skuI >= 0 && skuI < len(row) {
			item.Sku = strings.TrimSpace(row[skuI])
		}
		if idI >= 0 && idI < len(row) {
			item.ProductID = strings.TrimSpace(row[idI])
		}
		item.CostPrice = parseF(row, costI)
		item.Price = parseF(row, priceI)
		if item.Sku == "" && item.ProductID == "" {
			continue
		}
		out = append(out, item)
	}
	if len(out) == 0 {
		return nil, common.ErrInvalidInput
	}
	return out, nil
}
