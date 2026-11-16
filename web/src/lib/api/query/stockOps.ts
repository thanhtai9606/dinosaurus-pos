import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/api/client'

type Pagination = { current_page: number; total_page: number; total_data: number; per_page: number }

export type StockMovement = {
    id: string
    product_id: string
    warehouse_id?: string | null
    product_name: string
    warehouse_name?: string | null
    change_amount: number
    previous_stock: number
    current_stock: number
    change_type: string
    note?: string | null
    created_at: string
}

export const stockMovementsQueryOptions = (params?: {
    page?: number
    limit?: number
    warehouse_id?: string
    product_id?: string
    change_type?: string
}) =>
    queryOptions({
        queryKey: ['stock-movements', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/stock-movements', { params })
            const data = (res.data as { data: { movements: StockMovement[]; pagination: Pagination } }).data
            return data
        },
        placeholderData: keepPreviousData,
    })

export function useStockAdjustmentsQuery(params?: { page?: number; limit?: number; status?: string }) {
    return useQuery({
        queryKey: ['stock-adjustments', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/stock-adjustments', { params })
            return (res.data as { data: { adjustments: unknown[]; pagination: Pagination } }).data
        },
        placeholderData: keepPreviousData,
    })
}

export function useStockTransfersQuery(params?: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: ['stock-transfers', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/stock-transfers', { params })
            return (res.data as { data: { transfers: unknown[]; pagination: Pagination } }).data
        },
        placeholderData: keepPreviousData,
    })
}

export function useStockTakesQuery(params?: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: ['stock-takes', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/stock-takes', { params })
            return (res.data as { data: { stock_takes: unknown[]; pagination: Pagination } }).data
        },
        placeholderData: keepPreviousData,
    })
}

export function useCompleteAdjustmentMutation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await axiosInstance.post(`/stock-adjustments/${id}/complete`)
            return (res.data as { data: unknown }).data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['stock-adjustments'] })
            qc.invalidateQueries({ queryKey: ['stock-movements'] })
            qc.invalidateQueries({ queryKey: ['warehouses'] })
            qc.invalidateQueries({ queryKey: ['inventory'] })
        },
    })
}

export function useCompleteTransferMutation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await axiosInstance.post(`/stock-transfers/${id}/complete`)
            return (res.data as { data: unknown }).data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['stock-transfers'] })
            qc.invalidateQueries({ queryKey: ['stock-movements'] })
            qc.invalidateQueries({ queryKey: ['warehouses'] })
        },
    })
}

export function usePostStockTakeMutation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await axiosInstance.post(`/stock-takes/${id}/post`)
            return (res.data as { data: unknown }).data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['stock-takes'] })
            qc.invalidateQueries({ queryKey: ['stock-movements'] })
            qc.invalidateQueries({ queryKey: ['warehouses'] })
        },
    })
}