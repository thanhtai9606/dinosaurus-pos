import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, useEffect } from 'react'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { useDebounce } from '@/hooks/use-debounce'
import { useTranslation } from 'react-i18next'
import { ordersListQueryOptions } from '@/lib/api/query/orders'
import { usersListQueryOptions } from '@/lib/api/query/user'
import { ListPagination } from '@/components/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SalesOrdersTable } from '@/components/sales-orders/SalesOrdersTable'
import { SalesOrdersCardGrid } from '@/components/sales-orders/SalesOrdersCardGrid'
import { SalesOrdersListViewToggle } from '@/components/sales-orders/SalesOrdersViewToggle'
import { OrderDetailDialog } from '@/components/sales-orders/OrderDetailDialog'
import {
    getSalesOrdersListView,
    setSalesOrdersListView,
    type SalesOrdersListView,
} from '@/lib/ui/viewPreferences'

export const Route = createFileRoute('/_dashboard/sales-orders')({
    component: SalesOrdersPage,
})

function SalesOrdersPage() {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({
        scope: LIST_SCOPES.salesOrders,
        limit: 15,
    })
    const [selectedTab, setSelectedTab] = useState<'paid' | 'all' | 'active' | 'cancelled'>('paid')
    const [selectedUserId, setSelectedUserId] = useState('all')

    useEffect(() => {
        resetPage()
    }, [selectedTab, selectedUserId, resetPage])

    const { data: usersData } = useQuery(usersListQueryOptions({ page: 1, limit: 100 }))
    const users = usersData?.users || []

    const userMap = useMemo(() => {
        const map = new Map<string, string>()
        users.forEach((u) => {
            if (u.id) map.set(u.id, u.username || 'Unknown')
        })
        return map
    }, [users])

    const statusesFilter = useMemo(() => {
        if (selectedTab === 'paid') return ['paid']
        if (selectedTab === 'active') return ['open', 'in_progress', 'served']
        if (selectedTab === 'cancelled') return ['cancelled']
        return undefined
    }, [selectedTab])

    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearch = useDebounce(searchTerm, 400)
    const [listView, setListView] = useState<SalesOrdersListView>(() => getSalesOrdersListView())

    const handleListViewChange = (view: SalesOrdersListView) => {
        setListView(view)
        setSalesOrdersListView(view)
    }

    const { data, isLoading, isFetching } = useQuery(
        ordersListQueryOptions({
            page,
            limit,
            statuses: statusesFilter,
            userId: selectedUserId === 'all' ? undefined : selectedUserId,
            search: debouncedSearch.trim() || undefined,
        }),
    )

    const orders = data?.orders || []
    const pagination = data?.pagination || {
        total_pages: 1,
        current_page: 1,
        per_page: limit,
        total_data: 0,
    }

    const displayedOrders = orders

    const [detailId, setDetailId] = useState<string | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)

    return (
        <div className="flex flex-col gap-6 p-4">
            <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle>{t('sidebar.sales_orders')}</CardTitle>
                        <CardDescription>{t('salesOrders.subtitle')}</CardDescription>
                    </div>
                    <Button variant="outline" asChild className="shrink-0">
                        <Link to="/transactions">
                            {t('salesOrders.open_transactions')}
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Input
                            className="max-w-md"
                            placeholder={t('salesOrders.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Select
                            value={selectedUserId}
                            onValueChange={(v) => setSelectedUserId(v)}
                        >
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder={t('transactions.filter_user')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('transactions.filter_user')}</SelectItem>
                                {users.map((u) => (
                                    <SelectItem key={u.id} value={u.id!}>
                                        {u.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        </div>
                        <SalesOrdersListViewToggle
                            value={listView}
                            onChange={handleListViewChange}
                            t={t}
                        />
                    </div>

                    <Tabs
                        value={selectedTab}
                        onValueChange={(value) => setSelectedTab(value as typeof selectedTab)}
                    >
                        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/30 p-1">
                            <TabsTrigger value="paid">{t('salesOrders.tabs.sold')}</TabsTrigger>
                            <TabsTrigger value="all">{t('salesOrders.tabs.all')}</TabsTrigger>
                            <TabsTrigger value="active">{t('transactions.tabs.active')}</TabsTrigger>
                            <TabsTrigger value="cancelled">{t('transactions.tabs.cancelled')}</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {listView === 'cards' ? (
                        <SalesOrdersCardGrid
                            orders={displayedOrders}
                            isLoading={isLoading}
                            userMap={userMap}
                            t={t}
                            onOrderClick={(order) => {
                                if (order.id) {
                                    setDetailId(order.id)
                                    setDetailOpen(true)
                                }
                            }}
                        />
                    ) : (
                        <SalesOrdersTable
                            orders={displayedOrders}
                            isLoading={isLoading}
                            userMap={userMap}
                            t={t}
                            onRowClick={(order) => {
                                if (order.id) {
                                    setDetailId(order.id)
                                    setDetailOpen(true)
                                }
                            }}
                        />
                    )}

                    <ListPagination
                        pagination={pagination}
                        onPageChange={onPageChange}
                        onLimitChange={onLimitChange}
                        isFetching={isFetching && !isLoading}
                    />
                </CardContent>
            </Card>

            <OrderDetailDialog
                orderId={detailId}
                open={detailOpen}
                onOpenChange={(open) => {
                    setDetailOpen(open)
                    if (!open) setDetailId(null)
                }}
                onChanged={() => {
                    void queryClient.invalidateQueries({ queryKey: ['orders', 'list'] })
                }}
            />
        </div>
    )
}
