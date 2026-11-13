import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Building2, Hash, Layers, Pencil, Plus, Settings2, Trash2, ToggleLeft } from 'lucide-react'
import { useMemo } from 'react'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin'
import { usePlatformOverviewQuery } from '@/lib/api/query/platform'
import { DedicatedDsnAlert } from '@/components/platform/DedicatedDsnAlert'
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
    await requireSuperAdmin(queryClient)
  },
  component: TenantsAdminPage,
})

function TenantsAdminPage() {
  const { t } = useTranslation()
  const { data: tenants, isLoading, refetch } = useTenantsAdminQuery()
  const { data: platformOverview } = usePlatformOverviewQuery()
  const createMutation = useCreateTenantMutation()
  const updateMutation = useUpdateTenantMutation()
  const deleteMutation = useDeleteTenantMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [dialogTab, setDialogTab] = useState<'general' | 'users'>('general')
  const [selected, setSelected] = useState<TenantAdmin | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TenantAdmin | null>(null)

  const openCreate = () => {
    setDialogMode('create')
    setSelected(null)
    setDialogTab('general')
    setDialogOpen(true)
  }

  const openEdit = (tnt: TenantAdmin, tab: 'general' | 'users' = 'general') => {
    setDialogMode('edit')
    setSelected(tnt)
    setDialogTab(tab)
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
          onSuccess: (created) => {
            toast.success(t('tenants_admin.create_success'))
            setDialogMode('edit')
            setSelected(created)
            setDialogTab('users')
            void refetch()
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

  const columns = useMemo<DataGridColumnDef<TenantAdmin>[]>(
    () => [
      {
        id: 'code',
        header: t('tenants_admin.code'),
        icon: Hash,
        sortable: true,
        filterable: true,
        accessor: (r) => r.code,
        cell: (tnt) => <span className="font-mono text-sm">{tnt.code}</span>,
      },
      {
        id: 'name',
        header: t('tenants_admin.name'),
        icon: Building2,
        sortable: true,
        filterable: true,
        accessor: (r) => r.name,
        cell: (tnt) => tnt.name,
      },
      {
        id: 'data_plane',
        header: t('tenants_admin.data_plane'),
        icon: Layers,
        filterable: true,
        filterType: 'select',
        filterAccessor: (r) => r.data_plane,
        filterOptions: [
          { value: 'dedicated', label: t('tenants_admin.data_plane_dedicated') },
          { value: 'shared', label: t('tenants_admin.data_plane_shared') },
        ],
        cell: (tnt) => (
          <Badge variant={tnt.data_plane === 'dedicated' ? 'outline' : 'secondary'}>
            {tnt.data_plane === 'dedicated'
              ? t('tenants_admin.data_plane_dedicated')
              : t('tenants_admin.data_plane_shared')}
          </Badge>
        ),
      },
      {
        id: 'status',
        header: t('tenants_admin.status'),
        icon: ToggleLeft,
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterAccessor: (r) => (r.is_active ? 'active' : 'inactive'),
        filterOptions: [
          { value: 'active', label: t('tenants_admin.active') },
          { value: 'inactive', label: t('tenants_admin.inactive') },
        ],
        accessor: (r) => (r.is_active ? 1 : 0),
        cell: (tnt) => (
          <Badge variant={tnt.is_active ? 'default' : 'secondary'}>
            {tnt.is_active ? t('tenants_admin.active') : t('tenants_admin.inactive')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: t('common.actions'),
        icon: Settings2,
        align: 'right',
        locked: true,
        cell: (tnt) => (
          <div className="text-right space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEdit(tnt, 'users')}
              className="gap-1 hidden sm:inline-flex"
            >
              {t('tenants_admin.manage_users')}
            </Button>
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
          </div>
        ),
      },
    ],
    [t],
  )

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

      {platformOverview && (
        <DedicatedDsnAlert issues={platformOverview.dedicated_missing_dsn} />
      )}

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
            <DataGrid
              storageKey="tenants-admin-grid"
              columns={columns}
              data={tenants ?? []}
              getRowId={(r) => r.id}
              emptyMessage={t('tenants_admin.list_title')}
            />
          )}
        </CardContent>
      </Card>

      <TenantFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        tenant={selected}
        defaultTab={dialogTab}
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
