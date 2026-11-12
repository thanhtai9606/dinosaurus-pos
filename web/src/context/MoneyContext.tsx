import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { formatMoney } from '@/lib/utils'
import { useFinancialSettingsQuery } from '@/lib/api/query/settings'

type FormatMoneyFn = (amount: number) => string

const defaultFormatter: FormatMoneyFn = (amount) => formatMoney(amount, 'IDR')

const MoneyContext = createContext<FormatMoneyFn>(defaultFormatter)

export function MoneyProvider({ children }: { children: ReactNode }) {
    const { data } = useFinancialSettingsQuery()
    const currency = data?.currency ?? 'IDR'
    const format = useMemo(() => (amount: number) => formatMoney(amount, currency), [currency])
    return <MoneyContext.Provider value={format}>{children}</MoneyContext.Provider>
}

export function useFormatMoney(): FormatMoneyFn {
    return useContext(MoneyContext)
}
