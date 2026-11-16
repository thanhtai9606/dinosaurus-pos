import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ListFilterField, ListSearchToolbar } from '@/components/data-table/ListSearchToolbar'

export function SuppliersFilters({
    t,
    search,
    onSearchChange,
    isSearching,
}: {
    t: (key: string, fallback?: string) => string
    search: string
    onSearchChange: (value: string) => void
    isSearching?: boolean
}) {
    return (
        <ListSearchToolbar>
            <ListFilterField label={t('suppliers.filters.search_label', 'Search')} className="min-w-[min(100%,20rem)] flex-[2]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        className="h-9 pl-8 pr-8"
                        placeholder={t('suppliers.search_placeholder')}
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>
            </ListFilterField>
        </ListSearchToolbar>
    )
}