"use client";

import { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import SetupWizard from '@/components/setup/SetupWizard';
import HomeworkDashboard from '@/components/dashboard/HomeworkDashboard';
import { Skeleton } from '@/components/ui/skeleton';

function AppContainer() {
  const context = useContext(AppContext);

  if (context === null) {
    // This can happen briefly on initial render before context is available.
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-1/3 ml-auto" />
        </div>
      </div>
    );
  }

  const { userData, isDataLoaded } = context;

  if (!isDataLoaded) {
    return (
       <div className="flex h-screen w-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-1/3 ml-auto" />
        </div>
      </div>
    );
  }

  if (userData && !userData.setupComplete) {
    return <SetupWizard />;
  }

  return <HomeworkDashboard />;
}

export default function Home() {
  return <AppContainer />;
}
