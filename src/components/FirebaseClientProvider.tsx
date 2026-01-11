"use client";

import React, { useEffect, useMemo } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import firebaseApp from '@/firebase/config';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    return { app: firebaseApp, auth, firestore };
  }, []);

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
