import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import {
    MeasurementUnit,
    useCreateMeasurementUnitMutation,
    useUpdateMeasurementUnitMutation,
    useDeleteMeasurementUnitMutation,
} from '@/lib/api/query/measurementUnits'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'

export function MeasurementUnitFormDialog({
    open,
    onOpenChange,
    unitToEdit,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    unitToEdit: MeasurementUnit | null
}) {
    const { t } = useTranslation()
    const createMutation = useCreateMeasurementUnitMutation()
    const updateMutation = useUpdateMeasurementUnitMutation()
    const deleteMutation = useDeleteMeasurementUnitMutation()
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const canDelete = deleteMutation.isAllowed && unitToEdit?.id

    const form = useForm({
        defaultValues: { name: '' },
        validators: {
            onChange: z.object({
                name: z.string().min(1).max(100),
            }),
        },
        onSubmit: async ({ value }) => {
            const body = { name: value.name.trim() }
            if (unitToEdit?.id) {
                await updateMutation.mutateAsync({ id: unitToEdit.id, body })
            } else {
                await createMutation.mutateAsync(body)
            }
            form.reset()
            onOpenChange(false)
        },
    })

    useEffect(() => {
        if (!open) return
        form.setFieldValue('name', unitToEdit?.name ?? '')
    }, [open, unitToEdit, form])

    const pending = createMutation.isPending || updateMutation.isPending

    const handleDelete = async () => {
        if (!unitToEdit?.id) return
        try {
            await deleteMutation.mutateAsync(unitToEdit.id)
            setDeleteConfirmOpen(false)
            onOpenChange(false)
        } catch {
            /* toast */
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {unitToEdit ? t('measurementUnits.form.edit_title') : t('measurementUnits.form.create_title')}
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
                            name="name"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>{t('measurementUnits.fields.name')}</Label>
                                    <Input
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder={t('measurementUnits.fields.name_placeholder')}
                                    />
                                </div>
                            )}
                        />
                        <DialogFooter className="gap-2 sm:justify-between">
                            {canDelete ? (
                                <Button type="button" variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('common.delete')}
                                </Button>
                            ) : (
                                <span />
                            )}
                            <Button type="submit" disabled={pending}>
                                {pending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    t('common.save')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('measurementUnits.delete.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('measurementUnits.delete.body', { name: unitToEdit?.name ?? '' })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={(e) => {
                                e.preventDefault()
                                void handleDelete()
                            }}
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
