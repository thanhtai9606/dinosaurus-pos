/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

const params = new URL(self.location.href).searchParams
const config = {
    apiKey: params.get('apiKey'),
    authDomain: params.get('authDomain'),
    projectId: params.get('projectId'),
    storageBucket: params.get('storageBucket'),
    messagingSenderId: params.get('messagingSenderId'),
    appId: params.get('appId'),
}

if (config.apiKey && config.projectId && config.messagingSenderId && config.appId) {
    firebase.initializeApp(config)
    const messaging = firebase.messaging()
    messaging.onBackgroundMessage((payload) => {
        const title = payload.notification?.title ?? 'Dinosaurus POS'
        const options = {
            body: payload.notification?.body ?? '',
            data: payload.data ?? {},
        }
        self.registration.showNotification(title, options)
    })
}