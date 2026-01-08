
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
  // This state now correctly represents ONLY the subjects selected by the user, as saved in Firestore.
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [customSubject, setCustomSubject] = useState('');

  // Effect to synchronize component state with context from Firestore, runs only when context data changes.
  useEffect(() => {
    if (context?.userData?.subjects) {
      setSelectedSubjects(context.userData.subjects);
    }
  }, [context?.userData?.subjects]);

  // Memoized list for display purposes ONLY. It combines predefined and custom subjects and ensures uniqueness.
  const allSubjectsToDisplay = useMemo(() => {
    // Create a Set to hold unique subject names
    const subjectNames = new Set(PREDEFINED_SUBJECTS);
    // Add names from the user's selected subjects
    selectedSubjects.forEach(s => subjectNames.add(s.name));
    // Convert the Set to an array and sort it
    return Array.from(subjectNames).sort((a, b) => a.localeCompare(b));
  }, [selectedSubjects]);


  const handleToggleSubject = (subjectName: string) => {
    const existingSubject = selectedSubjects.find(s => s.name === subjectName);
    let updatedSubjects;

    if (existingSubject) {
      // If it exists, remove it
      updatedSubjects = selectedSubjects.filter(s => s.name !== subjectName);
    } else {
      // If it doesn't exist, add it
      const isPredefined = PREDEFINED_SUBJECTS.includes(subjectName);
      updatedSubjects = [...selectedSubjects, { id: subjectName.toLowerCase().replace(/\s/g, '_'), name: subjectName, isCustom: !isPredefined }];
    }
    
    // Update the local state AND save to Firestore via context
    setSelectedSubjects(updatedSubjects);
    context?.updateUser({ subjects: updatedSubjects });
  };

  const handleAddCustomSubject = () => {
    const trimmedName = customSubject.trim();
    if (trimmedName && !selectedSubjects.find(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      handleToggleSubject(trimmedName);
      setCustomSubject('');
    }
  };
  
  const handleRemoveCustomSubject = (subjectName: string) => {
      handleToggleSubject(subjectName);
  }
  
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
        <ScrollArea className="h-[300px] md:h-[400px] pr-4">
          <div className="grid grid-cols-2 gap-4">
            {allSubjectsToDisplay.map(subjectName => {
              const isChecked = !!selectedSubjects.find(s => s.name === subjectName);
              const subjectInPredefinedList = PREDEFINED_SUBJECTS.includes(subjectName);
              const isTrulyCustom = !subjectInPredefinedList;
              
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
                   {isTrulyCustom && isChecked && (
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveCustomSubject(subjectName)}>
                       <X className="h-4 w-4" />
                     </Button>
                   )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
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
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>Înapoi</Button>
          <Button onClick={onNext} disabled={selectedSubjects.length === 0}>Continuă</Button>
        </CardFooter>
      )}
    </Card>
  );
}
