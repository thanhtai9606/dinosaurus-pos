import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMeQuery } from '@/lib/api/query/auth'
import {
  useSwitchTenantMutation,
  useTenantsMineQuery,
  type TenantSummary,
} from '@/lib/api/query/tenants'
import { useTenantsAdminQuery } from '@/lib/api/query/tenantsAdmin'
import { useRBAC } from '@/lib/auth/rbac'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export function TenantSwitcher() {
  const { t } = useTranslation()
  const { data: me } = useMeQuery()
  const { role } = useRBAC()
  const { data: tenantsFromApi } = useTenantsMineQuery()
  const { data: allTenants } = useTenantsAdminQuery()
  const switchTenant = useSwitchTenantMutation()

  const tenants: TenantSummary[] = useMemo(() => {
    if (role === 'super_admin' && allTenants?.length) {
      return allTenants.filter((t) => t.is_active).map(({ id, code, name }) => ({ id, code, name }))
    }
    const fromMe = (me as { tenants?: TenantSummary[] } | undefined)?.tenants
    if (fromMe?.length) return fromMe
    return tenantsFromApi ?? []
  }, [me, tenantsFromApi, role, allTenants])

  const currentId =
    (me as { tenant?: TenantSummary } | undefined)?.tenant?.id ?? tenants[0]?.id

  if (tenants.length <= 1) {
    const only = tenants[0]
    if (!only) return null
    return (
      <span className="hidden text-sm text-muted-foreground md:inline truncate max-w-[140px]">
        {only.name}
      </span>
    )
  }

  return (
    <Select
      value={currentId}
      onValueChange={async (tenantId) => {
        if (tenantId === currentId) return
        try {
          await switchTenant.mutateAsync(tenantId)
          toast.success(t('tenant.switched'))
        } catch {
          toast.error(t('tenant.switch_failed'))
        }
      }}
      disabled={switchTenant.isPending}
    >
      <SelectTrigger className="h-9 w-[160px] md:w-[200px]" aria-label={t('tenant.label')}>
        <SelectValue placeholder={t('tenant.label')} />
      </SelectTrigger>
      <SelectContent>
        {tenants.map((tnt) => (
          <SelectItem key={tnt.id} value={tnt.id}>
            {tnt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
