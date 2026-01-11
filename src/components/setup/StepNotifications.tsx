"use client";

import React, { useState, useContext, useEffect } from 'react';
import { CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import { BellRing, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { getMessaging, getToken } from "firebase/messaging";
import { useFirebaseApp } from '@/firebase';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import type { UserNotifications } from '@/lib/types';

type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export default function StepNotifications({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const firebaseApp = useFirebaseApp();
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  
  const notifications = context?.userData?.notifications;
  const isWizardStep = !!onNext;

  const [masterEnabled, setMasterEnabled] = useState(notifications?.enabled || false);
  const [dailyTime, setDailyTime] = useState(notifications?.dailyTime || '19:00');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const notifs = context?.userData?.notifications;
    if (notifs) {
      setMasterEnabled(notifs.enabled);
      setDailyTime(notifs.dailyTime || '19:00');
    }
  }, [context?.userData?.notifications]);

  const handleUpdateNotificationSettings = (updates: Partial<UserNotifications>) => {
    if (context?.userData) {
      const newNotifications = {
        ...context.userData.notifications,
        ...updates,
      };
      context?.updateUser({ notifications: newNotifications });
    }
  };

  const requestPermissionAndToken = async () => {
    if (!("Notification" in window) || !firebaseApp || !('serviceWorker' in navigator)) {
      alert("Acest browser nu suportă notificări în fundal.");
      return;
    }

    const status = await Notification.requestPermission();
    setPermission(status);

    if (status === 'granted') {
      setMasterEnabled(true);
      
      const messaging = getMessaging(firebaseApp);
      try {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
        if (!vapidKey) {
            console.error('VAPID key is not configured. Make sure NEXT_PUBLIC_VAPID_KEY is set in your .env or environment variables.');
            alert('Configurare incompletă: Cheia VAPID pentru notificări lipsește.');
            return;
        }
        const currentToken = await getToken(messaging, { 
            vapidKey,
            serviceWorkerRegistration: await navigator.serviceWorker.ready,
        });
        if (currentToken) {
          console.log('FCM Token:', currentToken);
          context?.addFcmToken(currentToken);
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
      
      handleUpdateNotificationSettings({ enabled: true, dailyTime });
    }
  };
  
  const handleMasterToggle = (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
        requestPermissionAndToken();
        return;
    }

    setMasterEnabled(enabled);
    // When toggling, always save the complete state
    handleUpdateNotificationSettings({ enabled, dailyTime });

    if (enabled && permission === 'granted' && !context.userData?.fcmTokens?.length) {
        requestPermissionAndToken();
    }
  }

  const handleTimeChange = (newTime: string) => {
    setDailyTime(newTime);
    // Only save if master switch is enabled
    if (masterEnabled) {
      handleUpdateNotificationSettings({ dailyTime: newTime });
    }
  };

  return (
    <div className={cn("flex flex-col h-full", isWizardStep ? "" : "bg-card/80 backdrop-blur-sm sm:border sm:rounded-lg sm:shadow-lg")}>
      <CardHeader className="shrink-0">
        <CardTitle className="font-headline text-2xl">Notificări Inteligente</CardTitle>
        <CardDescription>
          Primește un memento zilnic cu temele pentru a doua zi.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-background/50">
                <div className="flex items-center space-x-3">
                    {permission === 'granted' && masterEnabled ? <BellRing className="h-6 w-6 text-primary" /> : <BellOff className="h-6 w-6 text-muted-foreground" />}
                    <div>
                        <h3 className="font-semibold">Activează Notificările</h3>
                        <p className="text-sm text-muted-foreground">
                            {permission === 'default' && 'Trebuie să permiți notificările în browser.'}
                            {permission === 'denied' && 'Notificările sunt blocate în setările browser-ului.'}
                            {permission === 'granted' && (masterEnabled ? 'Notificările sunt active.' : 'Poți activa notificările.')}
                        </p>
                    </div>
                </div>
                <Switch
                    checked={masterEnabled}
                    onCheckedChange={handleMasterToggle}
                    disabled={permission === 'denied'}
                />
            </div>
            
            {masterEnabled && permission === 'granted' && (
                <div className="grid gap-2 fade-in-up">
                    <Label htmlFor="daily-time">Ora notificării zilnice</Label>
                    <Input
                        id="daily-time"
                        type="time"
                        value={dailyTime}
                        onChange={(e) => handleTimeChange(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">Vei primi un singur sumar zilnic cu temele pentru a doua zi.</p>
                </div>
            )}
        </div>
      </CardContent>
       {isWizardStep && (
         <CardFooter className="flex justify-between shrink-0 pt-6">
           <Button variant="ghost" onClick={onBack}>Înapoi</Button>
           <Button onClick={onNext}>Finalizează Configurarea</Button>
         </CardFooter>
       )}
    </div>
  );
}
