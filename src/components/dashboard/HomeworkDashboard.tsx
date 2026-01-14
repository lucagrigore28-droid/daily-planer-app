
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
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';

export default function HomeworkDashboard() {
  const context = useContext(AppContext);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayedDay, setDisplayedDay] = useState<Date | null>(null);

  const { userData, currentDate, setCurrentDate, tasks, getNextSchoolDayWithTasks, areTasksSynced, isDataLoaded } = context!;

   useEffect(() => {
    // This effect runs to set the initial day when data is loaded
    if (areTasksSynced && isDataLoaded) {
      const nextDay = getNextSchoolDayWithTasks();
      setDisplayedDay(nextDay ? startOfDay(nextDay) : startOfDay(new Date()));
    }
  }, [areTasksSynced, isDataLoaded, getNextSchoolDayWithTasks]);


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

  const dayOfWeek = getDay(currentDate); // 0=Sun, 1=Mon, ..., 6=Sat
  const isWeekendVisible = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;

  const tabs = useMemo(() => {
    const baseTabs = [
      { value: "next-tasks", label: "Teme următoare" },
    ];
    if (isWeekendVisible) {
      baseTabs.push({ value: "weekend", label: "Weekend" });
    }
    baseTabs.push({ value: "calendar", label: "Calendar" });
    return baseTabs;
  }, [isWeekendVisible]);


  const tasksForDisplayedDay = useMemo(() => {
    if (!displayedDay) return [];
    return tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === displayedDay.getTime());
  }, [tasks, displayedDay]);

  const completedTasksCount = tasksForDisplayedDay.filter(t => t.isCompleted).length;
  const totalTasksCount = tasksForDisplayedDay.length;
  const progressPercentage = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

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
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="flex items-center gap-3 text-2xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    <CalendarIcon className="h-6 w-6 text-primary"/>
                                    Teme pentru {format(displayedDay, "EEEE, d MMMM", { locale: ro })}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={handlePrevDay}
                                      disabled
                                    >
                                        <ChevronLeft className="h-6 w-6 opacity-0" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handleNextDay} disabled>
                                        <ChevronRight className="h-6 w-6 opacity-0" />
                                    </Button>
                                </div>
                            </div>
                             {totalTasksCount > 0 && (
                                <div className="mt-2 mb-4">
                                    <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                        <span className="text-muted-foreground">Progres zilnic</span>
                                        <span className="text-primary">{completedTasksCount} / {totalTasksCount} teme</span>
                                    </div>
                                    <Progress value={progressPercentage} className="h-2" />
                                </div>
                            )}
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
