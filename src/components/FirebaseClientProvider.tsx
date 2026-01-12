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
  const [initAttempted, setInitAttempted] = useState(false);

  useEffect(() => {
    // If config is missing we log and don't try to initialize.
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error(
        'Firebase config is not set. Please check your environment variables (NEXT_PUBLIC_FIREBASE_...).'
      );
      setInitAttempted(true);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setFirebaseServices({ app, auth, firestore });
      setInitAttempted(true);
    } catch (err) {
      console.error('Error initializing Firebase client:', err);
      setInitAttempted(true);
    }
  }, []);

  // Important: do NOT render children that expect FirebaseContext
  // until firebaseServices is available. Return null or a small loader.
  // This prevents useUser/useContext from running before the provider exists.
  if (!firebaseServices) {
    // If we attempted init and failed, you might render a fallback UI here.
    // For now we render nothing to avoid splash of broken UI.
    return null;
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