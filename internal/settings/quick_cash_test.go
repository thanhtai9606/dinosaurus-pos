package settings

import "testing"

func TestPresetsForMarketVN(t *testing.T) {
	p := PresetsForMarket("vn")
	if len(p.Retail) != 5 || p.Retail[0] != 10_000 {
		t.Fatalf("unexpected retail preset: %#v", p.Retail)
	}
	if len(p.StockReceipt) != 6 {
		t.Fatalf("unexpected stock preset len: %d", len(p.StockReceipt))
	}
}

func TestValidateQuickCashSettingsRejectsDuplicate(t *testing.T) {
	err := validateQuickCashSettings(QuickCashSettings{
		Retail:       []int64{10, 10},
		StockReceipt: []int64{100},
	})
	if err == nil {
		t.Fatal("expected error for duplicate amounts")
	}
}