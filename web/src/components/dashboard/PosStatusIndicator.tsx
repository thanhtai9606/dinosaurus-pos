import { Link } from '@tanstack/react-router'
import { CloudOff, CloudUpload, ShoppingCart, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { usePosStatusSummary } from '@/hooks/usePosStatusSummary'
import { usePosOfflineSync } from '@/hooks/usePosOfflineSync'
import { usePosCatalog } from '@/hooks/usePosCatalog'
import { cn } from '@/lib/utils'

export function PosStatusIndicator() {
    const { t } = useTranslation()
    const { online, pendingSync, draftTabs, orderDraftLines, hasDrafts, visible } = usePosStatusSummary()
    const { syncing, flush } = usePosOfflineSync()
    const catalog = usePosCatalog()

    const catalogVisible = !online || catalog.count === 0 || catalog.stale

    if (!visible && !catalogVisible) return null

    const badgeCount = pendingSync > 0 ? pendingSync : hasDrafts ? draftTabs + (orderDraftLines > 0 ? 1 : 0) : 0

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        'relative gap-1.5 h-9',
                        !online && 'border-destructive/50 text-destructive',
                        online && pendingSync > 0 && 'border-amber-500/50',
                    )}
                    aria-label={t('posStatus.title')}
                >
                    {!online ? (
                        <CloudOff className="h-4 w-4" />
                    ) : pendingSync > 0 ? (
                        <CloudUpload className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                        <ShoppingCart className="h-4 w-4 text-primary" />
                    )}
                    {badgeCount > 0 && (
                        <Badge
                            variant={pendingSync > 0 ? 'destructive' : 'secondary'}
                            className="h-5 min-w-5 px-1 text-[10px] font-bold"
                        >
                            {badgeCount > 99 ? '99+' : badgeCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3 text-sm">
                <p className="font-medium">{t('posStatus.title')}</p>
                {!online && (
                    <p className="text-muted-foreground text-xs">{t('retailPos.offline.offline')}</p>
                )}
                {pendingSync > 0 && (
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-medium text-amber-700 dark:text-amber-300">
                                {t('posStatus.pending_sync', { count: pendingSync })}
                            </p>
                            <p className="text-xs text-muted-foreground">{t('posStatus.pending_sync_hint')}</p>
                        </div>
                        {online && (
                            <Button size="sm" variant="outline" disabled={syncing} onClick={() => void flush()}>
                                <RefreshCw className={cn('h-3 w-3', syncing && 'animate-spin')} />
                            </Button>
                        )}
                    </div>
                )}
                {draftTabs > 0 && (
                    <p className="text-xs">
                        {t('posStatus.retail_drafts', { count: draftTabs })}
                    </p>
                )}
                {orderDraftLines > 0 && (
                    <p className="text-xs">{t('posStatus.order_draft', { count: orderDraftLines })}</p>
                )}
                {catalogVisible && (
                    <div className="flex items-center justify-between gap-2 border-t pt-2">
                        <p className="text-xs">
                            {catalog.count > 0
                                ? t('posCatalog.cached_count', { count: catalog.count })
                                : t('posCatalog.empty')}
                            {catalog.stale && catalog.count > 0 ? ` (${t('posCatalog.stale')})` : ''}
                        </p>
                        {online && (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={catalog.syncing}
                                onClick={() => void catalog.sync()}
                            >
                                {t('posCatalog.download')}
                            </Button>
                        )}
                    </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                    {draftTabs > 0 && (
                        <Button size="sm" variant="secondary" asChild>
                            <Link to="/retail-pos">{t('posStatus.open_retail_pos')}</Link>
                        </Button>
                    )}
                    {orderDraftLines > 0 && (
                        <Button size="sm" variant="secondary" asChild>
                            <Link to="/order">{t('posStatus.open_order_pos')}</Link>
                        </Button>
                    )}
                    {pendingSync > 0 && (
                        <Button size="sm" variant="outline" asChild>
                            <Link to="/retail-pos">{t('posStatus.open_retail_pos')}</Link>
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}