import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { stockMovementsQueryOptions } from '@/lib/api/query/stockOps'
import { useWarehousesListQuery } from '@/lib/api/query/warehouses'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ListFilterField, ListSearchToolbar } from '@/components/data-table'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { useState } from 'react'
import { ListPagination } from '@/components/pagination'

export const Route = createFileRoute('/_dashboard/stock-movements')({
    component: StockMovementsPage,
})

function StockMovementsPage() {
    const { t } = useTranslation()
    const { page, limit, onPageChange, onLimitChange } = useServerListState({ scope: LIST_SCOPES.stockMovements })
    const [warehouseId, setWarehouseId] = useState<string>('all')
    const { data: whList } = useWarehousesListQuery({ limit: 100, page: 1 })
    const params = useMemo(
        () => ({
            page,
            limit,
            warehouse_id: warehouseId === 'all' ? undefined : warehouseId,
        }),
        [page, limit, warehouseId],
    )
    const { data, isFetching } = useQuery(stockMovementsQueryOptions(params))
    const rows = data?.movements ?? []

    return (
        <div className="space-y-4 p-4">
            <h1 className="text-2xl font-bold tracking-tight">{t('stockMovements.title')}</h1>
            <ListSearchToolbar>
                <ListFilterField label={t('stockMovements.warehouse')} className="min-w-[12rem]">
                    <Select value={warehouseId} onValueChange={setWarehouseId}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('stockMovements.all_warehouses')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('stockMovements.all_warehouses')}</SelectItem>
                            {(whList?.warehouses ?? []).map((w) => (
                                <SelectItem key={w.id} value={w.id}>
                                    {w.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </ListFilterField>
            </ListSearchToolbar>
            <Card>
                <CardContent className="pt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('stockMovements.date')}</TableHead>
                                <TableHead>{t('stockMovements.product')}</TableHead>
                                <TableHead>{t('stockMovements.warehouse')}</TableHead>
                                <TableHead>{t('stockMovements.type')}</TableHead>
                                <TableHead className="text-right">{t('stockMovements.delta')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(r.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{r.product_name}</TableCell>
                                    <TableCell>{r.warehouse_name ?? '—'}</TableCell>
                                    <TableCell>{r.change_type}</TableCell>
                                    <TableCell className="text-right tabular-nums">{r.change_amount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {data?.pagination ? (
                        <ListPagination
                            pagination={data.pagination}
                            onPageChange={onPageChange}
                            onLimitChange={onLimitChange}
                            isFetching={isFetching}
                        />
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}