import {
    InternalCustomersCreateCustomerRequest,
    InternalCustomersCustomerResponse,
    InternalCustomersUpdateCustomerRequest,
} from '@/lib/api/generated'
import { useTranslation } from 'react-i18next'
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '@/lib/api/query/customers.ts'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import { Link } from '@tanstack/react-router'
import { primeCustomerDebtsFilter } from '@/stores/customer-debts-list'
import { useQuery } from '@tanstack/react-query'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { ordersListQueryOptions } from '@/lib/api/query/orders'
import { customerDebtsListQueryOptions } from '@/lib/api/query/customerDebts'
import { useFormatMoney } from '@/context/MoneyContext'
import { useRBAC } from '@/lib/auth/rbac'
import { ListPagination } from '@/components/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCustomerGroupsListQuery } from '@/lib/api/query/customerGroups'
import type { CustomerProfile } from '@/lib/api/query/customers'

export type CustomerDialogTab = 'profile' | 'orders' | 'debts'

export function CustomerFormDialog({
    open,
    onOpenChange,
    customerToEdit,
    initialTab = 'profile',
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    customerToEdit: CustomerProfile | null
    initialTab?: CustomerDialogTab
}) {
    const { t } = useTranslation()
    const formatMoney = useFormatMoney()
    const createMutation = useCreateCustomerMutation()
    const updateMutation = useUpdateCustomerMutation()
    const isEdit = !!customerToEdit
    const customerId = customerToEdit?.id ?? ''

    const [activeTab, setActiveTab] = useState<CustomerDialogTab>(initialTab)
    const [ordersPage, setOrdersPage] = useState(1)

    const { canAccessApi } = useRBAC()
    const canOrders = canAccessApi('GET', '/orders')
    const canDebts = canAccessApi('GET', '/customer-debts')
    const { data: groupsData } = useCustomerGroupsListQuery({ limit: 100, page: 1 })
    const customerGroups = groupsData?.groups ?? []

    useEffect(() => {
        if (open) {
            setActiveTab(isEdit ? initialTab : 'profile')
            setOrdersPage(1)
        }
    }, [open, initialTab, isEdit, customerId])

    const ordersQuery = useQuery({
        ...ordersListQueryOptions({ customerId, page: ordersPage, limit: 10 }),
        enabled: open && isEdit && activeTab === 'orders' && !!customerId && canOrders,
    })
    const debtsQuery = useQuery({
        ...customerDebtsListQueryOptions({ customer_id: customerId, page: 1, limit: 50 }),
        enabled: open && isEdit && activeTab === 'debts' && !!customerId && canDebts,
    })

    const orders = ordersQuery.data?.orders ?? []
    const ordersPagination = ordersQuery.data?.pagination
    const debts = debtsQuery.data?.debts ?? []
    const totalDebtBalance = debts
        .filter((d) => d.status === 'open' || d.status === 'partial')
        .reduce((sum, d) => sum + d.balance_due, 0)

    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
            customer_group_id: '',
        },
        validators: {
            onChange: z.object({
                name: z.string().min(1, 'Name is required'),
                email: z.string().email('Invalid email format').or(z.literal('')),
                phone: z.string(),
                address: z.string(),
                customer_group_id: z.string(),
            }),
        },
        onSubmit: async ({ value }) => {
            try {
                const groupId = value.customer_group_id?.trim() || undefined
                if (customerToEdit) {
                    const payload: InternalCustomersUpdateCustomerRequest & { customer_group_id?: string | null } = {
                        name: value.name,
                        email: value.email || undefined,
                        phone: value.phone || undefined,
                        address: value.address || undefined,
                        customer_group_id: groupId ?? null,
                    }
                    await updateMutation.mutateAsync({ id: customerToEdit.id!, body: payload })
                } else {
                    const payload: InternalCustomersCreateCustomerRequest & { customer_group_id?: string } = {
                        name: value.name,
                        email: value.email || undefined,
                        phone: value.phone || undefined,
                        address: value.address || undefined,
                        customer_group_id: groupId,
                    }
                    await createMutation.mutateAsync(payload)
                }
                onOpenChange(false)
                form.reset()
            } catch (error: unknown) {
                console.error(error)
                const err = error as { response?: { data?: { error?: string } } }
                const msg = err.response?.data?.error || 'Unknown error'
                toast.error(t('customers.messages.save_failed', { message: msg }))
            }
        },
    })

    useEffect(() => {
        if (open) {
            if (customerToEdit) {
                form.setFieldValue('name', customerToEdit.name || '')
                form.setFieldValue('email', customerToEdit.email || '')
                form.setFieldValue('phone', customerToEdit.phone || '')
                form.setFieldValue('address', customerToEdit.address || '')
                form.setFieldValue('customer_group_id', customerToEdit.customer_group_id || '')
            } else {
                form.reset()
            }
        }
    }, [open, customerToEdit])

    const profileFields = (
        <div className="grid gap-4 py-2 sm:grid-cols-2">
            {customerToEdit?.code ? (
                <div className="space-y-1 sm:col-span-2">
                    <Label>{t('customers.table.code', 'Code')}</Label>
                    <p className="font-mono text-sm font-medium">{customerToEdit.code}</p>
                </div>
            ) : null}
            <form.Field
                name="name"
                children={(field) => (
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor={field.name}>{t('customers.form.name', 'Name')} *</Label>
                        <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors.length > 0 && (
                            <em role="alert" className="text-sm font-medium text-destructive">
                                {field.state.meta.errors
                                    .map((err) =>
                                        typeof err === 'object'
                                            ? ((err as { message?: string }).message ?? JSON.stringify(err))
                                            : String(err),
                                    )
                                    .join(', ')}
                            </em>
                        )}
                    </div>
                )}
            />
            <form.Field
                name="email"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>{t('customers.form.email', 'Email')}</Label>
                        <Input
                            id={field.name}
                            type="email"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                    </div>
                )}
            />
            <form.Field
                name="customer_group_id"
                children={(field) => (
                    <div className="space-y-2 sm:col-span-2">
                        <Label>{t('customers.form.group', 'Customer group')}</Label>
                        <Select value={field.state.value || 'none'} onValueChange={(v) => field.handleChange(v === 'none' ? '' : v)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('customers.form.group_placeholder', 'Select group…')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('customers.form.group_none', 'No group')}</SelectItem>
                                {customerGroups.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>
                                        {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            />
            <form.Field
                name="phone"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>{t('customers.form.phone', 'Phone')}</Label>
                        <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                    </div>
                )}
            />
            <form.Field
                name="address"
                children={(field) => (
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor={field.name}>{t('customers.form.address', 'Address')}</Label>
                        <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                    </div>
                )}
            />
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                size={isEdit ? 'xl' : 'md'}
                dismissible
                scrollable={!isEdit}
                className={
                    isEdit
                        ? 'flex max-h-[92vh] flex-col gap-4 overflow-hidden'
                        : undefined
                }
            >
                <DialogHeader>
                    <DialogTitle>
                        {customerToEdit
                            ? customerToEdit.name || t('customers.form.title_edit', 'Edit Customer')
                            : t('customers.form.title_create', 'Create Customer')}
                    </DialogTitle>
                    <DialogDescription>
                        {customerToEdit
                            ? t('customers.form.desc_edit', 'Modify customer details')
                            : t('customers.form.desc_create', 'Add a new customer to the pos')}
                    </DialogDescription>
                </DialogHeader>

                {isEdit ? (
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as CustomerDialogTab)}
                        className="flex min-h-0 flex-1 flex-col gap-3"
                    >
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="profile">{t('customers.detail.tab_profile')}</TabsTrigger>
                            <TabsTrigger value="orders">{t('customers.detail.tab_orders')}</TabsTrigger>
                            <TabsTrigger value="debts">{t('customers.detail.tab_debts')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="mt-0 min-h-0 flex-1 overflow-y-auto">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    form.handleSubmit()
                                }}
                            >
                                {profileFields}
                                <DialogFooter className="mt-6 px-0">
                                    <form.Subscribe
                                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                                        children={([canSubmit, isSubmitting]) => (
                                            <Button
                                                type="submit"
                                                disabled={
                                                    !canSubmit ||
                                                    isSubmitting ||
                                                    createMutation.isPending ||
                                                    updateMutation.isPending
                                                }
                                            >
                                                {(isSubmitting ||
                                                    createMutation.isPending ||
                                                    updateMutation.isPending) && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                {t('customers.form.save_changes', 'Save changes')}
                                            </Button>
                                        )}
                                    />
                                </DialogFooter>
                            </form>
                        </TabsContent>

                        <TabsContent
                            value="orders"
                            className="mt-0 min-h-0 max-h-[min(28rem,50vh)] flex-1 space-y-3 overflow-y-auto"
                        >
                            {!canOrders ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    {t('customers.detail.orders_forbidden')}
                                </p>
                            ) : ordersQuery.isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : orders.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    {t('customers.detail.orders_empty')}
                                </p>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('customers.detail.order_date')}</TableHead>
                                                <TableHead>{t('customers.detail.order_status')}</TableHead>
                                                <TableHead className="text-right">
                                                    {t('customers.detail.order_total')}
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orders.map(
                                                (order: {
                                                    id?: string
                                                    created_at?: string
                                                    status?: string
                                                    net_total?: number
                                                }) => (
                                                    <TableRow key={order.id}>
                                                        <TableCell className="text-xs">
                                                            {order.created_at
                                                                ? new Date(order.created_at).toLocaleString()
                                                                : '—'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">
                                                                {t(
                                                                    `transactions.status.${order.status}`,
                                                                    order.status ?? '',
                                                                )}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatMoney(order.net_total || 0)}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                    {ordersPagination && (
                                        <ListPagination
                                            pagination={ordersPagination}
                                            onPageChange={setOrdersPage}
                                            onLimitChange={() => {}}
                                        />
                                    )}
                                </>
                            )}
                        </TabsContent>

                        <TabsContent
                            value="debts"
                            className="mt-0 min-h-0 max-h-[min(28rem,50vh)] flex-1 space-y-3 overflow-y-auto"
                        >
                            {!canDebts ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    {t('customers.detail.debts_forbidden')}
                                </p>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                                        <span className="text-muted-foreground">
                                            {t('customers.detail.debt_balance')}
                                        </span>
                                        <span className="font-semibold text-destructive">
                                            {formatMoney(totalDebtBalance)}
                                        </span>
                                    </div>
                                    {debtsQuery.isLoading ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : debts.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            {t('customers.detail.debts_empty')}
                                        </p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{t('debts.fields.reference')}</TableHead>
                                                    <TableHead>{t('debts.fields.status')}</TableHead>
                                                    <TableHead className="text-right">
                                                        {t('debts.fields.balance')}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {debts.map((d) => (
                                                    <TableRow key={d.id}>
                                                        <TableCell className="font-mono text-xs">
                                                            {d.reference_no}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">
                                                                {t(`debts.status.${d.status}`, d.status)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatMoney(d.balance_due)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                    {canDebts && customerId ? (
                                        <Button variant="outline" className="w-full" asChild>
                                            <Link
                                                to="/customer-debts"
                                                onClick={() => primeCustomerDebtsFilter(customerId)}
                                            >
                                                {t('customers.detail.view_all_debts')}
                                            </Link>
                                        </Button>
                                    ) : null}
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            form.handleSubmit()
                        }}
                    >
                        {profileFields}
                        <DialogFooter className="mt-4">
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button
                                        type="submit"
                                        disabled={
                                            !canSubmit ||
                                            isSubmitting ||
                                            createMutation.isPending ||
                                            updateMutation.isPending
                                        }
                                    >
                                        {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {t('customers.form.create_customer', 'Add Customer')}
                                    </Button>
                                )}
                            />
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
