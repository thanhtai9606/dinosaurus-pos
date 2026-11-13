package vn

func strPtr(s string) *string { return &s }

type ProductDef struct {
	Code      string
	Sku       string
	Barcode   *string
	Unit      string
	Name      string
	Price     int64
	CostPrice int64
	Stock     int32
	ImageURL  string
	Category  string
	Options   []OptionDef
}

type OptionDef struct {
	Name            string
	AdditionalPrice int64
	ImageURL        string
}

// AllProducts returns the full Vietnam demo catalog.
func AllProducts() []ProductDef {
	cafe := "Đồ uống & Cà phê"
	food := "Món ăn"
	retail := "Bán lẻ tiêu dùng"
	elec := "Điện tử"
	fashion := "Thời trang"
	combo := "Combo"

	return []ProductDef{
		{Code: "P-000001", Sku: "CAFE-SSD", Unit: "ly", Name: "Cà phê sữa đá", Price: 32000, CostPrice: 12000, Stock: 300, Category: cafe,
			ImageURL: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop",
			Options: []OptionDef{
				{Name: "Size M", AdditionalPrice: 0},
				{Name: "Size L", AdditionalPrice: 5000},
				{Name: "Ít đường", AdditionalPrice: 0},
			}},
		{Code: "P-000002", Sku: "CAFE-ESP", Unit: "ly", Name: "Espresso", Price: 28000, CostPrice: 10000, Stock: 250, Category: cafe,
			ImageURL: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop",
			Options: []OptionDef{{Name: "Nóng", AdditionalPrice: 0}, {Name: "Đá", AdditionalPrice: 0}}},
		{Code: "P-000003", Sku: "CAFE-TRA-DAO", Unit: "ly", Name: "Trà đào cam sả", Price: 35000, CostPrice: 14000, Stock: 200, Category: cafe,
			ImageURL: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop"},
		{Code: "P-000004", Sku: "CAFE-BAC-XIU", Unit: "ly", Name: "Bạc xỉu", Price: 30000, CostPrice: 11000, Stock: 220, Category: cafe,
			ImageURL: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop",
			Options: []OptionDef{{Name: "Size M", AdditionalPrice: 0}, {Name: "Size L", AdditionalPrice: 4000}}},
		{Code: "P-000021", Sku: "CAFE-DEN-DA", Unit: "ly", Name: "Cà phê đen đá", Price: 25000, CostPrice: 8000, Stock: 280, Category: cafe,
			ImageURL: "https://images.unsplash.com/photo-1514434755167-8b6dd078481b?w=400&h=400&fit=crop"},

		{Code: "P-000005", Sku: "FOOD-PHO", Unit: "phần", Name: "Phở bò", Price: 55000, CostPrice: 25000, Stock: 150, Category: food,
			ImageURL: "https://images.unsplash.com/photo-1591814468924-caf38d123368?w=400&h=400&fit=crop",
			Options: []OptionDef{{Name: "Tái", AdditionalPrice: 0}, {Name: "Nạm", AdditionalPrice: 5000}, {Name: "Gầu", AdditionalPrice: 8000}}},
		{Code: "P-000006", Sku: "FOOD-COM-TAM", Unit: "phần", Name: "Cơm tấm sườn", Price: 48000, CostPrice: 22000, Stock: 140, Category: food,
			ImageURL: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop"},
		{Code: "P-000007", Sku: "FOOD-BUN-TN", Unit: "phần", Name: "Bún thịt nướng", Price: 45000, CostPrice: 20000, Stock: 130, Category: food,
			ImageURL: "https://images.unsplash.com/photo-1585238342028-4a5a6d39f44b?w=400&h=400&fit=crop"},
		{Code: "P-000008", Sku: "FOOD-BANH-MI", Unit: "phần", Name: "Bánh mì thịt nướng", Price: 35000, CostPrice: 15000, Stock: 160, Category: food,
			ImageURL: "https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400&h=400&fit=crop"},

		{Code: "P-000009", Sku: "RET-WATER-500", Barcode: strPtr("8935000100001"), Unit: "chai", Name: "Nước suối 500ml", Price: 8000, CostPrice: 3500, Stock: 500, Category: retail,
			ImageURL: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop"},
		{Code: "P-000010", Sku: "RET-OREO", Barcode: strPtr("8935000100002"), Unit: "gói", Name: "Bánh quy Oreo", Price: 22000, CostPrice: 14000, Stock: 200, Category: retail,
			ImageURL: "https://images.unsplash.com/photo-1558961363-fa8fdd82db35?w=400&h=400&fit=crop"},
		{Code: "P-000011", Sku: "RET-MI-HH", Barcode: strPtr("8935000100003"), Unit: "gói", Name: "Mì gói Hảo Hảo", Price: 5000, CostPrice: 3200, Stock: 400, Category: retail,
			ImageURL: ""},
		{Code: "P-000022", Sku: "RET-LOW-STOCK", Barcode: strPtr("8935000100004"), Unit: "gói", Name: "Snack khoai tây (tồn thấp)", Price: 15000, CostPrice: 9000, Stock: 3, Category: retail,
			ImageURL: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop"},

		{Code: "P-000012", Sku: "ELEC-USBC-1M", Barcode: strPtr("8935000200001"), Unit: "cái", Name: "Cáp USB-C 1m", Price: 89000, CostPrice: 45000, Stock: 80, Category: elec, ImageURL: ""},
		{Code: "P-000013", Sku: "ELEC-AA-4", Barcode: strPtr("8935000200002"), Unit: "vỉ", Name: "Pin AA vỉ 4", Price: 35000, CostPrice: 22000, Stock: 120, Category: elec, ImageURL: ""},
		{Code: "P-000014", Sku: "ELEC-EAR-WIRED", Barcode: strPtr("8935000200003"), Unit: "cái", Name: "Tai nghe có dây", Price: 120000, CostPrice: 75000, Stock: 60, Category: elec, ImageURL: ""},
		{Code: "P-000015", Sku: "ELEC-CHG-20W", Barcode: strPtr("8935000200004"), Unit: "cái", Name: "Sạc nhanh 20W", Price: 150000, CostPrice: 90000, Stock: 50, Category: elec, ImageURL: ""},

		{Code: "P-000016", Sku: "FASH-TSHIRT", Unit: "cái", Name: "Áo thun basic", Price: 99000, CostPrice: 45000, Stock: 100, Category: fashion, ImageURL: "",
			Options: []OptionDef{{Name: "Size S", AdditionalPrice: 0}, {Name: "Size M", AdditionalPrice: 0}, {Name: "Size L", AdditionalPrice: 0}, {Name: "Size XL", AdditionalPrice: 5000}}},
		{Code: "P-000017", Sku: "FASH-JEAN", Unit: "cái", Name: "Quần jean nam", Price: 320000, CostPrice: 180000, Stock: 70, Category: fashion, ImageURL: "",
			Options: []OptionDef{{Name: "Size 28", AdditionalPrice: 0}, {Name: "Size 30", AdditionalPrice: 0}, {Name: "Size 32", AdditionalPrice: 0}}},
		{Code: "P-000018", Sku: "FASH-SLIP", Barcode: strPtr("8935000300001"), Unit: "đôi", Name: "Dép quai ngang", Price: 65000, CostPrice: 35000, Stock: 90, Category: fashion, ImageURL: ""},

		{Code: "P-000019", Sku: "COMBO-CAFE-SNACK", Unit: "phần", Name: "Combo cà phê + bánh quy", Price: 48000, CostPrice: 22000, Stock: 100, Category: combo,
			ImageURL: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop&q=80"},
		{Code: "P-000020", Sku: "COMBO-PHO-WATER", Unit: "phần", Name: "Combo phở + nước suối", Price: 60000, CostPrice: 27000, Stock: 80, Category: combo,
			ImageURL: "https://images.unsplash.com/photo-1591814468924-caf38d123368?w=400&h=400&fit=crop&q=80"},
	}
}

// ProductsForVertical filters the VN catalog for a vertical id.
func ProductsForVertical(vertical string) []ProductDef {
	all := AllProducts()
	codes := ProductCodesForVertical(vertical)
	if codes == nil {
		return all
	}
	set := make(map[string]struct{}, len(codes))
	for _, c := range codes {
		set[c] = struct{}{}
	}
	out := make([]ProductDef, 0, len(codes))
	for _, p := range all {
		if _, ok := set[p.Code]; ok {
			out = append(out, p)
		}
	}
	return out
}
