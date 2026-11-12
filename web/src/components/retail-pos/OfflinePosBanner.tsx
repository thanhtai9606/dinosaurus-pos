import { Button } from '@/components/ui/button'
import { WifiOff, RefreshCw } from 'lucide-react'

type Props = {
    online: boolean
    pending: number
    syncing: boolean
    onSync: () => void
    t: (key: string, fallback?: string) => string
}

export function OfflinePosBanner({ online, pending, syncing, onSync, t }: Props) {
    if (online && pending === 0) return null
    return (
        <div
            className={`flex items-center justify-between gap-2 px-4 py-2 text-sm ${
                online ? 'bg-amber-500/15 text-amber-900 dark:text-amber-100' : 'bg-destructive/15 text-destructive'
            }`}
        >
            <div className="flex items-center gap-2">
                {!online && <WifiOff className="h-4 w-4" />}
                <span>
                    {!online
                        ? t('retailPos.offline.offline')
                        : t('retailPos.offline.pending', { count: pending })}
                </span>
            </div>
            {online && pending > 0 && (
                <Button size="sm" variant="outline" disabled={syncing} onClick={onSync}>
                    <RefreshCw className={`mr-1 h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                    {t('retailPos.offline.sync')}
                </Button>
            )}
        </div>
    )
}
