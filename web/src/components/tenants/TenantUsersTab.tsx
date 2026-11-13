import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Mail, Shield, Trash2, UserPlus, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'
import {
  useCreateTenantMemberMutation,
  useRemoveTenantMemberMutation,
  useTenantMembersQuery,
  useUpdateTenantMemberMutation,
  type TenantMember,
} from '@/lib/api/query/tenantMembers'

type Props = {
  tenantId: string
}

export function TenantUsersTab({ tenantId }: Props) {
  const { t } = useTranslation()
  const { data: members, isLoading } = useTenantMembersQuery(tenantId)
  const createMutation = useCreateTenantMemberMutation(tenantId)
  const updateMutation = useUpdateTenantMemberMutation(tenantId)
  const removeMutation = useRemoveTenantMemberMutation(tenantId)

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'manager' | 'cashier'>('admin')

  const columns = useMemo<DataGridColumnDef<TenantMember>[]>(
    () => [
      {
        id: 'email',
        header: t('tenants_admin.member_email'),
        icon: Mail,
        sortable: true,
        filterable: true,
        accessor: (m) => m.email,
        cell: (m) => m.email,
      },
      {
        id: 'username',
        header: t('tenants_admin.member_username'),
        icon: UserIcon,
        sortable: true,
        filterable: true,
        accessor: (m) => m.username,
        cell: (m) => <span className="font-mono text-sm">{m.username}</span>,
      },
      {
        id: 'role',
        header: t('tenants_admin.member_role'),
        icon: Shield,
        filterable: true,
        filterType: 'select',
        filterAccessor: (m) => m.role,
        filterOptions: [
          { value: 'admin', label: 'admin' },
          { value: 'manager', label: 'manager' },
          { value: 'cashier', label: 'cashier' },
        ],
        cell: (m) => (
          <Select
            value={m.role}
            onValueChange={(v) =>
              updateMutation.mutate(
                { userId: m.user_id, role: v },
                { onError: () => toast.error(t('tenants_admin.member_update_error')) },
              )
            }
          >
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="manager">manager</SelectItem>
              <SelectItem value="cashier">cashier</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        id: 'actions',
        header: t('common.actions'),
        align: 'right',
        locked: true,
        cell: (m) => (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() =>
              removeMutation.mutate(m.user_id, {
                onSuccess: () => toast.success(t('tenants_admin.member_removed')),
                onError: () => toast.error(t('tenants_admin.member_remove_error')),
              })
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [t, removeMutation, updateMutation],
  )

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(
      { email: email.trim(), username: username.trim(), password, role },
      {
        onSuccess: () => {
          toast.success(t('tenants_admin.member_added'))
          setEmail('')
          setUsername('')
          setPassword('')
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || t('tenants_admin.member_add_error'))
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2 border rounded-lg p-4">
        <p className="sm:col-span-2 text-sm text-muted-foreground">{t('tenants_admin.members_add_help')}</p>
        <div className="space-y-1">
          <Label>{t('tenants_admin.member_email')}</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="space-y-1">
          <Label>{t('tenants_admin.member_username')}</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
        </div>
        <div className="space-y-1">
          <Label>{t('tenants_admin.member_password')}</Label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} />
        </div>
        <div className="space-y-1">
          <Label>{t('tenants_admin.member_role')}</Label>
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="manager">manager</SelectItem>
              <SelectItem value="cashier">cashier</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="gap-2" disabled={createMutation.isPending}>
            <UserPlus className="h-4 w-4" />
            {t('tenants_admin.member_add')}
          </Button>
        </div>
      </form>

      <DataGrid
        storageKey={`tenant-members-${tenantId}`}
        columns={columns}
        data={members ?? []}
        getRowId={(m) => m.user_id}
        emptyMessage={t('tenants_admin.members_empty')}
      />
    </div>
  )
}
