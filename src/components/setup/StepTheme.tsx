"use client";

import React, { useContext } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppContext } from '@/contexts/AppContext';
import { themes } from '@/lib/themes';
import { cn } from '@/lib/utils';
import Logo from '../Logo';


type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};


export default function StepTheme({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);

  const handleThemeChange = (themeName: string) => {
    context?.updateUser({ theme: themeName });
  };
  
  const showNavButtons = !!onNext;

  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CardTitle className="font-headline text-2xl">Alege-ți stilul</CardTitle>
        <CardDescription>
          Selectează o paletă de culori. Poți alege modul Întunecat/Luminos mai târziu.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 pt-2">
            {themes.map((theme) => (
                <div key={theme.name} className="flex flex-col items-center gap-2">
                    <button
                        onClick={() => handleThemeChange(theme.name)}
                        className={cn(
                            "relative flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all",
                            context?.userData?.theme === theme.name ? 'border-primary' : 'border-muted'
                        )}
                    >
                        <div 
                          className="w-full h-full rounded-full" 
                          style={{
                            backgroundImage: `linear-gradient(to bottom right, hsl(${theme.primary}), hsl(${theme.accent}))`
                          }}
                        />
                    </button>
                    <p className="text-center text-sm font-medium">{theme.label}</p>
                </div>
            ))}
        </div>
      </CardContent>
      {showNavButtons && (
        <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 mt-4">
          <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto">Înapoi</Button>
          <Button onClick={onNext} className="w-full sm:w-auto">Continuă</Button>
        </CardFooter>
      )}
    </Card>
  );
}
