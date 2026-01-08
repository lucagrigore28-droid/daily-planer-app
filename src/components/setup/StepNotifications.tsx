"use client";

import React, { useState, useContext, useEffect } from 'react';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import { BellRing, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { getMessaging, getToken } from "firebase/messaging";
import { useFirebaseApp } from '@/firebase';

type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export default function StepNotifications({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const firebaseApp = useFirebaseApp();
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  
  const notifications = context?.userData?.notifications;

  const [notificationsEnabled, setNotificationsEnabled] = useState(notifications?.enabled || false);
  const [afterSchoolTime, setAfterSchoolTime] = useState(notifications?.afterSchoolTime || '15:00');
  const [eveningTime, setEveningTime] = useState(notifications?.eveningTime || '20:00');
  const [weekendEnabled, setWeekendEnabled] = useState(notifications?.weekendEnabled || true);
  const [saturdayMorningTime, setSaturdayMorningTime] = useState(notifications?.saturdayMorningTime || '10:00');
  const [saturdayEveningTime, setSaturdayEveningTime] = useState(notifications?.saturdayEveningTime || '20:00');
  const [sundayMorningTime, setSundayMorningTime] = useState(notifications?.sundayMorningTime || '11:00');
  const [sundayEveningTime, setSundayEveningTime] = useState(notifications?.sundayEveningTime || '20:00');


  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const notifications = context?.userData?.notifications;
    if (notifications) {
      setNotificationsEnabled(notifications.enabled);
      setAfterSchoolTime(notifications.afterSchoolTime);
      setEveningTime(notifications.eveningTime);
      setWeekendEnabled(notifications.weekendEnabled);
      setSaturdayMorningTime(notifications.saturdayMorningTime);
      setSaturdayEveningTime(notifications.saturdayEveningTime);
      setSundayMorningTime(notifications.sundayMorningTime);
      setSundayEveningTime(notifications.sundayEveningTime);
    }
  }, [context?.userData?.notifications]);


  const requestPermissionAndToken = async () => {
    if (!("Notification" in window) || !firebaseApp) {
      alert("Acest browser nu suportă notificări.");
      return;
    }

    const status = await Notification.requestPermission();
    setPermission(status);

    if (status === 'granted') {
      setNotificationsEnabled(true);
      
      const messaging = getMessaging(firebaseApp);
      try {
        const currentToken = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_HERE' }); // IMPORTANT: Replace with your actual VAPID key
        if (currentToken) {
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
                        <h4 className="font-semibold text-lg mb-4">Notificări în timpul săptămânii</h4>
                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="after-school-time">Prima notificare (după școală)</Label>
                                <Input
                                    id="after-school-time"
                                    type="time"
                                    value={afterSchoolTime}
                                    onChange={(e) => setAfterSchoolTime(e.target.value)}
                                    onBlur={(e) => handleUpdateNotificationSettings('afterSchoolTime', e.target.value)}
                                    className="w-48"
                                />
                                <p className="text-sm text-muted-foreground">O alertă când ajungi acasă, ca să știi ce ai de făcut.</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="evening-time">A doua notificare (seara)</Label>
                                <Input
                                    id="evening-time"
                                    type="time"
                                    value={eveningTime}
                                    onChange={(e) => setEveningTime(e.target.value)}
                                    onBlur={(e) => handleUpdateNotificationSettings('eveningTime', e.target.value)}
                                    className="w-48"
                                />
                                <p className="text-sm text-muted-foreground">Un ultim memento, în caz că ai uitat ceva.</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-lg">Notificări de Weekend</h4>
                             <Switch
                                checked={weekendEnabled}
                                onCheckedChange={(checked) => {
                                    setWeekendEnabled(checked);
                                    handleUpdateNotificationSettings('weekendEnabled', checked);
                                }}
                            />
                        </div>
                        {weekendEnabled && (
                            <div className="space-y-6 pl-4 border-l-2 border-primary/50 fade-in-up">
                                 <div className="grid gap-2">
                                    <Label htmlFor="saturday-morning-time">Sâmbătă dimineața</Label>
                                    <Input
                                        id="saturday-morning-time"
                                        type="time"
                                        value={saturdayMorningTime}
                                        onChange={(e) => setSaturdayMorningTime(e.target.value)}
                                        onBlur={(e) => handleUpdateNotificationSettings('saturdayMorningTime', e.target.value)}
                                        className="w-48"
                                    />
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="saturday-evening-time">Sâmbătă seara</Label>
                                    <Input
                                        id="saturday-evening-time"
                                        type="time"
                                        value={saturdayEveningTime}
                                        onChange={(e) => setSaturdayEveningTime(e.target.value)}
                                         onBlur={(e) => handleUpdateNotificationSettings('saturdayEveningTime', e.target.value)}
                                        className="w-48"
                                    />
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="sunday-morning-time">Duminică dimineața</Label>
                                    <Input
                                        id="sunday-morning-time"
                                        type="time"
                                        value={sundayMorningTime}
                                        onChange={(e) => setSundayMorningTime(e.target.value)}
                                         onBlur={(e) => handleUpdateNotificationSettings('sundayMorningTime', e.target.value)}
                                        className="w-48"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="sunday-evening-time">Duminică seara</Label>
                                    <Input
                                        id="sunday-evening-time"
                                        type="time"
                                        value={sundayEveningTime}
                                        onChange={(e) => setSundayEveningTime(e.target.value)}
                                        onBlur={(e) => handleUpdateNotificationSettings('sundayEveningTime', e.target.value)}
                                        className="w-48"
                                    />
                                </div>
                            </div>
                        )}
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
