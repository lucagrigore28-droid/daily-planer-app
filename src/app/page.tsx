
"use client";

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/contexts/AppContext';
import SetupWizard from '@/components/setup/SetupWizard';
import HomeworkDashboard from '@/components/dashboard/HomeworkDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/firebase';

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
  const { user, isUserLoading } = useAuth();
  const router = useRouter();

  const { userData, isDataLoaded } = context || {};

  if (isUserLoading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    router.push('/login');
    return <LoadingScreen />;
  }

  if (!isDataLoaded || !context) {
    return <LoadingScreen />;
  }
  
  const showWizard = !userData?.setupComplete;

  return (
    <div className={showWizard ? "bg-background" : "dashboard-background min-h-screen"}>
        {showWizard ? <SetupWizard /> : <HomeworkDashboard />}
    </div>
  );
}

export default function Home() {
  return <AppContainer />;
}
