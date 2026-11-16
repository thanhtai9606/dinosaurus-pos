package settings

import (
	"context"
	"errors"

	"dinosaurus-pos/internal/settings/repository"
	"dinosaurus-pos/internal/tenant"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type RegionalSeeder struct {
	repo repository.Querier
	log  logger.ILogger
}

func NewRegionalSeeder(repo repository.Querier, log logger.ILogger) *RegionalSeeder {
	return &RegionalSeeder{repo: repo, log: log}
}

func (s *RegionalSeeder) SeedIfMissing(ctx context.Context, tenantID uuid.UUID, market string) error {
	ctx = tenant.WithID(ctx, tenantID)
	_, err := s.repo.GetSettingByKey(ctx, settingKeyRegional)
	if err == nil {
		return nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	cfg := DefaultRegionalConfigForMarket(market)
	if err := upsertRegionalConfig(ctx, s.repo, cfg); err != nil {
		s.log.Warnf("seed regional for tenant %s: %v", tenantID, err)
		return err
	}
	return nil
}