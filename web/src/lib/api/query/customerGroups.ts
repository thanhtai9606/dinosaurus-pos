import { useMutation, useQuery, useQueryClient, queryOptions, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { axiosInstance } from '../client'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { useRBAC } from '@/lib/auth/rbac'
import { POSKasirInternalCommonErrorResponse } from '../generated'

export type CustomerGroup = {
    id: string
    code: string
    name: string
    description?: string | null
    created_at?: string
    updated_at?: string
}

export type PagedCustomerGroups = {
    groups: CustomerGroup[]
    pagination: { current_page: number; total_page: number; total_data: number; per_page: number }
}

export type CustomerGroupsListParams = { page?: number; limit?: number; search?: string }

export const customerGroupsListQueryOptions = (params?: CustomerGroupsListParams) =>
    queryOptions<PagedCustomerGroups, AxiosError<POSKasirInternalCommonErrorResponse>>({
        queryKey: ['customer-groups', 'list', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/customer-groups', { params })
            return (res.data as { data: PagedCustomerGroups }).data
        },
        placeholderData: keepPreviousData,
    })

export const useCustomerGroupsListQuery = (params?: CustomerGroupsListParams) => {
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('GET', '/customer-groups')
    return { ...useQuery({ ...customerGroupsListQueryOptions(params), enabled: isAllowed }), isAllowed }
}

export const useCreateCustomerGroupMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/customer-groups')
    return {
        ...useMutation({
            mutationFn: async (body: { code: string; name: string; description?: string }) => {
                const res = await axiosInstance.post('/customer-groups', body)
                return (res.data as { data: CustomerGroup }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['customer-groups', 'list'] })
                toast.success(t('customerGroups.messages.create_success'))
            },
            onError: (error: AxiosError<POSKasirInternalCommonErrorResponse>) => {
                toast.error(t('customerGroups.messages.create_failed', { message: error.response?.data?.message || '' }))
            },
        }),
        isAllowed,
    }
}

export const useUpdateCustomerGroupMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('PUT', '/customer-groups/{id}')
    return {
        ...useMutation({
            mutationFn: async ({ id, body }: { id: string; body: { code: string; name: string; description?: string } }) => {
                const res = await axiosInstance.put(`/customer-groups/${id}`, body)
                return (res.data as { data: CustomerGroup }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['customer-groups', 'list'] })
                toast.success(t('customerGroups.messages.update_success'))
            },
            onError: (error: AxiosError<POSKasirInternalCommonErrorResponse>) => {
                toast.error(t('customerGroups.messages.update_failed', { message: error.response?.data?.message || '' }))
            },
        }),
        isAllowed,
    }
}

export const useDeleteCustomerGroupMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('DELETE', '/customer-groups/{id}')
    return {
        ...useMutation({
            mutationFn: async (id: string) => {
                await axiosInstance.delete(`/customer-groups/${id}`)
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['customer-groups', 'list'] })
                toast.success(t('customerGroups.messages.delete_success'))
            },
            onError: (error: AxiosError<POSKasirInternalCommonErrorResponse>) => {
                toast.error(t('customerGroups.messages.delete_failed', { message: error.response?.data?.message || '' }))
            },
        }),
        isAllowed,
    }
}
