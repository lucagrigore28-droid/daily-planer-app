
"use client";

import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import type { Schedule } from '@/lib/types';
import { DAYS_OF_WEEK_SCHEDULE } from '@/lib/constants';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';


type StepProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export default function StepSchedule({ onNext, onBack }: StepProps) {
  const context = useContext(AppContext);
  const subjects = useMemo(() => context?.userData?.subjects || [], [context?.userData?.subjects]);
  const [schedule, setSchedule] = useState<Schedule>({});

  useEffect(() => {
    if (context?.userData?.schedule) {
      setSchedule(context.userData.schedule);
    }
  }, [context?.userData?.schedule]);

  useEffect(() => {
    const currentSubjects = context?.userData?.subjects || [];
    setSchedule(currentSchedule => {
      const newSchedule = { ...currentSchedule };
      Object.keys(newSchedule).forEach(subjectId => {
        if (!currentSubjects.some(s => s.id === subjectId)) {
          delete newSchedule[subjectId];
        }
      });
      return newSchedule;
    });
  }, [context?.userData?.subjects]);


  const handleNext = () => {
    context?.updateUser({ schedule });
    if(onNext) onNext();
  };

  const handleScheduleChange = (subjectId: string, days: string[]) => {
    const newSchedule = {
      ...schedule,
      [subjectId]: days.map(Number),
    };
    setSchedule(newSchedule);
    context?.updateUser({ schedule: newSchedule });
  };
  
  const showNavButtons = !!onNext;

  const scheduleDays = DAYS_OF_WEEK_SCHEDULE.filter(d => d.id <= 5);

  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardContent className="pt-6">
        <div className="rounded-lg border bg-card/90 p-4 backdrop-blur-sm mb-6">
            <h2 className="text-2xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Setează-ți orarul săptămânal
            </h2>
        </div>
        <div className="space-y-6">
          {subjects.map(subject => (
            <div key={subject.id} className="overflow-x-auto pb-2">
              <Label className="text-base font-medium">{subject.name}</Label>
              <ToggleGroup
                type="multiple"
                variant="outline"
                className="mt-2"
                value={schedule[subject.id]?.map(String) || []}
                onValueChange={(days) => handleScheduleChange(subject.id, days)}
              >
                {scheduleDays.map(day => (
                  <ToggleGroupItem key={day.id} value={String(day.id)} aria-label={day.name}>
                    {day.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ))}
           {subjects.length === 0 && (
            <p className="text-center text-muted-foreground pt-8">
              Mai întâi adaugă materii în tab-ul anterior pentru a le vedea aici.
            </p>
          )}
        </div>
      </CardContent>
      {showNavButtons ? (
        <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto">Înapoi</Button>
          <Button onClick={handleNext} className="w-full sm:w-auto">Finalizează</Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
