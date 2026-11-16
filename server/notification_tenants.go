package server

import (
	"context"

	"dinosaurus-pos/internal/tenants"

	"github.com/google/uuid"
)

type notificationTenantLister struct {
	repo *tenants.Repository
}

func (n *notificationTenantLister) ListActiveTenantIDs(ctx context.Context) ([]uuid.UUID, error) {
	rows, err := n.repo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	var out []uuid.UUID
	for _, t := range rows {
		if t.IsActive {
			out = append(out, t.ID)
		}
	}
	return out, nil
}