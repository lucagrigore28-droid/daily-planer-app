"use client";

import React, { useState, useContext, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Trash2, LogOut } from 'lucide-react';

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
    <>
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
      
      {!isWizardStep && (
        <div className="mt-6 space-y-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" /> Resetează Toate Datele
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ești absolut sigur?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Această acțiune nu poate fi anulată. Toate temele, materiile și setările tale vor fi șterse definitiv. 
                            Contul tău va fi păstrat, dar va trebui să reiei procesul de configurare.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anulează</AlertDialogCancel>
                        <AlertDialogAction onClick={context?.resetData} className="bg-destructive hover:bg-destructive/90">
                            Da, resetează
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" onClick={context?.logout} className="w-full">
                 <LogOut className="mr-2 h-4 w-4" /> Deconectare
            </Button>
        </div>
      )}
    </>
  );
}