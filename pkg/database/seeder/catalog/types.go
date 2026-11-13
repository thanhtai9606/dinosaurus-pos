package catalog

// ProductDef is one demo SKU in a market pack.
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

// SeededProduct is returned after demo seed for optional order simulation.
type SeededProduct struct {
	ID        string
	Name      string
	Price     int64
	CostPrice int64
	Options   []SeededOption
}

type SeededOption struct {
	ID              string
	Name            string
	AdditionalPrice int64
}

// MarketOption describes a supported demo market.
type MarketOption struct {
	Code     string `json:"code"`
	LabelKey string `json:"label_key"`
}

// VerticalOption describes a business vertical within a market.
type VerticalOption struct {
	ID          string `json:"id"`
	LabelKey    string `json:"label_key"`
	DescriptionKey string `json:"description_key"`
}
