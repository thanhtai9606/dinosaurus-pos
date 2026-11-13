import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { useStore } from 'zustand'

export type ListStoreConfig<F extends Record<string, unknown>> = {
    limit?: number
    defaultFilters: F
}

export type ListStoreState<F extends Record<string, unknown>> = {
    page: number
    limit: number
    filters: F
    setPage: (page: number) => void
    setLimit: (limit: number) => void
    resetPage: () => void
    setFilter: <K extends keyof F>(key: K, value: F[K], opts?: { resetPage?: boolean }) => void
    setFilters: (patch: Partial<F>, opts?: { resetPage?: boolean }) => void
    resetFilters: () => void
}

const storeCache = new Map<string, UseBoundStore<StoreApi<ListStoreState<Record<string, unknown>>>>>()

export function getOrCreateListStore<F extends Record<string, unknown>>(
    scope: string,
    config: ListStoreConfig<F>,
): UseBoundStore<StoreApi<ListStoreState<F>>> {
    const cached = storeCache.get(scope)
    if (cached) {
        return cached as UseBoundStore<StoreApi<ListStoreState<F>>>
    }

    const defaultLimit = config.limit ?? 10
    const defaultFilters = config.defaultFilters

    const store = create<ListStoreState<F>>((set, get) => ({
        page: 1,
        limit: defaultLimit,
        filters: defaultFilters,
        setPage: (page) => set({ page }),
        setLimit: (limit) => set({ limit, page: 1 }),
        resetPage: () => set({ page: 1 }),
        setFilter: (key, value, opts) => {
            const resetPage = opts?.resetPage !== false
            set((state) => ({
                filters: { ...state.filters, [key]: value },
                ...(resetPage ? { page: 1 } : {}),
            }))
        },
        setFilters: (patch, opts) => {
            const resetPage = opts?.resetPage !== false
            set((state) => ({
                filters: { ...state.filters, ...patch },
                ...(resetPage ? { page: 1 } : {}),
            }))
        },
        resetFilters: () => set({ filters: defaultFilters, page: 1 }),
    }))

    storeCache.set(scope, store as UseBoundStore<StoreApi<ListStoreState<Record<string, unknown>>>>)
    return store
}

export function useListStore<F extends Record<string, unknown>>(scope: string, config: ListStoreConfig<F>) {
    const store = getOrCreateListStore(scope, config)

    const page = useStore(store, (s) => s.page)
    const limit = useStore(store, (s) => s.limit)
    const filters = useStore(store, (s) => s.filters)
    const setPage = useStore(store, (s) => s.setPage)
    const setLimit = useStore(store, (s) => s.setLimit)
    const resetPage = useStore(store, (s) => s.resetPage)
    const setFilter = useStore(store, (s) => s.setFilter)
    const setFilters = useStore(store, (s) => s.setFilters)
    const resetFilters = useStore(store, (s) => s.resetFilters)

    return {
        page,
        limit,
        filters,
        setPage,
        setLimit,
        resetPage,
        setFilter,
        setFilters,
        resetFilters,
        onPageChange: setPage,
        onLimitChange: setLimit,
    }
}

export function primeListFilters<F extends Record<string, unknown>>(
    scope: string,
    config: ListStoreConfig<F>,
    patch: Partial<F>,
) {
    getOrCreateListStore(scope, config).getState().setFilters(patch)
}
