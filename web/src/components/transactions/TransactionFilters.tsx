import { Loader2, Search, User as UserIcon, Receipt } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface TransactionFiltersProps {
    users: any[]
    selectedUserId: string
    onUserChange: (value: string) => void
    search: string
    onSearchChange: (value: string) => void
    isSearching?: boolean
    t: any
}

export function TransactionFilters({
    users, selectedUserId, onUserChange, search, onSearchChange, isSearching, t
}: TransactionFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-heading">{t('transactions.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('transactions.subtitle')}</p>
                </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[240px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={t('transactions.search_placeholder')}
                        className="pl-8 pr-8 rounded-xl"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>
                <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedUserId} onValueChange={onUserChange}>
                    <SelectTrigger className="w-[180px] rounded-xl">
                        <SelectValue placeholder={t('transactions.filter_user')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('transactions.filter_user')}</SelectItem>
                        {users.map(user => (
                            <SelectItem key={user.id} value={user.id || ''}>{user.username}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                </div>
            </div>
        </div>
    )
}
