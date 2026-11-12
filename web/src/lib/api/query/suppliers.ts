import { useMutation, useQuery, useQueryClient, queryOptions, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { axiosInstance } from '../client'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { useRBAC } from '@/lib/auth/rbac'
import { POSKasirInternalCommonErrorResponse } from '../generated'

export type Supplier = {
    id: string
    code?: string | null
    name: string
    phone?: string | null
    email?: string | null
    address?: string | null
    tax_id?: string | null
    notes?: string | null
    is_active: boolean
    created_at?: string
    updated_at?: string
}

export type PagedSuppliers = {
    suppliers: Supplier[]
    pagination: { current_page: number; total_page: number; total_data: number; per_page: number }
}

export type SuppliersListParams = { page?: number; limit?: number; search?: string }

export const suppliersListQueryOptions = (params?: SuppliersListParams) =>
    queryOptions<PagedSuppliers, AxiosError<POSKasirInternalCommonErrorResponse>>({
        queryKey: ['suppliers', 'list', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/suppliers', { params })
            return (res.data as { data: PagedSuppliers }).data
        },
        placeholderData: keepPreviousData,
    })

export const useSuppliersListQuery = (params?: SuppliersListParams) => {
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('GET', '/suppliers')
    return { ...useQuery({ ...suppliersListQueryOptions(params), enabled: isAllowed }), isAllowed }
}

export const useCreateSupplierMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/suppliers')
    return {
        ...useMutation({
            mutationFn: async (body: Record<string, unknown>) => {
                const res = await axiosInstance.post('/suppliers', body)
                return (res.data as { data: Supplier }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['suppliers', 'list'] })
                toast.success(t('suppliers.messages.create_success'))
            },
            onError: (error: AxiosError<POSKasirInternalCommonErrorResponse>) => {
                toast.error(t('suppliers.messages.create_failed', { message: error.response?.data?.message || '' }))
            },
        }),
        isAllowed,
    }
}

export const useUpdateSupplierMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('PUT', '/suppliers/{id}')
    return {
        ...useMutation({
            mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
                const res = await axiosInstance.put(`/suppliers/${id}`, body)
                return (res.data as { data: Supplier }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['suppliers', 'list'] })
                toast.success(t('suppliers.messages.update_success'))
            },
            onError: (error: AxiosError<POSKasirInternalCommonErrorResponse>) => {
                toast.error(t('suppliers.messages.update_failed', { message: error.response?.data?.message || '' }))
            },
        }),
        isAllowed,
    }
}

export const useDeleteSupplierMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('DELETE', '/suppliers/{id}')
    return {
        ...useMutation({
            mutationFn: async (id: string) => {
                await axiosInstance.delete(`/suppliers/${id}`)
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['suppliers', 'list'] })
                toast.success(t('suppliers.messages.delete_success'))
            },
            onError: (error: AxiosError<POSKasirInternalCommonErrorResponse>) => {
                toast.error(t('suppliers.messages.delete_failed', { message: error.response?.data?.message || '' }))
            },
        }),
        isAllowed,
    }
}
