import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Layers, Loader2 } from 'lucide-react'
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin'
import { usePlatformOverviewQuery } from '@/lib/api/query/platform'
import { DedicatedDsnAlert } from '@/components/platform/DedicatedDsnAlert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_dashboard/platform/overview')({
  beforeLoad: async ({ context: { queryClient } }) => {
    await requireSuperAdmin(queryClient)
  },
  component: PlatformOverviewPage,
})

function StatCard({ title, value, hint }: { title: string; value: number | string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function PlatformOverviewPage() {
  const { t } = useTranslation()
  const { data, isLoading } = usePlatformOverviewQuery()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Layers className="h-7 w-7" />
          {t('platform.overview_title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('platform.overview_subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          <DedicatedDsnAlert issues={data.dedicated_missing_dsn} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title={t('platform.stat_total')} value={data.tenant_total} />
            <StatCard title={t('platform.stat_active')} value={data.tenant_active} />
            <StatCard title={t('platform.stat_shared')} value={data.tenant_shared} />
            <StatCard title={t('platform.stat_dedicated')} value={data.tenant_dedicated} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('platform.health_title')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 text-sm">
              <Badge variant={data.database_ok ? 'default' : 'destructive'}>
                {data.database_ok ? t('platform.db_ok') : t('platform.db_fail')}
              </Badge>
              <Badge variant="outline">
                {t('platform.schema_version', { version: data.schema_version })}
                {data.schema_dirty ? ` (${t('platform.schema_dirty')})` : ''}
              </Badge>
              <Badge variant="secondary">
                {t('platform.dedicated_pools', { count: data.dedicated_pools_open })}
              </Badge>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
