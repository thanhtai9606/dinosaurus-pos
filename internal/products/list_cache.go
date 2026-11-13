package products

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"dinosaurus-pos/internal/tenant"
	"dinosaurus-pos/pkg/cache"
)

const (
	listCacheTTL   = 45 * time.Second
	searchCacheTTL = 30 * time.Second
	listVerKeyTTL  = 24 * time.Hour
)

// ListCache short-TTL Redis cache for product list + search reads (per tenant).
type ListCache struct {
	c cache.Cache
}

func NewListCache(c cache.Cache) *ListCache {
	if c == nil {
		return nil
	}
	return &ListCache{c: c}
}

func (lc *ListCache) versionKey(tenantID string) string {
	return "products:list:ver:" + tenantID
}

func (lc *ListCache) tenantVersion(ctx context.Context, tenantID string) int64 {
	if lc == nil || lc.c == nil {
		return 0
	}
	raw, err := lc.c.GetWithContext(ctx, lc.versionKey(tenantID))
	if err != nil || len(raw) == 0 {
		return 0
	}
	v, err := strconv.ParseInt(string(raw), 10, 64)
	if err != nil {
		return 0
	}
	return v
}

func (lc *ListCache) BumpTenant(ctx context.Context, tenantID string) {
	if lc == nil || lc.c == nil || tenantID == "" {
		return
	}
	next := lc.tenantVersion(ctx, tenantID) + 1
	_ = lc.c.SetWithContext(ctx, lc.versionKey(tenantID), []byte(strconv.FormatInt(next, 10)), listVerKeyTTL)
}

func listParamsHash(req ListProductsRequest) string {
	req.SetDefaults()
	h := sha256.New()
	_, _ = fmt.Fprintf(h, "p=%d&l=%d&s=%s", req.Page, req.Limit, req.Search)
	if req.CategoryID != nil {
		_, _ = fmt.Fprintf(h, "&c=%d", *req.CategoryID)
	}
	if req.LowStockOnly != nil {
		_, _ = fmt.Fprintf(h, "&low=%t", *req.LowStockOnly)
	}
	return hex.EncodeToString(h.Sum(nil))[:16]
}

func (lc *ListCache) listKey(tenantID string, ver int64, req ListProductsRequest) string {
	return fmt.Sprintf("products:list:v1:%s:%d:%s", tenantID, ver, listParamsHash(req))
}

func (lc *ListCache) GetList(ctx context.Context, tenantID string, req ListProductsRequest) (*ListProductsResponse, bool) {
	if lc == nil || lc.c == nil {
		return nil, false
	}
	ver := lc.tenantVersion(ctx, tenantID)
	raw, err := lc.c.GetWithContext(ctx, lc.listKey(tenantID, ver, req))
	if err != nil || len(raw) == 0 {
		return nil, false
	}
	var out ListProductsResponse
	if json.Unmarshal(raw, &out) != nil {
		return nil, false
	}
	return &out, true
}

func (lc *ListCache) SetList(ctx context.Context, tenantID string, req ListProductsRequest, data *ListProductsResponse) {
	if lc == nil || lc.c == nil || data == nil {
		return
	}
	ver := lc.tenantVersion(ctx, tenantID)
	b, err := json.Marshal(data)
	if err != nil {
		return
	}
	_ = lc.c.SetWithContext(ctx, lc.listKey(tenantID, ver, req), b, listCacheTTL)
}

func (lc *ListCache) searchKey(tenantID string, ver int64, query string, limit int) string {
	h := sha256.Sum256([]byte(query))
	return fmt.Sprintf("products:search:v1:%s:%d:%s:%d", tenantID, ver, hex.EncodeToString(h[:8]), limit)
}

func (lc *ListCache) GetSearch(ctx context.Context, tenantID, query string, limit int) (*ListProductsResponse, bool) {
	if lc == nil || lc.c == nil {
		return nil, false
	}
	ver := lc.tenantVersion(ctx, tenantID)
	raw, err := lc.c.GetWithContext(ctx, lc.searchKey(tenantID, ver, query, limit))
	if err != nil || len(raw) == 0 {
		return nil, false
	}
	var out ListProductsResponse
	if json.Unmarshal(raw, &out) != nil {
		return nil, false
	}
	return &out, true
}

func (lc *ListCache) SetSearch(ctx context.Context, tenantID, query string, limit int, data *ListProductsResponse) {
	if lc == nil || lc.c == nil || data == nil {
		return
	}
	ver := lc.tenantVersion(ctx, tenantID)
	b, err := json.Marshal(data)
	if err != nil {
		return
	}
	_ = lc.c.SetWithContext(ctx, lc.searchKey(tenantID, ver, query, limit), b, searchCacheTTL)
}

func (s *PrdService) invalidateProductListCache(ctx context.Context) {
	if s.listCache == nil {
		return
	}
	tid, ok := tenant.IDFromContext(ctx)
	if !ok {
		return
	}
	s.listCache.BumpTenant(ctx, tid.String())
}
