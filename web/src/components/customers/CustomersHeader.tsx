import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CustomersHeaderProps {
    t: any
    onCreateClick: () => void
    canCreate?: boolean
}

export function CustomersHeader({ t, onCreateClick, canCreate = true }: CustomersHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-heading">
                        {t('customers.title', 'Customers')}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t('customers.description', 'Manage your customers directory.')}
                    </p>
                </div>
            </div>
            {canCreate && (
                <Button onClick={onCreateClick} className="rounded-xl shadow-md shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" /> {t('customers.add_button', 'Add Customer')}
                </Button>
            )}
        </div>
    )
}
