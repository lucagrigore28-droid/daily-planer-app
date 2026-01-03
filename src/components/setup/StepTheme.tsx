
"use client";

import React, { useContext, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppContext } from '@/contexts/AppContext';
import { themes } from '@/lib/themes';
import { cn } from '@/lib/utils';
import Logo from '../Logo';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';


type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

function IconEditor() {
    const context = useContext(AppContext);
    const { toast } = useToast();
    const [iconSvg, setIconSvg] = useState(context?.userData.appIconSvg || '');

    const handleSaveIcon = () => {
        // Basic validation for SVG
        if (iconSvg && (!iconSvg.trim().startsWith('<svg') || !iconSvg.trim().endsWith('</svg>'))) {
            toast({
                title: 'Cod SVG Invalid',
                description: 'Te rog să introduci un cod SVG valid, care începe cu <svg> și se termină cu </svg>.',
                variant: 'destructive',
            });
            return;
        }

        context?.updateUser({ appIconSvg: encodeURIComponent(iconSvg.replace(/"/g, '\\"')) });
        toast({
            title: 'Iconiță salvată!',
            description: 'Iconița aplicației a fost actualizată. Reîncarcă pagina pentru a vedea modificarea.',
        });
    };
    
    const handleResetIcon = () => {
        setIconSvg('');
        context?.updateUser({ appIconSvg: '' });
         toast({
            title: 'Iconiță resetată!',
            description: 'Iconița a fost resetată la valoarea implicită. Reîncarcă pagina.',
        });
    }

    return (
        <div className="space-y-4">
             <Separator className="my-6" />
             <div className="text-center">
                 <h3 className="font-headline text-xl">Iconiță Aplicație</h3>
                 <p className="text-muted-foreground text-sm mt-1">Lipește mai jos codul SVG pentru a personaliza iconița din browser (favicon).</p>
             </div>
            <div className="grid w-full gap-2">
                <Label htmlFor="svg-code">Cod SVG</Label>
                <Textarea
                    id="svg-code"
                    placeholder='<svg xmlns="http://www.w3.org/2000/svg" ... </svg>'
                    value={iconSvg}
                    onChange={(e) => setIconSvg(e.target.value)}
                    rows={6}
                    className="font-code text-xs"
                />
            </div>
            <div className="flex gap-2 justify-center">
                <Button onClick={handleSaveIcon}>Salvează Iconița</Button>
                <Button variant="ghost" onClick={handleResetIcon}>Resetează</Button>
            </div>
        </div>
    );
}


export default function StepTheme({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);

  const handleThemeChange = (themeName: string) => {
    context?.updateUser({ theme: themeName });
  };
  
  const showNavButtons = !!onNext;

  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm-shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CardTitle className="font-headline text-2xl">Alege-ți stilul</CardTitle>
        <CardDescription>
          Selectează o paletă de culori care ți se potrivește. Logo-ul se va adapta automat.
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
                            context?.userData.theme === theme.name ? 'border-primary' : 'border-muted'
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
        {!showNavButtons && <IconEditor />}
      </CardContent>
      {showNavButtons && (
        <CardFooter className="flex justify-between mt-4">
          <Button variant="ghost" onClick={onBack}>Înapoi</Button>
          <Button onClick={onNext}>Continuă</Button>
        </CardFooter>
      )}
    </Card>
  );
}
