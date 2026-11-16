package settings

import (
	"context"

	"dinosaurus-pos/internal/settings/repository"
)

func upsertRegionalConfig(ctx context.Context, qtx repository.Querier, cfg RegionalConfig) error {
	raw, err := marshalRegionalConfig(cfg)
	if err != nil {
		return err
	}
	_, err = qtx.UpsertSetting(ctx, repository.UpsertSettingParams{
		Key:   settingKeyRegional,
		Value: raw,
	})
	return err
}