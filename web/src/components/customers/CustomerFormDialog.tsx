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
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button.tsx'
import { Loader2 } from 'lucide-react'
import { CustomerDetailOrdersGrid } from '@/components/customers/CustomerDetailOrdersGrid'
import { CustomerDetailDebtsGrid } from '@/components/customers/CustomerDetailDebtsGrid'
import { OrderDetailDialog } from '@/components/sales-orders/OrderDetailDialog'
import { ordersListQueryOptions } from '@/lib/api/query/orders'
import { customerDebtsListQueryOptions } from '@/lib/api/query/customerDebts'
import { useFormatMoney } from '@/context/MoneyContext'
import { useRBAC } from '@/lib/auth/rbac'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCustomerGroupsListQuery } from '@/lib/api/query/customerGroups'
import type { CustomerProfile } from '@/lib/api/query/customers'

export type CustomerDialogTab = 'profile' | 'orders' | 'returns' | 'debts'

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
    const queryClient = useQueryClient()
    const formatMoney = useFormatMoney()
    const createMutation = useCreateCustomerMutation()
    const updateMutation = useUpdateCustomerMutation()
    const isEdit = !!customerToEdit
    const customerId = customerToEdit?.id ?? ''

    const [activeTab, setActiveTab] = useState<CustomerDialogTab>(initialTab)
    const [ordersPage, setOrdersPage] = useState(1)
    const [ordersLimit, setOrdersLimit] = useState(10)
    const [returnsPage, setReturnsPage] = useState(1)
    const [returnsLimit, setReturnsLimit] = useState(10)
    const [debtsPage, setDebtsPage] = useState(1)
    const [debtsLimit, setDebtsLimit] = useState(10)
    const [orderDetailId, setOrderDetailId] = useState<string | null>(null)
    const [orderDetailOpen, setOrderDetailOpen] = useState(false)

    const { canAccessApi } = useRBAC()
    const canOrders = canAccessApi('GET', '/orders')
    const canDebts = canAccessApi('GET', '/customer-debts')
    const { data: groupsData } = useCustomerGroupsListQuery({ limit: 100, page: 1 })
    const customerGroups = groupsData?.groups ?? []

    useEffect(() => {
        if (open) {
            setActiveTab(isEdit ? initialTab : 'profile')
            setOrdersPage(1)
            setReturnsPage(1)
            setDebtsPage(1)
        }
    }, [open, initialTab, isEdit, customerId])

    const ordersQuery = useQuery({
        ...ordersListQueryOptions({ customerId, page: ordersPage, limit: ordersLimit }),
        enabled: open && isEdit && activeTab === 'orders' && !!customerId && canOrders,
    })
    const returnsQuery = useQuery({
        ...ordersListQueryOptions({
            customerId,
            page: returnsPage,
            limit: returnsLimit,
            refundedOnly: true,
        }),
        enabled: open && isEdit && activeTab === 'returns' && !!customerId && canOrders,
    })
    const debtsQuery = useQuery({
        ...customerDebtsListQueryOptions({
            customer_id: customerId,
            page: debtsPage,
            limit: debtsLimit,
        }),
        enabled: open && isEdit && activeTab === 'debts' && !!customerId && canDebts,
    })

    const orders = ordersQuery.data?.orders ?? []
    const ordersPagination = ordersQuery.data?.pagination
    const returns = returnsQuery.data?.orders ?? []
    const returnsPagination = returnsQuery.data?.pagination
    const debts = debtsQuery.data?.debts ?? []
    const debtsPagination = debtsQuery.data?.pagination
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

    const renderFieldErrors = (errors: unknown[]) =>
        errors.length > 0 ? (
            <em role="alert" className="text-sm font-medium text-destructive">
                {errors
                    .map((err) =>
                        typeof err === 'object'
                            ? ((err as { message?: string }).message ?? JSON.stringify(err))
                            : String(err),
                    )
                    .join(', ')}
            </em>
        ) : null

    const profileFields = (
        <div className="space-y-5 py-1">
            <fieldset className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <legend className="px-1 text-sm font-medium">
                    {t('customers.form.section_identity', 'Identity')}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
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
                                    autoComplete="name"
                                />
                                {renderFieldErrors(field.state.meta.errors)}
                            </div>
                        )}
                    />
                    {customerToEdit?.code ? (
                        <div className="space-y-2">
                            <Label>{t('customers.table.code', 'Code')}</Label>
                            <div className="flex h-9 items-center">
                                <Badge variant="secondary" className="font-mono text-xs font-semibold">
                                    {customerToEdit.code}
                                </Badge>
                            </div>
                        </div>
                    ) : null}
                    <form.Field
                        name="customer_group_id"
                        children={(field) => (
                            <div
                                className={`space-y-2 ${customerToEdit?.code ? '' : 'sm:col-span-2'}`}
                            >
                                <Label>{t('customers.form.group', 'Customer group')}</Label>
                                <Select
                                    value={field.state.value || 'none'}
                                    onValueChange={(v) => field.handleChange(v === 'none' ? '' : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'customers.form.group_placeholder',
                                                'Select group…',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            {t('customers.form.group_none', 'No group')}
                                        </SelectItem>
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
                </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-lg border p-4">
                <legend className="px-1 text-sm font-medium">
                    {t('customers.form.section_contact', 'Contact')}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                    <form.Field
                        name="phone"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>{t('customers.form.phone', 'Phone')}</Label>
                                <Input
                                    id={field.name}
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
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
                                    autoComplete="email"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                            </div>
                        )}
                    />
                </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-lg border p-4">
                <legend className="px-1 text-sm font-medium">
                    {t('customers.form.section_address', 'Address')}
                </legend>
                <form.Field
                    name="address"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name} className="sr-only">
                                {t('customers.form.address', 'Address')}
                            </Label>
                            <Textarea
                                id={field.name}
                                rows={3}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder={t('customers.form.address', 'Address')}
                                autoComplete="street-address"
                            />
                        </div>
                    )}
                />
            </fieldset>
        </div>
    )

    return (
        <>
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
                            <TabsTrigger value="returns">{t('customers.detail.tab_returns')}</TabsTrigger>
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
                                <DialogFooter className="sticky bottom-0 mt-6 border-t bg-background px-0 pt-4">
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
                            ) : (
                                <CustomerDetailOrdersGrid
                                    orders={orders}
                                    t={t}
                                    formatMoney={formatMoney}
                                    emptyMessage={t('customers.detail.orders_empty')}
                                    onOrderClick={(order) => {
                                        if (order.id) {
                                            setOrderDetailId(order.id)
                                            setOrderDetailOpen(true)
                                        }
                                    }}
                                    server={
                                        ordersPagination
                                            ? {
                                                  pagination: ordersPagination,
                                                  onPageChange: setOrdersPage,
                                                  onLimitChange: (limit) => {
                                                      setOrdersLimit(limit)
                                                      setOrdersPage(1)
                                                  },
                                                  isFetching: ordersQuery.isFetching,
                                              }
                                            : undefined
                                    }
                                />
                            )}
                        </TabsContent>

                        <TabsContent
                            value="returns"
                            className="mt-0 min-h-0 max-h-[min(28rem,50vh)] flex-1 space-y-3 overflow-y-auto"
                        >
                            {!canOrders ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    {t('customers.detail.returns_forbidden')}
                                </p>
                            ) : returnsQuery.isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <>
                                    <CustomerDetailOrdersGrid
                                        orders={returns}
                                        t={t}
                                        formatMoney={formatMoney}
                                        emptyMessage={t('customers.detail.returns_empty')}
                                        storageKey="customer-detail-returns-grid"
                                        onOrderClick={(order) => {
                                            if (order.id) {
                                                setOrderDetailId(order.id)
                                                setOrderDetailOpen(true)
                                            }
                                        }}
                                        server={
                                            returnsPagination
                                                ? {
                                                      pagination: returnsPagination,
                                                      onPageChange: setReturnsPage,
                                                      onLimitChange: (limit) => {
                                                          setReturnsLimit(limit)
                                                          setReturnsPage(1)
                                                      },
                                                      isFetching: returnsQuery.isFetching,
                                                  }
                                                : undefined
                                        }
                                    />
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link to="/sales-returns">{t('customers.detail.open_sales_returns')}</Link>
                                    </Button>
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
                                    ) : (
                                        <CustomerDetailDebtsGrid
                                            debts={debts}
                                            t={t}
                                            formatMoney={formatMoney}
                                            emptyMessage={t('customers.detail.debts_empty')}
                                            server={
                                                debtsPagination
                                                    ? {
                                                          pagination: debtsPagination,
                                                          onPageChange: setDebtsPage,
                                                          onLimitChange: (limit) => {
                                                              setDebtsLimit(limit)
                                                              setDebtsPage(1)
                                                          },
                                                          isFetching: debtsQuery.isFetching,
                                                      }
                                                    : undefined
                                            }
                                        />
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
        <OrderDetailDialog
            orderId={orderDetailId}
            open={orderDetailOpen}
            onOpenChange={(nextOpen) => {
                setOrderDetailOpen(nextOpen)
                if (!nextOpen) setOrderDetailId(null)
            }}
            onChanged={() => {
                void queryClient.invalidateQueries({ queryKey: ['orders', 'list'] })
            }}
        />
        </>
    )
}
