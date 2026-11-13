import { useTranslation } from 'react-i18next'
import { SettingsPanel } from '@/components/SettingsPanel'
import { ShiftControl } from '@/components/dashboard/ShiftControl'
import { DashboardUserMenu } from '@/components/dashboard/DashboardUserMenu'
import { StoreWelcome } from '@/components/dashboard/StoreWelcome'
import { DashboardMobileNav } from '@/components/dashboard/DashboardMobileNav'
import type { DashboardMenuEntry } from '@/hooks/useNavigationMenu'

type Props = {
  branding: { app_logo?: string; app_name?: string } | undefined
  filteredMenu: DashboardMenuEntry[]
  user: Parameters<typeof DashboardUserMenu>[0]['user']
  userRole?: string
  isSuperAdmin: boolean
  handleLogout: () => void
}

export function DashboardTopBar({
  branding,
  filteredMenu,
  user,
  userRole,
  isSuperAdmin,
  handleLogout,
}: Props) {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-card/90 backdrop-blur-md px-3 sm:px-5">
      <div className="flex items-center md:hidden">
        <DashboardMobileNav
          t={t}
          branding={branding}
          filteredMenu={filteredMenu}
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 min-w-0">
        {isSuperAdmin ? (
          <span className="hidden sm:inline text-sm text-muted-foreground pr-2 sm:pr-3 border-r border-border/50">
            {t('dashboard.platform_console')}
          </span>
        ) : (
          <StoreWelcome />
        )}

        {!isSuperAdmin && <ShiftControl compact />}

        <SettingsPanel />

        <DashboardUserMenu
          t={t}
          user={user}
          userRole={userRole as Parameters<typeof DashboardUserMenu>[0]['userRole']}
          handleLogout={handleLogout}
          variant="header"
        />
      </div>
    </header>
  )
}
