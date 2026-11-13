import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { meQueryOptions } from '@/lib/api/query/auth'

export async function requireSuperAdmin(queryClient: QueryClient) {
  const me = await queryClient.ensureQueryData(meQueryOptions())
  const role = (me as { role?: string })?.role
  if (role !== 'super_admin') {
    throw redirect({ to: '/' })
  }
}
