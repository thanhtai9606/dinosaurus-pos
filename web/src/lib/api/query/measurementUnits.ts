import { useMutation, useQuery, useQueryClient, queryOptions, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { axiosInstance } from '../client'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { useRBAC } from '@/lib/auth/rbac'
import { POSKasirInternalCommonErrorResponse } from '../generated'

export type MeasurementUnit = {
    id: string
    code: string
    name: string
    created_at?: string
    updated_at?: string
}

export type PagedMeasurementUnits = {
    units: MeasurementUnit[]
    pagination: { current_page: number; total_page: number; total_data: number; per_page: number }
}

export type MeasurementUnitsListParams = { page?: number; limit?: number; search?: string }

export const measurementUnitsListQueryOptions = (params?: MeasurementUnitsListParams) =>
    queryOptions<PagedMeasurementUnits, AxiosError<POSKasirInternalCommonErrorResponse>>({
        queryKey: ['measurement-units', 'list', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/measurement-units', { params })
            return (res.data as { data: PagedMeasurementUnits }).data
        },
        placeholderData: keepPreviousData,
    })

export const useMeasurementUnitsListQuery = (params?: MeasurementUnitsListParams) => {
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('GET', '/measurement-units')
    return { ...useQuery({ ...measurementUnitsListQueryOptions(params), enabled: isAllowed }), isAllowed }
}

export const useCreateMeasurementUnitMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('POST', '/measurement-units')
    return {
        ...useMutation({
            mutationFn: async (body: { code: string; name: string }) => {
                const res = await axiosInstance.post('/measurement-units', body)
                return (res.data as { data: MeasurementUnit }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['measurement-units', 'list'] })
                toast.success(t('measurementUnits.messages.create_success'))
            },
            onError: (error: AxiosError<POSKasirInternalCommonErrorResponse>) => {
                const msg = error.response?.data?.message || ''
                if (error.response?.status === 409) {
                    toast.error(
                        msg.toLowerCase().includes('name')
                            ? t('measurementUnits.messages.duplicate_name')
                            : t('measurementUnits.messages.duplicate_code'),
                    )
                    return
                }
                toast.error(t('measurementUnits.messages.create_failed', { message: msg }))
            },
        }),
        isAllowed,
    }
}

export const useUpdateMeasurementUnitMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('PUT', '/measurement-units/{id}')
    return {
        ...useMutation({
            mutationFn: async ({ id, body }: { id: string; body: { code: string; name: string } }) => {
                const res = await axiosInstance.put(`/measurement-units/${id}`, body)
                return (res.data as { data: MeasurementUnit }).data
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['measurement-units', 'list'] })
                toast.success(t('measurementUnits.messages.update_success'))
            },
            onError: (error: AxiosError<POSKasirInternalCommonErrorResponse>) => {
                const msg = error.response?.data?.message || ''
                if (error.response?.status === 409) {
                    toast.error(
                        msg.toLowerCase().includes('name')
                            ? t('measurementUnits.messages.duplicate_name')
                            : t('measurementUnits.messages.duplicate_code'),
                    )
                    return
                }
                toast.error(t('measurementUnits.messages.update_failed', { message: msg }))
            },
        }),
        isAllowed,
    }
}

export const useDeleteMeasurementUnitMutation = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const isAllowed = canAccessApi('DELETE', '/measurement-units/{id}')
    return {
        ...useMutation({
            mutationFn: async (id: string) => {
                await axiosInstance.delete(`/measurement-units/${id}`)
            },
            onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: ['measurement-units', 'list'] })
                toast.success(t('measurementUnits.messages.delete_success'))
            },
            onError: (error: AxiosError<POSKasirInternalCommonErrorResponse>) => {
                const msg = error.response?.data?.message || ''
                toast.error(t('measurementUnits.messages.delete_failed', { message: msg }))
            },
        }),
        isAllowed,
    }
}
