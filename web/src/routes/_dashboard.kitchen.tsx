import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type KitchenTicketItem = {
    product_name: string
    quantity: number
    sale_unit_name?: string | null
}

type KitchenTicket = {
    id: string
    order_no: string
    kitchen_status: string
    order_status: string
    created_at: string
    table_name?: string | null
    items?: KitchenTicketItem[]
}

export const Route = createFileRoute('/_dashboard/kitchen')({
    component: KitchenPage,
})

const STEPS = ['pending', 'preparing', 'ready', 'served'] as const

function KitchenPage() {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { data, isLoading, refetch, isFetching, isError } = useQuery({
        queryKey: ['kitchen', 'tickets'],
        queryFn: async () => {
            const res = await axiosInstance.get('/kitchen/tickets')
            return (res.data as { data: KitchenTicket[] }).data ?? []
        },
        refetchInterval: 15000,
    })

    const advance = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            await axiosInstance.patch(`/orders/${id}/kitchen-status`, { status })
        },
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['kitchen', 'tickets'] })
            void qc.invalidateQueries({ queryKey: ['dining', 'tables'] })
        },
        onError: () => toast.error(t('kitchen.errors.update_failed')),
    })

    const nextStatus = (current: string) => {
        const i = STEPS.indexOf(current as (typeof STEPS)[number])
        return i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null
    }

    const tickets = data ?? []

    return (
        <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h1 className="text-xl font-semibold">{t('kitchen.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('kitchen.subtitle')}</p>
                </div>
                <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : t('kitchen.refresh')}
                </Button>
            </div>

            {isError && (
                <Alert variant="destructive">
                    <AlertDescription>{t('kitchen.errors.load_failed')}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardContent className="pt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoading && <p className="text-muted-foreground col-span-full">{t('common.loading')}</p>}
                    {!isLoading && !isError && tickets.length === 0 && (
                        <div className="col-span-full rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                            <p className="font-medium">{t('kitchen.empty')}</p>
                            <p className="text-sm mt-2">{t('kitchen.empty_hint')}</p>
                        </div>
                    )}
                    {tickets.map((ticket) => {
                        const next = nextStatus(ticket.kitchen_status)
                        return (
                            <Card key={ticket.id} className="border-l-4 border-l-primary shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-lg">{ticket.order_no}</CardTitle>
                                        <Badge variant="secondary">{t(`kitchen.status.${ticket.kitchen_status}`)}</Badge>
                                    </div>
                                    {ticket.table_name && (
                                        <p className="text-sm text-muted-foreground">
                                            {t('kitchen.table')}: <span className="font-medium">{ticket.table_name}</span>
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {t('kitchen.order_status')}: {t(`kitchen.order_status_${ticket.order_status}`, ticket.order_status)}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <ul className="text-sm space-y-1 border rounded-md p-2 bg-muted/30">
                                        {(ticket.items?.length ? ticket.items : []).map((line, idx) => (
                                            <li key={idx} className="flex justify-between gap-2">
                                                <span className="truncate">{line.product_name}</span>
                                                <span className="shrink-0 font-mono text-xs">
                                                    {line.quantity}
                                                    {line.sale_unit_name ? ` ${line.sale_unit_name}` : ''}
                                                </span>
                                            </li>
                                        ))}
                                        {!ticket.items?.length && (
                                            <li className="text-muted-foreground text-xs">{t('kitchen.no_items')}</li>
                                        )}
                                    </ul>
                                    {next && (
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            disabled={advance.isPending}
                                            onClick={() => advance.mutate({ id: ticket.id, status: next })}
                                        >
                                            {t(`kitchen.advance_to.${next}`)}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}