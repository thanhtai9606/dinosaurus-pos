package products

import (
	"context"
	"errors"
	"strings"

	"dinosaurus-pos/internal/common"

	"github.com/jackc/pgx/v5"
)

func (s *PrdService) LookupProductByCode(ctx context.Context, code string) (*ProductResponse, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return nil, common.ErrInvalidInput
	}

	if saleUnit, err := s.repo.GetProductUnitByBarcode(ctx, &code); err == nil {
		resp, err := s.GetProductByID(ctx, saleUnit.ProductID)
		if err != nil {
			return nil, err
		}
		uid := saleUnit.ID
		resp.MatchedSaleUnitID = &uid
		return resp, nil
	} else if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	product, err := s.repo.GetProductByBarcode(ctx, &code)
	if errors.Is(err, pgx.ErrNoRows) {
		product, err = s.repo.GetProductBySku(ctx, &code)
	}
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}

	return s.GetProductByID(ctx, product.ID)
}
