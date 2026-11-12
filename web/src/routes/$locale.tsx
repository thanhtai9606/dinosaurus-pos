import { createFileRoute, redirect } from '@tanstack/react-router'
import i18n from '@/lib/i18n'

const LOCALES = new Set(['vi', 'en', 'id'])

/** Legacy URLs like `/vi` → home */
export const Route = createFileRoute('/$locale')({
    beforeLoad: ({ params }) => {
        if (!LOCALES.has(params.locale)) {
            throw redirect({ to: '/', replace: true })
        }
        void i18n.changeLanguage(params.locale)
        throw redirect({ to: '/', replace: true })
    },
})
