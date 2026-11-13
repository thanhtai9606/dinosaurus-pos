import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CartItem } from '@/components/orders/CartContent'
import { catalogUnitPrice } from '@/lib/retail-pos/pricing'
import { useFormatMoney } from '@/context/MoneyContext'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: CartItem | null
    t: (key: string, fallback?: string) => string
    onApply: (unitPrice: number, saveAsRetailPrice: boolean) => void
    saving?: boolean
    canSaveCatalog: boolean
}

export function RetailPriceEditDialog({
    open,
    onOpenChange,
    item,
    t,
    onApply,
    saving,
    canSaveCatalog,
}: Props) {
    const formatMoney = useFormatMoney()
    const catalog = item ? catalogUnitPrice(item) : 0
    const [priceInput, setPriceInput] = useState('')
    const [percentInput, setPercentInput] = useState('')
    const [saveCatalog, setSaveCatalog] = useState(false)

    useEffect(() => {
        if (open && item) {
            const current = item.unitPrice ?? catalogUnitPrice(item)
            setPriceInput(String(current))
            setPercentInput('')
            setSaveCatalog(false)
        }
    }, [open, item, catalog])

    const applyPercent = () => {
        const pct = Number(percentInput)
        if (!Number.isFinite(pct) || pct < 0 || pct > 100) return
        const next = Math.floor(catalog * (1 - pct / 100))
        setPriceInput(String(next))
    }

    const handleApply = () => {
        const price = Math.floor(Number(priceInput))
        if (!Number.isFinite(price) || price < 0) return
        onApply(price, saveCatalog && canSaveCatalog)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" dismissible>
                <DialogHeader>
                    <DialogTitle>{t('retailPos.price_edit.title')}</DialogTitle>
                </DialogHeader>
                {item && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">{item.product.name}</p>
                        <div className="text-sm">
                            {t('retailPos.price_edit.catalog')}: <span className="font-medium">{formatMoney(catalog)}</span>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('retailPos.price_edit.new_price')}</Label>
                            <Input
                                type="number"
                                min={0}
                                value={priceInput}
                                onChange={(e) => setPriceInput(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                                <Label>{t('retailPos.price_edit.discount_percent')}</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="0"
                                    value={percentInput}
                                    onChange={(e) => setPercentInput(e.target.value)}
                                />
                            </div>
                            <Button type="button" variant="secondary" onClick={applyPercent}>
                                {t('retailPos.price_edit.apply_discount')}
                            </Button>
                        </div>
                        {canSaveCatalog && (
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox checked={saveCatalog} onCheckedChange={(v) => setSaveCatalog(!!v)} />
                                {t('retailPos.price_edit.save_retail')}
                            </label>
                        )}
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button onClick={handleApply} disabled={saving}>
                        {t('retailPos.price_edit.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
