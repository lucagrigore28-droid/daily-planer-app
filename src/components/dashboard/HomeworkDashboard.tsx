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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HomeworkCalendarView from './HomeworkCalendarView';
import { List, CalendarDays, CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

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
  
  const nextDayWithTasks = React.useMemo(() => {
    return context?.getNextSchoolDayWithTasks();
  }, [context]);

  if (!context) return null;
  const { userData, currentDate } = context;

  return (
    <main className="container mx-auto max-w-3xl py-8 px-4 fade-in-up">
      <header className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="rounded-lg bg-card/80 p-4 backdrop-blur-sm">
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
            {nextDayWithTasks ? (
                <Card>
                    <CardContent className="p-4">
                        <h2 className="flex items-center gap-3 text-2xl font-semibold font-headline mb-4 text-primary">
                            <CalendarIcon className="h-6 w-6"/>
                            Teme pentru {format(nextDayWithTasks, "EEEE, d MMMM", { locale: ro })}
                        </h2>
                        <HomeworkList displayDate={nextDayWithTasks} />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-6 text-center">
                        <h3 className="text-xl font-semibold">Nicio temă viitoare</h3>
                        <p className="text-muted-foreground">Nu ai nicio temă programată în curând. Bucură-te de timpul liber!</p>
                    </CardContent>
                </Card>
            )}
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
