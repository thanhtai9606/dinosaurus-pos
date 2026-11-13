import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { useTranslation } from 'react-i18next'
import {
    supplierDebtsListQueryOptions,
    SupplierDebtsListParams,
    useSupplierDebtDetailQuery,
    useCreateSupplierDebtMutation,
    usePaySupplierDebtMutation,
    useVoidSupplierDebtMutation,
    type DebtStatus,
} from '@/lib/api/query/supplierDebts'
import { useSuppliersListQuery } from '@/lib/api/query/suppliers'
import { PartnerDebtDetailSheet } from '@/components/debts/PartnerDebtDetailSheet'
import { ListPagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { useFormatMoney } from '@/context/MoneyContext'

export const Route = createFileRoute('/_dashboard/supplier-debts')({
    component: SupplierDebtsPage,
})

function SupplierDebtsPage() {
    const { t } = useTranslation()
    const formatMoney = useFormatMoney()
    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({
        scope: LIST_SCOPES.supplierDebts,
        limit: 15,
    })
    const [supplierId, setSupplierId] = useState<string | undefined>()
    const [status, setStatus] = useState<DebtStatus | undefined>()

    useEffect(() => {
        resetPage()
    }, [supplierId, status, resetPage])

    const listParams = useMemo(
        (): SupplierDebtsListParams => ({
            page,
            limit,
            supplier_id: supplierId,
            status,
        }),
        [page, limit, supplierId, status],
    )

    const { data } = useQuery(supplierDebtsListQueryOptions(listParams))
    const { data: suppliersData } = useSuppliersListQuery({ limit: 200 })
    const createMutation = useCreateSupplierDebtMutation()
    const payMutation = usePaySupplierDebtMutation()
    const voidMutation = useVoidSupplierDebtMutation()

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [manualOpen, setManualOpen] = useState(false)
    const [manualSupplierId, setManualSupplierId] = useState('')
    const [manualTotal, setManualTotal] = useState('')
    const [manualNote, setManualNote] = useState('')

    const { data: detail, isFetching } = useSupplierDebtDetailQuery(selectedId || '')

    const statusFilter = status || 'all'

    return (
        <div className="space-y-4 p-4">
            <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                    <CardTitle>{t('supplierDebts.title')}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                        {createMutation.isAllowed && (
                            <Button onClick={() => setManualOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('supplierDebts.actions.add_manual')}
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link to="/suppliers">
                                {t('supplierDebts.actions.view_suppliers')}
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                        <Select
                            value={supplierId || 'all'}
                            onValueChange={(v) => setSupplierId(v === 'all' ? undefined : v)}
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder={t('supplierDebts.filters.supplier')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('supplierDebts.filters.all_suppliers')}</SelectItem>
                                {(suppliersData?.suppliers || []).map((s) => (
                                    <SelectItem key={s.id} value={s.id!}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => setStatus(v === 'all' ? undefined : (v as DebtStatus))}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={t('debts.filters.status')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('debts.filters.all_status')}</SelectItem>
                                <SelectItem value="open">{t('debts.status.open')}</SelectItem>
                                <SelectItem value="partial">{t('debts.status.partial')}</SelectItem>
                                <SelectItem value="settled">{t('debts.status.settled')}</SelectItem>
                                <SelectItem value="void">{t('debts.status.void')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('debts.fields.reference')}</TableHead>
                                <TableHead>{t('supplierDebts.fields.supplier')}</TableHead>
                                <TableHead>{t('debts.fields.status')}</TableHead>
                                <TableHead className="text-right">{t('debts.fields.total')}</TableHead>
                                <TableHead className="text-right">{t('debts.fields.balance')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(data?.debts || []).map((d) => (
                                <TableRow
                                    key={d.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelectedId(d.id)}
                                >
                                    <TableCell className="font-mono text-xs">{d.reference_no}</TableCell>
                                    <TableCell>{d.supplier_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{t(`debts.status.${d.status}`, d.status)}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatMoney(d.total_amount)}</TableCell>
                                    <TableCell className="text-right font-medium">{formatMoney(d.balance_due)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {data?.pagination && (
                        <ListPagination
                            pagination={data.pagination}
                            onPageChange={onPageChange}
                            onLimitChange={onLimitChange}
                        />
                    )}
                </CardContent>
            </Card>

            <PartnerDebtDetailSheet
                open={!!selectedId}
                onOpenChange={(open) => !open && setSelectedId(null)}
                partnerLabel={t('supplierDebts.fields.supplier')}
                partnerName={detail?.supplier_name}
                debt={detail}
                loading={isFetching && !detail}
                canPay={payMutation.isAllowed}
                canVoid={voidMutation.isAllowed}
                paying={payMutation.isPending}
                voiding={voidMutation.isPending}
                onPay={async (amount, note) => {
                    if (!selectedId) return
                    await payMutation.mutateAsync({ id: selectedId, body: { amount, note } })
                }}
                onVoid={async () => {
                    if (!selectedId) return
                    await voidMutation.mutateAsync(selectedId)
                    setSelectedId(null)
                }}
            />

            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                <DialogContent size="md" dismissible>
                    <DialogHeader>
                        <DialogTitle>{t('supplierDebts.actions.add_manual')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>{t('supplierDebts.fields.supplier')}</Label>
                            <Select value={manualSupplierId} onValueChange={setManualSupplierId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('stockReceipts.fields.supplier_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(suppliersData?.suppliers || []).map((s) => (
                                        <SelectItem key={s.id} value={s.id!}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>{t('debts.fields.total')}</Label>
                            <Input
                                type="number"
                                min={0}
                                value={manualTotal}
                                onChange={(e) => setManualTotal(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>{t('debts.fields.note')}</Label>
                            <Input value={manualNote} onChange={(e) => setManualNote(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            disabled={
                                createMutation.isPending ||
                                !manualSupplierId ||
                                !manualTotal ||
                                Number(manualTotal) <= 0
                            }
                            onClick={async () => {
                                await createMutation.mutateAsync({
                                    supplier_id: manualSupplierId,
                                    total_amount: Number(manualTotal),
                                    note: manualNote || undefined,
                                })
                                setManualOpen(false)
                                setManualSupplierId('')
                                setManualTotal('')
                                setManualNote('')
                            }}
                        >
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
