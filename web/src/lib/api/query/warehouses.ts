import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/api/client'
import { useRBAC } from '@/lib/auth/rbac'

export type Warehouse = {
    id: string
    code: string
    name: string
    is_default: boolean
    is_active: boolean
    created_at?: string
    updated_at?: string
}

export type WarehouseStockLine = {
    product_id: string
    product_name: string
    code?: string | null
    sku?: string | null
    unit?: string
    quantity: number
    min_stock: number
}

type Paged<T, K extends string> = {
    pagination: { current_page: number; total_page: number; total_data: number; per_page: number }
} & Record<K, T[]>

export const warehousesListQueryOptions = (params?: { page?: number; limit?: number; search?: string }) =>
    queryOptions({
        queryKey: ['warehouses', 'list', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/warehouses', { params })
            return (res.data as { data: Paged<Warehouse, 'warehouses'> }).data
        },
        placeholderData: keepPreviousData,
    })

export const useWarehousesListQuery = (params?: { page?: number; limit?: number; search?: string; enabled?: boolean }) => {
    const { canAccessApi } = useRBAC()
    const enabled = (params?.enabled ?? true) && canAccessApi('GET', '/warehouses')
    return useQuery({ ...warehousesListQueryOptions(params), enabled })
}

export const warehouseStockQueryOptions = (
    warehouseId: string,
    params?: { page?: number; limit?: number; search?: string; low_stock_only?: boolean },
) =>
    queryOptions({
        queryKey: ['warehouses', warehouseId, 'stock', params],
        queryFn: async () => {
            const res = await axiosInstance.get(`/warehouses/${warehouseId}/stock`, { params })
            return (res.data as { data: Paged<WarehouseStockLine, 'lines'> }).data
        },
        enabled: !!warehouseId,
        placeholderData: keepPreviousData,
    })

export function useCreateWarehouseMutation() {
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/warehouses')
    const mutation = useMutation({
        mutationFn: async (body: { code: string; name: string; is_default?: boolean; is_active?: boolean }) => {
            const res = await axiosInstance.post('/warehouses', body)
            return (res.data as { data: Warehouse }).data
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
    })
    return { ...mutation, isAllowed }
}