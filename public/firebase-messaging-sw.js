// public/firebase-messaging-sw.js
// Scripts for Firebase
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');


// This is the "Offline page" service worker

// Add this below the importScripts lines
const urlParams = new URL(location).searchParams;
const firebaseConfig = {
    apiKey: urlParams.get('apiKey'),
    authDomain: urlParams.get('authDomain'),
    projectId: urlParams.get('projectId'),
    storageBucket: urlParams.get('storageBucket'),
    messagingSenderId: urlParams.get('messagingSenderId'),
    appId: urlParams.get('appId'),
    measurementId: urlParams.get('measurementId'),
};

firebase.initializeApp(firebaseConfig);

if (firebase.messaging.isSupported()) {
    const messaging = firebase.messaging();

    // Optional: Background Message Handler
    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/icon.svg'
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}
