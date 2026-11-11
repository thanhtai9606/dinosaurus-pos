import { useMemo, useState } from 'react'
import type { SortDirection } from '@/components/data-table/TableColumnHeader'

type SortState<K extends string> = { key: K; direction: 'asc' | 'desc' } | null

export function useClientSort<T, K extends string>(
    items: T[],
    getters: Record<K, (item: T) => string | number>
) {
    const [sort, setSort] = useState<SortState<K>>(null)

    const sorted = useMemo(() => {
        if (!sort) return items
        const getValue = getters[sort.key]
        const copy = [...items]
        copy.sort((a, b) => {
            const av = getValue(a)
            const bv = getValue(b)
            if (typeof av === 'number' && typeof bv === 'number') {
                return sort.direction === 'asc' ? av - bv : bv - av
            }
            return sort.direction === 'asc'
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av))
        })
        return copy
    }, [items, sort, getters])

    const toggleSort = (key: K) => {
        setSort((prev) => {
            if (prev?.key !== key) return { key, direction: 'asc' }
            if (prev.direction === 'asc') return { key, direction: 'desc' }
            return null
        })
    }

    const getSortDirection = (key: K): SortDirection => {
        if (sort?.key !== key) return false
        return sort.direction
    }

    return { sorted, toggleSort, getSortDirection }
}
