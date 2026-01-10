
// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// This script has access to the DOM, so we can pull this from the process environment
const firebaseConfig = {
    apiKey: self.location.search.split('apiKey=')[1].split('&')[0],
    authDomain: self.location.search.split('authDomain=')[1].split('&')[0],
    projectId: self.location.search.split('projectId=')[1].split('&')[0],
    storageBucket: self.location.search.split('storageBucket=')[1].split('&')[0],
    messagingSenderId: self.location.search.split('messagingSenderId=')[1].split('&')[0],
    appId: self.location.search.split('appId=')[1].split('&')[0],
};

firebase.initializeApp(firebaseConfig);


// Retrieve an instance of Firebase Messaging so that it can handle background messages.
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
