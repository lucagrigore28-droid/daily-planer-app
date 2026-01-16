"use client";

import React, { useContext } from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { AppContext } from '@/contexts/AppContext';

type WelcomeBackScreenProps = {
  onNext: () => void;
};

export default function WelcomeBackScreen({ onNext }: WelcomeBackScreenProps) {
  const context = useContext(AppContext);
  const name = context?.userData?.name;

  return (
    <div className="flex flex-col items-center justify-center text-center h-screen p-4 bg-background text-foreground">
      <div className="flex-grow flex flex-col items-center justify-center gap-6">
        <Logo />
        <div className="space-y-3 mt-4">
          <h1 className="text-5xl font-extrabold font-headline tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Bine ai revenit, {name}!
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Bucuros să te revedem. Ești gata să-ți organizezi temele?
          </p>
        </div>
      </div>
      <div className="w-full max-w-md pb-8 pt-12">
        <Button onClick={onNext} size="lg" variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-bold h-14 rounded-full shadow-lg">
          Vezi Temele
        </Button>
      </div>
    </div>
  );
}
