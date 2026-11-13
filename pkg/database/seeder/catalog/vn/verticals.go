package vn

const MarketCode = "vn"

const (
	VerticalCafe        = "cafe"
	VerticalRestaurant  = "restaurant"
	VerticalRetailFMCG  = "retail_fmcg"
	VerticalElectronics = "electronics"
	VerticalFashion     = "fashion"
	VerticalMulti       = "multi"
)

var AllCategoryNames = []string{
	"Đồ uống & Cà phê",
	"Món ăn",
	"Bán lẻ tiêu dùng",
	"Điện tử",
	"Thời trang",
	"Combo",
}

var verticalProductCodes = map[string][]string{
	VerticalCafe: {
		"P-000001", "P-000002", "P-000003", "P-000004", "P-000021",
	},
	VerticalRestaurant: {
		"P-000005", "P-000006", "P-000007", "P-000008",
	},
	VerticalRetailFMCG: {
		"P-000009", "P-000010", "P-000011", "P-000022",
	},
	VerticalElectronics: {
		"P-000012", "P-000013", "P-000014", "P-000015",
	},
	VerticalFashion: {
		"P-000016", "P-000017", "P-000018",
	},
	VerticalMulti: nil, // all products
}

var verticalCategories = map[string][]string{
	VerticalCafe:        {"Đồ uống & Cà phê"},
	VerticalRestaurant:  {"Món ăn"},
	VerticalRetailFMCG:  {"Bán lẻ tiêu dùng"},
	VerticalElectronics: {"Điện tử"},
	VerticalFashion:     {"Thời trang"},
	VerticalMulti:       AllCategoryNames,
}

// Verticals returns onboarding vertical ids for Vietnam.
func Verticals() []string {
	return []string{
		VerticalCafe,
		VerticalRestaurant,
		VerticalRetailFMCG,
		VerticalElectronics,
		VerticalFashion,
		VerticalMulti,
	}
}

func ProductCodesForVertical(vertical string) []string {
	if vertical == VerticalMulti {
		return nil
	}
	return verticalProductCodes[vertical]
}

func CategoryNamesForVertical(vertical string) []string {
	if cats, ok := verticalCategories[vertical]; ok {
		return cats
	}
	return AllCategoryNames
}
