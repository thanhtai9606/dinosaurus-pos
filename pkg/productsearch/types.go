package productsearch

import (
	"context"

	"github.com/google/uuid"
)

type Document struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	SKU     string `json:"sku"`
	Barcode string `json:"barcode"`
	Unit    string `json:"unit"`
	Price   int64  `json:"price"`
	Stock   int32  `json:"stock"`
}

type Indexer interface {
	Enabled() bool
	EnsureIndex(ctx context.Context) error
	Index(ctx context.Context, doc Document) error
	Delete(ctx context.Context, id uuid.UUID) error
	Search(ctx context.Context, query string, limit int) ([]uuid.UUID, error)
	Reindex(ctx context.Context, docs []Document) error
}
