import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Supplier, useCreateSupplierMutation, useUpdateSupplierMutation } from '@/lib/api/query/suppliers'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

export function SupplierFormDialog({
    open,
    onOpenChange,
    supplierToEdit,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    supplierToEdit: Supplier | null
}) {
    const { t } = useTranslation()
    const createMutation = useCreateSupplierMutation()
    const updateMutation = useUpdateSupplierMutation()

    const form = useForm({
        defaultValues: {
            code: '',
            name: '',
            phone: '',
            email: '',
            address: '',
            tax_id: '',
            notes: '',
            is_active: true,
        },
        validators: {
            onChange: z.object({
                name: z.string().min(1),
                code: z.string(),
                phone: z.string(),
                email: z.string(),
                address: z.string(),
                tax_id: z.string(),
                notes: z.string(),
                is_active: z.boolean(),
            }),
        },
        onSubmit: async ({ value }) => {
            const body = {
                code: value.code || undefined,
                name: value.name,
                phone: value.phone || undefined,
                email: value.email || undefined,
                address: value.address || undefined,
                tax_id: value.tax_id || undefined,
                notes: value.notes || undefined,
                is_active: value.is_active,
            }
            if (supplierToEdit?.id) {
                await updateMutation.mutateAsync({ id: supplierToEdit.id, body })
            } else {
                await createMutation.mutateAsync(body)
            }
            form.reset()
            onOpenChange(false)
        },
    })

    useEffect(() => {
        if (!open) return
        form.setFieldValue('code', supplierToEdit?.code ?? '')
        form.setFieldValue('name', supplierToEdit?.name ?? '')
        form.setFieldValue('phone', supplierToEdit?.phone ?? '')
        form.setFieldValue('email', supplierToEdit?.email ?? '')
        form.setFieldValue('address', supplierToEdit?.address ?? '')
        form.setFieldValue('tax_id', supplierToEdit?.tax_id ?? '')
        form.setFieldValue('notes', supplierToEdit?.notes ?? '')
        form.setFieldValue('is_active', supplierToEdit?.is_active ?? true)
    }, [open, supplierToEdit])

    const pending = createMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" dismissible>
                <DialogHeader>
                    <DialogTitle>
                        {supplierToEdit ? t('suppliers.form.edit_title') : t('suppliers.form.create_title')}
                    </DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        form.handleSubmit()
                    }}
                    className="space-y-3"
                >
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>{t('suppliers.fields.code')}</Label>
                            <form.Field name="code">{(f) => <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}</form.Field>
                        </div>
                        <div>
                            <Label>{t('suppliers.fields.name')} *</Label>
                            <form.Field name="name">{(f) => <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}</form.Field>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>{t('suppliers.fields.phone')}</Label>
                            <form.Field name="phone">{(f) => <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}</form.Field>
                        </div>
                        <div>
                            <Label>{t('suppliers.fields.email')}</Label>
                            <form.Field name="email">{(f) => <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}</form.Field>
                        </div>
                    </div>
                    <div>
                        <Label>{t('suppliers.fields.address')}</Label>
                        <form.Field name="address">{(f) => <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}</form.Field>
                    </div>
                    <div>
                        <Label>{t('suppliers.fields.tax_id')}</Label>
                        <form.Field name="tax_id">{(f) => <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}</form.Field>
                    </div>
                    <div className="flex items-center gap-2">
                        <form.Field name="is_active">
                            {(f) => (
                                <>
                                    <Checkbox checked={f.state.value} onCheckedChange={(v) => f.handleChange(!!v)} />
                                    <Label>{t('suppliers.fields.is_active')}</Label>
                                </>
                            )}
                        </form.Field>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={pending}>
                            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
