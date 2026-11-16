import { Filter, Loader2, Search, LayoutGrid, LayoutList } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ListFilterField, ListSearchToolbar } from '@/components/data-table/ListSearchToolbar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ProductFiltersProps {
    trashCount: number
    viewMode: 'list' | 'grid'
    onViewModeChange: (mode: 'list' | 'grid') => void
    searchTerm: string
    onSearchChange: (term: string) => void
    category: number | undefined
    categories: any[]
    onCategoryChange: (value: string) => void
    t: any
    canReadTrash?: boolean
    isSearching?: boolean
}

export function ProductFilters({
    trashCount, viewMode, onViewModeChange,
    searchTerm, onSearchChange, category, categories, onCategoryChange, t, canReadTrash = true, isSearching
}: ProductFiltersProps) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <TabsList>
                    <TabsTrigger value="active">{t('products.tabs.active')}</TabsTrigger>
                    {canReadTrash && (
                        <TabsTrigger value="trash">{t('products.tabs.trash', { count: trashCount })}</TabsTrigger>
                    )}
                </TabsList>

                <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as 'list' | 'grid')} className="w-[80px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="list" className='px-2' title={t('products.tabs.list')}><LayoutList className="h-4 w-4" /></TabsTrigger>
                        <TabsTrigger value="grid" className='px-2' title={t('products.tabs.grid')}><LayoutGrid className="h-4 w-4" /></TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <ListSearchToolbar className="mb-4">
                <ListFilterField label={t('products.filters.search_label')} className="min-w-[min(100%,20rem)] flex-[2]">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={t('products.filters.search_placeholder')}
                            className="h-9 pl-8 pr-8"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                    </div>
                </ListFilterField>
                <ListFilterField label={t('products.filters.category')} className="w-full sm:w-[12rem]">
                    <Select
                        value={category ? String(category) : 'all'}
                        onValueChange={onCategoryChange}
                    >
                        <SelectTrigger className="h-9">
                            <Filter className="mr-2 h-4 w-4 shrink-0 opacity-60" />
                            <SelectValue placeholder={t('products.filters.category_all')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('products.filters.category_all')}</SelectItem>
                            {categories.map((cat: any) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </ListFilterField>
            </ListSearchToolbar>
        </div>
    )
}
