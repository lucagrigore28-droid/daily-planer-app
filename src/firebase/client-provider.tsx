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
      const swUrl = `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}&authDomain=${firebaseConfig.authDomain}&projectId=${firebaseConfig.projectId}&storageBucket=${firebaseConfig.storageBucket}&messagingSenderId=${firebaseConfig.messagingSenderId}&appId=${firebaseConfig.appId}&measurementId=${firebaseConfig.measurementId}`;

      // This is a more robust registration that unregisters old service workers
      // before registering the new one. This helps prevent caching issues.
      const registerServiceWorker = async () => {
        try {
          // Find any existing registrations
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            // Unregister any old or incorrect service workers
            if (registration.scope.endsWith('/')) {
               console.log('Unregistering old service worker:', registration);
               await registration.unregister();
            }
          }

          // Register the new service worker
          const registration = await navigator.serviceWorker.register(swUrl);
          console.log('Service Worker registration successful, scope is:', registration.scope);
        } catch (err) {
          console.error('Service Worker registration failed:', err);
        }
      };

      registerServiceWorker();
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
