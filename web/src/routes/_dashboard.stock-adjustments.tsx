import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useStockAdjustmentsQuery, useCompleteAdjustmentMutation } from '@/lib/api/query/stockOps'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

export const Route = createFileRoute('/_dashboard/stock-adjustments')({
    component: StockAdjustmentsRouteShell,
})

function StockAdjustmentsRouteShell() {
    const pathname = useRouterState({ select: (s) => s.location.pathname })
    const normalized = pathname.replace(/\/$/, '') || '/'
    if (normalized.endsWith('/stock-adjustments/new')) {
        return <Outlet />
    }
    return <StockAdjustmentsPage />
}

function StockAdjustmentsPage() {
    const { t } = useTranslation()
    const { data, refetch } = useStockAdjustmentsQuery({ page: 1, limit: 50 })
    const complete = useCompleteAdjustmentMutation()
    const rows = (data?.adjustments ?? []) as Array<{
        id: string
        doc_no: string
        warehouse_name: string
        status: string
        reason: string
    }>

    return (
        <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{t('stockAdjustments.title')}</h1>
                <Button asChild>
                    <Link to="/stock-adjustments/new">{t('stockAdjustments.new')}</Link>
                </Button>
            </div>
            <Card>
                <CardContent className="pt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('stockAdjustments.doc_no')}</TableHead>
                                <TableHead>{t('stockAdjustments.warehouse')}</TableHead>
                                <TableHead>{t('stockAdjustments.reason')}</TableHead>
                                <TableHead>{t('stockAdjustments.status')}</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-mono text-sm">{r.doc_no}</TableCell>
                                    <TableCell>{r.warehouse_name}</TableCell>
                                    <TableCell>{r.reason}</TableCell>
                                    <TableCell>{r.status}</TableCell>
                                    <TableCell className="text-right">
                                        {r.status === 'draft' ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={complete.isPending}
                                                onClick={async () => {
                                                    try {
                                                        await complete.mutateAsync(r.id)
                                                        toast.success(t('stockAdjustments.completed'))
                                                        refetch()
                                                    } catch {
                                                        toast.error(t('stockAdjustments.complete_failed'))
                                                    }
                                                }}
                                            >
                                                {t('stockAdjustments.complete')}
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