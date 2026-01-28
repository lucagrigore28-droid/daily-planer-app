"use client";

import React, { useContext, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppContext } from '@/contexts/AppContext';
import { themes as predefinedThemes } from '@/lib/themes';
import type { Theme } from '@/lib/types';
import { cn } from '@/lib/utils';
import Logo from '../Logo';
import { Palette, Plus, X, Lock, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export default function StepTheme({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const { userData, updateUser, unlockTheme } = context || {};
  const { toast } = useToast();
  const [purchaseCandidate, setPurchaseCandidate] = useState<Theme | null>(null);

  const customTheme: Theme = {
    name: 'custom',
    label: 'Costum',
    className: 'theme-custom',
    primary: '',
    accent: '',
    cost: 200,
  };
  
  const allThemes = [...predefinedThemes, customTheme];

  const handleThemeSelect = (theme: Theme) => {
    if (!userData || !unlockTheme) return;

    const isUnlocked = theme.name === 'classic' || userData.unlockedThemes?.includes(theme.name);

    if (isUnlocked) {
      updateUser?.({ theme: theme.name });
    } else {
      if ((userData.coins || 0) >= theme.cost) {
        setPurchaseCandidate(theme);
      } else {
        toast({
          title: "Fonduri insuficiente",
          description: `Ai nevoie de ${theme.cost} monede pentru a debloca această temă.`,
          variant: 'destructive'
        });
      }
    }
  };

  const confirmPurchase = () => {
    if (purchaseCandidate && unlockTheme) {
      unlockTheme(purchaseCandidate).then(() => {
        toast({
          title: "Temă deblocată!",
          description: `Acum poți folosi tema "${purchaseCandidate.label}".`,
        });
        updateUser?.({ theme: purchaseCandidate.name });
        setPurchaseCandidate(null);
      });
    }
  };
  
  const handleColorChange = (index: number, color: string) => {
    const newColors = [...(userData?.customThemeColors || ['#8a2be2', '#4169e1'])];
    newColors[index] = color;
    updateUser?.({ customThemeColors: newColors });
  };

  const addColor = () => {
    const currentColors = userData?.customThemeColors || ['#8a2be2', '#4169e1'];
    if (currentColors.length < 3) {
      updateUser?.({ customThemeColors: [...currentColors, '#FFFFFF'] });
    }
  };

  const removeColor = (index: number) => {
    const currentColors = userData?.customThemeColors || [];
    if (currentColors.length > 2) {
      const newColors = currentColors.filter((_, i) => i !== index);
      updateUser?.({ customThemeColors: newColors });
    }
  };

  const showNavButtons = !!onNext;
  const isCustomThemeSelected = userData?.theme === 'custom';
  const customColors = userData?.customThemeColors || ['#8a2be2', '#4169e1'];

  return (
    <>
      <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="font-headline text-2xl">Alege-ți stilul</CardTitle>
          <CardDescription>
            Folosește monedele câștigate pentru a debloca teme noi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-6 pt-2">
            {allThemes.map((theme) => {
              const isUnlocked = theme.name === 'classic' || userData?.unlockedThemes?.includes(theme.name);
              const isSelected = userData?.theme === theme.name;
              
              const background = theme.name === 'custom'
                ? { backgroundImage: `conic-gradient(${customColors.join(', ')}, ${customColors[0]})` }
                : { backgroundImage: `linear-gradient(to bottom right, hsl(${theme.primary}), hsl(${theme.accent}))` };

              return (
                <div key={theme.name} className="flex flex-col items-center gap-2 text-center">
                  <button
                    onClick={() => handleThemeSelect(theme)}
                    className={cn(
                      "relative flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all",
                      isSelected ? 'border-primary' : 'border-muted',
                      !isUnlocked && 'cursor-pointer'
                    )}
                  >
                    <div 
                      className="w-full h-full rounded-full" 
                      style={background}
                    />
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                        <Lock className="h-7 w-7 text-white/80" />
                      </div>
                    )}
                    {theme.name === 'custom' && isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Palette className="h-8 w-8 text-white/80" />
                      </div>
                    )}
                  </button>
                  <p className="text-sm font-medium h-5">{theme.label}</p>
                  {!isUnlocked && (
                    <div className="flex items-center gap-1.5 text-sm font-bold">
                       <Coins className="h-4 w-4 text-yellow-500" />
                       <span>{theme.cost}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isCustomThemeSelected && (
            <div className="mt-8 pt-6 border-t animate-accordion-down">
                <h3 className="text-center font-semibold text-lg mb-4">Personalizează-ți Gradientul</h3>
                <div className="flex justify-center items-center gap-4">
                    {customColors.map((color, index) => (
                        <div key={index} className="relative">
                            <input 
                                type="color"
                                value={color}
                                onChange={(e) => handleColorChange(index, e.target.value)}
                                className="w-16 h-16 p-1 bg-transparent border-none rounded-full cursor-pointer appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
                            />
                             {customColors.length > 2 && (
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                    onClick={() => removeColor(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {customColors.length < 3 && (
                        <Button variant="outline" size="icon" className="w-16 h-16 rounded-full" onClick={addColor}>
                            <Plus className="h-8 w-8"/>
                        </Button>
                    )}
                </div>
            </div>
          )}

        </CardContent>
        {showNavButtons && (
          <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 mt-4">
            <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto">Înapoi</Button>
            <Button onClick={onNext} className="w-full sm:w-auto">Continuă</Button>
          </CardFooter>
        )}
      </Card>
      
      <AlertDialog open={!!purchaseCandidate} onOpenChange={(open) => !open && setPurchaseCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmă cumpărarea</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să deblochezi tema "{purchaseCandidate?.label}" pentru <span className="font-bold">{purchaseCandidate?.cost}</span> monede?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPurchaseCandidate(null)}>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurchase}>
              Da, deblochează
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
