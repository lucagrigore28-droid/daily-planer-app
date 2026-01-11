
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
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error("Firebase config is not set. Please check your environment variables.");
        return { app: null, auth: null, firestore: null };
    }
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { app, auth, firestore };
  }, []);

  if (!firebaseServices.app) {
      // Render children without Firebase context if config is missing.
      // This allows the app to run without crashing, though Firebase features will be disabled.
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
