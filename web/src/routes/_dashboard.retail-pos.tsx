import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { RotateCcw, ScanBarcode } from 'lucide-react'
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
import {
    baseQtyForLine,
    cartBaseQtyForProduct,
    cartLineKey,
    defaultSaleUnit,
    type ProductSaleUnit,
} from '@/lib/retail-pos/productUnits'
import { RetailReturnDialog } from '@/components/retail-pos/RetailReturnDialog'
import { RetailProductSearchField } from '@/components/retail-pos/RetailProductSearchField'
import { OfflinePosBanner } from '@/components/retail-pos/OfflinePosBanner'
import { usePosOfflineSync } from '@/hooks/usePosOfflineSync'
import { enqueuePosOp, isNetworkError } from '@/lib/offline/posQueue'
import { RetailPosTabs } from '@/components/retail-pos/RetailPosTabs'
import { createRetailSaleTab, patchTab, updateTabCart, type RetailSaleTab } from '@/lib/retail-pos/saleTabs'

export const Route = createFileRoute('/_dashboard/retail-pos')({
    component: RetailPosPage,
})

const QUICK_CASH = [10000, 20000, 50000, 100000, 200000]
const MAX_TABS = 10

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
    const [tabs, setTabs] = useState<RetailSaleTab[]>(() => [createRetailSaleTab()])
    const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id ?? '')
    const [scanning, setScanning] = useState(false)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
    const [variantOpen, setVariantOpen] = useState(false)
    const [productForVariant, setProductForVariant] = useState<Product | null>(null)
    const [priceEditItem, setPriceEditItem] = useState<CartItem | null>(null)
    const [returnOpen, setReturnOpen] = useState(false)
    const { online, pending, syncing, flush, refresh: refreshQueue } = usePosOfflineSync()

    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
    const cart = activeTab?.cart ?? []
    const search = activeTab?.search ?? ''
    const selectedCustomerId = activeTab?.selectedCustomerId ?? null
    const discountMode = activeTab?.discountMode ?? 'amount'
    const discountInput = activeTab?.discountInput ?? ''
    const cashReceived = activeTab?.cashReceived ?? 0
    const settlementMode = activeTab?.settlementMode ?? 'cash'

    const patchActive = (patch: Partial<RetailSaleTab>) => {
        if (!activeTab) return
        setTabs((prev) => patchTab(prev, activeTab.id, patch))
    }

    const setCart = (updater: (prev: CartItem[]) => CartItem[]) => {
        if (!activeTab) return
        setTabs((prev) => updateTabCart(activeTab.id, prev, updater))
    }

    useEffect(() => {
        searchRef.current?.focus()
    }, [activeTabId])

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

    const tabSummaries = tabs.map((tab) => ({
        id: tab.id,
        itemCount: tab.cart.reduce((n, item) => n + item.quantity, 0),
    }))

    const addTab = () => {
        if (tabs.length >= MAX_TABS) return
        const tab = createRetailSaleTab()
        setTabs((prev) => [...prev, tab])
        setActiveTabId(tab.id)
    }

    const closeTab = (id: string) => {
        const tab = tabs.find((x) => x.id === id)
        if (tab && tab.cart.length > 0) {
            const ok = window.confirm(t('retailPos.tabs.close_confirm'))
            if (!ok) return
        }
        const remaining = tabs.filter((x) => x.id !== id)
        if (remaining.length === 0) {
            const fresh = createRetailSaleTab()
            setTabs([fresh])
            setActiveTabId(fresh.id)
            return
        }
        setTabs(remaining)
        if (activeTabId === id) {
            setActiveTabId(remaining[0].id)
        }
    }

    const ensureProductDetail = async (product: Product): Promise<Product> => {
        if (!product.id) return product
        try {
            const res = await axiosInstance.get(`/products/${product.id}`)
            return (res.data as { data: Product }).data
        } catch {
            return product
        }
    }

    const addCartItem = (
        product: Product,
        variant?: InternalProductsProductOptionResponse,
        saleUnit?: ProductSaleUnit,
    ) => {
        const unit = saleUnit ?? defaultSaleUnit(product)
        setCart((prev) => {
            const lineKey = cartLineKey(product.id!, variant?.id, unit)
            const existing = prev.find(
                (item) =>
                    cartLineKey(item.product.id!, item.variant?.id, item.saleUnit ?? defaultSaleUnit(item.product)) ===
                    lineKey,
            )
            const baseUsed = cartBaseQtyForProduct(prev, product.id!, existing ? lineKey : undefined)
            const addBase = baseQtyForLine(1, unit)
            if (baseUsed + addBase > (product.stock || 0)) {
                toast.error(t('order.errors.insufficient_stock'))
                return prev
            }
            if (existing) {
                return prev.map((item) => {
                    const key = cartLineKey(item.product.id!, item.variant?.id, item.saleUnit ?? defaultSaleUnit(item.product))
                    return key === lineKey ? { ...item, quantity: item.quantity + 1, saleUnit: unit } : item
                })
            }
            return [...prev, { product, variant, quantity: 1, saleUnit: unit }]
        })
        setVariantOpen(false)
        setProductForVariant(null)
    }

    const addProductToCartFlow = async (product: Product, preferredUnitId?: string | null) => {
        let detail = await ensureProductDetail(product)
        if ((detail.stock || 0) <= 0) {
            toast.error(t('order.errors.stock_empty'))
            return
        }
        if (detail.options && detail.options.length > 0) {
            setProductForVariant(detail)
            setVariantOpen(true)
            return
        }
        const unitId = preferredUnitId ?? product.matched_sale_unit_id ?? detail.matched_sale_unit_id
        addCartItem(detail, undefined, defaultSaleUnit(detail, unitId))
        patchActive({ search: '' })
        searchRef.current?.focus()
    }

    const resolveAndAdd = async (raw: string) => {
        const code = raw.trim()
        if (!code) return
        setScanning(true)
        try {
            const product = await fetchProductByCode(code)
            await addProductToCartFlow(product, product.matched_sale_unit_id)
        } catch {
            toast.error(t('retailPos.product_not_found'))
        } finally {
            setScanning(false)
        }
    }

    const updateQuantity = (lineKey: string, delta: number) => {
        setCart((prev) =>
            prev.map((item) => {
                const key = cartLineKey(item.product.id!, item.variant?.id, item.saleUnit ?? defaultSaleUnit(item.product))
                if (key !== lineKey) return item
                const unit = item.saleUnit ?? defaultSaleUnit(item.product)
                const nextQty = item.quantity + delta
                if (nextQty < 1) return item
                if (delta > 0) {
                    const baseUsed = cartBaseQtyForProduct(prev, item.product.id!, lineKey)
                    if (baseUsed + baseQtyForLine(1, unit) > (item.product.stock || 0)) {
                        toast.error(t('order.errors.insufficient_stock'))
                        return item
                    }
                }
                return { ...item, quantity: nextQty }
            }),
        )
    }

    const changeSaleUnit = (lineKey: string, unit: ProductSaleUnit) => {
        setCart((prev) => {
            const item = prev.find(
                (row) =>
                    cartLineKey(row.product.id!, row.variant?.id, row.saleUnit ?? defaultSaleUnit(row.product)) === lineKey,
            )
            if (!item) return prev
            const newKey = cartLineKey(item.product.id!, item.variant?.id, unit)
            const merged = prev.filter(
                (row) =>
                    cartLineKey(row.product.id!, row.variant?.id, row.saleUnit ?? defaultSaleUnit(row.product)) !== lineKey,
            )
            const existing = merged.find(
                (row) =>
                    cartLineKey(row.product.id!, row.variant?.id, row.saleUnit ?? defaultSaleUnit(row.product)) === newKey,
            )
            const qty = item.quantity + (existing?.quantity ?? 0)
            const baseUsed = cartBaseQtyForProduct(merged, item.product.id!)
            if (baseUsed + baseQtyForLine(qty, unit) > (item.product.stock || 0)) {
                toast.error(t('order.errors.insufficient_stock'))
                return prev
            }
            if (existing) {
                return merged.map((row) => {
                    const key = cartLineKey(row.product.id!, row.variant?.id, row.saleUnit ?? defaultSaleUnit(row.product))
                    return key === newKey ? { ...row, quantity: qty, saleUnit: unit, unitPrice: undefined } : row
                })
            }
            return [...merged, { ...item, saleUnit: unit, quantity: qty, unitPrice: undefined }]
        })
    }

    const removeFromCart = (lineKey: string) => {
        setCart((prev) =>
            prev.filter(
                (item) =>
                    cartLineKey(item.product.id!, item.variant?.id, item.saleUnit ?? defaultSaleUnit(item.product)) !==
                    lineKey,
            ),
        )
    }

    const applyLinePrice = async (unitPrice: number, saveAsRetailPrice: boolean) => {
        if (!priceEditItem?.product.id) return
        const pid = priceEditItem.product.id
        const editKey = cartLineKey(
            pid,
            priceEditItem.variant?.id,
            priceEditItem.saleUnit ?? defaultSaleUnit(priceEditItem.product),
        )

        setCart((prev) =>
            prev.map((item) => {
                const key = cartLineKey(item.product.id!, item.variant?.id, item.saleUnit ?? defaultSaleUnit(item.product))
                return key === editKey ? { ...item, unitPrice } : item
            }),
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
            const saleUnit = item.saleUnit ?? defaultSaleUnit(item.product)
            return {
                product_id: item.product.id!,
                product_unit_id: saleUnit.id || undefined,
                quantity: item.quantity,
                options: item.variant?.id ? [{ product_option_id: item.variant.id }] : [],
                unit_price: unit !== catalog || item.unitPrice != null ? unit : undefined,
            }
        }),
    })

    const resetAfterSale = () => {
        patchActive({
            cart: [],
            discountInput: '',
            cashReceived: 0,
            search: '',
            selectedCustomerId: null,
        })
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

    if (!activeTab) return null

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
                    <div className="flex shrink-0 items-center gap-2 border-b bg-background px-3 py-2">
                        <RetailProductSearchField
                            inputRef={searchRef}
                            value={search}
                            onChange={(v) => patchActive({ search: v })}
                            onSubmit={(raw) => void resolveAndAdd(raw)}
                            onPickProduct={(p) => void addProductToCartFlow(p)}
                            busy={scanning}
                            t={t}
                        />
                        <RetailPosTabs
                            tabs={tabSummaries}
                            activeId={activeTabId}
                            onSelect={setActiveTabId}
                            onAdd={addTab}
                            onClose={closeTab}
                            maxTabs={MAX_TABS}
                            t={t}
                        />
                    </div>
                    <div className="min-h-0 flex-1 p-2">
                        <RetailLineItemsTable
                            cart={cart}
                            t={t}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeFromCart}
                            onEditPrice={setPriceEditItem}
                            onChangeSaleUnit={changeSaleUnit}
                        />
                    </div>
                </div>

                <div className="w-[min(100%,22rem)] shrink-0 xl:w-[min(24rem,100%)]">
                    <RetailCheckoutPanel
                        t={t}
                        customers={customers}
                        selectedCustomerId={selectedCustomerId}
                        onCustomerChange={(id) => patchActive({ selectedCustomerId: id })}
                        subtotal={subtotal}
                        itemCount={itemCount}
                        taxAmount={taxAmount}
                        serviceAmount={serviceAmount}
                        orderDiscount={orderDiscount}
                        discountMode={discountMode}
                        discountInput={discountInput}
                        onDiscountModeChange={(m) => patchActive({ discountMode: m })}
                        onDiscountInputChange={(v) => patchActive({ discountInput: v })}
                        grandTotal={grandTotal}
                        cashReceived={cashReceived}
                        onCashReceivedChange={(v) => patchActive({ cashReceived: v })}
                        settlementMode={settlementMode}
                        onSettlementModeChange={(m: RetailSettlementMode) => patchActive({ settlementMode: m })}
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
                    patchActive({ search: '' })
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
