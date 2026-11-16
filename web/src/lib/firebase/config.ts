export function firebaseWebConfig() {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined
    const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined
    const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined
    if (!apiKey || !projectId || !messagingSenderId || !appId) {
        return null
    }
    return {
        apiKey,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
        projectId,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
        messagingSenderId,
        appId,
    }
}

export function firebaseVapidKey(): string | undefined {
    return import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined
}

export function isFirebaseConfigured(): boolean {
    return firebaseWebConfig() !== null && !!firebaseVapidKey()
}