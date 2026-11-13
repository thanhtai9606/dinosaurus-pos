import { axiosInstance } from '@/lib/api/client'

export type TenantLookupResult = { code: string; name: string }

export async function lookupTenantByCode(code: string): Promise<TenantLookupResult> {
  const res = await axiosInstance.get<{ data: TenantLookupResult }>('/tenants/lookup', {
    params: { code },
  })
  return res.data.data
}
