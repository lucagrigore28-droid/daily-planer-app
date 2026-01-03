
"use client";

import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/contexts/AppContext';
import type { Schedule } from '@/lib/types';
import { DAYS_OF_WEEK_SCHEDULE } from '@/lib/constants';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';


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

  const scheduleDays = DAYS_OF_WEEK_SCHEDULE.filter(d => d.id <= 5); // Only Mon-Fri

  return (
    <Card className="border-0 shadow-none bg-card/80 backdrop-blur-sm sm:border-solid sm:shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Setează-ți orarul săptămânal</CardTitle>
        <CardDescription>
          Pentru fiecare materie, selectează zilele în care o ai. Acest lucru ne ajută să-ți afișăm temele corect.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 pr-4">
          <div className="space-y-6">
            {subjects.map(subject => (
              <div key={subject.id}>
                <Label className="text-base font-medium">{subject.name}</Label>
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  className="mt-2 justify-start flex-wrap"
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
          </div>
        </ScrollArea>
      </CardContent>
      {showNavButtons ? (
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>Înapoi</Button>
          <Button onClick={handleNext}>Continuă</Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
