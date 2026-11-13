import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { POSKasirInternalUserRepositoryUserRole } from '@/lib/api/generated'
import {
    activityLogsListQueryOptions,
    type ActivityLogsSearch,
} from '@/lib/api/query/activity-logs'
import { meQueryOptions } from '@/lib/api/query/auth'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { ActivityLogsHeader } from '@/components/activity-logs/ActivityLogsHeader'
import { ActivityLogsFilters } from '@/components/activity-logs/ActivityLogsFilters'
import { ActivityLogsTable } from '@/components/activity-logs/ActivityLogsTable'

export const Route = createFileRoute('/_dashboard/activity-logs')({
    beforeLoad: async ({ context: { queryClient } }) => {
        const user = await queryClient.ensureQueryData(meQueryOptions())
        const allowedRoles: POSKasirInternalUserRepositoryUserRole[] = [
            POSKasirInternalUserRepositoryUserRole.UserRoleAdmin,
        ]
        if (!user || !user.role || !allowedRoles.includes(user.role)) {
            throw redirect({
                to: '/login',
                search: { error: 'Unauthorized' },
            })
        }
    },
    component: ActivityLogsPage,
})

function ActivityLogsPage() {
    const { t } = useTranslation()
    const { page, onPageChange, resetPage } = useServerListState({ scope: LIST_SCOPES.activityLogs })
    const [limit] = useState(10)
    const [filters, setFilters] = useState<Omit<ActivityLogsSearch, 'page' | 'limit'>>({})

    const search: ActivityLogsSearch = { page, limit, ...filters }
    const { data } = useQuery(activityLogsListQueryOptions(search))

    const handleSearch = (term: string) => {
        setFilters((prev) => ({ ...prev, search: term || undefined }))
        resetPage()
    }

    const updateFilter = (key: string, value: string | undefined) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
        resetPage()
    }

    const onDateChange = ({ from, to }: { from?: string; to?: string }) => {
        setFilters((prev) => ({
            ...prev,
            start_date: from || undefined,
            end_date: to || undefined,
        }))
        resetPage()
    }

    return (
        <div className="space-y-6">
            <ActivityLogsHeader
                t={t}
                onClearFilters={() => {
                    setFilters({})
                    resetPage()
                }}
            />

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle>{t('activity_logs.list_title')}</CardTitle>
                    <ActivityLogsFilters
                        t={t}
                        search={search}
                        onSearch={handleSearch}
                        updateFilter={updateFilter}
                        onDateChange={onDateChange}
                    />
                </CardHeader>
                <CardContent>
                    <ActivityLogsTable
                        t={t}
                        logs={data?.logs}
                        page={page}
                        totalPages={data?.total_pages || 1}
                        onPageChange={onPageChange}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
