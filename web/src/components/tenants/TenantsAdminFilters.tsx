import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ListFilterField, ListSearchToolbar } from '@/components/data-table/ListSearchToolbar'

export type TenantAdminFilterState = {
    search: string
    dataPlane: 'all' | 'dedicated' | 'shared'
    status: 'all' | 'active' | 'inactive'
}

export function TenantsAdminFilters({
    t,
    value,
    onChange,
}: {
    t: (key: string, fallback?: string) => string
    value: TenantAdminFilterState
    onChange: (patch: Partial<TenantAdminFilterState>) => void
}) {
    return (
        <ListSearchToolbar>
            <ListFilterField label={t('tenants_admin.filters.search_label')} className="min-w-[min(100%,20rem)] flex-[2]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        className="h-9 pl-8"
                        placeholder={t('tenants_admin.filters.search_placeholder')}
                        value={value.search}
                        onChange={(e) => onChange({ search: e.target.value })}
                    />
                </div>
            </ListFilterField>
            <ListFilterField label={t('tenants_admin.data_plane')} className="w-full sm:w-[11rem]">
                <Select
                    value={value.dataPlane}
                    onValueChange={(v) => onChange({ dataPlane: v as TenantAdminFilterState['dataPlane'] })}
                >
                    <SelectTrigger className="h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('tenants_admin.filters.all')}</SelectItem>
                        <SelectItem value="dedicated">{t('tenants_admin.data_plane_dedicated')}</SelectItem>
                        <SelectItem value="shared">{t('tenants_admin.data_plane_shared')}</SelectItem>
                    </SelectContent>
                </Select>
            </ListFilterField>
            <ListFilterField label={t('tenants_admin.status')} className="w-full sm:w-[10rem]">
                <Select
                    value={value.status}
                    onValueChange={(v) => onChange({ status: v as TenantAdminFilterState['status'] })}
                >
                    <SelectTrigger className="h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('tenants_admin.filters.all')}</SelectItem>
                        <SelectItem value="active">{t('tenants_admin.active')}</SelectItem>
                        <SelectItem value="inactive">{t('tenants_admin.inactive')}</SelectItem>
                    </SelectContent>
                </Select>
            </ListFilterField>
        </ListSearchToolbar>
    )
}