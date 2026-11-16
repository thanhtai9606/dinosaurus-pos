package settings

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"dinosaurus-pos/internal/common"
)

const settingKeyFinancial = "financial"

var legacyFinancialKeys = []string{
	"currency", "tax_rate", "service_charge_rate", "tax_enabled",
	"supported_currencies", settingKeyPosQuickCash,
}

// FinancialConfig is the consolidated settings.financial JSON document.
type FinancialConfig struct {
	Currency            string            `json:"currency"`
	TaxRate             float64           `json:"tax_rate"`
	ServiceChargeRate   float64           `json:"service_charge_rate"`
	TaxEnabled          bool              `json:"tax_enabled"`
	AvailableCurrencies []CurrencyOption    `json:"available_currencies"`
	PosQuickCash        QuickCashSettings `json:"pos_quick_cash"`
}

func defaultCurrencyForMarket(market string) string {
	switch normalizeMarketCode(market) {
	case "id":
		return "IDR"
	case "us":
		return "USD"
	default:
		return "VND"
	}
}

// DefaultFinancialConfigForMarket builds a full financial document for new tenants.
func DefaultFinancialConfigForMarket(market string) FinancialConfig {
	currency := defaultCurrencyForMarket(market)
	return FinancialConfig{
		Currency:            currency,
		TaxRate:             11,
		ServiceChargeRate:   0,
		TaxEnabled:          true,
		AvailableCurrencies: defaultSupportedCurrencies(),
		PosQuickCash:        PresetsForMarket(market),
	}
}

func marshalFinancialConfig(cfg FinancialConfig) (string, error) {
	cfg.Currency = strings.ToUpper(strings.TrimSpace(cfg.Currency))
	if cfg.Currency == "" {
		return "", fmt.Errorf("%w: currency required", common.ErrBadRequest)
	}
	if len(cfg.AvailableCurrencies) == 0 {
		cfg.AvailableCurrencies = defaultSupportedCurrencies()
	}
	if !currencyAllowed(cfg.AvailableCurrencies, cfg.Currency) {
		return "", fmt.Errorf("%w: currency %s is not enabled", common.ErrBadRequest, cfg.Currency)
	}
	if err := validateQuickCashSettings(cfg.PosQuickCash); err != nil {
		return "", err
	}
	cfg.PosQuickCash.Retail = sortQuickCashAmounts(cfg.PosQuickCash.Retail)
	cfg.PosQuickCash.StockReceipt = sortQuickCashAmounts(cfg.PosQuickCash.StockReceipt)
	b, err := json.Marshal(cfg)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func parseFinancialConfigJSON(raw string) (FinancialConfig, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return FinancialConfig{}, errors.New("empty financial config")
	}
	var cfg FinancialConfig
	if err := json.Unmarshal([]byte(raw), &cfg); err != nil {
		return FinancialConfig{}, err
	}
	cfg.Currency = strings.ToUpper(strings.TrimSpace(cfg.Currency))
	if len(cfg.AvailableCurrencies) == 0 {
		cfg.AvailableCurrencies = defaultSupportedCurrencies()
	}
	if cfg.Currency == "" {
		cfg.Currency = cfg.AvailableCurrencies[0].Code
	} else if !currencyAllowed(cfg.AvailableCurrencies, cfg.Currency) {
		cfg.Currency = cfg.AvailableCurrencies[0].Code
	}
	if err := validateQuickCashSettings(cfg.PosQuickCash); err != nil {
		// Allow partial corrupt quick cash — fall back to currency preset.
		cfg.PosQuickCash = PresetsForCurrency(cfg.Currency)
	}
	return cfg, nil
}

func financialConfigFromLegacyMap(m map[string]string) FinancialConfig {
	currencies, _ := parseSupportedCurrencies(m["supported_currencies"])
	if len(currencies) == 0 {
		currencies = defaultSupportedCurrencies()
	}
	currency := strings.ToUpper(strings.TrimSpace(m["currency"]))
	if currency == "" {
		currency = currencies[0].Code
	} else if !currencyAllowed(currencies, currency) {
		currency = currencies[0].Code
	}
	return FinancialConfig{
		Currency:            currency,
		TaxRate:             parseFloatSetting(m["tax_rate"], 11),
		ServiceChargeRate:   parseFloatSetting(m["service_charge_rate"], 0),
		TaxEnabled:          parseBoolSetting(m["tax_enabled"], true),
		AvailableCurrencies: currencies,
		PosQuickCash:        resolveQuickCash(m[settingKeyPosQuickCash], currency),
	}
}

func loadFinancialConfig(m map[string]string) FinancialConfig {
	if raw := strings.TrimSpace(m[settingKeyFinancial]); raw != "" {
		cfg, err := parseFinancialConfigJSON(raw)
		if err == nil {
			return cfg
		}
	}
	return financialConfigFromLegacyMap(m)
}

func financialConfigToResponse(cfg FinancialConfig) *FinancialSettingsResponse {
	return &FinancialSettingsResponse{
		Currency:            cfg.Currency,
		TaxRate:             cfg.TaxRate,
		ServiceChargeRate:   cfg.ServiceChargeRate,
		TaxEnabled:          cfg.TaxEnabled,
		AvailableCurrencies: cfg.AvailableCurrencies,
		PosQuickCash:        cfg.PosQuickCash,
	}
}