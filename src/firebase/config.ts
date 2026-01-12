// src/firebase/config.ts
import type { FirebaseOptions } from "firebase/app";

/**
 * Config din mediul de execuție (NEXT_PUBLIC_ pentru client)
 * Setează în .env.local sau în Vercel:
 * NEXT_PUBLIC_FIREBASE_API_KEY
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * NEXT_PUBLIC_FIREBASE_APP_ID
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCcD3JASDRZYeRnGSEakgF8-yKRmSpyYJw',
  authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.http://homework-planner-two.vercel.app/`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-524597312-3104b',
  storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '451317985684',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:451317985684:web:5f70b71ee8dab7346b5f81"',
};
