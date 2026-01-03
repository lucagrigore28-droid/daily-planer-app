
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

type SplashScreenProps = {
  onNext: () => void;
};

export default function SplashScreen({ onNext }: SplashScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-screen p-4 bg-background text-foreground">
      <div className="flex-grow flex flex-col items-center justify-center gap-6">
        <Logo />
        <div className="space-y-3 mt-4">
          <h1 className="text-5xl font-extrabold font-headline tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Homework Planner
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Planificatorul tău inteligent pentru teme.
          </p>
        </div>
      </div>
      <div className="w-full max-w-md pb-8 pt-12">
        <Button onClick={onNext} size="lg" variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-bold h-14 rounded-full shadow-lg">
          Vezi temele
        </Button>
      </div>
    </div>
  );
}
