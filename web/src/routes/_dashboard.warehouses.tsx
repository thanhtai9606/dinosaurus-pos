import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWarehousesListQuery, useCreateWarehouseMutation } from '@/lib/api/query/warehouses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

export const Route = createFileRoute('/_dashboard/warehouses')({
    component: WarehousesPage,
})

function WarehousesPage() {
    const { t } = useTranslation()
    const { data } = useWarehousesListQuery({ limit: 50, page: 1 })
    const createMut = useCreateWarehouseMutation()
    const [open, setOpen] = useState(false)
    const [code, setCode] = useState('')
    const [name, setName] = useState('')

    return (
        <div className="space-y-4 p-4">
            <motionCardHeader title={t('warehouses.title')} onAdd={() => setOpen(true)} addLabel={t('warehouses.add')} />
            <Card>
                <CardContent className="pt-4">
                    <div className="divide-y">
                        {(data?.warehouses ?? []).map((w) => (
                            <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
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
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('warehouses.add')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <motionField label={t('warehouses.code')} value={code} onChange={setCode} />
                        <motionField label={t('warehouses.name')} value={name} onChange={setName} />
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={async () => {
                                try {
                                    await createMut.mutateAsync({ code, name, is_active: true })
                                    toast.success(t('warehouses.created'))
                                    setOpen(false)
                                    setCode('')
                                    setName('')
                                } catch {
                                    toast.error(t('warehouses.create_failed'))
                                }
                            }}
                        >
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function motionCardHeader({ title, onAdd, addLabel }: { title: string; onAdd: () => void; addLabel: string }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <Button onClick={onAdd}>{addLabel}</Button>
        </div>
    )
}

function motionField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <Input value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    )
}