import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    useWarehousesListQuery,
    useCreateWarehouseMutation,
    useUpdateWarehouseMutation,
    useDeleteWarehouseMutation,
    type Warehouse,
} from '@/lib/api/query/warehouses'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_dashboard/warehouses')({
    component: WarehousesPage,
})

function apiErrorMessage(err: unknown, fallback: string) {
    return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback
}

function WarehousesPage() {
    const { t } = useTranslation()
    const { data } = useWarehousesListQuery({ limit: 50, page: 1 })
    const createMut = useCreateWarehouseMutation()
    const updateMut = useUpdateWarehouseMutation()
    const deleteMut = useDeleteWarehouseMutation()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null)
    const [selected, setSelected] = useState<Warehouse | null>(null)
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [isDefault, setIsDefault] = useState(false)
    const [isActive, setIsActive] = useState(true)

    const isEdit = selected !== null
    const canSave = isEdit ? updateMut.isAllowed : createMut.isAllowed
    const saving = createMut.isPending || updateMut.isPending

    useEffect(() => {
        if (!dialogOpen) return
        if (selected) {
            setCode(selected.code)
            setName(selected.name)
            setIsDefault(selected.is_default)
            setIsActive(selected.is_active)
        } else {
            setCode('')
            setName('')
            setIsDefault(false)
            setIsActive(true)
        }
    }, [dialogOpen, selected])

    const openCreate = () => {
        setSelected(null)
        setDialogOpen(true)
    }

    const openEdit = (w: Warehouse) => {
        if (!updateMut.isAllowed) return
        setSelected(w)
        setDialogOpen(true)
    }

    const save = async () => {
        const c = code.trim()
        const n = name.trim()
        if (!c || !n) {
            toast.error(t('warehouses.validation_required'))
            return
        }
        try {
            if (isEdit && selected) {
                await updateMut.mutateAsync({
                    id: selected.id,
                    body: { code: c, name: n, is_default: isDefault, is_active: isActive },
                })
                toast.success(t('warehouses.updated'))
            } else {
                await createMut.mutateAsync({ code: c, name: n, is_default: isDefault, is_active: isActive })
                toast.success(t('warehouses.created'))
            }
            setDialogOpen(false)
            setSelected(null)
        } catch (err: unknown) {
            toast.error(
                apiErrorMessage(err, isEdit ? t('warehouses.update_failed') : t('warehouses.create_failed')),
            )
        }
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        try {
            await deleteMut.mutateAsync(deleteTarget.id)
            toast.success(t('warehouses.deleted'))
            setDeleteTarget(null)
            if (selected?.id === deleteTarget.id) {
                setDialogOpen(false)
                setSelected(null)
            }
        } catch (err: unknown) {
            toast.error(apiErrorMessage(err, t('warehouses.delete_failed')))
        }
    }

    return (
        <div className="space-y-4 p-4">
            <WarehousesPageHeader
                title={t('warehouses.title')}
                onAdd={createMut.isAllowed ? openCreate : undefined}
                addLabel={t('warehouses.add')}
            />
            <Card>
                <CardContent className="pt-4">
                    <div className="divide-y">
                        {(data?.warehouses ?? []).map((w) => (
                            <button
                                key={w.id}
                                type="button"
                                disabled={!updateMut.isAllowed}
                                onClick={() => openEdit(w)}
                                className={cn(
                                    'flex w-full flex-wrap items-center justify-between gap-2 py-3 text-left transition-colors',
                                    updateMut.isAllowed && 'cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2',
                                    !updateMut.isAllowed && 'cursor-default',
                                )}
                            >
                                <div>
                                    <p className="font-medium">
                                        {w.name}{' '}
                                        <span className="font-mono text-xs text-muted-foreground">({w.code})</span>
                                    </p>
                                    <div className="mt-1 flex gap-1">
                                        {w.is_default ? <Badge variant="secondary">{t('warehouses.default')}</Badge> : null}
                                        {!w.is_active ? <Badge variant="outline">{t('warehouses.inactive')}</Badge> : null}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog
                open={dialogOpen}
                onOpenChange={(o) => {
                    setDialogOpen(o)
                    if (!o) setSelected(null)
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? t('warehouses.edit') : t('warehouses.add')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <LabeledInput label={t('warehouses.code')} value={code} onChange={setCode} />
                        <LabeledInput label={t('warehouses.name')} value={name} onChange={setName} />
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="wh-default">{t('warehouses.default')}</Label>
                            <Switch
                                id="wh-default"
                                checked={isDefault}
                                onCheckedChange={setIsDefault}
                                disabled={isEdit && selected?.is_default}
                            />
                        </div>
                        {isEdit && selected?.is_default ? (
                            <p className="text-xs text-muted-foreground">{t('warehouses.default_locked_hint')}</p>
                        ) : null}
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="wh-active">{t('warehouses.active')}</Label>
                            <Switch
                                id="wh-active"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                                disabled={isEdit && selected?.is_default}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                        {isEdit && deleteMut.isAllowed && selected && !selected.is_default ? (
                            <Button type="button" variant="destructive" onClick={() => setDeleteTarget(selected)}>
                                {t('common.delete')}
                            </Button>
                        ) : (
                            <span />
                        )}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="button" disabled={!canSave || saving} onClick={save}>
                                {t('common.save')}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('warehouses.delete_confirm_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('warehouses.delete_confirm_body', { name: deleteTarget?.name ?? '' })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMut.isPending}
                            onClick={confirmDelete}
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function WarehousesPageHeader({
    title,
    onAdd,
    addLabel,
}: {
    title: string
    onAdd?: () => void
    addLabel: string
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {onAdd ? <Button onClick={onAdd}>{addLabel}</Button> : null}
        </div>
    )
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <Input value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    )
}