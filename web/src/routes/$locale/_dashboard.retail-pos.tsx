import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2, ScanBarcode } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PaymentDialog } from '@/components/payment/PaymentDialog'
import { CartItem } from '@/components/orders/CartContent'
import { VariantSelectionDialog } from '@/components/orders/VariantSelectionDialog'
import { RetailLineItemsTable } from '@/components/retail-pos/RetailLineItemsTable'
import { RetailCheckoutPanel } from '@/components/retail-pos/RetailCheckoutPanel'
import { Product } from '@/lib/api/query/products'
import { axiosInstance } from '@/lib/api/client'
import { useCreateOrderMutation } from '@/lib/api/query/orders'
import { useCustomersListQuery } from '@/lib/api/query/customers'
import { InternalProductsProductOptionResponse, POSKasirInternalOrdersRepositoryOrderType } from '@/lib/api/generated'
import { useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/$locale/_dashboard/retail-pos')({
    component: RetailPosPage,
})

async function fetchProductByCode(code: string): Promise<Product> {
    try {
        const res = await axiosInstance.get('/products/lookup', { params: { code } })
        return (res.data as { data: Product }).data
    } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status !== 404) throw err
    }
    // fallback: name search (typing product name)
    const list = await axiosInstance.get('/products', { params: { page: 1, limit: 8, search: code } })
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

    const { data: customersData } = useCustomersListQuery({ limit: 100 })
    const customers = customersData?.customers || []
    const createOrderMutation = useCreateOrderMutation()
    const queryClient = useQueryClient()

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
            prev
                .map((item) => {
                    if (item.product.id === productId && item.variant?.id === variantId) {
                        if (delta > 0 && item.quantity + delta > (item.product.stock || 0)) {
                            toast.error(t('order.errors.insufficient_stock'))
                            return item
                        }
                        const newQty = Math.max(1, item.quantity + delta)
                        return { ...item, quantity: newQty }
                    }
                    return item
                }),
        )
    }

    const removeFromCart = (productId: string, variantId?: string) => {
        setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.variant?.id === variantId)))
    }

    const calculateTotal = () =>
        cart.reduce((total, item) => {
            const price = (item.product.price || 0) + (item.variant?.additional_price || 0)
            return total + price * item.quantity
        }, 0)

    const itemCount = cart.reduce((n, item) => n + item.quantity, 0)

    const handlePay = () => {
        if (!cart.length) return
        const orderData = {
            items: cart.map((item) => ({
                product_id: item.product.id!,
                quantity: item.quantity,
                options: item.variant?.id ? [{ product_option_id: item.variant.id }] : [],
            })),
            type: POSKasirInternalOrdersRepositoryOrderType.OrderTypeTakeaway,
            customer_id: selectedCustomerId || undefined,
        }

        toast.promise(createOrderMutation.mutateAsync(orderData), {
            loading: t('order.success.creating'),
            success: (data) => {
                setCreatedOrderId(data.id || null)
                setIsPaymentOpen(true)
                return t('order.success.created')
            },
            error: t('order.errors.create_failed'),
        })
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-xl border bg-background">
            <header className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-4 py-3">
                <ScanBarcode className="h-5 w-5 text-primary" />
                <div className="flex-1">
                    <p className="text-sm font-semibold">{t('retailPos.title')}</p>
                    <p className="text-xs text-muted-foreground">{t('retailPos.subtitle')}</p>
                </div>
            </header>

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
                        />
                    </div>
                </div>

                <div className="w-[min(100%,22rem)] shrink-0 xl:w-96">
                    <RetailCheckoutPanel
                        t={t}
                        customers={customers}
                        selectedCustomerId={selectedCustomerId}
                        onCustomerChange={setSelectedCustomerId}
                        subtotal={calculateTotal()}
                        itemCount={itemCount}
                        onPay={handlePay}
                        canPay={cart.length > 0 && createOrderMutation.isAllowed}
                        paying={createOrderMutation.isPending}
                    />
                </div>
            </div>

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
                onPaymentSuccess={() => {
                    setCart([])
                    setCreatedOrderId(null)
                    void queryClient.invalidateQueries({ queryKey: ['products'] })
                    searchRef.current?.focus()
                }}
            />
        </div>
    )
}
