import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface CustomersFiltersProps {
    t: any
    search: string
    onSearchChange: (term: string) => void
    isSearching?: boolean
}

export function CustomersFilters({ t, search, onSearchChange, isSearching }: CustomersFiltersProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
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
            </div>
        </div>
    )
}
