'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { firebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const swUrl = `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}&authDomain=${firebaseConfig.authDomain}&projectId=${firebaseConfig.projectId}&storageBucket=${firebaseConfig.storageBucket}&messagingSenderId=${firebaseConfig.messagingSenderId}&appId=${firebaseConfig.appId}`;
      
      navigator.serviceWorker.getRegistration().then((registration) => {
        // If there's no registration, or the existing one isn't for our SW, register it.
        if (!registration || registration.scope !== new URL('/', location.href).toString() || !registration.active?.scriptURL.includes('firebase-messaging-sw.js')) {
          navigator.serviceWorker
            .register(swUrl)
            .then((registration) => {
              console.log('Service Worker registration successful, scope is:', registration.scope);
            })
            .catch((err) => {
              console.error('Service Worker registration failed:', err);
            });
        } else {
            console.log('Service Worker already registered, scope is:', registration.scope);
        }
      });
    }
  }, []);


  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
