const LIST_KEY = 'dinosaur-pos.salesOrders.listView'
const DETAIL_KEY = 'dinosaur-pos.salesOrders.detailView'

export type SalesOrdersListView = 'table' | 'cards'
export type SalesOrdersDetailView = 'classic' | 'receipt'

export function getSalesOrdersListView(): SalesOrdersListView {
    if (typeof window === 'undefined') return 'table'
    const v = localStorage.getItem(LIST_KEY)
    return v === 'cards' ? 'cards' : 'table'
}

export function setSalesOrdersListView(view: SalesOrdersListView) {
    localStorage.setItem(LIST_KEY, view)
}

export function getSalesOrdersDetailView(): SalesOrdersDetailView {
    if (typeof window === 'undefined') return 'classic'
    const v = localStorage.getItem(DETAIL_KEY)
    return v === 'receipt' ? 'receipt' : 'classic'
}

export function setSalesOrdersDetailView(view: SalesOrdersDetailView) {
    localStorage.setItem(DETAIL_KEY, view)
}
