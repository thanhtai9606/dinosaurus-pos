import { Link } from '@tanstack/react-router'
import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { DashboardBranding } from '@/components/dashboard/types'

type Props = {
  branding?: DashboardBranding
  className?: string
  titleClassName?: string
}

export function DashboardAppBrand({ branding, className, titleClassName }: Props) {
  const { t } = useTranslation()

  return (
    <Link to="/" className={cn('flex items-center gap-3 font-heading font-bold min-w-0', className)}>
      {branding?.app_logo ? (
        <img
          src={branding.app_logo}
          alt={t('settings.branding.logo')}
          className="h-9 w-9 object-contain rounded-xl shrink-0"
        />
      ) : (
        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
      )}
      <span className={cn('truncate tracking-tight', titleClassName)}>
        {branding?.app_name || t('dashboard.brand_name')}
      </span>
    </Link>
  )
}
