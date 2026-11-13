import { useQuery, queryOptions } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/api/client'
import { useRBAC } from '@/lib/auth/rbac'

export type PlatformOverview = {
  tenant_total: number
  tenant_active: number
  tenant_shared: number
  tenant_dedicated: number
  dedicated_missing_dsn: {
    tenant_id: string
    tenant_code: string
    database_dsn_key: string
    env_configured: boolean
  }[]
  dedicated_pools_open: number
  database_ok: boolean
  schema_version: number
  schema_dirty: boolean
}

export type PlatformMembership = {
  user_id: string
  email: string
  username: string
  global_role: string
  tenant_id?: string
  tenant_code?: string
  tenant_name?: string
  tenant_role?: string | null
  is_super_admin: boolean
}

export type PlatformAudit = {
  id: string
  actor_user_id?: string
  actor_email?: string
  action: string
  resource_type: string
  resource_id?: string
  details?: Record<string, unknown>
  created_at: string
}

const platformEnabled = (role?: string) => role === 'super_admin'

export const platformOverviewQueryOptions = () =>
  queryOptions<PlatformOverview>({
    queryKey: ['platform', 'overview'],
    queryFn: async () => {
      const res = await axiosInstance.get('/platform/overview')
      return (res.data as { data: PlatformOverview }).data
    },
    staleTime: 15_000,
  })

export const usePlatformOverviewQuery = () => {
  const { role } = useRBAC()
  return useQuery({ ...platformOverviewQueryOptions(), enabled: platformEnabled(role) })
}

export const platformMembershipsQueryOptions = () =>
  queryOptions<PlatformMembership[]>({
    queryKey: ['platform', 'memberships'],
    queryFn: async () => {
      const res = await axiosInstance.get('/platform/memberships')
      return (res.data as { data: PlatformMembership[] }).data
    },
    staleTime: 30_000,
  })

export const usePlatformMembershipsQuery = () => {
  const { role } = useRBAC()
  return useQuery({ ...platformMembershipsQueryOptions(), enabled: platformEnabled(role) })
}

export const platformAuditQueryOptions = (limit = 50) =>
  queryOptions<PlatformAudit[]>({
    queryKey: ['platform', 'audit', limit],
    queryFn: async () => {
      const res = await axiosInstance.get('/platform/audit', { params: { limit } })
      return (res.data as { data: PlatformAudit[] }).data
    },
    staleTime: 10_000,
  })

export const usePlatformAuditQuery = () => {
  const { role } = useRBAC()
  return useQuery({ ...platformAuditQueryOptions(), enabled: platformEnabled(role) })
}
