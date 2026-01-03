
"use client";

import React, { useState, useContext, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import { BellRing, BellOff, CalendarDays } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';

type StepProps = {
  onNext: () => void;
  onBack: () => void;
};

export default function StepNotifications({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  
  // Local state to manage form inputs
  const [notificationsEnabled, setNotificationsEnabled] = useState(context?.userData.notifications.enabled || false);
  const [afterSchoolTime, setAfterSchoolTime] = useState(context?.userData.notifications.afterSchoolTime || '15:00');
  const [eveningTime, setEveningTime] = useState(context?.userData.notifications.eveningTime || '20:00');
  const [weekendEnabled, setWeekendEnabled] = useState(context?.userData.notifications.weekendEnabled || true);
  const [saturdayMorningTime, setSaturdayMorningTime] = useState(context?.userData.notifications.saturdayMorningTime || '10:00');
  const [saturdayEveningTime, setSaturdayEveningTime] = useState(context?.userData.notifications.saturdayEveningTime || '20:00');
  const [sundayMorningTime, setSundayMorningTime] = useState(context?.userData.notifications.sundayMorningTime || '11:00');
  const [sundayEveningTime, setSundayEveningTime] = useState(context?.userData.notifications.sundayEveningTime || '20:00');


  useEffect(() => {
    // This check runs only on the client-side, avoiding SSR errors.
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Sync local state if context changes (e.g. in settings dialog)
    const notifications = context?.userData.notifications;
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
  }, [context?.userData.notifications]);


  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Acest browser nu suportă notificări.");
      return;
    }
    // The result of requestPermission() is the source of truth.
    const status = await Notification.requestPermission();
    setPermission(status);
    
    if (status === 'granted') {
      // If permission is granted, toggle the state on.
      setNotificationsEnabled(true);
      context?.updateUser({
        notifications: {
          ...context.userData.notifications,
          enabled: true,
        }
      });
    }
  };
  
  const handleMasterToggle = (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
        requestPermission();
        return;
    }
    setNotificationsEnabled(enabled);
    context?.updateUser({
      notifications: {
        ...context.userData.notifications,
        enabled,
      }
    });
  }

  const handleUpdateNotificationSettings = (key: string, value: any) => {
      context?.updateUser({
          notifications: {
              ...context.userData.notifications,
              [key]: value
          }
      });
  };

  const handleFinishSetup = () => {
    context?.updateUser({ setupComplete: true });
    // This is the final step, it will call onNext which is an empty function but in the wizard it transitions
    if(onNext !== StepNotifications.defaultProps.onNext) {
      onNext();
    }
  };

  const isSetup = onNext !== StepNotifications.defaultProps.onNext;

  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Notificări Inteligente</CardTitle>
        <CardDescription>
          Primește un sumar zilnic cu temele rămase pentru a fi mereu la zi. Nu vom trimite spam.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
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

      </CardContent>
      {isSetup && (
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>Înapoi</Button>
          <Button onClick={handleFinishSetup}>Finalizează Configurarea</Button>
        </CardFooter>
      )}
    </Card>
  );
}


StepNotifications.defaultProps = {
  onNext: () => {},
  onBack: () => {},
};

    