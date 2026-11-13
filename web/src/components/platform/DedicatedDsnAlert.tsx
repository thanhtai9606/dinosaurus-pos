import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { PlatformOverview } from '@/lib/api/query/platform'

type Props = {
  issues: PlatformOverview['dedicated_missing_dsn']
  className?: string
}

export function DedicatedDsnAlert({ issues, className }: Props) {
  const { t } = useTranslation()
  if (!issues?.length) return null

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('platform.dedicated_warning_title')}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{t('platform.dedicated_warning_body')}</p>
        <ul className="list-disc pl-5 text-sm">
          {issues.map((item) => (
            <li key={item.tenant_id}>
              <span className="font-mono">{item.tenant_code}</span>
              {item.database_dsn_key ? (
                <>
                  {' — '}
                  <code>{item.database_dsn_key}</code>
                </>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{t('platform.dedicated_warning_help')}</p>
      </AlertDescription>
    </Alert>
  )
}
