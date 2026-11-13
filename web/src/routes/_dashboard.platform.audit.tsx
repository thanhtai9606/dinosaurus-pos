import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ScrollText, Loader2 } from 'lucide-react'
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin'
import { usePlatformAuditQuery } from '@/lib/api/query/platform'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'

export const Route = createFileRoute('/_dashboard/platform/audit')({
  beforeLoad: async ({ context: { queryClient } }) => {
    await requireSuperAdmin(queryClient)
  },
  component: PlatformAuditPage,
})

function PlatformAuditPage() {
  const { t } = useTranslation()
  const { data, isLoading } = usePlatformAuditQuery()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-7 w-7" />
          {t('platform.audit_title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('platform.audit_subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('platform.audit_table_title')}</CardTitle>
          <CardDescription>{t('platform.audit_table_help')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('platform.col_time')}</TableHead>
                  <TableHead>{t('platform.col_actor')}</TableHead>
                  <TableHead>{t('platform.col_action')}</TableHead>
                  <TableHead>{t('platform.col_resource')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(row.created_at), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm">{row.actor_email ?? '—'}</TableCell>
                    <TableCell className="font-mono text-sm">{row.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.resource_type}
                      {row.resource_id ? ` / ${row.resource_id.slice(0, 8)}…` : ''}
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {t('platform.audit_empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
