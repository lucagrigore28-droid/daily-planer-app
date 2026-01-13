
'use client';

import React, { useState, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

// Define the config directly in the client component
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};


function FullscreenLoader() {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-1/3 ml-auto" />
        </div>
      </div>
    );
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // A more robust check for all required public Firebase environment variables.
    const allKeysPresent =
      firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId;

    if (!allKeysPresent) {
      const errorMsg = 'Firebase config is not set. Please check your environment variables (NEXT_PUBLIC_FIREBASE_...).';
      console.error(errorMsg);
      setInitError(errorMsg);
      return;
    }

    try {
      // Check if Firebase app is already initialized to avoid re-initialization error
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setFirebaseServices({ app, auth, firestore });
    } catch (err: any) {
      console.error('Error initializing Firebase client:', err);
      setInitError(err.message || 'Failed to initialize Firebase.');
    }
  }, []);

  if (initError) {
    return (
        <div className="flex h-screen w-screen items-center justify-center p-4">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-destructive">Eroare de Configurare Firebase</h1>
                <p className="text-muted-foreground">Verifică consola browser-ului pentru detalii.</p>
                <pre className="mt-4 text-xs text-left bg-muted p-2 rounded-md">{initError}</pre>
            </div>
        </div>
    );
  }

  if (!firebaseServices) {
    return <FullscreenLoader />;
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
