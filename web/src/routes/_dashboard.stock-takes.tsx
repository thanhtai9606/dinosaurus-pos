import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useStockTakesQuery, usePostStockTakeMutation } from '@/lib/api/query/stockOps'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

export const Route = createFileRoute('/_dashboard/stock-takes')({
    component: StockTakesPage,
})

function StockTakesPage() {
    const { t } = useTranslation()
    const { data, refetch } = useStockTakesQuery({ page: 1, limit: 50 })
    const post = usePostStockTakeMutation()
    const rows = (data?.stock_takes ?? []) as Array<{
        id: string
        doc_no: string
        warehouse_name: string
        status: string
    }>

    return (
        <div className="space-y-4 p-4">
            <h1 className="text-2xl font-bold tracking-tight">{t('stockTakes.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('stockTakes.hint')}</p>
            <Card>
                <CardContent className="pt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('stockTakes.doc_no')}</TableHead>
                                <TableHead>{t('stockTakes.warehouse')}</TableHead>
                                <TableHead>{t('stockTakes.status')}</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-mono text-sm">{r.doc_no}</TableCell>
                                    <TableCell>{r.warehouse_name}</TableCell>
                                    <TableCell>{r.status}</TableCell>
                                    <TableCell className="text-right">
                                        {r.status === 'counting' || r.status === 'draft' ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={async () => {
                                                    try {
                                                        await post.mutateAsync(r.id)
                                                        toast.success(t('stockTakes.posted'))
                                                        refetch()
                                                    } catch {
                                                        toast.error(t('stockTakes.post_failed'))
                                                    }
                                                }}
                                            >
                                                {t('stockTakes.post')}
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