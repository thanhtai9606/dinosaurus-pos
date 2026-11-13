import { useState, useEffect } from 'react'
import { createFileRoute, Outlet, redirect, useRouter, useRouterState } from '@tanstack/react-router'
import { OpenShiftModal } from "@/components/modals/OpenShiftModal"
import { CloseShiftModal } from "@/components/modals/CloseShiftModal"
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { meQueryOptions } from '@/lib/api/query/auth'
import { useTranslation } from 'react-i18next'
import { useBrandingSettingsQuery, financialSettingsQueryOptions } from '@/lib/api/query/settings'
import { MoneyProvider } from '@/context/MoneyContext'
import { useNavigationMenu } from '@/hooks/useNavigationMenu'
import { isSuperAdminPlatformPath, SUPER_ADMIN_HOME } from '@/lib/auth/superAdminPaths'
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar"
import { useAppWebSocket } from '@/hooks/useAppWebSocket'
import { useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/_dashboard')({
    loader: async ({ context: { queryClient } }) => {
        try {
            await queryClient.ensureQueryData(financialSettingsQueryOptions())
            return await queryClient.ensureQueryData(meQueryOptions())
        } catch (error: any) {
            const status = error?.response?.status ?? error?.status
            if (status === 401) {
                queryClient.setQueryData(meQueryOptions().queryKey, null)
                throw redirect({ to: '/login' })
            }
            throw error
        }
    },
    component: DashboardLayout,
})

function DashboardLayout() {
    const { t } = useTranslation()
    const auth = useAuth()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const { data: branding } = useBrandingSettingsQuery()
    const queryClient = useQueryClient()

    useAppWebSocket((event) => {
        if (event.type === 'ORDER_CREATED' || event.type === 'ORDER_UPDATED') {
            queryClient.invalidateQueries({ queryKey: ['orders'] })
        }
    })

    useEffect(() => {
        if (branding?.app_name) {
            document.title = branding.app_name
        }
    }, [branding?.app_name])

    const handleLogout = async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)

        try {
            await auth.logout()
            await router.navigate({ to: '/login', replace: true })
        } catch (error) {
            console.error("Logout UI error:", error)
        } finally {
            setIsLoggingOut(false)
        }
    }

    const { filteredMenu } = useNavigationMenu(auth.user?.role)
    const pathname = useRouterState({ select: (s) => s.location.pathname })
    const isSuperAdmin = auth.user?.role === 'super_admin'

    useEffect(() => {
        if (!isSuperAdmin) return
        if (pathname === '/' || !isSuperAdminPlatformPath(pathname)) {
            void router.navigate({ to: SUPER_ADMIN_HOME, replace: true })
        }
    }, [isSuperAdmin, pathname, router])

    return (
        <div className={cn(
            "grid h-screen w-full overflow-hidden transition-all duration-300",
            isSidebarCollapsed ? "md:grid-cols-[80px_1fr]" : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
        )}>
            <DashboardSidebar
                t={t}
                branding={branding}
                isSidebarCollapsed={isSidebarCollapsed}
                setIsSidebarCollapsed={setIsSidebarCollapsed}
                filteredMenu={filteredMenu}
            />

            <div className="min-w-0 overflow-hidden">
                <div className="flex flex-col bg-card/50 backdrop-blur-sm overflow-hidden h-[calc(100vh)] shadow-sm">
                    <DashboardTopBar
                        branding={branding}
                        filteredMenu={filteredMenu}
                        user={auth.user}
                        userRole={auth.user?.role}
                        isSuperAdmin={isSuperAdmin}
                        handleLogout={handleLogout}
                    />
                    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6 overflow-y-auto overflow-x-hidden min-w-0">
                        <MoneyProvider>
                            <Outlet />
                        </MoneyProvider>
                    </main>
                </div>
                {!isSuperAdmin && (
                    <>
                        <OpenShiftModal />
                        <CloseShiftModal />
                    </>
                )}
            </div>
        </div>
    )
}
