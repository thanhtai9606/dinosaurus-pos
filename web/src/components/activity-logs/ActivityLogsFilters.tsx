import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { ActivityLogsGetActionTypeEnum, ActivityLogsGetEntityTypeEnum } from '@/lib/api/generated'
import { ActivityLogsSearch } from '@/lib/api/query/activity-logs'
import { ListFilterField, ListSearchToolbar } from '@/components/data-table/ListSearchToolbar'

interface ActivityLogsFiltersProps {
    t: any
    search: ActivityLogsSearch
    onSearch: (term: string) => void
    updateFilter: (key: string, value: string | undefined) => void
    onDateChange: (range: { from: string; to: string }) => void
}

export function ActivityLogsFilters({
    t,
    search,
    onSearch,
    updateFilter,
    onDateChange,
}: ActivityLogsFiltersProps) {
    return (
        <ListSearchToolbar>
            <ListFilterField label={t('activity_logs.filters.search_label')} className="min-w-[min(100%,14rem)] flex-[2]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('activity_logs.search_placeholder', 'Search logs...')}
                        className="h-9 pl-8"
                        value={search.search || ''}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
            </ListFilterField>

            <ListFilterField label={t('activity_logs.filters.action_type', 'Action Type')} className="w-full sm:w-[10rem]">
                <Select
                    value={search.action_type || 'all'}
                    onValueChange={(val) => updateFilter('action_type', val === 'all' ? undefined : val)}
                >
                    <SelectTrigger className="h-9">
                        <SelectValue placeholder={t('activity_logs.filters.all_actions', 'All Actions')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('activity_logs.filters.all_actions', 'All Actions')}</SelectItem>
                        {Object.values(ActivityLogsGetActionTypeEnum).map((action) => (
                            <SelectItem key={action} value={action}>
                                {action.replace(/_/g, ' ')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </ListFilterField>

            <ListFilterField label={t('activity_logs.filters.entity_type', 'Entity Type')} className="w-full sm:w-[10rem]">
                <Select
                    value={search.entity_type || 'all'}
                    onValueChange={(val) => updateFilter('entity_type', val === 'all' ? undefined : val)}
                >
                    <SelectTrigger className="h-9">
                        <SelectValue placeholder={t('activity_logs.filters.all_entities', 'All Entities')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('activity_logs.filters.all_entities', 'All Entities')}</SelectItem>
                        {Object.values(ActivityLogsGetEntityTypeEnum).map((entity) => (
                            <SelectItem key={entity} value={entity}>
                                {entity}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </ListFilterField>

            <ListFilterField label={t('activity_logs.filters.user_id', 'User ID')} className="w-full sm:w-[9rem]">
                <Input
                    className="h-9"
                    placeholder="UUID"
                    value={search.user_id || ''}
                    onChange={(e) => updateFilter('user_id', e.target.value || undefined)}
                />
            </ListFilterField>

            <ListFilterField label={t('activity_logs.filters.date_range', 'Date range')} className="w-full sm:w-auto">
                <DateRangePicker
                    date={{ from: search.start_date || '', to: search.end_date || '' }}
                    onDateChange={onDateChange}
                />
            </ListFilterField>
        </ListSearchToolbar>
    )
}