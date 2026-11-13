import { Button } from '@/components/ui/button'
import { useShiftContext } from '@/context/ShiftContext'
import { Wallet, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type ShiftControlProps = {
  compact?: boolean
}

export function ShiftControl({ compact = false }: ShiftControlProps) {
    const { isShiftOpen, setOpenShiftModalOpen, setCloseShiftModalOpen, isLoading, shift } = useShiftContext()
    const { t } = useTranslation()

    const layout = cn(
        compact ? 'h-9 shrink-0 gap-1.5 px-2.5 sm:px-3' : 'w-full justify-start gap-2',
    )

    if (isLoading) {
        return (
            <Button variant="outline" className={cn(layout)} disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className={cn('truncate', compact && 'hidden sm:inline')}>
                    {t('shift.loading', 'Loading shift...')}
                </span>
            </Button>
        )
    }

    if (isShiftOpen) {
        return (
            <Button
                variant="outline"
                className={cn(
                    layout,
                    compact ? 'justify-center sm:justify-between' : 'w-full justify-between',
                    'group hover:bg-destructive hover:text-destructive-foreground border-destructive/20',
                )}
                onClick={() => setCloseShiftModalOpen(true)}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Wallet className="h-4 w-4 shrink-0" />
                    <span className={cn('truncate', compact && 'hidden md:inline')}>
                        {t('shift.register_open', 'Register Open')}
                    </span>
                </div>
                {shift?.start_time && (
                    <span
                        className={cn(
                            'text-xs font-mono opacity-75 group-hover:text-destructive-foreground/90',
                            compact && 'hidden sm:inline',
                        )}
                    >
                        {new Date(shift.start_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                )}
            </Button>
        )
    }

    return (
        <Button
            variant="default"
            className={cn(
                layout,
                'bg-primary hover:bg-primary/90 text-primary-foreground',
            )}
            onClick={() => setOpenShiftModalOpen(true)}
        >
            <Wallet className="h-4 w-4 shrink-0" />
            <span className={cn('truncate', compact && 'hidden sm:inline')}>
                {t('shift.open_register', 'Open Register')}
            </span>
        </Button>
    )
}
