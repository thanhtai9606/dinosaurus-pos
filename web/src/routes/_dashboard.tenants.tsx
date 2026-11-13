import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { meQueryOptions } from '@/lib/api/query/auth'
import {
  useTenantsAdminQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
  type TenantAdmin,
} from '@/lib/api/query/tenantsAdmin'
import { TenantFormDialog, type TenantFormValues } from '@/components/tenants/TenantFormDialog'
import { Button } from '@/components/ui/button'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

export const Route = createFileRoute('/_dashboard/tenants')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const me = await queryClient.ensureQueryData(meQueryOptions())
  const role = (me as { role?: string })?.role
    if (role !== 'super_admin') {
      throw redirect({ to: '/' })
    }
  },
  component: TenantsAdminPage,
})

function TenantsAdminPage() {
  const { t } = useTranslation()
  const { data: tenants, isLoading, refetch } = useTenantsAdminQuery()
  const createMutation = useCreateTenantMutation()
  const updateMutation = useUpdateTenantMutation()
  const deleteMutation = useDeleteTenantMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selected, setSelected] = useState<TenantAdmin | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TenantAdmin | null>(null)

  const openCreate = () => {
    setDialogMode('create')
    setSelected(null)
    setDialogOpen(true)
  }

  const openEdit = (tnt: TenantAdmin) => {
    setDialogMode('edit')
    setSelected(tnt)
    setDialogOpen(true)
  }

  const handleFormSubmit = (values: TenantFormValues) => {
    if (dialogMode === 'create') {
      createMutation.mutate(
        {
          code: values.code,
          name: values.name,
          data_plane: values.data_plane,
          database_dsn_key: values.database_dsn_key,
        },
        {
          onSuccess: () => {
            toast.success(t('tenants_admin.create_success'))
            setDialogOpen(false)
          },
          onError: (err: any) => {
            toast.error(err?.response?.data?.message || t('tenants_admin.create_error'))
          },
        },
      )
    } else if (selected) {
      updateMutation.mutate(
        { id: selected.id, name: values.name, is_active: values.is_active },
        {
          onSuccess: () => {
            toast.success(t('tenants_admin.update_success'))
            setDialogOpen(false)
          },
          onError: (err: any) => {
            toast.error(err?.response?.data?.message || t('tenants_admin.update_error'))
          },
        },
      )
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(t('tenants_admin.delete_success'))
        setDeleteTarget(null)
        void refetch()
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || t('tenants_admin.delete_error'))
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7" />
            {t('tenants_admin.title')}
          </h1>
          <p className="text-muted-foreground text-sm">{t('tenants_admin.subtitle')}</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {t('tenants_admin.add')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('tenants_admin.list_title')}</CardTitle>
          <CardDescription>{t('tenants_admin.list_help')}</CardDescription>
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
                  <TableHead>{t('tenants_admin.code')}</TableHead>
                  <TableHead>{t('tenants_admin.name')}</TableHead>
                  <TableHead>{t('tenants_admin.data_plane')}</TableHead>
                  <TableHead>{t('tenants_admin.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tenants ?? []).map((tnt) => (
                  <TableRow key={tnt.id}>
                    <TableCell className="font-mono text-sm">{tnt.code}</TableCell>
                    <TableCell>{tnt.name}</TableCell>
                    <TableCell>
                      <Badge variant={tnt.data_plane === 'dedicated' ? 'outline' : 'secondary'}>
                        {tnt.data_plane === 'dedicated'
                          ? t('tenants_admin.data_plane_dedicated')
                          : t('tenants_admin.data_plane_shared')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tnt.is_active ? 'default' : 'secondary'}>
                        {tnt.is_active ? t('tenants_admin.active') : t('tenants_admin.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(tnt)} className="gap-1">
                        <Pencil className="h-3.5 w-3.5" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        disabled={tnt.id === DEFAULT_TENANT_ID}
                        onClick={() => setDeleteTarget(tnt)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('common.delete')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TenantFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        tenant={selected}
        onSubmit={handleFormSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tenants_admin.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tenants_admin.delete_confirm_body', { code: deleteTarget?.code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
