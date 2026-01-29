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
  const [name, setName] = useState('');
  const { user } = context!;

  useEffect(() => {
    if (context?.userData?.name) {
      setName(context.userData.name);
    }
  }, [context?.userData?.name]);

  const handleUpdate = () => {
     if (name.trim()) {
        context?.updateUser({ name: name.trim() });
    }
  }

  const handleContinue = async () => {
    if (name.trim()) {
      if (onNext) { // This is the initial setup
        await context?.createUserDocument(user, name.trim());
        onNext();
      } else { // This is from the settings dialog
        handleUpdate();
      }
    }
  };
  
  const showNavButtons = !!onNext;


  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl fade-in-up">Cum te numești?</CardTitle>
        <CardDescription style={{ animationDelay: '100ms' }} className="fade-in-up">
          Acest nume va fi folosit pentru a personaliza experiența ta în aplicație.
        </CardDescription>
      </CardHeader>
      <CardContent style={{ animationDelay: '200ms' }} className="fade-in-up">
        <div className="space-y-2">
          <Label htmlFor="name">Numele tău</Label>
          <Input
            id="name"
            placeholder="ex: Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleUpdate}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleContinue()}
          />
        </div>
      </CardContent>
       {showNavButtons && (
          <CardFooter style={{ animationDelay: '300ms' }} className="fade-in-up flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
             {onBack && <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto">Înapoi</Button>}
            <Button onClick={handleContinue} disabled={!name.trim()} className="w-full sm:w-auto sm:ml-auto">Continuă</Button>
          </CardFooter>
       )}
    </Card>
  );
}
