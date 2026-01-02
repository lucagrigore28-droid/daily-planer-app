"use client";

import React, { useContext } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppContext } from '@/contexts/AppContext';
import { Bell, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type StepProps = {
  onBack: () => void;
};

export default function StepPermissions({ onBack }: StepProps) {
  const context = useContext(AppContext);
  const { toast } = useToast();

  const handleRequestPermissions = async () => {
    // GPS Permission
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          context?.setHasGpsAccess(true);
        },
        () => {
          context?.setHasGpsAccess(false);
          toast({
            title: "Acces la locație refuzat",
            description: "Va trebui să introduci manual ziua și ora la fiecare utilizare.",
            variant: "destructive"
          });
        }
      );
    } else {
        context?.setHasGpsAccess(false);
    }

    // Notification Permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
          toast({
            title: "Permisiune notificări refuzată",
            description: "Nu vei primi remindere pentru teme.",
          });
      }
    }

    // Finalize setup
    context?.updateUser({ setupComplete: true });
  };


  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Aproape gata!</CardTitle>
        <CardDescription>
          Avem nevoie de câteva permisiuni pentru a-ți oferi cea mai bună experiență.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-4 rounded-lg border p-4">
            <MapPin className="h-8 w-8 text-accent mt-1"/>
            <div>
                <h3 className="font-semibold">Acces la locație (GPS)</h3>
                <p className="text-sm text-muted-foreground">Folosim locația pentru a determina automat fusul orar corect. Astfel, temele pentru "mâine" și reminderele sunt mereu precise, chiar și atunci când călătorești.</p>
            </div>
        </div>
         <div className="flex items-start gap-4 rounded-lg border p-4">
            <Bell className="h-8 w-8 text-accent mt-1"/>
            <div>
                <h3 className="font-semibold">Permisiune pentru notificări</h3>
                <p className="text-sm text-muted-foreground">Putem să-ți trimitem remindere zilnice cu temele pentru a doua zi, ca să nu uiți niciodată de ele.</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Înapoi</Button>
        <Button onClick={handleRequestPermissions}>Finalizează</Button>
      </CardFooter>
    </Card>
  );
}
