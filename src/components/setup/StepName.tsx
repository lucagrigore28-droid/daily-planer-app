"use client";

import React, { useState, useContext, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';

type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export default function StepName({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const [name, setName] = useState(context?.userData?.name || '');

  useEffect(() => {
    if (context?.userData?.name) {
      setName(context.userData.name);
    }
  }, [context?.userData?.name]);

  const handleContinue = () => {
    if (name.trim()) {
      context?.updateUser({ name: name.trim() });
      if(onNext) onNext();
    }
  };
  
  const handleLogout = () => {
    context?.logout();
  };

  const isWizardStep = !!onNext;

  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Cum te numești?</CardTitle>
        <CardDescription>
          Acest nume va fi folosit pentru a personaliza experiența ta în aplicație.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="name">Numele tău</Label>
          <Input
            id="name"
            placeholder="ex: Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && isWizardStep && name.trim() && handleContinue()}
            onBlur={() => !isWizardStep && context?.updateUser({ name: name.trim() })}
          />
        </div>
      </CardContent>
       {isWizardStep && (
          <CardFooter className="flex justify-between">
            {!onBack ? (
                <Button variant="ghost" type="button" onClick={handleLogout}>
                    Înapoi la Login
                </Button>
            ) : (
                <Button variant="ghost" type="button" onClick={onBack}>
                    Înapoi
                </Button>
            )}
            <Button onClick={handleContinue} disabled={!name.trim()}>Continuă</Button>
          </CardFooter>
       )}
    </Card>
  );
}
