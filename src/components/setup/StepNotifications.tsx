
"use client";

import React, { useState, useContext, useEffect } from 'react';
import { CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import { BellRing, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { getMessaging, getToken } from "firebase/messaging";
import { useFirebaseApp } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

const generateTimeSlots = () => {
    const slots = [];
    for (let h = 7; h < 23; h++) {
        const hour = h.toString().padStart(2, '0');
        slots.push(`${hour}:00`);
    }
    return slots;
};

const timeSlots = generateTimeSlots();

const TimeSelector = ({ id, label, value, onChange, onBlur, description }: { id: string, label: string, value: string, onChange: (value: string) => void, onBlur: (value: string) => void, description?: string }) => (
    <div className="grid gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Select
            value={value}
            onValueChange={(newValue) => {
                onChange(newValue);
                onBlur(newValue);
            }}
        >
            <SelectTrigger id={id} className="w-48">
                <SelectValue placeholder="Alege ora" />
            </SelectTrigger>
            <SelectContent>
                {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
            </SelectContent>
        </Select>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
);


export default function StepNotifications({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const firebaseApp = useFirebaseApp();
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  
  const notifications = context?.userData?.notifications;

  const [notificationsEnabled, setNotificationsEnabled] = useState(notifications?.enabled || false);
  const [dailyTime, setDailyTime] = useState(notifications?.dailyTime || '19:00');


  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const notifications = context?.userData?.notifications;
    if (notifications) {
      setNotificationsEnabled(notifications.enabled);
      setDailyTime(notifications.dailyTime || '19:00');
    }
  }, [context?.userData?.notifications]);


  const requestPermissionAndToken = async () => {
    if (!("Notification" in window) || !firebaseApp || !('serviceWorker' in navigator)) {
      alert("Acest browser nu suportă notificări în fundal.");
      return;
    }

    const status = await Notification.requestPermission();
    setPermission(status);

    if (status === 'granted') {
      setNotificationsEnabled(true);
      
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
      
      if (context?.userData) {
        context?.updateUser({
          notifications: {
            ...context.userData.notifications,
            enabled: true,
          }
        });
      }
    }
  };
  
  const handleMasterToggle = (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
        requestPermissionAndToken();
        return;
    }

    setNotificationsEnabled(enabled);
    
    if (context?.userData) {
      context?.updateUser({
        notifications: {
          ...context.userData.notifications,
          enabled,
        }
      });
    }

    if (enabled && permission === 'granted' && !context.userData?.fcmTokens?.length) {
        requestPermissionAndToken();
    }
  }

  const handleUpdateNotificationSettings = (key: string, value: any) => {
      if (context?.userData) {
        context?.updateUser({
            notifications: {
                ...context.userData.notifications,
                [key]: value
            }
        });
      }
  };

  const handleFinishSetup = () => {
    if (onNext) {
      onNext();
    }
  };

  const showNavButtons = !!onNext;


  return (
    <div className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Notificări Inteligente</CardTitle>
        <CardDescription>
          Primește un sumar zilnic cu temele rămase pentru a fi mereu la zi. Nu vom trimite spam.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-8">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-background/50">
                <div className="flex items-center space-x-3">
                    {permission === 'granted' && notificationsEnabled ? <BellRing className="h-6 w-6 text-primary" /> : <BellOff className="h-6 w-6 text-muted-foreground" />}
                    <div>
                        <h3 className="font-semibold">Activează Notificările</h3>
                        <p className="text-sm text-muted-foreground">
                            {permission === 'default' && 'Trebuie să permiți notificările în browser.'}
                            {permission === 'denied' && 'Notificările sunt blocate în setările browser-ului.'}
                            {permission === 'granted' && (notificationsEnabled ? 'Notificările sunt active.' : 'Poți activa notificările.')}
                        </p>
                    </div>
                </div>
                <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={handleMasterToggle}
                    disabled={permission === 'denied'}
                />
            </div>
            
            {notificationsEnabled && permission === 'granted' && (
                <div className="space-y-8 fade-in-up">
                     <div>
                        <h4 className="font-semibold text-lg mb-4">Setare notificare zilnică</h4>
                        <div className="space-y-6">
                            <TimeSelector 
                                id="daily-time"
                                label="Ora de notificare"
                                value={dailyTime}
                                onChange={setDailyTime}
                                onBlur={(value) => handleUpdateNotificationSettings('dailyTime', value)}
                                description="Vei primi o singură notificare pe zi, la ora selectată."
                            />
                        </div>
                    </div>
                     <div className="p-3 rounded-lg border bg-secondary/50 text-secondary-foreground text-sm">
                        <p>Toate orele de notificare sunt bazate pe fusul orar al României (EET/EEST).</p>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
       {showNavButtons && (
         <CardFooter className="flex justify-between">
           <Button variant="ghost" onClick={onBack}>Înapoi</Button>
           <Button onClick={handleFinishSetup}>Finalizează Configurarea</Button>
         </CardFooter>
       )}
    </div>
  );
}
