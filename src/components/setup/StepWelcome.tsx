
"use client";

import React, { useContext } from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { AppContext } from '@/contexts/AppContext';
import { Skeleton } from '../ui/skeleton';

type StepProps = {
  onNext: () => void;
};

export default function StepWelcome({ onNext }: StepProps) {
  const context = useContext(AppContext);
  const { isThemeLoaded } = context || {};

  if (!isThemeLoaded) {
     return (
       <div className="flex flex-col items-center justify-center text-center h-full p-4 bg-background text-foreground">
          <div className="flex-grow flex flex-col items-center justify-center gap-6">
            <Skeleton className="h-[80px] w-[80px] rounded-2xl" />
            <div className="space-y-3 mt-4">
               <Skeleton className="h-12 w-80" />
               <Skeleton className="h-6 w-96" />
            </div>
          </div>
          <div className="w-full max-w-md pb-8 pt-12">
            <Skeleton className="h-14 w-full rounded-full" />
             <Skeleton className="h-4 w-48 mt-4 mx-auto" />
          </div>
       </div>
     );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center h-full p-4 bg-background text-foreground">
      <div className="flex-grow flex flex-col items-center justify-center gap-6">
        <Logo />
        <div className="space-y-3 mt-4">
          <h1 className="text-5xl font-extrabold font-headline tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Homework Planner
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Organizează-ți temele și nu mai uita niciodată ce ai de făcut.
          </p>
        </div>
      </div>
      <div className="w-full max-w-md pb-8 pt-12">
        <Button onClick={onNext} size="lg" variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-bold h-14 rounded-full shadow-lg">
          Începe Configurarea
        </Button>
        <p className="text-xs text-muted-foreground mt-4">Durează mai puțin de un minut.</p>
      </div>
    </div>
  );
}
