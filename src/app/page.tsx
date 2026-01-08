
"use client";

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/contexts/AppContext';
import SetupWizard from '@/components/setup/SetupWizard';
import HomeworkDashboard from '@/components/dashboard/HomeworkDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';

function LoadingScreen() {
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


function AppContainer() {
  const context = useContext(AppContext);
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login only when loading is complete and there's no user.
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Show loading screen while user state is resolving or if we are about to redirect.
  if (isUserLoading || !user) {
    return <LoadingScreen />;
  }

  const { userData, isDataLoaded } = context || {};

  // After user is confirmed, wait for their specific data to load.
  if (!isDataLoaded || !context || userData === undefined) {
    return <LoadingScreen />;
  }
  
  // This is the core logic: show wizard if setup is not complete.
  const showWizard = !userData?.setupComplete;

  return (
    <div className={showWizard ? "bg-gradient-primary-accent" : "dashboard-background min-h-screen"}>
        {showWizard ? <SetupWizard /> : <HomeworkDashboard />}
    </div>
  );
}

export default function Home() {
  return <AppContainer />;
}
