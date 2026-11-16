import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useStockTransfersQuery, useCompleteTransferMutation } from '@/lib/api/query/stockOps'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

export const Route = createFileRoute('/_dashboard/stock-transfers')({
    component: StockTransfersPage,
})

function StockTransfersPage() {
    const { t } = useTranslation()
    const { data, refetch } = useStockTransfersQuery({ page: 1, limit: 50 })
    const complete = useCompleteTransferMutation()
    const rows = (data?.transfers ?? []) as Array<{
        id: string
        doc_no: string
        from_warehouse_name: string
        to_warehouse_name: string
        status: string
    }>

    return (
        <div className="space-y-4 p-4">
            <h1 className="text-2xl font-bold tracking-tight">{t('stockTransfers.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('stockTransfers.hint')}</p>
            <Card>
                <CardContent className="pt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('stockTransfers.doc_no')}</TableHead>
                                <TableHead>{t('stockTransfers.from')}</TableHead>
                                <TableHead>{t('stockTransfers.to')}</TableHead>
                                <TableHead>{t('stockTransfers.status')}</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-mono text-sm">{r.doc_no}</TableCell>
                                    <TableCell>{r.from_warehouse_name}</TableCell>
                                    <TableCell>{r.to_warehouse_name}</TableCell>
                                    <TableCell>{r.status}</TableCell>
                                    <TableCell className="text-right">
                                        {r.status === 'draft' ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={async () => {
                                                    try {
                                                        await complete.mutateAsync(r.id)
                                                        toast.success(t('stockTransfers.completed'))
                                                        refetch()
                                                    } catch {
                                                        toast.error(t('stockTransfers.complete_failed'))
                                                    }
                                                }}
                                            >
                                                {t('stockTransfers.complete')}
                                            </Button>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}