"use client";

import { useContext, useState, useEffect } from 'react';
import { AppContext } from '@/contexts/AppContext';
import SetupWizard from '@/components/setup/SetupWizard';
import HomeworkDashboard from '@/components/dashboard/HomeworkDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import SplashScreen from '@/components/SplashScreen';

function AppContainer() {
  const context = useContext(AppContext);
  const [splashScreenDone, setSplashScreenDone] = useState(false);

  useEffect(() => {
    // If setup is not complete, we don't want a splash screen, just the wizard.
    if (context?.isDataLoaded && !context.userData.setupComplete) {
      setSplashScreenDone(true);
    }
  }, [context?.isDataLoaded, context?.userData?.setupComplete]);


  if (context === null) {
    // This can happen briefly on initial render before context is available.
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w
-full" />
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
  
  const showWizard = userData ? !userData.setupComplete : true;

  if (!splashScreenDone) {
      return <SplashScreen onNext={() => setSplashScreenDone(true)} />;
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
