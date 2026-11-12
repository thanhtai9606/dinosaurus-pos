import { useMutation, useQuery, useQueryClient, queryOptions, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { axiosInstance } from '../client'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { useRBAC } from '@/lib/auth/rbac'
import { POSKasirInternalCommonErrorResponse } from '../generated'

export type StockReceiptItem = {
    id?: string
    product_id: string
    product_name?: string
    product_sku?: string | null
    quantity: number
    unit_cost: number
    line_total?: number
}

export type StockReceipt = {
    id: string
    receipt_no: string
    supplier_id?: string | null
    supplier_name?: string | null
    status: 'draft' | 'completed' | 'cancelled'
    received_at: string
    note?: string | null
    total_amount: number
    items?: StockReceiptItem[]
    created_at: string
    updated_at: string
}

export type PagedStockReceipts = {
    receipts: Omit<StockReceipt, 'items'>[]
    pagination: { current_page: number; total_page: number; total_data: number; per_page: number }
}

export type StockReceiptsListParams = {
    page?: number
    limit?: number
    status?: string
    supplier_id?: string
}

export const stockReceiptsListQueryOptions = (params?: StockReceiptsListParams) =>
    queryOptions<PagedStockReceipts, AxiosError<POSKasirInternalCommonErrorResponse>>({
        queryKey: ['stock-receipts', 'list', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/stock-receipts', { params })
            return (res.data as { data: PagedStockReceipts }).data
        },
        placeholderData: keepPreviousData,
    })

export const useStockReceiptsListQuery = (params?: StockReceiptsListParams) => {
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('GET', '/stock-receipts')
    return { ...useQuery({ ...stockReceiptsListQueryOptions(params), enabled: isAllowed }), isAllowed }
}

export const stockReceiptDetailQueryOptions = (id: string) =>
    queryOptions<StockReceipt, AxiosError<POSKasirInternalCommonErrorResponse>>({
        queryKey: ['stock-receipts', 'detail', id],
        queryFn: async () => {
            const res = await axiosInstance.get(`/stock-receipts/${id}`)
            return (res.data as { data: StockReceipt }).data
        },
        enabled: !!id,
    })

export const useStockReceiptDetailQuery = (id: string) => {
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('GET', '/stock-receipts/{id}')
    return {
        ...useQuery({
            ...stockReceiptDetailQueryOptions(id),
            enabled: !!id && isAllowed,
        }),
        isAllowed,
    }
}

export const useCreateStockReceiptMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/stock-receipts')
    return {
        ...useMutation({
            mutationFn: async (body: Record<string, unknown>) => {
                const res = await axiosInstance.post('/stock-receipts', body)
                return (res.data as { data: StockReceipt }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['stock-receipts'] })
                toast.success(t('stockReceipts.messages.create_success'))
            },
        }),
        isAllowed,
    }
}

export const useUpdateStockReceiptMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('PUT', '/stock-receipts/{id}')
    return {
        ...useMutation({
            mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
                const res = await axiosInstance.put(`/stock-receipts/${id}`, body)
                return (res.data as { data: StockReceipt }).data
            },
            onSuccess: async (_data, vars) => {
                await qc.invalidateQueries({ queryKey: ['stock-receipts'] })
                await qc.invalidateQueries({ queryKey: ['stock-receipts', 'detail', vars.id] })
                toast.success(t('stockReceipts.messages.update_success'))
            },
        }),
        isAllowed,
    }
}

export const useCompleteStockReceiptMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/stock-receipts/{id}/complete')
    return {
        ...useMutation({
            mutationFn: async (id: string) => {
                const res = await axiosInstance.post(`/stock-receipts/${id}/complete`)
                return (res.data as { data: StockReceipt }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['stock-receipts'] })
                await qc.invalidateQueries({ queryKey: ['products', 'list'] })
                toast.success(t('stockReceipts.messages.complete_success'))
            },
            onError: () => toast.error(t('stockReceipts.messages.complete_failed')),
        }),
        isAllowed,
    }
}

export const useCancelStockReceiptMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/stock-receipts/{id}/cancel')
    return {
        ...useMutation({
            mutationFn: async (id: string) => {
                const res = await axiosInstance.post(`/stock-receipts/${id}/cancel`)
                return (res.data as { data: StockReceipt }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['stock-receipts'] })
                toast.success(t('stockReceipts.messages.cancel_success'))
            },
        }),
        isAllowed,
    }
}
