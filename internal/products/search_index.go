package products

import (
	"context"

	"POS-kasir/internal/common/pagination"
	products_repo "POS-kasir/internal/products/repository"
	"POS-kasir/pkg/productsearch"

	"github.com/google/uuid"
)

func docFromListRow(p products_repo.ListProductsForSearchIndexRow) productsearch.Document {
	sku := ""
	if p.Sku != nil {
		sku = *p.Sku
	}
	barcode := ""
	if p.Barcode != nil {
		barcode = *p.Barcode
	}
	unit := p.Unit
	if unit == "" {
		unit = "pcs"
	}
	return productsearch.Document{
		ID:      p.ID.String(),
		Name:    p.Name,
		SKU:     sku,
		Barcode: barcode,
		Unit:    unit,
		Price:   p.Price,
		Stock:   p.Stock,
	}
}

func (s *PrdService) syncProductToSearch(ctx context.Context, productID uuid.UUID) {
	if s.search == nil || !s.search.Enabled() {
		return
	}
	row, err := s.repo.GetProductByID(ctx, productID)
	if err != nil {
		return
	}
	if row.DeletedAt.Valid {
		_ = s.search.Delete(ctx, productID)
		return
	}
	sku := ""
	if row.Sku != nil {
		sku = *row.Sku
	}
	barcode := ""
	if row.Barcode != nil {
		barcode = *row.Barcode
	}
	unit := row.Unit
	if unit == "" {
		unit = "pcs"
	}
	_ = s.search.Index(ctx, productsearch.Document{
		ID:      row.ID.String(),
		Name:    row.Name,
		SKU:     sku,
		Barcode: barcode,
		Unit:    unit,
		Price:   row.Price,
		Stock:   row.Stock,
	})
}

func (s *PrdService) removeProductFromSearch(ctx context.Context, productID uuid.UUID) {
	if s.search == nil || !s.search.Enabled() {
		return
	}
	_ = s.search.Delete(ctx, productID)
}

func (s *PrdService) ReindexProductSearch(ctx context.Context) (int, error) {
	if s.search == nil || !s.search.Enabled() {
		return 0, nil
	}
	rows, err := s.repo.ListProductsForSearchIndex(ctx)
	if err != nil {
		return 0, err
	}
	docs := make([]productsearch.Document, 0, len(rows))
	for _, r := range rows {
		docs = append(docs, docFromListRow(r))
	}
	if err := s.search.Reindex(ctx, docs); err != nil {
		return 0, err
	}
	return len(docs), nil
}

func (s *PrdService) SearchProducts(ctx context.Context, query string, limit int) (*ListProductsResponse, error) {
	if limit <= 0 {
		limit = 20
	}
	fallback := func() (*ListProductsResponse, error) {
		return s.ListProducts(ctx, ListProductsRequest{
			PaginationRequest: pagination.PaginationRequest{Page: 1, Limit: limit, Search: query},
		})
	}
	if s.search == nil || !s.search.Enabled() {
		return fallback()
	}
	ids, err := s.search.Search(ctx, query, limit)
	if err != nil {
		s.log.Warn("Meilisearch search failed, falling back to SQL", "error", err)
		return fallback()
	}
	if len(ids) == 0 {
		return &ListProductsResponse{
			Products:   []ProductListResponse{},
			Pagination: pagination.BuildPagination(1, 0, limit),
		}, nil
	}
	products, err := s.repo.GetProductsByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	byID := map[uuid.UUID]products_repo.Product{}
	for _, p := range products {
		byID[p.ID] = p
	}
	var list []ProductListResponse
	for _, id := range ids {
		p, ok := byID[id]
		if !ok {
			continue
		}
		unit := p.Unit
		if unit == "" {
			unit = "pcs"
		}
		cost := numericToFloat(p.CostPrice)
		list = append(list, ProductListResponse{
			ID:        p.ID,
			Name:      p.Name,
			ImageURL:  p.ImageUrl,
			Price:     float64(p.Price),
			CostPrice: cost,
			Stock:     p.Stock,
			Sku:       p.Sku,
			Barcode:   p.Barcode,
			Unit:      unit,
			MinStock:  p.MinStock,
		})
	}
	return &ListProductsResponse{
		Products:   list,
		Pagination: pagination.BuildPagination(1, len(list), limit),
	}, nil
}
