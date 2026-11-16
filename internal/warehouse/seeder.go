package warehouse

import (
	"context"

	"dinosaurus-pos/internal/tenant"
	wh_repo "dinosaurus-pos/internal/warehouse/repository"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
)

type Seeder struct {
	repo *wh_repo.Queries
	log  logger.ILogger
}

func NewSeeder(repo *wh_repo.Queries, log logger.ILogger) *Seeder {
	return &Seeder{repo: repo, log: log}
}

func (s *Seeder) SeedDefaults(ctx context.Context, tenantID uuid.UUID) error {
	ctx = tenant.WithID(ctx, tenantID)
	if _, err := s.repo.SeedDefaultWarehouse(ctx, tenantID); err != nil {
		s.log.Errorf("SeedDefaultWarehouse: %v", err)
		return err
	}
	return nil
}