"use client";

import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { format, getDay, addDays, subDays, isSameDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import HomeworkList from './HomeworkList';
import ManualTimeDialog from './ManualTimeDialog';
import AddTaskDialog from './AddTaskDialog';
import { CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpandableCalendarView from './ExpandableCalendarView';
import WeekendView from './WeekendView';
import { cn } from '@/lib/utils';
import SettingsDialog from './SettingsDialog';

export default function HomeworkDashboard() {
  const context = useContext(AppContext);
  const [isManualTimeOpen, setManualTimeOpen] = useState(false);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayedDay, setDisplayedDay] = useState<Date | null>(null);

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

  useEffect(() => {
    if (nextDayWithTasks) {
      setDisplayedDay(nextDayWithTasks);
    }
  }, [nextDayWithTasks]);

  const handlePrevDay = () => {
    if (displayedDay) {
      setDisplayedDay(subDays(displayedDay, 1));
    }
  };

  const handleNextDay = () => {
    if (displayedDay) {
      setDisplayedDay(addDays(displayedDay, 1));
    }
  };

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
        <div className="flex items-center gap-4 rounded-lg border bg-card/90 p-4 backdrop-blur-sm">
           <div>
            <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Salut, {userData.name}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Azi este {format(currentDate, "EEEE, d MMMM", { locale: ro })}.
            </p>
          </div>
           <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-6 w-6" />
              <span className="sr-only">Setări</span>
            </Button>
        </div>
        <Button onClick={() => setAddTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adaugă temă
        </Button>
      </header>
      
      <Tabs defaultValue="next-tasks" className="w-full">
        <TabsList className="flex w-full max-w-lg mx-auto mb-6">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1">{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="next-tasks">
            <div className="w-full max-w-3xl mx-auto">
                {displayedDay ? (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="flex items-center gap-3 text-2xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    <CalendarIcon className="h-6 w-6 text-primary"/>
                                    Teme pentru {format(displayedDay, "EEEE, d MMMM", { locale: ro })}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={handlePrevDay}
                                      disabled={isSameDay(displayedDay, new Date())}
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handleNextDay}>
                                        <ChevronRight className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>
                            <HomeworkList displayDate={displayedDay} />
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
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </main>
  );
}
