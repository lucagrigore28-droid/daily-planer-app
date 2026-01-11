// src/firebase/config.ts
import { initializeApp, getApp, getApps } from "firebase/app";

/**
 * Config din mediul de execuție (NEXT_PUBLIC_ pentru client)
 * Setează în .env.local sau în Vercel:
 * NEXT_PUBLIC_FIREBASE_API_KEY
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * NEXT_PUBLIC_FIREBASE_APP_ID
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

function initializeClientApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  // Do not initialize if the config is not set
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase config is not set. Please check your environment variables.");
    // Return a mock app object to avoid crashing the app
    return {
        name: 'mock-app',
        options: {},
        automaticDataCollectionEnabled: false,
    };
  }
  return initializeApp(firebaseConfig);
}

const app = initializeClientApp();
export default app;
