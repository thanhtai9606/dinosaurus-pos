import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { OrderCategory } from './CategorySidebar'

interface ProductSearchProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    inputRef?: React.RefObject<HTMLInputElement | null>
    t: (key: string, options?: Record<string, unknown>) => string
    itemsAvailable?: number
    categoryLabel?: string
    selectedCategory?: string
    onCategoryChange?: (category: string) => void
    categories?: OrderCategory[]
    isSearching?: boolean
}

export function ProductSearch({
    searchTerm,
    onSearchChange,
    inputRef,
    t,
    itemsAvailable,
    categoryLabel,
    selectedCategory,
    onCategoryChange,
    categories = [],
    isSearching = false,
}: ProductSearchProps) {
    return (
        <div className="flex flex-col gap-2 border-b bg-card px-4 py-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
                {categoryLabel && (
                    <h2 className="truncate text-lg font-semibold">{categoryLabel}</h2>
                )}
                {itemsAvailable !== undefined && (
                    <p className="text-xs text-muted-foreground">
                        {t('order.items_available', { count: String(itemsAvailable) })}
                    </p>
                )}
            </div>
            <div className="relative mt-2 w-full sm:mt-0 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    type="search"
                    placeholder={t('order.search_placeholder')}
                    className="h-10 pl-9 pr-9"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
            </div>
            </div>
            {onCategoryChange && selectedCategory && (
                <Tabs value={selectedCategory} onValueChange={onCategoryChange} className="w-full lg:hidden">
                    <TabsList className="no-scrollbar h-auto w-full justify-start overflow-x-auto p-1">
                        <TabsTrigger value="all" className="rounded-full px-3 text-xs">
                            {t('order.all_categories')}
                        </TabsTrigger>
                        {categories.map((cat) => (
                            <TabsTrigger key={cat.id} value={cat.id} className="rounded-full px-3 text-xs">
                                {cat.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            )}
        </div>
    )
}
