import { Filter, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UsersGetRoleEnum } from '@/lib/api/generated'
import { ListFilterField, ListSearchToolbar } from '@/components/data-table/ListSearchToolbar'

interface UsersFiltersProps {
    t: any
    search: string
    onSearchChange: (term: string) => void
    role: string | undefined
    onRoleChange: (role: string) => void
    activeFilter: 'all' | 'active' | 'inactive'
    onActiveFilterChange: (value: 'all' | 'active' | 'inactive') => void
    isSearching?: boolean
}

export function UsersFilters({
    t,
    search,
    onSearchChange,
    role,
    onRoleChange,
    activeFilter,
    onActiveFilterChange,
    isSearching,
}: UsersFiltersProps) {
    return (
        <ListSearchToolbar>
            <ListFilterField label={t('users.filters.search_label')} className="min-w-[min(100%,20rem)] flex-[2]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={t('users.search_placeholder')}
                        className="h-9 pl-8 pr-8"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>
            </ListFilterField>
            <ListFilterField label={t('users.role_filter')} className="w-full sm:w-[10rem]">
                <Select value={role || 'all'} onValueChange={onRoleChange}>
                    <SelectTrigger className="h-9">
                        <Filter className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <SelectValue placeholder={t('users.role_all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('users.role_all')}</SelectItem>
                        <SelectItem value={UsersGetRoleEnum.Admin}>{t('users.roles.admin')}</SelectItem>
                        <SelectItem value={UsersGetRoleEnum.Manager}>{t('users.roles.manager')}</SelectItem>
                        <SelectItem value={UsersGetRoleEnum.Cashier}>{t('users.roles.cashier')}</SelectItem>
                    </SelectContent>
                </Select>
            </ListFilterField>
            <ListFilterField label={t('users.status_filter')} className="w-full sm:w-[10rem]">
                <Select value={activeFilter} onValueChange={(v) => onActiveFilterChange(v as 'all' | 'active' | 'inactive')}>
                    <SelectTrigger className="h-9">
                        <Filter className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <SelectValue placeholder={t('users.status_all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('users.status_all')}</SelectItem>
                        <SelectItem value="active">{t('users.status.active')}</SelectItem>
                        <SelectItem value="inactive">{t('users.status.inactive')}</SelectItem>
                    </SelectContent>
                </Select>
            </ListFilterField>
        </ListSearchToolbar>
    )
}
