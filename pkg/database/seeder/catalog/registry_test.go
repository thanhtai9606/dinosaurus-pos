package catalog

import (
	"testing"

	"dinosaurus-pos/pkg/database/seeder/catalog/vn"
)

func TestValidate_VNVerticals(t *testing.T) {
	for _, v := range vn.Verticals() {
		if !Validate(vn.MarketCode, v) {
			t.Errorf("expected valid vn/%s", v)
		}
		products := ProductsFor(vn.MarketCode, v)
		if len(products) == 0 {
			t.Errorf("expected products for vn/%s", v)
		}
	}
}

func TestValidate_Unknown(t *testing.T) {
	if Validate("xx", vn.VerticalCafe) {
		t.Fatal("unknown market should be invalid")
	}
	if Validate(vn.MarketCode, "unknown_vertical") {
		t.Fatal("unknown vertical should be invalid")
	}
}
