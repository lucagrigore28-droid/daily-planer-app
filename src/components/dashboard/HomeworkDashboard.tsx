
"use client";

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { format, getDay, addDays, subDays, isSameDay, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import HomeworkList from './HomeworkList';
import AddTaskDialog from './AddTaskDialog';
import { CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpandableCalendarView from './ExpandableCalendarView';
import WeekendView from './WeekendView';
import { Progress } from '../ui/progress';

export default function HomeworkDashboard() {
  const context = useContext(AppContext);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [displayedDay, setDisplayedDay] = useState<Date | null>(null);

  const nextDayWithTasks = useMemo(() => {
    return context?.getNextSchoolDayWithTasks();
  }, [context?.tasks, context?.currentDate, context?.userData?.schedule]);

  useEffect(() => {
    if (!displayedDay && nextDayWithTasks) {
      setDisplayedDay(startOfDay(nextDayWithTasks));
    }
  }, [nextDayWithTasks, displayedDay]);

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

  if (!context || !context.userData) return null; // Wait for user data
  const { userData, currentDate, tasks } = context;

  const dayOfWeek = getDay(currentDate);
  const showWeekendTab = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;

  const tabs = [{ value: "next-tasks", label: "Teme următoare" }];
  if (showWeekendTab) {
    tabs.push({ value: "weekend", label: "Weekend" });
  }
  tabs.push({ value: "calendar", label: "Calendar" });

  const tasksForDisplayedDay = useMemo(() => {
    if (!displayedDay) return [];
    return tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === displayedDay.getTime());
  }, [tasks, displayedDay]);

  const completedTasksCount = tasksForDisplayedDay.filter(t => t.isCompleted).length;
  const totalTasksCount = tasksForDisplayedDay.length;
  const progressPercentage = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

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
        </div>
        <Button onClick={() => setAddTaskOpen(true)} size="default" className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> <span className="sm:inline">Adaugă temă</span>
        </Button>
      </header>
      
      <Tabs defaultValue="next-tasks" className="w-full">
        <TabsList className="flex flex-col sm:flex-row h-auto sm:h-10 w-full max-w-lg mx-auto mb-6">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 w-full sm:w-auto">{tab.label}</TabsTrigger>
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
                                      disabled={isSameDay(displayedDay, new Date())}
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handleNextDay}>
                                        <ChevronRight className="h-6 w-6" />
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

        {showWeekendTab && (
          <TabsContent value="weekend">
            <WeekendView />
          </TabsContent>
        )}

        <TabsContent value="calendar">
            <ExpandableCalendarView />
        </TabsContent>
      </Tabs>
      
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setAddTaskOpen} />
    </main>
  );
}
