import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { CustomerGroup, useCreateCustomerGroupMutation, useUpdateCustomerGroupMutation } from '@/lib/api/query/customerGroups'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function CustomerGroupFormDialog({
    open,
    onOpenChange,
    groupToEdit,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    groupToEdit: CustomerGroup | null
}) {
    const { t } = useTranslation()
    const createMutation = useCreateCustomerGroupMutation()
    const updateMutation = useUpdateCustomerGroupMutation()

    const form = useForm({
        defaultValues: {
            code: '',
            name: '',
            description: '',
        },
        validators: {
            onChange: z.object({
                code: z.string().min(1),
                name: z.string().min(1),
                description: z.string(),
            }),
        },
        onSubmit: async ({ value }) => {
            const body = {
                code: value.code.trim(),
                name: value.name.trim(),
                description: value.description.trim() || undefined,
            }
            if (groupToEdit?.id) {
                await updateMutation.mutateAsync({ id: groupToEdit.id, body })
            } else {
                await createMutation.mutateAsync(body)
            }
            form.reset()
            onOpenChange(false)
        },
    })

    useEffect(() => {
        if (!open) return
        form.setFieldValue('code', groupToEdit?.code ?? '')
        form.setFieldValue('name', groupToEdit?.name ?? '')
        form.setFieldValue('description', groupToEdit?.description ?? '')
    }, [open, groupToEdit, form])

    const pending = createMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {groupToEdit
                            ? t('customerGroups.form.edit_title')
                            : t('customerGroups.form.create_title')}
                    </DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        void form.handleSubmit()
                    }}
                    className="space-y-4"
                >
                    <form.Field
                        name="code"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>{t('customerGroups.fields.code')} *</Label>
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
                        name="name"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>{t('customerGroups.fields.name')} *</Label>
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
                        name="description"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>{t('customerGroups.fields.description')}</Label>
                                <Textarea
                                    id={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        )}
                    />
                    <DialogFooter>
                        <Button type="submit" disabled={pending}>
                            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('common.save', 'Save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
