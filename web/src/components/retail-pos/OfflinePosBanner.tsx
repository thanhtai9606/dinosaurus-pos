import { Button } from '@/components/ui/button'
import { WifiOff, RefreshCw, Database } from 'lucide-react'

type Props = {
    online: boolean
    pending: number
    syncing: boolean
    onSync: () => void
    t: (key: string, fallback?: string) => string
    catalogCount?: number
    catalogStale?: boolean
    catalogSyncing?: boolean
    onCatalogSync?: () => void
}

export function OfflinePosBanner({
    online,
    pending,
    syncing,
    onSync,
    t,
    catalogCount = 0,
    catalogStale,
    catalogSyncing,
    onCatalogSync,
}: Props) {
    const showCatalog = !online || catalogStale || catalogCount === 0
    const showPending = pending > 0
    if (online && !showPending && !showCatalog) return null

    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm ${
                online
                    ? showPending
                        ? 'bg-amber-500/15 text-amber-900 dark:text-amber-100'
                        : 'bg-muted/60'
                    : 'bg-destructive/15 text-destructive'
            }`}
        >
            <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                {!online && (
                    <span className="flex items-center gap-2">
                        <WifiOff className="h-4 w-4 shrink-0" />
                        {t('retailPos.offline.offline')}
                    </span>
                )}
                {online && showPending && (
                    <span>{t('retailPos.offline.pending', { count: pending })}</span>
                )}
                {showCatalog && (
                    <span className="flex items-center gap-2 text-xs sm:text-sm">
                        <Database className="h-3.5 w-3.5 shrink-0" />
                        {catalogCount > 0
                            ? t('posCatalog.cached_count', { count: catalogCount })
                            : t('posCatalog.empty')}
                        {!online && catalogCount > 0 && (
                            <span className="text-muted-foreground">— {t('posCatalog.offline_mode')}</span>
                        )}
                        {online && catalogStale && catalogCount > 0 && (
                            <span className="text-amber-700 dark:text-amber-300">{t('posCatalog.stale')}</span>
                        )}
                    </span>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {online && showPending && (
                    <Button size="sm" variant="outline" disabled={syncing} onClick={onSync}>
                        <RefreshCw className={`mr-1 h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                        {t('retailPos.offline.sync')}
                    </Button>
                )}
                {online && onCatalogSync && (catalogStale || catalogCount === 0) && (
                    <Button size="sm" variant="outline" disabled={catalogSyncing} onClick={onCatalogSync}>
                        <Database className={`mr-1 h-3 w-3 ${catalogSyncing ? 'animate-pulse' : ''}`} />
                        {t('posCatalog.download')}
                    </Button>
                )}
            </div>
        </div>
    )
}