
"use client";

import React, { useState, useContext, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import { BellRing, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '../ui/input';

type StepProps = {
  onNext: () => void;
  onBack: () => void;
};

export default function StepNotifications({ onBack }: StepProps) {
  const context = useContext(AppContext);
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(context?.userData.notifications.enabled || false);
  const [afterSchoolTime, setAfterSchoolTime] = useState(context?.userData.notifications.afterSchoolTime || '15:00');
  const [eveningTime, setEveningTime] = useState(context?.userData.notifications.eveningTime || '20:00');

  useEffect(() => {
    // This check runs only on the client-side, avoiding SSR errors.
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Sync local state if context changes (e.g. in settings dialog)
    setNotificationsEnabled(context?.userData.notifications.enabled || false);
    setAfterSchoolTime(context?.userData.notifications.afterSchoolTime || '15:00');
    setEveningTime(context?.userData.notifications.eveningTime || '20:00');
  }, [context?.userData.notifications]);


  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Acest browser nu suportă notificări.");
      return;
    }
    const status = await Notification.requestPermission();
    setPermission(status);
    if (status === 'granted') {
      handleToggle(true);
    }
  };
  
  const handleToggle = (enabled: boolean) => {
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

  const handleTimeChange = (type: 'afterSchool' | 'evening', time: string) => {
    if (type === 'afterSchool') {
        setAfterSchoolTime(time);
    } else {
        setEveningTime(time);
    }
    context?.updateUser({
      notifications: {
        ...context.userData.notifications,
        [type === 'afterSchool' ? 'afterSchoolTime' : 'eveningTime']: time,
      }
    });
  }

  const handleFinishSetup = () => {
    context?.updateUser({ setupComplete: true });
    // This is the final step, so it will transition to the dashboard automatically
  };

  const isSetup = onBack !== (() => {});

  return (
    <Card className="border-0 shadow-none sm:border-transparent sm:shadow-none">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Notificări Inteligente</CardTitle>
        <CardDescription>
          Primește un sumar zilnic cu temele rămase pentru a fi mereu la zi. Nu vom trimite spam.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex items-center justify-between rounded-lg border p-4">
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
                onCheckedChange={handleToggle}
                disabled={permission === 'denied'}
            />
        </div>
        
        {notificationsEnabled && permission === 'granted' && (
            <div className="space-y-6 fade-in-up">
                <div className="grid gap-2">
                    <Label htmlFor="after-school-time">Prima notificare (după școală)</Label>
                    <Input
                        id="after-school-time"
                        type="time"
                        value={afterSchoolTime}
                        onChange={(e) => handleTimeChange('afterSchool', e.target.value)}
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
                        onChange={(e) => handleTimeChange('evening', e.target.value)}
                        className="w-48"
                    />
                    <p className="text-sm text-muted-foreground">Un ultim memento, în caz că ai uitat ceva.</p>
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
