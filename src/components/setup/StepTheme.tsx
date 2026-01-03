
"use client";

import React, { useContext } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppContext } from '@/contexts/AppContext';
import { themes } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type StepProps = {
  onNext: () => void;
  onBack?: () => void;
};

export default function StepTheme({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);

  const handleThemeChange = (themeName: string) => {
    context?.updateUser({ theme: themeName });
  };
  
  const showNavButtons = !!onBack;

  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm-shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Alege-ți stilul</CardTitle>
        <CardDescription>
          Selectează o paletă de culori care ți se potrivește. Poți schimba acest lucru oricând din setări.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-2">
            {themes.map((theme) => (
                <div key={theme.name}>
                    <button
                        onClick={() => handleThemeChange(theme.name)}
                        className={cn(
                            "relative flex items-center justify-center w-full h-20 rounded-lg border-2 transition-all",
                            context?.userData.theme === theme.name ? 'border-primary' : 'border-muted'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full" style={{ backgroundColor: `hsl(${theme.primary})` }} />
                            <div className="h-10 w-10 rounded-full" style={{ backgroundColor: `hsl(${theme.accent})` }} />
                        </div>
                        {context?.userData.theme === theme.name && (
                            <div className="absolute top-1 right-1 p-0.5 bg-primary text-primary-foreground rounded-full">
                                <Check className="h-4 w-4" />
                            </div>
                        )}
                    </button>
                    <p className="text-center text-sm font-medium mt-2">{theme.label}</p>
                </div>
            ))}
        </div>
      </CardContent>
      {showNavButtons && (
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>Înapoi</Button>
          <Button onClick={onNext}>Continuă</Button>
        </CardFooter>
      )}
    </Card>
  );
}
