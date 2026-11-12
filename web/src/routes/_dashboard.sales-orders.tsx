import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useMemo, useState } from 'react'
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
import { OrderDetailDialog } from '@/components/sales-orders/OrderDetailDialog'

const searchSchema = z.object({
    page: z.number().catch(1),
    limit: z.number().min(1).catch(15),
    status: z.enum(['paid', 'all', 'active', 'cancelled']).catch('paid'),
    user_id: z.string().optional(),
})

export const Route = createFileRoute('/_dashboard/sales-orders')({
    validateSearch: (search) => searchSchema.parse(search),
    component: SalesOrdersPage,
})

function SalesOrdersPage() {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const navigate = useNavigate({ from: Route.fullPath })
    const searchParams = Route.useSearch()

    const selectedTab = searchParams.status || 'paid'
    const page = searchParams.page
    const limit = searchParams.limit
    const selectedUserId = searchParams.user_id || 'all'

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
                        <Link to="/transactions" search={{ page: 1, limit: 10, status: 'active' }}>
                            {t('salesOrders.open_transactions')}
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Input
                            className="max-w-md"
                            placeholder={t('salesOrders.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Select
                            value={selectedUserId}
                            onValueChange={(v) =>
                                navigate({
                                    search: (prev) => ({
                                        ...prev,
                                        user_id: v === 'all' ? undefined : v,
                                        page: 1,
                                    }),
                                })
                            }
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

                    <Tabs
                        value={selectedTab}
                        onValueChange={(value) =>
                            navigate({
                                search: (prev) => ({
                                    ...prev,
                                    status: value as z.infer<typeof searchSchema>['status'],
                                    page: 1,
                                }),
                            })
                        }
                    >
                        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/30 p-1">
                            <TabsTrigger value="paid">{t('salesOrders.tabs.sold')}</TabsTrigger>
                            <TabsTrigger value="all">{t('salesOrders.tabs.all')}</TabsTrigger>
                            <TabsTrigger value="active">{t('transactions.tabs.active')}</TabsTrigger>
                            <TabsTrigger value="cancelled">{t('transactions.tabs.cancelled')}</TabsTrigger>
                        </TabsList>
                    </Tabs>

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

                    <ListPagination
                        pagination={pagination}
                        onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
                        onLimitChange={(l) => navigate({ search: (prev) => ({ ...prev, limit: l, page: 1 }) })}
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
