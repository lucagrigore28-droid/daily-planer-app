
"use client";

import React, { useState, useContext, useEffect } from 'react';
import { CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import { BellRing, BellOff, CalendarClock, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { getMessaging, getToken } from "firebase/messaging";
import { useFirebaseApp } from '@/firebase';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';

type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};


const TimeSelector = ({ id, label, value, onChange, onBlur, description }: { id: string, label: string, value: string, onChange: (value: string) => void, onBlur: (value: string) => void, description?: string }) => (
    <div className="grid gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
            id={id}
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={(e) => onBlur(e.target.value)}
            className="w-48"
        />
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
);


export default function StepNotifications({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const firebaseApp = useFirebaseApp();
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  
  const notifications = context?.userData?.notifications;

  const [masterEnabled, setMasterEnabled] = useState(notifications?.enabled || false);
  
  const [dailyTime, setDailyTime] = useState(notifications?.dailyTime || '19:00');

  const [secondDailyEnabled, setSecondDailyEnabled] = useState(notifications?.secondDailyTimeEnabled || false);
  const [secondDailyTime, setSecondDailyTime] = useState(notifications?.secondDailyTime || '08:00');
  
  const [weekendEnabled, setWeekendEnabled] = useState(notifications?.weekendSummaryEnabled || true);
  const [weekendTime, setWeekendTime] = useState(notifications?.weekendSummaryTime || '20:00');


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
      setSecondDailyEnabled(notifs.secondDailyTimeEnabled);
      setSecondDailyTime(notifs.secondDailyTime || '08:00');
      setWeekendEnabled(notifs.weekendSummaryEnabled);
      setWeekendTime(notifs.weekendSummaryTime || '20:00');
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

    setMasterEnabled(enabled);
    
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

  const handleUpdateNotificationSettings = (updates: Partial<typeof notifications>) => {
      if (context?.userData) {
        context?.updateUser({
            notifications: {
                ...context.userData.notifications,
                ...updates,
            }
        });
      }
  };

  const showNavButtons = !!onNext;


  return (
    <div className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Notificări Inteligente</CardTitle>
        <CardDescription>
          Primește memento-uri utile pentru a fi mereu la zi. Nu vom trimite spam.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-8">
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
                <div className="space-y-8 fade-in-up">
                     <div>
                        <div className="flex items-center gap-3 mb-4">
                           <CalendarClock className="h-6 w-6 text-primary/80" />
                           <h4 className="font-semibold text-lg">Notificări Zilnice</h4>
                        </div>
                        <div className="space-y-6 pl-9">
                            <TimeSelector 
                                id="daily-time"
                                label="Ora principală"
                                value={dailyTime}
                                onChange={setDailyTime}
                                onBlur={(value) => handleUpdateNotificationSettings({ dailyTime: value })}
                                description="Un sumar zilnic cu temele pentru a doua zi."
                            />
                            <div className="space-y-4">
                               <div className="flex items-center space-x-2">
                                    <Switch
                                        id="second-daily-switch"
                                        checked={secondDailyEnabled}
                                        onCheckedChange={(checked) => {
                                          setSecondDailyEnabled(checked);
                                          handleUpdateNotificationSettings({ secondDailyTimeEnabled: checked });
                                        }}
                                    />
                                    <Label htmlFor="second-daily-switch">Activează a doua notificare zilnică</Label>
                                </div>
                                {secondDailyEnabled && (
                                   <div className="fade-in-up">
                                      <TimeSelector 
                                          id="second-daily-time"
                                          label="A doua oră"
                                          value={secondDailyTime}
                                          onChange={setSecondDailyTime}
                                          onBlur={(value) => handleUpdateNotificationSettings({ secondDailyTime: value })}
                                          description="Un al doilea memento, de ex. dimineața."
                                      />
                                   </div>
                                )}
                            </div>
                        </div>
                    </div>
                     <Separator />
                     <div>
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="h-6 w-6 text-primary/80" />
                            <h4 className="font-semibold text-lg">Notificare de Weekend</h4>
                        </div>
                         <div className="space-y-6 pl-9">
                              <div className="flex items-center space-x-2">
                                <Switch
                                    id="weekend-summary-switch"
                                    checked={weekendEnabled}
                                    onCheckedChange={(checked) => {
                                      setWeekendEnabled(checked);
                                      handleUpdateNotificationSettings({ weekendSummaryEnabled: checked });
                                    }}
                                />
                                <Label htmlFor="weekend-summary-switch">Activează sumarul de weekend</Label>
                            </div>
                             {weekendEnabled && (
                                <div className="fade-in-up">
                                  <TimeSelector 
                                      id="weekend-summary-time"
                                      label="Ora sumarului de weekend"
                                      value={weekendTime}
                                      onChange={setWeekendTime}
                                      onBlur={(value) => handleUpdateNotificationSettings({ weekendSummaryTime: value })}
                                      description="Vinerea, vei primi un sumar cu toate temele."
                                  />
                                </div>
                              )}
                         </div>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
       {showNavButtons && (
         <CardFooter className="flex justify-between">
           <Button variant="ghost" onClick={onBack}>Înapoi</Button>
           <Button onClick={onNext}>Finalizează Configurarea</Button>
         </CardFooter>
       )}
    </div>
  );
}
