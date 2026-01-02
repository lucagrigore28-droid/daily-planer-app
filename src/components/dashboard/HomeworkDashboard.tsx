"use client";

import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { format, getDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import HomeworkList from './HomeworkList';
import ManualTimeDialog from './ManualTimeDialog';
import AddTaskDialog from './AddTaskDialog';
import { CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpandableCalendarView from './ExpandableCalendarView';
import WeekendView from './WeekendView';

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

  const dayOfWeek = getDay(currentDate);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const tabs = [{ value: "next-tasks", label: "Teme următoare" }];
  if (isWeekend) {
    tabs.push({ value: "weekend", label: "Weekend" });
  }
  tabs.push({ value: "calendar", label: "Calendar" });


  return (
    <main className="container mx-auto max-w-6xl py-8 px-4 fade-in-up">
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
      
      <Tabs defaultValue="next-tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-6">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="next-tasks">
            <div className="w-full max-w-3xl mx-auto">
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
            </div>
        </TabsContent>

        {isWeekend && (
          <TabsContent value="weekend">
            <WeekendView />
          </TabsContent>
        )}

        <TabsContent value="calendar">
            <ExpandableCalendarView />
        </TabsContent>
      </Tabs>
      
      <ManualTimeDialog open={isManualTimeOpen} onOpenChange={setManualTimeOpen} />
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setAddTaskOpen} />
    </main>
  );
}
