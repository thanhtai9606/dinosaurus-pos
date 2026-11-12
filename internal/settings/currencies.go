package settings

import (
	"encoding/json"
	"fmt"
	"strings"
)

// CurrencyOption is stored in settings.supported_currencies (JSON array).
type CurrencyOption struct {
	Code           string `json:"code" validate:"required,len=3,uppercase"`
	Label          string `json:"label" validate:"required,max=64"`
	Locale         string `json:"locale" validate:"required,max=16"`
	FractionDigits int    `json:"fraction_digits" validate:"gte=0,lte=4"`
}

func defaultSupportedCurrencies() []CurrencyOption {
	return []CurrencyOption{
		{Code: "IDR", Label: "IDR (Rp)", Locale: "id-ID", FractionDigits: 0},
		{Code: "VND", Label: "VND (₫)", Locale: "vi-VN", FractionDigits: 0},
		{Code: "USD", Label: "USD ($)", Locale: "en-US", FractionDigits: 2},
	}
}

func parseSupportedCurrencies(raw string) ([]CurrencyOption, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return defaultSupportedCurrencies(), nil
	}
	var list []CurrencyOption
	if err := json.Unmarshal([]byte(raw), &list); err != nil {
		return nil, fmt.Errorf("invalid supported_currencies JSON: %w", err)
	}
	if len(list) == 0 {
		return defaultSupportedCurrencies(), nil
	}
	seen := map[string]struct{}{}
	out := make([]CurrencyOption, 0, len(list))
	for _, c := range list {
		code := strings.ToUpper(strings.TrimSpace(c.Code))
		if code == "" {
			continue
		}
		if _, ok := seen[code]; ok {
			continue
		}
		seen[code] = struct{}{}
		c.Code = code
		if c.Locale == "" {
			c.Locale = "en-US"
		}
		out = append(out, c)
	}
	return out, nil
}

func currencyAllowed(list []CurrencyOption, code string) bool {
	code = strings.ToUpper(strings.TrimSpace(code))
	for _, c := range list {
		if c.Code == code {
			return true
		}
	}
	return false
}

func findCurrency(list []CurrencyOption, code string) *CurrencyOption {
	code = strings.ToUpper(strings.TrimSpace(code))
	for i := range list {
		if list[i].Code == code {
			return &list[i]
		}
	}
	return nil
}

func marshalSupportedCurrencies(list []CurrencyOption) (string, error) {
	b, err := json.Marshal(list)
	if err != nil {
		return "", err
	}
	return string(b), nil
}
