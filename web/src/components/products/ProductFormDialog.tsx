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
import { measurementUnitsListQueryOptions } from '@/lib/api/query/measurementUnits'

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
    const { data: measurementUnitsPage } = useQuery({
        ...measurementUnitsListQueryOptions({ page: 1, limit: 200 }),
        enabled: open,
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
                let productId = productToEdit?.id

                if (productToEdit && productId) {
                    const payload = {
                        name: value.name,
                        category_ids: value.category_ids,
                        price: Number(value.price),
                        cost_price: Number(value.cost_price),
                        stock: Number(value.stock),
                        sku: value.sku || undefined,
                        barcode: value.barcode || undefined,
                        unit: value.unit || 'pcs',
                        min_stock: Number(value.min_stock),
                        default_supplier_id: value.default_supplier_id || undefined,
                    } as InternalProductsUpdateProductRequest
                    await updateMutation.mutateAsync({ id: productId, body: payload })
                } else {
                    const payload = {
                        name: value.name,
                        category_ids: value.category_ids,
                        price: Number(value.price),
                        cost_price: Number(value.cost_price),
                        stock: Number(value.stock),
                        sku: value.sku || undefined,
                        barcode: value.barcode || undefined,
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
                        .map((u, index) => {
                            if (u.is_base) {
                                return {
                                    ...u,
                                    name: value.unit || u.name || 'pcs',
                                    sell_price: Number(value.price),
                                    barcode: value.barcode || null,
                                    sku: value.sku || null,
                                    factor_to_base: 1,
                                    sort_order: 0,
                                }
                            }
                            return { ...u, sort_order: u.sort_order ?? index }
                        })
                        .filter((u) => u.is_base || u.name.trim().length > 0)
                    await replaceProductSaleUnits(productId, unitsToSave)

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
                    form.setFieldValue('sku', String(inv.sku ?? ''))
                    form.setFieldValue('barcode', String(inv.barcode ?? ''))
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
                    } else {
                        setSaleUnits([
                            {
                                name: String(inv.unit || 'pcs'),
                                is_base: true,
                                factor_to_base: 1,
                                sell_price: Number(detailProduct?.price ?? productToEdit.price ?? 0),
                                barcode: String(inv.barcode ?? '') || null,
                                sku: String(inv.sku ?? '') || null,
                                sort_order: 0,
                            },
                        ])
                    }
                } else {
                    form.reset()
                    setPreview(null)
                    setSelectedFile(null)
                    setVariants([])
                    setSaleUnits([{ name: 'pcs', is_base: true, factor_to_base: 1, sell_price: 0, sort_order: 0 }])
                }
            }, 0)
            setActiveCropContext('main')
        }
    }, [open, productToEdit, detailProduct])

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
                <DialogContent size="lg" dismissible scrollable className="h-[80vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>{productToEdit ? t('products.form.title_edit') : t('products.form.title_create')}</DialogTitle>
                        <DialogDescription>
                            {t('products.form.desc')}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto px-6 py-2">
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
                                    }} className="grid gap-6 py-4">
                                        {/* Image Upload Section */}
                                        <div className="flex flex-col items-center gap-4">
                                            <Avatar
                                                className="h-24 w-24 border-2 border-muted cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={triggerMainImageUpload}>
                                                <AvatarImage src={preview || undefined} className="object-cover" />
                                                <AvatarFallback className="bg-muted">
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={triggerMainImageUpload}
                                            >
                                                {preview ? t('products.form.change_image') : t('products.form.upload_image')}
                                            </Button>

                                            {/* Input File Hidden terhubung ke hook */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={cropper.onFileChange}
                                            />
                                        </div>


                                        <div className="grid gap-4">
                                            {/* Name */}
                                            <form.Field
                                                name="name"
                                                children={(field) => (
                                                    <div className="grid grid-cols-4 items-start gap-4">
                                                        <Label htmlFor={field.name} className="text-right mt-3:">{t('products.form.name')}</Label>
                                                        <div className="col-span-3 space-y-1">
                                                            <Input
                                                                id={field.name}
                                                                name={field.name}
                                                                value={field.state.value}
                                                                onBlur={field.handleBlur}
                                                                onChange={e => field.handleChange(e.target.value)}
                                                            />
                                                            {field.state.meta.errors.length > 0 && (
                                                                <p className="text-sm font-medium text-destructive">{formatError(field.state.meta.errors)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            />

                                            {/* Category Multi-Select */}
                                            <form.Field
                                                name="category_ids"
                                                children={(field) => (
                                                    <div className="grid grid-cols-4 items-start gap-4">
                                                        <Label className="text-right mt-3">{t('products.form.category')}</Label>
                                                        <div className="col-span-3 space-y-2">
                                                            <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-[150px] overflow-y-auto">
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
                                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                                        >
                                                                            {cat.name}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {field.state.meta.errors.length > 0 && (
                                                                <p className="text-sm font-medium text-destructive">{formatError(field.state.meta.errors)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            />

                                            {/* Price */}
                                            <form.Field
                                                name="price"
                                                children={(field) => (
                                                    <div className="grid grid-cols-4 items-start gap-4">
                                                        <Label htmlFor={field.name} className="text-right mt-3">{t('products.form.price')}</Label>
                                                        <div className="col-span-3 space-y-1">
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">{currencySymbol}</span>
                                                                <Input
                                                                    id={field.name}
                                                                    name={field.name}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={field.state.value ? field.state.value.toLocaleString('id-ID') : ''}
                                                                    onBlur={field.handleBlur}
                                                                    onChange={e => {
                                                                        const val = e.target.value.replace(/\D/g, '')
                                                                        field.handleChange(Number(val))
                                                                    }}
                                                                    className="pl-9"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            {field.state.meta.errors.length > 0 && (
                                                                <p className="text-sm font-medium text-destructive">{formatError(field.state.meta.errors)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            />

                                            {/* Cost Price */}
                                            <form.Field
                                                name="cost_price"
                                                children={(field) => (
                                                    <div className="grid grid-cols-4 items-start gap-4">
                                                        <Label htmlFor={field.name} className="text-right mt-3">{t('products.form.cost_price')}</Label>
                                                        <div className="col-span-3 space-y-1">
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">{currencySymbol}</span>
                                                                <Input
                                                                    id={field.name}
                                                                    name={field.name}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={field.state.value ? field.state.value.toLocaleString('id-ID') : ''}
                                                                    onBlur={field.handleBlur}
                                                                    onChange={e => {
                                                                        const val = e.target.value.replace(/\D/g, '')
                                                                        field.handleChange(Number(val))
                                                                    }}
                                                                    className="pl-9"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            {field.state.meta.errors.length > 0 && (
                                                                <p className="text-sm font-medium text-destructive">{formatError(field.state.meta.errors)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            />

                                            {/* Stock */}
                                            <form.Field
                                                name="stock"
                                                children={(field) => (
                                                    <div className="grid grid-cols-4 items-start gap-4">
                                                        <Label htmlFor={field.name} className="text-right mt-3">{t('products.form.stock')}</Label>
                                                        <div className="col-span-3 space-y-1">
                                                            <Input
                                                                id={field.name}
                                                                name={field.name}
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={field.state.value ? field.state.value.toLocaleString('id-ID') : ''}
                                                                onBlur={field.handleBlur}
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(/\D/g, '')
                                                                    field.handleChange(Number(val))
                                                                }}
                                                                placeholder="0"
                                                            />
                                                            {field.state.meta.errors.length > 0 && (
                                                                <p className="text-sm font-medium text-destructive">{formatError(field.state.meta.errors)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            />

                                            <form.Field
                                                name="sku"
                                                children={(field) => (
                                                    <div className="grid grid-cols-4 items-start gap-4">
                                                        <Label className="text-right mt-3">{t('products.fields.sku')}</Label>
                                                        <Input className="col-span-3" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                                                    </div>
                                                )}
                                            />
                                            <form.Field
                                                name="barcode"
                                                children={(field) => (
                                                    <div className="grid grid-cols-4 items-start gap-4">
                                                        <Label className="text-right mt-3">{t('products.fields.barcode')}</Label>
                                                        <Input className="col-span-3" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                                                    </div>
                                                )}
                                            />
                                            <form.Field
                                                name="unit"
                                                children={(field) => (
                                                    <div className="grid grid-cols-4 items-start gap-4">
                                                        <Label className="text-right mt-3">{t('products.fields.unit')}</Label>
                                                        <div className="col-span-3">
                                                            <Input
                                                                className="w-full"
                                                                list="product-measurement-units"
                                                                value={field.state.value}
                                                                onChange={(e) => field.handleChange(e.target.value)}
                                                                placeholder={t('measurementUnits.fields.code', 'PCS')}
                                                            />
                                                            <datalist id="product-measurement-units">
                                                                {catalogUnits.map((u) => (
                                                                    <option key={u.id} value={u.code}>
                                                                        {u.name}
                                                                    </option>
                                                                ))}
                                                            </datalist>
                                                        </div>
                                                    </div>
                                                )}
                                            />
                                            <form.Field
                                                name="min_stock"
                                                children={(field) => (
                                                    <div className="grid grid-cols-4 items-start gap-4">
                                                        <Label className="text-right mt-3">{t('products.fields.min_stock')}</Label>
                                                        <Input
                                                            className="col-span-3"
                                                            type="number"
                                                            min={0}
                                                            value={field.state.value}
                                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                                        />
                                                    </div>
                                                )}
                                            />
                                            <form.Field
                                                name="default_supplier_id"
                                                children={(field) => (
                                                    <div className="grid grid-cols-4 items-start gap-4">
                                                        <Label className="text-right mt-3">{t('products.fields.default_supplier')}</Label>
                                                        <select
                                                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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


                                        <ProductSaleUnitsEditor units={saleUnits} onChange={setSaleUnits} t={t} />

                                        {/* Variants Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label>{t('products.form.variants')}</Label>
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
                                                    <p className="text-sm text-center text-muted-foreground py-2">{t('products.form.no_variants')}</p>
                                                )}
                                            </div>
                                        </div>
                                    </form>
                                    <DialogFooter className="pt-2">
                                        <form.Subscribe
                                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                                            children={([canSubmit, isSubmittingForm]) => (
                                                <Button type="submit" form="product-form" disabled={!canSubmit || isSubmittingForm || isSubmitting || (!!productToEdit && isLoadingDetail)}>
                                                    {isSubmitting || isSubmittingForm ? (
                                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('products.form.saving')}</>
                                                    ) : (
                                                        t('products.form.save')
                                                    )}
                                                </Button>
                                            )}
                                        />
                                    </DialogFooter>
                                </TabsContent>
                                <TabsContent value="history" className="mt-4">
                                    {productToEdit && <StockHistoryTable productId={productToEdit.id!} />}
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
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