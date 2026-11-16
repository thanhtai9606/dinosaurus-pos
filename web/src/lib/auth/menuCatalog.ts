import { UserRole } from '@/lib/api/domain'

export type TenantRole =
    | UserRole.UserRoleAdmin
    | UserRole.UserRoleManager
    | UserRole.UserRoleCashier

export type MenuCatalogItem = {
    key: string
    path: string
    labelKey: string
    sectionKey: string
    defaultRoles: TenantRole[]
    adminLock?: boolean
}

export const TENANT_MENU_CATALOG: MenuCatalogItem[] = [
    { key: 'dashboard', path: '/', labelKey: 'sidebar.summary', sectionKey: 'sidebar.general', defaultRoles: ['admin', 'manager', 'cashier'] },
    { key: 'sales_pos', path: '/order', labelKey: 'sidebar.sales_pos', sectionKey: 'sidebar.sales', defaultRoles: ['admin', 'manager', 'cashier'] },
    { key: 'retail_pos', path: '/retail-pos', labelKey: 'sidebar.retail_pos', sectionKey: 'sidebar.sales', defaultRoles: ['admin', 'manager', 'cashier'] },
    { key: 'sales_returns', path: '/sales-returns', labelKey: 'sidebar.sales_returns', sectionKey: 'sidebar.sales', defaultRoles: ['admin', 'manager', 'cashier'] },
    { key: 'sales_orders', path: '/sales-orders', labelKey: 'sidebar.sales_orders', sectionKey: 'sidebar.sales', defaultRoles: ['admin', 'manager', 'cashier'] },
    { key: 'dining_tables', path: '/dining-tables', labelKey: 'sidebar.dining_tables', sectionKey: 'sidebar.sales', defaultRoles: ['admin', 'manager', 'cashier'] },
    { key: 'kitchen', path: '/kitchen', labelKey: 'sidebar.kitchen', sectionKey: 'sidebar.sales', defaultRoles: ['admin', 'manager', 'cashier'] },
    { key: 'products', path: '/product', labelKey: 'sidebar.products', sectionKey: 'sidebar.products_menu', defaultRoles: ['admin', 'manager', 'cashier'] },
    { key: 'product_groups', path: '/product-groups', labelKey: 'sidebar.product_groups', sectionKey: 'sidebar.products_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'product_units', path: '/product-units', labelKey: 'sidebar.product_units', sectionKey: 'sidebar.products_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'price_lists', path: '/price-lists', labelKey: 'sidebar.price_lists', sectionKey: 'sidebar.products_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'inventory', path: '/inventory', labelKey: 'sidebar.inventory', sectionKey: 'sidebar.inventory_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'warehouses', path: '/warehouses', labelKey: 'sidebar.warehouses', sectionKey: 'sidebar.inventory_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'stock_receipts', path: '/stock-receipts', labelKey: 'sidebar.stock_receipts', sectionKey: 'sidebar.inventory_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'stock_transfers', path: '/stock-transfers', labelKey: 'sidebar.stock_transfers', sectionKey: 'sidebar.inventory_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'stock_adjustments', path: '/stock-adjustments', labelKey: 'sidebar.stock_adjustments', sectionKey: 'sidebar.inventory_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'stock_takes', path: '/stock-takes', labelKey: 'sidebar.stock_takes', sectionKey: 'sidebar.inventory_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'stock_movements', path: '/stock-movements', labelKey: 'sidebar.stock_movements', sectionKey: 'sidebar.inventory_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'suppliers', path: '/suppliers', labelKey: 'sidebar.suppliers', sectionKey: 'sidebar.inventory_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'supplier_debts', path: '/supplier-debts', labelKey: 'sidebar.supplier_debts', sectionKey: 'sidebar.inventory_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'customers', path: '/customers', labelKey: 'sidebar.customers', sectionKey: 'sidebar.customers_menu', defaultRoles: ['admin', 'manager', 'cashier'] },
    { key: 'customer_groups', path: '/customer-groups', labelKey: 'sidebar.customer_groups', sectionKey: 'sidebar.customers_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'customer_debts', path: '/customer-debts', labelKey: 'sidebar.customer_debts', sectionKey: 'sidebar.customers_menu', defaultRoles: ['admin', 'manager'] },
    { key: 'promotions', path: '/promotions', labelKey: 'sidebar.promotions', sectionKey: 'sidebar.sales', defaultRoles: ['admin', 'manager', 'cashier'] },
    { key: 'reports', path: '/reports', labelKey: 'sidebar.reports', sectionKey: 'sidebar.general', defaultRoles: ['admin', 'manager'] },
    { key: 'users', path: '/users', labelKey: 'sidebar.users', sectionKey: 'sidebar.general', defaultRoles: ['admin', 'manager'], adminLock: true },
    { key: 'settings', path: '/settings', labelKey: 'sidebar.settings', sectionKey: 'sidebar.general', defaultRoles: ['admin', 'manager', 'cashier'], adminLock: true },
    { key: 'activity_logs', path: '/activity-logs', labelKey: 'sidebar.activity_logs', sectionKey: 'sidebar.general', defaultRoles: ['admin'] },
]

export const MENU_BY_PATH = Object.fromEntries(TENANT_MENU_CATALOG.map((c) => [c.path, c]))

export const MENU_BY_KEY = Object.fromEntries(TENANT_MENU_CATALOG.map((c) => [c.key, c]))

export function effectiveRolesForKey(
    key: string,
    overrides?: Record<string, TenantRole[]>,
    defaults?: Record<string, TenantRole[]>,
): TenantRole[] {
    const def = defaults?.[key] ?? MENU_BY_KEY[key]?.defaultRoles ?? []
    const custom = overrides?.[key]
    if (custom && custom.length > 0) return custom
    return def
}

export function canAccessMenuPath(
    pathname: string,
    userRole: string | undefined,
    overrides?: Record<string, TenantRole[]>,
): boolean {
    if (!userRole) return false
    if (userRole === 'super_admin') return true
    const item = MENU_BY_PATH[pathname]
    if (!item) return true
    const roles = effectiveRolesForKey(item.key, overrides)
    return roles.includes(userRole as TenantRole)
}