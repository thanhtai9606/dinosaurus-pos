import { CartItem } from '@/components/orders/CartContent'
import { RetailSettlementMode } from '@/components/retail-pos/RetailCheckoutPanel'

export type RetailSaleTab = {
    id: string
    cart: CartItem[]
    selectedCustomerId: string | null
    discountMode: 'amount' | 'percent'
    discountInput: string
    cashReceived: number
    settlementMode: RetailSettlementMode
    search: string
}

export function createRetailSaleTab(): RetailSaleTab {
    return {
        id: crypto.randomUUID(),
        cart: [],
        selectedCustomerId: null,
        discountMode: 'amount',
        discountInput: '',
        cashReceived: 0,
        settlementMode: 'cash',
        search: '',
    }
}

export function patchTab(tabs: RetailSaleTab[], tabId: string, patch: Partial<RetailSaleTab>): RetailSaleTab[] {
    return tabs.map((tab) => (tab.id === tabId ? { ...tab, ...patch } : tab))
}

export function updateTabCart(tabId: string, tabs: RetailSaleTab[], updater: (cart: CartItem[]) => CartItem[]): RetailSaleTab[] {
    return tabs.map((tab) => (tab.id === tabId ? { ...tab, cart: updater(tab.cart) } : tab))
}
