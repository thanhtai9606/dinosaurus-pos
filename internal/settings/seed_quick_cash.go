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

// QuickCashSeeder seeds pos_quick_cash when a tenant is created.
type QuickCashSeeder struct {
	repo repository.Querier
	log  logger.ILogger
}

func NewQuickCashSeeder(repo repository.Querier, log logger.ILogger) *QuickCashSeeder {
	return &QuickCashSeeder{repo: repo, log: log}
}

func (s *QuickCashSeeder) SeedIfMissing(ctx context.Context, tenantID uuid.UUID, market string) error {
	ctx = tenant.WithID(ctx, tenantID)
	_, err := s.repo.GetSettingByKey(ctx, settingKeyPosQuickCash)
	if err == nil {
		return nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	presets := PresetsForMarket(market)
	raw, err := marshalQuickCashSettings(presets)
	if err != nil {
		return err
	}
	if _, err := s.repo.UpsertSetting(ctx, repository.UpsertSettingParams{
		Key:   settingKeyPosQuickCash,
		Value: raw,
	}); err != nil {
		s.log.Warnf("seed pos quick cash for tenant %s: %v", tenantID, err)
		return err
	}
	return nil
}