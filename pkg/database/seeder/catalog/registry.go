package catalog

import (
	"strings"

	"dinosaurus-pos/pkg/database/seeder/catalog/id"
	"dinosaurus-pos/pkg/database/seeder/catalog/vn"
)

// Markets lists demo catalog markets.
func Markets() []MarketOption {
	return []MarketOption{
		{Code: vn.MarketCode, LabelKey: "tenants_admin.market_vn"},
	}
}

// Validate reports whether market and vertical are supported for demo seed.
func Validate(market, vertical string) bool {
	market = normalizeCode(market)
	vertical = normalizeCode(vertical)
	switch market {
	case vn.MarketCode:
		for _, v := range vn.Verticals() {
			if v == vertical {
				return len(ProductsFor(market, vertical)) > 0
			}
		}
		return false
	case id.MarketCode:
		return false
	default:
		return false
	}
}

// VerticalsFor returns vertical options for a market (i18n label keys).
func VerticalsFor(market string) []VerticalOption {
	market = normalizeCode(market)
	switch market {
	case vn.MarketCode:
		return []VerticalOption{
			{ID: vn.VerticalCafe, LabelKey: "tenants_admin.vertical_vn_cafe", DescriptionKey: "tenants_admin.vertical_vn_cafe_desc"},
			{ID: vn.VerticalRestaurant, LabelKey: "tenants_admin.vertical_vn_restaurant", DescriptionKey: "tenants_admin.vertical_vn_restaurant_desc"},
			{ID: vn.VerticalRetailFMCG, LabelKey: "tenants_admin.vertical_vn_retail_fmcg", DescriptionKey: "tenants_admin.vertical_vn_retail_fmcg_desc"},
			{ID: vn.VerticalElectronics, LabelKey: "tenants_admin.vertical_vn_electronics", DescriptionKey: "tenants_admin.vertical_vn_electronics_desc"},
			{ID: vn.VerticalFashion, LabelKey: "tenants_admin.vertical_vn_fashion", DescriptionKey: "tenants_admin.vertical_vn_fashion_desc"},
			{ID: vn.VerticalMulti, LabelKey: "tenants_admin.vertical_vn_multi", DescriptionKey: "tenants_admin.vertical_vn_multi_desc"},
		}
	default:
		return nil
	}
}

// OnboardingOptions builds API payload for tenant create UI.
func OnboardingOptions(market string) map[string]any {
	market = normalizeCode(market)
	if market == "" {
		market = vn.MarketCode
	}
	return map[string]any{
		"markets":   Markets(),
		"verticals": VerticalsFor(market),
	}
}

// ProductsFor returns product defs for market + vertical.
func ProductsFor(market, vertical string) []ProductDef {
	market = normalizeCode(market)
	vertical = normalizeCode(vertical)
	if market == vn.MarketCode {
		return mapVNProducts(vn.ProductsForVertical(vertical))
	}
	return nil
}

func mapVNProducts(src []vn.ProductDef) []ProductDef {
	out := make([]ProductDef, 0, len(src))
	for _, p := range src {
		opts := make([]OptionDef, 0, len(p.Options))
		for _, o := range p.Options {
			opts = append(opts, OptionDef{
				Name: o.Name, AdditionalPrice: o.AdditionalPrice, ImageURL: o.ImageURL,
			})
		}
		out = append(out, ProductDef{
			Code: p.Code, Sku: p.Sku, Barcode: p.Barcode, Unit: p.Unit,
			Name: p.Name, Price: p.Price, CostPrice: p.CostPrice, Stock: p.Stock,
			ImageURL: p.ImageURL, Category: p.Category, Options: opts,
		})
	}
	return out
}

// CategoryNamesFor returns category names to ensure before seeding products.
func CategoryNamesFor(market, vertical string) []string {
	market = normalizeCode(market)
	vertical = normalizeCode(vertical)
	if market == vn.MarketCode {
		return vn.CategoryNamesForVertical(vertical)
	}
	return nil
}

func normalizeCode(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}
