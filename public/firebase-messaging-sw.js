// public/firebase-messaging-sw.js
// Must be placed in /public to be served at the root.
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js");

// This config is intentionally hardcoded and public.
// It's required for the service worker to initialize Firebase in the background.
const firebaseConfig = {
  apiKey: "AIzaSyCcD3JASDRZYeRnGSEakgF8-yKRmSpyYJw",
  authDomain: "studio-524597312-3104b.firebaseapp.com",
  projectId: "studio-524597312-3104b",
  storageBucket: "studio-524597312-3104b.appspot.com",
  messagingSenderId: "451317985684",
  appId: "1:451317985684:web:5f70b71ee8dab7346b5f81",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification?.title || "Background Message Title";
  const notificationOptions = {
    body: payload.notification?.body || "Background Message body.",
    // icon: '/icon.png' // Optional: add an icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
