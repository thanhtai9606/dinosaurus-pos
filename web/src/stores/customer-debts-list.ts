import type { DebtStatus } from '@/lib/api/query/customerDebts'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { primeListFilters, useListStore } from '@/stores/create-list-store'

export type CustomerDebtsListFilters = {
    customerId?: string
    status?: DebtStatus
}

const storeConfig = {
    limit: 15,
    defaultFilters: {
        customerId: undefined,
        status: undefined,
    } satisfies CustomerDebtsListFilters,
}

export function useCustomerDebtsListStore() {
    return useListStore(LIST_SCOPES.customerDebts, storeConfig)
}

export function primeCustomerDebtsFilter(customerId: string) {
    primeListFilters(LIST_SCOPES.customerDebts, storeConfig, { customerId })
}
