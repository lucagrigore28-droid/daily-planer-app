"use client";

import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import type { Subject } from '@/lib/types';
import { PREDEFINED_SUBJECTS } from '@/lib/constants';
import { PlusCircle, X } from 'lucide-react';

type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export default function StepSubjects({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const [customSubject, setCustomSubject] = useState('');
  const [localSubjects, setLocalSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (context?.userData?.subjects) {
      setLocalSubjects(context.userData.subjects);
    }
  }, [context?.userData?.subjects]);

  const allSubjectNames = useMemo(() => {
    const customNames = localSubjects.filter(s => s.isCustom).map(s => s.name);
    return [...new Set([...PREDEFINED_SUBJECTS, ...customNames])].sort((a,b) => a.localeCompare(b));
  }, [localSubjects]);

  const handleUpdateSubjects = (updatedSubjects: Subject[]) => {
    setLocalSubjects(updatedSubjects);
    if (!onNext) {
      context?.updateSubjects(updatedSubjects);
    }
  };

  const handleToggleSubject = (subjectName: string) => {
    const isAlreadySelected = localSubjects.some(s => s.name === subjectName);
    let updatedSubjects;

    if (isAlreadySelected) {
      updatedSubjects = localSubjects.filter(s => s.name !== subjectName);
    } else {
      const isPredefined = PREDEFINED_SUBJECTS.includes(subjectName);
      updatedSubjects = [...localSubjects, { id: subjectName.toLowerCase().replace(/\s/g, '_'), name: subjectName, isCustom: !isPredefined }];
    }
    
    handleUpdateSubjects(updatedSubjects);
  };

  const handleAddCustomSubject = () => {
    const trimmedName = customSubject.trim();
    if (trimmedName && !localSubjects.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      const newSubjects = [...localSubjects, { id: trimmedName.toLowerCase().replace(/\s/g, '_'), name: trimmedName, isCustom: true }];
      handleUpdateSubjects(newSubjects);
      setCustomSubject('');
    }
  };
  
  const handleRemoveCustomSubject = (subjectName: string) => {
      const updatedSubjects = localSubjects.filter(s => s.name !== subjectName);
      handleUpdateSubjects(updatedSubjects);
  };

  const handleNext = () => {
    if (onNext) {
      context?.updateSubjects(localSubjects);
      onNext();
    }
  };

  const handleBack = () => {
    if(onBack) onBack();
  };
  
  const showNavButtons = !!onNext;

  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardContent className="pt-6">
        <div className="rounded-lg border bg-card/90 p-4 backdrop-blur-sm mb-6 fade-in-up">
            <h2 className="text-2xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Selectează-ți materiile
            </h2>
             <p style={{ animationDelay: '100ms' }} className="text-sm text-muted-foreground mt-1 fade-in-up">Bifează materiile din orarul tău. Poți adăuga și materii personalizate.</p>
        </div>
        <div style={{ animationDelay: '200ms' }} className="grid grid-cols-2 gap-x-12 gap-y-4 fade-in-up">
          {allSubjectNames.map(subjectName => {
            const isChecked = localSubjects.some(s => s.name === subjectName);
            const subjectIsCustom = !PREDEFINED_SUBJECTS.includes(subjectName);
            return (
              <div key={subjectName} className="flex items-center space-x-3 p-2 rounded-md transition-colors hover:bg-muted">
                <Checkbox
                  id={subjectName}
                  checked={isChecked}
                  onCheckedChange={() => handleToggleSubject(subjectName)}
                  className="h-5 w-5"
                />
                <Label htmlFor={subjectName} className="flex-1 cursor-pointer text-lg">
                  {subjectName}
                </Label>
                 {subjectIsCustom && isChecked && (
                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveCustomSubject(subjectName)}>
                     <X className="h-4 w-4" />
                   </Button>
                 )}
              </div>
            );
          })}
        </div>
        <div style={{ animationDelay: '300ms' }} className="mt-6 flex items-center space-x-2 fade-in-up">
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
        <CardFooter style={{ animationDelay: '400ms' }} className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 fade-in-up">
          <Button variant="ghost" onClick={handleBack} className="w-full sm:w-auto">Înapoi</Button>
          <Button onClick={handleNext} disabled={localSubjects.length === 0} className="w-full sm:w-auto">Continuă</Button>
        </CardFooter>
      )}
    </Card>
  );
}
