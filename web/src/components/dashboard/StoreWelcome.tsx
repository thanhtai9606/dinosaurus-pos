import { Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMeQuery } from '@/lib/api/query/auth'

export function StoreWelcome() {
  const { t } = useTranslation()
  const { data: me } = useMeQuery()
  const tenant = (me as { tenant?: { name?: string; code?: string } } | undefined)?.tenant
  const username = me?.username

  if (!tenant?.name && !username) return null

  return (
    <div className="hidden sm:flex items-center gap-2 min-w-0 max-w-[min(220px,40vw)] pr-2 sm:pr-3 border-r border-border/50">
      <Store className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 text-left sm:text-right">
        {username && (
          <p className="text-xs text-muted-foreground truncate">
            {t('dashboard.welcome_user', { name: username })}
          </p>
        )}
        {tenant?.name && (
          <p className="text-sm font-medium truncate" title={tenant.name}>
            {tenant.name}
          </p>
        )}
      </div>
    </div>
  )
}
