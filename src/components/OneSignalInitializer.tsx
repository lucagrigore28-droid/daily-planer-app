'use client';

import { useUser } from '@/firebase';
import { useEffect } from 'react';

export function OneSignalInitializer() {
    const { user, isUserLoading } = useUser();

    // Initialize OneSignal
    useEffect(() => {
        // Prevents initialization on the server or if already initialized.
        if (typeof window === 'undefined' || (window as any)._oneSignalInitialized) {
            return;
        }

        (window as any)._oneSignalInitialized = true;
        (window as any).OneSignal = (window as any).OneSignal || [];
        (window as any).OneSignal.push(() => {
            (window as any).OneSignal.init({
                appId: "400f3bbd-7ec3-4a64-9d86-c32333a167cb", 
                allowLocalhostAsSecureOrigin: true,
            });
        });
    }, []);

    // Associate user with OneSignal
    useEffect(() => {
        if (isUserLoading || typeof window === 'undefined' || !(window as any).OneSignal) {
            return;
        }

        (window as any).OneSignal.push(() => {
            if (user) {
                // Set External User ID
                (window as any).OneSignal.login(user.uid);
            } else {
                // If user is logged out, logout from OneSignal
                if ((window as any).OneSignal.User.isLoggedIn()) {
                    (window as any).OneSignal.logout();
                }
            }
        });
    }, [user, isUserLoading]);

    return null; // This component doesn't render anything.
}
