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
                appId: "os_v2_org_xgm7b4f3yfhmzmndxrzdg6c3aflxxd6zlunuw7u4fhlrzvci7acipu2fq3myx47y6qghgscko3v6tgsiptzm4nu7mm6otmszf5zrtti", // Aici veți pune ID-ul aplicației OneSignal
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
