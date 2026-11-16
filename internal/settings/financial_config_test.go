package settings

import (
	"encoding/json"
	"testing"
)

func TestMarshalFinancialConfigRoundTrip(t *testing.T) {
	cfg := DefaultFinancialConfigForMarket("vn")
	raw, err := marshalFinancialConfig(cfg)
	if err != nil {
		t.Fatal(err)
	}
	got, err := parseFinancialConfigJSON(raw)
	if err != nil {
		t.Fatal(err)
	}
	if got.Currency != "VND" || len(got.PosQuickCash.Retail) != 5 {
		t.Fatalf("unexpected round trip: %#v", got)
	}
}

func TestLoadFinancialConfigPrefersBlob(t *testing.T) {
	cfg := DefaultFinancialConfigForMarket("us")
	raw, _ := json.Marshal(cfg)
	m := map[string]string{
		settingKeyFinancial: string(raw),
		"currency":          "VND",
	}
	loaded := loadFinancialConfig(m)
	if loaded.Currency != "USD" {
		t.Fatalf("expected USD from blob, got %s", loaded.Currency)
	}
}