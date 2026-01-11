// src/firebase/config.ts
import { initializeApp, getApp, getApps, type FirebaseOptions } from "firebase/app";

/**
 * Config din mediul de execuție (NEXT_PUBLIC_ pentru client)
 * Setează în .env.local sau în Vercel:
 * NEXT_PUBLIC_FIREBASE_API_KEY
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * NEXT_PUBLIC_FIREBASE_APP_ID
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// This function should only be called on the client side.
function initializeClientApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase config is not set. Please check your environment variables.");
    // Return a mock-like object or handle this case as you see fit
    // This part of the code should ideally not be reached on the client if env vars are set.
    return {
        name: 'mock-app',
        options: {},
        automaticDataCollectionEnabled: false,
    };
  }
  return initializeApp(firebaseConfig);
}

// We no longer export the initialized app from here to prevent server-side execution.
// The initialization will be handled in a client-side specific context provider.
const app = (typeof window !== 'undefined') ? initializeClientApp() : null;

export default app;
