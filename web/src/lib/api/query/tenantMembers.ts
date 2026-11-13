import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/api/client'

export type TenantMember = {
  user_id: string
  email: string
  username: string
  role: string
  is_active: boolean
}

export const tenantMembersQueryKey = (tenantId: string) => ['tenants', tenantId, 'members']

export const useTenantMembersQuery = (tenantId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: tenantMembersQueryKey(tenantId ?? ''),
    enabled: Boolean(tenantId) && enabled,
    queryFn: async () => {
      const res = await axiosInstance.get(`/tenants/${tenantId}/members`)
      return (res.data as { data: TenantMember[] }).data
    },
  })

export const useCreateTenantMemberMutation = (tenantId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      email: string
      username: string
      password: string
      role: 'admin' | 'manager' | 'cashier'
    }) => {
      const res = await axiosInstance.post(`/tenants/${tenantId}/members`, body)
      return (res.data as { data: TenantMember }).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantMembersQueryKey(tenantId) }),
  })
}

export const useUpdateTenantMemberMutation = (tenantId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await axiosInstance.put(`/tenants/${tenantId}/members/${userId}`, { role })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantMembersQueryKey(tenantId) }),
  })
}

export const useRemoveTenantMemberMutation = (tenantId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      await axiosInstance.delete(`/tenants/${tenantId}/members/${userId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantMembersQueryKey(tenantId) }),
  })
}
