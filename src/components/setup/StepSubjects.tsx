"use client";

import React, { useState, useContext } from 'react';
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
  onNext: () => void;
  onBack: () => void;
};

export default function StepSubjects({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>(context?.userData.subjects || []);
  const [customSubject, setCustomSubject] = useState('');

  const handleToggleSubject = (subjectName: string, isCustom: boolean) => {
    setSelectedSubjects(prev => {
      const existing = prev.find(s => s.name === subjectName);
      if (existing) {
        return prev.filter(s => s.name !== subjectName);
      } else {
        return [...prev, { id: subjectName.toLowerCase().replace(/\s/g, '_'), name: subjectName, isCustom }];
      }
    });
  };

  const handleAddCustomSubject = () => {
    if (customSubject.trim() && !selectedSubjects.find(s => s.name.toLowerCase() === customSubject.trim().toLowerCase())) {
      handleToggleSubject(customSubject.trim(), true);
      setCustomSubject('');
    }
  };
  
  const handleNext = () => {
    context?.updateUser({ subjects: selectedSubjects });
    onNext();
  };

  const predefinedWithCustom = [...PREDEFINED_SUBJECTS];
  selectedSubjects.forEach(s => {
    if (s.isCustom && !predefinedWithCustom.includes(s.name)) {
      predefinedWithCustom.push(s.name);
    }
  });


  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Ce materii ai?</CardTitle>
        <CardDescription>
          Bifează materiile din orarul tău. Poți adăuga și materii personalizate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 pr-4">
          <div className="grid grid-cols-2 gap-4">
            {predefinedWithCustom.map(subjectName => {
              const subjectIsCustom = !PREDEFINED_SUBJECTS.includes(subjectName);
              const isChecked = !!selectedSubjects.find(s => s.name === subjectName);
              return (
                <div key={subjectName} className="flex items-center space-x-2">
                  <Checkbox
                    id={subjectName}
                    checked={isChecked}
                    onCheckedChange={() => handleToggleSubject(subjectName, subjectIsCustom)}
                  />
                  <Label htmlFor={subjectName} className="flex-1 cursor-pointer">{subjectName}</Label>
                   {subjectIsCustom && isChecked && (
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleSubject(subjectName, true)}>
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
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Înapoi</Button>
        <Button onClick={handleNext} disabled={selectedSubjects.length === 0}>Continuă</Button>
      </CardFooter>
    </Card>
  );
}
