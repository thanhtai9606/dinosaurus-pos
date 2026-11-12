import { useEffect, useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { useFormatMoney } from '@/context/MoneyContext'
import { axiosInstance } from '@/lib/api/client'
import { Product } from '@/lib/api/query/products'
import { cn } from '@/lib/utils'

type Props = {
    value: string
    onChange: (v: string) => void
    inputRef?: React.RefObject<HTMLInputElement | null>
    onSubmit: (raw: string) => void
    onPickProduct: (product: Product) => void
    t: (key: string, fallback?: string) => string
    busy?: boolean
    wrapperClassName?: string
    placeholder?: string
}

async function searchProducts(q: string, limit = 10): Promise<Product[]> {
    const res = await axiosInstance.get('/products/search', { params: { q, limit } })
    return ((res.data as { data?: { products?: Product[] } }).data?.products ?? []) as Product[]
}

export function RetailProductSearchField({
    value,
    onChange,
    inputRef,
    onSubmit,
    onPickProduct,
    t,
    busy,
    wrapperClassName,
    placeholder,
}: Props) {
    const listId = useId()
    const debounced = useDebounce(value.trim(), 280)
    const formatMoney = useFormatMoney()
    const [open, setOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)

    const minChars = 2
    const canSuggest = debounced.length >= minChars

    const { data: suggestions = [], isFetching } = useQuery({
        queryKey: ['products', 'search', 'suggest', debounced],
        queryFn: () => searchProducts(debounced, 12),
        enabled: canSuggest && open,
        staleTime: 30_000,
    })

    useEffect(() => {
        setActiveIndex(0)
    }, [suggestions, debounced])

    const showPanel = open && value.trim().length >= minChars

    const pick = (p: Product) => {
        onChange('')
        onPickProduct(p)
        setOpen(false)
    }

    return (
        <div
            className={cn(
                'relative w-[min(100%,280px)] shrink-0 basis-[24%] max-w-[320px]',
                wrapperClassName,
            )}
        >
            {busy && (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
            <Input
                ref={inputRef}
                autoFocus
                autoComplete="off"
                disabled={busy}
                role="combobox"
                aria-expanded={showPanel}
                aria-controls={listId}
                aria-autocomplete="list"
                placeholder={placeholder ?? t('retailPos.search_placeholder')}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value)
                    setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                    window.setTimeout(() => setOpen(false), 150)
                }}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && showPanel && suggestions.length) {
                        e.preventDefault()
                        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
                        return
                    }
                    if (e.key === 'ArrowUp' && showPanel && suggestions.length) {
                        e.preventDefault()
                        setActiveIndex((i) => Math.max(i - 1, 0))
                        return
                    }
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        if (showPanel && suggestions[activeIndex]) {
                            pick(suggestions[activeIndex])
                        } else {
                            onSubmit(value)
                        }
                        return
                    }
                    if (e.key === 'Escape') {
                        setOpen(false)
                    }
                }}
                className={cn('h-10 text-sm', busy && 'pr-10')}
            />
            {showPanel && (
                <div
                    id={listId}
                    role="listbox"
                    className="absolute left-0 z-50 max-h-72 w-max min-w-full max-w-md overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md top-[calc(100%+4px)]"
                >
                    {isFetching && (
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('retailPos.suggestions.loading')}
                        </div>
                    )}
                    {!isFetching && suggestions.length === 0 && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">{t('retailPos.suggestions.empty')}</p>
                    )}
                    {suggestions.map((p, index) => {
                        const code = p.barcode || p.sku || '—'
                        const meta = [p.sku && p.barcode ? `SKU ${p.sku}` : null, p.unit ? p.unit : null]
                            .filter(Boolean)
                            .join(' · ')
                        return (
                            <button
                                key={p.id}
                                type="button"
                                role="option"
                                aria-selected={index === activeIndex}
                                className={cn(
                                    'flex w-full flex-col gap-0.5 border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-accent',
                                    index === activeIndex && 'bg-accent',
                                )}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pick(p)}
                            >
                                <span className="font-medium leading-tight">{p.name}</span>
                                <span className="text-xs text-muted-foreground font-mono">
                                    {t('retailPos.suggestions.barcode')}: {code}
                                    {meta ? ` · ${meta}` : ''}
                                </span>
                                <span className="text-xs">
                                    {formatMoney(p.price || 0)}
                                    <span className="text-muted-foreground">
                                        {' '}
                                        · {t('retailPos.suggestions.stock')} {p.stock ?? 0}
                                    </span>
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
