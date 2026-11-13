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

export type CreateTenantPayload = { code: string; name: string }
export type UpdateTenantPayload = { name: string; is_active: boolean }

export const useCreateTenantMutation = () => {
  const qc = useQueryClient()
  const { role } = useRBAC()
  return useMutation({
    mutationFn: async (body: CreateTenantPayload) => {
      const res = await axiosInstance.post('/tenants', {
        code: body.code.trim().toLowerCase(),
        name: body.name.trim(),
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
