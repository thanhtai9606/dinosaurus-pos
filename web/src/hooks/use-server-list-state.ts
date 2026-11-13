import { useStore } from 'zustand'
import { getOrCreateListStore } from '@/stores/create-list-store'

/** Pagination per screen; backed by Zustand, not the URL. */
export function useServerListState(opts: { scope: string; limit?: number }) {
    const store = getOrCreateListStore(opts.scope, {
        limit: opts.limit ?? 10,
        defaultFilters: {},
    })

    const page = useStore(store, (s) => s.page)
    const limit = useStore(store, (s) => s.limit)
    const setPage = useStore(store, (s) => s.setPage)
    const setLimit = useStore(store, (s) => s.setLimit)
    const resetPage = useStore(store, (s) => s.resetPage)

    return {
        page,
        limit,
        setPage,
        setLimit,
        resetPage,
        onPageChange: setPage,
        onLimitChange: setLimit,
    }
}
