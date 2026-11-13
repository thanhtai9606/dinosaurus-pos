import { LIST_SCOPES } from '@/stores/list-scopes'
import { useListStore } from '@/stores/create-list-store'

export type CustomersListFilters = {
    searchTerm: string
    groupId?: string
}

const storeConfig = {
    limit: 10,
    defaultFilters: {
        searchTerm: '',
        groupId: undefined,
    } satisfies CustomersListFilters,
}

export function useCustomersListStore() {
    return useListStore(LIST_SCOPES.customers, storeConfig)
}
