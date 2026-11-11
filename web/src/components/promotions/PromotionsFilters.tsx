import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface PromotionsFiltersProps {
    t: (key: string) => string
    search: string
    onSearchChange: (value: string) => void
    isSearching?: boolean
}

export function PromotionsFilters({ t, search, onSearchChange, isSearching }: PromotionsFiltersProps) {
    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder={t('promotions.search_placeholder')}
                className="pl-8 pr-8"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
            />
            {isSearching && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
        </div>
    )
}
