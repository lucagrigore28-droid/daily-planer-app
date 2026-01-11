
'use client';

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
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setFirebaseServices({ app, auth, firestore });
    }
    // If the config is not set, firebaseServices remains null. The app should handle this gracefully.
  }, []); // Empty dependency array ensures this runs only once on mount.

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
