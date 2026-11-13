import { createFileRoute, useRouter } from '@tanstack/react-router'
import { isRedirect, redirect } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { meQueryOptions } from "@/lib/api/query/auth.ts";
import { SUPER_ADMIN_HOME } from '@/lib/auth/superAdminPaths'
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from 'react-i18next'
import { SettingsPanel } from "@/components/SettingsPanel.tsx";
import { LoginForm } from "@/components/auth/LoginForm"

export const Route = createFileRoute('/login')({
    ssr: false,
    loader: async ({ context: { queryClient } }) => {
        try {
            const me = await queryClient.ensureQueryData(meQueryOptions())
            if (me) {
                const role = (me as { role?: string })?.role
                throw redirect({ to: role === 'super_admin' ? SUPER_ADMIN_HOME : '/' })
            }
        } catch (error: unknown) {
            if (isRedirect(error)) throw error
            const err = error as { response?: { status?: number }; status?: number; cause?: { status?: number } }
            const status = err?.response?.status ?? err?.status ?? err?.cause?.status
            if (status === 401) {
                queryClient.setQueryData(meQueryOptions().queryKey, null)
                return
            }
        }
    },
    component: LoginPage,
})

function LoginPage() {
    const { t } = useTranslation()
    const auth = useAuth()
    const router = useRouter()
    const queryClient = useQueryClient()

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative bg-linear-to-br from-primary/5 via-background to-amber/5">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber/5 blur-3xl" />
                <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/3 blur-2xl" />
            </div>

            <div className="absolute top-4 right-4 z-10">
                <SettingsPanel />
            </div>
            <LoginForm 
                t={t}
                auth={auth}
                onSubmitSuccess={async () => {
                    await router.invalidate()
                    const me = queryClient.getQueryData(meQueryOptions().queryKey) as { role?: string } | undefined
                    const to = me?.role === 'super_admin' ? SUPER_ADMIN_HOME : '/'
                    await router.navigate({ to, replace: true })
                }}
            />
        </div>
    )
}
