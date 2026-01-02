"use client";

import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import HomeworkList from './HomeworkList';
import ManualTimeDialog from './ManualTimeDialog';
import AddTaskDialog from './AddTaskDialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HomeworkCalendarView from './HomeworkCalendarView';
import { List, CalendarDays } from 'lucide-react';

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
  
  const relevantDays = React.useMemo(() => {
    return context?.getRelevantSchoolDays() || [];
  }, [context]);

  if (!context) return null;
  const { userData, currentDate } = context;

  const todayString = currentDate.toISOString().split('T')[0];

  return (
    <main className="container mx-auto max-w-3xl py-8 px-4 fade-in-up">
      <header className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline text-foreground">
            Salut, {userData.name}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Azi este {format(currentDate, "EEEE, d MMMM", { locale: ro })}.
          </p>
        </div>
        <Button onClick={() => setAddTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adaugă temă
        </Button>
      </header>
      
      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-end mb-4">
            <TabsList>
                <TabsTrigger value="list"><List className="mr-2 h-4 w-4"/>Listă</TabsTrigger>
                <TabsTrigger value="calendar"><CalendarDays className="mr-2 h-4 w-4"/>Calendar</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="list">
          <div className="space-y-2">
            <Accordion type="single" collapsible defaultValue={`${todayString}-item`} className="w-full">
                {relevantDays.map(day => {
                    const formattedDate = format(day, "EEEE, d MMMM", { locale: ro });
                    const dayISO = day.toISOString().split('T')[0];
                    return (
                        <AccordionItem value={`${dayISO}-item`} key={dayISO}>
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
        </TabsContent>
        <TabsContent value="calendar">
          <HomeworkCalendarView />
        </TabsContent>
      </Tabs>
      
      <ManualTimeDialog open={isManualTimeOpen} onOpenChange={setManualTimeOpen} />
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setAddTaskOpen} />
    </main>
  );
}
