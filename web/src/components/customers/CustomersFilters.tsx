import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCustomerGroupsListQuery } from '@/lib/api/query/customerGroups'
import { ListFilterField, ListSearchToolbar } from '@/components/data-table/ListSearchToolbar'

interface CustomersFiltersProps {
    t: any
    search: string
    onSearchChange: (term: string) => void
    groupId?: string
    onGroupChange: (groupId: string | undefined) => void
    isSearching?: boolean
}

export function CustomersFilters({ t, search, onSearchChange, groupId, onGroupChange, isSearching }: CustomersFiltersProps) {
    const { data: groupsData } = useCustomerGroupsListQuery({ limit: 100, page: 1 })
    const groups = groupsData?.groups ?? []

    return (
        <ListSearchToolbar>
            <ListFilterField label={t('customers.filters.search_label')} className="min-w-[min(100%,20rem)] flex-[2]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={t('customers.search_placeholder', 'Search customers...')}
                        className="h-9 pl-8 pr-8"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>
            </ListFilterField>
            <ListFilterField label={t('customers.filters.group', 'Customer group')} className="w-full sm:w-[12rem]">
                <Select
                    value={groupId ?? 'all'}
                    onValueChange={(v) => onGroupChange(v === 'all' ? undefined : v)}
                >
                    <SelectTrigger className="h-9">
                        <SelectValue placeholder={t('customers.filters.all_groups', 'All groups')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('customers.filters.all_groups', 'All groups')}</SelectItem>
                        {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                                {g.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </ListFilterField>
        </ListSearchToolbar>
    )
}
