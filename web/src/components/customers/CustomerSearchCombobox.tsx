import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useCustomersListQuery } from '@/lib/api/query/customers'
import { useDebounce } from '@/hooks/use-debounce'

type CustomerSearchComboboxProps = {
    value: string
    onValueChange: (customerId: string, customerName: string) => void
    disabled?: boolean
    placeholder?: string
    className?: string
}

export function CustomerSearchCombobox({
    value,
    onValueChange,
    disabled,
    placeholder,
    className,
}: CustomerSearchComboboxProps) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [displayName, setDisplayName] = useState('')
    const debouncedSearch = useDebounce(search, 350)

    const { data, isFetching, isAllowed } = useCustomersListQuery({
        page: 1,
        limit: 40,
        search: debouncedSearch.trim() || undefined,
    })

    const customers = data?.customers ?? []

    useEffect(() => {
        if (!value) {
            setDisplayName('')
        }
    }, [value])

    useEffect(() => {
        if (!value || displayName) return
        const match = customers.find((c) => c.id === value)
        if (match?.name) setDisplayName(match.name)
    }, [value, displayName, customers])

    const label = displayName || placeholder || t('customers.search_placeholder')

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled || !isAllowed}
                    className={cn('w-full justify-between font-normal', className)}
                >
                    <span className={cn('truncate', !displayName && 'text-muted-foreground')}>{label}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={t('customers.search_placeholder')}
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {isFetching ? (
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('common.loading', 'Loading…')}
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>{t('customers.table.empty')}</CommandEmpty>
                                <CommandGroup>
                                    {customers.map((c) => {
                                        const id = c.id!
                                        return (
                                            <CommandItem
                                                key={id}
                                                value={id}
                                                onSelect={() => {
                                                    onValueChange(id, c.name || id)
                                                    setDisplayName(c.name || '')
                                                    setOpen(false)
                                                    setSearch('')
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        value === id ? 'opacity-100' : 'opacity-0',
                                                    )}
                                                />
                                                <span className="truncate">{c.name}</span>
                                                {c.phone ? (
                                                    <span className="ml-auto text-xs text-muted-foreground">
                                                        {c.phone}
                                                    </span>
                                                ) : null}
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
