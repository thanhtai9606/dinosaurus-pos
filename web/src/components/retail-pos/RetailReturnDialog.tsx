import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SalesReturnPanel } from '@/components/retail-pos/SalesReturnPanel'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    t: (key: string, fallback?: string) => string
}

export function RetailReturnDialog({ open, onOpenChange, t }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" dismissible>
                <DialogHeader>
                    <DialogTitle>{t('retailPos.return.title')}</DialogTitle>
                </DialogHeader>
                <SalesReturnPanel embedded onSuccess={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    )
}
