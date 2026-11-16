import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Loader2, Plus, Send, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
    useCreateNotificationChannelMutation,
    useDeleteNotificationChannelMutation,
    useNotificationChannelsQuery,
    useNotificationConfigQuery,
    useNotificationEventTypesQuery,
    useNotificationSubscriptionsQuery,
    useTestNotificationChannelMutation,
    useUpdateNotificationChannelMutation,
    useTestReportEmailMutation,
    useNotificationDeliveriesQuery,
    useUpdateNotificationConfigMutation,
    useUpdateNotificationSubscriptionsMutation,
    type NotificationChannel,
    type NotificationChannelType,
    type NotificationTenantConfig,
    type ReportScheduleSlot,
} from '@/lib/api/query/notifications'
import { useRBAC } from '@/lib/auth/rbac'
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging'
import { isFirebaseConfigured } from '@/lib/firebase/config'

const CHANNEL_TYPES: NotificationChannelType[] = ['email', 'msteams_webhook', 'telegram', 'sms', 'firebase']

function defaultConfig(type: NotificationChannelType): Record<string, unknown> {
    switch (type) {
        case 'email':
            return { host: '', port: 587, username: '', password: '', from: '', use_tls: true }
        case 'msteams_webhook':
            return { webhook_url: '' }
        case 'telegram':
            return { bot_token: '', default_chat_id: '' }
        case 'sms':
            return { provider: '', api_key: '', sender_id: '' }
        case 'firebase':
            return {}
    }
}

export function NotificationSettingsCard() {
    const { t } = useTranslation()
    const { canAccessApi } = useRBAC()
    const canAdminChannels = canAccessApi('POST', '/notification-channels')
    const canConfig = canAccessApi('PUT', '/notifications/config')
    const canSubscriptions = canAccessApi('PUT', '/notification-subscriptions/me')
    const canDeliveries = canAccessApi('GET', '/notification-deliveries')
    const { data: deliveries } = useNotificationDeliveriesQuery(1, 25)

    const { data: channels = [], isLoading: channelsLoading } = useNotificationChannelsQuery()
    const { data: eventTypes = [] } = useNotificationEventTypesQuery()
    const { data: subscriptions = [] } = useNotificationSubscriptionsQuery()
    const { data: tenantConfig } = useNotificationConfigQuery()

    const createMut = useCreateNotificationChannelMutation()
    const updateMut = useUpdateNotificationChannelMutation()
    const deleteMut = useDeleteNotificationChannelMutation()
    const testMut = useTestNotificationChannelMutation()
    const subsMut = useUpdateNotificationSubscriptionsMutation()
    const configMut = useUpdateNotificationConfigMutation()
    const reportTestMut = useTestReportEmailMutation()
    const push = useFirebaseMessaging()

    const [newName, setNewName] = useState('')
    const [newType, setNewType] = useState<NotificationChannelType>('email')
    const [newConfig, setNewConfig] = useState<Record<string, unknown>>(defaultConfig('email'))
    const [threshold, setThreshold] = useState(5)
    const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh')
    const [reportEmails, setReportEmails] = useState('')
    const [reportSchedules, setReportSchedules] = useState<NotificationTenantConfig['report_schedules']>({
        daily: { enabled: false, hour: 6, minute: 0 },
        monthly: { enabled: false, day: 1, hour: 7, minute: 0 },
        yearly: { enabled: false, month: 1, day: 1, hour: 8, minute: 0 },
    })
    const [subState, setSubState] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (tenantConfig) {
            setThreshold(tenantConfig.stock_low_threshold)
            setTimezone(tenantConfig.timezone || 'Asia/Ho_Chi_Minh')
            setReportEmails((tenantConfig.report_recipient_emails || []).join(', '))
            if (tenantConfig.report_schedules) setReportSchedules(tenantConfig.report_schedules)
        }
    }, [tenantConfig])

    useEffect(() => {
        const map: Record<string, boolean> = {}
        for (const s of subscriptions) {
            map[`${s.event_type}:${s.channel_id}`] = s.enabled
        }
        setSubState(map)
    }, [subscriptions])

    const enabledChannels = useMemo(() => channels.filter((c) => c.enabled), [channels])

    const toggleSubscription = (eventType: string, channelId: string, checked: boolean) => {
        setSubState((prev) => ({ ...prev, [`${eventType}:${channelId}`]: checked }))
    }

    const saveSubscriptions = () => {
        const items = eventTypes.flatMap((ev) =>
            enabledChannels.map((ch) => ({
                event_type: ev.code,
                channel_id: ch.id,
                enabled: subState[`${ev.code}:${ch.id}`] ?? false,
            }))
        )
        subsMut.mutate(items)
    }

    const createChannel = () => {
        if (!newName.trim()) return
        createMut.mutate(
            { name: newName.trim(), channel_type: newType, config: newConfig, enabled: true },
            {
                onSuccess: () => {
                    setNewName('')
                    setNewConfig(defaultConfig(newType))
                },
            }
        )
    }

    const renderConfigFields = (type: NotificationChannelType, config: Record<string, unknown>, onChange: (c: Record<string, unknown>) => void) => {
        const set = (key: string, value: unknown) => onChange({ ...config, [key]: value })
        switch (type) {
            case 'email':
                return (
                    <div className="grid gap-2 sm:grid-cols-2">
                        <Input placeholder="SMTP host" value={String(config.host ?? '')} onChange={(e) => set('host', e.target.value)} />
                        <Input type="number" placeholder="Port" value={String(config.port ?? 587)} onChange={(e) => set('port', Number(e.target.value))} />
                        <Input placeholder="Username" value={String(config.username ?? '')} onChange={(e) => set('username', e.target.value)} />
                        <Input type="password" placeholder="Password" value={String(config.password ?? '')} onChange={(e) => set('password', e.target.value)} />
                        <Input placeholder="From" value={String(config.from ?? '')} onChange={(e) => set('from', e.target.value)} className="sm:col-span-2" />
                    </div>
                )
            case 'msteams_webhook':
                return <Input placeholder="Webhook URL" value={String(config.webhook_url ?? '')} onChange={(e) => set('webhook_url', e.target.value)} />
            case 'telegram':
                return (
                    <div className="grid gap-2 sm:grid-cols-2">
                        <Input placeholder="Bot token" value={String(config.bot_token ?? '')} onChange={(e) => set('bot_token', e.target.value)} />
                        <Input placeholder="Chat ID" value={String(config.default_chat_id ?? '')} onChange={(e) => set('default_chat_id', e.target.value)} />
                    </div>
                )
            case 'sms':
                return (
                    <div className="grid gap-2 sm:grid-cols-2">
                        <Input placeholder="Provider" value={String(config.provider ?? '')} onChange={(e) => set('provider', e.target.value)} />
                        <Input placeholder="Sender ID" value={String(config.sender_id ?? '')} onChange={(e) => set('sender_id', e.target.value)} />
                        <Input placeholder="API key" value={String(config.api_key ?? '')} onChange={(e) => set('api_key', e.target.value)} className="sm:col-span-2" />
                    </div>
                )
            case 'firebase':
                return <p className="text-sm text-muted-foreground">{t('settings.notifications.firebase_channel_help')}</p>
        }
    }

    const patchReportSlot = (key: keyof NotificationTenantConfig['report_schedules'], patch: Partial<ReportScheduleSlot>) => {
        setReportSchedules((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
    }

    const saveFullConfig = () => {
        const emails = reportEmails
            .split(/[,;\s]+/)
            .map((e) => e.trim())
            .filter(Boolean)
        configMut.mutate({
            stock_low_threshold: threshold,
            timezone,
            report_schedules: reportSchedules,
            report_recipient_emails: emails,
        })
    }

    const ChannelRow = ({ ch }: { ch: NotificationChannel }) => {
        const [localName, setLocalName] = useState(ch.name)
        const [localConfig, setLocalConfig] = useState(ch.config)
        const [enabled, setEnabled] = useState(ch.enabled)
        return (
            <div className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                    <Input value={localName} onChange={(e) => setLocalName(e.target.value)} className="max-w-xs" />
                    <div className="flex items-center gap-2">
                        <Label>{t('settings.notifications.enabled')}</Label>
                        <Switch checked={enabled} onCheckedChange={setEnabled} />
                        <Button size="sm" variant="outline" onClick={() => testMut.mutate(ch.id)} disabled={testMut.isPending}>
                            <Send className="h-4 w-4 mr-1" />
                            {t('settings.notifications.test')}
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => updateMut.mutate({ id: ch.id, name: localName, config: localConfig, enabled })}
                        >
                            {t('common.save')}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteMut.mutate(ch.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">{ch.channel_type}</p>
                {ch.channel_type !== 'firebase' && renderConfigFields(ch.channel_type, localConfig, setLocalConfig)}
                {ch.channel_type === 'firebase' && (
                    <p className="text-sm text-muted-foreground">{t('settings.notifications.firebase_channel_help')}</p>
                )}
            </div>
        )
    }

    if (channelsLoading && canAdminChannels) {
        return (
            <Card>
                <CardContent className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {canConfig && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            {t('settings.notifications.threshold_title')}
                        </CardTitle>
                        <CardDescription>{t('settings.notifications.threshold_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-end gap-4">
                        <div>
                            <Label>{t('settings.notifications.stock_threshold')}</Label>
                            <Input type="number" min={0} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-32" />
                        </div>
                        <Button onClick={saveFullConfig} disabled={configMut.isPending}>
                            {t('common.save')}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {canConfig && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.notifications.reports_title')}</CardTitle>
                        <CardDescription>{t('settings.notifications.reports_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>{t('settings.notifications.timezone')}</Label>
                            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="max-w-md" />
                        </div>
                        <div>
                            <Label>{t('settings.notifications.report_emails')}</Label>
                            <Input
                                value={reportEmails}
                                onChange={(e) => setReportEmails(e.target.value)}
                                placeholder="owner@shop.com, manager@shop.com"
                                className="max-w-lg"
                            />
                        </div>
                        {(['daily', 'monthly', 'yearly'] as const).map((key) => (
                            <div key={key} className="flex flex-wrap items-center gap-3 rounded-md border p-3">
                                <Switch
                                    checked={reportSchedules[key].enabled}
                                    onCheckedChange={(v) => patchReportSlot(key, { enabled: v })}
                                />
                                <span className="font-medium min-w-[80px]">{t(`settings.notifications.report_period.${key}`)}</span>
                                {key !== 'daily' && (
                                    <Input
                                        type="number"
                                        className="w-20"
                                        min={1}
                                        max={31}
                                        value={reportSchedules[key].day ?? 1}
                                        onChange={(e) => patchReportSlot(key, { day: Number(e.target.value) })}
                                    />
                                )}
                                {key === 'yearly' && (
                                    <Input
                                        type="number"
                                        className="w-20"
                                        min={1}
                                        max={12}
                                        value={reportSchedules[key].month ?? 1}
                                        onChange={(e) => patchReportSlot(key, { month: Number(e.target.value) })}
                                    />
                                )}
                                <Input
                                    type="number"
                                    className="w-20"
                                    min={0}
                                    max={23}
                                    value={reportSchedules[key].hour}
                                    onChange={(e) => patchReportSlot(key, { hour: Number(e.target.value) })}
                                />
                                <span>:</span>
                                <Input
                                    type="number"
                                    className="w-20"
                                    min={0}
                                    max={59}
                                    value={reportSchedules[key].minute}
                                    onChange={(e) => patchReportSlot(key, { minute: Number(e.target.value) })}
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={reportTestMut.isPending}
                                    onClick={() => reportTestMut.mutate(key)}
                                >
                                    {t('settings.notifications.report_test')}
                                </Button>
                            </div>
                        ))}
                        <Button onClick={saveFullConfig} disabled={configMut.isPending}>
                            {t('common.save')}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {canAdminChannels && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.notifications.channels_title')}</CardTitle>
                        <CardDescription>{t('settings.notifications.channels_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {channels.map((ch) => (
                            <ChannelRow key={ch.id} ch={ch} />
                        ))}

                        <div className="rounded-lg border border-dashed p-4 space-y-3">
                            <p className="font-medium flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                {t('settings.notifications.add_channel')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Input placeholder={t('settings.notifications.channel_name')} value={newName} onChange={(e) => setNewName(e.target.value)} className="max-w-xs" />
                                <Select
                                    value={newType}
                                    onValueChange={(v) => {
                                        const tpe = v as NotificationChannelType
                                        setNewType(tpe)
                                        setNewConfig(defaultConfig(tpe))
                                    }}
                                >
                                    <SelectTrigger className="w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CHANNEL_TYPES.map((ct) => (
                                            <SelectItem key={ct} value={ct}>
                                                {t(`settings.notifications.channel_types.${ct}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {renderConfigFields(newType, newConfig, setNewConfig)}
                            <Button onClick={createChannel} disabled={createMut.isPending}>
                                {t('settings.notifications.add_channel')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {canSubscriptions && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.notifications.browser_push_title')}</CardTitle>
                        <CardDescription>{t('settings.notifications.browser_push_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-3">
                        {!isFirebaseConfigured() ? (
                            <p className="text-sm text-muted-foreground">{t('settings.notifications.firebase_not_configured')}</p>
                        ) : (
                            <>
                                <Button onClick={() => void push.enableBrowserPush()} disabled={push.busy || push.permission === 'denied'}>
                                    {t('settings.notifications.enable_browser_push')}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {push.permission === 'granted'
                                        ? t('settings.notifications.push_granted')
                                        : push.permission === 'denied'
                                          ? t('settings.notifications.push_denied')
                                          : t('settings.notifications.push_default')}
                                </span>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {canDeliveries && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.notifications.deliveries_title')}</CardTitle>
                        <CardDescription>{t('settings.notifications.deliveries_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">{t('settings.notifications.delivery_time')}</th>
                                    <th className="text-left py-2">{t('settings.notifications.event')}</th>
                                    <th className="text-left py-2">{t('settings.notifications.delivery_status')}</th>
                                    <th className="text-left py-2">{t('settings.notifications.delivery_summary')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(deliveries?.items || []).map((row) => (
                                    <tr key={row.id} className="border-b">
                                        <td className="py-2 pr-2 whitespace-nowrap">
                                            {new Date(row.created_at).toLocaleString()}
                                        </td>
                                        <td className="py-2 pr-2">{row.event_type}</td>
                                        <td className="py-2 pr-2">{row.status}</td>
                                        <td className="py-2 text-muted-foreground max-w-xs truncate">
                                            {row.error_text || row.payload_summary || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {canSubscriptions && enabledChannels.length > 0 && eventTypes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.notifications.subscriptions_title')}</CardTitle>
                        <CardDescription>{t('settings.notifications.subscriptions_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 pr-4">{t('settings.notifications.event')}</th>
                                    {enabledChannels.map((ch) => (
                                        <th key={ch.id} className="text-center py-2 px-2 min-w-[100px]">
                                            {ch.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {eventTypes.map((ev) => (
                                    <tr key={ev.code} className="border-b">
                                        <td className="py-2 pr-4">{ev.label}</td>
                                        {enabledChannels.map((ch) => {
                                            const key = `${ev.code}:${ch.id}`
                                            return (
                                                <td key={ch.id} className="text-center py-2">
                                                    <Checkbox
                                                        checked={subState[key] ?? false}
                                                        onCheckedChange={(v) => toggleSubscription(ev.code, ch.id, !!v)}
                                                    />
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Button className="mt-4" onClick={saveSubscriptions} disabled={subsMut.isPending}>
                            {t('settings.notifications.save_subscriptions')}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}