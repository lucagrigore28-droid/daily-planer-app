// This file MUST be in the public folder

importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js");

// Replace with your Firebase project's config object
const firebaseConfig = {
  "projectId": "studio-524597312-3104b",
  "appId": "1:451317985684:web:5f70b71ee8dab7346b5f81",
  "apiKey": "AIzaSyCcD3JASDRZYeRnGSEakgF8-yKRmSpyYJw",
  "authDomain": "studio-524597312-3104b.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "451317985684",
  "storageBucket": "studio-524597312-3104b.appspot.com"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.svg",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
