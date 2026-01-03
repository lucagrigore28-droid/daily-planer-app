"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '../Logo';

type StepProps = {
  onNext: () => void;
};

export default function StepWelcome({ onNext }: StepProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full p-4 bg-background text-foreground">
      <div className="flex-grow flex flex-col items-center justify-center gap-6">
        <div className="transform scale-[2.5] mb-8">
            <Logo />
        </div>
        <div className="space-y-3">
          <h1 className="text-5xl font-extrabold font-headline tracking-tight text-primary">
            Daily Planner Pro
          </h1>
          <p className="text-xl text-primary/80 max-w-md mx-auto">
            Organizează-ți temele și nu mai uita niciodată ce ai de făcut.
          </p>
        </div>
      </div>
      <div className="w-full max-w-md pb-8">
        <Button onClick={onNext} size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-bold h-14 rounded-full shadow-lg">
          Începe Configurarea
        </Button>
        <p className="text-xs text-muted-foreground mt-4">Durează mai puțin de un minut.</p>
      </div>
    </div>
  );
}
