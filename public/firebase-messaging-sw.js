// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker with your project's sender ID
firebase.initializeApp({
  apiKey: "AIzaSyCcD3JASDRZYeRnGSEakgF8-yKRmSpyYJw",
  authDomain: "studio-524597312-3104b.firebaseapp.com",
  projectId: "studio-524597312-3104b",
  storageBucket: "studio-524597312-3104b.appspot.com",
  messagingSenderId: "451317985684",
  appId: "1:451317985684:web:5f70b71ee8dab7346b5f81",
  measurementId: ""
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
