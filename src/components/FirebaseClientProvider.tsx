"use client";

import React, { useState, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices>(null);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setFirebaseServices({ app, auth, firestore });
    }
    // If the config is not set, firebaseServices remains null.
    // The rest of the app should handle the null services state gracefully (e.g. show a loading screen).
    // Removing the console.error here prevents the Vercel build from failing if env vars aren't set during build time.
  }, []); // Empty dependency array ensures this runs only once on mount.

  // If services are not yet initialized, we can render a loading state
  // or just the children without the provider. For now, we render children
  // without the provider, and the context will report services as unavailable.
  if (!firebaseServices) {
      return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.app}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
