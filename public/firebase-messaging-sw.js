// This file needs to be in the public directory.

// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// "Default" Firebase app (important for initialization)
firebase.initializeApp({
  apiKey: new URL(location).searchParams.get('apiKey'),
  authDomain: new URL(location).searchParams.get('authDomain'),
  projectId: new URL(location).searchParams.get('projectId'),
  storageBucket: new URL(location).searchParams.get('storageBucket'),
  messagingSenderId: new URL(location).searchParams.get('messagingSenderId'),
  appId: new URL(location).searchParams.get('appId'),
  measurementId: new URL(location).searchParams.get('measurementId'),
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
