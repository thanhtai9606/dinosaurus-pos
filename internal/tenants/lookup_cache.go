package tenants

import (
	"context"
	"encoding/json"
	"time"

	"dinosaurus-pos/pkg/cache"
)

const tenantLookupTTL = 15 * time.Minute
const tenantLookupMissTTL = 2 * time.Minute

type LookupResult struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

type lookupCacheEntry struct {
	Found bool   `json:"found"`
	Code  string `json:"code,omitempty"`
	Name  string `json:"name,omitempty"`
}

// LookupCache caches public tenant lookup by code (login UX).
type LookupCache struct {
	c cache.Cache
}

func NewLookupCache(c cache.Cache) *LookupCache {
	if c == nil {
		return nil
	}
	return &LookupCache{c: c}
}

func (l *LookupCache) key(code string) string {
	return "tenant:lookup:v1:" + code
}

func (l *LookupCache) Get(ctx context.Context, code string) (res *LookupResult, hit bool) {
	if l == nil || l.c == nil {
		return nil, false
	}
	raw, err := l.c.GetWithContext(ctx, l.key(code))
	if err != nil || raw == nil {
		return nil, false
	}
	var entry lookupCacheEntry
	if json.Unmarshal(raw, &entry) != nil {
		return nil, false
	}
	if !entry.Found {
		return nil, true
	}
	return &LookupResult{Code: entry.Code, Name: entry.Name}, true
}

func (l *LookupCache) SetHit(ctx context.Context, code string, res LookupResult) {
	if l == nil || l.c == nil {
		return
	}
	entry := lookupCacheEntry{Found: true, Code: res.Code, Name: res.Name}
	b, _ := json.Marshal(entry)
	_ = l.c.SetWithContext(ctx, l.key(code), b, tenantLookupTTL)
}

func (l *LookupCache) SetMiss(ctx context.Context, code string) {
	if l == nil || l.c == nil {
		return
	}
	entry := lookupCacheEntry{Found: false}
	b, _ := json.Marshal(entry)
	_ = l.c.SetWithContext(ctx, l.key(code), b, tenantLookupMissTTL)
}

func (l *LookupCache) InvalidateCode(code string) {
	if l == nil || l.c == nil || code == "" {
		return
	}
	_ = l.c.Delete(l.key(code))
}

func LookupCacheFromTenantRow(code, name string) LookupResult {
	return LookupResult{Code: code, Name: name}
}
