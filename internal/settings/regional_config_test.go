package settings

import "testing"

func TestValidateRegionalUpdate(t *testing.T) {
	if err := validateRegionalUpdate(UpdateRegionalSettingsRequest{
		Timezone:     "Asia/Ho_Chi_Minh",
		DateStyle:    "DMY",
		TimeStyle:    "24h",
		WeekStartsOn: "monday",
	}); err != nil {
		t.Fatalf("expected valid: %v", err)
	}
	if err := validateRegionalUpdate(UpdateRegionalSettingsRequest{
		Timezone:     "Not/AZone",
		DateStyle:    "DMY",
		TimeStyle:    "24h",
		WeekStartsOn: "monday",
	}); err == nil {
		t.Fatal("expected invalid timezone")
	}
}

func TestDefaultRegionalConfigForMarket(t *testing.T) {
	vn := DefaultRegionalConfigForMarket("vn")
	if vn.Timezone != "Asia/Ho_Chi_Minh" || vn.DateStyle != DateStyleDMY {
		t.Fatalf("vn default: %+v", vn)
	}
	us := DefaultRegionalConfigForMarket("us")
	if us.DateStyle != DateStyleMDY {
		t.Fatalf("us date style: %+v", us)
	}
}