import { useMutation, useQuery, useQueryClient, queryOptions } from '@tanstack/react-query'
import { axiosInstance } from '../client'
import { useRBAC } from '@/lib/auth/rbac'
import { toast } from 'sonner'

export type NotificationChannelType = 'email' | 'msteams_webhook' | 'telegram' | 'sms' | 'firebase'

export type ReportScheduleSlot = {
    enabled: boolean
    hour: number
    minute: number
    day?: number
    month?: number
}

export type NotificationTenantConfig = {
    stock_low_threshold: number
    timezone: string
    report_schedules: {
        daily: ReportScheduleSlot
        monthly: ReportScheduleSlot
        yearly: ReportScheduleSlot
    }
    report_recipient_emails: string[]
}

export type NotificationChannel = {
    id: string
    name: string
    channel_type: NotificationChannelType
    config: Record<string, unknown>
    enabled: boolean
}

export type NotificationEventType = {
    code: string
    label: string
    description?: string
}

export type NotificationSubscription = {
    event_type: string
    channel_id: string
    channel_name?: string
    enabled: boolean
}

type Success<T> = { data: T }

export const notificationChannelsQueryOptions = () =>
    queryOptions({
        queryKey: ['notifications', 'channels'],
        queryFn: async () => {
            const res = await axiosInstance.get<Success<NotificationChannel[]>>('/notification-channels')
            return res.data.data
        },
    })

export const notificationEventTypesQueryOptions = () =>
    queryOptions({
        queryKey: ['notifications', 'event-types'],
        queryFn: async () => {
            const res = await axiosInstance.get<Success<NotificationEventType[]>>('/notification-event-types')
            return res.data.data
        },
    })

export const notificationSubscriptionsQueryOptions = () =>
    queryOptions({
        queryKey: ['notifications', 'subscriptions', 'me'],
        queryFn: async () => {
            const res = await axiosInstance.get<Success<NotificationSubscription[]>>('/notification-subscriptions/me')
            return res.data.data
        },
    })

export const notificationConfigQueryOptions = () =>
    queryOptions({
        queryKey: ['notifications', 'config'],
        queryFn: async () => {
            const res = await axiosInstance.get<Success<NotificationTenantConfig>>('/notifications/config')
            return res.data.data
        },
    })

export function useNotificationChannelsQuery() {
    const { canAccessApi } = useRBAC()
    return useQuery({
        ...notificationChannelsQueryOptions(),
        enabled: canAccessApi('GET', '/notification-channels'),
    })
}

export function useNotificationEventTypesQuery() {
    return useQuery({
        ...notificationEventTypesQueryOptions(),
        enabled: true,
    })
}

export function useNotificationSubscriptionsQuery() {
    const { canAccessApi } = useRBAC()
    return useQuery({
        ...notificationSubscriptionsQueryOptions(),
        enabled: canAccessApi('GET', '/notification-subscriptions/me'),
    })
}

export function useNotificationConfigQuery() {
    const { canAccessApi } = useRBAC()
    return useQuery({
        ...notificationConfigQueryOptions(),
        enabled: canAccessApi('GET', '/notifications/config'),
    })
}

export function useCreateNotificationChannelMutation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (body: {
            name: string
            channel_type: NotificationChannelType
            config: Record<string, unknown>
            enabled?: boolean
        }) => {
            const res = await axiosInstance.post<Success<NotificationChannel>>('/notification-channels', body)
            return res.data.data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications', 'channels'] })
            toast.success('Channel saved')
        },
        onError: () => toast.error('Failed to save channel'),
    })
}

export function useUpdateNotificationChannelMutation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id,
            ...body
        }: {
            id: string
            name: string
            config: Record<string, unknown>
            enabled?: boolean
        }) => {
            const res = await axiosInstance.put<Success<NotificationChannel>>(`/notification-channels/${id}`, body)
            return res.data.data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications', 'channels'] })
            toast.success('Channel updated')
        },
        onError: () => toast.error('Failed to update channel'),
    })
}

export function useDeleteNotificationChannelMutation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/notification-channels/${id}`)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications', 'channels'] })
            toast.success('Channel deleted')
        },
        onError: () => toast.error('Failed to delete channel'),
    })
}

export function useTestNotificationChannelMutation() {
    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.post(`/notification-channels/${id}/test`)
        },
        onSuccess: () => toast.success('Test message sent'),
        onError: (err: { response?: { data?: { message?: string; error?: string } } }) =>
            toast.error(err.response?.data?.error || err.response?.data?.message || 'Test failed'),
    })
}

export function useUpdateNotificationSubscriptionsMutation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (items: { event_type: string; channel_id: string; enabled: boolean }[]) => {
            const res = await axiosInstance.put<Success<NotificationSubscription[]>>(
                '/notification-subscriptions/me',
                { items }
            )
            return res.data.data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications', 'subscriptions', 'me'] })
            toast.success('Subscriptions saved')
        },
        onError: () => toast.error('Failed to save subscriptions'),
    })
}

export function useUpdateNotificationConfigMutation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (body: Partial<NotificationTenantConfig> & { stock_low_threshold?: number }) => {
            const res = await axiosInstance.put<Success<NotificationTenantConfig>>('/notifications/config', body)
            return res.data.data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications', 'config'] })
            toast.success('Notification settings saved')
        },
        onError: () => toast.error('Failed to save settings'),
    })
}

export type NotificationDelivery = {
    id: string
    event_type: string
    status: string
    error_text?: string
    payload_summary?: string
    created_at: string
}

export function useNotificationDeliveriesQuery(page = 1, limit = 20) {
    const { canAccessApi } = useRBAC()
    return useQuery({
        queryKey: ['notifications', 'deliveries', page, limit],
        enabled: canAccessApi('GET', '/notification-deliveries'),
        queryFn: async () => {
            const res = await axiosInstance.get<Success<{ items: NotificationDelivery[]; total: number }>>(
                '/notification-deliveries',
                { params: { page, limit } }
            )
            return res.data.data
        },
    })
}

export function useTestReportEmailMutation() {
    return useMutation({
        mutationFn: async (period: 'daily' | 'monthly' | 'yearly') => {
            await axiosInstance.post(`/notifications/reports/test?period=${period}`)
        },
        onSuccess: () => toast.success('Report email sent'),
        onError: (err: { response?: { data?: { error?: string; message?: string } } }) =>
            toast.error(err.response?.data?.error || err.response?.data?.message || 'Report send failed'),
    })
}