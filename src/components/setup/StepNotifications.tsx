"use client";

import React, { useState, useContext, useEffect } from 'react';
import { CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import { BellRing, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { getMessaging, getToken } from "firebase/messaging";
import { app } from '@/firebase/config';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import type { UserNotifications } from '@/lib/types';

type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || "";

export async function requestPermissionAndGetToken(addFcmToken: (token: string) => void) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Permisiune notificări refuzată");
      return null;
    }

    if (!VAPID_KEY) {
      console.error("VAPID key is not set. Check NEXT_PUBLIC_VAPID_KEY environment variable.");
      alert('Configurare incompletă: Cheia VAPID pentru notificări lipsește.');
      return null;
    }
    
    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (currentToken) {
      console.log("FCM token:", currentToken);
      addFcmToken(currentToken);
      return currentToken;
    } else {
      console.log("Nu s-a putut obține token-ul (null). Verifică VAPID / config.");
      return null;
    }
  } catch (err) {
    console.error("Eroare la getToken:", err);
    return null;
  }
}

export default function StepNotifications({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
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
  
  const handleMasterToggle = async (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
        const token = await requestPermissionAndGetToken(context.addFcmToken);
        if (token) {
            handleUpdateNotificationSettings({ enabled: true, dailyTime });
            setPermission('granted');
            setMasterEnabled(true);
        } else {
            handleUpdateNotificationSettings({ enabled: false });
            setMasterEnabled(false);
        }
    } else {
        handleUpdateNotificationSettings({ enabled, dailyTime });
        setMasterEnabled(enabled);
        if (enabled && permission === 'granted' && !context.userData?.fcmTokens?.length) {
            await requestPermissionAndGetToken(context.addFcmToken);
        }
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
