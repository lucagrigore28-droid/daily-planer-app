'use client';
import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { useUser } from '@/firebase';

export default function OneSignalInitializer() {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    const initOneSignal = async () => {
      if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
        console.error("OneSignal App ID is not configured.");
        return;
      }
      // OneSignal.init will not re-initialize if already initialized
      if (!OneSignal.isInitialized) {
        await OneSignal.init({ appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID, allowLocalhostAsSecureOrigin: true });
      }
    };
    initOneSignal();
  }, []);

  useEffect(() => {
    if (OneSignal.isInitialized) {
      if (!isUserLoading && user) {
        OneSignal.setExternalUserId(user.uid);
      } else if (!isUserLoading && !user) {
        OneSignal.removeExternalUserId();
      }
    }
  }, [user, isUserLoading]);

  return null; // This component does not render anything
}
