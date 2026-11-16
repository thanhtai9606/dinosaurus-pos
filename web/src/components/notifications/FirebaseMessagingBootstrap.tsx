import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging'

/** Registers FCM when user already granted notification permission. */
export function FirebaseMessagingBootstrap() {
    useFirebaseMessaging()
    return null
}