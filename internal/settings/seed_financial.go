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

// FinancialSeeder seeds consolidated financial settings when a tenant is created.
type FinancialSeeder struct {
	repo repository.Querier
	log  logger.ILogger
}

func NewFinancialSeeder(repo repository.Querier, log logger.ILogger) *FinancialSeeder {
	return &FinancialSeeder{repo: repo, log: log}
}

func (s *FinancialSeeder) SeedIfMissing(ctx context.Context, tenantID uuid.UUID, market string) error {
	ctx = tenant.WithID(ctx, tenantID)
	_, err := s.repo.GetSettingByKey(ctx, settingKeyFinancial)
	if err == nil {
		return nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	cfg := DefaultFinancialConfigForMarket(market)
	if err := upsertFinancialConfig(ctx, s.repo, cfg); err != nil {
		s.log.Warnf("seed financial for tenant %s: %v", tenantID, err)
		return err
	}
	if err := NewRegionalSeeder(s.repo, s.log).SeedIfMissing(ctx, tenantID, market); err != nil {
		s.log.Warnf("seed regional for tenant %s: %v", tenantID, err)
	}
	return nil
}