package tenant

import (
	"context"

	"dinosaurus-pos/internal/common"

	"github.com/google/uuid"
)

// DefaultTenantID is used for single-store installs and backfill.
var DefaultTenantID = uuid.MustParse("00000000-0000-0000-0000-000000000001")

func WithID(ctx context.Context, id uuid.UUID) context.Context {
	return context.WithValue(ctx, common.TenantIDKey, id)
}

func IDFromContext(ctx context.Context) (uuid.UUID, bool) {
	v, ok := ctx.Value(common.TenantIDKey).(uuid.UUID)
	if !ok || v == uuid.Nil {
		return uuid.Nil, false
	}
	return v, true
}
