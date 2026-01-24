
"use client";

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { format, getDay, addDays, subDays, isSameDay, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import HomeworkList from './HomeworkList';
import AddTaskDialog from './AddTaskDialog';
import { CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpandableCalendarView from './ExpandableCalendarView';
import WeekendView from './WeekendView';
import SettingsDialog from './SettingsDialog';
import { cn } from '@/lib/utils';

export default function HomeworkDashboard() {
  const context = useContext(AppContext);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayedDay, setDisplayedDay] = useState<Date | null>(null);

  const { userData, currentDate, tasks, getNextDayWithTasks, areTasksSynced, isDataLoaded } = context!;

   useEffect(() => {
    // This effect runs ONCE to set the initial day when data is loaded
    if (areTasksSynced && isDataLoaded && !displayedDay) {
      const nextDay = getNextDayWithTasks();
      setDisplayedDay(nextDay ? startOfDay(nextDay) : startOfDay(new Date()));
    }
  }, [areTasksSynced, isDataLoaded, displayedDay, getNextDayWithTasks]);


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

  if (!context || !context.userData) return null;

  const dayOfWeekRaw = getDay(currentDate); // Sun=0, Mon=1, ..., Sat=6
  const dayOfWeek = dayOfWeekRaw === 0 ? 7 : dayOfWeekRaw; // Mon=1, ..., Sun=7
  const weekendStartDay = userData?.weekendTabStartDay ?? 5; // Default Friday (5)
  const isWeekendVisible = dayOfWeek >= weekendStartDay;

  const tabs = useMemo(() => {
    const baseTabs = [
      { value: "next-tasks", label: "Teme" },
    ];
    if (isWeekendVisible) {
      baseTabs.push({ value: "weekend", label: "Weekend" });
    }
    baseTabs.push({ value: "calendar", label: "Calendar" });
    return baseTabs;
  }, [isWeekendVisible]);

  return (
    <main className="container mx-auto max-w-6xl py-8 px-4 fade-in-up">
      <header className="mb-6 flex justify-between items-start gap-4">
        <div className="flex items-center gap-4 rounded-lg border bg-card/90 p-4 backdrop-blur-sm">
           <div>
            <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-shadow-elegant">
              Salut, {userData.name}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Azi este {format(currentDate, "EEEE, d MMMM", { locale: ro })}.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-6 w-6" />
                <span className="sr-only">Setări</span>
            </Button>
            <Button onClick={() => setAddTaskOpen(true)} size="icon" variant="default" className="w-12 h-12">
                <Plus className="h-6 w-6" />
                <span className="sr-only">Adaugă temă</span>
            </Button>
        </div>
      </header>
      
      <Tabs defaultValue="next-tasks" className="w-full">
        <TabsList className={cn("grid w-full max-w-lg mx-auto mb-6", `grid-cols-${tabs.length}`)}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
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
                                    <span>{format(displayedDay, "EEEE, d MMMM", { locale: ro })}</span>
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={handlePrevDay}
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

        
          {isWeekendVisible && (
            <TabsContent value="weekend">
              <WeekendView />
            </TabsContent>
          )}
        

        <TabsContent value="calendar">
            <ExpandableCalendarView />
        </TabsContent>
      </Tabs>
      
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setAddTaskOpen} />
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </main>
  );
}
