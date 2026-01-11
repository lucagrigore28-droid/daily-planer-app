
"use client";

import React, { useMemo } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // This check is now safe because useMemo runs on the client.
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error("Firebase config is not set. Please check your environment variables.");
        return { app: null, auth: null, firestore: null };
    }
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { app, auth, firestore };
  }, []);

  // If services couldn't be initialized (e.g., missing config),
  // we render children without the provider to avoid crashing the app.
  // The context will report `areServicesAvailable: false`.
  if (!firebaseServices.app) {
      return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.app}
      auth={firebaseServices.auth!}
      firestore={firebaseServices.firestore!}
    >
      {children}
    </FirebaseProvider>
  );
}
