"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type StepProps = {
  onNext: () => void;
};

export default function StepWelcome({ onNext }: StepProps) {
  const welcomeImage = PlaceHolderImages.find(img => img.id === 'welcome-bg');

  return (
    <Card className="overflow-hidden border-0 shadow-none sm:border sm:shadow-lg">
       {welcomeImage && (
         <div className="relative h-48 w-full">
            <Image
                src={welcomeImage.imageUrl}
                alt={welcomeImage.description}
                fill
                className="object-cover"
                data-ai-hint={welcomeImage.imageHint}
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
         </div>
      )}
      <CardHeader className="pt-0">
        <div className="mb-4 flex items-center gap-2">
            <Logo />
            <span className="text-xl font-bold text-foreground">Daily Planner Pro</span>
        </div>
        <CardTitle className="font-headline text-3xl">Bun venit!</CardTitle>
        <CardDescription>
          Organizează-ți temele și nu mai uita niciodată ce ai de făcut. Hai să-ți configurăm contul în câțiva pași simpli.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={onNext} className="w-full sm:w-auto ml-auto">Începe</Button>
      </CardFooter>
    </Card>
  );
}
