// This file MUST be in the public folder

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// You MUST EDIT THIS with your own Firebase config.
const firebaseConfig = {
  apiKey: "AIzaSyCcD3JASDRZYeRnGSEakgF8-yKRmSpyYJw",
  authDomain: "studio-524597312-3104b.firebaseapp.com",
  projectId: "studio-524597312-3104b",
  storageBucket: "studio-524597312-3104b.appspot.com",
  messagingSenderId: "451317985684",
  appId: "1:451317985684:web:5f70b71ee8dab7346b5f81",
  measurementId: ""
};

firebase.initializeApp(firebaseConfig);


// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg', // A default icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
