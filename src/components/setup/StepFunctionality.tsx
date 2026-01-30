
"use client";

import React, { useContext, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DAYS_OF_WEEK_SCHEDULE } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

export default function StepFunctionality() {
  const context = useContext(AppContext);
  const { userData, updateUser, addCoins, registerForNotifications } = context || {};
  const { toast } = useToast();
  const [devCode, setDevCode] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const weekendStartDay = userData?.weekendTabStartDay ?? 5;

  const handleDayChange = (value: string) => {
    updateUser?.({ weekendTabStartDay: parseInt(value, 10) });
  };
  
  const handleDevCodeSubmit = () => {
    if (devCode.toUpperCase() === 'DEVCOINS') {
      addCoins?.(100);
      toast({
        title: "Succes!",
        description: "Ai primit 100 de monede.",
      });
      setDevCode('');
    } else {
      toast({
        title: "Cod invalid",
        description: "Codul introdus nu este corect.",
        variant: "destructive",
      });
    }
  };

  const handleNotificationToggle = async (checked: boolean) => {
    if (!checked) {
      toast({
        title: "Info",
        description: "Pentru a dezactiva notificările, trebuie să revoci permisiunea din setările browser-ului pentru acest site."
      });
      return;
    }

    if (notificationPermission === 'granted') return;

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        toast({ title: "Permisiune acordată!", description: "Se înregistrează dispozitivul..." });
        await registerForNotifications?.();
        toast({ title: "Succes!", description: "Notificările au fost activate." });
      } else {
        toast({ title: "Permisiune refuzată", description: "Nu ai acordat permisiunea pentru notificări.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error enabling notifications:", error);
      toast({
        title: "Eroare la activarea notificărilor",
        description: error.message || "A apărut o problemă. Asigură-te că API-ul Firebase Cloud Messaging este activat în Google Cloud.",
        variant: "destructive",
        duration: 10000,
      });
      setNotificationPermission(Notification.permission); // Revert UI on failure
    }
  };

  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Funcționalități & Testare</CardTitle>
        <CardDescription>
          Personalizează cum se comportă anumite secțiuni ale aplicației.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <Label htmlFor="notifications-toggle" className="font-semibold">Notificări Zilnice</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Primește remindere despre temele tale. Va trebui să acorzi permisiunea în browser.
          </p>
          <div className="flex items-center space-x-2">
            <Switch
              id="notifications-toggle"
              checked={notificationPermission === 'granted'}
              onCheckedChange={handleNotificationToggle}
              disabled={notificationPermission === 'denied'}
            />
            <Label htmlFor="notifications-toggle">
              {notificationPermission === 'granted' ? 'Activat' : 
               notificationPermission === 'denied' ? 'Blocat' : 'Dezactivat'}
            </Label>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <Label htmlFor="weekend-start-day" className="font-semibold">Vizibilitate filă "Weekend"</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Alege ziua din care să devină vizibilă fila "Weekend", care afișează temele pentru săptămâna următoare.
          </p>
          <Select
            value={String(weekendStartDay)}
            onValueChange={handleDayChange}
          >
            <SelectTrigger id="weekend-start-day" className="w-full sm:w-[240px]">
              <SelectValue placeholder="Alege o zi" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK_SCHEDULE.map(day => (
                <SelectItem key={day.id} value={String(day.id)}>
                  {day.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <Label className="font-semibold">Cod de testare</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Introdu un cod pentru a primi recompense de test.
          </p>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input 
              type="text" 
              placeholder="Cod..." 
              value={devCode} 
              onChange={(e) => setDevCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDevCodeSubmit()}
            />
            <Button onClick={handleDevCodeSubmit}>Activează</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
