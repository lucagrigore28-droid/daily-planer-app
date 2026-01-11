"use client";

import React, { useState, useContext, useEffect } from 'react';
import { CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import { BellRing, BellOff, CalendarClock, Sparkles, Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { getMessaging, getToken } from "firebase/messaging";
import { useFirebaseApp } from '@/firebase';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import type { WeekendNotifications, NotificationTime } from '@/lib/types';
import { cn } from '@/lib/utils';

type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

const TimeSelector = ({ id, label, value, onChange, onBlur, description }: { id: string, label: string, value: string, onChange: (value: string) => void, onBlur: (e: React.FocusEvent<HTMLInputElement>) => void, description?: string }) => (
    <div className="grid gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
            id={id}
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className="w-48"
        />
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
);

const NotificationSetting = ({ id, label, checked, onCheckedChange }: { id: string, label: string, checked: boolean, onCheckedChange: (checked: boolean) => void }) => (
    <div className="flex items-center space-x-2">
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
        <Label htmlFor={id}>{label}</Label>
    </div>
);

const WeekendDaySettings = ({ title, morningConfig, onMorningChange, eveningConfig, onEveningChange, onBlur }: {
    title: string;
    morningConfig: NotificationTime;
    onMorningChange: (config: NotificationTime) => void;
    eveningConfig: NotificationTime;
    onEveningChange: (config: NotificationTime) => void;
    onBlur: () => void;
}) => {
    return (
        <div className="space-y-6 rounded-lg border p-4">
            <h5 className="font-semibold text-lg">{title}</h5>
            <div className="space-y-4 pl-4 border-l-2 border-border">
                <div className="flex items-center gap-4">
                     <Sun className="h-5 w-5 text-amber-500" />
                     <h6 className="font-medium">Notificare de dimineață</h6>
                </div>
                <div className="pl-9 space-y-4">
                    <NotificationSetting
                        id={`${title}-morning-enabled`}
                        label="Activată"
                        checked={morningConfig.enabled}
                        onCheckedChange={(enabled) => onMorningChange({ ...morningConfig, enabled })}
                    />
                    {morningConfig.enabled && (
                        <TimeSelector
                            id={`${title}-morning-time`}
                            label="Ora"
                            value={morningConfig.time}
                            onChange={(time) => onMorningChange({ ...morningConfig, time })}
                            onBlur={onBlur}
                        />
                    )}
                </div>
            </div>
            <div className="space-y-4 pl-4 border-l-2 border-border">
                <div className="flex items-center gap-4">
                     <Moon className="h-5 w-5 text-blue-400" />
                     <h6 className="font-medium">Notificare de seară</h6>
                </div>
                 <div className="pl-9 space-y-4">
                    <NotificationSetting
                        id={`${title}-evening-enabled`}
                        label="Activată"
                        checked={eveningConfig.enabled}
                        onCheckedChange={(enabled) => onEveningChange({ ...eveningConfig, enabled })}
                    />
                    {eveningConfig.enabled && (
                        <TimeSelector
                            id={`${title}-evening-time`}
                            label="Ora"
                            value={eveningConfig.time}
                            onChange={(time) => onEveningChange({ ...eveningConfig, time })}
                            onBlur={onBlur}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};


export default function StepNotifications({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const firebaseApp = useFirebaseApp();
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  
  const notifications = context?.userData?.notifications;
  const isWizardStep = !!onNext;

  const [masterEnabled, setMasterEnabled] = useState(notifications?.enabled || false);
  
  const [dailyTime, setDailyTime] = useState(notifications?.dailyTime || '19:00');

  const [secondDailyEnabled, setSecondDailyEnabled] = useState(notifications?.secondDailyTimeEnabled || false);
  const [secondDailyTime, setSecondDailyTime] = useState(notifications?.secondDailyTime || '08:00');
  
  const [weekendEnabled, setWeekendEnabled] = useState(notifications?.weekendSummaryEnabled || true);
  const [weekendTime, setWeekendTime] = useState(notifications?.weekendSummaryTime || '20:00');
  
  const [weekendNotifications, setWeekendNotifications] = useState<WeekendNotifications>(notifications?.weekend || {
    saturdayMorning: { enabled: true, time: '10:00' },
    saturdayEvening: { enabled: true, time: '20:00' },
    sundayMorning: { enabled: true, time: '10:00' },
    sundayEvening: { enabled: true, time: '20:00' },
  });


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
      setSecondDailyEnabled(notifs.secondDailyTimeEnabled || false);
      setSecondDailyTime(notifs.secondDailyTime || '08:00');
      setWeekendEnabled(notifs.weekendSummaryEnabled || false);
      setWeekendTime(notifs.weekendSummaryTime || '20:00');
      setWeekendNotifications(notifs.weekend || {
          saturdayMorning: { enabled: true, time: '10:00' },
          saturdayEvening: { enabled: true, time: '20:00' },
          sundayMorning: { enabled: true, time: '10:00' },
          sundayEvening: { enabled: true, time: '20:00' },
      });
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
      
      handleUpdateNotificationSettings({ enabled: true });
    }
  };
  
  const handleMasterToggle = (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
        requestPermissionAndToken();
        return;
    }

    setMasterEnabled(enabled);
    handleUpdateNotificationSettings({ enabled });

    if (enabled && permission === 'granted' && !context.userData?.fcmTokens?.length) {
        requestPermissionAndToken();
    }
  }

  const handleUpdateNotificationSettings = (updates: any) => {
      if (context?.userData) {
        context?.updateUser({
            notifications: {
                ...context.userData.notifications,
                ...updates,
            }
        });
      }
  };

  return (
    <div className={cn("flex flex-col h-full", isWizardStep ? "" : "bg-card/80 backdrop-blur-sm sm:border sm:rounded-lg sm:shadow-lg")}>
      <CardHeader className="shrink-0">
        <CardTitle className="font-headline text-2xl">Notificări Inteligente</CardTitle>
        <CardDescription>
          Primește memento-uri utile pentru a fi mereu la zi. Poți configura notificări separate pentru weekend.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
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
                <Tabs defaultValue="weekdays" className="w-full fade-in-up flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-2 shrink-0">
                        <TabsTrigger value="weekdays">Zilele Săptămânii</TabsTrigger>
                        <TabsTrigger value="weekend">Weekend</TabsTrigger>
                    </TabsList>
                    <div className="flex-1 mt-2 min-h-0 overflow-y-auto pr-2 -mr-2">
                      <TabsContent value="weekdays" className="h-full m-0">
                           <div className="space-y-8 pt-4">
                             <div>
                                  <div className="flex items-center gap-3 mb-4">
                                     <CalendarClock className="h-6 w-6 text-primary/80" />
                                     <h4 className="font-semibold text-lg">Notificări Zilnice (Luni-Vineri)</h4>
                                  </div>
                                  <div className="space-y-6 pl-9">
                                      <TimeSelector 
                                          id="daily-time"
                                          label="Ora principală"
                                          value={dailyTime}
                                          onChange={setDailyTime}
                                          onBlur={(e) => handleUpdateNotificationSettings({ dailyTime: e.target.value })}
                                          description="Un sumar zilnic cu temele pentru a doua zi."
                                      />
                                      <div className="space-y-4">
                                         <NotificationSetting
                                              id="second-daily-switch"
                                              label="Activează a doua notificare zilnică"
                                              checked={secondDailyEnabled}
                                              onCheckedChange={(checked) => {
                                                setSecondDailyEnabled(checked);
                                                handleUpdateNotificationSettings({ secondDailyTimeEnabled: checked });
                                              }}
                                          />
                                          {secondDailyEnabled && (
                                             <div className="fade-in-up">
                                                <TimeSelector 
                                                    id="second-daily-time"
                                                    label="A doua oră"
                                                    value={secondDailyTime}
                                                    onChange={setSecondDailyTime}
                                                    onBlur={(e) => handleUpdateNotificationSettings({ secondDailyTime: e.target.value })}
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
                                      <h4 className="font-semibold text-lg">Sumar de Weekend</h4>
                                  </div>
                                   <div className="space-y-6 pl-9">
                                        <NotificationSetting
                                          id="weekend-summary-switch"
                                          label="Activează sumarul de vineri"
                                          checked={weekendEnabled}
                                          onCheckedChange={(checked) => {
                                            setWeekendEnabled(checked);
                                            handleUpdateNotificationSettings({ weekendSummaryEnabled: checked });
                                          }}
                                      />
                                       {weekendEnabled && (
                                          <div className="fade-in-up">
                                            <TimeSelector 
                                                id="weekend-summary-time"
                                                label="Ora sumarului"
                                                value={weekendTime}
                                                onChange={setWeekendTime}
                                                onBlur={(e) => handleUpdateNotificationSettings({ weekendSummaryTime: e.target.value })}
                                                description="Vinerea, vei primi un sumar cu toate temele."
                                            />
                                          </div>
                                        )}
                                   </div>
                              </div>
                           </div>
                      </TabsContent>
                      <TabsContent value="weekend" className="h-full m-0">
                              <div className="space-y-6 pt-4">
                                  <WeekendDaySettings
                                      title="Sâmbătă"
                                      morningConfig={weekendNotifications.saturdayMorning}
                                      onMorningChange={(config) => setWeekendNotifications(prev => ({...prev, saturdayMorning: config}))}
                                      eveningConfig={weekendNotifications.saturdayEvening}
                                      onEveningChange={(config) => setWeekendNotifications(prev => ({...prev, saturdayEvening: config}))}
                                      onBlur={() => handleUpdateNotificationSettings({ weekend: weekendNotifications })}
                                  />
                                   <WeekendDaySettings
                                      title="Duminică"
                                      morningConfig={weekendNotifications.sundayMorning}
                                      onMorningChange={(config) => setWeekendNotifications(prev => ({...prev, sundayMorning: config}))}
                                      eveningConfig={weekendNotifications.sundayEvening}
                                      onEveningChange={(config) => setWeekendNotifications(prev => ({...prev, sundayEvening: config}))}
                                      onBlur={() => handleUpdateNotificationSettings({ weekend: weekendNotifications })}
                                  />
                              </div>
                      </TabsContent>
                    </div>
                </Tabs>
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
