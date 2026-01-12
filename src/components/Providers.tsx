'use client';

import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { FirebaseClientProvider } from './FirebaseClientProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
    >
      <FirebaseClientProvider>
        <AppProvider>
          {children}
          <Toaster />
          <ServiceWorkerRegistrar />
        </AppProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
