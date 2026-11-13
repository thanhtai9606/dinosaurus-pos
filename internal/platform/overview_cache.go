package platform

import (
	"context"
	"encoding/json"
	"time"

	"dinosaurus-pos/pkg/cache"
)

const overviewCacheTTL = 45 * time.Second

// OverviewCache short-TTL cache for super-admin platform overview.
type OverviewCache struct {
	c cache.Cache
}

func NewOverviewCache(c cache.Cache) *OverviewCache {
	if c == nil {
		return nil
	}
	return &OverviewCache{c: c}
}

func (o *OverviewCache) key() string {
	return "platform:overview:v1"
}

func (o *OverviewCache) Get(ctx context.Context) (Overview, bool) {
	if o == nil || o.c == nil {
		return Overview{}, false
	}
	raw, err := o.c.GetWithContext(ctx, o.key())
	if err != nil || raw == nil {
		return Overview{}, false
	}
	var out Overview
	if json.Unmarshal(raw, &out) != nil {
		return Overview{}, false
	}
	return out, true
}

func (o *OverviewCache) Set(ctx context.Context, data Overview) {
	if o == nil || o.c == nil {
		return
	}
	b, err := json.Marshal(data)
	if err != nil {
		return
	}
	_ = o.c.SetWithContext(ctx, o.key(), b, overviewCacheTTL)
}

func (o *OverviewCache) Invalidate() {
	if o == nil || o.c == nil {
		return
	}
	_ = o.c.Delete(o.key())
}
