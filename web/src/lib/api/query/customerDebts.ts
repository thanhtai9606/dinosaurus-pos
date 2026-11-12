import { useMutation, useQuery, useQueryClient, queryOptions, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { axiosInstance } from '../client'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { useRBAC } from '@/lib/auth/rbac'
import { POSKasirInternalCommonErrorResponse } from '../generated'
import type { DebtStatus, SupplierDebtPayment } from './supplierDebts'

export type { DebtStatus }

export type CustomerDebtPayment = SupplierDebtPayment

export type CustomerDebt = {
    id: string
    customer_id: string
    customer_name: string
    order_id?: string | null
    reference_no: string
    total_amount: number
    amount_paid: number
    balance_due: number
    status: DebtStatus
    note?: string | null
    issued_at: string
    payments?: CustomerDebtPayment[]
    created_at: string
    updated_at: string
}

export type PagedCustomerDebts = {
    debts: CustomerDebt[]
    pagination: { current_page: number; total_page: number; total_data: number; per_page: number }
}

export type CustomerDebtsListParams = {
    page?: number
    limit?: number
    customer_id?: string
    status?: DebtStatus
}

export const customerDebtsListQueryOptions = (params?: CustomerDebtsListParams) =>
    queryOptions<PagedCustomerDebts, AxiosError<POSKasirInternalCommonErrorResponse>>({
        queryKey: ['customer-debts', 'list', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/customer-debts', { params })
            return (res.data as { data: PagedCustomerDebts }).data
        },
        placeholderData: keepPreviousData,
    })

export const useCustomerDebtsListQuery = (params?: CustomerDebtsListParams) => {
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('GET', '/customer-debts')
    return { ...useQuery({ ...customerDebtsListQueryOptions(params), enabled: isAllowed }), isAllowed }
}

export const customerDebtDetailQueryOptions = (id: string) =>
    queryOptions<CustomerDebt, AxiosError<POSKasirInternalCommonErrorResponse>>({
        queryKey: ['customer-debts', 'detail', id],
        queryFn: async () => {
            const res = await axiosInstance.get(`/customer-debts/${id}`)
            return (res.data as { data: CustomerDebt }).data
        },
        enabled: !!id,
    })

export const useCustomerDebtDetailQuery = (id: string) => {
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('GET', '/customer-debts/{id}')
    return {
        ...useQuery({
            ...customerDebtDetailQueryOptions(id),
            enabled: !!id && isAllowed,
        }),
        isAllowed,
    }
}

export const useCreateCustomerDebtMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/customer-debts')
    return {
        ...useMutation({
            mutationFn: async (body: Record<string, unknown>) => {
                const res = await axiosInstance.post('/customer-debts', body)
                return (res.data as { data: CustomerDebt }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['customer-debts'] })
                toast.success(t('customerDebts.messages.create_success'))
            },
            onError: (error: AxiosError<POSKasirInternalCommonErrorResponse>) => {
                toast.error(t('customerDebts.messages.create_failed', { message: error.response?.data?.message || '' }))
            },
        }),
        isAllowed,
    }
}

export const usePayCustomerDebtMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/customer-debts/{id}/payments')
    return {
        ...useMutation({
            mutationFn: async ({ id, body }: { id: string; body: { amount: number; note?: string } }) => {
                const res = await axiosInstance.post(`/customer-debts/${id}/payments`, body)
                return (res.data as { data: CustomerDebt }).data
            },
            onSuccess: async (_d, vars) => {
                await qc.invalidateQueries({ queryKey: ['customer-debts'] })
                await qc.invalidateQueries({ queryKey: ['customer-debts', 'detail', vars.id] })
                toast.success(t('customerDebts.messages.payment_success'))
            },
            onError: () => toast.error(t('customerDebts.messages.payment_failed')),
        }),
        isAllowed,
    }
}

export const useVoidCustomerDebtMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/customer-debts/{id}/void')
    return {
        ...useMutation({
            mutationFn: async (id: string) => {
                const res = await axiosInstance.post(`/customer-debts/${id}/void`)
                return (res.data as { data: CustomerDebt }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['customer-debts'] })
                toast.success(t('customerDebts.messages.void_success'))
            },
            onError: () => toast.error(t('customerDebts.messages.void_failed')),
        }),
        isAllowed,
    }
}
