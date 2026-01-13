
'use client';

import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';
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
        </AppProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
