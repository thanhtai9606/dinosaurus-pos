import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import {
    FileText,
    LayoutDashboard,
    Package,
    Settings,
    ShoppingCart,
    User as UserIcon,
    Tag,
    ActivityIcon,
    Users,
    Truck,
    ClipboardList,
    Warehouse,
    Store,
    HandCoins,
    Undo2,
    Receipt,
    ShoppingBag,
    ChefHat,
    Utensils,
    Building2,
    Layers,
    Server,
    ScrollText,
    Tags,
    Scale,
    BadgeDollarSign,
} from 'lucide-react'
import { POSKasirInternalUserRepositoryUserRole } from '@/lib/api/generated'
import { effectiveRolesForKey, type TenantRole } from '@/lib/auth/menuCatalog'
import { useMenuAccessQuery } from '@/lib/api/query/menuAccess'

type Role = POSKasirInternalUserRepositoryUserRole | 'super_admin'

type DashboardMenuLinkBase = {
    label: string
    icon: LucideIcon
    to: string
    menuKey?: string
    allowedRoles: Role[]
}

export type DashboardMenuLink = DashboardMenuLinkBase & {
    type: 'link'
}

export type DashboardMenuGroup = {
    type: 'group'
    label: string
    icon: LucideIcon
    allowedRoles: Role[]
    children: DashboardMenuLinkBase[]
}

export type DashboardMenuEntry = DashboardMenuLink | DashboardMenuGroup

const cashierRoles: Role[] = [
    POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
    POSKasirInternalUserRepositoryUserRole.UserRoleManager,
    POSKasirInternalUserRepositoryUserRole.UserRoleCashier,
]

const managerRoles: Role[] = [
    POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
    POSKasirInternalUserRepositoryUserRole.UserRoleManager,
]

function resolvedRoles(menuKey: string | undefined, fallback: Role[], overrides?: Record<string, TenantRole[]>, defaults?: Record<string, TenantRole[]>): Role[] {
    if (!menuKey) return fallback
    return effectiveRolesForKey(menuKey, overrides, defaults) as Role[]
}

function canAccessItem(allowedRoles: Role[], userRole?: string): boolean {
    if (!userRole) return false
    if (userRole === 'super_admin') return true
    return allowedRoles.includes(userRole as Role)
}

function filterEntries(
    entries: DashboardMenuEntry[],
    userRole?: string,
    overrides?: Record<string, TenantRole[]>,
    defaults?: Record<string, TenantRole[]>,
): DashboardMenuEntry[] {
    if (!userRole) return []
    const result: DashboardMenuEntry[] = []
    for (const entry of entries) {
        if (entry.type === 'link') {
            const roles = resolvedRoles(entry.menuKey, entry.allowedRoles, overrides, defaults)
            if (canAccessItem(roles, userRole)) {
                result.push({ ...entry, allowedRoles: roles })
            }
            continue
        }
        const children = entry.children
            .map((c) => ({
                ...c,
                allowedRoles: resolvedRoles(c.menuKey, c.allowedRoles, overrides, defaults),
            }))
            .filter((c) => canAccessItem(c.allowedRoles, userRole))
        if (children.length > 0) {
            result.push({ ...entry, children })
        }
    }
    return result
}

export function useNavigationMenu(userRole?: string) {
    const { t } = useTranslation()
    const { data: menuAccess } = useMenuAccessQuery()

    const menuItems: DashboardMenuEntry[] = [
        {
            type: 'group',
            label: t('sidebar.platform'),
            icon: Layers,
            allowedRoles: ['super_admin'],
            children: [
                {
                    label: t('sidebar.platform_overview'),
                    icon: LayoutDashboard,
                    to: '/platform/overview',
                    allowedRoles: ['super_admin'],
                },
                {
                    label: t('sidebar.tenants_admin'),
                    icon: Building2,
                    to: '/tenants',
                    allowedRoles: ['super_admin'],
                },
                {
                    label: t('sidebar.platform_ops'),
                    icon: Server,
                    to: '/platform/ops',
                    allowedRoles: ['super_admin'],
                },
                {
                    label: t('sidebar.platform_audit'),
                    icon: ScrollText,
                    to: '/platform/audit',
                    allowedRoles: ['super_admin'],
                },
                {
                    label: t('sidebar.account'),
                    icon: UserIcon,
                    to: '/account',
                    allowedRoles: ['super_admin'],
                },
            ],
        },
        {
            type: 'link',
            label: t('sidebar.summary'),
            icon: LayoutDashboard,
            to: '/',
            menuKey: 'dashboard',
            allowedRoles: cashierRoles,
        },
        {
            type: 'group',
            label: t('sidebar.sales'),
            icon: ShoppingBag,
            allowedRoles: cashierRoles,
            children: [
                {
                    label: t('sidebar.sales_pos'),
                    icon: ShoppingCart,
                    to: '/order',
                    menuKey: 'sales_pos',
                    allowedRoles: cashierRoles,
                },
                {
                    label: t('sidebar.retail_pos'),
                    icon: Store,
                    to: '/retail-pos',
                    menuKey: 'retail_pos',
                    allowedRoles: cashierRoles,
                },
                {
                    label: t('sidebar.sales_returns'),
                    icon: Undo2,
                    to: '/sales-returns',
                    menuKey: 'sales_returns',
                    allowedRoles: cashierRoles,
                },
                {
                    label: t('sidebar.sales_orders'),
                    icon: Receipt,
                    to: '/sales-orders',
                    menuKey: 'sales_orders',
                    allowedRoles: cashierRoles,
                },
                {
                    label: t('sidebar.dining_tables'),
                    icon: Utensils,
                    to: '/dining-tables',
                    menuKey: 'dining_tables',
                    allowedRoles: cashierRoles,
                },
                {
                    label: t('sidebar.kitchen'),
                    icon: ChefHat,
                    to: '/kitchen',
                    menuKey: 'kitchen',
                    allowedRoles: cashierRoles,
                },
            ],
        },
        {
            type: 'group',
            label: t('sidebar.products_menu'),
            icon: Package,
            allowedRoles: cashierRoles,
            children: [
                {
                    label: t('sidebar.products'),
                    icon: Package,
                    to: '/product',
                    menuKey: 'products',
                    allowedRoles: cashierRoles,
                },
                {
                    label: t('sidebar.product_groups'),
                    icon: Tags,
                    to: '/product-groups',
                    menuKey: 'product_groups',
                    allowedRoles: managerRoles,
                },
                {
                    label: t('sidebar.product_units'),
                    icon: Scale,
                    to: '/product-units',
                    menuKey: 'product_units',
                    allowedRoles: managerRoles,
                },
                {
                    label: t('sidebar.price_lists'),
                    icon: BadgeDollarSign,
                    to: '/price-lists',
                    menuKey: 'price_lists',
                    allowedRoles: managerRoles,
                },
            ],
        },
        {
            type: 'group',
            label: t('sidebar.inventory_menu'),
            icon: Warehouse,
            allowedRoles: managerRoles,
            children: [
                { label: t('sidebar.inventory'), icon: Warehouse, to: '/inventory', menuKey: 'inventory', allowedRoles: managerRoles },
                { label: t('sidebar.warehouses'), icon: Warehouse, to: '/warehouses', menuKey: 'warehouses', allowedRoles: managerRoles },
                { label: t('sidebar.stock_receipts'), icon: ClipboardList, to: '/stock-receipts', menuKey: 'stock_receipts', allowedRoles: managerRoles },
                { label: t('sidebar.stock_transfers'), icon: Warehouse, to: '/stock-transfers', menuKey: 'stock_transfers', allowedRoles: managerRoles },
                { label: t('sidebar.stock_adjustments'), icon: Warehouse, to: '/stock-adjustments', menuKey: 'stock_adjustments', allowedRoles: managerRoles },
                { label: t('sidebar.stock_takes'), icon: Warehouse, to: '/stock-takes', menuKey: 'stock_takes', allowedRoles: managerRoles },
                { label: t('sidebar.stock_movements'), icon: ClipboardList, to: '/stock-movements', menuKey: 'stock_movements', allowedRoles: managerRoles },
            ],
        },
        {
            type: 'link',
            label: t('sidebar.suppliers'),
            icon: Truck,
            to: '/suppliers',
            menuKey: 'suppliers',
            allowedRoles: managerRoles,
        },
        {
            type: 'link',
            label: t('sidebar.supplier_debts'),
            icon: HandCoins,
            to: '/supplier-debts',
            menuKey: 'supplier_debts',
            allowedRoles: managerRoles,
        },
        {
            type: 'group',
            label: t('sidebar.customers_menu'),
            icon: Users,
            allowedRoles: cashierRoles,
            children: [
                {
                    label: t('sidebar.customers'),
                    icon: Users,
                    to: '/customers',
                    menuKey: 'customers',
                    allowedRoles: cashierRoles,
                },
                {
                    label: t('sidebar.customer_groups'),
                    icon: Tags,
                    to: '/customer-groups',
                    menuKey: 'customer_groups',
                    allowedRoles: managerRoles,
                },
                {
                    label: t('sidebar.customer_debts'),
                    icon: HandCoins,
                    to: '/customer-debts',
                    menuKey: 'customer_debts',
                    allowedRoles: managerRoles,
                },
            ],
        },
        {
            type: 'link',
            label: t('sidebar.promotions'),
            icon: Tag,
            to: '/promotions',
            menuKey: 'promotions',
            allowedRoles: cashierRoles,
        },
        {
            type: 'link',
            label: t('sidebar.reports'),
            icon: FileText,
            to: '/reports',
            menuKey: 'reports',
            allowedRoles: managerRoles,
        },
        {
            type: 'link',
            label: t('sidebar.users'),
            icon: UserIcon,
            to: '/users',
            menuKey: 'users',
            allowedRoles: managerRoles,
        },
        {
            type: 'link',
            label: t('sidebar.settings'),
            icon: Settings,
            to: '/settings',
            menuKey: 'settings',
            allowedRoles: cashierRoles,
        },
        {
            type: 'link',
            label: t('sidebar.activity_logs'),
            icon: ActivityIcon,
            to: '/activity-logs',
            menuKey: 'activity_logs',
            allowedRoles: [POSKasirInternalUserRepositoryUserRole.UserRoleAdmin],
        },
    ]

    const overrides = menuAccess?.items
    const defaults = menuAccess?.defaults
    const filteredMenu = filterEntries(menuItems, userRole, overrides, defaults)

    return { menuItems, filteredMenu, menuAccess }
}

export function flattenMenuPaths(entries: DashboardMenuEntry[]): string[] {
    const paths: string[] = []
    for (const entry of entries) {
        if (entry.type === 'link') paths.push(entry.to)
        else entry.children.forEach((c) => paths.push(c.to))
    }
    return paths
}