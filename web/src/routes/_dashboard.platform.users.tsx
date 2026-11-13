import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { UserCog, Loader2 } from 'lucide-react'
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin'
import { usePlatformMembershipsQuery } from '@/lib/api/query/platform'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_dashboard/platform/users')({
  beforeLoad: async ({ context: { queryClient } }) => {
    await requireSuperAdmin(queryClient)
  },
  component: PlatformUsersPage,
})

function PlatformUsersPage() {
  const { t } = useTranslation()
  const { data, isLoading } = usePlatformMembershipsQuery()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCog className="h-7 w-7" />
          {t('platform.users_title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('platform.users_subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('platform.users_table_title')}</CardTitle>
          <CardDescription>{t('platform.users_table_help')}</CardDescription>
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
                  <TableHead>{t('platform.col_email')}</TableHead>
                  <TableHead>{t('platform.col_username')}</TableHead>
                  <TableHead>{t('platform.col_global_role')}</TableHead>
                  <TableHead>{t('platform.col_tenant')}</TableHead>
                  <TableHead>{t('platform.col_tenant_role')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((row, idx) => (
                  <TableRow key={`${row.user_id}-${row.tenant_id ?? 'sa'}-${idx}`}>
                    <TableCell>{row.email}</TableCell>
                    <TableCell className="font-mono text-sm">{row.username}</TableCell>
                    <TableCell>
                      {row.is_super_admin ? (
                        <Badge>super_admin</Badge>
                      ) : (
                        <span className="text-muted-foreground">{row.global_role}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.tenant_code ? (
                        <span className="font-mono text-sm">{row.tenant_code}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{row.tenant_role ?? (row.is_super_admin ? '—' : '—')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
