
"use client";

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/contexts/AppContext';
import SetupWizard from '@/components/setup/SetupWizard';
import HomeworkDashboard from '@/components/dashboard/HomeworkDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import WelcomeBackScreen from '@/components/dashboard/WelcomeBackScreen';

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

export default function Home() {
  const context = useContext(AppContext);
  const router = useRouter();
  const [showWelcomeBack, setShowWelcomeBack] = useState(true);
  const [isNewSetup, setIsNewSetup] = useState(false);

  const { isUserLoading, user, userData, isDataLoaded, createInitialUserDocument } = context || { 
      isUserLoading: true, 
      user: null, 
      userData: undefined, // Use undefined to distinguish from null (no document)
      isDataLoaded: false,
      createInitialUserDocument: async () => {},
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (isDataLoaded && user && userData === null) {
      createInitialUserDocument();
    }
  }, [isDataLoaded, user, userData, createInitialUserDocument]);
  
  if (isUserLoading || !isDataLoaded || userData === undefined) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoadingScreen />;
  }
  
  const showWizard = !userData?.setupComplete;

  if (showWizard) {
      return (
        <div className="bg-gradient-primary-accent min-h-screen">
            <SetupWizard onFinish={() => setIsNewSetup(true)} />
        </div>
      );
  }

  if (showWelcomeBack && !isNewSetup) {
    return <WelcomeBackScreen onNext={() => setShowWelcomeBack(false)} />
  }

  return (
    <div className="dashboard-background min-h-screen">
      <HomeworkDashboard />
    </div>
  );
}
