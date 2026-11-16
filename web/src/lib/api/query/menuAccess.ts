import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/api/client'
import type { TenantRole } from '@/lib/auth/menuCatalog'
import { useRBAC } from '@/lib/auth/rbac'

export type MenuRoleAccessResponse = {
    catalog: {
        key: string
        path: string
        label_key: string
        section_key: string
        default_roles: TenantRole[]
        admin_lock?: boolean
    }[]
    defaults: Record<string, TenantRole[]>
    items: Record<string, TenantRole[]>
}

const queryKey = ['settings', 'menu-access'] as const

export function menuAccessQueryOptions() {
    return {
        queryKey,
        queryFn: async (): Promise<MenuRoleAccessResponse> => {
            const res = await axiosInstance.get('/settings/menu-access')
            return (res.data as { data: MenuRoleAccessResponse }).data
        },
        staleTime: 60_000,
    }
}

export function useMenuAccessQuery() {
    const { canAccessApi } = useRBAC()
    return useQuery({
        ...menuAccessQueryOptions(),
        enabled: canAccessApi('GET', '/settings/menu-access'),
    })
}

export function useUpdateMenuAccessMutation() {
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('PUT', '/settings/menu-access')
    return {
        ...useMutation({
            mutationFn: async (items: Record<string, TenantRole[]>) => {
                const res = await axiosInstance.put('/settings/menu-access', { items })
                return (res.data as { data: MenuRoleAccessResponse }).data
            },
            onSuccess: (data) => {
                qc.setQueryData(queryKey, data)
                void qc.invalidateQueries({ queryKey: ['navigation'] })
            },
        }),
        isAllowed,
    }
}