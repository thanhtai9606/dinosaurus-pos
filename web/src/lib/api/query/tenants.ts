import { useMutation, useQuery, useQueryClient, queryOptions } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/api/client'

export type TenantSummary = {
  id: string
  code: string
  name: string
}

export const tenantsMineQueryOptions = () =>
  queryOptions<TenantSummary[]>({
    queryKey: ['tenants', 'mine'],
    queryFn: async () => {
      const res = await axiosInstance.get('/tenants/mine')
      return (res.data as { data: TenantSummary[] }).data
    },
    staleTime: 60_000,
  })

export const useTenantsMineQuery = () => useQuery(tenantsMineQueryOptions())

export const useSwitchTenantMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['tenants', 'switch'],
    mutationFn: async (tenantId: string) => {
      const res = await axiosInstance.post('/auth/switch-tenant', { tenant_id: tenantId })
      return (res.data as { data: { tenant: TenantSummary } }).data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      await qc.invalidateQueries()
    },
  })
}

export type MeWithTenant = {
  tenant?: TenantSummary
  tenants?: TenantSummary[]
}
