
"use client";

import React, { useContext, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DAYS_OF_WEEK_SCHEDULE } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function StepFunctionality() {
  const context = useContext(AppContext);
  const { userData, updateUser, addCoins } = context || {};
  const { toast } = useToast();
  const [devCode, setDevCode] = useState('');

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
            Introdu un cod pentru a primi recompense de test. (Cod: DEVCOINS)
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
