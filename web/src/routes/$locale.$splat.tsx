import { createFileRoute, redirect } from '@tanstack/react-router'
import i18n from '@/lib/i18n'

const LOCALES = new Set(['vi', 'en', 'id'])

/** Legacy URLs like `/vi/retail-pos` → `/retail-pos` */
export const Route = createFileRoute('/$locale/$splat')({
    beforeLoad: ({ params, location }) => {
        const { locale, splat } = params
        if (!LOCALES.has(locale)) {
            throw redirect({ to: '/', replace: true })
        }
        void i18n.changeLanguage(locale)
        const target = splat ? `/${splat}` : '/'
        throw redirect({
            to: target,
            search: location.search,
            hash: location.hash,
            replace: true,
        })
    },
})
