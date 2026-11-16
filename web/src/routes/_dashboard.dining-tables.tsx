import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

type DiningTable = {
    id: string
    name: string
    area_name?: string
    capacity: number
    status: string
}

export const Route = createFileRoute('/_dashboard/dining-tables')({
    component: DiningTablesPage,
})

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    available: 'default',
    occupied: 'destructive',
    reserved: 'secondary',
    dirty: 'outline',
}

function DiningTablesPage() {
    const { t } = useTranslation()
    const { data, isLoading } = useQuery({
        queryKey: ['dining', 'tables'],
        queryFn: async () => {
            const res = await axiosInstance.get('/dining/tables')
            return (res.data as { data: DiningTable[] }).data ?? []
        },
        refetchInterval: 20000,
    })

    return (
        <div className="space-y-4 p-4">
            <Card>
                <CardHeader>
                    <CardTitle>{t('dining.title')}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
                    {(data ?? []).map((table) => (
                        <Card key={table.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{table.name}</CardTitle>
                                <p className="text-xs text-muted-foreground">{table.area_name}</p>
                            </CardHeader>
                            <CardContent className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {t('dining.seats', { count: table.capacity })}
                                </span>
                                <Badge variant={statusVariant[table.status] ?? 'secondary'}>
                                    {t(`dining.status.${table.status}`)}
                                </Badge>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}