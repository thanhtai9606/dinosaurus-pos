package settings

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"context"

	"dinosaurus-pos/internal/common"
	settings_repo "dinosaurus-pos/internal/settings/repository"

	"github.com/jackc/pgx/v5"
)

const settingKeyRegional = "regional"

type DateStyle string

const (
	DateStyleDMY DateStyle = "DMY"
	DateStyleMDY DateStyle = "MDY"
	DateStyleYMD DateStyle = "YMD"
)

type TimeStyle string

const (
	TimeStyle24h TimeStyle = "24h"
	TimeStyle12h TimeStyle = "12h"
)

type WeekStart string

const (
	WeekStartMonday WeekStart = "monday"
	WeekStartSunday WeekStart = "sunday"
)

type RegionalConfig struct {
	Timezone     string    `json:"timezone"`
	DateStyle    DateStyle `json:"date_style"`
	TimeStyle    TimeStyle `json:"time_style"`
	WeekStartsOn WeekStart `json:"week_starts_on"`
}

func DefaultRegionalConfigForMarket(market string) RegionalConfig {
	tz := "Asia/Ho_Chi_Minh"
	dateStyle := DateStyleDMY
	switch normalizeMarketCode(market) {
	case "id":
		tz = "Asia/Jakarta"
	case "us":
		tz = "America/New_York"
		dateStyle = DateStyleMDY
	}
	return RegionalConfig{
		Timezone:     tz,
		DateStyle:    dateStyle,
		TimeStyle:    TimeStyle24h,
		WeekStartsOn: WeekStartMonday,
	}
}

func (c *RegionalConfig) Normalize() {
	def := DefaultRegionalConfigForMarket("")
	if strings.TrimSpace(c.Timezone) == "" {
		c.Timezone = def.Timezone
	}
	if _, err := time.LoadLocation(c.Timezone); err != nil {
		c.Timezone = def.Timezone
	}
	switch c.DateStyle {
	case DateStyleDMY, DateStyleMDY, DateStyleYMD:
	default:
		c.DateStyle = def.DateStyle
	}
	switch c.TimeStyle {
	case TimeStyle24h, TimeStyle12h:
	default:
		c.TimeStyle = def.TimeStyle
	}
	switch c.WeekStartsOn {
	case WeekStartMonday, WeekStartSunday:
	default:
		c.WeekStartsOn = def.WeekStartsOn
	}
}

func marshalRegionalConfig(cfg RegionalConfig) (string, error) {
	cfg.Normalize()
	b, err := json.Marshal(cfg)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func parseRegionalConfigJSON(raw string) (RegionalConfig, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return RegionalConfig{}, errors.New("empty regional config")
	}
	var cfg RegionalConfig
	if err := json.Unmarshal([]byte(raw), &cfg); err != nil {
		return RegionalConfig{}, err
	}
	cfg.Normalize()
	return cfg, nil
}

func regionalConfigToResponse(cfg RegionalConfig) *RegionalSettingsResponse {
	return &RegionalSettingsResponse{
		Timezone:     cfg.Timezone,
		DateStyle:    string(cfg.DateStyle),
		TimeStyle:    string(cfg.TimeStyle),
		WeekStartsOn: string(cfg.WeekStartsOn),
	}
}

func validateRegionalUpdate(req UpdateRegionalSettingsRequest) error {
	req.Timezone = strings.TrimSpace(req.Timezone)
	if req.Timezone == "" {
		return fmt.Errorf("%w: timezone required", common.ErrBadRequest)
	}
	if _, err := time.LoadLocation(req.Timezone); err != nil {
		return fmt.Errorf("%w: invalid timezone", common.ErrBadRequest)
	}
	switch DateStyle(strings.ToUpper(strings.TrimSpace(req.DateStyle))) {
	case DateStyleDMY, DateStyleMDY, DateStyleYMD:
	default:
		return fmt.Errorf("%w: invalid date_style", common.ErrBadRequest)
	}
	switch TimeStyle(req.TimeStyle) {
	case TimeStyle24h, TimeStyle12h:
	default:
		return fmt.Errorf("%w: invalid time_style", common.ErrBadRequest)
	}
	switch WeekStart(req.WeekStartsOn) {
	case WeekStartMonday, WeekStartSunday:
	default:
		return fmt.Errorf("%w: invalid week_starts_on", common.ErrBadRequest)
	}
	return nil
}

// LoadRegionalConfig reads tenant regional settings (defaults when missing).
func LoadRegionalConfig(ctx context.Context, q settings_repo.Querier) (RegionalConfig, error) {
	row, err := q.GetSettingByKey(ctx, settingKeyRegional)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return DefaultRegionalConfigForMarket(""), nil
		}
		return RegionalConfig{}, err
	}
	cfg, err := parseRegionalConfigJSON(row.Value)
	if err != nil {
		return DefaultRegionalConfigForMarket(""), nil
	}
	return cfg, nil
}