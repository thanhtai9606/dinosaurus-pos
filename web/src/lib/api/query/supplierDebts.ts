import { useMutation, useQuery, useQueryClient, queryOptions, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { axiosInstance } from '../client'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { useRBAC } from '@/lib/auth/rbac'
import { POSKasirInternalCommonErrorResponse } from '../generated'

export type DebtStatus = 'open' | 'partial' | 'settled' | 'void'

export type SupplierDebtPayment = {
    id: string
    amount: number
    paid_at: string
    note?: string | null
    created_at: string
}

export type SupplierDebt = {
    id: string
    supplier_id: string
    supplier_name: string
    stock_receipt_id?: string | null
    reference_no: string
    total_amount: number
    amount_paid: number
    balance_due: number
    status: DebtStatus
    note?: string | null
    issued_at: string
    payments?: SupplierDebtPayment[]
    created_at: string
    updated_at: string
}

export type PagedSupplierDebts = {
    debts: SupplierDebt[]
    pagination: { current_page: number; total_page: number; total_data: number; per_page: number }
}

export type SupplierDebtsListParams = {
    page?: number
    limit?: number
    supplier_id?: string
    status?: DebtStatus
}

export const supplierDebtsListQueryOptions = (params?: SupplierDebtsListParams) =>
    queryOptions<PagedSupplierDebts, AxiosError<POSKasirInternalCommonErrorResponse>>({
        queryKey: ['supplier-debts', 'list', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/supplier-debts', { params })
            return (res.data as { data: PagedSupplierDebts }).data
        },
        placeholderData: keepPreviousData,
    })

export const useSupplierDebtsListQuery = (params?: SupplierDebtsListParams) => {
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('GET', '/supplier-debts')
    return { ...useQuery({ ...supplierDebtsListQueryOptions(params), enabled: isAllowed }), isAllowed }
}

export const supplierDebtDetailQueryOptions = (id: string) =>
    queryOptions<SupplierDebt, AxiosError<POSKasirInternalCommonErrorResponse>>({
        queryKey: ['supplier-debts', 'detail', id],
        queryFn: async () => {
            const res = await axiosInstance.get(`/supplier-debts/${id}`)
            return (res.data as { data: SupplierDebt }).data
        },
        enabled: !!id,
    })

export const useSupplierDebtDetailQuery = (id: string) => {
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('GET', '/supplier-debts/{id}')
    return {
        ...useQuery({
            ...supplierDebtDetailQueryOptions(id),
            enabled: !!id && isAllowed,
        }),
        isAllowed,
    }
}

export const useCreateSupplierDebtMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/supplier-debts')
    return {
        ...useMutation({
            mutationFn: async (body: Record<string, unknown>) => {
                const res = await axiosInstance.post('/supplier-debts', body)
                return (res.data as { data: SupplierDebt }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['supplier-debts'] })
                toast.success(t('supplierDebts.messages.create_success'))
            },
            onError: (error: AxiosError<POSKasirInternalCommonErrorResponse>) => {
                toast.error(t('supplierDebts.messages.create_failed', { message: error.response?.data?.message || '' }))
            },
        }),
        isAllowed,
    }
}

export const usePaySupplierDebtMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/supplier-debts/{id}/payments')
    return {
        ...useMutation({
            mutationFn: async ({ id, body }: { id: string; body: { amount: number; note?: string } }) => {
                const res = await axiosInstance.post(`/supplier-debts/${id}/payments`, body)
                return (res.data as { data: SupplierDebt }).data
            },
            onSuccess: async (_d, vars) => {
                await qc.invalidateQueries({ queryKey: ['supplier-debts'] })
                await qc.invalidateQueries({ queryKey: ['supplier-debts', 'detail', vars.id] })
                toast.success(t('supplierDebts.messages.payment_success'))
            },
            onError: () => toast.error(t('supplierDebts.messages.payment_failed')),
        }),
        isAllowed,
    }
}

export const useVoidSupplierDebtMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/supplier-debts/{id}/void')
    return {
        ...useMutation({
            mutationFn: async (id: string) => {
                const res = await axiosInstance.post(`/supplier-debts/${id}/void`)
                return (res.data as { data: SupplierDebt }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['supplier-debts'] })
                toast.success(t('supplierDebts.messages.void_success'))
            },
            onError: () => toast.error(t('supplierDebts.messages.void_failed')),
        }),
        isAllowed,
    }
}
