import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type KitchenTicket = {
    id: string
    order_no: string
    kitchen_status: string
    order_status: string
    created_at: string
    table_name?: string | null
}

export const Route = createFileRoute('/_dashboard/kitchen')({
    component: KitchenPage,
})

const STEPS = ['pending', 'preparing', 'ready', 'served'] as const

function KitchenPage() {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { data, isLoading, refetch, isFetching } = useQuery({
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
        },
        onError: () => toast.error(t('kitchen.errors.update_failed')),
    })

    const nextStatus = (current: string) => {
        const i = STEPS.indexOf(current as (typeof STEPS)[number])
        return i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null
    }

    return (
        <div className="space-y-4 p-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('kitchen.title')}</CardTitle>
                    <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
                        {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : t('kitchen.refresh')}
                    </Button>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
                    {!isLoading && (data?.length ?? 0) === 0 && (
                        <p className="text-muted-foreground">{t('kitchen.empty')}</p>
                    )}
                    {(data ?? []).map((ticket) => {
                        const next = nextStatus(ticket.kitchen_status)
                        return (
                            <Card key={ticket.id} className="border-dashed">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{ticket.order_no}</CardTitle>
                                    {ticket.table_name && (
                                        <p className="text-sm text-muted-foreground">
                                            {t('kitchen.table')}: {ticket.table_name}
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent className="flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary">{t(`kitchen.status.${ticket.kitchen_status}`)}</Badge>
                                    {next && (
                                        <Button
                                            size="sm"
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