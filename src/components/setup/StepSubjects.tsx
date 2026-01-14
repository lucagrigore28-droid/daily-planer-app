"use client";

import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import type { Subject } from '@/lib/types';
import { PREDEFINED_SUBJECTS } from '@/lib/constants';
import { PlusCircle, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export default function StepSubjects({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const [customSubject, setCustomSubject] = useState('');
  
  const subjects = useMemo(() => context?.userData?.subjects || [], [context?.userData?.subjects]);

  const allSubjectNames = useMemo(() => {
    const customNames = subjects.filter(s => s.isCustom).map(s => s.name);
    return [...new Set([...PREDEFINED_SUBJECTS, ...customNames])].sort((a,b) => a.localeCompare(b));
  }, [subjects]);

  const updateGlobalSubjects = (updatedSubjects: Subject[]) => {
    // When used in Settings, this should trigger an immediate update.
    // In the setup wizard, it just updates local state until "Continue" is clicked.
    context?.updateUser({ subjects: updatedSubjects });
  };

  const handleToggleSubject = (subjectName: string) => {
    const isAlreadySelected = subjects.some(s => s.name === subjectName);
    let updatedSubjects;

    if (isAlreadySelected) {
      updatedSubjects = subjects.filter(s => s.name !== subjectName);
    } else {
      const isPredefined = PREDEFINED_SUBJECTS.includes(subjectName);
      updatedSubjects = [...subjects, { id: subjectName.toLowerCase().replace(/\s/g, '_'), name: subjectName, isCustom: !isPredefined }];
    }
    updateGlobalSubjects(updatedSubjects);
  };

  const handleAddCustomSubject = () => {
    const trimmedName = customSubject.trim();
    if (trimmedName && !subjects.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      const newSubjects = [...subjects, { id: trimmedName.toLowerCase().replace(/\s/g, '_'), name: trimmedName, isCustom: true }];
      updateGlobalSubjects(newSubjects);
      setCustomSubject('');
    }
  };
  
  const handleRemoveCustomSubject = (subjectName: string) => {
      const updatedSubjects = subjects.filter(s => s.name !== subjectName);
      updateGlobalSubjects(updatedSubjects);
  };

  const handleNext = () => {
    // This is only called in the setup wizard context
    if(onNext) onNext();
  };

  const handleBack = () => {
    if(onBack) onBack();
  };
  
  const showNavButtons = !!onNext;

  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Ce materii ai?</CardTitle>
        <CardDescription>
          Bifează materiile din orarul tău. Poți adăuga și materii personalizate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {allSubjectNames.map(subjectName => {
            const isChecked = subjects.some(s => s.name === subjectName);
            const subjectIsCustom = !PREDEFINED_SUBJECTS.includes(subjectName);
            return (
              <div key={subjectName} className="flex items-center space-x-3 p-2 rounded-md transition-colors hover:bg-muted">
                <Checkbox
                  id={subjectName}
                  checked={isChecked}
                  onCheckedChange={() => handleToggleSubject(subjectName)}
                  className="h-5 w-5"
                />
                <Label htmlFor={subjectName} className="flex-1 cursor-pointer text-base">
                  {subjectName}
                </Label>
                 {subjectIsCustom && (
                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveCustomSubject(subjectName)}>
                     <X className="h-4 w-4" />
                   </Button>
                 )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex items-center space-x-2">
          <Input
            placeholder="Altă materie..."
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSubject()}
          />
          <Button onClick={handleAddCustomSubject} variant="outline" size="icon">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
      {showNavButtons && (
        <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button variant="ghost" onClick={handleBack} className="w-full sm:w-auto">Înapoi</Button>
          <Button onClick={handleNext} disabled={subjects.length === 0} className="w-full sm:w-auto">Continuă</Button>
        </CardFooter>
      )}
    </Card>
  );
}
