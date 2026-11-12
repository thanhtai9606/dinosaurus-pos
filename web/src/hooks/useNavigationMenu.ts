import { useTranslation } from 'react-i18next'
import {
    FileText,
    LayoutDashboard,
    Package,
    Settings,
    ShoppingCart,
    User as UserIcon,
    Receipt,
    Tag,
    ActivityIcon,
    Users,
    Truck,
    ClipboardList,
    Warehouse,
    Store,
} from 'lucide-react'
import { POSKasirInternalUserRepositoryUserRole } from '@/lib/api/generated'

export type DashboardMenuItem = {
    label: string
    icon: any
    to: string
    allowedRoles: POSKasirInternalUserRepositoryUserRole[]
}

export function useNavigationMenu(userRole?: POSKasirInternalUserRepositoryUserRole) {
    const { t } = useTranslation()

    const menuItems: DashboardMenuItem[] = [
        {
            label: t('sidebar.summary'),
            icon: LayoutDashboard,
            to: '/$locale',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.pos'),
            icon: ShoppingCart,
            to: '/$locale/order',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.retail_pos'),
            icon: Store,
            to: '/$locale/retail-pos',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.transactions'),
            icon: Receipt,
            to: '/$locale/transactions',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.product'),
            icon: Package,
            to: '/$locale/product',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.inventory'),
            icon: Warehouse,
            to: '/$locale/inventory',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager
            ]
        },
        {
            label: t('sidebar.suppliers'),
            icon: Truck,
            to: '/$locale/suppliers',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager
            ]
        },
        {
            label: t('sidebar.stock_receipts'),
            icon: ClipboardList,
            to: '/$locale/stock-receipts',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager
            ]
        },
        {
            label: t('sidebar.promotions'),
            icon: Tag,
            to: '/$locale/promotions',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.reports'),
            icon: FileText,
            to: '/$locale/reports',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin
            ]
        },
        {
            label: t('sidebar.customers', 'Customers'),
            icon: Users,
            to: '/$locale/customers',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.users'),
            icon: UserIcon,
            to: '/$locale/users',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager
            ]
        },
        {
            label: t('sidebar.settings'),
            icon: Settings,
            to: '/$locale/settings',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.activity_logs'),
            icon: ActivityIcon,
            to: '/$locale/activity-logs',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
            ]
        }
    ]

    const filteredMenu = menuItems.filter(item =>
        userRole && item.allowedRoles.includes(userRole)
    )

    return { menuItems, filteredMenu }
}
