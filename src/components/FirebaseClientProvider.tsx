
'use client';

import React, { useState, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { Skeleton } from './ui/skeleton';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
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
    } catch (err) {
      console.error('Error initializing Firebase client:', err);
    }
    setInitAttempted(true);
  }, []);

  if (!firebaseServices) {
    if(initAttempted) {
        // If we tried to init but failed (e.g. missing config), show an error message.
        return (
            <div className="flex h-screen w-screen items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-destructive">Eroare de Configurare Firebase</h1>
                    <p className="text-muted-foreground">Verifică consola browser-ului pentru detalii.</p>
                </div>
            </div>
        );
    }
    // Still initializing...
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
