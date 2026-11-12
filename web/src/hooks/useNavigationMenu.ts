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
} from 'lucide-react'
import { POSKasirInternalUserRepositoryUserRole } from '@/lib/api/generated'

type Role = POSKasirInternalUserRepositoryUserRole

export type DashboardMenuLink = {
    type: 'link'
    label: string
    icon: LucideIcon
    to: string
    allowedRoles: Role[]
}

export type DashboardMenuGroup = {
    type: 'group'
    label: string
    icon: LucideIcon
    allowedRoles: Role[]
    children: Omit<DashboardMenuLink, 'type'>[]
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

function filterEntries(entries: DashboardMenuEntry[], userRole?: Role): DashboardMenuEntry[] {
    if (!userRole) return []
    const result: DashboardMenuEntry[] = []
    for (const entry of entries) {
        if (entry.type === 'link') {
            if (entry.allowedRoles.includes(userRole)) result.push(entry)
            continue
        }
        const children = entry.children.filter((c) => c.allowedRoles.includes(userRole))
        if (children.length > 0) {
            result.push({ ...entry, children })
        }
    }
    return result
}

export function useNavigationMenu(userRole?: Role) {
    const { t } = useTranslation()

    const menuItems: DashboardMenuEntry[] = [
        {
            type: 'link',
            label: t('sidebar.summary'),
            icon: LayoutDashboard,
            to: '/',
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
                    allowedRoles: cashierRoles,
                },
                {
                    label: t('sidebar.retail_pos'),
                    icon: Store,
                    to: '/retail-pos',
                    allowedRoles: cashierRoles,
                },
                {
                    label: t('sidebar.sales_returns'),
                    icon: Undo2,
                    to: '/sales-returns',
                    allowedRoles: cashierRoles,
                },
                {
                    label: t('sidebar.sales_orders'),
                    icon: Receipt,
                    to: '/transactions',
                    allowedRoles: cashierRoles,
                },
            ],
        },
        {
            type: 'link',
            label: t('sidebar.product'),
            icon: Package,
            to: '/product',
            allowedRoles: cashierRoles,
        },
        {
            type: 'link',
            label: t('sidebar.inventory'),
            icon: Warehouse,
            to: '/inventory',
            allowedRoles: managerRoles,
        },
        {
            type: 'link',
            label: t('sidebar.suppliers'),
            icon: Truck,
            to: '/suppliers',
            allowedRoles: managerRoles,
        },
        {
            type: 'link',
            label: t('sidebar.stock_receipts'),
            icon: ClipboardList,
            to: '/stock-receipts',
            allowedRoles: managerRoles,
        },
        {
            type: 'link',
            label: t('sidebar.supplier_debts'),
            icon: HandCoins,
            to: '/supplier-debts',
            allowedRoles: managerRoles,
        },
        {
            type: 'link',
            label: t('sidebar.customer_debts'),
            icon: HandCoins,
            to: '/customer-debts',
            allowedRoles: managerRoles,
        },
        {
            type: 'link',
            label: t('sidebar.promotions'),
            icon: Tag,
            to: '/promotions',
            allowedRoles: cashierRoles,
        },
        {
            type: 'link',
            label: t('sidebar.reports'),
            icon: FileText,
            to: '/reports',
            allowedRoles: [POSKasirInternalUserRepositoryUserRole.UserRoleAdmin],
        },
        {
            type: 'link',
            label: t('sidebar.customers', 'Customers'),
            icon: Users,
            to: '/customers',
            allowedRoles: cashierRoles,
        },
        {
            type: 'link',
            label: t('sidebar.users'),
            icon: UserIcon,
            to: '/users',
            allowedRoles: managerRoles,
        },
        {
            type: 'link',
            label: t('sidebar.settings'),
            icon: Settings,
            to: '/settings',
            allowedRoles: cashierRoles,
        },
        {
            type: 'link',
            label: t('sidebar.activity_logs'),
            icon: ActivityIcon,
            to: '/activity-logs',
            allowedRoles: [POSKasirInternalUserRepositoryUserRole.UserRoleAdmin],
        },
    ]

    const filteredMenu = filterEntries(menuItems, userRole)

    return { menuItems, filteredMenu }
}
