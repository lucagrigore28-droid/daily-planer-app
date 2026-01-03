
"use client";

import React, { useState, useContext } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';

type StepProps = {
  onNext: () => void;
  onBack?: () => void;
};

export default function StepName({ onNext }: StepProps) {
  const context = useContext(AppContext);
  const [name, setName] = useState(context?.userData.name || '');

  const handleNameChange = (newName: string) => {
    setName(newName);
    context?.updateUser({ name: newName.trim() });
  };

  const isSetup = onNext !== StepName.defaultProps.onNext;

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
            onChange={(e) => handleNameChange(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && isSetup && name.trim() && onNext()}
          />
        </div>
      </CardContent>
       {isSetup && (
          <CardFooter>
            <Button onClick={onNext} disabled={!name.trim()} className="ml-auto">Continuă</Button>
          </CardFooter>
       )}
    </Card>
  );
}


StepName.defaultProps = {
    onNext: () => {},
};
