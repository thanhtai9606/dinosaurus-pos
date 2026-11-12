import { createFileRoute } from '@tanstack/react-router'
import { Ban, Tag, CreditCard, Palette, Printer, DollarSign, FileText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CancellationReasonsCard } from "@/components/settings/CancellationReasonsCard.tsx";
import { CategoriesCard } from "@/components/settings/CategoriesCard.tsx";
import { PaymentMethodsCard } from "@/components/settings/PaymentMethodsCard.tsx";
import { BrandingSettingsCard } from "@/components/settings/BrandingSettingsCard.tsx";
import { PrinterSettingsCard } from "@/components/settings/PrinterSettingsCard.tsx";
import { FinancialSettingsCard } from '@/components/settings/FinancialSettingsCard'
import { InvoiceSettingsCard } from '@/components/settings/InvoiceSettingsCard'
import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { useRBAC } from '@/lib/auth/rbac'

const searchSchema = z.object({
    tab: z.string().optional().default('cancellation'),
})

export const Route = createFileRoute("/_dashboard/settings")({
    validateSearch: (search) => searchSchema.parse(search),
    component: SettingsPage,
})

function SettingsPage() {
    const { t } = useTranslation()
    const { tab } = Route.useSearch()
    const navigate = Route.useNavigate()
    
    const { canAccessApi } = useRBAC()
    const canViewCancellations = canAccessApi('GET', '/cancellation-reasons')
    const canViewCategories = canAccessApi('GET', '/categories')
    const canViewPaymentMethods = canAccessApi('GET', '/payment-methods')
    const canViewBranding = canAccessApi('GET', '/settings/branding')
    const canViewPrinter = canAccessApi('GET', '/settings/printer')
    const canViewFinancial = canAccessApi('GET', '/settings/financial')
    const canViewInvoice = canAccessApi('GET', '/settings/invoice')

    return (
        <div className="flex flex-col gap-6">
            <SettingsHeader t={t} />

            <Tabs
                value={tab}
                onValueChange={(val) => navigate({ search: (old) => ({ ...old, tab: val }), replace: true })}
                className="space-y-4"
            >
                <TabsList>
                    {canViewCancellations && (
                        <TabsTrigger value="cancellation" className="flex items-center gap-2">
                            <Ban className="h-4 w-4" />
                            {t('settings.tabs.cancellation')}
                        </TabsTrigger>
                    )}

                    {canViewCategories && (
                        <TabsTrigger value="category" className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            {t('settings.tabs.category')}
                        </TabsTrigger>
                    )}

                    {canViewPaymentMethods && (
                        <TabsTrigger value="payment-methods" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            {t('settings.tabs.payment_methods')}
                        </TabsTrigger>
                    )}

                    {canViewBranding && (
                        <TabsTrigger value="branding" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            {t('settings.tabs.branding')}
                        </TabsTrigger>
                    )}

                    {canViewPrinter && (
                        <TabsTrigger value="printer" className="flex items-center gap-2">
                            <Printer className="h-4 w-4" />
                            {t('settings.tabs.printer')}
                        </TabsTrigger>
                    )}
                    {canViewFinancial && (
                        <TabsTrigger value="financial" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {t('settings.tabs.financial')}
                        </TabsTrigger>
                    )}
                    {canViewInvoice && (
                        <TabsTrigger value="invoice" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('settings.tabs.invoice')}
                        </TabsTrigger>
                    )}
                </TabsList>

                {canViewCancellations && (
                    <TabsContent value="cancellation">
                        <div className="grid gap-6">
                            <CancellationReasonsCard />
                        </div>
                    </TabsContent>
                )}
                {canViewCategories && (
                    <TabsContent value="category">
                        <div className="grid gap-6">
                            <CategoriesCard />
                        </div>
                    </TabsContent>
                )}
                {canViewPaymentMethods && (
                    <TabsContent value="payment-methods">
                        <div className="grid gap-6">
                            <PaymentMethodsCard />
                        </div>
                    </TabsContent>
                )}
                {canViewBranding && (
                    <TabsContent value="branding">
                        <div className="grid gap-6">
                            <BrandingSettingsCard />
                        </div>
                    </TabsContent>
                )}
                {canViewPrinter && (
                    <TabsContent value="printer">
                        <div className="grid gap-6">
                            <PrinterSettingsCard />
                        </div>
                    </TabsContent>
                )}
                {canViewFinancial && (
                    <TabsContent value="financial">
                        <FinancialSettingsCard />
                    </TabsContent>
                )}
                {canViewInvoice && (
                    <TabsContent value="invoice">
                        <InvoiceSettingsCard />
                    </TabsContent>
                )}
            </Tabs>
        </div >
    )
}




