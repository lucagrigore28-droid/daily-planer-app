
"use client";

import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/contexts/AppContext';
import SetupWizard from '@/components/setup/SetupWizard';
import HomeworkDashboard from '@/components/dashboard/HomeworkDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import SplashScreen from '@/components/SplashScreen';

function AppContainer() {
  const context = useContext(AppContext);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  const { user, isUserLoading, userData, isDataLoaded } = context || {};

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !isDataLoaded || !context) {
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
  
  const showWizard = !userData?.setupComplete;

  if (showWizard && !isReady) {
      return <SplashScreen onNext={() => setIsReady(true)} />;
  }

  return (
    <div className={cn(showWizard ? "bg-background" : "dashboard-background min-h-screen")}>
        {showWizard ? <SetupWizard /> : <HomeworkDashboard />}
    </div>
  );
}

export default function Home() {
  return <AppContainer />;
}
