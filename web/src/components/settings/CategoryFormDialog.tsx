import { InternalCategoriesCreateCategoryRequest } from "@/lib/api/generated"
import { Category, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from "@/lib/api/query/categories"
import { Loader2, Trash2 } from "lucide-react"
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
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
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"




export function CategoryFormDialog({
    open,
    onOpenChange,
    categoryToEdit,
    onDeleted,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    categoryToEdit: Category | null
    onDeleted?: () => void
}) {
    const { t } = useTranslation()
    const createMutation = useCreateCategoryMutation()
    const updateMutation = useUpdateCategoryMutation()
    const deleteMutation = useDeleteCategoryMutation()
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const canDelete = deleteMutation.isAllowed && categoryToEdit?.id

    const form = useForm({
        defaultValues: {
            name: ''
        },
        validators: {
            onChange: z.object({
                name: z.string().min(1)
            })
        },
        onSubmit: async ({ value }) => {
            const payload: InternalCategoriesCreateCategoryRequest = {
                name: value.name
            }

            try {
                if (categoryToEdit && categoryToEdit.id) {
                    await updateMutation.mutateAsync({ id: categoryToEdit.id, body: payload })
                } else {
                    await createMutation.mutateAsync(payload)
                }
                onOpenChange(false)
                form.reset()
            } catch (error) {
                console.error(error)
            }
        }
    })

    useEffect(() => {
        if (open) {
            if (categoryToEdit) {
                form.setFieldValue('name', categoryToEdit.name || '')
            } else {
                form.reset()
            }
        }
    }, [open, categoryToEdit])

    const handleDelete = async () => {
        if (!categoryToEdit?.id) return
        try {
            await deleteMutation.mutateAsync(categoryToEdit.id)
            setDeleteConfirmOpen(false)
            onOpenChange(false)
            onDeleted?.()
        } catch {
            /* toast from mutation */
        }
    }

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{categoryToEdit ? t('settings.category.form.title_edit') : t('settings.category.form.title_add')}</DialogTitle>
                    <DialogDescription>
                        {categoryToEdit ? t('settings.category.form.desc_edit') : t('settings.category.form.desc_add')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}>
                    <div className="grid gap-4 py-4">
                        <form.Field
                            name="name"
                            children={(field) => (
                                <div className="grid gap-2">
                                    <Label htmlFor={field.name}>{t('settings.category.form.name_label')}</Label>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder={t('settings.category.form.name_placeholder')}
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                        <em role="alert" className="text-sm font-medium text-destructive">
                                            {field.state.meta.errors.map(err => typeof err === 'object' ? ((err as any).message ?? JSON.stringify(err)) : String(err)).join(', ')}
                                        </em>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:justify-between">
                        {canDelete ? (
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={deleteMutation.isPending}
                                onClick={() => setDeleteConfirmOpen(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('settings.category.actions.delete')}
                            </Button>
                        ) : (
                            <span />
                        )}
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                                <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending || updateMutation.isPending}>
                                    {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('settings.category.form.saving')}</>
                                    ) : (
                                        t('settings.category.form.save')
                                    )}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.category.actions.delete_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('settings.category.actions.delete_confirm')}{' '}
                        <span className="font-semibold text-foreground">&quot;{categoryToEdit?.name}&quot;</span>?
                        {t('settings.category.actions.delete_warning')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteMutation.isPending}>{t('settings.category.actions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={deleteMutation.isPending}
                        onClick={(e) => {
                            e.preventDefault()
                            void handleDelete()
                        }}
                    >
                        {deleteMutation.isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('settings.category.actions.deleting')}</>
                        ) : (
                            t('settings.category.actions.delete_button')
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}