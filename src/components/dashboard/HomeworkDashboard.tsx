"use client";

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { format, isSameDay, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import HomeworkList from './HomeworkList';
import ManualTimeDialog from './ManualTimeDialog';
import AddTaskDialog from './AddTaskDialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function HomeworkDashboard() {
  const context = useContext(AppContext);
  const [isManualTimeOpen, setManualTimeOpen] = useState(false);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);

  useEffect(() => {
    if (context?.isDataLoaded && context.hasGpsAccess === null) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        if (permissionStatus.state === 'denied') {
          context.setHasGpsAccess(false);
          setManualTimeOpen(true);
        } else {
          context.setHasGpsAccess(true);
        }
        permissionStatus.onchange = () => {
            const hasAccess = permissionStatus.state !== 'denied';
            context.setHasGpsAccess(hasAccess);
            if(!hasAccess) setManualTimeOpen(true);
        };
      });
    } else if (context?.isDataLoaded && context.hasGpsAccess === false) {
      setManualTimeOpen(true);
    }
  }, [context]);
  
  const relevantDays = useMemo(() => {
    return context?.getRelevantSchoolDays() || [];
  }, [context]);

  if (!context) return null;
  const { userData, currentDate } = context;

  const todayString = startOfDay(currentDate).toISOString();

  return (
    <main className="container mx-auto max-w-3xl py-8 px-4">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Salut, {userData.name}!
          </h1>
          <p className="text-muted-foreground">
            Azi este {format(currentDate, "EEEE, d MMMM", { locale: ro })}.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adaugă temă
        </Button>
      </header>
      
      <div className="space-y-2">
         <Accordion type="single" collapsible defaultValue={todayString} className="w-full">
            {relevantDays.map(day => {
                const formattedDate = format(day, "EEEE, d MMMM", { locale: ro });
                return (
                    <AccordionItem value={day.toISOString()} key={day.toISOString()}>
                        <AccordionTrigger className="text-xl font-headline font-semibold capitalize">
                            {formattedDate}
                        </AccordionTrigger>
                        <AccordionContent>
                           <HomeworkList displayDate={day} />
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
      </div>
      
      <ManualTimeDialog open={isManualTimeOpen} onOpenChange={setManualTimeOpen} />
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setAddTaskOpen} />
    </main>
  );
}
