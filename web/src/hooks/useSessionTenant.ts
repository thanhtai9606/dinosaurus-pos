import { useMeQuery } from '@/lib/api/query/auth'

export type SessionTenant = {
  id?: string
  code?: string
  name?: string
}

/** Active store from `/auth/me` (set at login; no in-app tenant switching). */
export function useSessionTenant() {
  const { data: me } = useMeQuery()
  const tenant = (me as { tenant?: SessionTenant } | undefined)?.tenant

  return {
    tenant,
    username: me?.username,
  }
}
