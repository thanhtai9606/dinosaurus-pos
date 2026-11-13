import { useMutation, useQuery, useQueryClient, queryOptions } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/api/client'
import type { TenantSummary } from '@/lib/api/query/tenants'
import { useRBAC } from '@/lib/auth/rbac'

export type TenantAdmin = TenantSummary & { is_active: boolean }

export const tenantsAllQueryKey = ['tenants', 'all']

export const tenantsAllQueryOptions = () =>
  queryOptions<TenantAdmin[]>({
    queryKey: tenantsAllQueryKey,
    queryFn: async () => {
      const res = await axiosInstance.get('/tenants')
      return (res.data as { data: TenantAdmin[] }).data
    },
    staleTime: 30_000,
  })

export const useTenantsAdminQuery = () => {
  const { role } = useRBAC()
  return useQuery({
    ...tenantsAllQueryOptions(),
    enabled: role === 'super_admin',
  })
}

export type TenantOnboardingVertical = {
  id: string
  label_key: string
  description_key: string
}

export type TenantOnboardingMarket = {
  code: string
  label_key: string
}

export type TenantOnboardingOptions = {
  markets: TenantOnboardingMarket[]
  verticals: TenantOnboardingVertical[]
}

export const tenantOnboardingQueryKey = (market: string) => ['tenants', 'onboarding-options', market] as const

export const useTenantOnboardingOptionsQuery = (market: string, enabled: boolean) => {
  const { role } = useRBAC()
  return useQuery({
    queryKey: tenantOnboardingQueryKey(market),
    queryFn: async () => {
      const res = await axiosInstance.get('/tenants/onboarding-options', { params: { market } })
      return (res.data as { data: TenantOnboardingOptions }).data
    },
    enabled: enabled && role === 'super_admin',
    staleTime: 60_000,
  })
}

export type CreateTenantPayload = {
  code: string
  name: string
  data_plane?: 'shared' | 'dedicated'
  database_dsn_key?: string
  market_code?: string
  business_vertical?: string
  seed_demo?: boolean
}
export type UpdateTenantPayload = { name: string; is_active: boolean }

export const useCreateTenantMutation = () => {
  const qc = useQueryClient()
  const { role } = useRBAC()
  return useMutation({
    mutationFn: async (body: CreateTenantPayload) => {
      const res = await axiosInstance.post('/tenants', {
        code: body.code.trim().toLowerCase(),
        name: body.name.trim(),
        market_code: body.market_code ?? 'vn',
        business_vertical: body.business_vertical ?? 'multi',
        seed_demo: body.seed_demo ?? true,
        ...(body.data_plane && body.data_plane !== 'shared'
          ? {
              data_plane: body.data_plane,
              database_dsn_key: body.database_dsn_key?.trim(),
            }
          : {}),
      })
      return (res.data as { data: TenantAdmin }).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantsAllQueryKey })
      qc.invalidateQueries({ queryKey: ['tenants', 'mine'] })
    },
  })
}

export const useUpdateTenantMutation = () => {
  const qc = useQueryClient()
  const { role } = useRBAC()
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateTenantPayload & { id: string }) => {
      const res = await axiosInstance.put(`/tenants/${id}`, body)
      return (res.data as { data: TenantAdmin }).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantsAllQueryKey })
      qc.invalidateQueries({ queryKey: ['tenants', 'mine'] })
    },
  })
}

export const useDeleteTenantMutation = () => {
  const qc = useQueryClient()
  const { role } = useRBAC()
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/tenants/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantsAllQueryKey })
      qc.invalidateQueries({ queryKey: ['tenants', 'mine'] })
    },
  })
}
