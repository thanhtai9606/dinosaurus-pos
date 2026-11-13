import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    customerDebtsListQueryOptions,
    CustomerDebtsListParams,
    useCustomerDebtDetailQuery,
    useCreateCustomerDebtMutation,
    usePayCustomerDebtMutation,
    useVoidCustomerDebtMutation,
    type DebtStatus,
} from '@/lib/api/query/customerDebts'
import { useCustomersListQuery } from '@/lib/api/query/customers'
import { CustomerSearchCombobox } from '@/components/customers/CustomerSearchCombobox'
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

const searchSchema = z.object({
    page: z.number().catch(1),
    limit: z.number().catch(15),
    customer_id: z.string().optional(),
    status: z.enum(['open', 'partial', 'settled', 'void']).optional(),
})

export const Route = createFileRoute('/_dashboard/customer-debts')({
    validateSearch: (search) => searchSchema.parse(search),
    loaderDeps: ({ search }) => search,
    loader: ({ context: { queryClient }, deps }) =>
        queryClient.ensureQueryData(customerDebtsListQueryOptions(deps as CustomerDebtsListParams)),
    component: CustomerDebtsPage,
})

function CustomerDebtsPage() {
    const { t } = useTranslation()
    const formatMoney = useFormatMoney()
    const navigate = useNavigate({ from: Route.fullPath })
    const searchParams = Route.useSearch() as CustomerDebtsListParams
    const { data } = useSuspenseQuery(customerDebtsListQueryOptions(searchParams))
    const { data: customersData } = useCustomersListQuery({ limit: 200 })
    const createMutation = useCreateCustomerDebtMutation()
    const payMutation = usePayCustomerDebtMutation()
    const voidMutation = useVoidCustomerDebtMutation()

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [manualOpen, setManualOpen] = useState(false)
    const [manualCustomerId, setManualCustomerId] = useState('')
    const [manualTotal, setManualTotal] = useState('')
    const [manualNote, setManualNote] = useState('')

    const { data: detail, isFetching } = useCustomerDebtDetailQuery(selectedId || '')

    const statusFilter = searchParams.status || 'all'

    const customers = customersData?.customers || []

    return (
        <div className="space-y-4 p-4">
            <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                    <CardTitle>{t('customerDebts.title')}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                        {createMutation.isAllowed && (
                            <Button onClick={() => setManualOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('customerDebts.actions.add_manual')}
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link to="/customers" search={{ page: 1, limit: 10 }}>
                                {t('customerDebts.actions.view_customers')}
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                        <Select
                            value={searchParams.customer_id || 'all'}
                            onValueChange={(v) =>
                                navigate({
                                    search: (prev) => ({
                                        ...prev,
                                        customer_id: v === 'all' ? undefined : v,
                                        page: 1,
                                    }),
                                })
                            }
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder={t('customerDebts.filters.customer')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('customerDebts.filters.all_customers')}</SelectItem>
                                {customers.map((c) => (
                                    <SelectItem key={c.id} value={c.id!}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={statusFilter}
                            onValueChange={(v) =>
                                navigate({
                                    search: (prev) => ({
                                        ...prev,
                                        status: v === 'all' ? undefined : (v as DebtStatus),
                                        page: 1,
                                    }),
                                })
                            }
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
                                <TableHead>{t('customerDebts.fields.customer')}</TableHead>
                                <TableHead>{t('debts.fields.status')}</TableHead>
                                <TableHead className="text-right">{t('debts.fields.total')}</TableHead>
                                <TableHead className="text-right">{t('debts.fields.balance')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(data.debts || []).map((d) => (
                                <TableRow
                                    key={d.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelectedId(d.id)}
                                >
                                    <TableCell className="font-mono text-xs">{d.reference_no}</TableCell>
                                    <TableCell>{d.customer_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{t(`debts.status.${d.status}`, d.status)}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatMoney(d.total_amount)}</TableCell>
                                    <TableCell className="text-right font-medium">{formatMoney(d.balance_due)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <ListPagination
                        pagination={data.pagination}
                        onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
                        onLimitChange={(limit) => navigate({ search: (prev) => ({ ...prev, limit, page: 1 }) })}
                    />
                </CardContent>
            </Card>

            <PartnerDebtDetailSheet
                open={!!selectedId}
                onOpenChange={(open) => !open && setSelectedId(null)}
                partnerLabel={t('customerDebts.fields.customer')}
                partnerName={detail?.customer_name}
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
                        <DialogTitle>{t('customerDebts.actions.add_manual')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>{t('customerDebts.fields.customer')}</Label>
                            <CustomerSearchCombobox
                                value={manualCustomerId}
                                onValueChange={(id) => setManualCustomerId(id)}
                                placeholder={t('customers.search_placeholder')}
                            />
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
                                !manualCustomerId ||
                                !manualTotal ||
                                Number(manualTotal) <= 0
                            }
                            onClick={async () => {
                                await createMutation.mutateAsync({
                                    customer_id: manualCustomerId,
                                    total_amount: Number(manualTotal),
                                    note: manualNote || undefined,
                                })
                                setManualOpen(false)
                                setManualCustomerId('')
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
