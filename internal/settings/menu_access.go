package settings

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"

	"dinosaurus-pos/internal/settings/repository"

	"github.com/jackc/pgx/v5"
)

const settingKeyMenuRoleAccess = "menu_role_access"

var tenantMenuRoles = []string{"admin", "manager", "cashier"}

type MenuCatalogEntry struct {
	Key           string   `json:"key"`
	Path          string   `json:"path"`
	LabelKey      string   `json:"label_key"`
	SectionKey    string   `json:"section_key"`
	DefaultRoles  []string `json:"default_roles"`
	AdminLock     bool     `json:"admin_lock,omitempty"`
}

var menuCatalog = []MenuCatalogEntry{
	{Key: "dashboard", Path: "/", LabelKey: "sidebar.summary", SectionKey: "sidebar.general", DefaultRoles: []string{"admin", "manager", "cashier"}},
	{Key: "sales_pos", Path: "/order", LabelKey: "sidebar.sales_pos", SectionKey: "sidebar.sales", DefaultRoles: []string{"admin", "manager", "cashier"}},
	{Key: "retail_pos", Path: "/retail-pos", LabelKey: "sidebar.retail_pos", SectionKey: "sidebar.sales", DefaultRoles: []string{"admin", "manager", "cashier"}},
	{Key: "sales_returns", Path: "/sales-returns", LabelKey: "sidebar.sales_returns", SectionKey: "sidebar.sales", DefaultRoles: []string{"admin", "manager", "cashier"}},
	{Key: "sales_orders", Path: "/sales-orders", LabelKey: "sidebar.sales_orders", SectionKey: "sidebar.sales", DefaultRoles: []string{"admin", "manager", "cashier"}},
	{Key: "dining_tables", Path: "/dining-tables", LabelKey: "sidebar.dining_tables", SectionKey: "sidebar.sales", DefaultRoles: []string{"admin", "manager", "cashier"}},
	{Key: "kitchen", Path: "/kitchen", LabelKey: "sidebar.kitchen", SectionKey: "sidebar.sales", DefaultRoles: []string{"admin", "manager", "cashier"}},
	{Key: "products", Path: "/product", LabelKey: "sidebar.products", SectionKey: "sidebar.products_menu", DefaultRoles: []string{"admin", "manager", "cashier"}},
	{Key: "product_groups", Path: "/product-groups", LabelKey: "sidebar.product_groups", SectionKey: "sidebar.products_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "product_units", Path: "/product-units", LabelKey: "sidebar.product_units", SectionKey: "sidebar.products_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "price_lists", Path: "/price-lists", LabelKey: "sidebar.price_lists", SectionKey: "sidebar.products_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "inventory", Path: "/inventory", LabelKey: "sidebar.inventory", SectionKey: "sidebar.inventory_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "warehouses", Path: "/warehouses", LabelKey: "sidebar.warehouses", SectionKey: "sidebar.inventory_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "stock_receipts", Path: "/stock-receipts", LabelKey: "sidebar.stock_receipts", SectionKey: "sidebar.inventory_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "stock_transfers", Path: "/stock-transfers", LabelKey: "sidebar.stock_transfers", SectionKey: "sidebar.inventory_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "stock_adjustments", Path: "/stock-adjustments", LabelKey: "sidebar.stock_adjustments", SectionKey: "sidebar.inventory_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "stock_takes", Path: "/stock-takes", LabelKey: "sidebar.stock_takes", SectionKey: "sidebar.inventory_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "stock_movements", Path: "/stock-movements", LabelKey: "sidebar.stock_movements", SectionKey: "sidebar.inventory_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "suppliers", Path: "/suppliers", LabelKey: "sidebar.suppliers", SectionKey: "sidebar.inventory_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "supplier_debts", Path: "/supplier-debts", LabelKey: "sidebar.supplier_debts", SectionKey: "sidebar.inventory_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "customers", Path: "/customers", LabelKey: "sidebar.customers", SectionKey: "sidebar.customers_menu", DefaultRoles: []string{"admin", "manager", "cashier"}},
	{Key: "customer_groups", Path: "/customer-groups", LabelKey: "sidebar.customer_groups", SectionKey: "sidebar.customers_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "customer_debts", Path: "/customer-debts", LabelKey: "sidebar.customer_debts", SectionKey: "sidebar.customers_menu", DefaultRoles: []string{"admin", "manager"}},
	{Key: "promotions", Path: "/promotions", LabelKey: "sidebar.promotions", SectionKey: "sidebar.sales", DefaultRoles: []string{"admin", "manager", "cashier"}},
	{Key: "reports", Path: "/reports", LabelKey: "sidebar.reports", SectionKey: "sidebar.general", DefaultRoles: []string{"admin", "manager"}},
	{Key: "users", Path: "/users", LabelKey: "sidebar.users", SectionKey: "sidebar.general", DefaultRoles: []string{"admin", "manager"}, AdminLock: true},
	{Key: "settings", Path: "/settings", LabelKey: "sidebar.settings", SectionKey: "sidebar.general", DefaultRoles: []string{"admin", "manager", "cashier"}, AdminLock: true},
	{Key: "activity_logs", Path: "/activity-logs", LabelKey: "sidebar.activity_logs", SectionKey: "sidebar.general", DefaultRoles: []string{"admin"}},
}

func menuDefaultsMap() map[string][]string {
	out := make(map[string][]string, len(menuCatalog))
	for _, e := range menuCatalog {
		out[e.Key] = slices.Clone(e.DefaultRoles)
	}
	return out
}

func isValidMenuKey(key string) bool {
	for _, e := range menuCatalog {
		if e.Key == key {
			return true
		}
	}
	return false
}

type MenuRoleAccessResponse struct {
	Catalog  []MenuCatalogEntry  `json:"catalog"`
	Defaults map[string][]string `json:"defaults"`
	Items    map[string][]string `json:"items"`
}

type UpdateMenuRoleAccessRequest struct {
	Items map[string][]string `json:"items"`
}

func (s *SettingsService) GetMenuRoleAccess(ctx context.Context) (*MenuRoleAccessResponse, error) {
	defaults := menuDefaultsMap()
	overrides, err := s.loadMenuOverrides(ctx)
	if err != nil {
		return nil, err
	}
	return &MenuRoleAccessResponse{
		Catalog:  menuCatalog,
		Defaults: defaults,
		Items:    overrides,
	}, nil
}

func (s *SettingsService) UpdateMenuRoleAccess(ctx context.Context, req UpdateMenuRoleAccessRequest) (*MenuRoleAccessResponse, error) {
	if req.Items == nil {
		req.Items = map[string][]string{}
	}
	normalized := make(map[string][]string)
	for key, roles := range req.Items {
		if !isValidMenuKey(key) {
			return nil, fmt.Errorf("%w: unknown menu key %s", errInvalidMenuKey, key)
		}
		seen := make(map[string]struct{})
		var clean []string
		for _, r := range roles {
			if !slices.Contains(tenantMenuRoles, r) {
				return nil, fmt.Errorf("%w: invalid role %s", errInvalidMenuRole, r)
			}
			if _, ok := seen[r]; ok {
				continue
			}
			seen[r] = struct{}{}
			clean = append(clean, r)
		}
		for _, e := range menuCatalog {
			if e.Key == key && e.AdminLock {
				if !slices.Contains(clean, "admin") {
					clean = append(clean, "admin")
				}
			}
		}
		if len(clean) > 0 {
			normalized[key] = clean
		}
	}
	raw, err := json.Marshal(normalized)
	if err != nil {
		return nil, err
	}
	if _, err := s.repo.UpsertSetting(ctx, repository.UpsertSettingParams{
		Key:   settingKeyMenuRoleAccess,
		Value: string(raw),
	}); err != nil {
		return nil, err
	}
	return s.GetMenuRoleAccess(ctx)
}

func (s *SettingsService) loadMenuOverrides(ctx context.Context) (map[string][]string, error) {
	row, err := s.repo.GetSettingByKey(ctx, settingKeyMenuRoleAccess)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return map[string][]string{}, nil
		}
		return nil, err
	}
	if row.Value == "" {
		return map[string][]string{}, nil
	}
	var parsed map[string][]string
	if err := json.Unmarshal([]byte(row.Value), &parsed); err != nil {
		return nil, err
	}
	if parsed == nil {
		return map[string][]string{}, nil
	}
	return parsed, nil
}

var (
	errInvalidMenuKey  = errors.New("invalid menu key")
	errInvalidMenuRole = errors.New("invalid role")
)

func EffectiveMenuRoles(key string, overrides map[string][]string) []string {
	defaults := menuDefaultsMap()
	if roles, ok := overrides[key]; ok && len(roles) > 0 {
		return roles
	}
	return defaults[key]
}