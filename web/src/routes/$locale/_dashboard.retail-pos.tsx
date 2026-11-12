import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2, RotateCcw, ScanBarcode } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PaymentDialog } from '@/components/payment/PaymentDialog'
import { CartItem } from '@/components/orders/CartContent'
import { VariantSelectionDialog } from '@/components/orders/VariantSelectionDialog'
import { RetailLineItemsTable } from '@/components/retail-pos/RetailLineItemsTable'
import { RetailCheckoutPanel, RetailSettlementMode } from '@/components/retail-pos/RetailCheckoutPanel'
import { RetailPriceEditDialog } from '@/components/retail-pos/RetailPriceEditDialog'
import { Product, useUpdateProductMutation } from '@/lib/api/query/products'
import { axiosInstance } from '@/lib/api/client'
import { useConfirmManualPaymentMutation, useCreateOrderMutation } from '@/lib/api/query/orders'
import { useCustomersListQuery } from '@/lib/api/query/customers'
import { usePaymentMethodsListQuery } from '@/lib/api/query/payment-methods'
import { useFinancialSettingsQuery } from '@/lib/api/query/settings'
import { InternalProductsProductOptionResponse, POSKasirInternalOrdersRepositoryOrderType } from '@/lib/api/generated'
import { useQueryClient } from '@tanstack/react-query'
import { catalogUnitPrice, lineSubtotal } from '@/lib/retail-pos/pricing'
import { RetailReturnDialog } from '@/components/retail-pos/RetailReturnDialog'
import { OfflinePosBanner } from '@/components/retail-pos/OfflinePosBanner'
import { usePosOfflineSync } from '@/hooks/usePosOfflineSync'
import { enqueuePosOp, isNetworkError } from '@/lib/offline/posQueue'

export const Route = createFileRoute('/$locale/_dashboard/retail-pos')({
    component: RetailPosPage,
})

const QUICK_CASH = [10000, 20000, 50000, 100000, 200000]

async function fetchProductByCode(code: string): Promise<Product> {
    try {
        const res = await axiosInstance.get('/products/lookup', { params: { code } })
        return (res.data as { data: Product }).data
    } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status !== 404) throw err
    }
    const list = await axiosInstance.get('/products/search', { params: { q: code, limit: 12 } })
    const products = ((list.data as { data?: { products?: Product[] } }).data?.products ?? []) as Product[]
    const exact = products.find(
        (p) => p.barcode === code || p.sku === code || p.name?.toLowerCase() === code.toLowerCase(),
    )
    if (exact) return exact
    if (products.length === 1) return products[0]
    throw new Error('not_found')
}

function RetailPosPage() {
    const { t } = useTranslation()
    const searchRef = useRef<HTMLInputElement>(null)
    const [search, setSearch] = useState('')
    const [scanning, setScanning] = useState(false)
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
    const [variantOpen, setVariantOpen] = useState(false)
    const [productForVariant, setProductForVariant] = useState<Product | null>(null)
    const [priceEditItem, setPriceEditItem] = useState<CartItem | null>(null)
    const [discountMode, setDiscountMode] = useState<'amount' | 'percent'>('amount')
    const [discountInput, setDiscountInput] = useState('')
    const [cashReceived, setCashReceived] = useState(0)
    const [settlementMode, setSettlementMode] = useState<RetailSettlementMode>('cash')
    const [returnOpen, setReturnOpen] = useState(false)
    const { online, pending, syncing, flush, refresh: refreshQueue } = usePosOfflineSync()

    const { data: customersData } = useCustomersListQuery({ limit: 100 })
    const customers = customersData?.customers || []
    const createOrderMutation = useCreateOrderMutation()
    const manualPayMutation = useConfirmManualPaymentMutation()
    const updateProductMutation = useUpdateProductMutation()
    const { data: paymentMethods } = usePaymentMethodsListQuery()
    const { data: fin } = useFinancialSettingsQuery()
    const queryClient = useQueryClient()

    const cashMethodId = useMemo(
        () => paymentMethods?.find((m) => m.name?.toLowerCase().includes('cash'))?.id,
        [paymentMethods],
    )

    const subtotal = cart.reduce((sum, item) => sum + lineSubtotal(item), 0)
    const orderDiscount = useMemo(() => {
        const raw = Number(discountInput)
        if (!Number.isFinite(raw) || raw <= 0) return 0
        if (discountMode === 'percent') {
            return Math.min(subtotal, Math.floor((subtotal * Math.min(100, raw)) / 100))
        }
        return Math.min(subtotal, Math.floor(raw))
    }, [discountInput, discountMode, subtotal])

    const taxable = Math.max(0, subtotal - orderDiscount)
    const taxRate = fin?.tax_enabled ? (fin.tax_rate ?? 0) / 100 : 0
    const serviceRate = (fin?.service_charge_rate ?? 0) / 100
    const taxAmount = Math.floor(taxable * taxRate)
    const serviceAmount = Math.floor(taxable * serviceRate)
    const grandTotal = taxable + taxAmount + serviceAmount
    const itemCount = cart.reduce((n, item) => n + item.quantity, 0)

    const addCartItem = (product: Product, variant?: InternalProductsProductOptionResponse) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id && item.variant?.id === variant?.id)
            const currentQty = existing ? existing.quantity : 0
            if (currentQty + 1 > (product.stock || 0)) {
                toast.error(t('order.errors.insufficient_stock'))
                return prev
            }
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id && item.variant?.id === variant?.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                )
            }
            return [...prev, { product, variant, quantity: 1 }]
        })
        setVariantOpen(false)
        setProductForVariant(null)
    }

    const resolveAndAdd = async (raw: string) => {
        const code = raw.trim()
        if (!code) return
        setScanning(true)
        try {
            const product = await fetchProductByCode(code)
            if ((product.stock || 0) <= 0) {
                toast.error(t('order.errors.stock_empty'))
                return
            }
            if (product.options && product.options.length > 0) {
                setProductForVariant(product)
                setVariantOpen(true)
                return
            }
            addCartItem(product)
            setSearch('')
            searchRef.current?.focus()
        } catch {
            toast.error(t('retailPos.product_not_found'))
        } finally {
            setScanning(false)
        }
    }

    const updateQuantity = (productId: string, delta: number, variantId?: string) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.product.id === productId && item.variant?.id === variantId) {
                    if (delta > 0 && item.quantity + delta > (item.product.stock || 0)) {
                        toast.error(t('order.errors.insufficient_stock'))
                        return item
                    }
                    return { ...item, quantity: Math.max(1, item.quantity + delta) }
                }
                return item
            }),
        )
    }

    const removeFromCart = (productId: string, variantId?: string) => {
        setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.variant?.id === variantId)))
    }

    const applyLinePrice = async (unitPrice: number, saveAsRetailPrice: boolean) => {
        if (!priceEditItem?.product.id) return
        const pid = priceEditItem.product.id
        const vid = priceEditItem.variant?.id

        setCart((prev) =>
            prev.map((item) =>
                item.product.id === pid && item.variant?.id === vid ? { ...item, unitPrice } : item,
            ),
        )

        if (saveAsRetailPrice && !priceEditItem.variant) {
            try {
                await updateProductMutation.mutateAsync({ id: pid, body: { price: unitPrice } })
                setCart((prev) =>
                    prev.map((item) =>
                        item.product.id === pid
                            ? { ...item, product: { ...item.product, price: unitPrice }, unitPrice: undefined }
                            : item,
                    ),
                )
            } catch {
                /* toast handled in mutation */
            }
        }
    }

    const buildOrderPayload = () => ({
        type: POSKasirInternalOrdersRepositoryOrderType.OrderTypeTakeaway,
        customer_id: selectedCustomerId || undefined,
        discount_amount: orderDiscount > 0 ? orderDiscount : undefined,
        items: cart.map((item) => {
            const catalog = catalogUnitPrice(item)
            const unit = item.unitPrice ?? catalog
            return {
                product_id: item.product.id!,
                quantity: item.quantity,
                options: item.variant?.id ? [{ product_option_id: item.variant.id }] : [],
                unit_price: unit !== catalog || item.unitPrice != null ? unit : undefined,
            }
        }),
    })

    const resetAfterSale = () => {
        setCart([])
        setDiscountInput('')
        setCashReceived(0)
        setCreatedOrderId(null)
        void queryClient.invalidateQueries({ queryKey: ['products'] })
        searchRef.current?.focus()
    }

    const submitOrder = async () => {
        if (!cart.length) return
        const payload = buildOrderPayload()
        const order = await axiosInstance.post('/orders', payload, {
            headers: { 'X-Idempotency-Key': crypto.randomUUID() },
        })
        return (order.data as { data: { id?: string; version?: number; net_total?: number } }).data
    }

    const queueCurrentSale = (kind: 'retail_cash' | 'retail_debt' | 'retail_other', payment?: { payment_method_id: number; cash_received: number }) => {
        const idempotencyKey = crypto.randomUUID()
        enqueuePosOp({
            idempotencyKey,
            kind,
            orderBody: buildOrderPayload() as Record<string, unknown>,
            payment,
        })
        refreshQueue()
        toast.info(t('retailPos.offline.queued'))
        resetAfterSale()
    }

    const handlePay = async () => {
        if (settlementMode === 'debt') {
            if (!selectedCustomerId) {
                toast.error(t('retailPos.settlement.debt_requires_customer'))
                return
            }
            try {
                await submitOrder()
                toast.success(t('retailPos.debt_success'))
                resetAfterSale()
            } catch (err) {
                if (isNetworkError(err)) {
                    queueCurrentSale('retail_debt')
                    return
                }
                toast.error(t('order.errors.create_failed'))
            }
            return
        }

        const received = cashReceived > 0 ? cashReceived : grandTotal
        if (received < grandTotal) {
            toast.error(t('order.errors.cash_insufficient'))
            return
        }
        if (!cashMethodId) {
            toast.error(t('retailPos.cash.no_method'))
            return
        }

        try {
            const order = await submitOrder()
            if (!order?.id) throw new Error('no order')
            await manualPayMutation.mutateAsync({
                id: order.id,
                body: {
                    payment_method_id: cashMethodId,
                    cash_received: received,
                    version: order.version ?? 1,
                },
            })
            resetAfterSale()
        } catch (err) {
            if (isNetworkError(err)) {
                queueCurrentSale('retail_cash', { payment_method_id: cashMethodId, cash_received: received })
                return
            }
            toast.error(t('order.errors.create_failed'))
        }
    }

    const handleOtherPayment = async () => {
        if (!cart.length) return
        try {
            const order = await submitOrder()
            setCreatedOrderId(order?.id || null)
            setIsPaymentOpen(true)
        } catch (err) {
            if (isNetworkError(err)) {
                queueCurrentSale('retail_other')
                return
            }
            toast.error(t('order.errors.create_failed'))
        }
    }

    const canPay = cart.length > 0 && createOrderMutation.isAllowed

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-xl border bg-background">
            <header className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-4 py-3">
                <ScanBarcode className="h-5 w-5 text-primary" />
                <div className="flex-1">
                    <p className="text-sm font-semibold">{t('retailPos.title')}</p>
                    <p className="text-xs text-muted-foreground">{t('retailPos.subtitle')}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setReturnOpen(true)}>
                    <RotateCcw className="mr-1 h-4 w-4" />
                    {t('retailPos.return.button')}
                </Button>
            </header>
            <OfflinePosBanner online={online} pending={pending} syncing={syncing} onSync={() => void flush()} t={t} />

            <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex shrink-0 gap-2 border-b p-3">
                        <Input
                            ref={searchRef}
                            autoFocus
                            placeholder={t('retailPos.search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    void resolveAndAdd(search)
                                }
                            }}
                            className="h-11 text-base"
                        />
                        <Button
                            type="button"
                            className="h-11 px-6"
                            disabled={!search.trim() || scanning}
                            onClick={() => void resolveAndAdd(search)}
                        >
                            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : t('retailPos.add_line')}
                        </Button>
                    </div>
                    <div className="min-h-0 flex-1 p-2">
                        <RetailLineItemsTable
                            cart={cart}
                            t={t}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeFromCart}
                            onEditPrice={setPriceEditItem}
                        />
                    </div>
                </div>

                <div className="w-[min(100%,22rem)] shrink-0 xl:w-[min(24rem,100%)]">
                    <RetailCheckoutPanel
                        t={t}
                        customers={customers}
                        selectedCustomerId={selectedCustomerId}
                        onCustomerChange={setSelectedCustomerId}
                        subtotal={subtotal}
                        itemCount={itemCount}
                        taxAmount={taxAmount}
                        serviceAmount={serviceAmount}
                        orderDiscount={orderDiscount}
                        discountMode={discountMode}
                        discountInput={discountInput}
                        onDiscountModeChange={setDiscountMode}
                        onDiscountInputChange={setDiscountInput}
                        grandTotal={grandTotal}
                        cashReceived={cashReceived}
                        onCashReceivedChange={setCashReceived}
                        settlementMode={settlementMode}
                        onSettlementModeChange={setSettlementMode}
                        onPay={() => void handlePay()}
                        onOtherPayment={() => void handleOtherPayment()}
                        canPay={canPay}
                        paying={manualPayMutation.isPending}
                        quickAmounts={QUICK_CASH}
                    />
                </div>
            </div>

            <RetailPriceEditDialog
                open={!!priceEditItem}
                onOpenChange={(open) => !open && setPriceEditItem(null)}
                item={priceEditItem}
                t={t}
                onApply={(price, save) => void applyLinePrice(price, save)}
                saving={updateProductMutation.isPending}
                canSaveCatalog={updateProductMutation.isAllowed && !priceEditItem?.variant}
            />

            <VariantSelectionDialog
                open={variantOpen}
                onOpenChange={setVariantOpen}
                product={productForVariant}
                t={t}
                onSelect={(product, variant) => {
                    addCartItem(product, variant)
                    setSearch('')
                    searchRef.current?.focus()
                }}
            />

            <PaymentDialog
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                orderId={createdOrderId}
                onPaymentSuccess={resetAfterSale}
            />
            <RetailReturnDialog open={returnOpen} onOpenChange={setReturnOpen} t={t} />
        </div>
    )
}
