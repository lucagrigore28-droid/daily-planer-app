
"use client";

import React, { useContext } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppContext } from '@/contexts/AppContext';
import { themes } from '@/lib/themes';
import { cn } from '@/lib/utils';
import Logo from '../Logo';
import { Palette, Plus, X } from 'lucide-react';

type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export default function StepTheme({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const { userData, updateUser } = context || {};

  const handleThemeChange = (themeName: string) => {
    updateUser?.({ theme: themeName });
  };
  
  const handleColorChange = (index: number, color: string) => {
    const newColors = [...(userData?.customThemeColors || ['#A099FF', '#73A7AD'])];
    newColors[index] = color;
    updateUser?.({ customThemeColors: newColors });
  };

  const addColor = () => {
    const currentColors = userData?.customThemeColors || ['#A099FF', '#73A7AD'];
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
  const isCustomTheme = userData?.theme === 'custom';
  const customColors = userData?.customThemeColors || ['#A099FF', '#73A7AD'];

  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CardTitle className="font-headline text-2xl">Alege-ți stilul</CardTitle>
        <CardDescription>
          Selectează o paletă de culori sau creează-ți propria temă.
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
                            userData?.theme === theme.name ? 'border-primary' : 'border-muted'
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
            {/* Custom Theme Button */}
            <div className="flex flex-col items-center gap-2">
                <button
                    onClick={() => handleThemeChange('custom')}
                    className={cn(
                        "relative flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all",
                        isCustomTheme ? 'border-primary' : 'border-muted'
                    )}
                >
                     <div 
                        className="w-full h-full rounded-full flex items-center justify-center" 
                        style={{
                           backgroundImage: `conic-gradient(${customColors.join(', ')}, ${customColors[0]})`
                        }}
                     >
                       <Palette className="h-8 w-8 text-white/80" />
                    </div>
                </button>
                <p className="text-center text-sm font-medium">Costum</p>
            </div>
        </div>

        {isCustomTheme && (
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
  );
}
