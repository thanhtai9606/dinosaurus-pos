import { useCallback, useEffect, useState } from 'react'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging'
import { axiosInstance } from '@/lib/api/client'
import { firebaseVapidKey, firebaseWebConfig, isFirebaseConfigured } from '@/lib/firebase/config'
import { useRBAC } from '@/lib/auth/rbac'

export type PushPermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

export function useFirebaseMessaging() {
    const { canAccessApi } = useRBAC()
    const canRegister = canAccessApi('POST', '/notification-devices/register')
    const [permission, setPermission] = useState<PushPermissionState>('default')
    const [registered, setRegistered] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        void (async () => {
            if (!(await isSupported())) {
                setPermission('unsupported')
                return
            }
            if (typeof Notification !== 'undefined') {
                setPermission(Notification.permission as PushPermissionState)
            }
        })()
    }, [])

    const ensureMessaging = useCallback(async (): Promise<Messaging | null> => {
        if (!(await isSupported()) || !isFirebaseConfigured()) {
            return null
        }
        const cfg = firebaseWebConfig()
        if (!cfg) return null
        const app = getApps().length ? getApp() : initializeApp(cfg)
        return getMessaging(app)
    }, [])

    const registerServiceWorker = useCallback(async () => {
        const cfg = firebaseWebConfig()
        if (!cfg || !('serviceWorker' in navigator)) return null
        const qs = new URLSearchParams({
            apiKey: cfg.apiKey,
            projectId: cfg.projectId,
            messagingSenderId: cfg.messagingSenderId,
            appId: cfg.appId,
        })
        if (cfg.authDomain) qs.set('authDomain', cfg.authDomain)
        if (cfg.storageBucket) qs.set('storageBucket', cfg.storageBucket)
        return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${qs.toString()}`)
    }, [])

    const enableBrowserPush = useCallback(async () => {
        if (!canRegister) return
        setBusy(true)
        setError(null)
        try {
            const perm = await Notification.requestPermission()
            setPermission(perm as PushPermissionState)
            if (perm !== 'granted') {
                return
            }
            const messaging = await ensureMessaging()
            const vapid = firebaseVapidKey()
            if (!messaging || !vapid) {
                setError('Firebase not configured')
                return
            }
            const reg = await registerServiceWorker()
            const token = await getToken(messaging, { vapidKey: vapid, serviceWorkerRegistration: reg ?? undefined })
            if (!token) {
                setError('No FCM token')
                return
            }
            await axiosInstance.post('/notification-devices/register', { token, platform: 'web' })
            setRegistered(true)
            onMessage(messaging, () => {
                /* foreground: optional toast later */
            })
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to enable push')
        } finally {
            setBusy(false)
        }
    }, [canRegister, ensureMessaging, registerServiceWorker])

    useEffect(() => {
        if (!canRegister || permission !== 'granted' || !isFirebaseConfigured()) return
        void enableBrowserPush()
    }, [canRegister, permission, enableBrowserPush])

    return {
        permission,
        registered,
        busy,
        error,
        configured: isFirebaseConfigured(),
        enableBrowserPush,
    }
}