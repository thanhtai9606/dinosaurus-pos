package productsearch

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/meilisearch/meilisearch-go"
)

type MeiliConfig struct {
	Host    string
	APIKey  string
	Index   string
	Enabled bool
}

type MeiliIndexer struct {
	client meilisearch.ServiceManager
	index  string
	on     bool
}

func NewMeiliIndexer(cfg MeiliConfig) *MeiliIndexer {
	if !cfg.Enabled || strings.TrimSpace(cfg.Host) == "" {
		return &MeiliIndexer{on: false}
	}
	idx := cfg.Index
	if idx == "" {
		idx = "products"
	}
	client := meilisearch.New(cfg.Host, meilisearch.WithAPIKey(cfg.APIKey))
	return &MeiliIndexer{client: client, index: idx, on: true}
}

func (m *MeiliIndexer) Enabled() bool { return m != nil && m.on }

func (m *MeiliIndexer) EnsureIndex(ctx context.Context) error {
	if !m.Enabled() {
		return nil
	}
	_, err := m.client.CreateIndex(ctx, &meilisearch.IndexConfig{Uid: m.index, PrimaryKey: "id"})
	if err != nil && !strings.Contains(strings.ToLower(err.Error()), "already exists") {
		return err
	}
	idx := m.client.Index(m.index)
	_, _ = idx.UpdateSearchableAttributes(ctx, &[]string{"name", "sku", "barcode"})
	filterable := []interface{}{"tenant_id"}
	_, _ = idx.UpdateFilterableAttributes(ctx, &filterable)
	return nil
}

func (m *MeiliIndexer) Index(ctx context.Context, doc Document) error {
	if !m.Enabled() {
		return nil
	}
	_, err := m.client.Index(m.index).AddDocuments(ctx, []Document{doc}, nil)
	return err
}

func (m *MeiliIndexer) Delete(ctx context.Context, id uuid.UUID) error {
	if !m.Enabled() {
		return nil
	}
	_, err := m.client.Index(m.index).DeleteDocument(ctx, id.String(), nil)
	return err
}

func (m *MeiliIndexer) Search(ctx context.Context, tenantID uuid.UUID, query string, limit int) ([]uuid.UUID, error) {
	if !m.Enabled() {
		return nil, fmt.Errorf("meilisearch disabled")
	}
	if tenantID == uuid.Nil {
		return nil, fmt.Errorf("tenant required for search")
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}
	filter := fmt.Sprintf("tenant_id = %q", tenantID.String())
	res, err := m.client.Index(m.index).Search(ctx, query, &meilisearch.SearchRequest{
		Limit:  int64(limit),
		Filter: &filter,
	})
	if err != nil {
		return nil, err
	}
	var ids []uuid.UUID
	for _, hit := range res.Hits {
		raw, err := json.Marshal(hit)
		if err != nil {
			continue
		}
		var m map[string]interface{}
		if json.Unmarshal(raw, &m) != nil {
			continue
		}
		idStr, _ := m["id"].(string)
		id, err := uuid.Parse(idStr)
		if err == nil {
			ids = append(ids, id)
		}
	}
	return ids, nil
}

func (m *MeiliIndexer) Reindex(ctx context.Context, docs []Document) error {
	if !m.Enabled() {
		return nil
	}
	if len(docs) == 0 {
		return nil
	}
	_, err := m.client.Index(m.index).AddDocuments(ctx, docs, nil)
	return err
}

type NoopIndexer struct{}

func (NoopIndexer) Enabled() bool                             { return false }
func (NoopIndexer) EnsureIndex(context.Context) error       { return nil }
func (NoopIndexer) Index(context.Context, Document) error { return nil }
func (NoopIndexer) Delete(context.Context, uuid.UUID) error {
	return nil
}
func (NoopIndexer) Search(context.Context, uuid.UUID, string, int) ([]uuid.UUID, error) {
	return nil, fmt.Errorf("search disabled")
}
func (NoopIndexer) Reindex(context.Context, []Document) error { return nil }
