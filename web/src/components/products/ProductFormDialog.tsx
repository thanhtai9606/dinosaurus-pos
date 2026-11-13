import { useEffect, useRef, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import {
    type Product,
    useCreateProductMutation,
    useUpdateProductMutation,
    useUploadProductImageMutation,
    useCreateProductOptionMutation,
    useUpdateProductOptionMutation,
    useUploadProductOptionImageMutation,
    useProductDetailQuery,
    replaceProductSaleUnits,
} from '@/lib/api/query/products'
import { ProductSaleUnitsEditor } from '@/components/products/ProductSaleUnitsEditor'
import type { ProductSaleUnit } from '@/lib/retail-pos/productUnits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImageIcon, Loader2, Plus, Trash } from 'lucide-react'
import { InternalProductsCreateProductRequest, InternalProductsUpdateProductRequest } from "@/lib/api/generated";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useImageCropper } from "@/hooks/use-image-cropper.ts";
import { ImageCropperDialog } from "@/components/common/ImageCropperDialog.tsx";
import { useMoney } from '@/context/MoneyContext'
import { useQuery } from '@tanstack/react-query'
import { measurementUnitsCatalogQueryOptions } from '@/lib/api/query/measurementUnits'

import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StockHistoryTable } from "./StockHistoryTable"
import { useSuppliersListQuery } from '@/lib/api/query/suppliers'


interface VariantItem {
    id?: string
    name: string
    additional_price: number
    image_url?: string | null
    imageFile?: File | null
    isNew?: boolean
}

function normalizeCategoryIds(source?: { categories?: Array<{ id?: number | string | null }> } | null): number[] {
    return (source?.categories ?? [])
        .map((c) => Number(c.id))
        .filter((id) => Number.isFinite(id) && id > 0)
}

export function ProductFormDialog({ open, onOpenChange, productToEdit, categories }: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    productToEdit: Product | null,
    categories: any[]
}) {
    const { t } = useTranslation();
    const { currencySymbol } = useMoney()
    const createMutation = useCreateProductMutation()
    const updateMutation = useUpdateProductMutation()
    const uploadImageMutation = useUploadProductImageMutation()

    const createOptionMutation = useCreateProductOptionMutation()
    const updateOptionMutation = useUpdateProductOptionMutation()
    const uploadOptionImageMutation = useUploadProductOptionImageMutation()

    const formatError = (errors: any[]) => {
        if (!errors || errors.length === 0) return null;
        return errors.map(err => typeof err === 'object' ? ((err as any).message ?? JSON.stringify(err)) : String(err)).join(', ');
    }

    const productId = productToEdit?.id ?? ''
    const { data: detailProduct, isLoading: isLoadingDetail, isError: isDetailError } = useProductDetailQuery(productId)
    const { data: suppliersData } = useSuppliersListQuery({ limit: 100 })
    const { data: measurementUnitsPage, isError: catalogLoadError, isLoading: catalogLoading } = useQuery({
        ...measurementUnitsCatalogQueryOptions(),
        enabled: open,
        retry: 1,
    })
    const catalogUnits = measurementUnitsPage?.units ?? []

    const cropper = useImageCropper()

    const form = useForm({
        defaultValues: {
            name: '',
            category_ids: [] as number[],
            price: 0,
            cost_price: 0,
            stock: 0,
            sku: '',
            barcode: '',
            unit: 'pcs',
            min_stock: 0,
            default_supplier_id: '',
        },
        validators: {
            onChange: z.object({
                name: z.string().min(1, t('products.form.error_name_required')),
                category_ids: z.array(z.number()).min(1, t('products.form.error_category')),
                price: z.number().min(0),
                cost_price: z.number().min(0),
                stock: z.number().min(0),
                sku: z.string(),
                barcode: z.string(),
                unit: z.string(),
                min_stock: z.number().min(0),
                default_supplier_id: z.string(),
            })
        },
        onSubmit: async ({ value }) => {
            try {
                if (catalogUnits.length === 0) {
                    toast.error(t('products.sale_units.no_catalog'))
                    return
                }

                const baseUnit = saleUnits.find((u) => u.is_base)
                const listPrice = baseUnit?.sell_price ?? value.price
                if (!baseUnit?.measurement_unit_id) {
                    toast.error(t('products.sale_units.pick_unit'))
                    return
                }

                let productId = productToEdit?.id

                if (productToEdit && productId) {
                    const payload = {
                        name: value.name,
                        category_ids: value.category_ids,
                        price: Number(listPrice),
                        cost_price: Number(value.cost_price),
                        stock: Number(value.stock),
                        sku: undefined,
                        barcode: undefined,
                        unit: value.unit || 'pcs',
                        min_stock: Number(value.min_stock),
                        default_supplier_id: value.default_supplier_id || undefined,
                    } as InternalProductsUpdateProductRequest
                    await updateMutation.mutateAsync({ id: productId, body: payload })
                } else {
                    const payload = {
                        name: value.name,
                        category_ids: value.category_ids,
                        price: Number(listPrice),
                        cost_price: Number(value.cost_price),
                        stock: Number(value.stock),
                        sku: undefined,
                        barcode: undefined,
                        unit: value.unit || 'pcs',
                        min_stock: Number(value.min_stock),
                        default_supplier_id: value.default_supplier_id || undefined,
                        options: [],
                    } as InternalProductsCreateProductRequest
                    const newProduct = await createMutation.mutateAsync(payload)
                    productId = newProduct.id
                }

                if (selectedFile && productId) {
                    await uploadImageMutation.mutateAsync({ id: productId, file: selectedFile })
                }

                // Handle Variants
                if (productId) {
                    const unitsToSave = saleUnits
                        .filter((u) => Boolean(u.measurement_unit_id))
                        .map((u, index) => ({
                            ...u,
                            sell_price: u.is_base ? Number(listPrice) : u.sell_price,
                            wholesale_price: u.wholesale_price ?? 0,
                            factor_to_base: u.is_base ? 1 : u.factor_to_base,
                            sort_order: u.sort_order ?? index,
                        }))
                    if (unitsToSave.length === 0) {
                        toast.error(
                            catalogUnits.length === 0
                                ? t('products.sale_units.no_catalog')
                                : t('products.sale_units.pick_unit'),
                        )
                    } else {
                        await replaceProductSaleUnits(productId, unitsToSave)
                    }

                    for (const variant of variants) {
                        let optionId = variant.id

                        if (variant.isNew && variant.name) {
                            const newOpt = await createOptionMutation.mutateAsync({
                                productId,
                                body: {
                                    name: variant.name,
                                    additional_price: Number(variant.additional_price)
                                }
                            })
                            optionId = newOpt.id
                        } else if (optionId && variant.name) {
                            await updateOptionMutation.mutateAsync({
                                productId,
                                optionId,
                                body: {
                                    name: variant.name,
                                    additional_price: Number(variant.additional_price)
                                }
                            })
                        }

                        if (variant.imageFile && optionId) {
                            await uploadOptionImageMutation.mutateAsync({
                                productId,
                                optionId,
                                file: variant.imageFile
                            })
                        }
                    }
                }

                form.reset()
                onOpenChange(false)
                toast.success(productToEdit ? t('products.form.success_update') : t('products.form.success_create'))

            } catch (error) {
                console.error(error)
                toast.error(
                    productToEdit ? t('products.messages.update_error') : t('products.messages.create_error')
                )
            }
        }
    })

    const syncProductPriceFromBase = (units: ProductSaleUnit[]) => {
        const base = units.find((u) => u.is_base)
        if (base) {
            form.setFieldValue('price', base.sell_price)
        }
    }

    const handleSaleUnitsChange = (units: ProductSaleUnit[]) => {
        setSaleUnits(units)
        syncProductPriceFromBase(units)
    }

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [variants, setVariants] = useState<VariantItem[]>([])
    const [saleUnits, setSaleUnits] = useState<ProductSaleUnit[]>([
        { name: 'pcs', is_base: true, factor_to_base: 1, sell_price: 0, sort_order: 0 },
    ])
    const [activeCropContext, setActiveCropContext] = useState<'main' | number>('main')

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            // Need setTimeout to ensure form is fully mounted before resetting values in Tanstack Form
            setTimeout(() => {
                if (productToEdit) {
                    form.setFieldValue('name', detailProduct?.name ?? productToEdit.name ?? '')

                    const initialCategoryIds = detailProduct
                        ? normalizeCategoryIds(detailProduct)
                        : normalizeCategoryIds(productToEdit)
                    form.setFieldValue('category_ids', initialCategoryIds)

                    form.setFieldValue('price', detailProduct?.price ?? productToEdit.price ?? 0)
                    form.setFieldValue('cost_price', detailProduct?.cost_price ?? productToEdit.cost_price ?? 0)
                    form.setFieldValue('stock', detailProduct?.stock ?? productToEdit.stock ?? 0)
                    const inv = (detailProduct || productToEdit) as Record<string, unknown>
                    form.setFieldValue('unit', String(inv.unit || 'pcs'))
                    form.setFieldValue('min_stock', Number(inv.min_stock ?? 0))
                    form.setFieldValue('default_supplier_id', String(inv.default_supplier_id ?? ''))

                    setPreview(detailProduct?.image_url ?? productToEdit.image_url ?? null)

                    const options = detailProduct?.options || []
                    setVariants(options.map(opt => ({
                        id: opt.id,
                        name: opt.name || '',
                        additional_price: opt.additional_price || 0,
                        image_url: opt.image_url,
                        isNew: false
                    })))

                    const dp = detailProduct as Product & { sale_units?: ProductSaleUnit[] }
                    if (dp?.sale_units?.length) {
                        setSaleUnits(dp.sale_units)
                        syncProductPriceFromBase(dp.sale_units)
                    } else {
                        const legacyUnits = [
                            {
                                name: String(inv.unit || 'pcs'),
                                is_base: true,
                                factor_to_base: 1,
                                sell_price: Number(detailProduct?.price ?? productToEdit.price ?? 0),
                                wholesale_price: 0,
                                barcode: String(inv.barcode ?? '') || null,
                                sku: String(inv.sku ?? '') || null,
                                sort_order: 0,
                            },
                        ]
                        setSaleUnits(legacyUnits)
                        syncProductPriceFromBase(legacyUnits)
                    }
                } else {
                    form.reset()
                    setPreview(null)
                    setSelectedFile(null)
                    setVariants([])
                    const pcs = catalogUnits[0]
                    const initialUnits = [
                        {
                            measurement_unit_id: pcs?.id,
                            name: pcs?.name ?? 'pcs',
                            is_base: true,
                            factor_to_base: 1,
                            sell_price: 0,
                            wholesale_price: 0,
                            sort_order: 0,
                        },
                    ]
                    setSaleUnits(initialUnits)
                    syncProductPriceFromBase(initialUnits)
                }
            }, 0)
            setActiveCropContext('main')
        }
    }, [open, productToEdit, detailProduct, catalogUnits])

    const handleCropSuccess = (file: File) => {
        if (activeCropContext === 'main') {
            setSelectedFile(file)
            setPreview(URL.createObjectURL(file))
        } else {
            const index = activeCropContext
            setVariants(prev => {
                const newVariants = [...prev]
                newVariants[index] = {
                    ...newVariants[index],
                    imageFile: file,
                    image_url: URL.createObjectURL(file)
                }
                return newVariants
            })
        }
    }

    const handleAddVariant = () => {
        setVariants([...variants, { name: '', additional_price: 0, isNew: true }])
    }

    const handleRemoveVariant = (index: number) => {
        if (variants[index].isNew) {
            setVariants(variants.filter((_, i) => i !== index))
        } else {
            toast.error(t('products.form.error_delete_variant'))
        }
    }

    const handleVariantChange = (index: number, field: keyof VariantItem, value: any) => {
        setVariants(prev => {
            const newVariants = [...prev]
            newVariants[index] = { ...newVariants[index], [field]: value }
            return newVariants
        })
    }

    const triggerVariantImageUpload = (index: number) => {
        setActiveCropContext(index)

        setTimeout(() => fileInputRef.current?.click(), 0)
    }

    const triggerMainImageUpload = () => {
        setActiveCropContext('main')
        setTimeout(() => fileInputRef.current?.click(), 0)
    }



    const isSubmitting = createMutation.isPending ||
        updateMutation.isPending ||
        uploadImageMutation.isPending ||
        createOptionMutation.isPending ||
        updateOptionMutation.isPending ||
        uploadOptionImageMutation.isPending

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    size="full"
                    dismissible
                    scrollable={false}
                    className="flex h-[min(92vh,920px)] max-h-[92vh] flex-col gap-0 overflow-hidden p-0"
                >
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>{productToEdit ? t('products.form.title_edit') : t('products.form.title_create')}</DialogTitle>
                        <DialogDescription>
                            {t('products.form.desc')}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Scrollable Content Area */}
                    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-2">
                        {productToEdit && isLoadingDetail ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : productToEdit && isDetailError ? (
                            <div className="py-8 text-center text-sm text-destructive">
                                {t('products.messages.load_detail_error')}
                            </div>
                        ) : (
                            <Tabs defaultValue="details" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="details">{t('products.form.tab_details')}</TabsTrigger>
                                    <TabsTrigger value="history" disabled={!productToEdit}>{t('products.form.tab_history')}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="details" className="mt-4 space-y-4">
                                    <form id="product-form" onSubmit={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        form.handleSubmit()
                                    }} className="space-y-8 py-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={cropper.onFileChange}
                                        />

                                        <section className="space-y-4">
                                            <h3 className="text-sm font-semibold tracking-tight">
                                                {t('products.form.section_basics')}
                                            </h3>
                                            <div className="grid gap-6 lg:grid-cols-[minmax(10rem,12rem)_1fr]">
                                                <div className="flex flex-col items-center gap-3 lg:items-start">
                                                    <Avatar
                                                        className="h-28 w-28 cursor-pointer border-2 border-muted transition-opacity hover:opacity-80"
                                                        onClick={triggerMainImageUpload}
                                                    >
                                                        <AvatarImage src={preview || undefined} className="object-cover" />
                                                        <AvatarFallback className="bg-muted">
                                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full max-w-[12rem]"
                                                        onClick={triggerMainImageUpload}
                                                    >
                                                        {preview ? t('products.form.change_image') : t('products.form.upload_image')}
                                                    </Button>
                                                </div>
                                                <div className="grid min-w-0 gap-4">
                                                    <form.Field
                                                        name="name"
                                                        children={(field) => (
                                                            <div className="space-y-2">
                                                                <Label htmlFor={field.name}>{t('products.form.name')}</Label>
                                                                <Input
                                                                    id={field.name}
                                                                    name={field.name}
                                                                    value={field.state.value}
                                                                    onBlur={field.handleBlur}
                                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                                />
                                                                {field.state.meta.errors.length > 0 && (
                                                                    <p className="text-sm font-medium text-destructive">
                                                                        {formatError(field.state.meta.errors)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    />
                                                    <form.Field
                                                        name="category_ids"
                                                        children={(field) => (
                                                            <div className="space-y-2">
                                                                <Label>{t('products.form.category')}</Label>
                                                                <div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-3">
                                                                    {categories.map((cat: any) => (
                                                                        <div key={cat.id} className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id={`cat-${cat.id}`}
                                                                                checked={(field.state.value ?? []).includes(Number(cat.id))}
                                                                                onCheckedChange={(checked) => {
                                                                                    const catId = Number(cat.id)
                                                                                    const current = (field.state.value ?? []) as number[]
                                                                                    if (checked) {
                                                                                        if (current.includes(catId)) return
                                                                                        field.handleChange([...current, catId])
                                                                                    } else {
                                                                                        field.handleChange(current.filter((id) => id !== catId))
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <label
                                                                                htmlFor={`cat-${cat.id}`}
                                                                                className="cursor-pointer text-sm font-medium leading-none"
                                                                            >
                                                                                {cat.name}
                                                                            </label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {field.state.meta.errors.length > 0 && (
                                                                    <p className="text-sm font-medium text-destructive">
                                                                        {formatError(field.state.meta.errors)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    />
                                                    {(productToEdit?.code || (detailProduct as { code?: string })?.code) ? (
                                                        <div className="space-y-2">
                                                            <Label>{t('products.fields.code', 'P-code')}</Label>
                                                            <Input
                                                                className="font-mono"
                                                                readOnly
                                                                value={
                                                                    productToEdit?.code ??
                                                                    (detailProduct as { code?: string })?.code ??
                                                                    ''
                                                                }
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">{t('products.form.code_auto')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4 rounded-lg border bg-muted/15 p-4">
                                            <h3 className="text-sm font-semibold tracking-tight">
                                                {t('products.form.section_inventory')}
                                            </h3>
                                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                                <form.Field
                                                    name="stock"
                                                    children={(field) => (
                                                        <div className="space-y-2">
                                                            <Label htmlFor={field.name}>{t('products.form.stock')}</Label>
                                                            <Input
                                                                id={field.name}
                                                                name={field.name}
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={field.state.value ? field.state.value.toLocaleString('id-ID') : ''}
                                                                onBlur={field.handleBlur}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, '')
                                                                    field.handleChange(Number(val))
                                                                }}
                                                                placeholder="0"
                                                            />
                                                            {field.state.meta.errors.length > 0 && (
                                                                <p className="text-sm font-medium text-destructive">
                                                                    {formatError(field.state.meta.errors)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                />
                                                <form.Field
                                                    name="min_stock"
                                                    children={(field) => (
                                                        <div className="space-y-2">
                                                            <Label>{t('products.fields.min_stock')}</Label>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={field.state.value}
                                                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                                            />
                                                        </div>
                                                    )}
                                                />
                                                <form.Field
                                                    name="cost_price"
                                                    children={(field) => (
                                                        <div className="space-y-2">
                                                            <Label htmlFor={field.name}>{t('products.form.cost_price')}</Label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                                                                    {currencySymbol}
                                                                </span>
                                                                <Input
                                                                    id={field.name}
                                                                    name={field.name}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={
                                                                        field.state.value
                                                                            ? field.state.value.toLocaleString('id-ID')
                                                                            : ''
                                                                    }
                                                                    onBlur={field.handleBlur}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.replace(/\D/g, '')
                                                                        field.handleChange(Number(val))
                                                                    }}
                                                                    className="pl-9"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            {field.state.meta.errors.length > 0 && (
                                                                <p className="text-sm font-medium text-destructive">
                                                                    {formatError(field.state.meta.errors)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                />
                                                <form.Field
                                                    name="default_supplier_id"
                                                    children={(field) => (
                                                        <div className="space-y-2 sm:col-span-2 xl:col-span-1">
                                                            <Label>{t('products.fields.default_supplier')}</Label>
                                                            <select
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                value={field.state.value}
                                                                onChange={(e) => field.handleChange(e.target.value)}
                                                            >
                                                                <option value="">{t('products.fields.no_supplier')}</option>
                                                                {(suppliersData?.suppliers || []).map((s) => (
                                                                    <option key={s.id} value={s.id}>
                                                                        {s.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                />
                                            </div>
                                        </section>

                                        {catalogLoading ? (
                                            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                                        ) : catalogLoadError ? (
                                            <p className="text-sm text-destructive">{t('products.sale_units.catalog_load_failed')}</p>
                                        ) : (
                                            <ProductSaleUnitsEditor
                                                units={saleUnits}
                                                onChange={handleSaleUnitsChange}
                                                catalog={catalogUnits}
                                                t={t}
                                                currencySymbol={currencySymbol}
                                            />
                                        )}

                                        <section className="space-y-4 rounded-lg border p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-sm font-semibold tracking-tight">
                                                    {t('products.form.section_variants')}
                                                </h3>
                                                <Button type="button" variant="outline" size="sm" onClick={handleAddVariant}>
                                                    <Plus className="mr-2 h-3 w-3" /> {t('products.form.add_variant')}
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {variants.map((variant, index) => (
                                                    <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                                                        {/* Variant Image */}
                                                        <div
                                                            className="h-12 w-12 shrink-0 border rounded-md cursor-pointer hover:opacity-80 flex items-center justify-center bg-muted"
                                                            onClick={() => triggerVariantImageUpload(index)}
                                                        >
                                                            {variant.image_url ? (
                                                                <img src={variant.image_url} alt="" className="h-full w-full object-cover rounded-md" />
                                                            ) : (
                                                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 flex-1">
                                                            <div className="space-y-1">
                                                                <Input
                                                                    placeholder={t('products.form.variant_name')}
                                                                    value={variant.name}
                                                                    onChange={e => handleVariantChange(index, "name", e.target.value)}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="space-y-1 relative">
                                                                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">{currencySymbol}</span>
                                                                <Input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    placeholder={t('products.form.additional_price')}
                                                                    className="pl-8"
                                                                    value={variant.additional_price ? variant.additional_price.toLocaleString('id-ID') : ''}
                                                                    onChange={e => {
                                                                        const val = e.target.value.replace(/\D/g, '')
                                                                        handleVariantChange(index, "additional_price", Number(val))
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive"
                                                            onClick={() => handleRemoveVariant(index)}
                                                            disabled={!variant.isNew}
                                                            title={!variant.isNew ? t('products.form.error_delete_variant') : t('products.actions.delete')}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {variants.length === 0 && (
                                                    <p className="py-2 text-center text-sm text-muted-foreground">
                                                        {t('products.form.no_variants')}
                                                    </p>
                                                )}
                                            </div>
                                        </section>
                                    </form>
                                </TabsContent>
                                <TabsContent value="history" className="mt-4">
                                    {productToEdit && <StockHistoryTable productId={productToEdit.id!} />}
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                    {(!productToEdit || (!isLoadingDetail && !isDetailError)) && (
                        <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmittingForm]) => (
                                    <Button
                                        type="submit"
                                        form="product-form"
                                        disabled={
                                            !canSubmit ||
                                            isSubmittingForm ||
                                            isSubmitting ||
                                            (!!productToEdit && isLoadingDetail)
                                        }
                                    >
                                        {isSubmitting || isSubmittingForm ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('products.form.saving')}
                                            </>
                                        ) : (
                                            t('products.form.save')
                                        )}
                                    </Button>
                                )}
                            />
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog >

            <ImageCropperDialog
                open={cropper.isDialogOpen}
                onOpenChange={cropper.setIsDialogOpen}
                imageSrc={cropper.imageSrc}
                crop={cropper.crop}
                zoom={cropper.zoom}
                setCrop={cropper.setCrop}
                setZoom={cropper.setZoom}
                onCropComplete={cropper.onCropComplete}
                onSave={() => cropper.onCropSave(handleCropSuccess)}
                aspectRatio={1}
            />
        </>


    )
}