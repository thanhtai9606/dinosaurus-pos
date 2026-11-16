package settings

import (
	"context"

	"dinosaurus-pos/internal/settings/repository"
)

func deleteLegacyFinancialKeys(ctx context.Context, qtx repository.Querier) error {
	for _, key := range legacyFinancialKeys {
		if err := qtx.DeleteSetting(ctx, key); err != nil {
			return err
		}
	}
	return nil
}

func upsertFinancialConfig(ctx context.Context, qtx repository.Querier, cfg FinancialConfig) error {
	raw, err := marshalFinancialConfig(cfg)
	if err != nil {
		return err
	}
	if _, err := qtx.UpsertSetting(ctx, repository.UpsertSettingParams{
		Key: settingKeyFinancial, Value: raw,
	}); err != nil {
		return err
	}
	return deleteLegacyFinancialKeys(ctx, qtx)
}