import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
    value: number
    onDelta: (delta: number) => void
    onSetValue: (quantity: number) => void
    min?: number
    size?: 'default' | 'compact'
    className?: string
    disabled?: boolean
}

export function QuantityEditor({
    value,
    onDelta,
    onSetValue,
    min = 1,
    size = 'default',
    className,
    disabled,
}: Props) {
    const btn = size === 'compact' ? 'h-6 w-6' : 'h-8 w-8'
    const icon = size === 'compact' ? 'h-3 w-3' : 'h-3 w-3'
    const input = size === 'compact' ? 'h-6 w-12 text-xs' : 'h-8 w-14 text-sm'

    const commit = (raw: string) => {
        const n = Math.floor(Number(raw))
        if (!Number.isFinite(n)) return
        onSetValue(Math.max(min, n))
    }

    return (
        <div className={cn('flex items-center justify-center gap-1', className)}>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className={btn}
                disabled={disabled || value <= min}
                onClick={() => onDelta(-1)}
            >
                <Minus className={icon} />
            </Button>
            <Input
                type="number"
                min={min}
                step={1}
                disabled={disabled}
                className={cn(
                    input,
                    'px-1 text-center font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                )}
                value={value}
                onChange={(e) => commit(e.target.value)}
                onBlur={(e) => commit(e.target.value)}
            />
            <Button type="button" variant="outline" size="icon" className={btn} disabled={disabled} onClick={() => onDelta(1)}>
                <Plus className={icon} />
            </Button>
        </div>
    )
}