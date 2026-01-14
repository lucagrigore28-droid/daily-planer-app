"use client";

import React, { useState, useContext, useMemo } from 'react';
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
<<<<<<< HEAD
  
  const subjects = useMemo(() => context?.userData?.subjects || [], [context?.userData?.subjects]);
=======

  // Sync local state with context state when it changes
  useEffect(() => {
    if (context?.userData?.subjects) {
      setLocalSubjects(context.userData.subjects);
    }
  }, [context?.userData?.subjects]);
>>>>>>> 46fda65fb5cbde48c1eed8d49c1dcf186f8cfd74

  const allSubjectNames = useMemo(() => {
    const customNames = subjects.filter(s => s.isCustom).map(s => s.name);
    return [...new Set([...PREDEFINED_SUBJECTS, ...customNames])].sort((a,b) => a.localeCompare(b));
  }, [subjects]);

  const handleUpdateSubjects = (updatedSubjects: Subject[]) => {
    setLocalSubjects(updatedSubjects);
    // If not in setup wizard, save immediately.
    if (!onNext) {
      context?.updateSubjects(updatedSubjects);
    }
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
<<<<<<< HEAD
    context?.updateUser({ subjects: updatedSubjects });
=======
    
    handleUpdateSubjects(updatedSubjects);
>>>>>>> 46fda65fb5cbde48c1eed8d49c1dcf186f8cfd74
  };

  const handleAddCustomSubject = () => {
    const trimmedName = customSubject.trim();
<<<<<<< HEAD
    if (trimmedName && !subjects.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      const newSubjects = [...subjects, { id: trimmedName.toLowerCase().replace(/\s/g, '_'), name: trimmedName, isCustom: true }];
      context?.updateUser({ subjects: newSubjects });
=======
    if (trimmedName && !localSubjects.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      const newSubjects = [...localSubjects, { id: trimmedName.toLowerCase().replace(/\s/g, '_'), name: trimmedName, isCustom: true }];
      handleUpdateSubjects(newSubjects);
>>>>>>> 46fda65fb5cbde48c1eed8d49c1dcf186f8cfd74
      setCustomSubject('');
    }
  };
  
  const handleRemoveCustomSubject = (subjectName: string) => {
<<<<<<< HEAD
      const updatedSubjects = subjects.filter(s => s.name !== subjectName);
      context?.updateUser({ subjects: updatedSubjects });
  };

  const handleNext = () => {
    context?.updateUser({ subjects });
    if(onNext) onNext();
=======
      const updatedSubjects = localSubjects.filter(s => s.name !== subjectName);
      handleUpdateSubjects(updatedSubjects);
  };

  const handleNext = () => {
    // onNext is only present during initial setup.
    // In settings, changes are saved instantly via handleUpdateSubjects.
    if (onNext) {
      context?.updateSubjects(localSubjects);
      onNext();
    }
>>>>>>> 46fda65fb5cbde48c1eed8d49c1dcf186f8cfd74
  };

  const handleBack = () => {
    if(onBack) onBack();
  };
  
  const showNavButtons = !!onNext;

  return (
<<<<<<< HEAD
    <Card className="border-0 shadow-none bg-transparent sm:bg-card/80 sm:backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardContent className="pt-6">
        <div className="rounded-lg border bg-card/90 p-4 backdrop-blur-sm mb-6">
            <h2 className="text-2xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Selectează-ți materiile
            </h2>
             <p className="text-sm text-muted-foreground mt-1">Bifează materiile din orarul tău. Poți adăuga și materii personalizate.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
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
                <Label htmlFor={subjectName} className="flex-1 cursor-pointer text-lg">
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
=======
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Ce materii ai?</CardTitle>
        <CardDescription>
          Bifează materiile din orarul tău. Poți adăuga și materii personalizate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] md:h-[400px] pr-4">
          <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor={subjectName} className="flex-1 cursor-pointer text-base">
                    {subjectName}
                  </Label>
                   {subjectIsCustom && isChecked && ( // Only show remove for selected custom subjects
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveCustomSubject(subjectName)}>
                       <X className="h-4 w-4" />
                     </Button>
                   )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
>>>>>>> 46fda65fb5cbde48c1eed8d49c1dcf186f8cfd74
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
