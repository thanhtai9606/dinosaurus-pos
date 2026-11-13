import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export function CustomerGroupsFilters({
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
        <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                className="pl-9"
                placeholder={t('customerGroups.search_placeholder')}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
            />
            {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
        </div>
    )
}
