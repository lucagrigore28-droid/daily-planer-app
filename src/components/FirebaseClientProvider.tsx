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
    // This logic now runs only on the client, inside useMemo
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error("Firebase config is not set. Please check your environment variables.");
        // Return null or mock services if config is not set
        return { app: null, auth: null, firestore: null };
    }
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { app, auth, firestore };
  }, []);

  // Do not render the provider if the services could not be initialized
  if (!firebaseServices.app || !firebaseServices.auth || !firebaseServices.firestore) {
      // You might want to render a loading indicator or an error message here
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
