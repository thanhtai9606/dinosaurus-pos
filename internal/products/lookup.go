package products

import (
	"context"
	"errors"
	"strings"

	"POS-kasir/internal/common"

	"github.com/jackc/pgx/v5"
)

func (s *PrdService) LookupProductByCode(ctx context.Context, code string) (*ProductResponse, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return nil, common.ErrInvalidInput
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
