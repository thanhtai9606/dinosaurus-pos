import { useMutation, useQuery, useQueryClient, queryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { axiosInstance } from '../client'
import { toast } from 'sonner'
import { useRBAC } from '@/lib/auth/rbac'

export type DiningArea = {
    id: string
    name: string
    sort_order: number
}

export type DiningTable = {
    id: string
    area_id: string
    area_name?: string
    name: string
    capacity: number
    status: 'available' | 'occupied' | 'reserved' | 'dirty'
}

export const diningAreasQueryOptions = () =>
    queryOptions<DiningArea[]>({
        queryKey: ['dining', 'areas'],
        queryFn: async () => {
            const res = await axiosInstance.get('/dining/areas')
            return (res.data as { data: DiningArea[] }).data ?? []
        },
    })

export const diningTablesQueryOptions = () =>
    queryOptions<DiningTable[]>({
        queryKey: ['dining', 'tables'],
        queryFn: async () => {
            const res = await axiosInstance.get('/dining/tables')
            return (res.data as { data: DiningTable[] }).data ?? []
        },
    })

export function useDiningAreasQuery() {
    const { canAccessApi } = useRBAC()
    const allowed = canAccessApi('GET', '/dining/areas')
    return { ...useQuery({ ...diningAreasQueryOptions(), enabled: allowed }), isAllowed: allowed }
}

export function useDiningTablesQuery() {
    const { canAccessApi } = useRBAC()
    const allowed = canAccessApi('GET', '/dining/tables')
    return {
        ...useQuery({ ...diningTablesQueryOptions(), refetchInterval: 20000, enabled: allowed }),
        isAllowed: allowed,
    }
}

export function useCreateDiningAreaMutation() {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const allowed = canAccessApi('POST', '/dining/areas')
    return {
        ...useMutation({
            mutationFn: async (body: { name: string; sort_order?: number }) => {
                const res = await axiosInstance.post('/dining/areas', body)
                return (res.data as { data: DiningArea }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['dining', 'areas'] })
                toast.success(t('dining.messages.area_created'))
            },
            onError: () => toast.error(t('dining.messages.area_create_failed')),
        }),
        isAllowed: allowed,
    }
}

export function useCreateDiningTableMutation() {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const allowed = canAccessApi('POST', '/dining/tables')
    return {
        ...useMutation({
            mutationFn: async (body: { area_id: string; name: string; capacity: number }) => {
                const res = await axiosInstance.post('/dining/tables', body)
                return (res.data as { data: DiningTable }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['dining', 'tables'] })
                toast.success(t('dining.messages.table_created'))
            },
            onError: () => toast.error(t('dining.messages.table_create_failed')),
        }),
        isAllowed: allowed,
    }
}

export function useUpdateDiningTableStatusMutation() {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const allowed = canAccessApi('PATCH', '/dining/tables/{id}/status')
    return {
        ...useMutation({
            mutationFn: async ({ id, status }: { id: string; status: DiningTable['status'] }) => {
                const res = await axiosInstance.patch(`/dining/tables/${id}/status`, { status })
                return (res.data as { data: DiningTable }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['dining', 'tables'] })
            },
            onError: () => toast.error(t('dining.messages.status_update_failed')),
        }),
        isAllowed: allowed,
    }
}