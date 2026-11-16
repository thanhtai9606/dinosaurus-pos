package settings

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"dinosaurus-pos/internal/common"
)

const settingKeyPosQuickCash = "pos_quick_cash"

const maxQuickCashButtons = 8

// QuickCashSettings is stored as JSON in settings.pos_quick_cash.
type QuickCashSettings struct {
	Retail       []int64 `json:"retail"`
	StockReceipt []int64 `json:"stock_receipt"`
}

func normalizeMarketCode(market string) string {
	return strings.ToLower(strings.TrimSpace(market))
}

var (
	presetQuickCashVN = QuickCashSettings{
		Retail:       []int64{10_000, 20_000, 50_000, 100_000, 200_000},
		StockReceipt: []int64{100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000},
	}
	presetQuickCashUS = QuickCashSettings{
		Retail:       []int64{100, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000},
		StockReceipt: []int64{1_000, 5_000, 10_000, 20_000, 50_000, 100_000},
	}
)

func cloneQuickCash(p QuickCashSettings) QuickCashSettings {
	return QuickCashSettings{
		Retail:       append([]int64(nil), p.Retail...),
		StockReceipt: append([]int64(nil), p.StockReceipt...),
	}
}

// PresetsForMarket returns default quick-cash amounts for a new tenant onboarding market.
func PresetsForMarket(market string) QuickCashSettings {
	switch normalizeMarketCode(market) {
	case "id":
		return cloneQuickCash(presetQuickCashVN)
	case "us":
		return cloneQuickCash(presetQuickCashUS)
	default:
		return cloneQuickCash(presetQuickCashVN)
	}
}

// PresetsForCurrency returns defaults when pos_quick_cash is missing (legacy tenants).
func PresetsForCurrency(currency string) QuickCashSettings {
	switch strings.ToUpper(strings.TrimSpace(currency)) {
	case "IDR":
		return PresetsForMarket("id")
	case "USD":
		return PresetsForMarket("us")
	default:
		return PresetsForMarket("vn")
	}
}

func parseQuickCashSetting(raw string) (QuickCashSettings, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return QuickCashSettings{}, fmt.Errorf("empty quick cash")
	}
	var cfg QuickCashSettings
	if err := json.Unmarshal([]byte(raw), &cfg); err != nil {
		return QuickCashSettings{}, err
	}
	if err := validateQuickCashSettings(cfg); err != nil {
		return QuickCashSettings{}, err
	}
	return cfg, nil
}

func marshalQuickCashSettings(cfg QuickCashSettings) (string, error) {
	if err := validateQuickCashSettings(cfg); err != nil {
		return "", err
	}
	b, err := json.Marshal(cfg)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func validateQuickCashAmounts(amounts []int64) error {
	if len(amounts) == 0 || len(amounts) > maxQuickCashButtons {
		return fmt.Errorf("%w: quick cash must have 1-%d amounts", common.ErrBadRequest, maxQuickCashButtons)
	}
	seen := map[int64]struct{}{}
	for _, a := range amounts {
		if a <= 0 {
			return fmt.Errorf("%w: quick cash amounts must be positive integers", common.ErrBadRequest)
		}
		if _, ok := seen[a]; ok {
			return fmt.Errorf("%w: duplicate quick cash amount", common.ErrBadRequest)
		}
		seen[a] = struct{}{}
	}
	return nil
}

func validateQuickCashSettings(cfg QuickCashSettings) error {
	if err := validateQuickCashAmounts(cfg.Retail); err != nil {
		return err
	}
	return validateQuickCashAmounts(cfg.StockReceipt)
}

func resolveQuickCash(raw string, currency string) QuickCashSettings {
	cfg, err := parseQuickCashSetting(raw)
	if err == nil {
		return cfg
	}
	return PresetsForCurrency(currency)
}

func sortQuickCashAmounts(amounts []int64) []int64 {
	out := append([]int64(nil), amounts...)
	sort.Slice(out, func(i, j int) bool { return out[i] < out[j] })
	return out
}