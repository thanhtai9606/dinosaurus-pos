import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCustomerGroupsListQuery } from '@/lib/api/query/customerGroups'

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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="relative w-full md:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={t('customers.search_placeholder', 'Search customers...')}
                        className="pl-8"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>
                <Select
                    value={groupId ?? 'all'}
                    onValueChange={(v) => onGroupChange(v === 'all' ? undefined : v)}
                >
                    <SelectTrigger className="w-full md:w-[220px]">
                        <SelectValue placeholder={t('customers.filters.group', 'Customer group')} />
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
            </div>
        </div>
    )
}
