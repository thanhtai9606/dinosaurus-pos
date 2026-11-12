import { createFileRoute, useNavigate, Link, useParams } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    stockReceiptsListQueryOptions,
    StockReceiptsListParams,
    useCompleteStockReceiptMutation,
    useCancelStockReceiptMutation,
    useCreateStockReceiptMutation,
} from '@/lib/api/query/stockReceipts'
import { StockReceiptEditorDialog } from '@/components/stock-receipts/StockReceiptEditorDialog'
import { ListPagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Check, X, Pencil } from 'lucide-react'
import { useFormatMoney } from '@/context/MoneyContext'

const searchSchema = z.object({
    page: z.number().catch(1),
    limit: z.number().catch(10),
    status: z.string().optional(),
})

export const Route = createFileRoute('/$locale/_dashboard/stock-receipts')({
    validateSearch: (search) => searchSchema.parse(search),
    loaderDeps: ({ search }) => search,
    loader: ({ context: { queryClient }, deps }) =>
        queryClient.ensureQueryData(stockReceiptsListQueryOptions(deps as StockReceiptsListParams)),
    component: StockReceiptsPage,
})

function StockReceiptsPage() {
    const { t } = useTranslation()
    const formatMoney = useFormatMoney()
    const navigate = useNavigate({ from: Route.fullPath })
    const { locale } = useParams({ from: '/$locale/_dashboard/stock-receipts' })
    const searchParams = Route.useSearch() as StockReceiptsListParams
    const { data } = useSuspenseQuery(stockReceiptsListQueryOptions(searchParams))
    const { isAllowed: canCreate } = useCreateStockReceiptMutation()
    const completeMutation = useCompleteStockReceiptMutation()
    const cancelMutation = useCancelStockReceiptMutation()

    const [editorOpen, setEditorOpen] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)

    return (
        <div className="space-y-4 p-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('stockReceipts.title')}</CardTitle>
                    {canCreate && (
                        <Button
                            onClick={() => {
                                setEditId(null)
                                setEditorOpen(true)
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t('stockReceipts.actions.add')}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('stockReceipts.fields.receipt_no')}</TableHead>
                                <TableHead>{t('stockReceipts.fields.supplier')}</TableHead>
                                <TableHead>{t('stockReceipts.fields.status')}</TableHead>
                                <TableHead className="text-right">{t('stockReceipts.fields.total')}</TableHead>
                                <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(data.receipts || []).map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.receipt_no}</TableCell>
                                    <TableCell>{r.supplier_name || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={r.status === 'completed' ? 'default' : 'secondary'}>
                                            {t(`stockReceipts.status.${r.status}`, r.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatMoney(r.total_amount)}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        {r.status === 'draft' && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditId(r.id)
                                                        setEditorOpen(true)
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                {completeMutation.isAllowed && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => completeMutation.mutate(r.id)}
                                                    >
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                {cancelMutation.isAllowed && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => cancelMutation.mutate(r.id)}
                                                    >
                                                        <X className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <ListPagination
                        pagination={data.pagination}
                        onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
                        onLimitChange={(limit) => navigate({ search: (prev) => ({ ...prev, limit, page: 1 }) })}
                    />
                    <Button variant="link" asChild className="px-0">
                        <Link to="/$locale/inventory" params={{ locale }} search={{}}>
                            {t('inventory.link_from_receipts')}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
            <StockReceiptEditorDialog open={editorOpen} onOpenChange={setEditorOpen} receiptId={editId} />
        </div>
    )
}
