import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Server, Loader2, ExternalLink } from 'lucide-react'
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin'
import { usePlatformOverviewQuery } from '@/lib/api/query/platform'
import { DedicatedDsnAlert } from '@/components/platform/DedicatedDsnAlert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_dashboard/platform/ops')({
  beforeLoad: async ({ context: { queryClient } }) => {
    await requireSuperAdmin(queryClient)
  },
  component: PlatformOpsPage,
})

function PlatformOpsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = usePlatformOverviewQuery()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Server className="h-7 w-7" />
          {t('platform.ops_title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('platform.ops_subtitle')}</p>
      </div>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
      ) : data ? (
        <>
          <DedicatedDsnAlert issues={data.dedicated_missing_dsn} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('platform.ops_migrate_title')}</CardTitle>
                <CardDescription>{t('platform.ops_migrate_help')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm font-mono bg-muted/40 rounded-lg p-4">
                <p>make migrate-up</p>
                <p>make migrate-all-databases</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('platform.ops_provision_title')}</CardTitle>
                <CardDescription>{t('platform.ops_provision_help')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs">
                  {`./scripts/provision-tenant-db.sh \\
  --code acme --name "ACME" \\
  --dbname pos_tenant_acme \\
  --env-key TENANT_DSN_ACME`}
                </pre>
                <p className="text-muted-foreground">{t('platform.ops_provision_note')}</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t('platform.ops_backup_title')}</CardTitle>
                <CardDescription>{t('platform.ops_backup_help')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm font-mono bg-muted/40 rounded-lg p-4">
                <p>make backup</p>
                <p>make restore</p>
                <p className="font-sans text-xs text-muted-foreground">{t('platform.ops_backup_note')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('platform.ops_notify_title')}</CardTitle>
                <CardDescription>{t('platform.ops_notify_help')}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{t('platform.ops_notify_body')}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('platform.ops_system_title')}</CardTitle>
                <CardDescription>{t('platform.ops_system_help')}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>{t('platform.ops_system_body')}</p>
                <p className="font-mono text-xs">.env, DB_*, TENANT_DSN_*</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t('platform.ops_links_title')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to="/tenants">{t('platform.ops_go_tenants')}</Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="/healthz" target="_blank" rel="noreferrer" className="gap-2">
                  /healthz
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
