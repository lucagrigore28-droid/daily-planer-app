
'use client';

import { useEffect, useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';

export const OneSignalInitializer = () => {
  const context = useContext(AppContext);
  const user = context?.user;

  useEffect(() => {
    const OneSignal = window.OneSignal || [];
    const initOneSignal = async () => {
      await OneSignal.push(async () => {
        await OneSignal.init({
          appId: "b999f0f0-bbc1-4ecc-b1a3-bc7233785b01",
          safari_web_id: "web.onesignal.auto.1c5d08b3-3aef-4a87-882a-248439b15748",
          notifyButton: {
            enable: true,
          },
          allowLocalhostAsSecureOrigin: true,
        });
      });
    };

    initOneSignal();
  }, []);

  useEffect(() => {
    if (user && window.OneSignal) {
      window.OneSignal.push(async () => {
        try {
          await window.OneSignal.login(user.uid);
        } catch (e) {
          console.error("OneSignal login error:", e);
        }
      });
    } else if (!user && window.OneSignal) {
        window.OneSignal.push(async () => {
            if (window.OneSignal.User.isSubscribed()) {
                try {
                    await window.OneSignal.logout();
                } catch (e) {
                    console.error("OneSignal logout error:", e);
                }
            }
      });
    }
  }, [user]);

  return null;
};
