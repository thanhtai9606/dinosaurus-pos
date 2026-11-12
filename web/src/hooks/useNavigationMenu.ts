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
            to: '/',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.pos'),
            icon: ShoppingCart,
            to: '/order',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.retail_pos'),
            icon: Store,
            to: '/retail-pos',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.transactions'),
            icon: Receipt,
            to: '/transactions',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.product'),
            icon: Package,
            to: '/product',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.inventory'),
            icon: Warehouse,
            to: '/inventory',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager
            ]
        },
        {
            label: t('sidebar.suppliers'),
            icon: Truck,
            to: '/suppliers',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager
            ]
        },
        {
            label: t('sidebar.stock_receipts'),
            icon: ClipboardList,
            to: '/stock-receipts',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager
            ]
        },
        {
            label: t('sidebar.promotions'),
            icon: Tag,
            to: '/promotions',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.reports'),
            icon: FileText,
            to: '/reports',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin
            ]
        },
        {
            label: t('sidebar.customers', 'Customers'),
            icon: Users,
            to: '/customers',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.users'),
            icon: UserIcon,
            to: '/users',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager
            ]
        },
        {
            label: t('sidebar.settings'),
            icon: Settings,
            to: '/settings',
            allowedRoles: [
                POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
                POSKasirInternalUserRepositoryUserRole.UserRoleManager,
                POSKasirInternalUserRepositoryUserRole.UserRoleCashier
            ]
        },
        {
            label: t('sidebar.activity_logs'),
            icon: ActivityIcon,
            to: '/activity-logs',
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
